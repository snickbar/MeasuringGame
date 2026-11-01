const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const {runFixture}=require('./browser-fixture.cjs');
const source=fs.readFileSync(__dirname+'/verify-home-idle-browser.cjs','utf8'),sandbox={};
vm.runInNewContext(source.slice(source.indexOf('const html='),source.indexOf('const gestures='))+';globalThis.html=html;',sandbox);
runFixture({html:sandbox.html,out:'output/home-stories',check:async({width,evaluate,screenshot})=>{
 for(let n=0;n<200&&!await evaluate('window.ready');n++)await new Promise(r=>setTimeout(r,20));
 const open=async scene=>{await evaluate(`document.documentElement.dataset.homeScene='${scene}';api.installHomeScene()`);for(let n=0;n<150&&!await evaluate(`document.getElementById('home-art')?.dataset.scene==='${scene}'`);n++)await new Promise(r=>setTimeout(r,20));assert(await evaluate(`document.getElementById('home-art')?.dataset.scene==='${scene}'`));};
 const seek=async time=>evaluate(`for(const a of document.getElementById('home-art').getAnimations({subtree:true})){a.pause();a.currentTime=${time}};true`);
 await open('wheels');await seek(5000);
 assert.equal(await evaluate("document.querySelectorAll('.hs-cycle-thigh,.hs-cycle-shin').length"),4,'both knees have articulated links');
 const cycle=await evaluate(`(()=>{const w=document.querySelector('.hs-cycle-wheel').getBoundingClientRect(),c=document.querySelector('.hs-cycle-crank').getBoundingClientRect();return{gap:Math.hypot((w.left+w.right-c.left-c.right)/2,(w.top+w.bottom-c.top-c.bottom)/2),width:w.width,behind:!!document.querySelector('.hs-cycle-travel').closest('.hs-story-background')}})()`);
 assert(cycle.gap<2&&cycle.behind,'wheel and crank share the axle, behind foreground objects');await screenshot('unicycle-'+width+'.png');
 await open('make-believe');
 for(let t=7000;t<23000;t+=130){await seek(t);const count=await evaluate(`(()=>{const gait=document.querySelector('.hs-rabbit-gait'),rest=document.querySelector('.hs-rabbit-rest');return(Number(getComputedStyle(gait).opacity)>.5?[...gait.children].filter(n=>Number(getComputedStyle(n).opacity)>.5).length:0)+(Number(getComputedStyle(rest).opacity)>.5?1:0)})()`);assert.equal(count,1,'exactly one rabbit pose, including its pause');}
 await seek(12000);await screenshot('rabbit-'+width+'.png');
 await open('games');await seek(11500);assert(await evaluate("!!document.querySelector('.hs-story-ship')&&!!document.querySelector('.hs-story-dolphin')"));await screenshot('beach-'+width+'.png');
 await seek(13100);assert.equal(await evaluate("Number(getComputedStyle(document.querySelector('.hs-story-dolphin')).opacity)"),1,'dolphin stays opaque until it goes back below water');
 await seek(13600);assert(await evaluate("document.querySelector('.hs-story-dolphin').getBoundingClientRect().top>=document.querySelector('.hs-dolphin-water').getBoundingClientRect().bottom"),'dolphin is below the clip before disappearing');
 assert(await evaluate("!!document.querySelector('.hs-story-ship').closest('.hs-ship-horizon') && getComputedStyle(document.querySelector('.hs-ship-horizon')).clipPath.startsWith('polygon(')"),'ship is masked by the plate waterline and wave crest');
 assert(await evaluate("!document.querySelector('.hs-story-dolphin').closest('.hs-ship-horizon')"),'dolphin remains in front of the wave');
 assert(await evaluate("getComputedStyle(document.querySelector('.hs-ship-horizon')).clipPath.includes('79% 100%')"),'flat sea is unobstructed; only raised right wave occludes the ship');
 await seek(0);await screenshot('ship-clear-water-'+width+'.png');
 await seek(40000);await screenshot('ship-approaching-wave-'+width+'.png');
 await seek(50000);await screenshot('distant-ship-'+width+'.png');
 await open('toy-box');await seek(0);
 const tap=()=>evaluate("document.querySelector('.hs-jack-tap').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));true");
 await tap();assert(await evaluate("document.querySelector('.hs-story-jack').dataset.playing==='true'"),'tap starts the jack');
 await seek(1200);const busy=await evaluate("document.querySelector('.hs-jack-spring').getAnimations()[0].currentTime");await tap();assert.equal(await evaluate("document.querySelector('.hs-jack-spring').getAnimations()[0].currentTime"),busy,'repeat tap does not restart or queue the jack');
 await screenshot('jack-open-'+width+'.png');
 assert(await evaluate(`(()=>{const lid=document.querySelector('.hs-jack-lid-open'),m=new DOMMatrix(getComputedStyle(lid).transform);return Number(getComputedStyle(lid).opacity)>.99&&m.d>.99&&Number(getComputedStyle(document.querySelector('.hs-jack-lid')).opacity)<.01})()`),'full illustrated inner lid is visible behind clown; closed lid is hidden');
 assert(await evaluate(`(()=>{const lid=document.querySelector('.hs-jack-lid-open'),jack=document.querySelector('.hs-story-jack').getBoundingClientRect(),r=lid.getBoundingClientRect();return getComputedStyle(lid).position==='absolute'&&Math.abs(r.bottom-(jack.top+jack.height*174/300))<1})()`),'open lid lower hinge remains attached to the rear box rim');
 for(const time of [0,150,300,550,2900,3300,3750]){await seek(time);await screenshot('jack-transition-'+time+'-'+width+'.png');}
 const horizontal=[];for(const t of [5000,6000,7000]){await seek(t);horizontal.push(await evaluate("document.querySelector('.hs-bouncing-ball').getBoundingClientRect().left"));}
 assert(Math.abs((horizontal[1]-horizontal[0])-(horizontal[2]-horizontal[1]))<1,'ball travels horizontally at a steady speed');
 await evaluate("document.getElementById('home-screen').classList.remove('active')");await new Promise(r=>setTimeout(r,30));assert(await evaluate("!document.querySelector('.hs-story-jack').dataset.playing"),'leaving cancels jack replay lock');
 await evaluate("document.documentElement.dataset.motion='reduce'");assert.equal(await evaluate("getComputedStyle(document.querySelector('.hs-story-background')).display"),'none','reduced motion hides background stories');
 console.log({pass:true,width,axleGap:cycle.gap,ballPositions:horizontal});
}}).catch(e=>{console.error(e);process.exitCode=1});
