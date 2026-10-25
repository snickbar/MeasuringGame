import assert from 'node:assert/strict';
import fs from 'node:fs';
import { HOME_MOTION, homeRigMotion } from '../anim/home-motion.mjs';
import { HOME_ART } from '../anim/home-art-layout.mjs';
import { HOME_RIG } from '../anim/home-art-rig.mjs';
const css=fs.readFileSync(new URL('../anim/home-motion.css',import.meta.url),'utf8');
assert.equal(Object.keys(HOME_MOTION).length,16);
for(const [scene,motion]of Object.entries(HOME_MOTION)){
 const original=JSON.stringify(HOME_RIG[scene]),rig=homeRigMotion(scene,HOME_RIG[scene],HOME_ART[scene]);
 assert.equal(JSON.stringify(HOME_RIG[scene]),original,'Generated art metadata stays untouched');
 assert.equal(motion.taps.length,2);assert.notEqual(...motion.taps);
 assert(![motion.hero,motion.prop].includes('breathe'),'No old rubbery whole-object animation');
 for(const tap of motion.taps)assert(css.includes('[data-reaction='+tap+']'),'A visual response exists for '+tap);
 for(const entry of [rig.base,rig.hero2,...rig.parts,...rig.patches,...rig.fx.flatMap(f=>f.frames)].filter(Boolean)){
  assert(entry.file.endsWith('.webp'));assert(fs.existsSync(new URL('../anim/home-art/top/'+entry.file,import.meta.url)));
 }
}
const cactus=homeRigMotion('cactus',HOME_RIG.cactus,HOME_ART.cactus).fx[0],prop=HOME_ART.cactus.hero2;
const scale=prop.w/100*704/prop.sw;
assert.equal(cactus.on,'hero2');
assert(Math.abs(cactus.y+cactus.h-(prop.y/100*1520+104*scale))<.01,'Flower base overlaps cactus tip');
const penguin=homeRigMotion('penguin',HOME_RIG.penguin,HOME_ART.penguin);
assert(penguin.fx.every(f=>f.ref&&f.on==='hero2'));
const rocket=homeRigMotion('wheels',HOME_RIG.wheels,HOME_ART.wheels);
assert.equal(rocket.fx.filter(f=>f.anim==='exhaustLeft').length,2);assert.equal(rocket.fx.filter(f=>f.anim==='exhaustRight').length,2);
assert(rocket.fx.every(f=>f.frameDur<f.dur),'Fast sprite frames, slower choreographed gestures');
const house=homeRigMotion('house',HOME_RIG.house,HOME_ART.house);
assert.equal(house.fx.length,1);assert.equal(house.fx[0].anim,'fizz');
assert.equal(homeRigMotion('dragon',HOME_RIG.dragon,HOME_ART.dragon).fx.length,1,'No miniature coin painted over coin');
console.log('PASS: all 16 Home motion recipes, 32 specific reactions, unchanged generated rigs, WebP assets, attached flower/ice effects, dual exhaust and coordinated frame timing.');
