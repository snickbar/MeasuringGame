const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {Jimp,loadFont}=require('jimp'),{SANS_16_BLACK,SANS_16_WHITE}=require('jimp/fonts');
const base=path.resolve(__dirname,'../art-source/mode-mascots-2026-11-06'),dir=path.join(base,'transparent');
(async()=>{
 const source=JSON.parse(fs.readFileSync(path.join(base,'manifest.json'),'utf8'));
 const manifest={background:'transparent alpha',originals:'../',assets:source.assets.map(a=>({...a,status:'transparent-for-review',sourceFile:'../'+a.file,background:'transparent alpha'})),revisions:source.revisions};
 const report=[];fs.mkdirSync(path.join(dir,'review'),{recursive:true});
 for(const a of manifest.assets){
  const im=await Jimp.read(path.join(dir,a.file)),original=await Jimp.read(path.join(base,a.file));
  const {width,height,data}=im.bitmap;let clear=0,visible=0;
  for(let i=3;i<data.length;i+=4){if(data[i]===0)clear++;if(data[i]>=240)visible++;}
  const count=width*height;assert(clear>count*.1,a.id+' needs real transparent background');assert(visible>count*.03,a.id+' needs opaque character details');
  assert(Math.abs(width/height-original.bitmap.width/original.bitmap.height)<.02,a.id+' aspect ratio changed');
  const corners=[3,(width-1)*4+3,((height-1)*width)*4+3,data.length-1].map(i=>data[i]);assert(corners.every(a=>a<10),a.id+' corner background not transparent');
  report.push({id:a.id,file:a.file,width,height,transparentPixels:clear,nearlyOpaquePixels:visible,corners});
 }
 const darkFont=await loadFont(SANS_16_WHITE),lightFont=await loadFont(SANS_16_BLACK);
 for(const [theme,color,font]of [['light',0xcbdadfff,lightFont],['dark',0x283647ff,darkFont]]){
  for(let start=0;start<manifest.assets.length;start+=6){
   const sheet=new Jimp({width:1080,height:720,color});
   for(const [i,a]of manifest.assets.slice(start,start+6).entries()){
    const x=(i%3)*360,y=Math.floor(i/3)*360,im=await Jimp.read(path.join(dir,a.file));im.contain({w:344,h:310});sheet.composite(im,x+8,y+8);
    sheet.print({font,x:x+8,y:y+322,text:a.name,maxWidth:344});sheet.print({font,x:x+8,y:y+342,text:a.role,maxWidth:344});
   }
   await sheet.write(path.join(dir,'review',theme+'-'+(start/6+1)+'.jpg'));
  }
 }
 let html=fs.readFileSync(path.join(base,'index.html'),'utf8').replace('Mode mascot artwork review','Transparent mascot artwork review').replace('Mode mascot artwork</h1>','Transparent mascot artwork</h1>').replace('30 source images · 9 mascot sets · white backgrounds for cutout.','30 transparent PNGs · 9 mascot sets · real alpha channels verified.');
 html=html.replace('</style>','img{background-color:#e8edf1;background-image:linear-gradient(45deg,#ccd4db 25%,transparent 25%),linear-gradient(-45deg,#ccd4db 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccd4db 75%),linear-gradient(-45deg,transparent 75%,#ccd4db 75%);background-size:20px 20px;background-position:0 0,0 10px,10px -10px,-10px 0}[data-bg=light] img{background:#d6e1e5}[data-bg=dark] img{background:#283647}button{font:inherit;padding:8px 14px;border:1px solid #ad9876;border-radius:10px;margin:0 6px 8px 0;cursor:pointer}</style>');
 html=html.replace('<section><h2>','<nav aria-label="Preview background"><button onclick="document.documentElement.dataset.bg=\'checker\'">Checkerboard</button><button onclick="document.documentElement.dataset.bg=\'light\'">Light</button><button onclick="document.documentElement.dataset.bg=\'dark\'">Dark</button></nav><section><h2>');
 fs.writeFileSync(path.join(dir,'index.html'),html);fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');fs.writeFileSync(path.join(dir,'review','alpha-report.json'),JSON.stringify(report,null,2)+'\n');
 console.log('PASS: '+report.length+' PNGs have real alpha, transparent corners, opaque character details and unchanged aspect ratios. Built gallery and 10 composited review sheets.');
})().catch(e=>{console.error(e);process.exitCode=1});
