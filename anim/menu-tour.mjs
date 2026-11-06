const STEPS=[
 ['home-btn-row','Choose a game','Solo Game is for playing on your own. Party Mode hosts a game with friends; Join Game enters their room.'],
 ['toolbar-awards-btn','Stats & Awards','Open Stats to track your progress and find Awards, where you claim earned rewards.'],
 ['toolbar-cosmetics-btn','Your Style','Open Cosmetics to choose your avatars, reactions, flairs, boards and scenes.'],
 ['toolbar-settings-btn','Settings & help','Open this menu, then choose Settings for sound, your account, app updates and How to Play. Replay this menu tour there any time.'],
];

export function createMenuTour({owner,canOffer,canReplay,goHome,storage}){
 if(!storage){try{storage=globalThis.localStorage;}catch{}}
 const sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href=new URL('./menu-tour.css',import.meta.url);document.head.append(sheet);
 const dialog=document.createElement('dialog');dialog.id='menu-tour';dialog.setAttribute('aria-labelledby','menu-tour-title');document.body.append(dialog);
 const memory=new Set();let step=-1,timer=null,offered=false,tourOwner=null,opener=null,frame=null;
 const key=()=>`mg_menuTour_v1_${owner()||'guest'}`;
 const seen=()=>{try{return memory.has(key())||!!storage?.getItem(key());}catch{return memory.has(key());}};
 function remember(status){memory.add(key());try{storage?.setItem(key(),status);}catch{}}
 function close(status='skipped'){
  if(!dialog.open)return;
  if(tourOwner===owner())remember(status);
  dialog.close();cancelAnimationFrame(frame);
  if(opener?.isConnected&&opener.getClientRects().length)opener.focus({preventScroll:true});
 }
 function position(){
  if(!dialog.open)return;
  const panel=dialog.querySelector('.menu-tour-card'),spot=dialog.querySelector('.menu-tour-spot');
  panel.style.left='';panel.style.top='';
  if(step<0){spot.hidden=true;return;}
  const target=document.getElementById(STEPS[step][0]);
  if(!target?.getClientRects().length){close();return;}
  const r=target.getBoundingClientRect(),vw=document.documentElement.clientWidth,vh=window.innerHeight;
  spot.hidden=false;Object.assign(spot.style,{left:Math.max(4,r.left-5)+'px',top:Math.max(4,r.top-5)+'px',width:Math.min(vw-8,r.width+10)+'px',height:r.height+10+'px'});
  const h=panel.offsetHeight,w=panel.offsetWidth;
  const below=r.bottom+20,above=r.top-h-20;
  const y=below+h<vh-12?below:above>=12?above:Math.max(12,vh-h-12);
  panel.style.left=Math.max(12,Math.min(vw-w-12,r.left+r.width/2-w/2))+'px';panel.style.top=y+'px';
 }
 function render(){
  const intro=step<0,title=intro?'Want a quick menu tour?':STEPS[step][1];
  const text=intro?'Find your games, rewards, Style and Settings in four short steps. Skip any time and replay from Settings.':STEPS[step][2];
  dialog.innerHTML=`<div class="menu-tour-spot" aria-hidden="true" hidden></div><section class="menu-tour-card"><p class="menu-tour-count">${intro?'Optional · about 20 seconds':`Step ${step+1} of ${STEPS.length}`}</p><h2 id="menu-tour-title" tabindex="-1">${title}</h2><p>${text}</p><footer><button type="button" data-skip>Skip</button>${step>0?'<button type="button" data-back>Back</button>':''}<button type="button" data-next>${intro?'Start tour':step===STEPS.length-1?'Done':'Next'}</button></footer></section>`;
  dialog.querySelector('[data-skip]').onclick=()=>close();
  dialog.querySelector('[data-back]')?.addEventListener('click',()=>{step--;render();});
  dialog.querySelector('[data-next]').onclick=()=>{if(step===STEPS.length-1){close('completed');return;}step++;render();};
  frame=requestAnimationFrame(position);dialog.querySelector('h2').focus({preventScroll:true});
 }
 function open(replay=false){
  if(dialog.open||document.querySelector('dialog[open]')||!(replay?canReplay():canOffer()))return;
  clearTimeout(timer);timer=null;opener=document.activeElement;tourOwner=owner();offered=true;
  if(replay)goHome();step=replay?0:-1;render();dialog.showModal();position();dialog.querySelector('h2').focus({preventScroll:true});
 }
 function refresh(){
  const replay=document.getElementById('settings-menu-tour-btn');
  if(replay){
   const allowed=canReplay(),hint=allowed?'Find games, rewards, Style and Settings':'Return Home to replay the menu tour';
   if(replay.disabled===allowed)replay.disabled=!allowed;
   if(replay.querySelector('small').textContent!==hint)replay.querySelector('small').textContent=hint;
  }
  if(dialog.open){if(tourOwner!==owner()||!document.getElementById('home-screen')?.classList.contains('active'))close();return;}
  if(seen()||offered||!owner()||!canOffer()){clearTimeout(timer);timer=null;return;}
  if(timer===null)timer=setTimeout(()=>{timer=null;if(!seen()&&canOffer())open();},900);
 }
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 window.addEventListener('resize',position);window.visualViewport?.addEventListener('resize',position);
 window.addEventListener('scroll',position,true);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)close();else refresh();});
 const observer=new MutationObserver(refresh);
 observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class','hidden','open']});
 document.getElementById('settings-menu-tour-btn')?.addEventListener('click',()=>open(true));
 refresh();
 return {refresh,open:()=>open(true),get blocksPractice(){return !seen()||offered;}};
}
