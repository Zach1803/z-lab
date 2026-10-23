// link the solution rows to the hero loop nodes
(function(){
  var rows=document.querySelector('.sol-rows[data-loop]'); if(!rows) return;
  rows.querySelectorAll('a').forEach(function(a){
    var i=+a.dataset.i;
    a.addEventListener('mouseenter',function(){ if(window.mfLoop) window.mfLoop.focus(i); });
    a.addEventListener('mouseleave',function(){ if(window.mfLoop) window.mfLoop.focus(-1); });
  });
})();
