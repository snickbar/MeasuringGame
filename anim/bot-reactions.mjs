import {chooseScenario,pickFromScenario,leadersOf,POOLS,CHATTER_CHANCE} from './bot-reaction-scenarios.mjs';
// Independent cosmetic clocks: guessing does not determine when bots react. What they send fits the moment (see bot-reaction-scenarios.mjs).
export function createBotReactions({getState,send,reactions,resolve:resolveId,random=Math.random,now=Date.now}) {
  const resolve=resolveId||(id=>reactions.includes(id)?id:null);
  const bots=new Map();let roundKey=null,nextGroupAt=0,suspended=false,phaseTag=null,phaseSeenAt=0,roundStartLeaders=null;
  const between=(lo,hi)=>lo+random()*(hi-lo);
  function reset(){bots.clear();roundKey=null;nextGroupAt=0;suspended=false;phaseTag=null;roundStartLeaders=null;}
  function tick(){
    const state=getState(),room=state?.room,t=now();
    const allowed=room&&((['question','answers','reveal','summary'].includes(room.phase)||(room.phase==='bluff'&&room.bluff?.stage!=='animation'))||(room.phase==='hs'&&!['over','anim','animation','countdown','dealing'].includes(room.hs?.stage)));
    if(!state?.host||!state.roomCode||!room?.players?.[state.playerId]?.isHost||!allowed){
      // Keep this round's activity budget while the reveal animation is running.
      if(!state?.host||!room||['waiting','ended','final'].includes(room.phase))reset();
      suspended=true;return;
    }
    const key=JSON.stringify([state.roomCode,room.gameId,room.phase==='hs'?room.hs?.round:room.round]);
    if(key!==roundKey){reset();roundKey=key;nextGroupAt=t+between(1200,3500);}
    const tag=room.phase==='hs'?'hs:'+room.hs?.stage:room.phase==='bluff'?'bluff:'+room.bluff?.stage:room.phase;
    if(tag!==phaseTag){
      phaseTag=tag;phaseSeenAt=t;
      if(room.phase==='question'||!roundStartLeaders)roundStartLeaders=leadersOf(room.players);
      // Results are on screen for only a few seconds: bots respond to them soon, not at some random later moment.
      if(room.phase==='reveal'||room.phase==='summary'||tag==='bluff:reveal'||tag==='hs:reveal'){
        nextGroupAt=Math.min(nextGroupAt,t+between(900,2400));
        for(const b of bots.values()){b.at=Math.min(b.at,t+between(1200,5200));if(b.count>=b.limit&&b.reactedToResult!==tag){b.limit=b.count+1;}b.reactedToResult=tag;}
      }
    }
    if(room.paused||state.blocked){suspended=true;return;}
    if(suspended){for(const b of bots.values())b.at=t+between(2000,11000);nextGroupAt=t+between(1500,4000);suspended=false;}
    const players=Object.entries(room.players).filter(([,p])=>p?.isBot);
    const present=new Set(players.map(([id])=>id));for(const id of bots.keys())if(!present.has(id))bots.delete(id);
    for(const [id]of players)if(!bots.has(id))bots.set(id,{at:t+between(1800,13000),count:0,limit:2+Math.floor(random()*3),last:null});
    if(t<nextGroupAt||!reactions.length)return;
    const due=players.filter(([id])=>{const b=bots.get(id);return b.count<b.limit&&t>=b.at;});
    if(!due.length)return;
    const [id,player]=due[Math.floor(random()*due.length)],b=bots.get(id);
    b.at=t+between(7000,22000);
    if(random()<.12)return; // Sometimes a bot simply stays quiet.
    const pool=random()<CHATTER_CHANCE?POOLS.chatter:chooseScenario({room,botId:id,now:t,seenAt:phaseSeenAt,roundStartLeaders},random);
    let emoji=pickFromScenario(pool,random,b.last,resolve);
    if(!emoji||emoji===b.last){const choices=reactions.filter(r=>r!==b.last);emoji=(choices.length?choices:reactions)[Math.floor(random()*(choices.length||reactions.length))];}
    b.count++;b.last=emoji;nextGroupAt=t+between(1800,4600);
    send({id,player,emoji});
  }
  return {tick,reset};
}
