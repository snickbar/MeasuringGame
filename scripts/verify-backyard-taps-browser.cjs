const assert=require('assert/strict'),{runFixture}=require('./browser-fixture.cjs');
const html=`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><base href="/">
${['home-fx','home-motion','home-new-scenes','home-idle','home-stories'].map(n=>'<link rel="stylesheet" href="anim/'+n+'.css">').join('')}
<style>body{margin:0}#home-screen{position:relative;height:100dvh;overflow:hidden}</style><div id="home-screen" class="active"></div>
<script type="module">window.buzzes=[];Object.defineProperty(navigator,'vibrate',{value:n=>{buzzes.push(n);return true},configurable:true});localStorage.setItem('mg_soundEnabled','false');localStorage.setItem('mg_vibrationEnabled','true');document.documentElement.dataset.homeScene='ants';window.api=await import('./anim/home-scene.mjs');await api.installHomeScene();window.ready=true;</script>`;
runFixture({html,widths:[320,390,430],height:840,out:'output/backyard-refinements',check:async({width,evaluate,screenshot})=>{
 for(let i=0;i<200&&!await evaluate('window.ready');i++)await new Promise(r=>setTimeout(r,20));
 assert(await evaluate("document.querySelector('.hs-plate').src.endsWith('plate-ants-v2.webp')"),'refreshed background loads');
 assert.equal(await evaluate("document.querySelectorAll('.hs-bug-hit').length"),2);
 await evaluate("document.querySelector('.hs-tap[data-subject=prop]').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));true");
 assert.equal(await evaluate('buzzes.length'),1,'melon buzz works even when sounds are muted');
 await evaluate("document.querySelector('.hs-tap[data-subject=prop]').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));true");assert.equal(await evaluate('buzzes.length'),1,'busy watermelon does not repeat feedback');
 await evaluate("document.getElementById('home-screen').classList.remove('active')");await new Promise(r=>setTimeout(r,20));await evaluate("document.getElementById('home-screen').classList.add('active')");
 for(const index of [0,1]){
  const start=await evaluate(`(()=>{const route=document.querySelector('.hs-route[data-critter-index="${index}"]'),hit=route.querySelector('.hs-bug-hit');for(const a of route.getAnimations({subtree:true})){a.pause();a.currentTime=${index?21000:8000}}const r=hit.getBoundingClientRect(),target=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2),before=route.querySelector('.hs-crit').getBoundingClientRect().left;hit.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));return{hit:target===hit,target:target?.className,rect:[r.x,r.y,r.width,r.height],reacting:route.dataset.reacting==='true',speeds:[...route.querySelectorAll('.hs-wing,.hs-flight-wing')].flatMap(n=>n.getAnimations().map(a=>a.playbackRate)),before,after:route.querySelector('.hs-crit').getBoundingClientRect().left}})()`);
  assert(start.hit,'visible insect can actually be tapped');assert(start.reacting&&start.speeds.length===2&&start.speeds.every(n=>n===4),'both wings accelerate');assert.equal(start.before,start.after,'flight route does not jump');
  assert.equal(await evaluate('buzzes.length'),index+2,'each insect gives one haptic tap');
  await evaluate(`document.querySelector('.hs-route[data-critter-index="${index}"] .hs-bug-gesture').getAnimations()[0].currentTime=210;true`);
  assert(await evaluate(`getComputedStyle(document.querySelector('.hs-route[data-critter-index="${index}"] .hs-bug-gesture')).transform!=='matrix(1, 0, 0, 1, 0, 0)'`),'brief bob is visible');
  await screenshot((index?'butterfly':'bee')+'-'+width+'.png');
  await evaluate(`document.querySelector('.hs-route[data-critter-index="${index}"] .hs-bug-gesture').getAnimations()[0].finish();true`);await new Promise(r=>setTimeout(r,35));
  assert(await evaluate(`(()=>{const r=document.querySelector('.hs-route[data-critter-index="${index}"]');return !r.dataset.reacting&&[...r.querySelectorAll('.hs-wing,.hs-flight-wing')].flatMap(n=>n.getAnimations()).every(a=>a.playbackRate===1)})()`),'reaction finishes and ordinary wing speed returns');
 }
 await evaluate("localStorage.setItem('mg_vibrationEnabled','false');document.querySelector('.hs-bug-hit').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));true");assert.equal(await evaluate('buzzes.length'),3,'vibration setting is respected');
 await evaluate("document.documentElement.dataset.motion='reduce'");await new Promise(r=>setTimeout(r,20));assert(await evaluate("!document.querySelector('.hs-tappable-bug[data-reacting]')"),'reducing motion cancels reactions');
 await evaluate("delete document.documentElement.dataset.motion;document.querySelector('.hs-bug-hit').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));document.getElementById('home-screen').classList.remove('active')");await new Promise(r=>setTimeout(r,20));assert(await evaluate("!document.querySelector('.hs-tappable-bug[data-reacting]')"),'leaving Home cancels reactions');
 console.log('PASS Backyard background, real insect tap targets, faster wings, bob, haptics and lifecycle',width);
}}).catch(e=>{console.error(e);process.exitCode=1});
