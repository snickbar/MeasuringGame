import {artCell} from './home-layer-art.mjs';
import {installMovingHomeTaps} from './home-moving-taps.mjs';
// Fit separate transparent props to their visible bounds. The sheet's padding
// must not move a hinge or leave a windsock floating away from its pole.
function cells(image){
  const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
  const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);const {data}=ctx.getImageData(0,0,canvas.width,canvas.height),cw=canvas.width/3,ch=canvas.height/2;
  return Array.from({length:6},(_,i)=>{const x0=Math.round(i%3*cw),y0=Math.round(Math.floor(i/3)*ch),x1=Math.round((i%3+1)*cw),y1=Math.round((Math.floor(i/3)+1)*ch);let l=x1,t=y1,r=x0,b=y0;
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(data[(y*canvas.width+x)*4+3]>(i===5?16:160)){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);}
    l=Math.max(x0,l-3);t=Math.max(y0,t-3);r=Math.min(x1-1,r+3);b=Math.min(y1-1,b+3);return[l,t,r-l+1,b-t+1];
  });
}
export function installLaunchSite(root,home,extras,onTap){
  const stage=root.querySelector('.hs-stage'),sheet=extras.get('stories/launch-props.webp'),crops=cells(sheet),added=[];
  const make=(parent,index,cls,x,y,width)=>{
    const crop=crops[index],node=document.createElement('div');node.className=cls;node.style.cssText=`left:${x}%;top:${y}%;width:${width}%;aspect-ratio:${crop[2]}/${crop[3]}`;
    const body=document.createElement('div');body.className='hs-launch-body';body.appendChild(artCell(sheet,crop,[0,0,crop[2],crop[3]],{sw:crop[2],sh:crop[3]},'hs-launch-prop'));
    node.appendChild(body);parent.appendChild(node);return node;
  };
  const background=document.createElement('div');background.className='hs-launch-background';stage.insertBefore(background,stage.querySelector('.hs-layer'));added.push(background);
  make(background,1,'hs-launch-arm',13,40.1,15);
  make(background,2,'hs-launch-pole',81,43.5,6);
  make(background,3,'hs-launch-windsock',83.3,43.4,8.5);
  const route=document.createElement('div');route.className='hs-route hs-bidirectional hs-launch-cart-route';route.style.cssText='--cs:26s;--cd:2s';background.appendChild(route);
  make(route,0,'hs-launch-cart',-23,55,16);
  const consoleNode=make(stage,4,'hs-launch-console',1,72,17);added.push(consoleNode);
  ['#ff4b26','#ffcf28','#75e432'].forEach((color,i)=>{const light=document.createElement('i');light.className='hs-launch-indicator';light.style.cssText=`--lamp-color:${color};--lamp-delay:${i*.7}s;left:${38+i*14}%`;consoleNode.querySelector('.hs-launch-body').appendChild(light);});
  const vapor=make(stage,5,'hs-launch-vapor',23,77,20);added.push(vapor);
  const defs=[
    {selector:'.hs-launch-arm',body:'.hs-launch-body',subject:'gantry-arm',label:'Move the service arm',bounds:[0,0,1,1],origin:'18% 62%',keyframes:[0,-12,-12,2,0].map(a=>({transform:`rotate(${a}deg)`,easing:'ease-in-out'})),duration:1800},
    {selector:'.hs-launch-windsock',body:'.hs-launch-body',subject:'windsock',label:'Flutter the windsock',bounds:[0,0,1,1],origin:'0% 50%',speedSelector:'.hs-launch-prop',speed:2.5,keyframes:[0,-7,6,-4,2,0].map(a=>({transform:`rotate(${a}deg)`,easing:'ease-in-out'})),duration:1500},
    {selector:'.hs-launch-cart',body:'.hs-launch-body',subject:'maintenance-cart',label:'Bounce the maintenance cart',bounds:[0,0,1,1],keyframes:[0,-4,1,-2,0].map(y=>({transform:`translateY(${y}px)`,easing:'ease-in-out'})),duration:1100},
    {selector:'.hs-launch-console',body:'.hs-launch-body',subject:'launch-panel',label:'Light up the control panel',bounds:[0,0,1,1],speedSelector:'.hs-launch-indicator',speed:4,keyframes:[0,-1,1,0].map(a=>({transform:`rotate(${a}deg)`,easing:'ease-in-out'})),duration:1600},
    {selector:'.hs-route[data-critter-index="0"]',subject:'launch-balloon',label:'Bob the hot-air balloon',bounds:[109/1024,81/1536,805/1024,1388/1536]},
    {selector:'.hs-route[data-critter-index="1"]',subject:'launch-bird',label:'Make the bird flap',bounds:[103/1536,49/1024,1389/1536,902/1024]},
    {selector:'.hs-cycle-route',body:'.hs-cycle-travel',subject:'maintenance-robot',label:'Make the maintenance robot bounce',bounds:[.12,.06,.76,.87],speedSelector:'.hs-cycle-thigh,.hs-cycle-shin,.hs-cycle-crank',speed:1.5},
  ];
  const stop=installMovingHomeTaps(root,home,onTap,defs);
  return()=>{stop();added.forEach(n=>n.remove());};
}
