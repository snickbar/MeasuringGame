// Validate actual browser-decoded pixels and compare PNG decoder time using
// preloaded blobs, so network transfer cannot mask a decoding regression.
const fs=require('fs'),path=require('path');let runner=fs.readFileSync(path.join(__dirname,'verify-sound-review-browser.cjs'),'utf8');
const start=runner.indexOf('const check=String.raw`'),end=runner.indexOf('\nserver.listen(',start);
const check=String.raw`(async()=>{
 const rows=await fetch('/output/png-optimization/results.json').then(r=>r.json());
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});
 let beforeMs=0,afterMs=0,checked=0;const median=a=>a.sort((x,y)=>x-y)[Math.floor(a.length/2)];
 for(const row of rows){
  const blobs=await Promise.all(['original','optimized'].map(folder=>fetch('/output/png-optimization/'+folder+'/'+row.path).then(r=>{if(!r.ok)throw Error('Missing '+row.path);return r.blob();})));
  const bitmaps=await Promise.all(blobs.map(b=>createImageBitmap(b)));
  canvas.width=row.width;canvas.height=row.height;
  const pixels=bitmaps.map(image=>{ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0);return ctx.getImageData(0,0,canvas.width,canvas.height).data;});
  if(pixels[0].length!==pixels[1].length)throw Error('Dimensions '+row.path);
  const a=new Uint32Array(pixels[0].buffer),b=new Uint32Array(pixels[1].buffer);for(let i=0;i<a.length;i++)if(a[i]!==b[i])throw Error('Browser pixel changed '+row.path);
  bitmaps.forEach(image=>image.close());const times=[[],[]];
  for(let i=0;i<4;i++)for(const index of (i%2?[1,0]:[0,1])){const t=performance.now(),image=await createImageBitmap(blobs[index]);times[index].push(performance.now()-t);image.close();}
  beforeMs+=median(times[0]);afterMs+=median(times[1]);checked++;
 }
 return {pass:afterMs<=beforeMs*1.12,checked,browserPixelsIdentical:true,beforeDecodeMs:Math.round(beforeMs),afterDecodeMs:Math.round(afterMs),ratio:afterMs/beforeMs};
})()`;
runner=runner.slice(0,start)+'const check='+JSON.stringify(check)+';'+runner.slice(end);
runner=runner.replaceAll("'sound-review-tests-'","'png-optimization-tests-'").replaceAll("'/anim/sound-review.html'","'/privacy.html'").replace('for(const width of [320,390,430])','for(const width of [390])');
// Store the measured result without adding benchmark logic to the game.
runner=runner.replace('console.log(result.result.value);',"console.log(result.result.value);fs.writeFileSync(path.join(root,'output/png-optimization/browser-results.json'),JSON.stringify(result.result.value,null,2));if(!result.result.value?.pass)throw Error('PNG decoding regression');");
new Function('require','__dirname',runner)(require,__dirname);
