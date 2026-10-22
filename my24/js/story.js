// Malaysia in 24 Hours — scroll-driven story over a sun-lit 3D map.
import { createMap, riseSet, sunAlt } from './map24.js';

const $ = (s) => document.querySelector(s), $$ = (s) => [...document.querySelectorAll(s)];
const pad = (n) => String(n).padStart(2, '0');
const hm = (m) => { m = Math.round(m); m = ((m % 1440) + 1440) % 1440; return pad(Math.floor(m / 60)) + ':' + pad(m % 60); };
const fmt = (n) => Math.round(n).toLocaleString('en-MY');

/* ------------------------------------------------------------ the numbers (2025 annual totals unless noted) */
const SRC = [
  ['DOSM, Current Population Estimates 2026', 'https://www.dosm.gov.my/portal-main/release-content/current-population-estimates-2026'],
  ['DOSM vital statistics 2025, reported by Malay Mail (15 Oct 2026)', 'https://malaymail.com/news/malaysia/2026/10/15/malaysias-births-fall-45pc-in-2025-as-fertility-rate-drops-to-15-children-per-woman/239184'],
  ['Prasarana ridership 2025, reported by SAYS', 'https://says.com/my/news/more-malaysians-are-taking-public-transport-than-ever'],
  ['MPOB, Overview of the Malaysian Oil Palm Industry 2025', 'https://bepi.mpob.gov.my/images/overview/Overview2025.pdf'],
  ['DOSM external trade 2025, reported by Bernama', 'https://bernamabiz.com/news.php?id=2587949'],
  ['MAA vehicle sales 2025, reported by Malay Mail', 'https://malaymail.com/news/malaysia/2026/01/20/malaysias-automotive-industry-hits-second-straight-record-year-with-820752-vehicles-sold-in-2025/206082'],
  ['TNB press clipping, record peak demand (16 Jul 2025)', 'https://www.tnb.com.my/assets/newsclip/16072025b.pdf'],
  ['MAHB passenger traffic 2025, reported by Malay Mail', 'https://malaymail.com/news/malaysia/2026/01/19/malaysias-airports-ride-festive-surge-as-passenger-traffic-soars-past-153-million-ahead-of-visit-malaysia-2026/205996'],
  ['Tourism Malaysia arrivals 2025, reported by SAYS', 'https://says.com/my/news/malaysia-records-42-2-million-visitors-in-2025'],
  ['NASA Visible Earth: Blue Marble, Black Marble; GEBCO relief', 'https://visibleearth.nasa.gov/']
];
const D = { pop: 34.4e6, births: 396175 / 365, deaths: 199807 / 365, rail: 1.31e6, railRec: 1.63e6, cpo: 20283475 / 365, exports: 1.6e12 / 365, cars: 820752 / 365, peak: 21049, klia: 63.3e6 / 365, visitors: 42.2e6 / 365 };
const src = (...i) => `<span class="src">Source: ${i.map((k) => `<a href="${SRC[k][1]}" target="_blank" rel="noopener">${SRC[k][0].split(',')[0].split(' reported')[0]}</a>`).join(', ')}</span>`;

/* today in Kuala Lumpur, and live sun times */
const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long' }).formatToParts(new Date());
const P = (t) => parts.find((x) => x.type === t).value; const Y = +P('year'), M = +P('month') - 1, DD = +P('day');
const at = (min) => new Date(Date.UTC(Y, M, DD, 0, 0) + (min - 480) * 60000);
const TAW = riseSet(Y, M, DD, 4.245, 117.89), LGK = riseSet(Y, M, DD, 6.35, 99.8), KK = riseSet(Y, M, DD, 5.98, 116.07), GT = riseSet(Y, M, DD, 5.41, 100.33);
const gap = (a, b) => { const m = Math.round(b - a); return `${Math.floor(m / 60)} h ${pad(m % 60)} min`; };
$('#date').textContent = `${P('weekday')} ${DD} ${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][M]} · Kuala Lumpur time`;

