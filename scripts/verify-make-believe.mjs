import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {isMakeBelieveObject,isPartyRoomSettings,includesMakeBelieve,partyObjectAllowed,filterPartyObjects} from '../anim/make-believe.mjs';
const source=fs.readFileSync('index.html','utf8');
const fn=name=>source.match(new RegExp('  function '+name+'\\([^\\n]*\\{[\\s\\S]*?\\n  \\}'))[0];
const modes=['party','classic','teamvteam','highstakes','bluff'];
const sample=[{id:'pegasus'},{id:'unicorn',fantasy:true},{id:'ghost'},{id:'leprechaun'},{id:'cupid'},{id:'robot'},{id:'action-figure'},{id:'rainbow'},{id:'t-rex'},{id:'witch-hat'}];
for(const mode of modes){const off={mode,includeMakeBelieve:false};assert(isPartyRoomSettings(off));assert.deepEqual(filterPartyObjects(sample,off).map(o=>o.id),['robot','action-figure','rainbow','t-rex','witch-hat']);assert.equal(filterPartyObjects(sample,{mode}),sample);}
for(const mode of ['whichbigger','survival','worlds','teamworlds','daily','monthly'])assert.equal(filterPartyObjects(sample,{mode,includeMakeBelieve:false}),sample);
assert.equal(filterPartyObjects(sample,{mode:'party',solo:true,includeMakeBelieve:false}),sample);
assert.equal(filterPartyObjects(sample,null),sample);
const ctx=vm.createContext({includesMakeBelieve,filterPartyObjects,partyObjectAllowed,isMakeBelieveObject,poolCache:new Map(),SAMPLER_IDS:new Set(),Math,
 OBJECTS:sample.filter(o=>!o.fantasy&&!['ghost','cupid','leprechaun'].includes(o.id)),HOLIDAY_OBJECTS:sample.filter(o=>['ghost','cupid','leprechaun'].includes(o.id)).map(o=>({...o,pack:'halloween'})),FANTASY_OBJECTS:[sample[1]]});
vm.runInContext(fn('poolFor'),ctx);
const on=ctx.poolFor(['halloween'],['halloween'],['unicorn'],{mode:'classic'}),off=ctx.poolFor(['halloween'],['halloween'],['unicorn'],{mode:'classic',includeMakeBelieve:false});
assert(on.objects.some(o=>o.fantasy));assert(off.objects.every(o=>!isMakeBelieveObject(o)));assert.notEqual(on,off);assert.equal(ctx.poolFor(['halloween'],['halloween'],['unicorn'],{mode:'classic'}),on,'Off must not mutate the enabled cache');
assert.equal(ctx.poolFor(['halloween'],['halloween'],['unicorn'],{mode:'party',solo:true,includeMakeBelieve:false}),on);
const real=Array.from({length:14},(_,i)=>({id:'real'+i,mm:2**i})),pretend=Array.from({length:6},(_,i)=>({id:'pretend'+i,mm:3*2**i,fantasy:true}));
ctx.WORLD_Q=5;ctx.worldObjects=w=>w.objects;ctx.objectMemory={orderPairs:p=>p,remember(){},pickPair:p=>{assert(p.every(v=>!isMakeBelieveObject(ctx.OBJECT_BY_ID.get(v.u))&&!isMakeBelieveObject(ctx.OBJECT_BY_ID.get(v.t))));return p[0];}};ctx.dailyQuestionFor=q=>q;
vm.runInContext(fn('teamWorldQuestions'),ctx);let qs=ctx.teamWorldQuestions({objects:[...pretend,...real]},{mode:'teamworlds',includeMakeBelieve:false});assert.equal(qs.length,5);assert(qs.some(q=>q.unitId.startsWith('pretend')||q.targetId.startsWith('pretend')),'Team Worlds retains curated objects despite a stale Off setting');
assert(isPartyRoomSettings({mode:'teamworlds',variant:'hl'}),'High/Low remains eligible');
ctx.OBJECTS=[...real,{id:'pegasus',mm:3}];ctx.OBJECT_BY_ID=new Map(ctx.OBJECTS.map(o=>[o.id,o]));ctx.svPairs=null;ctx.survivalTarget=()=>Math.log(2);
vm.runInContext(fn('survivalPairs')+'\n'+fn('survivalNextQuestion'),ctx);
for(let i=0;i<20;i++)ctx.survivalNextQuestion({asked:i,recent:[]},{mode:'teamworlds',variant:'hl',includeMakeBelieve:false});
assert.match(fn('generateQuestion'),/poolFor\([^;]+roomState.settings/);
console.log('PASS: party-only scope, default/legacy On, imaginary vs real toys and dinosaurs, isolated pool caches, Team Worlds exclusion and High/Low pair filtering.');
