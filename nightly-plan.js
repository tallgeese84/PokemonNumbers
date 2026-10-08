/* Jonah priorities choose existing eligible tasks; reading routine and earned Pokémon stay intact. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./nightly-priority-core.js'));else root.JonahNightly=factory(root.FamilyNightlyCore);})(typeof globalThis==='undefined'?this:globalThis,function(Core){
'use strict';
function mathRoute(base,plan,sessions,state,M,C,now=Date.now(),allowed=null){
 if(!Core.usable(plan,now)||base.type!=='path'||base.review)return base;
 const used=C.allQuestions(sessions).filter(q=>q.nightlyPlan?.sessionDate===plan.sessionDate&&q.section==='path');
 if(new Set(used.map(q=>q.skill)).size>=2)return base;
 const status=M.statusAll(sessions,state),skill=plan.subjects.maths.skills.find(id=>M.BY[id]&&!M.BY[id].delegate&&status[id]?.unlocked&&(!allowed||allowed.includes(id))&&!used.some(q=>q.skill===id));
 if(!skill)return base;
 return {...M.route(skill,0),nightlyPlan:Core.identity(plan)};
}
function readingRound(sessions,state,status,plan,Daily,rnd=Math.random,now=Date.now()){
 const priorities=Core.usable(plan,now)?plan.subjects.reading:null;
 const round=Daily.round(sessions,state,status,rnd,priorities);
 if(priorities)round.items=round.items.map(it=>it.nightlyTarget?{...it,nightlyPlan:Core.identity(plan)}:it);
 return round;
}
const api={mathRoute,readingRound};
if(typeof window!=='undefined'){
 let recordReceipt=()=>{};
 const config=()=>{try{return JSON.parse(localStorage.getItem('pokemath_drive_mirror_v1')||'{}');}catch(_){return {};}};
 const words=new Set(PokeReadingData.ROUTES.flatMap(r=>[...r.blend,...r.build]).concat(PokeReadingDaily.ACTIONS).map(PokeReadingCore.clean).filter(PokeReadingArt.has));
 const hash=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),b=>b.toString(16).padStart(2,'0')).join('');
 const client=Core.create({student:'Jonah',catalog:{maths:id=>!!PokeMathPath.BY[id]&&!PokeMathPath.BY[id].delegate,sound:id=>!!PokeReadingData.G[id],word:id=>words.has(id)},config,storage:localStorage,key:'jonah_nightly_priorities_v1',request:(...args)=>fetch(...args),hash,online:()=>navigator.onLine!==false,onChange:report=>{paint();recordReceipt(report);}});
 Object.assign(api,client);
 function paint(){const el=document.getElementById('jonahNightlyStatus');if(el){const r=client.report();el.textContent=r.status+(r.received?' Plan '+r.received.sessionDate+', revision '+r.received.revision+'.':'');}}
 api.mount=async record=>{
  recordReceipt=record;
  const host=document.getElementById('learningDashboard');
  if(host&&!document.getElementById('jonahNightlySettings')){const box=document.createElement('details');box.id='jonahNightlySettings';box.innerHTML='<summary>Nightly reading and maths priorities</summary><p>Uses the existing private family connection. Reading keeps its four stages. Maths priorities apply during optional maths practice.</p><button type="button" class="btn" id="jonahNightlyRefresh">Check plan connection</button><p id="jonahNightlyStatus" role="status"></p>';host.append(box);document.getElementById('jonahNightlyRefresh').onclick=()=>client.refresh(true);}
  await client.initialize();await client.refresh(true);
 };
 window.addEventListener('jonah:mirror-settings',()=>{client.invalidate();client.refresh(true);});
 window.addEventListener('online',()=>client.refresh(true));
 window.addEventListener('storage',e=>{if(e.key==='pokemath_drive_mirror_v1'){client.invalidate();client.refresh(true);}});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')client.refresh();});
}
return api;
});
