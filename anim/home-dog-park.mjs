import {installMovingHomeTaps} from './home-moving-taps.mjs';
export function installDogPark(root,home,extras,onTap){
  const stage=root.querySelector('.hs-stage'),route=document.createElement('div');
  route.className='hs-route hs-bidirectional hs-park-chase-route';route.style.cssText='--cs:22s;--cd:2s';
  const dog=document.createElement('div');dog.className='hs-park-dog-target';
  const dogBody=document.createElement('div');dogBody.className='hs-park-dog-body';
  const sprite=document.createElement('span');sprite.className='hs-park-dog-sprite';
  const strip=document.createElement('i');strip.className='hs-park-dog-strip';strip.style.backgroundImage=`url("${extras.get('stories/park-dog-run.webp').src}")`;sprite.appendChild(strip);
  dogBody.appendChild(sprite);dog.appendChild(dogBody);route.appendChild(dog);
  const disc=document.createElement('div');disc.className='hs-park-disc-target';
  const discBody=document.createElement('div');discBody.className='hs-park-disc-body';
  const image=extras.get('../../items/frisbee.webp').cloneNode();image.alt='';image.draggable=false;image.style.cssText='width:100%;height:100%';const squash=document.createElement('span');squash.className='hs-park-disc-squash';squash.appendChild(image);discBody.appendChild(squash);disc.appendChild(discBody);route.appendChild(disc);
  stage.insertBefore(route,stage.querySelector('.hs-layer'));
  const stop=installMovingHomeTaps(root,home,onTap,[
    {selector:'.hs-park-dog-target',body:'.hs-park-dog-body',subject:'park-dog',label:'Make the running dog jump',bounds:[.06,.18,.88,.7],speedSelector:'.hs-park-dog-strip',speed:1.5,keyframes:[0,-10,0,-4,0].map(y=>({transform:`translateY(${y}px)`,easing:'ease-in-out'})),duration:1200},
    {selector:'.hs-park-disc-target',body:'.hs-park-disc-body',subject:'park-frisbee',label:'Make the frisbee twirl',bounds:[0,0,1,1],speedSelector:'.hs-park-disc-body img',speed:3,keyframes:[['0px',0],['-7px',120],['-4px',250],['0px',360]].map(([y,a])=>({transform:`translateY(${y}) rotate(${a}deg)`,easing:'ease-in-out'})),duration:1100},
    {selector:'.hs-route[data-critter-index="0"]',subject:'park-butterfly',label:'Make the butterfly flutter',bounds:[96/1312,68/1199,1162/1312,1073/1199],bug:true},
    {selector:'.hs-route[data-critter-index="1"]',subject:'park-leaf',label:'Make the drifting leaf twirl',bounds:[433/1536,156/1024,700/1536,637/1024],keyframes:[0,35,-20,10,0].map(a=>({transform:`rotate(${a}deg)`,easing:'ease-in-out'})),duration:1200},
  ]);
  return()=>{stop();route.remove();};
}
