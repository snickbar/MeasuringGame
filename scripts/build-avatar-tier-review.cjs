const fs=require('fs'),vm=require('vm'),crypto=require('crypto');
const source=fs.readFileSync('index.html','utf8');
const map=name=>vm.runInNewContext('('+source.match(new RegExp('const '+name+' = (\\{[\\s\\S]*?\\n  \\});'))[1]+')');
const tiers=map('AVATAR_TIERS'),names=map('BOT_NAME_BY_AVATAR');
const items=Object.entries(tiers).filter(([,tier])=>['default','common'].includes(tier)).map(([id,tier])=>({id,tier,name:names[id]||id,image:'avatars/'+id+'.png',new:Number(id.slice(2))>=314}));
const fingerprint=crypto.createHash('sha256').update(JSON.stringify(items)).digest('hex').slice(0,16);
fs.writeFileSync('anim/avatar-tier-review-data.json',JSON.stringify({version:1,fingerprint,items},null,2)+'\n');
console.log(`${items.filter(r=>r.tier==='default').length} Default and ${items.filter(r=>r.tier==='common').length} Common avatars available to review; Rare/Ultra excluded.`);
