const fs=require('fs'),path=require('path'),cp=require('child_process'),assert=require('assert/strict'),{runFixture}=require('./browser-fixture.cjs');
const dir=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(dir,'index.html'),'utf8');
const launch=source.slice(source.indexOf('  <section class="tutorial-learning"'),source.indexOf('  <section class="tutorial-modes"',source.indexOf('  <section class="tutorial-learning"')));
assert(launch.includes('data-learning-tutorial="scoring"')&&launch.includes('data-learning-tutorial="style"'));
const global=source.match(/<style>([\s\S]*?)<\/style>/)[1];
runFixture({html:'<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="/"><style>'+global+'</style><link rel="stylesheet" href="anim/learning-tutorials.css"><style>body{padding:12px;background:#fff3cf}</style>'+launch,widths:[320,390,520],height:780,out:'output/learning-tutorials-check',check:async({width,evaluate,screenshot,call,sessionId})=>{
await call('Page.bringToFront',{},sessionId);
await evaluate(`(async()=>{window.m=await import('/anim/learning-tutorials.mjs');window.page='howto';window.lesson=m.createLearningTutorials({location:()=>page,random:()=>.5});window.quizOpen=()=>{lesson.open('scoring');for(let i=0;i<3;i++)document.querySelector('#learning-tutorial [data-next]').click()};})()`);
for(const [guess,accuracy]of [[10,100],[7,70],[13,70],[3,30],[17,30],[20,0],[25,0]])assert(Math.abs((await evaluate(`m.scoringExample(${guess}).accuracy`))-accuracy)<1e-9);
await evaluate(`document.querySelector('[data-learning-tutorial="scoring"]').click()`);
assert.equal(await evaluate(`document.querySelector('#learning-title').textContent`),'How accuracy works');
await evaluate(`document.querySelector('#learning-tutorial [data-next]').click();document.querySelector('[data-low="3"]').click()`);assert((await evaluate(`document.querySelector('.lt-explanation').textContent`)).includes('30% accuracy'));
await evaluate(`document.querySelector('#learning-tutorial [data-next]').click()`);assert.equal(await evaluate(`document.querySelectorAll('.lt-example b').length`),2);await screenshot('scoring-comparison-'+width+'.png');
await evaluate(`document.querySelector('#learning-tutorial [data-next]').click()`);assert.equal(await evaluate(`document.querySelector('#learning-tutorial [data-next]').disabled`),true);assert.equal(await evaluate(`!!document.querySelector('.lt-feedback')`),false);
for(const choice of [70,30,17,0]){
 await evaluate(`document.querySelector('[data-quiz="${choice}"]').click()`);
 const feedback=await evaluate(`document.querySelector('.lt-feedback').textContent`);assert(feedback.includes('30%'));assert(feedback.includes('7 ÷ 10'));assert(feedback.includes('70% away'));assert.equal(await evaluate(`document.querySelector('#learning-tutorial [data-next]').disabled`),false);
 assert.equal(await evaluate(`document.querySelector('.lt-feedback').classList.contains('right')`),choice===30);
 if(choice===30)await screenshot('scoring-quiz-'+width+'.png');
 await evaluate(`document.querySelector('[data-retry]').click()`);
}
await evaluate(`lesson.close();document.querySelector('[data-learning-tutorial="style"]').click();document.querySelector('#learning-tutorial [data-next]').click()`);
assert.equal(await evaluate(`document.querySelector('[data-board="paper"]').getAttribute('aria-pressed')`),'true');
await evaluate(`document.querySelector('[data-board="chalk"]').click()`);assert.equal(await evaluate(`document.querySelectorAll('[data-board][aria-pressed="true"]').length`),2);
await evaluate(`document.querySelector('#learning-tutorial [data-next]').click()`);await screenshot('style-practice-'+width+'.png');
const before=await evaluate(`document.querySelector('.lt-board-preview b').textContent`);await evaluate(`document.querySelector('[data-round]').click()`);assert.notEqual(await evaluate(`document.querySelector('.lt-board-preview b').textContent`),before);
await evaluate(`document.querySelector('[data-board="paper"]').click()`);const fixed=await evaluate(`document.querySelector('.lt-board-preview b').textContent`);for(let i=0;i<3;i++)await evaluate(`document.querySelector('[data-round]').click()`);assert.equal(await evaluate(`document.querySelector('.lt-board-preview b').textContent`),fixed);
await evaluate(`document.querySelector('[data-board="chalk"]').click();document.querySelector('[data-round]').click()`);assert.equal(await evaluate(`document.querySelector('.lt-board-preview b').textContent`),'Paper and pencil');
await evaluate(`document.querySelector('#learning-tutorial [data-next]').click();document.querySelector('#learning-tutorial [data-next]').click()`);assert.equal(await evaluate(`document.querySelectorAll('.lt-unlocks section').length`),6);await screenshot('style-unlocks-'+width+'.png');
const size=await evaluate(`(()=>{const d=document.getElementById('learning-tutorial'),next=d.querySelector('[data-next]'),r=next.getBoundingClientRect(),b=d.getBoundingClientRect();return {fits:d.scrollWidth<=d.clientWidth+1,buttonVisible:r.bottom<=b.bottom+1&&r.top>=b.top,height:b.height}})()`);assert(size.fits&&size.buttonVisible);assert(size.height<=760);
await evaluate(`document.querySelector('#learning-tutorial [data-next]').click()`);assert.equal(await evaluate(`document.getElementById('learning-tutorial').open`),false);
await evaluate(`document.querySelector('[data-learning-tutorial="style"]').click();document.querySelector('#learning-tutorial [data-next]').click()`);assert.equal(await evaluate(`document.querySelectorAll('[data-board][aria-pressed="true"]').length`),1,'Practice resets on reopen');
await evaluate(`page='home';document.body.classList.toggle('changed')`);await evaluate(`new Promise(r=>setTimeout(r,60))`);assert.equal(await evaluate(`document.getElementById('learning-tutorial').open`),false,'Leaving the parent screen closes the lesson');
await evaluate(`lesson.destroy()`);console.log(width+'px: all scoring examples, all four quiz answers, explanation gating, equip toggles, random/fixed/default selection, unlock routes, safe close and mobile layout passed.');
}}).catch(e=>{console.error(e.stack);process.exitCode=1});
