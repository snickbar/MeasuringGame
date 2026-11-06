const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),{runFixture}=require('./browser-fixture.cjs');
const source=fs.readFileSync('index.html','utf8').replace(/\r\n/g,'\n'),fixture=fs.readFileSync('scripts/verify-game-polish-browser.cjs','utf8'),context={};
vm.runInNewContext(fixture.slice(fixture.indexOf('const dbStub='),fixture.indexOf('let checks='))+';globalThis.parts={dbStub,authStub};',context);
const api=String.raw`window.__style={ready:()=>!!myProfile.stats?.gamesPlayed,
 seed:()=>{const p={...myProfile,randomEquip:{},randomPool:{},cosmetics:{...myProfile.cosmetics,owned:{...myProfile.cosmetics.owned,homeScreens:Object.fromEntries(HOME_SCREENS.map(h=>[h.id,true])),backgrounds:Object.fromEntries(allBackgrounds().map(b=>[b.id,true])),boards:Object.fromEntries(allBoards().filter(b=>!b.id.startsWith('mb')).map(b=>[b.id,true]))}}};localStorage.setItem('mg_menuTour_v1_'+deviceId,'skipped');__fakeDB.put('profiles/'+deviceId,p);applyProfileData(deviceId,p);openGachaScreen('cosmetics');},
 tab:sub=>{setCosmSub(sub);renderCosmeticsShop();},
 selected:cat=>styleEquippedIds(cat),items:cat=>cosmCatItems(cat).map(i=>i.id),save:saveStyleSelection,
 add:(cat,id)=>saveStyleSelection(cat,ids=>[...new Set([...ids,id])]),
 rolls:cat=>Array.from({length:30},()=>{rndPick[cat]=undefined;return rndGet(cat);}),
 legacy:()=>{myProfile.randomPool.boards={none:true};myProfile.randomEquip.boards=false;return styleEquippedIds('boards');},
 home:()=>({mode:localStorage.getItem('mg_homeSel'),pool:JSON.parse(localStorage.getItem('mg_homeOwned'))}),
 reload:()=>applyProfileData(deviceId,__fakeDB.read('profiles/'+deviceId)),
 reward:id=>equipUnlockedCosmetic(deviceId,{'cosmetics/equipped/board':id,'randomEquip/boards':false}),
 coins:()=>myProfile.coins,reactions:()=>Object.keys(REACTIONS).filter(ownsEmoji),slots:ownedReactionSlots,
};`;
const html=source.replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js','/__fake/app.mjs').replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js','/__fake/db.mjs').replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js','/__fake/auth.mjs').replace('\n</script>\n</body>',api+'\n</script>\n</body>');
runFixture({html,modules:{'/__fake/app.mjs':'export const initializeApp=()=>({});','/__fake/db.mjs':context.parts.dbStub,'/__fake/auth.mjs':context.parts.authStub},widths:[320,390,430],height:850,out:'output/style-selection',check:async({width,evaluate,screenshot})=>{
 for(let i=0;i<400&&!await evaluate('window.__style?.ready()');i++)await new Promise(r=>setTimeout(r,20));
 assert(await evaluate('window.__style?.ready()'),'App booted');await evaluate('__style.seed()');
 const coins=await evaluate('__style.coins()');
 for(const [cat,tab]of [['homeScreens','homes'],['backgrounds','backgrounds'],['boards','boards'],['flairs','flairs']]){
  const ids=await evaluate(`__style.items(${JSON.stringify(cat)})`);assert(ids.length);
  await evaluate(`__style.save(${JSON.stringify(cat)},${JSON.stringify(ids.slice(0,1))})`);
  assert((await evaluate(`__style.rolls(${JSON.stringify(cat)})`)).every(id=>id===ids[0]),cat+' one stays fixed');
  await evaluate(`__style.tab(${JSON.stringify(tab)})`);
  assert.equal(await evaluate(`document.querySelectorAll('.cosm-lock,.cosm-rnd-btn').length`),0);
  assert.equal(await evaluate(`document.getElementById('cosm-random-slot').textContent.includes('Equipped items')`),true);
  const set=ids.slice(0,12);await evaluate(`__style.save(${JSON.stringify(cat)},${JSON.stringify(set)})`);
  assert((await evaluate(`__style.rolls(${JSON.stringify(cat)})`)).every(id=>set.includes(id)),cat+' only equipped items');
  await evaluate('__style.reload()');assert.deepEqual(await evaluate(`__style.selected(${JSON.stringify(cat)})`),set);
  await evaluate(`__style.save(${JSON.stringify(cat)},[])`);assert.deepEqual(await evaluate(`__style.selected(${JSON.stringify(cat)})`),[]);
 }
 const homes=await evaluate(`__style.items('homeScreens').slice(0,12)`);await evaluate(`__style.save('homeScreens',${JSON.stringify(homes)});__style.tab('homes')`);
 assert.equal(await evaluate(`document.querySelectorAll('#cosm-random-slot .cosm-selected-item').length`),homes.length);
 assert(await evaluate(`(()=>{const s=document.querySelector('#cosm-random-slot .cosm-thumbs');s.scrollLeft=s.scrollWidth;return s.scrollWidth>s.clientWidth&&s.scrollLeft>0})()`),'All equipped items scroll horizontally');
 assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'Page stays within phone width');await screenshot('equipped-homes-'+width+'.png');
 await evaluate(`__style.save('homeScreens',[${JSON.stringify(homes[0])}])`);assert.equal((await evaluate('__style.home()')).mode,homes[0]);
 await evaluate(`document.querySelector('#cosm-homes-list .cosm-row.equipped .cosm-equip').click()`);
 for(let i=0;i<100&&(await evaluate(`__style.selected('homeScreens').length`));i++)await new Promise(r=>setTimeout(r,20));
 assert.deepEqual(await evaluate(`__style.selected('homeScreens')`),[],'Equipped button unequips');
 const reactions=await evaluate('__style.reactions()');await evaluate(`__style.save('reactions',${JSON.stringify(reactions)});__style.tab('emojis')`);
 const slots=await evaluate('__style.slots()');for(const bar of await evaluate(`__style.rolls('reactions')`)){assert(bar.length<=slots);assert.equal(new Set(bar).size,bar.length);assert(bar.every(id=>reactions.includes(id)));}
 await evaluate(`__style.save('reactions',[])`);assert((await evaluate(`__style.rolls('reactions')`)).every(bar=>bar.length===0),'Empty reactions never fill from owned inventory');
 const boards=await evaluate(`__style.items('boards').slice(0,2)`);await evaluate(`__style.save('boards',[${JSON.stringify(boards[0])}])`);await evaluate(`__style.reward(${JSON.stringify(boards[1])})`);
 assert.deepEqual(await evaluate(`__style.selected('boards')`),boards,'Reward Equip joins the same equipped set');
 await evaluate(`__style.save('boards',[])`);await evaluate(`Promise.all(${JSON.stringify(boards)}.map(id=>__style.add('boards',id)))`);
 assert.deepEqual((await evaluate(`__style.selected('boards')`)).sort(),[...boards].sort(),'Rapid selections retain both items');
 assert.equal(await evaluate('__style.coins()'),coins,'Selection does not spend coins');
 console.log('PASS:',width,'px; fixed/multiple/empty selections, persistence, reward Equip, reactions, no lock/random controls and horizontal strip.');
}}).catch(e=>{console.error(e);process.exitCode=1});
