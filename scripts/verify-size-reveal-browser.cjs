// Compare the real canvas renderer with the previous engine. No Firebase.
const fs=require('fs'),path=require('path'),http=require('http'),os=require('os'),{spawn,execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const baseline=execFileSync('git',['show','97fd0ad:anim/stack-anim.js'],{cwd:root,encoding:'utf8'});
const objects=source.match(/const OBJECTS = (\[[\s\S]*?\n\s*\]);/)[1];
const test=`
import {createStackAnimation,animationDuration} from '/anim/stack-anim.js';
import {createStackAnimation as baselineCreate,animationDuration as baselineDuration} from '/anim/__baseline.js';
const objects=${objects};
const assert=(v,m)=>{if(!v)throw Error(m)},stage=document.getElementById('stage'),checks=[];
const make=(id,mm)=>({...objects.find(o=>o.id===id),mm});
const opts={imageUrl:o=>'/'+o.image};
let ctl;
globalThis.preview=async(kind='worlds')=>{
 ctl?.destroy();ctl=createStackAnimation(stage,opts);
 const unit=make('poppy-seed',1),target=make('cork',45);
 const scene=await ctl.prepare(unit,target,{hMax:260,minStageH:330,...(kind==='quick'?{}:{guess:{raw:35,answer:45,adjusted:39.5}})});
 scene.renderEnd();document.getElementById('caption').textContent='Stronger shadows · clear object comparison';
 globalThis.currentScene=scene;return scene.duration;
};
try{
 for(const [name,R,guess] of [['fraction',3.4,null],['large',1000000,null],['upright',100,null],['worlds',45,{raw:35,answer:45,adjusted:39.5}],['over',1.5,{raw:3,answer:1.5,adjusted:2.85}],['exact',10,{raw:10,answer:10}]]){
  ctl?.destroy();ctl=createStackAnimation(stage,opts);
  const unit=make('poppy-seed',1),target=make(name==='upright'?'door':'cork',R),sizing={hMax:260,minStageH:330,...(guess?{guess}:{} )};
  const scene=await ctl.prepare(unit,target,sizing);
  assert(Math.abs(scene.duration/baselineDuration(unit,target)-1.2)<1e-9,'20% longer pacing '+name);
  assert(scene.duration===animationDuration(unit,target),'shared deadline matches playback '+name);
  const holder=document.createElement('div');holder.style.cssText='position:absolute;left:-10000px;width:'+stage.clientWidth+'px';document.body.append(holder);
  const old=baselineCreate(holder,opts),oldScene=await old.prepare(unit,target,sizing);
  assert(oldScene.R===scene.R&&oldScene.stageH===scene.stageH&&oldScene.width===scene.width,'same scale and dimensions '+name);
  assert(JSON.stringify(oldScene.cues.map(c=>({...c,t:c.t*1.2})))===JSON.stringify(scene.cues),'sound cues follow slower clock '+name);old.destroy();holder.remove();
  for(const t of [0,scene.duration*.2,scene.duration*.7,scene.duration-.35,scene.duration])scene.render(t);
  assert(Math.abs(scene.getShown()-R)<1e-6,'same final count '+name);
  const label=ctl.canvas.getAttribute('aria-label');assert(!label.includes('Your guess')&&!label.includes('With buffer'),'unobstructed comparison '+name);
  const first=ctl.canvas.toDataURL();scene.renderEnd();assert(ctl.canvas.toDataURL()===first,'deterministic end frame '+name);
  scene.render(0);assert(ctl.canvas.getAttribute('aria-label')==='Animated object size comparison','no early answer exposure');
  checks.push(name);
 }
 ctl?.destroy();ctl=createStackAnimation(stage,{...opts,reduceMotion:true});
 const reduced=await ctl.prepare(make('ant',1),make('door',100),{hMax:260,minStageH:330,guess:{raw:95,answer:100,adjusted:100}});
 let done=0;ctl.start(reduced,{onDone:()=>done++});assert(done===1&&reduced.getShown()===100,'reduced motion static final');
 await preview('worlds');
 document.getElementById('result').textContent=JSON.stringify({pass:true,width:innerWidth,cases:checks,durationScale:1.2});
}catch(e){document.getElementById('result').textContent=JSON.stringify({pass:false,error:e.stack})}
`;
const fixture='<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&display=swap" rel="stylesheet"><style>body{margin:0;padding:16px 12px;background:#fff8ec;color:#4a2c12;font-family:Fredoka,sans-serif}.wrap{max-width:390px;margin:auto}h2{font-size:22px;margin:6px 0 14px;text-align:center}#stage{border-radius:16px;border:2px solid #dec398;box-sizing:border-box}#caption{font-size:14px;text-align:center;margin-top:12px}</style></head><body><div class="wrap"><h2>Size reveal</h2><div id="stage"></div><div id="caption"></div></div><pre id="result" hidden></pre><script type="module">'+test+'</script></body></html>';
const server=http.createServer((req,res)=>{
 if(req.url==='/test'){res.setHeader('Content-Type','text/html');res.end(fixture);return}
 if(req.url==='/anim/__baseline.js'){res.setHeader('Content-Type','text/javascript');res.end(baseline);return}
 const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 try{res.setHeader('Content-Type',({'.js':'text/javascript','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}catch{res.writeHead(404);res.end()}
});
server.listen(0,'127.0.0.1',()=>{
 const child=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--remote-debugging-port=0','--user-data-dir='+path.join(os.tmpdir(),'size-reveal-'+process.pid),'about:blank'],{windowsHide:true});
 let stderr='',started=false,socket;const timer=setTimeout(()=>{child.kill();server.close();process.exitCode=1},45000);
 child.stderr.on('data',async chunk=>{
  stderr+=chunk;const match=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(started||!match)return;started=true;
  try{
   socket=new WebSocket(match[1]);await new Promise((yes,no)=>{socket.onopen=yes;socket.onerror=no});
   let serial=0;const pending=new Map();socket.onmessage=e=>{const r=JSON.parse(e.data),p=pending.get(r.id);if(!p)return;pending.delete(r.id);r.error?p.no(Error(r.error.message)):p.yes(r.result)};
   const call=(method,params={},sessionId)=>new Promise((yes,no)=>{const id=++serial;pending.set(id,{yes,no});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}))});
   const out=path.join(root,'output','size-reveal-tests');fs.mkdirSync(out,{recursive:true});
   for(const width of [320,390,430]){
    const {targetId}=await call('Target.createTarget',{url:'about:blank'}),{sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});
    await call('Emulation.setDeviceMetricsOverride',{width,height:740,deviceScaleFactor:1,mobile:true},sessionId);
    await call('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/test'},sessionId);
    let result;
    for(let n=0;n<500;n++){
     const value=await call('Runtime.evaluate',{expression:'document.getElementById("result")?.textContent',returnByValue:true},sessionId);
     if(value.result?.value){result=JSON.parse(value.result.value);break}await new Promise(r=>setTimeout(r,20));
    }
    if(!result)throw Error('No browser result');console.log(result);if(!result.pass)throw Error(result.error);
    await call('Runtime.evaluate',{expression:'document.fonts.ready',awaitPromise:true},sessionId);
    for(const mode of ['worlds','quick']){
     await call('Runtime.evaluate',{expression:'preview('+JSON.stringify(mode)+')',awaitPromise:true},sessionId);
     const shot=await call('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(path.join(out,mode+'-'+width+'.png'),Buffer.from(shot.data,'base64'));
    }
    await call('Target.closeTarget',{targetId});
   }
  }catch(e){console.error(e);process.exitCode=1}finally{clearTimeout(timer);socket?.close();child.kill();server.close()}
 });
});
