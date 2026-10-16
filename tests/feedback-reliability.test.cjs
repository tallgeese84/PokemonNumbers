const {test}=require('node:test'),assert=require('node:assert/strict');
const Core=require('../nightly-priority-core.js');
const NOW=Date.parse('2026-10-16T14:00:00Z');
function setup(){let online=true,visible=true,now=NOW,reply='bad',count=0,seq=0;const timers=new Map(),saved=new Map();
 const client=Core.create({student:'Hana',catalog:{maths:x=>x==='p3-place'},config:()=>({url:'https://script.google.com/macros/s/SYNTHETIC/exec',secret:'synthetic-only-secret-length-30'}),storage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)},key:'synthetic',hash:async()=> 'synthetic-hash',now:()=>now,online:()=>online,visible:()=>visible,setTimer:(fn,ms)=>{timers.set(++seq,{fn,ms});return seq;},clearTimer:id=>timers.delete(id),request:async()=>{count++;if(reply==='bad')throw Error('sensitive server text must not leak');return {ok:true,type:'cors',text:async()=>JSON.stringify({ok:true,service:'family-learning-mirror',planApi:1,student:'Hana',plan:reply})};}});
 return {client,timers,saved,count:()=>count,setReply:x=>reply=x,setOnline:x=>online=x,setVisible:x=>visible=x,tick:x=>now+=x};}
const plan=()=>({schema:1,id:'hana-nightly-2026-10-16',revision:1,student:'Hana',timeZone:'America/Chicago',reviewedDate:'2026-10-15',sessionDate:'2026-10-16',generatedAt:'2026-10-16T05:00:00Z',sourceExportedAt:'2026-10-16T01:00:00Z',subjects:{maths:{focus:'Try a place-value check.',skills:['p3-place']}}});
test('safe failure diagnostics and bounded retries clear on recovery without exposing error text',async()=>{
 const e=setup();assert.equal(await e.client.refresh(true),false);let h=e.client.report().diagnostics;assert.equal(h.reasonCode,'FETCH_FAILED');assert.equal(h.consecutiveFailures,1);assert([...e.timers.values()].some(t=>t.ms===30000));assert(!JSON.stringify(e.client.report()).includes('sensitive'));
 await e.client.refresh(true);assert([...e.timers.values()].some(t=>t.ms===120000));await e.client.refresh(true);assert.equal(e.timers.size,0);assert.equal(e.count(),3);
 e.setReply(plan());assert(await e.client.refresh(true));h=e.client.report().diagnostics;assert.equal(h.reasonCode,'READY');assert.equal(h.consecutiveFailures,0);assert.equal(e.timers.size,0);assert(h.lastSuccessAt);assert(!JSON.stringify([...e.saved.values()]).includes('synthetic-only-secret'));
});
test('offline and hidden tabs cannot issue scheduled retries; explicit invalidation clears scoped diagnostics',async()=>{
 const e=setup();await e.client.refresh(true);const [timerId,retry]=[...e.timers.entries()].find(([id,t])=>t.ms===30000);e.timers.delete(timerId);e.setVisible(false);retry.fn();await new Promise(r=>setImmediate(r));assert.equal(e.count(),1);e.setOnline(false);await e.client.refresh(true);assert.equal(e.client.report().diagnostics.reasonCode,'OFFLINE');assert.equal(e.timers.size,0);e.client.invalidate();assert.equal(e.client.report().diagnostics.lastSuccessAt,null);
});
test('publication receipt, preview, adoption, start and conflict are separate; expired plans stay expired',async()=>{
 const e=setup();e.setReply(plan());await e.client.refresh(true);assert(e.client.report().received);assert.equal(e.client.report().active,null);assert(e.client.preview());assert.equal(e.client.report().active,null);const p=e.client.adopt();assert(e.client.report().active.adoptedAt);assert.equal(e.client.report().active.startedAt,null);e.client.started(Core.identity(p));assert(e.client.report().active.startedAt);
 const changed=plan();changed.subjects.maths.focus='A conflicting same revision';e.setReply(changed);await e.client.refresh(true);assert.equal(e.client.report().diagnostics.reasonCode,'REVISION_CONFLICT');assert.equal(e.client.plan().subjects.maths.focus,p.subjects.maths.focus);
 e.tick(86400000);e.setReply(plan());await e.client.refresh(true);assert.equal(e.client.report().diagnostics.reasonCode,'EXPIRED_PLAN');assert.equal(e.client.plan(),null);assert.equal(e.client.adopt(),null);
});
