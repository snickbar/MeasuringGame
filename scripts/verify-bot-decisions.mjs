import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {botDecisionScope,commitBotDecision} from '../anim/bot-decisions.mjs';
import {questionClockPending} from '../anim/question-clock.mjs';

const fresh=phase=>({phase,round:1,gameId:'game-1',currentQuestion:{powerupKey:'q-1',prompt:'A question?',unitId:'ant',targetId:'door',answer:100},
 players:{host:{isHost:true,connected:true},other:{connected:true},bot:{isBot:true,botDifficulty:'medium'}},questionEndsAt:9000,answersEndsAt:9000});
for(const field of ['guesses','picks']){
 const room=fresh(field==='guesses'?'question':'answers'),scope=botDecisionScope(room),value=field==='guesses'?0:{type:'doubledown',targetPlayerId:'bot'};
 const committed=commitBotDecision(room,scope,'host','bot',field,value,1000);
 assert.deepEqual(committed[field].bot,value);assert.equal(room[field],undefined,'input stays immutable');
 assert.equal(commitBotDecision(committed,scope,'host','bot',field,999,1000),undefined,'even a zero guess cannot be overwritten');
 for(const patch of [{phase:'summary'},{paused:true},{round:2},{gameId:'game-2'},
  {currentQuestion:{...room.currentQuestion,powerupKey:'q-2'}},{currentQuestion:{...room.currentQuestion,unitId:'other'}},
  {players:{...room.players,host:{isHost:false}}},{players:{...room.players,host:{isHost:true,connected:false}}},
  {players:{host:room.players.host}},{questionClock:{key:'rerolled',startedAt:500}}]){
  assert.equal(commitBotDecision({...room,...patch},scope,'host','bot',field,value,1000),undefined,JSON.stringify(patch));
 }
 assert.equal(commitBotDecision(room,scope,'host','bot',field,value,9000),undefined,'expired decisions are rejected');
}
const pending={...fresh('question'),questionClock:{key:'reading',startedAt:0}};
assert.equal(commitBotDecision(pending,botDecisionScope(pending),'host','bot','guesses',100,1000),undefined);

// Exercise the actual app schedulers, with deliberately stale client snapshots.
// This models duplicate resume timers and two hosts racing against one server.
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const source=html.slice(html.indexOf('  function scheduleBotGuesses('),html.indexOf('  kickYesBtn.addEventListener',html.indexOf('  function scheduleBotGuesses(')));
function harness(phase){
 let server=fresh(phase),n=100;const jobs=[],writes=[];
 const context={roomState:structuredClone(server),currentRoomCode:'TEST',currentPlayerId:'host',isHost:true,currentSettings:{timerSeconds:30},
  botDecisionScope,commitBotDecision,questionClockPending,nowMs:()=>1000,console,db:{},ref:(_,path)=>path,
  setTimeout:fn=>jobs.push(fn),botGuessValue:()=>n++,isHlSettings:()=>false,
  runTransaction:async(path,fn)=>{const next=fn(server);if(next!==undefined){server=next;writes.push(structuredClone(next));}return{committed:next!==undefined}}};
 vm.createContext(context);vm.runInContext(source,context);
 return {context,jobs,writes,server:()=>server,update:fn=>{server=fn(server)},schedule:()=>vm.runInContext(phase==='question'?'scheduleBotGuesses("TEST",roomState.currentQuestion)':'scheduleBotPicks("TEST",[{playerId:"other"},{playerId:"bot"}])',context)};
}
for(const phase of ['question','answers']){
 const h=harness(phase);h.schedule();h.schedule();assert.equal(h.jobs.length,2);
 h.jobs.forEach(fn=>fn());assert.equal(h.writes.length,1,'duplicate callbacks commit exactly once: '+phase);
 const field=phase==='question'?'guesses':'picks';assert(h.server()[field].bot!==undefined);
 const stale=harness(phase);stale.schedule();stale.update(room=>({...room,round:2}));stale.jobs[0]();assert.equal(stale.writes.length,0,'stale server round blocks an old client');
 const handoff=harness(phase);handoff.schedule();handoff.update(room=>({...room,players:{...room.players,host:{isHost:false},other:{isHost:true,connected:true}}}));handoff.jobs[0]();assert.equal(handoff.writes.length,0,'old host cannot submit after transfer');
 handoff.context.roomState=structuredClone(handoff.server());handoff.context.currentPlayerId='other';handoff.schedule();handoff.jobs.at(-1)();assert.equal(handoff.writes.length,1,'replacement host can submit');
 const paused=harness(phase);paused.schedule();paused.context.roomState.paused=true;paused.jobs[0]();assert.equal(paused.writes.length,0);
}
console.log('PASS: actual bot guess/pick schedulers, duplicate callbacks, atomic first-write wins, host transfer, stale rounds/games/rerolls, pause and deadlines.');
