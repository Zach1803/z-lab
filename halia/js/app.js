// Halia Residences — page logic: 3D chapters, unit picker, view, plans, map, calculator, form.
import { F0, F1, PH0, label, unit, floorUnits, TYPES, totals, rm } from './data.js';
import { planSVG } from './plans.js';

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const hm = (h) => { const m = Math.round(h * 60); return String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
let S = null; // the 3D scene, once loaded
const st = { f: 33, k: 2, hour: 18.7 };

/* ------------------------------------------------------------ hero facts */
$('#f-homes').textContent = totals.n; $('#f-from').textContent = 'RM ' + (Math.floor(totals.minP / 10000) / 100).toFixed(2).replace(/0$/, '') + 'm';

/* ------------------------------------------------------------ picker */
const floorKey = (f) => Math.min(f, PH0);
function floorTitle(f) { return f >= PH0 ? 'Levels 47–48 · Penthouses' : `Level ${label(f)}`; }
function renderFloor() {
  const f = floorKey(st.f), list = floorUnits(f), av = list.filter((u) => u.status === 'available').length;
  $('#fl-lv').textContent = floorTitle(f); $('#fl-av').textContent = `${av} of ${list.length} available`; $('#fl-range').value = f;
  $('#units-wrap').classList.toggle('ph', f >= PH0);
  if (!unit(f, st.k)) st.k = list.find((u) => u.status !== 'sold')?.k ?? list[0].k;
  $('#units').innerHTML = list.map((u) => `<button type="button" class="u ${u.status}" data-k="${u.k}" aria-pressed="${u.k === st.k}"><b>${u.no}</b><span><i style="background:var(--${u.status === 'available' ? 'ok' : u.status === 'reserved' ? 'res' : 'sold'})"></i>${u.T.name.replace('Type ', '')} · ${u.face}</span></button>`).join('');
  $$('#units .u').forEach((b) => b.addEventListener('click', () => { st.k = +b.dataset.k; renderFloor(); }));
  renderDetail(); if (S) S.select(f, st.k);
}
function renderDetail() {
  const u = unit(floorKey(st.f), st.k), T = u.T;
  $('#detail').innerHTML = `<div class="top"><h3>${u.no} · ${T.name}</h3><span class="badge ${u.status}">${u.status}</span></div>
    <div class="specs"><div><small>Bedrooms</small><b>${T.beds.replace(' bedrooms', '')}</b></div><div><small>Built-up</small><b>${T.sqft.toLocaleString()} sq ft</b></div><div><small>Facing</small><b>${u.face}</b></div></div>
    <div class="price"><b>${u.status === 'sold' ? 'Sold' : rm(u.price)}</b><span>${u.status === 'sold' ? 'Join the waiting list' : `RM ${u.psf.toLocaleString()} psf`}</span></div>
    <div class="acts"><a class="btn dark" href="#view" id="see-view">See the view from here</a><a class="btn line" href="#plans" id="see-plan">Floor plan</a></div><div class="hint">${u.facing}. Tap the tower to choose another home.</div>`;
  $('#see-plan').addEventListener('click', () => showPlan(u.type));
  $('#see-view').addEventListener('click', () => { /* the scroll handler switches the 3D to the balcony view */ });
  if (u.status !== 'sold') { $('#c-price').value = u.price; calc(); const opt = [...$('#f-unit').options].find((o) => o.textContent.startsWith(u.no)); if (!opt) { const o = new Option(`${u.no} · ${T.name} · ${rm(u.price)}`); $('#f-unit').add(o, 1); $('#f-unit').selectedIndex = 1; } }
  renderView();
}
$('#fl-range').addEventListener('input', (e) => { st.f = +e.target.value; renderFloor(); });
$('#fl-up').addEventListener('click', () => { st.f = Math.min(PH0, floorKey(st.f) + 1); renderFloor(); });
$('#fl-dn').addEventListener('click', () => { st.f = Math.max(F0, floorKey(st.f) - 1); renderFloor(); });

/* ------------------------------------------------------------ view */
function renderView() {
  const u = unit(floorKey(st.f), st.k); if (!u) return;
  $('#v-title').textContent = `${u.no} · ${u.ph ? 'Level 48' : 'Level ' + u.lv}`; $('#v-meta').textContent = `${u.facing} · ${u.T.name}, ${u.T.beds}`;
  if (S) S.select(u.ph ? F1 : u.f, u.k);
}
function setHour(h) { st.hour = h; $('#v-clock').textContent = hm(h); $('#v-time').value = h; $$('#tod button').forEach((b) => b.setAttribute('aria-pressed', Math.abs(+b.dataset.h - h) < .3)); if (S) S.setTime(h); }
$('#v-time').addEventListener('input', (e) => setHour(+e.target.value));
$$('#tod button').forEach((b) => b.addEventListener('click', () => setHour(+b.dataset.h)));
$('#v-lower').addEventListener('click', () => { st.f = Math.max(F0, floorKey(st.f) - 8); renderFloor(); });
$('#v-higher').addEventListener('click', () => { st.f = Math.min(F1 - 1, floorKey(st.f) + 8); if (st.f >= PH0 && st.k % 2 === 0) st.f = PH0 - 1; renderFloor(); });

/* ------------------------------------------------------------ chapters ↔ 3D mode */
const chapters = $$('.chapter'); let curMode = 'hero';
function onScroll() {
  const vh = innerHeight; let mode = 'hero';
  chapters.forEach((c) => { const r = c.getBoundingClientRect(); if (r.top < vh * .5 && r.bottom > vh * .5) mode = c.dataset.mode; });
  const wrapR = $('#stage-wrap').getBoundingClientRect();
  if (S) { S.setHeroProgress(Math.min(1, Math.max(0, -wrapR.top / (vh * 1.2)))); if (mode !== curMode) { S.setMode(mode); if (mode === 'view') renderView(); } }
  curMode = mode; $('#tod').hidden = mode !== 'hero';
  $('#nav').classList.toggle('solid', wrapR.bottom < 80);
}
addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll);

