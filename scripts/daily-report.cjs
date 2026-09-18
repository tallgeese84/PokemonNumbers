'use strict';
const C=require('../learning-core.js');
const {createHash}=require('node:crypto');
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct=x=>x===null?'not enough data':Math.round(x*100)+'%';
const mins=x=>(x/60000).toFixed(1);
function report(sessions,devices,date){
  const daily=C.summarize(sessions,date);
  const week=C.summarize(sessions,C.shiftDay(date,-6),date);
  const previous=C.summarize(sessions,C.shiftDay(date,-13),C.shiftDay(date,-7));
  const previousDays=C.summarize(sessions,C.shiftDay(date,-7),C.shiftDay(date,-1));
  const advice=C.guidance(week);
  const deviceTimes=Object.values(devices || {}).map(d=>d.lastSeenAt || 0);
  const lastSync=Math.max(0,...deviceTimes);
  const syncLine=lastSync ? new Date(lastSync).toLocaleString('en-US',{timeZone:C.ZONE})+' Madison time' : 'No device heartbeat received';
  const lines=[`PokéMath — ${date}`, '',
    `Estimated active practice: ${mins(daily.practiceMs)} minutes. Foreground app time: ${mins(daily.foregroundMs)} minutes. Collection browsing: ${mins(daily.collectionMs)} minutes.`,
    `Questions: ${daily.attempted} attempted, ${daily.completed} completed, ${daily.started-daily.completed} unfinished.`,
    `Independent first-response accuracy: ${pct(daily.accuracy)} (${daily.independent}/${daily.attempted}). Extra help used on ${daily.helped} questions.`,
    `Previous 7 days: ${(previousDays.practiceMs/60000/7).toFixed(1)} active minutes/day; ${pct(previousDays.accuracy)} independent (${previousDays.attempted} attempts).`,
    '', 'Sections worked on:',...Object.entries(daily.sections).map(([k,v])=>`• ${C.LABELS[k] || k}: ${mins(v)} active minutes.`),
    '', 'Skill detail (built-in supports kept separate):',
    ...Object.values(daily.groups).map(g=>`• ${C.LABELS[g.section]} / ${g.skill}, within ${g.range}, ${g.support}, ${g.format}: ${g.independent}/${g.n} independent; ${g.helped} helped; median independent response ${g.medianMs===null?'not available':(g.medianMs/1000).toFixed(1)+' seconds'}.`),
    '', 'Last 7 days vs previous 7 days (matching tasks only):',
    ...C.comparisons(week,previous).map(g=>`• ${C.LABELS[g.section]} / ${g.skill}, within ${g.range}, ${g.support}, ${g.format}: ${g.accuracyChange===null?'too little data for a trend':(g.accuracyChange>=0?'+':'')+Math.round(g.accuracyChange*100)+' percentage points independent accuracy'} (n=${g.n} vs ${g.previousN}).${g.timeChange===null?'':' Median independent response changed by '+(g.timeChange>=0?'+':'')+(g.timeChange/1000).toFixed(1)+' seconds.'}`),
    '', `Later-day checks this week: ${week.retention.independent}/${week.retention.checked} independent.`,
    `Comparable early/late sessions this week: ${week.fatigue.sessions}${week.fatigue.sessions ? '; independent accuracy '+pct(week.fatigue.early)+' → '+pct(week.fatigue.late) : '; too little evidence for a fatigue comparison'}.`,
    '', 'Difficulty changes:'];
  const keys=[...new Set(C.allQuestions(sessions).map(q=>q.section+':'+q.skill))];
  const changes=keys.flatMap(key=>{const [section,skill]=key.split(':');return C.planFor(section,skill,sessions).changes.filter(c=>C.dayKey(c.at)===date).map(c=>`• ${C.LABELS[section]} / ${skill}: step ${c.from+1} → ${c.to+1}. ${c.reason}.`);});
  lines.push(...(changes.length?changes:['No confirmed change today.']), '', 'Recent first-response mistakes:',
    ...daily.mistakes.slice(-8).map(m=>`• ${C.LABELS[m.section]} / ${m.skill}, ${m.format}: operands ${m.a}, ${m.b}; first answer ${m.first}; expected ${m.expected}.`),
    '', 'Next practice:',advice.focus,advice.duration,`Offline activity: ${advice.offline}`, '',
    `Last device upload: ${syncLine}.`,
    ...(daily.practiceMs===0?['No activity is recorded for this day. This does not prove no practice: a device may be offline or may not have synced.']:[]),
    ...(deviceTimes.some(t=>C.dayKey(t)<=date)?['At least one known device has not checked in after the report day. Totals may be incomplete.']:[]),
    'Offline activity appears in later reports and rolling weekly totals after upload. Already-sent daily emails are not revised.',
    '', 'Timing counts visible questions and thinking, pauses after 60 seconds without interaction, and excludes rewards and collection browsing. It estimates activity, not attention. Independent means no extra help; built-in pictures and manipulatives are compared separately. Guided tracing completion is not freehand handwriting mastery.',
    'Difficulty thresholds are adjustable design rules (8/10 across varied questions plus 3 independent, varied later-day checks), not validated diagnostic cutoffs.');
  const text=lines.join('\n');
  return {subject:`PokéMath daily adventure · ${date}`,text,html:`<!doctype html><html><body style="font:16px/1.6 system-ui,sans-serif;color:#253858;max-width:720px;margin:auto;padding:24px"><h1 style="font-size:25px">PokéMath learning journal</h1><div style="white-space:pre-wrap">${esc(text)}</div></body></html>`};
}
function databaseRoot(env){
  const u=new URL(env.POKEMATH_FIREBASE_URL);
  if(u.protocol!=='https:' || !/^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(firebaseio\.com|firebasedatabase\.app)$/i.test(u.hostname) || u.pathname!=='/' || u.search || u.hash)throw new Error('Invalid Firebase URL configuration');
  if(!/^[a-zA-Z0-9_-]{6,128}$/.test(env.POKEMATH_FAMILY_CODE || ''))throw new Error('Invalid family code configuration');
  return u.origin+'/fam/'+encodeURIComponent(env.POKEMATH_FAMILY_CODE)+'/pokemathAnalytics';
}
async function run(env=process.env,fetcher=fetch,now=new Date()){
  const required=['POKEMATH_FIREBASE_URL','POKEMATH_FAMILY_CODE','POKEMATH_REPORT_TO','RESEND_API_KEY','POKEMATH_REPORT_FROM'];
  const missing=required.filter(k=>!env[k]);if(missing.length)throw new Error('Missing repository secrets: '+missing.join(', '));
  const root=databaseRoot(env),date=C.shiftDay(C.dayKey(now.getTime()),-1);
  const headers=env.POKEMATH_FIREBASE_TOKEN ? {Authorization:'Bearer '+env.POKEMATH_FIREBASE_TOKEN} : {};
  async function db(path,opts={}){
    const res=await fetcher(root+path,{...opts,headers:{...headers,...opts.headers},signal:AbortSignal.timeout(20000)});
    if(!res.ok && res.status!==412)throw new Error('Firebase request failed ('+res.status+'); verify family rules and credentials.');return res;
  }
  const receiptPath='/reports/'+date+'.json';
  const existing=await db(receiptPath,{headers:{'X-Firebase-ETag':'true'}});let receipt=await existing.json();
  if(receipt?.sentAt)return {status:'already sent'};
  if(!receipt){
    const query=new URLSearchParams({orderBy:JSON.stringify('$key'),startAt:JSON.stringify(String(now.getTime()-90*86400000))});
    const [s,d]=await Promise.all([db('/sessions.json?'+query),db('/devices.json')]);
    const payload={from:env.POKEMATH_REPORT_FROM,to:[env.POKEMATH_REPORT_TO],...report(await s.json() || {},await d.json() || {},date)};
    if(env.POKEMATH_DRY_RUN==='true')return {status:'validated without sending'};
    receipt={createdAt:now.getTime(),payload};
    const etag=existing.headers.get('etag');if(!etag)throw new Error('Firebase did not provide a report version');
    const put=await db(receiptPath,{method:'PUT',headers:{'Content-Type':'application/json','if-match':etag},body:JSON.stringify(receipt)});
    if(put.status===412)receipt=await (await db(receiptPath)).json();
  }
  if(receipt?.sentAt)return {status:'already sent'};
  if(env.POKEMATH_DRY_RUN==='true')return {status:'validated without sending'};
  if(!receipt?.payload)throw new Error('Invalid saved report');
  // A pending delivery beyond Resend's 24-hour idempotency window needs human reconciliation.
  // Fail closed instead of risking a duplicate email.
  if(now.getTime()-receipt.createdAt>23*3600000)throw new Error('Old pending delivery: check Resend delivery history before retrying.');
  const idKey='pokemath-'+createHash('sha256').update(root+':'+date).digest('hex').slice(0,40);
  const sent=await fetcher('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':idKey},body:JSON.stringify(receipt.payload),signal:AbortSignal.timeout(20000)});
  if(!sent.ok)throw new Error('Email provider refused delivery ('+sent.status+'); check sender verification and API key.');
  const result=await sent.json();if(!result.id)throw new Error('Email provider did not confirm acceptance');
  await db(receiptPath,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({sentAt:now.getTime(),providerId:result.id})});
  return {status:'accepted by email provider'};
}
if(require.main===module)run().then(r=>console.log('Daily report: '+r.status+'.')).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={report,run,databaseRoot};
