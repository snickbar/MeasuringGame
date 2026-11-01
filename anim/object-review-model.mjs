export const MOTIONS = {slide:'Gentle hops / slide',walk:'Walking bounce',drive:'Driving rumble',fly:'Flying glide',sail:'Sailing bob'};
export function currentSettings(o) {
  return {mm:o.mm,measurement:{...o.measurement},orientation:{...o.orientation},motionSmall:o.motionSmall,motionBig:o.motionBig};
}
export function validateSettings(value, types) {
  const fail = () => {throw Error('Invalid measurement, orientation or entrance setting.');};
  if(!value || !Number.isFinite(value.mm) || value.mm<=0 || value.mm>1e12)fail();
  const m=value.measurement,r=value.orientation;
  if(!m || !Object.hasOwn(types,m.dimension) || !r || ![0,45,90,135,180,225,270,315].includes(r.rot))fail();
  if(typeof r.flip!=='boolean'||typeof r.mirR!=='boolean'||!['none','cw','ccw'].includes(r.leanL)||!['none','cw','ccw'].includes(r.leanR))fail();
  if(!Object.hasOwn(MOTIONS,value.motionSmall)||!Object.hasOwn(MOTIONS,value.motionBig))fail();
  const measurement={dimension:m.dimension};
  for(const key of ['qualifier','subject'])if(m[key]!=null){if(typeof m[key]!=='string'||m[key].length>200)fail();if(m[key].trim())measurement[key]=m[key].trim();}
  return {mm:value.mm,measurement,orientation:{rot:r.rot,flip:r.flip,leanL:r.leanL,leanR:r.leanR,mirR:r.mirR},motionSmall:value.motionSmall,motionBig:value.motionBig};
}
export function sameSettings(a,b) {return JSON.stringify(a)===JSON.stringify(b);}
export function validatePicks(input,data) {
  if(input?.type!=='size-em-up-object-picks'||input.version!==1||!Array.isArray(input.objects)||input.objects.length>data.objects.length)throw Error('Choose an Object workshop choices file.');
  const known=new Map(data.objects.map(o=>[o.id,o])),seen=new Set(),draft={};
  if(input.reviewedIds!=null&&(!Array.isArray(input.reviewedIds)||input.reviewedIds.length>known.size||new Set(input.reviewedIds).size!==input.reviewedIds.length||input.reviewedIds.some(id=>!known.has(id))))throw Error('The file contains invalid review progress.');
  for(const row of input.objects){
    const object=known.get(row.id);
    if(!object||seen.has(row.id))throw Error('The file contains an unknown or repeated object.');
    seen.add(row.id);
    const settings=validateSettings(row.settings,data.types);
    const resolution=data.resolvedDrafts?.[row.id];
    if(resolution&&row.current&&sameSettings(validateSettings(row.current,data.types),validateSettings(resolution.before,data.types))&&sameSettings(settings,validateSettings(resolution.requested,data.types))&&sameSettings(validateSettings(currentSettings(object),data.types),validateSettings(resolution.applied,data.types)))continue;
    if(!sameSettings(settings,validateSettings(currentSettings(object),data.types)))draft[row.id]=settings;
  }
  return draft;
}
