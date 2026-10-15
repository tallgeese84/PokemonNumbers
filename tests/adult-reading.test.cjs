const {test}=require('node:test'),assert=require('node:assert/strict');
const A=require('../adult-reading.js'),C=require('../learning-core.js'),R=require('../reading-core.js'),M=require('../drive-mirror.js');
const day='2026-10-12',at=Date.parse(day+'T16:00:00Z');
const wrap=qs=>({s:{id:'s',rev:2,days:{},questions:Object.fromEntries(qs.map((q,i)=>[i,{id:String(i),section:'read',startedAt:at+i,completedAt:at+i+1,day,dailyDay:day,dailyCycle:0,dailyVersion:2,observer:'grown-up',activeMs:1000,...q}]))}});
const observations=stage=>[{dailyStage:stage,kind:'adultSound',adultOutcome:'helped'},{dailyStage:stage,kind:'adultSound',adultOutcome:'not-yet'}];
test('adult completion requires observed attempts and explicit finish, never time or old app-choice answers',()=>{
 let qs=[{dailyStage:'sounds',dailyVersion:1,activeMs:999999,responses:[{correct:true}]}];
 assert.equal(A.progress(wrap(qs),day).ms,0);
 qs.push(...observations('sounds'),{dailyStage:'sounds',activeMs:999999});assert.equal(A.progress(wrap(qs),day).stage.id,'sounds');
 qs.push({dailyStage:'sounds',kind:'adultStageEnd',teach:true});assert.equal(A.progress(wrap(qs),day).stage.id,'words');
 assert.equal(A.progress(wrap(qs),'2026-10-13').ms,0);
 assert.equal(A.progress(wrap(qs),day,1).ms,0);
});
test('all four parts can be completed below pacing targets without false mastery',()=>{
 const qs=A.STAGES.flatMap(s=>[...observations(s.id),{dailyStage:s.id,kind:'adultStageEnd',teach:true}]);
 const p=A.progress(wrap(qs),day);assert.equal(p.complete,true);assert.equal(p.target,720000);assert(p.ms<720000);assert(p.stages.every(s=>s.independent===0));
 const first=wrap(qs.slice(0,6));assert.equal(A.sitting(A.progress(first,day)).breakReady,true);
 assert.equal(A.progress(JSON.parse(JSON.stringify(first)),day).stage.id,'writing');
});
test('fresh session uses a small sound set and restricts words to those letters',()=>{
 const state=R.freshState();for(const stage of A.STAGES){const round=A.round({},state,{day,cycle:0,stage});assert.deepEqual(round.items[0].adultLetters,['s','a','t']);assert(round.items.length>=3);assert.equal(round.daily.version,2);
  for(const it of round.items)if(it.parts)assert(it.parts.every(p=>['s','a','t'].includes(p.play||p.g)));
 }
 const writing=A.round({},state,{day,cycle:0,stage:A.STAGES[2]}).items;assert(writing.some(x=>x.writingMode==='copy'));assert(writing.some(x=>x.writingMode==='memory'));
});
test('teacher letters, frozen daily selection and unsuitable-word fallback remain safe',()=>{
 const status={day,cycle:0,stage:A.STAGES[1]};assert.deepEqual(A.normalizeLetters('M, a t m'),['m','a','t']);
 const round=A.round({},{adultLetters:['m','a','t']},status);assert(round.items.some(x=>x.word==='am'));assert(round.items.filter(x=>x.parts).every(x=>x.parts.every(p=>['m','a','t'].includes(p.g))));
 const history=wrap([{kind:'adultSound',dailyStage:'sounds',adultLetters:['m','a','t'],g:'m'}]);
 assert.deepEqual(A.focus(history,{adultLetters:['s','i','p']},status),['m','a','t']);
 const fallback=A.round({},{adultLetters:['b','q']},status);assert(fallback.items.filter(x=>x.kind!=='adultStageEnd').every(x=>x.kind==='adultSound'&&x.fallback));
});
test('helped and not-yet outcomes finish an observation honestly; models cannot produce unaided credit',()=>{
 for(const requested of ['independent','helped','not-yet']){
  const t=new C.Tracker({now:()=>at});t.begin({section:'read',observer:'grown-up',item:'adult:sound:s',kind:'adultSound',dailyVersion:2,dailyDay:day,dailyStage:'sounds'});const q=t.question();
  if(requested==='independent')t.help('sound played');assert.equal(t.observe(requested),requested==='independent'?'helped':requested);assert(q.completedAt);assert.equal(t.current,null);assert.equal(C.independent(q),false);
 }
 const t=new C.Tracker({now:()=>at});t.begin({section:'read',observer:'grown-up',item:'adult:sound:s'});const q=t.question();t.observe('independent');assert(C.independent(q));assert.equal(R.itemStats(t.sessions)['g:s'],undefined);
});
test('adult evidence survives merge/export and reports copying separately from memory',()=>{
 const ink={version:1,strokes:[[[20,30],[40,50]]],inputs:['pen']};
 const sessions=wrap([{kind:'adultWrite',dailyStage:'writing',word:'s',writingMode:'copy',adultOutcome:'independent'},{kind:'adultWrite',dailyStage:'writing',word:'s',writingMode:'memory',writingSurface:'tablet',writingSample:ink,adultOutcome:'helped'}]);
 sessions.legacy={id:'legacy',rev:8,days:{},questions:{q:{id:'q',word:'pin',dailyVersion:1}}};const before=JSON.stringify(sessions.legacy);
 const exported=M.backup({sessions,settings:{goalMinutes:12}}),t=new C.Tracker();t.merge(exported.sessions);assert.equal(JSON.stringify(t.sessions.legacy),before);
 const report=A.report(t.sessions,day);assert.match(report,/s \(copy, paper\): independent/);assert.match(report,/s \(memory, tablet\): helped/);assert.equal(exported.build,97);assert.deepEqual(t.sessions.s.questions[1].writingSample,ink);
 assert.match(require('../scripts/daily-report.cjs').report(t.sessions,{},day).text,/Adult-guided literacy/);
});
