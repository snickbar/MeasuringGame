import { roundAccuracy, formatAccuracy } from './accuracy.mjs';
import { POWERUPS, bufferedGuess } from './powerups.mjs';

export const TUTORIAL_VERSION = 1;
export const tutorialSeen = value => value?.version >= TUTORIAL_VERSION && ['skipped','completed'].includes(value.status);
const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const modes = [
  ['Quick Game','Practice against bots. Choose their accuracy and your round settings. Second Chance is included.'],
  ['Party','Host a room or join with a code or QR scan. Classic Party and Team vs Team follow the guess, Second Chance, reveal flow.'],
  ['Worlds','Five untimed questions per level. Average accuracy earns stars at 60%, 75%, and 90%. Team Worlds lets you progress together.'],
  ['Survival','Keep guessing with three lives. Less than 60% accuracy costs a life. No timer or Second Chance.'],
  ['High / Low','Work together: one guess at or below the answer, the other at or above it. Keep the bracket tight enough to survive.'],
  ['High Stakes','Pick the real answer and bet your table coins. Watch the pot and decide when to fold.'],
  ['Daily & Monthly','Daily is three questions with one try. Monthly features every object in that month’s pack once.'],
];

// A self-contained practice UI: only tutorial preferences leave this module.
export function createTutorial({profile, save, sample, canOffer, location, storage}) {
  if(!storage){try{storage=globalThis.localStorage;}catch{}}
  const sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href=new URL('./tutorial.css',import.meta.url);document.head.append(sheet);
  const dialog=document.createElement('dialog');dialog.id='game-tutorial';dialog.setAttribute('aria-labelledby','tutorial-title');document.body.append(dialog);
  let step=-1, input='', choice=null, buffer=false, owner=null, origin=null, opener=null, offerTimer=null;
  const key=id=>'size-em-up:tutorial:'+id;
  const local=id=>{try{return JSON.parse(storage.getItem(key(id)));}catch{return null;}};
  const remember=status=>{
    if(!owner)return;
    const id=owner;
    if(profile().owner===id&&profile().data?.tutorial?.status==='completed'||local(id)?.status==='completed')status='completed';
    const value={version:TUTORIAL_VERSION,status};
    try{storage.setItem(key(owner),JSON.stringify(value));}catch{}
    void Promise.resolve().then(()=>save(id,value)).catch(()=>{});
  };
  function close(status='skipped') {
    if(!dialog.open)return;
    remember(status);dialog.close();
    if(opener?.isConnected&&opener.getClientRects().length)opener.focus({preventScroll:true});
  }
  const art=(file,alt='')=>`<img src="${escape(file)}" alt="${escape(alt)}" draggable="false">`;
  // The old banner pictures had no words on them, so the banner is the blank pill plus real text.
  const banner=(text,icon)=>`<div class="tutorial-banner"><img src="${escape(icon)}" alt="" draggable="false"><span>${escape(text)}</span></div>`;
  function render() {
    const {unit,target,prompt,answer}=sample(), guess=Number(input), accuracy=roundAccuracy(guess/answer);
    dialog.dataset.step=String(step);
    const title=['Try a guess','Take a Second Chance','See how you did','Try a power-up','Find your next game','You’re ready!'][step]||'Learn to Size ’Em Up';
    let body='',next='Next',disabled=false;
    if(step===-1){body=`${banner('Solo Game','icons/home-solo.png')}<p>Try a short guided practice round, then explore the ways to play.</p><p class="tutorial-note">No coins spent, no stats recorded. Skip any time and replay from How to Play.</p>`;next='Start tutorial';}
    if(step===0){body=`<p>How many small objects fit along the big one? Follow the measurement in the question.</p><div class="tutorial-objects"><figure>${art(unit.image,unit.name)}<figcaption>${escape(unit.name)}</figcaption></figure><figure>${art(target.image,target.name)}<figcaption>${escape(target.name)}</figcaption></figure></div><h3>${escape(prompt)}</h3><output aria-live="polite" class="tutorial-input">${input||'Your guess'}</output><div class="tutorial-keys">${['1','2','3','4','5','6','7','8','9','.','0','Delete'].map(k=>`<button type="button" data-key="${k}" aria-label="${k==='Delete'?'Delete last digit':k}">${k}</button>`).join('')}</div><p class="tutorial-note">Decimals are welcome. Pictures are clues, not a ruler.</p>`;next='Lock it in';disabled=!(guess>0);}
    if(step===1){body=`<p>In timed games, a short buffer lets the remaining players finish after you submit. Then guesses lock before <b>Second Chance</b> in Quick Game and Classic Party. Back your own guess with Double Down, or choose another card.</p><p>One card secretly contains the real answer, unless someone guessed it exactly.</p><div class="tutorial-choices">${[['own',input,'Double Down'],['other','8','Another guess'],...(Math.abs(guess-answer)>.005?[['truth',String(Number(answer.toFixed(2))),'Another card']]:[])].map(([id,value,label])=>`<button type="button" data-choice="${id}" aria-pressed="${choice===id}"><strong>${escape(value)}</strong><span>${label}</span></button>`).join('')}</div><p class="tutorial-note">Your original guess stays locked. Choosing a card does not replace it.</p>`;next='Reveal answer';disabled=!choice;}
    if(step===2){const won=Math.abs(guess-answer)<Math.abs(8-answer);let feedback=choice==='own'?(won?'Your guess is closest: Double Down adds +2.':'Your guess is not closest, so Double Down adds nothing.'):choice==='truth'?(!won?'You found the hidden answer: +1 Second Chance point.':'You found the hidden answer, but the round winner does not earn the +1 bonus.'):'Picking another player’s guess does not earn the hidden-answer bonus.';body=`<p class="tutorial-answer">${Number(answer.toFixed(2))} ${escape(unit.plural)}</p><div class="tutorial-result"><span>Your guess <b>${escape(input)}</b></span><span>Accuracy <b>${formatAccuracy(accuracy)}%</b></span></div><p>${feedback}</p><p>The closest original guess earns <b>+3</b>, or <b>+5</b> when within 1% of the answer. A crowd favorite can earn +1 with at least two picks.</p><p class="tutorial-note">After the reveal comes the round summary. At game end, average accuracy adds a bonus and breaks score ties. A complete tie shares the win.</p>`;}
    if(step===3){const improved=bufferedGuess(guess,answer,buffer);body=`<p>Quick Game, Worlds, and Survival offer power-ups. They normally cost the coins shown. This practice button is free.</p><button type="button" id="tutorial-buffer" class="tutorial-power" aria-pressed="${buffer}">${art('icons/powerups/'+POWERUPS.buffer.icon+'.png')}<span>${buffer?'Buffer applied':'Try the 10% buffer'}<small>Free practice</small></span></button><div class="tutorial-result"><span>Before <b>${formatAccuracy(accuracy)}%</b></span><span>With buffer <b>${formatAccuracy(roundAccuracy(improved/answer))}%</b></span></div><p>${escape(POWERUPS.buffer.description)}</p><p class="tutorial-note">Rerolls replace objects; Item Reveal briefly shows their relative sizes. Available choices depend on the mode and phase. Party, Daily, and Monthly have no power-ups.</p>`;}
    if(step===4){body=`<p>The same sense of scale works across different game types. Tap any mode to learn more.</p><div class="tutorial-modes">${modes.map(([name,text])=>`<details><summary>${name}</summary><p>${text}</p></details>`).join('')}</div>`;}
    if(step===5){body=`${banner('Worlds','items/hot-air-balloon.webp')}<p>Start with Quick Game for practice, or pick a mode from Home.</p><p>In game settings, choose rounds, the timer, bot accuracy, and automatic or manual round advance. Save favorite setups as presets.</p><p>Visit <b>Style</b> for avatars and backgrounds, and <b>Stats</b> to track progress and discoveries.</p><p class="tutorial-note">You can replay this tutorial any time from <b>How to Play → Play tutorial</b>.</p>`;next='Finish tutorial';}
    dialog.innerHTML=`<header><span>${step<0?'Optional practice':`Step ${step+1} of 6`}</span><button type="button" data-exit aria-label="Close tutorial">×</button></header><h2 id="tutorial-title" tabindex="-1">${title}</h2><div class="tutorial-body">${body}</div><footer>${step>0?'<button type="button" data-back>Back</button>':'<button type="button" data-exit>Skip for now</button>'}<button type="button" data-next ${disabled?'disabled':''}>${next}</button></footer>${step>0&&step<5?'<button type="button" class="tutorial-skip" data-exit>Skip tutorial</button>':''}`;
    dialog.querySelectorAll('[data-exit]').forEach(b=>b.onclick=()=>close());
    dialog.querySelector('[data-back]')?.addEventListener('click',()=>{step--;render();});
    dialog.querySelector('[data-next]').onclick=()=>{if(step===5){close('completed');return;}step++;render();dialog.querySelector('h2').focus({preventScroll:true});};
    dialog.querySelectorAll('[data-key]').forEach(b=>b.onclick=()=>{
      const k=b.dataset.key;
      if(k==='Delete')input=input.slice(0,-1);else if(k==='.'&&!input.includes('.'))input=(input||'0')+'.';else if(k!=='.'&&input.length<7)input+=k;
      choice=null;dialog.querySelector('output').textContent=input||'Your guess';dialog.querySelector('[data-next]').disabled=!(Number(input)>0);
    });
    dialog.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{choice=b.dataset.choice;dialog.querySelectorAll('[data-choice]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));dialog.querySelector('[data-next]').disabled=false;});
    dialog.querySelector('#tutorial-buffer')?.addEventListener('click',()=>{buffer=true;render();dialog.querySelector('#tutorial-buffer').focus({preventScroll:true});});
    dialog.scrollTop=0;
  }
  function open(welcome=false) {
    if(dialog.open)return;
    owner=profile().owner;origin=location();opener=document.activeElement;step=welcome?-1:0;input='';choice=null;buffer=false;
    render();dialog.showModal();dialog.querySelector('h2').focus({preventScroll:true});
  }
  function refresh() {
    clearTimeout(offerTimer);
    if(dialog.open){if(owner!==profile().owner||origin!==location()){if(owner===profile().owner)remember('skipped');dialog.close();}return;}
    const p=profile();
    if(!p.owner||tutorialSeen(p.data?.tutorial)||tutorialSeen(local(p.owner))||!canOffer())return;
    offerTimer=setTimeout(()=>{const now=profile();if(now.owner===p.owner&&!tutorialSeen(now.data?.tutorial)&&!tutorialSeen(local(now.owner))&&canOffer())open(true);},1200);
  }
  dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  const observer=new MutationObserver(refresh);observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class','hidden','open']});
  document.addEventListener('visibilitychange',refresh);
  refresh();
  return {open:()=>open(false),refresh};
}
