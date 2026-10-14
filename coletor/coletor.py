"""Coleta os dados do dia de Trindade na INLOG e gera docs/dados.enc.json (criptografado).

Variáveis de ambiente (cadastradas em Settings > Secrets and variables > Actions):
  INLOG_USUARIO, INLOG_SENHA  -> login da INLOG
  SENHA_SITE                  -> senha que as pessoas digitam para abrir o site
"""
import base64, datetime as dt, json, math, os, re, sys
from zoneinfo import ZoneInfo

import requests
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

BASE = "https://quebec.inlog.com.br"
LOGIN = BASE + "/Rastreamento/Apresentacao/Autenticador/Account/Login?ReturnUrl=%2FRastreamento%2FApresentacao%2FAutenticador%2F"
GRID = BASE + "/Rastreamento/Apresentacao/Setores/Setores/CarregarGridPorData?data={d}"
ROTA = BASE + "/Rastreamento/Apresentacao/Setores/Setores/CarregarRotaCompleta?codigoSetor={c}&dt={d}"
PLANO = BASE + "/Rastreamento/Apresentacao/Setores/Setores/CarregarRotasPlanejadas?codigoSetor={c}&data={d}"
DETALHE = BASE + "/Rastreamento/Apresentacao/Setores/Setores/CarregarDetalhesPlanejamentoSetor?codigoSetor={c}&dt={d}&deslocamento=false"
DIAS = {0: ("SEG",), 1: ("TER",), 2: ("QUA",), 3: ("QUI",), 4: ("SEX",), 5: ("SAB", "SÁB"), 6: ("DOM",)}
FILTRO = "TRINDADE"
PARADA_MIN = 300   # segundos: paradas menores são as paradas normais de coleta
TZ = ZoneInfo("America/Sao_Paulo")
AQUI = os.path.dirname(os.path.abspath(__file__))
SAIDA = os.path.join(AQUI, "..", "docs", "dados.enc.json")
HIST = os.path.join(AQUI, "..", "docs", "hist")
RAW_HIST = "https://raw.githubusercontent.com/{repo}/dados/hist/index.json"
DIAS_HIST = 31          # quantos dias ficam guardados para consulta
NOVOS_POR_VEZ = 3       # dias antigos montados por execução (para não atrasar a coleta)
RAIO_GARAGEM = 300      # metros


def falha(msg):
    print("ERRO:", msg)
    sys.exit(1)


# ---------------------------------------------------------------- INLOG
def entrar():
    u, p = os.environ.get("INLOG_USUARIO"), os.environ.get("INLOG_SENHA")
    if not u or not p:
        falha("cadastre os secrets INLOG_USUARIO e INLOG_SENHA")
    s = requests.Session()
    s.headers["User-Agent"] = "Mozilla/5.0 (coletor-trindade)"
    r = s.get(LOGIN, timeout=60)
    m = re.search(r'name="__RequestVerificationToken"[^>]*value="([^"]+)"', r.text)
    if not m:
        falha("não achei o formulário de login da INLOG (status %s)" % r.status_code)
    dados = {"__RequestVerificationToken": m.group(1), "UserName": u, "Password": p,
             "UsuarioAutenticador": "", "UrlAutenticador": "", "EsqueceuSenha": "False", "entrar": "Entrar"}
    r = s.post(LOGIN, data=dados, timeout=60, allow_redirects=True)
    if "name=\"Password\"" in r.text and "Account/Login" in r.url:
        falha("login recusado pela INLOG (confira usuário e senha)")
    return s


def pegar_json(s, url):
    r = s.get(url, timeout=90, headers={"X-Requested-With": "XMLHttpRequest", "Accept": "application/json"})
    try:
        return r.json()
    except ValueError:
        falha("resposta inesperada da INLOG em %s (status %s): %s" % (url.split("?")[0], r.status_code, r.text[:150].replace("\n", " ")))


# ---------------------------------------------------------------- geometria
C = math.cos(math.radians(16.68))


def dist_m(a, b):
    return math.hypot((a[0] - b[0]) * 110574, (a[1] - b[1]) * 111320 * C)


def dec(txt):
    v = [int(x, 36) for x in txt.split(",")] if txt else []
    out, la, lo = [], 0, 0
    for i in range(0, len(v), 2):
        la += v[i]; lo += v[i + 1]; out.append((la / 1e5, lo / 1e5))
    return out


