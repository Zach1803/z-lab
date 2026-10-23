// link the solution rows to the hero nodes, and show a floating preview of each solution
(function(){
  var rows=document.querySelector('.sol-rows[data-loop]'); if(!rows) return;
  var keys=['ai','microsoft','collaboration','security','cloud','managed'];
  var fine=matchMedia('(hover:hover) and (pointer:fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pv=null, x=0,y=0,tx=0,ty=0,raf=0;
  if(fine){
    pv=document.createElement('div'); pv.className='row-pv'; pv.setAttribute('aria-hidden','true');
    keys.forEach(function(k){ var im=new Image(); im.src='img/sol/'+k+'.webp'+(document.currentScript&&document.currentScript.src.split('?')[1]?'?'+document.currentScript.src.split('?')[1]:''); im.alt=''; im.dataset.k=k; pv.appendChild(im); });
    document.body.appendChild(pv);
  }
  function loop(){ x+=(tx-x)*.18; y+=(ty-y)*.18; pv.style.transform='translate('+(x+28)+'px,'+(y-110)+'px)'; raf=requestAnimationFrame(loop); }
  rows.querySelectorAll('a').forEach(function(a){
    var i=+a.dataset.i;
    a.addEventListener('mouseenter',function(e){
      if(window.mfLoop) window.mfLoop.focus(i);
      if(!pv) return; tx=x=e.clientX; ty=y=e.clientY;
      pv.querySelectorAll('img').forEach(function(im,j){ im.classList.toggle('on', j===i); });
      pv.classList.add('show'); if(!raf) loop();
    });
    a.addEventListener('mousemove',function(e){ tx=e.clientX; ty=e.clientY; });
    a.addEventListener('mouseleave',function(){
      if(window.mfLoop) window.mfLoop.focus(-1);
      if(!pv) return; pv.classList.remove('show'); cancelAnimationFrame(raf); raf=0;
    });
  });
})();
