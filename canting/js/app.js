import { Batik, DYES, MOTIFS, motifPreview, rng } from './batik.js';
import { initStudio } from './studio3d.js';

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const dyeById = (id) => DYES.find((d) => d.id === id);
const rgbCss = (a) => `rgb(${a.join(',')})`;
let toastT; function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 3200); }

// ---------- the cloth + studio
const batik = new Batik();
batik.auto(11, [dyeById('kunyit').rgb, dyeById('mengkudu').rgb, dyeById('nila').rgb]);
let studio = null;
try { studio = initStudio($('#c'), batik); studio.texDirty(); studio.setDye(dyeById('nila').rgb); } catch (e) { console.warn('3D unavailable', e); }
window.__canting = { batik, get studio() { return studio; } };

const S = { step: 'wax', tool: 'fine', motif: 'bunga', cap: 140, dye: 'kunyit', depth: .85, baths: [], boiled: false, busy: false, product: 'sarong', fresh: true, ordered: false };
const PRODUCTS = [
  { id: 'sarong', name: 'Sarong', note: '2 m, hemmed tube', price: 180 },
  { id: 'selendang', name: 'Selendang', note: 'Long scarf, 2.2 m', price: 120 },
  { id: 'cushion', name: 'Cushion covers', note: 'Pair, 45 × 45 cm', price: 95 },
  { id: 'hanging', name: 'Wall hanging', note: 'Framed, 1 × 1 m', price: 240 },
];

// ---------- build controls
$('#motifs').innerHTML = ''; MOTIFS.forEach((m) => { const b = document.createElement('button'); b.type = 'button'; b.dataset.motif = m.id; b.setAttribute('aria-pressed', String(m.id === S.motif)); b.appendChild(motifPreview(m.id, 40)); b.append(m.name); $('#motifs').appendChild(b); });
$('#dyes').innerHTML = DYES.map((d) => `<button type="button" data-dye="${d.id}" aria-pressed="${d.id === S.dye}" style="--d:${rgbCss(d.rgb)}"><i></i><span><b>${esc(d.name)}</b><small>${esc(d.note)}</small></span></button>`).join('');
$('#prods').innerHTML = PRODUCTS.map((p) => `<button type="button" data-prod="${p.id}" aria-pressed="${p.id === S.product}"><b>${p.name}</b><span>${p.note}</span><em>RM ${p.price}</em></button>`).join('');

function setStep(step) {
  S.step = step;
  $$('#steps button').forEach((b) => { const st = b.dataset.step; b.classList.toggle('on', st === step); b.disabled = (st === 'boil' && (!S.baths.length || S.boiled)) || (st === 'make' && !S.boiled) || ((st === 'wax' || st === 'dye') && S.boiled); b.classList.toggle('done', (st === 'dye' && S.baths.length > 0) || (st === 'boil' && S.boiled)); });
  $$('[data-pane]').forEach((p) => { p.hidden = p.dataset.pane !== step; });
  document.body.classList.toggle('tool-draw', step === 'wax');
  if (studio) { if (step === 'make') { studio.setProduct(S.product); studio.setMode('product'); } else { studio.setProduct(null); studio.setMode(step === 'wax' ? 'wax' : 'review'); } }
  if (step === 'make') { $('#dl').href = batik.toImage(1); updateTotal(); }
  renderFoot(); renderBaths(); $('#pb').scrollTop = 0;
}
function renderFoot() {
  const back = $('#back'), next = $('#next'); back.hidden = S.step === 'wax' || (S.step === 'make' && S.ordered); next.disabled = S.busy;
  if (S.step === 'wax') { next.textContent = 'Next: dye'; }
  else if (S.step === 'dye') { next.textContent = `Dip in ${dyeById(S.dye).name.split(' ')[1]}`; back.textContent = S.baths.length ? 'Wax again' : 'Back'; }
  else if (S.step === 'boil') { next.textContent = S.boiled ? 'Next: make it' : 'Boil off the wax'; back.textContent = 'Back'; back.hidden = S.boiled; }
  else { next.textContent = S.ordered ? 'Done' : 'Place order'; back.textContent = 'Back'; back.hidden = S.ordered; }
  if (S.step === 'dye' && S.baths.length) { if (!$('#toboil')) { const b = document.createElement('button'); b.className = 'btn warm sm'; b.id = 'toboil'; b.type = 'button'; b.textContent = 'Finished dyeing → Lorod'; b.onclick = () => setStep('boil'); $('[data-pane="dye"] .row').appendChild(b); } } else $('#toboil')?.remove();
}
function renderBaths() { $('#baths').innerHTML = S.baths.length ? `${S.baths.map((id) => `<i style="--d:${rgbCss(dyeById(id).rgb)}"></i>`).join('')}<span style="margin-left:8px">${S.baths.length} dye bath${S.baths.length > 1 ? 's' : ''} so far</span>` : '<span>No dye baths yet</span>'; }

