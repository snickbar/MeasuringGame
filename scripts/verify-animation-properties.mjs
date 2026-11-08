// An animation that runs forever and changes anything but transform, opacity or filter makes the browser restyle or repaint the page on
// every frame, for as long as the screen is open. On a slow phone that was most of the sluggishness (Home, Shop, Monthly and the how-to-play
// popups each cost 20-50% of the main thread doing nothing visible). This fails when a NEW endless animation does that.
// The names below are the ones that already existed. To fix one, animate a transform/opacity instead (see the Monthly ring, mcPulse) and
// delete it from this list; the test also fails if a listed name no longer needs to be there, so the list only shrinks.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const { list } = createRequire(import.meta.url)('./production-files.cjs');

const SAFE = new Set(['transform', 'opacity', 'filter', 'translate', 'scale', 'rotate', 'offset-distance', 'offset-rotate', 'visibility', 'animation-timing-function', 'animation-composition']);
const KNOWN = new Set(`anim/game-polish.css|wlSceneCloud anim/home-motion.css|hsLampSwitch anim/mode-tutorial.css|mtFill anim/mode-tutorial.css|mtSel anim/mode-tutorial.css|mtSmFill
anim/party-finale.css|winnerCardShine anim/ui-delight.css|skelShimmer anim/ui-delight.css|bdShine anim/which-bigger-summary.css|svSwordTrail anim/which-bigger-summary.css|svShieldShine
index.html|hostUnlockGlow index.html|gachaFreeGlow index.html|hsActGlow index.html|hsMineGlow index.html|hsWinGlow index.html|hsShine index.html|wbSpot index.html|wbBestGlow
index.html|wbShineText index.html|achReady index.html|achShine index.html|winnerInset index.html|hlPulseLow index.html|hlPulseHigh index.html|hlGoldShine index.html|starOrbit
index.html|perfectGlow index.html|twFinShine index.html|wlStarShine`.split(/\s+/));

const found = new Set();
for (const file of list().filter(f => /\.(css|html)$/.test(f))) {
  const css = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const endless = new Set();
  // Rules (outside @keyframes) that use an animation name together with "infinite".
  for (const rule of css.matchAll(/\{([^{}]*)\}/g)) {
    if (!/\binfinite\b/.test(rule[1])) continue;
    for (const decl of rule[1].matchAll(/animation(?:-name)?\s*:([^;]*)/g)) for (const w of decl[1].match(/[A-Za-z_][\w-]*/g) || []) endless.add(w);
  }
  for (const m of css.matchAll(/@keyframes\s+([\w-]+)\s*\{/g)) {
    let depth = 1, i = m.index + m[0].length;
    while (depth && i < css.length) { if (css[i] === '{') depth++; else if (css[i] === '}') depth--; i++; }
    const props = new Set([...css.slice(m.index + m[0].length, i - 1).matchAll(/([\w-]+)\s*:/g)].map(p => p[1]));
    const slow = [...props].filter(p => !SAFE.has(p) && !p.startsWith('--'));
    if (slow.length && endless.has(m[1])) found.add(file + '|' + m[1]);
  }
}
const fresh = [...found].filter(k => !KNOWN.has(k));
assert.equal(fresh.length, 0, 'New endless animation(s) that change something other than transform/opacity/filter: ' + fresh.join(', ') +
  '. They repaint or restyle the page every frame and make slow phones sluggish. Animate a transform or opacity instead (a strip or circle that slides/scales), as the Monthly ring does.');
const stale = [...KNOWN].filter(k => !found.has(k));
assert.equal(stale.length, 0, 'These no longer need to be on the known list in scripts/verify-animation-properties.mjs, remove them: ' + stale.join(', '));
console.log(`Endless animations: ${found.size} older ones still change more than transform/opacity (listed); none new.`);
