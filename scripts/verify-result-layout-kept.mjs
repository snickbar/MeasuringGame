// The party result layout (data-play-layout=party) is cleared by restoreHighLow() on every non-question phase.
// applyPhase must put it back on the reveal/summary screens, or the papers/score cards get cut by a flat edge under the board.
import fs from 'node:fs';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const a = html.indexOf('focusedPlayLayout?.restoreHighLow()'), b = html.indexOf('focusedPlayLayout?.keepParty(hudEl)');
if (a < 0 || b < 0 || b < a || b - a > 400) { console.error('FAIL: applyPhase must call keepParty(hudEl) right after restoreHighLow() for reveal/summary'); process.exit(1); }
console.log('ok: result layout is kept on reveal/summary');

// The power-up tray pads the score sidebar down. The score column must still reach up behind the tray (never start under it with a flat edge),
// so powerup-ui.mjs publishes --sc-pu next to every padding it sets, and play-layout.css uses it on .score-col.
const pu = fs.readFileSync(new URL('../anim/powerup-ui.mjs', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../anim/play-layout.css', import.meta.url), 'utf8');
const sets = (pu.match(/side\.style\.paddingTop = `/g) || []).length;
const publishes = (pu.match(/setProperty\('--sc-pu'/g) || []).length;
const clears = (pu.match(/removeProperty\('--sc-pu'\)/g) || []).length;
if (!sets || publishes < sets || clears < 2) { console.error('FAIL: powerup-ui.mjs must publish --sc-pu whenever it pads the sidebar and clear it whenever it clears the padding'); process.exit(1); }
if (!/\.score-col\{margin-top:calc\(-1 \* var\(--sc-pu,0px\)\)/.test(css)) { console.error('FAIL: play-layout.css must pull .score-col up by --sc-pu'); process.exit(1); }
console.log('ok: score column reaches up behind the power-up tray');

// The second-chance ("answers") phase is also a party screen: without the layout the score column starts flat under the board.
if (!/phase === "answers"\) && data\.settings\?\.mode !== "teamworlds"\) focusedPlayLayout\?\.keepParty\(hudEl\)/.test(html)) { console.error('FAIL: applyPhase must keep the party layout in the second-chance (answers) phase too'); process.exit(1); }
console.log('ok: second-chance phase keeps the party layout');
