import { initGlobe } from './mglobe.js';

const SECTORS = [
  { id: 'tech', name: 'Technology', color: '#4f8cff', line: 'Enterprise IT, trading software and digital products.' },
  { id: 'fin', name: 'Financial services', color: '#38d3a6', line: 'Shariah-compliant financing that keeps businesses moving.' },
  { id: 'trade', name: 'Trade & distribution', color: '#f0b14a', line: 'Getting quality products to homes and businesses across Malaysia.' },
  { id: 'people', name: 'People & brands', color: '#c77dff', line: 'Building skills, brands and the spaces where they meet.' },
  { id: 'prop', name: 'Property', color: '#ff7a6b', line: 'Commercial real estate that gives the group a steady base.' },
];
const BIZ = [
  { id: 'mfinity', sector: 'tech', name: 'Mfinity Technologies', short: 'Mfinity', p: 'IT systems consultancy and ELV integrator for enterprise and government, from the network core to the cloud.', tags: ['Network integration', 'Data centre', 'Cybersecurity', 'Collaboration', 'Cloud & co-location', 'Microsoft solutions', 'Performance optimisation'] },
  { id: 'inbase', sector: 'tech', name: 'Inbase Partners', short: 'Inbase', url: 'https://inbasepartners.com', p: 'Fintech software for trading houses and financial institutions.', tags: ['Physical commodities trading platform', 'HFT & quant', 'Risk transparency & control monitoring'] },
  { id: 'swapp', sector: 'tech', name: 'Swapp Asia', short: 'Swapp Asia', p: 'E-commerce, web development and IT services, plus R&D on a digital business card app.', tags: ['E-commerce', 'Web development', 'IT services', 'Digital business cards'] },
  { id: 'ikhlas', sector: 'fin', name: 'Ikhlas Al Dain', short: 'Ikhlas Al Dain', url: 'https://ikhlasaldain.com', p: 'Shariah-compliant factoring and financing company, approved by the Ministry of Finance and operating under the Financial Services Act 2013.', tags: ['Invoice factoring', 'Leasing', 'Development finance', 'Building credit'] },
  { id: 'pacifica', sector: 'trade', name: 'Pacifica Direct', short: 'Pacifica', url: 'https://pacifica2u.com.my', p: 'Electronics distributor serving retail and business customers.', tags: ['Home appliances', 'Gadgets', 'Hardware & peripherals', 'B2B & B2C'] },
  { id: 'champagne', sector: 'trade', name: 'Champagne Carbon', short: 'Winelouvre', url: 'https://winelouvre.com', p: 'Fine wine importer and retailer, trading as Winelouvre.', tags: ['Red & white', 'Sparkling', 'Champagne', 'Accessories'] },
  { id: 'macademi', sector: 'people', name: 'Macademi', short: 'Macademi', url: 'https://macademi.asia', p: 'HRDF-registered training provider building skills across Malaysian workplaces.', tags: ['Safety & health', 'Business applications', 'Human resources', 'Soft skills'] },
  { id: 'inshub', sector: 'people', name: 'Inshub', short: 'Inshub', p: 'Branding, digital and offline marketing agency, and operator of the Ins.Space venue for meetings and events.', tags: ['Branding', 'Digital marketing', 'Offline marketing', 'Ins.Space events'] },
  { id: 'property', sector: 'prop', name: 'Mlabs Properties', short: 'Mlabs Properties', p: 'Owns and leases out three commercial properties, providing recurring income to the group.', tags: ['Commercial leasing', '3 properties'] },
];
const secOf = (id) => SECTORS.find((s) => s.id === id);
BIZ.forEach((b) => { b.color = secOf(b.sector).color; });

