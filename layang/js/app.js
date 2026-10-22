// Layang Air — booking flow, departures board, destinations. Everything runs locally; nothing is sent anywhere.
import { HUB, DEST, ALL, byCode, seeded, AIRCRAFT, FARES } from './data.js';

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const pad = (n, l = 2) => String(n).padStart(l, '0');
const rm = (n) => 'RM ' + Math.round(n).toLocaleString('en-MY');
const hm = (m) => { m = ((m % 1440) + 1440) % 1440; return pad(Math.floor(m / 60)) + ':' + pad(m % 60); };
const dur = (m) => `${Math.floor(m / 60)}h ${pad(m % 60)}m`;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromIso = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const nice = (d) => `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
const toast = (msg) => { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2600); };

/* ------------------------------------------------------------ schedule model */
const IDX = Object.fromEntries(DEST.map((d, i) => [d.code, i]));
function directFlights(from, to, dateStr) {
  const out = from === HUB.code, d = byCode(out ? to : from); if (!d || from === to) return [];
  const m = d.mins, n = m <= 130 ? 5 : m <= 250 ? 3 : m <= 500 ? 2 : 1, rnd = seeded(from + to + 'sched');
  const base = 10 + IDX[d.code] * 12 + (out ? 1 : 2), list = [];
  for (let k = 0; k < n; k++) {
    let dep;
    if (m > 600) dep = out ? (k ? 9 * 60 + 15 : 23 * 60 + 35) : (k ? 13 * 60 + 5 : 21 * 60 + 50);
    else dep = Math.round((6 * 60 + 20 + (k + rnd() * .6) * (16.5 * 60 / n)) / 5) * 5;
    const tzd = (byCode(to).tz - byCode(from).tz) * 60, dd = m + Math.round(rnd() * 10 - 3);
    list.push({ no: 'LY ' + pad(base + k * 2 * (n > 2 ? 1 : 1), 3), from, to, dep, dur: dd, arr: dep + dd + tzd, ac: m > 240 ? 'long' : 'short' });
  }
  return list.sort((a, b) => a.dep - b.dep);
}
function options(from, to, dateStr) {
  const day = fromIso(dateStr), rnd = seeded(from + to + dateStr), dow = day.getDay();
  const dayF = (.86 + rnd() * .34) * (dow === 5 || dow === 0 ? 1.1 : 1);
  if (from === HUB.code || to === HUB.code) {
    const d = byCode(from === HUB.code ? to : from);
    return directFlights(from, to, dateStr).map((s) => { const tod = s.dep < 7 * 60 || s.dep > 22 * 60 ? .92 : 1; return { segs: [s], dep: s.dep, arr: s.arr, total: s.dur, stops: 0, base: d.fare * dayF * tod }; });
  }
  // connect over KUL
  const a = directFlights(from, HUB.code, dateStr), b = directFlights(HUB.code, to, dateStr), res = [];
  a.forEach((s1) => b.forEach((s2) => { const arrKul = s1.dep + s1.dur + (HUB.tz - byCode(from).tz) * 60; let lay = s2.dep - arrKul; if (lay < 70) lay += 1440; if (lay > 300 && lay < 1440) return; if (lay >= 1440) return; res.push({ segs: [s1, s2], dep: s1.dep, arr: arrKul + lay + s2.dur + (byCode(to).tz - HUB.tz) * 60, total: s1.dur + lay + s2.dur, lay, stops: 1, base: (byCode(from).fare + byCode(to).fare) * .78 * dayF }); }));
  return res.sort((x, y) => x.total - y.total).slice(0, 4).sort((x, y) => x.dep - y.dep);
}
const price = (base, f) => Math.max(59, Math.round(base * f.mult / 10) * 10 - 1);

/* ------------------------------------------------------------ booking form */
const S = { trip: 'return', from: 'KUL', to: 'NRT', dep: '', ret: '', pax: 2, legs: [], step: null, seat: {}, segs: [], curSeg: 0, curPax: 0, names: [] };
const fSel = $('#f-from'), tSel = $('#f-to');
function fillSelect(sel, value, exclude) {
  const groups = {}; ALL.forEach((d) => { if (d.code === exclude) return; const g = d === HUB ? 'Hub' : d.region; (groups[g] = groups[g] || []).push(d); });
  sel.innerHTML = Object.entries(groups).map(([g, list]) => `<optgroup label="${g}">${list.map((d) => `<option value="${d.code}">${d.city}</option>`).join('')}</optgroup>`).join('');
  sel.value = value;
}
function syncForm() {
  fillSelect(fSel, S.from, S.to); fillSelect(tSel, S.to, S.from);
  $('#f-from-sub').textContent = S.from + ' · ' + byCode(S.from).country; $('#f-to-sub').textContent = S.to + ' · ' + byCode(S.to).country;
  $('#f-dep-sub').textContent = S.dep ? nice(fromIso(S.dep)) : ''; $('#f-ret-sub').textContent = S.ret ? nice(fromIso(S.ret)) : '';
  $('.field.ret').hidden = S.trip !== 'return';
  if (globe) globe.select(S.to !== HUB.code ? S.to : (S.from !== HUB.code ? S.from : null));
}
{ const t = new Date(); t.setHours(0, 0, 0, 0); S.dep = iso(addDays(t, 14)); S.ret = iso(addDays(t, 21)); $('#f-dep').min = $('#f-ret').min = iso(t); $('#f-dep').value = S.dep; $('#f-ret').value = S.ret; }
fSel.addEventListener('change', () => { S.from = fSel.value; syncForm(); });
tSel.addEventListener('change', () => { S.to = tSel.value; syncForm(); });
$('#swap').addEventListener('click', () => { [S.from, S.to] = [S.to, S.from]; syncForm(); });
$('#f-dep').addEventListener('change', (e) => { S.dep = e.target.value; if (S.ret && S.ret < S.dep) { S.ret = iso(addDays(fromIso(S.dep), 7)); $('#f-ret').value = S.ret; } syncForm(); });
$('#f-ret').addEventListener('change', (e) => { S.ret = e.target.value; syncForm(); });
$('#f-pax').addEventListener('change', (e) => { S.pax = +e.target.value; });
$$('.tab').forEach((b) => b.addEventListener('click', () => { S.trip = b.dataset.trip; $$('.tab').forEach((x) => x.setAttribute('aria-selected', x === b)); syncForm(); }));
$('#book').addEventListener('submit', (e) => { e.preventDefault(); if (!S.dep) return toast('Pick a departure date'); if (S.trip === 'return' && (!S.ret || S.ret < S.dep)) return toast('Return date must be after departure'); search(); });

/* ------------------------------------------------------------ results */
function search() {
  S.legs = [{ from: S.from, to: S.to, date: S.dep, chosen: null }];
  if (S.trip === 'return') S.legs.push({ from: S.to, to: S.from, date: S.ret, chosen: null });
  S.seat = {}; S.names = [];
  $('#r-head').innerHTML = `${byCode(S.from).city} <svg><use href="#plane"/></svg> ${byCode(S.to).city}`;
  $('#r-note').textContent = `${S.pax} adult${S.pax > 1 ? 's' : ''} · ${S.trip === 'return' ? 'Return' : 'One way'} · fares are per adult, including taxes.`;
  $('#perks').innerHTML = FARES.map((f) => `<div><b>${f.name}</b>${f.perks.join(' · ')}</div>`).join('');
  renderLegs(); go('results');
}
function renderLegs() {
  $('#legs').innerHTML = S.legs.map((leg, li) => {
    const day = fromIso(leg.date), today = new Date(); today.setHours(0, 0, 0, 0);
    const strip = [-3, -2, -1, 0, 1, 2, 3].map((k) => addDays(day, k)).filter((d) => d >= today).map((d) => { const o = options(leg.from, leg.to, iso(d)); const low = o.length ? Math.min(...o.map((x) => price(x.base, FARES[0]))) : 0; return { d, low }; });
    const minLow = Math.min(...strip.map((s) => s.low || 1e9));
    const opts = options(leg.from, leg.to, leg.date);
    return `<div class="leg" data-li="${li}">
      <div class="leg-title"><h3>${li ? 'Return' : 'Outbound'} · ${byCode(leg.from).code} → ${byCode(leg.to).code}</h3><span class="mono" style="font-size:13px;color:var(--mute)">${nice(day)}</span></div>
      <div class="dates">${strip.map((s) => `<button type="button" class="date${s.low === minLow ? ' low' : ''}" data-date="${iso(s.d)}" aria-pressed="${iso(s.d) === leg.date}"><b>${DAYS[s.d.getDay()]} ${s.d.getDate()}</b><span>${MONTHS[s.d.getMonth()]}</span><em>${s.low ? rm(s.low) : '—'}</em></button>`).join('')}</div>
      <div class="flights">${opts.length ? opts.map((o, fi) => flightCard(o, fi, leg)).join('') : '<p>No flights on this day. Try another date.</p>'}</div></div>`;
  }).join('');
  $$('.leg').forEach((el) => {
    const li = +el.dataset.li, leg = S.legs[li];
    $$('.date', el).forEach((b) => b.addEventListener('click', () => { leg.date = b.dataset.date; leg.chosen = null; if (li === 0) S.dep = leg.date; else S.ret = leg.date; renderLegs(); updateBar(); }));
    $$('.fare', el).forEach((b) => b.addEventListener('click', () => { leg.chosen = { fi: +b.dataset.fi, fare: b.dataset.fare }; renderLegs(); updateBar(); if (li === 0 && S.legs[1] && !S.legs[1].chosen) setTimeout(() => $('.leg[data-li="1"]').scrollIntoView({ behavior: 'smooth', block: 'start' }), 150); }));
  });
  updateBar();
}
function flightCard(o, fi, leg) {
  const s0 = o.segs[0], last = o.segs[o.segs.length - 1], plus = Math.floor(o.arr / 1440);
  const ac = o.segs.some((s) => s.ac === 'long') ? AIRCRAFT.long.short : AIRCRAFT.short.short;
  return `<div class="flight"><div class="f-main">
      <div class="f-times"><div><strong>${hm(o.dep)}</strong><small>${s0.from}</small></div>
      <div class="f-line"><span>${dur(o.total)} · ${o.stops ? '1 stop KUL' : 'Nonstop'}</span><i></i></div>
      <div><strong>${hm(o.arr)}${plus ? `<sup style="font-size:12px;color:var(--bad)"> +${plus}</sup>` : ''}</strong><small>${last.to}</small></div></div>
      <div class="f-meta"><span><b>${o.segs.map((s) => s.no).join(' + ')}</b></span><span>${ac}</span>${o.stops ? `<span>${dur(o.lay)} in Kuala Lumpur</span>` : ''}<span>Meal included</span></div></div>
    ${FARES.map((f) => { const sel = leg.chosen && leg.chosen.fi === fi && leg.chosen.fare === f.id; return `<button type="button" class="fare${f.id === 'biz' ? ' biz' : ''}" data-fi="${fi}" data-fare="${f.id}" aria-pressed="${sel}"><small>${f.name.replace('Economy ', '')}</small><b>${rm(price(o.base, f))}</b><span>${f.perks[0]}</span></button>`; }).join('')}
  </div>`;
}
function chosenOpt(leg) { return leg.chosen ? options(leg.from, leg.to, leg.date)[leg.chosen.fi] : null; }
function fareOf(leg) { return FARES.find((f) => f.id === leg.chosen.fare); }
function totals() {
  let t = 0; S.legs.forEach((l) => { if (l.chosen) t += price(chosenOpt(l).base, fareOf(l)) * S.pax; });
  Object.values(S.seat).forEach((arr) => arr.forEach((s) => { if (s && s.xl && !s.free) t += 89; }));
  return t;
}

/* ------------------------------------------------------------ steps + bar */
const STEPS = ['results', 'seats', 'details', 'pass'], LABEL = { results: 'Flights', seats: 'Seats', details: 'Travellers', pass: 'Boarding pass' };
function go(step) {
  S.step = step; STEPS.forEach((s) => { $('#' + s).hidden = STEPS.indexOf(s) > STEPS.indexOf(step); });
  $('#steps').innerHTML = STEPS.map((s) => `<span class="${s === step ? 'on' : STEPS.indexOf(s) < STEPS.indexOf(step) ? 'done' : ''}">${LABEL[s]}</span>`).join('');
  $('#bar').hidden = step === 'pass'; updateBar();
  requestAnimationFrame(() => $('#' + step).scrollIntoView({ behavior: 'smooth', block: 'start' }));
}
function updateBar() {
  const all = S.legs.every((l) => l.chosen);
  let sum = S.legs.map((l) => { const o = chosenOpt(l); return o ? `<b>${l.from}→${l.to}</b> ${hm(o.dep)} ${fareOf(l).name}` : `<b>${l.from}→${l.to}</b> choose a fare`; }).join(' &nbsp;·&nbsp; ');
  let ok = all, label = 'Continue to seats';
  if (S.step === 'seats') { const left = S.segs.reduce((n, s, i) => n + (S.seat[i] || []).filter((x) => !x).length + (S.pax - (S.seat[i] || []).length), 0); sum = left ? `${left} seat${left > 1 ? 's' : ''} still to pick (or we'll assign at check-in)` : 'All seats picked'; label = 'Continue to travellers'; ok = true; }
  if (S.step === 'details') { label = 'Confirm & check in'; ok = true; sum = 'Names as on passport · nothing is sent anywhere'; }
  $('#bar-sum').innerHTML = sum; $('#bar-tot').textContent = rm(totals()); $('#bar-next').disabled = !ok; $('#bar-next').textContent = label;
  $('#bar-back').hidden = S.step === 'results';
}
$('#bar-next').addEventListener('click', () => {
  if (S.step === 'results') { buildSegs(); go('seats'); renderSeats(); }
  else if (S.step === 'seats') { renderPaxForm(); go('details'); }
  else if (S.step === 'details') { if (readPax()) { issuePasses(); go('pass'); } }
});
$('#bar-back').addEventListener('click', () => { const i = STEPS.indexOf(S.step); if (i > 0) go(STEPS[i - 1]); });

