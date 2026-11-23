// Exercise the real loader so calculated image names and comparison scenes are retained too.
import path from 'node:path';
export async function collectSceneAssets(){
  const requested=new Set(),original=globalThis.Image;
  globalThis.Image=class{set src(value){this._src=value;requested.add(path.posix.normalize(value));queueMicrotask(()=>this.onload?.());}get src(){return this._src;}};
  try{const {SETTINGS,loadScenery}=await import('../anim/scenery.mjs');for(const scene of Object.keys(SETTINGS))await loadScenery({sceneryOverride:scene},'anim/scenery/');return{scenes:Object.keys(SETTINGS),files:[...requested].sort()};}
  finally{if(original===undefined)delete globalThis.Image;else globalThis.Image=original;}
}
