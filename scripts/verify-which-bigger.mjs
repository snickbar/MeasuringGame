import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pickBiggerPair,isCorrectPick,targetLogRatio,roundKind,gapWindow,MIN_RATIO,START_RATIO,RAMP_ROUNDS,RANDOM_CHANCE,BREATHER_CHANCE,SPIKE_CHANCE} from '../anim/which-bigger.mjs';

// Real catalog (same object sizes the game uses).
const catalog=JSON.parse(fs.readFileSync(new URL('../anim/object-review-data.json',import.meta.url),'utf8')).objects.map(o=>({id:o.id,mm:o.mm}));
assert(catalog.length>=500,'catalog loaded');

// Seeded rng so the checks are repeatable.
const seeded=seed=>()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};

// Ramp: the typical gap shrinks from START_RATIO to MIN_RATIO over RAMP_ROUNDS and then holds.
assert(Math.abs(Math.exp(targetLogRatio(1))-START_RATIO)<1e-6);
assert(Math.abs(Math.exp(targetLogRatio(RAMP_ROUNDS))-MIN_RATIO)<1e-6);
assert(Math.abs(Math.exp(targetLogRatio(RAMP_ROUNDS+50))-MIN_RATIO)<1e-6,'plateau after the ramp');
for(let r=2;r<=RAMP_ROUNDS;r++)assert(targetLogRatio(r)<targetLogRatio(r-1),'ramp shrinks every round');
assert.equal(roundKind(0),'random');assert.equal(roundKind(RANDOM_CHANCE),'breather');assert.equal(roundKind(RANDOM_CHANCE+BREATHER_CHANCE),'spike');assert.equal(roundKind(RANDOM_CHANCE+BREATHER_CHANCE+SPIKE_CHANCE),'ramp');assert.equal(roundKind(0.99),'ramp');
for(let r=1;r<=40;r++)for(const kind of ['ramp','breather','spike','random']){const[lo,hi]=gapWindow(r,kind);assert(lo>=Math.log(MIN_RATIO)-1e-9&&hi>lo,`window ${kind} r${r}`);}

// Simulate many runs.
const RUNS=300,ROUNDS=60;
const byRound=Array.from({length:ROUNDS+1},()=>({sum:0,n:0}));
let rightSide=0,total=0,randoms=0,breathers=0,spikes=0,stepUps=0,steps=0;
const kindsSeen=new Set();
for(let run=0;run<RUNS;run++){
  const rng=seeded(run+1),used=new Set();let prev=null;
  for(let round=1;round<=ROUNDS;round++){
    const pair=pickBiggerPair({objects:catalog,round,used,rng});
    const{left,right,bigger,smaller,ratio,kind}=pair;
    // Legal pair
    assert(bigger.mm>smaller.mm,'never equal size');
    assert(ratio>=MIN_RATIO-1e-9,`gap never below ${MIN_RATIO}: ${ratio}`);
    assert.notEqual(left.id,right.id);
    assert(isCorrectPick(pair,bigger.id)&&!isCorrectPick(pair,smaller.id));
    assert([left.id,right.id].sort().join()===[bigger.id,smaller.id].sort().join(),'cards are the pair');
    // No repeats while unused objects remain (60 rounds uses 120 of 500+)
    assert(!used.has(left.id)&&!used.has(right.id),`no repeat in a run (run ${run} round ${round})`);
    assert.equal(pair.recycled,false);
    used.add(left.id);used.add(right.id);
    byRound[round].sum+=Math.log(ratio);byRound[round].n++;
    if(right.id===bigger.id)rightSide++;total++;
    kindsSeen.add(kind);if(kind==='random')randoms++;if(kind==='breather')breathers++;if(kind==='spike')spikes++;
    if(prev!==null){steps++;if(Math.log(ratio)>prev)stepUps++;}
    prev=Math.log(ratio);
  }
}
const avg=r=>byRound[r].sum/byRound[r].n;
// Gap shrinks in general...
assert(avg(1)>avg(5)&&avg(5)>avg(10)&&avg(10)>avg(18),'average gap shrinks over the ramp');
assert(Math.exp(avg(1))>10,'opening rounds are comfortably apart');assert(Math.exp(avg(1))<500,'opening rounds are not trivially easy');
assert(Math.exp(avg(RAMP_ROUNDS+10))<20,'late rounds are close');
// ...but not every round: the gap often goes back up.
assert(stepUps/steps>0.25,`gap goes back up here and there (${(stepUps/steps).toFixed(2)})`);
assert.deepEqual([...kindsSeen].sort(),['breather','ramp','random','spike']);
assert(Math.abs(randoms/total-RANDOM_CHANCE)<0.04&&Math.abs(breathers/total-BREATHER_CHANCE)<0.04&&Math.abs(spikes/total-SPIKE_CHANCE)<0.04,'round kinds follow their chances');
// The bigger object is on either side about equally.
assert(Math.abs(rightSide/total-0.5)<0.03,`bigger object side balanced (${(rightSide/total).toFixed(3)})`);

// Running out: a tiny catalog recycles objects instead of failing.
const tiny=[{id:'a',mm:10},{id:'b',mm:100},{id:'c',mm:1000}];
const used=new Set(),rng=seeded(7);let recycled=0;
for(let r=1;r<=12;r++){const p=pickBiggerPair({objects:tiny,round:r,used,rng});if(p.recycled){recycled++;used.clear();}used.add(p.left.id);used.add(p.right.id);assert(p.ratio>=MIN_RATIO);}
assert(recycled>0,'reuses objects only after running out');
// All-equal-size objects have no legal pair.
assert.throws(()=>pickBiggerPair({objects:[{id:'x',mm:5},{id:'y',mm:5}],rng}),/No legal pair/);
assert.throws(()=>pickBiggerPair({objects:[{id:'x',mm:5}],rng}),/at least two/);
// Unmeasurable entries are ignored.
const p=pickBiggerPair({objects:[{id:'bad',mm:0},{id:'nan',mm:NaN},{id:'s',mm:1},{id:'l',mm:50}],rng:seeded(3)});
assert([p.left.id,p.right.id].sort().join()==='l,s');

console.log(`Which Is Bigger pair picker: ${RUNS} runs x ${ROUNDS} rounds, gap shrinks (round 1 ~${Math.exp(avg(1)).toFixed(0)}x, round ${RAMP_ROUNDS} ~${Math.exp(avg(RAMP_ROUNDS)).toFixed(1)}x) with ${(100*stepUps/steps).toFixed(0)}% step-backs, no ties, floor ${MIN_RATIO}x, no repeats until exhausted, sides balanced passed.`);
