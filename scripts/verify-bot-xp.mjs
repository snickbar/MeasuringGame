import {createCareerLedger,MODE_CODE} from '../anim/career-ledger.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { baseCareerXp, careerXpTotal, opponentXpMultiplier, roundCareerProfile } from '../anim/opponent-xp.mjs';
import { gameRewardKey } from '../anim/game-rewards.mjs';
import { roundAccuracy } from '../anim/accuracy.mjs';

const source=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const extract=name=>{let i=source.indexOf('  function '+name+'(');if(i<0)i=source.indexOf('  async function '+name+'(');assert(i>=0);return source.slice(i,source.indexOf('\n  }',i)+4)};
const math=Object.create(Math);let random=0;math.random=()=>random;
const bot=vm.createContext({Math:math});
vm.runInContext(source.match(/  const BOT_DIFFICULTY_RANGES = [^;]+;/)[0]+'\n'+extract('botGuessValue'),bot);
for(const [r,expected] of [[0,0],[.25,75],[.5,150],[.75,225],[.999999,300]]){random=r;assert.equal(bot.botGuessValue(100,'easy'),expected)}
random=0;assert.equal(bot.botGuessValue(100,'medium'),15);assert.equal(bot.botGuessValue(100,'hard'),60);
random=.999999;assert.equal(bot.botGuessValue(100,'medium'),185);assert.equal(bot.botGuessValue(100,'hard'),140);
assert.equal(Number(source.match(/const SOLO_MIN_BOTS = (\d+)/)[1]),3);
const me={isBot:false},easy={isBot:true,botDifficulty:'easy'},medium={isBot:true,botDifficulty:'medium'},hard={isBot:true,botDifficulty:'hard'};
const fresh=()=>({coins:120,stats:{},history:[],achClaimed:{welcome:true},worlds:{tiny:9}});
assert.equal(opponentXpMultiplier({me,easy},'me'),.8);
assert.equal(opponentXpMultiplier({me,medium},'me'),1.1);
assert.equal(opponentXpMultiplier({me,other:me},'me'),1.1);
assert.equal(opponentXpMultiplier({me,hard},'me'),1.2);
assert.equal(opponentXpMultiplier({me},'me'),1);
assert(Math.abs(opponentXpMultiplier({me,easy,hard,person:me},'me')-(.8+1.2+1.1)/3)<1e-10);
const veteran={rounds:100,roundWins:30,spotOns:10,perfects:2,gamesPlayed:20};
assert.equal(careerXpTotal(veteran),1350,'old XP unchanged');
for(const [opponent,expected] of [[easy,72],[medium,99],[hard,108],[me,99]]){
 const initial=fresh(),awarded=roundCareerProfile(initial,'game_r1',{rounds:1,roundWins:1,spotOns:1,perfects:1},{bestStreak:3},{me,opponent},'me',{t:1,r:1});
 assert.equal(careerXpTotal(awarded.stats),expected);
 assert.equal(awarded.stats.roundWins,1);assert.equal(awarded.stats.spotOns,1);assert.equal(awarded.stats.perfects,1);
 assert.equal(awarded.coins,120);assert.deepEqual(awarded.worlds,initial.worlds);
 assert.equal(initial.stats.rounds,undefined,'input not mutated');
 assert.equal(roundCareerProfile(awarded,'game_r1',{rounds:1},null,{me,opponent},'me'),undefined,'receipt prevents duplicate XP/counters/history');
 assert.equal(awarded.history.length,1);
}
const old={...fresh(),stats:veteran};
assert.equal(careerXpTotal(roundCareerProfile(old,'new',{rounds:1},null,{me,easy},'me').stats),1354);
let bank=fresh();for(let i=0;i<2;i++)bank=roundCareerProfile(bank,'m'+i,{rounds:1},null,{me,medium},'me');
assert.equal(careerXpTotal(bank.stats),11,'fractional XP carries between rounds');
bank=fresh();for(let i=0;i<6;i++)bank=roundCareerProfile(bank,'mixed'+i,{rounds:1},null,{me,easy,hard,person:me},'me');
assert.equal(careerXpTotal(bank.stats),31,'mixed-room fractions carry correctly');
assert.equal(careerXpTotal({rounds:3,gamesPlayed:1}),25,'challenge and completion weights unchanged');

// Execute the actual recorder to cover rendered-summary retries and callbacks.
let profile=fresh(),failure=false,lostResponse=false,transactions=0,levels=0;
const store=new Map(),data={gameId:'game',round:1,animStartAt:1,settings:{solo:true},
 players:{me,easy,afk:hard},currentQuestion:{unitId:'ant',targetId:'door',answer:100},
 revealOrder:[{playerId:'me',guess:70,basePoints:3,isClosest:true,consecutiveWins:2},{playerId:'easy',guess:220}],lastRoundPoints:{me:3}};
const context=vm.createContext({isHlSettings:()=>false,roundAccuracy,MODE_CODE,currentPlayerId:'me',deviceId:'owner',currentPlayers:data.players,currentRoomCode:'ROOM',roundStatsPending:new Set(),
 gameRewardKey,roundCareerProfile,computeRoundBreakdown:()=>({}),grantLevelRewards:()=>levels++,
 localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)},db:{},ref:(_,p)=>p,
 runTransaction:async(_,change)=>{transactions++;await Promise.resolve();if(failure)throw Error('offline');const next=change(structuredClone(profile));if(next)profile=next;if(lostResponse){lostResponse=false;throw Error('lost response')}return {committed:!!next,snapshot:{val:()=>structuredClone(profile)}}},console:{warn(){}}});
context.careerLedger=createCareerLedger({owner:()=>context.deviceId,storage:context.localStorage,transaction:(id,fn)=>context.runTransaction(id,fn),onSaved:()=>{levels++}});
vm.runInContext(extract('recordRoundStats'),context);
await Promise.all([context.recordRoundStats(data),context.recordRoundStats(data)]);await context.careerLedger.flush();
assert.equal(transactions,1);assert.equal(careerXpTotal(profile.stats),12,'AFK Hard bot excluded; active Easy gives 0.8×');
assert.equal(profile.history.length,1);assert.equal(levels,1);
store.clear();await context.recordRoundStats(data);await context.careerLedger.flush();assert.equal(profile.stats.rounds,1);assert.equal(profile.history.length,1,'reopened summary does not duplicate history');
data.round=2;failure=true;await context.recordRoundStats(data);await context.careerLedger.flush();assert.equal(profile.stats.rounds,1);
failure=false;lostResponse=true;await context.recordRoundStats(data);await context.careerLedger.flush();assert.equal(profile.stats.rounds,2);
await context.recordRoundStats(data);await context.careerLedger.flush();assert.equal(profile.stats.rounds,2);assert.equal(profile.history.length,2,'lost response retry stays atomic');
assert.equal(baseCareerXp(profile.stats),30);assert.equal(careerXpTotal(profile.stats),24);
console.log('PASS: widened Easy range, unchanged Medium/Hard guesses, three-bot default, opponent XP rates, historical XP, mixed/fractional XP, real round recorder, AFK exclusion, atomic counters/history and retry receipts.');