const TL = [
  ['1992', 'A lab is born', 'Multimedia Research Lab Sdn Bhd grows out of a software project at Universiti Sains Malaysia and launches MCS, an IP-based conferencing system.'],
  ['1997', 'Incorporated', 'The business is incorporated as a private limited company to serve a growing base of enterprise clients.'],
  ['2005', 'Listed on Bursa Malaysia', 'Mlabs lists on MESDAQ, now the ACE Market of Bursa Malaysia, under stock code 0085.'],
  ['2006', 'Recognised for growth', 'Ranked #108 in the Deloitte Technology Fast 500 Asia 2005 with 450% growth, and Malaysia\'s top software company in the programme.'],
  ['2007–2019', 'Diversification', 'The group expands into factoring, e-commerce, distribution and digital marketing.'],
  ['2020–2024', 'AI, cloud and digitalisation', 'Focus sharpens on AI, cloud and enterprise digitalisation across the group.'],
  ['Today', 'Nine businesses, five sectors', 'Mlabs operates as a diversified holding group spanning technology, financial services, trade, people and property.'],
];
const MGMT = [['Hui Kiat Bin', 'Chief Executive Officer']];
const BOARD = [
  ['Gen Tan Sri Dato\' Sri Hj Suleiman Bin Mahmud RMAF (Rtd)', 'Non-Independent Non-Executive Chairman', 'SM'],
  ['Tan Sik Eek', 'Executive Director'],
  ['Mejar Dato\' Ismail Bin Ahmad (R)', 'Non-Independent Non-Executive Director', 'IA'],
  ['Ong Tee Kein', 'Non-Independent Non-Executive Director'],
  ['Chuah Hoon Hong', 'Independent Non-Executive Director'],
  ['Karina Binti Idris Ahmad Shah', 'Independent Non-Executive Director', 'KI'],
];
const IR = [
  ['Annual reports', 'Reports from 2021 to 2025', 'https://mlabs.com/annual-reports/'],
  ['Annual general meeting', 'Notices, results and minutes', 'https://mlabs.com/annual-general-meeting/'],
  ['Extraordinary general meeting', 'Circulars and resolutions', 'https://mlabs.com/extraordinary-general-meeting/'],
  ['Corporate governance', 'Board charter, policies and codes', 'https://mlabs.com/corporate-governance/'],
];
const PARTNERS = ['Microsoft', 'Cisco', 'Dell Technologies', 'Lenovo', 'Nutanix', 'Veeam', 'Kaspersky', 'LG'];
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- build sector chapters
const chapters = $('#chapters');
SECTORS.forEach((s, i) => {
  const items = BIZ.filter((b) => b.sector === s.id);
  const sec = document.createElement('section'); sec.className = 'chapter sec'; sec.dataset.focus = s.id; sec.id = 'sector-' + s.id; sec.style.setProperty('--sc', s.color);
  sec.innerHTML = `<div class="wrap"><div class="sector"><div class="num">0${i + 1} / 05 &nbsp; ${esc(s.name.toUpperCase())}</div><h3>${esc(s.name)}</h3><p>${esc(s.line)}</p><div class="biz">${items.map((b) => `
    <article class="bcard" id="biz-${b.id}" data-id="${b.id}"><h4>${esc(b.name)}${b.url ? `<a href="${b.url}" target="_blank" rel="noopener">Visit site ↗</a>` : ''}</h4><p>${esc(b.p)}</p><div class="tags">${b.tags.map((t) => `<span>${esc(t)}</span>`).join('')}</div></article>`).join('')}</div></div></div>`;
  chapters.appendChild(sec);
});
const rail = $('#rail');
SECTORS.forEach((s) => { const b = document.createElement('button'); b.type = 'button'; b.style.setProperty('--sc', s.color); b.dataset.s = s.id; b.innerHTML = `<span>${esc(s.name)}</span><i></i>`; b.addEventListener('click', () => goTo('#sector-' + s.id)); rail.appendChild(b); });

// ---------- other content
$('#mq').innerHTML = [...PARTNERS, ...PARTNERS].map((p) => `<span>${p}</span><span aria-hidden="true" style="opacity:.35">•</span>`).join('');
const tl = $('#tl'); TL.forEach(([y, h, p]) => { const d = document.createElement('div'); d.className = 'tli'; d.innerHTML = `<div class="yr">${y}</div><div><h3>${esc(h)}</h3><p>${esc(p)}</p></div>`; tl.appendChild(d); });
const initials = (n) => n.replace(/\(.*?\)|Gen |Tan Sri |Dato'? |Sri |Hj |Mejar |RMAF|Binti |Bin /g, ' ').trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('');
const pal = [['#2f6fd0', '#6b6fd6'], ['#1e8a7a', '#38d3a6'], ['#b46b17', '#f0b14a'], ['#7b3fc4', '#c77dff'], ['#c2413a', '#ff7a6b'], ['#264a8a', '#4f8cff']];
const person = ([n, r, ini], i, lead) => `<div class="person${lead ? ' lead' : ''} reveal"><div class="av" style="--a1:${pal[i % 6][0]};--a2:${pal[i % 6][1]}">${ini || initials(n)}</div><div><h4>${esc(n)}</h4><p>${esc(r)}</p></div></div>`;
$('#mgmt').innerHTML = MGMT.map((p, i) => person(p, i, true)).join('');
$('#board').innerHTML = BOARD.map((p, i) => person(p, i + 1)).join('');
const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17 17 7M8 7h9v9"/></svg>';
$('#irl').innerHTML = IR.map(([b, s, u]) => `<a class="reveal" href="${u}" target="_blank" rel="noopener"><span><b>${b}</b><small>${s}</small></span>${arrow}</a>`).join('');
$('#fco').innerHTML = BIZ.map((b) => `<li>${b.url ? `<a href="${b.url}" target="_blank" rel="noopener">${esc(b.name)}</a>` : `<a href="#biz-${b.id}" data-go>${esc(b.name)}</a>`}</li>`).join('');
$('#bizsel').insertAdjacentHTML('beforeend', BIZ.map((b) => `<option>${esc(b.name)}</option>`).join(''));

// ---------- smooth in-page navigation (JS, eased)
const nav = $('#nav');
function goTo(sel) {
  const el = typeof sel === 'string' ? $(sel) : sel; if (!el) return;
  nav.classList.remove('open'); $('.burger').setAttribute('aria-expanded', 'false');
  let y = el.getBoundingClientRect().top + scrollY - (el.closest('#chapters') ? 0 : 64);
  if (el.classList.contains('bcard')) { const ch = el.closest('.chapter'); y = ch.getBoundingClientRect().top + scrollY; }
  y = Math.max(0, Math.min(y, document.documentElement.scrollHeight - innerHeight));
  const y0 = scrollY, dy = y - y0, dur = Math.min(1400, 450 + Math.abs(dy) * .25), t0 = performance.now();
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || Math.abs(dy) < 2) { scrollTo(0, y); return; }
  const ease = (t) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  let done = false; const step = (now) => { if (done) return; const t = Math.min(1, (now - t0) / dur); scrollTo(0, y0 + dy * ease(t)); if (t < 1) requestAnimationFrame(step); else done = true; };
  requestAnimationFrame(step); setTimeout(() => { if (!done) { done = true; scrollTo(0, y); } }, dur + 400);
}
document.addEventListener('click', (e) => { const a = e.target.closest('a[data-go]'); if (!a) return; const h = a.getAttribute('href'); if (!h || !h.startsWith('#')) return; e.preventDefault(); goTo(h === '#top' ? document.body : h); });
$('.burger').addEventListener('click', () => { const o = nav.classList.toggle('open'); $('.burger').setAttribute('aria-expanded', String(o)); });

