// Real public delivery smoke test; uses the app's updater with a native-plugin
// adapter that downloads and hashes the actual ZIP, but never installs it.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
(async()=>{
 const {createLiveUpdater,UPDATE_SOURCES}=await import('../anim/live-updates.mjs');
 const output=path.resolve(__dirname,'../output/update-delivery');fs.mkdirSync(output,{recursive:true});
 const running=process.argv[2];if(!running)throw Error('Pass the version from the one-time installer');
 let download,queued,source;
 const updater={
  list:async()=>({bundles:[]}),current:async()=>({bundle:{id:'builtin'}}),delete:async()=>{},
  download:async options=>{
   const response=await fetch(options.url);if(!response.ok)throw Error('ZIP HTTP '+response.status);
   const bytes=Buffer.from(await response.arrayBuffer()),checksum=crypto.createHash('sha256').update(bytes).digest('hex');
   if(checksum!==options.checksum)throw Error('Public ZIP checksum mismatch');
   const file=path.join(output,'bundle.zip');fs.writeFileSync(file,bytes);
   const bundled=process.platform==='win32'?execFileSync('tar.exe',['-xOf',file,'app-version.json'],{encoding:'utf8'}):execFileSync('unzip',['-p',file,'app-version.json'],{encoding:'utf8'});
   if(JSON.parse(bundled).version!==options.version)throw Error('ZIP version disagrees with manifest');
   download={...options,bytes:bytes.length,checksum};return {id:'verified-public-zip'};
  },next:async value=>{queued=value.id;},
 };
 const client=createLiveUpdater({updater,sources:[UPDATE_SOURCES[0]],fetchManifest:async(url,options)=>{
  source=url;const response=await fetch(url,{...options,headers:{Origin:'https://localhost'}});
  if(response.headers.get('access-control-allow-origin')!=='*')throw Error('Manifest is not CORS enabled for the app');
  return response;
 }});
 const result=await client.check(running);
 if(result.state!=='downloaded'||queued!=='verified-public-zip')throw Error('Expected a newer downloadable update: '+JSON.stringify(result));
 const report={installerVersion:running,manifest:source,...download,queued:true,checkedAt:new Date().toISOString()};
 fs.writeFileSync(path.join(output,'verification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
