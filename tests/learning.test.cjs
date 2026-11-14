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


test('guided Play prioritizes subtraction in every practice cycle',()=>{
  for(let start=0;start<32;start+=8){
    const cycle=Array.from({length:8},(_,i)=>C.missionSection(start+i));
    assert.equal(cycle[0],'sub');assert.equal(cycle.filter(x=>x==='sub').length,6);
    assert.equal(cycle.filter(x=>x==='add').length,1);assert.equal(cycle.filter(x=>x==='count').length,1);
  }
});
test('counting a visible remainder cannot promote the new covered subtraction step',()=>{
  const qs=Array.from({length:6},(_,i)=>record(i,'2026-09-17',{section:'sub',skill:'sub',a:5,b:1+i%4,expected:4-i%4}));
  assert.equal(C.planFor('sub','sub',sessions(qs)).level,0);
  qs.forEach(q=>q.support='covered pictures');
  assert.equal(C.planFor('sub','sub',sessions(qs)).level,1);
  qs[5].helped=true;
  assert.equal(C.planFor('sub','sub',sessions(qs)).level,0);
});

/* ---------- v98: adding and taking away climb in small earned steps ---------- */
function facts(stage,pairs,extra={}){let i=facts.n=(facts.n||1000);return pairs.map(([a,b,ok=true,sec='add'])=>{i++;facts.n=i;return {section:sec,skill:sec,id:'f'+i,a,b,expected:stage.format==='result'?(sec==='sub'?a-b:a+b):b,range:stage.range,support:stage.support,format:stage.format,level:99,day:'2026-11-01',startedAt:1.8e12+i*2000,completedAt:1.8e12+i*2000+900,responses:ok?[{value:1,correct:true}]:[{value:0,correct:false},{value:1,correct:true}],helped:false,...extra};});}
const SMALL=[[1,1],[1,2],[2,1],[2,2],[1,3],[3,1]],BIG=[[4,3],[5,2],[6,3],[2,7],[4,4],[3,5]];
test('each step changes one thing, and a missing part is met with pictures before bare numbers',()=>{
  const S=C.ARITHMETIC;assert.equal(S.length,9);
  for(let i=1;i<S.length;i++){const a=S[i-1],b=S[i];assert.ok(b.range!==a.range||b.support!==a.support||b.format!==a.format);}
  const m=S.findIndex(s=>s.format==='missingB');
  assert.deepEqual([S[m].range,S[m].support],[5,'pictures']);
  assert.ok(S.findIndex(s=>s.id==='m10-num')>S.findIndex(s=>s.id==='m10-pic'));
  assert.ok(S.findIndex(s=>s.id==='r10-num')>S.findIndex(s=>s.id==='r10-pic'),'pictures come back when the numbers grow');
  assert.equal(C.stagesFor('sub')[0].support,'covered pictures');assert.equal(C.stagesFor('sub')[4].support,'pictures');
});
test('old history is replayed by what was asked, not by its old level number',()=>{
  const S=C.ARITHMETIC,by=id=>S.find(s=>s.id===id);
  // passed within 5 (pictures, then numbers), then strong with bare numbers within 10
  const qs=[...facts(by('r5-pic'),SMALL),...facts(by('r5-num'),SMALL),...facts(by('r10-num'),BIG),...facts(by('r10-num'),BIG)];
  const p=C.planFor('add','add',sessions(qs));
  assert.equal(p.id,'m5-pic','bare-number successes also earn the picture step, then the bare-number step');
  assert.equal(p.steps,9);assert.equal(p.next.id,'m10-pic');
  // guessing at bare-number missing parts within 10 neither earns nor loses the gentler picture step
  const guesses=facts(by('m10-num'),[[1,4,false],[6,3,false],[1,4,false],[2,1,false],[6,3,false]],{helped:true});
  assert.equal(C.planFor('add','add',sessions([...qs,...guesses])).id,'m5-pic');
});
test('needing help with bare numbers does not push a child off the picture step',()=>{
  const S=C.ARITHMETIC,by=id=>S.find(s=>s.id===id);
  const qs=[...facts(by('r5-pic'),SMALL),...facts(by('r5-num'),SMALL),...facts(by('r10-num'),[[7,1,false],[4,4,false],[3,7,false],[6,4,false]],{helped:true})];
  assert.equal(C.planFor('add','add',sessions(qs)).id,'r10-pic');
});
test('from 10 upward a step cannot be earned on tiny facts alone',()=>{
  const S=C.ARITHMETIC,by=id=>S.find(s=>s.id===id);
  const base=[...facts(by('r5-pic'),SMALL),...facts(by('r5-num'),SMALL)];
  assert.equal(C.planFor('add','add',sessions([...base,...facts(by('r10-pic'),SMALL),...facts(by('r10-pic'),SMALL)])).id,'r10-pic');
  assert.equal(C.planFor('add','add',sessions([...base,...facts(by('r10-pic'),[...SMALL.slice(0,4),[4,3],[5,4]])])).id,'r10-num');
});
test('take-away keeps covered pictures as its own evidence and steps down after repeated difficulty',()=>{
  const S=C.stagesFor('sub'),by=id=>S.find(s=>s.id===id);
  const sub=p=>p.map(([a,b,ok=true])=>[a,b,ok,'sub']);
  const up=[...facts(by('r5-pic'),sub([[2,1],[3,1],[4,2],[5,3],[5,1],[4,1]]))];
  assert.equal(C.planFor('sub','sub',sessions(up)).id,'r5-num');
  const hard=facts(by('r5-num'),sub([[5,4,false],[2,1,false],[3,2,false],[5,4],[3,2]]),{});
  assert.equal(C.planFor('sub','sub',sessions([...up,...hard])).id,'r5-pic');
});