// ---------- globe
let globe = null;
try {
  globe = initGlobe($('#globe'), $('#labels'), { items: BIZ, onPick: (id) => goTo('#biz-' + id), onReady: start });
} catch (err) { console.warn('3D unavailable', err); $('#stage-wrap').style.background = 'radial-gradient(80% 60% at 75% 30%,#24307a,#050b1c 70%)'; }
window.__mlabs = { globe, goTo };
function start() { if (document.body.classList.contains('ready')) return; $('#loader').classList.add('done'); document.body.classList.add('ready'); requestAnimationFrame(onScroll); }
setTimeout(start, globe ? 7000 : 0);

// live clock for headquarters
function liveTick() { const now = new Date(), tm = now.toLocaleTimeString('en-MY', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kuala_Lumpur' }); const day = globe ? globe.isDayAtHQ() : true;
  $('#livetxt').innerHTML = `Live Earth · <b>${tm}</b> in Petaling Jaya · ${day ? 'daytime' : 'night-time'}`; }
liveTick(); setInterval(liveTick, 20000);

// cards and tiles light up their company on the globe
document.addEventListener('pointerover', (e) => { const c = e.target.closest('.bcard,.tile'); if (c && globe) globe.highlight(c.dataset.id); });
document.addEventListener('pointerout', (e) => { const c = e.target.closest('.bcard,.tile'); if (c && globe && !c.contains(e.relatedTarget)) globe.highlight(null); });

// at-a-glance directory
const chips = $('#chips'), grid = $('#grid9');
grid.innerHTML = BIZ.map((b) => `<button class="tile reveal" data-id="${b.id}" data-s="${b.sector}" style="--sc:${b.color}"><span class="s">${esc(secOf(b.sector).name)}</span><h3>${esc(b.name)}</h3><p>${esc(b.p.split('. ')[0].replace(/\.$/, ''))}.</p><span class="go">See details →</span></button>`).join('');
chips.innerHTML = `<button type="button" aria-pressed="true" data-s="">All nine</button>` + SECTORS.map((s) => `<button type="button" aria-pressed="false" data-s="${s.id}" style="--sc:${s.color}"><i></i>${esc(s.name)}</button>`).join('');
chips.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; $$('button', chips).forEach((x) => x.setAttribute('aria-pressed', String(x === b))); $$('.tile', grid).forEach((t) => t.classList.toggle('out', !!b.dataset.s && t.dataset.s !== b.dataset.s)); });
grid.addEventListener('click', (e) => { const t = e.target.closest('.tile'); if (t) goTo('#biz-' + t.dataset.id); });

