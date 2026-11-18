// The party result layout (data-play-layout=party) is cleared by restoreHighLow() on every non-question phase.
// applyPhase must put it back on the reveal/summary screens, or the papers/score cards get cut by a flat edge under the board.
import fs from 'node:fs';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const a = html.indexOf('focusedPlayLayout?.restoreHighLow()'), b = html.indexOf('focusedPlayLayout?.keepParty(hudEl)');
if (a < 0 || b < 0 || b < a || b - a > 400) { console.error('FAIL: applyPhase must call keepParty(hudEl) right after restoreHighLow() for reveal/summary'); process.exit(1); }
console.log('ok: result layout is kept on reveal/summary');
