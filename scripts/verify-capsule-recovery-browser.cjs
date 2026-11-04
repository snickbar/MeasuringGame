const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');const {runFixture}=require('./browser-fixture.cjs');
const source=fs.readFileSync('index.html','utf8').replace(/\r\n/g,'\n'),fixture=fs.readFileSync('scripts/verify-game-polish-browser.cjs','utf8'),context={};
vm.runInNewContext(fixture.slice(fixture.indexOf('const dbStub='),fixture.indexOf('let checks='))+';globalThis.parts={dbStub,authStub};',context);
const dbStub=context.parts.dbStub.replace('export async function update(r,v){','export async function update(r,v){if(window.__denyNextProfile&&r.p.startsWith("profiles/")&&v._writeVersion){window.__denyNextProfile=false;throw Object.assign(Error("permission-denied"),{code:"PERMISSION_DENIED"})}');
const api=`window.__capsuleTest={ready:()=>!!myProfile.stats?.gamesPlayed,balance:()=>({coins:myProfile.coins,free:myProfile.freePulls}),open:()=>{modeTutorialUI.close();openGachaScreen('capsules');renderGachaScreen()},pull:()=>runGachaPull('avatar',gachaPullBtn)};`;
const html=source.replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js','/__fake/app.mjs').replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js','/__fake/db.mjs').replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js','/__fake/auth.mjs').replace('\n</script>\n</body>',api+'\n</script>\n</body>');
runFixture({html,modules:{'/__fake/app.mjs':'export const initializeApp=()=>({});','/__fake/db.mjs':dbStub,'/__fake/auth.mjs':context.parts.authStub},widths:[320,390,430],out:'output/capsule-recovery',check:async({width,evaluate,screenshot})=>{
 for(let i=0;i<400&&!await evaluate('window.__capsuleTest?.ready()');i++)await new Promise(r=>setTimeout(r,20));
 await new Promise(r=>setTimeout(r,250));await evaluate('__capsuleTest.open()');const before=await evaluate('__capsuleTest.balance()');
 await evaluate('window.__denyNextProfile=true;__capsuleTest.pull()');
 assert(await evaluate("!document.body.classList.contains('gacha-pull-lock')&&!document.getElementById('gacha-pull-btn').disabled"),'failed save releases the actual shop');
 assert.match(await evaluate("document.getElementById('gacha-status').textContent"),/try again/i);
 assert.deepEqual(await evaluate('__capsuleTest.balance()'),before,'rejected pull spends neither coins nor a free pull');
 await screenshot('failed-pull-'+width+'.png');await evaluate('__capsuleTest.pull()');
 assert(await evaluate("document.getElementById('gacha-result-overlay').classList.contains('show')"),'retry reaches the real result card');
 const after=await evaluate('__capsuleTest.balance()');assert.equal(after.coins,before.coins);assert.equal(after.free,before.free-1);
 console.log({pass:true,width,rejectedSaveReleased:true,retrySucceeded:true});
}}).catch(e=>{console.error(e);process.exitCode=1});
