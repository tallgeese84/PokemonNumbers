/* Pokémon are teaching cues. Badges use only varied, cue-free recognition,
   including a check on a later day before that day's teaching for the letter. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./learning-core.js'),require('./reading-data.js'));else root.PokeSoundBuddies=factory(root.PokeLearning,root.PokeReadingData);})(typeof globalThis!=='undefined'?globalThis:this,function(C,D){
'use strict';
const ROWS=[
 ['a',359,'Absol','ant',['apple','ax','ant']],['b',1,'Bulbasaur','bed',['bat','bug','bed']],
 ['c',10,'Caterpie','cat',['cup','cot','cat']],['d',50,'Diglett','dog',['duck','dig','dog']],
 ['e',239,'Elekid','egg',['elf','end','egg']],['f',653,'Fennekin','fan',['fish','fog','fan']],
 ['g',92,'Gastly','gate',['goat','gum','gate']],['h',116,'Horsea','hat',['hen','hot','hat']],
 ['i',174,'Igglybuff','in',['ink','igloo','in']],['j',39,'Jigglypuff','jam',['jet','jog','jam']],
 ['k',109,'Koffing','kit',['kid','king','kit']],['l',131,'Lapras','leg',['log','lip','leg']],
 ['m',151,'Mew','map',['mat','mop','map']],['n',29,'Nidoran','net',['nap','nut','net']],
 ['o',43,'Oddish','otter',['ox','octopus','otter']],['p',25,'Pikachu','pin',['pan','pig','pin']],
 ['q',195,'Quagsire','queen',['quick','quack','queen']],['r',447,'Riolu','rug',['rat','red','rug']],
 ['s',27,'Sandshrew','sun',['sit','sock','sun']],['t',175,'Togepi','tap',['tin','top','tap']],
 ['u',197,'Umbreon','up',['umbrella','under','up']],['v',37,'Vulpix','van',['vet','vest','van']],
 ['w',194,'Wooper','web',['wet','win','web']],['x',178,'Xatu','box',['fox','six','box']],
 ['y',835,'Yamper','yes',['yell','yak','yes']],['z',41,'Zubat','zip',['zoo','zap','zip']]
];
const ALL=ROWS.map(([letter,id,name,keyword,words])=>({letter,id,name,keyword,words,g:letter==='q'?'qu':letter,image:'assets/sound-buddies/'+id+'.png'}));
const BY=Object.fromEntries(ALL.map(b=>[b.letter,b]));
const get=g=>BY[g==='qu'?'q':g];
const route=b=>D.ROUTES.find(r=>r.add.includes(b.g))?.n||1;
const events=sessions=>C.allQuestions(sessions||{}).filter(q=>q.section==='read'&&q.buddyLetter&&q.completedAt);
function progress(sessions){
 const qs=events(sessions),out={};
 for(const b of ALL){
  const history=qs.filter(q=>q.buddyLetter===b.letter),tries=history.filter(q=>!q.teach&&q.responses?.length),recent=tries.slice(-8),ok=recent.filter(C.independent);
  const words=new Set(ok.filter(q=>q.kind==='buddyWord').map(q=>q.word)),days=new Set(ok.map(q=>q.day));
  const retained=ok.some(q=>q.phase==='retention'&&!history.some(h=>h.day===q.day&&h.startedAt<q.startedAt&&(h.teach||h.helped||!C.independent(h))));
  const badge=recent.length>=5&&ok.length/recent.length>=.8&&words.size>=2&&days.size>=2&&ok.some(q=>q.kind==='buddySound')&&retained;
  out[b.letter]={letter:b.letter,n:tries.length,independent:tries.filter(C.independent).length,cued:history.filter(q=>q.buddyCue||q.helped).length,
   met:history.length>0,lastAt:history.at(-1)?.completedAt||0,lastDay:history.at(-1)?.day||null,badge,retained,
   status:badge?'Remembered':tries.length?'Practising':history.length?'Met':'Meet me'};
 }
 return out;
}
function shuffle(xs,rnd){const a=[...xs];for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function options(g,pool,rnd){
 // c and k share the same sound; never offer both for a listening question.
 const others=[...new Set(pool.map(x=>get(x)?.g).filter(Boolean))].filter(x=>x!==g&&!(['c','k'].includes(g)&&['c','k'].includes(x)));
 const candidates=others.length?others:['s','a','t'].filter(x=>x!==g);
 return shuffle([g,...shuffle(candidates,rnd).slice(0,pool.length>=4?2:1)],rnd);
}
function lesson(letters,sessions={},pool=letters,now=Date.now(),rnd=Math.random){
 const bs=[...new Set(letters)].map(get).filter(Boolean).slice(0,3),qs=events(sessions),day=C.dayKey(now),models=[],checks=[];
 for(const b of bs){
  const hist=qs.filter(q=>q.buddyLetter===b.letter),last=hist.at(-1),tries=hist.filter(q=>!q.teach).slice(-2);
  const needs=!last||(tries.length===2&&tries.every(q=>!C.independent(q)));
  const base={route:route(b),item:'g:'+b.g,buddyLetter:b.letter,target:b.g,answer:b.g,options:options(b.g,pool,rnd)};
  const priorWords=hist.filter(q=>q.kind==='buddyWord').map(q=>q.word),fresh=b.words.filter(w=>w!==b.keyword);
  const word=[...fresh].sort((a,z)=>priorWords.filter(w=>w===a).length-priorWords.filter(w=>w===z).length)[0];
  const phase=last&&last.day!==day&&!needs?'retention':'independent';
  if(needs){
   models.push({...base,kind:'buddyMeet',teach:true,phase:'buddy-model',buddyCue:true,word:b.keyword},
    {...base,kind:'buddyGuide',teach:true,phase:'guided',buddyCue:true,word:b.keyword});
  }else checks.push({...base,kind:'buddySound',phase,buddyCue:false});
  checks.push({...base,options:options(b.g,pool,rnd),kind:'buddyWord',word,phase,buddyCue:false});
 }
 return {act:'buddies',route:bs.length?route(bs[0]):1,items:[...models,...shuffle(checks,rnd)]};
}
function select(sessions,candidates,now=Date.now()){
 const stats=progress(sessions),day=C.dayKey(now),letters=[...new Set(candidates.map(g=>get(g)?.letter).filter(Boolean))];
 // At most one automatic buddy block a day; the collection remains available.
 if(events(sessions).some(q=>q.day===day))return [];
 return letters.sort((a,b)=>Number(stats[a].badge)-Number(stats[b].badge)||stats[a].lastAt-stats[b].lastAt).slice(0,3);
}
function report(sessions,day){
 const qs=events(sessions).filter(q=>q.day===day),ps=progress(sessions);
 const letters=[...new Set(qs.map(q=>q.buddyLetter))];
 if(!letters.length)return 'Pokémon sound buddies: no completed practice recorded for this date.';
 const lines=['Pokémon sound buddies — picture support and cue-free recognition:'];
 for(const l of letters){const xs=qs.filter(q=>q.buddyLetter===l),test=xs.filter(q=>!q.teach),cued=xs.filter(q=>q.buddyCue||q.helped).length;
  lines.push(`${l.toUpperCase()} · ${BY[l].name}: ${cued} teaching/helped steps; ${test.filter(C.independent).length}/${test.length} first-try checks without picture help. ${ps[l].badge?'Remembered badge confirmed across days.':ps[l].retained?'Later-day recall observed; more varied practice needed.':'Later-day recall not yet confirmed.'}`);
 }
 lines.push('Badges measure sound-to-letter recognition, not spoken sound production or reading the Pokémon name.');
 return lines.join('\n');
}
return {ALL,BY,get,route,events,progress,lesson,select,report};
});
