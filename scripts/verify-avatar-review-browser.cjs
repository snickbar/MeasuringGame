const fs=require('fs'),assert=require('assert/strict'),{runFixture}=require('./browser-fixture.cjs');
const file='art-source/new-avatar-set-2026-11-05/review.html';
const html=fs.readFileSync(file,'utf8').replace('<meta charset','<base href="/art-source/new-avatar-set-2026-11-05/"><meta charset');
const key='new-avatar-review-2026-11-05';
runFixture({html,widths:[320,390],height:1000,out:'output/avatar-review-persistence',check:async({width,evaluate,call,sessionId,screenshot})=>{
 const ready=async()=>{for(let n=0;n<300;n++){try{if(await evaluate('!window.__oldReview&&document.getElementById("save-status")?.dataset.ready==="true"'))return}catch{}await new Promise(r=>setTimeout(r,20))}throw Error('Review startup timed out')};
 const reload=async()=>{await evaluate('window.__oldReview=true');await call('Page.reload',{},sessionId);await ready()};
 const change=async note=>evaluate(`(()=>{const card=document.querySelector('[data-slug="eagle"]');card.querySelector('input').checked=true;card.querySelector('input').dispatchEvent(new Event('change'));card.querySelector('textarea').value=${JSON.stringify(note)};card.querySelector('textarea').dispatchEvent(new Event('input',{bubbles:true}))})()`);
 const probe=()=>evaluate(`(()=>{const card=document.querySelector('[data-slug="eagle"]');return{checked:card.querySelector('input').checked,note:card.querySelector('textarea').value,status:document.getElementById('save-status').textContent,warning:document.getElementById('save-status').dataset.warning}})()`);
 await ready();await evaluate(`for(const store of [localStorage,sessionStorage])for(const name of Object.keys(store))if(name.startsWith(${JSON.stringify(key)}))store.removeItem(name)`);await reload();
 await change('Keep the eagle · test '+width);assert.equal((await probe()).warning,'false');await reload();assert.equal((await probe()).note,'Keep the eagle · test '+width);assert((await probe()).checked);
 assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'));
 // Capture the downloadable backup without writing any user files.
 await evaluate('window.__backup=null;URL.createObjectURL=blob=>{window.__backup=blob;return "blob:review-test"};HTMLAnchorElement.prototype.click=function(){};document.getElementById("export").click()');
 const backup=await evaluate('__backup.text().then(JSON.parse)');assert.equal(backup.notes.eagle.note,'Keep the eagle · test '+width);
 await evaluate(`localStorage.setItem(${JSON.stringify(key)},'{broken')`);await reload();assert.equal((await probe()).note,backup.notes.eagle.note);assert.equal((await probe()).warning,'true');await evaluate('document.getElementById("save-notes").click()');
 const restore=async payload=>{await evaluate(`(()=>{const input=document.getElementById('import-file'),transfer=new DataTransfer();transfer.items.add(new File([${JSON.stringify(JSON.stringify(payload))}],'review.json',{type:'application/json'}));input.files=transfer.files;input.dispatchEvent(new Event('change'))})()`);await new Promise(r=>setTimeout(r,60))};
 await change('temporary edit');await restore(backup);assert.equal((await probe()).note,backup.notes.eagle.note);
 await restore({type:'wrong',notes:{}});assert((await probe()).status.includes('kept'));assert.equal((await probe()).note,backup.notes.eagle.note);
 await call('Page.enable',{},sessionId);
 const blocked=await call('Page.addScriptToEvaluateOnNewDocument',{source:'Object.defineProperty(window,"localStorage",{get(){throw new DOMException("Storage blocked","SecurityError")}})'},sessionId);
 await reload();await change('Tab backup works '+width);assert.equal((await probe()).warning,'true');await reload();assert.equal((await probe()).note,'Tab backup works '+width);
 await call('Page.removeScriptToEvaluateOnNewDocument',{identifier:blocked.identifier},sessionId);await reload();await evaluate('document.getElementById("save-notes").click()');assert.equal((await probe()).warning,'false');
 await screenshot('review-'+width+'.png');
 // The link delivered in chat opens a local HTML file: verify that route too.
 await evaluate('window.__oldReview=true');await call('Page.navigate',{url:'file:///C:/Projects/MeasuringGame/'+file},sessionId);await ready();
 await change('Local HTML reload '+width);await reload();assert.equal((await probe()).note,'Local HTML reload '+width);assert((await probe()).checked);
 console.log({pass:true,width,regularReload:true,fileReload:true,blockedStorageWarning:true,tabRecovery:true,backupRestore:true});
}}).catch(error=>{console.error(error);process.exitCode=1});
