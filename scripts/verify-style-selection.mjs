import assert from 'node:assert/strict';
import {styleSelectedIds,styleSelectionPatch} from '../anim/style-selection.mjs';
const owned=['a','b','c'];
assert.deepEqual(styleSelectedIds({},'boards',owned,['b']),['b']);
assert.deepEqual(styleSelectedIds({randomPool:{boards:{a:true}}},'boards',owned,['b']),['b'],'Legacy fixed item wins over a paused random pool');
assert.deepEqual(styleSelectedIds({randomEquip:{boards:true},randomPool:{boards:{a:true}}},'boards',owned,['b']),['a']);
assert.deepEqual(styleSelectedIds({randomEquip:{boards:true}},'boards',owned,['b']),owned);
assert.deepEqual(styleSelectedIds({randomEquip:{reactions:true},randomPool:{reactions:{c:true}}},'reactions',owned,['b']),['b','c']);
assert.deepEqual(styleSelectedIds({randomEquip:{backgrounds:true}},'backgrounds',['none','plain','a'],['none'],['a']),['a']);
for(const ids of [[],['b'],['a','c']]){
 const patch=styleSelectionPatch('boards',ids),profile={randomPool:{boards:patch['randomPool/boards']},randomEquip:{boards:true}};
 assert.deepEqual(styleSelectedIds(profile,'boards',owned,['b']),ids,'Explicit selection survives reload, including an empty set');
 assert.deepEqual(styleSelectedIds(profile,'boards',[...owned,'new-unlock'],['b']),ids,'A new unlock is not automatically equipped');
}
assert.deepEqual(styleSelectedIds({randomPool:{boards:{__equipped:true,a:true,unowned:true}}},'boards',owned,['b']),['a']);
console.log('PASS: legacy fixed/random migration, equipped-only selection, empty sets, new unlocks and ownership filtering.');
