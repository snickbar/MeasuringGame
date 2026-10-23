// Exercise the actual app adapter against the isolated in-memory room database.
const fs=require('fs'),path=require('path');let runner=fs.readFileSync(path.join(__dirname,'verify-game-polish-browser.cjs'),'utf8');
runner=runner.replace('window.__polish={',`window.__polish={
 reactionDemo:async()=>{
  await window.__polish.quickLobby();roomState.phase='question';roomState.round=1;
  ALL_SCREEN_ELS.forEach(s=>s.classList.remove('active'));hudEl.classList.add('active');botReactions.reset();
  try {for(let i=0;i<100;i++){serverTimeOffsetMs+=1000;botReactions.tick();await Promise.resolve();}
   return (await get(ref(db,'rooms/TEST/reactions'))).val();
  } finally {serverTimeOffsetMs=0;roomState.phase='waiting';botReactions.reset();}
 },`);
const start=runner.indexOf('let checks=String.raw`'),end=runner.indexOf('let fixture=',start);
runner=runner.slice(0,start)+`let checks=String.raw\`
<pre id="polish-result" hidden></pre><script type="module">
const wait=ms=>new Promise(r=>setTimeout(r,ms)),assert=(v,m)=>{if(!v)throw Error(m)};
try{for(let i=0;i<300&&!window.__polish?.profile()?.stats?.gamesPlayed;i++)await wait(20);
 const events=Object.values(await window.__polish.reactionDemo()).sort((a,b)=>a.sentAt-b.sentAt);
 assert(events.length>=6,'Actual bots repeat reactions');assert(events.every(e=>e.playerId.startsWith('bot')&&e.rid&&e.name&&e.avatar),'Real database payload includes artwork and player identity');
 for(let i=1;i<events.length;i++)assert(events[i].sentAt-events[i-1].sentAt>=1800,'App reactions do not pile up');
 document.getElementById('polish-result').textContent=JSON.stringify({pass:true,width:innerWidth,reactions:events.length,checks:'Actual app startup, independent bot scheduler, repeated database events, staggered times and valid own-art payloads'});
}catch(e){document.getElementById('polish-result').textContent=JSON.stringify({pass:false,error:String(e),stack:e.stack});}
</script>\`;
`+runner.slice(end);
runner=runner.replaceAll("'polish-tests-'","'bot-reaction-tests-'");
new Function('require','__dirname',runner)(require,__dirname);
