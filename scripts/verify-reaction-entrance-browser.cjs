const fs=require('fs'),path=require('path');let runner=fs.readFileSync(path.join(__dirname,'verify-game-polish-browser.cjs'),'utf8');
runner=runner.replace('window.__polish={',`window.__polish={
 reactionPose:async(side=null)=>{
  await window.__polish.lobby();ALL_SCREEN_ELS.forEach(s=>s.classList.remove('active'));roomState.phase=side?'hs':'question';
  if(side){hsScreenEl.classList.add('active');hsContentEl.innerHTML='<div data-hs-pl="friend" data-hs-side="'+side+'" style="position:fixed;left:'+(side==='l'?20:innerWidth-100)+'px;top:200px;width:80px;height:100px;background:#fff8dc;border:3px solid brown;border-radius:12px">Player</div>';}else{hudEl.classList.add('active');renderScoreColumn();}
  clearReactionBubbles();renderReactionBubble({playerId:'friend',name:'Friend',emoji:Object.keys(REACTIONS)[0]});
  const stage=document.querySelector('.rx-stage');const animations=stage.getAnimations();
  const entrance=animations.find(a=>a.effect.getTiming().duration===380),life=animations.find(a=>a.effect.getTiming().duration===2000);
  for(const a of document.getAnimations())if(a.effect?.target?.closest?.('.rx-stage')){a.pause();a.currentTime=180;}
  return {entrance:entrance?.effect.getKeyframes(),life:life?.effect.getKeyframes(),pivotAnimations:stage.querySelector('.rx-piv').getAnimations().length};
 },`);
const start=runner.indexOf('let checks=String.raw`'),end=runner.indexOf('let fixture=',start);
runner=runner.slice(0,start)+`let checks=String.raw\`
<pre id="polish-result" hidden></pre><script type="module">
const wait=ms=>new Promise(r=>setTimeout(r,ms)),assert=(v,m)=>{if(!v)throw Error(m)};
try{for(let i=0;i<300&&!window.__polish?.profile()?.stats?.gamesPlayed;i++)await wait(20);const api=window.__polish;
 for(const side of [null,'l','r']){const pose=await api.reactionPose(side);assert(pose.entrance?.length===2,'Separate entrance exists');assert((side==='l'?-1:1)*parseFloat(pose.entrance[0].translate)>0,'Slides away from correct card edge');assert(Number(pose.entrance[0].opacity)<1,'Still fades in');assert(pose.life[1].offset===.62&&Number(pose.life[2].opacity)===0,'Original hold and fade-out retained');assert(pose.pivotAnimations>0,'Existing reaction body animation retained');}
 assert(document.documentElement.scrollWidth<=innerWidth+1,'Phone fits');
 document.getElementById('polish-result').textContent=JSON.stringify({pass:true,width:innerWidth,checks:'Actual normal and both High Stakes senders, independent entrance slide/fade, original reaction body and unchanged exit'});
}catch(e){document.getElementById('polish-result').textContent=JSON.stringify({pass:false,error:String(e),stack:e.stack});}
</script>\`;
`+runner.slice(end);
runner=runner.replaceAll("'polish-tests-'","'reaction-entrance-tests-'");
runner=runner.replace("['stats','world','survival','lobby','quickLobby','objects']","['reactionPose']");
new Function('require','__dirname',runner)(require,__dirname);