/* ------------------------------------------------------------ seats */
function buildSegs() {
  S.segs = []; S.legs.forEach((l, li) => { const o = chosenOpt(l); o.segs.forEach((s) => S.segs.push({ ...s, date: l.date, fare: l.chosen.fare, li, depDay: l.date })); });
  S.segs.forEach((s, i) => { if (!S.seat[i] || S.seat[i].length !== S.pax) S.seat[i] = Array(S.pax).fill(null); });
  S.curSeg = 0; S.curPax = 0;
}
function seatTaken(seg, id) { const r = seeded(seg.no + seg.date + id)(); return r < (id.match(/^[1-9]\D/) || +id.slice(0, -1) < 10 ? .45 : .58); }
function renderSeats() {
  const seg = S.segs[S.curSeg], ac = AIRCRAFT[seg.ac], biz = seg.fare === 'biz';
  $('#s-head').textContent = `${seg.from} → ${seg.to} · ${seg.no}`;
  const mine = S.seat[S.curSeg];
  const rowsHtml = (cab, isBiz) => {
    let h = ''; const cols = cab.letters.map((l) => l ? (isBiz ? 'var(--sb)' : 'var(--s)') : 'var(--a)').join(' ');
    h += `<div class="sg" style="grid-template-columns:${cols}">${cab.letters.map((l) => l ? `<div class="aisle">${l}</div>` : '<div></div>').join('')}</div>`;
    for (let r = cab.rows[0]; r <= cab.rows[1]; r++) {
      if (ac.skip.includes(r)) continue;
      const xl = !isBiz && ac.exits.includes(r);
      if (xl) h += `<div class="exit"><span>◀ EXIT</span><span>EXIT ▶</span></div>`;
      h += `<div class="sg" style="grid-template-columns:${cols}">` + cab.letters.map((l) => {
        if (!l) return `<div class="aisle">${r}</div>`;
        const id = r + l, idx = mine.findIndex((x) => x && x.id === id), taken = seatTaken(seg, id) && idx < 0, allowed = isBiz === biz;
        return `<button type="button" class="seat${isBiz ? ' biz' : ''}${xl ? ' xl' : ''}${idx >= 0 ? ' mine' : ''}" data-id="${id}" data-xl="${xl ? 1 : 0}" ${taken || !allowed ? 'disabled' : ''} aria-label="Seat ${id}${xl ? ', extra legroom' : ''}${taken ? ', taken' : ''}">${idx >= 0 ? 'P' + (idx + 1) : l}</button>`;
      }).join('') + '</div>';
    }
    return h;
  };
  $('#cabin').innerHTML = `<div class="wingL"></div><div class="wingR"></div><div class="cab-label">Business</div>${rowsHtml(ac.biz, true)}<div class="cab-label">Economy</div>${rowsHtml(ac.eco, false)}`;
  $$('#cabin .seat').forEach((b) => b.addEventListener('click', () => {
    const id = b.dataset.id, cur = mine.findIndex((x) => x && x.id === id);
    if (cur >= 0) { mine[cur] = null; S.curPax = cur; }
    else { mine[S.curPax] = { id, xl: b.dataset.xl === '1', free: seg.fare === 'flex' || seg.fare === 'biz' }; const next = mine.findIndex((x) => !x); S.curPax = next >= 0 ? next : S.curPax; if (next < 0 && S.curSeg < S.segs.length - 1) { setTimeout(() => { S.curSeg++; S.curPax = 0; renderSeats(); toast(`Now pick seats for ${S.segs[S.curSeg].from} → ${S.segs[S.curSeg].to}`); }, 350); } }
    renderSeats(); updateBar();
  }));
  $('#side').innerHTML = `<h3>${byCode(seg.from).city} → ${byCode(seg.to).city}</h3><div style="font-size:13.5px;color:var(--mute)">${nice(fromIso(seg.date))} · ${hm(seg.dep)} · ${ac.name} · ${biz ? 'Business' : FARES.find((f) => f.id === seg.fare).name}</div>
    ${S.segs.length > 1 ? `<div class="seg-tabs">${S.segs.map((s, i) => `<button type="button" data-s="${i}" aria-pressed="${i === S.curSeg}">${s.from}→${s.to}</button>`).join('')}</div>` : '<div style="height:14px"></div>'}
    ${mine.map((x, i) => `<div class="pax-row${i === S.curPax ? ' cur' : ''}"><span>Traveller ${i + 1}${i === S.curPax ? ' · picking' : ''}</span><b>${x ? x.id + (x.xl ? (x.free ? ' (XL)' : ' +89') : '') : '—'}</b></div>`).join('')}
    <p style="font-size:12.5px;color:var(--mute);margin:14px 0 0">Tap a seat to give it to the highlighted traveller. Tap it again to free it.</p>`;
  $$('#side .seg-tabs button').forEach((b) => b.addEventListener('click', () => { S.curSeg = +b.dataset.s; S.curPax = Math.max(0, S.seat[S.curSeg].findIndex((x) => !x)); renderSeats(); }));
  $$('#side .pax-row').forEach((r, i) => r.addEventListener('click', () => { S.curPax = i; renderSeats(); }));
}

