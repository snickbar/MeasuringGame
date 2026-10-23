import assert from 'node:assert/strict';import fs from 'node:fs';
import {MODE_IDENTITIES,MODE_BACKGROUNDS,modeGradient,screenMode,backgroundPresentation} from '../anim/mode-identity.mjs';
for(const b of MODE_BACKGROUNDS){assert(modeGradient(b.id));assert(fs.existsSync(MODE_IDENTITIES[b.id.slice(5)].art));}
for(const [screen,mode] of Object.entries({'worlds-screen':'worlds','teamworlds-screen':'worlds','survival-screen':'survival','hs-screen':'highstakes','daily-screen':'daily','monthly-screen':'monthly'}))assert.equal(screenMode(screen),mode);
assert.equal(screenMode('hud','solo',{}),'classic','Joined classic room does not inherit previous solo setup');
assert.equal(screenMode('hud','classic',{solo:true}),'quick');
assert.equal(screenMode('hud','classic',{mode:'hlsurvival'}),'survival');
assert.equal(screenMode('create-screen','teamworlds'),'worlds');
assert.equal(screenMode('settings-screen','solo'),null);
assert.deepEqual(backgroundPresentation('none','worlds'),{id:'mode-worlds',image:modeGradient('worlds')});
assert.equal(backgroundPresentation('candy-gumdrops','worlds','month-october').id,'candy-gumdrops','Custom art overrides mode and monthly backgrounds');
assert.equal(backgroundPresentation('mode-survival','worlds').id,'mode-survival','Explicit gradient stays equipped across modes');
assert.equal(backgroundPresentation('plain','worlds').id,'plain');
assert.equal(backgroundPresentation('none',null).id,'none');
console.log('Mode identities: route families, free gradients, custom/explicit/plain precedence and artwork passed.');