/* ------------------------------------------------------------ chapters */
const CH = [
  { t: 0, intro: true, view: { lon: 109.3, lat: 3.9, dist: 15, tilt: 58, yaw: 0 }, pview: { lon: 102.2, lat: 3.6, dist: 7.5 }, html: `<div class="kicker">A Z Lab data story</div><h1>Malaysia<br>in <i>24</i> hours.</h1><p>One ordinary day across a country that is 1,700 km wide and runs on a single clock: what moves, what's made and who arrives, from midnight to midnight.</p><div class="cue"><i></i>Scroll to start the day</div>` },
  { t: 30, view: { lon: 105.6, lat: 3.6, dist: 13.5, tilt: 55, yaw: -4 }, pview: { lon: 102.0, lat: 3.9, dist: 7 }, labels: [[101.69, 3.14, 'Kuala Lumpur'], [100.33, 5.41, 'George Town'], [103.76, 1.49, 'Johor Bahru'], [110.35, 1.55, 'Kuching'], [116.07, 5.98, 'Kota Kinabalu']],
    html: `<div class="time">00:30</div><h2>Midnight, and the lights stay on.</h2><div class="stat" data-n="${D.pop}" data-f="m">34.4<small>million people</small></div><p>From orbit you can trace where they live: a bright west-coast corridor from Penang down to Johor Bahru, then scattered pearls along the Borneo coast. The mamak at the corner is still serving teh tarik.</p>${src(0)}` },
  { t: TAW.rise + 6, view: { lon: 113.5, lat: 4.3, dist: 12, tilt: 46, yaw: 22 }, labels: [[117.89, 4.25, 'Tawau', `sunrise ${hm(TAW.rise)}`], [116.07, 5.98, 'Kota Kinabalu', `sunrise ${hm(KK.rise)}`], [99.8, 6.35, 'Langkawi', `sunrise ${hm(LGK.rise)}`]],
    html: `<div class="time">${hm(TAW.rise)}</div><h2>The sun reaches Sabah first.</h2><div class="stat">${gap(TAW.rise, LGK.rise)}</div><p>That's how much earlier the sun rose in <b>Tawau</b> today (${hm(TAW.rise)}) than in <b>Langkawi</b> (${hm(LGK.rise)}). The whole country shares one time zone, so dawn rolls west across the South China Sea while every clock reads the same.</p><span class="src">Calculated live for today from the sun's position.</span>` },
  { t: 465, view: { lon: 101.66, lat: 3.1, dist: 2.3, tilt: 52, yaw: -10 }, layer: 'commute', labels: [[101.695, 3.147, 'KL Sentral & KLCC'], [101.59, 3.07, 'Petaling Jaya'], [101.45, 3.04, 'Klang'], [101.7, 2.93, 'Putrajaya']],
    html: `<div class="time">07:45</div><h2>The Klang Valley commute.</h2><div class="stat" data-n="${D.rail}" data-f="m2">1.31<small>million trips a day</small></div><p>That's the 2025 average on Prasarana's Rapid KL network of LRT, MRT and monorail lines, its busiest year since before the pandemic. The record: <b>1.63 million</b> on New Year's Eve 2025.</p>${src(2)}` },
  { t: 600, view: { lon: 110.5, lat: 3.6, dist: 12.5, tilt: 50, yaw: 8 }, pview: { lon: 114.5, lat: 3.8, dist: 8 }, glow: [117.4, 5.1, 1.4, .35], labels: [[103.3, 2.2, 'Johor'], [102.9, 3.6, 'Pahang'], [117.6, 5.2, 'Sabah'], [113.6, 2.7, 'Sarawak']],
    html: `<div class="time">10:00</div><h2>On the estates.</h2><div class="stat" data-n="${D.cpo}" data-f="i">55,600<small>tonnes a day</small></div><p>Of crude palm oil, on an average day in 2025, when Malaysia produced <b>20.28 million tonnes</b>, up from 19.34 million in 2024. The biggest planted areas are in Sarawak, Sabah, Pahang and Johor.</p>${src(3)}` },
  { t: 690, view: { lon: 102.4, lat: 3.2, dist: 7.5, tilt: 50, yaw: -12 }, layer: 'exports', labels: [[101.36, 3.0, 'Port Klang'], [103.55, 1.36, 'Tanjung Pelepas'], [100.36, 5.4, 'Penang Port']],
    html: `<div class="time">11:30</div><h2>Out through the ports.</h2><div class="stat" data-n="${D.exports}" data-f="rmb">RM4.4<small>billion exported</small></div><p>Every day, on average. Exports reached <b>RM1.6 trillion</b> in 2025 and total trade passed <b>RM3.1 trillion</b> for the first time, leaving a surplus of RM156.8 billion. Electrical and electronic goods, many from Penang's chip plants, are the biggest single category.</p>${src(4)}` },
  { t: 780, view: { lon: 101.75, lat: 3.3, dist: 4.2, tilt: 48, yaw: 6 }, glow: [101.62, 3.1, .5, .5], labels: [[101.69, 3.14, 'Kuala Lumpur']],
    html: `<div class="time">13:00</div><h2>New cars on the road.</h2><div class="stat" data-n="${D.cars}" data-f="i">2,249<small>new vehicles a day</small></div><p>Malaysians bought <b>820,752</b> new vehicles in 2025, a second record year in a row. That's another car-park's worth joining the jam on the Federal Highway every single day.</p>${src(5)}` },
  { t: 900, view: { lon: 102.0, lat: 4.0, dist: 8, tilt: 52, yaw: -6 }, glow: [101.7, 3.2, .9, 1], labels: [[101.69, 3.14, 'Klang Valley'], [103.76, 1.49, 'Johor Bahru'], [100.33, 5.41, 'Penang']],
    html: `<div class="time">15:00</div><h2>The grid at full stretch.</h2><div class="stat" data-n="${D.peak}" data-f="raw">21,049<small>megawatts</small></div><p>The record peak demand TNB reported, set on <b>28 May 2025</b>. On hot afternoons, millions of air-conditioners and a fast-growing cluster of data centres, especially in Johor, pull the grid towards its limit.</p>${src(6)}` },
  { t: 1050, view: { lon: 104.5, lat: 3.5, dist: 10.5, tilt: 50, yaw: -4 }, pview: { lon: 102.6, lat: 3.4, dist: 7 }, layer: 'flights', labels: [[101.71, 2.75, 'KLIA'], [116.05, 5.94, 'Kota Kinabalu'], [110.35, 1.48, 'Kuching']],
    html: `<div class="time">17:30</div><h2>Arrivals and departures.</h2><div class="stat" data-n="${D.klia}" data-f="i">173,400<small>through KLIA</small></div><p>An average day at Kuala Lumpur International Airport, which handled <b>63.3 million</b> passengers in 2025.</p><div class="pair"><div><b>115,600</b><span>visitors arrive in Malaysia each day</span></div><div><b>42.2 m</b><span>visitor arrivals in 2025</span></div></div>${src(7, 8)}` },
  { t: LGK.set - 4, view: { lon: 103.0, lat: 5.2, dist: 9, tilt: 40, yaw: -40 }, labels: [[99.8, 6.35, 'Langkawi', `sunset ${hm(LGK.set)}`], [100.33, 5.41, 'George Town', `sunset ${hm(GT.set)}`], [117.89, 4.25, 'Tawau', `sunset ${hm(TAW.set)}`]],
    html: `<div class="time">${hm(LGK.set)}</div><h2>Sunset rolls west.</h2><div class="stat">${hm(LGK.set)}</div><p>The last light of the day lands on <b>Langkawi</b>. In <b>Tawau</b> the sun went down at ${hm(TAW.set)}, and Maghrib is long past. Across the peninsula the night markets are setting up.</p><span class="src">Calculated live for today from the sun's position.</span>` },
  { t: 1290, view: { lon: 107.8, lat: 3.7, dist: 14, tilt: 56, yaw: 4 }, pview: { lon: 102.3, lat: 3.7, dist: 7.5 }, layer: 'births',
    html: `<div class="time">21:30</div><h2>And new lives begin.</h2><div class="stat" data-n="${D.births}" data-f="i">1,085<small>babies a day</small></div><p>One about every <b>80 seconds</b>. Malaysia recorded 396,175 births in 2025, 4.5% fewer than the year before, as the fertility rate fell to 1.5 children per woman.</p><div class="pair"><div><b>547</b><span>deaths a day</span></div><div><b>199,807</b><span>deaths in 2025</span></div></div>${src(1)}` },
  { t: 1439, end: true, view: { lon: 109.3, lat: 3.9, dist: 15, tilt: 60, yaw: 0 } }
];

