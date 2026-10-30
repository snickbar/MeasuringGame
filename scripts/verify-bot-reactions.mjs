import assert from 'node:assert/strict';import fs from 'node:fs';
import {createBotReactions} from '../anim/bot-reactions.mjs';
let seed=71;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
let t=0,state={host:true,playerId:'me',roomCode:'TEST',room:{gameId:'game1',round:1,phase:'question',players:{me:{isHost:true},a:{isBot:true},b:{isBot:true},c:{isBot:true}}}};
const events=[],controller=createBotReactions({getState:()=>state,now:()=>t,random,reactions:['wave','laugh','clap'],send:e=>events.push({...e,t,round:state.room.round})});
const run=ms=>{const end=t+ms;for(;t<=end;t+=200)controller.tick();};
run(30000);state.room.phase='answers';run(15000);state.room.phase='summary';run(45000);
assert(events.length>=6,'Bots can react more than once, including after guessing');
for(const id of ['a','b','c']){
 const own=events.filter(e=>e.id===id);assert(own.length>=2&&own.length<=4,'Varied, bounded activity per bot');
 for(let i=1;i<own.length;i++){assert(own[i].t-own[i-1].t>=7000,'Bot has a natural pause between reactions');assert.notEqual(own[i].emoji,own[i-1].emoji,'No immediate repeated picture');}
}
for(let i=1;i<events.length;i++)assert(events[i].t-events[i-1].t>=1800,'No near-simultaneous pileup across bots');
assert(new Set(events.slice(1).map((e,i)=>e.t-events[i].t)).size>3,'Spacing varies');
run(120000);const before=events.length;run(120000);assert.equal(events.length,before,'Manual results screen does not chatter forever');
state.room.round=2;state.room.phase='question';run(20000);assert(events.length>before,'New round allows fresh reactions');
let n=events.length;state.room.paused=true;run(60000);assert.equal(events.length,n,'Pause is silent');state.room.paused=false;controller.tick();assert.equal(events.length,n,'Resume does not replay overdue reactions');run(12000);assert(events.length>n,'Reactions resume with new pauses');
for(const change of [()=>{state.blocked=true;},()=>{state.blocked=false;state.room.phase='animation';},()=>{state.room.phase='question';state.host=false;},()=>{state.host=true;state.room.players.me.isHost=false;},()=>{state.room.players.me.isHost=true;state.room.phase='final';}]){change();n=events.length;run(20000);assert.equal(events.length,n,'Hidden/animation/nonhost/finished states are silent');}
state.room.phase='question';state.room.round=3;state.room.players={me:{isHost:true},a:{isBot:true}};run(15000);delete state.room.players.a;n=events.length;run(60000);assert.equal(events.length,n,'Removed bots stop reacting');
state.room.players.a={isBot:true};state.room.phase='hs';state.room.hs={round:1,stage:'bet'};run(30000);assert(events.length>n,'High Stakes bots also react');state.room.hs.stage='over';n=events.length;run(30000);assert.equal(events.length,n,'High Stakes finish is silent');
state.roomCode=null;run(30000);assert.equal(events.length,n,'Leaving room cancels activity');
const source=fs.readFileSync('index.html','utf8');assert(!source.includes('maybeBotReaction('),'Old synchronized guess reaction path removed');assert(source.includes('setInterval(() => botReactions.tick(), 400)'),'Independent scheduler installed');
console.log('Bot reactions: repeated varied activity, staggered timing, quiet limits, phase continuity, pause/hidden/reveal protection, removal, host ownership and High Stakes passed.');
