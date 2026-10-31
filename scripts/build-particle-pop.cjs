// Short, phone-range droplet cue. PCM avoids browser/native codec differences.
const fs=require('node:fs');
const rate=22050,duration=.24,count=Math.round(rate*duration),data=Buffer.alloc(count*2);let phase=0;
for(let i=0;i<count;i++){
 const t=i/rate,f=520+670*Math.exp(-t*18);phase+=2*Math.PI*f/rate;
 const attack=Math.min(1,t/.004),decay=Math.exp(-t*12),tail=Math.min(1,(duration-t)/.025);
 const wave=.72*Math.sin(phase)+.2*Math.sin(phase*2)+.08*Math.sin(phase*3);
 const click=.5*Math.exp(-t*220)*Math.sin(2*Math.PI*2600*t);
 data.writeInt16LE(Math.round(32767*.97*attack*tail*(decay*wave+click)/1.25),i*2);
}
const header=Buffer.alloc(44);header.write('RIFF');header.writeUInt32LE(36+data.length,4);header.write('WAVEfmt ',8);header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);header.writeUInt16LE(1,22);header.writeUInt32LE(rate,24);header.writeUInt32LE(rate*2,28);header.writeUInt16LE(2,32);header.writeUInt16LE(16,34);header.write('data',36);header.writeUInt32LE(data.length,40);
fs.writeFileSync('sfx/particle-pop.wav',Buffer.concat([header,data]));
