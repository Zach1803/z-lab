// typed Copilot demo on the AI page
(function(){
  var box=document.querySelector('.copilot'); if(!box) return;
  var demos=JSON.parse(box.dataset.demos), q=box.querySelector('.cp-q'), a=box.querySelector('.cp-a');
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches, timer=0, started=false;
  function play(i){
    clearTimeout(timer); q.textContent=demos[i][0]; a.textContent=''; a.classList.add('typing');
    var full=demos[i][1], n=0;
    if(reduce){ a.textContent=full; a.classList.remove('typing'); return; }
    (function step(){ n+=Math.max(1,Math.round(Math.random()*4)); a.textContent=full.slice(0,n);
      if(n<full.length) timer=setTimeout(step, 18+Math.random()*30); else a.classList.remove('typing'); })();
  }
  box.querySelector('.cp-seg').addEventListener('change',function(e){ started=true; play(+e.detail); });
  // start when scrolled into view
  new IntersectionObserver(function(es){ if(es[0].isIntersecting&&!started){ started=true; play(0); } },{threshold:.4}).observe(box);
})();
