import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const extract=(start,end)=>html.slice(html.indexOf(start),html.indexOf(end,html.indexOf(start)));
const run=extract('  async function survivalRunReveal() {','  // Run over: save the best');
const result=extract('  function svShowResult(m) {','  // Game over: how this run compares');
const stop=html.match(/  function survivalStop\(\) \{[^\n]+/)[0];
const skip=extract('    if (b.id === "sv-skip") {','    if (b.id === "sv-finish")');
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no});return{promise,resolve,reject}};
const state=()=>({phase:'reveal',q:{answer:100},g:100,survived:0,resultShown:false});
function fixture(){
 const module=deferred(),picture=deferred(),preparing=deferred();let renders=0,starts=0,shown=true,done;
 const ctl={prepare:()=>{preparing.resolve();return picture.promise},destroy(){},start:(scene,options)=>{starts++;done=options.onDone}};
 const mod={createStackAnimation:()=>ctl,LIGHT_THEME:{},formatCount:String};
 const c={sv:state(),svAnim:null,svRevealToken:0,console:{warn(){}},Date,
  loadAnimModule:()=>module.promise,questionObjects:()=>[{},{}],survivalScreenEl:{classList:{contains:()=>shown}},
  document:{getElementById:()=>({})},dockRevealSkip(){},fitRevealStage:()=>({}),animAudioInit(){},audioLifecycle:{guard:fn=>fn},playAnimCue(){},
  deviceId:'me',SURVIVAL_PASS:60,effectiveGuess:(q,g)=>g,roundAccuracy:r=>r*100,vibrate(){},
  preloadWbReactionArt:()=>Promise.resolve(),bufferResultNote:()=>'',wbSidePick:()=>'',svQuip:()=>'',renderSurvival(){renders++}};
 vm.createContext(c);vm.runInContext(stop+'\n'+result+run+'\nasync function skipReveal(){const b={id:"sv-skip"};'+skip+'}',c);
 return{c,module,picture,preparing,mod,renders:()=>renders,starts:()=>starts,hide:()=>{shown=false},done:()=>done?.()};
}
for(const wait of ['module','picture'])for(const change of ['new-run','new-question','leave','stopped','hidden']){
 const f=fixture(),pending=f.c.survivalRunReveal();
 if(wait==='picture'){f.module.resolve(f.mod);await f.preparing.promise;}
 if(change==='new-run')f.c.sv={...state(),phase:'question'};
 if(change==='new-question'){f.c.sv.q={answer:50};f.c.sv.phase='question';}
 if(change==='leave')f.c.survivalStop();
 if(change==='stopped')f.c.survivalStop();
 if(change==='hidden')f.hide();
 if(wait==='module')f.module.resolve(null);else f.picture.reject(Error('old download failed'));
 await pending;assert.equal(f.renders(),0,wait+': '+change);assert.equal(f.starts(),0);
}
const good=fixture(),playing=good.c.survivalRunReveal();good.module.resolve(good.mod);await good.preparing.promise;good.picture.resolve({});await playing;
assert.equal(good.starts(),1);good.done();good.done();assert.equal(good.renders(),1);assert.equal(good.c.sv.phase,'result');
const bad=fixture(),failed=bad.c.survivalRunReveal();bad.module.resolve(bad.mod);await bad.preparing.promise;bad.picture.reject(Error('current image failed'));await failed;assert.equal(bad.renders(),1,'current failure still shows its result');
const unavailable=fixture(),fallback=unavailable.c.survivalRunReveal();unavailable.module.resolve(null);await fallback;assert.equal(unavailable.renders(),1,'current missing engine still shows its result');
const late=fixture(),loading=late.c.survivalRunReveal();late.module.resolve(late.mod);await late.preparing.promise;late.c.survivalStop();late.c.sv=state();late.picture.resolve({});await loading;assert.equal(late.starts(),0,'late successful picture cannot start in a new run');
const ending=fixture(),showing=ending.c.survivalRunReveal();ending.module.resolve(ending.mod);await ending.preparing.promise;ending.picture.resolve({});await showing;ending.c.survivalStop();ending.c.sv=state();ending.done();assert.equal(ending.renders(),0,'old onDone cannot finish a new reveal');
for(const leave of [false,true]){
 const f=fixture(),pending=f.c.skipReveal();if(leave){f.c.survivalStop();f.c.sv={...state(),phase:'question'};}
 f.module.resolve(f.mod);await pending;assert.equal(f.renders(),leave?0:1,'skip also respects run identity');
}

const engine=fs.readFileSync(new URL('../anim/stack-anim.js',import.meta.url),'utf8');
const pictureSource=engine.slice(engine.indexOf('  function loadPicture(o) {'),engine.indexOf('  // The picture as it first lies'));
function pictures(){
 const images=[],timers=new Set(),pics=new Map();
 const c={pics,poseCache:new Map(),spriteCache:new Map(),imageUrl:o=>o.image,
  setTimeout:fn=>{timers.add(fn);return fn},clearTimeout:fn=>timers.delete(fn),Image:class{constructor(){images.push(this)}}};
 vm.createContext(c);vm.runInContext(pictureSource,c);return{load:c.loadPicture,pics,images,timers};
}
const a={id:'ant',image:'ant.webp'},p=pictures();let pending=p.load(a),rejected=assert.rejects(pending,/Could not load/);p.images[0].onerror();await rejected;
pending=p.load(a);assert.equal(p.load(a),pending,'concurrent callers share a retry');p.images[1].onload();await pending;assert.equal(p.images.length,2);assert.equal(p.load(a),pending);
const stalled=pictures();pending=stalled.load(a);rejected=assert.rejects(pending,/timed out/);for(const timeout of [...stalled.timers])timeout();await rejected;
pending=stalled.load(a);stalled.images[1].onload();await pending;assert.equal(stalled.timers.size,0);
const alternate=pictures();const old=alternate.load(a),oldRejected=assert.rejects(old);const replacement=alternate.load({...a,image:'ant-2.webp'});
alternate.images[0].onerror();await oldRejected;assert.equal(alternate.load({...a,image:'ant-2.webp'}),replacement,'old failure cannot evict replacement');alternate.images[1].onload();await replacement;
console.log('PASS: stale Survival module/picture/skip callbacks, normal and failed reveals, picture error/timeout retry, shared caching and alternate-art races.');