/* ------------------------------------------------------------ travellers */
function renderPaxForm() {
  $('#pax-form').innerHTML = Array.from({ length: S.pax }, (_, i) => { const n = S.names[i] || {}; return `<fieldset><legend>Traveller ${i + 1}</legend>
    <label class="inp">Title<select name="t${i}">${['Mr', 'Ms', 'Mrs', 'Dr'].map((t) => `<option${n.t === t ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
    <label class="inp">Given names<input name="g${i}" required autocomplete="off" value="${n.g || ''}" placeholder="e.g. Aisyah"></label>
    <label class="inp">Family name<input name="f${i}" required autocomplete="off" value="${n.f || ''}" placeholder="e.g. Rahman"></label></fieldset>`; }).join('');
}
function readPax() {
  const f = $('#pax-form'); const names = [];
  for (let i = 0; i < S.pax; i++) { const g = f[`g${i}`].value.trim(), fam = f[`f${i}`].value.trim(); if (!g || !fam) { f[g ? `f${i}` : `g${i}`].focus(); toast(`Add a name for traveller ${i + 1}`); return false; } names.push({ t: f[`t${i}`].value, g, f: fam }); }
  S.names = names; return true;
}

/* ------------------------------------------------------------ boarding passes */
const PLANE_SVG = '<svg viewBox="0 0 24 24"><use href="#plane"/></svg>';
function issuePasses() {
  const pnr = (() => { const r = seeded(JSON.stringify(S.legs) + S.names.map((n) => n.f).join()); const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; return Array.from({ length: 6 }, () => A[Math.floor(r() * A.length)]).join(''); })();
  const out = [];
  S.segs.forEach((seg, si) => {
    const r = seeded(seg.no + seg.date), gate = (seg.from === 'KUL' ? ['C', 'G', 'H'][Math.floor(r() * 3)] : ['A', 'B', ''][Math.floor(r() * 3)]) + (1 + Math.floor(r() * 28)), board = seg.dep - (seg.ac === 'long' ? 50 : 35);
    S.names.forEach((n, pi) => {
      let st = S.seat[si] && S.seat[si][pi];
      if (!st) { const ac = AIRCRAFT[seg.ac], cab = seg.fare === 'biz' ? ac.biz : ac.eco; let tries = 0; do { const row = cab.rows[0] + Math.floor(r() * (cab.rows[1] - cab.rows[0])); const ls = cab.letters.filter(Boolean); st = { id: row + ls[Math.floor(r() * ls.length)] }; tries++; } while ((seatTaken(seg, st.id) || S.seat[si].some((x) => x && x.id === st.id)) && tries < 40); S.seat[si][pi] = st; }
      const d = fromIso(seg.date), zone = seg.fare === 'biz' ? 1 : +st.id.slice(0, -1) > 30 ? 4 : +st.id.slice(0, -1) > 20 ? 3 : 2;
      out.push({ n, seg, gate, board, seat: st.id, zone, pnr, seq: pad(20 + Math.floor(seeded(seg.no + n.f + pi)() * 260), 3), date: `${pad(d.getDate())}${MONTHS[d.getMonth()].toUpperCase()}`, cls: seg.fare === 'biz' ? 'BUSINESS' : 'ECONOMY' });
    });
  });
  S.passes = out;
  $('#pass-note').textContent = `Booking reference ${pnr}. ${out.length} boarding pass${out.length > 1 ? 'es' : ''} below. Bag drop closes 60 minutes before departure.`;
  $('#passes').innerHTML = out.map((p, i) => `<article class="bp" aria-label="Boarding pass ${p.n.f} ${p.seg.no}">
    <div class="bp-main"><div class="bp-top"><span class="logo"><svg aria-hidden="true"><use href="#swallow" fill="#e2a83c"/></svg>Layang Air</span><span class="cls">${p.cls} · BOARDING PASS</span></div>
      <div class="bp-route"><div><div class="code">${p.seg.from}</div><div class="city">${byCode(p.seg.from).city}</div></div><div class="mid"><hr>${PLANE_SVG}<hr></div><div style="text-align:right"><div class="code">${p.seg.to}</div><div class="city">${byCode(p.seg.to).city}</div></div></div>
      <div class="bp-grid">
        <div style="grid-column:span 2"><small>Passenger</small><b>${(p.n.f + '/' + p.n.g + ' ' + p.n.t).toUpperCase()}</b></div><div><small>Flight</small><b>${p.seg.no}</b></div><div><small>Date</small><b>${p.date}</b></div>
        <div class="big"><small>Boarding</small><b>${hm(p.board)}</b></div><div class="big"><small>Gate</small><b>${p.gate}</b></div><div class="big"><small>Seat</small><b>${p.seat}</b></div><div class="big"><small>Zone</small><b>${p.zone}</b></div>
        <div><small>Departs</small><b>${hm(p.seg.dep)}</b></div><div><small>Booking ref</small><b>${p.pnr}</b></div><div><small>Seq</small><b>${p.seq}</b></div><div><small>Sayap</small><b>BIRU</b></div>
      </div></div>
    <div class="bp-stub"><canvas width="200" height="92" data-code="${p.pnr + p.seg.no + p.seat}"></canvas><div class="mini"><div><small>Flight</small><b>${p.seg.no}</b></div><div><small>Seat</small><b>${p.seat}</b></div><div><small>Gate</small><b>${p.gate}</b></div><div><small>Board</small><b>${hm(p.board)}</b></div></div><div style="font-size:11px;color:var(--mute)">Gate closes 20 min before departure</div></div>
  </article>`).join('');
  $$('.bp-stub canvas').forEach(drawPdf417);
  $('#bar').hidden = true;
}
function drawPdf417(c) {
  const x = c.getContext('2d'), r = seeded(c.dataset.code), W = c.width, H = c.height; x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.fillStyle = '#111';
  const rows = 12, rh = H / rows;
  for (let y = 0; y < rows; y++) { let px = 0; const bar = (w, on) => { if (on) x.fillRect(px, y * rh, w, rh + .5); px += w; };
    [8, 1, 1, 1, 1, 1, 1, 3].forEach((w, i) => bar(w, i % 2 === 0)); // start pattern
    while (px < W - 22) { const w = 1 + Math.floor(r() * 3); bar(w, r() > .45); }
    px = W - 20; [7, 1, 1, 3, 1, 1, 1, 2, 1].forEach((w, i) => bar(w, i % 2 === 0)); }
}
$('#new-trip').addEventListener('click', () => { $('#results').hidden = $('#seats').hidden = $('#details').hidden = $('#pass').hidden = true; S.step = null; $('#top').scrollIntoView({ behavior: 'smooth' }); });
$('#save-pass').addEventListener('click', () => {
  const p = S.passes && S.passes[0]; if (!p) return; const c = document.createElement('canvas'); c.width = 1600; c.height = 620; const x = c.getContext('2d');
  x.fillStyle = '#fffdf8'; x.fillRect(0, 0, 1600, 620); x.fillStyle = '#0c3346'; x.fillRect(0, 0, 1600, 96);
  x.fillStyle = '#e2a83c'; x.font = '40px "DM Serif Display", serif'; x.fillText('Layang Air', 40, 62); x.font = '700 22px "JetBrains Mono", monospace'; x.fillText(p.cls + ' · BOARDING PASS', 1150, 60);
  x.fillStyle = '#13232d'; x.font = '800 110px "Plus Jakarta Sans", sans-serif'; x.fillText(p.seg.from, 40, 240); x.fillText(p.seg.to, 640, 240);
  x.font = '600 26px "Plus Jakarta Sans", sans-serif'; x.fillStyle = '#5d6c76'; x.fillText(byCode(p.seg.from).city, 44, 286); x.fillText(byCode(p.seg.to).city, 644, 286);
  const f = [['PASSENGER', (p.n.f + '/' + p.n.g + ' ' + p.n.t).toUpperCase()], ['FLIGHT', p.seg.no], ['DATE', p.date], ['BOARDING', hm(p.board)], ['GATE', p.gate], ['SEAT', p.seat], ['ZONE', '' + p.zone], ['REF', p.pnr]];
  f.forEach(([k, v], i) => { const cx = 40 + (i % 4) * 300, cy = 370 + Math.floor(i / 4) * 110; x.fillStyle = '#5d6c76'; x.font = '800 18px "Plus Jakarta Sans", sans-serif'; x.fillText(k, cx, cy); x.fillStyle = '#13232d'; x.font = '700 36px "JetBrains Mono", monospace'; x.fillText(v, cx, cy + 46); });
  const bc = document.createElement('canvas'); bc.width = 200; bc.height = 92; bc.dataset.code = p.pnr + p.seg.no + p.seat; drawPdf417(bc); x.imageSmoothingEnabled = false; x.drawImage(bc, 1260, 160, 300, 138);
  x.fillStyle = 'rgba(12,51,70,.3)'; x.font = '700 16px "JetBrains Mono", monospace'; x.fillText('SPECIMEN · FICTIONAL AIRLINE · Z LAB', 1180, 590);
  c.toBlob((b) => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `LayangAir-${p.pnr}-${p.seg.no.replace(' ', '')}.png`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); });
});

/* ------------------------------------------------------------ departures board */
const COLS = [5, 6, 16, 3, 14];
function klNow() { const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kuala_Lumpur', hour: '2-digit', minute: '2-digit', hour12: false, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()); const g = (t) => p.find((x) => x.type === t).value; return { mins: +g('hour') * 60 + +g('minute'), date: `${g('year')}-${g('month')}-${g('day')}` }; }
function boardRows() {
  const now = klNow(), rows = [];
  for (const dd of [0, 1]) { const date = iso(addDays(fromIso(now.date), dd)); DEST.forEach((d) => directFlights('KUL', d.code, date).forEach((f) => rows.push({ ...f, t: f.dep + dd * 1440, date }))); }
  return rows.filter((r) => r.t > now.mins - 25 && r.t < now.mins + 300).sort((a, b) => a.t - b.t).slice(0, 12).map((r) => {
    const rnd = seeded(r.no + r.date), gate = ['C', 'G', 'H'][Math.floor(rnd() * 3)] + (1 + Math.floor(rnd() * 28)), until = r.t - now.mins, delayed = rnd() < .14;
    let st = 'ON TIME', cls = 'st-ok';
    if (until < -4) { st = 'DEPARTED'; cls = 'st-ok'; } else if (until < 15) { st = 'FINAL CALL'; cls = 'st-bad'; } else if (until < 40) { st = 'BOARDING'; cls = 'st-go'; } else if (until < 75) { st = 'GATE OPEN'; cls = 'st-go'; }
    if (delayed && until > 15) { st = 'NEW TIME ' + hm(r.dep + 20 + Math.floor(rnd() * 4) * 10); cls = 'st-warn'; }
    return [hm(r.dep), r.no.replace(' ', ''), byCode(r.to).city.toUpperCase(), gate, st, cls];
  });
}
const flap = (txt, n) => { const s = txt.padEnd(n).slice(0, n); return s.split('').map((c) => `<i>${c === ' ' ? '&nbsp;' : c}</i>`).join(''); };
function renderBoard(first) {
  const tb = $('#board'), rows = boardRows();
  if (first || tb.children.length !== rows.length) { tb.innerHTML = rows.map((r) => `<tr>${r.slice(0, 5).map((v, i) => `<td><span class="flap ${i === 4 ? r[5] : ''}">${flap(v, COLS[i])}</span></td>`).join('')}</tr>`).join(''); return; }
  rows.forEach((r, ri) => { const tr = tb.children[ri]; r.slice(0, 5).forEach((v, ci) => { const span = tr.children[ci].firstElementChild; if (ci === 4) span.className = 'flap ' + r[5]; const s = v.padEnd(COLS[ci]).slice(0, COLS[ci]); [...span.children].forEach((el, k) => { const ch = s[k] === ' ' ? ' ' : s[k]; if (el.textContent !== ch) { setTimeout(() => { el.textContent = ch; el.classList.remove('flip'); void el.offsetWidth; el.classList.add('flip'); }, k * 40 + ri * 30); } }); }); });
}
renderBoard(true); setInterval(() => renderBoard(false), 20000);

/* ------------------------------------------------------------ destinations */
const REG = ['All', 'Malaysia', 'Asia', 'Australia', 'Middle East', 'Europe']; let reg = 'All';
function renderDests() {
  $('#filters').innerHTML = REG.map((r) => `<button type="button" class="chip" aria-pressed="${r === reg}">${r}</button>`).join('');
  $$('#filters .chip').forEach((b) => b.addEventListener('click', () => { reg = b.textContent; renderDests(); }));
  $('#dests').innerHTML = DEST.filter((d) => reg === 'All' || d.region === reg).map((d) => `<button type="button" class="dest" data-code="${d.code}"><img src="tex/dest/${d.code}.jpg" alt="Satellite view over ${d.city}" loading="lazy" onerror="this.remove()"><span class="code">KUL → ${d.code}</span><div class="in"><h3>${d.city}</h3><p>${d.tag} · ${d.country}</p><div class="row"><span>${dur(d.mins)} nonstop</span><span>from <b>${rm(d.fare)}</b></span></div></div></button>`).join('');
  $$('#dests .dest').forEach((b) => b.addEventListener('click', () => { S.from = 'KUL'; S.to = b.dataset.code; syncForm(); $('#top').scrollIntoView({ behavior: 'smooth' }); toast(`Kuala Lumpur → ${byCode(S.to).city}. Pick your dates and search.`); }));
}
renderDests();

/* ------------------------------------------------------------ nav, globe, fleet */
const nav = $('#nav'); addEventListener('scroll', () => nav.classList.toggle('solid', scrollY > 40), { passive: true });
let globe = null;
import('./globe.js').then(({ initGlobe }) => {
  try { globe = initGlobe($('#globe'), $('#gl-labels'), { onPick: (code) => { S.from = 'KUL'; S.to = code; syncForm(); toast(`Flying to ${byCode(code).city}`); } }); window.__layang = { globe, S }; syncForm(); }
  catch (e) { console.warn(e); $('#globe').style.background = 'radial-gradient(circle at 70% 40%, #12384d, #06141d 60%)'; }
}).catch((e) => console.warn('globe', e));
syncForm();
let fleet = null;
new IntersectionObserver((es, o) => { if (es[0].isIntersecting && !fleet) { o.disconnect(); import('./fleet.js').then(({ initFleet }) => { try { fleet = initFleet($('#fleet3d')); } catch (e) { console.warn(e); } }); } }, { rootMargin: '600px' }).observe($('#fleet3d'));
$$('.views button').forEach((b) => b.addEventListener('click', () => fleet && fleet.view(b.dataset.v)));
