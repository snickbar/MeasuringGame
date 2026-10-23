const fs=require('fs'),path=require('path');let runner=fs.readFileSync(path.join(__dirname,'verify-game-polish-browser.cjs'),'utf8');
runner=runner.replace('window.__polish={',`window.__polish={
 defaultAvatarIds:()=>Object.keys(defaultUnlockedAvatars()),
 addDiscoveries:async count=>{const ids=[...OBJECT_BY_ID.keys()].filter(id=>!myProfile.seenObjects[id]).slice(0,count);for(const [i,id]of ids.entries())careerLedger.save({kind:'round',key:window.__discoverySession+'_extra_'+id,mode:'quick',history:{u:id,g:'ant',r:1,rawR:1,t:Date.now()+i,match:window.__discoverySession}});await careerLedger.flush();discoveryUI.refresh();},
 discoveryPopupDemo:async()=>{await window.__polish.discoveryDemo();await new Promise(r=>setTimeout(r,30));document.querySelector('[data-view-discoveries]').click();},
 discoveryDemo:async()=>{await window.__polish.lobby(true);window.__discoverySession=gameRewardKey(currentRoomCode,roomState);await window.__polish.repeatDiscovery();discoveryUI.refresh();},
 repeatDiscovery:async()=>{careerLedger.save({kind:'round',key:window.__discoverySession+'_round_99',mode:'quick',history:{u:'acorn',g:'airliner',r:1,rawR:1,t:Date.now(),match:window.__discoverySession}});await careerLedger.flush();},`);
const start=runner.indexOf('let checks=String.raw`'),end=runner.indexOf('let fixture=',start);
runner=runner.slice(0,start)+"let checks=fs.readFileSync(path.join(__dirname,'discoveries-browser-check.html'),'utf8');\n"+runner.slice(end);
runner=runner.replaceAll("'polish-tests-'","'discovery-tests-'");
runner=runner.replace("['stats','world','survival','lobby','quickLobby','objects']","['discoveryPopupDemo']");
new Function('require','__dirname',runner)(require,__dirname);
