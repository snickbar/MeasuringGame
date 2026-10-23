import {BLUFF_LABELS,dealBluff,chooseBluff,revealBluff,bluffStandings} from './bluff.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const bluffNumber=n=>Number(n).toLocaleString('en-US',{maximumFractionDigits:2});
export function bluffFinalHtml(s,players,avatar){
  return bluffStandings(s).map(row=>`<li class="final-row${row.rank===1?' rank-1':''}"><div class="final-row-top"><span class="medal rank-num">${row.rank}</span><span class="avatar">${avatar(players[row.id]?.avatar)}</span><span class="name">${esc(players[row.id]?.name||s.names?.[row.id]||'Player')}</span><span class="pts">${row.score}</span></div><p class="bl-final-detail">${Math.round(row.accuracy)}% vote accuracy · ${s.correct[row.id]||0}/${s.judged[row.id]||0} correct · ${s.fooled[row.id]||0} fooled</p></li>`).join('');
}
export function createBluffUI({element,context,now,transact,act,question,object,avatar,sound,visible}){
  const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('./bluff.css',import.meta.url);document.head.append(css);
  let handle=null,busy=false,selection=null,selectionKey='',signature='',cueKey='',error='';
  const image=id=>{const o=object(id);return `<figure><img src="${esc(o?.image)}" alt="${esc(o?.name)}" draggable="false"><figcaption>${esc(o?.name)}</figcaption></figure>`;};
  function render(){
    const {room,me,host}=context(),s=room?.bluff;if(room?.phase!=='bluff'||!s)return;
    const key=room.gameId+':'+s.round+':'+s.stage+':'+me;
    if(selectionKey!==key){selection=null;selectionKey=key;error='';}
    const sig=JSON.stringify([key,s,room.players,room.paused,selection,busy,error]);if(sig===signature)return;signature=sig;
    const mine=s.maker===me,member=s.order.includes(me),maker=room.players?.[s.maker],myVote=s.votes?.[me];
    let content='';
    if(s.stage==='make')content=mine?`<p class="bl-instruction">Only you see these three choices and their labels. Pick the number you want to claim.</p><div class="bl-claims">${s.options.map((o,i)=>`<button type="button" data-claim="${i}" data-fit-single-line="true" aria-pressed="${selection===i}"><strong>${bluffNumber(o.value)}</strong><span>${BLUFF_LABELS[o.kind]}</span></button>`).join('')}</div><button type="button" class="bl-action" data-send-claim ${selection===null||busy?'disabled':''}>Make this claim</button><p class="bl-note">Tell the truth or bluff. Earn +1 for each submitted vote you fool.</p>`:`<div class="bl-wait"><span class="avatar">${avatar(maker?.avatar)}</span><h3>${esc(maker?.name||s.names?.[s.maker]||'The maker')} is choosing a claim</h3><p>They know the answer. Will you trust them?</p></div>`;
    if(s.stage==='vote')content=`<div class="bl-claim"><span>${esc(maker?.name||s.names?.[s.maker]||'The maker')} says</span><strong>${bluffNumber(s.claim.value)}</strong></div>${s.autoClaim?'<p class="bl-note">The maker ran out of time. The game chose this claim; the maker cannot earn points this round.</p>':''}${mine?'<p class="bl-instruction">Your claim is locked. See who believes you!</p>':member?`<p class="bl-instruction">Is that number too low, correct, or too high?</p><div class="bl-votes">${Object.entries(BLUFF_LABELS).map(([id,label])=>`<button type="button" data-vote="${id}" aria-pressed="${(myVote||selection)===id}" ${myVote?'disabled':''}>${label}</button>`).join('')}</div>${myVote?`<p class="bl-locked" role="status">Vote locked: ${BLUFF_LABELS[myVote]}</p>`:`<button type="button" class="bl-action" data-send-vote ${!selection||busy?'disabled':''}>Lock my vote</button>`}`:'<p>You’re watching this game. Join the next game to play.</p>'}<p class="bl-note">${Object.keys(s.votes||{}).length} of ${s.order.length-1} votes locked · +2 for a correct vote</p>`;
    if(s.stage==='reveal')content=`<div class="bl-reveal"><span>The real answer</span><strong>${bluffNumber(s.q.answer)}</strong><p>The claim was <b>${BLUFF_LABELS[s.claim.kind].toLowerCase()}</b>: ${bluffNumber(s.claim.value)}</p></div><div class="bl-verdict">${mine?`You fooled ${s.result.points[me]||0} player${s.result.points[me]===1?'':'s'} · +${s.result.points[me]||0}`:member?myVote?(myVote===s.claim.kind?'You called it! +2 points':'Fooled this time · +0 points'):'No vote submitted · +0 points':'Round results'}</div><div class="bl-vote-results">${s.order.filter(id=>id!==s.maker).map(id=>`<p><span>${esc(room.players?.[id]?.name||s.names?.[id]||'Player')}</span><b>${BLUFF_LABELS[s.votes?.[id]]||'No vote'} <small>+${s.result.points[id]||0}</small></b></p>`).join('')}</div>${s.autoClaim?'<p class="bl-note">Automatic claim: no maker points awarded.</p>':''}${host?`<button type="button" class="bl-action" data-next ${busy?'disabled':''}>${s.round===s.total?'See final results':'Next maker'}</button>`:'<p class="bl-note">Waiting for the host to continue.</p>'}`;
    const stageChanged=cueKey!==key;
    element.classList.toggle('bl-stage-enter',stageChanged);
    element.innerHTML=`<h1 class="bl-banner"><img src="icons/reactions/giggle.png" alt="">Bluff the Room</h1><div class="bl-meta"><span>Round ${s.round} of ${s.total}</span><span class="bl-clock" data-clock></span></div><div class="bl-question"><div class="bl-objects">${image(s.q.unitId)}${image(s.q.targetId)}</div><h2>${esc(s.q.prompt)}</h2></div><section class="bl-panel" aria-label="${s.stage==='make'?'Maker choice':s.stage==='vote'?'Judge the claim':'Round results'}">${content}<p class="bl-error" role="status">${esc(error)}</p></section><h3 class="bl-score-label">The room</h3><div class="bl-players">${s.order.map(id=>`<div class="bl-player" data-bluff-player="${esc(id)}"><span class="avatar">${avatar(room.players?.[id]?.avatar||s.avatars?.[id])}</span><div><b title="${esc(room.players?.[id]?.name||s.names?.[id])}">${esc(room.players?.[id]?.name||s.names?.[id]||'Player')}</b><small>${id===s.maker?'Maker':s.stage==='vote'?(s.votes?.[id]?'Vote locked':'Thinking…'):room.players?.[id]?'':'Away'}</small></div><strong>${s.scores[id]||0}</strong></div>`).join('')}</div>`;
    const select=value=>{
      selection=value;signature='';render();
      const action=element.querySelector('[data-send-claim],[data-send-vote]'),view=element.ownerDocument.defaultView;
      const bottom=element.ownerDocument.getElementById('bottom-toolbar')?.getBoundingClientRect().top||view.innerHeight;
      if(action&&action.getBoundingClientRect().bottom>bottom-12)view.scrollBy({top:action.getBoundingClientRect().bottom-bottom+12,behavior:'instant'});
    };
    element.querySelectorAll('[data-claim]').forEach(b=>b.onclick=()=>select(Number(b.dataset.claim)));
    element.querySelectorAll('[data-vote]').forEach(b=>b.onclick=()=>select(b.dataset.vote));
    element.querySelector('[data-send-claim]')?.addEventListener('click',()=>send('claim',selection));
    element.querySelector('[data-send-vote]')?.addEventListener('click',()=>send('vote',selection));
    element.querySelector('[data-next]')?.addEventListener('click',()=>advance(true));
    if(stageChanged){cueKey=key;if(visible()){element.ownerDocument.defaultView.scrollTo({top:0,behavior:'instant'});sound(s.stage==='reveal'?'reveal':s.stage==='vote'?'go':'popup-open');}}
    clock();
  }
  async function work(fn,quiet=false){
    if(busy)return;busy=true;error='';render();
    try{const result=await fn();if(result?.committed===false&&!quiet){selection=null;error='That step has closed. Waiting for the latest game state.';}}
    catch{error='Couldn’t save. Check your connection and try again.';}
    finally{busy=false;signature='';render();}
  }
  function send(action,value){return work(async()=>{const {room,me}=context();const result=await act({gameId:room.gameId,round:room.bluff.round,stage:room.bluff.stage,actor:me,action,value});if(result?.committed&&visible())sound('tap');return result;});}
  function clock(){const {room}=context(),s=room?.bluff;if(!s)return;const next=element.querySelector('[data-next]');if(next)next.disabled=busy||room.paused||now()<s.startedAt+1200;const timer=element.querySelector('[data-clock]');if(timer){timer.textContent=room.paused?'Paused':s.stage==='reveal'?'Results':Math.max(0,Math.ceil((s.endsAt-now())/1000))+'s';timer.classList.toggle('low',!room.paused&&s.stage!=='reveal'&&s.endsAt-now()<6000);}}
  async function advance(manual=false){
    const {room,me,host,leaving}=context(),s=room?.bluff;if(room?.phase!=='bluff'||!host||leaving||room.paused||busy||!s)return;
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
      const waiting=s.order.some(id=>id!==s.maker&&room.players?.[id]&&s.votes?.[id]===undefined);
      if(time>=s.endsAt||(!waiting&&time>=s.startedAt+1500))next=revealBluff(s,time);
    }else if(s.stage==='reveal'&&time>=s.startedAt+1200&&(manual||time>=s.endsAt))next=s.round===s.total?{...s,stage:'over'}:dealBluff(s,question(),time);
    if(next)await work(()=>transact(room,next,me),true);
  }
  function refresh(){const {room,leaving}=context();if(room?.phase==='bluff'&&!leaving){render();if(!handle)handle=setInterval(()=>{const c=context();if(c.leaving||c.room?.phase!=='bluff'){refresh();return;}clock();void advance();},300);void advance();}else{if(handle)clearInterval(handle);handle=null;signature='';}}
  return {refresh,advance};
}
