import {partyTutorialScene} from './party-tutorial.mjs';
import {bluffScaleHtml,bluffRevealTimes} from './bluff-ui.mjs';

const pic=(src,alt='',cls='')=>`<img src="${src}" alt="${alt}" class="${cls}" draggable="false">`;
const av=(id,name)=>`<span class="xt-person">${pic('avatars/'+id+'.png',name)}<b>${name}</b></span>`;
const note=t=>`<div class="xt-note">${t}</div>`;
const hearts=(loss=false)=>`<div class="xt-hearts">${[0,1,2].map(i=>i===2&&loss?`<span class="xt-heart-swap">${pic('icons/life-heart-full.webp','','xt-before')}${pic('icons/life-heart-cracked.webp','','xt-after')}</span>`:pic('icons/life-heart-full.webp')).join('')}</div>`;
const coin=n=>`<span class="xt-money">${pic('icons/coin-v2.png')}<b>+${n}</b></span>`;
const chip=n=>`<span class="xt-money">${pic('icons/poker-chip-blue.webp')}<b>${n}</b></span>`;
const options=(reveal=false)=>`<div class="xt-options">${[1,2,3,4].map(n=>`<span class="${n===2?(reveal?'xt-correct':'xt-selected'):''}"><b>${n}</b>${n===2?`<small>${reveal?'Real answer':'Secret pick'}</small>`:''}</span>`).join('')}</div>`;
const stars=()=>`<div class="xt-stars">${[60,75,90].map((n,i)=>`<span class="${i<2?'xt-earned':''}">${pic('icons/flair/star.png')}<b>&gt;${n}%</b></span>`).join('')}</div><div class="xt-meter"><i style="--fill:85%"></i></div><b class="xt-big xt-arrive">85% · 2 stars</b>`;
const rows=(values,cls='')=>`<div class="xt-results ${cls}">${values.map(([label,value])=>`<div><span>${label}</span><b>${value}</b></div>`).join('')}</div>`;

