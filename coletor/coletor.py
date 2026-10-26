"""Coleta os dados do dia das cidades na INLOG e gera docs/dados.enc.json (Trindade) e docs/c/<cidade>/dados.enc.json (criptografados).

Variáveis de ambiente (cadastradas em Settings > Secrets and variables > Actions):
  INLOG_USUARIO, INLOG_SENHA  -> login da INLOG
  SENHA_SITE                  -> senha que as pessoas digitam para abrir o site
"""
import base64, datetime as dt, gzip, json, math, os, re, sys, time, unicodedata
from concurrent.futures import ThreadPoolExecutor
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
PASSAGENS = BASE + "/Rastreamento/Apresentacao/RastreamentoGeral/VeiculosGenerico/BuscarPassagens?latitude={la}&longitude={lo}&raio={r}&dataInicio={d}%2000:00:00&dataFim={d}%2023:59:59"
DETALHE = BASE + "/Rastreamento/Apresentacao/Setores/Setores/CarregarDetalhesPlanejamentoSetor?codigoSetor={c}&dt={d}&deslocamento=false"
DIAS = {0: ("SEG",), 1: ("TER",), 2: ("QUA",), 3: ("QUI",), 4: ("SEX",), 5: ("SAB", "SÁB"), 6: ("DOM",)}
FILTRO = "TRINDADE"
PARADA_MIN = 300   # segundos: paradas menores são as paradas normais de coleta
TZ = ZoneInfo("America/Sao_Paulo")
AQUI = os.path.dirname(os.path.abspath(__file__))
SAIDA = os.path.join(AQUI, "..", "docs", "dados.enc.json")
HIST = os.path.join(AQUI, "..", "docs", "hist")
RAW_HIST = "https://raw.githubusercontent.com/{repo}/dados/hist/index.json"
DIAS_HIST = 400         # quantos dias ficam guardados para consulta (~13 meses)
DIAS_BUSCA = 120        # até quantos dias para trás o histórico é buscado na INLOG
NOVOS_POR_VEZ = 4       # dias antigos montados por execução (para não atrasar a coleta)
RAIO_GARAGEM = 300      # metros
RAIO_ATERRO = 400       # metros em volta do ponto do aterro
ACESSO_ATERRO = [  # via de acesso ao aterro (OpenStreetMap): Av. dos Angicos + estrada a oeste das lagoas
    [[-16.64807, -49.51898], [-16.64806, -49.5196], [-16.6481, -49.52015], [-16.64819, -49.52062], [-16.64831, -49.52108], [-16.64846, -49.5217], [-16.64853, -49.52224], [-16.64857, -49.52283], [-16.64853, -49.52313], [-16.64844, -49.52357], [-16.64819, -49.52475], [-16.64815, -49.5259], [-16.64828, -49.52651], [-16.64849, -49.52698], [-16.64903, -49.52741], [-16.64925, -49.5277], [-16.64938, -49.52804], [-16.64986, -49.52977], [-16.64992, -49.53021], [-16.6499, -49.53112], [-16.64991, -49.5322], [-16.64985, -49.53282], [-16.6497, -49.53351], [-16.64968, -49.5336], [-16.64966, -49.53373], [-16.64956, -49.53432], [-16.64945, -49.53466], [-16.6484, -49.53653], [-16.64803, -49.53742], [-16.64788, -49.53799], [-16.64693, -49.5398], [-16.64675, -49.54011], [-16.64649, -49.5404], [-16.64607, -49.54087], [-16.64514, -49.54194]],
    [[-16.64968, -49.5336], [-16.64978, -49.5337], [-16.64987, -49.53378], [-16.64996, -49.53383], [-16.65003, -49.53385], [-16.65012, -49.53385], [-16.65022, -49.53384], [-16.65043, -49.53381], [-16.6506, -49.53378], [-16.65074, -49.53377], [-16.65083, -49.53378], [-16.65096, -49.5338], [-16.65123, -49.53386], [-16.65212, -49.53406], [-16.65294, -49.53422], [-16.65436, -49.53452], [-16.65472, -49.53459], [-16.65504, -49.53466], [-16.65519, -49.53469], [-16.65546, -49.53474], [-16.65577, -49.53482], [-16.65601, -49.53487], [-16.65742, -49.53517], [-16.65815, -49.53536], [-16.65833, -49.53544], [-16.65866, -49.53564], [-16.65873, -49.53566], [-16.65889, -49.53569]],
]
RAIO_ACESSO = 30        # metros entre o GPS e a via de acesso
JANELA_ACESSO = 2400    # segundos antes da entrada / depois da saída do aterro
SAIDA_ATERRO = 900      # segundos fora do raio para considerar que o caminhão saiu do aterro
VERSAO_HIST = 7         # sobe quando o histórico ganha campos novos (dias antigos são refeitos)


