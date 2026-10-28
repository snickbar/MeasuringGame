import {oceanTemplate} from './high-low-reveal-template.mjs';

export const HL_REVEAL_STEP_MS = 2070;
export const formatOceanNumber = value => value == null ? '—' : new Intl.NumberFormat('en-US', {maximumFractionDigits: 2}).format(value);
export function highLowRevealModel(data) {
 const last=data.hlLast||{}, entries=data.revealOrder||[];
 const playerFor=role=>{const id=Object.keys(data.hlRoles||{}).find(id=>data.hlRoles[id]===role);return entries.find(e=>e.role===role)||(id?{playerId:id,name:data.players?.[id]?.name||'Player'}:null);};
 return {answer:data.currentQuestion?.answer,hi:last.high??null,lo:last.low??null,limit:last.limit||2.5,passed:!!last.passed,saved:!!last.saved,
  high:playerFor('high'),low:playerFor('low'),prompt:data.currentQuestion?.prompt||''};
}

// One instance per room/game/round. Room updates advance the existing scene;
// they never replace an animation with an unrelated score/presence update.
export function mountHighLowReveal(container, data, options={}) {
 let model=highLowRevealModel(data),answer=model.answer>0?model.answer:1,limit=model.limit;
 const root=document.createElement('li');root.className='hl-ocean-reveal';root.dataset.meter='waterline';root.dataset.numberPlacement='meter';root.dataset.answerObject='bottle';root.innerHTML=oceanTemplate;
 const stage=root.querySelector('.oc-stage'),boat=root.querySelector('.oc-boat'),bird=root.querySelector('.oc-bird'),shark=root.querySelector('.oc-shark'),gap=root.querySelector('.rs-gap'),verdict=root.querySelector('[data-verdict]');
 const prompt=document.createElement('span'),exactAnswer=document.createElement('small');exactAnswer.className='hl-exact-answer';exactAnswer.hidden=true;root.querySelector('.rs-question').replaceChildren(prompt,exactAnswer);
 const fmt=formatOceanNumber,reduced=()=>!!options.reducedMotion?.()||matchMedia('(prefers-reduced-motion: reduce)').matches;
 let step=0,busy=true,animations=[],timers=[],raf=0,token=0,p=null,destroyed=false,ready=false,requested=data.revealIndex||0,paused=!!data.paused,previous=-1,settledResult=false;
 function wait(fn,ms){const job={fn,left:ms,at:performance.now(),id:null};const run=()=>{timers=timers.filter(t=>t!==job);if(!destroyed)fn();};job.run=run;if(!paused&&!document.hidden)job.id=setTimeout(run,ms);timers.push(job);return job;}
 function cancel(){token++;for(const t of timers)clearTimeout(t.id);timers=[];cancelAnimationFrame(raf);animations.forEach(a=>a.cancel());animations=[];stage.querySelectorAll('.oc-water-fx').forEach(el=>{el.getAnimations({subtree:true}).forEach(a=>a.cancel());el.remove();});root.querySelectorAll('.splashing').forEach(el=>el.classList.remove('splashing'));}
 function number(el,value){el.textContent=fmt(value);}
 function layout(){
  const c=model,w=stage.clientWidth,h=stage.clientHeight,size=bird.offsetWidth,sea=h*.51;
  const y=v=>Math.max(58,Math.min(h-62,sea-Math.asinh(Math.log(Math.max(answer*1e-6,v??answer)/answer)*3)*h*.215));
  const boatCenter=w*.44,boatLeft=boatCenter-boat.offsetWidth/2,boatRight=boatCenter+boat.offsetWidth/2,meterLeft=w-52,birdCenter=(boatRight+meterLeft)/2,sharkCenter=boatLeft/2;
  p={w,h,size,sea,bx:birdCenter-size/2,sx:sharkCenter-shark.offsetWidth/2,by:y(c.hi)-size/2,sy:y(c.lo)-shark.offsetHeight/2,birdPoint:y(c.hi),sharkPoint:y(c.lo),birdCenter,sharkCenter};
  for(const [el,x,top]of [[bird,p.bx,p.by],[shark,p.sx,p.sy]]){el.style.left=x+'px';el.style.top=top+'px';}
  for(const [role,value]of [['high',c.hi],['low',c.lo]]){
   number(root.querySelector('[data-'+role+']'),value);number(root.querySelector('[data-'+role+'-pick]'),value);number(root.querySelector('[data-meter-'+role+']'),value);
   const info=options.offInfo?.(role,value,answer),ok=value!=null&&(role==='high'?value>=answer:value<=answer),mark=root.querySelector('[data-'+role+'-check]');
   mark.textContent=value==null?'×':ok?'✓':'×';mark.classList.toggle('bad',!ok);root.querySelector('[data-'+role+'-off]').textContent=value==null?'No pick':info?.text||'';
  }
  root.querySelector('.bird-splash').style.left=birdCenter+'px';root.querySelector('.shark-splash').style.left=sharkCenter+'px';root.querySelectorAll('.oc-guide').forEach(g=>g.hidden=true);
  const upper=y(c.lo==null?answer*limit:c.lo*limit),lower=y(c.hi==null?answer/limit:c.hi/limit),green=gap.querySelector('.cw-green');
  green.style.top=(upper-32)+'px';green.style.height=Math.max(0,lower-upper)+'px';
  gap.querySelector('.cw-meter').setAttribute('aria-label','HIGH '+fmt(c.hi)+', LOW '+fmt(c.lo)+'. Correct answer '+fmt(answer)+'. Maximum gap '+fmt(limit)+' times.');
  formatBottleNumbers();
 }
 function resetGap(){gap.dataset.ready='false';gap.classList.remove('bad','crossed');gap.querySelector('.cw-meter').dataset.result='waiting';root.querySelector('[data-ratio]').textContent='—';root.querySelector('[data-gap-status]').textContent='Both picks needed';verdict.replaceChildren();verdict.className='rs-verdict';}
 function revealGap(){
  const c=model,missing=c.hi==null||c.lo==null,crossed=!missing&&c.lo>c.hi,ratio=!missing&&c.lo>0?c.hi/c.lo:Infinity,wide=ratio>limit;
  gap.dataset.ready='true';gap.classList.toggle('bad',!c.passed);gap.classList.toggle('crossed',crossed);gap.querySelector('.cw-meter').dataset.result=c.passed?'won':'lost';
  root.querySelector('[data-ratio]').textContent=missing?'No pick':crossed?'Crossed':Number.isFinite(ratio)?fmt(ratio)+'×':'Too wide';
  root.querySelector('[data-gap-status]').textContent=missing?'Both picks required':crossed?'Picks crossed':wide?'Gap too wide':'Gap fits';
  const meter=gap.querySelector('.cw-meter');meter.setAttribute('aria-valuenow',String(Math.max(1,Math.min(4,ratio))));
  verdict.className='rs-verdict final'+(c.passed||c.saved?'':' bad');
  if(options.verdictHtml)verdict.innerHTML=options.verdictHtml(data);else verdict.textContent=c.passed?'Survived!':c.saved?'Shield saved you!':'Lost a life';
 }

function syncMeterMarks(){
 const bounds=stage.getBoundingClientRect(),positions=[];
 for(const [animal,selector,revealAt]of [[bird,'.cw-high',2],[shark,'.cw-low',3]]){
  const r=animal.getBoundingClientRect(),cy=r.top+r.height/2-bounds.top,visible=step>=revealAt&&Number.isFinite(animal===bird?model.hi:model.lo)&&r.right>bounds.left&&r.left<bounds.right&&cy>=0&&cy<=bounds.height;
  const mark=gap.querySelector(selector);mark.style.top=cy+'px';mark.style.opacity=visible?'1':'0';positions.push({cy,visible});
 }
 if(root.dataset.numberPlacement!=='meter')return;
 const high=gap.querySelector('.cw-number-high'),low=gap.querySelector('.cw-number-low'),diameter=34,pad=8,separation=6;
 let ht=positions[0].cy-diameter-pad,lt=positions[1].cy+pad;
 if(positions[0].visible&&positions[1].visible&&Math.min(ht+diameter,lt+diameter)>Math.max(ht,lt)-separation){
  if(ht<=lt){const overlap=ht+diameter+separation-lt;ht-=overlap/2;lt+=overlap/2;}
  else{const innerHigh=positions[0].cy-diameter-2,innerLow=positions[1].cy+2;if(innerHigh>=innerLow+diameter+separation){ht=innerHigh;lt=innerLow;}else ht=Math.min(ht,lt-diameter-separation);}
 }
 ht=Math.max(4,Math.min(bounds.height-diameter-4,ht));lt=Math.max(4,Math.min(bounds.height-diameter-4,lt));
 for(const [circle,pos,top]of [[high,positions[0],ht],[low,positions[1],lt]]){circle.style.top=top+'px';const fits=circle===high?pos.cy>=diameter+6:pos.cy<=bounds.height-diameter-6;circle.style.opacity=pos.visible&&fits?'1':'0';}
 for(const [selector,cy,top,naturalTop]of [['.cw-link-high',positions[0].cy,ht,positions[0].cy-diameter-pad],['.cw-link-low',positions[1].cy,lt,positions[1].cy+pad]]){
  const link=gap.querySelector(selector),edge=top+diameter/2;link.style.top=Math.min(edge,cy)+'px';link.style.height=Math.max(1,Math.abs(edge-cy))+'px';link.style.opacity=Math.abs(top-naturalTop)>2&&positions[0].visible&&positions[1].visible?'1':'0';
 }
}

function waterEffects(x,cy,surface){
 if(reduced())return;
 const pool=document.createElement('div');pool.className='oc-water-fx';pool.style.left=x+'px';pool.style.top=cy+'px';stage.appendChild(pool);
 const jobs=[];
 if(surface){
  const ring=document.createElement('i');ring.className='fx-ring';pool.appendChild(ring);jobs.push(ring.animate([{opacity:.8,transform:'scale(.2)'},{opacity:0,transform:'scale(1.7)'}],{duration:950,easing:'ease-out'}));
  for(let i=0;i<8;i++){const drop=document.createElement('i');drop.className='fx-drop';pool.appendChild(drop);const dx=(i-3.5)*8,up=25+Math.sin((i+1)*1.6)**2*25;jobs.push(drop.animate([{opacity:0,transform:'translate(0,0) scale(.7)'},{opacity:.9,offset:.15},{opacity:.9,transform:'translate('+dx+'px,'+-up+'px)',offset:.6},{opacity:0,transform:'translate('+(dx*1.2)+'px,18px) scale(.6)'}],{duration:800+i*35,easing:'ease-out'}));}
 }else{
  for(let i=0;i<6;i++){const bubble=document.createElement('i');bubble.className='fx-bubble';pool.appendChild(bubble);const dx=(i%3-1)*12,dy=-Math.min(42+12*i,Math.max(12,cy-p.sea));jobs.push(bubble.animate([{opacity:0,transform:'translate('+dx+'px,12px) scale(.5)'},{opacity:.8,offset:.2},{opacity:0,transform:'translate('+(dx+6)+'px,'+dy+'px) scale(1.15)'}],{duration:1100+i*70,delay:i*55,easing:'ease-out'}));}
 }
 Promise.all(jobs.map(a=>a.finished.catch(()=>{}))).then(()=>pool.remove());
}
function reaction(el,yes){
 const changed=el.classList.contains('is-reacting')!==yes;el.classList.toggle('is-reacting',yes);
 if(changed&&yes&&busy){const splash=root.querySelector(el===bird?'.bird-splash':'.shark-splash');splash.classList.add('splashing');waterEffects(el===bird?p.birdCenter:p.sharkCenter,p.sea,true);}
}
function settleWater(){
 const c=model;if(step===2&&c.hi!=null&&c.hi<answer)waterEffects(p.birdCenter,p.birdPoint,false);
 if(step===3&&c.lo!=null){if(c.lo<=answer)waterEffects(p.sharkCenter,p.sharkPoint,false);else waterEffects(p.sharkCenter,p.sea,true);}
}

function finishPoses(){
 const c=model,finished=step===3&&!busy,won=finished&&model.passed;
 for(const el of [bird,shark]){el.classList.toggle('is-happy',won);el.classList.toggle('is-defeated',finished&&!won);}
}
function fitValue(el,maximum,minimum=11){
 el.style.transform='none';el.style.fontSize=maximum+'px';
 const available=el.parentElement.clientWidth,measure=document.createElement('canvas').getContext('2d');
 let size=maximum;const style=getComputedStyle(el);measure.font=style.fontWeight+' '+maximum+'px '+style.fontFamily;
 const measured=measure.measureText(el.textContent).width;
 if(measured>available)size=Math.max(minimum,Math.floor(maximum*available/measured));
 el.style.fontSize=size+'px';measure.font=style.fontWeight+' '+size+'px '+style.fontFamily;
 const width=measure.measureText(el.textContent).width;
 if(width>available)el.style.transform='scaleX('+Math.max(.8,available/width)+')';
 return width<=available*1.25;
}
function formatBottleNumbers(){
 const c=model;
 const label=root.querySelector('.oc-sail-answer b');label.textContent=fmt(answer);label.setAttribute('aria-label','Correct answer '+fmt(answer));
 const fits=fitValue(label,20);exactAnswer.hidden=fits;exactAnswer.textContent=fits?'':'Exact answer: '+fmt(answer);
 if(!fits){label.textContent=new Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:2}).format(answer);fitValue(label,20);}
 for(const role of ['high','low']){
  const value=c[role==='high'?'hi':'lo'],circle=root.querySelector('[data-meter-'+role+']');
  circle.textContent=value==null?'—':value>=10000?new Intl.NumberFormat('en',{notation:'compact',maximumFractionDigits:1}).format(value):fmt(value);
  circle.parentElement.setAttribute('aria-label',role.toUpperCase()+' pick '+fmt(value));
  const pick=root.querySelector('[data-'+role+'-pick]');pick.setAttribute('aria-label',fmt(value));
  if(!fitValue(pick,22,12)){pick.textContent=new Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:2}).format(value);fitValue(pick,22,12);}
 }
}

 function ui(){
  finishPoses();root.dataset.step=String(step);root.dataset.busy=String(busy);root.dataset.reduced=String(reduced());
  stage.setAttribute('aria-label','Correct answer '+fmt(answer)+(step>=2?'. HIGH pick '+fmt(model.hi):'')+(step>=3?'. LOW pick '+fmt(model.lo):''));
  exactAnswer.style.visibility=step>1||!busy?'visible':'hidden';
  root.querySelector('.rs-high').dataset.revealed=String(step>=2);root.querySelector('.rs-low').dataset.revealed=String(step>=3);
  boat.style.visibility=step>=1?'visible':'hidden';bird.style.visibility=step>=2&&model.hi!=null?'visible':'hidden';shark.style.visibility=step>=3&&model.lo!=null?'visible':'hidden';
  options.onBusyChange?.(busy);
 }
 function showStep(n,animate=true){
  cancel();step=n;busy=animate&&!reduced();layout();resetGap();ui();const c=model,el=n===1?boat:n===2?bird:shark,current=token;
  reaction(bird,step>2&&c.hi!=null&&c.hi<answer);reaction(shark,false);
  function done(){if(current!==token||destroyed)return;cancelAnimationFrame(raf);animations.forEach(a=>a.cancel());animations=[];busy=false;
   if(animate&&!reduced())settleWater();reaction(bird,step>=2&&c.hi!=null&&c.hi<answer);reaction(shark,step>=3&&c.lo!=null&&c.lo>answer);ui();
   if(step===3)revealGap();syncMeterMarks();
   if(step===3&&!settledResult){settledResult=true;options.onResult?.({fresh:animate&&!document.hidden,passed:model.passed,saved:model.saved});}
   options.onSettled?.(n-1);
  }
  if(!busy){done();return;}
  const dx=n===1?p.w+160:n===2?p.w+80-p.bx:-shark.offsetWidth-80-p.sx,dy=n===1?0:n===2?-p.size-100-p.by:p.h+60-p.sy,delay=n===1?100:450,duration=1500;
  const laneY=n===2?28:p.h-shark.offsetHeight-24,top=n===2?p.by:p.sy;
  const frames=n===1?[{transform:'translate('+dx+'px,0)'},{transform:'translate(0,0)'}]:[{transform:'translate('+dx+'px,'+dy+'px)'},{transform:'translate(0,'+(laneY-top)+'px)',offset:.6},{transform:'translate(0,0)'}];
  const a=el.animate(frames,{duration,delay,fill:'backwards',easing:'cubic-bezier(.22,.6,.24,1)'});animations.push(a);syncMeterMarks();
  function watch(){if(current!==token||!busy)return;if(!paused&&!document.hidden){syncMeterMarks();const sea=stage.getBoundingClientRect().top+p.sea;
   if(n===2&&c.hi!=null&&c.hi<answer&&bird.getBoundingClientRect().top+bird.offsetHeight/2>sea+2)reaction(bird,true);
   if(n===3&&c.lo!=null&&c.lo>answer&&shark.getBoundingClientRect().top+shark.offsetHeight/2<sea-2)reaction(shark,true);
  }raf=requestAnimationFrame(watch);}
  raf=requestAnimationFrame(watch);wait(done,delay+duration+120);if(paused||document.hidden)a.pause();
 }
 function pause(value){
  const was=paused;paused=!!value;if(was===paused)return;
  for(const job of timers){if(paused){if(job.id!=null){clearTimeout(job.id);job.left=Math.max(0,job.left-(performance.now()-job.at));job.id=null;}}else{job.at=performance.now();job.id=setTimeout(job.run,job.left);}}
  for(const a of root.getAnimations({subtree:true})){if(paused)a.pause();else if(a.playState==='paused')a.play();}
 }
 function update(next,{animate=true}={}){
  if(destroyed)return;data=next;model=highLowRevealModel(data);answer=model.answer>0?model.answer:1;limit=model.limit;
  const index=Math.max(0,Math.min(2,data.revealIndex||0));requested=index;pause(!!data.paused||document.hidden);
  for(const role of ['high','low']){const card=root.querySelector('.rs-'+role),entry=model[role];card.querySelector('.rs-name').replaceChildren(document.createTextNode(entry?.name||'Player'),card.querySelector('.rs-role'));card.querySelector('.rs-avatar').innerHTML=options.avatarHtml?.(entry?.playerId)||'';}
  prompt.textContent=model.prompt;
  if(!ready||index===previous)return;
  const fresh=animate&&(previous===index-1||previous===-1&&index===0);previous=index;showStep(index+1,fresh);
 }
 container.replaceChildren(root);update(data);
 let width=stage.clientWidth;const resize=new ResizeObserver(()=>{const next=stage.clientWidth;if(next===width||next===0)return;width=next;if(ready&&step){layout();syncMeterMarks();}});resize.observe(stage);
 const visibility=()=>pause(document.hidden||!!data.paused);document.addEventListener('visibilitychange',visibility);
 Promise.all([...root.querySelectorAll('img')].map(img=>img.decode().catch(()=>{}))).then(()=>{if(destroyed)return;ready=true;update(data,{animate:requested===0});});
 return {root,get busy(){return busy;},update,pause,destroy(){destroyed=true;cancel();resize.disconnect();document.removeEventListener('visibilitychange',visibility);root.remove();}};
}
