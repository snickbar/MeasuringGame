import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {MODE_TUTORIALS} from '../anim/mode-tutorial.mjs';
import {HIGH_LOW_EXAMPLES} from '../anim/high-low-tutorial.mjs';
import {PARTY_TUTORIAL_EXAMPLE,partyTutorialScene} from '../anim/party-tutorial.mjs';
import {MORE_MODE_TUTORIALS,extraTutorialScene} from '../anim/more-tutorials.mjs';
const source=fs.readFileSync('index.html','utf8');
const route=source.match(/  function tourKeyFor\(settings\) \{[\s\S]*?\n  \}/)[0];
const isHl=source.match(/  const isHlSettings = [^\n]+/)[0];
const ctx=vm.createContext({});vm.runInContext(isHl+'\n'+route,ctx);
assert.equal(ctx.tourKeyFor({mode:'teamworlds',variant:'hl'}),'hl');
for(const mode of ['teamworlds','teamvteam','bluff','highstakes'])assert.equal(ctx.tourKeyFor({mode}),mode);
assert.equal(ctx.tourKeyFor({mode:'classic'}),'party');
assert.equal(ctx.tourKeyFor({mode:'party'}),'party');
assert.equal(ctx.tourKeyFor({mode:'party',solo:true}),null);
assert.equal(ctx.tourKeyFor(null),null);
const daily=MODE_TUTORIALS.daily.slides.map(s=>s.text).join(' ');
assert.match(daily,/10 coins/);assert.match(daily,/streak.*milestone bonuses/);
assert.doesNotMatch(daily,/closer.*more coins/);
assert.equal(MODE_TUTORIALS.hl.autoplay,true);
assert.equal(MODE_TUTORIALS.hl.slides.length,7);
for(const [id,picks] of Object.entries(HIGH_LOW_EXAMPLES)){
  const safe=picks.low<=10&&picks.high>=10&&picks.high/picks.low<=2.5;
  assert.equal(picks.passed,safe,id+' verdict');
  assert(MODE_TUTORIALS.hl.slides.some(s=>s.example===id),id+' example is shown');
}
assert.match(source,/slideMs: modeTutorialUI.duration\(key\)/,'Room and local preview use the same pacing');
assert.equal(PARTY_TUTORIAL_EXAMPLE.targetMm/PARTY_TUTORIAL_EXAMPLE.unitMm,PARTY_TUTORIAL_EXAMPLE.answer);
for(const mode of ['quick','party','teamvteam']){
  assert.equal(MODE_TUTORIALS[mode].autoplay,true);
  assert.equal(MODE_TUTORIALS[mode].slides.length,6);
  for(const slide of MODE_TUTORIALS[mode].slides){
    const html=partyTutorialScene(slide.lesson,{team:mode==='teamvteam',quick:mode==='quick'});
    assert(!/<(?:input|textarea|select|button)\b/.test(html),'Watch-only lesson');
    for(const match of html.matchAll(/src="([^"]+)"/g))assert(fs.existsSync(match[1]),'Art exists: '+match[1]);
  }
}
for(const [mode,def] of Object.entries(MORE_MODE_TUTORIALS)){
  assert(MODE_TUTORIALS[mode]===def);assert(def.autoplay);assert(def.slides.length>=3);
  for(const slide of def.slides){
    const html=extraTutorialScene(slide.lesson,{});
    assert(html.length>100,mode+' lesson content');
    assert(!/<(?:input|textarea|select|button)\b/.test(html),'No gameplay input');
    for(const match of html.matchAll(/src="([^"]+)"/g))assert(fs.existsSync(match[1]),'Art exists: '+match[1]);
  }
}
assert.match(MODE_TUTORIALS.survival.slides.find(s=>s.lesson==='svShield').text,/75%/);
assert.match(MODE_TUTORIALS.worlds.slides.find(s=>s.lesson==='stars').text,/above 60%, 75% and 90%/);
assert.match(MODE_TUTORIALS.highstakes.slides.find(s=>s.lesson==='hsCarry').text,/several players.*nobody correct/);
assert.match(extraTutorialScene('average'),/85%/);
assert.match(extraTutorialScene('hsPayout'),/Pot: 60/);
assert.equal((extraTutorialScene('hsPayout').match(/\+30/g)||[]).length,2);
assert.match(extraTutorialScene('monthlyLevels'),/All 15 questions/);
console.log('Mode tutorials: actual High/Low room routing, other party modes, solo exclusion and fixed Daily reward wording passed.');
