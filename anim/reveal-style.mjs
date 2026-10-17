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
