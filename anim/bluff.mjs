export const BLUFF_LABELS={high:'Too High',correct:'Correct',low:'Too Low'};
export const bluffVoteDeadline=(s,id)=>Math.min(s.endsAt,(s.voteAt?.[id]??s.startedAt)+10000);
const validVote=choice=>typeof choice==='string'&&Object.hasOwn(BLUFF_LABELS,choice);
export const bluffTurns=(value,count)=>value===1||value===2?value:count<=3?2:1;
const shuffle=(values,rng)=>{const a=[...values];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
export function bluffOptions(answer,rng=Math.random){
  if(!(answer>0)||!Number.isFinite(answer))throw Error('Invalid bluff answer');
  const correct=Math.max(.01,Math.round(answer*100)/100);
  const low=Math.max(0,Math.min(correct-.01,Math.round(correct*(.55+rng()*.3)*100)/100));
  const high=Math.max(correct+.01,Math.round(correct*(1.2+rng()*.6)*100)/100);
  return shuffle([{kind:'low',value:Number(low.toFixed(2))},{kind:'correct',value:correct},{kind:'high',value:Number(high.toFixed(2))}],rng);
}
export function newBluff(ids,turns,rng=Math.random){
  if(new Set(ids).size!==ids.length||ids.length<3||ids.length>10)throw Error('Bluff needs 3–10 players');
  const order=shuffle(ids,rng),cycles=bluffTurns(turns,ids.length);
  return {order,cycles,total:ids.length*cycles,round:0,stage:'ready',scores:Object.fromEntries(ids.map(id=>[id,0])),judged:{},correct:{},fooled:{},makerTurns:{}};
}
export function dealBluff(previous,q,now,rng=Math.random){
  if(!previous||!['ready','reveal'].includes(previous.stage)||previous.round>=previous.total)return null;
  const round=previous.round+1,options=bluffOptions(q.answer,rng);
  return {...previous,round,stage:'make',maker:previous.order[(round-1)%previous.order.length],q,
    options,claim:null,votes:{},result:null,showStand:false,autoClaim:false,startedAt:now,endsAt:now+25000,
    fallback:Math.floor(rng()*3)};
}
export function chooseBluff(s,id,index,now,automatic=false){
  if(!s||s.stage!=='make'||(!automatic&&id!==s.maker)||!Number.isInteger(index)||!s.options[index]||(!automatic&&now>=s.endsAt))return null;
  return {...s,stage:'vote',claim:s.options[index],autoClaim:automatic,votes:{},voteAt:{},startedAt:now,endsAt:now+30000};
}
export function voteBluff(s,id,choice,now){
  if(!s||s.stage!=='vote'||!s.order.includes(id)||id===s.maker||!validVote(choice)||now>=s.endsAt||
    (s.votes?.[id]!==undefined&&(now>=bluffVoteDeadline(s,id)||s.votes[id]===choice)))return null;
  return {...s,votes:{...s.votes,[id]:choice},voteAt:{...s.voteAt,[id]:s.voteAt?.[id]??now}};
}
export function revealBluff(s,now){
  if(!s||!['vote','animation'].includes(s.stage)||!s.claim)return null;
  const points=Object.fromEntries(s.order.map(id=>[id,0])),correct={...s.correct},judged={...s.judged},fooled={...s.fooled};
  let caught=0,wrong=0;
  for(const id of s.order.filter(id=>id!==s.maker)){
    judged[id]=(judged[id]||0)+1;
    if(s.votes?.[id]===s.claim.kind){points[id]=2;correct[id]=(correct[id]||0)+1;caught++;}
    else if(validVote(s.votes?.[id]))wrong++;
  }
  points[s.maker]=s.autoClaim?0:wrong;
  fooled[s.maker]=(fooled[s.maker]||0)+points[s.maker];
  return {...s,stage:'reveal',showStand:false,startedAt:now,endsAt:now+60000,correct,judged,fooled,
    makerTurns:{...s.makerTurns,[s.maker]:(s.makerTurns?.[s.maker]||0)+1},
    scores:Object.fromEntries(s.order.map(id=>[id,(s.scores[id]||0)+points[id]])),
    result:{points,caught,wrong,submitted:Object.keys(s.votes||{}).length}};
}
export function bluffStandings(s){
  const rows=s.order.map(id=>({id,score:s.scores?.[id]||0,accuracy:s.judged?.[id]?100*(s.correct?.[id]||0)/s.judged[id]:0}));
  rows.sort((a,b)=>b.score-a.score||b.accuracy-a.accuracy);
  let rank=0;return rows.map((row,i)=>{if(!i||row.score!==rows[i-1].score||Math.abs(row.accuracy-rows[i-1].accuracy)>1e-8)rank=i+1;return {...row,rank};});
}
export function bluffNewLeaders(s){
  if(!s?.result)return [];
  const leaders=bluffStandings(s).filter(r=>r.rank===1);
  if(s.round===1)return leaders.filter(r=>r.score>0).map(r=>r.id);
  const before={...s,scores:{},correct:{...s.correct},judged:{...s.judged}};
  for(const id of s.order){
    before.scores[id]=(s.scores?.[id]||0)-(s.result.points[id]||0);
    if(id!==s.maker){before.judged[id]=Math.max(0,(s.judged?.[id]||0)-1);if(s.votes?.[id]===s.claim.kind)before.correct[id]=Math.max(0,(s.correct?.[id]||0)-1);}
  }
  const previous=bluffStandings(before).filter(r=>r.rank===1).map(r=>r.id);
  return leaders.filter(r=>!previous.includes(r.id)||leaders.length<previous.length).map(r=>r.id);
}

// Transaction-level checks reject duplicate taps, stale rounds, late votes and former hosts.
export function bluffAction(room,{gameId,round,stage,actor,action,value},now){
  const s=room?.bluff;
  if(!room||room.phase!=='bluff'||room.paused||room.gameId!==gameId||!room.players?.[actor]||s?.round!==round||s.stage!==stage)return;
  let next;
  if(action==='claim')next=chooseBluff(s,actor,value,now);
  else if(action==='vote')next=voteBluff(s,actor,value,now);
  if(!next)return;
  return {...room,bluff:next};
}
export function commitBluff(room,expected,next,host){
  if(room===null)return null;
  if(!room||room.phase!=='bluff'||room.paused||room.gameId!==expected.gameId||!room.players?.[host]?.isHost||room.players[host].connected===false||JSON.stringify(firebaseShape(room.bluff))!==JSON.stringify(firebaseShape(expected.bluff)))return;
  const out={...room,bluff:next,round:next.round};
  if(next.stage==='reveal'&&room.bluff.stage!=='reveal'){
    out.bluffRounds={...room.bluffRounds,['r'+next.round]:next};
    out.players=Object.fromEntries(Object.entries(room.players).map(([id,p])=>[id,next.order.includes(id)?{...p,score:next.scores?.[id]||0,accuracySum:(next.correct?.[id]||0)*100,roundsCounted:next.judged?.[id]||0}:p]));
  }
  if(next.stage==='over')out.phase='final';
  return out;
}
// RTDB drops null/empty children and does not preserve object-key insertion order.
// Compare the stored meaning while still rejecting any concurrent vote or stage change.
function firebaseShape(value){
  if(value===null||value===undefined)return null;
  if(typeof value!=='object')return value;
  if(Array.isArray(value))return value.map(firebaseShape);
  const entries=Object.keys(value).sort().map(k=>[k,firebaseShape(value[k])]).filter(([,v])=>v!==null);
  return entries.length?Object.fromEntries(entries):null;
}
export function bluffRoundRecord(match,s,id,players,t){
  if(!s?.result||!s.order.includes(id))return null;
  const maker=s.maker===id,vote=s.votes?.[id];
  return {kind:'bluffRound',mode:'bluff',key:match+'_bluff_'+s.round,playerId:id,players,
    maker,submitted:!maker&&validVote(vote),correct:!maker&&vote===s.claim.kind,fooled:maker?s.result.points[id]:0,
    history:{t,u:s.q.unitId,g:s.q.targetId,r:null,answered:false,role:maker?'maker':'voter',vote:vote||null,mode:'bluff',s:10,p:s.result.points[id]||0,match,round:s.round}};
}
