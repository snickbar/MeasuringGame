import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import {SETTINGS} from '../anim/scenery.mjs';
const require=createRequire(import.meta.url),{list,SOUNDS}=require('./production-files.cjs');
const files=list(),pack=new Set(files),root=process.cwd();
for(const file of files){assert(fs.existsSync(path.join('www',file)),'Packaged file '+file);assert(fs.readFileSync(file).equals(fs.readFileSync(path.join('www',file))),'Runtime bytes preserved '+file);}
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
const build=fs.readFileSync('scripts/build-live-bundle.js','utf8');assert(build.includes("fs.cpSync(WWW,HOSTING"));assert(build.includes("fs.cpSync(OUT,path.join(HOSTING,'live')"));assert(!fs.existsSync('www/live'),'Native package cannot contain its own update ZIP');
console.log('Production package: '+files.length+' runtime files, all code imports/sounds/scenes, app links, unchanged runtime bytes and no review assets or nested update archive passed.');
