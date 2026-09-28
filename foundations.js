/* Visual number relationships; pure functions shared by the app and regression tests. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./learning-core.js'));else root.PokeFoundations=factory(root.PokeLearning);})(typeof globalThis!=='undefined'?globalThis:this,function(C){
'use strict';
const labels={split:'Splitting a whole',take:'Taking a part away',missing:'Finding what left',undo:'Putting the whole back',predict:'Predicting what remains',groups:'Building equal groups',patterns:'Seeing number parts'};
// 12/20 subtraction/parts, 5/20 addition/patterns, 3/20 equal groups.
const cycle=['split','take','missing','patterns','undo','predict','groups','split','missing','add','take','predict','patterns','groups','missing','undo','patterns','add','predict','groups'];
const skillAt=n=>cycle[n%cycle.length];
function stages(skill){
 const support=['split','take','undo','groups'].includes(skill)?'interactive groups':skill==='predict'?'predict then check':'structured pictures';
 return [{range:skill==='groups'?6:5,support,format:skill},{range:skill==='groups'?10:10,support,format:skill}];
}
function plan(skill,sessions){
 const ss=stages(skill);let level=0,window=[],changes=[];
 const qs=C.allQuestions(sessions).filter(q=>q.section==='foundation'&&q.skill===skill&&q.completedAt);
 for(const q of qs){if(q.level!==level||q.range!==ss[level].range||q.support!==ss[level].support)continue;
 window.push(q);window=window.slice(-6);
 if(level&&window.length>=5&&window.slice(-5).filter(q=>!C.independent(q)).length>=3){changes.push({at:q.completedAt,from:level,to:0,reason:'Restore smaller groups and visual support'});level=0;window=[];continue;}
 if(level===0&&window.length===6&&window.filter(C.independent).length>=5&&window.slice(-3).every(C.independent)&&new Set(window.filter(C.independent).map(C.factKey)).size>=4){changes.push({at:q.completedAt,from:0,to:1,reason:'Varied success on this specific relationship; speed is not required'});level=1;window=[];}
 }
 return {...ss[level],level,changes,needsSupport:window.slice(-3).filter(q=>!C.independent(q)).length>=2,recent:qs.slice(-3).map(C.factKey)};
}
function make(skill,p,random=Math.random){
 const candidates=[];
 if(skill==='groups'){
  for(let a=2;a<=3;a++)for(let b=1;b<=3;b++)if(a*b<=p.range)candidates.push({a,b,expected:a*b});
 }else for(let a=2;a<=p.range;a++)for(let b=0;b<=a;b++){
  if(['split','undo','patterns'].includes(skill)&&(b===0||b===a))continue;
  candidates.push({a,b,expected:skill==='missing'?b:skill==='undo'?a:a-b});
 }
 const pool=candidates.filter(x=>!p.recent?.includes(C.factKey({...x,skill,format:skill})));
 const options=pool.length?pool:candidates;
 return {section:'foundation',skill,...options[Math.min(options.length-1,Math.floor(random()*options.length))],range:p.range,support:p.support,format:skill,level:p.level,variant:random()<.5?'frame':'parts'};
}
function dailyReport(sessions,day,lastSync=0,dirty=false){
 const s=C.summarize(sessions,day),week=C.summarize(sessions,C.shiftDay(day,-6),day),prev=C.summarize(sessions,C.shiftDay(day,-13),C.shiftDay(day,-7));
 const pct=x=>x===null?'not enough data':Math.round(x*100)+'%';
 const text=[`Jonah’s daily progress — ${day} (Madison time)`,`Estimated active practice: ${(s.practiceMs/60000).toFixed(1)} minutes. ${s.attempted} questions attempted; ${s.completed} completed.`,`First-try success without extra help: ${s.independent}/${s.attempted} (${pct(s.accuracy)}). Extra help: ${s.helped}.`,`Built-in visual tasks show supported understanding, not proof of mental arithmetic or a particular strategy.`];
 for(const g of Object.values(s.groups))text.push(`${labels[g.skill]||C.LABELS[g.section]||g.skill} · within ${g.range} · ${g.support}: ${g.independent}/${g.n} first-try, ${g.helped} helped; typical independent response ${g.medianMs===null?'not yet available':(g.medianMs/1000).toFixed(1)+' seconds'}.`);
 if(!s.attempted)text.push('No attempts in the available records for this date. This does not prove no practice occurred on an unsynced device.');
 text.push(`Later-day checks: ${s.retention.independent}/${s.retention.checked} successful without extra help.`,'Weekly comparison (matching skills, ranges and pictures):');
 for(const x of C.comparisons(week,prev))text.push(`${labels[x.skill]||C.LABELS[x.section]} (${x.range}, ${x.support}): ${x.accuracyChange===null?'too little data':(x.accuracyChange>=0?'+':'')+Math.round(x.accuracyChange*100)+' percentage points'}; ${x.n} vs ${x.previousN} attempts.`);
 const changes=Object.keys(labels).flatMap(skill=>plan(skill,sessions).changes.filter(c=>C.dayKey(c.at)===day).map(c=>`${labels[skill]}: step ${c.from+1} → ${c.to+1}.`));
 text.push('Difficulty changes: '+(changes.join(' ')||'No foundation level changes recorded.'));
 const weak=Object.values(week.groups).filter(g=>g.section==='foundation'&&g.n>=5).sort((a,b)=>a.accuracy-b.accuracy)[0];
 text.push('Next practice: '+(weak?(weak.accuracy<.8?'Revisit ':'Check with a different arrangement: ')+labels[weak.skill]+'.':'Keep exploring small parts and wholes; too little evidence yet to choose a weak skill.'));
 text.push('Offline idea: split five toys into two groups, hide one group, then bring it back. Ask what changed and what stayed the same.');
 text.push('Keep the 15-minute active goal; offer shorter sessions if he is tired. Response speed is not an advancement gate.');
 text.push(lastSync?'Last confirmed device upload: '+new Date(lastSync).toLocaleString('en-US',{timeZone:C.ZONE})+'.':'No confirmed cloud upload on this device.');
 if(dirty)text.push('Local changes are waiting to sync. Other devices may have missing activity.');
 return text.join('\n\n');
}
return {labels,skillAt,stages,plan,make,dailyReport};
});
