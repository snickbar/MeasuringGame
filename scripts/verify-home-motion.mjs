import assert from 'node:assert/strict';
import fs from 'node:fs';
import { HOME_MOTION, HOME_EXTRA_ART, homeRigMotion } from '../anim/home-motion.mjs';
import { HOME_ART } from '../anim/home-art-layout.mjs';
import { HOME_RIG } from '../anim/home-art-rig.mjs';
import { HOME_LAYER_SHEETS } from '../anim/home-layer-sheets.mjs';
import { HOME_LAYER_PLACEMENTS } from '../anim/home-layer-art.mjs';
import { NEW_HOME_SPRITES } from '../anim/home-new-art.mjs';
const css=['home-motion.css','home-new-scenes.css'].map(file=>fs.readFileSync(new URL('../anim/'+file,import.meta.url),'utf8')).join('\n');
assert.equal(Object.keys(HOME_MOTION).length,18);
for(const [scene,motion]of Object.entries(HOME_MOTION)){
 const original=JSON.stringify(HOME_RIG[scene]),rig=homeRigMotion(scene,HOME_RIG[scene],HOME_ART[scene]);
 assert.equal(JSON.stringify(HOME_RIG[scene]),original,'Generated art metadata stays untouched');
 assert.equal(motion.taps.length,2);assert.notEqual(...motion.taps);
 assert(![motion.hero,motion.prop].includes('breathe'),'No old rubbery whole-object animation');
 for(const tap of motion.taps)assert(css.includes('[data-reaction~='+tap+']'),'A visual response exists for '+tap);
 for(const entry of (rig?[rig.base,rig.hero2,...rig.parts,...rig.patches,...rig.fx.flatMap(f=>f.frames)]:[]).filter(Boolean)){
  assert(entry.file.endsWith('.webp'));assert(fs.existsSync(new URL('../anim/home-art/top/'+entry.file,import.meta.url)));
 }
}
const cactus=homeRigMotion('cactus',HOME_RIG.cactus,HOME_ART.cactus).fx[0],prop=HOME_ART.cactus.hero2;
const scale=prop.w/100*704/prop.sw;
assert.equal(cactus.on,'hero2');
assert(Math.abs(cactus.y+cactus.h-(prop.y/100*1520+160*scale))<.01,'Flower base overlaps the rounded cactus crown');
for(const files of Object.values(HOME_EXTRA_ART))for(const file of files)assert(fs.existsSync(new URL('../anim/home-art/'+file,import.meta.url)));
for(const [scene,placement]of Object.entries(HOME_LAYER_PLACEMENTS)){
 const sheet=HOME_LAYER_SHEETS[placement.id];assert(sheet&&fs.existsSync(new URL('../anim/home-art/'+sheet.file,import.meta.url)));
 assert(sheet.base[0]+sheet.base[2]<sheet.top[0],'Independent source cells have an empty gutter: '+scene);
 assert(placement.top[1]+placement.top[3]>placement.base[1],'Moving object contacts the intact stack: '+scene);
}
const penguin=homeRigMotion('penguin',HOME_RIG.penguin,HOME_ART.penguin);
assert(penguin.fx.every(f=>f.ref&&f.on==='hero2'));
const rocket=homeRigMotion('wheels',HOME_RIG.wheels,HOME_ART.wheels);
assert.equal(rocket.fx.filter(f=>f.anim==='exhaustLeft').length,2);assert.equal(rocket.fx.filter(f=>f.anim==='exhaustRight').length,2);
assert(rocket.fx.every(f=>f.frameDur<f.dur),'Fast sprite frames, slower choreographed gestures');
const house=homeRigMotion('house',HOME_RIG.house,HOME_ART.house);
assert.equal(house.fx.length,1);assert.equal(house.fx[0].anim,'fizz');
assert.equal(homeRigMotion('dragon',HOME_RIG.dragon,HOME_ART.dragon).fx.length,1,'No miniature coin painted over coin');
for(const art of Object.values(NEW_HOME_SPRITES)){
 assert(art.file.endsWith('.webp'));assert(fs.existsSync(new URL('../anim/home-art/'+art.file,import.meta.url)));
 for(const [x,y,w,h]of art.cells){assert(x>=0&&y>=0&&w>0&&h>0);}
 for(let i=1;i<art.cells.length;i++)assert(art.cells[i-1][0]+art.cells[i-1][2]<art.cells[i][0],'Independent new parts have a transparent gutter');
}
console.log('PASS: all 18 Home motion recipes, 36 specific reactions, unchanged generated rigs, complete independent WebP cells, attached flower/ice effects, dual exhaust and coordinated frame timing.');
