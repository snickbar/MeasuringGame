export const HL_MESSAGE_BOTTLE = 'anim/high-low-art/message-bottle-upright.webp';
export const HL_EMPTY_BOTTLE = 'anim/high-low-art/empty-bottle-upright.webp';
export const HL_ANSWER_BOTTLE = 'anim/high-low-art/answer-bottle-v11.webp';

// The intact note can show during the wind-up. Both fragments always use empty glass.
export function highLowBottlePieces({ className = '', hasNote = false, ocean = false } = {}) {
  const glass = ocean ? 'anim/high-low-art/empty-bottle.webp' : HL_EMPTY_BOTTLE;
  const seam = ocean ? 'M53 10 L47 34 L54 46 L46 65 L51 87' : 'M9 46 L30 57 L49 53 L59 67 L73 64 L95 73';
  return `<span class="hl-bottle-pieces ${className}" aria-hidden="true">
    <img class="hl-bottle-left" src="${glass}" alt="" draggable="false">
    <img class="hl-bottle-right" src="${glass}" alt="" draggable="false">
    ${hasNote ? `<img class="hl-bottle-intact" src="${HL_MESSAGE_BOTTLE}" alt="" draggable="false">` : ''}
    <svg class="hl-bottle-seam" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="${seam}" fill="none" stroke="#184d60" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/><path d="${seam}" fill="none" stroke="#d8ffff" stroke-width="1" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>
  </span>`;
}
