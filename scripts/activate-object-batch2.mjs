// Reapply the approved picker settings to the active batch without changing artwork or Worlds.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {validatePicks,validateSettings} from '../anim/object-review-model.mjs';
import {liveBatch2Id} from '../anim/object-batch2-ids.mjs';
const read=p=>fs.readFileSync(p,'utf8');
const batch=JSON.parse(read('anim/object-review-batch2-data.json'));
const picks=JSON.parse(read('art-source/object-batch2-2026-11-06/approved-choices.json'));
assert.equal(picks.batch,batch.batch);validatePicks(picks,batch);assert.equal(picks.objects.length,105);
let html=read('index.html'),engine=read('anim/stack-anim.js'),orientation=read('anim/orient-data.js');
const detailMatch=html.match(/  const MEASUREMENT_DETAILS = (\{[\s\S]*?\n  \});/);
const motionMatch=engine.match(/const MOTION = (\{[\s\S]*?\n\});/);
const orientMatch=orientation.match(/export const ORIENT = (\{[^\n]*\});/);
const details=vm.runInNewContext('('+detailMatch[1]+')'),motions=vm.runInNewContext('('+motionMatch[1]+')'),orient=JSON.parse(orientMatch[1]);
for(const row of picks.objects){
 const id=liveBatch2Id(row.id),s=validateSettings(row.settings,batch.types);
 const pattern=new RegExp('(\\{ id: "'+id+'"[^\\n]*?mm: )[-\\d.]+');
 assert(pattern.test(html),'Missing active object: '+id);
 html=html.replace(pattern,(_,prefix)=>prefix+s.mm);
 details[id]=s.measurement;orient[id]=s.orientation;
 if(id!==row.id)delete orient[row.id];
 motions[id]=s.motionSmall===s.motionBig?s.motionSmall:{small:s.motionSmall,big:s.motionBig};
}
html=html.replace(detailMatch[0],'  const MEASUREMENT_DETAILS = '+JSON.stringify(details,null,2).replaceAll('\n','\n  ')+';');
engine=engine.replace(motionMatch[0],'const MOTION = '+JSON.stringify(motions,null,2)+';');
orientation=orientation.replace(orientMatch[0],'export const ORIENT = '+JSON.stringify(orient)+';');
fs.writeFileSync('index.html',html);fs.writeFileSync('anim/stack-anim.js',engine);fs.writeFileSync('anim/orient-data.js',orientation);
console.log('Applied all 105 approved choices to the live object identities.');
