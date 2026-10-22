import { STATIONS, LINES } from './data.js';
import { plan, nextTrains, myt, clock, headway, linesAt, rm, fare, lineById } from './net.js';
import { initMap } from './map3d.js';

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const IDS = Object.keys(STATIONS).sort((a, b) => STATIONS[a].name.localeCompare(STATIONS[b].name));
const opts = (sel) => IDS.map((id) => `<option value="${id}"${id === sel ? ' selected' : ''}>${esc(STATIONS[id].name)}</option>`).join('');
const pills = (id) => linesAt(id).map((l) => `<span class="dotl" style="--c:${l.color}" title="${l.name}"></span>`).join('');

// ---------- map
let map = null;
try { map = initMap($('#map'), $('#labels'), { onStation: pickStation }); } catch (e) { console.warn('3D unavailable', e); }
const wideLayout = () => innerWidth > 860;
function syncPanel() { map && map.setPanel(wideLayout() ? $('#planner').offsetWidth + 24 : 0); }
syncPanel(); addEventListener('resize', syncPanel);
$('#ov').addEventListener('click', () => { map && map.overview(); });
$('#legend').innerHTML = LINES.map((l) => `<div><span class="dotl" style="--c:${l.color}"></span>${l.name}<small>${l.ends.join(' – ')}</small><span class="ok">Good service</span></div>`).join('');

