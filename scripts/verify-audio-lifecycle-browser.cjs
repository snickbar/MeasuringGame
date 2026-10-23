const fs=require('fs'),path=require('path');let runner=fs.readFileSync(path.join(__dirname,'verify-game-polish-browser.cjs'),'utf8');
runner=runner.replace('window.__polish={',`window.__polish={
 audioProbe:()=>{playSound('drumroll');animAudioInit();animTone(440,animAudio.ctx.currentTime,2,.001);audioLifecycle.source({stop(){window.__sentinelStops=(window.__sentinelStops||0)+1;}});},
 audioNew:()=>playSound('coins'),
 audioDelayed:()=>setTimeout(()=>{window.__oldWork=(window.__oldWork||0)+1;playSound('coins');},100),
 audioVisibility:hidden=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>hidden});document.dispatchEvent(new Event('visibilitychange'));},
 audioNative:active=>window.__nativeAudioListener({isActive:active}),
 audioStatus:()=>({active:activeSfx.size,context:animAudio?.ctx.state,played:window.__played.length,paused:window.__played.filter(a=>a.paused).length,stops:window.__sentinelStops||0,work:window.__oldWork||0}),`);
const start=runner.indexOf('let checks=String.raw`'),end=runner.indexOf('let fixture=',start);
runner=runner.slice(0,start)+`let checks=String.raw\`
<pre id="polish-result" hidden></pre><script type="module">
const wait=ms=>new Promise(r=>setTimeout(r,ms)),assert=(v,m)=>{if(!v)throw Error(m)};
try{for(let i=0;i<300&&!window.__polish?.profile()?.stats?.gamesPlayed;i++)await wait(20);const api=window.__polish;
 api.world();await wait(150);api.audioProbe();assert(api.audioStatus().active>0,'Actual HTML sound starts');api.audioDelayed();api.settings();const afterNavigation=api.audioStatus().played;await wait(180);let status=api.audioStatus();assert(status.paused>0&&status.stops>0,'Navigation cancels old media and synth sources');assert(status.played===afterNavigation&&status.work===1,'Stale timeout performs UI work without playing sound');
 api.audioNew();assert(api.audioStatus().played===afterNavigation+1,'New screen can play its own effect');
 api.world();await wait(80);api.audioProbe();api.audioDelayed();api.audioVisibility(true);await wait(160);status=api.audioStatus();assert(status.active===0&&status.context==='suspended','Browser background silences HTML and Web Audio');const hiddenPlayed=status.played;api.audioNew();assert(api.audioStatus().played===hiddenPlayed,'No new hidden effects');api.audioVisibility(false);await wait(80);assert(api.audioStatus().context==='suspended','Foreground does not replay old context');api.audioNew();assert(api.audioStatus().played===hiddenPlayed+1,'Fresh foreground effects work');
 api.audioProbe();api.audioNative(false);await wait(80);assert(api.audioStatus().active===0&&api.audioStatus().context==='suspended','Native minimize also stops both sound systems');const nativePlayed=api.audioStatus().played;api.audioNew();assert(api.audioStatus().played===nativePlayed,'Native inactive blocks new sounds even if document remains visible');api.audioNative(true);api.audioNew();assert(api.audioStatus().played===nativePlayed+1,'Native foreground allows fresh effects');
 document.getElementById('polish-result').textContent=JSON.stringify({pass:true,width:innerWidth,checks:'Actual media cancellation, synth source stop, browser and native background, stale callback suppression with preserved work, foreground recovery'});
}catch(e){document.getElementById('polish-result').textContent=JSON.stringify({pass:false,error:String(e),stack:e.stack});}
</script>\`;
`+runner.slice(end);
const bootstrap=`<script>window.__played=[];window.Capacitor={Plugins:{App:{addListener(name,fn){if(name==='appStateChange')window.__nativeAudioListener=fn;}}}};window.Audio=class extends EventTarget{constructor(file){super();this.file=file;this.paused=true;}cloneNode(){return new Audio(this.file)}play(){this.paused=false;window.__played.push(this);return Promise.resolve()}pause(){this.paused=true}};</script>`;
runner=runner.replace('const server=http.createServer(',`fixture=fixture.replace('<head>','<head>'+${JSON.stringify(bootstrap)});\nconst server=http.createServer(`);
runner=runner.replaceAll("'polish-tests-'","'audio-lifecycle-tests-'");
new Function('require','__dirname',runner)(require,__dirname);
