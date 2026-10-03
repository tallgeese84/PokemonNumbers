/* The daily reading path. Durations guide pacing; finish the current task before
   moving on. Time, teaching and independent answers remain separate evidence. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./learning-core.js'),require('./reading-core.js'),require('./reading-data.js'),require('./reading-phonics.js'),require('./reading-buddies.js'),require('./reading-art.js'));else root.PokeReadingDaily=factory(root.PokeLearning,root.PokeReadingCore,root.PokeReadingData,root.PokePhonics,root.PokeSoundBuddies,root.PokeReadingArt);})(typeof globalThis!=='undefined'?globalThis:this,function(C,R,D,P,B,A){
'use strict';
const VERSION=1;
const STAGES=[{id:'sounds',label:'Remember sounds',minutes:2},{id:'words',label:'Blend & build',minutes:4},{id:'actions',label:'Read & act',minutes:3},{id:'story',label:'Tiny story',minutes:3}];
const events=(sessions,day)=>C.allQuestions(sessions||{}).filter(q=>q.section==='read'&&q.dailyVersion===VERSION&&q.dailyDay===day);
function progress(sessions,day=C.dayKey(Date.now()),cycle){
 const all=events(sessions,day);if(cycle===undefined)cycle=Math.max(0,...all.map(q=>q.dailyCycle||0));
 const qs=all.filter(q=>(q.dailyCycle||0)===cycle);
 const stages=STAGES.map(s=>{
  const items=qs.filter(q=>q.dailyStage===s.id),finished=items.filter(q=>q.completedAt),checks=finished.filter(q=>!q.teach&&q.responses?.length);
  const ms=items.reduce((n,q)=>n+(q.activeByDay?.[day]??q.activeMs??0),0),target=s.minutes*60000;
  const lastStory=items.filter(q=>q.kind==='dailyStory').sort((a,b)=>a.startedAt-b.startedAt).at(-1);
  const practiced=s.id==='story'?!!lastStory?.completedAt&&finished.some(q=>q.kind==='dailyQuiz'&&q.storyId===lastStory.storyId&&q.startedAt>=lastStory.startedAt):finished.filter(q=>q.responses?.length).length>=2;
  return {...s,ms,target,complete:ms>=target&&practiced,attempts:items.filter(q=>!q.teach&&q.responses?.length).length,independent:checks.filter(C.independent).length,helped:items.filter(q=>q.helped).length};
 });
 const index=stages.findIndex(s=>!s.complete);
 return {day,cycle,stages,index,stage:index<0?null:stages[index],complete:index<0,ms:stages.reduce((n,s)=>n+s.ms,0),creditedMs:stages.reduce((n,s)=>n+Math.min(s.ms,s.target),0),target:720000};
}
const shuffle=(xs,rnd=Math.random)=>{const a=[...xs];for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const parts=(w,n)=>P.annotate(R.clean(w),R.splitWord(w,n));
const graphemes=(w,n)=>parts(w,n).filter(p=>p.cls!=='silent').map(p=>p.play||p.g);
function taughtWord(w,n,known){return graphemes(w,n).every(g=>known.has(g));}
const ACTIONS=['sit','tap','nap','spin','dig','run','hug','jump','stop','sing','smile','play'];
const STORIES=[
 {id:'pat-tin',title:'Pat and the tin',pages:['Pat sat.','Pat sat in a tin.','Pat naps.'],question:'Where did Pat sit?',choices:['tin','pan','pit'],answer:'tin'},
 {id:'pat-pin',title:'Pat and the pin',pages:['Pat sat.','A pin in a pan!','Pat tips it.'],question:'What was in the pan?',choices:['pin','tin','ant'],answer:'pin'},
 {id:'dog-mat',title:'Dog nap',pages:['A dog sat.','It sat on a mat.','It naps on it.'],question:'What did the dog sit on?',choices:['mat','pot','tin'],answer:'mat'},
 {id:'cat-sun',title:'Cat in the sun',pages:['A cat sat in the sun.','It ran at a dog.','The dog hid.'],question:'What did the cat run at?',choices:['dog','duck','pig'],answer:'dog'}
];
function story(sessions,state,n,known,rnd){
 const qs=C.allQuestions(sessions),eligible=STORIES.filter(s=>s.pages.every(t=>t.split(/\s+/).every(w=>R.tokenOK(w,n))));
 const candidates=eligible.length?eligible:[STORIES[0]];
 const recent=qs.filter(q=>q.kind==='dailyStory').slice(-4).map(q=>q.storyId);
 const pick=shuffle(candidates,rnd).sort((a,b)=>recent.filter(x=>x===a.id).length-recent.filter(x=>x===b.id).length)[0];
 // Later routes use their richer existing books, split into three short pages.
 let book={...pick,pages:pick.pages.map(t=>({t}))};
 if(n>=4){const original=R.route(n).book,q=original.quiz[0];book={id:'route-'+n,title:original.title,pages:[0,2,4].map(i=>({t:original.pages.slice(i,i+2).map(p=>p.t).join(' ')})),quiz:q};}
 const hearts=new Set(R.heartUpTo(n).filter(h=>(R.itemStats(sessions)['h:'+h.w.toLowerCase()]?.box||0)>=1).map(h=>h.w.toLowerCase()));
 const irregular=new Set(R.heartUpTo(n).map(h=>h.w.toLowerCase()));
 const supplied=[...new Set(book.pages.flatMap(p=>p.t.match(/[A-Za-z]+/g)||[]).filter(w=>!hearts.has(w.toLowerCase())&&(irregular.has(w.toLowerCase())||!taughtWord(w.toLowerCase(),n,known))).map(w=>w.toLowerCase()))];
 const choices=book.quiz?book.quiz.o:shuffle(book.choices,rnd).map(w=>({w,t:w}));
 const answer=book.quiz?book.quiz.a:choices.findIndex(o=>o.w===book.answer);
 return {act:'book',route:n,items:[{route:n,kind:'dailyStory',item:'daily-book:'+book.id,storyId:book.id,book,supplied,teach:true},
  {route:n,kind:'dailyQuiz',item:'daily-understand:'+book.id,storyId:book.id,quiz:{q:book.quiz?.q||book.question,o:choices},answer}]};
}
function round(sessions,state,status,rnd=Math.random){
 const stage=status.stage.id,n=R.currentRoute(state),stats=R.itemStats(sessions),known=new Set(R.knownSounds(sessions,n)),av=R.available(sessions,n);
 const qs=events(sessions,status.day).filter(q=>q.dailyCycle===status.cycle&&q.dailyStage===stage);
 const recentWords=qs.filter(q=>q.completedAt).slice(-10).map(q=>q.word);
 let r;
 if(stage==='sounds'){
  const pool=[...new Set([...av,...(R.nextBatch(sessions,n)||[])])];
  const targets=shuffle(pool.length?pool:R.route(n).add.slice(0,3),rnd).sort((a,b)=>(stats['g:'+a]?.lastAt||0)-(stats['g:'+b]?.lastAt||0));
  const buddy=B.get(targets[0]);
  if(R.route(n).caps&&!qs.some(q=>q.kind==='upper'))r=R.makeRound('caps',n,sessions,state,rnd);
  else if(buddy)r=B.lesson([buddy.letter],sessions,pool,Date.now(),rnd);
  else r=R.makeRound(R.route(n).caps?'caps':'hunt',n,sessions,state,rnd);
 }else if(stage==='story')r=story(sessions,state,n,known,rnd);
 else{
  const pool=stage==='actions'?ACTIONS.filter(w=>R.missing(w,n).length===0):[...new Set(D.ROUTES.slice(Math.max(0,n-2),n).flatMap(r=>[...r.blend,...r.build]))].filter(w=>A.has(R.clean(w)));
  const selected=shuffle(pool,rnd).sort((a,b)=>Number(!taughtWord(a,n,known))-Number(!taughtWord(b,n,known))||recentWords.filter(w=>w===a).length-recentWords.filter(w=>w===b).length).slice(0,3);
  const items=[];
  // A few essential untaught sounds get an explicit introduction, never an unannounced test.
  const needed=[...new Set(selected.flatMap(w=>graphemes(w,n)).filter(g=>!av.includes(g)&&D.G[g]))].slice(0,3);
  needed.forEach(g=>items.push({route:n,kind:'meet',item:'g:'+g,g,teach:true}));
  selected.forEach((word,i)=>{
   const guided=!taughtWord(word,n,known),ps=parts(word,n),base={route:n,word,parts:ps,answer:R.clean(word),...(guided?{teach:true,phase:'guided'}:{})};
   if(stage==='actions'){
    const options=shuffle([word,...shuffle(ACTIONS.filter(w=>w!==word),rnd).slice(0,2)],rnd).map(w=>({w}));
    items.push({...base,kind:'dailyAction',item:'w:'+word,options});
   }else{
    const build=(qs.filter(q=>q.completedAt&&!q.teach).length+i)%2===1;
    if(build)items.push({...base,kind:'build',item:'sp:'+R.clean(word),tiles:shuffle([...ps.map(p=>p.g),...shuffle(av.filter(g=>!ps.some(p=>p.g===g)),rnd).slice(0,2)],rnd)});
    else items.push({...base,kind:'read',item:'w:'+R.clean(word),options:shuffle([word,...R.nearWords(word,n,2,rnd)],rnd).map(w=>({w})),answer:R.clean(word)});
   }
   if(guided)items.splice(items.length-1,0,{...items.at(-1),phase:'model'});
  });
  // High-frequency words are taught within word practice, allowing route gates to progress.
  if(stage==='words'&&qs.filter(q=>q.completedAt).length>=4&&!qs.some(q=>q.kind==='heart'||q.kind==='heartTeach')){
   const h=R.makeRound('heart',n,sessions,state,rnd),check=h.items.find(it=>it.kind==='heart');
   if(check){const teaching=h.items.find(it=>it.kind==='heartTeach'&&it.item===check.item),exposed=C.allQuestions(sessions).some(q=>q.item===check.item&&q.completedAt);
    items.unshift(...(teaching&&!exposed?[teaching,{...check,teach:true,phase:'guided'}]:[check]));}
  }
  r={act:stage==='actions'?'actions':'read',route:n,items};
 }
 return {...r,daily:{day:status.day,cycle:status.cycle,stage}};
}
function report(sessions,day){
 const all=events(sessions,day);if(!all.length)return 'Daily reading routine: no activity recorded for this date.';
 const cycles=[...new Set(all.map(q=>q.dailyCycle||0))];
 const lines=['Daily reading routine (about 12 active minutes; finish each task):'];
 for(const cycle of cycles){const p=progress(sessions,day,cycle);lines.push('Run '+(cycle+1)+': '+(p.complete?'all four stages complete':'next: '+p.stage.label));for(const s of p.stages)lines.push(s.label+': '+(s.ms/60000).toFixed(1)+' / '+s.minutes+' active min; '+s.independent+'/'+s.attempts+' first-try without help; '+s.helped+' helped steps.');}
 lines.push('Story page completion is practice, not proof of reading aloud. Questions after supplied words or read-aloud help are labelled listening/supported comprehension. Timing does not prove mastery.');
 return lines.join('\n');
}
function guidance(sessions,day){
 const p=progress(sessions,day);
 return {focus:p.complete?'Today’s four reading stages are complete. Next time, start with sound recall.':'Follow the reading path. Next stage: '+p.stage.label+'.',duration:'About 12 active minutes: sounds 2, blend and build 4, read and act 3, tiny story 3. Finish the current task; pause when needed.',offline:'Read one short page together. Let Jonah try, help with a word when needed, then ask what happened.'};
}
return {VERSION,STAGES,ACTIONS,STORIES,progress,round,report,guidance,taughtWord};
});
