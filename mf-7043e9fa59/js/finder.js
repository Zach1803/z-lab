(function(){
  var f=document.querySelectorAll('.fq'); if(!f.length) return; var a={};
  var S={ai:['AI solutions','ai/'],microsoft:['Microsoft 365 and Azure','microsoft/'],collaboration:['Meetings and voice','collaboration/'],security:['Cybersecurity','security/'],cloud:['Cloud and disaster recovery','cloud/'],managed:['Managed IT services','managed-services/']};
  var why={ai:'Automate the manual work and put Copilot to use.',microsoft:'Get email, files and devices onto a modern, secure platform.',collaboration:'Connect teams across offices and remote staff.',security:'Close the gaps attackers look for first.',cloud:'Make sure you can recover fast when systems fail.',managed:'Get reliable support without growing your IT team.'};
  function draw(){
    var sc={ai:0,microsoft:0,collaboration:0,security:0,cloud:0,managed:0};
    if(a[1]) sc[a[1]]+=5;
    if(a[0]==='g') {sc.security+=2;sc.cloud+=1;} if(a[0]==='s'){sc.managed+=2;sc.microsoft+=1;} if(a[0]==='l'){sc.cloud+=1;sc.ai+=1;sc.collaboration+=1;} if(a[0]==='m'){sc.managed+=1;sc.security+=1;}
    if(a[2]==='m365'){sc.ai+=2;sc.security+=1;} if(a[2]==='onprem'){sc.microsoft+=2;sc.cloud+=2;} if(a[2]==='mixed'){sc.microsoft+=3;} if(a[2]==='unsure'){sc.managed+=2;}
    if(a[3]==='none'){sc.managed+=3;} if(a[3]==='small'){sc.managed+=2;sc.security+=1;} if(a[3]==='team'){sc.ai+=1;sc.cloud+=1;} if(a[3]==='vendor'){sc.managed+=1;sc.security+=1;}
    var n=Object.keys(a).length, out=document.getElementById('fd-out');
    if(!n){return;}
    var top=Object.keys(sc).sort(function(x,y){return sc[y]-sc[x];}).slice(0,3);
    out.innerHTML=top.map(function(k,i){return '<a href="'+S[k][1]+'index.html" style="display:block;color:#fff;text-decoration:none;padding:16px 0;border-top:'+(i?'1px solid rgba(255,255,255,.14)':'0')+'"><b style="font-size:'+(i?19:24)+'px;letter-spacing:-.02em">'+S[k][0]+'</b><span style="display:block;color:rgba(255,255,255,.7);font-size:15px;margin-top:4px">'+why[k]+'</span></a>';}).join('')+
      (n<4?'<p style="color:rgba(255,255,255,.55);font-size:14px;margin:12px 0 0">'+(4-n)+' more to answer for a sharper result.</p>':'<a class="btn btn-p" style="margin-top:16px;background:#fff;color:var(--cobalt)" href="../contact/index.html?s='+top[0]+'">Talk to us about this</a>');
  }
  f.forEach(function(q){q.addEventListener('change',function(e){a[q.dataset.q]=e.detail;draw();});});
})();
