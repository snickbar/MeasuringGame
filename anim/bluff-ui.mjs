import {BLUFF_LABELS,bluffVoteDeadline,dealBluff,chooseBluff,revealBluff,bluffStandings,bluffStandingsBefore,bluffNewLeaders,botMakerChoice,botVoteChoice} from './bluff.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const bluffNumber=n=>Number(n).toLocaleString('en-US',{maximumFractionDigits:2});
export function bluffPickHtml(s,me){
 const mine=me===s.maker,kind=mine?s.claim.kind:s.votes?.[me],label=BLUFF_LABELS[kind]||'No vote',value=bluffNumber(s.claim.value);
 const icon=kind==='correct'?'<img src="icons/check-selected.svg" alt="">':`<svg viewBox="0 0 32 32" aria-hidden="true"><path d="${kind==='low'?'M16 5v22M6 17l10 10 10-10':kind==='high'?'M16 27V5M6 15 16 5l10 10':'M7 16h18'}" fill="none" stroke="#513621" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
 return `<div class="bl-pick-reminder"><div class="bl-pick-circle"><span class="bl-pick-icon">${icon}</span><div class="bl-pick-copy"><span class="bl-pick-label">${mine?'Your answer':'Your pick'}</span><b>${label}</b></div><strong class="bl-pick-number${value.length>8?' long':''}">${value}</strong></div></div>`;
}
// Timeline of the staged result (ms after the summary opens): the seesaw tips, the verdict pops, voters drop one by one,
// then the winning bin glows and the others shake. Reduced motion shows the finished picture straight away.
export function bluffRevealTimes(s,motion=true){
  const n=s.order.filter(id=>id!==s.maker&&Object.hasOwn(BLUFF_LABELS,s.votes?.[id])).length;
  if(!motion)return {tip:0,claimLand:0,answerFall:0,answerLand:0,verdict:0,drop0:0,step:0,judged:0,n};
  // The claim falls into its cup and tips it, then the real answer falls in and settles the scale.
  const claimFall=250,fall=520,claimLand=claimFall+fall,answerFall=claimLand+1000,answerLand=answerFall+fall,verdict=answerLand+950,drop0=verdict+650,step=380;
  return {tip:claimLand,claimFall,fall,claimLand,answerFall,answerLand,verdict,drop0,step,judged:drop0+Math.max(0,n-1)*step+700,n};
}
export function bluffScaleHtml(s,T=bluffRevealTimes(s),age=Infinity,motion=true){
  const live=motion&&Number.isFinite(age);
  // The real answer is always the blue cup on the left and the claim the red cup on the right. The claim lands first and
  // sinks its side; then the real answer lands: a bigger answer tips the scale the other way, an equal one levels it,
  // and a smaller one is too light to move it (the scale just bounces under its weight).
  const T1=9,kind=s.claim.kind,T2=kind==='low'?-T1:kind==='correct'?0:T1,kick=kind==='high'?1.6:0;
  const at=ms=>live?` style="animation-delay:${Math.round(ms-age)}ms"`:'';
  const fall=(ms)=>live?`animation-delay:${Math.round(ms-age)}ms;`:'';
  const cup=(side,cls,label,value,land)=>`<div class="bl-ss-end ${side}"><div class="bl-ss-hang ${cls}"><img class="bl-ss-rope" src="icons/bluff2-rope.webp" alt=""><div class="bl-ss-cup"${live?` style="animation-delay:${Math.round(land-age)}ms"`:''}><img class="bl-ss-cupimg" src="icons/bluff2-cup-${cls==='claim'?'red':'blue'}.webp" alt=""><span class="bl-ss-label">${label}</span><div class="bl-ss-numwrap"><strong class="bl-ss-num${value.length>8?' long':''}" style="${fall(land-T.fall)}">${value}</strong></div></div></div></div>`;
  const seesaw=`<div class="bl-seesaw${live?' live':''}" style="--t1:${T1}deg;--t2:${T2}deg;--kick:${kick}deg${live?`;--d1:${Math.round(T.claimLand-age)}ms;--d2:${Math.round(T.answerLand-age)}ms`:''}" aria-label="The claim is ${kind==='low'?'lower than':kind==='high'?'higher than':'equal to'} the real answer"><div class="bl-ss-beam"><img class="bl-ss-beamimg" src="icons/bluff2-beam.webp" alt=""${''}>${cup('l','real','The real answer',bluffNumber(s.q.answer),T.answerLand)+cup('r','claim','The claim',bluffNumber(s.claim.value),T.claimLand)}</div><div class="bl-ss-post"><img src="icons/bluff2-stand.webp" alt=""></div><div class="bl-ss-scale" aria-hidden="true">${['low','correct','high'].map(k=>`<b class="bl-v-${k}${k===s.claim.kind?' on':''}"${k===s.claim.kind?at(T.verdict):''}>${BLUFF_LABELS[k]}</b>`).join('')}</div></div>`;
  return seesaw;
}
export function bluffSummaryHtml(s,players,avatar,me,age=Infinity,motion=true){
  const voters=s.order.filter(id=>id!==s.maker);
  const T=bluffRevealTimes(s,motion&&Number.isFinite(age)),live=motion&&Number.isFinite(age),judged=!live||age>=T.judged;
  const dropIndex=new Map(voters.filter(id=>Object.hasOwn(BLUFF_LABELS,s.votes?.[id])).map((id,i)=>[id,i]));
  const name=id=>players[id]?.name||s.names?.[id]||'Player';
  const person=(id,drop=true)=>{const delay=live&&drop?` style="animation-delay:${Math.round(T.drop0+(dropIndex.get(id)||0)*T.step-age)}ms"`:'';return `<div class="bl-result-person${id===me?' is-you':''}${live&&drop?' bl-drop':''}" data-result-player="${esc(id)}" title="${esc(name(id))}"${delay}><span class="avatar">${avatar(players[id]?.avatar||s.avatars?.[id])}</span><span>${id===me?'You':esc(name(id))}</span></div>`;};
  const box=kind=>{const win=kind===s.claim.kind,ids=voters.filter(id=>s.votes?.[id]===kind);return `<section class="bl-result-choice ${win?'win':'wrong'}" data-result-choice="${kind}" aria-label="${BLUFF_LABELS[kind]}: ${win?'winning':'wrong'} choice"><h3>${BLUFF_LABELS[kind]}</h3><div class="bl-result-people">${ids.length?ids.map(id=>person(id)).join(''):'<span class="bl-empty-votes">No votes</span>'}</div></section>`;};
  const missed=voters.filter(id=>!Object.hasOwn(BLUFF_LABELS,s.votes?.[id]));
  const seesaw=bluffScaleHtml(s,T,age,motion);
  return `<div class="bl-stage${judged?' bl-judged':''}">${seesaw}<div class="bl-bins">${['low','correct','high'].map(box).join('')}</div><div class="bl-maker-result"><img class="bl-maker-laugh" src="icons/reactions/laughing.png" alt="Fooled you!" hidden><span class="avatar">${avatar(players[s.maker]?.avatar||s.avatars?.[s.maker])}</span><b class="bl-maker-name">${esc(name(s.maker))}</b><span class="bl-pill faker">Faker</span><span class="bl-pill fooled">${s.autoClaim?'Auto claim':`${s.result.wrong} fooled`}</span><strong data-maker-points>+${s.result.points[s.maker]||0}</strong></div>${missed.length?`<div class="bl-missed-votes"><p>No vote submitted · 0 points</p><div class="bl-result-people">${missed.map(id=>person(id,false)).join('')}</div></div>`:''}</div>`;
}
export function bluffRankingsHtml(s,players,avatar,me){
  const newLeaders=bluffNewLeaders(s),rows=bluffStandings(s),before=bluffStandingsBefore(s);
  const prev=new Map((before||[]).map((r,i)=>[r.id,{rank:r.rank,pos:i}]));
  return `<section class="bl-rankings" aria-label="Current rankings"><h2>Current rankings</h2><p class="bl-rank-sub">After round ${s.round}</p><div class="hs-stand bl-stand-list">${rows.map((row,i)=>{
    const was=prev.get(row.id),move=was?was.rank-row.rank:0,shift=was?was.pos-i:0;
    const mv=move>0?`<span class="hs-mv up" aria-label="Up ${move}">&#9650;${move}</span>`:move<0?`<span class="hs-mv down" aria-label="Down ${-move}">&#9660;${-move}</span>`:'<span class="hs-mv same" aria-label="Same place">&ndash;</span>';
    return `<div class="hs-srow bl-standing${row.rank===1?' leader':''}${row.id===me?' me':''}${newLeaders.includes(row.id)?' bl-new-leader':''}${shift>0?' bl-climb':shift<0?' bl-fall':''}" data-bluff-rank="${esc(row.id)}" style="--shift:${shift};animation-delay:${i*70}ms,650ms"><span class="hs-srank place-medallion" data-rank="${row.rank}">${row.rank}</span><span class="avatar">${avatar(players[row.id]?.avatar||s.avatars?.[row.id])}</span><span class="hs-sname"><b>${row.id===me?'You':esc(players[row.id]?.name||s.names?.[row.id]||'Player')}</b>${newLeaders.includes(row.id)?'<span class="bl-leader-badge">New leader</span>':''}<small>${Math.round(row.accuracy)}% vote accuracy</small></span>${mv}<span class="bl-standing-score"><strong>${row.score}</strong><small>points</small></span><span class="hs-delta${s.result.points[row.id]?' up':''}">+${s.result.points[row.id]||0}<small>this round</small></span></div>`;}).join('')}</div></section>`;
}
export function bluffFinalHtml(s,players,avatar){
  return bluffStandings(s).map(row=>`<li class="final-row bl-final-card${row.rank===1?' rank-1':''}" data-bluff-final-player="${esc(row.id)}"${row.rank===1?' data-bluff-winner':''}><div class="bl-final-row"><span class="bl-final-rank place-medallion" data-rank="${row.rank}">${row.rank}</span><span class="avatar">${avatar(players[row.id]?.avatar||s.avatars?.[row.id])}</span><div class="bl-final-identity"><b>${esc(players[row.id]?.name||s.names?.[row.id]||'Player')}</b><small>${Math.round(row.accuracy)}% vote accuracy</small></div><strong class="bl-final-score">${row.score}<small>points</small></strong></div><p class="bl-final-detail">${s.correct?.[row.id]||0}/${s.judged?.[row.id]||0} correct · ${s.fooled?.[row.id]||0} fooled</p></li>`).join('');
}
export function createBluffUI({element,context,now,transact,act,question,object,avatar,sound,visible,revealAnimation,reduced=()=>false,laugh=()=>{},vibrate=()=>{},toast=()=>{}}){
  const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('./bluff.css',import.meta.url);document.head.append(css);
  let handle=null,busy=false,selection=null,selectionKey='',signature='',cueKey='',error='';
  let animationKey='',animationNode=null,animationStop=null;
  let rankingCueKey='',displayedAward=-1,lastTick='',momentKey='',finalKey='',introKey='',introAt=0,timers=[],timersKey='';
  let celebrationKey='',celebrationAt=0,laughAt=null,laughReadyAt=null,celebrationAbandoned=false;
  const image=id=>{const o=object(id);return `<figure><img src="${esc(o?.image)}" alt="${esc(o?.name)}" draggable="false"><figcaption>${esc(o?.name)}</figcaption></figure>`;};
  function render(){
    const {room,me,host}=context(),s=room?.bluff;if(room?.phase!=='bluff'||!Array.isArray(s?.order)||!s.q)return;
    const key=room.gameId+':'+s.round+':'+s.stage+':'+(s.showStand?'rankings':'board')+':'+me;
    if(selectionKey!==key){selection=null;selectionKey=key;error='';}
    const sig=JSON.stringify([key,s,room.players,room.paused,host,visible(),selection,busy,error]);if(sig===signature)return;signature=sig;
    const mine=s.maker===me,member=s.order.includes(me),maker=room.players?.[s.maker],myVote=s.votes?.[me];
    if(introKey!==key){introKey=key;introAt=now();}
    const age=Math.max(0,now()-introAt),intro=age<1000&&!reduced(),introStyle=intro?` style="animation-delay:-${age}ms"`:'';
    const voters=s.order.length-1,votesIn=Object.keys(s.votes||{}).length,voteMeter=`<span class="bl-vote-meter" role="status" aria-label="${votesIn} of ${voters} votes in">${Array.from({length:voters},(_,i)=>`<i class="${i<votesIn?'done':''}"></i>`).join('')}<b>${votesIn} of ${voters} voted</b></span>`;
    const lockedHere=finalKey===key,finalPill=lockedHere?'<span class="bl-final-pill" role="status">This choice is final</span>':'';
    let content='';
    if(s.stage==='animation')content='<p class="bl-instruction">Revealing the sizes…</p><p class="bl-note">Votes are locked.</p>';
    if(s.stage==='make')content=mine?`<p class="bl-instruction">Your private choices. Pick a claim.</p><div class="bl-claims">${Object.keys(BLUFF_LABELS).map(kind=>{const i=s.options.findIndex(o=>o.kind===kind),o=s.options[i];return `<button type="button" class="bl-choice-${kind}${intro&&s.stage==='make'?' bl-flip':''}"${intro?introStyle:''} data-claim="${i}" data-fit-single-line="true" aria-pressed="${selection===i}"${lockedHere?' disabled':''}><strong>${bluffNumber(o.value)}</strong><span>${BLUFF_LABELS[o.kind]}</span></button>`;}).join('')}</div>${lockedHere?finalPill:`<button type="button" class="bl-action" data-send-claim ${selection===null||busy?'disabled':''}>Set as answer</button>`}<p class="bl-note">+1 per player fooled.</p>`:`<div class="bl-wait"><span class="avatar">${avatar(maker?.avatar)}</span><h3>${esc(maker?.name||s.names?.[s.maker]||'The maker')} is choosing a claim</h3><p>They know the answer. Will you trust them?</p></div>`;
    if(s.stage==='vote')content=`<div class="bl-claim${intro?' bl-slam':''}"${intro?introStyle:''}><span class="avatar bl-claim-avatar">${avatar(maker?.avatar||s.avatars?.[s.maker])}</span><span>${esc(maker?.name||s.names?.[s.maker]||'The maker')} says</span><strong>${bluffNumber(s.claim.value)}</strong></div>${s.autoClaim?'<p class="bl-note">Automatic claim: no maker points this round.</p>':''}${mine?'<p class="bl-instruction">Claim set. Who believes you?</p>':member?`<p class="bl-instruction">Judge this claim.</p><div class="bl-votes">${Object.entries(BLUFF_LABELS).map(([id,label])=>`<button type="button" class="bl-choice-${id}" data-vote="${id}" aria-pressed="${myVote===id}" ${busy||room.paused||now()>=s.endsAt||(myVote&&now()>=bluffVoteDeadline(s,me))?'disabled':''}>${label}</button>`).join('')}</div><p class="bl-locked" data-vote-status role="status"></p><div class="lock-bar" data-lock-bar hidden><i></i></div>`:'<p>You’re watching this game. Join the next game to play.</p>'}`;
    if(s.stage==='reveal'){const ck=room.gameId+':'+s.round,sAge=ck===celebrationKey?(celebrationAbandoned?Infinity:now()-celebrationAt):0;content=bluffSummaryHtml(s,room.players||{},avatar,me,sAge,!reduced()&&visible());}
    const stageChanged=cueKey!==key;
    element.classList.toggle('bl-stage-enter',stageChanged);
    const cardFor=(id,side)=>{const p=room.players?.[id],maker=id===s.maker,tag=maker?'Maker':s.stage==='vote'?(s.votes?.[id]?'Voted':'Thinking…'):s.stage==='reveal'?(s.result.points[id]?'+'+s.result.points[id]:'0 points'):p?'Ready':'Away';return `<div class="hs-pl bl-player${maker?' turn':''}" data-bluff-player="${esc(id)}" data-bluff-side="${side}"><span class="avatar">${avatar(p?.avatar||s.avatars?.[id])}</span><b class="hs-pl-name" title="${esc(p?.name||s.names?.[id])}">${esc(p?.name||s.names?.[id]||'Player')}</b><span class="hs-pl-coins">${s.scores[id]||0} pts</span><span class="hs-tag${maker?' turn':s.votes?.[id]?' ok':''}">${tag}</span></div>`;};
    const left=[],right=[];s.order.forEach((id,i)=>(i%2?right:left).push(cardFor(id,i%2?'r':'l')));
    const nextLabel=!s.showStand?'Show standings':s.round===s.total?'Finish game':'Start next round';
    const dock=s.stage==='reveal'?`<div class="bl-dock">${host?`<button type="button" class="dc-btn bl-dock-btn" data-next ${busy?'disabled':''}>${nextLabel}</button>`:`<p class="hs-hint">Waiting for the host to ${s.showStand?(s.round===s.total?'finish the game':'start the next round'):'show the standings'}…</p>`}</div>`:'';
    const standings=s.stage==='reveal'&&s.showStand?bluffRankingsHtml(s,room.players||{},avatar,me):'';
    const board=s.stage==='reveal'?s.showStand?standings:`<section class="bl-summary" aria-label="Round summary"><h2>Round summary</h2>${content}</section>`:`<div class="hs-board bl-table${s.order.length>6?' dense':''}"><div class="hs-col l">${left.join('')}</div><section class="hs-mid bl-panel${intro&&s.stage==='vote'?' bl-thud':''}"${intro&&s.stage==='vote'?introStyle:''} aria-label="${s.stage==='make'?'Maker choice':'Judge the claim'}">${content}<p class="bl-error" role="status">${esc(error)}</p></section><div class="hs-col r">${right.join('')}</div></div>`;
    element.innerHTML=`<h1 class="bl-screen-reader">Bluff the Room</h1><div class="hs-top bl-meta"${s.stage==='reveal'?' hidden':''}>${s.stage==='make'?`<span class="bl-turn-notice" data-maker-spotlight>${mine?'Your turn!':'Maker’s turn'}</span>`:s.stage==='vote'?voteMeter:'<span></span>'}<span class="hs-clock bl-clock" data-clock></span></div>${s.stage==='reveal'&&s.showStand?'':`<div class="hs-q bl-question">${s.stage==='reveal'?'':`<div class="bl-objects">${image(s.q.unitId)}${image(s.q.targetId)}</div>`}<h2 class="hs-qtext">${esc(s.q.prompt)}</h2></div>`}${board}<p class="bl-error" role="status">${esc(error)}</p>${dock}${s.stage==='animation'?`<div class="bl-reveal-overlay" role="region" aria-label="Size reveal"><div class="bl-reveal-sheet"><h2>Let’s see the real size</h2><div id="bluff-animation-slot"></div>${bluffPickHtml(s,me)}</div></div>`:''}`;
    {const tb=element.ownerDocument.getElementById('bottom-toolbar'),h=tb&&tb.classList.contains('active')?tb.getBoundingClientRect().height:0;element.style.setProperty('--bl-tb',Math.round(h)+'px');element.classList.toggle('bl-has-dock',!!dock);}
    {const list=element.querySelector('.bl-stand-list'),rows=list?list.children:[];if(rows.length>1)list.style.setProperty('--step',(rows[1].offsetTop-rows[0].offsetTop)+'px');}
    const select=value=>{
      selection=value;signature='';render();
      const action=element.querySelector('[data-send-claim],[data-send-vote]'),view=element.ownerDocument.defaultView;
      const bottom=element.ownerDocument.getElementById('bottom-toolbar')?.getBoundingClientRect().top||view.innerHeight;
      if(action&&action.getBoundingClientRect().bottom>bottom-12)view.scrollBy({top:action.getBoundingClientRect().bottom-bottom+12,behavior:'instant'});
    };
    element.querySelectorAll('[data-claim]').forEach(b=>b.onclick=()=>select(Number(b.dataset.claim)));
    element.querySelectorAll('[data-vote]').forEach(b=>b.onclick=()=>send('vote',b.dataset.vote));
    element.querySelector('[data-send-claim]')?.addEventListener('click',()=>send('claim',selection));
    element.querySelector('[data-next]')?.addEventListener('click',()=>advance(true));
    if(s.stage==='animation'&&visible()){
      const animKey=room.gameId+':'+s.round+':'+s.startedAt;
      if(animationKey!==animKey){animationStop?.();animationKey=animKey;animationNode=element.ownerDocument.createElement('div');animationNode.id='bluff-animation';animationStop=revealAnimation?.mount(animationNode,s.q,s);}
      element.querySelector('#bluff-animation-slot')?.append(animationNode);
    }else if(animationKey){animationStop?.();animationKey='';animationNode=null;animationStop=null;}
    if(stageChanged){cueKey=key;if(visible()){if(s.stage==='make'&&mine)vibrate([30,50,30]);if(s.stage==='vote'&&member&&!mine)setTimeout(()=>vibrate(40),230);element.ownerDocument.defaultView.scrollTo({top:0,behavior:'instant'});sound(s.stage==='make'?'join':s.stage==='reveal'&&!s.showStand?'reveal':s.stage==='vote'?'go':'popup-open');}}
    clock();
  }
  async function work(fn,quiet=false){
    if(busy)return;busy=true;error='';render();
    try{const result=await fn();if(result?.committed===false&&!quiet){selection=null;if(!finalKey)error='';}}
    catch{error='Couldn’t save. Check your connection and try again.';}
    finally{busy=false;signature='';render();}
  }
  function send(action,value){return work(async()=>{const {room,me}=context();const result=await act({gameId:room.gameId,round:room.bluff.round,stage:room.bluff.stage,actor:me,action,value});
    if(action==='claim')finalKey=room.gameId+':'+room.bluff.round+':'+room.bluff.stage+':'+(room.bluff.showStand?'rankings':'board')+':'+me;if(result?.committed&&visible()){sound('tap');vibrate(action==='claim'?[30,40,30]:22);}return result;});}
  function clock(){
    const {room,me}=context(),s=room?.bluff;if(!s)return;
    for(const next of element.querySelectorAll('[data-next]'))next.disabled=busy||room.paused;
    const time=room.paused?(room.pausedAt||now()):now(),voted=s.votes?.[me],left=Math.max(0,Math.ceil((bluffVoteDeadline(s,me)-time)/1000));
    for(const b of element.querySelectorAll('[data-vote]'))b.disabled=busy||room.paused||time>=s.endsAt||!!(voted&&!left);
    const status=element.querySelector('[data-vote-status]');if(status)status.textContent=voted?(left?`Change your vote · ${left}s`:`Vote final: ${BLUFF_LABELS[voted]}`):'Tap to vote. You get 10s to change it.';
    const bar=element.querySelector('[data-lock-bar]');
    if(bar){const win=voted&&left>0;bar.hidden=!win;if(win){const f=Math.max(0,Math.min(1,(bluffVoteDeadline(s,me)-time)/10000));bar.firstElementChild.style.transform='scaleX('+f+')';bar.classList.toggle('low',left<=3);}}
    {const mine=s.maker===me,member=s.order.includes(me),secs=Math.ceil((s.endsAt-time)/1000);
      const n=s.stage==='make'&&mine?secs:s.stage==='vote'&&member&&!mine?(voted?(left>0?left:0):secs):0;
      if(!room.paused&&n>=1&&n<=5&&visible()){const k=room.gameId+':'+s.round+':'+s.stage+':'+n;if(k!==lastTick){lastTick=k;sound('tick');}}}
    const timer=element.querySelector('[data-clock]');if(timer){timer.textContent=room.paused?'Paused':s.stage==='reveal'?'Results':Math.max(0,Math.ceil((s.endsAt-time)/1000))+'s';timer.classList.toggle('wide',room.paused||s.stage==='reveal');timer.classList.toggle('low',!room.paused&&!['reveal','animation'].includes(s.stage)&&s.endsAt-time<6000);}
    const spotlight=element.querySelector('[data-maker-spotlight]'),spotOn=s.stage==='make'&&!room.paused&&visible()&&now()-s.startedAt<2300;
    if(spotlight)spotlight.hidden=!spotOn;
    element.querySelector('.bl-player.turn')?.classList.toggle('bl-maker-spotlight',spotOn&&!reduced());
    celebrateRound();
  }
  // The viewer's own result: a centered toast and a buzz sized to how it went (fires once per round, on the summary).
  function personalMoment(s,room){
    const {me}=context(),key=room.gameId+':'+s.round+':'+me;if(key===momentKey||!s.order.includes(me))return;momentKey=key;
    const pts=s.result?.points?.[me]||0;
    if(me===s.maker){
      const fooled=s.result?.wrong||0;
      if(s.autoClaim){return;}
      if(fooled>0){toast('FOOLED '+fooled+'! +'+pts);vibrate([35,60,45,60,70]);}
      else{toast('NO TAKERS');vibrate(18);}
    }else if(s.votes?.[me]===s.claim.kind){toast('NAILED IT +2');vibrate([40,50,40,50,70]);}
    else if(s.votes?.[me]){toast('FOOLED!');vibrate([60,40,60]);}
  }
  // Tick sounds and haptics for each dropped avatar, scheduled once per round from the summary's start.
  function cancelRevealTimers(){timers.forEach(clearTimeout);timers=[];}
  function scheduleReveal(s,key){
    cancelRevealTimers();timersKey=key;
    if(reduced()||!visible())return;
    const later=(fn,ms)=>timers.push(setTimeout(()=>{
      const {room,leaving}=context(),current=room?.bluff;
      if(leaving||!visible()||reduced()||room?.paused||room?.phase!=='bluff'||current?.stage!=='reveal'||current.showStand||room.gameId+':'+current.round!==key)return;
      fn();
    },ms));
    const T=bluffRevealTimes(s,true),{me}=context(),voters=s.order.filter(id=>id!==s.maker&&Object.hasOwn(BLUFF_LABELS,s.votes?.[id]));
    later(()=>sound('bluff-thud'),T.claimLand);later(()=>sound('bluff-thud-2'),T.answerLand);
    later(()=>sound('popup-open'),T.verdict);
    voters.forEach((id,i)=>later(()=>{sound('tick');if(id===me)vibrate(18);},T.drop0+i*T.step+330));
    if(voters.some(id=>s.votes[id]!==s.claim.kind))later(()=>sound('tap'),T.judged);
  }
  function celebrateRound(){
    const {room}=context(),s=room?.bluff;
    if(s?.stage==='reveal'&&s.showStand&&visible()&&!room.paused){const key=room.gameId+':'+s.round;if(key!==rankingCueKey){rankingCueKey=key;if(bluffNewLeaders(s).length)sound('winner');}}
    if(!s||s.stage!=='reveal'||s.showStand||room.paused||!visible()){
      cancelRevealTimers();
      if(celebrationKey)celebrationAbandoned=true;
      return;
    }
    const key=room.gameId+':'+s.round;
    if(key!==celebrationKey){celebrationKey=key;celebrationAt=now();laughAt=null;laughReadyAt=null;displayedAward=-1;celebrationAbandoned=false;}
    if(celebrationAbandoned)return;
    if(!timersKey||timersKey!==key)scheduleReveal(s,key);
    const T=bluffRevealTimes(s,!reduced()),raw=now()-celebrationAt,elapsed=raw-T.judged,hasWinners=element.querySelector('.win [data-result-player]');
    if(raw>=T.judged){
      element.querySelector('.bl-stage')?.classList.add('bl-judged');
      if(raw>=T.judged+250)personalMoment(s,room);
    }
    if(!reduced()&&elapsed>=0&&elapsed<1900){
      for(const av of element.querySelectorAll('.win .avatar'))if(!av.classList.contains('bl-win-dance')){
        av.classList.add('bl-win-dance');av.style.animationDelay=-Math.max(0,elapsed)+'ms';
      }
    }
    if(laughAt===null&&s.result.points[s.maker]>0&&elapsed>=(hasWinners&&!reduced()?2000:0)){
      if(laughReadyAt===null){
        const maker=element.querySelector('.bl-maker-result'),rect=maker?.getBoundingClientRect(),bottom=element.ownerDocument.getElementById('bottom-toolbar')?.getBoundingClientRect().top||innerHeight;
        const scroll=rect?.height>0&&rect.bottom>bottom-8;
        if(scroll)element.ownerDocument.defaultView.scrollBy({top:rect.bottom-bottom+20,behavior:reduced()?'instant':'smooth'});
        laughReadyAt=now()+(scroll&&!reduced()?450:0);
      }
      if(now()>=laughReadyAt){laughAt=now();laugh();}
    }
    const total=s.result.points[s.maker]||0,award=reduced()?total:laughAt===null?0:Math.min(total,1+Math.floor((now()-laughAt)/400));
    const points=element.querySelector('[data-maker-points]');
    if(points){points.textContent='+'+award;if(award!==displayedAward){if(award>0&&!reduced()){points.classList.remove('bl-point-pop');void points.offsetWidth;points.classList.add('bl-point-pop');sound('count');}displayedAward=award;}}
    const reaction=element.querySelector('.bl-maker-laugh');
    if(reaction){reaction.hidden=laughAt===null||now()-laughAt>1800;if(!reaction.hidden&&!reduced()&&!reaction.classList.contains('playing')){reaction.classList.add('playing');reaction.style.animationDelay=-(now()-laughAt)+'ms';}}
  }
  async function advance(manual=false){
    const {room,me,host,leaving}=context(),s=room?.bluff;if(room?.phase!=='bluff'||!host||leaving||room.paused||busy||!Array.isArray(s?.order)||!s.q)return;
    const time=now();let next;
    if(s.stage==='make'){
      if(!room.players?.[s.maker]||time>=s.endsAt)next=chooseBluff(s,s.maker,s.fallback,time,true);
      else if(room.players?.[s.maker]?.isBot&&time>=s.startedAt+1800+(s.round*739%3000))next=chooseBluff(s,s.maker,botMakerChoice(s,room.players[s.maker].botDifficulty||'medium'),time);
    }else if(s.stage==='vote'){
      for(const id of s.order.filter(id=>time<s.endsAt&&id!==s.maker&&room.players?.[id]?.isBot&&s.votes?.[id]===undefined)){
        if(time<s.startedAt+1800+(s.order.indexOf(id)*1297+s.round*619)%5500)continue;
        const value=botVoteChoice(s,room.players[id].botDifficulty||'medium');
        await work(()=>act({gameId:room.gameId,round:s.round,stage:'vote',actor:id,action:'vote',value}),true);return;
      }
      const waiting=s.order.some(id=>id!==s.maker&&room.players?.[id]&&(s.votes?.[id]===undefined||time<bluffVoteDeadline(s,id)));
      if(time>=s.endsAt||(!waiting&&time>=s.startedAt+1500)){
        await work(async()=>{const duration=await revealAnimation?.duration(s.q)||0;const at=now();const next=duration>0?{...s,stage:'animation',startedAt:at+200,endsAt:at+duration+1000}:revealBluff(s,at);return transact(room,next,me);},true);return;
      }
    }else if(s.stage==='animation'&&(manual||time>=s.endsAt))next=revealBluff(s,time);
    else if(s.stage==='reveal'&&(manual||time>=s.endsAt))next=!s.showStand?{...s,showStand:true,startedAt:time,endsAt:time+60000}:s.round===s.total?{...s,stage:'over'}:dealBluff(s,question(),time);
    if(next)await work(()=>transact(room,next,me),true);
  }
  function refresh(){const {room,leaving}=context();if(room?.phase==='bluff'&&!leaving){render();if(!handle)handle=setInterval(()=>{const c=context();if(c.leaving||c.room?.phase!=='bluff'){refresh();return;}clock();void advance();},300);void advance();}else{cancelRevealTimers();if(handle)clearInterval(handle);handle=null;signature='';animationStop?.();animationKey='';animationStop=null;animationNode=null;}}
  new MutationObserver(()=>refresh()).observe(element.parentElement,{attributes:true,attributeFilter:['class']});
  element.ownerDocument.addEventListener('visibilitychange',refresh);
  return {refresh,advance};
}
