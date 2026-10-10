const test=require('node:test'),assert=require('node:assert/strict');
const G=require('../grownup-gate.js');
function storage(){const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),m};}

test('sum questions are two-digit × one-digit with a matching answer',()=>{
 const g=G.create({mode:'sum'});
 for(let i=0;i<300;i++){const q=g.question(),[a,b]=q.text.match(/\d+/g).map(Number);assert.ok(a>=12&&a<=19&&b>=3&&b<=9,q.text);assert.equal(q.answer,a*b);}
});

test('PIN is stored as a salted hash, checked, limited after repeated misses and cleared on reset',()=>{
 const saved=globalThis.localStorage;globalThis.localStorage=storage();
 try{
  let t=0;const g=G.create({mode:'pin',key:'test_pin',now:()=>t});
  assert.equal(g.hasPin(),false);
  for(const bad of ['','123','123456789','12a4'])assert.equal(g.setPin(bad),false,bad);
  assert.equal(g.setPin('2468'),true);assert.equal(g.hasPin(),true);
  const raw=globalThis.localStorage.getItem('test_pin');assert.ok(!raw.includes('2468'),'PIN itself is never stored');
  assert.equal(g.attempt('1357'),'wrong');assert.equal(g.attempt('2468'),'ok');
  for(let i=0;i<4;i++)assert.equal(g.attempt('0000'),'wrong');
  assert.equal(g.attempt('0000'),'wait');assert.equal(g.attempt('2468'),'wait','the right PIN also waits during the cooldown');
  t+=61000;assert.equal(g.attempt('2468'),'ok');
  assert.equal(g.unlocked(),false);g.unlock();assert.equal(g.unlocked(),true);t+=121000;assert.equal(g.unlocked(),false,'unlock expires');
  g.clearPin();assert.equal(g.hasPin(),false);
 }finally{globalThis.localStorage=saved;}
});

test('the same PIN gives different stored hashes on different devices',()=>{
 const saved=globalThis.localStorage;
 try{
  globalThis.localStorage=storage();const a=G.create({mode:'pin',key:'k'});a.setPin('2468');const ha=JSON.parse(globalThis.localStorage.getItem('k'));
  globalThis.localStorage=storage();const b=G.create({mode:'pin',key:'k'});b.setPin('2468');const hb=JSON.parse(globalThis.localStorage.getItem('k'));
  assert.notEqual(ha.hash,hb.hash);assert.equal(G.digest('2468',ha.salt),ha.hash);
 }finally{globalThis.localStorage=saved;}
});