export function extraTutorialScene(kind,s={}) {
  if(kind==='measure'||kind==='guess')return partyTutorialScene(kind).replace('Alex’s guess is locked','Your guess is locked');
  let body='';
  if(kind==='partners')body=`<div class="xt-partners">${av('av07','You')}<span>+</span>${av('av19','Partner')}</div><div class="xt-team-total">One team</div>${note('Same World · five questions')}`;
  if(kind==='average')body=`<div class="xt-partners">${av('av07','You: 80%')}<span>+</span>${av('av19','Partner: 90%')}</div><div class="xt-team-total xt-arrive">Team average: 85%</div>${note('Both guesses contribute')}`;
  if(kind==='stars')body=stars();
  if(kind==='worlds')body=`<div class="xt-worlds">${['tiny','food','sea'].map((w,i)=>`<span>${pic('icons/badges/world-'+w+'.webp')}<b>${['Tiny Things','Snack Time','Under the Sea'][i]}</b></span>`).join('')}</div><div class="xt-levels">${[1,2,3,4,5].map(n=>`<span class="${n===1?'xt-current':''}">${n}</span>`).join('')}</div>${note('Five questions per level')}`;
  if(kind==='worldReward')body=`<div class="xt-levels">${[1,2,3,4,5].map(n=>`<span class="${n<=2?'xt-current':''}">${n===1?'★':n}</span>`).join('')}</div>${note('A star opens the next level')}${coin(10)}${note('Example: 2 stars × 5 coins')}`;
  if(kind==='teamReward')body=`<div class="xt-partners">${av('av07','You')}${av('av19','Partner')}</div><div class="xt-team-total">85% together · 2 stars</div>${coin(10)}${note('10 coins each in this example')}`;
  if(kind==='hsPick')body=`<span class="xt-label">How many hot dogs long is a sneaker?</span>${options()}${note('The other players cannot see your pick')}`;
  if(kind==='hsAnte')body=`<div class="xt-chip-table"><div class="xt-pot">${pic('icons/poker-chip-stack.webp')}<b>Pot: 20</b></div>${['av07','av19','av06','av20'].map((id,i)=>`<span class="xt-seat seat-${i}">${pic('avatars/'+id+'.png')}${pic('icons/poker-chip-blue.webp','','xt-flying-chip')}</span>`).join('')}</div>${note('Example: four players ante 5 each')}`;
  if(kind==='hsActions')body=`<div class="xt-actions"><span data-hs-action="check"><b>Check</b><small>Add nothing when no bet is owed</small></span><span data-hs-action="call"><b>Call</b><small>Match the current bet</small></span><span data-hs-action="raise"><b>Raise</b><small>Increase the bet</small></span><span data-hs-action="fold"><b>Fold</b><small>Leave this round</small></span></div>${chip('20 → 60')}${note('Example: everyone adds 10 more')}`;
  if(kind==='hsPayout')body=`${options(true)}<div class="xt-pot-inline">${pic('icons/poker-chip-stack.webp')}<b>Pot: 60</b></div><div class="xt-partners"><span>${av('av07','Alex picked 2')}${chip('+30')}</span><span>${av('av19','Sam picked 2')}${chip('+30')}</span></div>`;
  if(kind==='hsBluff')body=`<div class="xt-folds">${av('av07','Alex stays')}${av('av19','Fold')}${av('av06','Fold')}${av('av20','Fold')}</div><div class="xt-team-total xt-arrive">Alex takes the pot</div>${note('Even a wrong pick can win this way')}`;
  if(kind==='hsCarry')body=`<span class="xt-label">Two or more players still in · no correct picks</span><div class="xt-pot-inline">${pic('icons/poker-chip-stack.webp')}<b>60</b><span class="xt-big">→</span>${pic('icons/poker-chip-stack.webp')}<b>Next round</b></div>${note('The pot carries over')}`;
  if(kind==='hsFinish')body=`${rows([['Alex','115 chips'],['Sam','115 chips'],['Lee','85 chips'],['Jo','85 chips']])}${note('Tied biggest stacks share the win')}`;
  if(kind==='bluffMaker')body=`<span class="xt-label">Only Lee, the maker, sees these labels</span>${av('av06','Lee · maker')}<div class="xt-bluff-options">${[['Too Low',1],['Correct',2],['Too High',3]].map(([l,n])=>`<span class="${n===3?'xt-selected':''}"><small>${l}</small><b>${n}</b></span>`).join('')}</div>${note('Lee chooses to claim 3')}`;
  if(kind==='bluffVote')body=`<span class="xt-label">What the voters see</span><div class="xt-claim">Lee claims <b>3</b></div><div class="xt-vote-labels"><span data-choice="low">Too Low</span><span data-choice="correct">Correct</span><span data-choice="high" class="xt-selected">Too High</span></div><div class="xt-partners">${av('av07','Alex: Too High')}${av('av19','Sam: Correct')}</div>`;
  if(kind==='bluffReveal'){
    const example={order:['lee','alex','sam'],maker:'lee',votes:{alex:'high',sam:'correct'},q:{answer:2},claim:{kind:'high',value:3}};
    const timing=bluffRevealTimes(example);
    body=`${bluffScaleHtml(example,timing,0)}<div class="xt-bluff-bins" style="--results-at:${timing.drop0}ms">${[['Too Low','No votes',''],['Correct','Sam · 0',''],['Too High','Alex · +2','winner']].map(([label,name,cls])=>`<div class="${cls}"><b>${label}</b><span>${name}</span></div>`).join('')}</div><div class="xt-bluff-maker" style="--results-at:${timing.judged}ms">${note('Lee fooled Sam: +1')}</div>`;
  }
  if(kind==='bluffTurns')body=`<div class="xt-partners">${av('av06','Lee')}<b>→</b>${av('av07','Alex')}<b>→</b>${av('av19','Sam')}</div>${note('Everyone gets equal maker turns')}<div class="xt-team-total">Most points wins</div>`;
  if(kind==='daily')body=`<span class="xt-label">One shared daily challenge</span><div class="xt-levels">${[1,2,3].map(n=>`<span class="xt-current">${n}</span>`).join('')}</div>${rows([['Question 1','90%'],['Question 2','80%'],['Question 3','100%']])}${note('Example leaderboard score: 270 / 300')}`;
  if(kind==='dailyReward')body=`${coin(10)}<div class="xt-streak"><b>3 days</b><b>7 days</b><b>30 days</b></div>${note('Streak milestones add bonuses')}<span class="xt-label">A new scored challenge tomorrow</span>`;
  if(kind==='monthly'){
    const items=s.items?.length?s.items.slice(0,6):[{image:'items/pumpkin.webp'},{image:'items/witch-hat.webp'},{image:'items/cauldron.webp'}];
    const safe=src=>String(src).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    body=`<span class="xt-label">This month’s own object pack</span><div class="xt-month-items">${items.map(o=>pic(safe(o.image),'Monthly object')).join('')}</div>${note('Each monthly object appears once across Levels 1–3')}`;
  }
  if(kind==='monthlyLevels')body=`<div class="xt-month-levels">${[1,2,3].map(n=>`<span>Level ${n}<b>5 questions</b></span>`).join('')}<span class="xt-mega">Mega<b>All 15 questions</b></span></div>${note('Clear Level 3 to open Mega')}`;
  if(kind==='monthlyResults')body=`${rows([['First completion','Progress + leaderboard'],['Mega','Its own leaderboard'],['Practice replay','Half coins · no new score']])}${note('Your month’s progress stays saved')}`;
  if(kind==='wbPick')body=`<span class="xt-label">Which is bigger in real life?</span><div class="xt-bigger"><span class="xt-chosen">${pic('items/elephant.webp','Elephant','xt-elephant')}<b>Elephant</b><i>✓</i></span><span>${pic('icons/mascot-mouse.webp','Mouse')}<b>Mouse</b></span></div>${note('Judge the object, not the picture’s size')}`;
  if(kind==='wbWrong')body=`<div class="xt-bigger"><span>${pic('items/elephant.webp','Elephant','xt-elephant')}<b>Elephant</b></span><span class="xt-wrong">${pic('icons/mascot-mouse.webp','Mouse')}<b>Mouse</b><i>×</i></span></div>${hearts(true)}${note('A wrong pick costs one life')}`;
  if(kind==='wbRun')body=`<div class="xt-team-total">6 correct picks</div>${coin(3)}${note('One coin per two correct picks, rounded up')}<span class="xt-label">Keep going to beat your best</span>`;
  if(kind==='svLives')body=`${hearts()}${note('No timer · no Second Chance')}<div class="xt-team-total">Keep your lives to keep playing</div>`;
  if(kind==='svSafe')body=`<span class="xt-label">Answer: 2 · Your guess: 1.8</span><b class="xt-big">90% accurate</b><div class="xt-meter xt-survival"><i style="--fill:90%"></i><span>60%</span></div>${hearts()}${note('60% or better: survive')}`;
  if(kind==='svMiss')body=`<span class="xt-label">Answer: 2 · Your guess: 1</span><b class="xt-big">50% accurate</b><div class="xt-meter xt-survival xt-fail"><i style="--fill:50%"></i><span>60%</span></div>${hearts(true)}${note('Below 60%: lose a life')}`;
  if(kind==='svShield')body=`<div class="xt-levels xt-charge">${[80,90,85].map(n=>`<span class="xt-current">${n}%</span>`).join('')}</div>${pic('icons/survival-shield-full.webp','Shield ready','xt-shield xt-arrive')}${note('Three consecutive rounds at 75% or better')}`;
  if(kind==='svSave')body=`<span class="xt-label">Next guess: 50% · shield ready</span><span class="xt-shield-swap">${pic('icons/survival-shield-full.webp','','xt-before')}${pic('icons/survival-shield-cracked.webp','','xt-after')}</span>${hearts()}${note('Shield used · all three lives kept')}<span class="xt-label">This round does not add a survival</span>`;
  if(kind==='svCoins')body=`${rows([['Normal survival','+3 coins'],['Every fifth survival: themed','+5 coins']])}${coin('3 / 5')}${note('A failed themed round keeps its theme')}`;
  if(kind==='hlShield')body=`<div class="xt-levels xt-charge">${[1,2,3].map(n=>`<span class="xt-current">✓ ${n}</span>`).join('')}</div>${pic('icons/survival-shield-full.webp','Shared shield ready','xt-shield xt-arrive')}${hearts()}${note('Three survivals → one shared shield')}`;
  if(kind==='hlRewards')body=`${rows([['Normal survival','+2 coins each'],['Every fifth survival: themed','+4 coins each']])}${note('A failed themed round keeps its theme')}<span class="xt-label">Keep surviving to beat your best run</span>`;
  return `<div class="xt-stage xt-${kind}" data-extra-lesson="${kind}">${body}</div>`;
}

