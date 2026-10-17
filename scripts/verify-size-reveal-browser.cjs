// Compare the real canvas renderer with the previous engine. No Firebase.
const fs=require('fs'),path=require('path'),http=require('http'),os=require('os'),{spawn,execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const baseline=execFileSync('git',['show','97fd0ad:anim/stack-anim.js'],{cwd:root,encoding:'utf8'});
const objects=source.match(/const OBJECTS = (\[[\s\S]*?\n\s*\]);/)[1];
const test=`
import {createStackAnimation,animationDuration} from '/anim/stack-anim.js';
import {createStackAnimation as baselineCreate,animationDuration as baselineDuration} from '/anim/__baseline.js';
import {landingStyleFor,landingPose} from '/anim/reveal-style.mjs';
import {sceneryFor,SCENERY_BY_OBJECT,SETTINGS,loadScenery,drawWallpaper,drawSceneryLayers,groundScaleFor,drawSceneryFloor} from '/anim/scenery.mjs';
import {FLOOR_DATA} from '/anim/scenery-data.mjs';
const objects=${objects};
const assert=(v,m)=>{if(!v)throw Error(m)},stage=document.getElementById('stage'),checks=[];
const make=(id,mm)=>({...objects.find(o=>o.id===id),mm});
const opts={imageUrl:o=>'/'+o.image};
let ctl;
globalThis.preview=async(kind='worlds')=>{
 ctl?.destroy();ctl=createStackAnimation(stage,{...opts,...(kind==='dark'?{theme:(await import('/anim/stack-anim.js')).DARK_THEME}:{})});
 const pair={city:['grain-of-rice','statue-of-liberty'],room:['ant','door'],park:['paperclip','elephant'],forest:['paperclip','deer'],seaside:['rubber-duck','blue-whale'],soft:['poppy-seed','rubber-duck'],round:['ant','tennis-ball'],beach:['grain-of-rice','lighthouse'],kitchen:['paperclip','refrigerator'],tabletop:['ant','paperclip'],farm:['ant','tractor'],snow:['ant','polar-bear'],desert:['ant','cactus'],underwater:['ant','great-white-shark'],space:['ant','saturn-rocket'],enchanted:['ant','pegasus'],grass:['poppy-seed','ant']}[kind];
 const unit=pair?objects.find(o=>o.id===pair[0]):make('poppy-seed',1),target=pair?objects.find(o=>o.id===pair[1]):make('cork',45);
 const scene=await ctl.prepare(unit,target,{hMax:260,minStageH:330});
 scene.render(kind==='city'?scene.cues.find(c=>c.name==='tap').t+.12:kind==='soft'||kind==='round'?scene.cues.filter(c=>c.name==='swipe')[1].t-.18:scene.duration);
 document.getElementById('caption').textContent=scene.scenery+' · '+(kind==='city'?'rice and Statue of Liberty':'setting from larger object · original camera');
 globalThis.currentScene=scene;return scene.duration;
};
try{
 const watched=new WeakMap(),drawImage=CanvasRenderingContext2D.prototype.drawImage;
 CanvasRenderingContext2D.prototype.drawImage=function(image,...args){
  if(/(?:grass|cloud)\\.png$/.test(image.src||'')||(image.src||'').includes('/scenery/'))watched.get(this)?.push({image:image.src.split('/').pop(),args,source:image,alpha:this.globalAlpha,filter:this.filter});
  return drawImage.call(this,image,...args);
 };
 const gradients=new WeakMap(),radial=CanvasRenderingContext2D.prototype.createRadialGradient;
 CanvasRenderingContext2D.prototype.createRadialGradient=function(...args){gradients.get(this)?.push(this.getTransform());return radial.apply(this,args)};
 await Promise.all(['/anim/cloud.png','/anim/grass.png'].map(src=>new Promise((yes,no)=>{const i=new Image();i.onload=yes;i.onerror=no;i.src=src})));
 assert(objects.every(o=>SCENERY_BY_OBJECT[o.id]),'every game object has an explicit setting');
 assert(['great-white-shark','hammerhead-shark','whale-shark'].every(id=>sceneryFor({id})==='underwater'),'sharks use underwater scenery');
 assert(SETTINGS.city.night===true&&SETTINGS.city.sky[0]==='#111d36','city is always nighttime');
 assert(!SETTINGS.desert.clouds&&SETTINGS.desert.backdrop==='desert-dunes'&&SETTINGS.desert.sky.length===4,'desert combines large dunes with hazy sky and no clouds');
 assert(sceneryFor({id:'future-object'})==='grass','unknown objects fall back to original grass');
 assert(groundScaleFor(1,1)===1,'ground returns to original final scale');
 let priorScale=1;
 for(const zoom of [1,2,10,100,1e6]){
  const scale=groundScaleFor(zoom,1);assert(scale>=priorScale&&scale<=1.35,'ground zoom is gentle and bounded');priorScale=scale;
 }
 const wallCanvas=document.createElement('canvas');wallCanvas.width=390;wallCanvas.height=330;
 const wallCtx=wallCanvas.getContext('2d'),wallPatterns=[];
 for(const style of ['lattice','tiles','plaid']){
  const wall=(shiftY=0,shiftX=0)=>{wallCtx.clearRect(0,0,390,330);drawWallpaper(wallCtx,style,{width:390,height:330,shiftY,shiftX,dark:false});return wallCanvas.toDataURL()};
  const original=wall();wallPatterns.push(original);
  assert(original===wall(1400,4200),'wallpaper repeats without seams '+style);
  assert(original!==wall(100,100),'wallpaper follows camera '+style);
 }
 assert(new Set(wallPatterns).size===3,'three distinct indoor wallpapers');
 for(const id of ['door','refrigerator','paperclip']){
  const room=await loadScenery({id},'/anim/scenery/');
  assert(!room.images['wall-picture']&&!room.config.artwork,'indoor artwork removed '+id);
 }
 for(const [id,name,dy] of [['polar-bear','snowflakes',7],['great-white-shark','bubbles',-5]]){
  const kit=await loadScenery({id},'/anim/scenery/');
  const positions=(time,reduced=false,shiftY=0)=>{
   const draws=[];watched.set(wallCtx,draws);
   drawSceneryLayers(wallCtx,kit,{width:390,height:330,floorY:290,shiftY,shiftX:0,dark:false,time,reduced});
   return draws.filter(d=>d.image===name+'.png').map(d=>d.args[1]);
  };
  const a=positions(3),b=positions(4);
  assert(a.length===(name==='bubbles'?4:5)&&b.some((y,i)=>Math.abs(y-a[i]-dy)<.01),name+' drift direction and speed');
  assert(JSON.stringify(positions(3,true))===JSON.stringify(positions(9,true)),name+' respects reduced motion');
 }
 for(const [id,name,minAlpha] of [['deer','mist',.3],['polar-bear','snowflakes',.65],['great-white-shark','bubbles',.65]]){
  const kit=await loadScenery({id},'/anim/scenery/'),draws=[];watched.set(wallCtx,draws);
  drawSceneryLayers(wallCtx,kit,{width:390,height:330,floorY:290,shiftY:0,shiftX:0,dark:false,time:3,reduced:false});
  assert(draws.some(d=>d.image===name+'.png'&&d.alpha>=minAlpha),name+' readable atmospheric opacity');
  if(kit.config.backdrop){
   const first=draws.find(d=>d.image===kit.config.backdrop+'.png'),moved=[];watched.set(wallCtx,moved);
   drawSceneryLayers(wallCtx,kit,{width:390,height:330,floorY:290,shiftY:100,shiftX:40,dark:false,time:3,reduced:false});
   const next=moved.find(d=>d.image===first.image);
   assert(Math.abs(next.args[5]-first.args[5]-100)<.001&&Math.abs(next.args[4]-first.args[4]+40)<.001,'rooted scenery follows floor translation '+id);
  }
 }
 const fallback=await loadScenery({id:'door'},'/missing-scenery/');assert(fallback.id==='grass','missing required floor falls back safely');
 const examples={grass:'ant',beach:'lighthouse',living:'door',kitchen:'refrigerator',tabletop:'paperclip',city:'taxi',forest:'deer',farm:'tractor',snow:'polar-bear',desert:'cactus',underwater:'great-white-shark',space:'saturn-rocket',enchanted:'pegasus'};
 for(const id of ['deer','great-white-shark','taxi']){
  const kit=await loadScenery({id},'/anim/scenery/');
  const capture=groundScale=>{const draws=[];watched.set(wallCtx,draws);const view={width:390,height:330,floorY:290,shiftY:0,shiftX:0,groundScale,dark:false,time:0,reduced:true};drawSceneryLayers(wallCtx,kit,view);drawSceneryFloor(wallCtx,kit,FLOOR_DATA[kit.config.floor],view);return draws};
  const a=capture(1),b=capture(1.3),floor=kit.config.floor+'.png',back=kit.config.backdrop+'.png';
  assert(Math.abs(b.find(d=>d.image===floor).args[3]/a.find(d=>d.image===floor).args[3]-1.3)<.001,'floor artwork zooms '+id);
  const first=a.find(d=>d.image===back),next=b.find(d=>d.image===back);
  assert(Math.abs(next.args[7]/first.args[7]-1.3)<.001,'rooted backdrop scales with floor '+id);
  assert(Math.abs(next.args[5]+next.args[7]-(290-4*1.3))<.001,'scaled backdrop remains grounded '+id);
 }
 for(const [expected,id] of Object.entries(examples)){
  ctl?.destroy();ctl=createStackAnimation(stage,opts);
  const target=objects.find(o=>o.id===id),small=make('poppy-seed',.01);
  const scene=await ctl.prepare(target,small,{hMax:260,minStageH:330});
  assert(scene.target.id===id&&scene.scenery===expected,'setting uses larger object after input swap '+id);
  const zoomback=scene.cues.find(c=>c.name==='zoomback').t;
  let lastGroundScale=scene.getFraming(Math.max(0,zoomback-.2)).groundScale;
  assert(lastGroundScale>1,'ground visibly zooms with close-up '+id);
  for(let seconds=Math.max(0,zoomback-.2);seconds<=scene.duration;seconds+=1/60){
   const scale=scene.getFraming(seconds).groundScale;
   assert(Math.abs(scale-lastGroundScale)<.03,'ground zoom returns smoothly '+id);lastGroundScale=scale;
  }
  assert(scene.getFraming(scene.duration).groundScale===1,'final ground size restored '+id);
  const startDraws=[];watched.set(ctl.canvas.getContext('2d'),startDraws);scene.render(0);
  if(expected==='farm'||expected==='city'){
   const cloudIndex=startDraws.findIndex(d=>d.image==='cloud.png');
   const backdropIndex=startDraws.findIndex(d=>d.image===SETTINGS[expected].backdrop+'.png');
   assert(cloudIndex>=0&&backdropIndex>cloudIndex,'clouds behind rooted scenery '+id);
   if(expected==='farm')assert(startDraws[backdropIndex].alpha===1,'hay bales opaque over background clouds');
   assert(startDraws.filter(d=>d.image===SETTINGS[expected].backdrop+'.png').length===(expected==='farm'?2:1),'backdrop drawn only once per placement '+id);
   if(expected==='city')assert(startDraws.findIndex(d=>d.image==='star-field.png')<cloudIndex,'stars behind clouds');
  }
  if(SETTINGS[expected].backdrop){
   const backdrop=startDraws.filter(d=>d.image===SETTINGS[expected].backdrop+'.png');
   assert(backdrop.length>0,'background scenery ready on first frame '+id);
   const initial=backdrop[0],later=[];watched.set(ctl.canvas.getContext('2d'),later);
   scene.render(scene.cues.find(c=>c.name==='tap').t);
   const moved=later.find(d=>d.image===initial.image);
   assert(moved,'background retained through camera motion '+id);
   // Rooted scenery and floor share the same bounded zoom.
   const gs0=scene.getFraming(0).groundScale,gs1=scene.getFraming(scene.cues.find(c=>c.name==='tap').t).groundScale;
   assert(Math.abs(initial.args[6]/gs0-moved.args[6]/gs1)<.001&&Math.abs(initial.args[7]/gs0-moved.args[7]/gs1)<.001,'backdrop follows gentle ground zoom '+id);
   const bottom=d=>d.args[5]+d.args[7];
   assert(Math.abs(bottom(initial)-scene.getFraming(0).floorY+4*gs0)<.001,'scenery starts attached to floor '+id);
   assert(Math.abs(bottom(moved)-scene.getFraming(scene.cues.find(c=>c.name==='tap').t).floorY+4*gs1)<.001,'scenery stays attached during climb '+id);
   scene.render(0);
  }
  const floorName=SETTINGS[expected].floor;
  if(floorName){
   const floor=startDraws.find(d=>d.image===floorName+'.png');assert(floor,'floor is ready on first frame '+id);
   if(expected==='city')assert(floor.alpha===1&&floor.filter==='brightness(65%)','night pavement stays opaque while darkened');
   const f=scene.getFraming(0),surface=floor.args[1]+floor.args[3]*FLOOR_DATA[floorName].surface;
   assert(surface<=f.floorY-13,'object baseline is inside solid ground '+id);
   const sample=document.createElement('canvas');sample.width=floor.source.naturalWidth;sample.height=floor.source.naturalHeight;
   const sx=sample.getContext('2d');sx.drawImage(floor.source,0,0);
   const row=Math.floor(((f.floorY)-floor.args[1])/floor.args[3]*sample.height);
   for(const fraction of [.1,.3,.5,.7,.9]){
    const pixel=sx.getImageData(Math.floor(sample.width*fraction),row,1,1).data;
    assert(pixel[3]>180,'solid ground beneath object '+id);
    if(expected==='forest')assert(pixel[0]>pixel[1],'forest object meets brown soil '+id);
   }
  }
  const snapshots=[];
  for(const time of [0,scene.cues.find(c=>c.name==='tap').t,scene.duration*.65,scene.duration]){
   scene.render(time);snapshots.push(ctl.canvas.toDataURL());
  }
  assert(snapshots[1]!==snapshots[2],'camera and artwork animate '+id);
  scene.renderEnd();assert(ctl.canvas.toDataURL()===snapshots[3],'stable end scene '+id);
 }
 assert(landingStyleFor({id:'tennis-ball',mm:65})==='round','round landing');
 assert(landingStyleFor({id:'marshmallow',mm:25})==='soft','soft landing');
 assert(landingStyleFor({id:'statue-of-liberty',mm:93000})==='heavy','heavy landing');
 for(const style of ['round','soft','heavy','firm']){
  for(const age of [-1,0,1,10])assert(JSON.stringify(landingPose(style,age))===JSON.stringify({squash:0,rock:0,lift:0}),'settled exact pose');
  assert(JSON.stringify(landingPose(style,.15,true))===JSON.stringify({squash:0,rock:0,lift:0}),'reduced motion landing');
 }
 for(const [name,R,guess] of [['fraction',3.4,null],['large',1000000,null],['upright',100,null],['worlds',45,{raw:35,answer:45,adjusted:39.5}],['over',1.5,{raw:3,answer:1.5,adjusted:2.85}],['exact',10,{raw:10,answer:10}],['garden',100,null]]){
  ctl?.destroy();ctl=createStackAnimation(stage,opts);
  const unit=make('poppy-seed',1),target=make(name==='upright'?'door':name==='garden'?'ant':'cork',R),sizing={hMax:260,minStageH:330,...(guess?{guess}:{} )};
  const scene=await ctl.prepare(unit,target,sizing);
  assert(Math.abs(scene.duration/baselineDuration(unit,target)-1.2)<1e-9,'20% longer pacing '+name);
  assert(scene.duration===animationDuration(unit,target),'shared deadline matches playback '+name);
  const holder=document.createElement('div');holder.style.cssText='position:absolute;left:-10000px;width:'+stage.clientWidth+'px';document.body.append(holder);
  const old=baselineCreate(holder,opts),oldScene=await old.prepare(unit,target,sizing);
  assert(oldScene.R===scene.R&&scene.stageH>=330&&oldScene.width===scene.width,'same scale and dimensions '+name);
  assert(JSON.stringify(oldScene.cues.map(c=>({...c,t:c.t*1.2})))===JSON.stringify(scene.cues),'sound cues follow slower clock '+name);
  for(const t of [0,scene.duration*.2,scene.duration*.7,scene.duration-.35,scene.duration]){
   const currentBg=[],priorBg=[];watched.set(ctl.canvas.getContext('2d'),currentBg);watched.set(old.canvas.getContext('2d'),priorBg);
   scene.render(t);oldScene.render(t/1.2);
   if(scene.scenery==='grass'){
    const f=scene.getFraming(t),end=scene.getFraming(scene.duration),cloud=currentBg.find(d=>d.image==='cloud.png'),grass=currentBg.find(d=>d.image==='grass.png');
    assert(cloud,'original cloud artwork');const span=scene.stageH+160,raw=.1*scene.stageH+(f.floorY-end.floorY)*.18,cy=((raw%span)+span)%span-80;
    assert(Math.abs(cloud.args[1]+cloud.args[3]/2-cy)<1e-6,'original downward cloud parallax');
    if(grass)assert(Math.abs(grass.args[1]-(f.floorY-grass.args[3]*127/145-6*f.groundScale))<1e-6,'grass remains attached to ground');
   }
   assert(Math.abs(scene.getShown()-oldScene.getShown())<1e-6,'stacking unchanged '+name);
  }
  old.destroy();holder.remove();
  assert(Math.abs(scene.getShown()-R)<1e-6,'same final count '+name);
  const label=ctl.canvas.getAttribute('aria-label');assert(!label.includes('Your guess')&&!label.includes('With buffer'),'unobstructed comparison '+name);
  const first=ctl.canvas.toDataURL();scene.renderEnd();assert(ctl.canvas.toDataURL()===first,'deterministic end frame '+name);
  scene.render(0);assert(ctl.canvas.getAttribute('aria-label')==='Animated object size comparison','no early answer exposure');
  checks.push(name);
 }
 for(const [a,b] of [['grain-of-rice','statue-of-liberty'],['human-eyelash','eiffel-tower'],['poppy-seed','door']]){
  ctl?.destroy();ctl=createStackAnimation(stage,opts);
  const scene=await ctl.prepare(objects.find(o=>o.id===a),objects.find(o=>o.id===b),{hMax:260,minStageH:330});
  const taps=scene.cues.filter(c=>c.name==='tap');
  for(const time of [taps[0].t+.1,taps[Math.floor(taps.length/2)].t]){
   const f=scene.getFraming(time);scene.render(time);
   assert(f.x>scene.width,'large target can naturally leave the close-up '+a+'/'+b);
   assert(f.clipLeft===0,'no special target clipping');
  }
  const first=taps[0].t+.1,last=scene.cues.find(c=>c.name==='zoomback').t-.01;
  let gapRatio;
  for(let step=0;step<=100;step++){
   const time=first+(last-first)*step/100,f=scene.getFraming(time),ratio=(f.x-f.stackX)/f.height;
   if(gapRatio!==undefined)assert(Math.abs(ratio-gapRatio)<1e-9,'target uses original world-space position throughout stacking');
   gapRatio=ratio;assert(f.clipLeft===0,'no pinning or viewport-relative crop');
  }
  // The destination shadow appears only after the first object lands.
  const ctx=ctl.canvas.getContext('2d'),firstLanding=taps[0].t;
  for(const time of [0,firstLanding-.05,firstLanding+.05]){
   const shadows=[];gradients.set(ctx,shadows);scene.render(time);const f=scene.getFraming(time),dpr=ctl.canvas.width/scene.width;
   const destination=shadows.some(m=>Math.abs(m.e/dpr-f.stackX)<.01&&Math.abs(m.f/dpr-(f.floorY+2))<.01);
   assert(destination===(time>firstLanding),'no destination shadow before arrival');
  }
  const final=scene.getFraming(scene.duration);
  assert(final.x>=0&&final.x+final.width<=scene.width+.001,'final target fits');
  assert(scene.scenery===sceneryFor(scene.target),'larger object chooses background');
 }
 // Capture the actual drawn small-object bounds immediately before and after landing.
 for(const id of ['grain-of-rice','ant','paperclip','tennis-ball']){
  ctl?.destroy();ctl=createStackAnimation(stage,opts);
  const scene=await ctl.prepare(make(id,1),make('cork',1000000),{hMax:260,minStageH:330});
  const ctx=ctl.canvas.getContext('2d'),originalDraw=ctx.drawImage;
  let draws=[];ctx.drawImage=function(image,...args){if(image instanceof HTMLCanvasElement)draws.push({image,args,m:this.getTransform()});return originalDraw.call(this,image,...args)};
  const land=scene.cues.find(c=>c.name==='tap').t;
  const boxAt=time=>{draws=[];scene.render(time);assert(scene.getFraming(time).x>scene.width,'target is offscreen for continuity check');const draw=draws[0];assert(draw,'unit actually drawn');const [x,y,w,h]=draw.args,m=draw.m,dpr=ctl.canvas.width/scene.width;
   const pts=[[x,y],[x+w,y],[x,y+h],[x+w,y+h]].map(([a,b])=>[(m.a*a+m.c*b+m.e)/dpr,(m.b*a+m.d*b+m.f)/dpr]);
   return {x:(Math.min(...pts.map(p=>p[0]))+Math.max(...pts.map(p=>p[0])))/2,y:(Math.min(...pts.map(p=>p[1]))+Math.max(...pts.map(p=>p[1])))/2};};
  const before=boxAt(land-.0001),after=boxAt(land+.0001);
  assert(Math.hypot(before.x-after.x,before.y-after.y)<2,'small object does not teleport on landing '+id);
  ctx.drawImage=originalDraw;
 }
 ctl?.destroy();ctl=createStackAnimation(stage,{...opts,reduceMotion:true});
 const reduced=await ctl.prepare(make('ant',1),make('door',100),{hMax:260,minStageH:330,guess:{raw:95,answer:100,adjusted:100}});
 let done=0;ctl.start(reduced,{onDone:()=>done++});assert(done===1&&reduced.getShown()===100,'reduced motion static final');
 await preview('dark');assert(ctl.canvas.getContext('2d').getImageData(0,0,1,1).data[0]<50,'dark scenery palette '+ctl.canvas.getContext('2d').getImageData(0,0,1,1).data.join(','));
 await preview('worlds');
 document.getElementById('result').textContent=JSON.stringify({pass:true,width:innerWidth,cases:checks,durationScale:1.2});
}catch(e){document.getElementById('result').textContent=JSON.stringify({pass:false,error:e.stack})}
`;
const fixture='<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&display=swap" rel="stylesheet"><style>body{margin:0;padding:16px 12px;background:#fff8ec;color:#4a2c12;font-family:Fredoka,sans-serif}.wrap{max-width:390px;margin:auto}h2{font-size:22px;margin:6px 0 14px;text-align:center}#stage{border-radius:16px;border:2px solid #dec398;box-sizing:border-box}#caption{font-size:14px;text-align:center;margin-top:12px}</style></head><body><div class="wrap"><h2>Size reveal</h2><div id="stage"></div><div id="caption"></div></div><pre id="result" hidden></pre><script type="module">'+test+'</script></body></html>';
const server=http.createServer((req,res)=>{
 if(req.url==='/test'){res.setHeader('Content-Type','text/html');res.end(fixture);return}
 if(req.url==='/anim/__baseline.js'){res.setHeader('Content-Type','text/javascript');res.end(baseline);return}
 const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 try{res.setHeader('Content-Type',({'.js':'text/javascript','.mjs':'text/javascript','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}catch{res.writeHead(404);res.end()}
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
    for(const mode of ['grass','beach','room','kitchen','tabletop','city','forest','park','farm','snow','desert','underwater','space','enchanted','dark']){
     await call('Runtime.evaluate',{expression:'preview('+JSON.stringify(mode)+')',awaitPromise:true},sessionId);
     const shot=await call('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(path.join(out,mode+'-'+width+'.png'),Buffer.from(shot.data,'base64'));
    }
    await call('Target.closeTarget',{targetId});
   }
  }catch(e){console.error(e);process.exitCode=1}finally{clearTimeout(timer);socket?.close();child.kill();server.close()}
 });
});
