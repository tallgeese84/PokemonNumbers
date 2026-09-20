const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../assets/pokemon-catalog.js');
test('catalogue has all 1025 species plus 314 distinct artwork-backed forms',()=>{
  assert.equal(C.ids.length,1339);assert.equal(new Set(C.ids).size,C.ids.length);
  for(let id=1;id<=1025;id++)assert.ok(C.byId[id]);
  assert.ok(C.ids.every(id=>C.byId[id].name && C.byId[id].species>=1 && C.byId[id].species<=1025));
  assert.equal(C.byId[144].legendary,true);assert.equal(C.byId[151].legendary,true);
});
test('every remaining form is reachable after the original species are collected',()=>{
  const caught=Array.from({length:1025},(_,i)=>i+1);
  let next;
  while((next=C.nextCatch(caught,false,()=>0))!==null){assert.ok(!caught.includes(next));caught.push(next);}
  assert.equal(caught.length,1339);assert.deepEqual(C.remaining(caught),[]);
});
test('the final Mega remains catchable even after all legendary species are owned',()=>{
  const mega=C.ids.find(id=>C.byId[id].mega),caught=C.ids.filter(id=>id!==mega);
  assert.equal(C.nextCatch(caught,true,()=>0.5),mega);
  assert.equal(C.nextCatch(caught,false,()=>0.5),mega);
});
test('first catch stays Pikachu and exhausted rare pools fall back without duplicates',()=>{
  assert.equal(C.nextCatch([],false),25);
  const caught=[...C.rareIds];const next=C.nextCatch(caught,true,()=>0);
  assert.ok(C.normalIds.includes(next));assert.ok(!caught.includes(next));
  assert.equal(C.nextCatch(C.ids,true),null);
});