/* pick on the tower (picker chapter only) */
let down = null;
$('#tower').addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
$('#tower').addEventListener('pointerup', (e) => { if (!down || !S || curMode !== 'picker') return; const d = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null; if (d > 8) return; const hit = S.pickAt(e.clientX, e.clientY); if (!hit) return; st.f = hit.f; st.k = hit.k; renderFloor(); });
$('#tower').addEventListener('pointermove', (e) => { if (!S || curMode !== 'picker') return; $('#tower').style.cursor = S.pickAt(e.clientX, e.clientY) ? 'pointer' : 'default'; });

/* ------------------------------------------------------------ plans */
const TABS = ['A', 'B', 'C', 'D'];
$('#ptabs').innerHTML = TABS.map((t) => `<button type="button" role="tab" class="ptab" data-t="${t}" aria-selected="false"><b>${TYPES[t].name}</b><span>${TYPES[t].beds} · ${TYPES[t].sqft.toLocaleString()} sq ft</span></button>`).join('');
$$('.ptab').forEach((b) => b.addEventListener('click', () => showPlan(b.dataset.t)));
function showPlan(t) {
  $$('.ptab').forEach((b) => b.setAttribute('aria-selected', b.dataset.t === t)); const T = TYPES[t];
  $('#plan').innerHTML = planSVG(t);
  let from = 1e12; for (let f = F0; f <= F1; f++) floorUnits(f).forEach((u) => { if (u.type === t && u.status !== 'sold') from = Math.min(from, u.price); });
  $('#plan-meta').innerHTML = `<p>${T.blurb}${t === 'D' ? ' Plan shows the lower level.' : ''}</p><dl><div><dt>Built-up</dt><dd>${T.sqft.toLocaleString()} sq ft</dd></div><div><dt>Bathrooms</dt><dd>${T.baths}</dd></div><div><dt>From</dt><dd>${from < 1e12 ? rm(from) : 'Sold out'}</dd></div></dl>`;
}
showPlan('C');

