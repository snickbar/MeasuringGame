import fs from 'node:fs';
import { SETTINGS } from '../anim/scenery.mjs';

const path=process.argv[2];
if(!path)throw Error('Provide the exported scenery-picks JSON path.');
const root=new URL('../',import.meta.url),source=fs.readFileSync(path,'utf8');
const picks=JSON.parse(source),catalog=JSON.parse(fs.readFileSync(new URL('anim/scenery-object-data.json',root),'utf8'));
if(picks.type!=='size-em-up-scenery-picks'||picks.version!==1||!Array.isArray(picks.objects))throw Error('Invalid scenery-picks format.');
const expected=new Set(catalog.objects.map(o=>o.id)),seen=new Set(),groups=Object.fromEntries(Object.keys(SETTINGS).map(scene=>[scene,[]]));
for(const pick of picks.objects){
  if(!expected.has(pick.id)||!Object.hasOwn(groups,pick.scenery)||seen.has(pick.id))throw Error('Unknown or repeated object/scenery: '+pick.id);
  seen.add(pick.id);groups[pick.scenery].push(pick.id);
}
if(seen.size!==expected.size)throw Error('The export must include the complete object list.');
const file=new URL('anim/scenery.mjs',root),old=fs.readFileSync(file,'utf8');
const start=old.indexOf('export const OBJECT_GROUPS = {'),end=old.indexOf('\n};',start)+3;
if(start<0||end<3)throw Error('Scenery mapping not found.');
const mapping='export const OBJECT_GROUPS = {\n'+Object.entries(groups).map(([scene,ids])=>'  '+scene+': `'+ids.sort().join(' ')+'`,').join('\n')+'\n};';
fs.writeFileSync(file,old.slice(0,start)+mapping+old.slice(end));
fs.writeFileSync(new URL('anim/scenery/object-choices.json',root),source);
console.log('Applied '+seen.size+' object selections; no measurements changed.');
