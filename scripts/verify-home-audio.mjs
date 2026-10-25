import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { HOME_MOTION } from '../anim/home-motion.mjs';
const source=fs.readFileSync(new URL('../anim/home-scene.mjs',import.meta.url),'utf8');
const sound=source.slice(source.indexOf('function boing('),source.indexOf('export const homeSceneHasArt'));
const stop=source.slice(source.indexOf('function stopHomeSound()'),source.indexOf('\ndocument.addEventListener("visibilitychange"'));
const events=[],settings=new Map(),contexts=[];
const param=()=>({setValueAtTime:v=>events.push(['value',v]),exponentialRampToValueAtTime:v=>events.push(['ramp',v])});
class AudioContext {
 constructor(){this.state='running';this.currentTime=0;this.destination={};contexts.push(this);}
 resume(){events.push(['resume']);this.state='running';return Promise.resolve();}
 createGain(){return {gain:param(),connect(){}};}
 createOscillator(){const node={frequency:param(),connect(){},start(){events.push(['start',node.type]);},stop(){events.push(['stop']);}};return node;}
}
const ctx=vm.createContext({window:{AudioContext},localStorage:{getItem:key=>settings.get(key)??null},navigator:{vibrate(){}}});
vm.runInContext('let actx=null;const tapSounds=new Set();'+sound+stop+';globalThis.play=boing;globalThis.stop=stopHomeSound;',ctx);
for(const scene of Object.keys(HOME_MOTION))for(const role of [0,1]){
 events.length=0;ctx.play(scene,role);
 assert.equal(events.filter(e=>e[0]==='start').length,1,scene+' '+role+' schedules one sound');
 assert(events.filter(e=>['value','ramp'].includes(e[0])&&e[1]>1).every(e=>e[1]>=300),'Phone-range pitches: '+scene);
 ctx.stop();
}
for(const state of ['suspended','interrupted']){contexts.at(-1).state=state;events.length=0;ctx.play('wheels',1);assert(events.some(e=>e[0]==='resume'));ctx.stop();}
contexts.at(-1).state='closed';const before=contexts.length;ctx.play('dragon',0);assert.equal(contexts.length,before+1,'Closed audio context is replaced');ctx.stop();
for(const [key,value]of [['mg_soundEnabled','false'],['mg_effects_volume','0']]){settings.set(key,value);events.length=0;ctx.play('dragon',1);assert(!events.some(e=>e[0]==='start'),'Mute/zero volume remains silent');settings.delete(key);}
events.length=0;ctx.play('wheels',0);ctx.play('dragon',1);const scheduled=events.filter(e=>e[0]==='stop').length;ctx.stop();assert.equal(events.filter(e=>e[0]==='stop').length,scheduled+2,'Navigation cancels all active taps');
console.log('PASS: 36 Home tap cues, phone-range pitches, mute/volume, suspended/interrupted/closed context recovery and active-source cancellation.');
