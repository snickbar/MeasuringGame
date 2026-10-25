// Publish an immutable ZIP first, then atomically move the small public pointer.
// Uses gh's existing credentials locally or GH_TOKEN in GitHub Actions.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),repo='snickbar/MeasuringGame';
function gh(args,input){return execFileSync('gh',args,{cwd:root,encoding:'utf8',...(input?{input:JSON.stringify(input)}:{})}).trim();}
function publish(){
 const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),tag='web-'+sha;
 const base=`https://github.com/${repo}/releases/download/${tag}`;
 let manifest=JSON.parse(fs.readFileSync(path.join(root,'live/version.json')));
 if(manifest.url!==base+'/bundle.zip')throw Error('Build with LIVE_BUNDLE_BASE_URL='+base+' before publishing');
 let release;try{release=JSON.parse(gh(['api',`repos/${repo}/releases/tags/${tag}`]));}catch{
  // Draft releases have no published tag yet; the tag endpoint returns 404.
  release=JSON.parse(gh(['api',`repos/${repo}/releases?per_page=100`])).find(r=>r.tag_name===tag);
 }
 if(!release){
  release=JSON.parse(gh(['api',`repos/${repo}/releases`,'--method','POST','--input','-'],{tag_name:tag,target_commitish:sha,name:'Web update '+manifest.version,body:'Verified web update for Size Em Up. Downloaded automatically by supported app builds.',draft:true,prerelease:true}));
 }
 if(release.draft){
  gh(['release','upload',tag,path.join(root,'live/bundle.zip'),path.join(root,'live/version.json'),'--repo',repo,'--clobber']);
  gh(['release','edit',tag,'--repo',repo,'--draft=false']);
 }else{
  // Reruns reuse the exact published ZIP. Never replace a live download.
  const asset=release.assets.find(a=>a.name==='bundle.zip'),saved=path.join(root,'live/published-version.json');
  gh(['release','download',tag,'--repo',repo,'--pattern','version.json','--output',saved,'--clobber']);
  const published=JSON.parse(fs.readFileSync(saved));
  if(!asset||published.version!==manifest.version||published.url!==base+'/bundle.zip'||!/^\w{64}$/.test(published.checksum)||asset.digest&&asset.digest!=='sha256:'+published.checksum)throw Error('Published ZIP metadata differs; publish a new commit instead of replacing it');
  manifest=published;
 }
 try{gh(['api',`repos/${repo}/git/ref/heads/app-updates`]);}
 catch{gh(['api',`repos/${repo}/git/refs`,'--input','-'],{ref:'refs/heads/app-updates',sha});}
 let previous;try{previous=JSON.parse(gh(['api',`repos/${repo}/contents/version.json?ref=app-updates`]));}catch{}
 if(previous){const current=JSON.parse(Buffer.from(previous.content,'base64').toString());if(current.version>manifest.version){console.log('A newer update is already published; leaving its pointer in place.');return;}}
 const pointer={message:'Publish '+manifest.version,branch:'app-updates',content:Buffer.from(JSON.stringify(manifest,null,2)+'\n').toString('base64'),...(previous?{sha:previous.sha}:{})};
 gh(['api',`repos/${repo}/contents/version.json`,'--method','PUT','--input','-'],pointer);
 console.log('Published '+manifest.version+' via GitHub; Firebase is not required.');
}
if(require.main===module)publish();
