// Real object workshop, isolated browser storage, no Firebase or game profile changes.
const fs=require('fs'),path=require('path'),http=require('http'),os=require('os'),{spawn}=require('child_process');
const root=path.resolve(__dirname,'..');
const fixture=`<!doctype html><html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}iframe{border:0;width:100vw;height:100vh}</style><iframe id="app"></iframe><pre id="result" hidden></pre><script type="module">
const assert=(v,m)=>{if(!v)throw Error(m)},wait=ms=>new Promise(r=>setTimeout(r,ms));
localStorage.removeItem('size-em-up-object-draft-v1');
const frame=document.getElementById('app');frame.src='/anim/object-review.html?object=ant';
async function ready(){for(let i=0;i<600;i++){const w=frame.contentWindow,d=frame.contentDocument;if(w?.__objectReviewReady&&d.getElementById('preview-status').textContent.startsWith('Ready'))return;await wait(20);}throw Error('Workshop failed to become ready: '+frame.contentDocument?.getElementById('status')?.textContent);}
try{
 await ready();let w=frame.contentWindow,d=frame.contentDocument,api=w.__objectReview,$=id=>d.getElementById(id);
 const event=(id,value,type='change')=>{const el=$(id);if(typeof value==='boolean')el.checked=value;else el.value=value;el.dispatchEvent(new w.Event(type,{bubbles:true}));};
 assert(api.data.objects.length===498,'full catalog');assert(d.querySelectorAll('.object').length===30,'paginated');
 assert(d.documentElement.scrollWidth<=innerWidth,'page fits phone/desktop width');
 for(const role of ['small','big']){$(role+'-end').click();const v=api.getViews()[role];assert(v.scene.unit.id==='ant'||v.scene.target.id==='ant','selected object in both roles');assert(v.scene.R>1,'correct size order');}
 const current=JSON.stringify((await import('/anim/orient-data.js')).ORIENT.ant),oldCanvas=api.getViews().big.anim.canvas.toDataURL();
 const {createStackAnimation}=await import('/anim/stack-anim.js');
 for(const role of ['small','big']){
  const view=api.getViews()[role],mount=d.createElement('div');mount.style.cssText='position:fixed;left:-10000px;width:'+view.scene.width+'px';d.body.append(mount);
  const normal=createStackAnimation(mount,{reduceMotion:false,imageUrl:o=>'../'+o.image});
  const scene=await normal.prepare(view.scene.unit,view.scene.target,innerWidth<=650?{hMax:155,minStageH:210}:{hMax:230,minStageH:285});
  assert(scene.duration===view.scene.duration,'review uses real game timing');
  for(const fraction of [.05,.18,.4,1]){scene.render(scene.duration*fraction);view.scene.render(view.scene.duration*fraction);assert(normal.canvas.toDataURL()===view.anim.canvas.toDataURL(),'current preview exactly matches game at '+role+' '+fraction);}
  normal.destroy();mount.remove();
 }
 event('rot','90');event('mirror-big',!$('mirror-big').checked);event('lean-small','cw');event('motion-big','fly');await wait(600);await ready();
 $('big-end').click();assert(api.getViews().big.anim.canvas.toDataURL()!==oldCanvas,'orientation controls change real renderer');
 assert(JSON.stringify((await import('/anim/orient-data.js')).ORIENT.ant)===current,'saved game orientation untouched');
 const saved=JSON.parse(w.localStorage.getItem('size-em-up-object-draft-v1'));assert(saved.objects.length===498&&saved.objects.find(o=>o.id==='ant').settings.orientation.rot===90,'full draft persisted');
 const oldMm=api.getDraft().ant.mm;event('units','1000');assert(api.getDraft().ant.mm===oldMm,'unit switch preserves actual size');
 event('dimension','width');event('qualifier','including antennae','input');event('size','0.02','input');await wait(600);await ready();
 assert(api.getDraft().ant.mm===20,'value converted from chosen units');assert($('wording-small').textContent.includes('including antennae')&&$('wording-big').textContent.includes('width'),'question wording updates both roles');
 event('use-current',true);await ready();assert(api.getViews().small.scene.unit.mm===api.data.objects.find(o=>o.id==='ant').mm,'current preview uses saved size');event('use-current',false);await ready();
 const good=api.exportData();assert(api.validatePicks(good).ant.measurement.dimension==='width','export import round-trip');
 event('size','0','input');assert($('export').disabled&&$('measurement-error').textContent,'invalid value blocks export');event('size','0.02','input');await wait(600);await ready();
 let rejected=false;try{api.validatePicks({...good,objects:[...good.objects,good.objects[0]]})}catch{rejected=true}assert(rejected,'duplicates rejected');
 let blob;const original=w.URL.createObjectURL.bind(w.URL);w.URL.createObjectURL=b=>{blob=b;return original(b)};$('export').click();assert(JSON.parse(await blob.text()).objects.find(o=>o.id==='ant').settings.mm===20,'export button includes edits');
 await new Promise(resolve=>{frame.addEventListener('load',resolve,{once:true});frame.src='/anim/object-review.html?object=ant';});await ready();w=frame.contentWindow;d=frame.contentDocument;api=w.__objectReview;$=id=>d.getElementById(id);assert(api.getDraft().ant.mm===20,'reload restores edits');
 $('reset-object').click();await ready();assert(!api.getDraft().ant,'reset clears only selected draft');
 const sorted=[...api.data.objects].sort((a,b)=>a.mm-b.mm);
 for(const id of [sorted[0].id,sorted.at(-1).id,'door','boeing-737','donut']){
  api.select(id);await ready();for(const role of ['small','big']){assert(api.getViews()[role].scene,'both roles load for '+id);$(role+'-end').click();}
  if(id==='donut'){$('alt').checked=true;$('alt').dispatchEvent(new w.Event('change'));await ready();assert(api.getViews().small.scene.unit.image.endsWith('donut-2.webp'),'alternate artwork loads');}
  assert(d.documentElement.scrollWidth<=innerWidth,'fits after selection '+id);
 }
 api.select('ant');await ready();$('small-end').click();$('big-end').click();
 const v=api.getViews().small;$('small-time').value=450;$('small-time').dispatchEvent(new w.Event('input'));assert(Number($('small-time').value)===450,'scrubber selects time');
 $('small-play').click();await wait(100);assert(Number($('small-time').value)<450,'replay restarts');$('small-end').click();
 if(innerWidth<=650){
  assert(!$('question-small').hidden&&$('question-big').hidden,'question at top matches small role');
  assert($('wording-small').closest('.question-anchor')&&!$('wording-small').closest('details'),'question is outside collapsed settings');
  w.scrollTo(0,$('editor').getBoundingClientRect().top+w.scrollY+150);await wait(40);
  assert(Math.abs(d.querySelector('.question-anchor').getBoundingClientRect().top)<2,'question stays anchored at top while scrolling');w.scrollTo(0,0);
  assert(!$('browse').open&&!$('orientation-settings').open&&!$('measurement-settings').open,'mobile browser and edit sections start collapsed');
  assert($('panel-big').inert&&!$('panel-small').inert,'only active mobile preview is interactive');
  $('tab-big').click();assert($('panel-small').inert&&!$('panel-big').inert,'big preview tab switches without reloading');assert($('question-small').hidden&&!$('question-big').hidden,'anchored question switches with big role');
  assert($('panel-big').getBoundingClientRect().width<=innerWidth,'tabbed preview fits');
  $('tab-small').click();assert($('object-facts').textContent.includes('length'),'measurement visible without opening settings');
 }
 const antIndex=api.data.objects.findIndex(o=>o.id==='ant');
 api.select('cranberry');await ready();
 $('use-current').checked=true;$('use-current').dispatchEvent(new w.Event('change'));await ready();
 for(const role of ['small','big']){
  $('lean-'+role).value='none';$('lean-'+role).dispatchEvent(new w.Event('change'));
  await wait(600);await ready();
  assert(!$('use-current').checked,'cranberry editing exits original comparison');
  assert(api.exportData().objects.find(o=>o.id==='cranberry').settings.orientation[role==='small'?'leanL':'leanR']==='none','cranberry no-turn saved for '+role);
  assert($('tab-'+role).getAttribute('aria-selected')==='true','editing switches to affected role');
  assert($(role+'-behavior').textContent.includes('Draft · no turn'),'actual cranberry preview clearly identifies no turn: '+$(role+'-behavior').textContent);
  assert(Number($(role+'-time').value)<1000,'changed behavior automatically replays');
 }
 const cranberrySettings=api.exportData().objects.find(o=>o.id==='cranberry').settings.orientation;
 const {ORIENT}=await import('/anim/orient-data.js');
 const originalCranberry=JSON.stringify(ORIENT.cranberry),borrowed=ORIENT.cranberry;
 try{
  // Compare no-turn drafts against the ordinary renderer using the same settings.
  // This isolated test module is never used by a game or by the workshop iframe.
  ORIENT.cranberry=cranberrySettings;
  for(const role of ['small','big']){
   const view=api.getViews()[role];view.anim.stop();const mount=d.createElement('div');mount.style.cssText='position:fixed;left:-10000px;width:'+view.scene.width+'px';d.body.append(mount);
   const normal=createStackAnimation(mount,{reduceMotion:false,imageUrl:o=>'../'+o.image});
   const scene=await normal.prepare(view.scene.unit,view.scene.target,innerWidth<=650?{hMax:155,minStageH:210}:{hMax:230,minStageH:285});
   assert(scene.duration===view.scene.duration,'cranberry no-turn uses expected timing');
   for(const fraction of [.04,.09,.2,.35,1]){scene.render(scene.duration*fraction);view.scene.render(view.scene.duration*fraction);assert(normal.canvas.toDataURL()===view.anim.canvas.toDataURL(),'cranberry no-turn matches renderer in '+role+' at '+fraction);}
   normal.destroy();mount.remove();
  }
 }finally{ORIENT.cranberry=borrowed;}
 assert(JSON.stringify(ORIENT.cranberry)===originalCranberry,'original cranberry settings preserved');
 api.select('seahorse');await ready();
 for(const role of ['small','big']){
  const view=api.getViews()[role];view.anim.stop();const mount=d.createElement('div');mount.style.cssText='position:fixed;left:-10000px;width:'+view.scene.width+'px';d.body.append(mount);
  const slide=createStackAnimation(mount,{reduceMotion:false,imageUrl:o=>'../'+o.image,motionFor:(o,right)=>o.id==='seahorse'?'slide':(right?o.motionBig:o.motionSmall)||'slide'});
  const control=await slide.prepare(view.scene.unit,view.scene.target,innerWidth<=650?{hMax:155,minStageH:210}:{hMax:230,minStageH:285});
  assert(control.duration===view.scene.duration&&JSON.stringify(control.cues)===JSON.stringify(view.scene.cues),'travel choice preserves stacking timing and cues');
  let different=false;for(let i=1;i<=25;i++){const t=control.duration*i/50;control.render(t);view.scene.render(t);if(slide.canvas.toDataURL()!==view.anim.canvas.toDataURL())different=true;}
  assert(different,'upright seahorse glides instead of default hopping in '+role);
  control.renderEnd();view.scene.renderEnd();assert(slide.canvas.toDataURL()===view.anim.canvas.toDataURL(),'travel choice preserves final stack');slide.destroy();mount.remove();
 }
 api.select('ant');await ready();
 $('next-object').click();await ready();assert($('name').textContent===api.data.objects[antIndex+1].name,'Next goes to next object, not page');
 $('previous-object').click();await ready();assert($('name').textContent==='ant','Previous returns to object');
 $('approve-next').click();await ready();assert(api.exportData().reviewedIds.includes('ant'),'Looks good marks reviewed and preserves export');assert($('name').textContent!=='ant','Looks good advances');
 const lastName=$('name').textContent;
 await new Promise(resolve=>{frame.addEventListener('load',resolve,{once:true});frame.src='/anim/object-review.html';});await ready();w=frame.contentWindow;d=frame.contentDocument;api=w.__objectReview;$=id=>d.getElementById(id);
 assert($('name').textContent===lastName&&api.exportData().reviewedIds.includes('ant'),'resume object and progress after reload');
 $('unreviewed').checked=true;$('unreviewed').dispatchEvent(new w.Event('change'));$('search').value='ant';$('search').dispatchEvent(new w.Event('input'));assert(!d.querySelector('.object[data-id="ant"]'),'reviewed objects can be skipped');
 $('unreviewed').checked=false;$('unreviewed').dispatchEvent(new w.Event('change'));$('search').value='';$('search').dispatchEvent(new w.Event('input'));api.select('ant');await ready();$('small-end').click();$('big-end').click();
 await new Promise(resolve=>{frame.addEventListener('load',resolve,{once:true});frame.src='/anim/object-review.html?collection=new';});await ready();w=frame.contentWindow;d=frame.contentDocument;api=w.__objectReview;$=id=>d.getElementById(id);
 assert($('new-objects').checked&&d.querySelectorAll('.object').length===12,'new-only link lists the twelve larger additions');
 assert(api.data.objects.find(o=>o.name===$('name').textContent)?.collection==='new-2026-10','new link ignores an older selected object');
 for(const object of api.data.objects.filter(o=>o.collection==='new-2026-10')){
  api.select(object.id);await ready();
  for(const role of ['small','big']){const v=api.getViews()[role];assert(v.scene.unit.id===object.id||v.scene.target.id===object.id,'new object has both roles');$(role+'-end').click();}
  assert(d.documentElement.scrollWidth<=innerWidth,'new object fits '+object.id);
 }
 document.getElementById('result').textContent=JSON.stringify({pass:true,width:innerWidth,checks:'498 objects; real big/small reveals, draft/current transforms, mirroring/turns, unit conversion, question wording, persistence, export, invalid values, extremes, alternate art, scrub/replay and responsive fit'});
}catch(e){document.getElementById('result').textContent=JSON.stringify({pass:false,error:e.stack})}
</script></html>`;
const server=http.createServer((req,res)=>{
 if(req.url==='/test'){res.setHeader('Content-Type','text/html');res.end(fixture);return}
 const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 try{res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.mjs':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}catch{res.writeHead(404);res.end()}
});
server.listen(0,'127.0.0.1',()=>{
 const child=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--remote-debugging-port=0','--user-data-dir='+path.join(os.tmpdir(),'object-review-tests-'+process.pid),'about:blank'],{windowsHide:true});
 let stderr='',started=false,socket;const timer=setTimeout(()=>{child.kill();server.close();process.exitCode=1},90000);
 child.stderr.on('data',async chunk=>{
  stderr+=chunk;const match=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(started||!match)return;started=true;
  try{
   socket=new WebSocket(match[1]);await new Promise((yes,no)=>{socket.onopen=yes;socket.onerror=no});
   let serial=0;const pending=new Map();socket.onmessage=e=>{const r=JSON.parse(e.data),p=pending.get(r.id);if(!p)return;pending.delete(r.id);r.error?p.no(Error(r.error.message)):p.yes(r.result)};
   const call=(method,params={},sessionId)=>new Promise((yes,no)=>{const id=++serial;pending.set(id,{yes,no});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}))});
   fs.mkdirSync(path.join(root,'output','object-review-tests'),{recursive:true});
   for(const width of [320,390,1280]){
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
    const shot=await call('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(path.join(root,'output','object-review-tests','choices-'+width+'.png'),Buffer.from(shot.data,'base64'));
    await call('Target.closeTarget',{targetId});
   }
  }catch(e){console.error(e);process.exitCode=1}finally{clearTimeout(timer);socket?.close();child.kill();server.close()}
 });
});