const slide=(lesson,head,text)=>({scene:'extraExample',lesson,head,text});
const mode=(title,slides)=>({title,autoplay:true,slideMs:7500,slides});
export const MORE_MODE_TUTORIALS={
  highstakes:mode('High Stakes',[
    slide('hsPick','Pick secretly','One answer is real and three are fake. Your pick stays hidden while everyone bets.'),
    slide('hsAnte','Everyone adds to the pot','Each round starts with an ante. These are the chips in this match, separate from your wallet coins.'),
    slide('hsActions','Watch the betting turn','Check, call, raise or fold when it is your turn. Folding gives up this round’s pot.'),
    slide('hsPayout','Correct players share the pot','Alex and Sam stayed in and picked 2, the real answer. They split this 60-chip pot: 30 each.'),
    slide('hsBluff','You can win by bluffing','If everyone else folds, the last player in takes the pot—even with a wrong answer.'),
    slide('hsCarry','No correct picks? It rolls over','With several players still in and nobody correct, the pot carries into the next round.'),
    slide('hsFinish','Finish with the biggest stack','Most chips wins; ties share the win. Running out eliminates you, but you can still submit fake answers to earn wallet coins.'),
  ]),
  bluff:mode('Bluff the Room',[
    slide('measure','One question for the whole room','Use this example: two hot dogs fit along the sneaker. The real answer is 2.'),
    slide('bluffMaker','The maker knows the truth','Only the maker sees which answer is Too Low, Correct or Too High. Lee decides to claim 3.'),
    slide('bluffVote','Voters only see the claim','Alex and Sam do not see the private labels. They decide whether Lee’s 3 is Too Low, Correct or Too High.'),
    slide('bluffReveal','Truth revealed. Points awarded.','Alex correctly said Too High: +2. Sam was fooled, so Lee earns +1. Wrong votes earn nothing.'),
    slide('bluffTurns','Everyone gets a turn as maker','The roles rotate fairly. Correct votes earn +2; each player fooled earns the maker +1. Most points wins.'),
  ]),
  teamworlds:mode('Team Worlds',[
    slide('partners','Two partners. One World.','Choose a World with your partner. You work through five questions together.'),
    slide('measure','Both answer the same question','Measure the small object along the big one. Each partner submits their own guess.'),
    slide('average','Both guesses shape the result','Your 80% and your partner’s 90% make 85% together. A stronger guess helps the team.'),
    slide('stars','Fill one shared star meter','The average across all five questions sets your stars. Get above 60%, 75% and 90% for one, two and three stars.'),
    slide('teamReward','Earn together. Try again together.','Each player earns 5 coins per star on every completed attempt. This two-star example pays 10 coins each.'),
  ]),
  worlds:mode('Worlds',[
    slide('worlds','Pick a World and a level','Each World has five levels. Each level is five questions, with no timer or Second Chance.'),
    slide('measure','Think end to end','Picture how many small objects fit along the bigger one. Here, two hot dogs fit along a sneaker.'),
    slide('guess','Decimals are welcome','A guess of 1.8 is allowed. Take your time, then lock in your estimate.'),
    slide('stars','Your five answers earn stars','Average accuracy must be above 60%, 75% and 90% for up to three stars. This 85% example earns two.'),
    slide('worldReward','Stars open the next level','Earn a star to progress. Every completed attempt pays 5 coins per star, so improving and replaying both pay.'),
  ]),
  daily:mode('Daily Challenge',[
    slide('daily','Three questions. One scored try.','Everyone gets the same daily set. Your three accuracy scores add together for the leaderboard.'),
    slide('measure','Same measuring idea','Count the smaller object along the larger one. Decimals are allowed, just like the other measuring modes.'),
    slide('dailyReward','A daily reward, plus streaks','Finish today’s challenge to earn 10 coins. Keep a daily streak for milestone bonuses.'),
  ]),
  monthly:mode('Monthly Challenge',[
    slide('monthly','Meet this month’s pack','The challenge uses the current month’s own objects. Each appears once across the first three levels.'),
    slide('monthlyLevels','Three levels, then Mega','Levels 1–3 have five questions each. After Level 3, Mega combines all 15 questions.'),
    slide('measure','Measure familiar and new objects','You still guess how many small objects fit along a bigger one. The monthly objects are part of those pairs.'),
    slide('monthlyResults','Keep your progress and practice','First completions save progress and leaderboard scores. Practice replays pay half coins and do not replace your score.'),
  ]),
  wb:mode('Which Is Bigger',[
    slide('wbPick','Choose the bigger real object','Tap the object that is larger in real life. The pictures can look similar in size; that is not the measurement.'),
    slide('wbWrong','Three lives for your run','A wrong pick costs one life. Lose all three and the run ends.'),
    slide('wbRun','Keep going for a new best','Pairs get closer in size as you progress. Correct picks earn coins and build your run score.'),
  ]),
  survival:mode('Survival',[
    slide('svLives','Three lives. No rush.','Keep guessing while you have lives left. There is no timer and no Second Chance.'),
    slide('measure','Use the same measuring idea','Estimate how many small objects fit along the big one. You can use decimal guesses.'),
    slide('svSafe','60% or better keeps you safe','The answer is 2. A guess of 1.8 is 90% accurate, so you survive this round.'),
    slide('svMiss','Below 60% costs a life','A guess of 1 is only 50% accurate. Without a shield, one heart breaks.'),
    slide('svShield','Strong guesses charge a shield','Three rounds at 75% or better earn one shield. You can hold only one at a time.'),
    slide('svSave','A shield blocks one lost life','A bad guess uses the shield instead of a heart. You keep your lives, but that round is not counted as survived.'),
    slide('svCoins','Surviving pays coins','Normal survived rounds pay 3 coins. Every fifth survival is a themed round worth 5 coins.'),
  ]),
};
