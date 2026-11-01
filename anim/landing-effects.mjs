// Pure clock-based effects: seeking, skipping and late joins draw the same frame.
export function landingSurfaceFor(scenery) {
  if (scenery === 'snow') return 'snow';
  if (scenery === 'beach' || scenery === 'desert') return 'sand';
  if (scenery === 'underwater') return 'bubbles';
  if (scenery === 'space') return 'dust';
  if (['grass', 'forest', 'farm', 'stadium', 'enchanted'].includes(scenery)) return 'grass';
  return 'hard';
}

export function drawLandingEffect(ctx, {surface, x, y, age, width, objectMm = 1, reduced = false, stacked = false}) {
  if (stacked) surface = 'hard';
  const lifetime = surface === 'bubbles' || surface === 'water' ? .65 : .48;
  if (reduced || !Number.isFinite(age) || age < 0 || age >= lifetime) return;
  const p = age / lifetime, fade = (1 - p) ** 1.4;
  const heft = Math.max(.85, Math.min(2, .8 + Math.log10(Math.max(1, objectMm)) / 3));
  // Keep tiny units' impacts local, even at the close-up camera scale.
  const size = Math.max(.35, Math.min(1.6, width / 65)) * heft;
  const edge = Math.max(2, width * .22);
  const oval = (cx, cy, rx, ry, fill = true) => {
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); fill ? ctx.fill() : ctx.stroke();
  };
  ctx.save(); ctx.globalAlpha = fade * .8; ctx.lineWidth = 1.2 * size;
  if (stacked || surface === 'hard') {
    // A short contact accent, rather than outdoor dust on a table or another object.
    ctx.strokeStyle = '#f7e9ca'; ctx.lineCap = 'round';
    for (const dir of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(x + dir * (edge + p * 9 * size), y - size);
      ctx.lineTo(x + dir * (edge + (4 + p * 15) * size), y - (2 + p * 3) * size); ctx.stroke();
    }
  } else if (surface === 'water' || surface === 'bubbles') {
    ctx.strokeStyle = '#e1fbff'; ctx.fillStyle = '#c5f3ff';
    for (const dir of [-1, 1]) {
      oval(x + dir * edge, y, (3 + p * 17) * size, (1 + p * 3) * size, false);
      for (let j = 0; j < 3; j++) {
        const dx = dir * (edge + (3 + j * 5) * p * size);
        const lift = surface === 'bubbles' ? p * (15 + j * 7) : Math.sin(Math.PI * p) * (9 + j * 5);
        oval(x + dx, y - lift * size, (1.4 + j * .25) * size, (1.8 + j * .3) * size, surface === 'water');
      }
    }
  } else {
    ctx.fillStyle = {snow:'#f5fcff', sand:'#f3cf94', dust:'#c9c6d4', grass:'#b9cb8b'}[surface] || '#e9dcc0';
    for (const dir of [-1, 1]) for (let j = 0; j < 4; j++) {
      const dx = dir * (edge + p * (8 + j * 5) * size);
      const lift = Math.sin(Math.PI * p) * (3 + j * 3) * size;
      const r = (surface === 'snow' ? 1.4 : 1.8) + p * 1.4;
      oval(x + dx, y - lift, r * size, (surface === 'snow' ? r : r * .65) * size);
    }
  }
  ctx.restore();
}
