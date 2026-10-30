// A nested preview route catches relative-artwork regressions as well as phone layout.
const fs=require('fs'),path=require('path'),http=require('http'),os=require('os'),{spawn}=require('child_process');
const root=path.resolve(__dirname,'..');
const html=`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><base href="../../"><link rel="stylesheet" href="anim/fonts/fredoka.css"><script type="module">import {createModeTutorial,MODE_TUTORIALS} from './anim/mode-tutorial.mjs';window.defs=MODE_TUTORIALS;window.ui=createModeTutorial({owner:()=> 'test',sample:()=>({}),storage:{getItem(){},setItem(){}}});</script>`;
const server=http.createServer((req,res)=>{const name=new URL(req.url,'http://localhost').pathname;if(name==='/tutorials/party/test'){res.setHeader('Content-Type','text/html');return res.end(html);}const p=path.resolve(root,'.'+decodeURIComponent(name));if(!p.startsWith(root+path.sep)){res.writeHead(403);return res.end();}try{res.setHeader('Content-Type',({'.svg':'image/svg+xml','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.png':'image/png','.webp':'image/webp','.ttf':'font/ttf'})[path.extname(p)]||'application/octet-stream');res.end(fs.readFileSync(p));}catch{res.writeHead(404);res.end();}});
server.listen(0,'127.0.0.1',()=>{
 const chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--remote-debugging-port=0','--user-data-dir='+path.join(os.tmpdir(),'party-tutorial-'+process.pid),'about:blank'],{windowsHide:true});
 let stderr='',started=false,socket;const timeout=setTimeout(()=>{chrome.kill();server.close();process.exitCode=1;},120000);
 chrome.stderr.on('data',async chunk=>{stderr+=chunk;const match=stderr.match(/DevTools listening on (ws:\/\/\S+)/);if(started||!match)return;started=true;
 try{
  socket=new WebSocket(match[1]);await new Promise((yes,no)=>{socket.onopen=yes;socket.onerror=no;});let serial=0;const pending=new Map(),errors=[];
  socket.onmessage=e=>{const r=JSON.parse(e.data);if(r.id){const p=pending.get(r.id);pending.delete(r.id);r.error?p.no(Error(r.error.message)):p.yes(r.result);}else if(r.method==='Runtime.exceptionThrown')errors.push(r.params.exceptionDetails.exception?.description||r.params.exceptionDetails.text);};
  const call=(method,params={},sessionId)=>new Promise((yes,no)=>{const id=++serial;pending.set(id,{yes,no});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});
  for(const [width,height] of [[320,650],[390,780],[640,360]]){
   const {targetId}=await call('Target.createTarget',{url:'about:blank'}),{sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});await call('Runtime.enable',{},sessionId);await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true},sessionId);await call('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/tutorials/party/test'},sessionId);
   const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},sessionId);if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;};
   for(let n=0;n<100;n++){if(await evaluate('!!window.ui'))break;await new Promise(r=>setTimeout(r,30));}
   for(const mode of (process.env.TUTORIAL_MODES||'quick,party,teamvteam').split(',')){
    const slides=await evaluate(`window.defs['${mode}'].slides.length`);
    await evaluate(`window.ui.play('${mode}');true`);
    for(let slide=0;slide<slides;slide++){
     const result=await evaluate(`(async()=>{
      const d=document.getElementById('mode-tutorial'),assert=(v,m)=>{if(!v)throw Error(m)};await new Promise(r=>setTimeout(r,90));
      await Promise.all([...d.querySelectorAll('img')].map(im=>im.decode()));await document.fonts.ready;
      d.getAnimations({subtree:true}).forEach(a=>{if(a.effect.getTiming().iterations!==Infinity)a.finish();});
      const r=d.getBoundingClientRect(),s=d.querySelector('.mt-scene'),b=s.getBoundingClientRect();
      assert(r.left>=0&&r.right<=innerWidth+1,'Dialog fits width');assert(r.top>=0&&r.bottom<=innerHeight+1,'Dialog fits height');assert(d.scrollWidth<=d.clientWidth+1,'No horizontal scroll');
      assert(!d.querySelector('input,textarea,select,[contenteditable]'),'No gameplay input');assert([...d.querySelectorAll('img')].every(im=>im.naturalWidth>0),'All graphics loaded');
      for(const el of s.querySelectorAll('img,.pt-note,.pt-question,.pt-score-row,.pt-keypad,.pt-option,.pt-team-score,.xt-note,.xt-label,.xt-results,.xt-team-total,.xt-options')){const a=el.getBoundingClientRect();assert(a.left>=b.left-1&&a.right<=b.right+1,'Scene element fits horizontally: '+el.className);assert(a.top>=b.top-1&&a.bottom<=b.bottom+1,'Scene element fits vertically: '+el.className);}
      const kind=d.querySelector('[data-party-example]')?.dataset.partyExample||d.querySelector('[data-extra-lesson]')?.dataset.extraLesson;
      if('${mode}'==='teamvteam'&&!['players','score'].includes(kind))assert(d.querySelector('.pt-team-strip').textContent.includes('Alex + Sam')&&d.querySelector('.pt-team-strip').textContent.includes('Lee + Jo'),'Both teams visible throughout');
      if(kind==='chance')assert(d.querySelectorAll('.pt-option').length===('${mode}'==='teamvteam'?5:4),'All guesses plus the hidden answer');
      if(kind==='score'&&'${mode}'==='teamvteam')assert(d.querySelector('.pt-team-score.red strong').textContent==='6','Shared Red score');
      if('${mode}'==='teamvteam'&&kind==='guess'){assert(d.querySelectorAll('.pt-team-guess-group').length===2,'Two team boxes');for(const group of d.querySelectorAll('.pt-team-guess-group'))assert(group.querySelectorAll('.pt-player').length===2,'Two teammates inside each box');}
      if('${mode}'==='teamvteam'&&kind==='score')assert(d.querySelectorAll('.pt-team-result').length===2,'Team results stay in two colored boxes');
      if('${mode}'==='wb'&&['wbPick','wbWrong'].includes(kind))assert(new DOMMatrixReadOnly(getComputedStyle(d.querySelector('.xt-elephant')).transform).a<0,'Elephant faces the middle');
      return {pass:true,mode:'${mode}',slide:${slide},kind};
     })()`);
     if(width===390){fs.mkdirSync(path.join(root,'output','party-tutorial'),{recursive:true});const shot=await call('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(path.join(root,'output','party-tutorial',`${mode}-${result.kind}.png`),Buffer.from(shot.data,'base64'));}
     if(slide<slides-1)await evaluate(`document.querySelector('#mode-tutorial [data-next]').click();true`);
    }
    await evaluate(`window.ui.close();window.defs['${mode}'].slideMs=100;window.ui.play('${mode}');true`);await new Promise(r=>setTimeout(r,slides*100+200));
    await evaluate(`if(document.querySelector('#mode-tutorial[open]'))throw Error('Autoplay needs no interaction');window.defs['${mode}'].slideMs=7500;window.ui.synced('${mode}',3,{host:false});if(document.querySelector('#mode-tutorial button,input'))throw Error('Guest is watch-only');window.ui.endSynced();true`);
    console.log({pass:true,width,height,mode,slides});
   }
   await call('Target.closeTarget',{targetId});
  }
  if(errors.length)throw Error(errors.join('\n'));console.log('PASS: selected mode lessons, phone/landscape bounds, loaded graphics, no inputs, automatic playback and guest controls.');
 }catch(e){console.error(e);process.exitCode=1;}finally{clearTimeout(timeout);socket?.close();chrome.kill();server.close();}
 });
});
