import {diffPaths} from './profile-diff.mjs';

// A tiny version field is validated by Realtime Database rules in the SAME
// atomic update as the balance, receipts and unlocks. A stale writer retries
// its original transformation against the winning writer's fresh profile.
export const profileVersion = p => Number.isSafeInteger(p?._writeVersion) ? p._writeVersion : 0;
export async function writeProfile({read,write,change,allowCreate=false,maxAttempts=8}) {
  for(let attempt=0;attempt<maxAttempts;attempt++){
    const before=await read();
    if(!before&&!allowCreate)throw Error('Profile not ready');
    const after=change(before?structuredClone(before):null);
    if(after==null)return {committed:false,snapshot:{val:()=>before}};
    const patch=diffPaths(before,after);
    delete patch._writeVersion;
    if(!Object.keys(patch).length)return {committed:true,snapshot:{val:()=>before}};
    const version=profileVersion(before);
    patch._writeVersion=version+1;
    try{
      await write(patch);
      return {committed:true,snapshot:{val:()=>({...after,_writeVersion:version+1})}};
    }catch(error){
      if(!/permission[-_ ]denied/i.test(String(error?.code||error?.message||error)))throw error;
      // A real permission failure must surface immediately, rather than being
      // mistaken for contention and leaving the UI waiting through retries.
      if(profileVersion(await read())===version)throw error;
      if(attempt===maxAttempts-1)throw Error('Profile changed repeatedly. Please try again.');
    }
  }
}
