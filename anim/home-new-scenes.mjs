import { NEW_HOME_SPRITES } from './home-new-art.mjs';
import { artCell } from './home-layer-art.mjs';
const canvas={sw:704,sh:1520};
function cell(extras,name,index,box,cls){const art=NEW_HOME_SPRITES[name];return artCell(extras.get(art.file),art.cells[index],box,canvas,cls);}
function sparks(parent,box){
 const source=document.createElement('div');source.className='nh-magic';source.style.cssText=`left:${box[0]/704*100}%;top:${box[1]/1520*100}%;width:${box[2]/704*100}%;height:${box[3]/1520*100}%`;
 for(let i=0;i<6;i++){const spark=document.createElement('i');spark.style.cssText=`--i:${i};--drift:${(i-2.5)*18}px`;source.appendChild(spark);}parent.appendChild(source);
}
export function decorateNewHomeProp(scene,{hop,img,extras}){
 if(!['make-believe','holiday-mix'].includes(scene))return null;
 img.hidden=true;img.style.display='none';
 if(scene==='make-believe'){
  hop.appendChild(cell(extras,'books-make-believe',0,[380,720,270,435],'nh-book-stack'));
  const book=document.createElement('div');book.className='hs-detail nh-book';
  book.append(cell(extras,'books-make-believe',1,[390,615,250,168],'nh-book-closed'),cell(extras,'books-make-believe',2,[385,595,265,188],'nh-book-open'));
  hop.appendChild(book);sparks(hop,[445,595,145,95]);return {top:book};
 }
 hop.appendChild(cell(extras,'gifts-holiday-mix',0,[410,550,190,605],'nh-gift-stack'));
 const lid=cell(extras,'gifts-holiday-mix',1,[410,449,190,143],'nh-gift-lid');hop.appendChild(lid);
 sparks(hop,[435,480,145,80]);return {top:lid};
}
export function decorateNewHomeHero(scene,{hop,img,extras}){
 if(!['make-believe','holiday-mix'].includes(scene))return null;
 img.hidden=true;img.style.display='none';
 if(scene==='make-believe'){
  const tail=cell(extras,'hero-make-believe',1,[15,880,165,255],'nh-unicorn-tail');
  const body=cell(extras,'hero-make-believe',0,[105,690,285,460],'nh-unicorn-body');
  const ear=cell(extras,'hero-make-believe',2,[194,744,58,88],'nh-unicorn-ear');
  hop.append(tail,body,ear);return {};
 }
 const body=cell(extras,'hero-holiday-mix',0,[40,565,365,590],'nh-snowman');hop.appendChild(body);return {};
}
