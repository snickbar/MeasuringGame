import fs from 'node:fs';
import vm from 'node:vm';
import {currentSettings,validatePicks,validateSettings,sameSettings} from '../anim/object-review-model.mjs';

const inputPath=process.argv[2];if(!inputPath)throw Error('Provide the exported object choices file.');
const archiveDir=process.argv[3]||'art-source/object-review';
if(!/^art-source\/[a-zA-Z0-9/-]+$/.test(archiveDir))throw Error('Archive must be a project art-source folder.');
const root=new URL('../',import.meta.url),read=p=>fs.readFileSync(new URL(p,root),'utf8');
const source=fs.readFileSync(inputPath,'utf8'),picks=JSON.parse(source),catalog=JSON.parse(read('anim/object-review-data.json'));
validatePicks(picks,catalog);if(picks.objects.length!==catalog.objects.length)throw Error('A complete export is required.');
const resolutions=JSON.parse(read('art-source/object-review/measurement-resolutions.json'));
const applied=structuredClone(picks);
for(const [id,resolution]of Object.entries(resolutions)){
  const row=applied.objects.find(o=>o.id===id);if(!row)throw Error('Unknown resolution: '+id);
  row.settings={...row.settings,mm:resolution.mm,measurement:resolution.measurement};
}
const edits=validatePicks(applied,catalog),objects=new Map(catalog.objects.map(o=>[o.id,o]));
let html=read('index.html'),engine=read('anim/stack-anim.js'),orientSource=read('anim/orient-data.js');
const orientMatch=orientSource.match(/export const ORIENT = (\{[^\n]*\});/);
if(!orientMatch)throw Error('Orientation mapping missing');
const orient=vm.runInNewContext('('+orientMatch[1]+')');
const detailMatch=html.match(/  const MEASUREMENT_DETAILS = (\{[\s\S]*?\n  \});/);
const motionMatch=engine.match(/const MOTION = (\{[\s\S]*?\n\});/);
if(!detailMatch||!motionMatch)throw Error('Measurement or motion mapping missing');
const details=vm.runInNewContext('('+detailMatch[1]+')'),motions=vm.runInNewContext('('+motionMatch[1]+')');
const report=[];
for(const [id,settings]of Object.entries(edits)){
  const old=validateSettings(currentSettings(objects.get(id)),catalog.types),fields={};
  for(const field of Object.keys(settings))if(!sameSettings(old[field],settings[field]))fields[field]={before:old[field],after:settings[field]};
  if(fields.orientation)orient[id]=settings.orientation;
  if(fields.measurement)details[id]=settings.measurement;
  if(fields.motionSmall||fields.motionBig)motions[id]=settings.motionSmall===settings.motionBig?settings.motionSmall:{small:settings.motionSmall,big:settings.motionBig};
  if(fields.mm){
    const escaped=id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),pattern=new RegExp('(\\{ id: "'+escaped+'"[^\\n]*?mm: )[-\\d.]+');
    if(!pattern.test(html))throw Error('No editable standard size definition for '+id);
    html=html.replace(pattern,(_,prefix)=>prefix+settings.mm);
  }
  report.push({id,name:objects.get(id).name,fields});
}
html=html.replace(detailMatch[0],'  const MEASUREMENT_DETAILS = '+JSON.stringify(details,null,2).replaceAll('\n','\n  ')+';');
orientSource=orientSource.replace(orientMatch[0],'export const ORIENT = '+JSON.stringify(orient)+';');
engine=engine.replace(motionMatch[0],'const MOTION = '+JSON.stringify(motions,null,2)+';');
// Validate everything before replacing any source files.
fs.mkdirSync(new URL(archiveDir+'/',root),{recursive:true});
for(const [file,value]of [['index.html',html],['anim/stack-anim.js',engine],['anim/orient-data.js',orientSource]])fs.writeFileSync(new URL(file,root),value);
fs.writeFileSync(new URL(archiveDir+'/original-choices.json',root),source);
fs.writeFileSync(new URL(archiveDir+'/applied-choices.json',root),JSON.stringify(applied,null,2)+'\n');
fs.writeFileSync(new URL(archiveDir+'/change-report.json',root),JSON.stringify(report,null,2)+'\n');
console.log(`Applied ${report.length} object changes. Measurements: ${report.filter(o=>o.fields.measurement).length}; orientations: ${report.filter(o=>o.fields.orientation).length}; travel styles: ${report.filter(o=>o.fields.motionSmall||o.fields.motionBig).length}; size values: ${report.filter(o=>o.fields.mm).length}.`);
