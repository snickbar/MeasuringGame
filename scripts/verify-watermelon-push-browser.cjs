const assert=require('assert/strict'),{runFixture}=require('./browser-fixture.cjs');
const html=`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><base href="/">
${['home-fx','home-motion','home-new-scenes','home-idle','home-stories'].map(n=>'<link rel="stylesheet" href="anim/'+n+'.css">').join('')}
<style>body{margin:0}#home-screen{position:relative;height:100dvh;overflow:hidden}</style><div id="home-screen" class="active"></div>
<script type="module">localStorage.setItem('mg_soundEnabled','false');document.documentElement.dataset.homeScene='ants';window.api=await import('./anim/home-scene.mjs');await api.installHomeScene();window.ready=true;</script>`;
runFixture({html,widths:[320,390,430],height:840,out:'output/watermelon-push',check:async({width,evaluate,screenshot})=>{
 for(let i=0;i<200&&!await evaluate('window.ready');i++)await new Promise(r=>setTimeout(r,20));
 assert(await evaluate('window.ready'),'Home scene loads');
 await evaluate(`window.frames=new Map();window.serial=0;window.requestAnimationFrame=cb=>{frames.set(++serial,cb);return serial};window.cancelAnimationFrame=id=>frames.delete(id);window.seek=t=>{const batch=[...frames.values()];frames.clear();batch.forEach(cb=>cb(t));return true};window.tap=()=>{document.querySelector('.hs-tap[data-subject=prop]').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));return true};true`);
 const state=()=>evaluate(`(()=>{const r=document.getElementById('home-art'),m=r.querySelector('.hs-back'),ants=[...r.querySelectorAll('.hs-melon-helper')];return{playing:r.dataset.melonPushing==='true',transform:m.style.transform,visible:ants.map(a=>!a.hidden),left:ants.map(a=>parseFloat(a.style.left)),flip:ants.map(a=>a.style.transform),sheet:ants.map(a=>a.style.backgroundPosition),pending:frames.size,overflow:document.documentElement.scrollWidth>innerWidth}})()`);
 await evaluate('tap();seek(0)');assert((await state()).playing);
 await evaluate('seek(700)');const entering=await state();await evaluate('seek(2200)');const arrived=await state();assert(entering.left[1]>arrived.left[1],'helpers enter from right and walk left');
 await evaluate('tap()');assert.equal((await state()).pending,1,'repeat tap does not queue or restart');
 await evaluate('seek(3450)');const pushed=await state();assert(pushed.transform.includes('rotate(-3deg)'),'approved small left lean');assert(pushed.visible.every(Boolean));
 assert(await evaluate(`(()=>{const s=document.querySelector('.hs-stage'),front=s.querySelector('.hs-front'),back=s.querySelector('.hs-back');return !!(back.compareDocumentPosition(front)&Node.DOCUMENT_POSITION_FOLLOWING)&&getComputedStyle(back).zIndex===getComputedStyle(front).zIndex})()`),'whole ant stack paints after watermelon');
 await screenshot('push-'+width+'.png');await evaluate('seek(5250)');assert.equal((await state()).transform,'','melon returns exactly to rest');
 await evaluate('seek(5450)');assert((await state()).sheet.every(p=>p.endsWith('100%')),'ants stay braced until settled');
 await evaluate('seek(6200)');assert((await state()).flip.every(x=>x==='scaleX(-1)'),'helpers face right on departure');
 await evaluate('seek(8000)');const end=await state();assert(!end.playing&&end.visible.every(v=>!v)&&end.pending===0&&!end.overflow,'story finishes with no running work');
 await evaluate("tap();seek(9000);document.getElementById('home-screen').classList.remove('active')");await new Promise(r=>setTimeout(r,25));assert(!(await state()).playing,'leaving home cancels push');
 await evaluate("document.getElementById('home-screen').classList.add('active');document.documentElement.dataset.motion='reduce';tap()");assert(!(await state()).playing,'reduced motion respects app setting');
 await evaluate("delete document.documentElement.dataset.motion;tap();seek(10000);document.documentElement.dataset.homeScene='sunflower';api.installHomeScene()");
 for(let i=0;i<200&&!await evaluate("document.getElementById('home-art')?.dataset.scene==='sunflower'");i++)await new Promise(r=>setTimeout(r,20));
 assert(await evaluate("document.getElementById('home-art')?.dataset.scene==='sunflower'&&!document.querySelector('.hs-melon-helper')&&frames.size===0"),'changing scenes disposes helpers and pending frames');
 console.log('PASS watermelon push',width,'approach, overlap, lean, settle, exit, tap guard and lifecycle');
}}).catch(e=>{console.error(e);process.exitCode=1});