ORCAMENTO = 200        # segundos por execução (o laço roda a cada 5 min); o histórico antigo só usa o que sobrar
RAIO_ACESSO_GERAL = 2500   # sem via de acesso desenhada: considera o GPS até 2,5 km do aterro como acesso
CIDADES = json.load(open(os.path.join(AQUI, "cidades.json"), encoding="utf-8"))
CACHE = os.path.join(AQUI, "cache")
_RESP, _T0, CID = {}, time.time(), {}


def norm(txt):
    return unicodedata.normalize("NFKD", txt or "").encode("ascii", "ignore").decode().upper().strip()


EXCLUI = ("DESCARTE", "SERVICO", "INEXISTENTE", "ESPECIA")


def da_cidade(macro):
    m = norm(macro)
    return m.split(" - ")[0].strip() == CID["chave"] and not any(k in m for k in EXCLUI)


def codigo(setor):
    m = re.match(r"\s*(\d{3,})", setor or "")
    return m.group(1) if m else (setor or "").split(" - ")[0].strip()


def usar_cidade(slug):
    """Aponta os caminhos e parâmetros globais para a cidade."""
    global CID, FILTRO, SAIDA, HIST, RAW_HIST, RAW_DADOS
    CID = dict(CIDADES[slug], slug=slug)
    FILTRO = CID["chave"]
    raiz = CID.get("raiz", "c/%s/" % slug)
    SAIDA = os.path.join(AQUI, "..", "docs", raiz, "dados.enc.json")
    HIST = os.path.join(AQUI, "..", "docs", raiz, "hist")
    RAW_HIST = "https://raw.githubusercontent.com/{repo}/dados/" + raiz + "hist/index.json"
    RAW_DADOS = "https://raw.githubusercontent.com/{repo}/dados/" + raiz + "dados.enc.json"


def buscar_varios(s, urls, n=8):
    """Baixa várias respostas da INLOG em paralelo e guarda para pegar_json."""
    urls = [u for u in dict.fromkeys(urls) if u not in _RESP]
    def um(u):
        try:
            r = s.get(u, timeout=90, headers={"X-Requested-With": "XMLHttpRequest", "Accept": "application/json"})
            return u, r.json()
        except Exception:
            return u, None
    with ThreadPoolExecutor(n) as ex:
        for u, j in ex.map(um, urls):
            if j is not None:
                _RESP[u] = j


def limpar_respostas():
    for u in [u for u in _RESP if "CarregarGridPorData" not in u]:
        _RESP.pop(u)


def aneis_cidade(s, linhas, dia):
    """Polígonos dos setores: Trindade vem do arquivo; as outras cidades da INLOG (guardados em cache)."""
    if CID.get("cad"):
        return {}
    arq = os.path.join(CACHE, "aneis_%s.json" % CID["slug"])
    try:
        cache = json.load(open(arq))
    except Exception:
        cache = {}
    falta = {str(x["CodigoSetor"]) for x in linhas if x.get("CodigoSetor") and str(x["CodigoSetor"]) not in cache}
    if falta:
        buscar_varios(s, [DETALHE.format(c=c, d=dia) for c in falta])
        for c in falta:
            j = _RESP.get(DETALHE.format(c=c, d=dia)) or {}
            areas = (j.get("Setor") or {}).get("Areas") or []
            cache[c] = [[[round(q["Latitude"] / 1e6, 5), round(q["Longitude"] / 1e6, 5)] for q in a.get("Coordenadas") or []] for a in areas]
        os.makedirs(CACHE, exist_ok=True)
        json.dump(cache, open(arq, "w"))
    return cache


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
    if url in _RESP:
        return _RESP[url]
    r = s.get(url, timeout=90, headers={"X-Requested-With": "XMLHttpRequest", "Accept": "application/json"})
    try:
        j = r.json()
        if "CarregarGridPorData" in url:   # a grade do dia traz todas as cidades: baixa uma vez só
            _RESP[url] = j
        return j
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


def b36(n):
    d, neg, n, r = "0123456789abcdefghijklmnopqrstuvwxyz", n < 0, abs(n), ""
    while True:
        r = d[n % 36] + r; n //= 36
        if not n:
            return ("-" if neg else "") + r


