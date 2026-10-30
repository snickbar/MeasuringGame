// Isolated watch-only tutorial: no Firebase, accounts or live player writes.
const fs=require('fs'),path=require('path'),http=require('http'),os=require('os'),{spawn}=require('child_process');
const root=path.resolve(__dirname,'..');
const html=`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="../../"><link rel="stylesheet" href="anim/fonts/fredoka.css"><link rel="stylesheet" href="anim/high-low-reveal.css"><script type="module">import {createModeTutorial,MODE_TUTORIALS} from './anim/mode-tutorial.mjs';window.defs=MODE_TUTORIALS;window.ui=createModeTutorial({owner:()=> 'test',sample:()=>({}),storage:{getItem(){},setItem(){}}});window.ui.play('hl');</script>`;
const server=http.createServer((req,res)=>{const name=new URL(req.url,'http://localhost').pathname;if(name==='/output/high-low-tutorial/test'){res.setHeader('Content-Type','text/html');return res.end(html);}const p=path.resolve(root,'.'+decodeURIComponent(name));if(!p.startsWith(root+path.sep)){res.writeHead(403);return res.end();}try{res.setHeader('Content-Type',({'.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.webp':'image/webp','.ttf':'font/ttf'})[path.extname(p)]||'application/octet-stream');res.end(fs.readFileSync(p));}catch{res.writeHead(404);res.end();}});
server.listen(0,'127.0.0.1',()=>{
 const chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--remote-debugging-port=0','--user-data-dir='+path.join(os.tmpdir(),'hl-tutorial-'+process.pid),'about:blank'],{windowsHide:true});
 let stderr='',started=false,socket;
 const timeout=setTimeout(()=>{chrome.kill();server.close();process.exitCode=1;},150000);
 chrome.stderr.on('data',async chunk=>{stderr+=chunk;const match=stderr.match(/DevTools listening on (ws:\/\/\S+)/);if(started||!match)return;started=true;
 try{
  socket=new WebSocket(match[1]);await new Promise((yes,no)=>{socket.onopen=yes;socket.onerror=no;});
  let serial=0;const pending=new Map(),errors=[];
  socket.onmessage=e=>{const r=JSON.parse(e.data);if(r.id){const p=pending.get(r.id);pending.delete(r.id);r.error?p.no(Error(r.error.message)):p.yes(r.result);}else if(r.method==='Runtime.exceptionThrown')errors.push(r.params.exceptionDetails.exception?.description||r.params.exceptionDetails.text);};
  const call=(method,params={},sessionId)=>new Promise((yes,no)=>{const id=++serial;pending.set(id,{yes,no});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});
  for(const [width,height] of [[320,650],[390,780],[640,360]]){
   const {targetId}=await call('Target.createTarget',{url:'about:blank'}),{sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});
   await call('Runtime.enable',{},sessionId);await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true},sessionId);
   await call('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/output/high-low-tutorial/test'},sessionId);
   const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},sessionId);if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;};
   for(let n=0;n<100;n++){if(await evaluate('!!window.ui'))break;await new Promise(r=>setTimeout(r,30));}
   const result=await evaluate(`(async()=>{
    const assert=(v,m)=>{if(!v)throw Error(m)},wait=ms=>new Promise(r=>setTimeout(r,ms)),d=document.getElementById('mode-tutorial');
    const fit=()=>{const r=d.getBoundingClientRect();assert(r.left>=0&&r.right<=innerWidth+1,'Dialog fits width');assert(d.scrollWidth<=d.clientWidth+1,'No horizontal overflow');assert(r.top>=0&&r.bottom<=innerHeight+1,'Dialog fits height');assert(!d.querySelector('input,textarea,select,[contenteditable]'),'No gameplay inputs');};
    await wait(150);fit();assert(d.textContent.includes('Three shared lives'),'Shared lives explained');
    await Promise.all([...d.querySelectorAll('img')].map(im=>im.decode()));
    assert([...d.querySelectorAll('img')].every(im=>im.naturalWidth>0),'Role and heart artwork loads from nested preview');
    assert(new DOMMatrixReadOnly(getComputedStyle(d.querySelector('.mt-hl-roles>div+div img')).transform).a<0,'Role bird faces inward');
    d.querySelector('[data-next]').click();
    for(let n=0;n<450;n++){if(d.querySelector('.hl-ocean-reveal')?.dataset.step==='3'&&d.querySelector('.hl-ocean-reveal')?.dataset.busy==='false')break;await wait(20);}
    const r=d.querySelector('.hl-ocean-reveal');assert(r?.querySelector('.cw-meter').dataset.result==='won','Safe example completes automatically');
    assert([...r.querySelectorAll('img')].every(im=>im.complete&&im.naturalWidth>0),'Every ocean image loads, including reaction poses');
    assert(new DOMMatrixReadOnly(getComputedStyle(r.querySelector('.oc-bird .oc-art')).transform).a<0,'All ocean bird poses face inward');
    assert(r.querySelector('.oc-bird').classList.contains('is-happy'),'Safe bird celebrates');
    for(const [animal,marker] of [['.oc-bird','.cw-high'],['.oc-shark','.cw-low']]){const a=r.querySelector(animal).getBoundingClientRect(),b=r.querySelector(marker).getBoundingClientRect();assert(Math.abs(a.top+a.height/2-b.top-b.height/2)<2,'Animal and marker line up');}
    assert(r.querySelector('[data-meter-high]').textContent==='12'&&r.querySelector('[data-meter-low]').textContent==='8','Numbers stay on meter');fit();
    return {pass:true,width:innerWidth,height:innerHeight};
   })()`);
   console.log(result);
   fs.mkdirSync(path.join(root,'output','high-low-tutorial'),{recursive:true});
   const shot=await call('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(path.join(root,'output','high-low-tutorial',`safe-${width}.png`),Buffer.from(shot.data,'base64'));
   await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]},sessionId);
   await evaluate(`(async()=>{const d=document.getElementById('mode-tutorial'),wait=ms=>new Promise(r=>setTimeout(r,ms));for(const scenario of ['under','over','wide']){d.querySelector('[data-next]').click();await wait(1000);const r=d.querySelector('.hl-ocean-reveal');if(r.querySelector('.cw-meter').dataset.result!=='lost')throw Error(scenario+' must lose');if(r.querySelector('.is-happy'))throw Error('No happy losing animals');if(scenario==='under'&&!r.querySelector('.oc-bird.is-reacting'))throw Error('Wet bird');if(scenario==='over'&&!r.querySelector('.oc-shark.is-reacting'))throw Error('Shocked shark');}for(const lesson of ['hlShield','hlRewards']){d.querySelector('[data-next]').click();await wait(100);await Promise.all([...d.querySelectorAll('img')].map(im=>im.decode()));if(d.querySelector('[data-extra-lesson]')?.dataset.extraLesson!==lesson)throw Error('Missing shared survival lesson');}window.ui.close();if(d.open)throw Error('Closes');if(d.querySelector('.hl-ocean-reveal'))throw Error('Demo cleanup');})()`);
   if(width===320){await evaluate(`(async()=>{window.defs.hl.slideMs=150;window.ui.play('hl');await new Promise(r=>setTimeout(r,window.defs.hl.slides.length*150+200));if(document.querySelector('#mode-tutorial[open]'))throw Error('Watch-only autoplay completes without clicks');window.defs.hl.slideMs=9500;window.ui.synced('hl',1,{host:false});if(document.querySelector('#mode-tutorial button,input'))throw Error('Party guest is watch-only');window.ui.endSynced();})()`);}
   await call('Target.closeTarget',{targetId});
  }
  if(errors.length)throw Error(errors.join('\n'));
  console.log('PASS: phone/landscape fit, real safe/failed examples, meter alignment, reduced motion, autoplay, guest controls and cleanup.');
 }catch(e){console.error(e);process.exitCode=1;}finally{clearTimeout(timeout);socket?.close();chrome.kill();server.close();}
 });
});
