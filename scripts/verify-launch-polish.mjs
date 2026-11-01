import assert from 'node:assert/strict';
import {reactionAvailability} from '../anim/reaction-availability.mjs';
import {createWorldProgressPolish} from '../anim/world-progress-polish.mjs';
import {replacementPairs, replacementPairsResponsive} from '../anim/powerups.mjs';
for(const phase of ['question','answers','reveal','summary','final']) {
  assert(reactionAvailability({room:{phase}}).allowed,phase);
  assert(!reactionAvailability({room:{phase,paused:true}}).allowed);
  assert(!reactionAvailability({room:{phase},visible:false}).allowed);
  assert(!reactionAvailability({room:{phase},overlay:true}).allowed);
}
for(const phase of ['animation','countdown','waiting','ended','unknown'])assert(!reactionAvailability({room:{phase}}).allowed);
assert(!reactionAvailability({room:{phase:'bluff',bluff:{stage:'animation'}}}).allowed);
assert(reactionAvailability({room:{phase:'bluff',bluff:{stage:'vote'}}}).allowed);
for(const stage of ['animation','anim','countdown','dealing'])assert(!reactionAvailability({room:{phase:'hs',hs:{stage}}}).allowed);
assert(!reactionAvailability({room:{phase:'hs',hs:{stage:'reveal',animEndsAt:200}},now:100}).allowed);
assert(reactionAvailability({room:{phase:'hs',hs:{stage:'reveal',animEndsAt:200}},now:200}).allowed);
assert(!reactionAvailability({room:{phase:'hs',hs:{stage:'reveal'}},now:200}).allowed);
const objects=Array.from({length:120},(_,i)=>({id:String(i),mm:i+1})),q={unitId:'4',targetId:'100'};
const allowed=(u,t)=>(Number(u.id)+Number(t.id))%3===0;
// Preserve every valid choice and its order while reducing single-object searches.
const legacy=kind=>objects.flatMap(u=>objects.filter(t=>!(kind==='big'?u.id!==q.unitId:u.id===q.unitId)&&!(kind==='small'?t.id!==q.targetId:t.id===q.targetId)&&u.id!==t.id&&u.mm<t.mm&&allowed(u,t)).map(t=>[u,t]));
for(const kind of ['small','big','both']) {
  assert.deepEqual(replacementPairs(q,kind,objects,allowed),legacy(kind));
  assert.deepEqual(await replacementPairsResponsive(q,kind,objects,allowed,async()=>{}),legacy(kind));
}
assert.deepEqual(await replacementPairsResponsive(q,'both',objects,undefined,async()=>{}),replacementPairs(q,'both',objects),'optional eligibility filter stays optional');
let owner='one',clock=0;
const classes=()=>{const values=new Set();return {add:k=>values.add(k),has:k=>values.has(k),contains:k=>values.has(k)}};
const star=()=>({classList:classes(),style:{setProperty(){}}});
const stars=[star(),star(),star()];stars[2].classList.add('off');
const note={classList:classes(),style:{setProperty(){}}},next={classList:classes(),style:{setProperty(){}}};
const card={querySelectorAll:()=>stars,querySelector:()=>note};
const root={querySelector:selector=>selector==='#wl-level-1'?card:selector==='#wl-level-2:not(:disabled)'?next:null};
const progress=createWorldProgressPolish({owner:()=>owner,now:()=>clock});
progress.record({world:'tiny',level:1,from:0,to:2,best:true,run:'test'});progress.apply(root,'tiny');
assert(stars[0].classList.has('world-star-land')&&stars[1].classList.has('world-star-land'));
assert(!stars[2].classList.has('world-star-land'));assert(next.classList.has('world-level-open'));assert(note.classList.has('world-best-updated'));
for(const s of stars)s.classList=classes();clock=4000;progress.apply(root,'tiny');assert(stars.every(s=>!s.classList.has('world-star-land')),'finished celebration never restarts');
owner='two';progress.apply(root,'tiny');assert(stars.every(s=>!s.classList.has('world-star-land')),'account isolation');
console.log('PASS: shared reaction states, animation deadlines, unchanged reroll choice pools/order, new-star-only Worlds feedback, no replay and account isolation.');
