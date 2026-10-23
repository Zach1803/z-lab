(function(){
  var st={size:'huddle',use:'calls',plat:'webex'};
  var base={
    huddle:{t:'Huddle room kit',k:['All-in-one video bar with camera, microphones and speaker','One 55 to 65 inch display','Touch controller on the table to join with one tap']},
    small:{t:'Small room kit',k:['Video bar with auto-framing camera','One 65 inch display','Table microphone for people at the far end','Touch controller to start meetings']},
    medium:{t:'Medium room kit',k:['Codec with a wide-angle tracking camera','Dual 75 inch displays, people on one and content on the other','Ceiling or table microphone array','Wall-mounted speakers','Acoustic panels to cut echo']},
    board:{t:'Boardroom system',k:['Multi-camera system that switches to whoever is speaking','Dual 86 inch displays or a direct-view LED wall','Beamforming ceiling microphones','Ceiling speakers with even coverage','Full acoustic treatment and video lighting']},
    training:{t:'Training room system',k:['Presenter-tracking camera and an audience camera','Projector or LED wall plus confidence monitors','Wireless handheld and lapel microphones','Room-wide speaker system','Recording and streaming of sessions']}};
  var extra={calls:'Camera placed at eye level, under the display',present:'Wireless screen sharing from any laptop or phone',hybrid:'Digital whiteboard that remote people can draw on too'};
  var plat={webex:'Certified for Cisco Webex',teams:'Certified for Microsoft Teams Rooms',both:'Dual-platform device that joins Webex and Teams calls'};
  function draw(){var b=base[st.size];document.getElementById('rp-title').textContent=b.t;
    document.getElementById('rp-list').innerHTML=b.k.concat([extra[st.use],plat[st.plat]]).map(function(x){return '<li>'+x+'</li>';}).join('');}
  [['rp-size','size'],['rp-use','use'],['rp-plat','plat']].forEach(function(p){var el=document.getElementById(p[0]);if(el)el.addEventListener('change',function(e){st[p[1]]=e.detail;draw();});});
  if(document.getElementById('rp-title')) draw();
})();