/* ------------------------------------------------------------ location map (illustration) */
$('#map').innerHTML = `<svg viewBox="0 0 640 460" role="img" aria-label="Illustrated map of Bukit Seroja">
  <rect width="640" height="460" fill="#ece6da"/>
  <path d="M0 330C120 300 190 360 300 340S470 280 640 300V460H0Z" fill="#cdd6c0"/><path d="M0 380C140 360 230 410 360 395S540 350 640 370V460H0Z" fill="#b9c7aa"/>
  <path d="M170 120C240 70 360 80 410 140S420 280 330 300 160 260 150 200 120 160 170 120Z" fill="#c7d5b6" stroke="#a9ba95"/>
  <g stroke="#fff" stroke-width="14" fill="none" stroke-linecap="round"><path d="M0 70H640"/><path d="M520 0V460"/><path d="M60 0C80 160 60 300 120 460"/></g>
  <g stroke="#d9cfbf" stroke-width="5" fill="none"><path d="M0 70H640"/><path d="M520 0V460"/><path d="M60 0C80 160 60 300 120 460"/></g>
  <path d="M0 210C150 205 230 230 300 225S470 190 640 200" stroke="#3c7d8c" stroke-width="5" stroke-dasharray="1 0" fill="none"/><path d="M0 210C150 205 230 230 300 225S470 190 640 200" stroke="#fff" stroke-width="1.5" stroke-dasharray="6 6" fill="none"/>
  <circle cx="345" cy="222" r="9" fill="#fff" stroke="#3c7d8c" stroke-width="4"/><text x="360" y="246" font-size="12" font-weight="700" fill="#3c7d8c" font-family="Manrope">Seroja MRT (planned)</text>
  <path d="M235 205C262 190 300 192 318 210" stroke="#b0894f" stroke-width="2" stroke-dasharray="4 4" fill="none"/>
  <g transform="translate(262 178)"><circle r="24" fill="#1f3a32"/><circle r="38" fill="none" stroke="#1f3a32" stroke-opacity=".25" stroke-width="2"/><use href="#mark" x="-12" y="-13" width="24" height="24" style="color:#d6b37a"/></g>
  <text x="262" y="138" text-anchor="middle" font-family="Cormorant Garamond" font-size="22" font-weight="600" fill="#1f3a32">Halia Residences</text>
  <text x="300" y="300" font-size="11" letter-spacing="2" fill="#7d8a70" font-family="Manrope" font-weight="700">TAMAN SEROJA PARK</text><text x="40" y="430" font-size="11" letter-spacing="2" fill="#6f7d62" font-family="Manrope" font-weight="700">SEROJA HILLS</text>
  <g font-family="Manrope" font-size="11.5" font-weight="700" fill="#1a2420"><circle cx="560" cy="40" r="6" fill="#b0894f"/><text x="572" y="44">City centre ↗</text><circle cx="470" cy="120" r="6" fill="#b0894f"/><text x="420" y="104">International school</text><circle cx="560" cy="300" r="6" fill="#b0894f"/><text x="476" y="324">Specialist hospital</text><circle cx="110" cy="110" r="6" fill="#b0894f"/><text x="124" y="114">Mall</text></g>
  <g transform="translate(600 410)"><circle r="16" fill="#fff" stroke="#c9bfae"/><path d="M0 -12 5 6 0 2 -5 6Z" fill="#1a2420"/></g></svg>`;

/* ------------------------------------------------------------ calculator */
const fmt = (n) => rm(n);
function calc() {
  const P = +$('#c-price').value, dp = +$('#c-down').value / 100, r = +$('#c-rate').value / 100 / 12, n = +$('#c-years').value * 12;
  const loan = P * (1 - dp), m = r ? loan * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1) : loan / n, tot = m * n, int = tot - loan;
  $('#o-price').textContent = fmt(P); $('#o-down').textContent = `${Math.round(dp * 100)}% · ${fmt(P * dp)}`; $('#o-rate').textContent = (+$('#c-rate').value).toFixed(2) + '%'; $('#o-years').textContent = $('#c-years').value + ' years';
  $('#r-month').textContent = fmt(m); $('#r-loan').textContent = fmt(loan); $('#r-down').textContent = fmt(P * dp); $('#r-int').textContent = fmt(int); $('#r-total').textContent = fmt(tot);
  $('#b-p').style.width = (loan / tot * 100) + '%'; $('#b-i').style.width = (int / tot * 100) + '%';
}
['#c-price', '#c-down', '#c-rate', '#c-years'].forEach((s) => $(s).addEventListener('input', calc));
$('#c-price').value = 1180000; calc();

/* ------------------------------------------------------------ form */
$('#form').addEventListener('submit', (e) => { e.preventDefault(); const f = e.target; if (!f.name.value.trim()) return f.name.focus(); if (!/^[0-9+\-\s]{9,}$/.test(f.phone.value.trim())) { f.phone.focus(); f.phone.setCustomValidity('Enter a mobile number'); f.phone.reportValidity(); return; } f.phone.setCustomValidity(''); f.hidden = true; $('#thanks').classList.add('on'); });
{ const d = new Date(); d.setDate(d.getDate() + 2); $('#form').day.min = d.toISOString().slice(0, 10); }

/* ------------------------------------------------------------ reveal + gallery */
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15 });
$$('.reveal').forEach((el) => io.observe(el));
[['#g1', 'tex/g1.webp'], ['#g2', 'tex/g2.webp'], ['#g3', 'tex/g3.webp']].forEach(([s, u]) => { const im = $(s); im.src = u; im.onerror = () => { im.remove(); }; });

/* ------------------------------------------------------------ 3D */
import('./scene.js').then(({ createScene }) => {
  try { S = createScene($('#tower')); window.__halia = { S, st }; setHour(st.hour); renderFloor(); onScroll(); }
  catch (e) { console.warn(e); $('#stage').style.background = 'linear-gradient(#24352e,#14211c)'; }
}).catch((e) => console.warn(e));
renderFloor(); setHour(st.hour); onScroll();
