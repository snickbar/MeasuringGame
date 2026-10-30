import assert from 'node:assert/strict';
import fs from 'node:fs';
import {POOLS,chooseScenario,pickFromScenario} from '../anim/bot-reaction-scenarios.mjs';
import {createBotReactions} from '../anim/bot-reactions.mjs';

// Every reaction in the game belongs to at least one scenario, so bots can use the whole library.
const source=fs.readFileSync('index.html','utf8');
const block=source.slice(source.indexOf('const REACTIONS = {'),source.indexOf('const REACTION_BY_ID'));
const ids=[...block.matchAll(/id: "([a-z]+)"/g)].map(m=>m[1]);
assert(ids.length>=32,'found the reaction library');
const covered=new Set(Object.values(POOLS).flat());
assert.deepEqual(ids.filter(id=>!covered.has(id)),[],'every reaction is used by at least one scenario');
assert.deepEqual([...covered].filter(id=>!ids.includes(id)),[],'scenarios only use reactions that exist');

const rng=(seed=5)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const poolsFor=(ctx,n=200)=>{const r=rng(9),seen=new Set();for(let i=0;i<n;i++)seen.add(chooseScenario(ctx,r));return seen;};
const room=(over={})=>({phase:'question',round:1,settings:{totalRounds:5},players:{bot:{isBot:true,score:0},me:{score:0}},...over});
const base={botId:'bot',now:0,seenAt:0,roundStartLeaders:[]};

// Question timer: hello early, dragging late, nail-biter at the end.
const q=(now)=>chooseScenario({...base,room:room({questionEndsAt:30000}),now},rng());
assert.equal(q(2000),POOLS.hello);assert.equal(q(15000),POOLS.chatter);assert.equal(q(20000),POOLS.dragging);assert.equal(q(26000),POOLS.nailBiter);
assert.equal(chooseScenario({...base,room:room({phase:'answers'})},rng()),POOLS.nailBiter);
assert.equal(chooseScenario({...base,room:room({questionEndsAt:null}),now:25000},rng()),POOLS.dragging,'no timer still gets impatient');

// Round results.
const entry=(playerId,accuracyPercent,extra={})=>({playerId,accuracyPercent,...extra});
const results=(entries,over={})=>({...base,room:room({phase:'reveal',revealOrder:entries,...over})});
let seen=poolsFor(results([entry('bot',97),entry('me',50)]));assert(seen.has(POOLS.nailedIt)&&!seen.has(POOLS.flopped),'bot nailed it');
seen=poolsFor(results([entry('bot',75),entry('me',50)]));assert(seen.has(POOLS.decent)&&!seen.has(POOLS.nailedIt));
seen=poolsFor(results([entry('bot',10),entry('me',80)]));assert(seen.has(POOLS.flopped)&&!seen.has(POOLS.decent),'bot flopped');
seen=poolsFor(results([entry('bot',70),entry('me',99)]));assert(seen.has(POOLS.spotOnOther),'someone else spot on');
seen=poolsFor(results([entry('bot',30),entry('me',45)]));assert(seen.has(POOLS.nobodyClose),'nobody close');
seen=poolsFor(results([entry('bot',70),entry('me',10)]));assert(seen.has(POOLS.otherFlopped),'someone else flopped');
seen=poolsFor(results([entry('bot',95,{consecutiveWins:3}),entry('me',20)]));assert(seen.has(POOLS.onARoll),'on a roll');
const lead=poolsFor({...results([entry('bot',70),entry('me',60)],{players:{bot:{isBot:true,score:5},me:{score:3}}}),roundStartLeaders:['me']});assert(lead.has(POOLS.winning),'takes the lead');
const sameLead=poolsFor({...results([entry('bot',70),entry('me',60)],{players:{bot:{isBot:true,score:5},me:{score:3}}}),roundStartLeaders:['bot']});assert(!sameLead.has(POOLS.winning),'keeping the lead is not news');
const won=poolsFor(results([entry('bot',70),entry('me',60)],{round:5,players:{bot:{isBot:true,score:9},me:{score:3}}}));assert(won.has(POOLS.winning)&&!won.has(POOLS.goodGame),'bot wins the game');
const gg=poolsFor(results([entry('bot',70),entry('me',60)],{round:5,players:{bot:{isBot:true,score:1},me:{score:3}}}));assert(gg.has(POOLS.goodGame)&&!gg.has(POOLS.winning),'good game when not winning');

// Bluff the Room.
const bluff=(b)=>chooseScenario({...base,room:{phase:'bluff',bluff:b}},rng());
assert.equal(bluff({stage:'vote',maker:'me'}),POOLS.bluffThinking);
assert.equal(bluff({stage:'reveal',maker:'bot',result:{wrong:2,points:{bot:2}}}),POOLS.bluffFooled);
assert.equal(bluff({stage:'reveal',maker:'bot',result:{wrong:0,points:{bot:0}}}),POOLS.flopped);
assert.equal(bluff({stage:'reveal',maker:'me',votes:{bot:'high'},result:{points:{bot:0}}}),POOLS.bluffGotFooled);
assert.equal(bluff({stage:'reveal',maker:'me',votes:{bot:'low'},result:{points:{bot:2}}}),POOLS.bluffCaught);

// High Stakes.
const hs=(h)=>chooseScenario({...base,room:{phase:'hs',hs:h}},rng());
assert.equal(hs({stage:'pick'}),POOLS.hsThinking);
assert.equal(hs({stage:'bet',bet:{folded:{bot:true}}}),POOLS.hsFold);
assert.equal(hs({stage:'bet',bet:{raises:1,acted:{bot:true}}}),POOLS.hsBigBet);
assert.equal(hs({stage:'reveal',result:{winners:['bot']}}),POOLS.hsWonPot);
assert.equal(hs({stage:'reveal',result:{winners:['me']},bet:{}}),POOLS.hsLostPot);

// pickFromScenario never repeats and only returns sendable reactions.
const resolve=id=>ids.includes(id)?'e-'+id:null;
const r=rng(3);let last=null;for(let i=0;i<50;i++){const e=pickFromScenario(POOLS.nailedIt,r,last,resolve);assert(e&&e!==last);last=e;}
assert.equal(pickFromScenario(['nope'],r,null,resolve),null);

// End to end: a bot that just flopped reacts with a flop reaction, soon after the results appear.
let t=0;const sent=[];
const state={host:true,playerId:'me',roomCode:'T',room:{gameId:'g',round:1,phase:'question',settings:{totalRounds:5},players:{me:{isHost:true,score:0},bot:{isBot:true,score:0}}}};
const ctl=createBotReactions({getState:()=>state,now:()=>t,random:rng(21),reactions:ids.map(id=>'e-'+id),resolve,send:e=>sent.push({...e,t})});
const run=ms=>{const end=t+ms;for(;t<=end;t+=200)ctl.tick();};
run(2500);state.room.phase='reveal';state.room.revealOrder=[entry('bot',5),entry('me',80)];state.room.players.me.score=2;
const start=t,before=sent.length;run(12000);
const after=sent.slice(before).filter(e=>e.t>=start);
assert(after.length>=1&&after.length<=2,'reacts to the result without piling on');
const flop=new Set([...POOLS.flopped,...POOLS.chatter,...POOLS.nobodyClose,...POOLS.otherFlopped].map(id=>'e-'+id));
assert(after.every(e=>flop.has(e.emoji)),'a bot that flopped picks a fitting reaction: '+after.map(e=>e.emoji));
console.log('Bot reaction scenarios: whole library covered, timer, results, lead, game end, Bluff the Room and High Stakes pools, no repeats passed.');
