const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');const html=fs.readFileSync('index.html','utf8');
const block=(start,end)=>html.slice(html.indexOf(start),html.indexOf(end,html.indexOf(start)));
(async()=>{
 const categories=['avatar','reaction','flair','board','scene'];let profile={coins:0},newBoard=false;
 const c={STARTER_BUNDLE:{coins:100},GACHA_COST:50,GACHA_CATEGORIES:categories,myProfile:profile,Math,ref:()=>{},db:{},deviceId:'test',defaultProfile:()=>({coins:0}),bumpStats(){},gachaPick:cat=>cat==='board'&&!newBoard?null:{cat,id:cat},gachaRemaining:cat=>cat==='board'&&!newBoard?0:1,gachaOwnedIn:(p,cat,id)=>!!p.owned?.[cat],gachaGrant:(p,cat,id)=>({...p,owned:{...p.owned,[cat]:id}}),runTransaction:async(_,fn)=>{const next=fn(profile);if(next)profile=next;c.myProfile=profile;return{committed:!!next,snapshot:{val:()=>profile}}}};
 vm.createContext(c);vm.runInContext(block('  async function purchaseStarterBundle()','  function renderCosmeticsShop()')+block('  async function pullGachaItem(','  // The avatar machine')+';globalThis.buy=purchaseStarterBundle;globalThis.pull=pullGachaItem;',c);
 const got=await c.buy();assert.equal(got.length,4);assert.equal(got.banked,1);assert.equal(profile.freeCategoryPulls.board,1);assert.equal(profile.coins,100);
 await c.buy();assert.equal(profile.freeCategoryPulls.board,1);assert.equal(profile.coins,100,'repeat purchase cannot credit again');
 assert.equal(await c.pull('board'),null);assert.equal(profile.freeCategoryPulls.board,1,'empty category never consumes its credit');
 newBoard=true;await c.pull('board');assert.equal(profile.freeCategoryPulls.board,0);assert.equal(profile.coins,100,'new item consumes category credit, not coins');assert(profile.owned.board);
 const classes=new Set(),el=()=>({disabled:false,textContent:'',classList:{add(){},remove(){}}});let attempted=0;
 const s={myProfile:{coins:100},GACHA_COST:50,gachaFreePulls:()=>0,gachaStatusEl:el(),gachaPullBtn:el(),gachaCatRowEl:el(),document:{body:{classList:{add:v=>classes.add(v),remove:v=>classes.delete(v)}}},resetGachaScene(){classes.delete('gacha-pull-lock')},renderGachaScreen(){s.gachaPullBtn.disabled=false},pullGachaItem:async()=>{attempted++;throw Error('permission-denied')},gachaRetrigger(){},playSound(){}};
 vm.createContext(s);vm.runInContext('let gachaPullInProgress=false;'+block('  async function runGachaPull(','  gachaPullBtn.addEventListener')+';globalThis.run=runGachaPull;globalThis.busy=()=>gachaPullInProgress;',s);
 await s.run('any',s.gachaPullBtn);assert(!s.busy()&&!classes.has('gacha-pull-lock')&&!s.gachaPullBtn.disabled);assert.match(s.gachaStatusEl.textContent,/try again/i);
 await s.run('any',s.gachaPullBtn);assert.equal(attempted,2,'failed pull can immediately be retried');
 console.log('PASS: missing category banks a durable credit, repeat purchases pay once, future items redeem without coins, and failed pulls unlock and retry.');
})().catch(e=>{console.error(e);process.exitCode=1});
