const {test}=require('node:test'),assert=require('node:assert/strict');
const Daily=require('../reading-daily.js'),R=require('../reading-core.js'),C=require('../learning-core.js'),A=require('../reading-art.js');
const day='2026-10-03',at=Date.parse(day+'T16:00:00Z');
const sessions=qs=>({s:{id:'s',rev:1,days:{},questions:Object.fromEntries(qs.map((q,i)=>[i,{id:String(i),startedAt:at+i,completedAt:at+i+1,day,section:'read',responses:[{correct:true}],...q}]))}});
const daily=(stage,extra={})=>({dailyVersion:1,dailyDay:day,dailyCycle:0,dailyStage:stage,kind:'hunt',...extra});
test('four stages retain their order and cannot be skipped using old practice or time alone',()=>{
 assert.deepEqual(Daily.STAGES.map(s=>s.minutes),[2,4,3,3]);
 const qs=[{section:'add',activeMs:3600000},daily('sounds',{activeMs:120000,completedAt:null,responses:[]})];
 assert.equal(Daily.progress(sessions(qs),day).stage.id,'sounds');
 qs.push(daily('sounds',{activeMs:1}),daily('sounds',{activeMs:1}));
 assert.equal(Daily.progress(sessions(qs),day).stage.id,'words');
 assert.equal(Daily.progress(sessions(qs),'2026-10-04').stage.id,'sounds');
 assert.equal(Daily.progress(sessions(qs),day,1).ms,0);
});
test('finishing a story needs a story and a comprehension task, and midnight time stays with its day',()=>{
 const qs=[];for(const s of Daily.STAGES.slice(0,3))qs.push(daily(s.id,{activeMs:s.minutes*60000}),daily(s.id));
 qs.push(daily('story',{kind:'dailyStory',teach:true,activeMs:180000}));
 assert.equal(Daily.progress(sessions(qs),day).complete,false);
 qs.push(daily('story',{kind:'dailyQuiz'}));assert.equal(Daily.progress(sessions(qs),day).complete,true);
 qs.push(daily('story',{kind:'dailyStory',storyId:'second',teach:true}));
 assert.equal(Daily.progress(sessions(qs),day).complete,false,'finish the current book and its own question before celebrating');
 qs.push(daily('story',{kind:'dailyQuiz',storyId:'second'}));assert.equal(Daily.progress(sessions(qs),day).complete,true);
 qs[0].activeByDay={[day]:1000,'2026-10-04':119000};assert.equal(Daily.progress(sessions(qs),day).stage.id,'sounds');
});
test('word practice gives new tricky words a guided check and later practice instead of endless introductions',()=>{
 const state={passed:{1:at,2:at}},qs=Array.from({length:4},()=>daily('words'));
 const status={day,cycle:0,stage:Daily.STAGES[1]},first=Daily.round(sessions(qs),state,status,()=>.5);
 const intro=first.items.find(it=>it.kind==='heartTeach'),check=first.items.find(it=>it.kind==='heart');
 assert.ok(intro&&check);assert.equal(intro.item,check.item);assert.ok(check.teach);assert.equal(check.phase,'guided');
 const earlier=[{...intro,day:'2026-10-02',dailyDay:'2026-10-02'}];
 const later=Daily.round(sessions([...qs,...earlier]),state,status,()=>.5);
 assert.ok(!later.items.some(it=>it.kind==='heartTeach'&&it.item===intro.item));
 assert.ok(later.items.some(it=>it.kind==='heart'&&it.item===intro.item&&!it.teach));
});
test('story help supplies irregular words even when their individual letters are known',()=>{
 const known=R.route(1).add.flatMap(g=>Array.from({length:2},()=>({kind:'hunt',item:'g:'+g})));
 const round=Daily.round(sessions(known),{}, {day,cycle:0,stage:Daily.STAGES[3]},()=>.5);
 assert.ok(round.items[0].book.pages.some(p=>/\ba\b/i.test(p.t)));
 assert.ok(round.items[0].supplied.includes('a'));
});
test('all daily stages produce usable tasks across every curriculum route',()=>{
 let seed=7;const rnd=()=>(seed=seed*16807%2147483647)/2147483647;
 for(let n=1;n<=R.LAST;n++){
  const state={passed:Object.fromEntries(Array.from({length:n-1},(_,i)=>[i+1,at]))};
  for(const stage of Daily.STAGES)for(let attempt=0;attempt<5;attempt++){
   const round=Daily.round({},state,{day,cycle:0,stage},rnd);assert.ok(round.items.length,n+' '+stage.id);
   assert.equal(round.daily.stage,stage.id);
   for(const it of round.items){
    if(it.kind==='read'||it.kind==='dailyAction'){
     assert.ok(it.options.some(o=>R.clean(o.w)===it.answer));assert.equal(new Set(it.options.map(o=>o.w)).size,it.options.length);assert.ok(it.options.length>=2);
     assert.ok(it.options.every(o=>A.has(R.clean(o.w))),JSON.stringify(it));
     if(!it.teach)assert.ok(Daily.taughtWord(it.word,n,new Set(R.knownSounds({},n))));
    }
    if(it.kind==='build')for(const p of it.parts)assert.ok(it.tiles.includes(p.g));
    if(it.kind==='dailyStory'){assert.equal(it.book.pages.length,3);assert.ok(it.teach);assert.ok(it.supplied.length||n>1);}
    if(it.kind==='dailyQuiz')assert.ok(it.quiz.o[it.answer]);
   }
  }
 }
});
test('daily metadata and active day splits survive tracker and mirror; page taps are never mastery',()=>{
 let now=at;const t=new C.Tracker({now:()=>now});t.begin({section:'read',...daily('story',{kind:'dailyStory',teach:true})});now+=2000;t.tick();const q=t.question();t.answer('done',true);
 assert.equal(q.activeByDay[day],2000);assert.equal(C.independent(q),false);
 const backup=require('../drive-mirror.js').backup({sessions:t.sessions,settings:{goalMinutes:12}});assert.equal(backup.settings.goalMinutes,12);
 assert.equal(Daily.progress(backup.sessions,day).stages[3].ms,2000);assert.match(Daily.report(backup.sessions,day),/not proof of reading aloud/);
});
