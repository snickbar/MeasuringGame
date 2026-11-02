// Free backgrounds share the mode palette; explicit Style choices always win.
export const MODE_IDENTITIES = {
 quick:{label:'Quick Game',accent:'#88b74e',wash:'#e6efd2',ink:'#476e29',art:'avatars/av16.png'},
 classic:{label:'Party',accent:'#eda64e',wash:'#fff0d3',ink:'#9e611c',art:'icons/home-host.png'},
 worlds:{label:'Worlds',accent:'#62b6d5',wash:'#dff1f7',ink:'#277896',art:'items/hot-air-balloon.webp'},
 survival:{label:'Survival',accent:'#bb514b',wash:'#f7dfd4',ink:'#9c3935',art:'items/t-rex.webp'},
 highstakes:{label:'High Stakes',accent:'#8f6eb9',wash:'#eee2f2',ink:'#69478e',art:'items/poker-chip.webp'},
 bluff:{label:'Bluff the Room',accent:'#aa7fc0',wash:'#eee2f2',ink:'#69478e',art:'icons/reactions/giggle.png'},
 daily:{label:'Daily Challenge',accent:'#eda64e',wash:'#fff0d3',ink:'#9e611c',art:'icons/toolbar-daily.png'},
 monthly:{label:'Monthly Challenge',accent:'#b285c8',wash:'#f0e3f7',ink:'#805298',art:'items/pumpkin.webp'}
};
export const MODE_BACKGROUNDS=Object.entries(MODE_IDENTITIES).map(([mode,m])=>({id:'mode-'+mode,label:m.label+' gradient'}));
// Each mode's own colour, boldest at the top and holding most of the way down before fading to cream.
const mixHex=(a,b,t)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*t+parseInt(b.slice(i,i+2),16)*(1-t)).toString(16).padStart(2,'0')).join('');
// Background tints that differ from the mode's accent, so Bluff and Monthly don't look like High Stakes' purple.
const BG_TINT={daily:{accent:'#e3c235',wash:'#fcf3c4'},bluff:{accent:'#d65fa0',wash:'#fbe0ee'},monthly:{accent:'#3fae9c',wash:'#d9f1ec'}};
export const modeGradient=id=>{const k=id.replace(/^mode-/,''),m=MODE_IDENTITIES[k]&&{...MODE_IDENTITIES[k],...BG_TINT[k]};return m?`linear-gradient(${mixHex(m.accent,m.wash,.8)}, ${mixHex(m.accent,m.wash,.4)} 40%, ${m.wash} 75%, #fff7e5)`:null;};
export function screenMode(id,setup,settings={}){
 const fixed={'bluff-screen':'bluff','worlds-screen':'worlds','teamworlds-screen':'worlds','daily-screen':'daily','monthly-screen':'monthly','survival-screen':'survival','hs-screen':'highstakes','teamvteam-screen':'quick'};
 if(fixed[id])return fixed[id];
 if(!['create-screen','name-avatar-screen','lobby-screen','hud','final-screen','left-screen','ended-screen'].includes(id))return null;
 const mode=['create-screen','name-avatar-screen'].includes(id)?setup:(settings.mode||(settings.solo?'solo':'classic'));
 return ({solo:'quick',teamvteam:'quick',teamworlds:'worlds',hlsurvival:'survival'})[mode]|| (MODE_IDENTITIES[mode]?mode:'classic');
}
export function backgroundPresentation(selected,mode,seasonal=null){
 if(selected&&selected!=='none')return {id:selected,image:modeGradient(selected)};
 if(MODE_IDENTITIES[mode])return {id:'mode-'+mode,image:modeGradient(mode)};
 return seasonal?{id:seasonal,image:null}:{id:'none',image:null};
}
