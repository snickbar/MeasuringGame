import fs from 'node:fs';
import vm from 'node:vm';
import { sceneryFor } from '../anim/scenery.mjs';
import {liveBatch2Id} from '../anim/object-batch2-ids.mjs';

const root = new URL('../', import.meta.url);
const html = fs.readFileSync(new URL('index.html', root), 'utf8');
const engine = fs.readFileSync(new URL('anim/stack-anim.js', root), 'utf8');
const orient = fs.readFileSync(new URL('anim/orient-data.js', root), 'utf8');
const array = name => 'const '+name+' = '+html.match(new RegExp('const '+name+' = (\\[[\\s\\S]*?\\n  \\]);'))[1]+';';
const start = html.indexOf('  const MEASUREMENT_GROUPS = {');
const end = html.indexOf('\n', html.indexOf('  const OBJECT_BY_ID = ', start));
const helpersStart = html.indexOf('  function articleFor(obj)');
const helpersEnd = html.indexOf('  // Items with two pictures', helpersStart);
const sandbox = {};
vm.runInNewContext([
  ...['OBJECTS','HOLIDAY_OBJECT_DEFS','FANTASY_OBJECT_DEFS'].map(array),
  'OBJECTS.forEach(o=>o.group="Standard");',
  'const HOLIDAY_OBJECTS=HOLIDAY_OBJECT_DEFS.map(d=>({id:d[1],name:d[2],plural:d[3],mm:d[4],image:`items/${d[1]}.webp`,group:"Seasonal",pack:d[0]}));',
  'const FANTASY_OBJECTS=FANTASY_OBJECT_DEFS.map(d=>({id:d[0],name:d[1],plural:d[2],mm:d[3],image:`items/${d[0]}.webp`,group:"Fantasy",properNoun:!!d[5]}));',
  html.slice(start,end), html.slice(helpersStart,helpersEnd),
  orient.replace('export const ORIENT', 'const ORIENT'),
  engine.match(/const MOTION = \{[\s\S]*?\n\};/)[0],
  engine.match(/const ORIENT_DEFAULT = .*;/)[0],
  'const motionFor=(o,side)=>typeof MOTION[o.id]==="string"?MOTION[o.id]:MOTION[o.id]?.[side]||"slide";',
  'globalThis.result={objects:ALL_OBJECTS.map(o=>({...o,orientation:ORIENT[o.id]||ORIENT_DEFAULT,motionSmall:motionFor(o,"small"),motionBig:motionFor(o,"big"),questionAsBig:measurementQuestionPrompt(OBJECT_BY_ID.get("penny"),o),questionAsSmall:measurementQuestionPrompt(o,OBJECT_BY_ID.get("eiffel-tower"))})),types:MEASUREMENT_TYPES};'
].join('\n'), sandbox, {timeout:2000});
// The 55 monthly-expansion icons count as new objects in the picker's "New objects" filter.
const NEW_MONTHLY=new Set(fs.readdirSync(new URL('art-source/monthly-expansion-55/',root)).filter(f=>f.endsWith('.png')&&fs.existsSync(new URL(`items/${f.slice(0,-4)}.webp`,root))).map(f=>f.slice(0,-4)));
const NEW_NOVEMBER=new Set(['cherry','mouse','spinning-top','toy-jack','seal','satellite','crab','tumbleweed','spaghetti-strainer','soup-ladle']);
const LATEST_OBJECTS=new Set(JSON.parse(fs.readFileSync(new URL('art-source/new-object-set-2026-11-05/manifest.json',root))).items.map(o=>o.slug));
const BATCH2_OBJECTS=new Set(JSON.parse(fs.readFileSync(new URL('art-source/object-batch2-2026-11-06/approved-choices.json',root))).objects.map(o=>liveBatch2Id(o.id)));
const objects = sandbox.result.objects.map(o=>({id:o.id,name:o.name,plural:o.plural,mm:o.mm,image:o.image||`items/${o.id}.webp`,group:o.group,collection:NEW_NOVEMBER.has(o.id)?"new-2026-11":(NEW_MONTHLY.has(o.id)||["tennis-court","ice-hockey-rink","coast-redwood","submarine","cargo-ship","freight-train","radio-mast","sports-stadium","radio-telescope","water-slide","roller-coaster","airport-runway"].includes(o.id))?'new-2026-10':'',monthlyExpansion:NEW_MONTHLY.has(o.id),pack:o.pack||'',properNoun:!!o.properNoun,measurement:o.measurement,orientation:o.orientation,motionSmall:o.motionSmall,motionBig:o.motionBig,scenery:sceneryFor(o),questionAsBig:o.questionAsBig,questionAsSmall:o.questionAsSmall,alternateImage:o.id==='donut'?'items/donut-2.webp':null})).sort((a,b)=>a.name.localeCompare(b.name));
if(!objects.length||objects.length!==sandbox.result.objects.length||new Set(objects.map(o=>o.id)).size!==objects.length)throw Error('Incomplete object catalog');
for(const o of objects){
  if(LATEST_OBJECTS.has(o.id))o.collection='new-2026-11-05';
  if(BATCH2_OBJECTS.has(o.id))o.collection='new-2026-11-06-batch2';
  if(!fs.existsSync(new URL(o.image,root)))throw Error('Missing object artwork: '+o.id);
}
for(const id of LATEST_OBJECTS)if(!objects.some(o=>o.id===id))throw Error('Missing latest object: '+id);
// Recognize drafts already applied with an agreed measurement correction, so an
// older phone draft cannot silently put the previous incorrect value back.
const resolvedDrafts={};
const originalChoices=new URL('art-source/object-review/original-choices.json',root),appliedChoices=new URL('art-source/object-review/applied-choices.json',root);
if(fs.existsSync(originalChoices)&&fs.existsSync(appliedChoices)){
  const original=JSON.parse(fs.readFileSync(originalChoices)),applied=JSON.parse(fs.readFileSync(appliedChoices));
  const corrections=JSON.parse(fs.readFileSync(new URL('art-source/object-review/measurement-resolutions.json',root)));
  for(const row of applied.objects){const before=original.objects.find(o=>o.id===row.id),correction=corrections[row.id],settings=correction?{...row.settings,mm:correction.mm,measurement:correction.measurement}:row.settings;if(before&&JSON.stringify(settings)!==JSON.stringify(before.settings))resolvedDrafts[row.id]={before:before.current,requested:before.settings,applied:settings};}
}
fs.writeFileSync(new URL('anim/object-review-data.json',root),JSON.stringify({version:1,types:sandbox.result.types,resolvedDrafts,objects},null,2)+'\n');
// Use the game's actual grammar, including articles, qualifiers and proper names.
const promptSource = html.slice(helpersStart,helpersEnd);
const definite = html.match(/  const MEASUREMENT_DEFINITE_IDS = .*;/)[0];
fs.writeFileSync(new URL('anim/object-review-prompts.mjs',root),'// Generated by scripts/build-object-review.mjs from the game question helpers.\nconst MEASUREMENT_TYPES = '+JSON.stringify(sandbox.result.types)+';\n'+definite+'\n'+promptSource+'\nexport { measurementQuestionPrompt };\n');
console.log(`${objects.length} objects exported with current orientation, motion, measurements and question wording.`);
