/* Spoken recall is observed by an adult. Listening, tapping and tracing are
   not evidence that a child can name a letter or produce its sound. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./learning-core.js'));else root.PokeLetterMemory=factory(root.PokeLearning);})(typeof globalThis!=='undefined'?globalThis:this,function(C){
'use strict';
const VERSION=1,ORDER='satpinmdgockeurhbfljvwyxqz'.split(''),LETTERS='abcdefghijklmnopqrstuvwxyz'.split('');
const SKILLS=['name','sound'],CASES=['upper','lower'];
const normalize=values=>[...new Set((values||[]).map(g=>g==='qu'?'q':String(g).toLowerCase()).filter(g=>LETTERS.includes(g)))];
const key=(letter,skill,letterCase)=>letter+':'+skill+':'+letterCase;
const day=q=>q.day||q.dailyDay||C.dayKey(q.startedAt);
function events(sessions){return C.allQuestions(sessions||{}).filter(q=>q.section==='read'&&q.letterRecallVersion===VERSION&&LETTERS.includes(q.letter)&&SKILLS.includes(q.letterSkill));}
function isCheck(q){return q.kind==='adultLetterRecall'&&q.observer==='grown-up'&&q.completedAt&&CASES.includes(q.letterCase)&&['independent','helped','not-yet'].includes(q.adultOutcome);}
function isModel(q){return q.kind==='letterModel'||q.helped||q.adultOutcome==='helped'||q.adultOutcome==='not-yet';}
function progress(sessions){
 const history=events(sessions),out={};
 for(const letter of LETTERS){
  const all=history.filter(q=>q.letter===letter),entry={letter,lastAt:0,met:all.some(isCheck)};
  for(const skill of SKILLS){
   const group=all.filter(q=>q.letterSkill===skill),forms={};
   for(const letterCase of CASES){
    const checks=group.filter(q=>isCheck(q)&&q.letterCase===letterCase),firsts=new Map();
    for(const q of checks)if(!firsts.has(day(q)))firsts.set(day(q),q);
    const daily=[...firsts.values()].map(q=>({q,ok:q.adultOutcome==='independent'&&!q.helped&&!group.some(m=>m.startedAt<=q.startedAt&&day(m)===day(q)&&isModel(m))}));
    let retainedDays=0;for(let i=daily.length-1;i>=0&&daily[i].ok;i--)retainedDays++;
    const last=checks.at(-1),secure=retainedDays>=2&&last?.adultOutcome==='independent'&&!last.helped;
    forms[letterCase]={secure:!!secure,attempts:checks.length,retainedDays,lastAt:last?.completedAt||0,status:secure?'Remembered':checks.length?'Practising':'Not checked'};
    entry.lastAt=Math.max(entry.lastAt,forms[letterCase].lastAt);
   }
   entry[skill]={...forms,secure:CASES.every(c=>forms[c].secure)};
  }
  entry.secure=SKILLS.every(s=>entry[s].secure);out[letter]=entry;
 }
 return out;
}
function select(sessions,{schoolLetters=[],day:today=C.dayKey(Date.now()),cycle=0,priorities=[]}={}){
 const all=C.allQuestions(sessions||{}),saved=all.find(q=>q.section==='read'&&q.dailyVersion===2&&q.dailyDay===today&&(q.dailyCycle||0)===cycle&&q.adultLetters?.length);
 if(saved){const letters=normalize(saved.adultLetters);if(letters.length)return letters;}
 const school=normalize(schoolLetters);if(school.length>=2)return school;
 const ps=progress(sessions),met=ORDER.filter(g=>ps[g].met),wanted=new Set(normalize(priorities));
 if(!met.length)return ORDER.slice(0,3);
 const oldest=(a,b)=>Number(wanted.has(b))-Number(wanted.has(a))||ps[a].lastAt-ps[b].lastAt||ORDER.indexOf(a)-ORDER.indexOf(b);
 const learning=met.filter(g=>!ps[g].secure).sort(oldest).slice(0,3),next=ORDER.find(g=>!ps[g].met);
 // At most one new letter after the initial set; revisit older secure letters.
 if(learning.length<3&&next)learning.push(next);
 for(const g of met.filter(g=>!learning.includes(g)).sort(oldest)){if(learning.length>=3)break;learning.push(g);}
 for(const g of ORDER){if(learning.length>=3)break;if(!learning.includes(g))learning.push(g);}
 return learning;
}
function checks(letters,sessions,today,cycle=0,priorities=[]){
 const qs=C.allQuestions(sessions||{}).filter(q=>q.dailyVersion===2&&q.dailyDay===today&&(q.dailyCycle||0)===cycle&&q.dailyStage==='sounds');
 const repeated=qs.filter(q=>q.kind==='adultPracticeMore'&&q.completedAt).at(-1)?.startedAt??-1;
 const done=new Set(qs.filter(q=>isCheck(q)&&q.startedAt>repeated).map(q=>key(q.letter,q.letterSkill,q.letterCase)));
 const chosen=normalize(letters),items=[],offset=[...today].reduce((n,c)=>n+c.charCodeAt(0),cycle)%Math.max(1,chosen.length);
 const mixed=[...chosen.slice(offset),...chosen.slice(0,offset)];
 // Separate name and sound prompts. Interleave letters, and vary the first case
 // each day; never supply an answer automatically before a recall attempt.
 const cases=Number(today.slice(-2))%2?CASES:[...CASES].reverse();
 for(const letterSkill of SKILLS)for(const letterCase of cases)for(const letter of mixed){
  const id=key(letter,letterSkill,letterCase);if(done.has(id))continue;
  const glyph=letterCase==='upper'?letter.toUpperCase():letter;
  items.push({kind:'adultLetterRecall',item:'adult:letter:'+id,letterRecallVersion:VERSION,letterSkill,letterCase,letter,g:letter,word:glyph,answer:letter,displayGlyph:letter==='q'&&letterSkill==='sound'?glyph+'u':glyph});
 }
 // Same letters, separate weak name/sound/case checks. Saved completed checks
 // are never repeated just because a plan arrives. No lesson or promotion is forced.
 const wanted=new Set(normalize(priorities)),ps=progress(sessions);
 if(wanted.size)items.sort((a,b)=>{
  const af=ps[a.letter][a.letterSkill][a.letterCase],bf=ps[b.letter][b.letterSkill][b.letterCase];
  return Number(wanted.has(b.letter))-Number(wanted.has(a.letter))||Number(af.secure)-Number(bf.secure)||af.attempts-bf.attempts||af.lastAt-bf.lastAt;
 });
 return items;
}
function summary(sessions){const ps=Object.values(progress(sessions));return {names:ps.filter(p=>p.name.secure).length,sounds:ps.filter(p=>p.sound.secure).length,both:ps.filter(p=>p.secure).length,total:26};}
function report(sessions){
 const ps=progress(sessions),s=summary(sessions),lines=[`Spoken letter recall: names ${s.names}/26; common sounds ${s.sounds}/26 (both cases, adult observed).`];
 for(const l of LETTERS)if(ps[l].met)lines.push(`${l.toUpperCase()} ${l}: name upper/lower ${ps[l].name.upper.status}/${ps[l].name.lower.status}; sound upper/lower ${ps[l].sound.upper.status}/${ps[l].sound.lower.status}.`);
 lines.push('Remembered = unaided first checks on at least two different days, in both cases, without a model earlier that day. This practice indicator is not an aimswebPlus score. Short vowels and common consonant sounds come first; q is practised with u.');
 return lines.join('\n');
}
return {VERSION,ORDER,LETTERS,SKILLS,CASES,normalize,key,events,progress,select,checks,summary,report};
});
