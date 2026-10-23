import assert from 'node:assert/strict';
import {roomCodeFromQr,mountRoomQr,pendingRoomInvite,roomAppIntent} from '../anim/room-qr.mjs';

for(const value of ['ab2c',' AB2C ','https://size-em-up.web.app/?join=ab2c','https://size-em-up.firebaseapp.com/index.html?join=AB2C','http://192.168.1.173:4180/?join=AB2C'])
  assert.equal(roomCodeFromQr(value,'http://192.168.1.173:4180'),'AB2C');
assert.equal(roomCodeFromQr('http://192.168.1.173:4180/?join=AB2C','https://localhost'),'AB2C','Android can scan a local browser host invite without opening its URL');
for(const value of [null,'','1234','ABIC','AB2CC','https://example.com/?join=AB2C','javascript:alert(1)','https://size-em-up.web.app.evil.test/?join=AB2C','https://user@size-em-up.web.app/?join=AB2C','https://size-em-up.web.app/?join=AB2C&join=DE3F','https://size-em-up.web.app/?join=%3Csvg%3E','x'.repeat(2049)])
  assert.equal(roomCodeFromQr(value),null,'Reject '+String(value).slice(0,70));
const intent=roomAppIntent('ab2c');
assert(intent.startsWith('intent://size-em-up.web.app/?join=AB2C#Intent;scheme=https;package=com.snickbar.sizeemup;'));
assert(intent.endsWith('S.browser_fallback_url='+encodeURIComponent('https://size-em-up.web.app/?join=AB2C')+';end'));
for(const code of [null,'','AB2C;end','<svg>','1234'])assert.equal(roomAppIntent(code),null);
class Button extends EventTarget {disabled=false;click(){if(!this.disabled)this.dispatchEvent(new Event('click'));}}
const turn=()=>new Promise(resolve=>setImmediate(resolve));
function setup(scanner,isActive=()=>true,extra={}){
  const button=new Button(),joinButton=new Button(),input=new EventTarget(),status={textContent:''};input.value='OLD2';let joins=0,changes=0;
  joinButton.addEventListener('click',()=>joins++);input.addEventListener('input',()=>changes++);
  mountRoomQr({button,input,status,joinButton,scanner,isActive,...extra});return {button,input,status,joinButton,joins:()=>joins,changes:()=>changes};
}
const success=setup(async()=>({value:'https://size-em-up.web.app/?join=AB2C'}));success.button.click();await turn();assert.equal(success.input.value,'AB2C');assert.equal(success.joins(),1);assert.equal(success.changes(),1);assert(!success.button.disabled&&!success.joinButton.disabled);
for(const scanner of [async()=>({cancelled:true}),async()=>({value:'not our QR'}),async()=>{throw Error('module unavailable')}]){
  const ui=setup(scanner);ui.button.click();await turn();assert.equal(ui.input.value,'OLD2');assert.equal(ui.joins(),0);assert(!ui.button.disabled&&!ui.joinButton.disabled);
}
let scans=0,resolveScan;const busy=setup(()=>{scans++;return new Promise(r=>resolveScan=r)});busy.button.click();busy.button.click();assert.equal(scans,1);assert(busy.joinButton.disabled);resolveScan({cancelled:true});await turn();assert(!busy.joinButton.disabled);
const navigated=setup(async()=>({value:'AB2C'}),()=>false);navigated.button.click();await turn();assert.equal(navigated.joins(),0);
{ // the app drifted off the Join screen while the camera was open: restore it and still use the scanned code
  let active=false,restored=0,started=0,ended=0;
  const ui=setup(async()=>({value:'https://size-em-up.web.app/?join=AB2C'}),()=>active,{restore:()=>{restored++;active=true;},onScanStart:()=>started++,onScanEnd:()=>ended++});
  ui.button.click();await turn();assert.equal(restored,1);assert.equal(ui.input.value,'AB2C');assert.equal(ui.joins(),1);assert.equal(started,1);assert.equal(ended,1);
  let a2=false,r2=0;const c=setup(async()=>({cancelled:true}),()=>a2,{restore:()=>{r2++;}});c.button.click();await turn();assert.equal(r2,0,'a cancelled scan never navigates');
}
const browser=setup(null);browser.button.click();assert(browser.status.textContent.includes('Android app'));assert.equal(browser.joins(),0);assert.equal(browser.input.value,'OLD2');
{
 let at=1000;const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 const pending=pendingRoomInvite({storage,now:()=>at});pending.beginScan();assert.equal(pending.read().stage,'scanning','Interrupted scan can reopen Join');
 pending.remember('AB2C');const restored=pendingRoomInvite({storage,now:()=>at});assert.equal(restored.read().code,'AB2C','Room survives a WebView reload');
 at+=600001;assert.equal(restored.read(),null,'Stale invite cannot hijack a future launch');pending.remember('javascript:alert(1)');assert.equal(pending.read(),null);
 pending.remember('AB2C');pending.clear();assert.equal(pending.read(),null,'Explicit cancellation clears saved invite');
 const inaccessible=pendingRoomInvite({storage:{getItem(){throw Error('blocked')},setItem(){throw Error('blocked')},removeItem(){throw Error('blocked')}}});inaccessible.beginScan();inaccessible.remember('AB2C');assert.equal(inaccessible.read(),null,'Unavailable storage does not break scanning');
 let resume;const events=[],handoff=new Promise(resolve=>resume=resolve),ui=setup(async()=>({value:'AB2C'}),()=>true,{pending,waitForResume:()=>handoff,onCode:async code=>events.push(code)});
 ui.button.click();await turn();assert.equal(pending.read().code,'AB2C');assert.deepEqual(events,[],'Waits for foreground');assert(ui.button.disabled);resume();await turn();assert.deepEqual(events,['AB2C']);assert.equal(ui.joins(),0,'Native result uses direct join callback, not hidden button click');
}
console.log('PASS: QR invite validation, valid scan to Join Game, cancel/failure recovery, duplicate taps, navigation cancellation, manual-entry preservation and browser fallback.');
