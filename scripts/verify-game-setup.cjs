// Isolated real-markup/real-handler checks: Firebase calls are in-memory stubs.
const fs=require('fs'),path=require('path'),http=require('http'),os=require('os'),{spawn}=require('child_process');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'index.html'),'utf8');
function fn(name){const start=source.indexOf('  function '+name+'(');if(start<0)throw Error(name);return source.slice(start,source.indexOf('\n  }',start)+4)}
const css=[...source.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(m=>m[1]).join('\n');
const toolbar=source.slice(source.indexOf('<div id="app-toolbar">'),source.indexOf('<div id="toolbar-menu"'));
const screens=source.slice(source.indexOf('<div id="create-screen"'),source.indexOf('<div id="join-screen"'));
const joinScreens=source.slice(source.indexOf('<div id="join-screen"'),source.indexOf('<div id="lobby-screen"'));
const names={settingTimerInput:'setting-timer',settingRoundsInput:'setting-rounds',settingItemAnythingInput:'setting-item-anything',settingItemRelativeInput:'setting-item-relative',settingAutoAdvanceAutoInput:'setting-auto-advance-auto',settingAutoAdvanceManualInput:'setting-auto-advance-manual',settingAutoAdvanceSecondsInput:'setting-auto-advance-seconds',presetSettingTimerInput:'preset-setting-timer',presetSettingRoundsInput:'preset-setting-rounds',presetSettingItemAnythingInput:'preset-setting-item-anything',presetSettingItemRelativeInput:'preset-setting-item-relative',presetSettingAutoAdvanceAutoInput:'preset-setting-auto-advance-auto',presetSettingAutoAdvanceManualInput:'preset-setting-auto-advance-manual',presetSettingAutoAdvanceSecondsInput:'preset-setting-auto-advance-seconds',hostModeControlsEl:'host-mode-controls',presetHostModeControlsEl:'preset-host-mode-controls',createRoomBtn:'create-room-btn',createStatusEl:'create-status',createScreenEl:'create-screen',homeScreen:'home-screen',createPresetRowEl:'create-preset-row',presetEditSlotRowEl:'preset-edit-slot-row',presetSaveTitleEl:'preset-save-title',presetSaveNameInput:'preset-save-name-input',presetSaveOverlayEl:'preset-save-overlay',presetSaveCancelBtn:'preset-save-cancel-btn',presetSaveConfirmBtn:'preset-save-confirm-btn'};
const declarations=Object.entries(names).map(([k,v])=>'const '+k+'=document.getElementById('+JSON.stringify(v)+');').join('\n');
const local=source.slice(source.indexOf('  function renderLocalSettingsPanel()'),source.indexOf('  editPresetSettingsBtn.addEventListener'));
const presets=source.slice(source.indexOf('  function renderPresetSlotButtons()'),source.indexOf('  function armHostReclaimMarker('));
const host=source.slice(source.indexOf('  hostModeControlsEl.addEventListener'),source.indexOf('  createRoomBtn.addEventListener'));
const fixture=`<!doctype html><html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="/"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap"><style>${css}</style><link rel="stylesheet" href="anim/game-setup.css"><link rel="stylesheet" href="anim/cozy-system.css"><link rel="stylesheet" href="anim/fonts/fredoka.css"><body>${toolbar}<div id="home-screen"></div>${screens}${joinScreens}<div id="solo-screen" class="screen"><button id="solo-close-btn" class="screen-back-btn" aria-label="Back"><img src="icons/back-btn.png" alt=""></button><div id="solo-content"></div></div><pre id="result" hidden></pre><script>
${declarations}
${fn('DEFAULT_SETTINGS')}
let currentSettings=DEFAULT_SETTINGS(),createMode='party',hostTransferModeChoice='reassign';
const db={},deviceId='fixture',writes=[];const myProfile={presets:{1:{name:'Quick',settings:{timerSeconds:45,totalRounds:8,itemSelectionMode:'relative',autoAdvanceEnabled:true,autoAdvanceSeconds:7,hostTransferMode:'reclaim'}}}};
const playSound=()=>{},ref=(_,path)=>path,set=async(path,value)=>{writes.push({path,value});myProfile.presets[path.split('/').at(-1)]=value};
${local}
${presets}
${host}
${fn('showCreateScreen')}
const soloContentEl=document.getElementById('solo-content'),dailyPlayedToday=()=>false,dailyStreakNow=()=>0,monthlyIcon=()=>"icons/toolbar-daily.png",monthlySub=()=>"October",monthlyPlayed=()=>false,worldTotalStars=()=>7,WORLDS=Array(11),WORLD_LEVELS=5,survivalSub=()=>"Your best: 4 rounds";
const nextWorldGoalHtml=()=>'';
${fn('renderSoloHub')}
function show(mode){document.querySelectorAll('.screen').forEach(el=>el.classList.remove('active'));if(mode==='join'||mode==='name-avatar'){document.getElementById(mode+'-screen').classList.add('active')}else if(mode==='solo-hub'){document.getElementById('solo-screen').classList.add('active');renderSoloHub()}else if(mode==='preset'){document.getElementById('preset-settings-screen').classList.add('active');renderPresetEditPanel()}else showCreateScreen(mode==='quick'?'solo':'party');renderPresetSlotButtons();window.scrollTo(0,0)}
const $=id=>document.getElementById(id),assert=(v,m)=>{if(!v)throw Error(m)};
window.fixture={show};
(async()=>{try{
show('quick');assert($('create-room-btn').textContent==='Create Game','Quick Game action');assert(!document.querySelector('#create-screen h1'),'No redundant setup heading');assert($('host-settings-card').hidden,'quick hides host settings');
$('setting-timer').value=90;$('setting-timer').dispatchEvent(new Event('change'));document.querySelector('[data-for=setting-timer].plus').click();assert(currentSettings.timerSeconds===90,'timer upper limit');
$('setting-timer').value=10;$('setting-timer').dispatchEvent(new Event('change'));document.querySelector('[data-for=setting-timer].minus').click();assert(currentSettings.timerSeconds===10,'timer lower limit');
$('setting-auto-advance-manual').click();assert($('setting-auto-advance-seconds').disabled,'manual disables delay');$('setting-auto-advance-auto').click();assert(!$('setting-auto-advance-seconds').disabled,'auto enables delay');
$('setting-item-relative').click();assert(currentSettings.itemSelectionMode==='relative'&&$('create-settings-summary').textContent.includes('Keep it relative'),'live summary');
show('host');assert($('create-room-btn').textContent==='Create Room'&&!$('host-settings-card').hidden,'host setup');$('host-settings-card').open=true;document.querySelector('#host-mode-controls [data-mode=reclaim]').click();assert(hostTransferModeChoice==='reclaim','host option');
$('create-preset-row').querySelector('[data-slot="1"]').click();assert(currentSettings.timerSeconds===45&&currentSettings.totalRounds===8,'create loads saved preset');assert($('create-preset-row').querySelector('[data-slot="2"]').disabled,'empty preset disabled');
show('preset');document.querySelector('.preset-slot-action-btn[data-slot="1"][data-action=load]').click();assert(presetEditSettings.timerSeconds===45&&presetEditSettings.totalRounds===8,'editor loads settings');document.querySelector('[data-for=preset-setting-rounds].plus').click();assert(presetEditSettings.totalRounds===9,'preset stepper');
document.querySelector('.preset-slot-action-btn[data-slot="2"][data-action=save]').click();$('preset-save-name-input').value='My party';$('preset-save-confirm-btn').click();await Promise.resolve();assert(writes.length===1&&writes[0].path.endsWith('/presets/2')&&writes[0].value.settings.totalRounds===9&&writes[0].value.name==='My party','preset saves real settings via stub');
for(const mode of ['quick','host','preset','solo-hub','join','name-avatar']){show(mode);assert(document.documentElement.scrollWidth<=innerWidth,'no page overflow '+mode);const screen=document.querySelector('.screen.active');assert(!screen.textContent.includes('3 Medium bots'),'no bot count section');for(const selected of screen.querySelectorAll('.itemmode-btn.selected'))assert(getComputedStyle(selected).borderImageSource==='none','cozy selections have no old red artwork');for(const control of screen.querySelectorAll('.stepper-btn,.itemmode-btn')){const r=control.getBoundingClientRect();assert(control.offsetWidth>=35&&control.offsetHeight>=37,'touch control size '+(control.id||control.dataset.for)+' '+r.width+'x'+r.height);assert(r.right<=innerWidth+1&&r.left>=0,'controls fit '+mode)}const imageError=[...screen.querySelectorAll('img')].filter(im=>im.complete&&!im.naturalWidth);assert(!imageError.length,'artwork loads')}
for(const mode of ['host','solo-hub']){show(mode);const heading=mode==='host'?$('create-room-btn'):document.querySelector('.screen.active .mode-heading-banner'),style=getComputedStyle(heading),box=heading.getBoundingClientRect(),back=document.querySelector('.screen.active .screen-back-btn').getBoundingClientRect();assert(style.backgroundImage.includes(mode==='host'?'btn-create-room.png':'banner-solo.png'),'proper illustrated heading '+mode);assert(heading.offsetHeight>=44&&heading.scrollWidth<=heading.clientWidth+1,'heading text fits '+mode+' '+heading.offsetHeight+' '+heading.scrollWidth+'/'+heading.clientWidth);assert(!back.width||box.right<=back.left+2,'heading leaves room for Back '+mode+' '+JSON.stringify({heading:box.toJSON(),back:back.toJSON(),display:getComputedStyle(document.querySelector('.screen.active .screen-back-btn')).display}));const image=new Image();image.src=style.backgroundImage.slice(5,-2);await image.decode();assert(image.naturalWidth>800,'banner artwork loads '+mode);}for(const mode of ['quick','host']){show(mode);const action=$('create-room-btn').getBoundingClientRect(),presets=document.querySelector('#create-screen>.preset-box').getBoundingClientRect(),back=$('create-back-btn').getBoundingClientRect();assert(action.bottom<=presets.top,'Create action above presets '+mode);assert(action.height>=44&&$('create-room-btn').scrollWidth<=$('create-room-btn').clientWidth+1,'Create action fits '+mode);assert(!back.width||(action.right<=back.left&&Math.abs(action.top-back.top)<3),'Create Game shares top row with Back');assert(!document.querySelector('#create-screen .cozy-setup-footer'),'No bottom Create action');}show('quick');assert(getComputedStyle($('create-room-btn')).backgroundImage.includes('btn-submit.png'),'Quick Game keeps its action artwork');
show('host');assert(getComputedStyle($('create-back-btn')).display==='none','first Host Party page has no Back');show('quick');assert(getComputedStyle($('create-back-btn')).display!=='none','Quick Game keeps its return to Solo');show('join');assert(getComputedStyle($('join-back-btn')).display==='none','first Join Game page has no Back');assert(getComputedStyle(document.querySelector('#join-screen .setup-header')).paddingRight==='0px','Join banner uses freed space');show('name-avatar');assert(getComputedStyle($('name-avatar-back-btn')).display!=='none','subsequent name/avatar page keeps Back');
show('quick');await Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,2500))]);window.setupReady=true;$('result').textContent=JSON.stringify({pass:true,width:innerWidth,checks:'real setup handlers, timer limits, auto/manual delay, host settings, preset load/save, touch targets, responsive layout, no bot count'});
}catch(e){$('result').textContent=JSON.stringify({pass:false,error:e.stack})}})();
</script></body></html>`;
const server=http.createServer((req,res)=>{
 if(req.url==='/test'){res.setHeader('Content-Type','text/html');res.end(fixture);return}
 const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 try{res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.mjs':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}catch{res.writeHead(404);res.end()}
});
server.listen(0,'127.0.0.1',()=>{
 const child=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--remote-debugging-port=0','--user-data-dir='+path.join(os.tmpdir(),'game-setup-tests-'+process.pid),'about:blank'],{windowsHide:true});
 let stderr='',started=false,socket;const timer=setTimeout(()=>{child.kill();server.close();process.exitCode=1},60000);
 child.stderr.on('data',async chunk=>{
  stderr+=chunk;const match=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(started||!match)return;started=true;
  try{
   socket=new WebSocket(match[1]);await new Promise((yes,no)=>{socket.onopen=yes;socket.onerror=no});
   let serial=0;const pending=new Map();socket.onmessage=e=>{const r=JSON.parse(e.data),p=pending.get(r.id);if(!p)return;pending.delete(r.id);r.error?p.no(Error(r.error.message)):p.yes(r.result)};
   const call=(method,params={},sessionId)=>new Promise((yes,no)=>{const id=++serial;pending.set(id,{yes,no});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}))});
   fs.mkdirSync(path.join(root,'output','game-setup-tests'),{recursive:true});
   for(const width of [320,390,430]){
    const {targetId}=await call('Target.createTarget',{url:'about:blank'}),{sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});
    await call('Emulation.setDeviceMetricsOverride',{width,height:width===320?600:740,deviceScaleFactor:1,mobile:true},sessionId);
    await call('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/test'},sessionId);
    let result;
    for(let n=0;n<500;n++){
     const value=await call('Runtime.evaluate',{expression:'document.getElementById("result")?.textContent',returnByValue:true},sessionId);
     if(value.result?.value){result=JSON.parse(value.result.value);break}await new Promise(r=>setTimeout(r,20));
    }
    if(!result)throw Error('No browser result at '+width);
    console.log(result);if(!result.pass)throw Error(result.error);
    for(const mode of ['quick','host','preset','solo-hub','join','name-avatar']){
     await call('Runtime.evaluate',{expression:'window.fixture.show('+JSON.stringify(mode)+')'},sessionId);
     await new Promise(r=>setTimeout(r,200));
     const shot=await call('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(path.join(root,'output','game-setup-tests',mode+'-'+width+'.png'),Buffer.from(shot.data,'base64'));
    }
    await call('Target.closeTarget',{targetId});
   }
  }catch(e){console.error(e);process.exitCode=1}finally{clearTimeout(timer);socket?.close();child.kill();server.close()}
 });
});



