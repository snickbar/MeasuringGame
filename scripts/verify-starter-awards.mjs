import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { STARTER_AWARDS, starterAwardProfile, upgradeGuestProfile } from '../anim/starter-awards.mjs';

const defaults = () => ({coins:0,achClaimed:{},stats:{},unlockedAvatars:{ant:true}});
const clone = value => structuredClone(value);
const guest = starterAwardProfile(defaults());
assert.equal(guest.coins,100);
assert.equal(guest.achClaimed['welcome-size-em-up'],true);
assert.equal(guest.achClaimed['account-connected'],undefined);
assert.equal(starterAwardProfile(guest),undefined);
assert.equal(starterAwardProfile(JSON.parse(JSON.stringify(guest))),undefined);
const connected = starterAwardProfile(guest,{connected:true});
assert.equal(connected.coins,150);
assert.equal(starterAwardProfile(connected,{connected:true}),undefined);
assert.equal(starterAwardProfile(defaults(),{connected:true}).coins,150);
const veteran={coins:850,stats:{wins:12},gameRewards:{old:{base:20}},achClaimed:{other:true}};
const welcomed=starterAwardProfile(veteran);
assert.equal(welcomed.coins,950);
assert.deepEqual(welcomed.stats,veteran.stats);
assert.deepEqual(welcomed.gameRewards,veteran.gameRewards);
assert.equal(veteran.coins,850);
assert.equal(welcomed.achClaimed.other,true);

function database(initial={},failureAt=-1,afterCommit=false){
 const records=clone(initial);let calls=0;
 return {records,transaction:async(id,change)=>{
  const call=calls++,current=clone(records[id]??null);
  if(call===failureAt&&!afterCommit)throw Error('offline');
  const next=change(current);if(next!==undefined)records[id]=clone(next);
  if(call===failureAt&&afterCommit)throw Error('lost response');
  return {committed:next!==undefined,snapshot:{val:()=>clone(records[id]??null)}};
 }};
}
const progress={...guest,coins:137,stats:{wins:5},worlds:{tiny:{stars:9}},history:[{score:8}],gameRewards:{game1:{base:8}}};
for(const failAt of [-1,0,1,2])for(const after of [false,true]){
 const db=database({guest:progress},failAt,after);
 const upgrade=()=>upgradeGuestProfile({sourceId:'guest',accountId:'google1',transaction:db.transaction,defaults});
 await upgrade().catch(()=>{});await upgrade();await upgrade();
 assert.equal(db.records.google1.coins,137,'guest balance transferred exactly once');
 assert.deepEqual(db.records.google1.stats,progress.stats);
 assert.deepEqual(db.records.google1.worlds,progress.worlds);
 assert.deepEqual(db.records.google1.gameRewards,progress.gameRewards);
 assert.equal(db.records.guest.coins,0,'guest no longer has a second spendable wallet');
 assert.equal(db.records.guest.accountUpgrade.completed,true);
 assert.equal(db.records.guest.archivedGuest.coins,137,'recoverable guest backup');
 assert.equal(starterAwardProfile(db.records.guest),undefined,'sign-out does not grant another Welcome');
 db.records.google1=starterAwardProfile(db.records.google1,{connected:true});
 assert.equal(db.records.google1.coins,187,'connection adds only fifty after transfer');
 assert.equal(starterAwardProfile(db.records.google1,{connected:true}),undefined,'second phone and restored session do not repeat');
 await upgradeGuestProfile({sourceId:'guest',accountId:'google2',transaction:db.transaction,defaults});
 db.records.google2=starterAwardProfile(db.records.google2,{connected:true});
 assert.equal(db.records.google2.coins,50,'retired guest cannot be cloned into another account');
}
const existing=database({guest:progress,google1:veteran});
await upgradeGuestProfile({sourceId:'guest',accountId:'google1',transaction:existing.transaction,defaults});
assert.equal(existing.records.google1.coins,850,'existing account balance takes precedence');
assert.deepEqual(existing.records.google1.stats,veteran.stats);
assert.equal(starterAwardProfile(existing.records.google1,{connected:true}).coins,900,'carried Welcome receipt prevents duplicate hundred');
assert.deepEqual(existing.records.guest.archivedGuest.worlds,progress.worlds,'guest backup retained when existing account wins');
const firstAccount=database();
await upgradeGuestProfile({sourceId:'guest',accountId:'google1',transaction:firstAccount.transaction,defaults});
assert.equal(starterAwardProfile(firstAccount.records.google1,{connected:true}).coins,150);
assert.equal(starterAwardProfile(firstAccount.records.guest),undefined,'profile creation racing sign-in consumes Welcome only once');

// Run the actual app award hook, including repeated profile notifications and
// cross-device transactions, with an in-memory database and no real accounts.
const source=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const hook=source.match(/  async function grantStarterAchievements\(profileId\) \{[\s\S]*?\n  \}/)[0];
const db=database(),toasts=[];
const context=vm.createContext({STARTER_AWARDS,starterAwardProfile,Map,auth:null,deviceId:'guest',
 starterAwardJobs:new Map(),starterAuthReady:Promise.resolve(),defaultProfile:defaults,db:{},ref:(_,path)=>path.split('/')[1],
 runTransaction:db.transaction,showAchToast:text=>toasts.push(text),console});
