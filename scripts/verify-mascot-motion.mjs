import assert from 'node:assert/strict';
import { MASCOT_POSES, mascotFrame, pickMascotReaction, mascotMarkup } from '../anim/mascot-poses.mjs';

const ids=['ant','cats','dogs','rooster','squirrel','raccoon','worlds','teamworlds','pig','hlbird','hlshark'];
for(const id of ids)for(const mood of ['idle','win','soso','lose']) {
  const spec=MASCOT_POSES[id],key=`verify:${id}:${mood}`;
  const selected=pickMascotReaction(id,mood,key,()=>.4),rest=spec.idle[0];
  const first=spec.count+selected*2,second=first+1;
  if(id==='worlds'&&selected===5){ // his balloon never deflates: a lost round shows the worried face (frame 16) and returns to rest
    assert.deepEqual([0,680,800,950,2240,2360,2800].map(t=>mascotFrame(id,mood,t,key)),[rest,16,16,16,16,16,rest],'worlds/lose keeps the balloon full');
    assert.equal(mascotFrame(id,mood,850,key,true),16);
    continue;
  }
  for(let cycle=0;cycle<3;cycle++) {
    assert.deepEqual([0,680,800,950,2240,2360,2800].map(t=>mascotFrame(id,mood,t+cycle*3600,key)),[rest,first,second,selected,second,first,rest],`${id}/${mood} follows its selected gesture forward and back`);
  }
  assert.equal(mascotFrame(id,mood,-800,key),rest,'Delay holds resting pose');
  assert.equal(mascotFrame(id,mood,850,key,true),mood==='idle'?rest:selected,'Reduced motion remains still');
  const markup=mascotMarkup(id,mood,{key});
  assert(markup.includes(`${id}-motion.webp`));
  assert(markup.includes(`background-size:${spec.count*300}%`));
  assert.equal(pickMascotReaction(id,mood,key,()=>.99),selected,'Re-rendering cannot choose a new gesture');
}
assert(!mascotMarkup('survival','win').includes('survival-motion'));
assert(!mascotMarkup('bigger','win').includes('bigger-motion'));
console.log('Eleven recent mascot sets: connecting frames, reverse path, stable choices, delay and reduced motion verified. Older rigs retain their existing assets.');
