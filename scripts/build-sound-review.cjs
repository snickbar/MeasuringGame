// Generate a review of the CURRENT audio wiring, not the old sampler shortlist.
const fs=require('fs'),vm=require('vm'),crypto=require('crypto');
const source=fs.readFileSync('index.html','utf8').replaceAll('\r\n','\n');
const readMap=name=>vm.runInNewContext('('+source.match(new RegExp('const '+name+' = (\\{[\\s\\S]*?\\n  \\});'))[1]+')');
const files=readMap('SFX_FILES'),anim=readMap('ANIM_SFX_FILES');
const gain={tick:1,count:.9,timesup:.8,join:.8,leave:.7,emoji:.7};
const meta={
 tap:['Button taps','Selecting a key, answer, or ordinary control.','controls'],
 select:['Selection confirmation','Confirming an answer selection, Second Chance choice, or style choice.','answer'],
 cancel:['Undo a selection','Deselecting your Second Chance answer.','answer'],
 error:['Invalid action','An invalid guess, insufficient coins, or an unsuccessful Survival result.','error'],
 'popup-open':['Open a menu','Opening settings, profile, or a dialog.','menu'],
 'popup-close':['Close a menu','Closing settings, profile, or a dialog.','menu'],
 swipe:['Capsule drops','The avatar capsule drops from the machine. The object animation has a separate movement sound below.','gacha'],
 shuffle:['Avatar machine shuffles','The avatar machine agitates before dropping a capsule.','gacha'],
 drumroll:['Winner suspense','The original shuffle followed by the current drumroll ending.','winner'],
 'drumroll-end':['Winner suspense ending','The second part of the winner suspense sequence.','winner'],
 cardflip:['A guess flips over','Each guess is revealed; this cue is also called “reveal” in the game.','answer'],
 'avatar-unlock':['Common avatar unlocked','The common avatar is revealed by the machine.','gacha'],
 'avatar-ultra':['Ultra avatar unlocked','The ultra avatar reveal currently reuses the machine shuffle file.','gacha'],
 win:['Game win','The final game celebration; also used when ad bonus coins are credited.','winner'],
 roundwin:['Round win / award claim','A round win, rare avatar, flair preview, or claimed award. Individual star fills have a separate review entry.','winner'],
 count:['Countdown beat','A beat in the pre-game countdown. Coin rewards reuse this file in a separate sequence below.','timer'],
 tick:['Timer running low','The last seconds of the answer timer. Object-counting ticks are reviewed separately.','timer'],
 go:['Countdown finishes','The countdown ends and a question begins.','timer'],
 timesup:['Time is up','The answer deadline expires.','timer'],
 join:['Player joins','A new player appears in the waiting lobby.','lobby'],
 leave:['Player leaves','A player leaves the room.','lobby'],
 perfect:['Perfect guess','A perfect round-winning guess. Lead changes and personal bests reuse this file below.','winner'],
 streak:['Winning streak','Consecutive round wins.','winner'],
 answers:['Second Chance begins','Guesses lock and the answer-selection stage opens.','answer'],
 winner:['Top performer revealed','The summary reaches the top performer.','winner'],
 emoji:['Reaction sent','Sending an illustrated reaction.','reaction'],
 start:['Host starts the game','The host confirms starting a game.','lobby'],
 powerup:['Power-up / turn alert','Power-up feedback and High Stakes turn alerts.','powerup'],
};
const rows=Object.entries(files).map(([id,file])=>({id,title:meta[id]?.[0]||id,description:meta[id]?.[1]||'Registered game cue.',scene:meta[id]?.[2]||'controls',group:'Game sounds',events:[{file,gain:gain[id]??.6}],file}));
const byId=id=>rows.find(r=>r.id===id);
byId('drumroll').events.push({file:files['drumroll-end'],gain:.6,afterPrevious:true});
for(const [id,title,description,target,scene]of [
 ['submit','Guess submitted','Your guess locks in: selection sound, followed by a count sound.','select','answer'],
 ['star','A star fills in','Each earned Worlds star pops in; currently the same sound as a round win.','roundwin','stars'],
 ['coins','Coin reward sequence','Three count sounds spaced 110 ms apart, alongside the reward total and coin trail.','count','coins'],
 ['lead','Taking first place','A player takes the lead; currently the same sound as a perfect result.','perfect','winner'],
 ['best','New personal best','A new personal best; currently the same sound as a perfect result.','perfect','winner'],
]){
 const events=[{file:files[target],gain:gain[target]??.6}];
 if(id==='submit')events.push({file:files.count,gain:.9,afterPrevious:true});
 if(id==='coins')for(const delay of [110,220])events.push({file:files.count,gain:.9,delay});
 rows.push({id,title,description,scene,group:'Shared sounds in different moments',events,file:files[target]});
}
for(const [id,title,description,vol,rate,scene]of [
 ['swipe','Object arrival','The large object arrives. The zoom-in version uses the same sound at 1.25× speed.',.5,1,'stack'],
 ['tap','Object landing','Small objects land as the stack grows. Pitch varies from 0.9× to 1.4×.',.45,1,'stack'],
 ['tick','Rapid object counting','A faster tick joins the stack for large answers. This example uses eight ticks; in-game timing varies.',.4,1,'stack'],
 ['cardflip','Last partial object','The final fractional object is cut to match the answer.',.6,1.1,'stack'],
 ['zoomback','Camera zooms back','The reveal camera zooms back out to show the comparison.',.3,1,'stack'],
 ['reveal','Size answer appears','A synthesized three-note bell run and sparkle at the end of the reveal.',.5,1,'stack'],
]){
 const events=anim[id]?[{file:anim[id],gain:vol,rate,maxDuration:1}]:[];
 if(id==='tick')for(let n=1;n<8;n++)events.push({file:anim.tick,gain:vol,rate:1+n*.1,maxDuration:1,delay:n*90});
 rows.push({id:'anim-'+id,title,description,scene,group:'Size reveal animation',events,synth:events.length?null:id,file:anim[id]||'synth:'+id});
}
for(const [id,title,description,scene]of [
 ['hs-clink','High Stakes coin clink','A coin lands in the pot; pitch is slightly randomized in the game.','coins'],
 ['hs-knock','High Stakes check','The bright double wooden knock when you check.','highstakes'],
 ['hs-laugh','High Stakes laugh','Four synthesized laugh bursts when another player falls for a bluff.','reaction'],
])rows.push({id,title,description,scene,group:'High Stakes synthesized cues',events:[],synth:id,file:'synth:'+id});
// Preserve actual call sites for coverage and future replacement work.
const calls=[];source.split('\n').forEach((line,i)=>{for(const m of line.matchAll(/playSound\(([^;]+?)\)/g))calls.push({line:i+1,expression:m[1]});});
const aliases={pick:'tap',reveal:'cardflip'};
for(const row of rows){row.callSites=calls.filter(c=>c.expression.includes('"'+row.id+'"')||Object.entries(aliases).some(([a,b])=>b===row.id&&c.expression.includes('"'+a+'"')));row.fingerprint=crypto.createHash('sha256').update(JSON.stringify(row.events)+row.synth).digest('hex').slice(0,12);for(const e of row.events)if(!fs.existsSync(e.file))throw Error('Missing audio '+e.file);}
const functionSource=name=>{const start=source.indexOf('  function '+name+'('),end=source.indexOf('\n  }',start)+4;if(start<0||end<4)throw Error(name);return source.slice(start,end);};
const synth=source.match(/  const ANIM_SYNTH = (\{[\s\S]*?\n  \});/)[1];
let synthCode=`// Generated from the game's actual synth functions.\nexport async function playSynth(name,volume=1){\nconst ctx=new (window.AudioContext||window.webkitAudioContext)();await ctx.resume();if(volume<=0)return ctx;\nconst animAudio={ctx},localSoundEnabled=true,hsVol=v=>v*volume;let hsLaughCtx=ctx;function animAudioInit(){}\n`;
synthCode+=functionSource('animTone')+'\nconst ANIM_SYNTH='+synth+';\n'+functionSource('hsClink')+'\n'+functionSource('hsKnock')+'\n'+functionSource('hsLaugh').replace('Number(localStorage.getItem("mg_effects_volume") ?? 100) / 100','volume')+'\n';
synthCode+="if(name==='reveal')ANIM_SYNTH.reveal(.5*volume);else if(name==='hs-clink')hsClink();else if(name==='hs-knock')hsKnock();else if(name==='hs-laugh')hsLaugh();return ctx;}\n";
fs.writeFileSync('anim/sound-review-synth.mjs',synthCode);
for(const row of rows){const hash=crypto.createHash('sha256').update(JSON.stringify(row.events));for(const e of row.events)hash.update(fs.readFileSync(e.file));if(row.synth)hash.update(row.synth+synthCode);row.fingerprint=hash.digest('hex').slice(0,12);}
fs.writeFileSync('anim/sound-review-data.json',JSON.stringify({version:1,builtAt:new Date().toISOString(),rows,registeredFiles:files,animationFiles:anim,aliases,calls},null,2)+'\n');
console.log(`Sound review: ${rows.length} distinct moments; ${Object.keys(files).length} registered game cues; ${Object.keys(anim).length} animation files; generated synths copied from game source.`);
