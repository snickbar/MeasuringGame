const CODE=/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/;
// Explicit package handoff also works when a messaging app has opened its own browser.
// Keep the HTTPS invite as the fallback, including the room code.
export function roomAppIntent(code){
  if(typeof code!=='string'||!CODE.test(code.toUpperCase()))return null;
  const invite=`https://size-em-up.web.app/?join=${code.toUpperCase()}`;
  return `intent://size-em-up.web.app/?join=${code.toUpperCase()}#Intent;scheme=https;package=com.snickbar.sizeemup;S.browser_fallback_url=${encodeURIComponent(invite)};end`;
}
// Read only our invite's room code. Never navigate to a scanned URL.
export function roomCodeFromQr(value,origin=globalThis.location?.origin){
  if(typeof value!=='string'||value.length>2048)return null;
  const raw=value.trim();if(CODE.test(raw.toUpperCase()))return raw.toUpperCase();
  try{
    const url=new URL(raw);
    if(!['http:','https:'].includes(url.protocol)||url.username||url.password)return null;
    const octets=url.hostname.split('.').map(Number);
    const lan=octets.length===4&&octets.every(n=>Number.isInteger(n)&&n>=0&&n<=255)&&(octets[0]===10||octets[0]===127||(octets[0]===192&&octets[1]===168)||(octets[0]===172&&octets[1]>=16&&octets[1]<=31));
    if(!['size-em-up.web.app','size-em-up.firebaseapp.com','localhost','[::1]'].includes(url.hostname)&&url.origin!==origin&&!lan)return null;
    const codes=url.searchParams.getAll('join');if(codes.length!==1)return null;
    const code=codes[0].toUpperCase();return CODE.test(code)?code:null;
  }catch{return null;}
}

export function pendingRoomInvite({storage,now=()=>Date.now()}={}){
  if(!storage)try{storage=globalThis.localStorage;}catch{}
  const key='size-em-up:pending-room-invite',clear=()=>{try{storage?.removeItem(key);}catch{}};
  const save=(stage,code=null)=>{try{storage?.setItem(key,JSON.stringify({stage,code,at:now()}));}catch{}};
  return {clear,beginScan:()=>save('scanning'),remember:value=>{const code=roomCodeFromQr(value);if(code)save('code',code);},
    read(){try{const v=JSON.parse(storage?.getItem(key)||'null');if(!v)return null;const age=now()-v.at,code=roomCodeFromQr(v.code);if(age<0||age>600000||!Number.isFinite(v.at)||!['scanning','code'].includes(v.stage)||(v.stage==='code'&&!code)){clear();return null;}return {...v,code};}catch{clear();return null;}}};
}

export function nativeRoomScanner({plugin,pending}){
  async function accept(result){
    const code=roomCodeFromQr(result?.value);
    // Save into web storage before acknowledging the native backup. Old APKs
    // have no backup methods and continue to use their normal scan result.
    if(code)pending.remember(code);
    if(result?.id&&(!code||pending.read()?.code===code))try{await plugin.clearPendingResult({id:result.id});}catch{}
    return code;
  }
  return {
    async scan(){const result=await plugin.scan();await accept(result);return result;},
    async recover(){try{return await accept(await plugin.getPendingResult());}catch{return null;}}
  };
}

export function mountRoomQr({button,input,status,joinButton,scanner,isActive=()=>true,restore=null,onScanStart=()=>{},onScanEnd=()=>{},onCode=null,waitForResume=async()=>{},pending=null,origin=globalThis.location?.origin}){
  let busy=false;
  button.addEventListener('click',async()=>{
    if(busy||joinButton.disabled)return;
    if(!scanner){status.textContent='Scan QR is available in the Android app. You can still enter a room code here.';return;}
    busy=true;button.disabled=true;joinButton.disabled=true;status.textContent='Opening scanner…';
    let code=null;pending?.beginScan();onScanStart();
    try{
      const result=await scanner();
      // If the app drifted off the Join screen while the camera was open (e.g. a stray Back on first use),
      // bring the player back to it rather than dropping the scanned code.
      if(!isActive()&&!(restore&&result&&!result.cancelled))return;
      status.textContent='';
      if(!result?.cancelled){code=roomCodeFromQr(result?.value,origin);if(!code)status.textContent='That is not a Size Em Up room QR code. Try again or enter the code.';}
      if(code){
        pending?.remember(code);
        input.value=code;
        status.textContent=`Scanned ${code}. Opening room…`;
        // The native result can arrive before Android resumes our Activity.
        // Hand off only when its foreground screen is ready, not via a hidden button.
        await waitForResume();
        if(restore)restore();
        if(isActive()){
          input.value=code;input.dispatchEvent(new Event('input',{bubbles:true}));
          if(onCode)await onCode(code);
          else{joinButton.disabled=false;joinButton.click();}
        }
      }
    }catch{if(isActive())status.textContent='Could not open the scanner. On first use it may need a download. Try again, or enter the room code.';}
    finally{if(!code)pending?.clear();busy=false;button.disabled=false;joinButton.disabled=false;onScanEnd();}
  });
}
