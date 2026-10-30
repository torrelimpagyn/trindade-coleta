// Relatório do fechamento (uma cidade), no papel timbrado da Quebec Ambiental (Planejamento e Controle).
// Fechamento do dia completo (resumo e uma seção por turno) ou de um turno só; folhas A4 com a barra verde e a logo.
// Baixa como imagem, compartilha ou imprime/salva em PDF. Usa os dados do dia abertos no painel (D) e,
// quando existem, as funções do index.html (stK: status pelo rastreio; TLAB).
(function () {
  const LOGO = 'data:image/webp;base64,' +
    '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';
  const VERDE = '#8DC62B', ESC = '#1f5f45';
  const WD = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const n0 = (v, d = 0) => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const min = t => { if (!t) return null; const [h, m] = String(t).split(':').map(Number); return isNaN(h) ? null : h * 60 + (m || 0); };
  const hmin = m => { if (m == null) return '—'; m = Math.round(m); return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`; };
  const hora = m => { m = ((Math.round(m) % 1440) + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
  const km = m => m >= 1000 ? n0(m / 1000, 1) + ' km' : n0(m) + ' m';
  const pl = (n, a, b) => n === 1 ? a : b;
  // Base: o rastreio dos caminhões (percentual pelo GPS); o status vem do painel (stK: Em execução, Finalizada, Incompleta, Aguardando)
  const pg = s => s.pgps != null ? s.pgps : (s.pct || 0);
  const NOME = { ex: 'Em execução', fi: 'Finalizada', in: 'Incompleta', ag: 'Aguardando' };
  const stk = s => typeof stK === 'function' ? stK(s) : (s.sit === 'AGUARDANDO' && !s.pct && !(s.gps || []).length ? 'ag' : pg(s) >= 95 ? 'fi' : 'in');
  const saiu = s => stk(s) !== 'ag';
  const cor = s => !saiu(s) ? '#c9d0cc' : pg(s) >= 95 ? '#4fb37f' : pg(s) >= 80 ? '#e9b44c' : '#e06b62';
  const situ = s => NOME[stk(s)];
  const enc = s => stk(s) === 'in';
  const tlab = t => (typeof TLAB !== 'undefined' && TLAB[t]) || t || 'Outros';
  const ordem = (a, b) => String(a.s).localeCompare(String(b.s), 'pt-BR', { numeric: true });
  let DA = null;   // viagens ao aterro do dia (GPS)
  const nat = s => (DA || []).filter(x => (x.s || []).includes(s.s)).length;
  const slug = t => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');

  // ------------------------------------------------------------ turnos
  // Expediente informado pela operação (minutos desde 00:00; passa de 1440 quando vira a meia-noite).
  // Nessas cidades o turno de cada setor sai do horário em que o caminhão trabalhou (a INLOG marca Diurno/Noturno/Integral).
  const CO_VAL = [{ k: 'M', n: 'Manhã', ini: 420, fim: 960, sab: [420, 660] }, { k: 'T', n: 'Tarde', ini: 960, fim: 1320, sab: [960, 1320] }];
  const EXP = {
    luziania: [{ k: 'M', n: 'Manhã', ini: 420, fim: 920, sab: [360, 860] }, { k: 'N', n: 'Noite', ini: 1140, fim: 1640, sab: [960, 1460] }],
    'cidade-ocidental': CO_VAL, valparaiso: CO_VAL
  };
  const TORD = ['MATUTINO', 'MANHA', 'DIURNO', 'INTEGRAL', 'VESPERTINO', 'TARDE', 'NOTURNO', 'OUTROS'];
  function janela(s) {   // [saída, retorno] do caminhão em minutos (GPS quando não há saída/retorno da garagem)
    let a = min(s.saida), b = min(s.volta);
    const g = (s.gps || []).map(x => [min(x[1]), min(x[2])]).filter(x => x[0] != null);
    if (a == null && g.length) a = Math.min(...g.map(x => x[0] < 240 ? x[0] + 1440 : x[0]));
    if (a == null) a = min(s.rast0);
    if (a == null) return null;
    if (a < 240) a += 1440;
    if (b == null && g.length) b = Math.max(...g.map(x => x[1] == null ? 0 : x[1] < 240 ? x[1] + 1440 : x[1]));
    if (b == null || b <= 0) b = a + 60;
    while (b < a) b += 1440;
    return [a, b];
  }
  function grupos(D, CX) {
    const [y, mo, da] = D.dia.split('-'), dow = new Date(+y, mo - 1, +da).getDay(), cfg = EXP[CX.s];
    const S = [...D.S].sort(ordem);
    let atm = D.at === 'final' ? Infinity : min(D.at);
    if (atm != null && atm < 240) atm += 1440;
    if (cfg) {
      const G = cfg.map(T => { const w = dow === 6 && T.sab ? T.sab : [T.ini, T.fim]; return { k: T.k, n: T.n, ini: w[0], fim: w[1], S: [], fechado: atm == null || atm >= w[1] }; });
      const X = { k: 'X', n: 'Turno não identificado', S: [], fechado: D.at === 'final' };
      const lab = s => String(s.turno || '').toUpperCase();
      S.forEach(s => {
        const J = janela(s);
        let g = null;
        if (J) {
          let best = -1;
          G.forEach(T => { const o = Math.min(J[1], T.fim) - Math.max(J[0], T.ini); if (o > best) { best = o; g = T; } });
          if (best <= 0) g = G.reduce((a, T) => { const d = J[0] < T.ini ? T.ini - J[0] : Math.max(0, J[0] - T.fim); return !a || d < a.d ? { d, T } : a; }, null).T;
        } else {
          const l = lab(s);
          g = ['MATUTINO', 'MANHA', 'DIURNO'].includes(l) ? G[0] : ['VESPERTINO', 'TARDE', 'NOTURNO'].includes(l) ? G[G.length - 1] : X;
        }
        g.S.push(s);
      });
      return G.concat([X]).filter(T => T.S.length);
    }
    const M = new Map();   // demais cidades: turno da INLOG
    S.forEach(s => { const t = s.turno || 'OUTROS'; if (!M.has(t)) M.set(t, { k: t, n: tlab(t), S: [], fechado: D.at === 'final' }); M.get(t).S.push(s); });
    const ix = t => { const i = TORD.indexOf(t); return i < 0 ? 99 : i; };
    return [...M.values()].sort((a, b) => ix(a.k) - ix(b.k));
  }
  const expTxt = T => T.ini != null ? `${hora(T.ini)}–${hora(T.fim)}` : '';
  const nomeT = T => T.k === 'X' ? T.n : `Turno da ${T.n.toLowerCase()}`;
  function extra(s, T, jor) {   // hora extra: fora do expediente do turno (ou além da jornada, nas cidades sem expediente cadastrado)
    let a = min(s.saida), b = min(s.volta);
    if (a == null || b == null) return null;
    if (a < 240) a += 1440;
    while (b < a) b += 1440;
    if (T && T.ini != null) return { dur: b - a, he: Math.max(0, T.ini - a) + Math.max(0, b - T.fim) };
    return { dur: b - a, he: Math.max(0, b - a - jor) };
  }

  // ------------------------------------------------------------ ruas sem coleta (rota programada × GPS)
  const dec = t => { const v = t ? t.split(',').map(x => parseInt(x, 36)) : [], o = []; let a = 0, b = 0; for (let i = 0; i + 1 < v.length; i += 2) { a += v[i]; b += v[i + 1]; o.push([a / 1e5, b / 1e5]); } return o; };
  const CONS = {};
  const consulta = pre => CONS[pre] || (CONS[pre] = fetch(pre + 'consulta_dados.json?t=' + Math.floor(Date.now() / 36e5)).then(r => r.ok ? r.json() : null).then(c => c && indice(c)).catch(() => null));
  function indice(c) {   // ruas da consulta de endereços, amostradas a cada 15 m numa grade de ~33 m
    const C = Math.cos(((c.garagem || [-16])[0]) * Math.PI / 180), cel = new Map(), K = .0003;
    c.streets.forEach((s, i) => (s[3] || '').split(';').forEach(p => {
      const P = dec(p);
      for (let j = 0; j < P.length; j++) {
        const a = P[j], b = P[j + 1] || a, d = Math.hypot((b[0] - a[0]) * 110574, (b[1] - a[1]) * 111320 * C), n = Math.max(1, Math.floor(d / 15));
        for (let k = 0; k <= (P[j + 1] ? n - 1 : 0); k++) {
          const la = a[0] + (b[0] - a[0]) * k / n, lo = a[1] + (b[1] - a[1]) * k / n, key = Math.round(la / K) + '_' + Math.round(lo / K);
          (cel.get(key) || cel.set(key, []).get(key)).push([la, lo, i]);
        }
      }
    }));
    return { ruas: c.streets, cel, K, C };
  }
  function porRota(s, R, comGps) {   // metros da rota programada sem passagem do caminhão, por rua da consulta
    const C = Math.cos(((s.lin[0][1][0] || [-16])[0]) * Math.PI / 180), xy = p => [p[1] * 111320 * C, p[0] * 110574], G = new Map(), T = 35;
    if (comGps) s.gps.forEach(g => {
      const P = dec(g[3]).map(xy);
      for (let j = 0; j + 1 < P.length; j++) {
        const a = P[j], b = P[j + 1], d = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (d > 1500) continue;   // buraco no rastreio
        const n = Math.max(1, Math.ceil(d / 10));
        for (let k = 0; k <= n; k++) { const q = [a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n], key = Math.floor(q[0] / T) + '_' + Math.floor(q[1] / T); (G.get(key) || G.set(key, []).get(key)).push(q); }
      }
    });
    const perto = q => { if (!comGps) return false; const cx = Math.floor(q[0] / T), cy = Math.floor(q[1] / T); for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const L = G.get((cx + i) + '_' + (cy + j)); if (L) for (const p of L) if (Math.hypot(p[0] - q[0], p[1] - q[1]) <= T) return true; } return false; };
    const acc = new Map(); let tot = 0;
    s.lin.forEach(l => {
      const P = l[1];
      for (let j = 0; j + 1 < P.length; j++) {
        const A = xy(P[j]), B = xy(P[j + 1]), d = Math.hypot(B[0] - A[0], B[1] - A[1]), n = Math.max(1, Math.ceil(d / 10));
        for (let k = 0; k < n; k++) {
          const f = (k + .5) / n, q = [A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f];
          if (perto(q)) continue;
          tot += d / n;
          if (!R) continue;
          const la = P[j][0] + (P[j + 1][0] - P[j][0]) * f, lo = P[j][1] + (P[j + 1][1] - P[j][1]) * f;
          const c0 = Math.round(la / R.K), c1 = Math.round(lo / R.K);
          let best = 25, idx = -1;
          for (let i = -1; i <= 1; i++) for (let jj = -1; jj <= 1; jj++) { const L = R.cel.get((c0 + i) + '_' + (c1 + jj)); if (L) for (const p of L) { const dd = Math.hypot((p[0] - la) * 110574, (p[1] - lo) * 111320 * R.C); if (dd <= best) { best = dd; idx = p[2]; } } }
          acc.set(idx, (acc.get(idx) || 0) + d / n);
        }
      }
    });
    const lista = [...acc].filter(([i, m]) => m >= 40).map(([i, m]) => ({ r: i >= 0 ? R.ruas[i][0] : '(trecho sem nome no cadastro)', b: i >= 0 ? R.ruas[i][1] : '', m: Math.round(m) }));
    return { lista, tot: Math.round(tot) };
  }
  const ordM = L => L.sort((a, b) => b.m - a.m || a.r.localeCompare(b.r, 'pt-BR'));
  function semColeta(s, R, naoSaiu) {
    const temRota = (s.lin || []).length > 0;
    if (naoSaiu) { if (!temRota) return null; const r = porRota(s, R, false); return { lista: ordM(r.lista), tot: r.tot, ns: true }; }   // não saiu: a rota inteira ficou sem coleta
    const nf = (s.nf || []).map(x => ({ r: x[0] || '(trecho sem nome no cadastro)', b: x[1] || '', m: x[2] }));
    const totNf = s.nfm || nf.reduce((a, x) => a + x.m, 0);
    if (nf.length && nf.length < 40) return { lista: ordM(nf), tot: totNf };   // lista completa do coletor
    if (!temRota || !(s.gps || []).length) return nf.length || s.nfm ? { lista: ordM(nf), tot: totNf } : null;
    const r = porRota(s, R, true);
    if (!nf.length) return { lista: ordM(r.lista), tot: r.tot };
    const vis = new Set(nf.map(x => x.r + '|' + x.b));   // dias antigos: o coletor guardava só as 40 maiores; completa com a rota × GPS
    return { lista: ordM(nf.concat(r.lista.filter(x => !vis.has(x.r + '|' + x.b)))), tot: totNf || r.tot };
  }

  // ------------------------------------------------------------ mapa (setores do turno em cor; os demais em cinza claro)
  function mapa(S, todos, rot = true) {
    const P = todos.filter(s => (s.ring || []).length), dest = new Set(S.map(s => s.s));
    const pts = P.flatMap(s => s.ring.flat());
    if (!pts.length || !S.some(s => (s.ring || []).length)) return '';
    const la0 = Math.min(...pts.map(p => p[0])), la1 = Math.max(...pts.map(p => p[0]));
    const lo0 = Math.min(...pts.map(p => p[1])), lo1 = Math.max(...pts.map(p => p[1]));
    const k = Math.cos((la0 + la1) / 2 * Math.PI / 180), W = 700, H = 380, pad = 12;
    const sx = (W - 2 * pad) / Math.max(1e-6, (lo1 - lo0) * k), sy = (H - 2 * pad) / Math.max(1e-6, la1 - la0), sc = Math.min(sx, sy);
    const ox = (W - (lo1 - lo0) * k * sc) / 2, oy = (H - (la1 - la0) * sc) / 2;
    const X = lo => ox + (lo - lo0) * k * sc, Y = la => oy + (la1 - la) * sc;
    const pol = (r, f, o) => `<polygon points="${r.map(p => X(p[1]).toFixed(1) + ',' + Y(p[0]).toFixed(1)).join(' ')}" fill="${f}" fill-opacity="${o}" stroke="#fff" stroke-width="1.4"/>`;
    let g0 = '', g = '', t = '';
    P.forEach(s => {
      if (!dest.has(s.s)) { s.ring.forEach(r => { g0 += `<polygon points="${r.map(p => X(p[1]).toFixed(1) + ',' + Y(p[0]).toFixed(1)).join(' ')}" fill="#fff" fill-opacity=".55" stroke="#b4beb8" stroke-width=".8"/>`; }); return; }
      s.ring.forEach(r => { g += pol(r, cor(s), '.8'); });
      const r0 = s.ring.reduce((a, r) => r.length > a.length ? r : a, []);
      const cx = X(r0.reduce((a, p) => a + p[1], 0) / r0.length), cy = Y(r0.reduce((a, p) => a + p[0], 0) / r0.length);
      const lx = r0.map(p => X(p[1])), ly = r0.map(p => Y(p[0])), grande = Math.max(...lx) - Math.min(...lx) > 46 && Math.max(...ly) - Math.min(...ly) > 30;
      if (rot) t += `<text x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" text-anchor="middle" font-size="${grande ? 11 : 9}" font-weight="700" fill="#14231c" stroke="#fff" stroke-width="3" paint-order="stroke">${esc(s.s)}${grande ? `<tspan x="${cx.toFixed(1)}" dy="12" font-size="10" font-weight="600">${saiu(s) ? n0(pg(s)) + '%' : '—'}</tspan>` : ''}</text>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block;background:#f3f6f4;border-radius:6px">${g0}${g}${t}</svg>`;
  }
  const LEG = `<div class="lg"><span><i style="background:#4fb37f"></i>95% ou mais (meta)</span><span><i style="background:#e9b44c"></i>80 a 94%</span><span><i style="background:#e06b62"></i>abaixo de 80%</span><span><i style="background:#c9d0cc"></i>não saiu</span><span><i style="background:#fff;box-shadow:inset 0 0 0 1px #b4beb8"></i>outro turno</span></div>`;

  // ------------------------------------------------------------ mapa do que falta realizar (rotas incompletas)
  let RU = null;   // ruas da consulta de endereços (nomes no mapa)
  const MW = 628, MH = 330, TILE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/';
  const merc = (la, lo, z) => { const n = 256 * Math.pow(2, z), s = Math.sin(la * Math.PI / 180); return [(lo + 180) / 360 * n, (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n]; };
  function trechosFalta(s) {   // trechos da rota programada a mais de 35 m do rastreio (o mesmo vermelho do mapa do painel)
    const lin = s.lin || []; if (!lin.length) return [];
    const C = Math.cos(((lin[0][1][0] || [-16])[0]) * Math.PI / 180), xy = p => [p[1] * 111320 * C, p[0] * 110574], T = 35, G = new Map();
    (s.gps || []).forEach(g => {
      const P = dec(g[3]).map(xy);
      for (let j = 0; j + 1 < P.length; j++) {
        const a = P[j], b = P[j + 1], d = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (d > 1500) continue;
        const n = Math.max(1, Math.ceil(d / 10));
        for (let k = 0; k <= n; k++) { const q = [a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n], key = Math.floor(q[0] / T) + '_' + Math.floor(q[1] / T); (G.get(key) || G.set(key, []).get(key)).push(q); }
      }
    });
    const perto = q => { const cx = Math.floor(q[0] / T), cy = Math.floor(q[1] / T); for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const L = G.get((cx + i) + '_' + (cy + j)); if (L) for (const p of L) if (Math.hypot(p[0] - q[0], p[1] - q[1]) <= T) return true; } return false; };
    const out = [];
    lin.forEach(l => {
      const P = l[1]; let cur = null;
      for (let j = 0; j + 1 < P.length; j++) {
        const A = xy(P[j]), B = xy(P[j + 1]), d = Math.hypot(B[0] - A[0], B[1] - A[1]), n = Math.max(1, Math.ceil(d / 10));
        for (let k = 0; k < n; k++) {
          const fm = (k + .5) / n, q = [A[0] + (B[0] - A[0]) * fm, A[1] + (B[1] - A[1]) * fm], pt = f => [P[j][0] + (P[j + 1][0] - P[j][0]) * f, P[j][1] + (P[j + 1][1] - P[j][1]) * f];
          if (perto(q)) { cur = null; continue; }
          if (!cur) { cur = [pt(k / n)]; out.push(cur); }
          cur.push(pt((k + 1) / n));
        }
      }
    });
    return out;
  }
  function nomesFalta(FT) {   // ruas dos trechos que faltam: metros e um ponto da rua para o rótulo
    if (!RU) return [];
    const M = new Map();
    FT.forEach(L => {
      for (let j = 0; j + 1 < L.length; j++) {
        const a = L[j], b = L[j + 1], d = Math.hypot((b[0] - a[0]) * 110574, (b[1] - a[1]) * 111320 * RU.C), n = Math.max(1, Math.ceil(d / 15));
        for (let k = 0; k < n; k++) {
          const la = a[0] + (b[0] - a[0]) * (k + .5) / n, lo = a[1] + (b[1] - a[1]) * (k + .5) / n, c0 = Math.round(la / RU.K), c1 = Math.round(lo / RU.K);
          let best = 25, idx = -1;
          for (let i = -1; i <= 1; i++) for (let jj = -1; jj <= 1; jj++) { const C = RU.cel.get((c0 + i) + '_' + (c1 + jj)); if (C) for (const p of C) { const dd = Math.hypot((p[0] - la) * 110574, (p[1] - lo) * 111320 * RU.C); if (dd <= best) { best = dd; idx = p[2]; } } }
          if (idx < 0) continue;
          const x = M.get(idx) || M.set(idx, { r: RU.ruas[idx][0], m: 0, P: [] }).get(idx);
          x.m += d / n; x.P.push([la, lo]);
        }
      }
    });
    return [...M.values()].filter(x => x.m >= 40).sort((a, b) => b.m - a.m).map(x => {
      const c = [x.P.reduce((a, p) => a + p[0], 0) / x.P.length, x.P.reduce((a, p) => a + p[1], 0) / x.P.length];
      return { r: x.r, m: x.m, p: x.P.reduce((a, p) => Math.hypot(p[0] - c[0], p[1] - c[1]) < Math.hypot(a[0] - c[0], a[1] - c[1]) ? p : a, x.P[0]) };
    });
  }
  function mapaFalta(s) {   // mapa de rua: rastreio do caminhão (azul) e o que falta realizar (vermelho)
    const FT = trechosFalta(s).filter(L => L.length > 1);
    if (!FT.length) return '';
    const fp = FT.flat(), la = fp.map(p => p[0]), lo = fp.map(p => p[1]);
    let la0 = Math.min(...la), la1 = Math.max(...la), lo0 = Math.min(...lo), lo1 = Math.max(...lo);
    const mla = Math.max(0, .004 - (la1 - la0)) / 2, mlo = Math.max(0, .004 - (lo1 - lo0)) / 2;   // pelo menos ~450 m de área
    la0 -= mla; la1 += mla; lo0 -= mlo; lo1 += mlo;
    let z = 17;
    for (; z > 10; z--) { const a = merc(la1, lo0, z), b = merc(la0, lo1, z); if (b[0] - a[0] <= MW - 40 && b[1] - a[1] <= MH - 40) break; }
    const a = merc(la1, lo0, z), b = merc(la0, lo1, z), x0 = (a[0] + b[0]) / 2 - MW / 2, y0 = (a[1] + b[1]) / 2 - MH / 2;
    const P = p => { const m = merc(p[0], p[1], z); return [m[0] - x0, m[1] - y0]; };
    const d = L => 'M' + L.map(p => P(p).map(v => v.toFixed(1)).join(',')).join('L');
    let img = '';
    for (let tx = Math.floor(x0 / 256); tx <= Math.floor((x0 + MW) / 256); tx++) for (let ty = Math.floor(y0 / 256); ty <= Math.floor((y0 + MH) / 256); ty++)
      img += `<img src="${TILE}${z}/${ty}/${tx}" crossorigin="anonymous" alt="" onerror="this.style.visibility='hidden'" style="position:absolute;left:${Math.round(tx * 256 - x0)}px;top:${Math.round(ty * 256 - y0)}px;width:256px;height:256px;max-width:none">`;
    const ring = (s.ring || []).map(r => `<path d="${d(r.concat([r[0]]))}" fill="none" stroke="#3b3b3b" stroke-width="1.6" stroke-dasharray="6 4" opacity=".75"/>`).join('');
    const trk = (s.gps || []).map(g => dec(g[3])).filter(L => L.length > 1).map(L => d(L)).join('');
    const ft = FT.map(L => d(L)).join('');
    let rot = '';
    const usados = [];
    nomesFalta(FT).slice(0, 8).forEach(x => {
      const [px, py] = P(x.p);
      if (px < 20 || px > MW - 20 || py < 12 || py > MH - 12 || usados.some(u => Math.hypot(u[0] - px, u[1] - py) < 70)) return;
      usados.push([px, py]);
      rot += `<text x="${px.toFixed(1)}" y="${(py - 7).toFixed(1)}" text-anchor="middle" font-size="10.5" font-weight="700" fill="#9e1f17" stroke="#fff" stroke-width="3.2" paint-order="stroke">${esc(x.r)} · ${n0(x.m)} m</text>`;
    });
    return `<div style="position:relative;width:${MW}px;height:${MH}px;overflow:hidden;border-radius:6px;background:#eef1ee">${img}<svg viewBox="0 0 ${MW} ${MH}" width="${MW}" height="${MH}" style="position:absolute;left:0;top:0">${ring}<path d="${trk}" fill="none" stroke="#fff" stroke-width="5.5" stroke-linejoin="round" stroke-linecap="round" opacity=".85"/><path d="${trk}" fill="none" stroke="#1f3fbf" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round" opacity=".9"/><path d="${ft}" fill="none" stroke="#fff" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"/><path d="${ft}" fill="none" stroke="#d13b30" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>${rot}</svg><span style="position:absolute;right:4px;bottom:2px;font-size:8.5px;color:#444;background:rgba(255,255,255,.75);padding:0 3px;border-radius:3px">Mapa © Esri</span></div>`;
  }
  const LEGF = `<div class="lg"><span><i style="background:#d13b30"></i>falta realizar (rota programada sem passagem do caminhão)</span><span><i style="background:#1f3fbf"></i>por onde o caminhão passou (GPS)</span><span><i style="background:none;border-top:2px dashed #3b3b3b;height:0;width:16px;margin-top:4px"></i>limite do setor</span></div>`;

  // ------------------------------------------------------------ números de um conjunto de setores
  function numeros(S, T, RS, jor) {
    const F = S.filter(saiu), naos = S.filter(s => !saiu(s));
    const med = F.length ? F.reduce((a, s) => a + pg(s), 0) / F.length : null;
    const comI = F.filter(s => s.sit !== 'GPS'), medg = comI.length ? comI.reduce((a, s) => a + (s.pct || 0), 0) / comI.length : null;
    const ex = S.map(s => ({ s, e: extra(s, T, jor) })).filter(x => x.e), hes = ex.filter(x => x.e.he > 0);
    const heTot = hes.reduce((a, x) => a + x.e.he, 0);
    const r = s => RS[s.s] || {};
    const semF = F.reduce((a, s) => a + (r(s).tot || 0), 0), semN = naos.reduce((a, s) => a + (r(s).tot || 0), 0);
    const ruas = S.reduce((a, s) => a + (r(s).lista || []).length, 0);
    return { F, naos, med, medg, conc: F.filter(s => pg(s) >= 95), baixo: F.filter(s => pg(s) < 80), inc: S.filter(enc), ex, hes, heTot, heMed: ex.length ? heTot / ex.length : null, semF, semN, semTot: semF + semN, ruas };
  }
  const kpi = (v, l, c) => `<div class="k"><b${c ? ` style="color:${c}"` : ''}>${v}</b><span>${l}</span></div>`;
  function cartoes(N, fechado, T) {
    const heL = T && T.ini != null ? `hora extra média por setor (fora de ${expTxt(T)})` : 'hora extra média por setor';
    return `<div class="kp">
      ${kpi(N.med == null ? '—' : n0(N.med) + '%', 'conclusão média pelo rastreio (GPS)', N.med == null ? null : N.med >= 95 ? '#1d7a4f' : N.med >= 80 ? '#a86f00' : '#c9302c')}
      ${kpi(N.medg == null ? '—' : n0(N.medg) + '%', 'conclusão média na INLOG (referência)', '#6b6a65')}
      ${kpi(`${N.conc.length}<small> de ${N.F.length}</small>`, 'rotas na meta (95% ou mais)')}
      ${kpi(N.baixo.length, 'rotas abaixo de 80%', N.baixo.length ? '#c9302c' : null)}
      ${kpi(N.inc.length, 'rotas incompletas', N.inc.length ? '#c9302c' : null)}
      ${kpi(N.naos.length, fechado ? 'setores que não saíram' : 'aguardando saída', N.naos.length && fechado ? '#c9302c' : null)}
      ${kpi(N.heMed == null ? '—' : hmin(N.heMed), `${heL}${N.hes.length ? ` · total ${hmin(N.heTot)}` : ''}`, N.heMed ? '#a86f00' : null)}
      ${kpi(N.semTot ? km(N.semTot) : '—', `de rota sem coleta${N.ruas ? ` · ${N.ruas} ${pl(N.ruas, 'rua', 'ruas')}` : ''}`, N.semTot ? '#c9302c' : null)}
    </div>`;
  }

  // ------------------------------------------------------------ seção de um turno (cartões, mapa, destaques, setores, ruas)
  function secao(T, D, RS, todos, comCartoes) {
    const S = T.S, jor = D.jornada || 440, N = numeros(S, T, RS, jor), fechado = T.fechado, B = [];
    if (comCartoes) B.push({ html: cartoes(N, fechado, T) });
    const mp = mapa(S, todos);
    if (mp) B.push({ html: `<h2>${fechado ? 'Como o turno encerrou' : 'Como está o turno (até ' + esc(D.at) + ')'}</h2>${mp}${LEG}` });
    // destaques
    const li = [];
    if (fechado && N.naos.length) li.push(`<b>${N.naos.length} ${pl(N.naos.length, 'setor não saiu', 'setores não saíram')}:</b> ${N.naos.map(s => esc(s.s)).join(', ')}${N.semN ? ` (${km(N.semN)} de rota sem coleta)` : ''}.`);
    if (N.conc.length) li.push(`<b>Na meta (95% ou mais):</b> ${N.conc.slice().sort((a, b) => pg(b) - pg(a)).map(s => `${esc(s.s)} (${n0(pg(s))}%)`).join(', ')}.`);
    if (N.inc.length) li.push(`<b>${N.inc.length} ${pl(N.inc.length, 'rota incompleta', 'rotas incompletas')}:</b> ${N.inc.slice().sort((a, b) => pg(a) - pg(b)).map(s => `${esc(s.s)} (${n0(pg(s))}%)`).join(', ')}.`);
    if (N.baixo.length) li.push(`<b>Abaixo de 80%:</b> ${N.baixo.slice().sort((a, b) => pg(a) - pg(b)).map(s => `${esc(s.s)} (${n0(pg(s))}%)`).join(', ')}.`);
    const gpsSo = S.filter(s => s.sit === 'GPS');
    if (gpsSo.length) li.push(`<b>Coletados sem registro na INLOG (só GPS):</b> ${gpsSo.map(s => `${esc(s.s)} (${n0(s.pgps || 0)}%)`).join(', ')}.`);
    if (N.hes.length) {
      const top = N.hes.slice().sort((a, b) => b.e.he - a.e.he).slice(0, 4).map(x => `${esc(x.s.s)} (${hmin(x.e.he)})`).join(', ');
      li.push(T.ini != null
        ? `<b>Hora extra:</b> ${N.hes.length} ${pl(N.hes.length, 'setor trabalhou', 'setores trabalharam')} fora do expediente de ${expTxt(T)}, somando ${hmin(N.heTot)}; maiores: ${top}.`
        : `<b>Hora extra:</b> ${N.hes.length} ${pl(N.hes.length, 'setor passou', 'setores passaram')} da jornada de ${hmin(jor)}, somando ${hmin(N.heTot)}; maiores: ${top}.`);
    }
    if (N.semTot) {
      const top = S.filter(saiu).map(s => ({ s: s.s, t: (RS[s.s] || {}).tot || 0 })).filter(x => x.t > 0).sort((a, b) => b.t - a.t).slice(0, 4);
      li.push(`<b>Rota sem coleta:</b> ${km(N.semTot)} da rota programada ficaram sem passagem do caminhão${N.semN ? ` (${km(N.semF)} nos setores que saíram e ${km(N.semN)} nos que não saíram)` : ''}${top.length ? `; mais em ${top.map(x => `${esc(x.s)} (${km(x.t)})`).join(', ')}` : ''}.`);
    }
    const NA = S.reduce((a, s) => a + nat(s), 0), SA = S.filter(s => saiu(s) && nat(s));
    if (NA) li.push(`<b>Viagens ao aterro:</b> ${NA} ${pl(NA, 'viagem', 'viagens')} (${SA.slice().sort((a, b) => nat(b) - nat(a)).map(s => `${esc(s.s)}: ${nat(s)}`).join(', ')}).`);
    if (!li.length) li.push(fechado ? 'Todos os setores programados saíram e foram concluídos.' : 'Turno em andamento: sem ocorrências até agora.');
    B.push({ lista: true, tit: '<h2>Destaques</h2>', itens: li });
    // setores
    const cab = '<tr><th>Setor</th><th>Veículo</th><th class="n">Rastreio</th><th class="n">INLOG</th><th>Situação</th><th class="n">Saída – retorno</th><th class="n">Aterro</th><th class="n">H. extra</th><th class="n">Sem coleta</th></tr>';
    const linhas = S.map(s => {
      const e = extra(s, T, jor), r = RS[s.s];
      return `<tr><td><i style="background:${cor(s)}"></i><b>${esc(s.s)}</b></td><td>${esc((s.veic || []).join(', ') || '—')}</td>
        <td class="n"><b>${saiu(s) ? n0(pg(s)) + '%' : '—'}</b></td><td class="n">${saiu(s) && s.sit !== 'GPS' ? n0(s.pct || 0) + '%' + (s.agd ? `<br><small>agenda ${s.agd.slice(8, 10)}/${s.agd.slice(5, 7)}</small>` : '') : '—'}</td><td>${esc(situ(s))}</td>
        <td class="n">${s.saida || s.volta ? (s.saida || '—') + ' – ' + (s.volta || '—') : '—'}</td>
        <td class="n">${nat(s) || '—'}</td>
        <td class="n">${e ? (e.he ? '<b style="color:#a86f00">' + hmin(e.he) + '</b>' : '0') : '—'}</td>
        <td class="n">${r && r.tot ? km(r.tot) : '—'}</td></tr>`;
    });
    const heObs = T.ini != null ? `Hora extra: tempo fora da garagem antes das ${hora(T.ini)} ou depois das ${hora(T.fim)} (expediente do turno).` : `Hora extra: tempo entre a saída e o retorno à garagem além da jornada de ${hmin(jor)}.`;
    B.push({ tab: true, tit: '<h2>Setores</h2>', cab, linhas, pos: `<div class="ob">Rastreio: parte da rota programada por onde o GPS do caminhão passou coletando (base do status). INLOG: percentual registrado no sistema, só como referência. Finalizada: saiu do setor com 95% ou mais; Incompleta: saiu com menos de 95%. ${heObs} Aterro: viagens ao aterro pelo GPS. Sem coleta: extensão da rota programada sem passagem do caminhão.</div>` });
    // ruas sem coleta: todas, por setor
    const L2 = [];
    S.forEach(s => {
      const r = RS[s.s];
      if (!r || !(r.tot || (r.lista || []).length)) return;
      const l = r.lista || [];
      const desc = r.ns ? 'não saiu · rota inteira sem coleta' : `${esc(situ(s))} · ${n0(pg(s))}%`;
      L2.push(`<tr class="gh"><td colspan="3"><i style="background:${cor(s)}"></i><b>Setor ${esc(s.s)}</b> · ${desc} · ${l.length ? `${l.length} ${pl(l.length, 'rua', 'ruas')} · ` : ''}${km(r.tot)}</td></tr>`);
      if (!l.length) L2.push('<tr><td colspan="3" class="mais">Ruas não identificadas: cadastro de ruas da cidade indisponível.</td></tr>');
      l.forEach(x => L2.push(`<tr><td>${esc(x.r)}</td><td>${esc(x.b || '—')}</td><td class="n">${n0(x.m)} m</td></tr>`));
    });
    if (L2.length) B.push({ tab: true, tit: '<h2>Ruas que ficaram sem coleta</h2><div class="ob" style="margin:-2px 0 6px">Todas as ruas da rota programada com 40 m ou mais sem passagem do caminhão (a mais de 35 m do rastreio GPS), por setor. Setores encerrados; os que não saíram entram com a rota inteira.</div>', cab: '<tr><th>Rua</th><th>Bairro</th><th class="n">Extensão sem coleta</th></tr>', linhas: L2 });
    else if (fechado) B.push({ html: '<h2>Ruas que ficaram sem coleta</h2><div class="ob">Nenhum trecho da rota programada ficou sem passagem do caminhão nos setores encerrados.</div>' });
    // mapas das rotas incompletas: o que ainda falta realizar
    let prim = true;
    S.filter(s => enc(s) && (s.lin || []).length).sort((a, b) => pg(a) - pg(b)).forEach(s => {
      let m = '';
      try { m = mapaFalta(s); } catch (e) { m = ''; }
      if (!m) return;
      const r = RS[s.s];
      B.push({ html: `${prim ? '<h2>Rotas incompletas: o que falta realizar</h2>' : ''}<div style="font-size:12.5px;margin:${prim ? 0 : 4}px 0 5px"><i style="display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:6px;background:${cor(s)}"></i><b>Setor ${esc(s.s)}</b> · ${n0(pg(s))}% pelo rastreio · ${esc((s.veic || []).join(', ') || '—')}${r && r.tot ? ` · <b style="color:#b02a20">falta ${km(r.tot)}</b>` : ''}</div>${m}${LEGF}` });
      prim = false;
    });
    return B;
  }

  // ------------------------------------------------------------ conteúdo em blocos (para paginar)
  function blocos(D, CX, RS, GR, sel) {
    const [y, mo, da] = D.dia.split('-'), wd = WD[new Date(+y, mo - 1, +da).getDay()], data = `${da}/${mo}/${y}`;
    const agora = new Date(), p2 = v => String(v).padStart(2, '0');
    const ger = `${p2(agora.getDate())}/${p2(agora.getMonth() + 1)}/${agora.getFullYear()} ${p2(agora.getHours())}:${p2(agora.getMinutes())}`;
    const todos = D.S, jor = D.jornada || 440, fechadoDia = D.at === 'final', B = [];
    const estado = T => fechadoDia ? 'dia encerrado' : T && T.fechado ? 'turno encerrado' : 'parcial até ' + esc(D.at);
    const fonte = { html: `<div class="ft">Fonte: INLOG (setores e rastreamento GPS dos caminhões) · Torre de Controle · torrelimpagyn.github.io/trindade-coleta</div>` };
    const T1 = GR.find(T => T.k === sel);
    if (T1) {   // um turno só
      B.push({ html: `<div class="tag">Planejamento e Controle</div><h1>Fechamento da coleta domiciliar</h1><div class="cid">${esc(CX.n)}</div>
        <div class="tno">${esc(nomeT(T1))}${T1.ini != null ? ` <small>expediente ${expTxt(T1)}</small>` : ''}</div>
        <div class="sub">${wd}, ${data} · ${estado(T1)} · emitido em ${ger}</div>` });
      secao(T1, D, RS, todos, true).forEach(b => B.push(b));
      B.push(fonte);
      return B;
    }
    // dia completo: resumo por turno e uma seção por turno
    B.push({ html: `<div class="tag">Planejamento e Controle</div><h1>Fechamento da coleta domiciliar</h1><div class="cid">${esc(CX.n)}</div>
      <div class="sub">${wd}, ${data} · ${estado(null)} · emitido em ${ger}</div>` });
    const ND = numeros(todos, null, RS, jor);
    ND.ex = []; ND.hes = []; ND.heTot = 0;
    GR.forEach(T => { const N = numeros(T.S, T, RS, jor); ND.ex.push(...N.ex); ND.hes.push(...N.hes); ND.heTot += N.heTot; T.N = N; });
    ND.heMed = ND.ex.length ? ND.heTot / ND.ex.length : null;
    B.push({ html: `<h2>O dia na cidade</h2>${cartoes(ND, fechadoDia, null)}` });
    const pc = v => v == null ? '—' : n0(v) + '%';
    const lin = GR.map(T => { const N = T.N; return `<tr><td><b>${esc(T.n)}</b>${T.ini != null ? `<br><small>${expTxt(T)}</small>` : ''}</td><td class="n">${T.S.length}</td><td class="n">${N.naos.length || '—'}</td>
      <td class="n"><b>${pc(N.med)}</b></td><td class="n">${pc(N.medg)}</td><td class="n">${N.conc.length}</td><td class="n">${N.baixo.length || '—'}</td><td class="n">${N.inc.length || '—'}</td>
      <td class="n">${N.hes.length ? `<b style="color:#a86f00">${hmin(N.heTot)}</b><br><small>${N.hes.length} ${pl(N.hes.length, 'setor', 'setores')}</small>` : '0'}</td><td class="n">${N.semTot ? `${km(N.semTot)}${N.ruas ? `<br><small>${N.ruas} ${pl(N.ruas, 'rua', 'ruas')}</small>` : ''}` : '—'}</td></tr>`; });
    if (GR.length > 1) lin.push(`<tr class="tt"><td>Dia</td><td class="n">${todos.length}</td><td class="n">${ND.naos.length || '—'}</td><td class="n">${pc(ND.med)}</td><td class="n">${pc(ND.medg)}</td><td class="n">${ND.conc.length}</td><td class="n">${ND.baixo.length || '—'}</td><td class="n">${ND.inc.length || '—'}</td><td class="n">${ND.hes.length ? hmin(ND.heTot) : '0'}</td><td class="n">${ND.semTot ? km(ND.semTot) : '—'}</td></tr>`);
    B.push({ tab: true, tit: '<h2>Fechamento por turno</h2>', cab: '<tr><th>Turno</th><th class="n">Setores</th><th class="n">Não saíram</th><th class="n">Rastreio</th><th class="n">INLOG</th><th class="n">≥ 95%</th><th class="n">&lt; 80%</th><th class="n">Incompletas</th><th class="n">H. extra</th><th class="n">Sem coleta</th></tr>', linhas: lin,
      pos: `<div class="ob">Rastreio (GPS) e INLOG: conclusão média das rotas que saíram; o rastreio é a base. Incompletas: rotas encerradas abaixo de 95% pelo rastreio. ${EXP[CX.s] ? 'O turno de cada setor vem do horário em que o caminhão trabalhou, comparado com o expediente; hora extra é o tempo fora do expediente.' : `Hora extra: além da jornada de ${hmin(jor)}.`} O detalhe de cada turno, com todas as ruas sem coleta, está nas páginas seguintes.</div>` });
    const mini = GR.filter(T => T.k !== 'X').map(T => { const m = mapa(T.S, todos, false); return m ? `<div><div class="mc"><b>${esc(T.n)}</b>${T.ini != null ? ' · ' + expTxt(T) : ''} · ${T.N.med == null ? '—' : n0(T.N.med) + '%'} pelo rastreio</div>${m}</div>` : ''; }).filter(Boolean);
    if (mini.length > 1) B.push({ html: `<h2>Como cada turno encerrou</h2><div class="mm">${mini.join('')}</div>${LEG}` });
    GR.forEach(T => {
      B.push({ quebra: true, ctx: nomeT(T) });
      B.push({ html: `<div class="tsec"><div class="tag">Fechamento por turno</div><div class="tno">${esc(nomeT(T))}${T.ini != null ? ` <small>expediente ${expTxt(T)}</small>` : ''}</div><div class="sub">${esc(CX.n)} · ${wd}, ${data} · ${estado(T)}</div></div>` });
      B.push({ html: cartoes(T.N, T.fechado, T) });
      secao(T, D, RS, todos, false).forEach(b => B.push(b));
    });
    B.push(fonte);
    return B;
  }

  // ------------------------------------------------------------ folhas A4 (794 × 1123 px)
  const ALT = 865;   // altura útil: de 16 mm do topo até acima da logo
  function folha(ctx, n) {
    const f = document.createElement('div'); f.className = 'folha';
    f.innerHTML = `<i class="tb"></i><img class="lgq" src="${LOGO}" alt="Quebec Ambiental">${n > 1 ? `<div class="rh">${esc(ctx)}</div>` : ''}<div class="ct"></div><div class="pn"></div>`;
    return f;
  }
  function paginar(B, alvo, ctx0) {
    const P = [];
    let f, ct, ctx = ctx0;
    const nova = () => { f = folha(ctx, P.length + 1); alvo.appendChild(f); P.push(f); ct = f.querySelector('.ct'); };
    const cabe = () => ct.scrollHeight <= ALT + 1;
    const cont = h => h.replace(/<\/h2>/, ' <small>(continuação)</small></h2>').replace(/<div class="ob"[\s\S]*$/, '');
    nova();
    for (const b of B) {
      if (b.quebra) { if (b.ctx) ctx = ctx0 + ' · ' + b.ctx; if (ct.children.length) nova(); continue; }
      if (b.lista) {   // lista de destaques: quebra entre itens
        const tit = document.createElement('div'); tit.className = 'bl'; tit.innerHTML = b.tit; ct.appendChild(tit);
        let ul = document.createElement('ul'); ul.className = 'dq'; ct.appendChild(ul);
        let ni = 0;
        for (const x of b.itens) {
          ul.insertAdjacentHTML('beforeend', `<li>${x}</li>`); ni++;
          if (cabe()) continue;
          ul.lastElementChild.remove(); ni--;
          if (ni === 0) { tit.remove(); ul.remove(); nova(); ct.appendChild(tit); ct.appendChild(ul); }
          else { nova(); const c = document.createElement('div'); c.className = 'bl cont'; c.innerHTML = cont(b.tit); ct.appendChild(c); ul = document.createElement('ul'); ul.className = 'dq'; ct.appendChild(ul); }
          ul.insertAdjacentHTML('beforeend', `<li>${x}</li>`); ni = 1;
        }
        continue;
      }
      if (!b.tab) {
        const d = document.createElement('div'); d.className = 'bl'; d.innerHTML = b.html; ct.appendChild(d);
        if (!cabe() && ct.children.length > 1) { d.remove(); nova(); ct.appendChild(d); }
        continue;
      }
      // tabela: quebra entre linhas, repete o cabeçalho e o grupo (setor) na folha seguinte
      const tit = document.createElement('div'); tit.className = 'bl'; tit.innerHTML = b.tit; ct.appendChild(tit);
      let t = document.createElement('table'); t.innerHTML = `<thead>${b.cab}</thead><tbody></tbody>`; ct.appendChild(t);
      let tb = t.tBodies[0], nr = 0, gh = null;
      for (const l of b.linhas) {
        const eGh = l.startsWith('<tr class="gh"');
        tb.insertAdjacentHTML('beforeend', l); nr++;
        if (cabe()) { if (eGh) gh = l; continue; }
        tb.lastElementChild.remove(); nr--;
        const leva = [];
        if (!eGh && nr > 0 && tb.lastElementChild && tb.lastElementChild.classList.contains('gh')) { leva.push(tb.lastElementChild.outerHTML); tb.lastElementChild.remove(); nr--; }
        if (nr === 0) { tit.remove(); t.remove(); nova(); ct.appendChild(tit); }
        else { nova(); const c = document.createElement('div'); c.className = 'bl cont'; c.innerHTML = cont(b.tit); ct.appendChild(c); }
        t = document.createElement('table'); t.innerHTML = `<thead>${b.cab}</thead><tbody></tbody>`; ct.appendChild(t);
        tb = t.tBodies[0];
        if (!eGh && !leva.length && gh) leva.push(gh.replace(/<\/td><\/tr>$/, ' <small>(continuação)</small></td></tr>'));
        leva.forEach(h => tb.insertAdjacentHTML('beforeend', h));
        tb.insertAdjacentHTML('beforeend', l); nr = leva.length + 1;
        if (eGh) gh = l;
      }
      if (b.pos) { const d = document.createElement('div'); d.className = 'bl'; d.innerHTML = b.pos; ct.appendChild(d); if (!cabe()) { d.remove(); nova(); ct.appendChild(d); } }
    }
    if (!ct.children.length && P.length > 1) { f.remove(); P.pop(); }
    P.forEach((p, i) => { p.querySelector('.pn').textContent = `Página ${i + 1} de ${P.length}`; });
    return P;
  }

  const CSS = `#rel{position:fixed;inset:0;z-index:60;background:rgba(10,20,15,.94);overflow:auto;-webkit-overflow-scrolling:touch}
#rel .bar2{position:sticky;top:0;z-index:2;display:flex;gap:8px;flex-wrap:wrap;justify-content:center;padding:calc(10px + env(safe-area-inset-top)) 12px 10px;background:#17201b}
#rel .bar2 button{border:0;border-radius:999px;padding:9px 14px;font:inherit;font-weight:700;font-size:14px;background:#2f6b52;color:#fff}#rel .bar2 button.sec2{background:#e9f1ec;color:#14231c}
#rel .tur{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;width:100%;align-items:center;color:#cfe3d8;font-size:13px}
#rel .tur button{background:transparent;border:1.5px solid #5d8f77;color:#e9f1ec;padding:6px 12px;font-size:13px}#rel .tur button.on{background:${VERDE};border-color:${VERDE};color:#14231c}
#rel .msg{color:#cfe3d8;text-align:center;font-size:13px;padding:6px 10px 0}
#rel .esc{padding:14px 0 40px}
#rel .pgs{display:flex;flex-direction:column;align-items:center;gap:14px;background:transparent}
.folha{position:relative;width:794px;height:1123px;background:#fff;color:#1d1d1b;overflow:hidden;box-shadow:0 4px 18px rgba(0,0,0,.35);font:12.5px/1.38 Calibri,Carlito,"Segoe UI",Roboto,Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.folha .tb{position:absolute;left:0;top:0;bottom:0;width:42px;background:${VERDE}}
.folha .lgq{position:absolute;right:38px;bottom:30px;width:138px;height:auto}
.folha .rh{position:absolute;left:113px;right:53px;top:26px;font-size:10.5px;color:#7a7a74;border-bottom:1px solid #e3e3de;padding-bottom:4px}
.folha .pn{position:absolute;left:113px;bottom:30px;font-size:10px;color:#9a9a94}
.folha .ct{position:absolute;left:113px;right:53px;top:60px;height:${ALT}px;overflow:hidden}
.folha .tag{display:inline-block;background:${ESC};color:#fff;font-size:10px;letter-spacing:.06em;text-transform:uppercase;padding:3px 9px;border-radius:3px;margin-bottom:9px}
.folha h1{margin:0;font-size:22px;line-height:1.15;color:${ESC}}
.folha .cid{font-size:27px;font-weight:700;line-height:1.15;color:${ESC};margin:2px 0 3px}
.folha .tno{font-size:21px;font-weight:700;line-height:1.2;color:#1d1d1b;margin:4px 0 2px;padding-left:10px;border-left:5px solid ${VERDE}}.folha .tno small{font-size:13px;font-weight:400;color:#52514e;margin-left:6px}
.folha .tsec .tno{font-size:24px}
.folha .sub{color:#52514e;font-size:12.5px;margin-bottom:12px}
.folha .mm{display:grid;grid-template-columns:1fr 1fr;gap:10px}.folha .mc{font-size:11.5px;color:#52514e;margin-bottom:3px}.folha .mc b{color:#1d1d1b}
.folha h2{font-size:15px;color:${ESC};margin:14px 0 7px}.folha h2 small{font-size:11px;color:#7a7a74;font-weight:400}
.folha .kp{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}
.folha .k{background:#f4f4f1;border-radius:5px;padding:7px 9px}.folha .k b{display:block;font-size:19px;line-height:1.15}.folha .k b small{font-size:12px;color:#52514e;font-weight:400}.folha .k span{display:block;font-size:10.5px;color:#52514e;line-height:1.25;margin-top:2px}
.folha .dq{margin:0;padding-left:17px}.folha .dq li{margin:0 0 4px}
.folha .lg{display:flex;flex-wrap:wrap;gap:12px;font-size:10.5px;color:#52514e;margin-top:6px}.folha .lg i,.folha td i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:5px;vertical-align:-1px}
.folha table{width:100%;border-collapse:collapse;font-size:11.2px}.folha th{background:${ESC};color:#fff;text-align:left;font-weight:700;padding:4px 5px;font-size:10.5px}.folha td{border-bottom:.5px solid #deded8;padding:3.5px 5px;vertical-align:top}
.folha td small{color:#6b6a65;font-size:10px;font-weight:400}
.folha .n{text-align:right;white-space:nowrap}.folha tr.tt td{background:#eef6e6;font-weight:700;color:${ESC}}.folha tr.gh td{background:#eef6e6;color:${ESC};border-top:1px solid #b9c9b0;padding-top:5px}.folha td.mais{color:#7a7a74;font-style:italic}
.folha .ob{font-size:10.5px;color:#6b6a65;margin-top:5px}.folha .ft{font-size:10px;color:#7a7a74;margin-top:14px}
@media print{@page{size:A4;margin:0}html,body{background:#fff!important}body>*:not(#rel){display:none!important}#rel{position:static;background:none;overflow:visible}#rel .bar2,#rel .msg{display:none}#rel .esc{padding:0;zoom:1!important}#rel .pgs{gap:0;display:block}.folha{box-shadow:none;break-after:page;page-break-after:always}.folha:last-child{break-after:auto;page-break-after:auto}}`;

  let lib = null;
  const carregaLib = () => lib || (lib = new Promise((ok, er) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js'; s.integrity = 'sha384-UbfRVKN3/elS1r7JcK2FhmPP+KlJ4CvYwbyYD7tH+uTkbT9bNJr9eJeQ0FoFbAgz'; s.crossOrigin = 'anonymous'; s.onload = () => ok(window.htmlToImage); s.onerror = er; document.head.appendChild(s); }));
  async function imagem() {
    const h = await carregaLib(), es = document.querySelector('#rel .esc'), el = document.querySelector('#rel .pgs'), z = es.style.zoom;
    es.style.zoom = '1';
    try { return await h.toBlob(el, { pixelRatio: 2, backgroundColor: '#e9ece9', width: el.offsetWidth, height: el.offsetHeight, skipFonts: true }); }
    finally { es.style.zoom = z; }
  }

  window.relatorio = async function (D, CX) {
    if (!D || !D.S) return;
    DA = D.aterro || null;
    if (!document.getElementById('relCss')) { const st = document.createElement('style'); st.id = 'relCss'; st.textContent = CSS; document.head.appendChild(st); }
    let el = document.getElementById('rel'); if (el) el.remove();
    el = document.createElement('div'); el.id = 'rel';
    const share = !!(navigator.canShare && navigator.canShare({ files: [new File([''], 'x.png', { type: 'image/png' })] }));
    el.innerHTML = `<div class="bar2"><div class="tur"></div><button id="rlImg">⬇ Baixar imagem</button>${share ? '<button id="rlSh">Compartilhar</button>' : ''}<button id="rlPr" class="sec2">Imprimir / PDF</button><button id="rlX" class="sec2">Fechar</button></div><div class="msg">Preparando o relatório…</div><div class="esc"><div class="pgs"></div></div>`;
    document.body.appendChild(el); document.body.style.overflow = 'hidden';
    const fechar = () => { el.remove(); document.body.style.overflow = ''; window.removeEventListener('resize', ajusta); };
    el.querySelector('#rlX').onclick = fechar;
    const es = el.querySelector('.esc'), pgs = el.querySelector('.pgs');
    const ajusta = () => { es.style.zoom = String(Math.min(1, (el.clientWidth - 16) / 794)); };
    ajusta(); window.addEventListener('resize', ajusta);
    // turnos e ruas sem coleta (setores encerrados; os que não saíram, quando o turno já acabou)
    const GR = grupos(D, CX);
    const pre = CX.p != null ? CX.p : 'c/' + CX.s + '/';
    const R = await consulta(pre);
    RU = R;
    const RS = {};
    GR.forEach(T => T.S.forEach(s => {
      try {
        if (saiu(s) && (D.at === 'final' || stk(s) !== 'ex')) { const r = semColeta(s, R, false); if (r) RS[s.s] = r; }
        else if (!saiu(s) && T.fechado) { const r = semColeta(s, R, true); if (r) RS[s.s] = r; }
      } catch (e) { }
    }));
    const [y, mo, da] = D.dia.split('-');
    let sel = GR.length === 1 ? GR[0].k : '';
    const desenha = () => {
      pgs.innerHTML = '';
      paginar(blocos(D, CX, RS, GR, sel), pgs, `Fechamento da coleta · ${CX.n} · ${da}/${mo}/${y}`);
      el.querySelectorAll('.tur button').forEach(b => b.classList.toggle('on', b.dataset.t === sel));
      el.scrollTop = 0;
    };
    const tur = el.querySelector('.tur');
    const reais = GR.filter(T => T.k !== 'X');
    tur.innerHTML = reais.length > 1 ? `<span>Fechamento:</span><button data-t="">Dia completo</button>${reais.map(T => `<button data-t="${esc(T.k)}">${esc(T.n)}${T.ini != null ? ' · ' + expTxt(T) : ''}</button>`).join('')}` : '';
    tur.querySelectorAll('button').forEach(b => { b.onclick = () => { sel = b.dataset.t; desenha(); }; });
    desenha();
    el.querySelector('.msg').remove();
    const nome = () => `fechamento-${CX.s}-${D.dia}${sel ? '-' + slug((GR.find(T => T.k === sel) || {}).n || sel) : ''}.png`;
    const prontas = () => Promise.all([...el.querySelectorAll('.pgs img')].map(i => i.complete ? 0 : new Promise(ok => { i.addEventListener('load', ok); i.addEventListener('error', ok); setTimeout(ok, 10000); })));   // mapas carregados
    el.querySelector('#rlPr').onclick = async () => { await prontas(); window.print(); };
    const ocupado = (b, f) => async () => { const t = b.textContent; b.disabled = true; b.textContent = 'Gerando…'; try { await f(); b.textContent = t; } catch (e) { b.textContent = 'Erro ao gerar'; setTimeout(() => { b.textContent = t; }, 4000); } b.disabled = false; };
    const bi = el.querySelector('#rlImg');
    bi.onclick = ocupado(bi, async () => { await prontas(); const b = await imagem(); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = nome(); document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); });
    const bs = el.querySelector('#rlSh');
    if (bs) bs.onclick = ocupado(bs, async () => { await prontas(); const b = await imagem(); const f = new File([b], nome(), { type: 'image/png' }); try { await navigator.share({ files: [f], title: `Fechamento da coleta · ${CX.n}` }); } catch (e) { if (e.name !== 'AbortError') throw e; } });
    carregaLib().catch(() => {});
  };
})();
