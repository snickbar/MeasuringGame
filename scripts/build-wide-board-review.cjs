const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {Jimp,loadFont}=require('jimp'),{SANS_16_BLACK}=require('jimp/fonts');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'art-source/monthly-wide-boards-2026-11-06');
(async()=>{
 const m=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8')),font=await loadFont(SANS_16_BLACK),report=[];
 fs.mkdirSync(path.join(dir,'review'),{recursive:true});fs.mkdirSync(path.join(dir,'originals'),{recursive:true});
 for(const a of m.assets){
  const im=await Jimp.read(path.join(dir,a.file));assert.equal(im.bitmap.width/im.bitmap.height,2,a.name+' must be 2:1');
  fs.copyFileSync(path.join(root,a.source),path.join(dir,'originals',a.id+'.webp'));
  report.push({name:a.name,file:a.file,width:im.bitmap.width,height:im.bitmap.height,aspectRatio:2});
 }
 for(let start=0;start<m.assets.length;start+=6){
  const sheet=new Jimp({width:1440,height:600,color:0xf5efe5ff});
  for(const [i,a]of m.assets.slice(start,start+6).entries()){
   const x=(i%3)*480,y=Math.floor(i/3)*300,im=await Jimp.read(path.join(dir,a.file));im.contain({w:464,h:232});sheet.composite(im,x+8,y+8);sheet.print({font,x:x+8,y:y+252,text:a.name+' (2:1)',maxWidth:464});
  }
  await sheet.write(path.join(dir,'review','sheet-'+(start/6+1)+'.jpg'));
 }
 const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const html='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Wide monthly board comparisons</title><style>body{margin:0;padding:20px;background:#f6f0e7;color:#3b291d;font:16px system-ui}main{max-width:1400px;margin:auto}section{padding:18px;margin:22px 0;background:#fffcf5;border:2px solid #dac7a8;border-radius:18px}.pair{display:grid;grid-template-columns:1fr 1.6fr;gap:20px;align-items:center}figure{margin:0;min-width:0}img{display:block;width:100%;height:auto}figcaption{margin:8px 0;color:#725638}.wide{position:relative}.sample{display:none;position:absolute;left:20%;top:32%;width:60%;text-align:center;font:bold clamp(15px,2vw,26px)/1.3 system-ui;color:#38281a;text-shadow:0 1px 2px #fff8;pointer-events:none}.night .sample{color:#fff7dc;text-shadow:0 1px 3px #000}.show-sample .sample{display:block}a{color:inherit}button{font:inherit;padding:10px 16px;background:#ffe5a3;border:2px solid #b28851;border-radius:12px;cursor:pointer}@media(max-width:650px){.pair{grid-template-columns:1fr}.original img{max-width:280px;margin:auto}body{padding:10px}.sample{font-size:clamp(12px,3.4vw,20px)}}</style><main><h1>Monthly boards · wider redraws</h1><p>12 new 2:1 illustrations, drawn from the existing boards. The originals remain unchanged in gameplay. The first three requested priorities appear first. Click any new board for its full PNG.</p><button onclick="document.body.classList.toggle(\'show-sample\')">Show / hide sample question</button>'+m.assets.map(a=>'<section><h2>'+esc(a.name)+(a.priority==='first'?' · first priority':'')+'</h2><div class="pair"><figure class="original"><img loading="lazy" src="originals/'+a.id+'.webp" alt="Original '+esc(a.name)+'"><figcaption>Original · 4:3</figcaption></figure><figure><div class="wide '+([1,8,10].includes(a.month)?'night':'')+'"><a href="'+a.file+'"><img loading="lazy" src="'+a.file+'" alt="Wide '+esc(a.name)+'"></a><span class="sample">How many ants long is a pencil?</span></div><figcaption>New redraw · 2:1 · '+report.find(r=>r.file===a.file).width+' × '+report.find(r=>r.file===a.file).height+'</figcaption></figure></div></section>').join('')+'</main></html>';
 fs.writeFileSync(path.join(dir,'index.html'),html);fs.writeFileSync(path.join(dir,'review','dimensions.json'),JSON.stringify(report,null,2)+'\n');console.log('PASS: all 12 boards are exactly 2:1. Comparison gallery and review sheets generated.');
})().catch(e=>{console.error(e);process.exitCode=1});
