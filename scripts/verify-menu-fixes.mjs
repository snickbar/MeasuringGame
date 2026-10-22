import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync('index.html', 'utf8');
const actual = name => source.match(new RegExp('  (?:async )?function ' + name + '\\([^\\n]+\\{[\\s\\S]*?\\n  \\}'))[0];

const initialText={textContent:'0'};
vm.runInNewContext(source.match(/<script id="restore-visible-coins">([\s\S]*?)<\/script>/)[1],{
  localStorage:{getItem:key=>key==='mg_visibleWallet'?JSON.stringify({owner:'account',balance:4366}):null},
  document:{getElementById:()=>initialText},
});
assert.equal(initialText.textContent,'4366','restore the current number before deferred modules and auth finish loading');

const walletText = {}, cached = new Map();
const wallet = vm.createContext({walletAuthReady:false,walletProfileOwner:'guest',deviceId:'account',
  myProfile:{coins:5979},toolbarCoinCountEl:walletText,observedCoinOwner:'guest',observedCoinBalance:5979,
  coinCountTweenActive:false,formatCoinDisplay:String,CACHED_COINS_KEY:'legacy',
  lastVisibleWallet:null,localStorage:{setItem:(key,value)=>cached.set(key,value)},sparkleCoins(){},prefersReducedMotion:()=>true,toolbarCoinBalanceEl:{}});
vm.runInContext(actual('renderCoinBalance'),wallet);
wallet.renderCoinBalance();assert.equal(walletText.textContent,'…');assert.equal(cached.size,0);
wallet.walletAuthReady=true;wallet.renderCoinBalance();assert.equal(walletText.textContent,'…','never show a different owner’s balance');
wallet.walletProfileOwner='account';wallet.myProfile.coins=4366;wallet.renderCoinBalance();
assert.equal(walletText.textContent,'4366');assert.equal(wallet.myProfile.coins,4366,'display fix does not alter coins');
assert.equal(cached.get('legacy'),'4366');
wallet.walletAuthReady=false;wallet.walletProfileOwner='guest';wallet.myProfile.coins=5979;
wallet.renderCoinBalance();assert.equal(walletText.textContent,'4366','Home refresh keeps the last visible account balance while auth restores');
wallet.walletAuthReady=true;wallet.deviceId='other-account';wallet.renderCoinBalance();
assert.equal(walletText.textContent,'…','an actual account switch cannot reuse the prior owner’s coins');

const accountElements=new Map();
const account = vm.createContext({isNativeApp:true,accountUser:{displayName:'Test Player',email:'test@example.com'},
  settingsSignInBtn:{style:{}},settingsSignOutBox:{style:{}},settingsSignedInEmailEl:{},
  document:{getElementById:id=>{if(!accountElements.has(id))accountElements.set(id,{});return accountElements.get(id);}}});
vm.runInContext(actual('renderAccountUi'),account);account.renderAccountUi();
assert.equal(accountElements.get('settings-account-label').textContent,'Signed in as Test Player');
assert.equal(account.settingsSignedInEmailEl.textContent,'test@example.com');
account.accountUser=null;account.renderAccountUi();assert.equal(account.settingsSignedInEmailEl.textContent,'');

const recap=vm.createContext({currentPlayers:{me:{score:0,roundsCounted:0},bot:{score:0}},currentPlayerId:'me',currentRoomCode:'TEST',
  roomState:{phase:'question',round:1,settings:{totalRounds:5}},currentSettings:{},
  computeRanks:()=>[{id:'me',rank:1}],formatAccuracy:String,HS:{HS_MAX_ROUNDS:10,hsPlaceOf:()=>1}});
vm.runInContext(actual('gameRecapTiles'),recap);
let rows=recap.gameRecapTiles();assert(rows.some(r=>r[0]==='Not finished'));assert(!rows.some(r=>['Rank','Place'].includes(r[1])));
recap.roomState={phase:'hs',settings:{mode:'highstakes'},hs:{stage:'bet',round:1,chips:{me:100},seatsAll:['me','bot']}};
rows=recap.gameRecapTiles();assert(!rows.some(r=>r[1]==='Place'));
recap.roomState.hs.stage='over';assert(recap.gameRecapTiles().some(r=>r[1]==='Place'));
assert(!actual('hostExit').includes('careerLedger.save'));assert(!actual('guestExit').includes('careerLedger.save'));

const classList=()=>{const values=new Set();return {toggle:(key,on)=>on?values.add(key):values.delete(key),contains:key=>values.has(key)}};
const toolbar={classList:classList()},tabs=[{classList:classList()},{classList:classList()}],content={};
const awards=vm.createContext({myProfile:{achClaimed:{}},ACHIEVEMENTS:[{id:'one',cat:'Test',name:'One',desc:'Test',target:1,reward:15,progress:()=>1}],
  ACH_CATS:['Test'],ACH_ICON_IDS:new Set(),TROPHY_SVG:'',achHideDone:false,achJustClaimed:null,achHold:{},escapeHtml:String,
  document:{getElementById:id=>id==='achievements-content'?content:toolbar,querySelectorAll:()=>tabs}});
for(const name of ['achDone','achClaimable'])vm.runInContext(source.match(new RegExp('  function '+name+'\\([^\\n]+'))[0],awards);
vm.runInContext(actual('updateCareerDot')+'\n'+actual('renderAchievementsScreen'),awards);
awards.renderAchievementsScreen();assert(tabs.every(tab=>tab.classList.contains('has-dot')));
awards.myProfile.achClaimed.one=true;awards.renderAchievementsScreen();
assert(!toolbar.classList.contains('has-claim'));assert(tabs.every(tab=>!tab.classList.contains('has-dot')),'last claim clears every tab dot without navigating');
console.log('PASS: wallet owner/auth isolation, account identity, unfinished exit recaps and immediate award-dot refresh.');