vm.runInContext(hook,context);
await Promise.all(Array.from({length:8},()=>context.grantStarterAchievements('guest')));
await context.grantStarterAchievements('guest');
assert.equal(db.records.guest.coins,100);
assert.equal(toasts.length,1,'one nonblocking notice for committed Welcome');
context.auth={currentUser:{uid:'google1',providerData:[{providerId:'google.com'}]}};context.deviceId='google1';
await upgradeGuestProfile({sourceId:'guest',accountId:'google1',transaction:db.transaction,defaults});
await Promise.all([context.grantStarterAchievements('google1'),context.grantStarterAchievements('google1')]);
assert.equal(db.records.google1.coins,150);
const secondPhone=vm.createContext({...context,starterAwardJobs:new Map()});vm.runInContext(hook,secondPhone);
await secondPhone.grantStarterAchievements('google1');
assert.equal(db.records.google1.coins,150);
assert.equal(toasts.length,2,'returning sign-in is silent');
let resolveAuth;
const restoring=vm.createContext({...context,auth:{currentUser:null},deviceId:'guest',starterAwardJobs:new Map(),
 starterAuthReady:new Promise(resolve=>{resolveAuth=resolve})});
vm.runInContext(hook,restoring);
const waiting=restoring.grantStarterAchievements('guest');
const before=db.records.guest.coins;
restoring.auth.currentUser={uid:'google1',providerData:[{providerId:'google.com'}]};resolveAuth();await waiting;
assert.equal(db.records.guest.coins,before,'cold Google restore does not mint an extra guest Welcome');
// Execute the actual native sign-in and cold-restore glue as well as the pure
// upgrade helper, including a lost account-write response between the stages.
for(const failAt of [-1,1,'cancel']){
 const signDb=database({guest:progress},failAt,true),cache=new Map([['guest',clone(progress)]]),storage=new Map();
 let restoredCallback;
 const sign=vm.createContext({careerLedger:undefined,confirmAccountProgress:async()=>true,auth:{currentUser:null},authFlowInProgress:false,accountUser:null,deviceId:'guest',localDeviceId:'guest',
  PENDING_ACCOUNT_UPGRADE_KEY:'pending',unwatchProfile:()=>{},db:{},defaultProfile:defaults,upgradeGuestProfile,
  window:{Capacitor:{Plugins:{FirebaseAuthentication:{signInWithGoogle:async()=>{if(failAt==='cancel')throw Error('cancelled');return {credential:{idToken:'test-token'}}}}}}},
  GoogleAuthProvider:{credential:token=>token},signInWithCredential:async()=>{sign.auth.currentUser={uid:'google1',providerData:[{providerId:'google.com'}]};return {user:sign.auth.currentUser}},
  ref:(_,path)=>path.split('/')[1],runTransaction:signDb.transaction,get:async id=>({val:()=>clone(signDb.records[id]??null)}),
  saveCachedProfile:(id,p)=>cache.set(id,clone(p)),loadCachedProfile:id=>cache.get(id),
  localStorage:{setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k)??null,removeItem:k=>storage.delete(k)},
  renderAccountUi(){},renderProfileDependentUi(){},watchMyProfile(){},console:{warn(){}},
  resolveStarterAuth:()=>{},onAuthStateChanged:(_,callback)=>{restoredCallback=callback}});
 vm.runInContext(source.match(/  async function signInWithGoogle\(\) \{[\s\S]*?\n  \}/)[0],sign);
 await sign.signInWithGoogle().catch(()=>{});
 if(failAt==='cancel'){
  assert.equal(sign.authFlowInProgress,false);assert.equal(sign.deviceId,'guest');
  assert.equal(signDb.records.google1,undefined);assert.equal(storage.size,0);continue;
 }
 if(failAt>=0){
  assert.equal(storage.get('pending'),'google1','upgrade intent persists across a failed sign-in');
  vm.runInContext(source.match(/onAuthStateChanged\(auth, async \(user\) => \{[\s\S]*?\n    \}\);/)[0],sign);
  await restoredCallback(sign.auth.currentUser);
 }
 assert.equal(sign.deviceId,'google1');
 assert.equal(sign.authFlowInProgress,false);
 assert.equal(storage.has('pending'),false);
 assert.equal(signDb.records.google1.coins,137);
 assert.equal(signDb.records.guest.coins,0);
 assert.equal(cache.get('guest').accountUpgrade.completed,true);
}
// Exercise the real achievement renderer: automatic awards cannot expose a
// manual Claim button, and both rewards remain separate, named rows.
const content={innerHTML:''};
const ui=vm.createContext({STARTER_AWARDS,myProfile:guest,ACH_CATS:['Getting started'],ACH_ICON_IDS:new Set(),TROPHY_SVG:'',
 achHideDone:false,achJustClaimed:null,achHold:{},escapeHtml:s=>s,
 document:{getElementById:id=>id==='achievements-content'?content:{classList:{toggle(){}}}}});
vm.runInContext(source.slice(source.indexOf('  const ACHIEVEMENTS = [];'),source.indexOf('  function achTier(')),ui);
for(const name of ['achDone','achClaimable'])vm.runInContext(source.match(new RegExp('  function '+name+'\\([^\\n]+'))[0],ui);
vm.runInContext(source.match(/  function renderAchievementsScreen\(\) \{[\s\S]*?\n  \}/)[0],ui);
ui.renderAchievementsScreen();
assert.match(content.innerHTML,/Welcome to Size Em Up!/);
assert.match(content.innerHTML,/Account Connected/);
assert.match(content.innerHTML,/Awarded<br>\+100 coins/);
assert.doesNotMatch(content.innerHTML,/class="ach-claim"/);
ui.myProfile=connected;ui.renderAchievementsScreen();
assert.match(content.innerHTML,/Awarded<br>\+50 coins/);
console.log('PASS: automatic starter coins, existing players, repeated launches/devices, actual app hook, atomic receipts, interrupted guest upgrades, retained progress/backups and retired guest wallets.');
