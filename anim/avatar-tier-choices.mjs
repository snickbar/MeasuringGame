export function initialChoices(data){return data.items.map(({id,tier})=>({id,tier}));}
export function validateChoices(data,input){
 if(input.type!=='size-em-up-avatar-tiers'||input.version!==1||input.fingerprint!==data.fingerprint||!Array.isArray(input.items)||input.items.length!==data.items.length)throw Error('Choose a matching avatar-review file.');
 const allowed=new Set(data.items.map(r=>r.id)),seen=new Set();
 return input.items.map(r=>{if(!allowed.has(r.id)||seen.has(r.id)||!['default','common'].includes(r.tier))throw Error('Invalid avatar choices. Rare and Ultra cannot be changed here.');seen.add(r.id);return {id:r.id,tier:r.tier};});
}
export function swapAvatars(items,a,b){
 const i=items.findIndex(r=>r.id===a),j=items.findIndex(r=>r.id===b);if(i<0||j<0)throw Error('Unknown avatar');
 const next=items.map(r=>({...r}));[next[i],next[j]]=[{...next[j],tier:next[i].tier},{...next[i],tier:next[j].tier}];return next;
}
