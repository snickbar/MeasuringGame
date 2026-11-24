import {installMovingHomeTaps} from './home-moving-taps.mjs';
export function installTownHome(root,home,extras,onTap){
  const stage=root.querySelector('.hs-stage'),image=extras.get('stories/mail-van.webp');
  const route=document.createElement('div');route.className='hs-route hs-bidirectional hs-town-van-route';route.style.cssText='--cs:28s;--cd:2s';
  const track=document.createElement('div');track.className='hs-town-van-track';
  const body=document.createElement('div');body.className='hs-town-van-body';body.style.aspectRatio=image.naturalWidth+'/'+image.naturalHeight;
  const sprite=image.cloneNode();sprite.alt='';sprite.draggable=false;body.appendChild(sprite);track.appendChild(body);route.appendChild(track);
  stage.insertBefore(route,stage.querySelector('.hs-layer'));
  const stop=installMovingHomeTaps(root,home,onTap,[
    {selector:'.hs-route[data-critter-index="0"]',subject:'pigeon',label:'Make the pigeon hop',bounds:[203/1374,74/1145,959/1374,1001/1145],keyframes:[0,-9,0,-5,0].map(y=>({transform:`translateY(${y}px)`,easing:'ease-in-out'})),duration:1100},
    {selector:'.hs-route[data-critter-index="1"]',subject:'bluebird',label:'Make the bird flutter',bounds:[224/1402,132/1122,996/1402,865/1122],spriteFrames:true},
    {selector:'.hs-town-van-route',body:'.hs-town-van-body',subject:'mail-van',label:'Make the mail van bounce',bounds:[.04,.08,.92,.86],keyframes:[['0px',0],['-4px',-3],['1px',2],['-2px',-1],['0px',0]].map(([y,a])=>({transform:`translateY(${y}) rotate(${a}deg)`,easing:'ease-in-out'})),duration:1100},
  ]);
  return()=>{stop();route.remove();};
}
