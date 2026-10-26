"""Consulta de endereços das cidades (setor, dias, horário em cada rua).

Para cada cidade (menos Trindade, que tem o arquivo próprio em docs/consulta_dados.json):
  * setores, dias e turno ......... grade da INLOG das últimas semanas + descrição do setor
  * mapa de cada setor ............ áreas cadastradas na INLOG (as mesmas do editor de setores)
  * horário em cada trecho ........ GPS dos caminhões dentro do setor (INLOG, últimas semanas)
  * ruas e bairros ................ OpenStreetMap (Overpass)
Grava docs/c/<cidade>/consulta_dados.json. Só lê a INLOG; não altera nada lá.

Uso: python coletor/consulta.py [cidade ...]      (sem argumento: todas)
"""
import os, sys, re, json, math, time, collections, statistics, datetime as dt
import requests
from shapely.geometry import Polygon, LineString, Point
from shapely.prepared import prep
from shapely.ops import unary_union

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import coletor as K

DIAS = int(os.environ.get("CONSULTA_DIAS", "21"))     # semanas de GPS usadas para o horário
OVERPASS = ["https://overpass-api.de/api/interpreter",
            "https://overpass.kumi.systems/api/interpreter",
            "https://maps.mail.ru/osm/tools/overpass/api/interpreter"]
DLA, DLO = 0.00045, 0.00047      # célula da grade de horários (~50 m)
TARDE = ("VESPERTINO", "TARDE", "NOTURNO")   # turnos que passam da meia-noite contam como o mesmo dia
NOMES = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"]
ABREV = ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"]
RE_DIA = re.compile(r"\b(SEG(?:UNDA)?|TER(?:CA)?|QUA(?:RTA)?|QUI(?:NTA)?|SEX(?:TA)?|SAB(?:ADO)?|DOM(?:INGO)?)\b")
FORA = {"footway", "path", "cycleway", "steps", "pedestrian", "track", "bridleway", "corridor", "construction", "proposed", "platform", "raceway", "bus_stop", "elevator"}


# ---------------------------------------------------------------- dias e turno
def dias_desc(desc):
    """Dias da semana (0 = segunda) lidos da descrição do setor; [] se não der para saber."""
    d = re.sub(r"^\s*\d+\s*-?", " ", K.norm(desc))
    if "DIARIO" in d:
        return list(range(7))
    m = re.search(r"\b(SEG|TER|QUA|QUI|SEX|SAB|DOM)\w*\s+A\s+(SEG|TER|QUA|QUI|SEX|SAB|DOM)", d)
    if m:
        a, b = ABREV.index(m.group(1)), ABREV.index(m.group(2))
        return list(range(a, b + 1))
    return sorted({ABREV.index(x[:3]) for x in RE_DIA.findall(d)})


def dias_txt(dow):
    if len(dow) == 7:
        return "Todos os dias"
    if dow == list(range(6)):
        return "Segunda a sábado"
    if dow == list(range(5)):
        return "Segunda a sexta"
    n = [NOMES[d] for d in dow]
    t = n[0] if len(n) == 1 else ", ".join(n[:-1]) + " e " + n[-1]
    return t[0].upper() + t[1:]


def freq_txt(dow):
    return "DIARIO" if len(dow) == 7 else "/".join(ABREV[d] for d in dow)


