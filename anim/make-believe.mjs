// Real toys/costumes and extinct animals remain in the real-world pool.
// These characters also occur outside the separately unlocked fantasy catalog.
const IMAGINARY_IDS=new Set(['pegasus','cupid','leprechaun','ghost']);
const PARTY_MODES=new Set(['party','classic','teamvteam','teamworlds','hlsurvival','highstakes','bluff']);
export const isMakeBelieveObject=object=>!!object&&(!!object.fantasy||IMAGINARY_IDS.has(object.id));
export const isPartyRoomSettings=settings=>!!settings&&!settings.solo&&(settings.mode!=='teamworlds'||settings.variant==='hl')&&(!settings.mode||PARTY_MODES.has(settings.mode));
export const includesMakeBelieve=settings=>!isPartyRoomSettings(settings)||settings.includeMakeBelieve!==false;
export const partyObjectAllowed=(object,settings)=>includesMakeBelieve(settings)||!isMakeBelieveObject(object);
export const filterPartyObjects=(objects,settings)=>includesMakeBelieve(settings)?objects:objects.filter(o=>!isMakeBelieveObject(o));