// ---------- planner
$('#from').innerHTML = opts('pjsentral'); $('#to').innerHTML = opts('klcc');
let pickNext = 'from';
function pickStation(id) {
  if (!wideLayout()) { $(`#${pickNext}`).value = id; } else $(`#${pickNext}`).value = id;
  map && map.focusStation(id); pickNext = pickNext === 'from' ? 'to' : 'from';
  if ($('#from').value !== $('#to').value && pickNext === 'from') run();
}
$('#swap').addEventListener('click', () => { const a = $('#from').value; $('#from').value = $('#to').value; $('#to').value = a; run(); });
$('#when').addEventListener('change', (e) => { $('#atwrap').hidden = e.target.value !== 't'; });
$('#pf').addEventListener('submit', (e) => { e.preventDefault(); run(); });
$('#from').addEventListener('change', () => run()); $('#to').addEventListener('change', () => run());
function startSec() { const w = $('#when').value; if (w === 't') { const [h, m] = $('#at').value.split(':').map(Number); return h * 3600 + m * 60; } return myt() + (+w) * 60; }
function run(quiet) {
  const a = $('#from').value, b = $('#to').value, res = $('#res'); res.hidden = false;
  if (a === b) { res.innerHTML = '<p class="closed">Choose two different stations.</p>'; map && map.setRoute(null); return; }
  const r = plan(a, b, startSec());
  if (!r) { res.innerHTML = '<p class="closed">No route found.</p>'; return; }
  if (r.closed) { res.innerHTML = `<p class="closed">Trains run from 6:00 am to midnight. The first train from ${esc(STATIONS[a].name)} leaves just after 6:00 am.</p>`; map && map.setRoute(null); return; }
  let html = `<div class="sum"><div><div class="big">${r.mins}<small>min</small></div><div class="when">${clock(r.depart)} → ${clock(r.arrive)} · ${r.transfers ? r.transfers + ' change' + (r.transfers > 1 ? 's' : '') : 'direct'}</div></div><div class="fare">${rm(r.fare)}<small>${r.km.toFixed(1)} km · adult</small></div></div><div class="legs">`;
  r.legs.forEach((g, i) => {
    const n = g.stops.length - 1;
    html += `<div class="leg" style="--c:${g.line.color}"><span class="tm">${clock(g.dep)}</span><span class="rail"><i></i></span><div class="bd"><b>${esc(STATIONS[g.from].name)}</b><span class="pill" style="--c:${g.line.color}">${g.line.name}</span><span>towards ${esc(STATIONS[g.towards].name)} · ${n} stop${n > 1 ? 's' : ''} · ${g.mins} min</span></div></div>`;
    if (i < r.legs.length - 1) html += `<div class="chg"><span></span><span class="rail"></span><div class="bd"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 5h9l-3-3M13 11H4l3 3"/></svg>Change at ${esc(STATIONS[g.to].name)}, next train ${clock(r.legs[i + 1].dep)}</div></div>`;
  });
  const lastLeg = r.legs.at(-1);
  html += `<div class="leg end" style="--c:${lastLeg.line.color}"><span class="tm">${clock(r.arrive)}</span><span class="rail"><i></i></span><div class="bd"><b>${esc(STATIONS[b].name)}</b><span>Arrive · step-free exit</span></div></div></div><p class="note">Fares are capped at RM 6.40. Students and seniors pay half.</p>`;
  res.innerHTML = html; map && map.setRoute(r);
  if (!wideLayout() && !quiet) res.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

// ---------- live board
$('#bst').innerHTML = opts('bintang');
function renderStatus() {
  const t = myt(), h = headway(t);
  $('#status').innerHTML = `<h3 style="font-size:18px">Line status</h3>` + LINES.map((l) => `<div class="ln"><div class="r1"><span class="pill" style="--c:${l.color}">${l.name}</span><span class="st">${h ? 'Good service' : 'Closed'}</span></div><b>${l.ends.join(' – ')}</b><span>${h ? `A train every ${h} min right now` : 'Closed until 6:00 am'}</span></div>`).join('') + `<p class="note" style="margin:4px 2px 0">Last trains leave each end at about 11:20 pm.</p>`;
}
function renderBoard() {
  const s = $('#bst').value, t = myt(); $('#bnow').textContent = `Updated ${clock(t)}`; let rows = '';
  linesAt(s).forEach((L) => [1, -1].forEach((dir) => { const end = dir > 0 ? L.stops.at(-1) : L.stops[0]; if (end === s) return;
    nextTrains(L, s, dir, t, 2).forEach((at, k) => { const m = Math.max(0, Math.round((at - t) / 60));
      rows += `<div class="dep"><span class="pill" style="--c:${L.color}">${L.short}</span><span class="to">${esc(STATIONS[end].name)}<small>${k ? 'Following train' : 'Next train'}</small></span><span class="mins">${m ? m + '<small>min</small>' : 'Due'}</span><span class="clk">${clock(at)}</span></div>`; }); }));
  $('#deps').innerHTML = rows || '<p style="color:#a9b7d4;padding:14px 4px">No more trains tonight. Service starts again at 6:00 am.</p>';
}
$('#bst').addEventListener('change', renderBoard);

// ---------- fares
$('#ff').innerHTML = opts('subang'); $('#ft').innerHTML = opts('jalil');
let pk = 1;
function renderFare() { const a = $('#ff').value, b = $('#ft').value; if (a === b) { $('#fval').textContent = rm(0); $('#fdesc').textContent = 'Choose two different stations'; return; }
  const r = plan(a, b, 12 * 3600); const f = Math.round(r.fare * pk * 10) / 10; $('#fval').textContent = rm(f);
  $('#fdesc').innerHTML = `${r.km.toFixed(1)} km · ${r.transfers ? r.transfers + ' change' + (r.transfers > 1 ? 's' : '') : 'direct'}${pk < 1 ? (pk ? ' · half fare' : ' · free with your concession card') : ''}`; }
['#ff', '#ft'].forEach((s) => $(s).addEventListener('change', renderFare));
$('#ptype').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; pk = +b.dataset.k; $$('#ptype button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); renderFare(); });

// ---------- stations
let lineFilter = '';
$('#sline').innerHTML = `<button type="button" data-l="" aria-pressed="true">All lines</button>` + LINES.map((l) => `<button type="button" data-l="${l.id}" aria-pressed="false"><span class="dotl" style="--c:${l.color};margin-right:6px"></span>${l.short}</button>`).join('');
const FAC = { lift: 'Lifts', park: 'Park & ride', bus: 'Bus interchange', bike: 'Bike racks', rail: 'Rail link' };
function renderStations() { const q = $('#sq').value.trim().toLowerCase();
  $('#stns').innerHTML = IDS.filter((id) => STATIONS[id].name.toLowerCase().includes(q) && (!lineFilter || lineById(lineFilter).stops.includes(id))).map((id) => `<button type="button" class="card stc" data-id="${id}"><div class="nm"><b>${esc(STATIONS[id].name)}</b><span class="lines">${linesAt(id).map((l) => `<span class="pill" style="--c:${l.color};height:22px;font-size:11px">${l.short}</span>`).join('')}</span></div><div class="fac">${STATIONS[id].fac.map((f) => `<span>${FAC[f]}</span>`).join('')}</div></button>`).join('') || '<p style="color:var(--ink2)">No stations match.</p>'; }
$('#sq').addEventListener('input', renderStations);
$('#sline').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; lineFilter = b.dataset.l; $$('#sline button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); renderStations(); });
$('#stns').addEventListener('click', (e) => { const c = e.target.closest('.stc'); if (!c) return; scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => { map && map.setRoute(null); map && map.focusStation(c.dataset.id); $('#from').value = c.dataset.id; pickNext = 'to'; }, 500); });

// stats
const totalKm = LINES.reduce((s, l) => s + l.lengthKm, 0);
$('#stats').innerHTML = `<div><b>${LINES.length}</b><span>lines</span></div><div><b>${IDS.length}</b><span>stations, all step-free</span></div><div><b>${Math.round(totalKm)} km</b><span>of elevated track</span></div><div><b id="intrain">–</b><span>trains running right now</span></div>`;

// ---------- clocks
function tick() { const t = myt(); $('#clockchip').innerHTML = `Malaysia time <b>${clock(t)}</b>`; renderStatus(); renderBoard();
  const h = headway(t); let n = 0; LINES.forEach((L) => { if (!h) return; n += Math.round(L.run / h) * 2; }); $('#intrain').textContent = n; }
tick(); setInterval(tick, 15000); renderFare(); renderStations(); run(true);

// ---------- anchors + reveals
document.addEventListener('click', (e) => { const a = e.target.closest('a[data-go]'); if (!a) return; e.preventDefault(); const h = a.getAttribute('href'); const y = h === '#top' ? 0 : $(h).getBoundingClientRect().top + scrollY - 70; scrollTo({ top: y, behavior: 'smooth' }); setTimeout(() => { if (Math.abs(scrollY - y) > 4) scrollTo(0, y); }, 1400); });
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
$$('.reveal').forEach((el, i) => { el.style.transitionDelay = (i % 4) * 60 + 'ms'; io.observe(el); });
window.__laluan = { map, plan, run };
