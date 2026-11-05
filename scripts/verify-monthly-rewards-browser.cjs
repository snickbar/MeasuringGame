const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),{runFixture}=require('./browser-fixture.cjs');
const source=fs.readFileSync('index.html','utf8').replace(/\r\n/g,'\n'),fixture=fs.readFileSync('scripts/verify-game-polish-browser.cjs','utf8'),context={};
vm.runInNewContext(fixture.slice(fixture.indexOf('const dbStub='),fixture.indexOf('let checks='))+';globalThis.parts={dbStub,authStub};',context);
const api=String.raw`window.__monthly={ready:()=>!!myProfile.stats?.gamesPlayed,
 check:()=>({monthlyPool:gachaPool('board').filter(id=>id.startsWith('mb')),flair:cosmCatItems('flairs').some(i=>i.id==='mf11')}),
 repair:async()=>{const p={...myProfile,monthly:{format:MONTHLY_FORMAT,key:'2026-11',levels:{1:{done:true},2:{done:true},3:{done:true},4:{done:true}}},cosmetics:{...myProfile.cosmetics,owned:{...myProfile.cosmetics.owned,boards:{mb11:true},monthly:{mf11:true}}}};__fakeDB.put('profiles/'+deviceId,p);applyProfileData(deviceId,p);await new Promise(r=>setTimeout(r,150));return {saved:__fakeDB.read('profiles/'+deviceId).stats.mc11L4,usable:ownsBoard('mb11'),earned:monthlyRewardEarned(11,3)}},
 equip:async()=>{modeTutorialUI.close();openGachaScreen('boards');setCosmSub('flairs');renderCosmeticsShop();const row=[...document.querySelectorAll('#cosm-flairs-list .mr-sec .cosm-row')].find(r=>r.textContent.includes('Cornucopia spill'));row.querySelector('.cosm-equip').click();await new Promise(r=>setTimeout(r,100));return __fakeDB.read('profiles/'+deviceId).randomPool},
 board:(id,text)=>{modeTutorialUI.close();let wrap=document.getElementById('monthly-test');if(!wrap){wrap=document.createElement('div');wrap.id='monthly-test';wrap.style.cssText='position:fixed;left:8px;top:110px;width:calc(100vw - 16px);height:240px;z-index:99999';document.body.appendChild(wrap);wrap.appendChild(qPromptEl)}hudEl.dataset.playLayout='party';qClearing=false;setPromptText('',false);applyBoard(id);qPromptEl.style.display='block';questionAnswerLineEl.style.display='none';setPromptText(text,true)},
 probe:()=>({holding:qPromptEl.hasAttribute('data-hold'),left:sbHoldLeft(),animated:qSB?.animated,text:questionPromptTextEl.textContent,host:!!qSB?.mmHost}),
 delay:()=>{window.__origReady=MM.ready;MM.ready=()=>new Promise((resolve,reject)=>{window.__release=resolve;window.__reject=reject})},
 restore:()=>{MM.ready=window.__origReady},
 rx:()=>{clearReactionBubbles();renderReactionBubble({playerId:'monthly-test',emoji:'m11',previewAt:{x:100,y:100}})},
 rxProbe:()=>{const el=document.querySelector('.rx-stage');return el?{poster:!!el.querySelector('img[src="monthly/art/poster-r11.webp"]'),state:el.getAnimations()[0]?.playState,time:el.getAnimations()[0]?.currentTime}:null},
 stop:()=>sbTeardown()
};`;
const html=source.replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js','/__fake/app.mjs').replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js','/__fake/db.mjs').replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js','/__fake/auth.mjs').replace('\n</script>\n</body>',api+'\n</script>\n</body>');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
runFixture({html,modules:{'/__fake/app.mjs':'export const initializeApp=()=>({});','/__fake/db.mjs':context.parts.dbStub,'/__fake/auth.mjs':context.parts.authStub},widths:[320,390,430],out:'output/monthly-regression',check:async({width,evaluate,screenshot})=>{
 for(let i=0;i<500&&!await evaluate('window.__monthly?.ready()');i++)await sleep(20);
 assert.deepEqual(await evaluate('__monthly.repair()'),{saved:1,usable:true,earned:true});
 assert.deepEqual(await evaluate('__monthly.check()'),{monthlyPool:[],flair:true});
 const pool=await evaluate('__monthly.equip()'); assert.equal(pool.flairs.mf11,true);assert.equal(pool.boards?.mf11,undefined);
 await evaluate('MM.ready()');
 const text="How many Valentine's cards long is the height of the Statue of Liberty including its pedestal?";
 for(const month of [7,9]){
  await evaluate(`__monthly.board('mb0${month}',${JSON.stringify(text)})`);await sleep(30);
  assert((await evaluate('__monthly.probe()')).holding);
  const timing=await evaluate(`MM.boardSettle(${month},${text.replace(/\s/g,'').length})`);assert(timing<7600);
  await screenshot('board-'+month+'-'+width+'.png');
 }
 await evaluate(`__monthly.delay();__monthly.board('mb10',${JSON.stringify(text)})`);await sleep(2600);
 assert.deepEqual(await evaluate('({hold:__monthly.probe().holding,left:__monthly.probe().left})'),{hold:true,left:100});
 await evaluate('__release()');assert((await evaluate('__monthly.probe()')).left>1000,'hold starts after load');
 await evaluate('__monthly.restore();__monthly.delay();__monthly.board("mb07","Readable question after failure?");__reject(Error("offline"))');await sleep(50);
 const fallback=await evaluate('__monthly.probe()');assert.equal(fallback.holding,false);assert.equal(fallback.animated,false);assert.equal(fallback.text,'Readable question after failure?');
 await evaluate('__monthly.restore();__monthly.delay();__monthly.board("mb09","Readable question after timeout?")');await sleep(4150);
 assert.equal((await evaluate('__monthly.probe()')).animated,false);await evaluate('__release()');assert.equal((await evaluate('__monthly.probe()')).host,false,'late load cannot replace fallback');
 await evaluate('__monthly.restore();__monthly.delay();__monthly.board("mb10","Leaving?");__monthly.stop();__release()');assert.equal((await evaluate('__monthly.probe()')).holding,false);
 await evaluate('__monthly.restore();__monthly.delay();__monthly.rx()');await sleep(300);
 const loading=await evaluate('__monthly.rxProbe()');assert.equal(loading.poster,true);assert.equal(loading.state,'paused');
 await evaluate('__release()');await sleep(40);const playing=await evaluate('__monthly.rxProbe()');assert.equal(playing.poster,false);assert.equal(playing.state,'running');assert(playing.time<250);
 await evaluate('__monthly.restore();__monthly.delay();__monthly.rx();__reject(Error("offline"))');await sleep(40);
 const staticRx=await evaluate('__monthly.rxProbe()');assert.equal(staticRx.poster,true);assert.equal(staticRx.state,'running');
 await evaluate('__monthly.restore()');console.log({pass:true,width,ownership:true,longQuestions:true,delayedLoad:true,fallback:true,reactionTiming:true});
}}).catch(e=>{console.error(e);process.exitCode=1});
