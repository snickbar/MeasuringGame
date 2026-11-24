// The approved eight-second story uses the same picture coordinates as the
// phone preview. Only the melon and two visitors move; the stack stays in front.
const W=853,H=1846,DURATION=8000;
const stops=[[2400,0,0],[3450,-3,-4],[3650,-3,-4],[4100,1.2,1.8],[4550,-.65,-.8],[4950,.25,.3],[5250,0,0]];
const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
const mix=(a,b,t)=>a+(b-a)*ease(t);
export function watermelonPushPose(time,frontX){
  const t=Math.max(0,Math.min(DURATION,time));let angle=0,dx=0;
  if(t>=2400&&t<5250)for(let i=1;i<stops.length;i++)if(t<=stops[i][0]){
    const a=stops[i-1],b=stops[i],q=(t-a[0])/(b[0]-a[0]);angle=mix(a[1],b[1],q);dx=mix(a[2],b[2],q);break;
  }
  const helper=rear=>{
    const width=rear?140:150,target=frontX+(rear?65:0),start=rear?690:400,arrive=rear?2450:2200;
    const leave=rear?5500:5850,end=rear?7400:7900;
    if(t<start||t>=end)return null;
    const leaving=t>=leave,braced=t>=arrive&&!leaving;
    let x=leaving?mix(target,W+100,(t-leave)/(end-leave)):mix(W+100+(rear?80:0),target,(t-start)/(arrive-start));
    if(braced)x+=dx;
    return{x,y:rear?1378:1374,width,flip:leaving,row:braced?1:0,frame:Math.floor(t/(braced?170:115)+(rear?2:0))%4};
  };
  return{angle,dx,rear:helper(true),front:helper(false)};
}
export function installWatermelonPush(root,home,extras){
  const stage=root.querySelector('.hs-stage'),melon=stage.querySelector('.hs-back'),image=melon.querySelector('img');
  const sheet=extras.get('stories/helper-ants.webp');
  const visitors=[true,false].map(()=>{
    const ant=document.createElement('div');ant.className='hs-melon-helper';ant.hidden=true;
    ant.style.backgroundImage=`url("${sheet.src}")`;stage.appendChild(ant);return ant;
  });
  melon.classList.add('hs-push-melon');
  // Match the hands to the actual right edge of the melon at pushing height,
  // ignoring its transparent padding, exactly as in the approved preview.
  const box={x:W*.24339,y:H*.32101,w:W*.69936};box.h=box.w*1.5;
  const probe=document.createElement('canvas');probe.width=image.naturalWidth;probe.height=image.naturalHeight;
  const ctx=probe.getContext('2d');ctx.drawImage(image,0,0);
  const row=Math.round((1374-150*(.89-.55)-box.y)/box.h*probe.height),pixels=ctx.getImageData(0,row,probe.width,1).data;
  let last=probe.width-1;while(last>0&&pixels[last*4+3]<40)last--;
  const frontX=box.x+last/probe.width*box.w-150*.13;
  let frame=0,start,playing=false,disposed=false;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const active=()=>!disposed&&root.isConnected&&!document.hidden&&home.classList.contains('active')&&document.documentElement.dataset.motion!=='reduce'&&!reduced.matches;
  function render(time){
    const pose=watermelonPushPose(time,frontX);
    melon.style.transform=pose.angle||pose.dx?`translateX(${pose.dx/box.w*100}%) rotate(${pose.angle}deg)`:'';
    [pose.rear,pose.front].forEach((a,i)=>{
      const ant=visitors[i];ant.hidden=!a;if(!a)return;
      ant.style.left=a.x/W*100+'%';ant.style.top=(a.y-a.width*.89)/H*100+'%';ant.style.width=a.width/W*100+'%';
      ant.style.transform=a.flip?'scaleX(-1)':'';ant.style.backgroundPosition=`${a.frame/3*100}% ${a.row*100}%`;
    });
  }
  function reset(){cancelAnimationFrame(frame);frame=0;start=undefined;playing=false;delete root.dataset.melonPushing;render(0);}
  function tick(now){if(!active()){reset();return;}start??=now;const time=now-start;render(time);if(time<DURATION)frame=requestAnimationFrame(tick);else reset();}
  function react(role){
    if(role!==1)return false;
    if(active()&&!playing){playing=true;root.dataset.melonPushing='true';frame=requestAnimationFrame(tick);}
    return true;
  }
  const sync=()=>{if(!active())reset();};
  const observer=new MutationObserver(sync);observer.observe(home,{attributes:true,attributeFilter:['class']});observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-motion']});
  document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);
  render(0);
  return{react,cleanup(){disposed=true;reset();observer.disconnect();document.removeEventListener('visibilitychange',sync);reduced.removeEventListener('change',sync);visitors.forEach(n=>n.remove());}};
}
