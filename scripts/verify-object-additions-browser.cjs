const assert=require('assert/strict');const {runFixture}=require('./browser-fixture.cjs');
const ids=['cherry','mouse','spinning-top','toy-jack','seal','satellite','crab','tumbleweed','spaghetti-strainer','soup-ladle'];
const html=`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="/"><style>
body{margin:0;padding:12px;background:#f6ead2;font:14px system-ui;color:#51351f;box-sizing:border-box}*{box-sizing:border-box}h1{font-size:20px}main{display:grid;grid-template-columns:1fr 1fr;gap:10px}.entry{min-width:0;background:#fffcf3;border:2px solid #d3bb87;border-radius:18px;padding:8px}.qp{margin:0;position:relative;text-align:center}.qp img{width:100%;height:115px;object-fit:contain;display:block}.qp span{display:block;font-weight:bold;padding-top:12px;min-height:43px}.entry p{margin:5px 0;font-size:12px;line-height:1.35}#stage{position:absolute;left:-10000px;top:0;width:350px;height:350px}</style>
<h1>New objects · measurement check</h1><main></main><div id="stage"></div><script type="module">
import {installMeasurementGuides} from '/anim/measurement-guides.mjs';import {createStackAnimation} from '/anim/stack-anim.js';
const data=await(await fetch('/anim/object-review-data.json')).json(),ids=${JSON.stringify(ids)},objects=ids.map(id=>data.objects.find(o=>o.id===id));
for(const o of objects){const card=document.createElement('section');card.className='entry';card.innerHTML='<figure class="qp"><img src="/'+o.image+'"><span>'+o.name+'</span></figure><p><b>'+o.mm/10+' cm · '+o.measurement.dimension+'</b></p><p>'+o.measurement.qualifier+'</p>';document.querySelector('main').append(card)}
await Promise.all([...document.images].map(im=>im.decode()));installMeasurementGuides({objects});
window.probe=async()=>{const result=[];for(const o of objects){const im=[...document.images].find(im=>im.src.endsWith(o.image)),c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const ctx=c.getContext('2d');ctx.drawImage(im,0,0);const p=ctx.getImageData(0,0,c.width,c.height).data;if(p[3]!==0)throw Error('Opaque icon corner: '+o.id);
 const ctl=createStackAnimation(document.getElementById('stage'),{imageUrl:o=>'/'+o.image,reduceMotion:false});for(const [unit,target]of [[data.objects.find(o=>o.id==='ant'),o],[o,data.objects.find(o=>o.id==='eiffel-tower')]]){const scene=await ctl.prepare(unit,target,{hMax:230,minStageH:300});if(Math.abs(scene.R-target.mm/unit.mm)>1e-6)throw Error('Wrong ratio: '+o.id);for(const t of [0,scene.duration*.35,scene.duration*.7,scene.duration])scene.render(t)}ctl.destroy();result.push(o.id)}return result};window.ready=true;
</script>`;
runFixture({html,widths:[320,390,430],height:1450,out:'output/object-additions',check:async({width,evaluate,screenshot})=>{
 for(let n=0;n<300&&!await evaluate('window.ready');n++)await new Promise(r=>setTimeout(r,20));assert(await evaluate('window.ready'));
 assert.deepEqual(await evaluate('probe()'),ids);await new Promise(r=>setTimeout(r,50));
 assert.equal(await evaluate("document.querySelectorAll('.measurement-guide').length"),10);
 assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'cards fit phone width');
 await screenshot('objects-'+width+'.png');console.log({pass:true,width,objects:ids.length,revealRoles:20});
}}).catch(e=>{console.error(e);process.exitCode=1});
