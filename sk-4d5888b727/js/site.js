// Sin-Kung — shared behaviour: menus, reveals, enquiry form and the network maps.
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const BASE = document.documentElement.dataset.base || '';

// desktop mega menus
$$('.nav > li > button').forEach((b) => {
  const li = b.parentElement;
  b.addEventListener('click', (e) => { e.stopPropagation(); const o = !li.classList.contains('open'); $$('.nav > li.open').forEach((x) => x.classList.remove('open')); li.classList.toggle('open', o); b.setAttribute('aria-expanded', String(o)); });
  li.addEventListener('mouseenter', () => { if (matchMedia('(hover:hover)').matches) { $$('.nav > li.open').forEach((x) => x !== li && x.classList.remove('open')); li.classList.add('open'); } });
  li.addEventListener('mouseleave', () => { if (matchMedia('(hover:hover)').matches) li.classList.remove('open'); });
});
document.addEventListener('click', () => $$('.nav > li.open').forEach((x) => x.classList.remove('open')));
addEventListener('keydown', (e) => { if (e.key === 'Escape') $$('.nav > li.open').forEach((x) => x.classList.remove('open')); });
// mobile menu
const burger = $('.burger'); burger && burger.addEventListener('click', () => { const o = $('.hdr').classList.toggle('mopen'); burger.setAttribute('aria-expanded', String(o)); });

// reveals
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
$$('.reveal').forEach((el, i) => { el.style.transitionDelay = (i % 4) * 70 + 'ms'; io.observe(el); });
// counters
const cio = new IntersectionObserver((es) => es.forEach((e) => { if (!e.isIntersecting) return; cio.unobserve(e.target); const el = e.target, end = +el.dataset.count, fmt = (v) => v.toLocaleString('en-MY'), t0 = performance.now(), dur = 1300, suf = el.innerHTML.replace(/^[\d,.]+/, '');
  const st = (now) => { const k = Math.min(1, (now - t0) / dur); el.innerHTML = fmt(Math.round(end * (1 - Math.pow(1 - k, 3)))) + suf; if (k < 1) requestAnimationFrame(st); }; requestAnimationFrame(st); setTimeout(() => { el.innerHTML = fmt(end) + suf; }, dur + 300); }), { threshold: .4 });
$$('[data-count]').forEach((el) => cio.observe(el));

// copy buttons
document.addEventListener('click', async (e) => { const b = e.target.closest('[data-copy]'); if (!b) return; try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'Copied'; } catch { b.textContent = b.dataset.copy; } setTimeout(() => { b.textContent = 'Copy'; }, 1800); });

// enquiry form (prepares an email; no server in this preview)
const form = $('#enq');
if (form) form.addEventListener('submit', (e) => {
  e.preventDefault(); const f = form.elements, err = $('#ferr'); err.textContent = '';
  const nm = f.nm.value.trim(), em = f.em.value.trim(), msg = f.msg.value.trim();
  if (!nm || !em || !msg) { err.textContent = 'Please fill in your name, email and message.'; return; }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { err.textContent = 'Please check your email address.'; return; }
  const subj = `Enquiry: ${f.svc.value}`, body = `Name: ${nm}\nCompany: ${f.co.value.trim() || '-'}\nEmail: ${em}\nPhone: ${f.ph.value.trim() || '-'}\nService: ${f.svc.value}\n\n${msg}`;
  $('#fok')?.remove(); const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  form.insertAdjacentHTML('beforeend', `<div class="ok full" id="fok"><b>Thank you, ${esc(nm.split(' ')[0])}.</b> Your enquiry is ready to send to <b>sklkl@sinkung.com.my</b>. <a href="mailto:sklkl@sinkung.com.my?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}" style="color:var(--blue);font-weight:800">Open in your email app</a>, or copy it below. For urgent shipments call the hotline on +60 12-225 4376.<pre>${esc(subj + '\n\n' + body)}</pre></div>`);
});
const svcSel = form && form.elements.svc; const want = new URLSearchParams(location.search).get('service'); if (svcSel && want) [...svcSel.options].forEach((o) => { if (o.value === want) o.selected = true; });

