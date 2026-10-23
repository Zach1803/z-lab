// home: pinned solutions story
(function(){
  var items=[].slice.call(document.querySelectorAll('.story-item')); if(!items.length) return;
  var imgs=[].slice.call(document.querySelectorAll('.story-frame img')), bar=document.querySelector('.story-prog i');
  function set(i){
    items.forEach(function(el,j){ el.classList.toggle('on', j===i); });
    imgs.forEach(function(im,j){ im.classList.toggle('on', j===i); });
    if(bar) bar.style.width=((i+1)/items.length*100)+'%';
  }
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){ if(e.isIntersecting) set(+e.target.dataset.i); });
  },{rootMargin:'-45% 0px -45% 0px'});
  items.forEach(function(el){ io.observe(el); });
  // the frame leans toward the cursor
  var f=document.querySelector('.story-frame');
  if(f && matchMedia('(hover:hover) and (pointer:fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches){
    f.addEventListener('mousemove',function(e){ var r=f.getBoundingClientRect(), x=(e.clientX-r.left)/r.width, y=(e.clientY-r.top)/r.height;
      f.style.transform='perspective(1000px) rotateY('+((x-.5)*10)+'deg) rotateX('+((.5-y)*10)+'deg)';
      f.style.setProperty('--gx',x*100+'%'); f.style.setProperty('--gy',y*100+'%'); });
    f.addEventListener('mouseleave',function(){ f.style.transform=''; });
  }
})();
