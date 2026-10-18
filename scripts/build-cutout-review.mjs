import fs from 'node:fs';
import crypto from 'node:crypto';
const root=new URL('../',import.meta.url),catalog=JSON.parse(fs.readFileSync(new URL('anim/object-review-data.json',root),'utf8'));
const images=catalog.objects.map(o=>({id:o.id,name:o.name,image:o.image,group:o.group}));
const known=new Set(images.map(o=>o.image));
for(const filename of fs.readdirSync(new URL('items/',root)).filter(p=>p.endsWith('.webp'))){
  const image='items/'+filename;if(known.has(image))continue;
  const base=catalog.objects.find(o=>o.alternateImage===image);
  images.push({id:filename.slice(0,-5),name:base?base.name+' · alternate':filename.slice(0,-5),image,group:base?.group||'Other artwork'});
}
images.sort((a,b)=>a.name.localeCompare(b.name));
for(const o of images)o.sourceHash=crypto.createHash('sha256').update(fs.readFileSync(new URL(o.image,root))).digest('hex');
let batch=null,seedPicks=null;
const pass=fs.readdirSync(new URL('art-source/',root)).filter(id=>/^cutout-pass-\d+$/.test(id)&&fs.existsSync(new URL(`art-source/${id}/manifest.json`,root))).sort((a,b)=>Number(b.split('-').at(-1))-Number(a.split('-').at(-1)))[0];
const manifest=new URL(`art-source/${pass}/manifest.json`,root);
if(fs.existsSync(manifest)){
  const result=JSON.parse(fs.readFileSync(manifest,'utf8')),byId=new Map(result.images.map(o=>[o.id,o]));
  batch={id:pass,name:'Fixed—review again',count:result.images.length};
  for(const o of images)if(byId.has(o.id)){const r=byId.get(o.id);o.reviewBatch=batch.id;o.cleanupNote=r.note;o.changedPixels=r.changedPixels;}
  seedPicks=JSON.parse(fs.readFileSync(new URL(`art-source/${pass}/original-picks.json`,root),'utf8'));
}
fs.writeFileSync(new URL('anim/cutout-review-data.json',root),JSON.stringify({version:1,batch,seedPicks,images},null,2)+'\n');
console.log(`${images.length} artwork files included, with alternate artwork and current file fingerprints. No artwork changed.`);
