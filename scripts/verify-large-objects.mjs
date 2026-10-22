import assert from 'node:assert/strict';
import fs from 'node:fs';
import {sceneryFor} from '../anim/scenery.mjs';
import {currentSettings,validateSettings,validatePicks} from '../anim/object-review-model.mjs';
const catalog=JSON.parse(fs.readFileSync('anim/object-review-data.json','utf8'));
const ORIENT=JSON.parse(fs.readFileSync('anim/orient-data.js','utf8').match(/export const ORIENT = (\{[^\n]+\});/)[1]);
const manifest=JSON.parse(fs.readFileSync('art-source/large-objects-2026-10/manifest.json','utf8'));
const picks=JSON.parse(fs.readFileSync('art-source/object-review-large-objects/applied-choices.json','utf8'));
assert.deepEqual(validatePicks(picks,catalog),{},'All phone-exported choices are applied');
assert.equal(manifest.objects.length,12);
assert.equal(catalog.objects.filter(o=>o.group!=='Seasonal').length,373);
const scenes=['stadium','stadium','forest','underwater','beach','city','city','stadium','desert','beach','city','city'];
for(const [i,row]of manifest.objects.entries()){
  const object=catalog.objects.find(o=>o.id===row.id);
  assert(object,row.id);assert.equal(object.mm,row.mm);assert.equal(object.measurement.dimension,row.dimension);
  const chosen=picks.objects.find(o=>o.id===row.id);
  assert.deepEqual(validateSettings(currentSettings(object),catalog.types),validateSettings(chosen.settings,catalog.types),'Exact phone settings: '+row.id);
  assert(!object.measurement.qualifier,'User removed parenthetical descriptions');
  assert.equal(object.collection,'new-2026-10');assert.equal(object.group,'Standard');
  assert.equal(sceneryFor(object),scenes[i]);
  assert(ORIENT[row.id]);assert(object.questionAsBig.endsWith('?'));assert(object.questionAsSmall.endsWith('?'));
  const image=fs.readFileSync(row.image);assert.equal(image.toString('ascii',0,4),'RIFF');assert.equal(image.toString('ascii',8,12),'WEBP');
  const original=fs.readFileSync('art-source/large-objects-2026-10/'+row.original);
  assert.equal(original.toString('ascii',1,4),'PNG');assert.equal(original[25],6,'Original sprite retains RGBA alpha');
}
console.log('PASS: 12 new objects, 373 permanent objects, artwork files/alpha sources, measurements, scenery and exact phone-exported orientation settings.');
