// Only runtime files ship. Review tools and original alternatives remain in the
// repository and can still be served by the local development server.
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const DIRS=['icons','avatars','sfx','items','anim','backgrounds'];
const FILES=['index.html','manifest.json','sw.js','privacy.html','icon-192.png','icon-512.png','og-image.jpg','robots.txt','sitemap.xml','app-ads.txt',
 'home-bg.jpg','home-bg-2.jpg','home-bg-3.jpg','home-sunflower.jpg','home-corgi.jpg','home-cactus.jpg','home-penguin.jpg','home-lighthouse.jpg','home-watermelon.jpg','home-games.jpg','home-house.jpg','home-wheels.jpg','home-giraffe.jpg','home-dragon.jpg','home-space.jpg','home-snacks.jpg','home-town.jpg','home-underwater.jpg','home-toy-box.jpg'];
const DEV_DIRS=['anim/sound-options/','anim/sound-suspense/','anim/artwork-candidates-2026-10-22-v3/'];
const UNUSED_SCENERY=new Set(['anim/scenery/indoor-wall.png','anim/scenery/kitchen.png','anim/scenery/wall-picture.png']);
const isDevModule=p=>p.startsWith('anim/')&&/(?:^|\/)(?:artwork-comparison|avatar-tier-(?:review|choices)|cutout-review|object-review|mode-identity-mockups|scenery-(?:gallery|objects|object-data)|sound-(?:options|review|suspense))/.test(p);
const runtimeTexts=[fs.readFileSync(path.join(ROOT,'index.html'),'utf8')];
for(const entry of fs.readdirSync(path.join(ROOT,'anim'),{withFileTypes:true}))if(entry.isFile()&&/\.(?:mjs|js|css)$/.test(entry.name)&&!isDevModule('anim/'+entry.name))runtimeTexts.push(fs.readFileSync(path.join(ROOT,'anim',entry.name),'utf8'));
const SOUNDS=new Set([...runtimeTexts.join('\n').matchAll(/["'`](sfx\/[\w./-]+)["'`]/g)].map(m=>m[1]));
function include(relative){
 const p=relative.replaceAll('\\','/');
 if(p==='anim/fonts/OFL.txt')return true; // Redistributed fonts retain their license.
 if(DEV_DIRS.some(d=>p.startsWith(d))||UNUSED_SCENERY.has(p)||isDevModule(p))return false;
 if(p.startsWith('anim/')&&/\.(?:html|json|md|txt)$/.test(p))return false;
 if(p.startsWith('sfx/')&&!SOUNDS.has(p))return false;
 return !/\.(?:md|txt)$/.test(p);
}
function list(){const files=FILES.filter(p=>fs.existsSync(path.join(ROOT,p)));function walk(dir){for(const e of fs.readdirSync(path.join(ROOT,dir),{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory()){if(!DEV_DIRS.includes(p+'/'))walk(p);}else if(include(p))files.push(p);}}for(const dir of DIRS)walk(dir);if(fs.existsSync(path.join(ROOT,'.well-known')))walk('.well-known');return files.sort();}
module.exports={ROOT,FILES,DIRS,include,list,SOUNDS};
