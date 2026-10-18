import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {measurementQuestionPrompt} from '../anim/object-review-prompts.mjs';

const root=new URL('../',import.meta.url);
const source=fs.readFileSync(new URL('index.html',root),'utf8');
const data=JSON.parse(fs.readFileSync(new URL('anim/object-review-data.json',root)));
const objects=new Map(data.objects.map(o=>[o.id,o]));
const array=name=>source.match(new RegExp('  const '+name+' = (\\[[\\s\\S]*?\\n  \\]);'))[0];
const line=name=>source.match(new RegExp('  const '+name+' = [^\\n]+'))[0];
const fn=name=>{let start=source.indexOf('  function '+name+'(');if(start<0)start=source.indexOf('  async function '+name+'(');assert(start>=0,name);let i=source.indexOf('{',start),depth=1;for(i++;depth;i++){if(source[i]==='{')depth++;else if(source[i]==='}')depth--;}return source.slice(start,i);};
const ctx=vm.createContext({OBJECT_BY_ID:objects,FANTASY_OBJECTS:data.objects.filter(o=>o.group==='Fantasy'),
  myProfile:{worlds:{}},activePackIdsFor:()=>[],SAMPLER_IDS:new Set(),unlockedFantasyIds:()=>[],
  dailyQuestionFor:c=>{const unit=objects.get(c.unitId),target=objects.get(c.targetId);return {...c,answer:target.mm/unit.mm,prompt:measurementQuestionPrompt(unit,target)};},
});
const unlockStart=source.indexOf('  const worldUnlocked = ');
vm.runInContext([
  array('WORLDS'),array('HOME_SCREENS'),line('WORLD_LEVELS'),line('WORLD_ICON'),line('worldStarsFor'),
  source.slice(source.indexOf('  const WORLD_EXTRAS = {'),source.indexOf('\n  };',source.indexOf('  const WORLD_EXTRAS = {'))+5),
  line('worldLevelStars'),line('worldStarsOf'),fn('worldTotalStars'),
  source.slice(unlockStart,source.indexOf('\n  };',unlockStart)+5),
  fn('staggerOrder'),fn('worldObjects'),fn('worldQuestions'),
  'globalThis.api={WORLDS,HOME_SCREENS,WORLD_LEVELS,WORLD_Q,WORLD_ICON,worldStarsFor,worldQuestions,worldUnlocked,worldStarsOf,worldTotalStars};'
].join('\n'),ctx);
const api=ctx.api;
assert.equal(api.WORLDS.length,11);
for(const [accuracy,stars]of [[0,0],[60,0],[60.01,1],[75,1],[75.01,2],[80,2],[90,2],[90.01,3],[92,3],[100,3]])assert.equal(api.worldStarsFor(accuracy),stars,'World stars at '+accuracy);
assert(source.includes('#f39432 60% 75%,#65b94e 75% 90%,#3999ef 90% 100%'));
assert(source.includes('left:90%; right:0; top:0; bottom:0; background:linear-gradient(110deg'));
assert(source.includes('WORLD_STAR_AT.map((at, i)'));
assert.deepEqual(Array.from(api.WORLDS,w=>w.id).filter(id=>!['under-the-sea','toy-box'].includes(id)),['tiny','games','home','food','town','critters','wheels','landmarks','make-believe']);
for(const [id,count,home]of [['under-the-sea',18,'underwater'],['toy-box',17,'toy-box']]){
  const world=api.WORLDS.find(w=>w.id===id);assert.equal(world.ids.length,count);assert.equal(new Set(world.ids).size,count);
  assert(objects.has(api.WORLD_ICON[id]));
  for(const objectId of world.ids)assert.equal(objects.get(objectId)?.group,'Standard',objectId+' must not require a pack');
  const reward=api.HOME_SCREENS.find(h=>h.world===id);assert.equal(reward.id,home);assert(fs.existsSync(new URL(reward.file,root)));
  assert(fs.readFileSync(new URL('scripts/sync-www.js',root),'utf8').includes('"'+reward.file+'"'));
  for(let level=1;level<=5;level++)for(let run=0;run<40;run++){
    const questions=api.worldQuestions(world,level);assert.equal(questions.length,5);
    assert.equal(new Set(questions.map(q=>[q.unitId,q.targetId].join('/'))).size,5);
    assert.equal(new Set(questions.flatMap(q=>[q.unitId,q.targetId])).size,10,'enough distinct objects per level');
    for(const q of questions){assert(world.ids.includes(q.unitId)&&world.ids.includes(q.targetId));assert(q.answer>=1.5);assert(q.prompt.endsWith('?'));}
  }
}
const sea=api.WORLDS.findIndex(w=>w.id==='under-the-sea'),toy=api.WORLDS.findIndex(w=>w.id==='toy-box');
assert(!api.worldUnlocked(sea));ctx.myProfile.worlds.landmarks={l5:2};assert(api.worldUnlocked(sea));assert(!api.worldUnlocked(toy));
ctx.myProfile.worlds['under-the-sea']={l5:2};assert(api.worldUnlocked(toy));
ctx.myProfile.worlds={home:{l1:1}};assert(api.worldUnlocked(api.WORLDS.findIndex(w=>w.id==='home')),'earned progress remains open');
ctx.unlockedFantasyIds=()=>Array(20).fill('unlocked');assert(api.worldUnlocked(api.WORLDS.findIndex(w=>w.id==='make-believe')),'fantasy unlock remains independent');