// maps
async function maps() {
  const els = $$('[data-map]'); if (!els.length) return;
  let mod; try { mod = await import('./netmap.js'); } catch (e) { console.warn('3D unavailable', e); return; }
  for (const el of els) {
    try {
      const type = el.dataset.map;
      if (type === 'home') { const panel = () => { const c = $('.mcopy .in'); return c && innerWidth > 860 ? c.getBoundingClientRect().right + 20 : 0; };
        await mod.initNetMap($('canvas', el), $('.nm-labels', el), { base: BASE, view: 'peninsula', panel }); continue; }
      const interactive = type === 'network' || el.dataset.interactive === '1';
      const m = await mod.initNetMap($('canvas', el), $('.nm-labels', el), { base: BASE, interactive, view: el.dataset.view || 'malaysia', onSite: (id) => m.focusSite(id) });
      if (el.dataset.focus) m.setFocus(el.dataset.focus);
      $$('.mapbtns button', el).forEach((b) => b.addEventListener('click', () => { $$('.mapbtns button', el).forEach((x) => x.setAttribute('aria-pressed', String(x === b))); m.clearPath(); m.goView(b.dataset.view); if (b.dataset.focus) m.setFocus(b.dataset.focus === 'all' ? null : b.dataset.focus); }));
      if (type === 'network') $$('.loc[data-site]').forEach((c) => c.addEventListener('click', (e) => { if (e.target.closest('a')) return; el.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => m.focusSite(c.dataset.site), 450); }));
      const pf = el.dataset.planner && $(el.dataset.planner);
      if (pf) planner(pf, m, mod);
    } catch (e) { console.warn('map failed', e); }
  }
}
function planner(pf, m, mod) {
  const from = $('[name=from]', pf), to = $('[name=to]', pf), out = $('.result', pf);
  const opts = mod.ROUTE_POINTS.map(([k, n]) => `<option value="${k}">${n}</option>`).join(''); from.innerHTML = opts; to.innerHTML = opts; from.value = 'klia'; to.value = 'changi';
  const isAir = (k) => ['klia', 'penang', 'changi', 'bangkok', 'hatyai'].includes(k);
  const run = () => { if (from.value === to.value) { out.innerHTML = '<p style="color:var(--ink2)">Choose two different places.</p>'; m.clearPath(); return; }
    const r = mod.roadRoute(from.value, to.value); if (!r) return; m.showPath(r.pts);
    const drive = r.km / 62, lo = Math.max(1, Math.round(drive + r.borders * 1.5)), hi = Math.round(drive * 1.25 + r.borders * 3 + 1);
    const tags = []; if (isAir(from.value) && isAir(to.value)) tags.push('Road feeder, under bond'); else tags.push('Point-to-point trucking'); if (r.borders) tags.push(`${r.borders} border crossing${r.borders > 1 ? 's' : ''}: we clear customs`); if (from.value === 'portklang' || to.value === 'portklang') tags.push('Container haulage available'); tags.push('Full or part load'); tags.push('Refrigerated on request');
    out.innerHTML = `<div class="big"><div><b>${r.km.toLocaleString('en-MY')} km</b><span>by road</span></div><div><b>${lo}–${hi} h</b><span>typical transit</span></div></div><div class="tags">${tags.map((t) => `<span>${t}</span>`).join('')}</div><a class="btn pri sm" href="${BASE}network/index.html?service=Trucking#contact">Quote this route</a>`; };
  from.addEventListener('change', run); to.addEventListener('change', run); $('[data-swap]', pf)?.addEventListener('click', () => { const a = from.value; from.value = to.value; to.value = a; run(); });
  setTimeout(run, 600);
}
maps();

