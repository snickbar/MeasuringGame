// Run with node scripts/verify-measurements.cjs. Evaluates only data and pure question helpers.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert/strict');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const arraySource = name => {
  const match = html.match(new RegExp('const ' + name + ' = (\\[[\\s\\S]*?\\n  \\]);'));
  assert(match, 'Missing ' + name);
  return `const ${name} = ${match[1]};`;
};
const measurementStart = html.indexOf('  const MEASUREMENT_GROUPS = {');
const measurementEnd = html.indexOf('\n', html.indexOf('  const OBJECT_BY_ID = ', measurementStart));
const helpersStart = html.indexOf('  function articleFor(obj)');
const helpersEnd = html.indexOf('  // Items with two pictures', helpersStart);
const dailyStart = html.indexOf('  function dailyQuestionFor(c)');
const dailyEnd = html.indexOf('\n  // ---- DOM refs', dailyStart);
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext([
  ...['OBJECTS','HOLIDAY_OBJECT_DEFS','FANTASY_OBJECT_DEFS'].map(arraySource),
  'const HOLIDAY_OBJECTS = HOLIDAY_OBJECT_DEFS.map(d => ({id:d[1],name:d[2],plural:d[3],mm:d[4]}));',
  'const FANTASY_OBJECTS = FANTASY_OBJECT_DEFS.map(d => ({id:d[0],name:d[1],plural:d[2],mm:d[3],properNoun:!!d[5]}));',
  html.slice(measurementStart, measurementEnd),
  html.slice(helpersStart, helpersEnd),
  html.slice(dailyStart, dailyEnd),
  'globalThis.api = {ALL_OBJECTS,OBJECT_BY_ID,MEASUREMENT_GROUPS,MEASUREMENT_DETAILS,MEASUREMENT_TYPES,measurementQuestionPrompt,dailyQuestionFor};',
].join('\n'), sandbox);
const {ALL_OBJECTS: all, OBJECT_BY_ID: objects, MEASUREMENT_GROUPS: groups, MEASUREMENT_DETAILS: details, MEASUREMENT_TYPES: types, measurementQuestionPrompt: prompt, dailyQuestionFor: question} = sandbox.api;
assert.equal(all.length, 553);
assert.equal(objects.size, 553);
const ids = new Set();
for (const [dimension, members] of Object.entries(groups)) {
  assert(types[dimension]);
  for (const id of members) { assert(objects.has(id), 'Unknown measurement ID: '+id); assert(!ids.has(id), 'Duplicate dimension assignment: '+id); ids.add(id); }
}
for (const id of Object.keys(details)) assert(objects.has(id), 'Unknown detail ID: '+id);
for (const [id, mm] of Object.entries({'t-rex':4600,'statue-of-liberty':93000,shuttlecock:85,'baseball-bat':840,necktie:500,mailbox:1400,earbuds:1200,'earbuds-case':60,'grand-canyon':1857000,rainbow:6000000,'soccer-goal':7320,'boeing-737':39500})) assert.equal(objects.get(id).mm, mm, id);
assert.equal(objects.get('t-rex').measurement.dimension,'height');
assert.equal(objects.get('countdown-sign').measurement.dimension,'width');
assert.equal(objects.get('countdown-sign').mm,300,'handheld signboard width, excluding its handle');
assert.match(objects.get('rabbit').measurement.qualifier,/nose to rump.*ears and tail/);
assert.match(objects.get('pearl-necklace').measurement.qualifier,/clasp to clasp.*unclasped.*straight/);
assert.equal(objects.get('pearl-necklace').mm,450);
assert.equal(objects.get('egg-basket').name,'Easter egg carton','preserve the existing saved object ID');
assert.equal(objects.get('egg-basket').mm,160);
assert.equal(objects.get('heart').name,'heart-shaped lollipop');
assert.equal(objects.get('heart').mm,150);
assert.equal(objects.get('heart').measurement.dimension,'length');
assert.match(objects.get('heart').measurement.qualifier,/candy.*stick/);
assert.equal(objects.get('shipping-container').mm,12192,'40-foot shipping container');
assert.equal(question({unitId:'deer',targetId:'shipping-container'}).answer,12192/1800);
assert(prompt(objects.get('penny'),objects.get('t-rex')).endsWith('height of a T. rex?'));
assert.equal(objects.get('earbuds').name, 'wired earbuds');
assert.equal(objects.get('earbuds-case').name, 'wireless earbuds case');
assert.equal(objects.get('necktie').name, 'tied necktie');
assert.equal(objects.get('baseball-bat').name, 'adult baseball bat');
const example = question({unitId:'earbuds',targetId:'grand-canyon'});
assert.equal(example.prompt, 'How many wired earbuds long is the depth of the Grand Canyon?');
assert.equal(example.answer, 1857000 / 1200);
assert(prompt(objects.get('penny'),objects.get('soccer-goal')).includes('the width of a soccer goal (between the inside edges of the posts)'));
assert(prompt(objects.get('penny'),objects.get('statue-of-liberty')).includes('the height of the Statue of Liberty (including the pedestal)'));
assert(prompt(objects.get('penny'),objects.get('earbuds')).includes('of wired earbuds'));
assert(prompt(objects.get('penny'),objects.get('rubiks-cube')).includes('edge length'));
assert(prompt(objects.get('penny'),objects.get('mailbox')).includes('including the above-ground post'));
let pairs = 0;
for (let i=0;i<all.length;i++) {
  const a=all[i]; assert(Number.isFinite(a.mm)&&a.mm>0); assert(types[a.measurement.dimension],a.id);
  for(let j=i+1;j<all.length;j++) {
    const [unit,target]=a.mm<=all[j].mm?[a,all[j]]:[all[j],a];
    const q=question({unitId:unit.id,targetId:target.id});
    assert.equal(q.answer,target.mm/unit.mm);
    assert(!/undefined|NaN|\[object Object\]/.test(q.prompt),q.prompt);
    assert(q.prompt.endsWith('?'));
    assert(q.prompt.includes(`the ${types[target.measurement.dimension].noun} of `));
    pairs++;
  }
}
assert.equal((html.match(/prompt: measurementQuestionPrompt\(unit, target\)/g)||[]).length, 2);
assert(html.includes('return dailyQuestionFor({ unitId: p.u, targetId: p.t });'));
assert(html.includes('dailyQuestionFor({ unitId: p.u.id, targetId: p.t.id })'));
// Syntax-check all inline scripts without starting Firebase or loading the browser app.
for(const [i,m]of [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].filter(m=>!m[1].includes('src=')).entries()) {
  const temp=path.join(require('os').tmpdir(),`measuringgame-measurement-syntax-${process.pid}-${i}.mjs`);
  try { fs.writeFileSync(temp,m[2]); require('child_process').execFileSync(process.execPath,['--check',temp]); }
  finally { if(fs.existsSync(temp))fs.unlinkSync(temp); }
}
console.log(`PASS: ${all.length} object definitions, ${pairs.toLocaleString()} pair prompts/ratios, requested corrections, preserved values, dimension coverage and inline script syntax.`);
console.log('Example: '+example.prompt);
