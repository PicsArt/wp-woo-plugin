(function(){'use strict';document.querySelectorAll('.picsart-video-widget').forEach(function(v){
var mode=v.dataset.playback,visible=false,hovered=false,focused=false,suspended=false;
var reduced=matchMedia('(prefers-reduced-motion: reduce)'),pointer=matchMedia('(hover: hover)');
function play(){if(visible&&!document.hidden&&!suspended){v.muted=true;v.play().catch(function(){});}}
function reconcile(){if(!visible||document.hidden){v.pause();return;}if(mode==='autoplay'&&!reduced.matches&&!(navigator.connection&&navigator.connection.saveData))play();}
v.addEventListener('pointerenter',function(){if(!pointer.matches)return;hovered=true;suspended=false;if(mode==='hover'||mode==='hover-only')play();});
v.addEventListener('pointerleave',function(){hovered=false;if(mode==='hover-only'&&!focused)v.pause();});
v.addEventListener('focusin',function(){focused=true;});v.addEventListener('focusout',function(){focused=false;if(mode==='hover-only'&&!hovered)v.pause();});
v.addEventListener('keydown',function(e){if(e.key==='Escape'){suspended=true;v.pause();}});
v.addEventListener('pause',function(){if(visible&&!document.hidden&&(mode!=='hover-only'||hovered||focused))suspended=true;});
new IntersectionObserver(function(entries){visible=entries[0].isIntersecting;reconcile();},{threshold:0.25}).observe(v);
document.addEventListener('visibilitychange',reconcile);
});})();