// 737 load planner
const deck = $('#deck');
if (deck) {
  const slots = $$('.slot', deck), wIn = $('#pw', deck), lIn = $('#lw', deck), PAY = 18000, VOL = 149, PV = 11.4, LV = 35;
  const loaded = new Set([0, 1, 2, 3, 4, 5]);
  const upd = () => { const pw = +wIn.value, lw = +lIn.value; slots.forEach((s, i) => { const on = loaded.has(i); s.setAttribute('fill', on ? '#1a6fc7' : '#eef3f9'); s.nextElementSibling && (s.nextElementSibling.textContent = on ? `${(pw / 1000).toFixed(1)} t` : '+'); s.nextElementSibling && s.nextElementSibling.setAttribute('fill', on ? '#fff' : '#7a8a9e'); });
    const kg = loaded.size * pw + lw, m3 = loaded.size * PV + lw / 4000 * LV;
    $('#pwv').textContent = pw.toLocaleString('en-MY') + ' kg'; $('#lwv').textContent = lw.toLocaleString('en-MY') + ' kg';
    const set = (id, v, max, txt) => { const b = $(id + ' i', deck); b.style.width = Math.min(100, v / max * 100) + '%'; b.classList.toggle('over', v > max); $(id + 'v', deck).textContent = txt; };
    set('#mw', kg, PAY, `${kg.toLocaleString('en-MY')} / ${PAY.toLocaleString('en-MY')} kg`); set('#mv', m3, VOL, `${Math.round(m3)} / ${VOL} m³`);
    const ok = kg <= PAY && m3 <= VOL; $('#verdict', deck).innerHTML = ok ? `<b style="color:var(--green2)">Fits on one freighter.</b> ${loaded.size} of 10 main-deck positions used.` : `<b style="color:#c2333d">Over the limit.</b> Split across two flights, or ask us about a charter.`; };
  slots.forEach((s, i) => s.addEventListener('click', () => { loaded.has(i) ? loaded.delete(i) : loaded.add(i); upd(); }));
  [wIn, lIn].forEach((x) => x.addEventListener('input', upd)); upd();
}
// warehouse capacity
$$('.cap').forEach((cap) => { const rows = $$('.r', cap), max = Math.max(...rows.map((r) => +r.dataset.sq));
  const set = (mode) => { let tot = 0; rows.forEach((r) => { const show = !r.classList.contains('new') || mode === 'future'; $('i', r).style.width = show ? (+r.dataset.sq / max * 100) + '%' : '0'; r.style.opacity = show ? 1 : .35; if (show) tot += +r.dataset.sq; }); $('.total b', cap).textContent = tot.toLocaleString('en-MY') + ' sq ft'; };
  const ioc = new IntersectionObserver((es) => { if (es[0].isIntersecting) { set('today'); ioc.disconnect(); } }, { threshold: .3 }); ioc.observe(cap);
  $$('[data-cap]', cap.closest('section')).forEach((b) => b.addEventListener('click', () => { $$('[data-cap]', cap.closest('section')).forEach((x) => x.setAttribute('aria-pressed', String(x === b))); set(b.dataset.cap); })); });
// unit chart
$$('.units').forEach((u) => { const types = JSON.parse(u.dataset.types); u.innerHTML = types.map((t, k) => Array.from({ length: t.n }, () => `<i style="--c:${t.c}" data-k="${k}"></i>`).join('')).join('');
  const keys = u.nextElementSibling; keys.innerHTML = types.map((t, k) => `<button type="button" data-k="${k}" style="--c:${t.c}"><i></i>${t.label}<b>${t.n}</b></button>`).join('');
  $$('button', keys).forEach((b) => { const on = () => { u.classList.add('dim'); $$('i', u).forEach((i) => i.classList.toggle('hl', i.dataset.k === b.dataset.k)); $$('button', keys).forEach((x) => x.classList.toggle('on', x === b)); }; b.addEventListener('mouseenter', on); b.addEventListener('click', on); b.addEventListener('mouseleave', () => { u.classList.remove('dim'); b.classList.remove('on'); }); });
  const iou = new IntersectionObserver((es) => { if (es[0].isIntersecting) { $$('i', u).forEach((i, n) => { i.style.transitionDelay = (n * 2) + 'ms'; }); u.classList.add('in'); iou.disconnect(); } }, { threshold: .2 }); iou.observe(u); });
// cabin hotspots
$$('.cabin').forEach((c) => { const info = $('.info', c); $$('.hot', c).forEach((h) => { const show = () => { $$('.hot', c).forEach((x) => x.classList.toggle('on', x === h)); info.innerHTML = `<b>${h.dataset.t}</b><p style="color:var(--ink2);margin-top:4px">${h.dataset.d}</p>`; }; h.addEventListener('mouseenter', show); h.addEventListener('click', show); }); });
// flows and pitch fills
$$('.flow').forEach((f) => { const io2 = new IntersectionObserver((es) => { if (!es[0].isIntersecting) return; io2.disconnect(); $$('div', f).forEach((d, i) => setTimeout(() => d.classList.add('on'), 350 * i)); }, { threshold: .4 }); io2.observe(f); });
$$('.pitch').forEach((p) => { const io3 = new IntersectionObserver((es) => { if (es[0].isIntersecting) { p.classList.add('in'); io3.disconnect(); } }, { threshold: .4 }); io3.observe(p); });