def enc(pts):
    """Inverso de dec(): deltas em base 36 com 5 casas decimais."""
    out, la, lo = [], 0, 0
    for a, b in pts:
        A, B = round(a * 1e5), round(b * 1e5)
        out += [b36(A - la), b36(B - lo)]; la, lo = A, B
    return ",".join(out)


def simplificar(pts, tol=6):
    """Douglas-Peucker em metros: tira pontos redundantes do rastreio sem mudar o desenho."""
    if len(pts) < 3:
        return list(pts)
    manter, pilha = {0, len(pts) - 1}, [(0, len(pts) - 1)]
    while pilha:
        i, j = pilha.pop()
        a, b = pts[i], pts[j]
        ab = dist_m(a, b)
        best, k = -1, None
        for m in range(i + 1, j):
            p = pts[m]
            if ab < 1:
                dd = dist_m(p, a)
            else:
                x1, y1 = (b[1] - a[1]) * 111320 * C, (b[0] - a[0]) * 110574
                x0, y0 = (p[1] - a[1]) * 111320 * C, (p[0] - a[0]) * 110574
                dd = abs(x1 * y0 - y1 * x0) / ab
            if dd > best:
                best, k = dd, m
        if best > tol:
            manter.add(k); pilha += [(i, k), (k, j)]
    return [pts[i] for i in sorted(manter)]


