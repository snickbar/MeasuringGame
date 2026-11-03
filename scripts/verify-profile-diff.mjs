import assert from 'node:assert/strict';
import {diffPaths} from '../anim/profile-diff.mjs';
const before={coins:10,stats:{a:1,b:2},hist:[1,2],gone:{x:1},same:{y:{z:1}}};
const after={coins:15,stats:{a:1,b:3,c:0.30000000000000004},hist:[1,2,3],same:{y:{z:1}},fresh:{k:true}};
assert.deepEqual(diffPaths(before,after),{coins:15,'stats/b':3,'stats/c':0.30000000000000004,hist:[1,2,3],gone:null,fresh:{k:true}});
assert.deepEqual(diffPaths(before,before),{});
assert.deepEqual(diffPaths(null,{a:1}),{a:1});
console.log('PASS: profile diff sends only changed paths (numbers, nested objects, arrays whole, removals as null).');
