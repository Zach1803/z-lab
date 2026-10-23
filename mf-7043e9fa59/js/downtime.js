(function(){
  var $=function(i){return document.getElementById(i);}; if(!$('dc-staff')) return;
  var hrs=4, fmt=function(n){return 'RM '+Math.round(n).toLocaleString('en-MY');};
  var tiers=[['Backup only',24],['Replication',4],['Automatic failover',.25]];
  function cost(h){return h*(+$('dc-staff').value*+$('dc-wage').value + +$('dc-rev').value);}
  function hl(h){return h<1?Math.round(h*60)+' minutes':h+' hours';}
  function draw(){
    $('dc-staff-o').textContent=$('dc-staff').value; $('dc-wage-o').textContent=fmt($('dc-wage').value); $('dc-rev-o').textContent=fmt($('dc-rev').value);
    $('dc-cost').textContent=fmt(cost(hrs)); $('dc-hrs').textContent=hl(hrs);
    var max=cost(24)||1;
    $('dc-bars').innerHTML=tiers.map(function(t){var c=cost(t[1]);return '<div style="margin-bottom:14px'+(t[1]===hrs?'':';opacity:.55')+'"><div style="display:flex;justify-content:space-between;font-size:14.5px;margin-bottom:6px"><span>'+t[0]+', about '+hl(t[1])+'</span><b>'+fmt(c)+'</b></div><div class="bar"><i style="width:'+Math.max(1,c/max*100)+'%"></i></div></div>';}).join('');
  }
  ['dc-staff','dc-wage','dc-rev'].forEach(function(i){$(i).addEventListener('input',draw);});
  $('dc-tier').addEventListener('change',function(e){hrs=+e.detail;draw();});
  draw();
})();
