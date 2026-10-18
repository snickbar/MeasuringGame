const fs=require('fs'),path=require('path'),http=require('http'),os=require('os'),{spawn}=require('child_process');
const root=path.resolve(__dirname,'..');
const fixture=`<!doctype html><html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}iframe{border:0;width:100vw;height:100vh}</style><iframe id="app"></iframe><pre id="result" hidden></pre><script type="module">
const assert=(v,m)=>{if(!v)throw Error(m)},wait=ms=>new Promise(r=>setTimeout(r,ms));
localStorage.removeItem('size-em-up-cutout-picks-v1');localStorage.removeItem('size-em-up-cutout-picks-v1-view');
const frame=document.getElementById('app');frame.src='/anim/cutout-review.html?section=all';
async function ready(){for(let i=0;i<500;i++){if(frame.contentWindow?.__cutoutReviewReady)return;await wait(20);}throw Error('Review did not load');}
try{
 await ready();let w=frame.contentWindow,d=frame.contentDocument,api=w.__cutoutReview,$=id=>d.getElementById(id);
 assert(api.data.images.length===480,'all artwork including alternates');assert(new Set(api.data.images.map(o=>o.image)).size===480,'every artwork path unique');
 assert(d.querySelectorAll('article').length===6,'six cards per page');assert(d.querySelectorAll('.picture .surface').length===12,'white and magenta side by side');
 const cards=[...d.querySelectorAll('article')],first=cards[0].dataset.id;
 assert(w.getComputedStyle(cards[0].querySelector('.surface.white')).backgroundColor==='rgb(255, 255, 255)','white background');
 assert(w.getComputedStyle(cards[0].querySelector('.surface.magenta')).backgroundColor==='rgb(255, 0, 255)','bright magenta background');
 assert(d.documentElement.scrollWidth<=innerWidth,'no sideways scrolling');
 if(innerWidth<=650)assert(cards.at(-1).getBoundingClientRect().bottom<=d.querySelector('.pager').getBoundingClientRect().top+1,'all six fit above phone navigation: '+JSON.stringify({last:cards.at(-1).getBoundingClientRect().bottom,nav:d.querySelector('.pager').getBoundingClientRect().top,card:cards[0].getBoundingClientRect().height,picture:cards[0].querySelector('.picture').getBoundingClientRect().height}));
 cards[0].querySelector('[data-pick=fix]').click();cards[1].querySelector('[data-pick=okay]').click();
 assert(api.getChoices()[first].decision==='fix','needs fixing saved');assert(cards[0].classList.contains('fix'),'flag highlighted');assert(d.querySelectorAll('article').length===6,'marking does not shift grid');
 cards[0].querySelector('.picture').click();assert($('zoom').open,'large image opens');assert($('zoom-picture').querySelector('img'),'zoom artwork');
 $('zoom-bg').value='cyan';$('zoom-bg').dispatchEvent(new w.Event('change'));assert(w.getComputedStyle($('zoom-picture')).backgroundColor==='rgb(0, 229, 255)','zoom background selection');
 $('note').value='White gap inside the handle';$('note').dispatchEvent(new w.Event('input'));assert(api.getChoices()[first].note.includes('handle'),'fix notes saved');$('close').click();
 const zoomReady=async()=>{for(let i=0;i<200;i++){if([...$('zoom-decisions').children].every(b=>!b.disabled))return;await wait(20);}throw Error('Full-screen image not ready');};
 d.querySelector('article .picture').click();await zoomReady();
 const fullscreen=$('zoom').getBoundingClientRect();assert(Math.abs(fullscreen.width-innerWidth)<2&&Math.abs(fullscreen.height-innerHeight)<2,'viewer fills phone viewport');
 assert($('zoom-picture').getBoundingClientRect().height>=innerHeight*.4,'large artwork has at least 40% of the phone screen');
 assert($('zoom-back').disabled,'Back disabled at first image');
 $('zoom-decisions').querySelector('[data-pick=fix]').click();await zoomReady();
 assert($('zoom-title').textContent===api.data.images[1].name,'Fix auto advances');assert(api.getChoices()[first].decision==='fix','repeat Fix does not clear selection');
 $('zoom-back').click();await zoomReady();assert($('zoom-title').textContent===api.data.images[0].name&&$('note').value.includes('handle'),'Back restores image and notes');
 const beforeNavigation=JSON.stringify(api.getChoices());$('zoom-forward').click();await zoomReady();assert(JSON.stringify(api.getChoices())===beforeNavigation,'Forward does not change decisions');
 $('zoom-decisions').querySelector('[data-pick=okay]').click();await zoomReady();assert($('zoom-title').textContent===api.data.images[2].name,'Keep auto advances');
 assert($('zoom-decisions').getBoundingClientRect().bottom<=innerHeight&&$('zoom-forward').getBoundingClientRect().bottom<=innerHeight,'decision and navigation buttons fit screen');
 const resumeName=$('zoom-title').textContent;
 await new Promise(resolve=>{frame.addEventListener('load',resolve,{once:true});frame.src='/anim/cutout-review.html?section=all';});await ready();w=frame.contentWindow;d=frame.contentDocument;api=w.__cutoutReview;$=id=>d.getElementById(id);await zoomReady();
 assert($('zoom').open&&$('zoom-title').textContent===resumeName,'reload restores full-screen position');$('close').click();
 const saved=JSON.parse(w.localStorage.getItem('size-em-up-cutout-picks-v1'));assert(saved.images.length===480&&saved.images.find(o=>o.id===first).decision==='fix','full export persisted');
 const valid=api.validate(saved);assert(valid.choices[first].decision==='fix','validation round trip');
 const duplicate=structuredClone(saved);duplicate.images.push(duplicate.images[0]);let rejected=false;try{api.validate(duplicate)}catch{rejected=true}assert(rejected,'duplicate rejected');
 const stale=structuredClone(saved);stale.images.find(o=>o.id===first).sourceHash='changed';assert(api.validate(stale).choices[first].decision===null&&api.validate(stale).outdated===1,'changed artwork requires fresh review');
 let blob;const original=w.URL.createObjectURL.bind(w.URL);w.URL.createObjectURL=b=>{blob=b;return original(b)};$('export').click();assert(JSON.parse(await blob.text()).images.find(o=>o.id===first).note.includes('handle'),'download includes notes');
 $('next').click();assert($('page').textContent==='Page 2 / 80','six-image pagination');const secondPage=d.querySelector('article').dataset.id;
 $('background').value='dark';$('background').dispatchEvent(new w.Event('change'));assert(d.querySelectorAll('.picture .surface').length===6,'single background option');
 await new Promise(resolve=>{frame.addEventListener('load',resolve,{once:true});frame.src='/anim/cutout-review.html?section=all';});await ready();w=frame.contentWindow;d=frame.contentDocument;api=w.__cutoutReview;$=id=>d.getElementById(id);
 assert(api.getChoices()[first].decision==='fix'&&d.querySelector('article').dataset.id===secondPage&&$('background').value==='dark','choices, page and background restore');
 $('filter').value='fix';$('filter').dispatchEvent(new w.Event('change'));assert(d.querySelectorAll('article').length===1,'needs fixing filter');
 d.querySelector('button[data-pick=fix]').click();assert(!api.getChoices()[first].decision,'tap selected choice clears decision without losing note');
 $('filter').value='all';$('filter').dispatchEvent(new w.Event('change'));$('search').value='alternate';$('search').dispatchEvent(new w.Event('input'));assert(d.querySelector('article').dataset.id==='donut-2','alternate artwork searchable');
 d.querySelector('article .picture').click();await zoomReady();assert($('zoom-back').disabled&&$('zoom-forward').disabled,'single-image list has safe boundaries');$('zoom-decisions').querySelector('[data-pick=fix]').click();assert($('zoom').open&&$('zoom-status').textContent.includes('Last image'),'final decision saves without wrapping');$('close').click();
 $('search').value='';$('search').dispatchEvent(new w.Event('input'));$('background').value='pair';$('background').dispatchEvent(new w.Event('change'));
 await new Promise(resolve=>{frame.addEventListener('load',resolve,{once:true});frame.src='/anim/cutout-review.html?section=fixed';});await ready();w=frame.contentWindow;d=frame.contentDocument;api=w.__cutoutReview;$=id=>d.getElementById(id);
 const batchCount=api.data.batch.count,batchPages=Math.ceil(batchCount/6);assert(batchCount===7&&$('filter').value==='recheck','dedicated fixed section opens by default');
 assert($('page').textContent.endsWith('/ '+batchPages),'follow-up batch uses six-image pages');
 assert([...d.querySelectorAll('article')].every(card=>api.data.images.find(o=>o.id===card.dataset.id).reviewBatch===api.data.batch.id),'only flagged batch shown');
 assert(api.validate(api.data.seedPicks).outdated===batchCount,'all prior Fix marks reset for changed artwork');
 assert(api.getChoices()['adult-human'].decision==='okay','previous Keep marks preserved');
 const fixedId=d.querySelector('article').dataset.id;assert(!api.getChoices()[fixedId]?.decision,'fixed image needs a fresh decision');
 d.querySelector('article .picture').click();await zoomReady();assert($('zoom-position').textContent==='1 / '+batchCount,'full screen stays within fixed section');assert(!$('cleanup-info').hidden&&$('cleanup-note').textContent,'cleanup notes available');
 $('zoom-decisions').querySelector('[data-pick=okay]').click();await zoomReady();assert(api.getChoices()[fixedId].decision==='okay','new Keep confirmation saved');assert($('zoom-position').textContent==='2 / '+batchCount,'fixed images auto advance');$('close').click();
 $('section-all').click();assert($('page').textContent.endsWith('/ 80'),'all-images section still available');$('section-recheck').click();assert($('page').textContent.endsWith('/ '+batchPages),'return to fixed section');
 document.getElementById('result').textContent=JSON.stringify({pass:true,width:innerWidth,checks:'480 files; six fit on phone; paired white/magenta and other colors; zoom; decisions/notes; export; validation; stale artwork handling; filters; pagination and saved resume'});
}catch(e){document.getElementById('result').textContent=JSON.stringify({pass:false,error:e.stack})}
</script></html>`;
const server=http.createServer((req,res)=>{
 if(req.url==='/test'){res.setHeader('Content-Type','text/html');res.end(fixture);return}
 const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 try{res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.mjs':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}catch{res.writeHead(404);res.end()}
});
server.listen(0,'127.0.0.1',()=>{
 const child=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--remote-debugging-port=0','--user-data-dir='+path.join(os.tmpdir(),'cutout-review-tests-'+process.pid),'about:blank'],{windowsHide:true});
 let stderr='',started=false,socket;const timer=setTimeout(()=>{child.kill();server.close();process.exitCode=1},60000);
 child.stderr.on('data',async chunk=>{
  stderr+=chunk;const match=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(started||!match)return;started=true;
  try{
   socket=new WebSocket(match[1]);await new Promise((yes,no)=>{socket.onopen=yes;socket.onerror=no});
   let serial=0;const pending=new Map();socket.onmessage=e=>{const r=JSON.parse(e.data),p=pending.get(r.id);if(!p)return;pending.delete(r.id);r.error?p.no(Error(r.error.message)):p.yes(r.result)};
   const call=(method,params={},sessionId)=>new Promise((yes,no)=>{const id=++serial;pending.set(id,{yes,no});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}))});
   fs.mkdirSync(path.join(root,'output','cutout-review-tests'),{recursive:true});
   for(const width of [320,390,430]){
    const {targetId}=await call('Target.createTarget',{url:'about:blank'}),{sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});
    await call('Emulation.setDeviceMetricsOverride',{width,height:width===320?600:740,deviceScaleFactor:1,mobile:true},sessionId);
    await call('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/test'},sessionId);
    let result;
    for(let n=0;n<500;n++){
     const value=await call('Runtime.evaluate',{expression:'document.getElementById("result")?.textContent',returnByValue:true},sessionId);
     if(value.result?.value){result=JSON.parse(value.result.value);break}await new Promise(r=>setTimeout(r,20));
    }
    if(!result)throw Error('No browser result at '+width);
    console.log(result);if(!result.pass)throw Error(result.error);
    await call('Runtime.evaluate',{expression:'document.fonts.ready',awaitPromise:true},sessionId);
    const shot=await call('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(path.join(root,'output','cutout-review-tests','choices-'+width+'.png'),Buffer.from(shot.data,'base64'));
    await call('Runtime.evaluate',{expression:'document.getElementById("app").contentDocument.getElementById("review").click()',returnByValue:true},sessionId);
    await new Promise(resolve=>setTimeout(resolve,250));
    const fullShot=await call('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(path.join(root,'output','cutout-review-tests','fullscreen-'+width+'.png'),Buffer.from(fullShot.data,'base64'));
    await call('Target.closeTarget',{targetId});
   }
  }catch(e){console.error(e);process.exitCode=1}finally{clearTimeout(timer);socket?.close();child.kill();server.close()}
 });
});


