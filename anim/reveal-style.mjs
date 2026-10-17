// Visual choices only: none of these change measurements, counts or arrival times.
export function landingStyleFor(object) {
  const id = object.id || '';
  if (/(?:ball|marble|orange|apple|pumpkin|globe)$/.test(id) || ['die', 'clown-nose'].includes(id)) return 'round';
  if (/(?:marshmallow|pillow|sponge|gummy|plush|rubber-duck|rubber-chicken|pool-noodle|donut|chocolate-drop)/.test(id)) return 'soft';
  return object.mm >= 2000 ? 'heavy' : 'firm';
}

export function landingPose(style, age, reduced = false) {
  const duration = { heavy: .55, firm: .38, soft: .75, round: .85 }[style] || .38;
  if (reduced || age <= 0 || age >= duration) return { squash: 0, rock: 0, lift: 0 };
  const p = age / duration, fade = (1 - p) ** 2;
  if (style === 'round') return { squash: .035 * Math.sin(Math.PI * p) * fade, rock: .065 * Math.sin(p * Math.PI * 4) * fade, lift: Math.sin(p * Math.PI) ** 2 * fade * .045 };
  if (style === 'soft') return { squash: .17 * Math.sin(p * Math.PI * 3) * fade, rock: 0, lift: 0 };
  return { squash: (style === 'heavy' ? .025 : .055) * Math.sin(p * Math.PI * 2) * fade, rock: 0, lift: 0 };
}

export const SCENERY = {
  tabletop: { sky: ['#f5e6ce', '#fff7e8'], floor: '#d8b586', ink: '#a27b54' },
  room: { sky: ['#e7e1f0', '#f7f0e6'], floor: '#cfb99a', ink: '#aaa0b5' },
  park: { sky: ['#b5d8ee', '#eff7ee'], floor: '#cfdfb6', ink: '#87ad8a' },
  city: { sky: ['#c5d9ee', '#edf2f2'], floor: '#d2d2c5', ink: '#94a6b5' },
  seaside: { sky: ['#b5dfed', '#f3f8ee'], floor: '#ead6aa', ink: '#83b7bd' },
};

export function sceneryFor(object) {
  const id = object.id || '';
  if (/(?:whale|shark|squid|fish|canoe|ship|titanic|carrier|surfboard|shell|lighthouse|crab|boat)/.test(id)) return 'seaside';
  if (/(?:statue|tower|building|bridge|big-ben|monument|space-needle|gateway|colosseum|bus|truck|car$|streetlight)/.test(id)) return 'city';
  if (/(?:door|bed|piano|guitar|broom|chair|sofa|television|fridge|lamp|yoga-mat)/.test(id)) return 'room';
  return object.mm < 600 ? 'tabletop' : 'park';
}

