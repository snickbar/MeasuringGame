// Exercise the actual selection page in an isolated browser, without Firebase.
const fs=require('fs'),path=require('path'),http=require('http'),os=require('os'),{spawn}=require('child_process');
const root=path.resolve(__dirname,'..');
const fixture=`<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}iframe{border:0;width:100vw;height:100vh}</style><iframe id="app"></iframe><pre id="result" hidden></pre><script type="module">
const assert=(v,m)=>{if(!v)throw Error(m)},wait=ms=>new Promise(r=>setTimeout(r,ms));
localStorage.removeItem('size-em-up-scenery-draft-v1');
const frame=document.getElementById('app');frame.src='/anim/scenery-objects.html';
try{
 for(let i=0;i<500&&!frame.contentWindow?.__sceneryReviewReady;i++)await wait(20);
 const w=frame.contentWindow,d=frame.contentDocument,api=w.__sceneryReview,$=id=>d.getElementById(id);
 assert(api,'page becomes ready');assert(api.data.objects.length===479,'all object packs included');
 assert(api.data.objects.filter(o=>!o.explicit).length===146,'fallbacks are explicit in inventory');
 const search=value=>{$('search').value=value;$('search').dispatchEvent(new w.Event('input'))};
 search('flying saucer');assert(d.querySelectorAll('.object').length===1,'search finds fantasy object');
 let select=d.querySelector('.object select');assert(select.options.length===14&&select.value==='space','flying saucer corrected to space; all settings available');
 select.value='underwater';select.dispatchEvent(new w.Event('change'));
 assert(api.getDraft()['flying-saucer']==='underwater','choice retained');
 const saved=JSON.parse(w.localStorage.getItem('size-em-up-scenery-draft-v1'));assert(saved.objects.length===479,'full inventory saved');
 const picked=saved.objects.find(o=>o.id==='flying-saucer');assert(picked.currentScenery==='space'&&picked.scenery==='underwater','current and chosen preserved separately');
 assert(api.validatePicks(saved)['flying-saucer']==='underwater','export round-trip validation');
 let rejected=false;try{api.validatePicks({type:'size-em-up-scenery-picks',version:1,objects:[{id:'flying-saucer',scenery:'unknown'}]})}catch{rejected=true}assert(rejected,'invalid scenery rejected');
 let blob;const original=w.URL.createObjectURL.bind(w.URL);w.URL.createObjectURL=b=>{blob=b;return original(b)};$('export').click();
 const exported=JSON.parse(await blob.text());assert(exported.objects.find(o=>o.id==='flying-saucer').scenery==='underwater','export button contains choices');
 exported.objects.forEach(o=>o.scenery=o.currentScenery);
 const files=new w.DataTransfer();files.items.add(new w.File([JSON.stringify(exported)],'choices.json',{type:'application/json'}));$('file').files=files.files;$('file').dispatchEvent(new w.Event('change'));await wait(80);
 assert(!api.getDraft()['flying-saucer'],'actual import updates draft');
 d.querySelector('.object button').click();
 for(let i=0;i<500&&!$('preview-status').textContent.startsWith('Ready');i++)await wait(20);
 assert($('preview-status').textContent.startsWith('Ready'),'actual scenery renderer loads preview');
 assert($('preview').open&&$('stage').querySelector('canvas'),'preview opens with canvas');
 assert(!$('stage').textContent.includes('undefined'),'object plurals available');
 $('close').click();
 $('fallback').checked=true;$('fallback').dispatchEvent(new w.Event('change'));search('');
 assert(d.querySelectorAll('.object .tag').length===40,'fallback filter and pagination');
 $('next').click();assert($('page').textContent.startsWith('2 /'),'pagination works');
 $('group').value='Fantasy';$('group').dispatchEvent(new w.Event('change'));assert([...d.querySelectorAll('.object')].every(el=>el.textContent.includes('Fantasy')),'group filter');
 $('group').value='';$('group').dispatchEvent(new w.Event('change'));$('fallback').checked=false;$('fallback').dispatchEvent(new w.Event('change'));search('flying saucer');
 assert(d.documentElement.scrollWidth<=innerWidth,'no horizontal overflow');
 frame.src='/anim/stadium-preview.html';
 for(let i=0;i<500&&!frame.contentWindow?.__stadiumPreviewReady;i++)await wait(20);
 const sw=frame.contentWindow,stadium=sw.__stadiumPreview;assert(stadium?.scene.scenery==='stadium','new stadium uses real renderer');
 const prototype=sw.CanvasRenderingContext2D.prototype,originalDraw=prototype.drawImage,draws=[];
 prototype.drawImage=function(image,...args){if((image.src||'').includes('stadium-'))draws.push({file:image.src.split('/').pop(),args,alpha:this.globalAlpha});return originalDraw.call(this,image,...args)};
 for(const t of [stadium.scene.duration,stadium.scene.duration*.45,stadium.scene.duration*.65]){
  draws.length=0;stadium.scene.render(t);
  const stands=draws.find(d=>d.file==='stadium-stands.png'),turf=draws.find(d=>d.file==='stadium-turf.png');
  assert(stands,'stadium stands are drawn');
  if(!turf){assert(stands.args[5]+stands.args[7]-10*(stands.args[7]/300)>=sw.document.querySelector('canvas').height,'turf is outside the frame during the climb');continue;}
  const scale=turf.args[2]/760,standsBase=stands.args[5]+stands.args[7],turfSurface=turf.args[1]+turf.args[3]*.4695767195767196;
  assert(Math.abs((standsBase-turfSurface)/scale-10)<1,'stadium stays attached to turf through camera movement');
  assert(stands.args[7]>=295,'stadium is tall');assert(turf.alpha===1,'turf remains opaque');
 }
 stadium.scene.renderEnd();assert(sw.document.documentElement.scrollWidth<=innerWidth,'stadium preview fits phone');
 document.getElementById('result').textContent=JSON.stringify({pass:true,width:innerWidth,checks:'479 objects, 14 scenes, fallback/group/search filters, persistence, export/import, validation, actual preview and attached tall stadium'});
}catch(error){document.getElementById('result').textContent=JSON.stringify({pass:false,error:error.stack})}
</script></html>`;
const server=http.createServer((req,res)=>{
 if(req.url==='/test'){res.setHeader('Content-Type','text/html');res.end(fixture);return}
 const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 try{res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.mjs':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}catch{res.writeHead(404);res.end()}
});
server.listen(0,'127.0.0.1',()=>{
 const child=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--remote-debugging-port=0','--user-data-dir='+path.join(os.tmpdir(),'scenery-choices-tests-'+process.pid),'about:blank'],{windowsHide:true});
 let stderr='',started=false,socket;const timer=setTimeout(()=>{child.kill();server.close();process.exitCode=1},45000);
 child.stderr.on('data',async chunk=>{
  stderr+=chunk;const match=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(started||!match)return;started=true;
  try{
   socket=new WebSocket(match[1]);await new Promise((yes,no)=>{socket.onopen=yes;socket.onerror=no});
   let serial=0;const pending=new Map();socket.onmessage=e=>{const r=JSON.parse(e.data),p=pending.get(r.id);if(!p)return;pending.delete(r.id);r.error?p.no(Error(r.error.message)):p.yes(r.result)};
   const call=(method,params={},sessionId)=>new Promise((yes,no)=>{const id=++serial;pending.set(id,{yes,no});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}))});
   fs.mkdirSync(path.join(root,'output','scenery-choices-tests'),{recursive:true});
   for(const width of [320,390,430]){
    const {targetId}=await call('Target.createTarget',{url:'about:blank'}),{sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});
    await call('Emulation.setDeviceMetricsOverride',{width,height:740,deviceScaleFactor:1,mobile:true},sessionId);
    await call('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/test'},sessionId);
    let result;
    for(let n=0;n<500;n++){
     const value=await call('Runtime.evaluate',{expression:'document.getElementById("result")?.textContent',returnByValue:true},sessionId);
     if(value.result?.value){result=JSON.parse(value.result.value);break}await new Promise(r=>setTimeout(r,20));
    }
    if(!result)throw Error('No browser result at '+width);
    console.log(result);if(!result.pass)throw Error(result.error);
    await call('Runtime.evaluate',{expression:'document.fonts.ready',awaitPromise:true},sessionId);
    const shot=await call('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(path.join(root,'output','scenery-choices-tests','choices-'+width+'.png'),Buffer.from(shot.data,'base64'));
    await call('Target.closeTarget',{targetId});
   }
  }catch(e){console.error(e);process.exitCode=1}finally{clearTimeout(timer);socket?.close();child.kill();server.close()}
 });
});

