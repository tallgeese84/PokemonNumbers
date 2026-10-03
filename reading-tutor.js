/* Explicit models and guided attempts are teaching, never mastery evidence. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./learning-core.js'));else root.PokeReadingTutor=factory(root.PokeLearning);})(typeof globalThis!=='undefined'?globalThis:this,function(C){
'use strict';
const KINDS=['shape','upper','hunt','lname','rhyme','first','last','middle','blend','count','delete','swap','spell1','spell2','read','build','heart'];
const identity=it=>String(it.word||it.target||it.answer||it.item);
function needsModel(kind,qs){
 const history=qs.filter(q=>q.kind===kind),lastModel=history.filter(q=>q.phase==='model').at(-1);
 const tries=history.filter(q=>!q.teach&&q.responses?.length).slice(-4);
 if(!lastModel&&!tries.length)return true;
 const since=tries.filter(q=>(q.completedAt||0)>(lastModel?.completedAt||0));
 return since.length>=2&&since.slice(-2).every(q=>!C.independent(q));
}
function prepare(round,sessions){
 if(round.placement||round.lazy||!round.items?.length)return round;
 const qs=C.allQuestions(sessions||{}),seen=new Set(),echo=new Set(),items=[];let models=0;
 for(const original of round.items){
  const it={...original},key=it.kind+':'+identity(it);
  if(!it.teach&&!seen.has(it.kind)&&KINDS.includes(it.kind)&&models<2&&needsModel(it.kind,qs)){
   seen.add(it.kind);models++;echo.add(key);
   items.push({...it,teach:true,phase:'model'},{...it,teach:true,phase:'guided'});
  }else items.push(echo.has(key)?{...it,teach:true,phase:'guided'}:it);
 }
 return {...round,items};
}
return {prepare,needsModel,identity,KINDS};
});
