import { artCell } from './home-layer-art.mjs';

// Small details share the scene's existing pause, reduced-motion and disposal
// lifecycle. They never synthesize taps, play sounds or move a hit area.
export function decorateHomeIdle(root, scene, extras, tools) {
  const stage=root.querySelector('.hs-stage'),hero=root.querySelector('.hs-front>.hs-hop'),prop=root.querySelector('.hs-back>.hs-hop');
  const background=document.createElement('div');background.className='hs-ambient-background';
  stage.insertBefore(background,stage.querySelector('.hs-layer'));
  const detail=(owner,cls,rect,spec={sw:704,sh:1520})=>{
    const el=document.createElement('span');el.className='hs-idle-detail '+cls;
    const [x,y,w,h]=rect;el.style.cssText=`left:${x/spec.sw*100}%;top:${y/spec.sh*100}%;width:${w/spec.sw*100}%;height:${h/spec.sh*100}%`;
    owner.appendChild(el);return el;
  };
  if(scene==='house'){
    const sheet=extras.get('idle/kitchen-utensils.webp');
    // Hanging holes sit on the three pegs of the cleaned background plate.
    tools.forEach((crop,i)=>{
      const h=179,w=crop[2]/crop[3]*h,position=[[471,565,622][i]-w/2,513,w,h];
      const utensil=artCell(sheet,crop,position,{sw:704,sh:1520},'hs-utensil');
      utensil.style.setProperty('--utensil-delay',i*.32+'s');background.appendChild(utensil);
    });
  }
  if(scene==='sunflower'){
    const pollen=detail(prop,'hs-pollen',[430,370,1,1],{sw:853,sh:1843});
    for(let i=0;i<6;i++){const dot=document.createElement('i');dot.style.cssText=`--pollen-x:${(i-2.5)*7}px;--pollen-y:${-10-i%3*6}px;--pollen-delay:${i*.07}s`;pollen.appendChild(dot);}
  }
  if(scene==='wheels'){
    [[267,1763,64,33],[393,1800,68,33],[526,1763,64,33]].forEach((rect,i)=>{
      const glow=detail(hero,'hs-engine-glow',rect,{sw:853,sh:1843});glow.style.setProperty('--engine-delay',i*.38+'s');
    });
  }
  if(scene==='lighthouse'){
    const wave=detail(background,'hs-shore-wave',[0,1010,704,25]);
    wave.innerHTML='<svg viewBox="0 0 704 25" aria-hidden="true"><path d="M-20 12 Q100 0 230 12 T490 12 T750 12"/></svg>';
  }
  if(scene==='underwater'){
    for(const [i,rect] of [[0,[-15,1210,145,190]],[1,[610,1190,125,190]]]){
      const weed=detail(background,'hs-seaweed',rect);weed.style.setProperty('--weed-delay',i*3.7+'s');
      weed.innerHTML='<svg viewBox="0 0 100 150" aria-hidden="true"><g fill="#56a965" stroke="#2c7b61" stroke-width="2" stroke-linejoin="round"><path d="M47 149 C18 114 44 104 21 67 C54 86 38 112 51 139 C53 100 35 76 57 13 C52 80 72 100 55 149Z"/><path d="M53 149 C77 117 55 94 82 61 C76 103 92 124 58 149Z"/></g></svg>';
    }
  }
  if(scene==='penguin'){
    const breath=detail(hero,'hs-cold-breath',[710,415,130,65],{sw:853,sh:1843});
    for(let i=0;i<3;i++){const puff=document.createElement('i');puff.style.setProperty('--puff',i);breath.appendChild(puff);}
  }
  if(scene==='space')detail(background,'hs-shooting-star',[540,410,130,3]);
  if(!background.childElementCount)background.remove();
}
