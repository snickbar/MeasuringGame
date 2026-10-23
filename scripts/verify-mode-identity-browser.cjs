const fs=require('fs'),path=require('path');let runner=fs.readFileSync(path.join(__dirname,'verify-game-polish-browser.cjs'),'utf8');
runner=runner.replace('window.__polish={',`window.__polish={
 modePage:(id,settings={})=>{roomState={settings};ALL_SCREEN_ELS.forEach(s=>s.classList.toggle('active',s.id===id));},
 dailyIntro:()=>openDaily(),
 background:async id=>{await update(ref(db,'profiles/'+deviceId),{'cosmetics/equipped/background':id,...(id==='tile-dots'?{'cosmetics/owned/backgrounds/tile-dots':true}:{})});},
 styleBackgrounds:()=>{openOverlay(collectionScreen);renderBackgroundRows(document.getElementById('cosm-backgrounds-list'));},`);
const start=runner.indexOf('let checks=String.raw`'),end=runner.indexOf('let fixture=',start);
runner=runner.slice(0,start)+"let checks=fs.readFileSync(path.join(__dirname,'mode-identity-browser-check.html'),'utf8');\n"+runner.slice(end);
runner=runner.replaceAll("'polish-tests-'","'mode-identity-tests-'");
new Function('require','__dirname',runner)(require,__dirname);
