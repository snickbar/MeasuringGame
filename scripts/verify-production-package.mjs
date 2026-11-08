import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import {SETTINGS} from '../anim/scenery.mjs';
const require=createRequire(import.meta.url),{list,SOUNDS}=require('./production-files.cjs');
const files=list(),pack=new Set(files),root=process.cwd();
const {splitIndex,assertPacked,FILE:APP_FILE}=require('./pack-index.cjs');
const sourcePage=fs.readFileSync('index.html','latin1'),packedPage=splitIndex(sourcePage);
for(const file of files){assert(fs.existsSync(path.join('www',file)),'Packaged file '+file);if(file==='index.html'&&packedPage)continue;assert(fs.readFileSync(file).equals(fs.readFileSync(path.join('www',file))),'Runtime bytes preserved '+file);}
// index.html ships with its game module moved into app.mjs; together they are exactly the repository page, byte for byte.
// (A page that cannot be split ships unchanged and was compared above; verify-pack-index.mjs is what insists it can be split.)
if(packedPage){assert(fs.existsSync(path.join('www',APP_FILE)),'Packaged '+APP_FILE);assertPacked(sourcePage,fs.readFileSync('www/index.html','latin1'),fs.readFileSync(path.join('www',APP_FILE),'latin1'));}
assert(!files.some(p=>p.startsWith('anim/')&&/sound-options|sound-suspense|artwork-candidates|review|mockups|\.md$/.test(p)),'Development material excluded');
for(const sound of SOUNDS)assert(pack.has(sound),'All runtime sounds included '+sound);
for(const config of Object.values(SETTINGS))for(const name of [config.floor,config.texture,config.backdrop,...config.layers||[]].filter(Boolean))assert(pack.has('anim/scenery/'+name+'.png'),'Current scene included '+name);
assert(pack.has('.well-known/assetlinks.json'),'Android app links retained');assert(pack.has('og-image.jpg'),'Share artwork retained');
for(const file of files.filter(f=>/\.(?:html|mjs|js|css)$/.test(f))){
 const source=fs.readFileSync(file,'utf8');
 // Local import dependencies, including dynamic imports and module-relative CSS.
 for(const match of source.matchAll(/(?:from\s*|import\s*\(|new URL\(\s*)["'](\.\.?\/[^"']+)["']/g)){
  const dependency=path.posix.normalize(path.posix.join(path.posix.dirname(file),match[1].split('?')[0]));
  assert(pack.has(dependency),'Runtime import included: '+file+' -> '+dependency);
 }
}
const firebase=JSON.parse(fs.readFileSync('firebase.json','utf8'));assert.equal(firebase.hosting.public,'hosting');
if(packedPage)assert(firebase.hosting.headers.some(h=>h.source==='/'+APP_FILE&&h.headers.some(x=>x.key==='Cache-Control'&&x.value==='no-cache')),APP_FILE+' is revalidated on every load, so a new index.html never meets an old game module');
const build=fs.readFileSync('scripts/build-live-bundle.js','utf8');assert(build.includes("fs.cpSync(WWW,HOSTING"));assert(build.includes("fs.cpSync(OUT,path.join(HOSTING,'live')"));assert(!fs.existsSync('www/live'),'Native package cannot contain its own update ZIP');
console.log('Production package: '+files.length+' runtime files, all code imports/sounds/scenes, app links, unchanged runtime bytes (index.html shipped with its game module in '+APP_FILE+') and no review assets or nested update archive passed.');
