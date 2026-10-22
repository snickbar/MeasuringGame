(async()=>{
 const wait=ms=>new Promise(r=>setTimeout(r,ms)),assert=(v,m)=>{if(!v)throw Error(m)},$=id=>document.getElementById(id);
 for(let n=0;n<250&&!document.querySelector('.preview-card');n++)await wait(20);
 await document.fonts.ready;const data=await fetch('./sound-suspense-data.json').then(r=>r.json());
 assert(data.rows.length===2&&data.rows[0].options.length===6&&data.rows[1].options.length===3,'Six builds and three endings');
 assert(document.title.includes('Suspense'),'Correct comparison title');
 localStorage.setItem('size-em-up-sound-options-v1','{"originalReview":"preserved"}');
 for(let p=0;p<2;p++){
  assert(document.querySelectorAll('.preview-card').length===(p?4:7),'Original plus candidates');
  for(let n=0;n<100&&[...document.querySelectorAll('.example img')].some(i=>!i.complete);n++)await wait(20);
  assert([...document.querySelectorAll('.example img')].every(i=>i.naturalWidth>0),'Images load');
  assert(document.documentElement.scrollWidth<=innerWidth+1,'Phone fits');
  for(const b of document.querySelectorAll('button'))if(b.getClientRects().length)assert(b.scrollWidth<=b.clientWidth+1,'Button fits '+b.textContent);
  if(!p)$('next').click();
 }
 $('previous').click();assert(document.querySelector('.pair-note').textContent.includes('no ending is selected'),'Default ending disclosed as preview only');
 let starts=0;const oldStart=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(...a){starts++;return oldStart.apply(this,a)};
 document.querySelector('[data-play=f]').click();for(let n=0;n<100&&starts<2;n++)await wait(20);assert(starts===2,'Candidate schedules build plus preview ending');$('stop').click();assert($('progress').textContent.startsWith('0 /'),'Audition never selects default ending');
 document.querySelector('[data-choice=f]').click();$('next').click();document.querySelector('[data-choice=silent]').click();$('previous').click();starts=0;document.querySelector('[data-play=a]').click();for(let n=0;n<100&&starts<1;n++)await wait(20);assert(starts===1,'Silence removes ending from build preview');$('stop').click();AudioBufferSourceNode.prototype.start=oldStart;
 let exported;const oldURL=URL.createObjectURL;URL.createObjectURL=blob=>{exported=blob;return oldURL(blob)};document.addEventListener('click',e=>{if(e.target.tagName==='A'&&e.target.download)e.preventDefault()},true);$('export').click();const picks=JSON.parse(await exported.text());assert(picks.set==='suspense-2'&&picks.decisions[0].choice==='f'&&picks.decisions[1].choice==='silent','Exports only chosen options with separate set');
 async function load(value){const transfer=new DataTransfer();transfer.items.add(new File([JSON.stringify(value)],'picks.json',{type:'application/json'}));$('import').files=transfer.files;$('import').dispatchEvent(new Event('change'));await wait(100);}
 document.querySelector('[data-choice=clear]').click();await load(picks);assert($('progress').textContent.startsWith('2 /'),'Import restores two decisions');
 const saved=localStorage.getItem('size-em-up-suspense-options-v2');const wrong=structuredClone(picks);wrong.set='original';await load(wrong);assert($('status').textContent.includes('different')&&localStorage.getItem('size-em-up-suspense-options-v2')===saved,'Original review export rejected safely');
 assert(localStorage.getItem('size-em-up-sound-options-v1')==='{"originalReview":"preserved"}','Original choices untouched');
 const ctx=new AudioContext();const files=[...new Set(data.rows.flatMap(r=>[...r.events,...r.options.flatMap(o=>o.events)]).map(e=>e.file))];for(const file of files){const response=await fetch('../'+file);assert(response.ok,'Audio exists');const b=await ctx.decodeAudioData(await response.arrayBuffer());assert(b.duration>0,'Audio decodes');if(file.includes('sound-suspense')&&!file.includes('chime')&&!file.includes('accent'))assert(Math.abs(b.duration-2.3)<.001,'Build matches existing reveal interval');}await ctx.close();
 $('jump').open=true;assert(document.documentElement.scrollWidth<=innerWidth+1,'Jump fits');$('jump').open=false;
 return {pass:true,width:innerWidth,builds:6,endings:3,decoded:files.length,checks:'All clips decode, phone fit, separate choice storage, preview-only default ending, silence, exports/imports and correct suspense timing'};
})()
