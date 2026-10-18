// Test the real Settings markup, keyboard and name screening without player data.
const fs=require('fs'),path=require('path'),http=require('http'),os=require('os'),{spawn}=require('child_process');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'index.html'),'utf8');
function fn(name){const i=source.indexOf('  function '+name+'(');return source.slice(i,source.indexOf('\n  }',i)+4)}
const css=[...source.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(m=>m[1]).join('\n');
const toolbar=source.slice(source.indexOf('<div id="app-toolbar">'),source.indexOf('<div id="toolbar-menu"'));
let page=source.slice(source.indexOf('<div id="settings-screen"'),source.indexOf('<div id="howto-screen"')).replace('id="settings-screen" class="screen"','id="settings-screen" class="screen active"');
page=page.replace('aria-expanded="false"></button>','aria-expanded="false"><img src="avatars/av99.png" alt=""></button>');
const screening=source.slice(source.indexOf('  const _rot ='),source.indexOf('  // For showing names that arrived'));
const fixture=`<!doctype html><html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="/"><link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap" rel="stylesheet"><style>${css}</style><link rel="stylesheet" href="anim/settings-page.css"><link rel="stylesheet" href="anim/cozy-system.css"><link rel="stylesheet" href="anim/fonts/fredoka.css"><body>${toolbar}${page}<pre id="result" hidden></pre><script type="module">
import {mountSettingsNameEditor} from './anim/settings-name-editor.mjs';
${fn('renderCustomKeyboard')}
${screening}
const $=id=>document.getElementById(id),assert=(v,m)=>{if(!v)throw Error(m)},input=$('settings-name-input'),screen=$('settings-screen'),button=$('settings-name-edit'),panel=$('settings-name-editor'),keyboard=$('settings-name-keyboard');let name='Player',writes=[];
mountSettingsNameEditor({screen,input,button,panel,keyboard,status:$('settings-name-status'),clear:$('settings-name-clear'),cancel:$('settings-name-cancel'),getName:()=>name,saveName:n=>{name=n;writes.push(n)},validateName:checkName,renderKeyboard:renderCustomKeyboard});
const key=c=>keyboard.querySelector('[data-key="'+c+'"]').click(),type=text=>{for(const c of text)key(c)};
(async()=>{try{
assert(input.readOnly&&input.inputMode==='none'&&panel.hidden,'starts readonly and collapsed');button.click();assert(!panel.hidden&&button.textContent==='Save','edit opens');
const hardware=new KeyboardEvent('keydown',{key:'X',cancelable:true});input.dispatchEvent(hardware);assert(hardware.defaultPrevented,'hardware typing prevented');for(const kind of ['paste','drop','beforeinput']){const e=new Event(kind,{cancelable:true});input.dispatchEvent(e);assert(e.defaultPrevented,kind+' prevented')}
$('settings-name-clear').click();type('ALICE');assert(input.value==='ALICE'&&name==='Player'&&writes.length===0,'draft never auto saves');button.click();assert(name==='ALICE'&&panel.hidden&&writes.length===1,'save commits once and collapses');
button.click();$('settings-name-clear').click();button.click();assert(!panel.hidden&&writes.length===1&&$('settings-name-status').textContent,'empty name stays open');type('SHIT');button.click();assert(!panel.hidden&&name==='ALICE'&&$('settings-name-status').textContent.includes('allowed'),'screening preserved');
$('settings-name-clear').click();type('NEW');$('settings-name-cancel').click();assert(panel.hidden&&input.value==='ALICE'&&writes.length===1,'cancel restores saved name');
button.click();$('settings-name-clear').click();type('BOB');keyboard.querySelector('.kbd-key-space').click();type('J');keyboard.querySelector('[data-action=done]').click();assert(name==='BOB J'&&panel.hidden&&writes.length===2,'keyboard save and space work');
button.click();$('settings-name-clear').click();type('ABCDEFGHIJKL');key('M');assert(input.value==='ABCDEFGHIJKL','12 character cap');keyboard.querySelector('[data-action=backspace]').click();assert(input.value==='ABCDEFGHIJK','backspace');
screen.classList.remove('active');await Promise.resolve();screen.classList.add('active');assert(panel.hidden&&input.value==='BOB J'&&writes.length===2,'leaving discards draft');
button.click();for(const el of keyboard.querySelectorAll('button')){const r=el.getBoundingClientRect();assert(r.left>=0&&r.right<=innerWidth+1,'keyboard fits');}assert(document.documentElement.scrollWidth<=innerWidth,'no horizontal overflow');$('settings-name-cancel').click();
await Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,2500))]);$('result').textContent=JSON.stringify({pass:true,width:innerWidth,checks:'Edit/Save, draft isolation, empty/blocked names, keyboard Save, spaces/backspace/length, native input prevention, cancel/leave, phone layout'});
}catch(e){$('result').textContent=JSON.stringify({pass:false,error:e.stack})}})();
</script></body></html>`;
const server=http.createServer((req,res)=>{
 if(req.url==='/test'){res.setHeader('Content-Type','text/html');res.end(fixture);return}
 const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 try{res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.mjs':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}catch{res.writeHead(404);res.end()}
});
server.listen(0,'127.0.0.1',()=>{
 const child=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--remote-debugging-port=0','--user-data-dir='+path.join(os.tmpdir(),'settings-name-tests-'+process.pid),'about:blank'],{windowsHide:true});
 let stderr='',started=false,socket;const timer=setTimeout(()=>{child.kill();server.close();process.exitCode=1},60000);
 child.stderr.on('data',async chunk=>{
  stderr+=chunk;const match=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(started||!match)return;started=true;
  try{
   socket=new WebSocket(match[1]);await new Promise((yes,no)=>{socket.onopen=yes;socket.onerror=no});
   let serial=0;const pending=new Map();socket.onmessage=e=>{const r=JSON.parse(e.data),p=pending.get(r.id);if(!p)return;pending.delete(r.id);r.error?p.no(Error(r.error.message)):p.yes(r.result)};
   const call=(method,params={},sessionId)=>new Promise((yes,no)=>{const id=++serial;pending.set(id,{yes,no});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}))});
   fs.mkdirSync(path.join(root,'output','settings-name-tests'),{recursive:true});
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
    for(const state of ['collapsed','expanded']){
     await call('Runtime.evaluate',{expression:state==='expanded'?"document.getElementById('settings-name-edit').click()":"window.scrollTo(0,0)"},sessionId);
     await new Promise(r=>setTimeout(r,200));
     const shot=await call('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(path.join(root,'output','settings-name-tests',state+'-'+width+'.png'),Buffer.from(shot.data,'base64'));
    }
    await call('Target.closeTarget',{targetId});
   }
  }catch(e){console.error(e);process.exitCode=1}finally{clearTimeout(timer);socket?.close();child.kill();server.close()}
 });
});


