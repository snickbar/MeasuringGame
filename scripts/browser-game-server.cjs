// Browser modules need HTTP rather than file://. Serve only public game assets,
// on this computer, with fresh source files and the correct module MIME types.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..'),PORT=4180;
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg','.woff2':'font/woff2','.ttf':'font/ttf'};
const ROOT_FILES=new Set(['index.html','manifest.json','sw.js','privacy.html','icon-192.png','icon-512.png','og-image.jpg']);
function createBrowserGameServer(){return http.createServer((req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);}catch{res.writeHead(400);res.end();return;}
  if(pathname==='/__game/status'){
    res.setHeader('Content-Type',MIME['.json']);res.end(req.method==='HEAD'?undefined:JSON.stringify({app:'SizeEmUpBrowser',root:ROOT}));return;
  }
  if(pathname==='/')pathname='/index.html';
  if(pathname==='/__game/ready.png')pathname='/icon-192.png';
  const relative=pathname.slice(1),ext=path.extname(relative).toLowerCase();
  const allowed=ROOT_FILES.has(relative)||/^home-[a-z0-9-]+\.jpg$/.test(relative)||/^(anim|icons|items|avatars|backgrounds|sfx)\//.test(relative);
  const file=path.resolve(ROOT,relative);
  if(!allowed||!MIME[ext]||relative.includes('\\')||relative.split('/').some(part=>part.startsWith('.'))||!file.startsWith(ROOT+path.sep)){res.writeHead(404);res.end('Not found');return;}
  fs.readFile(file,(error,bytes)=>{if(error){res.writeHead(404);res.end('Not found');return;}res.setHeader('Content-Type',MIME[ext]);res.end(req.method==='HEAD'?undefined:bytes);});
});}
if(require.main===module){const server=createBrowserGameServer();server.on('error',error=>{console.error(error.message);process.exitCode=1;});server.listen(PORT,'127.0.0.1',()=>console.log('Size Em Up browser game: http://127.0.0.1:'+PORT+'/'));}
module.exports={createBrowserGameServer,ROOT,PORT};
