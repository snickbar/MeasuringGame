import fs from 'node:fs';
import assert from 'node:assert/strict';
import {currentSettings,validateSettings,validatePicks} from '../anim/object-review-model.mjs';
import {measurementQuestionPrompt} from '../anim/object-review-prompts.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../anim/object-review-data.json',import.meta.url)));
const objects=new Map(data.objects.map(o=>[o.id,o]));assert.equal(objects.size,498);
for(const o of data.objects){
  validateSettings(currentSettings(o),data.types);
  assert(fs.existsSync(new URL('../'+o.image,import.meta.url)),o.id);
  assert.equal(measurementQuestionPrompt(objects.get('penny'),o),o.questionAsBig,o.id);
  assert.equal(measurementQuestionPrompt(o,objects.get('eiffel-tower')),o.questionAsSmall,o.id);
}
const payload={type:'size-em-up-object-picks',version:1,objects:data.objects.map(o=>({id:o.id,settings:currentSettings(o)}))};
assert.deepEqual(validatePicks(payload,data),{});
payload.objects[0].settings.orientation.flip=!payload.objects[0].settings.orientation.flip;
assert.equal(Object.keys(validatePicks(payload,data)).length,1);
assert.throws(()=>validatePicks({...payload,reviewedIds:'ant'},data));
assert.throws(()=>validatePicks({...payload,reviewedIds:['ant','ant']},data));
assert.throws(()=>validatePicks({...payload,reviewedIds:['missing']},data));
assert.equal(Object.keys(validatePicks({...payload,reviewedIds:['ant']},data)).length,1);
for(const corrupt of [p=>p.objects.push(p.objects[0]),p=>p.objects[0].id='missing',p=>p.objects[0].settings.mm=0,p=>p.objects[0].settings.measurement.dimension='area',p=>p.objects[0].settings.orientation.rot=13,p=>p.objects[0].settings.orientation.flip='false',p=>p.objects[0].settings.motionBig='teleport',p=>p.objects[0].settings.measurement.qualifier='x'.repeat(201)]){
  const copy=structuredClone(payload);corrupt(copy);assert.throws(()=>validatePicks(copy,data));
}
console.log('PASS: all 498 current settings and exact game prompts; full export round-trip; invalid/duplicate IDs, values, dimensions, rotations and motions rejected.');