// Exercise the real achievement definitions and claim transaction, without Firebase.
ctx.ACHIEVEMENTS=[];ctx.achHold={};ctx.ACH_HOLD_MS=0;ctx.setTimeout=()=>{};ctx.playSound=()=>{};ctx.db={};ctx.deviceId='test';
ctx.ref=(_,path)=>path;ctx.defaultProfile=()=>({coins:0});ctx.defaultCosmeticState=()=>({owned:{},equipped:{}});
ctx.runTransaction=async(_path,update)=>{ctx.myProfile=update(ctx.myProfile);return {committed:true};};
const achStart=source.indexOf('  WORLDS.forEach((w) => {',source.indexOf('// Worlds: 13 or more'));
vm.runInContext('let achJustClaimed=null;\n'+source.slice(achStart,source.indexOf('\n  });',achStart)+6)+'\n'+fn('achDone')+'\n'+fn('achClaimable')+'\n'+fn('claimAchievement')+'\nglobalThis.claim=claimAchievement;',ctx);
ctx.myProfile={coins:7,worlds:{},achClaimed:{},cosmetics:{owned:{homeScreens:{space:true,ants:true}},equipped:{homeScreen:'space'}}};
for(const [id,home]of [['under-the-sea','underwater'],['toy-box','toy-box']]){
  const beat=ctx.ACHIEVEMENTS.find(a=>a.id==='world-beat-'+id),perfect=ctx.ACHIEVEMENTS.find(a=>a.id==='world-perfect-'+id);
  assert.equal(beat.home,home);assert.equal(beat.reward,0);assert.equal(perfect.reward,100);
  ctx.myProfile.worlds[id]={l1:3,l2:3,l3:3,l4:3,l5:0};assert.equal(beat.progress(),0);
  await ctx.claim(beat.id);assert(!ctx.myProfile.cosmetics.owned.homeScreens[home]);
  ctx.myProfile.worlds[id].l5=1;assert.equal(beat.progress(),1);assert.equal(perfect.progress(),0);
  const before=ctx.myProfile.coins;await ctx.claim(beat.id);assert(ctx.myProfile.cosmetics.owned.homeScreens[home]);assert.equal(ctx.myProfile.coins,before);
  await ctx.claim(beat.id);assert.equal(ctx.myProfile.coins,before);
  ctx.myProfile.worlds[id].l5=3;await ctx.claim(perfect.id);await ctx.claim(perfect.id);assert.equal(ctx.myProfile.coins,before+100);
}
assert(ctx.myProfile.cosmetics.owned.homeScreens.space);assert.equal(ctx.myProfile.cosmetics.equipped.homeScreen,'space');
// Cold-start home selection and Random both recognize the new rewards.
const boot=[...source.matchAll(/<script>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes('var F =')&&m[1].includes('mg_homeSel'))[1];
for(const selected of ['underwater','toy-box','random']){
  let background,preload;const values={mg_homeSel:selected,mg_homeOwned:JSON.stringify(['underwater','toy-box'])};
  vm.runInNewContext(boot,{localStorage:{getItem:k=>values[k],setItem:(k,v)=>{values[k]=v;}},document:{documentElement:{style:{setProperty:(_,v)=>{background=v;}}},querySelector:()=>({setAttribute:(_,v)=>{preload=v;}})}});
  assert(/home-(underwater|toy-box|watermelon)\.jpg/.test(background));assert(background.includes(preload));
  if(selected!=='random')assert(background.includes('home-'+selected+'.jpg'));
}
console.log('PASS: two Worlds, 400 five-question runs, ungated pools, existing unlocks, 13-star home rewards, one-time perfect coins, owned/equipped homes and cold-start/Random selection.');