// open / close studio
function openStudio() {
  scrollTo(0, 0); document.documentElement.style.overflow = 'hidden'; document.body.classList.add('studio');
  if (S.fresh) { batik.reset(); batik.undo = []; S.fresh = false; studio && studio.texDirty(); }
  setStep(S.boiled ? (S.step === 'make' ? 'make' : 'boil') : S.step);
}
function closeStudio() { document.documentElement.style.overflow = ''; document.body.classList.remove('studio', 'tool-draw'); if (studio) { studio.setProduct(null); studio.setMode('hero'); } }
$$('[data-open]').forEach((b) => b.addEventListener('click', openStudio));
$('#exit').addEventListener('click', closeStudio);
addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.body.classList.contains('studio') && !S.busy) closeStudio(); });

// steps bar
$('#steps').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b || b.disabled || S.busy) return; setStep(b.dataset.step); });
$('#tools').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; S.tool = b.dataset.tool; $$('#tools button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); $('#capopts').hidden = S.tool !== 'cap'; });
$('#motifs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; S.motif = b.dataset.motif; $$('#motifs button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); });
$('#capsize').addEventListener('input', (e) => { S.cap = +e.target.value; });
$('#depth').addEventListener('input', (e) => { S.depth = +e.target.value / 100; });
$('#dyes').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; S.dye = b.dataset.dye; $$('#dyes button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); studio && studio.setDye(dyeById(S.dye).rgb); renderFoot(); });
$('#prods').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b || S.ordered) return; S.product = b.dataset.prod; $$('#prods button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); studio && studio.setProduct(S.product); updateTotal(); });
$('#order').addEventListener('change', updateTotal);
function updateTotal() { const p = PRODUCTS.find((x) => x.id === S.product), col = $('#order').elements.col.selectedIndex, ship = [0, 15, 25][col]; $('#total').textContent = `RM ${p.price + ship}`; return p.price + ship; }

$('#undo').addEventListener('click', () => { if (batik.restore()) { studio && studio.texDirty(); } else toast('Nothing to undo yet.'); });
$('#undo2').addEventListener('click', () => { if (!S.baths.length) return toast('No dye bath to undo.'); if (batik.restore()) { S.baths.pop(); studio && studio.texDirty(); renderBaths(); renderFoot(); setStep('dye'); } });
$('#clear').addEventListener('click', () => { batik.save(); batik.reset(); S.baths = []; studio && studio.texDirty(); renderBaths(); toast('Fresh white cloth on the frame.'); setStep('wax'); });
$('#pattern').addEventListener('click', () => { batik.save(); const r = rng(Date.now() & 0xffff), cols = 4, sz = 1024 / cols; for (let y = 0; y < cols; y++) for (let x = 0; x < cols; x++) batik.stamp(S.motif, (x + .5) / cols, (y + .5) / cols, sz * .72, (x + y) % 2 ? Math.PI : 0); for (let i = 0; i < 2; i++) batik.line(0, i ? .985 : .015, 1, i ? .985 : .015, 12); studio && studio.texDirty('wax'); toast(`Stamped a ${MOTIFS.find((m) => m.id === S.motif).name} pattern. Draw on top or go to Dye.`); });

// footer buttons
$('#back').addEventListener('click', () => { if (S.busy) return; const order = ['wax', 'dye', 'boil', 'make']; const i = order.indexOf(S.step); if (S.step === 'make') return setStep('boil'); if (i > 0) setStep(order[i - 1]); });
$('#next').addEventListener('click', async () => {
  if (S.busy) return;
  if (S.step === 'wax') return setStep('dye');
  if (S.step === 'dye') return dip();
  if (S.step === 'boil') return S.boiled ? setStep('make') : boil();
  if (S.step === 'make') return S.ordered ? closeStudio() : placeOrder();
});
function setBusy(on, txt) { S.busy = on; $('#busy').hidden = !on; if (txt) $('#busytxt').textContent = txt; renderFoot(); }
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function dip() {
  const d = dyeById(S.dye); setBusy(true, `Dipping in ${d.name}…`);
  if (!studio) { batik.save(); batik.dye(d.rgb, S.depth); S.baths.push(d.id); setBusy(false); setStep('dye'); return; }
  studio.setDye(d.rgb); studio.setMode('dye'); await wait(1100);
  await studio.sequence('dye', () => { batik.save(); batik.dye(d.rgb, S.depth); studio.texDirty('color'); });
  S.baths.push(d.id); studio.setMode('review'); setBusy(false); renderBaths(); setStep('dye');
  toast(S.baths.length === 1 ? `First bath done. Wax over the ${d.name.split(' ')[1]} you want to keep, then dip again.` : `${d.name} added. ${S.baths.length} baths so far.`);
}
async function boil() {
  setBusy(true, 'Boiling off the wax…');
  if (!studio) { batik.lorod(); S.boiled = true; setBusy(false); setStep('boil'); return; }
  studio.setDye([214, 206, 190]); studio.setMode('boil'); await wait(1100);
  await studio.sequence('boil', null, () => { batik.lorod(); studio.texDirty('wax'); });
  S.boiled = true; studio.setDye(dyeById(S.dye).rgb); setBusy(false); $('#boiled').hidden = false; setStep('boil');
}
function placeOrder() {
  const f = $('#order').elements, err = $('#oerr'); err.textContent = '';
  if (!f.nm.value.trim() || !f.ct.value.trim()) { err.textContent = 'Please add your name and a phone number or email.'; return; }
  const code = 'CT-' + Math.random().toString(36).slice(2, 7).toUpperCase(), p = PRODUCTS.find((x) => x.id === S.product);
  S.ordered = true; $('#order').hidden = true; $$('#prods button').forEach((b) => { b.disabled = true; });
  $('#placed').innerHTML = `<div class="okbox"><b>Order ${code} received.</b>${esc(f.nm.value.trim().split(' ')[0])}, we'll make your ${p.name.toLowerCase()} by hand and message you within a day to confirm. Total RM ${updateTotal()}, paid on collection or by FPX once confirmed. Allow about 10 working days.<br><br><small>This is a Z Lab demo: no real order was placed.</small></div>`;
  renderFoot();
}
$('#again').addEventListener('click', () => { Object.assign(S, { baths: [], boiled: false, ordered: false, step: 'wax' }); batik.reset(); batik.undo = []; $('#boiled').hidden = true; $('#order').hidden = false; $('#order').reset(); $('#placed').innerHTML = ''; $$('#prods button').forEach((b) => { b.disabled = false; }); studio && studio.texDirty(); setStep('wax'); });

// drawing on the cloth
const cv = $('#c'); let drawing = false, lastUV = null;
const width = () => S.tool === 'bold' ? 12 : 4.5;
cv.addEventListener('pointerdown', (e) => {
  if (!studio || !document.body.classList.contains('studio') || S.step !== 'wax' || S.busy) return;
  const uv = studio.pick(e.clientX, e.clientY); if (!uv) return; e.preventDefault(); batik.save();
  if (S.tool === 'cap') { batik.stamp(S.motif, uv.x, uv.y, S.cap, 0); studio.texDirty('wax'); return; }
  drawing = true; lastUV = { x: uv.x, y: uv.y }; batik.dot(uv.x, uv.y, width() * 1.3); studio.texDirty('wax'); cv.setPointerCapture(e.pointerId);
});
cv.addEventListener('pointermove', (e) => {
  if (!drawing) return; const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
  for (const ev of evs) { const uv = studio.pick(ev.clientX, ev.clientY); if (!uv) continue; batik.line(lastUV.x, lastUV.y, uv.x, uv.y, width()); if (Math.random() < .015) batik.dot(uv.x + (Math.random() - .5) * .01, uv.y - .006, width() * 1.6); lastUV = { x: uv.x, y: uv.y }; }
  studio.texDirty('wax');
});
const endDraw = () => { drawing = false; lastUV = null; };
cv.addEventListener('pointerup', endDraw); cv.addEventListener('pointercancel', endDraw);

// ---------- page sections
const WS = [
  { tag: 'Most popular', name: 'Canting basics', len: '3 hours', price: 85, days: [6], time: '10 am', d: 'Learn to hold the canting, draw your first lines and dye a 50 cm panel in two colours.', inc: ['All materials and apron', 'One 50 × 50 cm panel to take home', 'Teh tarik and kuih'] },
  { tag: 'Quick', name: 'Cap stamping', len: '2 hours', price: 65, days: [0], time: '2 pm', d: 'Stamp a repeat pattern with our copper caps and finish a tote bag in one colour.', inc: ['Choice of 12 vintage caps', 'Cotton tote bag', 'Great for families (age 10+)'] },
  { tag: 'Deep dive', name: 'Two-day sarong', len: 'Sat & Sun', price: 420, days: [6], time: '9 am', d: 'Design, wax and dye a full-length sarong in four colours with one of our senior makers.', inc: ['2 m of fine cotton', 'Lunch both days', 'Your finished, hemmed sarong'] },
];
function nextDates(days, n = 4) { const out = []; const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + 1); while (out.length < n) { if (days.includes(d.getDay())) out.push(new Date(d)); d.setDate(d.getDate() + 1); } return out; }
const fmt = (d) => d.toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short' });
$('#ws').innerHTML = WS.map((w, i) => { const ds = nextDates(w.days); return `<article class="wc reveal" data-w="${i}"><span class="tag">${w.tag}</span><h3>${w.name}</h3><p>${w.d}</p><ul>${w.inc.map((x) => `<li>${x}</li>`).join('')}</ul>
  <div class="dates">${ds.map((d, k) => `<button type="button" aria-pressed="${k === (i === 1 ? 1 : 0)}" ${(k + i) % 4 === 2 ? 'disabled title="Fully booked"' : ''}>${fmt(d)} · ${w.time}</button>`).join('')}</div>
  <div class="price"><span><b>RM ${w.price}</b> <small style="color:var(--ink3)">/ person · ${w.len}</small></span><button class="btn pri sm" data-book>Book</button></div><div class="bk"></div></article>`; }).join('');
$('#ws').addEventListener('click', (e) => {
  const card = e.target.closest('.wc'); if (!card) return;
  const db = e.target.closest('.dates button'); if (db && !db.disabled) { $$('.dates button', card).forEach((x) => x.setAttribute('aria-pressed', String(x === db))); return; }
  if (e.target.closest('[data-book]')) { const w = WS[+card.dataset.w], date = $('.dates button[aria-pressed="true"]', card)?.textContent || '';
    $('.bk', card).innerHTML = `<form class="f" style="margin-top:14px"><label>Name<input name="nm" required></label><label>Phone<input name="ph" type="tel" required></label><label>Seats<select name="n">${[1, 2, 3, 4].map((n) => `<option>${n}</option>`).join('')}</select></label><button class="btn warm" type="submit">Confirm ${esc(date)}</button><div class="err"></div></form>`;
    $('.bk form', card).addEventListener('submit', (ev) => { ev.preventDefault(); const f = ev.target.elements; if (!f.nm.value.trim() || !f.ph.value.trim()) { $('.err', ev.target).textContent = 'Please add your name and phone.'; return; }
      $('.bk', card).innerHTML = `<div class="okbox"><b>See you there.</b>${esc(f.nm.value.trim().split(' ')[0])}, ${f.n.value} seat${f.n.value > 1 ? 's' : ''} for ${esc(w.name)} on ${esc(date)}. Total RM ${w.price * f.n.value}, paid at the studio.<br><small>Z Lab demo: no real booking.</small></div>`; });
    $('.bk input', card).focus(); }
});

const SHOP = [
  { n: 'Rebung Senja', by: 'Kak Ros', p: 'Sarong', price: 210, seed: 21, pal: ['kunyit', 'mengkudu', 'soga'] },
  { n: 'Laut Nila', by: 'Pak Din', p: 'Selendang', price: 145, seed: 34, pal: ['daun', 'nila'] },
  { n: 'Bunga Pagi', by: 'Aishah', p: 'Sarong', price: 195, seed: 8, pal: ['kunyit', 'mengkudu', 'ungu'] },
  { n: 'Awan Larat', by: 'Kak Ros', p: 'Wall hanging', price: 260, seed: 52, pal: ['kunyit', 'nila', 'soga'] },
  { n: 'Kawung Tanah', by: 'Hafiz', p: 'Cushion pair', price: 110, seed: 77, pal: ['soga', 'ungu'] },
  { n: 'Daun Hujan', by: 'Aishah', p: 'Selendang', price: 135, seed: 63, pal: ['daun', 'nila', 'ungu'] },
];
$('#shopgrid').innerHTML = SHOP.map((s, i) => `<article class="pc reveal"><div class="img" id="si${i}"></div><div class="bd"><h3>${s.n}</h3><span class="by">${s.p} · drawn by ${s.by}</span><div class="ft"><b>RM ${s.price}</b><button class="btn line sm" data-buy="${i}">Add to bag</button></div></div></article>`).join('');
$('#shopgrid').addEventListener('click', (e) => { const b = e.target.closest('[data-buy]'); if (!b) return; b.textContent = 'In your bag ✓'; b.disabled = true; toast(`${SHOP[+b.dataset.buy].n} added. Checkout is not part of this demo.`); });
// paint the shop designs a little at a time, after the page settles
setTimeout(() => { let b2 = null, i = 0; const step = () => { if (i >= SHOP.length) return; b2 = b2 || new Batik(); const s = SHOP[i]; b2.auto(s.seed, s.pal.map((id) => dyeById(id).rgb)); const img = new Image(); img.alt = `${s.n} batik pattern`; img.src = b2.toImage(.5); $('#si' + i).appendChild(img); i++; setTimeout(step, 60); }; step(); }, 900);

// ---------- nav, reveal, anchors
const nav = $('#nav'); addEventListener('scroll', () => nav.classList.toggle('solid', scrollY > 30), { passive: true });
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
$$('.reveal').forEach((el, i) => { el.style.transitionDelay = (i % 4) * 70 + 'ms'; io.observe(el); });
function goTo(sel) { const el = $(sel); if (!el) return; const y = Math.max(0, el.getBoundingClientRect().top + scrollY - 60), y0 = scrollY, dy = y - y0, dur = Math.min(1300, 400 + Math.abs(dy) * .25), t0 = performance.now(); let done = false;
  const ease = (t) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; const st = (now) => { if (done) return; const t = Math.min(1, (now - t0) / dur); scrollTo(0, y0 + dy * ease(t)); if (t < 1) requestAnimationFrame(st); else done = true; }; requestAnimationFrame(st); setTimeout(() => { if (!done) { done = true; scrollTo(0, y); } }, dur + 400); }
document.addEventListener('click', (e) => { const a = e.target.closest('a[data-go]'); if (!a) return; e.preventDefault(); const h = a.getAttribute('href'); if (h === '#top') scrollTo({ top: 0, behavior: 'smooth' }); else goTo(h); });
if (location.hash === '#studio') openStudio();
