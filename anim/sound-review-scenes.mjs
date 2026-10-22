const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const art=(src,cls='')=>`<img class="${cls}" src="../${src}" alt="">`;
export function example(row){
 let content='';
 switch(row.scene){
  case 'stack':content=`<div class="mini-stack motion">${art('items/penny.webp')}${art('items/penny.webp')}${art('items/penny.webp')}</div>${art('items/door.webp','big-object')}`;break;
  case 'coins':content=`${art('icons/coin-v2.png','motion')}<span>+25 coins</span>`;break;
  case 'stars':content=`<span class="stars">${art('icons/flair/star.png')}${art('icons/flair/star.png')}${art('icons/flair/star.png')}</span>`;break;
  case 'winner':content=`${art('avatars/av07.png','motion')}${art('icons/reactions/trophy.png')}<span>1st</span>`;break;
  case 'gacha':content=`${art('icons/gacha-capsule-open.png','motion')}${art('avatars/av07.png')}`;break;
  case 'timer':content=`${art('icons/reactions/alarm.png')}<span class="motion">3 · 2 · 1</span>`;break;
  case 'lobby':content=`${art('avatars/av07.png')}${art('avatars/av19.png','motion')}<span>Lobby</span>`;break;
  case 'reaction':content=art('icons/reactions/grin.png','motion');break;
  case 'powerup':content=`${art('icons/powerups/percentage-buffer.png','motion')}<span>Your turn</span>`;break;
  case 'highstakes':content=`${art('items/poker-chip.webp','motion')}<span class="mini-button">Check</span>`;break;
  case 'answer':content='<span class="mini-button motion">Lock it in</span>';break;
  case 'error':content=`${art('icons/reactions/crossed.png','motion')}<span>Try again</span>`;break;
  case 'menu':content=`${art('icons/toolbar-menu.png','motion')}<span>Menu</span>`;break;
  default:content='<span class="mini-button motion">Select</span>';
 }
 return `<div class="example ${row.scene}" role="img" aria-label="Example: ${esc(row.description)}"><div class="example-line">${content}</div><span class="example-caption">Tap Play to animate this example</span></div>`;
}