/* ------------------------------------------------------------ build the story */
const story = $('#story');
CH.forEach((c, i) => { if (c.end) return; const s = document.createElement('section'); s.className = 'step' + (c.intro ? ' intro on' : ''); s.dataset.i = i; s.innerHTML = `<div class="card">${c.html}</div>`; story.appendChild(s); });
const steps = $$('.step');
$('#grid').innerHTML = [
  [fmt(D.births), 'babies born', '396,175 in 2025'], [fmt(D.deaths), 'deaths', '199,807 in 2025'], ['1.31 m', 'trips on Rapid KL', '2025 daily average'], [fmt(Math.round(D.cpo / 100) * 100) + ' t', 'crude palm oil', '20.28 million t in 2025'],
  ['RM4.4 bn', 'of exports', 'RM1.6 trillion in 2025'], [fmt(D.cars), 'new vehicles sold', '820,752 in 2025'], [fmt(Math.round(D.klia / 100) * 100), 'passengers at KLIA', '63.3 million in 2025'], [fmt(Math.round(D.visitors / 100) * 100), 'visitors arriving', '42.2 million in 2025'],
  [gap(TAW.rise, LGK.rise), 'between the first and last sunrise', `today, Tawau → Langkawi`], ['21,049 MW', 'record peak power demand', '28 May 2025']
].map(([b, s, sm]) => `<div class="tile"><b>${b}</b><span>${s}</span><small>${sm}</small></div>`).join('');
$('#sources').innerHTML = SRC.map(([n, u]) => `<li><a href="${u}" target="_blank" rel="noopener">${n}</a></li>`).join('');

