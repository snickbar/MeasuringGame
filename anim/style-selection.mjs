// Preserve the effective selection from older profiles without a destructive migration.
export function styleSelectedIds(profile,category,owned,pinned=[],randomDefaults=owned){
 const pool=profile.randomPool?.[category]||{};
 const valid=new Set(owned),unique=ids=>[...new Set(ids)].filter(id=>valid.has(id));
 if(pool.__equipped===true)return unique(owned.filter(id=>pool[id]===true));
 if(!profile.randomEquip?.[category])return unique(pinned);
 const selected=owned.filter(id=>pool[id]===true);
 if(category==='reactions')return unique([...pinned,...(selected.length?selected:randomDefaults)]);
 return unique(selected.length?selected:randomDefaults);
}
export function styleSelectionPatch(category,ids){
 return {[`randomPool/${category}`]:Object.fromEntries([['__equipped',true],...[...new Set(ids)].map(id=>[id,true])]),[`randomEquip/${category}`]:true};
}
