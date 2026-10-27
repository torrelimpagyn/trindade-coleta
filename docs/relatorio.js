// Relatório sintético do fechamento do dia (uma cidade): para baixar como imagem, compartilhar ou imprimir.
// Usa os dados do dia já abertos no painel (D) e as funções do index.html (stEnc, encerrou, SIT, TLAB, tno, nf).
(function () {
  const WD = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const n0 = (v, d = 0) => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const min = t => { if (!t) return null; const [h, m] = String(t).split(':').map(Number); return isNaN(h) ? null : h * 60 + (m || 0); };
  const hmin = m => { if (m == null) return '—'; m = Math.round(m); return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`; };
  const saiu = s => s.sit !== 'AGUARDANDO' || s.pct;
  const pg = s => s.sit === 'GPS' ? (s.pgps || 0) : s.pct;
  const cor = s => !saiu(s) ? '#c9d0cc' : s.sit === 'GPS' ? '#6f95e8' : pg(s) >= 90 ? '#4fb37f' : pg(s) >= 70 ? '#e9b44c' : '#e06b62';
  const situ = s => {
    if (typeof stEnc === 'function' && s.sit === 'EXECUTADO' && s.pct < 90) return stEnc(s)[0];
    return (typeof SIT !== 'undefined' && SIT[s.sit] ? SIT[s.sit][0] : s.sit);
  };
  const enc = s => typeof encerrou === 'function' ? encerrou(s) : (s.sit === 'EXECUTADO' && s.pct < 90);
  const tlab = t => (typeof TLAB !== 'undefined' && TLAB[t]) || t || 'Outros';
  // tempo fora da garagem além da jornada
  function extra(s, jor) {
    const a = min(s.saida), b = min(s.volta);
    if (a == null || b == null) return null;
    let d = b - a; if (d < 0) d += 1440;
    return { dur: d, he: Math.max(0, d - jor) };
  }

  function mapa(S) {
    const P = S.filter(s => (s.ring || []).length);
    const pts = P.flatMap(s => s.ring.flat());
    if (!pts.length) return '';
    const la0 = Math.min(...pts.map(p => p[0])), la1 = Math.max(...pts.map(p => p[0]));
    const lo0 = Math.min(...pts.map(p => p[1])), lo1 = Math.max(...pts.map(p => p[1]));
    const k = Math.cos((la0 + la1) / 2 * Math.PI / 180), W = 700, H = 360, pad = 14;
    const sx = (W - 2 * pad) / Math.max(1e-6, (lo1 - lo0) * k), sy = (H - 2 * pad) / Math.max(1e-6, la1 - la0), sc = Math.min(sx, sy);
    const ox = (W - (lo1 - lo0) * k * sc) / 2, oy = (H - (la1 - la0) * sc) / 2;
    const X = lo => ox + (lo - lo0) * k * sc, Y = la => oy + (la1 - la) * sc;
    let g = '', t = '';
    P.forEach(s => {
      s.ring.forEach(r => { g += `<polygon points="${r.map(p => X(p[1]).toFixed(1) + ',' + Y(p[0]).toFixed(1)).join(' ')}" fill="${cor(s)}" fill-opacity=".72" stroke="#fff" stroke-width="1.4"/>`; });
      const r0 = s.ring.reduce((a, r) => r.length > a.length ? r : a, []);
      const cx = X(r0.reduce((a, p) => a + p[1], 0) / r0.length), cy = Y(r0.reduce((a, p) => a + p[0], 0) / r0.length);
      const lx = r0.map(p => X(p[1])), ly = r0.map(p => Y(p[0])), grande = Math.max(...lx) - Math.min(...lx) > 46 && Math.max(...ly) - Math.min(...ly) > 30;
      t += `<text x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" text-anchor="middle" font-size="${grande ? 11 : 9}" font-weight="700" fill="#14231c" stroke="#fff" stroke-width="3" paint-order="stroke">${esc(s.s)}${grande ? `<tspan x="${cx.toFixed(1)}" dy="12" font-size="10" font-weight="600">${saiu(s) ? n0(pg(s)) + '%' : '—'}</tspan>` : ''}</text>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block;background:#f3f6f4;border-radius:10px">${g}${t}</svg>`;
  }

  function montar(D, CX) {
    const S = [...D.S].sort((a, b) => String(a.s).localeCompare(String(b.s), 'pt-BR', { numeric: true }));
    const jor = D.jornada || 440;
    const F = S.filter(saiu), naos = S.filter(s => !saiu(s));
    const med = F.length ? F.reduce((a, s) => a + s.pct, 0) / F.length : 0;
    const medg = F.length ? F.reduce((a, s) => a + (s.pgps ?? s.pct), 0) / F.length : 0;
    const conc = F.filter(s => pg(s) >= 90).length, inc = S.filter(enc).length;
    const ex = S.map(s => extra(s, jor)).filter(Boolean), hes = ex.filter(e => e.he > 0);
    const heMed = ex.length ? ex.reduce((a, e) => a + e.he, 0) / ex.length : null;
    const km = S.reduce((a, s) => a + (s.dist || 0), 0);
    const nfm = S.reduce((a, s) => a + (s.nfm || 0), 0);
    const ruas = S.flatMap(s => (s.nf || []).map(r => ({ r: r[0], b: r[1], m: r[2], s: s.s }))).sort((a, b) => b.m - a.m);
    const [y, mo, da] = D.dia.split('-'), wd = WD[new Date(+y, mo - 1, +da).getDay()];
    const agora = new Date(), ger = `${String(agora.getDate()).padStart(2, '0')}/${String(agora.getMonth() + 1).padStart(2, '0')} ${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;
    const kpi = (v, l, c) => `<div class="k"><b${c ? ` style="color:${c}"` : ''}>${v}</b><span>${l}</span></div>`;
    const turnos = [...new Set(S.map(s => s.turno || 'OUTROS'))];
    const linha = s => {
      const e = extra(s, jor);
      return `<tr><td><i style="background:${cor(s)}"></i><b>${esc(s.s)}</b></td><td>${esc((s.veic || []).join(', ') || '—')}</td>
        <td class="n">${saiu(s) ? n0(s.pct) + '%' : '—'}</td><td class="n">${s.pgps != null ? n0(s.pgps) + '%' : '—'}</td>
        <td>${esc(situ(s))}</td><td class="n">${s.saida || s.volta ? (s.saida || '—') + ' – ' + (s.volta || '—') : '—'}</td><td class="n">${e ? (e.he ? '<b style="color:#b7791f">' + hmin(e.he) + '</b>' : '0') : '—'}</td></tr>`;
    };
    const tabela = turnos.map(t => {
      const L = S.filter(s => (s.turno || 'OUTROS') === t);
      return `${turnos.length > 1 ? `<tr class="tt"><td colspan="7">${esc(tlab(t))} · ${L.length} setor${L.length > 1 ? 'es' : ''}</td></tr>` : ''}${L.map(linha).join('')}`;
    }).join('');
    return `<div class="rp" id="rpBody">
  <div class="hd"><div><small>Fechamento da coleta domiciliar</small><h2>${esc(CX.n)}</h2><div>${wd}, ${da}/${mo}/${y} · ${D.at === 'final' ? 'dia encerrado' : 'parcial até ' + esc(D.at)}</div></div><div class="hr">gerado em<br>${ger}</div></div>
  <div class="kp">
   ${kpi(n0(med) + '%', 'conclusão média (INLOG)', med >= 90 ? '#1d7a4f' : med >= 70 ? '#b7791f' : '#c9302c')}
   ${kpi(n0(medg) + '%', 'conclusão média (GPS)', '#2a5bd7')}
   ${kpi(`${conc}<small>/${F.length}</small>`, 'setores com 90% ou mais')}
   ${kpi(inc, 'encerrados sem concluir', inc ? '#c9302c' : null)}
   ${kpi(naos.length, 'setores que não saíram', naos.length ? '#c9302c' : null)}
   ${kpi(heMed == null ? '—' : hmin(heMed), `hora extra média${hes.length ? ` · ${hes.length} setor${hes.length > 1 ? 'es' : ''}` : ''}`, heMed ? '#b7791f' : null)}
   ${kpi(n0(km, 0) + ' km', 'rodados pelos caminhões')}
   ${kpi(nfm ? n0(nfm / 1000, 1) + ' km' : '—', 'de rota sem coleta (GPS)')}
  </div>
  <div class="bx"><div class="tl">Como a cidade encerrou</div>${mapa(S)}
   <div class="lg"><span><i style="background:#4fb37f"></i>90% ou mais</span><span><i style="background:#e9b44c"></i>70 a 89%</span><span><i style="background:#e06b62"></i>abaixo de 70%</span><span><i style="background:#6f95e8"></i>só GPS</span><span><i style="background:#c9d0cc"></i>não saiu</span></div></div>
  <div class="bx"><div class="tl">Setores</div><table><thead><tr><th>Setor</th><th>Veículo</th><th class="n">INLOG</th><th class="n">GPS</th><th>Situação</th><th class="n">Garagem</th><th class="n">H. extra</th></tr></thead><tbody>${tabela}</tbody></table>
   <div class="ob">Hora extra = tempo entre a saída e o retorno à garagem (GPS) além da jornada de ${hmin(jor)}.</div></div>
  ${ruas.length ? `<div class="bx"><div class="tl">Ruas que ficaram sem coleta</div><div class="ru">${ruas.slice(0, 16).map(r => `<div><span>${esc(r.r)}${r.b ? ` <small>${esc(r.b)}</small>` : ''}</span><em>setor ${esc(r.s)}</em><b>${n0(r.m)} m</b></div>`).join('')}</div>${ruas.length > 16 ? `<div class="ob">+ ${ruas.length - 16} ruas. Trechos da rota programada por onde o GPS não passou coletando.</div>` : '<div class="ob">Trechos da rota programada por onde o GPS não passou coletando.</div>'}</div>` : ''}
  <div class="ft">Fonte: INLOG e GPS dos caminhões · torrelimpagyn.github.io/trindade-coleta</div>
</div>`;
  }

  const CSS = `#rel{position:fixed;inset:0;z-index:60;background:rgba(10,20,15,.94);overflow:auto;-webkit-overflow-scrolling:touch}
#rel .bar2{position:sticky;top:0;z-index:2;display:flex;gap:8px;flex-wrap:wrap;justify-content:center;padding:calc(10px + env(safe-area-inset-top)) 12px 10px;background:#17201b}
#rel .bar2 button{border:0;border-radius:999px;padding:9px 14px;font:inherit;font-weight:700;font-size:14px;background:#2f6b52;color:#fff}#rel .bar2 button.sec2{background:#e9f1ec;color:#14231c}
#rel .wr{padding:14px 10px 40px}
.rp{width:760px;max-width:100%;margin:0 auto;background:#fff;color:#14231c;border-radius:14px;overflow:hidden;font:14px/1.35 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
.rp .hd{display:flex;justify-content:space-between;gap:12px;background:#1f5f45;color:#fff;padding:16px 18px}.rp .hd small{opacity:.85;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.4px}.rp .hd h2{margin:2px 0 2px;font-size:22px}.rp .hd .hr{text-align:right;font-size:11.5px;opacity:.85}
.rp .kp{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:12px 14px 4px}.rp .k{border:1px solid #e2e9e5;border-radius:10px;padding:8px 10px}.rp .k b{display:block;font-size:20px}.rp .k b small{font-size:13px;color:#5d6b64}.rp .k span{font-size:11.5px;color:#5d6b64}
.rp .bx{margin:10px 14px;border:1px solid #e2e9e5;border-radius:12px;padding:10px 12px}.rp .tl{font-weight:800;font-size:14px;margin-bottom:8px}
.rp .lg{display:flex;flex-wrap:wrap;gap:12px;font-size:11.5px;color:#5d6b64;margin-top:8px}.rp .lg i,.rp td i{display:inline-block;width:11px;height:11px;border-radius:3px;margin-right:5px;vertical-align:-1px}
.rp table{width:100%;border-collapse:collapse;font-size:12.5px}.rp th{text-align:left;color:#5d6b64;font-weight:700;font-size:11px;border-bottom:1px solid #e2e9e5;padding:5px 4px}.rp td{border-bottom:1px solid #eef2f0;padding:6px 4px;vertical-align:top}.rp .n{text-align:right;white-space:nowrap}.rp tr.tt td{background:#eef7f2;font-weight:800;color:#1f5f45}
.rp .ob{font-size:11px;color:#5d6b64;margin-top:6px}.rp .ru div{display:flex;gap:8px;align-items:baseline;padding:4px 0;border-bottom:1px solid #eef2f0;font-size:12.5px}.rp .ru span{flex:1}.rp .ru small{color:#5d6b64}.rp .ru em{font-style:normal;color:#5d6b64;font-size:11.5px}.rp .ru b{min-width:58px;text-align:right}
.rp .ft{font-size:11px;color:#5d6b64;padding:6px 16px 14px}
@media(max-width:560px){.rp .kp{grid-template-columns:repeat(2,1fr)}.rp th:nth-child(2),.rp td:nth-child(2){display:none}}
@media print{body>*:not(#rel){display:none!important}#rel{position:static;background:none;overflow:visible}#rel .bar2{display:none}#rel .wr{padding:0}.rp{width:100%;border-radius:0}@page{size:A4;margin:10mm}}`;

  let lib = null;
  const carregaLib = () => lib || (lib = new Promise((ok, er) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js'; s.onload = () => ok(window.htmlToImage); s.onerror = er; document.head.appendChild(s); }));
  async function imagem() {
    const h = await carregaLib(), el = document.getElementById('rpBody');
    const blob = await h.toBlob(el, { pixelRatio: 2, backgroundColor: '#ffffff', width: el.offsetWidth, height: el.offsetHeight, skipFonts: true, style: { margin: '0', borderRadius: '0' } });
    return blob;
  }
  const nome = (D, CX) => `fechamento-${CX.s}-${D.dia}.png`;

  window.relatorio = function (D, CX) {
    if (!D || !D.S) return;
    if (!document.getElementById('relCss')) { const st = document.createElement('style'); st.id = 'relCss'; st.textContent = CSS; document.head.appendChild(st); }
    let el = document.getElementById('rel'); if (el) el.remove();
    el = document.createElement('div'); el.id = 'rel';
    const share = !!(navigator.canShare && navigator.canShare({ files: [new File([''], 'x.png', { type: 'image/png' })] }));
    el.innerHTML = `<div class="bar2"><button id="rlImg">⬇ Baixar imagem</button>${share ? '<button id="rlSh">Compartilhar</button>' : ''}<button id="rlPr" class="sec2">Imprimir / PDF</button><button id="rlX" class="sec2">Fechar</button></div><div class="wr">${montar(D, CX)}</div>`;
    document.body.appendChild(el); document.body.style.overflow = 'hidden';
    const fechar = () => { el.remove(); document.body.style.overflow = ''; };
    el.querySelector('#rlX').onclick = fechar;
    el.querySelector('#rlPr').onclick = () => window.print();
    const ocupado = (b, f) => async () => { const t = b.textContent; b.disabled = true; b.textContent = 'Gerando…'; try { await f(); b.textContent = t; } catch (e) { b.textContent = 'Erro ao gerar'; setTimeout(() => { b.textContent = t; }, 4000); } b.disabled = false; };
    const bi = el.querySelector('#rlImg');
    bi.onclick = ocupado(bi, async () => { const b = await imagem(); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = nome(D, CX); document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); });
    const bs = el.querySelector('#rlSh');
    if (bs) bs.onclick = ocupado(bs, async () => { const b = await imagem(); const f = new File([b], nome(D, CX), { type: 'image/png' }); try { await navigator.share({ files: [f], title: `Fechamento da coleta · ${CX.n}` }); } catch (e) { if (e.name !== 'AbortError') throw e; } });
    carregaLib().catch(() => {});
  };
})();
