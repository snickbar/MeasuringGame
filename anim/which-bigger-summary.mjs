import { mascotMarkup } from './mascot-poses.mjs';
let preloaded;
export function preloadWbReactionArt(){
  if(typeof Image==='undefined')return Promise.resolve();
  if(!preloaded){const image=new Image();image.src=new URL('../icons/mascot-poses/bigger.webp',import.meta.url).href;preloaded=image.decode().catch(()=>{});}
  return preloaded;
}
export function wbMascotsHtml(correct, variant) {
  return '<div class="wb-result-mascot mp-new-result" aria-hidden="true">'+mascotMarkup('bigger',correct?'win':'lose',{key:String(variant),delay:650})+'</div>';

}
