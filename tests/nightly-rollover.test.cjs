const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../nightly-priority-core.js');
function env(start){let clock=Date.parse(start),calls=0,offered=null;const data=new Map();
 const client=C.create({student:'Hana',catalog:{maths:id=>id==='p3-place'},config:()=>({url:'https://script.google.com/macros/s/SYNTHETIC/exec',secret:'synthetic-secret-at-least-24-chars'}),storage:{getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)},key:'test',hash:async()=> 'test',now:()=>clock,request:async()=>{calls++;return {ok:true,type:'cors',text:async()=>JSON.stringify({ok:true,service:'family-learning-mirror',planApi:1,student:'Hana',plan:offered})};}});
 const setPlan=date=>offered={schema:1,id:'hana-nightly-'+date,revision:1,student:'Hana',timeZone:'America/Chicago',reviewedDate:new Date(Date.parse(date+'T12:00:00Z')-86400000).toISOString().slice(0,10),sessionDate:date,generatedAt:new Date(clock).toISOString(),sourceExportedAt:new Date(clock-3600000).toISOString(),subjects:{maths:{focus:'Check place value.',skills:['p3-place']}}};
 return {client,setPlan,count:()=>calls,setClock:s=>clock=Date.parse(s)};
}
for(const [before,after,date] of [['2026-10-17T04:59:30Z','2026-10-17T05:00:30Z','2026-10-17'],['2026-11-02T05:59:30Z','2026-11-02T06:00:30Z','2026-11-02']])test('Chicago date rollover bypasses the five-minute throttle: '+date,async()=>{
 const e=env(before);await e.client.refresh();assert.equal(e.count(),1);e.setClock(after);e.setPlan(date);await e.client.refresh();assert.equal(e.count(),2);
 let report=e.client.report();assert.equal(report.delivery.localDate,date);assert.equal(report.delivery.timeZone,'America/Chicago');assert.equal(report.delivery.stage,'received-awaiting-boundary');assert.equal(report.active,null);
 e.client.preview();assert.equal(e.client.report().delivery.stage,'received-awaiting-boundary');const p=e.client.adopt();assert.equal(e.client.report().delivery.stage,'adopted-awaiting-task');e.client.started(C.identity(p));assert.equal(e.client.report().delivery.stage,'work-started');
});
test('future priorities are cached but never forced into today',async()=>{
 const e=env('2026-10-17T01:30:00Z');e.setPlan('2026-10-17');await e.client.refresh(true);const r=e.client.report();assert.equal(r.delivery.stage,'future-plan-cached');assert.equal(r.delivery.nextSession.sessionDate,'2026-10-17');assert.equal(r.active,null);assert.equal(r.received,null);assert.equal(e.client.adopt(),null);
});
