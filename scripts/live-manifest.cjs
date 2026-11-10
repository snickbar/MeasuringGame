// Per-file list of a build, used for partial ("delta") live updates: the phone compares each file's SHA-256 with the
// files it already has (its installed app, the previous live update, or its download cache) and fetches only the rest.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');

function walk(dir,base,out){
 for(const entry of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0)){
  const full=path.join(dir,entry.name);
  if(entry.isDirectory())walk(full,base,out);
  else if(entry.isFile())out.push({full,name:path.relative(base,full).split(path.sep).join('/')});
 }
 return out;
}

function sha256(file){return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');}

// [{file_name:'anim/a.webp',file_hash:'<64 hex>',size:123}], sorted by name so two builds diff cleanly.
function buildFileList(www){
 return walk(www,www,[]).map(({full,name})=>({file_name:name,file_hash:sha256(full),size:fs.statSync(full).size}));
}

module.exports={buildFileList,sha256};
