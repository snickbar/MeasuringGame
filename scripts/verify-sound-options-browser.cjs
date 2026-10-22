const fs=require('fs'),path=require('path'),http=require('http'),os=require('os'),{spawn}=require('child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'output','ui-delight-tests');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}try{res.setHeader('Content-Type',({'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ttf':'font/ttf','.wav':'audio/wav','.mp3':'audio/mpeg'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
const check=String.raw`(async()=>{
 const wait=ms=>new Promise(r=>setTimeout(r,ms)),assert=(v,m)=>{if(!v)throw Error(m)},$=id=>document.getElementById(id);
 for(let n=0;n<250&&!document.querySelector('.preview-card');n++)await wait(20);
 const data=await fetch('./sound-options-data.json').then(r=>r.json());assert(data.rows.length===16,'16 changed moments');assert(data.kept.length===24&&data.undecided.length===2,'Original Keep and undecided preserved');await document.fonts.ready;
 for(let p=0;p<16;p++){
  assert(document.querySelectorAll('.preview-card').length===4,'Current + 3 options');
  for(let n=0;n<200&&[...document.querySelectorAll('.example img')].some(img=>!img.complete);n++)await wait(15);
  assert([...document.querySelectorAll('.example img')].every(img=>img.naturalWidth>0),'Illustrations load on page '+p);
  assert(document.documentElement.scrollWidth<=innerWidth+1,'Page fits phone '+p);
  for(const button of document.querySelectorAll('button'))if(button.getClientRects().length)assert(button.scrollWidth<=button.clientWidth+1,'Label fits: '+button.textContent);
  if(p<15)$('next').click();
 }
 for(let n=0;n<15;n++)$('previous').click();
 document.querySelector('[data-play=a]').click();await wait(150);assert(!$('status').textContent.includes('Could not'),'Candidate playback');assert($('progress').textContent.startsWith('0 /'),'Playback does not select');$('stop').click();assert(!document.querySelector('button.playing'),'Stop clears playing');
 document.querySelector('[data-choice=a]').click();assert($('progress').textContent.startsWith('1 /'),'Choose saves');
 $('next').click();document.querySelector('[data-choice=none]').click();$('next').click();document.querySelector('[data-choice=current]').click();
 let exported;const old=URL.createObjectURL;URL.createObjectURL=blob=>{exported=blob;return old(blob)};document.addEventListener('click',e=>{if(e.target.tagName==='A'&&e.target.download)e.preventDefault()},true);
 $('export').click();const picks=JSON.parse(await exported.text());assert(picks.type==='size-em-up-sound-options'&&picks.decisions.length===16,'Role-based export');assert(picks.decisions.filter(r=>r.choice).length===3,'Only three chosen');assert(picks.kept.includes('star')&&picks.kept.includes('lead')&&picks.kept.includes('cardflip'),'Shared file Keep roles intact');
 const originalStorage=localStorage.getItem('size-em-up-sound-audit-v2');assert(!originalStorage,'Candidate choices do not alter original review');
 async function load(value){const transfer=new DataTransfer();transfer.items.add(new File([JSON.stringify(value)],'options.json',{type:'application/json'}));$('import').files=transfer.files;$('import').dispatchEvent(new Event('change'));await wait(80);}
 document.querySelector('[data-choice=clear]').click();await load(picks);assert($('progress').textContent.startsWith('3 /'),'Import restores choices');
 const before=localStorage.getItem('size-em-up-sound-options-v1');const bad=structuredClone(picks);bad.decisions.push(bad.decisions[0]);await load(bad);assert($('status').textContent.includes('Invalid')&&localStorage.getItem('size-em-up-sound-options-v1')===before,'Duplicate import rejected atomically');
 const stale=structuredClone(picks);stale.decisions[0].optionsFingerprint='old';await load(stale);assert($('status').textContent.includes('changed')&&localStorage.getItem('size-em-up-sound-options-v1')===before,'Stale import rejected');
 await load(picks);$('next').click();document.querySelector('[data-choice=silent]').click();$('previous').click();assert(document.querySelector('.pair-note').textContent.includes('silence'),'Build uses separate silence ending choice');
 let starts=0;const origStart=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(...a){starts++;return origStart.apply(this,a)};
 document.querySelector('[data-play=a]').click();for(let n=0;n<100&&starts<1;n++)await wait(20);assert(starts===1,'Build without ending schedules one clip');$('stop').click();
 $('next').click();document.querySelector('[data-choice=b]').click();$('previous').click();starts=0;document.querySelector('[data-play=a]').click();for(let n=0;n<100&&starts<2;n++)await wait(20);assert(starts===2,'Build with selected ending schedules two clips');$('stop').click();AudioBufferSourceNode.prototype.start=origStart;
 $('volume').value=0;document.querySelector('[data-play=current]').click();await wait(100);$('next').click();assert(!document.querySelector('.playing'),'Navigation stops old playback');$('volume').value=70;
 const ctx=new AudioContext();await ctx.resume();const files=[...new Set(data.rows.flatMap(r=>[...r.events,...r.options.flatMap(o=>o.events)]).map(e=>e.file))];for(const file of files){const response=await fetch('../'+file);assert(response.ok,'Audio exists '+file);const b=await ctx.decodeAudioData(await response.arrayBuffer());assert(b.duration>0&&b.duration<30,'Audio decodes '+file);}await ctx.close();
 $('jump').open=true;assert(document.documentElement.scrollWidth<=innerWidth+1,'Jump grid fits phone');document.querySelector('[data-jump="15"]').click();assert($('position').textContent==='16 / 16'&&!$('jump').open,'Jump navigation');
 document.querySelector('[data-play=current]').click();await wait(150);assert(!$('status').textContent.includes('Could not'),'Synth reference plays');$('stop').click();
 return {pass:true,width:innerWidth,roles:16,clips:48,decodedFiles:files.length,checks:'All phone layouts/images, independent audition and selection, export/import/stale rejection, separate suspense ending, stop/navigation and original review isolation'};
})()
`;
server.listen(0,'127.0.0.1',()=>{
 const child=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--autoplay-policy=no-user-gesture-required','--disable-gpu','--no-first-run','--remote-debugging-port=0','--user-data-dir='+path.join(os.tmpdir(),'sound-options-tests-'+process.pid),'about:blank'],{windowsHide:true});let stderr='',started=false,socket;const timer=setTimeout(()=>{child.kill();server.close();process.exitCode=1;},90000);
 child.stderr.on('data',async chunk=>{stderr+=chunk;const match=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(started||!match)return;started=true;
 try{socket=new WebSocket(match[1]);await new Promise((yes,no)=>{socket.onopen=yes;socket.onerror=no;});let serial=0;const pending=new Map(),errors=[];
 socket.onmessage=e=>{const r=JSON.parse(e.data);if(r.id){const p=pending.get(r.id);if(p){pending.delete(r.id);r.error?p.no(Error(r.error.message)):p.yes(r.result);}}else if(r.method==='Runtime.exceptionThrown')errors.push(r.params.exceptionDetails.exception?.description||r.params.exceptionDetails.text);};
 const call=(method,params={},sessionId)=>new Promise((yes,no)=>{const id=++serial;pending.set(id,{yes,no});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});
 for(const width of [320,390,430]){
  const {targetId}=await call('Target.createTarget',{url:'about:blank'}),{sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});await call('Runtime.enable',{},sessionId);await call('Emulation.setDeviceMetricsOverride',{width,height:850,deviceScaleFactor:1,mobile:true},sessionId);
  await call('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/anim/sound-options.html'},sessionId);await new Promise(r=>setTimeout(r,350));await call('Runtime.evaluate',{expression:"localStorage.removeItem('size-em-up-sound-options-v1')"},sessionId);await call('Page.reload',{},sessionId);await new Promise(r=>setTimeout(r,350));
  const result=await call('Runtime.evaluate',{expression:check,returnByValue:true,awaitPromise:true,userGesture:true},sessionId);if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);console.log(result.result.value);
  const shot=await call('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(path.join(out,'sound-options-'+width+'.png'),Buffer.from(shot.data,'base64'));await call('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/anim/sound-review.html?filter=pending&baseline=options'},sessionId);await new Promise(r=>setTimeout(r,350));
  const pendingCheck=await call('Runtime.evaluate',{expression:`(async()=>{for(let n=0;n<150&&document.querySelectorAll('.sound-card').length!==2;n++)await new Promise(r=>setTimeout(r,20));const ids=[...document.querySelectorAll('.sound-card')].map(el=>el.dataset.id);if(ids.length!==2||!ids.includes('anim-tap')||!ids.includes('anim-tick'))throw Error('Pending link should show precisely the two undecided moments');return true;})()`,returnByValue:true,awaitPromise:true},sessionId);if(pendingCheck.exceptionDetails)throw Error(pendingCheck.exceptionDetails.exception?.description||pendingCheck.exceptionDetails.text);
  await call('Runtime.evaluate',{expression:"localStorage.removeItem('size-em-up-sound-audit-v2')"},sessionId);await call('Target.closeTarget',{targetId});
 }
 if(errors.length)throw Error(errors.join('\n'));
 }catch(e){console.error(e);process.exitCode=1;}finally{clearTimeout(timer);socket?.close();child.kill();server.close();}});
});
