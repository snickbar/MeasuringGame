const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const {runFixture}=require('./browser-fixture.cjs');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/\r\n/g,'\n');
const existing=fs.readFileSync(path.join(root,'scripts/verify-game-polish-browser.cjs'),'utf8');
const sandbox={};vm.runInNewContext(existing.slice(existing.indexOf('const dbStub='),existing.indexOf('let checks='))+';globalThis.parts={dbStub,authStub,injected};',sandbox);
const {dbStub,authStub,injected}=sandbox.parts;
const extra=String.raw`
window.__launch={
 stats:()=>window.__polish.stats(),objects:()=>window.__polish.objects(),
 reaction:async(phase,stage,paused=false)=>{
  await window.__polish.lobby();
  for(const d of document.querySelectorAll('dialog[open]'))d.close();
  roomState.phase=phase;roomState.paused=paused;roomState.hs={stage,animEndsAt:nowMs()+2000};roomState.bluff={stage};
  OVERLAY_SCREENS.forEach(e=>e.classList.remove('active'));
  hudEl.classList.toggle('active',!['hs','bluff','final'].includes(phase));
  hsScreenEl.classList.toggle('active',phase==='hs');bluffScreenEl.classList.toggle('active',phase==='bluff');finalScreenEl.classList.toggle('active',phase==='final');
  bottomToolbarEl.classList.add('active');updateReactionAvailability();
  const state=reactionState();
  return {allowed:state.allowed,disabled:[...reactionStripEl.querySelectorAll('[data-emoji]')].every(b=>b.disabled),locked:reactionStripEl.classList.contains('anim-locked')};
 },
 reactionVisible:()=>{
  clearReactionBubbles();scoreColEl.style.display='none';
  renderReactionBubble({playerId:currentPlayerId,name:'You',avatar:'av07',emoji:START_EMOJIS[0]});
  const stage=document.querySelector('.rx-stage'),r=stage?.getBoundingClientRect();
  scoreColEl.style.display='';
  return r?{left:r.left,right:r.right,top:r.top,bottom:r.bottom}:null;
 },
 cooldown:()=>{
  const b=reactionStripEl.querySelector('[data-emoji]');b.click();
  return {disabled:[...reactionStripEl.querySelectorAll('[data-emoji]')].every(b=>b.disabled),cooling:reactionStripEl.classList.contains('cooling'),incomingAllowed:reactionState().allowed};
 },
 world:()=>{
  clearReactionBubbles();modeTutorialUI.close();modeTutorialUI.mark('worlds');openWorlds();wl.wi=0;wl.phase='world';
  myProfile.worlds||={};myProfile.worlds.tiny={l1:2};myProfile.worldRecords||={};myProfile.worldRecords.tiny={l1:{bestAccuracy:85,attempts:1}};
  worldProgressPolish.record({world:'tiny',level:1,from:0,to:2,best:true,run:'launch-test'});renderWorlds();
 },
 tutorial:async()=>{
  const {extraTutorialScene}=await import('./anim/more-tutorials.mjs');
  const {partyTutorialScene}=await import('./anim/party-tutorial.mjs');
  modeTutorialUI.close();const dialog=document.getElementById('mode-tutorial');
  dialog.innerHTML='<div class="mt-scene">'+partyTutorialScene('guess')+'</div><div class="mt-scene">'+extraTutorialScene('hsActions')+'</div><div class="mt-scene">'+extraTutorialScene('bluffVote')+'</div>';
  dialog.showModal();
 },
 survival:kind=>{
  modeTutorialUI.close();for(const d of document.querySelectorAll('dialog[open]'))d.close();
  ALL_SCREEN_ELS.forEach(e=>e.classList.remove('active'));survivalScreenEl.classList.add('active');
  survivalContentEl.innerHTML='<section class="wb-verdict"><div class="wb-result-stage sv-scene-wrap">'+svSceneHtml({saved:kind==='saved'},kind==='safe')+'</div></section>';
 },
 survivalPose:async(kind,time)=>{
  window.__launch.survival(kind);const scene=document.querySelector('.sv-scene');
  await Promise.all([...scene.querySelectorAll('img')].map(img=>img.decode()));
  scene.getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=time});
  const css=selector=>{const node=scene.querySelector(selector);return node?getComputedStyle(node):null};
  return {jaw:css('.sv-dragon-jaw')?.transform,body:css('.sv-dragon-body')?.transform,flame:Number(css('.sv-flame')?.opacity),arm:css('.sv-sword-arm')?.transform};
 },
 survivalQuestion:()=>{
  modeTutorialUI.mark('survival');modeTutorialUI.close();
  ALL_SCREEN_ELS.forEach(e=>e.classList.remove('active'));survivalScreenEl.classList.add('active');bottomToolbarEl.classList.remove('active');
  sv={runId:'ui-test',phase:'question',lives:3,shield:true,chain:0,survived:123,asked:124,bonusWins:1,accs:[{r:.98}],input:'',recent:[],q:dailyQuestionFor({unitId:'ant',targetId:'door'})};
  renderSurvival();
 }
};
`;
let html=source.replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js','/__fake/app.mjs').replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js','/__fake/db.mjs').replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js','/__fake/auth.mjs');
html=html.replace('\n</script>\n</body>',injected+extra+'\n</script>\n</body>');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
runFixture({html,modules:{'/__fake/app.mjs':'export const initializeApp=()=>({});','/__fake/db.mjs':dbStub,'/__fake/auth.mjs':authStub},check:async({width,evaluate,screenshot})=>{
 let ready=false;for(let i=0;i<300;i++){if(await evaluate('!!window.__launch&&!!window.__polish.profile()?.stats?.gamesPlayed')){ready=true;break}await wait(20)}assert(ready,'app bootstrap');
 await evaluate('window.__launch.stats()');await wait(300);
 const stats=await evaluate(`(()=>{const buttons=[...document.querySelectorAll('.stats-views button')];return buttons.map(b=>({border:getComputedStyle(b).borderImageSource,height:b.getBoundingClientRect().height,left:b.getBoundingClientRect().left,right:b.getBoundingClientRect().right,labelFits:b.scrollWidth<=b.clientWidth+1,pressed:b.getAttribute('aria-pressed')}))})()`);
 assert(stats.length>=12);assert(stats.every(b=>b.border==='none'&&b.height>=44&&b.left>=0&&b.right<=width&&b.labelFits),'readable Stats filters fit without stretched artwork');assert.equal(stats.filter(b=>b.pressed==='true').length,1);
 await evaluate("document.getElementById('ach-toast')?.remove()");await screenshot('stats-'+width+'.png');
 await evaluate('window.__launch.objects()');await wait(100);
 const collection=await evaluate(`({mysteries:document.querySelectorAll('.items-row.locked[aria-label="Undiscovered object"]').length,old:document.getElementById('items-content').textContent.includes('????'),overflow:document.documentElement.scrollWidth>innerWidth})`);
 assert(collection.mysteries>0&&!collection.old&&!collection.overflow);await screenshot('collection-'+width+'.png');
 for(const [phase,stage,paused,allowed]of [['question',null,false,true],['question',null,true,false],['animation',null,false,false],['countdown',null,false,false],['bluff','animation',false,false],['bluff','vote',false,true],['hs','dealing',false,false],['hs','reveal',false,false],['hs','bet',false,true],['summary',null,false,true],['final',null,false,true]]){
  const r=await evaluate('window.__launch.reaction('+JSON.stringify(phase)+','+JSON.stringify(stage)+','+paused+')');assert.equal(r.allowed,allowed,phase+':'+stage);assert.equal(r.disabled,!allowed);assert.equal(r.locked,!allowed);
 }
 await evaluate("window.__launch.reaction('question',null,false)");
 const bubble=await evaluate('window.__launch.reactionVisible()');assert(bubble&&bubble.left>=0&&bubble.top>=0&&bubble.bottom<=840,'missing player card gets visible fallback');
 const cooldown=await evaluate('window.__launch.cooldown()');assert(cooldown.disabled&&cooldown.cooling&&cooldown.incomingAllowed,'cooldown disables taps, not incoming reactions');
 await wait(1300);assert(await evaluate("!document.querySelector('#reaction-strip [data-emoji]')?.disabled"),'cooldown recovers');
 await evaluate('clearReactionBubbles?.()').catch(()=>{});
 await evaluate('window.__launch.world()');await wait(100);
 const world=await evaluate(`({stars:document.querySelectorAll('#wl-level-1 .world-star-land').length,next:document.getElementById('wl-level-2').classList.contains('world-level-open'),best:!!document.querySelector('#wl-level-1 .world-best-updated')})`);
 assert.equal(world.stars,2);assert(world.next&&world.best);await screenshot('world-progress-'+width+'.png');
 await evaluate('window.__launch.tutorial()');await wait(100);
 const tutorial=await evaluate(`({backs:document.querySelectorAll('.pt-key-back').length,objects:document.querySelectorAll('.pt-object-card').length,actions:document.querySelectorAll('[data-hs-action]').length,choices:document.querySelectorAll('[data-choice]').length,inputs:document.querySelectorAll('#mode-tutorial input').length})`);
 assert.deepEqual(tutorial,{backs:1,objects:2,actions:4,choices:3,inputs:0});await screenshot('tutorial-controls-'+width+'.png');
 for(const kind of ['safe','lost','saved']){
  await evaluate('window.__launch.survival('+JSON.stringify(kind)+')');await wait(850);
  const survival=await evaluate(`(()=>{const scene=document.querySelector('.sv-scene'),r=scene.getBoundingClientRect();return {overflow:document.documentElement.scrollWidth>innerWidth,rigs:scene.querySelectorAll('.sv-rig').length,jaw:!!scene.querySelector('.sv-dragon-jaw'),arm:!!scene.querySelector('.sv-sword-arm'),animation:String(scene.querySelector('.sv-sword-arm,.sv-dragon-jaw')?.getAnimations()[0]?.effect.getTiming().iterations)}})()`);
  assert(!survival.overflow&&survival.rigs===1,'Survival fits narrow phones');assert(survival.arm||survival.jaw);assert.equal(survival.animation,'Infinity','actions repeat with a quiet rest');
  await screenshot('survival-'+kind+'-'+width+'.png');
 }
 const shut=await evaluate("window.__launch.survivalPose('lost',0)"),open=await evaluate("window.__launch.survivalPose('lost',2600)"),end=await evaluate("window.__launch.survivalPose('lost',6500)");
 assert.equal(shut.flame,0);assert(open.flame>.9);assert.equal(end.flame,0);assert.notEqual(shut.jaw,open.jaw);assert.equal(shut.jaw,end.jaw);assert.equal(shut.body,'none');assert.equal(open.body,'none');
 const swordReady=await evaluate("window.__launch.survivalPose('safe',0)"),victory=await evaluate("window.__launch.survivalPose('safe',2000)");assert.notEqual(swordReady.arm,victory.arm);
 for(const [kind,active,idle] of [['safe',1800,5000],['lost',2600,6500],['saved',2600,6500]]){
  await evaluate(`window.__launch.survivalPose('${kind}',${active})`);
  const busy=await evaluate(`(()=>{const rig=document.querySelector('.sv-rig'),clock=document.querySelector('.sv-sword-arm,.sv-dragon-jaw').getAnimations()[0];rig.click();return clock.currentTime})()`);
  assert.equal(busy,active,'taps during an action neither interrupt nor queue it');
  await evaluate(`window.__launch.survivalPose('${kind}',${idle})`);
  const replay=await evaluate(`(()=>{const rig=document.querySelector('${kind==='saved'?'.sv-scene.saved .sv-knight':'.sv-rig'}'),clock=document.querySelector('.sv-sword-arm,.sv-dragon-jaw').getAnimations()[0];rig.click();const reset=clock.currentTime;clock.currentTime=1200;rig.click();return {reset,busy:clock.currentTime,fire:document.querySelector('.sv-flame')?.getAnimations()[0]?.currentTime}})()`);
  assert.equal(replay.reset,0,'tapping a resting character replays it');assert.equal(replay.busy,1200,'second tap never restarts an active replay');if(kind!=='safe')assert.equal(replay.fire,0,'fire restarts with its dragon');
 }
 await evaluate("document.documentElement.dataset.motion='reduce'");
 const reduced=await evaluate("window.__launch.survivalPose('lost',1000)");assert.equal(reduced.body,'none');assert.equal(await evaluate("document.querySelector('.sv-scene').getAnimations({subtree:true}).length"),0);
 await evaluate("document.documentElement.dataset.motion='full'");
 await evaluate('window.__launch.survivalQuestion()');await wait(150);
 const header=await evaluate(`(()=>{const h=document.querySelector('#survival-content .sv-top'),r=h.getBoundingClientRect();return {coins:document.getElementById('sv-coins').textContent,overflow:h.scrollWidth>h.clientWidth+1,children:[...h.children].every(e=>e.getBoundingClientRect().right<=r.right-35),page:document.documentElement.scrollWidth>innerWidth}})()`);
 assert.equal(header.coins,'371');assert(!header.overflow&&!header.page&&header.children,'merged four-status Survival header fits with a larger round/coin count');await screenshot('survival-header-'+width+'.png');
 console.log({pass:true,width,checks:'actual app Stats, collection, consistent reaction states/fallback, earned Worlds progress, watch-only tutorial controls and Survival rigs'});
}}).catch(e=>{console.error(e);process.exitCode=1});
