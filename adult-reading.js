/* Adult-led practice. Observations are separate from app-choice mastery.
   Version 1 daily records and every existing reward remain untouched. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./learning-core.js'),require('./reading-core.js'),require('./reading-data.js'),require('./reading-phonics.js'),require('./letter-memory.js'));else root.PokeAdultReading=factory(root.PokeLearning,root.PokeReadingCore,root.PokeReadingData,root.PokePhonics,root.PokeLetterMemory);})(typeof globalThis!=='undefined'?globalThis:this,function(C,R,D,P,L){
'use strict';
const VERSION=2;
const STAGES=[{id:'sounds',label:'Names & sounds',minutes:4},{id:'words',label:'Blend & build',minutes:3},{id:'writing',label:'Write letters',minutes:2},{id:'story',label:'Read together',minutes:3}];
const OUTCOMES=['independent','helped','not-yet'];
const events=(sessions,day)=>C.allQuestions(sessions||{}).filter(q=>q.section==='read'&&q.dailyVersion===VERSION&&(!day||q.dailyDay===day));
function progress(sessions,day=C.dayKey(Date.now()),cycle){
 const all=events(sessions,day);if(cycle===undefined)cycle=Math.max(0,...all.map(q=>q.dailyCycle||0));
 const qs=all.filter(q=>(q.dailyCycle||0)===cycle);
 const stages=STAGES.map(s=>{
  const items=qs.filter(q=>q.dailyStage===s.id),checks=items.filter(q=>q.completedAt&&OUTCOMES.includes(q.adultOutcome));
  const ms=items.reduce((n,q)=>n+(q.activeByDay?.[day]??q.activeMs??0),0),target=s.minutes*60000;
  const ended=items.some(q=>q.kind==='adultStageEnd'&&q.completedAt&&q.observer==='grown-up');
  return {...s,ms,target,complete:ended&&checks.length>=2,attempts:checks.length,independent:checks.filter(q=>q.adultOutcome==='independent'&&!q.helped).length,helped:checks.filter(q=>q.adultOutcome==='helped').length,notYet:checks.filter(q=>q.adultOutcome==='not-yet').length};
 });
 const index=stages.findIndex(s=>!s.complete);
 return {version:VERSION,day,cycle,stages,index,stage:index<0?null:stages[index],complete:index<0,ms:stages.reduce((n,s)=>n+s.ms,0),creditedMs:stages.reduce((n,s)=>n+Math.min(s.ms,s.target),0),target:720000};
}
function sitting(status){const firstDone=status.stages.slice(0,2).every(s=>s.complete);return {part:firstDone?2:1,breakReady:firstDone&&!status.complete,remainingMs:status.stages.filter(s=>!s.complete).reduce((n,s)=>n+Math.max(0,s.target-s.ms),0)};}
function normalizeLetters(value){return [...new Set((Array.isArray(value)?value.join(' '):String(value||'')).toLowerCase().split(/[\s,]+/).filter(g=>/^[a-z]$/.test(g)&&(D.G[g]||g==='q')))].slice(0,6);}
function focus(sessions,state,status,priorities){
 return L.select(sessions,{schoolLetters:normalizeLetters(state.adultLetters),day:status.day,cycle:status.cycle,priorities:priorities?.sounds});
}
function wordParts(word,n){return P.annotate(R.clean(word),R.splitWord(word,n));}
function materials(sessions,state,status,priorities){
 const letters=focus(sessions,state,status,priorities),n=Math.max(R.currentRoute(state),...letters.map(g=>R.itemRoute('g:'+g))),allowed=new Set(letters);
 // Previously recalled sounds may be reused, but no unintroduced sound is smuggled into a word.
 events(sessions).filter(q=>(q.kind==='adultSound'||(q.kind==='adultLetterRecall'&&q.letterSkill==='sound'))&&q.adultOutcome==='independent'&&!q.helped).forEach(q=>allowed.add(q.g));
 if(allowed.has('q'))allowed.add('qu');
 const candidates=[...new Set(['at','am','in','it','an','on','up',...D.ROUTES.slice(0,n).flatMap(r=>[...r.blend,...r.build]),'mat','sat','Sam','tap','pat','map'].map(R.clean))];
 const words=candidates.filter(w=>wordParts(w,n).every(p=>p.cls!=='silent'&&allowed.has(p.play||p.g)));
 const recent=events(sessions,status.day).filter(q=>q.dailyCycle===status.cycle&&q.adultOutcome).map(q=>q.word),wanted=new Set(priorities?.words||[]);
 words.sort((a,b)=>Number(wanted.has(b))-Number(wanted.has(a))||recent.filter(w=>w===a).length-recent.filter(w=>w===b).length||a.length-b.length);
 return {n,letters,words:words.slice(0,3)};
}
function round(sessions,state,status,rnd=Math.random,priorities=null){
 const {n,letters,words}=materials(sessions,state,status,priorities),stage=status.stage.id;
 const used=new Set(events(sessions,status.day).map(q=>q.nightlyTarget).filter(Boolean));
 const targets=words.length?words:letters.slice(0,2);
 let items;
 if(stage==='sounds')items=L.checks(letters,sessions,status.day,status.cycle,priorities?.sounds);
 else if(stage==='writing'){
  const singles=[...new Set(letters.flatMap(g=>g.split('')).filter(g=>D.WRITE[g]))].slice(0,2);
  items=singles.flatMap(g=>[{kind:'adultWrite',item:'adult:copy:'+g,g,word:g,answer:g,writingMode:'copy'},{kind:'adultWrite',item:'adult:memory:'+g,g,word:g,answer:g,writingMode:'memory'}]);
 }else items=targets.map((word,i)=>({kind:words.length?(stage==='words'?'adultBlend':'adultRead'):'adultSound',item:'adult:'+(stage==='words'?'blend:':'read:')+word,word,g:words.length?undefined:word,answer:word,parts:wordParts(word,n),fallback:!words.length,build:i%2===1}));
 const base={route:n,observer:'grown-up',adultLetters:letters,adultSession:true};
 items=items.map(it=>{
  const target=it.kind==='adultLetterRecall'&&priorities?.sounds?.includes(it.g)?'letter:'+it.letter+':'+it.letterSkill+':'+it.letterCase:it.g&&priorities?.sounds?.includes(it.g)?'sound:'+it.g:it.word&&priorities?.words?.includes(it.word)?'word:'+it.word:null;
  return {...base,...it,...(target&&!used.has(target)?{nightlyTarget:target}:{})};
 });
 items.push({...base,kind:'adultStageEnd',item:'adult:end:'+stage,teach:true});
 return {act:'adult',route:n,items,daily:{day:status.day,cycle:status.cycle,stage,version:VERSION,adult:true}};
}
function report(sessions,day){
 const all=events(sessions,day);if(!all.length)return 'Read together with a grown-up: no session recorded for this date.';
 const lines=['Adult-guided literacy (4 + 3 + 2 + 3 minute pacing guide; shorter practice is allowed):'];
 for(const cycle of [...new Set(all.map(q=>q.dailyCycle||0))]){
  const p=progress(sessions,day,cycle);lines.push('Run '+(cycle+1)+': '+(p.complete?'all four parts practised':'next: '+p.stage.label));
  for(const s of p.stages){lines.push(s.label+': '+(s.ms/60000).toFixed(1)+' active min; '+s.independent+' unaided, '+s.helped+' with help, '+s.notYet+' not yet (adult observed).');
   const qs=all.filter(q=>(q.dailyCycle||0)===cycle&&q.dailyStage===s.id&&q.adultOutcome);for(const q of qs)lines.push('  '+q.word+(q.letterSkill?' ('+q.letterSkill+', '+q.letterCase+')':'')+(q.writingMode?' ('+q.writingMode+', '+(q.writingSurface||'paper')+')':'')+': '+q.adultOutcome+(q.helped?' [support used]':''));}
 }
 lines.push('These are grown-up observations, not automated grading or a diagnosis. Copying, writing from memory, oral reading and tapping choices are separate evidence. Timers estimate foreground practice and may pause during paper work.');
 lines.push('',L.report(sessions));return lines.join('\n');
}
function guidance(sessions,day){const p=progress(sessions,day);return {focus:p.complete?'Today’s grown-up session is complete.':'Sit together. Next: '+p.stage.label+'.',duration:'Aim for 10–12 minutes together: letter names and sounds 4, blend and build 3, writing 2, supported reading 3. Take a break or finish a part sooner when needed.',offline:'Use a tablet and stylus, or paper and pencil. Ask for the name and sound separately. Model when needed, try together, then let Jonah try. Record help honestly; keep stories read aloud enjoyable.'};}
return {VERSION,STAGES,OUTCOMES,events,progress,sitting,normalizeLetters,focus,materials,round,report,guidance};
});
