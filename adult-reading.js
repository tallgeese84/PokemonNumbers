/* Adult-led practice. Observations are separate from app-choice mastery.
   Version 1 daily records and every existing reward remain untouched. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./learning-core.js'),require('./reading-core.js'),require('./reading-data.js'),require('./reading-phonics.js'));else root.PokeAdultReading=factory(root.PokeLearning,root.PokeReadingCore,root.PokeReadingData,root.PokePhonics);})(typeof globalThis!=='undefined'?globalThis:this,function(C,R,D,P){
'use strict';
const VERSION=2;
const STAGES=[{id:'sounds',label:'Say the sounds',minutes:2},{id:'words',label:'Blend & build',minutes:4},{id:'writing',label:'Write letters',minutes:3},{id:'story',label:'Read together',minutes:3}];
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
 // Reuse the selected set across stages, breaks and devices for this day/cycle.
 const saved=events(sessions,status.day).find(q=>(q.dailyCycle||0)===status.cycle&&Array.isArray(q.adultLetters)&&q.adultLetters.length);
 if(saved)return saved.adultLetters.filter(g=>D.G[g]||g==='q');
 const custom=normalizeLetters(state.adultLetters);if(custom.length>=2)return custom;
 const n=R.currentRoute(state),history=events(sessions).filter(q=>q.kind==='adultSound'&&q.completedAt),last={};
 history.forEach(q=>last[q.g]=q);
 const curriculum=R.graphemesUpTo(R.LAST),met=new Set([...R.available(sessions,n),...history.map(q=>q.g)]);
 const secure=g=>{const qs=history.filter(q=>q.g===g&&q.adultOutcome==='independent'&&!q.helped);return new Set(qs.map(q=>q.dailyDay)).size>=2&&last[g]?.adultOutcome==='independent';};
 let pool=curriculum.filter(g=>met.has(g));
 // Start with just three sounds; add one at a time after later-day recall.
 if(!pool.length)pool=R.route(n).add.slice(0,3);
 else if(pool.every(secure)){const next=curriculum.find(g=>!met.has(g));if(next)pool.push(next);}
 while(pool.length<3){const next=curriculum.find(g=>!pool.includes(g));if(!next)break;pool.push(next);}
 const wanted=new Set(priorities?.sounds||[]);
 return pool.sort((a,b)=>Number(secure(a))-Number(secure(b))||Number(wanted.has(b))-Number(wanted.has(a))||(last[a]?.completedAt||0)-(last[b]?.completedAt||0)).slice(0,3);
}
function wordParts(word,n){return P.annotate(R.clean(word),R.splitWord(word,n));}
function materials(sessions,state,status,priorities){
 const letters=focus(sessions,state,status,priorities),n=Math.max(R.currentRoute(state),...letters.map(g=>R.itemRoute('g:'+g))),allowed=new Set(letters);
 // Previously recalled sounds may be reused, but no unintroduced sound is smuggled into a word.
 events(sessions).filter(q=>q.kind==='adultSound'&&q.adultOutcome==='independent'&&!q.helped).forEach(q=>allowed.add(q.g));
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
 if(stage==='sounds')items=letters.map(g=>({kind:'adultSound',item:'adult:sound:'+g,g,word:g,answer:g}));
 else if(stage==='writing'){
  const singles=[...new Set(letters.flatMap(g=>g.split('')).filter(g=>D.WRITE[g]))].slice(0,2);
  items=singles.flatMap(g=>[{kind:'adultWrite',item:'adult:copy:'+g,g,word:g,answer:g,writingMode:'copy'},{kind:'adultWrite',item:'adult:memory:'+g,g,word:g,answer:g,writingMode:'memory'}]);
 }else items=targets.map((word,i)=>({kind:words.length?(stage==='words'?'adultBlend':'adultRead'):'adultSound',item:'adult:'+(stage==='words'?'blend:':'read:')+word,word,g:words.length?undefined:word,answer:word,parts:wordParts(word,n),fallback:!words.length,build:i%2===1}));
 const base={route:n,observer:'grown-up',adultLetters:letters,adultSession:true};
 items=items.map(it=>{
  const target=it.g&&priorities?.sounds?.includes(it.g)?'sound:'+it.g:it.word&&priorities?.words?.includes(it.word)?'word:'+it.word:null;
  return {...base,...it,...(target&&!used.has(target)?{nightlyTarget:target}:{})};
 });
 items.push({...base,kind:'adultStageEnd',item:'adult:end:'+stage,teach:true});
 return {act:'adult',route:n,items,daily:{day:status.day,cycle:status.cycle,stage,version:VERSION,adult:true}};
}
function report(sessions,day){
 const all=events(sessions,day);if(!all.length)return 'Read together with a grown-up: no session recorded for this date.';
 const lines=['Adult-guided literacy (2 + 4 + 3 + 3 minute pacing guide; shorter practice is allowed):'];
 for(const cycle of [...new Set(all.map(q=>q.dailyCycle||0))]){
  const p=progress(sessions,day,cycle);lines.push('Run '+(cycle+1)+': '+(p.complete?'all four parts practised':'next: '+p.stage.label));
  for(const s of p.stages){lines.push(s.label+': '+(s.ms/60000).toFixed(1)+' active min; '+s.independent+' unaided, '+s.helped+' with help, '+s.notYet+' not yet (adult observed).');
   const qs=all.filter(q=>(q.dailyCycle||0)===cycle&&q.dailyStage===s.id&&q.adultOutcome);for(const q of qs)lines.push('  '+q.word+(q.writingMode?' ('+q.writingMode+', '+(q.writingSurface||'paper')+')':'')+': '+q.adultOutcome+(q.helped?' [support used]':''));}
 }
 lines.push('These are grown-up observations, not automated grading or a diagnosis. Copying, writing from memory, oral reading and tapping choices are separate evidence. Timers estimate foreground practice and may pause during paper work.');
 return lines.join('\n');
}
function guidance(sessions,day){const p=progress(sessions,day);return {focus:p.complete?'Today’s grown-up session is complete.':'Sit together. Next: '+p.stage.label+'.',duration:'Aim for 10–12 minutes together: sounds 2, blend and build 4, writing 3, supported reading 3. Take a break or finish a part sooner when needed.',offline:'Use a tablet and stylus, or paper and pencil. Model, try together, then let Jonah try. Record help honestly; keep stories read aloud enjoyable.'};}
return {VERSION,STAGES,OUTCOMES,events,progress,sitting,normalizeLetters,focus,materials,round,report,guidance};
});
