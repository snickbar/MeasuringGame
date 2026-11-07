const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {Jimp,loadFont}=require('jimp'),{SANS_16_BLACK}=require('jimp/fonts');
const dir=path.resolve(__dirname,'../art-source/worlds-fox-results-2026-11-06');
(async()=>{
 const m=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8')),font=await loadFont(SANS_16_BLACK),report=[];
 const sheet=new Jimp({width:1080,height:560,color:0xf6f0e6ff});
 for(const [i,a]of m.assets.entries()){
  const im=await Jimp.read(path.join(dir,a.file));assert.equal(im.bitmap.width/im.bitmap.height,.75,a.id+' must be 3:4');
  report.push({id:a.id,file:a.file,width:im.bitmap.width,height:im.bitmap.height,aspectRatio:'3:4'});
  im.contain({w:344,h:490});sheet.composite(im,i*360+8,8);sheet.print({font,x:i*360+8,y:510,text:a.trigger,maxWidth:344});sheet.print({font,x:i*360+8,y:535,text:a.id,maxWidth:344});
 }
 assert.equal(new Set(report.map(r=>r.width+'x'+r.height)).size,1,'All poses must share canvas dimensions');
 await sheet.write(path.join(dir,'review.jpg'));fs.writeFileSync(path.join(dir,'dimensions.json'),JSON.stringify(report,null,2)+'\n');
 const html='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Worlds fox · balloon results poses</title><style>body{margin:0;padding:22px;background:#f5efe4;color:#3b291d;font:16px system-ui}main{max-width:1300px;margin:auto}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}figure{margin:0;background:white;border:2px solid #dbc5a2;border-radius:18px;overflow:hidden}img{display:block;width:100%;height:auto}figcaption{padding:14px}small{display:block;margin-top:6px;color:#74593d}a{color:inherit}@media(max-width:650px){.grid{grid-template-columns:1fr}body{padding:12px}}</style><main><h1>Worlds round results · aviator fox</h1><p>Same fox and complete balloon, three moods. All images share the same 3:4 canvas. White backgrounds, with no sky, clouds, ground or cargo. Click a picture for its full PNG. These are source assets, not active results-screen replacements.</p><div class="grid">'+m.assets.map(a=>'<figure><a href="'+a.file+'"><img src="'+a.file+'" alt="Fox in balloon — '+a.id+'"></a><figcaption><b>'+a.trigger+'</b><small>'+a.id+' · '+report[0].width+' × '+report[0].height+'</small></figcaption></figure>').join('')+'</div></main></html>';
 fs.writeFileSync(path.join(dir,'index.html'),html);console.log('PASS: 3 matching '+report[0].width+' x '+report[0].height+' (3:4) PNGs; gallery and review sheet built.');
})().catch(e=>{console.error(e);process.exitCode=1});
