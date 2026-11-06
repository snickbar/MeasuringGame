const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {runFixture}=require('./browser-fixture.cjs');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'anim/object-review-batch2.html'),'utf8').replace('<head>','<head><base href="/anim/">');
runFixture({html,widths:[320,390,1280],height:900,out:'output/object-batch2-tests',check:async({width,evaluate,screenshot})=>{
 const ready=()=>evaluate(`(async()=>{for(let i=0;i<600;i++){if(window.__objectReviewReady&&document.getElementById('preview-status').textContent.startsWith('Ready'))return true;await new Promise(r=>setTimeout(r,20))}throw Error(document.getElementById('preview-status').textContent+' '+document.getElementById('status').textContent)})()`);
 await ready();
 assert.equal(await evaluate('window.__objectReview.data.objects.length'),105);
 assert.equal(await evaluate('window.__objectReview.exportData().batch'),'batch2-2026-11-06');
 assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false);
 await evaluate(`localStorage.setItem('size-em-up-object-draft-v1','older-picker-sentinel');window.__objectReview.select('fork')`);await ready();
 await evaluate(`const r=document.getElementById('rot');r.value='90';r.dispatchEvent(new Event('change'));document.getElementById('approve-next').click()`);await ready();
 assert.equal(await evaluate(`JSON.parse(localStorage.getItem('size-em-up-object-draft-batch2-2026-11-06')).objects.find(o=>o.id==='fork').settings.orientation.rot`),90);
 assert.equal(await evaluate(`localStorage.getItem('size-em-up-object-draft-v1')`),'older-picker-sentinel');
 assert.equal(await evaluate(`(()=>{const p=window.__objectReview.exportData();delete p.batch;try{window.__objectReview.validatePicks(p);return false}catch{return true}})()`),true);
 await evaluate(`Promise.all(window.__objectReview.data.objects.map(o=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(true);img.onerror=()=>reject(Error(o.id+' picture failed'));img.src='../'+o.image}))).then(()=>true)`);
 const ids=width===390?await evaluate('window.__objectReview.data.objects.map(o=>o.id)'):['fork','walrus','petra','tiger'];
 for(const id of ids){await evaluate(`window.__objectReview.select(${JSON.stringify(id)})`);await ready();assert.equal(await evaluate(`['small','big'].every(role=>!!window.__objectReview.getViews()[role]?.scene)`),true);}
 await evaluate(`window.__objectReview.select('fork')`);await ready();
 await evaluate(`(async()=>{await document.getElementById('raw').decode();document.getElementById('small-end').click();await new Promise(r=>setTimeout(r,100));return true})()`);
 await screenshot('batch2-'+width+'.png');
 assert.equal(await evaluate(`window.__objectReview.exportData().objects.length`),105);
 console.log('PASS: batch-only picker at',width,'px; previews checked:',ids.length,'; isolated drafts and wrong-batch rejection.');
}}).catch(e=>{console.error(e);process.exitCode=1});
