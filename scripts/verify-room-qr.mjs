import assert from 'node:assert/strict';
import {roomCodeFromQr,mountRoomQr} from '../anim/room-qr.mjs';

for(const value of ['ab2c',' AB2C ','https://size-em-up.web.app/?join=ab2c','https://size-em-up.firebaseapp.com/index.html?join=AB2C','http://192.168.1.173:4180/?join=AB2C'])
  assert.equal(roomCodeFromQr(value,'http://192.168.1.173:4180'),'AB2C');
assert.equal(roomCodeFromQr('http://192.168.1.173:4180/?join=AB2C','https://localhost'),'AB2C','Android can scan a local browser host invite without opening its URL');
for(const value of [null,'','1234','ABIC','AB2CC','https://example.com/?join=AB2C','javascript:alert(1)','https://size-em-up.web.app.evil.test/?join=AB2C','https://user@size-em-up.web.app/?join=AB2C','https://size-em-up.web.app/?join=AB2C&join=DE3F','https://size-em-up.web.app/?join=%3Csvg%3E','x'.repeat(2049)])
  assert.equal(roomCodeFromQr(value),null,'Reject '+String(value).slice(0,70));
class Button extends EventTarget {disabled=false;click(){if(!this.disabled)this.dispatchEvent(new Event('click'));}}
const turn=()=>new Promise(resolve=>setImmediate(resolve));
function setup(scanner,isActive=()=>true){
  const button=new Button(),joinButton=new Button(),input=new EventTarget(),status={textContent:''};input.value='OLD2';let joins=0,changes=0;
  joinButton.addEventListener('click',()=>joins++);input.addEventListener('input',()=>changes++);
  mountRoomQr({button,input,status,joinButton,scanner,isActive});return {button,input,status,joinButton,joins:()=>joins,changes:()=>changes};
}
const success=setup(async()=>({value:'https://size-em-up.web.app/?join=AB2C'}));success.button.click();await turn();assert.equal(success.input.value,'AB2C');assert.equal(success.joins(),1);assert.equal(success.changes(),1);assert(!success.button.disabled&&!success.joinButton.disabled);
for(const scanner of [async()=>({cancelled:true}),async()=>({value:'not our QR'}),async()=>{throw Error('module unavailable')}]){
  const ui=setup(scanner);ui.button.click();await turn();assert.equal(ui.input.value,'OLD2');assert.equal(ui.joins(),0);assert(!ui.button.disabled&&!ui.joinButton.disabled);
}
let scans=0,resolveScan;const busy=setup(()=>{scans++;return new Promise(r=>resolveScan=r)});busy.button.click();busy.button.click();assert.equal(scans,1);assert(busy.joinButton.disabled);resolveScan({cancelled:true});await turn();assert(!busy.joinButton.disabled);
const navigated=setup(async()=>({value:'AB2C'}),()=>false);navigated.button.click();await turn();assert.equal(navigated.joins(),0);
const browser=setup(null);browser.button.click();assert(browser.status.textContent.includes('Android app'));assert.equal(browser.joins(),0);assert.equal(browser.input.value,'OLD2');
console.log('PASS: QR invite validation, valid scan to Join Game, cancel/failure recovery, duplicate taps, navigation cancellation, manual-entry preservation and browser fallback.');
