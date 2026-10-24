import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const ui=fs.readFileSync('anim/bluff-ui.mjs','utf8');
const functions=ui.slice(ui.indexOf('  function cancelRevealTimers('),ui.indexOf('  function celebrateRound('));
for(const change of ['none','hidden','paused','standings','next-round','next-game','left','final','reduced']){
 const tasks=[],played=[],room={phase:'bluff',gameId:'g1',bluff:{round:1,stage:'reveal',order:['m','a','b'],maker:'m',votes:{a:'low',b:'correct'},claim:{kind:'correct'}}};
 let shown=true,quiet=false,leaving=false;
 const context={timers:[],timersKey:'',reduced:()=>quiet,visible:()=>shown,context:()=>({room,me:'a',leaving}),BLUFF_LABELS:{low:'Low',correct:'Correct',high:'High'},bluffRevealTimes:()=>({verdict:1100,drop0:1700,step:380,judged:2780}),setTimeout:fn=>(tasks.push(fn),tasks.length),clearTimeout:()=>{},sound:x=>played.push(x),vibrate:()=>played.push('buzz')};
 vm.createContext(context);vm.runInContext(functions,context);context.sample=room.bluff;vm.runInContext('scheduleReveal(sample,"g1:1")',context);
 if(change==='hidden')shown=false;if(change==='paused')room.paused=true;if(change==='standings')room.bluff.showStand=true;
 if(change==='next-round')room.bluff.round=2;if(change==='next-game')room.gameId='g2';if(change==='left')leaving=true;if(change==='final')room.phase='final';if(change==='reduced')quiet=true;
 tasks.forEach(fn=>fn());assert.equal(played.length,change==='none'?5:0,'Delayed sound and vibration: '+change);
}
const index=fs.readFileSync('index.html','utf8');
const keyLine=index.match(/const rollKey =[^\n]+/)[0];
let key=null,rolls=0;
for(const [phase,roundNo,gameId] of [['countdown',1,'g1'],['question',1,'g1'],['answers',1,'g1'],['summary',1,'g1'],['countdown',2,'g1'],['question',2,'g1'],['countdown',1,'g2'],['question',1,'g2']]){
 const next=vm.runInNewContext(keyLine+';rollKey',{roundNo,data:{phase,gameId,countdownRound:roundNo,countdownEndsAt:123}});
 if(next&&next!==key){rolls++;key=next;}
}
assert.equal(rolls,3,'Exactly one random cosmetic roll per round, including first round and rematch');
console.log('PASS: Reveal callbacks stop after navigation/pause/round changes; cosmetics roll once per round.');
