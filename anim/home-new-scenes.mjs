import { NEW_HOME_SPRITES } from './home-new-art.mjs';
import { artCell } from './home-layer-art.mjs';
const canvas={sw:704,sh:1520};
function cell(extras,name,index,box,cls){const art=NEW_HOME_SPRITES[name];return artCell(extras.get(art.file),art.cells[index],box,canvas,cls);}
function box(cls,rect){const el=document.createElement('div');el.className=cls;if(rect)el.style.cssText=`left:${rect[0]/704*100}%;top:${rect[1]/1520*100}%;width:${rect[2]/704*100}%;height:${rect[3]/1520*100}%`;return el;}
function bookTexture(extras,index,cls){const art=NEW_HOME_SPRITES['spellbook-textures-v2'];return artCell(extras.get(art.file),art.cells[index],[0,0,250,160],{sw:250,sh:160},cls);}
function hingedBook(extras){
 const camera=box('nh-book-camera',[390,630,250,160]),solid=box('nh-book-solid');camera.appendChild(solid);
 solid.appendChild(bookTexture(extras,1,'nh-book-paper'));
 solid.appendChild(bookTexture(extras,0,'nh-book-bottom'));
 for(const side of ['front','right','left','back'])solid.appendChild(box('nh-page-edge nh-page-edge-'+side));
 solid.appendChild(box('nh-spine-binding'));
 for(let i=0;i<3;i++){const leaf=box('nh-book-leaf');leaf.style.setProperty('--leaf',i);leaf.appendChild(box('nh-leaf-paper'));solid.appendChild(leaf);}
 const hinge=box('nh-cover-hinge');hinge.append(bookTexture(extras,0,'nh-cover-front'),bookTexture(extras,1,'nh-cover-inside'));solid.appendChild(hinge);
 return camera;
}
export function decorateNewHomeBackground(scene,stage,extras){if(scene==='holiday-mix')stage.appendChild(cell(extras,'holiday-rainbow-v2',0,[25,440,655,245],'nh-rainbow'));}
export function makeHomeFairy(extras){
 const body=document.createElement('div');body.className='nh-fairy';body.style.aspectRatio='800/800';
 const art=NEW_HOME_SPRITES['fairy-parts-v2'],im=extras.get(art.file),spec={sw:800,sh:800};
 body.append(artCell(im,art.cells[2],[110,135,390,480],spec,'nh-fairy-wing nh-fairy-wing-far'),artCell(im,art.cells[1],[70,70,440,600],spec,'nh-fairy-wing nh-fairy-wing-near'),artCell(im,art.cells[0],[210,110,590,630],spec,'nh-fairy-body'));return body;
}
function sparks(parent,box){
 const source=document.createElement('div');source.className='nh-magic';source.style.cssText=`left:${box[0]/704*100}%;top:${box[1]/1520*100}%;width:${box[2]/704*100}%;height:${box[3]/1520*100}%`;
 for(let i=0;i<12;i++){const spark=document.createElement('i');spark.style.cssText=`--i:${i};--spark-x:${30+i%4*13}%;--spark-size:${6+i%3*2}px;--drift:${(i%7-3)*13}px;--lift:${80+i%4*13}px;--spark-color:${['#fff3a5','#bdf9ff','#ffc8f5'][i%3]}`;source.appendChild(spark);}parent.appendChild(source);
}
export function decorateNewHomeProp(scene,{hop,img,extras}){
 if(!['make-believe','holiday-mix'].includes(scene))return null;
 img.hidden=true;img.style.display='none';
 if(scene==='make-believe'){
  hop.appendChild(cell(extras,'books-make-believe',0,[380,720,270,435],'nh-book-stack'));
  const book=hingedBook(extras);
  hop.appendChild(book);sparks(hop,[435,500,175,200]);return {top:book};
 }
 // Back rim -> contents -> stationary front rim/walls. Only the fixed wall is
 // masked; no moving artwork is cut from the assembled stack.
 hop.appendChild(cell(extras,'gifts-holiday-mix',0,[410,550,190,605],'nh-gift-stack'));
 hop.appendChild(cell(extras,'gift-turkey-v2',0,[443,590,125,135],'nh-turkey'));
 hop.appendChild(cell(extras,'gifts-holiday-mix',0,[410,550,190,605],'nh-gift-front'));
 const lid=cell(extras,'gift-lid-v2',0,[410,437,190,155],'nh-gift-lid');hop.appendChild(lid);
 sparks(hop,[435,480,145,80]);return {top:lid};
}
export function decorateNewHomeHero(scene,{hop,img,extras}){
 if(!['make-believe','holiday-mix'].includes(scene))return null;
 img.hidden=true;img.style.display='none';
 if(scene==='make-believe'){
  const tail=cell(extras,'unicorn-tail-v3',2,[0,845,175,265],'nh-unicorn-tail');
  const body=cell(extras,'unicorn-tail-v3',0,[80,717,320,438],'nh-unicorn-body');
  const wink=cell(extras,'unicorn-tail-v3',1,[80,717,320,438],'nh-unicorn-wink');
  hop.append(tail,body,wink);return {};
 }
 const left=cell(extras,'snowman-parts-v2',1,[0,790,130,135],'nh-snow-arm nh-snow-arm-left');
 const right=cell(extras,'snowman-parts-v2',2,[305,790,140,135],'nh-snow-arm nh-snow-arm-right');
 const body=cell(extras,'snowman-parts-v2',0,[50,565,350,590],'nh-snowman');hop.append(left,right,body);return {};
}
