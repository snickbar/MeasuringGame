// Independent cosmetic clocks: guessing does not determine when bots react.
export function createBotReactions({getState,send,reactions,random=Math.random,now=Date.now}) {
  const bots=new Map();let roundKey=null,nextGroupAt=0,suspended=false;
  const between=(lo,hi)=>lo+random()*(hi-lo);
  function reset(){bots.clear();roundKey=null;nextGroupAt=0;suspended=false;}
  function tick(){
    const state=getState(),room=state?.room,t=now();
    const allowed=room&&(['question','answers','reveal','summary'].includes(room.phase)||(room.phase==='hs'&&!['over','anim','animation','countdown','dealing'].includes(room.hs?.stage)));
    if(!state?.host||!state.roomCode||!room?.players?.[state.playerId]?.isHost||!allowed){
      // Keep this round's activity budget while the reveal animation is running.
      if(!state?.host||!room||['waiting','ended','final'].includes(room.phase))reset();
      suspended=true;return;
    }
    const key=JSON.stringify([state.roomCode,room.gameId,room.phase==='hs'?room.hs?.round:room.round]);
    if(key!==roundKey){reset();roundKey=key;nextGroupAt=t+between(1200,3500);}
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
    const choices=reactions.filter(r=>r!==b.last),emoji=(choices.length?choices:reactions)[Math.floor(random()*(choices.length||reactions.length))];
    b.count++;b.last=emoji;nextGroupAt=t+between(1800,4600);
    send({id,player,emoji});
  }
  return {tick,reset};
}
