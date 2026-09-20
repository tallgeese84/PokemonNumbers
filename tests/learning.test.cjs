const {test}=require('node:test');const assert=require('node:assert/strict');const C=require('../learning-core.js');
function clock(){let now=Date.parse('2026-09-17T15:00:00Z'),seq=0;const t=new C.Tracker({now:()=>now,id:()=>String(++seq)});return {t,step(ms=1000){now+=ms;t.tick();},set(ms){now=ms;},now:()=>now};}
const meta={section:'add',skill:'add',a:1,b:4,expected:5,range:5,support:'pictures',format:'result',level:0};
test('home, collections, rewards and hidden pages do not count as practice',()=>{const {t,step}=clock();step();t.setSection('games');step();t.setSection('team');step();t.setSection('add');t.begin(meta);step();t.setBlocked(true);step();t.setBlocked(false);t.setVisible(false);step();t.setVisible(true);step();const s=C.summarize(t.sessions,'2026-09-17');assert.equal(s.practiceMs,2000);assert.equal(s.collectionMs,1000);assert.equal(s.foregroundMs,6000);});
test('thinking counts up to 60 seconds, ordinary taps cannot silently unpause',()=>{const {t,step}=clock();t.begin(meta);for(let i=0;i<90;i++)step();assert.equal(t.question().activeMs,60000);assert.equal(t.idle,true);t.interact();step();assert.equal(t.question().activeMs,60000);t.resume();step();assert.equal(t.question().activeMs,61000);});
test('a suspended process never backfills sleeping time',()=>{const {t,step}=clock();t.begin(meta);step();step(120000);assert.equal(t.question().activeMs,1000);});
test('answers after help are supported successes, never independent mastery',()=>{const {t,step}=clock();t.begin(meta);step();t.help('pictures');step();t.answer(5,true);const s=C.summarize(t.sessions,'2026-09-17');assert.equal(s.completed,1);assert.equal(s.independent,0);assert.equal(s.helped,1);assert.equal(s.medianMs,null);});
test('resuming a question preserves first response, help and accumulated active duration',()=>{const {t,step}=clock();const ref=t.begin(meta);step();t.answer(3,false);t.help('guided');t.setSection('home');step(5000);t.setSection('add');t.begin(meta,ref);step();t.answer(5,true);const q=C.allQuestions(t.sessions)[0];assert.equal(q.activeMs,2000);assert.equal(q.responses[0].value,3);assert.equal(q.firstResponseMs,1000);assert.equal(q.helped,true);assert.equal(C.allQuestions(t.sessions).length,1);});
function record(i,day='2026-09-17',extra={}){const a=1+i%4,b=5-a;return {...meta,id:String(i),a,b,day,startedAt:Date.parse(day+'T16:00:00Z')+i*2000,completedAt:Date.parse(day+'T16:00:01Z')+i*2000,responses:[{value:5,correct:true}],firstResponseMs:25000,...extra};}
const sessions=qs=>({s:{id:'s',rev:1,days:{},questions:Object.fromEntries(qs.map((q,i)=>[i,q]))}});
test('six varied independent answers advance within the same day without a speed requirement',()=>{
  const qs=Array.from({length:6},(_,i)=>record(i));
  assert.equal(C.planFor('add','add',sessions(qs.slice(0,5))).level,0);
  const p=C.planFor('add','add',sessions(qs));
  assert.equal(p.level,1);assert.equal(p.range,5);assert.equal(p.support,'numbers');
});
test('repeated facts, help and manual overrides do not prove readiness',()=>{
  for(const extra of [{a:1,b:4},{helped:true},{manual:true},{unverifiedResume:true}]){
    const qs=Array.from({length:12},(_,i)=>record(i,'2026-09-17',extra));
    assert.equal(C.planFor('add','add',sessions(qs)).level,0);
  }
});
test('one earlier mistake is allowed but the last three answers must be independent',()=>{
  const qs=Array.from({length:6},(_,i)=>record(i,'2026-09-17',{helped:i===1}));
  assert.equal(C.planFor('add','add',sessions(qs)).level,1);
  qs[1].helped=false;qs[5].helped=true;
  assert.equal(C.planFor('add','add',sessions(qs)).level,0);
});
test('counting can climb 5 to 10 to 20 in one session and keeps skills separate',()=>{
  const qs=[];
  for(let i=0;i<12;i++){
    const p=C.planFor('count','count',sessions(qs));
    qs.push(record(i,'2026-09-17',{section:'count',skill:'count',level:p.level,range:p.range,support:'pictures',a:0,b:0,expected:1+i%4}));
    assert.equal(C.planFor('count','count',sessions(qs)).level,i<5?0:i<11?1:2);
  }
  assert.equal(C.planFor('count','count',sessions(qs)).range,20);
  assert.equal(C.planFor('add','add',sessions(qs)).level,0);
});
test('easier capped questions cannot promote the wider level',()=>{
  const qs=Array.from({length:6},(_,i)=>record(i));
  qs.push(...Array.from({length:6},(_,i)=>record(i+6,'2026-09-17',{level:1,support:'numbers'})));
  assert.equal(C.planFor('add','add',sessions(qs)).range,10);
  qs.push(...Array.from({length:12},(_,i)=>record(i+12,'2026-09-17',{level:2,support:'numbers',range:5})));
  assert.equal(C.planFor('add','add',sessions(qs)).level,2);
});
test('three failures in five at the current level restore one support step',()=>{const qs=Array.from({length:10},(_,i)=>record(i));qs.push(...[10,11,12].map(i=>record(i,'2026-09-18')));qs.push(...[13,14,15,16,17].map(i=>record(i,'2026-09-18',{level:1,support:'numbers',helped:i>14})));assert.equal(C.planFor('add','add',sessions(qs)).level,0);});
test('dashboard comparisons keep representations and levels separate and require samples',()=>{const a=C.summarize(sessions([record(1)]),'2026-09-17');const b=C.summarize(sessions(Array.from({length:10},(_,i)=>record(i,'2026-09-16',{range:10}))),'2026-09-16');assert.equal(C.comparisons(a,b)[0].accuracyChange,null);assert.equal(C.comparisons(a,b)[0].previousN,0);});
test('replayed session snapshots are idempotent and older snapshots cannot erase updates',()=>{const {t,step}=clock();t.begin(meta);step();t.answer(5,true);const copy=structuredClone(t.sessions);t.merge(copy);t.merge(copy);assert.equal(C.summarize(t.sessions,'2026-09-17').attempted,1);copy[t.sessionId].rev=0;copy[t.sessionId].questions={};t.merge(copy);assert.equal(C.allQuestions(t.sessions).length,1);});
test('Madison calendar dates and rolling periods handle DST without a fixed UTC offset',()=>{assert.equal(C.dayKey(Date.parse('2026-03-08T05:30:00Z')),'2026-03-07');assert.equal(C.dayKey(Date.parse('2026-03-09T05:30:00Z')),'2026-03-09');assert.equal(C.shiftDay('2026-03-01',-1),'2026-02-28');});

test('active time is split accurately across midnight in Madison',()=>{let now=Date.parse('2026-09-18T04:59:59.000Z'),i=0;const t=new C.Tracker({now:()=>now,id:()=>String(++i)});t.begin(meta);now+=2000;t.tick();assert.equal(C.summarize(t.sessions,'2026-09-17').practiceMs,1000);assert.equal(C.summarize(t.sessions,'2026-09-18').practiceMs,1000);});
test('returning after a five-minute break creates a new session for fatigue comparisons',()=>{const {t,step}=clock();t.begin(meta);step();t.answer(5,true);const original=t.sessionId;t.setSection('home');step(301000);t.begin(meta);assert.notEqual(t.sessionId,original);});
