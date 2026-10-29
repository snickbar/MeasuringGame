import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createObjectMemory,weightedPick} from '../anim/object-memory.mjs';
import {includesMakeBelieve,partyObjectAllowed} from '../anim/make-believe.mjs';
let seed=62413;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const data=new Map(),storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
let owner='one';
const options={owner:()=>owner,storage,random};
const memory=createObjectMemory(options);
assert.equal(memory.objectWeight('ant'),1);
memory.remember('ant','door');
assert.equal(memory.objectWeight('ant'),.25);
memory.observe('ant','door','round-one');
memory.observe('ant','door','round-one');
assert.equal(memory.objectWeight('ant'),.25,'recording/retrying a generated round does not double-count it');
memory.observe('guest-object','daily-object','guest-round');
assert.equal(memory.objectWeight('guest-object'),.25,'completed guest and fixed-challenge rounds influence later random selection');
assert(memory.pairWeight('ant','door')<memory.pairWeight('ant','car'));
const restored=createObjectMemory(options);
assert.equal(restored.objectWeight('ant'),memory.objectWeight('ant'),'Home/app reload retains recent history');
owner='two';assert.equal(memory.objectWeight('ant'),1,'account histories stay separate');owner='one';
const objects=[{id:'ant'},{id:'car'}],counts={ant:0,car:0};
for(let i=0;i<30000;i++)counts[restored.pickObject(objects).id]++;
assert(counts.ant>4000&&counts.ant<8000&&counts.car>22000,'recent item remains possible at lower weight');
for(let i=0;i<48;i++)memory.remember('other'+i,'different'+i);
assert(memory.objectWeight('ant')>.8,'chance recovers as other objects appear');
for(let i=0;i<150;i++)memory.remember('same','again');
assert(memory.objectWeight('same')>0,'even repeated objects never get zero weight');
assert(JSON.parse(data.get('mg_object_memory_v1_one')).length===100,'bounded persistent storage');
const fromHistory=createObjectMemory({owner:()=> 'legacy',storage,history:()=>[{u:'old',g:'big',answered:false}],random});
assert.equal(fromHistory.objectWeight('old'),.25,'seed older profiles, including missed submissions');
const unavailable=createObjectMemory({owner:()=> 'offline',storage:{getItem(){throw Error();},setItem(){throw Error();}},random});
unavailable.remember('a','b');assert(unavailable.objectWeight('a')<1,'blocked storage keeps in-session memory');
assert.equal(weightedPick(['one'],()=>1,()=>.9),'one');

// Exercise the actual game's Anything/Relative adapters, not a duplicate picker.
const source=fs.readFileSync('index.html','utf8');
const fn=name=>source.match(new RegExp('  function '+name+'\\([^\\n]*\\{[\\s\\S]*?\\n  \\}'))[0];
const fresh=createObjectMemory({owner:()=> 'picker',storage,random});
const ctx=vm.createContext({objectMemory:fresh,SEASON_BOOST_CHANCE:.15});
vm.runInContext(fn('pickRandomPair')+'\n'+fn('pickRelativePair'),ctx);
const a={id:'a',name:'A',mm:1},b={id:'b',name:'B',mm:10},c={id:'c',name:'C',mm:100};
const pool={objects:[a,b,c],seasonal:[],partners:new Map([['A',[[a,b]]],['B',[[a,b],[b,c]]],['C',[[b,c]]]])};
for(let i=0;i<1000;i++){
  const pair=ctx.pickRandomPair(pool);assert(pair[0].id!==pair[1].id);assert(pair[0].mm<=pair[1].mm);
  const relative=ctx.pickRelativePair(pool);assert(['ab','bc'].includes(relative.map(o=>o.id).join('')));
}
// Survival considers every pair in its existing difficulty window, including
// recently seen objects with a positive weight; no 400-index truncation bias.
const survival=vm.createContext({svPairs:null,OBJECTS:[a,b,c],objectMemory:fresh,includesMakeBelieve,partyObjectAllowed,
  dailyQuestionFor:q=>q,survivalTarget:()=>Math.log(10)});
vm.runInContext(fn('survivalPairs')+'\n'+fn('survivalNextQuestion'),survival);
const state={asked:0,recent:['a','b','c']};
for(let i=0;i<100;i++){
  const q=survival.survivalNextQuestion(state);
  assert(['ab','bc'].includes(q.unitId+q.targetId),'survival retains its target ratio even when every eligible object was recent');
}
assert(!fn('dailyQuestionFor').includes('objectMemory'),'Daily remains shared and deterministic');
assert(!fs.readFileSync('anim/monthly-challenge.mjs','utf8').includes('objectMemory'),'Monthly schedules are not personalized');
console.log('PASS: persistent soft object/pair weights, positive repeat chances, recovery, bounded/account-scoped memory, legacy history, unavailable storage and actual pair eligibility.');
