export const HL_MESSAGE_BOTTLE = 'anim/high-low-art/answer-bottle-v11.webp';
export const HL_EMPTY_BOTTLE = 'anim/high-low-art/empty-bottle.png';

// The same jagged seam lines up on both glass halves and on the crack flash.
export function highLowBottlePieces(src, className = '') {
  return `<span class="hl-bottle-pieces ${className}" aria-hidden="true">
    <img class="hl-bottle-left" src="${src}" alt="" draggable="false">
    <img class="hl-bottle-right" src="${src}" alt="" draggable="false">
    <svg class="hl-bottle-seam" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M53 10 L47 34 L54 46 L46 65 L51 87" fill="none" stroke="#184d60" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/><path d="M53 10 L47 34 L54 46 L46 65 L51 87" fill="none" stroke="#d8ffff" stroke-width="1" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>
  </span>`;
}
