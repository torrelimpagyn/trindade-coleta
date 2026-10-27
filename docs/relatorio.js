// Relatório do fechamento do dia (uma cidade), no papel timbrado da Quebec Ambiental (Planejamento e Controle).
// Folhas A4 com a barra verde e a logo; baixa como imagem, compartilha ou imprime/salva em PDF.
// Usa os dados do dia abertos no painel (D) e, quando existem, as funções do index.html (stEnc, encerrou, peTxt, SIT, TLAB).
(function () {
  const LOGO = 'data:image/webp;base64,' +
    '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';
  const VERDE = '#8DC62B', ESC = '#1f5f45';
  const WD = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const n0 = (v, d = 0) => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const min = t => { if (!t) return null; const [h, m] = String(t).split(':').map(Number); return isNaN(h) ? null : h * 60 + (m || 0); };
  const hmin = m => { if (m == null) return '—'; m = Math.round(m); return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`; };
  const km = m => m >= 1000 ? n0(m / 1000, 1) + ' km' : n0(m) + ' m';
  const saiu = s => s.sit !== 'AGUARDANDO' || s.pct;
  const pg = s => s.sit === 'GPS' ? (s.pgps || 0) : s.pct;
  const cor = s => !saiu(s) ? '#c9d0cc' : s.sit === 'GPS' ? '#6f95e8' : pg(s) >= 90 ? '#4fb37f' : pg(s) >= 70 ? '#e9b44c' : '#e06b62';
  const situ = s => {
    if (typeof stEnc === 'function' && s.sit === 'EXECUTADO' && s.pct < 90) return stEnc(s)[0];
    return (typeof SIT !== 'undefined' && SIT[s.sit] ? SIT[s.sit][0] : s.sit);
  };
  const enc = s => typeof encerrou === 'function' ? encerrou(s) : (s.sit === 'EXECUTADO' && s.pct < 90);
  const tlab = t => (typeof TLAB !== 'undefined' && TLAB[t]) || t || 'Outros';
  const depois = s => typeof peTxt === 'function' && s.pe ? peTxt(s) : '';
  function extra(s, jor) {   // tempo fora da garagem além da jornada
    const a = min(s.saida), b = min(s.volta);
    if (a == null || b == null) return null;
    let d = b - a; if (d < 0) d += 1440;
    return { dur: d, he: Math.max(0, d - jor) };
  }

  // ------------------------------------------------------------ ruas sem coleta (rota programada × GPS)
  const dec = t => { const v = t ? t.split(',').map(x => parseInt(x, 36)) : [], o = []; let a = 0, b = 0; for (let i = 0; i + 1 < v.length; i += 2) { a += v[i]; b += v[i + 1]; o.push([a / 1e5, b / 1e5]); } return o; };
  const CONS = {};
  const consulta = pre => CONS[pre] || (CONS[pre] = fetch(pre + 'consulta_dados.json?t=' + Math.floor(Date.now() / 36e5)).then(r => r.ok ? r.json() : null).then(c => c && indice(c)).catch(() => null));
  function indice(c) {   // ruas da consulta de endereços, amostradas a cada 15 m numa grade de ~33 m
    const C = Math.cos(-16 * Math.PI / 180), cel = new Map(), K = .0003;
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
  function semColeta(s, R) {
    if ((s.nf || []).length) return { lista: s.nf.map(x => ({ r: x[0], b: x[1], m: x[2] })), tot: s.nfm || s.nf.reduce((a, x) => a + x[2], 0), fonte: 'gps' };
    if (!(s.lin || []).length || !(s.gps || []).length) return s.nfm ? { lista: [], tot: s.nfm, fonte: 'gps' } : null;
    const C = Math.cos(((s.lin[0][1][0] || [-16])[0]) * Math.PI / 180), xy = p => [p[1] * 111320 * C, p[0] * 110574], G = new Map(), T = 25;
    s.gps.forEach(g => {
      const P = dec(g[3]).map(xy);
      for (let j = 0; j + 1 < P.length; j++) {
        const a = P[j], b = P[j + 1], d = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (d > 1500) continue;   // buraco no rastreio
        const n = Math.max(1, Math.ceil(d / 10));
        for (let k = 0; k <= n; k++) { const q = [a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n], key = Math.floor(q[0] / T) + '_' + Math.floor(q[1] / T); (G.get(key) || G.set(key, []).get(key)).push(q); }
      }
    });
    const perto = q => { const cx = Math.floor(q[0] / T), cy = Math.floor(q[1] / T); for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const L = G.get((cx + i) + '_' + (cy + j)); if (L) for (const p of L) if (Math.hypot(p[0] - q[0], p[1] - q[1]) <= T) return true; } return false; };
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
    const lista = [...acc].filter(([i, m]) => m >= 40).map(([i, m]) => ({ r: i >= 0 ? R.ruas[i][0] : '(trecho sem nome)', b: i >= 0 ? R.ruas[i][1] : '', m: Math.round(m) })).sort((a, b) => b.m - a.m);
    return { lista, tot: Math.round(tot), fonte: 'rota' };
  }

  // ------------------------------------------------------------ mapa
  function mapa(S) {
    const P = S.filter(s => (s.ring || []).length);
    const pts = P.flatMap(s => s.ring.flat());
    if (!pts.length) return '';
    const la0 = Math.min(...pts.map(p => p[0])), la1 = Math.max(...pts.map(p => p[0]));
    const lo0 = Math.min(...pts.map(p => p[1])), lo1 = Math.max(...pts.map(p => p[1]));
    const k = Math.cos((la0 + la1) / 2 * Math.PI / 180), W = 700, H = 380, pad = 12;
    const sx = (W - 2 * pad) / Math.max(1e-6, (lo1 - lo0) * k), sy = (H - 2 * pad) / Math.max(1e-6, la1 - la0), sc = Math.min(sx, sy);
    const ox = (W - (lo1 - lo0) * k * sc) / 2, oy = (H - (la1 - la0) * sc) / 2;
    const X = lo => ox + (lo - lo0) * k * sc, Y = la => oy + (la1 - la) * sc;
    let g = '', t = '';
    P.forEach(s => {
      s.ring.forEach(r => { g += `<polygon points="${r.map(p => X(p[1]).toFixed(1) + ',' + Y(p[0]).toFixed(1)).join(' ')}" fill="${cor(s)}" fill-opacity=".75" stroke="#fff" stroke-width="1.4"/>`; });
      const r0 = s.ring.reduce((a, r) => r.length > a.length ? r : a, []);
      const cx = X(r0.reduce((a, p) => a + p[1], 0) / r0.length), cy = Y(r0.reduce((a, p) => a + p[0], 0) / r0.length);
      const lx = r0.map(p => X(p[1])), ly = r0.map(p => Y(p[0])), grande = Math.max(...lx) - Math.min(...lx) > 46 && Math.max(...ly) - Math.min(...ly) > 30;
      t += `<text x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" text-anchor="middle" font-size="${grande ? 11 : 9}" font-weight="700" fill="#14231c" stroke="#fff" stroke-width="3" paint-order="stroke">${esc(s.s)}${grande ? `<tspan x="${cx.toFixed(1)}" dy="12" font-size="10" font-weight="600">${saiu(s) ? n0(pg(s)) + '%' : '—'}</tspan>` : ''}</text>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block;background:#f3f6f4;border-radius:6px">${g}${t}</svg>`;
  }

  // ------------------------------------------------------------ conteúdo em blocos (para paginar)
  function blocos(D, CX, RS) {
    const S = [...D.S].sort((a, b) => String(a.s).localeCompare(String(b.s), 'pt-BR', { numeric: true }));
    const jor = D.jornada || 440, fechado = D.at === 'final';
    const F = S.filter(saiu), naos = S.filter(s => !saiu(s));
    const med = F.length ? F.reduce((a, s) => a + s.pct, 0) / F.length : 0;
    const comG = F.filter(s => s.pgps != null), medg = comG.length ? comG.reduce((a, s) => a + s.pgps, 0) / comG.length : null;
    const conc = F.filter(s => pg(s) >= 90), baixo = F.filter(s => pg(s) < 70), inc = S.filter(enc);
    const ex = S.map(s => ({ s, e: extra(s, jor) })).filter(x => x.e), hes = ex.filter(x => x.e.he > 0);
    const heTot = hes.reduce((a, x) => a + x.e.he, 0), heMed = ex.length ? heTot / ex.length : null;
    const kmr = S.reduce((a, s) => a + (s.dist || 0), 0);
    const semTot = S.reduce((a, s) => a + ((RS[s.s] || {}).tot || 0), 0);
    const ruas = S.flatMap(s => ((RS[s.s] || {}).lista || []).map(r => ({ ...r, s: s.s })));
    const [y, mo, da] = D.dia.split('-'), wd = WD[new Date(+y, mo - 1, +da).getDay()];
    const agora = new Date(), p2 = v => String(v).padStart(2, '0');
    const ger = `${p2(agora.getDate())}/${p2(agora.getMonth() + 1)}/${agora.getFullYear()} ${p2(agora.getHours())}:${p2(agora.getMinutes())}`;
    const B = [];
    const kpi = (v, l, c) => `<div class="k"><b${c ? ` style="color:${c}"` : ''}>${v}</b><span>${l}</span></div>`;
    B.push({ html: `<div class="tag">Planejamento e Controle</div><h1>Fechamento da coleta domiciliar</h1><div class="cid">${esc(CX.n)}</div>
      <div class="sub">${wd}, ${da}/${mo}/${y} · ${fechado ? 'dia encerrado' : 'parcial até ' + esc(D.at)} · emitido em ${ger}</div>` });
    B.push({ html: `<div class="kp">
      ${kpi(n0(med) + '%', 'conclusão média (INLOG)', med >= 90 ? '#1d7a4f' : med >= 70 ? '#a86f00' : '#c9302c')}
      ${kpi(medg == null ? '—' : n0(medg) + '%', 'conclusão média (GPS)', '#2a5bd7')}
      ${kpi(`${conc.length}<small> de ${F.length}</small>`, 'setores com 90% ou mais')}
      ${kpi(baixo.length, 'setores abaixo de 70%', baixo.length ? '#c9302c' : null)}
      ${kpi(inc.length, 'encerrados sem concluir', inc.length ? '#c9302c' : null)}
      ${kpi(naos.length, fechado ? 'setores que não saíram' : 'aguardando saída', naos.length && fechado ? '#c9302c' : null)}
      ${kpi(heMed == null ? '—' : hmin(heMed), `hora extra média por setor${hes.length ? ` · total ${hmin(heTot)}` : ''}`, heMed ? '#a86f00' : null)}
      ${kpi(semTot ? km(semTot) : '—', `de rota sem coleta${ruas.length ? ` · ${ruas.length} rua${ruas.length > 1 ? 's' : ''}` : ''}`, semTot ? '#c9302c' : null)}
    </div>` });
    B.push({ html: `<h2>Como a cidade encerrou</h2>${mapa(S)}<div class="lg"><span><i style="background:#4fb37f"></i>90% ou mais</span><span><i style="background:#e9b44c"></i>70 a 89%</span><span><i style="background:#e06b62"></i>abaixo de 70%</span><span><i style="background:#6f95e8"></i>só GPS</span><span><i style="background:#c9d0cc"></i>não saiu</span></div>` });
    // destaques
    const li = [];
    if (fechado && naos.length) li.push(`<b>${naos.length} setor${naos.length > 1 ? 'es' : ''} não ${naos.length > 1 ? 'saíram' : 'saiu'}:</b> ${naos.map(s => esc(s.s)).join(', ')}.`);
    if (inc.length) li.push(`<b>${inc.length} encerrado${inc.length > 1 ? 's' : ''} sem concluir:</b> ${inc.map(s => `${esc(s.s)} (${n0(s.pct)}%${depois(s) ? ', ' + esc(depois(s)) : ''})`).join('; ')}.`);
    const ap = S.filter(s => s.sit === 'EXECUTADO' && s.pct < 90 && !enc(s) && s.pe);
    if (ap.length) li.push(`<b>Fechados abaixo de 90% com justificativa no GPS:</b> ${ap.map(s => `${esc(s.s)} (${n0(s.pct)}%, ${esc(depois(s))})`).join('; ')}.`);
    if (baixo.length) li.push(`<b>Abaixo de 70%:</b> ${baixo.sort((a, b) => pg(a) - pg(b)).map(s => `${esc(s.s)} (${n0(pg(s))}%)`).join(', ')}.`);
    const gpsSo = S.filter(s => s.sit === 'GPS');
    if (gpsSo.length) li.push(`<b>Coletados sem registro na INLOG (só GPS):</b> ${gpsSo.map(s => `${esc(s.s)} (${n0(s.pgps || 0)}%)`).join(', ')}.`);
    if (hes.length) li.push(`<b>Hora extra:</b> ${hes.length} setor${hes.length > 1 ? 'es' : ''} passaram da jornada de ${hmin(jor)}, somando ${hmin(heTot)}; maiores: ${hes.sort((a, b) => b.e.he - a.e.he).slice(0, 4).map(x => `${esc(x.s.s)} (${hmin(x.e.he)})`).join(', ')}.`);
    if (semTot) {
      const top = S.map(s => ({ s: s.s, t: (RS[s.s] || {}).tot || 0 })).filter(x => x.t > 0).sort((a, b) => b.t - a.t).slice(0, 4);
      li.push(`<b>Rota sem coleta:</b> ${km(semTot)} da rota programada ficaram sem passagem do caminhão${top.length ? `; mais em ${top.map(x => `${esc(x.s)} (${km(x.t)})`).join(', ')}` : ''}.`);
    }
    if (!li.length) li.push('Todos os setores programados saíram e foram concluídos.');
    B.push({ lista: true, tit: '<h2>Destaques do dia</h2>', itens: li });
    // tabela de setores
    const cab = '<tr><th>Setor</th><th>Veículo</th><th class="n">INLOG</th><th class="n">GPS</th><th>Situação</th><th class="n">Saída – retorno</th><th class="n">H. extra</th><th class="n">Sem coleta</th></tr>';
    const linhas = [];
    const turnos = [...new Set(S.map(s => s.turno || 'OUTROS'))];
    turnos.forEach(t => {
      const L = S.filter(s => (s.turno || 'OUTROS') === t);
      if (turnos.length > 1) linhas.push(`<tr class="tt"><td colspan="8">${esc(tlab(t))} · ${L.length} setor${L.length > 1 ? 'es' : ''}</td></tr>`);
      L.forEach(s => {
        const e = extra(s, jor), r = RS[s.s];
        linhas.push(`<tr><td><i style="background:${cor(s)}"></i><b>${esc(s.s)}</b></td><td>${esc((s.veic || []).join(', ') || '—')}</td>
          <td class="n">${saiu(s) ? n0(s.pct) + '%' : '—'}</td><td class="n">${s.pgps != null ? n0(s.pgps) + '%' : '—'}</td><td>${esc(situ(s))}</td>
          <td class="n">${s.saida || s.volta ? (s.saida || '—') + ' – ' + (s.volta || '—') : '—'}</td>
          <td class="n">${e ? (e.he ? '<b style="color:#a86f00">' + hmin(e.he) + '</b>' : '0') : '—'}</td>
          <td class="n">${r && r.tot ? km(r.tot) : '—'}</td></tr>`);
      });
    });
    B.push({ tab: true, tit: '<h2>Setores</h2>', cab, linhas, pos: `<div class="ob">INLOG: percentual registrado no sistema. GPS: parte da rota programada por onde o caminhão passou. Hora extra: tempo entre a saída e o retorno à garagem além da jornada de ${hmin(jor)}. Sem coleta: extensão da rota programada sem passagem do caminhão.</div>` });
    // ruas sem coleta
    if (ruas.length) {
      const L2 = [];
      S.forEach(s => {
        const l = (RS[s.s] || {}).lista || [];
        if (!l.length) return;
        l.slice(0, 15).forEach((r, i) => L2.push(`<tr${i === 0 ? ' class="g1"' : ''}><td>${i === 0 ? '<b>' + esc(s.s) + '</b>' : '<span style="color:#9a9a94">' + esc(s.s) + '</span>'}</td><td>${esc(r.r)}</td><td>${esc(r.b || '—')}</td><td class="n">${n0(r.m)} m</td></tr>`));
        if (l.length > 15) L2.push(`<tr><td></td><td colspan="3" class="mais">+ ${l.length - 15} rua${l.length - 15 > 1 ? 's' : ''} com trechos menores (${km(l.slice(15).reduce((a, r) => a + r.m, 0))})</td></tr>`);
      });
      B.push({ tab: true, tit: '<h2>Ruas que ficaram sem coleta</h2><div class="ob" style="margin:-2px 0 6px">Trechos da rota programada de cada setor por onde o caminhão não passou (a mais de 25 m do rastreio GPS), agrupados por rua. Só setores já encerrados.</div>',
        cab: '<tr><th>Setor</th><th>Rua</th><th>Bairro</th><th class="n">Extensão sem coleta</th></tr>', linhas: L2 });
    } else if (semTot === 0 && fechado) {
      B.push({ html: '<h2>Ruas que ficaram sem coleta</h2><div class="ob">Nenhum trecho da rota programada ficou sem passagem do caminhão nos setores encerrados.</div>' });
    }
    B.push({ html: `<div class="ft">Fonte: INLOG (setores e rastreamento GPS dos caminhões) · Torre de Controle · torrelimpagyn.github.io/trindade-coleta</div>` });
    return B;
  }

  // ------------------------------------------------------------ folhas A4 (794 × 1123 px)
  const ALT = 865;   // altura útil: de 16 mm do topo até acima da logo
  function folha(ctx, n) {
    const f = document.createElement('div'); f.className = 'folha';
    f.innerHTML = `<i class="tb"></i><img class="lgq" src="${LOGO}" alt="Quebec Ambiental">${n > 1 ? `<div class="rh">Fechamento da coleta · ${esc(ctx)}</div>` : ''}<div class="ct"></div><div class="pn"></div>`;
    return f;
  }
  function paginar(B, alvo, ctx) {
    const P = [];
    let f, ct;
    const nova = () => { f = folha(ctx, P.length + 1); alvo.appendChild(f); P.push(f); ct = f.querySelector('.ct'); };
    const cabe = () => ct.scrollHeight <= ALT + 1;
    nova();
    for (const b of B) {
      if (b.lista) {   // lista de destaques: quebra entre itens
        const tit = document.createElement('div'); tit.className = 'bl'; tit.innerHTML = b.tit; ct.appendChild(tit);
        let ul = document.createElement('ul'); ul.className = 'dq'; ct.appendChild(ul);
        let ni = 0;
        for (const x of b.itens) {
          ul.insertAdjacentHTML('beforeend', `<li>${x}</li>`); ni++;
          if (cabe()) continue;
          ul.lastElementChild.remove(); ni--;
          if (ni === 0) { tit.remove(); ul.remove(); nova(); ct.appendChild(tit); ct.appendChild(ul); }
          else { nova(); const c = document.createElement('div'); c.className = 'bl cont'; c.innerHTML = b.tit.replace(/<\/h2>/, ' <small>(continuação)</small></h2>'); ct.appendChild(c); ul = document.createElement('ul'); ul.className = 'dq'; ct.appendChild(ul); }
          ul.insertAdjacentHTML('beforeend', `<li>${x}</li>`); ni = 1;
        }
        continue;
      }
      if (!b.tab) {
        const d = document.createElement('div'); d.className = 'bl'; d.innerHTML = b.html; ct.appendChild(d);
        if (!cabe() && ct.children.length > 1) { d.remove(); nova(); ct.appendChild(d); }
        continue;
      }
      let tit = document.createElement('div'); tit.className = 'bl'; tit.innerHTML = b.tit; ct.appendChild(tit);
      let t = document.createElement('table'); t.innerHTML = `<thead>${b.cab}</thead><tbody></tbody>`; ct.appendChild(t);
      let tb = t.tBodies[0], nr = 0;
      for (const l of b.linhas) {
        tb.insertAdjacentHTML('beforeend', l); nr++;
        if (!cabe()) {
          tb.lastElementChild.remove(); nr--;
          if (nr === 0) { tit.remove(); t.remove(); }
          nova();
          if (nr === 0) { ct.appendChild(tit); }
          else { const c = document.createElement('div'); c.className = 'bl cont'; c.innerHTML = b.tit.replace(/<\/h2>/, ' <small>(continuação)</small></h2>').replace(/<div class="ob"[\s\S]*$/, ''); ct.appendChild(c); }
          t = document.createElement('table'); t.innerHTML = `<thead>${b.cab}</thead><tbody></tbody>`; ct.appendChild(t);
          tb = t.tBodies[0]; tb.insertAdjacentHTML('beforeend', l); nr = 1;
        }
      }
      if (b.pos) { const d = document.createElement('div'); d.className = 'bl'; d.innerHTML = b.pos; ct.appendChild(d); if (!cabe()) { d.remove(); nova(); ct.appendChild(d); } }
    }
    P.forEach((p, i) => { p.querySelector('.pn').textContent = `Página ${i + 1} de ${P.length}`; });
    return P;
  }

  const CSS = `#rel{position:fixed;inset:0;z-index:60;background:rgba(10,20,15,.94);overflow:auto;-webkit-overflow-scrolling:touch}
#rel .bar2{position:sticky;top:0;z-index:2;display:flex;gap:8px;flex-wrap:wrap;justify-content:center;padding:calc(10px + env(safe-area-inset-top)) 12px 10px;background:#17201b}
#rel .bar2 button{border:0;border-radius:999px;padding:9px 14px;font:inherit;font-weight:700;font-size:14px;background:#2f6b52;color:#fff}#rel .bar2 button.sec2{background:#e9f1ec;color:#14231c}
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
.folha .sub{color:#52514e;font-size:12.5px;margin-bottom:12px}
.folha h2{font-size:15px;color:${ESC};margin:14px 0 7px}.folha h2 small{font-size:11px;color:#7a7a74;font-weight:400}
.folha .kp{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}
.folha .k{background:#f4f4f1;border-radius:5px;padding:7px 9px}.folha .k b{display:block;font-size:19px;line-height:1.15}.folha .k b small{font-size:12px;color:#52514e;font-weight:400}.folha .k span{display:block;font-size:10.5px;color:#52514e;line-height:1.25;margin-top:2px}
.folha .dq{margin:0;padding-left:17px}.folha .dq li{margin:0 0 4px}
.folha .lg{display:flex;flex-wrap:wrap;gap:12px;font-size:10.5px;color:#52514e;margin-top:6px}.folha .lg i,.folha td i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:5px;vertical-align:-1px}
.folha table{width:100%;border-collapse:collapse;font-size:11.2px}.folha th{background:${ESC};color:#fff;text-align:left;font-weight:700;padding:4px 5px;font-size:10.5px}.folha td{border-bottom:.5px solid #deded8;padding:3.5px 5px;vertical-align:top}
.folha .n{text-align:right;white-space:nowrap}.folha tr.tt td{background:#eef6e6;font-weight:700;color:${ESC}}.folha tr.g1 td{border-top:1px solid #b9c9b0}.folha td.mais{color:#7a7a74;font-style:italic}
.folha .ob{font-size:10.5px;color:#6b6a65;margin-top:5px}.folha .ft{font-size:10px;color:#7a7a74;margin-top:14px}
@media print{@page{size:A4;margin:0}html,body{background:#fff!important}body>*:not(#rel){display:none!important}#rel{position:static;background:none;overflow:visible}#rel .bar2,#rel .msg{display:none}#rel .esc{padding:0;zoom:1!important}#rel .pgs{gap:0;display:block}.folha{box-shadow:none;break-after:page;page-break-after:always}.folha:last-child{break-after:auto;page-break-after:auto}}`;

  let lib = null;
  const carregaLib = () => lib || (lib = new Promise((ok, er) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js'; s.onload = () => ok(window.htmlToImage); s.onerror = er; document.head.appendChild(s); }));
  async function imagem() {
    const h = await carregaLib(), es = document.querySelector('#rel .esc'), el = document.querySelector('#rel .pgs'), z = es.style.zoom;
    es.style.zoom = '1';
    try { return await h.toBlob(el, { pixelRatio: 2, backgroundColor: '#e9ece9', width: el.offsetWidth, height: el.offsetHeight, skipFonts: true }); }
    finally { es.style.zoom = z; }
  }
  const nome = (D, CX) => `fechamento-${CX.s}-${D.dia}.png`;

  window.relatorio = async function (D, CX) {
    if (!D || !D.S) return;
    if (!document.getElementById('relCss')) { const st = document.createElement('style'); st.id = 'relCss'; st.textContent = CSS; document.head.appendChild(st); }
    let el = document.getElementById('rel'); if (el) el.remove();
    el = document.createElement('div'); el.id = 'rel';
    const share = !!(navigator.canShare && navigator.canShare({ files: [new File([''], 'x.png', { type: 'image/png' })] }));
    el.innerHTML = `<div class="bar2"><button id="rlImg">⬇ Baixar imagem</button>${share ? '<button id="rlSh">Compartilhar</button>' : ''}<button id="rlPr" class="sec2">Imprimir / PDF</button><button id="rlX" class="sec2">Fechar</button></div><div class="msg">Preparando o relatório…</div><div class="esc"><div class="pgs"></div></div>`;
    document.body.appendChild(el); document.body.style.overflow = 'hidden';
    const fechar = () => { el.remove(); document.body.style.overflow = ''; window.removeEventListener('resize', ajusta); };
    el.querySelector('#rlX').onclick = fechar;
    const es = el.querySelector('.esc'), pgs = el.querySelector('.pgs');
    const ajusta = () => { es.style.zoom = String(Math.min(1, (el.clientWidth - 16) / 794)); };
    ajusta(); window.addEventListener('resize', ajusta);
    // ruas sem coleta: setores encerrados (ou dia encerrado)
    const pre = CX.p != null ? CX.p : 'c/' + CX.s + '/';
    const R = await consulta(pre);
    const RS = {};
    D.S.forEach(s => { if (saiu(s) && (D.at === 'final' || !['ATIVO', 'AGUARDANDO'].includes(s.sit))) { try { const r = semColeta(s, R); if (r) RS[s.s] = r; } catch (e) { } } });
    const [y, mo, da] = D.dia.split('-');
    paginar(blocos(D, CX, RS), pgs, `${CX.n} · ${da}/${mo}/${y}`);
    el.querySelector('.msg').remove();
    el.querySelector('#rlPr').onclick = () => window.print();
    const ocupado = (b, f) => async () => { const t = b.textContent; b.disabled = true; b.textContent = 'Gerando…'; try { await f(); b.textContent = t; } catch (e) { b.textContent = 'Erro ao gerar'; setTimeout(() => { b.textContent = t; }, 4000); } b.disabled = false; };
    const bi = el.querySelector('#rlImg');
    bi.onclick = ocupado(bi, async () => { const b = await imagem(); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = nome(D, CX); document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); });
    const bs = el.querySelector('#rlSh');
    if (bs) bs.onclick = ocupado(bs, async () => { const b = await imagem(); const f = new File([b], nome(D, CX), { type: 'image/png' }); try { await navigator.share({ files: [f], title: `Fechamento da coleta · ${CX.n}` }); } catch (e) { if (e.name !== 'AbortError') throw e; } });
    carregaLib().catch(() => {});
  };
})();
