// A ratio of .75 is 25% away from the answer; 1.5 is 50% away.
// Calculate this for each round before averaging, so misses cannot cancel.
export function roundAccuracy(ratio) {
  if (!Number.isFinite(ratio) || ratio < 0) return 0;
  return Math.max(0, Math.min(100, 100 - Math.abs(ratio - 1) * 100));
}

export function formatAccuracy(value) {
  const bounded = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  return Number(bounded.toFixed(1)).toLocaleString('en-US');
}
