// Mfinity shared behaviour: header, menus, tabs, sub-nav, forms
(function(){
  var d=document, hdr=d.querySelector('.hdr');
  // header state on scroll
  var heroEl=d.querySelector('.hero'), darkHero=hdr&&hdr.classList.contains('dark');
  function onScroll(){
    if(!hdr) return; hdr.classList.toggle('scrolled', window.scrollY>8);
    // over the dark hero the header is dark; past it, switch to the light header
    if(darkHero&&heroEl) hdr.classList.toggle('dark', heroEl.getBoundingClientRect().bottom>76);
  }
  onScroll(); window.addEventListener('scroll', onScroll, {passive:true});

  // mega menu
  d.querySelectorAll('.nav>li>button').forEach(function(b){
    var m=b.nextElementSibling;
    function set(o){ b.setAttribute('aria-expanded', o?'true':'false'); m.classList.toggle('open', o); }
    var hoverAt=0;
    b.addEventListener('click', function(e){
      e.stopPropagation();
      // with a mouse, hover has just opened it: a click should keep it open, not toggle it shut
      if(Date.now()-hoverAt<600){ set(true); return; }
      set(b.getAttribute('aria-expanded')!=='true');
    });
    b.parentElement.addEventListener('mouseenter', function(){ if(matchMedia('(hover:hover)').matches){ if(b.getAttribute('aria-expanded')!=='true') hoverAt=Date.now(); set(true); } });
    b.parentElement.addEventListener('mouseleave', function(){ if(matchMedia('(hover:hover)').matches) set(false); });
    d.addEventListener('click', function(e){ if(!b.parentElement.contains(e.target)) set(false); });
    d.addEventListener('keydown', function(e){ if(e.key==='Escape'){ set(false); } });
  });

  // mobile drawer
  var burger=d.querySelector('.burger'), drawer=d.querySelector('.drawer');
  if(burger&&drawer){
    burger.addEventListener('click', function(){
      var o=!drawer.classList.contains('open');
      drawer.classList.toggle('open', o); burger.setAttribute('aria-expanded', o?'true':'false');
      d.body.style.overflow=o?'hidden':'';
      if(hdr) hdr.classList.toggle('dark-lock', o);
    });
  }

  // tabs
  d.querySelectorAll('[role=tablist]').forEach(function(list){
    var tabs=[].slice.call(list.querySelectorAll('[role=tab]'));
    function sel(t){
      tabs.forEach(function(x){ var on=x===t; x.setAttribute('aria-selected', on?'true':'false'); x.tabIndex=on?0:-1;
        var p=d.getElementById(x.getAttribute('aria-controls')); if(p) p.hidden=!on; });
      list.dispatchEvent(new CustomEvent('tabchange',{detail:t}));
    }
    tabs.forEach(function(t,i){
      t.addEventListener('click', function(){ sel(t); });
      t.addEventListener('keydown', function(e){
        var k=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0; if(!k) return;
        var n=tabs[(i+k+tabs.length)%tabs.length]; n.focus(); sel(n);
      });
    });
  });

  // segmented buttons (single choice)
  d.querySelectorAll('.seg').forEach(function(seg){
    seg.addEventListener('click', function(e){
      var b=e.target.closest('button'); if(!b) return;
      seg.querySelectorAll('button').forEach(function(x){ x.setAttribute('aria-pressed', x===b?'true':'false'); });
      seg.dispatchEvent(new CustomEvent('change',{detail:b.dataset.v, bubbles:true}));
    });
  });

  // sub-nav highlight
  var sub=d.querySelector('.subnav');
  if(sub && 'IntersectionObserver' in window){
    var links=[].slice.call(sub.querySelectorAll('a'));
    var io=new IntersectionObserver(function(es){
      es.forEach(function(en){ if(en.isIntersecting){
        links.forEach(function(a){ var on=a.getAttribute('href')==='#'+en.target.id; a.classList.toggle('on', on); if(on) a.scrollIntoView({block:'nearest',inline:'nearest'}); });
      }});
    },{rootMargin:'-40% 0px -55% 0px'});
    links.forEach(function(a){ var t=d.getElementById(a.getAttribute('href').slice(1)); if(t) io.observe(t); });
  }

  // enquiry forms: validate, then hand off to email
  d.querySelectorAll('form[data-enquiry]').forEach(function(f){
    var q=new URLSearchParams(location.search).get('s');
    if(q){ var box=f.querySelector('input[name=interest][value="'+q+'"]'); if(box) box.checked=true; }
    f.addEventListener('submit', function(e){
      e.preventDefault(); var ok=true, first=null;
      f.querySelectorAll('[required]').forEach(function(el){
        var row=el.closest('.row'); var good=el.type==='email'?/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(el.value.trim()):el.value.trim()!=='';
        if(row) row.classList.toggle('bad', !good); if(!good){ ok=false; first=first||el; }
      });
      if(!ok){ first.focus(); return; }
      var fd=new FormData(f), lines=[], interests=fd.getAll('interest');
      ['name','company','email','phone','size'].forEach(function(k){ if(fd.get(k)) lines.push(k[0].toUpperCase()+k.slice(1)+': '+fd.get(k)); });
      if(interests.length) lines.push('Interested in: '+interests.join(', '));
      lines.push('', fd.get('message')||'');
      var subj=(f.dataset.enquiry||'Enquiry')+' from '+(fd.get('company')||fd.get('name'));
      location.href='mailto:sales@mfinity.ai?subject='+encodeURIComponent(subj)+'&body='+encodeURIComponent(lines.join('\n'));
      var s=f.parentElement.querySelector('.sent'); if(s){ s.classList.add('show'); f.hidden=true; s.focus(); }
    });
  });

  // year
  d.querySelectorAll('[data-year]').forEach(function(el){ el.textContent=new Date().getFullYear(); });
})();
