const fs=require('fs'),path=require('path');
const {Jimp,loadFont}=require('jimp');
const {SANS_16_BLACK}=require('jimp/fonts');
const dir=path.resolve(__dirname,'../art-source/mode-mascots-2026-11-06');
(async()=>{
 const m=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
 const font=await loadFont(SANS_16_BLACK),groups=new Map(),dimensions=[];
 fs.mkdirSync(path.join(dir,'review'),{recursive:true});
 for(const a of m.assets){
  const image=await Jimp.read(path.join(dir,a.file));
  dimensions.push({id:a.id,file:a.file,width:image.bitmap.width,height:image.bitmap.height});
  if(!groups.has(a.mascot))groups.set(a.mascot,[]);groups.get(a.mascot).push(a);
 }
 for(let start=0;start<m.assets.length;start+=6){
  const subset=m.assets.slice(start,start+6),sheet=new Jimp({width:1080,height:720,color:0xf5f0e8ff});
  for(const [i,a]of subset.entries()){
   const x=(i%3)*360,y=Math.floor(i/3)*360;
   const im=await Jimp.read(path.join(dir,a.file));im.contain({w:344,h:310});sheet.composite(im,x+8,y+8);
   sheet.print({font,x:x+8,y:y+322,text:a.name,maxWidth:344});sheet.print({font,x:x+8,y:y+342,text:a.role,maxWidth:344});
  }
  await sheet.write(path.join(dir,'review','sheet-'+(start/6+1)+'.jpg'));
 }
 const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const html='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mode mascot artwork review</title><style>body{margin:0;padding:20px;background:#f4efe5;color:#3b291c;font:16px system-ui}main{max-width:1300px;margin:auto}h1{font-size:28px}section{margin:28px 0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}figure{margin:0;background:white;border:2px solid #d6c3a5;border-radius:16px;overflow:hidden}img{display:block;width:100%;height:260px;object-fit:contain}figcaption{padding:12px}a{color:inherit}small{display:block;color:#705c47;margin-top:5px}</style><main><h1>Mode mascot artwork</h1><p>30 source images · 9 mascot sets · white backgrounds for cutout. Click an image to open the full PNG. Raccoon uses a blank notepad in every pose. These are review assets, not active in gameplay.</p>'+[...groups].map(([id,assets])=>'<section><h2>'+esc(assets[0].mode)+'</h2><div class="grid">'+assets.map(a=>'<figure><a href="'+a.file+'"><img loading="lazy" src="'+a.file+'" alt="'+esc(a.name+' — '+a.role)+'"></a><figcaption><b>'+esc(a.role)+'</b><small>'+esc(a.file)+'</small></figcaption></figure>').join('')+'</div></section>').join('')+'</main></html>';
 const finalHtml=fs.existsSync(path.join(dir,'transparent','index.html'))?html.replace('<h1>Mode mascot artwork</h1>','<h1>Mode mascot artwork</h1><p><a href="transparent/index.html"><b>Open the transparent PNG set</b></a> · The images below are the original white-background sources.</p>'):html;
 fs.writeFileSync(path.join(dir,'index.html'),finalHtml);
 fs.writeFileSync(path.join(dir,'review','dimensions.json'),JSON.stringify(dimensions,null,2)+'\n');
 console.log('Verified '+dimensions.length+' PNGs; built gallery and five review sheets.');
})().catch(e=>{console.error(e);process.exitCode=1});
