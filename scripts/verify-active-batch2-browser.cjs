const fs=require('fs'),assert=require('assert/strict');
const {runFixture}=require('./browser-fixture.cjs');
const ids=JSON.parse(fs.readFileSync('art-source/object-batch2-2026-11-06/approved-choices.json')).objects.map(o=>o.id);
const html=`<!doctype html><base href="/"><div id="stage" style="width:350px;height:400px"></div><script type="module">
import {createStackAnimation} from '/anim/stack-anim.js';
import {liveBatch2Id} from '/anim/object-batch2-ids.mjs';
const data=await(await fetch('/anim/object-review-data.json')).json();
window.check=async()=>{
 const ctl=createStackAnimation(document.getElementById('stage'),{imageUrl:o=>'/'+o.image,reduceMotion:false});
 for(const pickerId of ${JSON.stringify(ids)}){
  const id=liveBatch2Id(pickerId);
  const o=data.objects.find(o=>o.id===id);const im=new Image();im.src='/'+o.image;await im.decode();
  if(!im.naturalWidth)throw Error('Missing artwork: '+id);
  for(const [small,big]of [[data.objects.find(o=>o.id==='ant'),o],[o,data.objects.find(o=>o.id==='mount-everest')]]){
   const scene=await ctl.prepare(small,big,{hMax:230,minStageH:300});
   if(Math.abs(scene.R-big.mm/small.mm)>1e-6)throw Error('Wrong ratio: '+id);
   for(const t of [0,scene.duration*.5,scene.duration])scene.render(t);
  }
 }ctl.destroy();return ${ids.length};
};window.ready=true;</script>`;
runFixture({html,widths:[390],height:900,out:'output/active-batch2-tests',check:async({evaluate})=>{
 for(let i=0;i<300&&!await evaluate('window.ready');i++)await new Promise(r=>setTimeout(r,20));
 assert(await evaluate('window.ready'));assert.equal(await evaluate('window.check()'),105);
 console.log('PASS: 105 production images load and 210 live reveal roles render with correct ratios.');
}}).catch(e=>{console.error(e);process.exitCode=1});
