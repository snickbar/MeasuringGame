// Phone review on the local network. Only review pages and their public artwork
// are served; project files, player profiles and game write APIs are excluded.
const http=require('http'),fs=require('fs'),path=require('path'),os=require('os');
const root=path.resolve(__dirname,'..'),port=Number(process.argv[2])||4174;
const files=new Set([
 '/anim/object-review.html','/anim/object-review.mjs','/anim/object-review-model.mjs',
 '/anim/object-review-prompts.mjs','/anim/object-review-data.json',
 '/anim/stack-anim.js','/anim/orient-data.js','/anim/reveal-style.mjs','/anim/landing-effects.mjs',
 '/anim/scenery.mjs','/anim/scenery-data.mjs','/anim/grass.png','/anim/cloud.png',
 '/anim/scenery-objects.html','/anim/scenery-objects.mjs','/anim/scenery-object-data.json',
 '/anim/scenery-gallery.html','/anim/stadium-preview.html',
 '/anim/cutout-review.html','/anim/cutout-review.mjs','/anim/cutout-review-data.json'
]);
const allowed=p=>files.has(p)||/^\/items\/[a-z0-9-]+\.webp$/.test(p)||/^\/anim\/scenery\/[a-z0-9-]+\.png$/.test(p);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.webp':'image/webp','.png':'image/png'};
const server=http.createServer((req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-store');
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end('Read-only review');return;}
 let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);res.end();return;}
 if(pathname==='/'){res.writeHead(302,{Location:'/anim/object-review.html'});res.end();return;}
 if(!allowed(pathname)){res.writeHead(404);res.end('Not found');return;}
 const file=path.resolve(root,'.'+pathname);
 if(!file.startsWith(root+path.sep)){res.writeHead(404);res.end();return;}
 fs.readFile(file,(error,bytes)=>{
  if(error){res.writeHead(404);res.end('Not found');return;}
  res.setHeader('Content-Type',types[path.extname(file)]);res.end(req.method==='HEAD'?undefined:bytes);
 });
});
server.on('error',error=>{console.error(error.message);process.exitCode=1;});
server.listen(port,'0.0.0.0',()=>{
 console.log('Local workshop: http://127.0.0.1:'+port+'/anim/object-review.html');
 for(const [name,list] of Object.entries(os.networkInterfaces()))for(const a of list)if(a.family==='IPv4'&&!a.internal)console.log(name+': http://'+a.address+':'+port+'/anim/object-review.html');
});