# ---------------------------------------------------------------- INLOG
def setores_da_cidade(s, hoje):
    """Setores que aparecem na grade nas últimas semanas, com as corridas (setor, dia) que tiveram caminhão."""
    sec, corridas = {}, []
    for k in range(DIAS, -1, -1):
        dia = (hoje - dt.timedelta(days=k)).isoformat()
        try:
            linhas = K.pegar_json(s, K.GRID.format(d=dia))["Data"]["Data"]
        except (SystemExit, Exception) as e:
            print("  grade", dia, "indisponível:", e)
            continue
        for x in linhas:
            if not K.da_cidade(x.get("MacroSetor")) or not x.get("CodigoSetor"):
                continue
            cod = K.codigo(x.get("Setor"))
            if "INATIVO" in K.norm(x.get("Setor")):
                continue
            e = sec.setdefault(cod, {"cs": x["CodigoSetor"], "desc": x.get("Setor") or "", "turnos": collections.Counter(), "vistos": collections.Counter()})
            e["cs"], e["desc"] = x["CodigoSetor"], x.get("Setor") or e["desc"]      # fica o cadastro mais novo
            e["turnos"][K.norm(x.get("Turno")) or "DIURNO"] += 1
            e["vistos"][dt.date.fromisoformat(dia).weekday()] += 1
            if x.get("Controle") and k > 0:
                corridas.append((cod, x["CodigoSetor"], dia))
    return sec, list(dict.fromkeys(corridas))


def trilhas(s, corridas):
    """GPS das corridas: {(cod, dia): [(datetime, lat, lon, vel), ...]} (baixado em lotes)."""
    por = collections.defaultdict(list)
    for i in range(0, len(corridas), 24):
        lote = corridas[i:i + 24]
        K.buscar_varios(s, [K.ROTA.format(c=cs, d=dia) for _, cs, dia in lote], n=6)
        for cod, cs, dia in lote:
            for c in K._RESP.get(K.ROTA.format(c=cs, d=dia)) or []:
                for h in c.get("RastreamentoHistorico") or []:
                    try:
                        p = h["Posicao"]
                        por[(cod, dia)].append((dt.datetime.fromisoformat(h["DataHoraCompleta"][:19]), p["Latitude"], p["Longitude"], h.get("Velocidade") or 0))
                    except Exception:
                        pass
        K.limpar_respostas()
        print("  GPS: %d/%d corridas" % (min(i + 24, len(corridas)), len(corridas)))
    for v in por.values():
        v.sort()
    return por


# ---------------------------------------------------------------- OpenStreetMap
def osm(bbox):
    s, w, n, e = bbox
    q = ('[out:json][timeout:240];(way["highway"]["name"](%f,%f,%f,%f);'
         'node["place"~"^(suburb|neighbourhood|quarter|hamlet|village)$"]["name"](%f,%f,%f,%f););out geom qt;') % (s, w, n, e, s, w, n, e)
    ult = None
    for tentativa in range(3):
        for url in OVERPASS:
            try:
                r = requests.post(url, data={"data": q}, timeout=300, headers={"User-Agent": "coleta-consulta/1.0"})
                if r.ok:
                    return r.json()["elements"]
                ult = "%s %s" % (url, r.status_code)
            except Exception as ex:
                ult = "%s %s" % (url, ex)
        time.sleep(30)
    raise RuntimeError("OpenStreetMap indisponível: %s" % ult)


# ---------------------------------------------------------------- montagem
def q(v, p):
    v = sorted(v); k = (len(v) - 1) * p; f = int(k)
    return v[f] + (v[min(f + 1, len(v) - 1)] - v[f]) * (k - f)


def grade_col(cells):
    """Grade [i, j, si, med, p20, p80, n] em colunas com deltas (o inverso de decodeGrid em consulta.html)."""
    col = {k: [] for k in ("si", "i", "j", "med", "d20", "d80", "n")}
    ant = None
    for i, j, si, med, p20, p80, n in sorted(cells, key=lambda e: (e[2], e[0], e[1])):
        if ant is None:
            col["si"].append(si); col["i"].append(i); col["j"].append(j)
        else:
            col["si"].append(si - ant[2]); col["i"].append(i - ant[0])
            col["j"].append(j - ant[1] if (i == ant[0] and si == ant[2]) else j)
        col["med"].append(med); col["d20"].append(med - p20); col["d80"].append(p80 - med); col["n"].append(n)
        ant = (i, j, si)
    return col