def dentro(pt, anel):
    y, x = pt; ok = False
    for i in range(len(anel)):
        y1, x1 = anel[i]; y2, x2 = anel[i - 1]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            ok = not ok
    return ok


def rota_inlog(s, cod, dia, ativo, dia_semana=None):
    """Rota programada na INLOG, em trechos, marcada com os 'pacmans' que a própria INLOG já deu como cumpridos."""
    rotas = pegar_json(s, PLANO.format(c=cod, d=dia)) or []
    if len(rotas) > 1:   # setor com rota por dia da semana (ex.: "Rota- Quarta", "Rota- SEG/SEX")
        wd = dt.date.fromisoformat(dia_semana or dia).weekday()
        nome = lambda r: (r.get("Descricao") or "").upper().replace("QUARTA", "QUA").replace("TERÇA", "TER").replace("TERCA", "TER").replace("QUINTA", "QUI").replace("SEGUNDA", "SEG").replace("SEXTA", "SEX").replace("SÁBADO", "SAB").replace("SABADO", "SAB")
        hoje = [r for r in rotas if any(k in nome(r) for k in DIAS[wd])]
        rotas = hoje or rotas
    feito = {}
    if ativo:
        for p in (pegar_json(s, DETALHE.format(c=cod, d=dia)) or {}).get("Pacmans") or []:
            k = p.get("CodigoTrecho")   # trecho só conta como feito se todos os pacmans dele foram cumpridos
            feito[k] = feito.get(k, True) and p.get("Cumprido") == "T"
    linhas, tot, ok = [], 0, 0
    for r in rotas:
        com_pac = {p.get("CodigoTrecho") for p in r.get("Pacmans") or []}
        trechos = sorted(r.get("SetorRotaTrecho") or [], key=lambda x: x.get("Sequencia") or 0)
        st, ult = [], None
        for tr_ in trechos:   # trecho sem pacman herda o status do trecho anterior
            k = tr_.get("Codigo")
            if k in com_pac:
                ult = 1 if feito.get(k) else 0
            st.append(ult)
        prim = next((x for x in st if x is not None), 0)
        st = [prim if x is None else x for x in st]
        tot += len(com_pac); ok += sum(1 for k in com_pac if feito.get(k))
        atual, pts = None, []
        for tr_, v in zip(trechos, st):
            P = [[round(q["Latitude"] / 1e6, 5), round(q["Longitude"] / 1e6, 5)] for q in sorted(tr_.get("SetorRotaTrechoPonto") or [], key=lambda q: q.get("Sequencia") or 0)]
            P = [q for i, q in enumerate(P) if i == 0 or q != P[i - 1]]
            if not P:
                continue
            if v != atual and pts:
                linhas.append([atual, pts]); pts = [pts[-1]]
            atual = v; pts += P
        if pts:
            linhas.append([atual, pts])
    return linhas, (round(100 * ok / tot, 1) if tot else None), [r.get("Descricao") for r in rotas]


# ---------------------------------------------------------------- última coleta por rua
RAW_DADOS = "https://raw.githubusercontent.com/{repo}/dados/dados.enc.json"
EPOCA = dt.datetime(2026, 1, 1)
CELULA = 0.0003          # ~33 m
RAIO_RUA = 25            # metros entre o GPS e a rua
VEL_MAX = 25             # km/h: acima disso o caminhão está só passando


