import assert from 'node:assert/strict';
import fs from 'node:fs';import vm from 'node:vm';
import {initialChoices,validateChoices,swapAvatars} from '../anim/avatar-tier-choices.mjs';
const source=fs.readFileSync('index.html','utf8'),read=name=>vm.runInNewContext('('+source.match(new RegExp('const '+name+' = (\\{[\\s\\S]*?\\n  \\});'))[1]+')');
const tiers=read('AVATAR_TIERS'),names=read('BOT_NAME_BY_AVATAR'),previous=JSON.parse(fs.readFileSync('art-source/default-avatar-expansion-2026-10-22/previous-tiers.json'));
const approved=JSON.parse(fs.readFileSync('art-source/default-avatar-expansion-2026-10-22/approved-tiers.json'));
for(const [id,tier]of Object.entries(previous))if(!['default','common'].includes(tier))assert.equal(tiers[id],tier,'Protected tier unchanged: '+id);
assert.deepEqual(Object.entries(tiers).filter(([,t])=>['default','common'].includes(t)).map(([id,tier])=>({id,tier})),approved.items,'Exact approved order and tiers');
assert.deepEqual(Object.keys(tiers).filter(id=>!['default','common'].includes(tiers[id])),Object.keys(previous).filter(id=>!['default','common'].includes(previous[id])),'Protected order unchanged');
for(let n=314;n<=325;n++){assert(tiers['av'+n]);assert(names['av'+n]);assert(fs.statSync('avatars/av'+n+'.png').size>1000);}
assert.equal(new Set(Object.values(names)).size,Object.keys(names).length,'Distinct bot names');
const data=JSON.parse(fs.readFileSync('anim/avatar-tier-review-data.json'));assert.equal(data.items.filter(r=>r.tier==='default').length,approved.items.filter(r=>r.tier==='default').length);assert.equal(data.items.filter(r=>r.new).length,12);assert(data.items.every(r=>['default','common'].includes(r.tier)));
const items=initialChoices(data),a=items.find(r=>r.tier==='default'),b=items.find(r=>r.tier==='common'),swapped=swapAvatars(items,a.id,b.id);
assert.equal(swapped.find(r=>r.id===a.id).tier,'common');assert.equal(swapped.find(r=>r.id===b.id).tier,'default');assert.equal(items.find(r=>r.id===a.id).tier,'default','Swap does not mutate input');
const file={type:'size-em-up-avatar-tiers',version:1,fingerprint:data.fingerprint,items:swapped};assert.deepEqual(validateChoices(data,file),swapped);
assert.throws(()=>validateChoices(data,{...file,items:swapped.map((r,i)=>i===0?{id:'av313',tier:'default'}:r)}),'Rare/Ultra cannot enter the review');
assert.throws(()=>validateChoices(data,{...file,items:swapped.map((r,i)=>i===1?swapped[0]:r)}),'Duplicate IDs rejected');
assert.throws(()=>validateChoices(data,{...file,fingerprint:'old'}),'Old review mismatch rejected');
console.log('Avatar expansion: approved Default/Common order and tiers, protected Rare/Ultra, unique names, safe swaps and import validation passed.');