def montar_cidade(s, slug, hoje):
    K.usar_cidade(slug)
    print("=" * 20, K.CID["nome"], "=" * 20)
    sec, corridas = setores_da_cidade(s, hoje)
    linhas = [{"CodigoSetor": e["cs"]} for e in sec.values()]
    aneis = K.aneis_cidade(s, linhas, hoje.isoformat())
    POLY = {}
    for cod, e in sec.items():
        ps = [Polygon([(p[1], p[0]) for p in r]).buffer(0) for r in aneis.get(str(e["cs"])) or [] if len(r) >= 3]
        if ps:
            POLY[cod] = unary_union(ps)
    if not POLY:
        raise RuntimeError("nenhum setor com mapa")
    codes = sorted(POLY, key=lambda c: (len(c), c))
    PP = {c: prep(POLY[c]) for c in codes}
    TUDO = unary_union(list(POLY.values()))
    x0, y0, x1, y1 = TUDO.bounds
    LAT0, LON0 = math.floor((y0 - 0.02) * 100) / 100, math.floor((x0 - 0.02) * 100) / 100
    print("  setores com mapa:", len(codes), "· corridas com caminhão:", len(corridas))

    def turno(c):
        return sec[c]["turnos"].most_common(1)[0][0]

    # ---- horário em cada trecho (GPS)
    T = trilhas(s, [x for x in corridas if x[0] in POLY])
    cells, janela, nrun = collections.defaultdict(list), collections.defaultdict(list), collections.Counter()
    for (c, dia), pts in T.items():
        tarde = turno(c) in TARDE
        d0 = dt.datetime.fromisoformat(dia)
        def mins(t):
            m = (t - d0).total_seconds() / 60
            return m + 1440 if tarde and m < 720 else m
        first, dentro = {}, []
        for (t1, a1, b1, v1), (t2, a2, b2, v2) in zip(pts, pts[1:]):
            dkm = math.hypot((a2 - a1) * 110.6, (b2 - b1) * 111.3 * math.cos(math.radians(a1)))
            if dkm > 1.5 or (t2 - t1).total_seconds() > 900:
                continue
            lento = v1 <= 20 and v2 <= 20
            n = max(1, int(dkm * 1000 / 20))
            for k in range(n):
                f = k / n; la = a1 + (a2 - a1) * f; lo = b1 + (b2 - b1) * f
                if not PP[c].contains(Point(lo, la)):
                    continue
                m = mins(t1 + (t2 - t1) * f); dentro.append(m)
                key = (int((la - LAT0) / DLA), int((lo - LON0) / DLO))
                if lento and key not in first:
                    first[key] = m
        if len(dentro) < 30:
            continue
        nrun[c] += 1
        dentro.sort()
        janela[c].append((dentro[int(len(dentro) * .02)], dentro[int(len(dentro) * .98) - 1]))
        for key, m in first.items():
            cells[(key[0], key[1], c)].append(m)
    GRID = [[i, j, codes.index(c), round(q(v, .5)), round(q(v, .2)), round(q(v, .8)), len(v)]
            for (i, j, c), v in cells.items() if len(v) >= 2]
    print("  células com horário:", len(GRID))

    SECT = []
    for c in codes:
        e = sec[c]
        dow = dias_desc(e["desc"]) or sorted(d for d, n in e["vistos"].items() if n >= 2) or sorted(e["vistos"])
        j = janela[c]
        ini = statistics.median(x[0] for x in j) if j else None
        fim = statistics.median(x[1] for x in j) if j else None
        rings = [[[round(p[1], 6), round(p[0], 6)] for p in list(g.exterior.coords)[:-1]] for g in getattr(POLY[c], "geoms", [POLY[c]])]
        SECT.append({"code": c, "rings": rings, "freq": freq_txt(dow), "dias": dias_txt(dow), "dow": dow, "turno": turno(c),
                     "ini": round(ini) if ini is not None else None, "fim": round(fim) if fim is not None else None, "n": nrun[c]})
        print("   ", c, freq_txt(dow), turno(c), nrun[c], "corridas")

    # ---- ruas e bairros
    els = osm((y0 - 0.01, x0 - 0.01, y1 + 0.01, x1 + 0.01))
    PERTO = prep(TUDO.buffer(0.006))
    places = [(e["tags"]["name"], e["lat"], e["lon"]) for e in els if e["type"] == "node" and e.get("tags", {}).get("name")]
    ways = []
    for e in els:
        t = e.get("tags") or {}
        if e["type"] != "way" or t.get("highway") in FORA or not e.get("geometry"):
            continue
        pts = [(g["lon"], g["lat"]) for g in e["geometry"] if g]
        if len(pts) >= 2:
            ways.append((t["name"], LineString(pts)))
    print("  OpenStreetMap:", len(ways), "vias,", len(places), "bairros")

    def bairro(pt):
        if not places:
            return ""
        b = min(places, key=lambda x: (x[1] - pt.y) ** 2 + (x[2] - pt.x) ** 2)
        return b[0] if math.hypot((b[1] - pt.y) * 110.6, (b[2] - pt.x) * 111.3 * math.cos(math.radians(pt.y))) < 1.6 else ""

    grp = collections.OrderedDict()
    for name, ls in ways:
        if not PERTO.intersects(ls):
            continue
        g = grp.setdefault((name, bairro(ls.interpolate(0.5, normalized=True))), {"g": [], "sec": collections.Counter(), "len": 0})
        n = max(2, int(ls.length * 106600 / 25))
        for k in range(n + 1):
            pt = ls.interpolate(k / n, normalized=True)
            g["len"] += 1
            for c in codes:
                if PP[c].contains(pt):
                    g["sec"][c] += 1
                    break
        g["g"].append([(la, lo) for lo, la in ls.simplify(0.00003).coords])
    STREETS = []
    for (name, b), g in grp.items():
        STREETS.append([name, b, [[c, round(v / g["len"] * 100)] for c, v in g["sec"].most_common()], ";".join(K.enc(p) for p in g["g"])])
    STREETS.sort(key=lambda x: (K.norm(x[0]), K.norm(x[1])))
    BAIRROS = sorted({(p[0], round(p[1], 5), round(p[2], 5)) for p in places}, key=lambda x: K.norm(x[0]))
    print("  ruas:", len(STREETS), "· dentro dos setores:", sum(1 for x in STREETS if x[2]))

    # ---- última passagem do GPS em cada rua (ponto de partida para o painel)
    n, cel = K.indice_ruas(STREETS)
    ult = [0] * n
    for pts in T.values():
        K.marcar(ult, cel, pts)

    out = {"cidade": K.CID["nome"], "gerado": dt.datetime.now(K.TZ).strftime("%d/%m/%Y %H:%M"),
           "sectors": SECT, "grid": {"lat0": LAT0, "lon0": LON0, "dla": DLA, "dlo": DLO, "col": grade_col(GRID)},
           "streets": STREETS, "bairros": BAIRROS, "garagem": K.CID.get("garagem"), "aterro": K.CID.get("aterro"),
           "codes": codes, "ult0": ult}
    destino = os.path.join(K.AQUI, "..", "docs", K.CID.get("raiz", "c/%s/" % slug), "consulta_dados.json")
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    json.dump(out, open(destino, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print("  gravado %s (%.2f MB)" % (os.path.relpath(destino, os.path.join(K.AQUI, "..")), os.path.getsize(destino) / 1e6))


def main():
    hoje = (dt.datetime.now(K.TZ) - dt.timedelta(hours=4)).date()
    pedidas = [a for a in sys.argv[1:] if a in K.CIDADES] or [c for c in K.CIDADES if not K.CIDADES[c].get("cad")]
    s = K.entrar()
    erros = []
    for slug in pedidas:
        try:
            montar_cidade(s, slug, hoje)
        except (SystemExit, Exception) as e:   # uma cidade com problema não impede as outras
            print("cidade", slug, "falhou:", e)
            erros.append(slug)
        K.limpar_respostas()
    if len(erros) == len(pedidas):
        sys.exit(1)


if __name__ == "__main__":
    main()
