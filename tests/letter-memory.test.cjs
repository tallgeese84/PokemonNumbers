const {test}=require('node:test'),assert=require('node:assert/strict');
const L=require('../letter-memory.js'),A=require('../adult-reading.js'),C=require('../learning-core.js');
const wrap=qs=>({s:{id:'s',rev:1,days:{},questions:Object.fromEntries(qs.map((q,i)=>[String(i),{id:String(i),section:'read',observer:'grown-up',kind:'adultLetterRecall',letterRecallVersion:1,completedAt:q.startedAt+1,adultOutcome:'independent',...q}]))}});
const attempt=(letter,letterSkill,letterCase,day,extra={})=>({letter,letterSkill,letterCase,day,startedAt:Date.parse(day+'T16:00:00Z'),...extra});
function learned(letters,days){return letters.flatMap(l=>days.flatMap(day=>L.SKILLS.flatMap(s=>L.CASES.map(c=>attempt(l,s,c,day)))));}
test('all 26 letters have separate name/sound checks for both cases; q sound is explicitly qu',()=>{
 assert.equal(new Set(L.ORDER).size,26);const items=L.checks(L.LETTERS,{},'2026-10-14');assert.equal(items.length,104);assert.equal(new Set(items.map(i=>i.item)).size,104);
 assert.equal(items.find(i=>i.letter==='q'&&i.letterSkill==='sound'&&i.letterCase==='upper').displayGlyph,'Qu');assert.equal(items.find(i=>i.letter==='q'&&i.letterSkill==='name'&&i.letterCase==='lower').displayGlyph,'q');
 assert(items.every(i=>!i.teach&&!i.buddyCue&&!i.picture));
});
test('remembering names never supplies sound or opposite-case credit; two different days are required',()=>{
 const qs=[attempt('m','name','upper','2026-10-12'),attempt('m','name','upper','2026-10-12',{startedAt:Date.parse('2026-10-12T17:00:00Z')})];
 assert.equal(L.progress(wrap(qs)).m.name.upper.secure,false);
 qs.push(attempt('m','name','upper','2026-10-13'));let p=L.progress(wrap(qs)).m;assert(p.name.upper.secure);assert(!p.name.lower.secure);assert(!p.name.secure);assert(!p.sound.secure);
 qs.push(...learned(['m'],['2026-10-14','2026-10-15']));p=L.progress(wrap(qs)).m;assert(p.secure);assert.deepEqual(L.summary(wrap(qs)),{names:1,sounds:1,both:1,total:26});
});
test('models, helped attempts and same-day retries cannot manufacture later-day recall',()=>{
 const qs=[attempt('s','sound','lower','2026-10-12',{adultOutcome:'helped',helped:true}),attempt('s','sound','lower','2026-10-12',{startedAt:Date.parse('2026-10-12T17:00:00Z')}),attempt('s','sound','lower','2026-10-13')];
 assert(!L.progress(wrap(qs)).s.sound.lower.secure);
 qs.push(attempt('s','sound','lower','2026-10-14'));assert(L.progress(wrap(qs)).s.sound.lower.secure);
 qs.push(attempt('s','sound','lower','2026-10-15',{kind:'letterModel',startedAt:Date.parse('2026-10-15T15:00:00Z')}),attempt('s','sound','lower','2026-10-15'));
 assert(!L.progress(wrap(qs)).s.sound.lower.secure);
 // Sound listening does not supply a letter name.
 const names=[...learned(['a'],['2026-10-12']),attempt('a','sound','lower','2026-10-13',{kind:'letterModel',startedAt:Date.parse('2026-10-13T15:00:00Z')}),attempt('a','name','upper','2026-10-13')];
 assert(L.progress(wrap(names)).a.name.upper.secure);
});
test('selection progresses through the complete alphabet in small sets and returns to weaker forms',()=>{
 let qs=[],met=new Set();for(let i=0;i<90&&met.size<26;i++){
  const day=C.shiftDay('2026-10-12',i),set=L.select(wrap(qs),{day});assert.equal(set.length,3);set.forEach(l=>met.add(l));qs.push(...learned(set,[day]));
 }
 assert.equal(met.size,26);
 const history=learned(['s','a','t'],['2026-10-12','2026-10-13']);let set=L.select(wrap(history),{day:'2026-10-14'});assert(set.includes('p'));assert.equal(set.filter(g=>!['s','a','t'].includes(g)).length,1);
 history.push(attempt('s','name','lower','2026-10-14',{adultOutcome:'not-yet'}));set=L.select(wrap(history),{day:'2026-10-15'});assert.equal(set[0],'s');
});
test('teacher selection and saved day/cycle survive reload; completed recall prompts resume once',()=>{
 const day='2026-10-14',status={day,cycle:0,stage:A.STAGES[0]},round=A.round({},{adultLetters:['m','a','t']},status),first=round.items[0];
 const sessions=wrap([{...first,startedAt:Date.parse(day+'T16:00:00Z'),day,dailyDay:day,dailyCycle:0,dailyStage:'sounds',dailyVersion:2}]);
 const resumed=A.round(sessions,{adultLetters:['s','i','p']},status);assert.deepEqual(resumed.items[0].adultLetters,['m','a','t']);assert.equal(resumed.items.length,12);assert(!resumed.items.some(i=>i.item===first.item));
 assert.deepEqual(L.select({},{schoolLetters:['b','q'],day}),['b','q']);assert.equal(L.checks(['b','q'],{},day).length,8);
 assert.equal(L.checks(['m','a','t'],sessions,'2026-10-15').length,12);
});
