const fs=require('fs'),path=require('path'),http=require('http'),os=require('os'),{spawn}=require('child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'output','ui-delight-tests');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}try{res.setHeader('Content-Type',({'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ttf':'font/ttf','.wav':'audio/wav','.mp3':'audio/mpeg'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
const check=String.raw`(async()=>{
 const wait=ms=>new Promise(r=>setTimeout(r,ms)),assert=(v,m)=>{if(!v)throw Error(m)},$=id=>document.getElementById(id);
 for(let n=0;n<250&&!document.querySelector('.sound-card');n++)await wait(20);
 const data=await fetch('./sound-review-data.json').then(r=>r.json());assert(data.rows.length===42,'All 42 sound moments');await document.fonts.ready;
 for(let p=0;p<7;p++){
  for(let n=0;n<200&&[...document.querySelectorAll('.example img')].some(img=>!img.complete);n++)await wait(15);
  assert([...document.querySelectorAll('.example img')].every(img=>img.naturalWidth>0),'Illustrations load on page '+p);
  assert(document.documentElement.scrollWidth<=innerWidth+1,'Review fits phone');
  for(const button of document.querySelectorAll('button'))if(button.getClientRects().length)assert(button.scrollWidth<=button.clientWidth+1,'Control label fits: '+button.textContent);
  if(p<6)$('next').click();
 }
 for(let n=0;n<6;n++)$('previous').click();
 document.querySelector('[data-choice=keep]').click();assert($('progress').textContent.includes('1 / 42'),'Keep saves one role only');
 document.querySelectorAll('.sound-card')[1].querySelector('[data-choice=change]').click();assert($('progress').textContent.includes('1 marked Change'),'Change counted');
 let exported;const old=URL.createObjectURL;URL.createObjectURL=blob=>{exported=blob;return old(blob)};
 document.addEventListener('click',e=>{if(e.target.tagName==='A'&&e.target.download)e.preventDefault();},true);$('export').click();const picks=JSON.parse(await exported.text());assert(picks.decisions.filter(r=>r.choice).length===2,'Export decisions');
 document.querySelector('[data-choice=clear]').click();const transfer=new DataTransfer();transfer.items.add(new File([JSON.stringify(picks)],'review.json',{type:'application/json'}));$('import').files=transfer.files;$('import').dispatchEvent(new Event('change'));await wait(100);assert($('progress').textContent.includes('2 / 42'),'Import restores decisions');
 $('changes').click();assert(document.querySelectorAll('.sound-card').length===1,'Change-only review section');$('all').click();$('focus').click();assert(document.querySelectorAll('.sound-card').length===1,'Focus view');
 document.querySelector('[data-choice=keep]').click();assert($('page').textContent.startsWith('2 /'),'Focus advances');$('focus').click();
 const ctx=new AudioContext();await ctx.resume();const files=[...new Set(data.rows.flatMap(r=>r.events.map(e=>e.file)))];for(const file of files){const response=await fetch('../'+file);assert(response.ok,'Audio exists '+file);const b=await ctx.decodeAudioData(await response.arrayBuffer());assert(b.duration>0,'Audio decodes '+file);}await ctx.close();
 document.querySelector('[data-play]').click();await wait(250);assert(!$('status').textContent.includes('Could not'),'Playback starts');$('stop').click();
 return {pass:true,width:innerWidth,roles:data.rows.length,decodedFiles:files.length,checks:'All example images, phone fit, Keep/Change, export/import, focus advance and actual audio decoding/playback'};
})()`;
server.listen(0,'127.0.0.1',()=>{
 const child=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--autoplay-policy=no-user-gesture-required','--disable-gpu','--no-first-run','--remote-debugging-port=0','--user-data-dir='+path.join(os.tmpdir(),'sound-review-tests-'+process.pid),'about:blank'],{windowsHide:true});let stderr='',started=false,socket;const timer=setTimeout(()=>{child.kill();server.close();process.exitCode=1;},90000);
 child.stderr.on('data',async chunk=>{stderr+=chunk;const match=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(started||!match)return;started=true;
 try{socket=new WebSocket(match[1]);await new Promise((yes,no)=>{socket.onopen=yes;socket.onerror=no;});let serial=0;const pending=new Map(),errors=[];
 socket.onmessage=e=>{const r=JSON.parse(e.data);if(r.id){const p=pending.get(r.id);if(p){pending.delete(r.id);r.error?p.no(Error(r.error.message)):p.yes(r.result);}}else if(r.method==='Runtime.exceptionThrown')errors.push(r.params.exceptionDetails.exception?.description||r.params.exceptionDetails.text);};
 const call=(method,params={},sessionId)=>new Promise((yes,no)=>{const id=++serial;pending.set(id,{yes,no});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});
 for(const width of [320,390,430]){
  const {targetId}=await call('Target.createTarget',{url:'about:blank'}),{sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});await call('Runtime.enable',{},sessionId);await call('Emulation.setDeviceMetricsOverride',{width,height:850,deviceScaleFactor:1,mobile:true},sessionId);
  await call('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/anim/sound-review.html'},sessionId);await new Promise(r=>setTimeout(r,350));await call('Runtime.evaluate',{expression:"localStorage.removeItem('size-em-up-sound-audit-v2')"},sessionId);await call('Page.reload',{},sessionId);await new Promise(r=>setTimeout(r,350));
  const result=await call('Runtime.evaluate',{expression:check,returnByValue:true,awaitPromise:true,userGesture:true},sessionId);if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);console.log(result.result.value);
  const shot=await call('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(path.join(out,'sound-review-'+width+'.png'),Buffer.from(shot.data,'base64'));await call('Target.closeTarget',{targetId});
 }
 if(errors.length)throw Error(errors.join('\n'));
 }catch(e){console.error(e);process.exitCode=1;}finally{clearTimeout(timer);socket?.close();child.kill();server.close();}});
});