// Scenery uses a quiet, illustrated style and stays behind the measured objects.
export function drawScenery(ctx, { kind, width: w, height: h, floorY, time, reduced, dark, cloudImage, grassImage, cloudAlpha }) {
  const kit = SCENERY[kind], t = reduced ? 0 : time;
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, dark ? '#17263c' : kit.sky[0]);
  sky.addColorStop(1, dark ? '#293b4a' : kit.sky[1]);
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
  ctx.save(); ctx.strokeStyle = dark ? '#53616a' : kit.ink; ctx.lineWidth = 2;
  const box = (x, y, bw, bh, color, r = 4) => {
    ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, bw, bh, r); ctx.fill(); ctx.stroke();
  };
  const outdoor = ['park', 'city', 'seaside'].includes(kind);
  if (outdoor && cloudImage?.naturalWidth) {
    ctx.globalAlpha = cloudAlpha * .5;
    for (let i = 0; i < 4; i++) {
      const cw = 48 + i * 9, x = w * (.08 + i * .28) + Math.sin(t * .11 + i) * 7;
      const y = h * (.15 + (i % 2) * .22) + Math.sin(t * .08 + i) * 1.5;
      ctx.drawImage(cloudImage, x - cw / 2, y, cw, cw * cloudImage.naturalHeight / cloudImage.naturalWidth);
    }
  }
  ctx.globalAlpha = .4;
  // A little parallax follows the climb without dragging full-size scenery up the screen.
  const horizon = Math.min(h * .78, Math.max(h * .62, floorY - 18));
  if (kind === 'city') {
    for (let i = 0; i < 8; i++) {
      const bw = w / 8 + 3, bh = 28 + ((i * 31) % 65), x = i * w / 8;
      box(x, horizon - bh, bw, bh, dark ? '#374857' : '#b3c5cf', 3);
      ctx.fillStyle = dark ? '#7c887d' : '#edf0df';
      for (let y = horizon - bh + 10; y < horizon - 6; y += 15) ctx.fillRect(x + 8, y, 6, 6);
    }
  } else if (kind === 'park') {
    for (let i = 0; i < 3; i++) {
      const x = w * (.08 + i * .43), sway = Math.sin(t * .6 + i) * 1.3;
      ctx.fillStyle = dark ? '#53645c' : '#9cba8b';
      ctx.beginPath(); ctx.ellipse(x + sway, horizon - 29, 25, 35, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x, horizon); ctx.lineTo(x + sway, horizon - 38); ctx.stroke();
    }
  } else if (kind === 'room') {
    box(w * .06, h * .11, w * .26, h * .31, dark ? '#3c5263' : '#e0edf0', 7);
    ctx.beginPath(); ctx.moveTo(w * .19, h * .11); ctx.lineTo(w * .19, h * .42); ctx.moveTo(w * .06, h * .265); ctx.lineTo(w * .32, h * .265); ctx.stroke();
    box(w * .67, h * .16, w * .23, h * .17, dark ? '#4e4a59' : '#e7d5bd', 5);
    ctx.fillStyle = dark ? '#73806f' : '#abc4a2';
    ctx.beginPath(); ctx.moveTo(w * .69, h * .31); ctx.lineTo(w * .77, h * .22); ctx.lineTo(w * .83, h * .28); ctx.lineTo(w * .88, h * .24); ctx.lineTo(w * .88, h * .31); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, horizon); ctx.lineTo(w, horizon); ctx.stroke();
    ctx.globalAlpha = .12 + .02 * Math.sin(t * .35);
    ctx.fillStyle = '#fff7cf'; ctx.beginPath(); ctx.moveTo(w * .06, h * .42); ctx.lineTo(w * .32, h * .42); ctx.lineTo(w * .58, horizon); ctx.lineTo(w * .2, horizon); ctx.fill();
  } else if (kind === 'tabletop') {
    ctx.beginPath(); ctx.moveTo(0, h * .54); ctx.lineTo(w, h * .54); ctx.stroke();
    box(w * .06, h * .12, w * .27, h * .22, dark ? '#49515b' : '#ecdbbf', 7);
    ctx.fillStyle = dark ? '#71836d' : '#9cb699';
    ctx.beginPath(); ctx.ellipse(w * .195, h * .23, 14, 19, -.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(w * .18, h * .30); ctx.lineTo(w * .205, h * .19); ctx.stroke();
    // A tiny hanging plant sways above the table, away from the main objects.
    const x = w * .9, sway = Math.sin(t * .55) * 1.5;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + sway, h * .13); ctx.stroke();
    box(x - 13 + sway, h * .13, 26, 15, dark ? '#65594f' : '#cfa784', 5);
    ctx.fillStyle = dark ? '#637765' : '#91b287';
    for (let j = -1; j <= 1; j++) { ctx.beginPath(); ctx.ellipse(x + sway + j * 9, h * .13 - 5, 6, 12, j * .6, 0, Math.PI * 2); ctx.fill(); }
  } else {
    ctx.fillStyle = dark ? '#365a6b' : '#9bcdd3'; ctx.fillRect(0, horizon, w, Math.max(0, floorY - horizon));
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      for (let x = 0; x <= w; x += 4) {
        const y = horizon + 8 + i * 12 + Math.sin(x / 24 + t * .5 + i) * 1.4;
        if (!x) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  if (floorY < h) {
    ctx.fillStyle = dark ? '#303e38' : kit.floor; ctx.fillRect(0, Math.max(0, floorY), w, h - floorY);
    ctx.globalAlpha = .25;
    ctx.beginPath(); ctx.moveTo(0, floorY + 2); ctx.lineTo(w, floorY + 2); ctx.stroke();
    if (kind === 'tabletop' || kind === 'room') {
      for (let i = 1; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(0, floorY + i * 17); ctx.lineTo(w, floorY + i * 17); ctx.stroke(); }
    }
    ctx.globalAlpha = 1;
  }
  if (kind === 'park' && grassImage?.naturalWidth) {
    const tileW = 220, gh = tileW * grassImage.naturalHeight / grassImage.naturalWidth;
    const sway = Math.sin(t * .5) * 1.2;
    for (let x = -tileW; x < w; x += tileW) ctx.drawImage(grassImage, x + sway, floorY - gh * 127 / 145, tileW + 1, gh);
  }
  ctx.restore();
}
