import {BLUFF_LABELS,bluffVoteDeadline,dealBluff,chooseBluff,revealBluff,bluffStandings} from './bluff.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const bluffNumber=n=>Number(n).toLocaleString('en-US',{maximumFractionDigits:2});
export function bluffSummaryHtml(s,players,avatar,me){
  const voters=s.order.filter(id=>id!==s.maker);
  const name=id=>players[id]?.name||s.names?.[id]||'Player';
  const person=id=>`<div class="bl-result-person${id===me?' is-you':''}" data-result-player="${esc(id)}" title="${esc(name(id))}"><span class="avatar">${avatar(players[id]?.avatar||s.avatars?.[id])}</span><span>${id===me?'You':esc(name(id))}</span></div>`;
  const box=(kind,win)=>{const ids=voters.filter(id=>s.votes?.[id]===kind);return `<section class="bl-result-choice ${win?'win':'wrong'}" data-result-choice="${kind}" aria-label="${BLUFF_LABELS[kind]}: ${win?'winning':'wrong'} choice"><h3>${BLUFF_LABELS[kind]}</h3><p class="bl-choice-points">${win?'Winning choice · +2 each':'No points'}</p><div class="bl-result-people">${ids.length?ids.map(person).join(''):'<span class="bl-empty-votes">No votes</span>'}</div></section>`;};
  const missed=voters.filter(id=>!Object.hasOwn(BLUFF_LABELS,s.votes?.[id]));
  return `<div class="bl-answer-strip"><div><span>Real answer</span><strong>${bluffNumber(s.q.answer)}</strong></div><div><span>The claim</span><strong>${bluffNumber(s.claim.value)}</strong></div></div>${box(s.claim.kind,true)}<div class="bl-wrong-choices">${['low','correct','high'].filter(kind=>kind!==s.claim.kind).map(kind=>box(kind,false)).join('')}</div><div class="bl-maker-result"><span class="avatar">${avatar(players[s.maker]?.avatar||s.avatars?.[s.maker])}</span><span><b>${esc(name(s.maker))}</b><small>${s.autoClaim?'Automatic claim · no maker points':`Maker · ${s.result.wrong} fooled`}</small></span><strong>+${s.result.points[s.maker]||0}</strong></div>${missed.length?`<div class="bl-missed-votes"><p>No vote submitted · 0 points</p><div class="bl-result-people">${missed.map(person).join('')}</div></div>`:''}`;
}
export function bluffRankingsHtml(s,players,avatar,me){
  return `<section class="bl-rankings" aria-label="Current rankings"><h2>Current rankings</h2><p class="bl-rank-sub">After round ${s.round}</p><div class="hs-stand">${bluffStandings(s).map((row,i)=>`<div class="hs-srow bl-standing${row.rank===1?' leader':''}${row.id===me?' me':''}" data-bluff-rank="${esc(row.id)}" style="animation-delay:${i*70}ms"><span class="hs-srank">${row.rank}</span><span class="avatar">${avatar(players[row.id]?.avatar||s.avatars?.[row.id])}</span><span class="hs-sname"><b>${row.id===me?'You':esc(players[row.id]?.name||s.names?.[row.id]||'Player')}</b><small>${Math.round(row.accuracy)}% vote accuracy</small></span><span class="bl-standing-score"><strong>${row.score}</strong><small>points</small></span><span class="hs-delta${s.result.points[row.id]?' up':''}">+${s.result.points[row.id]||0}<small>this round</small></span></div>`).join('')}</div></section>`;
}
export function bluffFinalHtml(s,players,avatar){
  return bluffStandings(s).map(row=>`<li class="final-row${row.rank===1?' rank-1':''}"><div class="final-row-top"><span class="medal rank-num">${row.rank}</span><span class="avatar">${avatar(players[row.id]?.avatar)}</span><span class="name">${esc(players[row.id]?.name||s.names?.[row.id]||'Player')}</span><span class="pts">${row.score}</span></div><p class="bl-final-detail">${Math.round(row.accuracy)}% vote accuracy · ${s.correct?.[row.id]||0}/${s.judged?.[row.id]||0} correct · ${s.fooled?.[row.id]||0} fooled</p></li>`).join('');
}
export function createBluffUI({element,context,now,transact,act,question,object,avatar,sound,visible,revealAnimation}){
  const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('./bluff.css',import.meta.url);document.head.append(css);
  let handle=null,busy=false,selection=null,selectionKey='',signature='',cueKey='',error='';
  let animationKey='',animationNode=null,animationStop=null;
  const image=id=>{const o=object(id);return `<figure><img src="${esc(o?.image)}" alt="${esc(o?.name)}" draggable="false"><figcaption>${esc(o?.name)}</figcaption></figure>`;};
  function render(){
    const {room,me,host}=context(),s=room?.bluff;if(room?.phase!=='bluff'||!Array.isArray(s?.order)||!s.q)return;
    const key=room.gameId+':'+s.round+':'+s.stage+':'+(s.showStand?'rankings':'board')+':'+me;
    if(selectionKey!==key){selection=null;selectionKey=key;error='';}
    const sig=JSON.stringify([key,s,room.players,room.paused,host,visible(),selection,busy,error]);if(sig===signature)return;signature=sig;
    const mine=s.maker===me,member=s.order.includes(me),maker=room.players?.[s.maker],myVote=s.votes?.[me];
    let content='';
    if(s.stage==='animation')content='<p class="bl-instruction">Revealing the sizes…</p><p class="bl-note">Votes are locked.</p>';
    if(s.stage==='make')content=mine?`<p class="bl-instruction">Your private choices. Pick a claim.</p><div class="bl-claims">${Object.keys(BLUFF_LABELS).map(kind=>{const i=s.options.findIndex(o=>o.kind===kind),o=s.options[i];return `<button type="button" class="bl-choice-${kind}" data-claim="${i}" data-fit-single-line="true" aria-pressed="${selection===i}"><strong>${bluffNumber(o.value)}</strong><span>${BLUFF_LABELS[o.kind]}</span></button>`;}).join('')}</div><button type="button" class="bl-action" data-send-claim ${selection===null||busy?'disabled':''}>Make this claim</button><p class="bl-note">+1 per player fooled.</p>`:`<div class="bl-wait"><span class="avatar">${avatar(maker?.avatar)}</span><h3>${esc(maker?.name||s.names?.[s.maker]||'The maker')} is choosing a claim</h3><p>They know the answer. Will you trust them?</p></div>`;
    if(s.stage==='vote')content=`<div class="bl-claim"><span>${esc(maker?.name||s.names?.[s.maker]||'The maker')} says</span><strong>${bluffNumber(s.claim.value)}</strong></div>${s.autoClaim?'<p class="bl-note">Automatic claim: no maker points this round.</p>':''}${mine?'<p class="bl-instruction">Claim set. Who believes you?</p>':member?`<p class="bl-instruction">Judge this claim.</p><div class="bl-votes">${Object.entries(BLUFF_LABELS).map(([id,label])=>`<button type="button" class="bl-choice-${id}" data-vote="${id}" aria-pressed="${myVote===id}" ${busy||room.paused||now()>=s.endsAt||(myVote&&now()>=bluffVoteDeadline(s,me))?'disabled':''}>${label}</button>`).join('')}</div><p class="bl-locked" data-vote-status role="status"></p>`:'<p>You’re watching this game. Join the next game to play.</p>'}<p class="bl-note">${Object.keys(s.votes||{}).length} of ${s.order.length-1} votes in · +2 correct</p>`;
    if(s.stage==='reveal')content=bluffSummaryHtml(s,room.players||{},avatar,me);
    const stageChanged=cueKey!==key;
    element.classList.toggle('bl-stage-enter',stageChanged);
    const cardFor=(id,side)=>{const p=room.players?.[id],maker=id===s.maker,tag=maker?'Maker':s.stage==='vote'?(s.votes?.[id]?'Voted':'Thinking…'):s.stage==='reveal'?(s.result.points[id]?'+'+s.result.points[id]:'0 points'):p?'Ready':'Away';return `<div class="hs-pl bl-player${maker?' turn':''}" data-bluff-player="${esc(id)}" data-bluff-side="${side}"><span class="avatar">${avatar(p?.avatar||s.avatars?.[id])}</span><b class="hs-pl-name" title="${esc(p?.name||s.names?.[id])}">${esc(p?.name||s.names?.[id]||'Player')}</b><span class="hs-pl-coins">${s.scores[id]||0} pts</span><span class="hs-tag${maker?' turn':s.votes?.[id]?' ok':''}">${tag}</span></div>`;};
    const left=[],right=[];s.order.forEach((id,i)=>(i%2?right:left).push(cardFor(id,i%2?'r':'l')));
    const nextControl=s.stage==='reveal'?(host?`<button type="button" class="bl-action" data-next ${busy?'disabled':''}>${!s.showStand?'Show rankings':s.round===s.total?'See final results':'Start next round'}</button>`:`<p class="hs-hint">Waiting for the host to ${s.showStand?'continue':'show the rankings'}.</p>`):'';
    const standings=s.stage==='reveal'&&s.showStand?bluffRankingsHtml(s,room.players||{},avatar,me):'';
    const board=s.stage==='reveal'?s.showStand?standings:`<section class="bl-summary" aria-label="Round summary"><h2>Round summary</h2>${content}</section>`:`<div class="hs-board bl-table${s.order.length>6?' dense':''}"><div class="hs-col l">${left.join('')}</div><section class="hs-mid bl-panel" aria-label="${s.stage==='make'?'Maker choice':'Judge the claim'}">${content}<p class="bl-error" role="status">${esc(error)}</p></section><div class="hs-col r">${right.join('')}</div></div>`;
    element.innerHTML=`<h1 class="bl-screen-reader">Bluff the Room</h1><div class="hs-top bl-meta"><div class="hs-rounds"><span class="hs-top-label">Round ${s.round} of ${s.total}</span></div>${s.stage==='animation'&&host?'<button type="button" class="bl-skip" data-skip-reveal>Skip</button>':''}<span class="hs-clock bl-clock" data-clock></span></div>${nextControl}${s.stage==='reveal'&&s.showStand?'':`<div class="hs-q bl-question">${s.stage==='reveal'?'':`<div class="bl-objects">${image(s.q.unitId)}${image(s.q.targetId)}</div>`}<h2 class="hs-qtext">${esc(s.q.prompt)}</h2></div>`}${board}<p class="bl-error" role="status">${esc(error)}</p>${s.stage==='animation'?'<div class="bl-reveal-overlay" role="region" aria-label="Size reveal"><div class="bl-reveal-sheet"><h2>Let’s see the real size</h2><div id="bluff-animation-slot"></div></div></div>':''}`;
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
    element.querySelector('[data-skip-reveal]')?.addEventListener('click',()=>advance(true));
    if(s.stage==='animation'&&visible()){
      const animKey=room.gameId+':'+s.round+':'+s.startedAt;
      if(animationKey!==animKey){animationStop?.();animationKey=animKey;animationNode=element.ownerDocument.createElement('div');animationNode.id='bluff-animation';animationStop=revealAnimation?.mount(animationNode,s.q,s);}
      element.querySelector('#bluff-animation-slot')?.append(animationNode);
    }else if(animationKey){animationStop?.();animationKey='';animationNode=null;animationStop=null;}
    if(stageChanged){cueKey=key;if(visible()){element.ownerDocument.defaultView.scrollTo({top:0,behavior:'instant'});sound(s.stage==='reveal'&&!s.showStand?'reveal':s.stage==='vote'?'go':'popup-open');}}
    clock();
  }
  async function work(fn,quiet=false){
    if(busy)return;busy=true;error='';render();
    try{const result=await fn();if(result?.committed===false&&!quiet){selection=null;error='That step has closed. Waiting for the latest game state.';}}
    catch{error='Couldn’t save. Check your connection and try again.';}
    finally{busy=false;signature='';render();}
  }
  function send(action,value){return work(async()=>{const {room,me}=context();const result=await act({gameId:room.gameId,round:room.bluff.round,stage:room.bluff.stage,actor:me,action,value});if(result?.committed&&visible())sound('tap');return result;});}
  function clock(){
    const {room,me}=context(),s=room?.bluff;if(!s)return;
    for(const next of element.querySelectorAll('[data-next],[data-skip-reveal]'))next.disabled=busy||room.paused;
    const time=room.paused?(room.pausedAt||now()):now(),voted=s.votes?.[me],left=Math.max(0,Math.ceil((bluffVoteDeadline(s,me)-time)/1000));
    for(const b of element.querySelectorAll('[data-vote]'))b.disabled=busy||room.paused||time>=s.endsAt||!!(voted&&!left);
    const status=element.querySelector('[data-vote-status]');if(status)status.textContent=voted?(left?`Change your vote · ${left}s`:`Vote final: ${BLUFF_LABELS[voted]}`):'Tap to vote. You get 10s to change it.';
    const timer=element.querySelector('[data-clock]');if(timer){timer.textContent=room.paused?'Paused':s.stage==='reveal'?'Results':Math.max(0,Math.ceil((s.endsAt-time)/1000))+'s';timer.classList.toggle('wide',room.paused||s.stage==='reveal');timer.classList.toggle('low',!room.paused&&!['reveal','animation'].includes(s.stage)&&s.endsAt-time<6000);}
  }
  async function advance(manual=false){
    const {room,me,host,leaving}=context(),s=room?.bluff;if(room?.phase!=='bluff'||!host||leaving||room.paused||busy||!Array.isArray(s?.order)||!s.q)return;
    const time=now();let next;
    if(s.stage==='make'){
      if(!room.players?.[s.maker]||time>=s.endsAt)next=chooseBluff(s,s.maker,s.fallback,time,true);
      else if(room.players?.[s.maker]?.isBot&&time>=s.startedAt+1800+(s.round*739%3000))next=chooseBluff(s,s.maker,s.fallback,time);
    }else if(s.stage==='vote'){
      for(const id of s.order.filter(id=>time<s.endsAt&&id!==s.maker&&room.players?.[id]?.isBot&&s.votes?.[id]===undefined)){
        if(time<s.startedAt+1800+(s.order.indexOf(id)*1297+s.round*619)%5500)continue;
        const difficulty=room.players[id].botDifficulty||'medium',chance={easy:.42,medium:.62,hard:.82}[difficulty]||.62;
        const choices=Object.keys(BLUFF_LABELS).filter(x=>x!==s.claim.kind),value=Math.random()<chance?s.claim.kind:choices[Math.floor(Math.random()*2)];
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
  function refresh(){const {room,leaving}=context();if(room?.phase==='bluff'&&!leaving){render();if(!handle)handle=setInterval(()=>{const c=context();if(c.leaving||c.room?.phase!=='bluff'){refresh();return;}clock();void advance();},300);void advance();}else{if(handle)clearInterval(handle);handle=null;signature='';animationStop?.();animationKey='';animationStop=null;animationNode=null;}}
  new MutationObserver(()=>refresh()).observe(element.parentElement,{attributes:true,attributeFilter:['class']});
  element.ownerDocument.addEventListener('visibilitychange',refresh);
  return {refresh,advance};
}