/* ------------------------------------------------------------ map */
let map = null;
try { map = createMap($('#map'), {}); } catch (e) { console.warn(e); $('#map').style.background = 'radial-gradient(ellipse at 40% 50%, #0d2232, #05080c 70%)'; }
const labEls = new Map(); let labs = [];
function setLabels(list = []) {
  labs = list.map(([lon, lat, name, sub]) => { const k = name + (sub || ''); let e = labEls.get(k); if (!e) { e = document.createElement('div'); e.className = 'lab'; e.innerHTML = name + (sub ? `<small>${sub}</small>` : ''); $('#labels').appendChild(e); labEls.set(k, e); } return { e, lon, lat }; });
  labEls.forEach((e) => e.classList.remove('on')); requestAnimationFrame(() => labs.forEach((l) => l.e.classList.add('on')));
}
(function place() { requestAnimationFrame(place); if (!map) return; labs.forEach((l) => { const p = map.project(l.lon, l.lat), half = l.e.offsetWidth / 2 + 8; l.e.style.left = Math.max(half, Math.min(innerWidth - half, p.x)) + 'px'; l.e.style.top = p.y + 'px'; l.e.style.visibility = p.vis && p.x > -40 && p.x < innerWidth + 40 ? '' : 'hidden'; }); })();

