import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {roomAppIntent} from '../anim/room-qr.mjs';

const html=fs.readFileSync('index.html','utf8');
const start=html.indexOf('  function maybeOfferAppInstall(');
const end=html.indexOf('  function routeDeepLink(',start);
assert(start>0&&end>start);
function offer({native=false,android=true,standalone=false,search='?join=ab2c',duplicate=false}={}){
  const added=[];
  const context={isNativeApp:native,navigator:{userAgent:android?'Android':'Desktop'},window:{matchMedia:()=>({matches:standalone})},location:{search:''},URLSearchParams,roomAppIntent,escapeHtml:s=>s.replaceAll('&','&amp;'),document:{getElementById:()=>duplicate?{}:null,createElement:()=>({addEventListener(){}}),body:{appendChild:el=>added.push(el)}}};
  vm.runInNewContext(html.slice(start,end)+';maybeOfferAppInstall('+JSON.stringify(search)+');',context);
  return added;
}
const [prompt]=offer();
assert(prompt.innerHTML.includes('Open in app'));
assert(prompt.innerHTML.includes(roomAppIntent('AB2C')),'Explicit app button preserves the invite code');
assert(prompt.innerHTML.includes('Keep playing here'));
for(const opts of [{native:true},{android:false},{standalone:true},{search:'?play=daily'},{search:'?join=bad'},{duplicate:true}])assert.equal(offer(opts).length,0);
assert(html.includes('routeDeepLink(search); maybeOfferAppInstall(search);'),'Original search survives address cleanup');
const links=JSON.parse(fs.readFileSync('.well-known/assetlinks.json','utf8'));
const fingerprints=links.find(x=>x.target.package_name==='com.snickbar.sizeemup').target.sha256_cert_fingerprints;
assert(fingerprints.includes('6C:22:F0:4D:62:C8:D6:90:29:6A:6F:B0:5F:1D:E7:2C:3C:00:D0:6D:5B:A6:D3:BD:F4:7A:7F:04:7A:82:36:6A'),'Local APK signing certificate authorized');
assert(fingerprints.includes('65:83:34:E1:50:AF:0B:7C:23:43:C9:2C:CC:C6:93:3F:BE:CA:8F:E4:1D:7C:44:51:80:98:A9:4E:70:79:B0:A6'),'Existing signing certificate retained');
const manifest=fs.readFileSync('android/app/src/main/AndroidManifest.xml','utf8');
assert(/autoVerify="true"[\s\S]*?android:host="size-em-up.web.app"/.test(manifest));
console.log('PASS: App-link certificates, Android browser handoff, room preservation, and native/desktop fallbacks.');
