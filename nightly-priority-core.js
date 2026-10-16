/* Family priority protocol 1. Data only; no permissions, progress, scoring or rewards. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.FamilyNightlyCore=factory();})(typeof globalThis==='undefined'?this:globalThis,function(){
'use strict';
const DAY=86400000,ZONE='America/Chicago';
const copy=x=>JSON.parse(JSON.stringify(x));
// Diagnostic codes are allowlisted: never export a response body, URL or secret.
const fault=(code,message)=>Object.assign(new Error(message),{planCode:code});
const CODES=new Set(['INVALID_PLAN','UNKNOWN_MATHS_SKILL','UNKNOWN_READING_TARGET','OLDER_PLAN','REVISION_CONFLICT','IDENTITY_CHANGED','TIMEOUT','HTTP_ERROR','OPAQUE_RESPONSE','INVALID_JSON','OVERSIZED_RESPONSE','UNSUPPORTED_RELAY','RELAY_REJECTED']);
const day=(at,zone=ZONE)=>new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(at));
const exact=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).every(k=>keys.includes(k));
const date=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
const time=s=>typeof s==='string'&&/^\d{4}-\d\d-\d\dT.*Z$/.test(s)&&Number.isFinite(Date.parse(s));
const focus=s=>typeof s==='string'&&s.length>0&&s.length<=160&&!/[<>\u0000-\u001f]/.test(s);
function list(a,max,accept){return Array.isArray(a)&&a.length<=max&&new Set(a).size===a.length&&a.every(v=>typeof v==='string'&&accept(v));}
function validate(p,student,catalog,now=Date.now()){
 if(!exact(p,['schema','id','revision','student','timeZone','reviewedDate','sessionDate','generatedAt','sourceExportedAt','subjects'])||p.schema!==1||p.student!==student||!['Hana','Jonah'].includes(student)||
  typeof p.id!=='string'||!/^[a-zA-Z0-9_-]{8,100}$/.test(p.id)||!Number.isInteger(p.revision)||p.revision<1||p.revision>10000||p.timeZone!==ZONE||
  !date(p.reviewedDate)||!date(p.sessionDate)||p.sessionDate<=p.reviewedDate||Date.parse(p.sessionDate)-Date.parse(p.reviewedDate)>3*DAY||
  !time(p.generatedAt)||!time(p.sourceExportedAt)||Date.parse(p.generatedAt)>now+300000||Date.parse(p.sourceExportedAt)>Date.parse(p.generatedAt)||Date.parse(p.generatedAt)-Date.parse(p.sourceExportedAt)>3*DAY||day(Date.parse(p.sourceExportedAt))<p.reviewedDate||
  !exact(p.subjects,student==='Hana'?['maths']:['reading','maths']))throw fault('INVALID_PLAN','Invalid or stale priority plan.');
 const m=p.subjects.maths;
 if(!exact(m,['focus','skills'])||!focus(m.focus)||!list(m.skills,3,id=>/^[a-zA-Z0-9_-]{1,100}$/.test(id)&&catalog.maths(id))||!m.skills.length)throw fault('UNKNOWN_MATHS_SKILL','Unknown maths priority.');
 if(student==='Jonah'){
  const r=p.subjects.reading;
  if(!exact(r,['focus','sounds','words'])||!focus(r.focus)||!list(r.sounds,3,id=>/^[a-z]{1,4}$/.test(id)&&catalog.sound(id))||!list(r.words,3,id=>/^[a-z]{1,20}$/.test(id)&&catalog.word(id))||!(r.sounds.length+r.words.length))throw fault('UNKNOWN_READING_TARGET','Unknown reading priority.');
 }
 return copy(p);
}
const usable=(p,now=Date.now())=>!!p&&p.sessionDate===day(now)&&Date.parse(p.generatedAt)<=now+300000;
const identity=p=>({planId:p.id,revision:p.revision,sessionDate:p.sessionDate});
function create({student,catalog,config,storage,key,request,hash,now=()=>Date.now(),online=()=>true,visible=()=>true,onChange=()=>{},setTimer=setTimeout,clearTimer=clearTimeout}){
 let entries={},active=null,scope='',configText='',generation=0,inflight=null,lastAttempt=0,lastCheckedAt=null,status='Not checked',retryTimer=null;
 let health={reasonCode:'NOT_CHECKED',lastAttemptAt:null,lastSuccessAt:null,consecutiveFailures:0,lastOffered:null};
 const cancelRetry=()=>{if(retryTimer!==null){clearTimer(retryTimer);retryTimer=null;}};
 function retry(){
  cancelRetry();
  if(health.consecutiveFailures>2||!online()||!visible())return;
  retryTimer=setTimer(()=>{retryTimer=null;if(online()&&visible())refresh(true);},health.consecutiveFailures===1?30000:120000);
  retryTimer?.unref?.();
 }
 const reason=code=>{health.reasonCode=code;};
 const valid=c=>c.enabled!==false&&/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(c.url||'')&&typeof c.secret==='string'&&c.secret.length>=24;
 const getConfig=()=>{try{return config()||{};}catch(_){return {};}};
 const notify=()=>onChange(report());
 function persist(){try{storage.setItem(key,JSON.stringify({scope,entries,active,health}));}catch(_){status='Plan available for this visit; device cache unavailable.';}}
 function invalidate(){cancelRetry();generation++;entries={};active=null;scope='';configText='';inflight=null;lastAttempt=0;lastCheckedAt=null;health={reasonCode:'NOT_CHECKED',lastAttemptAt:null,lastSuccessAt:null,consecutiveFailures:0,lastOffered:null};}
 async function syncConfig(){
  const c=getConfig(),text=JSON.stringify([c.url,c.secret,c.enabled!==false]);
  if(text===configText&&scope)return c;
  invalidate();configText=text;
  if(!valid(c)){reason(c.enabled===false?'DISABLED':'NOT_CONNECTED');status='Configure the existing family mirror to receive priorities.';return null;}
  const g=generation,s=await hash(c.url+'\n'+c.secret);
  if(g!==generation||text!==JSON.stringify([getConfig().url,getConfig().secret,getConfig().enabled!==false]))return null;
  scope=s;
  try{
   const saved=JSON.parse(storage.getItem(key)||'null');
   if(saved?.scope===scope){
     // Only safe, independently validated timestamps survive a reload.
     if(time(saved.health?.lastSuccessAt)&&Date.parse(saved.health.lastSuccessAt)<=now())health.lastSuccessAt=saved.health.lastSuccessAt;

    for(const [d,e] of Object.entries(saved.entries||{})){
     try{const p=validate(e.plan,student,catalog,now());if(p.sessionDate===d&&Math.abs(Date.parse(d)-Date.parse(day(now())))<=3*DAY)entries[d]={plan:p,receivedAt:e.receivedAt,adoptedAt:e.adoptedAt||null,startedAt:e.startedAt||null};}catch(_){}
    }
    if(saved.active){try{const p=validate(saved.active.plan,student,catalog,now());active={plan:p,receivedAt:saved.active.receivedAt,adoptedAt:saved.active.adoptedAt,startedAt:saved.active.startedAt||null};}catch(_){}}
   }
  }catch(_){}
  return c;
 }
 function receive(p){
  const old=entries[p.sessionDate];
  if(old){
   if(p.revision<old.plan.revision||Date.parse(p.sourceExportedAt)<Date.parse(old.plan.sourceExportedAt))throw fault('OLDER_PLAN','Older plan ignored.');
   if(p.revision===old.plan.revision){if(JSON.stringify(p)!==JSON.stringify(old.plan))throw fault('REVISION_CONFLICT','Conflicting revision ignored.');return;}
   if(p.id!==old.plan.id)throw fault('IDENTITY_CHANGED','Same-date identity changed.');
  }
  entries[p.sessionDate]={plan:p,receivedAt:new Date(now()).toISOString(),adoptedAt:null,startedAt:null};
  const dates=Object.keys(entries).sort();while(dates.length>4)delete entries[dates.shift()];persist();
 }
 async function refresh(force=false){
  let c;try{c=await syncConfig();}catch(_){reason('CACHE_UNAVAILABLE');status='Private plan cache unavailable; built-in learning continues.';notify();return false;}
  if(!c){notify();return false;}
  if(inflight)return inflight;
  if(!online()){cancelRetry();reason('OFFLINE');status='Offline: saved priorities for this date or built-in learning.';notify();return false;}
  if(!force&&now()-lastAttempt<300000)return false;
  const g=generation;cancelRetry();lastAttempt=now();health.lastAttemptAt=new Date(lastAttempt).toISOString();reason('CHECKING');status='Checking priorities…';notify();
  const run=(async()=>{
   const controller=new AbortController();let timer;
   try{
    const timed=new Promise((_,reject)=>{timer=setTimer(()=>{controller.abort();reject(fault('TIMEOUT','Timed out'));},15000);});
    const fetchPlan=async()=>{
     const r=await request(c.url,{method:'POST',mode:'cors',credentials:'omit',redirect:'follow',cache:'no-store',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'read'+student+'NextSession',secret:c.secret}),signal:controller.signal});
     if(r.type==='opaque')throw fault('OPAQUE_RESPONSE','No readable response');
     if(!r.ok)throw fault('HTTP_ERROR','No successful response');
     const text=await r.text();if(text.length>24000)throw fault('OVERSIZED_RESPONSE','Oversized response');try{return JSON.parse(text);}catch(_){throw fault('INVALID_JSON','Unreadable response');}
    };
    const b=await Promise.race([fetchPlan(),timed]);
    if(g!==generation||JSON.stringify([getConfig().url,getConfig().secret,getConfig().enabled!==false])!==configText)return false;
    if(!b||b.service!=='family-learning-mirror'||b.planApi!==1||b.student!==student)throw fault('UNSUPPORTED_RELAY','Relay unavailable');
    if(b.ok!==true)throw fault('RELAY_REJECTED','Relay rejected the plan request');
    lastCheckedAt=new Date(now()).toISOString();
    if(b.plan!==null){const p=validate(b.plan,student,catalog,now());receive(p);health.lastOffered={...identity(p),sourceExportedAt:p.sourceExportedAt};}
    health.lastSuccessAt=lastCheckedAt;health.consecutiveFailures=0;
    reason(b.plan===null?'NO_PLAN':usable(b.plan,now())?'READY':b.plan.sessionDate<day(now())?'EXPIRED_PLAN':'FUTURE_PLAN');persist();
    status=b.plan===null?'No plan published; built-in learning continues.':usable(b.plan,now())?'Priorities received; applied at the next safe activity boundary.':'No plan for today; built-in learning continues.';
    notify();return true;
   }catch(error){if(g===generation){health.consecutiveFailures=Math.min(health.consecutiveFailures+1,999);reason(CODES.has(error?.planCode)?error.planCode:'FETCH_FAILED');status='Nightly update unavailable; built-in learning or a valid saved plan continues.';persist();notify();retry();}return false;}
   finally{clearTimer(timer);if(g===generation)inflight=null;}
  })();inflight=run;return run;
 }
 function connectionMatches(){const c=getConfig();return valid(c)&&JSON.stringify([c.url,c.secret,c.enabled!==false])===configText&&!!scope;}
 function adopt(){
  if(!connectionMatches())return null;
  const e=entries[day(now())];if(!e||!usable(e.plan,now()))return null;
  if(!active||JSON.stringify(identity(active.plan))!==JSON.stringify(identity(e.plan))){active=copy(e);active.adoptedAt=new Date(now()).toISOString();e.adoptedAt=active.adoptedAt;persist();notify();}
  return copy(active.plan);
 }
 function plan(){return connectionMatches()&&active&&usable(active.plan,now())?copy(active.plan):null;}
 function started(ref){if(!connectionMatches()||!active||!ref||JSON.stringify(identity(active.plan))!==JSON.stringify(ref))return;active.startedAt||=new Date(now()).toISOString();const e=entries[active.plan.sessionDate];if(e?.plan.revision===active.plan.revision)e.startedAt=active.startedAt;persist();notify();}
 function report(){
  const connected=connectionMatches(),e=connected?entries[day(now())]:null,p=connected&&active&&usable(active.plan,now())?active:null;
  const receipt=x=>x?{...identity(x.plan),sourceExportedAt:x.plan.sourceExportedAt,receivedAt:x.receivedAt,adoptedAt:x.adoptedAt,startedAt:x.startedAt}:null;
  return {schema:1,student,status,lastCheckedAt,received:receipt(e),active:receipt(p),diagnostics:copy(health),capabilities:{receiptDiagnostics:1,letterNameSoundChecks:student==='Jonah'?1:0}};
 }
 return {refresh,adopt,plan,started,report,invalidate,preview:()=>connectionMatches()&&entries[day(now())]&&usable(entries[day(now())].plan,now())?copy(entries[day(now())].plan):null,initialize:async()=>{try{await syncConfig();notify();}catch(_){reason('CACHE_UNAVAILABLE');status='Private plan cache unavailable; built-in learning continues.';notify();}}};
}
return {validate,usable,day,identity,create};
});
