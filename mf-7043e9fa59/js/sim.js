// Layered defence simulator for the security page
(function(){
  var c=document.getElementById('sim'); if(!c) return; var x=c.getContext('2d');
  var on={fw:true,net:true,ep:true,dlp:true};
  var L=[{k:'fw',n:'Firewall',p:.30},{k:'net',n:'Network monitoring',p:.47},{k:'ep',n:'Endpoint protection',p:.64},{k:'dlp',n:'Data loss prevention',p:.80}];
  var T={scan:{n:'Port scan',c:'#FFB547',by:['fw']},malware:{n:'Malware',c:'#FF5C7A',by:['fw','ep']},intrusion:{n:'Intrusion',c:'#C38BFF',by:['net']},phish:{n:'Phishing link',c:'#FF8A3D',by:['ep']},leak:{n:'Data leaving',c:'#4FE3D6',by:['dlp'],rev:true}};
  var keys=Object.keys(T), Q=[], fx=[], blocked=0, through=0, W,H,dpr, devHit=[0,0,0,0];
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function size(){dpr=Math.min(devicePixelRatio,2);W=c.clientWidth;H=c.clientHeight;c.width=W*dpr;c.height=H*dpr;}
  size(); addEventListener('resize',size);
  var top=58, bot=58;
  function spawn(){
    var k=keys[Math.floor(Math.random()*keys.length)], t=T[k];
    var lane=top+20+Math.random()*(H-top-bot-40);
    // malware sometimes slips past the firewall inside allowed traffic
    var stopAt=null;
    for(var i=0;i<L.length;i++){var l=L[i]; if(t.by.indexOf(l.k)<0) continue; if(k==='malware'&&l.k==='fw'&&Math.random()<.5) continue; stopAt=l.k; break;}
    Q.push({k:k,x:t.rev?W*.93:-10,y:lane,v:(t.rev?-1:1)*(70+Math.random()*50),stop:stopAt,trail:[]});
  }
  function layerX(k){for(var i=0;i<L.length;i++) if(L[i].k===k) return L[i].p*W; return null;}
  function msg(){
    var off=L.filter(function(l){return !on[l.k];}).map(function(l){return l.n.toLowerCase();});
    var m=!off.length?'All four layers are on. Nearly everything is stopped.':
      off.length===4?'No protection. Every threat reaches your devices and data.':
      'With '+off.join(' and ')+' off, '+(off.indexOf('data loss prevention')>=0?'company data can walk out the door. ':'')+(off.indexOf('endpoint protection')>=0?'phishing and malware land on laptops. ':'')+(off.indexOf('network monitoring')>=0?'intruders move around unseen. ':'')+(off.indexOf('firewall')>=0?'your network is open to scans. ':'');
    document.getElementById('sim-msg').textContent=m.trim();
  }
  document.getElementById('sim-toggles').addEventListener('click',function(e){
    var b=e.target.closest('button'); if(!b) return; e.stopImmediatePropagation();
    on[b.dataset.v]=!on[b.dataset.v]; b.setAttribute('aria-pressed',on[b.dataset.v]?'true':'false'); msg();
  },true);
  msg();
  for(var z=0;z<7;z++){spawn(); var q=Q[Q.length-1]; q.x+=(q.v>0?1:-1)*Math.random()*W*.5;}
  var last=performance.now(), acc=0, vis=true;
  new IntersectionObserver(function(e){vis=e[0].isIntersecting;}).observe(c);
  function rr(px,py,w,h,r){x.beginPath();x.roundRect?x.roundRect(px,py,w,h,r):x.rect(px,py,w,h);}
  (function f(now){
    requestAnimationFrame(f); var dt=Math.min((now-last)/1000,.05); last=now; if(!vis) return;
    if(reduce) dt*=.35;
    acc+=dt; if(acc>.55){acc=0;spawn();}
    x.setTransform(dpr,0,0,dpr,0,0); x.clearRect(0,0,W,H);
    // internet side
    x.fillStyle='rgba(255,255,255,.04)'; x.fillRect(0,0,W*.2,H);
    x.font='600 13px "Schibsted Grotesk",system-ui'; x.fillStyle='rgba(255,255,255,.5)'; x.textAlign='left';
    x.fillText('Internet',16,28);
    // layers
    L.forEach(function(l){var lx=l.p*W, a=on[l.k];
      x.strokeStyle=a?'rgba(80,120,255,.9)':'rgba(255,255,255,.12)'; x.lineWidth=a?3:1.5; x.setLineDash(a?[]:[5,6]);
      x.beginPath(); x.moveTo(lx,top); x.lineTo(lx,H-bot+10); x.stroke(); x.setLineDash([]);
      if(a){var g=x.createLinearGradient(lx-14,0,lx+14,0);g.addColorStop(0,'rgba(35,70,255,0)');g.addColorStop(.5,'rgba(35,70,255,.22)');g.addColorStop(1,'rgba(35,70,255,0)');x.fillStyle=g;x.fillRect(lx-14,top,28,H-top-bot+10);}
      x.fillStyle=a?'#fff':'rgba(255,255,255,.35)'; x.textAlign='center'; x.font='600 12.5px "Schibsted Grotesk",system-ui';
      var words=W<640?l.n.split(' ')[0]:l.n; x.fillText(words,lx,top-14);
    });
    // devices
    var dx=W*.93;
    for(var i=0;i<4;i++){var dy=top+20+i*((H-top-bot-40)/3); devHit[i]=Math.max(0,devHit[i]-dt*1.5);
      x.fillStyle=devHit[i]>0?'rgba(210,59,59,'+(.4+devHit[i]*.6)+')':'rgba(255,255,255,.12)'; rr(dx-16,dy-11,32,22,4); x.fill();
      x.fillStyle='rgba(255,255,255,.25)'; x.fillRect(dx-20,dy+12,40,3);}
    x.fillStyle='rgba(255,255,255,.5)'; x.textAlign='right'; x.font='600 13px "Schibsted Grotesk",system-ui'; x.fillText('Your devices and data',W-14,28);
    // threats
    for(var j=Q.length-1;j>=0;j--){var q=Q[j], t=T[q.k], nx=q.x+q.v*dt;
      var sx=q.stop?layerX(q.stop):null;
      if(sx!==null && on[q.stop] && ((q.v>0&&q.x<sx&&nx>=sx)||(q.v<0&&q.x>sx&&nx<=sx))){fx.push({x:sx,y:q.y,c:t.c,a:1});blocked++;Q.splice(j,1);continue;}
      q.x=nx; q.trail.push([q.x,q.y]); if(q.trail.length>14) q.trail.shift();
      if((q.v>0&&q.x>dx-18)||(q.v<0&&q.x<0)){through++; if(q.v>0) devHit[Math.min(3,Math.floor((q.y-top)/((H-top-bot)/4)))]=1; else fx.push({x:6,y:q.y,c:'#D23B3B',a:1}); Q.splice(j,1); continue;}
      x.strokeStyle=t.c; x.globalAlpha=.35; x.lineWidth=2; x.beginPath(); q.trail.forEach(function(p,i){i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]);}); x.stroke(); x.globalAlpha=1;
      x.fillStyle=t.c; x.beginPath(); x.arc(q.x,q.y,5,0,6.283); x.fill();
    }
    fx.forEach(function(e){e.a-=dt*2; x.strokeStyle=e.c; x.globalAlpha=Math.max(0,e.a); x.lineWidth=2; x.beginPath(); x.arc(e.x,e.y,(1-e.a)*22+4,0,6.283); x.stroke(); x.globalAlpha=1;});
    fx=fx.filter(function(e){return e.a>0;});
    // legend
    x.textAlign='left'; x.font='500 12.5px "Schibsted Grotesk",system-ui'; var lx=16;
    keys.forEach(function(k){var t=T[k]; x.fillStyle=t.c; x.beginPath(); x.arc(lx+5,H-22,5,0,6.283); x.fill(); x.fillStyle='rgba(255,255,255,.7)'; x.fillText(t.n,lx+15,H-18); lx+=x.measureText(t.n).width+36; });
    document.getElementById('sim-b').textContent=blocked; document.getElementById('sim-t').textContent=through;
  })(last);
})();
