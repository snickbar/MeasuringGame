// Exercise the actual audio router with deterministic audio nodes; no real player writes.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const source=fs.readFileSync('index.html','utf8');
const applied=JSON.parse(fs.readFileSync('art-source/sound-review-2026-10-22/applied-sounds.json','utf8'));
const original=JSON.parse(fs.readFileSync('art-source/sound-review-2026-10-22/round-1.json','utf8'));
const picks=JSON.parse(fs.readFileSync('art-source/sound-review-2026-10-22/round-2.json','utf8'));
const current=JSON.parse(fs.readFileSync('anim/sound-review-data.json','utf8'));
const suspense=JSON.parse(fs.readFileSync('art-source/sound-review-2026-10-22/suspense-approved.json','utf8'));
assert.equal(applied.length,8);assert.equal(current.rows.length,42);assert.equal(new Set(current.rows.map(r=>r.id)).size,42);
const approved=new Set(applied.map(r=>r.id));
approved.add('drumroll');
for(const row of original.decisions){const now=current.rows.find(r=>r.id===row.id);assert(now);if(!approved.has(row.id))assert.equal(now.fingerprint,row.fingerprint,'Unchanged audio role: '+row.id);}
for(const row of applied){
 const selected=picks.decisions.find(r=>r.id===row.id);assert.equal(selected.choice,row.choice);
 const bytes=fs.readFileSync(row.file);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),row.sha256,'Exact chosen audio: '+row.id);
 const now=current.rows.find(r=>r.id===row.id);assert.deepEqual(now.events,[{file:row.file,gain:row.gain}]);
}
for(const clip of [suspense.build,suspense.ending])assert.equal(crypto.createHash('sha256').update(fs.readFileSync(clip.file)).digest('hex'),clip.sha256,'Approved suspense audio');
assert.deepEqual(current.rows.find(r=>r.id==='drumroll').events,[{file:suspense.build.file,gain:suspense.build.gain},{file:suspense.ending.file,gain:suspense.ending.gain,afterPrevious:true}]);
const played=[],timers=[];
class AudioNode{
 constructor(file){this.file=file;this.listeners={};}
 cloneNode(){return new AudioNode(this.file);}
 addEventListener(name,fn){this.listeners[name]=fn;}
 play(){played.push(this);return Promise.resolve();}
 pause(){this.paused=true;}
 end(){this.listeners.ended?.();}
}
const context=vm.createContext({Audio:AudioNode,audioLifecycle:{canPlay:()=>true,guard:fn=>fn},document:{querySelector:()=>true},localSoundEnabled:true,localStorage:{getItem:()=>35},setTimeout:(fn,ms)=>timers.push({fn,ms})});
const start=source.indexOf('  const SFX_FILES = {'),end=source.indexOf('  // Springy release bounce',start);
vm.runInContext(source.slice(start,end),context);
function play(kind){played.length=0;vm.runInContext(`playSound(${JSON.stringify(kind)})`,context);return played;}
for(const row of applied){const nodes=play(row.id);assert.equal(nodes.length,1,'One selected cue: '+row.id);assert.equal(nodes[0].file,row.file);assert(Math.abs(nodes[0].volume-row.gain*.35)<1e-9,'Effects-volume setting: '+row.id);}
assert.equal(timers.length,0,'Coin reward plays the selected jingle once, without leftover countdown beats');
assert.equal(play('star')[0].file,'sfx/crisp/roundwin.wav','Star keeps old sound despite changed roundwin');
assert.equal(played[0].volume,.6*.35,'Star keeps old mix');
assert(source.includes('m.classList.add("earned", "pop"); playSound("star");'),'Team Worlds stars use the kept star role too');
assert.equal(play('count')[0].file,'sfx/crisp/count.wav','Countdown beat unchanged');
assert.equal(play('lead')[0].file,'sfx/crisp/perfect.wav');assert.equal(play('best')[0].file,'sfx/crisp/perfect.wav');
play('submit');assert.equal(played[0].file,'sfx/select.mp3');played[0].end();assert.equal(played[1].file,'sfx/crisp/count.wav');
play('drumroll');assert.equal(played[0].file,suspense.build.file);assert.equal(played[0].volume,suspense.build.gain*.35);played[0].end();assert.equal(played[1].file,'sfx/crisp/drumroll-end.wav','Approved existing ending remains original');assert.equal(played[1].volume,.6*.35,'Ending mix unchanged');
play('drumroll');vm.runInContext('stopAllSfx()',context);played[0].end();assert.equal(played.length,1,'Stopping the reveal cancels the follow-up');
vm.runInContext('localSoundEnabled=false',context);assert.equal(play('coins').length,0,'Mute still applies');
console.log('Reviewed sounds: nine selected clips/gains, 33 unchanged roles, original ending, shared-role isolation, routing, volume, mute and suspense cancellation passed.');
