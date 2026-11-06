// Review-only artwork pipeline. Never changes the game's object pools or orientations.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'art-source/object-batch2-2026-11-06');
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
const spec=JSON.parse(fs.readFileSync(path.join(root,'art-source/object-batch-2026-11-06/spec.json'),'utf8'));
const base=JSON.parse(fs.readFileSync(path.join(root,'anim/object-review-data.json'),'utf8'));
assert.equal(manifest.items.length,105);assert.equal(spec.length,105);
const flight=new Set('goldfish clownfish sea-turtle shrimp tropical-fish dragonfly drone'.split(' '));
const vehicles=new Set('subway-train-car tow-truck bulldozer cable-car monster-truck tank lawnmower wheelbarrow'.split(' '));
async function build(){
 const {sceneryFor}=await import('../anim/scenery.mjs');
 const {Jimp}=require('jimp');fs.mkdirSync(path.join(dir,'preview'),{recursive:true});
 let ready=0;
 const objects=[];
 for(let i=0;i<manifest.items.length;i++){
  const item=manifest.items[i],s=spec.find(s=>s.id===item.slug||s.name.toLowerCase()===item.name.toLowerCase());assert(s,'Missing stable identity: '+item.name);assert(item.mm>0&&base.types[item.dimension],item.name+' invalid supplied measurement');
  const original=path.join(dir,item.file),preview=path.join(dir,'preview',item.file);
  if(fs.existsSync(original)){
   if(!fs.existsSync(preview)||fs.statSync(preview).mtimeMs<fs.statSync(original).mtimeMs){
    const image=await Jimp.read(original);image.contain({w:512,h:512});await image.write(preview);
   }
   ready++;
  }
  const motion=flight.has(item.slug)?'fly':vehicles.has(item.slug)?'drive':['gondola','jet-ski'].includes(item.slug)?'sail':s.kind==='animal'?'walk':'slide';
  const scenery=sceneryFor({id:s.id});
  objects.push({id:s.id,name:s.name,plural:s.plural,mm:item.mm,image:'art-source/object-batch2-2026-11-06/preview/'+item.file,group:s.kind==='animal'?'Animals':s.kind==='landmark'?'Landmarks':'Everyday objects',collection:'new-2026-11-06-batch2',pack:'',properNoun:s.kind==='landmark',measurement:{dimension:item.dimension},orientation:{rot:0,flip:false,leanL:'none',leanR:'none',mirR:s.kind==='animal'},motionSmall:motion,motionBig:motion,scenery,alternateImage:null});
 }
 objects.sort((a,b)=>a.name.localeCompare(b.name));
 fs.writeFileSync(path.join(root,'anim/object-review-batch2-data.json'),JSON.stringify({version:1,batch:'batch2-2026-11-06',types:base.types,objects},null,2)+'\n');
 let html=fs.readFileSync(path.join(root,'anim/object-review.html'),'utf8')
  .replace('<html lang="en">','<html lang="en" data-review-batch="batch2-2026-11-06">')
  .replace('<title>Size Em Up! · Object workshop</title>','<title>Size Em Up! · Batch 2 orientation picker</title>')
  .replace('<h1>Object workshop</h1>','<h1>Batch 2 · 105 new objects</h1>')
  .replace('Check the reveal, make a tweak, then move to the next object.','Review this batch only. Choices save separately from older objects. Artwork and settings here are drafts; they are not active in gameplay yet.')
  .replace('<option>Standard</option><option>Seasonal</option><option>Fantasy</option>','<option>Animals</option><option>Everyday objects</option><option>Landmarks</option>')
  .replace('</style>','label:has(#latest-objects),label:has(#new-objects),label:has(#monthly-objects){display:none}</style>');
 assert(html.includes('data-review-batch="batch2-2026-11-06"'));
 fs.writeFileSync(path.join(root,'anim/object-review-batch2.html'),html);
 console.log(`Batch 2 picker: ${objects.length} isolated objects; ${ready}/105 artwork previews ready.`);
}
build().catch(e=>{console.error(e);process.exitCode=1});