def minutos(t):
    return int((t - EPOCA).total_seconds() // 60)


def indice_ruas():
    arq = os.path.join(AQUI, "..", "docs", "consulta_dados.json")
    ruas = json.load(open(arq))["streets"]
    cel = {}
    for idx, r in enumerate(ruas):
        for parte in (r[3] or "").split(";"):
            pts = dec(parte) if parte else []
            for a, b in zip(pts, pts[1:] or pts):
                n = max(1, int(dist_m(a, b) // 15))
                for k in range(n + 1):
                    p = (a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n)
                    cel.setdefault((round(p[0] / CELULA), round(p[1] / CELULA)), []).append((p[0], p[1], idx))
    return len(ruas), cel


def marcar(ult, cel, pontos):
    for t, la, lo, v in pontos:
        if v > VEL_MAX:
            continue
        m = minutos(t); c0 = (round(la / CELULA), round(lo / CELULA))
        for di in (-1, 0, 1):
            for dj in (-1, 0, 1):
                for pla, plo, idx in cel.get((c0[0] + di, c0[1] + dj), ()):
                    if m > ult[idx] and dist_m((la, lo), (pla, plo)) <= RAIO_RUA:
                        ult[idx] = m


def estado_anterior():
    try:
        repo = os.environ.get("GITHUB_REPOSITORY", "torrelimpagyn/trindade-coleta")
        e = requests.get(RAW_DADOS.format(repo=repo) + "?t=%d" % dt.datetime.now().timestamp(), timeout=30).json()
        b = lambda v: base64.b64decode(v)
        chave = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=b(e["sal"]), iterations=200000).derive(os.environ["SENHA_SITE"].encode())
        return json.loads(AESGCM(chave).decrypt(b(e["iv"]), b(e["dados"]), None)).get("ruas")
    except Exception as ex:
        print("sem histórico anterior das ruas:", ex)
        return None


def gps_do_dia(s, dia):
    pts = []
    g = pegar_json(s, GRID.format(d=dia))
    cods = {y["CodigoSetor"] for y in g["Data"]["Data"] if FILTRO in (y.get("MacroSetor") or "") and y.get("Controle") and y.get("CodigoSetor")}
    for cod in cods:
        for c in pegar_json(s, ROTA.format(c=cod, d=dia)) or []:
            for h in c.get("RastreamentoHistorico") or []:
                pts.append((dt.datetime.fromisoformat(h["DataHoraCompleta"][:19]), h["Posicao"]["Latitude"], h["Posicao"]["Longitude"], h.get("Velocidade") or 0))
    return pts


def historico_ruas(s, dia, gps_hoje):
    n, cel = indice_ruas()
    ant = estado_anterior()
    if isinstance(ant, list) and len(ant) == n:
        ult = ant
    else:   # primeira vez: busca os últimos 7 dias na INLOG
        ult = [0] * n
        for k in range(7, 0, -1):
            d = (dt.date.fromisoformat(dia) - dt.timedelta(days=k)).isoformat()
            try:
                marcar(ult, cel, gps_do_dia(s, d)); print("histórico das ruas: dia", d, "ok")
            except Exception as ex:
                print("histórico das ruas: dia", d, "falhou:", ex)
    marcar(ult, cel, gps_hoje)
    print("ruas com coleta registrada:", sum(1 for v in ult if v), "de", n)
    return ult


def seg(txt):
    if not txt:
        return 0
    h, m, s = (int(x) for x in txt.split(":"))
    return h * 3600 + m * 60 + s


# ---------------------------------------------------------------- garagem
def garagem(trilha, gar):
    """Saída e retorno à garagem a partir do GPS do veículo (lista de (hora, (lat, lon)))."""
    trilha = sorted(trilha)
    if not trilha:
        return None, None, None
    dentro_g = [dist_m(p, gar) <= RAIO_GARAGEM for _, p in trilha]
    saida = volta = None
    for i in range(1, len(trilha)):
        if dentro_g[i - 1] and not dentro_g[i]:
            saida = trilha[i][0]; break
    if dentro_g[-1] and not all(dentro_g):
        i = len(trilha) - 1
        while i > 0 and dentro_g[i - 1]:
            i -= 1
        if i > 0:
            volta = trilha[i][0]
    return saida, volta, trilha[0][0]


# ---------------------------------------------------------------- principal
def montar(s, dia, cad, at):
    """Monta o quadro de um dia (hoje ou um dia anterior)."""
    gar = tuple(cad["garagem"])
    grid = pegar_json(s, GRID.format(d=dia))
    linhas = [x for x in grid["Data"]["Data"] if FILTRO in (x.get("MacroSetor") or "")]
    # A INLOG repete o mesmo setor em várias linhas (uma por viagem/veículo, ou uma "ATIVO" e outra "AGUARDANDO").
    # Fica uma linha por setor: a que tem coleta ativa; senão a executada; senão a aguardando.
    prio = {"ATIVO": 0, "EXECUTADO": 1, "AGUARDANDO": 2}
    melhor, veics = {}, {}
    for x in linhas:
        cod = (x.get("Setor") or "").split(" - ")[0].strip()
        if x.get("Veiculo"):
            veics.setdefault(cod, [])
            if x["Veiculo"] not in veics[cod]:
                veics[cod].append(x["Veiculo"])
        chave = (prio.get((x.get("Situacao") or "").strip(), 3), 0 if x.get("Controle") else 1, -(x.get("PorcentagemRound") or 0), -len(x.get("Setor") or ""))
        if cod not in melhor or chave < melhor[cod][0]:
            melhor[cod] = (chave, x)
    linhas = [v[1] for v in melhor.values()]
    # A INLOG às vezes "pendura" a coleta de hoje num registro aberto do dia anterior
    # (ex.: setor iniciado às 04h30 e contado na agenda de ontem). Nesses casos uso o registro de ontem.
    ontem = (dt.date.fromisoformat(dia) - dt.timedelta(days=1)).isoformat()
    ddmm = dia[8:10] + "/" + dia[5:7]
    emprestado = {}
    try:
        for y in pegar_json(s, GRID.format(d=ontem))["Data"]["Data"]:
            if FILTRO in (y.get("MacroSetor") or "") and (y.get("DisplayDataInicioAtividade") or "").startswith(ddmm):
                emprestado[(y.get("Setor") or "").split(" - ")[0]] = y
    except SystemExit:
        pass
    setores, gps_dia = [], []
    for x in linhas:
        cod = (x.get("Setor") or "").split(" - ")[0].strip()
        dia_x = dia
        if (x.get("Situacao") or "").strip() == "AGUARDANDO" and not x.get("PorcentagemRound") and cod in emprestado:
            x = dict(emprestado[cod], Turno=x.get("Turno")); dia_x = ontem
        info = cad["setores"].get(cod, {})
        o = {"s": cod, "turno": x.get("Turno"), "sit": (x.get("Situacao") or "").strip(), "pct": x.get("PorcentagemRound") or 0,
             "ult": x.get("DisplayUltimoPeriodico"), "pos": [x["Latitude"] / 1e6, x["Longitude"] / 1e6] if x.get("Latitude") else None,
             "veic": list(veics.get(cod) or ([x["Veiculo"]] if x.get("Veiculo") else [])), "entrada": None, "dist": 0, "vel": None, "stop": 0, "par": [], "lin": [],
             "ring": [[[round(a, 5), round(b, 5)] for a, b in dec(r)] for r in info.get("aneis", [])]}
        pontos, t0, t1, trilhas = [], None, None, {}
        if x.get("Controle") and x.get("CodigoSetor"):
            for c in pegar_json(s, ROTA.format(c=x["CodigoSetor"], d=dia_x)) or []:
                v = (c.get("Veiculo") or {}).get("Identificador")
                if v and v not in o["veic"]:
                    o["veic"].append(v)
                col = c.get("SetoresColeta") or []
                ent = col[0].get("DataHoraInicio") if col else None
                if ent and (o.get("_ent") is None or ent < o["_ent"]):
                    o["_ent"], o["entrada"] = ent, ent[11:16]
                H = c.get("RastreamentoHistorico") or []
                tr = trilhas.setdefault(v or "?", [])
                for h in H:
                    o["dist"] += (h.get("Distancia") or 0) / 1000
                    t = dt.datetime.fromisoformat(h["DataHoraCompleta"][:19])
                    t0 = t if t0 is None or t < t0 else t0
                    t1 = t if t1 is None or t > t1 else t1
                    pos = (h["Posicao"]["Latitude"], h["Posicao"]["Longitude"])
                    pontos.append(pos)
                    tr.append((t, pos))
                    gps_dia.append((t, pos[0], pos[1], h.get("Velocidade") or 0))
                for p in c.get("PontosParada") or []:   # só paradas longas (>= 5 min) dentro do setor
                    d = seg(p.get("TempoParado"))
                    if d < PARADA_MIN or not p.get("Latitude"):
                        continue
                    pt = (p["Latitude"] / 1e6, p["Longitude"] / 1e6)
                    if o["ring"] and not any(dentro(pt, r) for r in o["ring"]):
                        continue
                    o["par"].append([(p.get("DataHoraInicio") or "")[11:16], (p.get("DataHoraFim") or "")[11:16], d, round(pt[0], 5), round(pt[1], 5)])
                    o["stop"] += d
        sai = []
        for v, tr in trilhas.items():
            a, b, c0 = garagem(tr, gar)
            if a or c0:
                sai.append((a, b, c0, v))
            if c0:
                print("   ", cod, v, "1º ponto %s a %d m da garagem" % (c0.strftime("%H:%M"), dist_m(sorted(tr)[0][1], gar)),
                      "· saída", a and a.strftime("%H:%M"), "· retorno", b and b.strftime("%H:%M"))
        com = sorted([x for x in sai if x[0]], key=lambda x: x[0])
        if com:
            o["saida"] = com[0][0].strftime("%H:%M")
            vs = [x[1] for x in com if x[1]]
            o["volta"] = max(vs).strftime("%H:%M") if vs else None
        elif sai:
            o["rast0"] = min(x[2] for x in sai).strftime("%H:%M")   # GPS já começou fora da garagem
        if t0 and t1 and t1 > t0:
            o["vel"] = round(o["dist"] / ((t1 - t0).total_seconds() / 3600), 1)
        o["dist"] = round(o["dist"], 1)
        if x.get("CodigoSetor"):
            try:
                o["lin"], o["pctmapa"], o["rotas"] = rota_inlog(s, x["CodigoSetor"], dia_x, bool(x.get("Controle")), dia)
            except SystemExit:
                raise
            except Exception as e:   # sem rota programada: o card continua funcionando
                print("  rota", cod, "indisponível:", e)
        o.pop("_ent", None)
        setores.append(o)
        print(cod, o["sit"], o["pct"], o["veic"], o["entrada"], o["dist"], "km", "rota:", o.get("rotas"), "mapa:", o.get("pctmapa"), "%")
    return {"dia": dia, "at": at, "garagem": cad["garagem"], "S": setores}, gps_dia


def indice_hist():
    arq = os.path.join(HIST, "index.json")
    if os.path.exists(arq):
        return json.load(open(arq))
    try:
        repo = os.environ.get("GITHUB_REPOSITORY", "torrelimpagyn/trindade-coleta")
        r = requests.get(RAW_HIST.format(repo=repo) + "?t=%d" % dt.datetime.now().timestamp(), timeout=30)
        if r.ok:
            return r.json()
    except Exception as ex:
        print("sem índice do histórico:", ex)
    return {"dias": {}}


def guardar_dia(dados, situacao, idx):
    os.makedirs(HIST, exist_ok=True)
    criptografar(json.dumps(dados, separators=(",", ":")).encode(), os.path.join(HIST, dados["dia"] + ".enc.json"))
    idx["dias"][dados["dia"]] = situacao


def main():
    agora = dt.datetime.now(TZ)
    dia = (agora - dt.timedelta(hours=4)).date().isoformat()   # até 04h ainda conta o dia anterior (turno da tarde)
    cad = json.load(open(os.path.join(AQUI, "setores_trindade.json")))
    s = entrar()
    dados, gps_dia = montar(s, dia, cad, agora.strftime("%H:%M"))
    idx = indice_hist()
    guardar_dia(dados, "parcial", idx)
    try:
        dados["ruas"] = historico_ruas(s, dia, gps_dia)
    except SystemExit:
        raise
    except Exception as e:   # a consulta de ruas nunca derruba o painel
        print("histórico das ruas indisponível:", e)
    criptografar(json.dumps(dados, separators=(",", ":")).encode())
    # dias anteriores: fecha o de ontem e completa o histórico aos poucos
    feitos = 0
    for k in range(1, DIAS_HIST + 1):
        d = (dt.date.fromisoformat(dia) - dt.timedelta(days=k)).isoformat()
        if idx["dias"].get(d) == "final" or feitos >= NOVOS_POR_VEZ or k > 7 and d not in idx["dias"]:
            continue
        try:
            print("histórico do dia", d)
            dd, _ = montar(s, d, cad, "final")
            guardar_dia(dd, "final", idx)
            feitos += 1
        except SystemExit:
            raise
        except Exception as e:
            print("dia", d, "falhou:", e)
    limite = (dt.date.fromisoformat(dia) - dt.timedelta(days=DIAS_HIST)).isoformat()
    for d in [d for d in idx["dias"] if d < limite]:
        idx["dias"].pop(d)
        try:
            os.remove(os.path.join(HIST, d + ".enc.json"))
        except OSError:
            pass
    json.dump(idx, open(os.path.join(HIST, "index.json"), "w"), sort_keys=True)


def criptografar(raw, destino=SAIDA):
    senha = os.environ.get("SENHA_SITE")
    if not senha:
        falha("cadastre o secret SENHA_SITE")
    sal, iv = os.urandom(16), os.urandom(12)
    chave = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=sal, iterations=200000).derive(senha.encode())
    ct = AESGCM(chave).encrypt(iv, raw, None)
    b = lambda v: base64.b64encode(v).decode()
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    json.dump({"v": 1, "sal": b(sal), "iv": b(iv), "dados": b(ct)}, open(destino, "w"))
    print("ok:", os.path.basename(destino), os.path.getsize(destino) // 1024, "KB")


if __name__ == "__main__":
    main()
