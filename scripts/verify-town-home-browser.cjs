const assert=require('assert/strict'),{runFixture}=require('./browser-fixture.cjs');
const html=`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><base href="/">
${['home-fx','home-motion','home-new-scenes','home-idle','home-stories'].map(n=>'<link rel="stylesheet" href="anim/'+n+'.css">').join('')}
<style>body{margin:0}#home-screen{position:relative;height:100dvh;overflow:hidden}</style><div id="home-screen" class="active"></div>
<script type="module">window.buzzes=[];Object.defineProperty(navigator,'vibrate',{value:n=>{buzzes.push(n);return true},configurable:true});localStorage.setItem('mg_soundEnabled','false');localStorage.setItem('mg_vibrationEnabled','true');document.documentElement.dataset.homeScene='town';window.api=await import('./anim/home-scene.mjs');await api.installHomeScene();window.ready=true;</script>`;
runFixture({html,widths:[320,390,430],height:840,out:'output/town-refinements',check:async({width,evaluate,screenshot})=>{
 for(let i=0;i<200&&!await evaluate('window.ready');i++)await new Promise(r=>setTimeout(r,20));
 assert(await evaluate("document.querySelector('.hs-plate').src.endsWith('plate-town-v2.webp')"));
 assert.equal(await evaluate("document.querySelectorAll('.hs-moving-hit').length"),3,'two birds and one moving van');
 await evaluate("for(const a of document.querySelector('.hs-stage').getAnimations({subtree:true})){a.pause();a.currentTime=8000};true");
 assert(await evaluate("Number(getComputedStyle(document.querySelector('.hs-town-van-route')).zIndex)<Number(getComputedStyle(document.querySelector('.hs-front')).zIndex)"),'van stays behind the main objects');
 for(const [index,subject,time]of [[0,'mail-van',8000],[1,'pigeon',15000],[2,'bluebird',23000]]){
  const result=await evaluate(`(()=>{const hit=document.querySelector('.hs-moving-hit[data-subject="${subject}"]'),route=hit.closest('.hs-route');for(const a of route.getAnimations({subtree:true})){a.pause();a.currentTime=${time}}const r=hit.getBoundingClientRect(),target=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2),travel=route.querySelector('.hs-crit,.hs-town-van-track'),before=travel.getBoundingClientRect().left;hit.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));const gesture=route.querySelector('.hs-moving-gesture'),reaction=gesture.getAnimations()[0];return{hit:target===hit,target:target?.className,rect:[r.x,r.y,r.width,r.height],playing:route.dataset.reacting==='true',before,after:travel.getBoundingClientRect().left,frames:route.querySelectorAll('.hs-fxf').length,duration:reaction?.effect.getTiming().duration,buzz:buzzes.length}})()`);
  assert(result.hit,subject+' can be tapped when visible');assert(result.playing);assert.equal(result.before,result.after,subject+' stays on its travel path');assert.equal(result.buzz,index+1,'haptic feedback works while sounds are muted');
  await evaluate(`(()=>{const r=document.querySelector('.hs-moving-hit[data-subject="${subject}"]').closest('.hs-route');r.querySelector('.hs-moving-hit').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));r.querySelector('.hs-moving-gesture').getAnimations()[0].currentTime=200;return true})()`);assert.equal(await evaluate('buzzes.length'),index+1,'repeated tap does not queue a new reaction');
  if(subject==='bluebird'){
   assert.equal(result.frames,4);for(const t of [0,70,140,210,280,350]){
    const shown=await evaluate(`(()=>{const frames=[...document.querySelector('.hs-route[data-critter-index="1"]').querySelectorAll('.hs-fxf')];for(const el of frames){const a=el.getAnimations().find(a=>a.effect.getTiming().duration===420);a.pause();a.currentTime=${t}}return frames.filter(el=>Number(getComputedStyle(el).opacity)>.5).length})()`);assert.equal(shown,1,'one solid wing pose at every reaction step');
   }
  }
  await screenshot(subject+'-'+width+'.png');
  await evaluate(`document.querySelector('.hs-moving-hit[data-subject="${subject}"]').closest('.hs-route').querySelector('.hs-moving-gesture').getAnimations()[0].finish();true`);await new Promise(r=>setTimeout(r,30));assert(await evaluate(`!document.querySelector('.hs-moving-hit[data-subject="${subject}"]').closest('.hs-route').dataset.reacting`));
 }
 const directions=await evaluate(`(()=>{const route=document.querySelector('.hs-town-van-route'),track=route.querySelector('.hs-town-van-track'),body=route.querySelector('.hs-town-van-body');return [8000,36000].map(time=>{for(const a of route.getAnimations({subtree:true})){a.pause();a.currentTime=time}const r=body.getBoundingClientRect(),s=document.querySelector('.hs-stage').getBoundingClientRect();return{direction:new DOMMatrix(getComputedStyle(route).transform).a,baseline:(r.top+r.height*.9-s.top)/s.height,visible:Number(getComputedStyle(track).opacity)}})})()`);
 assert(directions[0].direction===1&&directions[1].direction===-1&&directions.every(d=>d.visible===1&&d.baseline>.58&&d.baseline<.61),'van drives forward both ways, with wheels on the delivery lane');
 await screenshot('return-trip-'+width+'.png');
 await evaluate("document.querySelector('.hs-tap[data-subject=hero]').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));true");assert.equal(await evaluate('buzzes.length'),4,'mailbox still gives haptic feedback');
 assert(await evaluate("getComputedStyle(document.querySelector('.hs-open')).opacity==='1'&&getComputedStyle(document.querySelector('.hs-mail-closed')).opacity==='0'"),'mailbox opens with its letter');
 await evaluate("localStorage.setItem('mg_vibrationEnabled','false');document.querySelector('.hs-moving-hit[data-subject=mail-van]').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));true");assert.equal(await evaluate('buzzes.length'),4,'vibration setting is respected');
 await evaluate("document.documentElement.dataset.motion='reduce'");await new Promise(r=>setTimeout(r,20));assert(await evaluate("!document.querySelector('.hs-route[data-reacting]')"),'reducing motion cancels all reactions');
 await evaluate("delete document.documentElement.dataset.motion;document.querySelector('.hs-moving-hit[data-subject=mail-van]').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));document.getElementById('home-screen').classList.remove('active')");await new Promise(r=>setTimeout(r,20));assert(await evaluate("!document.querySelector('.hs-route[data-reacting]')"),'leaving Home cancels reactions');
 assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'));
 console.log('PASS Mailboxes background, van, two birds, mailbox, haptics and lifecycle',width);
}}).catch(e=>{console.error(e);process.exitCode=1});
