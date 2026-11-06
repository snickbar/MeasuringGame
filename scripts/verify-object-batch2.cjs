const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {Jimp}=require('jimp');
const root=path.resolve(__dirname,'..');
(async()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'art-source/object-batch2-2026-11-06/manifest.json'),'utf8'));
 const data=JSON.parse(fs.readFileSync(path.join(root,'anim/object-review-batch2-data.json'),'utf8'));
 const spec=JSON.parse(fs.readFileSync(path.join(root,'art-source/object-batch-2026-11-06/spec.json'),'utf8'));
 const {validateSettings,currentSettings}=await import('../anim/object-review-model.mjs');
 assert.equal(data.objects.length,105);assert.equal(new Set(data.objects.map(o=>o.id)).size,105);
 for(const [i,item]of manifest.items.entries()){
  const identity=spec.find(s=>s.id===item.slug||s.name.toLowerCase()===item.name.toLowerCase());assert(identity,item.name);
  const o=data.objects.find(o=>o.id===identity.id);assert(o);assert.equal(o.image.split('/').at(-1),item.file);assert.equal(o.mm,item.mm);assert.equal(o.measurement.dimension,item.dimension);validateSettings(currentSettings(o),data.types);
  for(const file of [path.join(root,'art-source/object-batch2-2026-11-06',item.file),path.join(root,o.image)]){
   const im=await Jimp.read(file),{width:w,height:h,data:p}=im.bitmap;assert(w>=512&&h>=512);if(file.includes(path.sep+'preview'+path.sep))assert.equal(w,h);let clear=0,edge=0;
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){const a=p[(y*w+x)*4+3];if(a===0)clear++;if(a>16&&(x===0||y===0||x===w-1||y===h-1))edge++;}
   assert(clear>w*h*.1,item.slug+' must be transparent');assert.equal(edge,0,item.slug+' clipped edge');
  }
 }
 console.log('PASS: 105 unique batch-only objects, supplied sizes, valid orientation controls, transparent originals/previews and unclipped silhouettes.');
})().catch(e=>{console.error(e);process.exitCode=1});