def cobertura(lin, trv, raio=25, vel_max=25):
    """Percentual da rota programada (lin) por onde o GPS passou devagar (coletando), a até `raio` metros.
    trv = {veículo: [(hora, (lat, lon), velocidade)]}."""
    xy = lambda p: (p[1] * 111320 * C, p[0] * 110574)
    segs, grade = [], {}
    for pts in trv.values():
        u = sorted({t: (p, vel) for t, p, vel in pts}.items())
        for (t1, (a, va)), (t2, (b, vb)) in zip(u, u[1:]):
            if (t2 - t1).total_seconds() > 180 or min(va, vb) > vel_max:
                continue   # buraco no GPS ou trecho rodado rápido (só passando)
            A, B = xy(a), xy(b)
            k = len(segs); segs.append((A, B))
            n = max(1, int(math.hypot(B[0] - A[0], B[1] - A[1]) // 25))
            for j in range(n + 1):
                q = (A[0] + (B[0] - A[0]) * j / n, A[1] + (B[1] - A[1]) * j / n)
                grade.setdefault((int(q[0] // 50), int(q[1] // 50)), set()).add(k)

    def perto(p):
        cx, cy = int(p[0] // 50), int(p[1] // 50)
        for di in (-1, 0, 1):
            for dj in (-1, 0, 1):
                for k in grade.get((cx + di, cy + dj), ()):
                    (ax, ay), (bx, by) = segs[k]
                    dx, dy = bx - ax, by - ay
                    L = dx * dx + dy * dy
                    t = max(0, min(1, ((p[0] - ax) * dx + (p[1] - ay) * dy) / L)) if L else 0
                    if math.hypot(p[0] - ax - t * dx, p[1] - ay - t * dy) <= raio:
                        return True
        return False
    tot = ok = 0
    for _, pts in lin:
        P = [xy(q) for q in pts]
        for a, b in zip(P, P[1:]):
            L = math.hypot(b[0] - a[0], b[1] - a[1]); n = max(1, int(math.ceil(L / 10)))
            for j in range(n):
                q = (a[0] + (b[0] - a[0]) * (j + .5) / n, a[1] + (b[1] - a[1]) * (j + .5) / n)
                tot += L / n
                if perto(q):
                    ok += L / n
    return round(100 * ok / tot, 1) if tot else None


def url_passagens(o, dia):
    pts_area = [tuple(q) for _, l in o["lin"] for q in l]
    if not pts_area:
        return None
    c = (sum(p[0] for p in pts_area) / len(pts_area), sum(p[1] for p in pts_area) / len(pts_area))
    raio = min(4000, int(max(dist_m(c, p) for p in pts_area)) + 100)
    return PASSAGENS.format(la=round(c[0], 6), lo=round(c[1], 6), r=raio, d=dia)


INICIO_TURNO = {"MATUTINO": 7, "MANHA": 7, "DIURNO": 8, "INTEGRAL": 8, "VESPERTINO": 14, "TARDE": 14, "NOTURNO": 20}
CAMPOS_GPS = ("sit", "fonte", "veic", "pgps", "entrada", "ini", "gps", "dist", "vel", "fim_gps", "pos", "ult")
GPSX = {}


def gps_sem_controle(s, dia, o, ocupado=None, min_cob=20, min_pts=120):
    """Setor sem controle na INLOG (aparece como AGUARDANDO 0%): procura no GPS os veículos que coletaram nele
    (passagens perto do setor, devagar, dentro do polígono). Se achar, o setor vira "realizado pelo GPS"."""
    u = url_passagens(o, dia)   # centro e raio pela rota (o polígono pode ter partes longe)
    if not u:
        return
    resp = pegar_json(s, u) or []
    por_v = {}
    for blk in resp:
        for h in blk.get("Historico") or []:
            v = h.get("Identificador") or blk.get("IdentificadorVeiculo") or "?"
            t = dt.datetime.fromisoformat(h["DataHora"][:19])
            if t.date().isoformat() != dia:
                continue
            if ocupado and (v, t.replace(second=0)) in ocupado:
                continue   # nesse minuto o caminhão já estava num controle de outro setor da INLOG
            por_v.setdefault(v, {})[t] = ((h["Latitude"] / 1e6, h["Longitude"] / 1e6), h.get("Velocidade") or 0)
    no_setor = lambda q: any(dentro(q, r) for r in o["ring"]) if o["ring"] else True
    escolhidos = {}
    for v, d in por_v.items():
        tr = [(t, q, vel) for t, (q, vel) in sorted(d.items())]
        dentro_lento = [x for x in tr if x[2] <= 25 and no_setor(x[1])]
        if len(dentro_lento) < min_pts:
            continue
        cob = cobertura(o["lin"], {v: tr})
        print("   ", o["s"], "sem controle na INLOG · GPS de", v, ":", cob, "% da rota,", len(dentro_lento), "pontos coletando no setor")
        if cob and cob >= min_cob:
            escolhidos[v] = (tr, dentro_lento)
    if not escolhidos:
        return
    o["sit"], o["fonte"] = "GPS", "gps"
    o["veic"] = sorted(escolhidos)
    o["pgps"] = cobertura(o["lin"], {v: tr for v, (tr, _) in escolhidos.items()})
    p0 = min((dl[0] for _, dl in escolhidos.values()), key=lambda x: x[0])
    o["entrada"] = p0[0].strftime("%H:%M")
    o["ini"] = [round(p0[1][0], 5), round(p0[1][1], 5), o["entrada"]]
    o["gps"], km, t_ini, t_fim, ult = [], 0, None, None, None
    for v, (tr, dl) in escolhidos.items():
        a, b = dl[0][0], dl[-1][0]
        seg = [x for x in tr if a <= x[0] <= b]
        km += sum(dist_m(p[1], q[1]) for p, q in zip(seg, seg[1:]) if (q[0] - p[0]).total_seconds() <= 180 and no_setor(p[1]) and no_setor(q[1])) / 1000
        t_ini = a if t_ini is None or a < t_ini else t_ini
        t_fim = b if t_fim is None or b > t_fim else t_fim
        if ult is None or tr[-1][0] > ult[0]:
            ult = tr[-1]
        o["gps"].append([v, a.strftime("%H:%M"), b.strftime("%H:%M"), enc(simplificar([x[1] for x in seg]))])
    o["dist"] = round(km, 1)
    if t_fim > t_ini:
        o["vel"] = round(km / ((t_fim - t_ini).total_seconds() / 3600), 1)
    o["fim_gps"] = t_fim.strftime("%H:%M")
    o["pos"], o["ult"] = [ult[1][0], ult[1][1]], ult[0].strftime("%d/%m %H:%M")


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


def arq_consulta():
    return os.path.join(AQUI, "..", "docs", CID.get("raiz", "c/%s/" % CID.get("slug")) if CID else "", "consulta_dados.json")


def indice_ruas(ruas=None):
    if ruas is None:
        ruas = json.load(open(arq_consulta()))["streets"]
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
        raw = AESGCM(chave).decrypt(b(e["iv"]), b(e["dados"]), None)
        return json.loads(gzip.decompress(raw) if e.get("z") else raw).get("ruas")
    except Exception as ex:
        print("sem histórico anterior das ruas:", ex)
        return None


def gps_do_dia(s, dia):
    pts = []
    g = pegar_json(s, GRID.format(d=dia))
    cods = {y["CodigoSetor"] for y in g["Data"]["Data"] if da_cidade(y.get("MacroSetor")) and y.get("Controle") and y.get("CodigoSetor")}
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
    elif not CID.get("ruas"):   # cidades novas: parte da última passagem calculada junto com a consulta
        ult0 = json.load(open(arq_consulta())).get("ult0")
        ult = list(ult0) if isinstance(ult0, list) and len(ult0) == n else [0] * n
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


# ---------------------------------------------------------------- aterro
def dist_linha(p, linha):
    """Menor distância (m) entre o ponto e a polilinha."""
    melhor = 1e9
    for a, b in zip(linha, linha[1:]):
        bx, by = (b[1] - a[1]) * 111320 * C, (b[0] - a[0]) * 110574
        px, py = (p[1] - a[1]) * 111320 * C, (p[0] - a[0]) * 110574
        L2 = bx * bx + by * by
        t = max(0, min(1, (px * bx + py * by) / L2)) if L2 else 0
        melhor = min(melhor, math.hypot(px - t * bx, py - t * by))
    return melhor


def na_via(pos, ater=None):
    if CID.get("acesso") == "trindade":
        return any(dist_linha(pos, l) <= RAIO_ACESSO for l in ACESSO_ATERRO)
    return ater is not None and dist_m(pos, ater) <= RAIO_ACESSO_GERAL


def aterro(por_veic, ater):
    """Passagens pelo aterro: entrada, saída, duração e velocidade máxima dentro (pelo GPS de cada veículo)."""
    vis = []
    for v, pts in por_veic.items():
        atual = None
        for t in sorted(pts):
            pos, vel, cod = pts[t]
            if dist_m(pos, ater) <= RAIO_ATERRO:
                if atual and (t - atual["fim"]).total_seconds() <= SAIDA_ATERRO:   # saiu e voltou rápido: mesma passagem
                    atual["fim"] = t; atual["vmax"] = max(atual["vmax"], vel); atual["n"] += 1; atual["set"].add(cod)
                else:
                    if atual:
                        vis.append(atual)
                    atual = {"v": v, "ini": t, "fim": t, "vmax": vel, "n": 1, "set": {cod}}
            elif atual and (t - atual["fim"]).total_seconds() > SAIDA_ATERRO:
                vis.append(atual); atual = None
        if atual:
            vis.append(atual)
    out = []
    for a in sorted(vis, key=lambda x: x["ini"]):
        dur = int((a["fim"] - a["ini"]).total_seconds())
        if a["n"] < 2 and dur < 60:
            continue
        pts = por_veic[a["v"]]
        ida = [pts[t][1] for t in pts if a["ini"] - dt.timedelta(seconds=JANELA_ACESSO) <= t < a["ini"]
               and dist_m(pts[t][0], ater) > RAIO_ATERRO and na_via(pts[t][0], ater)]
        volta = [pts[t][1] for t in pts if a["fim"] < t <= a["fim"] + dt.timedelta(seconds=JANELA_ACESSO)
                 and dist_m(pts[t][0], ater) > RAIO_ATERRO and na_via(pts[t][0], ater)]
        out.append({"v": a["v"], "s": sorted(a["set"]), "ini": a["ini"].strftime("%Y-%m-%d %H:%M"), "fim": a["fim"].strftime("%Y-%m-%d %H:%M"),
                    "dur": dur, "vmax": round(a["vmax"]), "vida": round(max(ida)) if ida else None, "vvolta": round(max(volta)) if volta else None})
        print("    aterro", a["v"], out[-1]["ini"], "→", out[-1]["fim"][11:], dur // 60, "min · vmax", out[-1]["vmax"], "km/h",
              "· via de acesso: chegada", out[-1]["vida"], "(%d pts)" % len(ida), "saída", out[-1]["vvolta"], "(%d pts)" % len(volta))
    return out


# ---------------------------------------------------------------- principal
def montar(s, dia, cad, at):
    """Monta o quadro de um dia (hoje ou um dia anterior)."""
    gar = tuple(cad["garagem"]) if cad.get("garagem") else None
    grid = pegar_json(s, GRID.format(d=dia))
    linhas = [x for x in grid["Data"]["Data"] if da_cidade(x.get("MacroSetor"))]
    # A INLOG repete o mesmo setor em várias linhas (uma por viagem/veículo, ou uma "ATIVO" e outra "AGUARDANDO").
    # Fica uma linha por setor: a que tem coleta ativa; senão a executada; senão a aguardando.
    prio = {"ATIVO": 0, "EXECUTADO": 1, "AGUARDANDO": 2}
    melhor, veics = {}, {}
    for x in linhas:
        cod = codigo(x.get("Setor"))
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
            if da_cidade(y.get("MacroSetor")) and (y.get("DisplayDataInicioAtividade") or "").startswith(ddmm):
                emprestado[codigo(y.get("Setor"))] = y
    except SystemExit:
        pass
    setores, gps_dia, por_veic, pend = [], [], {}, []
    aneis = aneis_cidade(s, linhas, dia)
    urls = []
    for x in linhas:   # baixa tudo de uma vez, em paralelo
        y = emprestado.get(codigo(x.get("Setor"))) if (x.get("Situacao") or "").strip() == "AGUARDANDO" and not x.get("PorcentagemRound") else None
        z, dz = (y, ontem) if y else (x, dia)
        if z.get("CodigoSetor"):
            urls.append(PLANO.format(c=z["CodigoSetor"], d=dz))
            if z.get("Controle"):
                urls += [ROTA.format(c=z["CodigoSetor"], d=dz), DETALHE.format(c=z["CodigoSetor"], d=dz)]
    buscar_varios(s, urls)
    for x in linhas:
        cod = codigo(x.get("Setor"))
        dia_x = dia
        if (x.get("Situacao") or "").strip() == "AGUARDANDO" and not x.get("PorcentagemRound") and cod in emprestado:
            x = dict(emprestado[cod], Turno=x.get("Turno")); dia_x = ontem
        info = cad["setores"].get(cod, {}) if cad.get("setores") else {}
        o = {"s": cod, "turno": x.get("Turno"), "sit": (x.get("Situacao") or "").strip(), "pct": x.get("PorcentagemRound") or 0,
             "ult": x.get("DisplayUltimoPeriodico"), "pos": [x["Latitude"] / 1e6, x["Longitude"] / 1e6] if x.get("Latitude") else None,
             "veic": list(veics.get(cod) or ([x["Veiculo"]] if x.get("Veiculo") else [])), "entrada": None, "dist": 0, "vel": None, "stop": 0, "par": [], "lin": [],
             "ring": [[[round(a, 5), round(b, 5)] for a, b in dec(r)] for r in info.get("aneis", [])] if info else [r for r in aneis.get(str(x.get("CodigoSetor")), []) if len(r) > 2]}
        pontos, t0, t1, trilhas, km_pt, trv = [], None, None, {}, {}, {}
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
                    t = dt.datetime.fromisoformat(h["DataHoraCompleta"][:19])
                    km_pt[(v, t)] = (h.get("Distancia") or 0) / 1000   # mesmo ponto em dois controles conta uma vez só
                    t0 = t if t0 is None or t < t0 else t0
                    t1 = t if t1 is None or t > t1 else t1
                    pos = (h["Posicao"]["Latitude"], h["Posicao"]["Longitude"])
                    pontos.append(pos)
                    tr.append((t, pos))
                    trv.setdefault(v or "?", []).append((t, pos, h.get("Velocidade") or 0))
                    gps_dia.append((t, pos[0], pos[1], h.get("Velocidade") or 0))
                    por_veic.setdefault(v or "?", {})[t] = (pos, h.get("Velocidade") or 0, cod)
                for p in c.get("PontosParada") or []:   # só paradas longas (>= 5 min) dentro do setor
                    d = seg(p.get("TempoParado"))
                    if d < PARADA_MIN or not p.get("Latitude"):
                        continue
                    pt = (p["Latitude"] / 1e6, p["Longitude"] / 1e6)
                    if o["ring"] and not any(dentro(pt, r) for r in o["ring"]):
                        continue
                    o["par"].append([(p.get("DataHoraInicio") or "")[11:16], (p.get("DataHoraFim") or "")[11:16], d, round(pt[0], 5), round(pt[1], 5)])
                    o["stop"] += d
        # Ponto inicial da rota: 1º ponto de GPS dentro do setor a partir da entrada no setor (INLOG).
        te = dt.datetime.fromisoformat(o["_ent"][:19]) if o.get("_ent") else None
        cand = sorted(p for tr in trilhas.values() for p in tr if te is None or p[0] >= te)
        noset = [p for p in cand if o["ring"] and any(dentro(p[1], r) for r in o["ring"])]
        p = (noset or (cand if te else []) or [None])[0]
        if p:
            o["ini"] = [round(p[1][0], 5), round(p[1][1], 5), p[0].strftime("%H:%M")]
        o["dist"] = sum(km_pt.values())
        # Rastreio do GPS (o mesmo que a INLOG desenha), um por veículo, sem pontos repetidos
        o["gps"] = []
        for v, tr in trilhas.items():
            u = sorted(dict(tr).items())
            if len(u) > 1:
                o["gps"].append([v, u[0][0].strftime("%H:%M"), u[-1][0].strftime("%H:%M"), enc(simplificar([q for _, q in u]))])
        sai = []
        for v, tr in (trilhas.items() if gar else []):
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
                if trv and o["lin"]:
                    o["pgps"] = cobertura(o["lin"], trv)   # percentual executado medido pelo GPS
            except SystemExit:
                raise
            except Exception as e:   # sem rota programada: o card continua funcionando
                print("  rota", cod, "indisponível:", e)
            if not x.get("Controle") and not o["pct"] and o["lin"]:
                pend.append((o, dia_x))   # a INLOG não registrou o setor: confere no GPS depois de ler todos os controles
        o.pop("_ent", None)
        setores.append(o)
        print(cod, o["sit"], o["pct"], o["veic"], o["entrada"], o["dist"], "km", "rota:", o.get("rotas"), "mapa:", o.get("pctmapa"), "%", "gps:", o.get("pgps"), "%")
    ocupado = {(v, t.replace(second=0)) for v, d in por_veic.items() for t in d}
    hoje, fila = at != "final", []
    for o, dia_o in pend:
        u = url_passagens(o, dia_o)
        k = "%s|%s|%s" % (CID["slug"], dia_o, o["s"])
        if not u:
            continue
        h = int(at[:2]) if hoje and at[:2].isdigit() else 99
        if hoje and h < INICIO_TURNO.get(norm(o.get("turno")), 8) and not (norm(o.get("turno")) == "NOTURNO" and h < 4):
            continue   # turno desse setor ainda não começou
        if hoje and k in GPSX and time.time() - GPSX[k]["t"] < 1800:   # hoje: confere cada setor no máximo a cada 30 min
            o.update(GPSX[k]["o"])
            continue
        fila.append((o, dia_o, u, k))
    buscar_varios(s, [f[2] for f in fila], n=4)
    for o, dia_o, u, k in fila:
        try:
            gps_sem_controle(s, dia_o, o, ocupado)
            if hoje:
                GPSX[k] = {"t": time.time(), "o": {c: o[c] for c in CAMPOS_GPS if c in o} if o["sit"] == "GPS" else {}}
            if o["sit"] == "GPS":
                print(o["s"], "GPS", o["veic"], o["entrada"], "-", o.get("fim_gps"), o["dist"], "km", "gps:", o["pgps"], "%")
        except SystemExit:
            print("  passagens", o["s"], "indisponíveis")
        except Exception as e:
            print("  passagens", o["s"], "falharam:", e)
    limpar_respostas()
    return {"dia": dia, "at": at, "cidade": CID["nome"], "garagem": cad.get("garagem"), "S": setores,
            "aterro": aterro(por_veic, tuple(cad["aterro"])) if cad.get("aterro") else None}, gps_dia


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


def situacao(v):
    return v.get("s") if isinstance(v, dict) else v


def guardar_dia(dados, sit, idx):
    S = [x for x in dados["S"] if x["sit"] != "AGUARDANDO" or x["pct"]]
    if not S and sit == "final":   # dia sem coleta registrada na INLOG
        idx["dias"][dados["dia"]] = {"s": "vazio"}
        return
    os.makedirs(HIST, exist_ok=True)
    criptografar(json.dumps(dados, separators=(",", ":")).encode(), os.path.join(HIST, dados["dia"] + ".enc.json"), True)
    inc = sum(1 for x in dados["S"] if x["sit"] == "EXECUTADO" and x["pct"] < 90)
    idx["dias"][dados["dia"]] = {"s": sit, "m": round(sum(x.get("pgps") or 0 if x["sit"] == "GPS" else x["pct"] for x in S) / len(S)) if S else 0, "n": len(S), "i": inc, "v": VERSAO_HIST}


def cad_cidade():
    if CID.get("cad"):
        return json.load(open(os.path.join(AQUI, CID["cad"])))
    return {"garagem": CID.get("garagem"), "aterro": CID.get("aterro"), "setores": None}


def salvar_indice(idx, dia):
    limite = (dt.date.fromisoformat(dia) - dt.timedelta(days=DIAS_HIST)).isoformat()
    for d in [d for d in idx["dias"] if d < limite]:
        idx["dias"].pop(d)
        try:
            os.remove(os.path.join(HIST, d + ".enc.json"))
        except OSError:
            pass
    os.makedirs(HIST, exist_ok=True)
    json.dump(idx, open(os.path.join(HIST, "index.json"), "w"), sort_keys=True)


def hoje_cidade(s, dia, agora):
    cad = cad_cidade()
    dados, gps_dia = montar(s, dia, cad, agora.strftime("%H:%M"))
    idx = indice_hist()
    guardar_dia(dados, "parcial", idx)
    if CID.get("ruas") or os.path.exists(arq_consulta()):
        try:
            dados["ruas"] = historico_ruas(s, dia, gps_dia)
        except SystemExit:
            raise
        except Exception as e:   # a consulta de ruas nunca derruba o painel
            print("histórico das ruas indisponível:", e)
    criptografar(json.dumps(dados, separators=(",", ":")).encode(), SAIDA)
    salvar_indice(idx, dia)


def proximo_dia_antigo(idx, dia, feitos):
    if feitos >= NOVOS_POR_VEZ:
        return None
    for k in range(1, CID.get("dias_busca", DIAS_BUSCA) + 1):
        d = (dt.date.fromisoformat(dia) - dt.timedelta(days=k)).isoformat()
        v = idx["dias"].get(d)
        if isinstance(v, dict) and (v.get("s") == "vazio" or v.get("s") == "final" and v.get("v", 1) >= VERSAO_HIST):   # versões antigas são refeitas
            continue
        return d
    return None


def main():
    global GPSX
    agora = dt.datetime.now(TZ)
    dia = (agora - dt.timedelta(hours=4)).date().isoformat()   # até 04h ainda conta o dia anterior (turno da noite)
    s = entrar()
    arq_gps = os.path.join(CACHE, "gpsx.json")
    try:
        GPSX = {k: v for k, v in json.load(open(arq_gps)).items() if k.split("|")[1] >= (dt.date.fromisoformat(dia) - dt.timedelta(days=1)).isoformat()}
    except Exception:
        GPSX = {}
    for slug in CIDADES:   # 1) o dia de hoje de todas as cidades
        usar_cidade(slug)
        print("=" * 20, CID["nome"], "=" * 20)
        try:
            hoje_cidade(s, dia, agora)
        except (SystemExit, Exception) as e:   # uma cidade com problema não derruba as outras
            print("cidade", CID["nome"], "falhou:", e)
    os.makedirs(CACHE, exist_ok=True)
    json.dump(GPSX, open(arq_gps, "w"))
    # 2) dias anteriores: fecha o de ontem e completa o histórico aos poucos, em rodízio, enquanto houver tempo
    feitos = {slug: 0 for slug in CIDADES}
    andou = True
    while andou and time.time() - _T0 < ORCAMENTO:
        andou = False
        for slug in CIDADES:
            if time.time() - _T0 >= ORCAMENTO:
                break
            usar_cidade(slug)
            idx = indice_hist()
            d = proximo_dia_antigo(idx, dia, feitos[slug])
            if not d:
                continue
            andou = True
            feitos[slug] += 1
            try:
                print("histórico do dia", d, "·", CID["nome"])
                dd, _ = montar(s, d, cad_cidade(), "final")
                guardar_dia(dd, "final", idx)
            except (SystemExit, Exception) as e:   # INLOG sem dados desse dia
                ant = idx["dias"].get(d)
                t = (ant.get("t", 0) if isinstance(ant, dict) else 0) + 1
                print("dia", d, "falhou (%d):" % t, e)
                idx["dias"][d] = {"s": "vazio"} if t >= 3 else {"s": "erro", "t": t}
            salvar_indice(idx, dia)
    print("tempo total: %.0f s" % (time.time() - _T0))


def criptografar(raw, destino=None, comprimir=False):
    destino = destino or SAIDA
    senha = os.environ.get("SENHA_SITE")
    if not senha:
        falha("cadastre o secret SENHA_SITE")
    if comprimir:
        raw = gzip.compress(raw, 9)
    sal, iv = os.urandom(16), os.urandom(12)
    chave = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=sal, iterations=200000).derive(senha.encode())
    ct = AESGCM(chave).encrypt(iv, raw, None)
    b = lambda v: base64.b64encode(v).decode()
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    e = {"v": 1, "sal": b(sal), "iv": b(iv), "dados": b(ct)}
    if comprimir:
        e["z"] = 1
    json.dump(e, open(destino, "w"))
    print("ok:", os.path.basename(destino), os.path.getsize(destino) // 1024, "KB")


if __name__ == "__main__":
    main()
