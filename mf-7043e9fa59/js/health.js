(function(){
  var qs=document.querySelectorAll('.hqs .seg'); if(!qs.length) return; var ans={};
  var gaps=['daily monitoring','patching','tested backups','a responsive helpdesk','asset records','leaver offboarding','network documentation','predictable costs'];
  function draw(){
    var n=Object.keys(ans).length, s=0, miss=[]; for(var k in ans){s+=ans[k]; if(ans[k]<2) miss.push(gaps[k]);}
    document.getElementById('hc-s').textContent=s; document.getElementById('hc-bar').style.width=(s/16*100)+'%';
    var m;
    if(n<qs.length) m='Answered '+n+' of '+qs.length+'.'+(miss.length?' Gaps so far: '+miss.join(', ')+'.':'');
    else if(s>=14) m='In good shape. A managed service would mostly free up your team\'s time.'+(miss.length?' Worth a look: '+miss.join(', ')+'.':'');
    else if(s>=9) m='Some gaps that could hurt you. Start with '+miss.slice(0,3).join(', ')+'.';
    else m='Your IT is running on luck. The biggest risks are '+miss.slice(0,3).join(', ')+'. This is exactly what managed services fix.';
    document.getElementById('hc-msg').textContent=m;
  }
  qs.forEach(function(q){q.addEventListener('change',function(e){ans[q.dataset.q]=+e.detail;draw();});});
})();
