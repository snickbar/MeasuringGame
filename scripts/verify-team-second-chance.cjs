const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('index.html','utf8'),start=source.indexOf('  async function finishRoundScoring('),end=source.indexOf('  const WINNER_REVEAL_EXTRA_MS',start);
const sandbox={roundAccuracy:r=>Math.max(0,100-Math.abs(1-r)*100),effectiveGuess:(q,g)=>g,TRUTH_ID:'truth',questionObjects:()=>null,
 nowMs:()=>1000,currentSettings:{},db:{},ref:()=>null,scheduleHostDeadline:()=>{},console:{log(){},error(){}},update:async(_,value)=>{sandbox.written=value;}};
vm.createContext(sandbox);vm.runInContext(source.slice(start,end),sandbox);
async function score(picks,a=100){sandbox.roomState={settings:{mode:'teamvteam'},currentQuestion:{answer:100},players:{a:{team:'red'},b:{team:'red'},c:{team:'blue'},d:{team:'blue'}}};await sandbox.finishRoundScoring('test',['a','b','c','d'],{a,b:80,c:40,d:20},picks);return sandbox.written;}
(async()=>{
 let r=await score({b:{type:'pick',targetPlayerId:'a'}});assert.equal(r.lastRoundPoints.a,5);assert.equal(r.lastRoundPoints.b,5);assert.equal(r.revealOrder.find(e=>e.playerId==='a').pickedBy[0].points,0);
 r=await score({a:{type:'doubledown'},b:{type:'pick',targetPlayerId:'a'}});assert.equal(r.lastRoundPoints.a,7);assert.equal(r.lastRoundPoints.b,7);assert.equal(r['players/a/individualPoints'],7);assert.equal(r['players/b/individualPoints'],0,'Shared 7 is not another teammate contribution');
 r=await score({a:{type:'doubledown'},b:{type:'pick',targetPlayerId:'a'},c:{type:'pick',targetPlayerId:'a'}});assert.equal(r.lastRoundPoints.a,8,'Crowd favorite adds one only after two picks');
 r=await score({a:{type:'doubledown'},b:{type:'pick',targetPlayerId:'truth'}},98);assert.equal(r.lastRoundPoints.a,6,'Closest 3 + double down 2 + hidden truth second chance 1');
 // The tutorials demonstrate this same round; verify its points with the real scorer.
 for(const mode of ['party','teamvteam']){
  sandbox.roomState={settings:{mode},currentQuestion:{answer:2},players:{a:{team:'red'},b:{team:'red'},c:{team:'blue'},d:{team:'blue'}}};
  await sandbox.finishRoundScoring('test',['a','b','c','d'],{a:1.8,b:3,c:1,d:4},{a:{type:'doubledown'},b:{type:'pick',targetPlayerId:'truth'}});
  const scored=sandbox.written;
  assert.equal(scored.lastRoundPoints.a,mode==='teamvteam'?6:5,'Alex: closest 3 + double down 2, plus Sam’s 1 in team total');
  assert.equal(scored.lastRoundPoints.b,mode==='teamvteam'?6:1,'Sam: hidden answer +1');
  assert.equal(scored.lastRoundPoints.c,0);assert.equal(scored.lastRoundPoints.d,0);
 }
 console.log('Team scoring audit: teammate picks add zero, exact win 5, double down 7, crowd favorite 8, shared totals not doubled, hidden truth bonus independent, and actual tutorial round passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
