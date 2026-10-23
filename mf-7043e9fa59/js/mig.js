(function(){var s=document.querySelector('.mig-seg');if(!s)return;
s.addEventListener('change',function(e){document.querySelectorAll('.mig').forEach(function(o){o.hidden=o.dataset.k!==e.detail;});});})();
