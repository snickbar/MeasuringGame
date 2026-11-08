// Monthly Challenge: the ring pulsing round the level you are on is a transform on a circle behind the number, never an animated
// box-shadow (which the browser has to repaint on every frame). The real-app check is scripts/verify-monthly-ring-browser.cjs.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const html = fs.readFileSync('index.html', 'utf8');
const rule = selector => { const at = html.indexOf(selector + ' {'); assert(at > 0, 'Found ' + selector); return html.slice(at, html.indexOf('}', at) + 1); };
const keyframes = name => { const at = html.indexOf('@keyframes ' + name + ' {'); assert(at > 0, 'Found @keyframes ' + name); return html.slice(at, html.indexOf('} }', at) + 3); };

assert(!/animation:/.test(rule('.mc-node.play .mc-dot')), 'The number itself is not animated');
const ring = rule('.mc-node.play::before');
assert(/animation: mcPulse /.test(ring), 'The circle behind the number pulses');
assert(/z-index: 2/.test(ring) && /z-index: 2/.test(rule('.mc-node.play .mc-dot')), 'The circle and the number share a level, so the number paints on top');
const pulse = keyframes('mcPulse');
assert(/transform: scale\(/.test(pulse), 'The pulse grows the circle with a transform');
assert(!/box-shadow|width|height|left|top|background|border/.test(pulse), 'The pulse changes nothing but the transform (anything else repaints the page on every frame)');
assert(html.includes(':root[data-motion="reduce"] .mc-node.play::before { animation: none; }'), 'Reduce Motion stills the ring');
console.log('Monthly ring: a transform on a circle behind the number, shared level with the number, Reduce Motion stills it.');
