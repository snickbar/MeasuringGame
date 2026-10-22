// Positive weights: recent objects are less likely, never banned. Only random
// modes use this; shared Daily/Monthly challenge schedules remain deterministic.
export function weightedPick(items, weight, random=Math.random){
  if(!items.length)throw Error('No eligible objects');
  const weights=items.map(x=>Math.max(0.000001,Number(weight(x))||0));
  let ticket=random()*weights.reduce((a,b)=>a+b,0);
  for(let i=0;i<items.length;i++){ticket-=weights[i];if(ticket<0)return items[i];}
  return items.at(-1);
}
export function createObjectMemory({owner,history=()=>[],storage=localStorage,random=Math.random}){
  const caches=new Map();
  function current(){
    const id=owner()||'guest';
    if(!caches.has(id)){
      let rows;
      try{const saved=JSON.parse(storage.getItem('mg_object_memory_v1_'+id));if(Array.isArray(saved))rows=saved.filter(r=>Array.isArray(r)&&[2,3].includes(r.length)&&r.every(x=>typeof x==='string'));}catch{}
      if(!rows)rows=(Array.isArray(history())?history():Object.values(history()||{})).filter(h=>h?.u&&h?.g).map(h=>[h.u,h.g]);
      caches.set(id,rows.slice(-100));
    }
    return {id,rows:caches.get(id)};
  }
  function objectWeight(id){
    const {rows}=current();let pressure=0;
    for(let i=rows.length-1;i>=0;i--)if(rows[i][0]===id||rows[i][1]===id)pressure+=Math.pow(0.5,(rows.length-1-i)/12);
    return 1/(1+3*pressure);
  }
  function pairWeight(a,b){
    const {rows}=current();let pressure=0;
    for(let i=rows.length-1;i>=0;i--)if((rows[i][0]===a&&rows[i][1]===b)||(rows[i][0]===b&&rows[i][1]===a))pressure+=Math.pow(0.5,(rows.length-1-i)/20);
    return Math.sqrt(objectWeight(a)*objectWeight(b))/(1+2*pressure);
  }
  function remember(a,b){
    if(!a||!b)return;const {id,rows}=current();rows.push([a,b]);if(rows.length>100)rows.shift();
    try{storage.setItem('mg_object_memory_v1_'+id,JSON.stringify(rows));}catch{}
  }
  function observe(a,b,key){
    if(!a||!b||!key)return;const {id,rows}=current();
    if(rows.some(r=>r[2]===key))return;
    // Claim a generated selection rather than counting it twice when completed.
    const prior=rows.findLast(r=>!r[2]&&((r[0]===a&&r[1]===b)||(r[0]===b&&r[1]===a)));
    if(prior)prior[2]=key;else{rows.push([a,b,key]);if(rows.length>100)rows.shift();}
    try{storage.setItem('mg_object_memory_v1_'+id,JSON.stringify(rows));}catch{}
  }
  const pairIds=p=>Array.isArray(p)?p.map(o=>o.id):[p.u?.id||p.u,p.t?.id||p.t];
  function pickPair(pairs){return weightedPick(pairs,p=>pairWeight(...pairIds(p)),random);}
  function orderPairs(pairs){return pairs.map(p=>({p,key:-Math.log(Math.max(Number.MIN_VALUE,random()))/pairWeight(...pairIds(p))})).sort((a,b)=>a.key-b.key).map(x=>x.p);}
  return {objectWeight,pairWeight,remember,observe,pickPair,orderPairs,pickObject:(objects,extra=()=>1)=>weightedPick(objects,o=>objectWeight(o.id)*extra(o),random)};
}
