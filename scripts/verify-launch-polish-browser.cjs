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
 survival:(kind, accuracy=kind==='safe'?92.3:34.6)=>{
  modeTutorialUI.close();for(const d of document.querySelectorAll('dialog[open]'))d.close();
  ALL_SCREEN_ELS.forEach(e=>e.classList.remove('active'));survivalScreenEl.classList.add('active');
  bottomToolbarEl.classList.remove('active');
  const q=dailyQuestionFor({unitId:'ant',targetId:'door'});
  sv={runId:'sv-result-test',phase:kind==='record'?'over':'result',lives:kind==='miss'?2:3,prevShield:kind==='saved',
    lossPending:kind==='miss',shield:false,survived:21,asked:23,accs:[{r:accuracy/100}],gain:63,
    prevBest:19,newBest:kind==='record',q,g:kind==='safe'?8:3,
    res:{ok:kind==='safe',saved:kind==='saved',acc:accuracy,ans:'8.67'}};
  renderSurvival();
 },
 survivalPose:async(kind,time)=>{
  window.__launch.survival(kind);const scene=document.querySelector('.sv-battle');
  await Promise.all([...scene.querySelectorAll('img')].map(img=>img.decode()));
  survivalContentEl.querySelectorAll('.sv-battle,.sv-meter').forEach(node=>node.getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=time}));
  const css=selector=>{const node=survivalContentEl.querySelector(selector);return node?getComputedStyle(node):null};
  return {jaw:css('.sv-dragon-jaw').transform,flame:Number(css('.sv-battle-fire')?.opacity),burn:Number(css('.sv-battle-burn i')?.opacity),
    reflection:Number(css('.sv-battle-deflected-fire i')?.opacity),strike:Number(css('.sv-battle-strike-pose')?.opacity),
    ring:Number(css('.sv-meter-ring')?.opacity),fill:css('.sv-meter-fill')?.clipPath};
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
 const tutorial=await evaluate(`({backs:document.querySelectorAll('.pt-key-back').length,objects:document.querySelectorAll('.pt-object-card').length,actions:document.querySelectorAll('[data-hs-action]').length,choices:document.querySelectorAll('.xb-votes > span').length,inputs:document.querySelectorAll('#mode-tutorial input').length})`);
 assert.deepEqual(tutorial,{backs:1,objects:2,actions:4,choices:3,inputs:0});await screenshot('tutorial-controls-'+width+'.png');
 for(const [kind,time] of [['safe',1350],['miss',3000],['saved',1560],['record',1700]]){
  await evaluate(`window.__launch.survivalPose('${kind}',${time})`);
  if(kind==='record') await wait(750);
  const survival=await evaluate(`(()=>{const scene=document.querySelector('.sv-battle'),r=scene.getBoundingClientRect(),meter=document.querySelector('.sv-meter');return {fits:r.left>=0&&r.right<=innerWidth+1&&document.documentElement.scrollWidth<=innerWidth,rigs:scene.querySelectorAll('.sv-rig').length,accuracy:meter?.getAttribute('aria-valuenow')??null,answer:document.querySelector('.sv-answer strong')?.textContent??null}})()`);
  assert.deepEqual(survival,{fits:true,rigs:2,accuracy:kind==='record'?null:kind==='safe'?'92.3':'34.6',answer:kind==='record'?null:'8.67'});
  await screenshot('survival-'+kind+'-'+width+'.png');
 }
 const windup=await evaluate("window.__launch.survivalPose('miss',1100)"),fire=await evaluate("window.__launch.survivalPose('miss',2250)"),burn=await evaluate("window.__launch.survivalPose('miss',4100)");
 assert.equal(windup.flame,0);assert(fire.flame>.8&&windup.jaw!==fire.jaw);assert(burn.burn>.8&&burn.flame===0);
 const strike=await evaluate("window.__launch.survivalPose('safe',1350)");assert.equal(strike.strike,1);assert(strike.ring>.1&&strike.fill.includes('7.7%'));
 const block=await evaluate("window.__launch.survivalPose('saved',1560)");assert(block.reflection>.8);
 const rest=await evaluate(`(async()=>{await window.__launch.survivalPose('safe',1900);const battle=document.querySelector('.sv-battle'),meter=document.querySelector('.sv-meter-fill').getAnimations()[0];battle.click();const busy=battle.classList.contains('returning');battle.getAnimations({subtree:true}).forEach(a=>a.currentTime=5000);battle.click();return {busy,returns:battle.classList.contains('returning'),sameMeter:meter===document.querySelector('.sv-meter-fill').getAnimations()[0]}})()`);
 assert.deepEqual(rest,{busy:false,returns:true,sameMeter:true});
 if(width===390){
  await evaluate("window.__launch.survival('miss')");
  await wait(120);
  await evaluate(`window.survivalLoop=(()=>{
    const battle=document.querySelector('.sv-battle'),blade=battle.querySelector('.sv-battle-blade'),meter=document.querySelector('.sv-meter-fill').getAnimations()[0];
    const first=battle.getAnimations({subtree:true}).find(a=>a.animationName==='svBattleDodge');
    const state={battle,blade,meter,first,cracks:0};
    const watch=new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node.classList?.contains('sv-crack'))state.cracks++;});
    watch.observe(document.body,{childList:true});state.watch=watch;return state;
  })();true`);
  let released=false,returned=false,looped=false;
  for(let i=0;i<105;i++){
   const pose=await evaluate(`(()=>{const {battle,blade,first}=window.survivalLoop;return {released:blade.classList.contains('released'),returning:battle.classList.contains('returning'),restarted:!battle.getAnimations({subtree:true}).includes(first),held:blade.parentElement.classList.contains('sv-battle-sword-dock')}})()`);
   released ||= pose.released;
   returned ||= released&&pose.returning&&pose.held;
   if(returned&&pose.restarted){looped=true;break}
   await wait(100);
  }
  const loop=await evaluate(`(()=>{const {blade,meter,cracks,watch}=window.survivalLoop;watch.disconnect();return {cracks,blade:document.querySelector('.sv-battle-blade')===blade,meter:document.querySelector('.sv-meter-fill').getAnimations()[0]===meter}})()`);
  assert.deepEqual({released,returned,looped},{released:true,returned:true,looped:true},'one sword drops, is retrieved, and stays with the knight on the next loop');
  assert.deepEqual(loop,{cracks:1,blade:true,meter:true});
 }
 await evaluate("window.__launch.survival('miss',59.98)");
 assert.equal(await evaluate("document.querySelector('.sv-answer-accuracy').textContent"),'<60%');
 await evaluate("localStorage.setItem('mg_motion','reduce');document.documentElement.dataset.motion='reduce'");
 await evaluate("window.__launch.survivalPose('miss',1000)");
 assert.equal(await evaluate("document.querySelector('.sv-battle').getAnimations({subtree:true}).length+document.querySelector('.sv-meter').getAnimations({subtree:true}).length"),0);
 await evaluate("localStorage.setItem('mg_motion','full');document.documentElement.dataset.motion='full'");
 await evaluate('window.__launch.survivalQuestion()');await wait(150);
 const header=await evaluate(`(()=>{const h=document.querySelector('#survival-content .sv-top'),r=h.getBoundingClientRect();return {coins:document.getElementById('sv-coins').textContent,overflow:h.scrollWidth>h.clientWidth+1,children:[...h.children].every(e=>e.getBoundingClientRect().right<=r.right-35),page:document.documentElement.scrollWidth>innerWidth}})()`);
 assert.equal(header.coins,'371');assert(!header.overflow&&!header.page&&header.children,'merged four-status Survival header fits with a larger round/coin count');await screenshot('survival-header-'+width+'.png');
 console.log({pass:true,width,checks:'actual app Stats, collection, consistent reaction states/fallback, earned Worlds progress, watch-only tutorial controls and Survival rigs'});
}}).catch(e=>{console.error(e);process.exitCode=1});
