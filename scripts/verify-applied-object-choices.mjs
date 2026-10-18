import fs from 'node:fs';
import assert from 'node:assert/strict';
import {currentSettings,validateSettings,validatePicks} from '../anim/object-review-model.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const applied=read('art-source/object-review/applied-choices.json'),original=read('art-source/object-review/original-choices.json'),report=read('art-source/object-review/change-report.json'),catalog=read('anim/object-review-data.json');
assert.equal(report.length,22);assert.equal(applied.objects.length,479);
for(const row of applied.objects){
  const actual=catalog.objects.find(o=>o.id===row.id);
  assert.deepEqual(validateSettings(currentSettings(actual),catalog.types),validateSettings(row.settings,catalog.types),'game settings: '+row.id);
  const originalRow=original.objects.find(o=>o.id===row.id);
  if(row.id!=='t-rex')assert.deepEqual(row.settings,originalRow.settings,'exact exported choice: '+row.id);
}
const trex=catalog.objects.find(o=>o.id==='t-rex');assert.equal(trex.mm,4600);assert.deepEqual(trex.measurement,{dimension:'height'});
assert.deepEqual(validatePicks(original,catalog),{},'old phone draft recognizes the choices already applied with the agreed correction');
const engine=fs.readFileSync(new URL('../anim/stack-anim.js',import.meta.url),'utf8');
assert(engine.includes('travelLift(bigKind, hu, bw, 0)'));
assert(engine.includes("i === 0 && !smLean && smKind !== 'slide'"));
console.log('PASS: all 479 game settings match the resolved export; 22 changed objects, only T. rex size corrected, and both upright roles honor travel style.');
