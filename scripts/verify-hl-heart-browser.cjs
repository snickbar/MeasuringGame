const fs=require('fs'),path=require('path');let runner=fs.readFileSync(path.join(__dirname,'verify-game-polish-browser.cjs'),'utf8');
runner=runner.replace('window.__polish={',`window.__polish={
 hlDemo:async(kind='loss')=>{
  await window.__polish.lobby();document.querySelectorAll('.sv-crack').forEach(n=>n.remove());ALL_SCREEN_ELS.forEach(s=>s.classList.remove('active'));hudEl.classList.add('active');revealViewEl.classList.add('active');
  roomState.settings={mode:'teamworlds',variant:'hl',lives:3,autoAdvanceEnabled:false};roomState.phase='reveal';roomState.round=window.__hlRound=(window.__hlRound||0)+1;
  const safe=kind==='safe'||kind==='earned';
  roomState.hlLives=kind==='last'?0:safe||kind==='saved'?3:2;roomState.hlShield=kind==='earned';roomState.hlShieldCharge=kind==='safe'?2:0;roomState.hlSurvived=kind==='earned'?3:2;roomState.hlLast={passed:safe,saved:kind==='saved',earned:kind==='earned',milestone:kind==='earned'?3:0,low:50,high:75,inSync:safe,crossed:false,ratio:1.5,limit:3};roomState.hlRoles={me:'high',friend:'low'};
  roomState.revealOrder=[{playerId:'me',name:'Player',guess:75,accuracyPercent:70,role:'high'},{playerId:'friend',name:'Friend',guess:50,accuracyPercent:50,role:'low'}];roomState.revealIndex=3;twRevealSig=null;renderTeamWorldsReveal(roomState);
 },
 hlRefresh:()=>{twRevealSig=null;renderTeamWorldsReveal({...roomState});},
 hlHeartScreenshot:async()=>{await window.__polish.hlDemo();await new Promise(r=>setTimeout(r,1450));document.querySelectorAll('.sv-crack,.sv-crack *').forEach(n=>n.getAnimations().forEach(a=>a.pause()));},`);
const start=runner.indexOf('let checks=String.raw`'),end=runner.indexOf('let fixture=',start);
runner=runner.slice(0,start)+`let checks=String.raw\`
<pre id="polish-result" hidden></pre><script type="module">
const wait=ms=>new Promise(r=>setTimeout(r,ms)),assert=(v,m)=>{if(!v)throw Error(m)};
try{for(let i=0;i<300&&!window.__polish?.profile()?.stats?.gamesPlayed;i++)await wait(20);const api=window.__polish;let hearts=0;new MutationObserver(rs=>{for(const r of rs)for(const n of r.addedNodes)if(n.matches?.('.sv-crack'))hearts++;}).observe(document.body,{childList:true});
 await api.hlDemo();await wait(1200);let heart=document.querySelector('.sv-crack');assert(heart,'High/Low loss shows the breaking heart');assert(hearts===1,'Exactly one effect');for(const img of heart.querySelectorAll('img')){await img.decode();assert(img.naturalWidth>0,'Heart artwork loads');}assert(heart.querySelectorAll('img').length===4,'Whole, cracked and both halves present');assert(!document.querySelector('.hl-verdict').parentElement.classList.contains('tw-ph'),'Loss verdict revealed with heart');api.hlRefresh();await wait(1200);assert(hearts===1,'Room refresh does not replay effect');
 await api.hlDemo('safe');await wait(1200);assert(!document.querySelector('.sv-crack')&&hearts===1,'Successful bracket never breaks a heart');
 await api.hlDemo('last');await wait(1200);assert(document.querySelector('.sv-crack')&&hearts===2,'Final life also breaks');api.settings();await wait(60);assert(!document.querySelector('.sv-crack'),'Existing effect clears when leaving screen');
 await api.hlDemo();api.settings();await wait(1200);assert(!document.querySelector('.sv-crack')&&hearts===2,'Navigating away prevents delayed heart');
 await api.hlDemo('saved');await wait(1200);assert(document.querySelector('.sv-crack.shield'),'Save breaks shield artwork');assert(document.querySelector('.hl-verdict-title').textContent==='Shield saved you!','Save explained');assert(document.querySelectorAll('.hl-verdict .sv-heart[src*="full"]').length===3,'Save retains all hearts');for(const img of document.querySelectorAll('.sv-crack img')){await img.decode();assert(img.src.includes('survival-shield-'),'Save uses only shield art');}api.hlRefresh();await wait(1200);assert(hearts===3,'Save refresh does not repeat');
 await api.hlDemo('earned');await wait(1200);assert(document.querySelector('.hl-shield').textContent.includes('Shield ready'),'Held shield indicator');assert(document.querySelector('.hl-milestone').textContent.includes('shield earned'),'Earned shield notice');assert(!document.querySelector('.sv-crack'),'Earning shield does not break a heart');assert(!document.querySelector('.sv-scene'),'No knight or dragon');assert(document.documentElement.scrollWidth<=innerWidth+1,'Phone has no horizontal overflow');
 document.getElementById('polish-result').textContent=JSON.stringify({pass:true,width:innerWidth,checks:'Heart and shield saves, ready indicator, charge meter, once-only refresh, milestones and navigation cancellation'});
}catch(e){document.getElementById('polish-result').textContent=JSON.stringify({pass:false,error:String(e),stack:e.stack});}
</script>\`;
`+runner.slice(end);
runner=runner.replaceAll("'polish-tests-'","'hl-heart-tests-'").replace("['stats','world','survival','lobby','quickLobby','objects']","['hlHeartScreenshot']");
new Function('require','__dirname',runner)(require,__dirname);
