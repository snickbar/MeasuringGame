// A fixed teaching round, separate from live game state and player input.
export const PARTY_TUTORIAL_EXAMPLE = {
  unit:'hot-dog',unitMm:150,target:'sneaker',targetMm:300,answer:2,
  guesses:[1.8,3,1,4],closest:3,doubleDown:2,secondChance:1,
};
const image=(src,alt,cls='')=>`<img src="${src}" alt="${alt}" class="${cls}" draggable="false">`;
const avatar=(id,name,cls='')=>`<div class="pt-player ${cls}">${image('avatars/'+id+'.png',name)}<b>${name}</b></div>`;
const question='<div class="pt-question">How many hot dogs long is a sneaker?</div>';
const teamStrip='<div class="pt-team-strip"><span class="red"><b>RED</b> Alex + Sam</span><span class="blue"><b>BLUE</b> Lee + Jo</span></div>';
const options=team=>`<div class="pt-options">${[1.8,3,1,...(team?[4]:[]),2].map((n,i)=>`<div class="pt-option ${i===0?'own':n===2?'truth':''}"><small>${i===0?'Alex’s guess':'Answer'}</small><b>${n}</b>${n===2?'<span class="pt-picked">Sam’s pick</span>':''}</div>`).join('')}</div>`;

export function partyTutorialScene(kind,{team=false,quick=false}={}) {
  let body='';
  if(kind==='players')body=team
    ? `<div class="pt-team red"><b>Red team</b><div>${avatar('av07','Alex')}${avatar('av19','Sam')}</div></div><div class="pt-team blue"><b>Blue team</b><div>${avatar('av06','Lee')}${avatar('av20','Jo')}</div></div>`
    : `<div class="pt-roster">${avatar('av07','Alex','you')}${avatar('av19',quick?'Bot Sam':'Sam')}${avatar('av06',quick?'Bot Lee':'Lee')}</div><span class="pt-note">${quick?'You choose the bot difficulty':'Everyone gets the same question'}</span>`;
  if(kind==='measure')body=`${question}<div class="pt-measuring"><div class="pt-ruler">${image('items/sneaker.webp','A 30 cm sneaker')}</div><div class="pt-arrow"><span>End to end</span></div><div class="pt-units">${[1,2].map(n=>`<div class="pt-unit unit-${n}">${image('items/hot-dog.webp','One 15 cm hot dog')}<b>${n}</b></div>`).join('')}</div></div><span class="pt-note pt-reveal">Two fit along it</span>`;
  if(kind==='guess')body=`${question}<div class="pt-guess-layout"><div class="pt-objects">${image('items/hot-dog.webp','Hot dog')}${image('items/sneaker.webp','Sneaker')}</div><div class="pt-entry"><div class="pt-value">1.8</div><div class="pt-keypad" aria-hidden="true">${['1','2','3','4','5','6','7','8','9','.','0','←'].map(n=>`<span class="${n==='1'||n==='8'||n==='.'?'pt-key-lit':''}">${n}</span>`).join('')}</div><span class="pt-lock">Lock it in</span></div></div><span class="pt-note pt-reveal">Alex’s guess is locked</span>`;
  if(kind==='guess'&&team)body=`${question}<div class="pt-team-guesses"><div class="pt-team-guess-group red"><b>Red team</b><div><span>${avatar('av07','Alex')}<b>1.8</b></span><span>${avatar('av19','Sam')}<b>3</b></span></div></div><div class="pt-team-guess-group blue"><b>Blue team</b><div><span>${avatar('av06','Lee')}<b>1</b></span><span>${avatar('av20','Jo')}<b>4</b></span></div></div></div><span class="pt-note pt-reveal">Four guesses · two teams</span>`;
  if(kind==='chance')body=`<span class="pt-label">Second Chance · find the real answer</span>${options(team)}<span class="pt-note pt-reveal">The real answer is 2 · Sam earns +1</span>`;
  if(kind==='chance'&&team)body=body.replace('class="pt-picked"','class="pt-picked teammate"').replace('Sam’s pick','Sam · Red').replace('Sam earns +1','Sam adds +1 to Red');
  if(kind==='double')body=`${avatar('av07','Alex')}<div class="pt-own-number"><small>Your guess</small><b>1.8</b></div><span class="pt-double-action">Double Down</span><div class="pt-points pt-reveal"><span>Closest <b>+3</b></span><span>Double Down <b>+2</b></span><strong>= 5</strong></div><span class="pt-note pt-reveal">Answer: 2 · Alex was closest</span>`;
  if(kind==='double'&&team)body=body.replace('Your guess','Alex · Red').replace('Alex was closest','Alex adds 5 to Red');
  if(kind==='score')body=team
    ? `<span class="pt-label">Two teammates. One score.</span><div class="pt-team-result red"><div class="pt-team-score red" aria-label="Red team total: six points"><span>Red team</span><strong class="pt-team-final">6</strong><i class="pt-count pt-count-zero" aria-hidden="true">0</i><i class="pt-count pt-count-three" aria-hidden="true">3</i><i class="pt-count pt-count-five" aria-hidden="true">5</i></div><div class="pt-contributions"><span>${image('avatars/av07.png','Alex')}<b>Alex +5</b><small>3 closest + 2 Double Down</small></span><span>${image('avatars/av19.png','Sam')}<b>Sam +1</b><small>Hidden real answer</small></span></div></div><div class="pt-team-result blue"><div class="pt-team-score blue"><span>Blue team</span><strong>0</strong></div><div class="pt-team-members">${avatar('av06','Lee')}${avatar('av20','Jo')}</div></div><span class="pt-note">Highest team score wins</span>`
    : `<span class="pt-label">This round’s points</span><div class="pt-score-row winner">${image('avatars/av07.png','Alex')}<b>Alex</b><strong>+5</strong></div><div class="pt-score-row">${image('avatars/av19.png','Sam')}<b>Sam</b><strong>+1</strong></div><div class="pt-score-row">${image('avatars/av06.png','Lee')}<b>Lee</b><strong>0</strong></div><span class="pt-note">Closest + Double Down · hidden answer bonus</span>`;
  return `<div class="pt-stage pt-${kind}${team?' pt-is-team':''}" data-party-example="${kind}">${team&&!['players','score'].includes(kind)?teamStrip:''}${body}</div>`;
}