/* ------------------------------------------------------------ scroll → time, chapter */
let cur = -1;
function countUp(el) {
  const n = +el.dataset.n, f = el.dataset.f; if (!n || el.dataset.done) return; el.dataset.done = 1; const small = el.querySelector('small').outerHTML, t0 = performance.now();
  const show = (v) => f === 'm' ? (v / 1e6).toFixed(1) : f === 'm2' ? (v / 1e6).toFixed(2) : f === 'rmb' ? 'RM' + (v / 1e9).toFixed(1) : fmt(f === 'i' && n > 10000 ? Math.round(v / 100) * 100 : f === 'raw' ? v : v);
  (function tick() { const k = Math.min(1, (performance.now() - t0) / 1400), e = 1 - Math.pow(1 - k, 3); el.innerHTML = show(n * e) + small; if (k < 1) requestAnimationFrame(tick); })();
}
function enter(i) {
  if (i === cur) return; cur = i; const c = CH[i];
  steps.forEach((s) => s.classList.toggle('on', +s.dataset.i === i));
  if (map) { map.flyTo(innerWidth / innerHeight < .9 && c.pview ? { ...c.view, ...c.pview } : c.view); map.setLayer(c.layer || null); if (c.glow) map.setGlow(...c.glow); else map.setGlow(0, 0, 1, 0); }
  setLabels(c.labels); const st = steps.find((s) => +s.dataset.i === i); const n = st && st.querySelector('.stat[data-n]'); if (n) countUp(n);
}
function onScroll() {
  const mid = innerHeight * .62; let i = 0, frac = 0;
  steps.forEach((s, k) => { const r = s.getBoundingClientRect(); if (r.top < mid) { i = +s.dataset.i; frac = Math.min(1, (mid - r.top) / r.height); } });
  const endTop = $('#end').getBoundingClientRect().top; if (endTop < mid) { i = CH.length - 1; frac = 0; }
  enter(i);
  const a = CH[i].t, b = (CH[i + 1] || CH[i]).t, m = a + (b - a) * frac;
  setClock(m);
}
function setClock(m) {
  $('#clock').innerHTML = hm(m) + '<em>MYT</em>'; $('#dot').style.top = (m / 1440 * 100) + '%';
  if (map) map.setTime(at(m));
  const kk = sunAlt(at(m), 5.98, 116.07) > -.83, gt = sunAlt(at(m), 5.41, 100.33) > -.83;
  $('#sunline').textContent = kk && gt ? 'Sun up across Malaysia' : !kk && !gt ? 'Night across Malaysia' : kk ? 'Sun up in Sabah · still dark in Penang' : 'Dark in Sabah · sun still up in Penang';
}
addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll);
onScroll(); if (map) map.flyTo(innerWidth / innerHeight < .9 ? { ...CH[0].view, ...CH[0].pview } : CH[0].view, true);

/* ------------------------------------------------------------ live counters since the page opened */
const t0 = performance.now();
function since() {
  const s = (performance.now() - t0) / 1000, k = s / 86400;
  const b = D.births * k, ex = D.exports * k, cpo = D.cpo * k, kl = D.klia * k;
  $('#ticker').innerHTML = `Since you opened this page: <b>${b.toFixed(b < 10 ? 1 : 0)}</b> babies born · <b>RM${(ex / 1e6).toFixed(1)} m</b> exported · <b>${cpo.toFixed(1)} t</b> of palm oil · <b>${fmt(kl)}</b> people through KLIA`;
  const mins = Math.floor(s / 60), secs = Math.floor(s % 60);
  $('#since-text').innerHTML = `You've been here <b>${mins ? mins + ' min ' : ''}${secs} s</b>. In that time, on an average day, about <b>${b.toFixed(1)}</b> babies were born, <b>RM${(ex / 1e6).toFixed(1)} million</b> of goods left the country, <b>${cpo.toFixed(1)} tonnes</b> of palm oil were pressed and <b>${fmt(kl)}</b> people passed through KLIA.`;
}
since(); setInterval(since, 1000);