// ---------- scroll-driven state
const secEls = $$('.chapter'), cue = $('#cue'), navLinks = $$('.nav ul a');
const blocks = ['glance', 'about', 'businesses', 'journey', 'investors', 'community', 'contact'].map((id) => $('#' + id));
let curFocus = '__';
function onScroll() {
  const vh = innerHeight, mid = vh * .5;
  nav.classList.toggle('solid', scrollY > 40);
  cue.style.opacity = scrollY > 60 ? 0 : 1;
  // active chapter = the one containing the viewport middle
  let act = null; for (const s of secEls) { const r = s.getBoundingClientRect(); if (r.top <= mid && r.bottom > mid) { act = s; break; } }
  $('#progress').style.transform = `scaleX(${scrollY / Math.max(1, document.documentElement.scrollHeight - vh)})`;
  $('#live').classList.toggle('off', !(act && act.classList.contains('hero')) || !document.body.classList.contains('ready'));
  const f = act ? act.dataset.focus || '' : '';
  if (f !== curFocus) { curFocus = f; globe && globe.setFocus(f || null); }
  secEls.forEach((s) => { const card = $('.sector', s); if (card) card.classList.toggle('in', s === act); });
  const sr = $('#stage-wrap').getBoundingClientRect(), inEco = act && act.classList.contains('sec');
  rail.classList.toggle('show', !!inEco); $$('button', rail).forEach((b) => b.classList.toggle('on', b.dataset.s === f));
  if (globe) globe.setLayout(act && act.classList.contains('hero') ? 'hero' : (sr.bottom > 0 ? 'eco' : 'hero'));
  // nav highlight
  let cur = null; blocks.forEach((b) => { if (b && b.getBoundingClientRect().top < vh * .4) cur = b.id; });
  if ((act && (act.classList.contains('sec') || act.classList.contains('eco'))) || cur === 'glance') cur = 'businesses'; if (act && act.classList.contains('hero')) cur = null;
  navLinks.forEach((a) => a.classList.toggle('cur', a.getAttribute('href') === '#' + cur));
  // timeline progress
  const tr = tl.getBoundingClientRect(), p = Math.max(0, Math.min(1, (vh * .6 - tr.top) / tr.height)); $('.bar', tl).style.height = (p * (tr.height - 16)) + 'px';
  $$('.tli', tl).forEach((li) => li.classList.toggle('in', li.getBoundingClientRect().top < vh * .6));
}
addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); onScroll();

// ---------- reveals + counters
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
$$('.reveal').forEach((el, i) => { el.style.transitionDelay = ((i % 4) * 70) + 'ms'; io.observe(el); });
const cio = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return; cio.unobserve(e.target); const el = e.target, end = +el.dataset.count, suf = el.dataset.suf || '', plain = 'plain' in el.dataset;
  const start = plain ? end - 30 : 0, t0 = performance.now(), dur = 1400;
  const step = (now) => { const t = Math.min(1, (now - t0) / dur), v = Math.round(start + (end - start) * (1 - Math.pow(1 - t, 3))); el.textContent = v + suf; if (t < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step); setTimeout(() => { el.textContent = end + suf; }, dur + 300);
}), { threshold: .4 });
$$('[data-count]').forEach((el) => cio.observe(el));

// ---------- copy buttons
document.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-copy]'); if (!b) return; const txt = b.dataset.copy;
  try { await navigator.clipboard.writeText(txt); b.textContent = 'Copied'; } catch { const r = document.createRange(); r.selectNodeContents($('#em')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = 'Selected'; }
  setTimeout(() => { b.textContent = 'Copy'; }, 1800);
});

// ---------- enquiry form (no backend in this preview: prepares the email)
$('#enq').addEventListener('submit', (e) => {
  e.preventDefault(); const f = e.target.elements, err = $('#ferr'); err.textContent = '';
  const nm = f.nm.value.trim(), em = f.em.value.trim(), msg = f.msg.value.trim();
  if (!nm || !em || !msg) { err.textContent = 'Please fill in your name, email and message.'; return; }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { err.textContent = 'Please enter a valid email address.'; f.em.focus(); return; }
  const subj = `Enquiry: ${f.biz.value}`, body = `Name: ${nm}\nCompany: ${f.co.value.trim() || '-'}\nEmail: ${em}\nPhone: ${f.ph.value.trim() || '-'}\nInterested in: ${f.biz.value}\n\n${msg}`;
  const mail = `mailto:enquiry@mlabs.com?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
  $('#enq .ok')?.remove();
  e.target.insertAdjacentHTML('beforeend', `<div class="ok"><b>Thank you, ${esc(nm.split(' ')[0])}.</b> Your enquiry is ready to send to <b>enquiry@mlabs.com</b>. <a href="${mail}" style="color:var(--brand);font-weight:600">Open in your email app</a> or copy it below.<pre>${esc(subj + '\n\n' + body)}</pre><button type="button" class="copy" data-copy="${esc(subj + '\n\n' + body)}" style="margin:10px 0 0">Copy</button></div>`);
});
