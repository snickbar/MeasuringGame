// Isolated local fixtures only. No live service writes or user browser profile.
const fs=require('fs'),path=require('path'),http=require('http'),os=require('os'),{spawn}=require('child_process');
const root=path.resolve(__dirname,'..');
exports.runFixture=async function({html,modules={},widths=[320,390,430],height=840,out='output/launch-polish',check}){
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/fixture'){res.setHeader('Content-Type','text/html');res.end(html);return}
  if(modules[url.pathname]!=null){res.setHeader('Content-Type','text/javascript');res.end(modules[url.pathname]);return}
  const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
  try{res.setHeader('Content-Type',({'.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml','.ttf':'font/ttf','.woff2':'font/woff2','.wav':'audio/wav','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}catch{res.writeHead(404);res.end()}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const child=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--autoplay-policy=no-user-gesture-required','--remote-debugging-port=0','--user-data-dir='+path.join(os.tmpdir(),'game-fixture-'+process.pid),'about:blank'],{windowsHide:true});
 let socket,timer;
 try{
  const ws=await new Promise((resolve,reject)=>{let stderr='';timer=setTimeout(()=>reject(Error('Chrome startup timeout')),15000);child.on('error',reject);child.stderr.on('data',chunk=>{stderr+=chunk;const match=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(match){clearTimeout(timer);resolve(match[1])}})});
  socket=new WebSocket(ws);await new Promise((yes,no)=>{socket.onopen=yes;socket.onerror=no});
  let serial=0;const pending=new Map(),errors=[];
  socket.onmessage=e=>{const r=JSON.parse(e.data);if(r.method==='Runtime.exceptionThrown')errors.push(r.params.exceptionDetails.exception?.description||r.params.exceptionDetails.text);const p=pending.get(r.id);if(!p)return;pending.delete(r.id);r.error?p.no(Error(r.error.message)):p.yes(r.result)};
  const call=(method,params={},sessionId)=>new Promise((yes,no)=>{const id=++serial;pending.set(id,{yes,no});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}))});
  fs.mkdirSync(path.join(root,out),{recursive:true});
  timer=setTimeout(()=>{child.kill();server.close()},120000);
  for(const width of widths){
   errors.length=0;
   const {targetId}=await call('Target.createTarget',{url:'about:blank'}),{sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});
   await call('Runtime.enable',{},sessionId);
   await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true},sessionId);
   const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true},sessionId);if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value};
   const screenshot=async name=>{await evaluate('document.fonts.ready.then(()=>true)');const r=await call('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(path.join(root,out,name),Buffer.from(r.data,'base64'))};
   await call('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/fixture'},sessionId);
   await check({width,evaluate,screenshot,call,sessionId});
   if(errors.length)throw Error(errors.join('\n'));
   await call('Target.closeTarget',{targetId});
  }
 }finally{clearTimeout(timer);socket?.close();child.kill();server.close()}
};
