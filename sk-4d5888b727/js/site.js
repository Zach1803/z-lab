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
  const home = $('[data-map="home"]'), net = $('[data-map="network"]'); if (!home && !net) return;
  let mod; try { mod = await import('./netmap.js'); } catch (e) { console.warn('3D unavailable', e); return; }
  try {
    if (home) { const panel = () => { const c = $('.mcopy .in'); return c && innerWidth > 860 ? c.getBoundingClientRect().right + 20 : 0; };
      await mod.initNetMap($('canvas', home), $('.nm-labels', home), { base: BASE, view: 'peninsula', panel }); }
    if (net) { const m = await mod.initNetMap($('canvas', net), $('.nm-labels', net), { base: BASE, interactive: true, view: 'malaysia', onSite: (id) => { m.focusSite(id); } });
      $$('.mapbtns button', net).forEach((b) => b.addEventListener('click', () => { $$('.mapbtns button', net).forEach((x) => x.setAttribute('aria-pressed', String(x === b))); m.goView(b.dataset.view); }));
      $$('.loc[data-site]').forEach((c) => c.addEventListener('click', (e) => { if (e.target.closest('a')) return; net.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => m.focusSite(c.dataset.site), 450); })); }
  } catch (e) { console.warn('map failed', e); }
}
maps();
