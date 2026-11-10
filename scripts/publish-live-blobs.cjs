// Partial live updates: publish each file of the build once, under its SHA-256, so a phone downloads only the files it
// does not already have. Files unchanged since an earlier build keep pointing at the release that first stored them.
// Writes manifest.json to the app-updates branch (the pointer in version.json is switched last, by publish-live-update.cjs).
const fs=require('node:fs'),path=require('node:path');
const BRANCH='app-updates',BATCH=400,UPLOAD_CHUNK=40;

function previousUrls(gh,repo){
 // hash -> download address from the last published manifest (empty on the very first run).
 try{
  const raw=gh(['api','-H','Accept: application/vnd.github.raw+json',`repos/${repo}/contents/manifest.json?ref=${BRANCH}`]);
  const old=JSON.parse(raw),map=new Map();
  for(const f of old.files||[])if(f.file_hash&&f.download_url)map.set(f.file_hash,f.download_url);
  return map;
 }catch{return new Map();}
}

function ensureReleaseDraft(gh,repo,tag,sha,title){
 let release;
 try{release=JSON.parse(gh(['api',`repos/${repo}/releases/tags/${tag}`]));}catch{
  release=JSON.parse(gh(['api',`repos/${repo}/releases?per_page=100`,'--jq',`[.[]|select(.tag_name=="${tag}")|{id,tag_name,draft,assets:[.assets[]|{name}]}]`]))[0];
 }
 if(!release)release=JSON.parse(gh(['api',`repos/${repo}/releases`,'--method','POST','--input','-'],{tag_name:tag,target_commitish:sha,name:title,body:'Files for partial app updates. Safe to leave; phones download only what they are missing.',draft:true,prerelease:false}));
 return release;
}

function publishBlobs({root,repo,sha,version,gh}){
 const list=JSON.parse(fs.readFileSync(path.join(root,'live/files.json'),'utf8'));
 if(list.version!==version)throw Error('files.json belongs to another build');
 const known=previousUrls(gh,repo),urlFor=new Map(known),fresh=new Map();
 for(const f of list.files)if(!urlFor.has(f.file_hash)&&!fresh.has(f.file_hash))fresh.set(f.file_hash,f.file_name);
 const hashes=[...fresh.keys()];
 const batches=[];for(let i=0;i<hashes.length;i+=BATCH)batches.push(hashes.slice(i,i+BATCH));
 const stage=path.join(root,'live/blobs');fs.rmSync(stage,{recursive:true,force:true});fs.mkdirSync(stage,{recursive:true});
 batches.forEach((batch,n)=>{
  const tag=`blobs-${sha.slice(0,12)}-${n+1}`,release=ensureReleaseDraft(gh,repo,tag,sha,`App files ${sha.slice(0,7)} (${n+1}/${batches.length})`);
  if(release.draft){
   const files=batch.map(h=>{const dest=path.join(stage,h);fs.copyFileSync(path.join(root,'www',fresh.get(h)),dest);return dest;});
   for(let i=0;i<files.length;i+=UPLOAD_CHUNK)gh(['release','upload',tag,...files.slice(i,i+UPLOAD_CHUNK),'--repo',repo,'--clobber']);
   gh(['release','edit',tag,'--repo',repo,'--draft=false']);
  }else{
   const have=new Set((release.assets||[]).map(a=>a.name));
   if(!batch.every(h=>have.has(h)))throw Error('Release '+tag+' is already published but incomplete; publish a new commit');
  }
  for(const h of batch)urlFor.set(h,`https://github.com/${repo}/releases/download/${tag}/${h}`);
 });
 fs.rmSync(stage,{recursive:true,force:true});
 const files=list.files.map(f=>({file_name:f.file_name,file_hash:f.file_hash,download_url:urlFor.get(f.file_hash)}));
 if(files.some(f=>!f.download_url))throw Error('A file has no download address');
 const body=JSON.stringify({version,files})+'\n';
 let previous;try{previous=JSON.parse(gh(['api',`repos/${repo}/contents/manifest.json?ref=${BRANCH}`]));}catch{}
 gh(['api',`repos/${repo}/contents/manifest.json`,'--method','PUT','--input','-'],{message:'Files for '+version,branch:BRANCH,content:Buffer.from(body).toString('base64'),...(previous?{sha:previous.sha}:{})});
 console.log(`Partial update files: ${files.length} listed, ${hashes.length} new (${batches.length} release${batches.length===1?'':'s'}).`);
 return {manifestUrl:`https://raw.githubusercontent.com/${repo}/${BRANCH}/manifest.json`,fileCount:files.length,newFiles:hashes.length};
}

module.exports={publishBlobs};
