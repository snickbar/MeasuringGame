const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const {ROOT,PORT}=require('./browser-game-server.cjs');
const url='http://127.0.0.1:'+PORT+'/';
function status(){return new Promise(resolve=>{const req=http.get(url+'__game/status',res=>{let body='';res.on('data',chunk=>{body+=chunk;});res.on('end',()=>{try{const value=JSON.parse(body);resolve(value.app==='SizeEmUpBrowser'&&value.root===ROOT);}catch{resolve(false);}});});req.on('error',()=>resolve(false));req.setTimeout(600,()=>req.destroy());});}
async function ensureBrowserGame(){
  if(await status())return url;
  const folder=path.join(ROOT,'output','browser-game');fs.mkdirSync(folder,{recursive:true});
  const log=fs.openSync(path.join(folder,'server.log'),'a');
  const server=spawn(process.execPath,[path.join(__dirname,'browser-game-server.cjs')],{cwd:ROOT,detached:true,windowsHide:true,stdio:['ignore',log,log]});
  server.unref();fs.closeSync(log);
  for(let i=0;i<40;i++){await new Promise(resolve=>setTimeout(resolve,150));if(await status())return url;}
  throw Error('The browser game could not start. See output/browser-game/server.log.');
}
if(require.main===module)ensureBrowserGame().then(address=>{
  console.log('Opening Size Em Up!');
  const browser=spawn('powershell.exe',['-NoProfile','-NonInteractive','-WindowStyle','Hidden','-Command',"Start-Process '"+address+"'"],{windowsHide:true,stdio:'ignore'});
  browser.on('error',error=>{console.error('Open '+address+' in your browser. '+error.message);process.exitCode=1;});
}).catch(error=>{console.error(error.message);process.exitCode=1;});
module.exports={ensureBrowserGame};
