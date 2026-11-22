import assert from 'node:assert/strict';
import {scoringExample,practiceBoardPick} from '../anim/learning-tutorials.mjs';
for(const [guess,accuracy]of [[10,100],[7,70],[13,70],[3,30],[17,30],[20,0],[25,0]]){
  assert(Math.abs(scoringExample(guess).accuracy-accuracy)<1e-9,`${guess} against 10 should be ${accuracy}%`);
}
assert.equal(scoringExample(17).distance,7);assert.equal(scoringExample(17).away,70);
assert.equal(practiceBoardPick(['chalk'],'chalk',()=>.9),'chalk');
assert.equal(practiceBoardPick(['paper','chalk'],'paper',()=>.9),'chalk');
assert.equal(practiceBoardPick(['paper','chalk'],'chalk',()=>0),'paper');
assert.equal(practiceBoardPick([],null),'paper');
assert.equal(practiceBoardPick(['locked-or-unknown'],null),'paper');
console.log('Scoring examples and fixed/random/default practice board selections passed.');
