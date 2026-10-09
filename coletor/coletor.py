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


def seg(txt):
    if not txt:
        return 0
    h, m, s = (int(x) for x in txt.split(":"))
    return h * 3600 + m * 60 + s


# ---------------------------------------------------------------- principal
def main():
    agora = dt.datetime.now(TZ)
    dia = (agora - dt.timedelta(hours=4)).date().isoformat()   # até 04h ainda conta o dia anterior (turno da tarde)
    cad = json.load(open(os.path.join(AQUI, "setores_trindade.json")))
    s = entrar()
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
    setores = []
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
        pontos, t0, t1 = [], None, None
        if x.get("Controle") and x.get("CodigoSetor"):
            for c in pegar_json(s, ROTA.format(c=x["CodigoSetor"], d=dia_x)) or []:
                v = (c.get("Veiculo") or {}).get("Identificador")
                if v and v not in o["veic"]:
                    o["veic"].append(v)
                col = c.get("SetoresColeta") or []
                ent = col[0].get("DataHoraInicio") if col else None
                if ent and (o["entrada"] is None or ent[11:16] < o["entrada"]):
                    o["entrada"] = ent[11:16]
                H = c.get("RastreamentoHistorico") or []
                for h in H:
                    o["dist"] += (h.get("Distancia") or 0) / 1000
                    t = dt.datetime.fromisoformat(h["DataHoraCompleta"][:19])
                    t0 = t if t0 is None or t < t0 else t0
                    t1 = t if t1 is None or t > t1 else t1
                    pos = (h["Posicao"]["Latitude"], h["Posicao"]["Longitude"])
                    pontos.append(pos)
                for p in c.get("PontosParada") or []:   # só paradas longas (>= 5 min) dentro do setor
                    d = seg(p.get("TempoParado"))
                    if d < PARADA_MIN or not p.get("Latitude"):
                        continue
                    pt = (p["Latitude"] / 1e6, p["Longitude"] / 1e6)
                    if o["ring"] and not any(dentro(pt, r) for r in o["ring"]):
                        continue
                    o["par"].append([(p.get("DataHoraInicio") or "")[11:16], (p.get("DataHoraFim") or "")[11:16], d, round(pt[0], 5), round(pt[1], 5)])
                    o["stop"] += d
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
        setores.append(o)
        print(cod, o["sit"], o["pct"], o["veic"], o["entrada"], o["dist"], "km", "rota:", o.get("rotas"), "mapa:", o.get("pctmapa"), "%")
    dados = {"dia": dia, "at": agora.strftime("%H:%M"), "garagem": cad["garagem"], "S": setores}
    criptografar(json.dumps(dados, separators=(",", ":")).encode())


def criptografar(raw):
    senha = os.environ.get("SENHA_SITE")
    if not senha:
        falha("cadastre o secret SENHA_SITE")
    sal, iv = os.urandom(16), os.urandom(12)
    chave = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=sal, iterations=200000).derive(senha.encode())
    ct = AESGCM(chave).encrypt(iv, raw, None)
    b = lambda v: base64.b64encode(v).decode()
    os.makedirs(os.path.dirname(SAIDA), exist_ok=True)
    json.dump({"v": 1, "sal": b(sal), "iv": b(iv), "dados": b(ct)}, open(SAIDA, "w"))
    print("ok:", os.path.getsize(SAIDA) // 1024, "KB")


if __name__ == "__main__":
    main()
