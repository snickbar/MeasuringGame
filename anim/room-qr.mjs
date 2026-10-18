const CODE=/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/;
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

export function mountRoomQr({button,input,status,joinButton,scanner,isActive=()=>true,origin=globalThis.location?.origin}){
  let busy=false;
  button.addEventListener('click',async()=>{
    if(busy||joinButton.disabled)return;
    if(!scanner){status.textContent='Scan QR is available in the Android app. You can still enter a room code here.';return;}
    busy=true;button.disabled=true;joinButton.disabled=true;status.textContent='Opening scanner…';
    let code=null;
    try{
      const result=await scanner();
      if(!isActive())return;
      status.textContent='';
      if(!result?.cancelled){code=roomCodeFromQr(result?.value,origin);if(!code)status.textContent='That is not a Size Em Up room QR code. Try again or enter the code.';}
    }catch{if(isActive())status.textContent='Could not open the scanner. On first use it may need a download. Try again, or enter the room code.';}
    finally{busy=false;button.disabled=false;joinButton.disabled=false;}
    if(code&&isActive()){input.value=code;input.dispatchEvent(new Event('input',{bubbles:true}));joinButton.click();}
  });
}
