const assert=require('assert/strict');
const {runFixture}=require('./browser-fixture.cjs');
const html=`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><base href="/">
${['home-fx','home-motion','home-new-scenes','home-idle','home-stories','ui-delight'].map(name=>'<link rel="stylesheet" href="anim/'+name+'.css">').join('')}
<style>body{margin:0}#home-screen{position:relative;height:100dvh;overflow:hidden}#daily-probe{position:fixed;visibility:hidden;top:0;width:260px}#daily-probe i{display:block;height:12px;width:65%}</style>
<div id="daily-probe" class="dc-streak-bar"><i></i></div><div id="home-screen" class="active"></div>
<script type="module">localStorage.setItem('mg_soundEnabled','false');window.api=await import('./anim/home-scene.mjs');window.ready=true;</script>`;
const gestures={ants:'.hs-wigA',sunflower:'.hs-pollen i',games:'.hs-back>.hs-hop',house:'.hs-utensil',snacks:'.hs-sway',town:'.hs-wagS',corgi:'.hs-earL',wheels:'.hs-engine-glow',lighthouse:'.hs-shore-wave',underwater:'.hs-seaweed','toy-box':'.hs-fx-glow',penguin:'.hs-cold-breath i',cactus:'.hs-fx-bloom',giraffe:'.hs-flickL',dragon:'.hs-peek',space:'.hs-shooting-star','make-believe':'.nh-unicorn-wink','holiday-mix':'.hs-back>.hs-hop'};
runFixture({html,out:'output/home-idle',check:async({width,evaluate,screenshot})=>{
 for(let n=0;n<200&&!await evaluate('window.ready');n++)await new Promise(r=>setTimeout(r,20));
 assert(await evaluate('window.ready'),'Home module loads');
 const bar=await evaluate(`(()=>{const el=document.querySelector('#daily-probe i'),a=el.getAnimations()[0];a.pause();return [0,600,1100].map(t=>{a.currentTime=t;return el.getBoundingClientRect().width})})()`);
 assert(bar[0]<1&&bar[1]>bar[0]&&bar[1]<bar[2]&&Math.abs(bar[2]-169)<1,'Daily fill visibly grows to its actual streak fraction');
 for(const [scene,selector] of Object.entries(gestures)){
  const result=await evaluate(`(async()=>{document.documentElement.dataset.homeScene=${JSON.stringify(scene)};await api.installHomeScene();for(let n=0;n<100&&document.getElementById('home-art')?.dataset.scene!==${JSON.stringify(scene)};n++)await new Promise(r=>setTimeout(r,20));const art=document.getElementById('home-art');if(art?.dataset.scene!==${JSON.stringify(scene)})throw Error('Scene failed to load');const el=art.querySelector(${JSON.stringify(selector)}),a=el?.getAnimations()[0];return {hasArt:document.getElementById('home-screen').classList.contains('has-art'),duration:a?.effect.getTiming().duration,loop:String(a?.effect.getTiming().iterations),decoded:[...art.querySelectorAll('img')].every(im=>im.naturalWidth),overflow:document.documentElement.scrollWidth>innerWidth}})()`);
  assert(result.hasArt&&result.decoded&&!result.overflow,scene+' renders completely at '+width);
  assert(result.duration>=13000&&result.loop==='Infinity',scene+' has a quiet ambient cycle');
  if(scene==='house'){
   assert.equal(await evaluate("document.querySelectorAll('.hs-utensil').length"),3);
   await evaluate("for(const a of document.querySelector('.hs-ambient-background').getAnimations({subtree:true})){a.pause();a.currentTime=5500;}");
   await screenshot('kitchen-utensils-'+width+'.png');
  }
  if(scene==='space'){
   const star=await evaluate(`(()=>{const el=document.querySelector('.hs-shooting-star'),a=el.getAnimations()[0];a.pause();a.currentTime=0;const hidden=Number(getComputedStyle(el).opacity);a.currentTime=5900;const r=el.getBoundingClientRect();return {hidden,visible:Number(getComputedStyle(el).opacity),onScreen:r.right>0&&r.left<innerWidth&&r.bottom>0&&r.top<innerHeight,behind:!!el.closest('.hs-ambient-background')}})()`);
   assert(star.hidden===0&&star.visible>.5&&star.onScreen&&star.behind,'Shooting star crosses the background, with a long quiet interval');
   await screenshot('space-shooting-star-'+width+'.png');
  }
  if(width===390){
   if(['sunflower','penguin','wheels','lighthouse','underwater'].includes(scene))await evaluate(`for(const el of document.querySelectorAll('.hs-idle-detail'))for(const a of el.getAnimations({subtree:true})){a.pause();a.currentTime=6600}`);
   await screenshot(scene+'-390.png');
  }
 }
 await evaluate("document.documentElement.dataset.homeScene='space';api.installHomeScene()");
 for(let n=0;n<100&&!await evaluate("!!document.querySelector('.hs-shooting-star')");n++)await new Promise(r=>setTimeout(r,20));
 const paused=await evaluate(`(async()=>{document.getElementById('home-screen').classList.remove('active');await new Promise(r=>setTimeout(r,25));return document.getElementById('home-art').classList.contains('hs-paused')&&document.getElementById('home-art').getAnimations({subtree:true}).every(a=>a.playState==='paused')})()`);
 assert(paused,'Leaving Home pauses all detail animations');
 const reduced=await evaluate(`(()=>{document.documentElement.dataset.motion='reduce';return {bar:document.querySelector('#daily-probe i').getBoundingClientRect().width,star:getComputedStyle(document.querySelector('.hs-shooting-star')).display,animations:document.getElementById('home-art').getAnimations({subtree:true}).length}})()`);
 assert(Math.abs(reduced.bar-169)<1&&reduced.star==='none'&&reduced.animations===0,'Reduced motion shows the correct streak and stops ambient movement');
 console.log({pass:true,width,scenes:Object.keys(gestures).length,dailyFill:bar});
}}).catch(e=>{console.error(e);process.exitCode=1});
