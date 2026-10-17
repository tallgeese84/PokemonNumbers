/* Guarded native-plan publication. No network, credentials or learner data in source. */
'use strict';
const DAY=86400000,ZONE='America/Chicago',PREFIX={Euna:'nightly-',Hana:'hana-nightly-',Jonah:'jonah-nightly-'};
const copy=x=>JSON.parse(JSON.stringify(x));
function canonical(x){if(Array.isArray(x))return '['+x.map(canonical).join(',')+']';if(x&&typeof x==='object')return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';return JSON.stringify(x);}
function day(at){return new Intl.DateTimeFormat('en-CA',{timeZone:ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(at));}
function addDay(d,n){return new Date(Date.parse(d+'T12:00:00Z')+n*DAY).toISOString().slice(0,10);}
function windowFor(now=Date.now()){
 if(!Number.isFinite(now))throw Error('Invalid real clock');
 const localDate=day(now),hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:ZONE,hour:'2-digit',hourCycle:'h23'}).format(new Date(now)));
 // An early evening scheduler must not publish a plan that expires at midnight.
 const sessionDate=hour>=20?addDay(localDate,1):localDate;
 return {timeZone:ZONE,localDate,sessionDate,reviewedDate:addDay(sessionDate,-1),generatedAt:new Date(now).toISOString()};
}
function prepare({student,sourceExportedAt,subjects,existing=null,validate,now=Date.now()}){
 if(!PREFIX[student]||typeof validate!=='function')throw Error('Student and app validator required');
 const w=windowFor(now),source=Date.parse(sourceExportedAt);
 if(!Number.isFinite(source)||source>now||now-source>3*DAY)throw Error('Source is not current enough for publication');
 const reviewedDate=[w.reviewedDate,day(source)].sort()[0];
 if(Date.parse(w.sessionDate)-Date.parse(reviewedDate)>3*DAY)throw Error('Review date outside permitted window');
 if(existing&&(existing.student!==student||existing.schema!==1||!Number.isInteger(existing.revision)||existing.revision<1))throw Error('Existing document identity conflict');
 if(existing&&existing.sessionDate>w.sessionDate)throw Error('A later plan is already published');
 if(existing&&Date.parse(existing.sourceExportedAt)>source)throw Error('Source regression refused');
 const sameDay=existing?.sessionDate===w.sessionDate;
 const p={schema:1,id:sameDay?existing.id:PREFIX[student]+w.sessionDate,revision:sameDay?existing.revision+1:1,student,timeZone:ZONE,reviewedDate,sessionDate:w.sessionDate,generatedAt:w.generatedAt,sourceExportedAt:new Date(source).toISOString(),subjects:copy(subjects)};
 if(sameDay&&existing.reviewedDate===reviewedDate&&existing.sourceExportedAt===p.sourceExportedAt&&canonical(existing.subjects)===canonical(p.subjects)){
  validate(existing,now);return {plan:copy(existing),unchanged:true,window:w};
 }
 const checked=validate(p,now);if(canonical(checked)!==canonical(p))throw Error('Validator changed the plan');
 return {plan:checked,unchanged:false,window:w};
}
function inspectDocument(input,expectedId,student){
 const d=input?.result||input;
 if(!d||d.documentId!==expectedId||typeof d.revisionId!=='string'||!d.revisionId)throw Error('Fresh document identity and revision required');
 const tabs=d.tabs||[];if(tabs.length!==1||tabs[0].childTabs?.length)throw Error('Expected one machine-plan tab');
 const t=tabs[0],tabId=t.tabId||t.tabProperties?.tabId,body=t.body||t.documentTab?.body;
 if(!tabId||!body?.content)throw Error('Tab content unavailable');
 let text='',end=1;
 for(const b of body.content){
  if(b.sectionBreak&&b.endIndex===1)continue;
  if(!b.paragraph||b.startIndex!==end||b.paragraph.bullet)throw Error('Unexpected machine-plan structure');
  for(const e of b.paragraph.elements||[]){
   if(!e.textRun||typeof e.textRun.content!=='string'||e.suggestedInsertionIds?.length||e.suggestedDeletionIds?.length||e.startIndex!==end||e.endIndex!==end+e.textRun.content.length)throw Error('Unexpected machine-plan content');
   text+=e.textRun.content;end=e.endIndex;
  }
  if(b.endIndex!==end)throw Error('Truncated document read');
 }
 if(!text.endsWith('\n')||text.length>24000)throw Error('Invalid machine-plan body');
 let plan;try{plan=text.trim()?JSON.parse(text):null;}catch(_){throw Error('Human text or malformed JSON: preserve document');}
 if(plan&&(plan.schema!==1||plan.student!==student))throw Error('Machine-plan identity conflict');
 return {documentId:expectedId,revisionId:d.revisionId,tabId,endIndex:end-1,plan,text};
}
function replacement(inspected,plan,validate,now=Date.now()){
 if(typeof validate!=='function')throw Error('App validator required');validate(plan,now);
 if(plan.sessionDate!==windowFor(now).sessionDate)throw Error('Publication date rolled over; rebuild from real clock');
 if(inspected.plan&&(inspected.plan.student!==plan.student||inspected.plan.sessionDate>plan.sessionDate))throw Error('Document identity or date advanced');
 if(inspected.plan?.sessionDate===plan.sessionDate){
  if(canonical(inspected.plan)===canonical(plan))return null;
  if(inspected.plan.id!==plan.id||plan.revision<=inspected.plan.revision)throw Error('Same-date update must advance revision');
 }
 const requests=[];
 if(inspected.endIndex>1)requests.push({deleteContentRange:{range:{tabId:inspected.tabId,startIndex:1,endIndex:inspected.endIndex}}});
 requests.push({insertText:{location:{tabId:inspected.tabId,index:1},text:JSON.stringify(plan)}});
 return {document_id:inspected.documentId,write_control:{requiredRevisionId:inspected.revisionId},requests};
}
function verifyReadback(input,expectedId,plan){
 const actual=inspectDocument(input,expectedId,plan.student);
 if(canonical(actual.plan)!==canonical(plan))throw Error('Publication readback mismatch');
 return {stage:'published',planId:plan.id,revision:plan.revision,sessionDate:plan.sessionDate,generatedAt:plan.generatedAt,sourceExportedAt:plan.sourceExportedAt,documentRevision:actual.revisionId};
}
// Worker needs only this helper, the release catalog and source verifier, not the whole app.
function appValidator(student){
 const catalog=require('./nightly-catalog.json')[student];if(!catalog)throw Error('Unknown student');
 const exact=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).every(k=>keys.includes(k));
 const date=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
 const time=s=>typeof s==='string'&&/^\d{4}-\d\d-\d\dT.*Z$/.test(s)&&Number.isFinite(Date.parse(s));
 const focus=s=>typeof s==='string'&&s.length>0&&s.length<=160&&!/[<>\u0000-\u001f]/.test(s);
 const list=(a,ids,regex,min=1)=>Array.isArray(a)&&a.length>=min&&a.length<=3&&new Set(a).size===a.length&&a.every(id=>typeof id==='string'&&regex.test(id)&&ids.includes(id));
 return (p,now=Date.now())=>{
  if(!exact(p,['schema','id','revision','student','timeZone','reviewedDate','sessionDate','generatedAt','sourceExportedAt','subjects'])||p.schema!==1||p.student!==student||typeof p.id!=='string'||!/^[a-zA-Z0-9_-]{8,100}$/.test(p.id)||!Number.isInteger(p.revision)||p.revision<1||p.revision>10000||p.timeZone!==ZONE||!date(p.reviewedDate)||!date(p.sessionDate)||p.reviewedDate>=p.sessionDate||Date.parse(p.sessionDate)-Date.parse(p.reviewedDate)>3*DAY||!time(p.generatedAt)||!time(p.sourceExportedAt)||Date.parse(p.generatedAt)>now+300000||Date.parse(p.sourceExportedAt)>Date.parse(p.generatedAt)||Date.parse(p.generatedAt)-Date.parse(p.sourceExportedAt)>3*DAY||day(Date.parse(p.sourceExportedAt))<p.reviewedDate)throw Error('Invalid plan identity or dates');
  const subjects=student==='Euna'?['maths','science']:student==='Jonah'?['reading','maths']:['maths'];
  if(!exact(p.subjects,subjects)||subjects.some(s=>!p.subjects[s]))throw Error('Missing or unexpected subject');
  if(student==='Euna')for(const s of subjects){
   const b=p.subjects[s];if(!exact(b,['focus','steps'])||!focus(b.focus)||!Array.isArray(b.steps)||b.steps.length<1||b.steps.length>5)throw Error('Invalid subject plan');
   let count=0;for(const t of b.steps){
    if(!exact(t,['kind','unit','phase','count'])||!catalog[s].includes(t.unit)||!['lesson','practice'].includes(t.kind))throw Error('Unknown lesson or action');
    if(t.kind==='lesson'){if(t.phase!==undefined||t.count!==undefined)throw Error('Invalid lesson');}
    else{if(!['guided','apply','transfer'].includes(t.phase)||!Number.isInteger(t.count)||t.count<1||t.count>2)throw Error('Invalid practice');count+=t.count;}
   }if(count>6)throw Error('Question limit');
  }else{
   const m=p.subjects.maths;if(!exact(m,['focus','skills'])||!focus(m.focus)||!list(m.skills,catalog.maths,/^[a-zA-Z0-9_-]{1,100}$/))throw Error('Unknown maths priority');
   if(student==='Jonah'){const r=p.subjects.reading;if(!exact(r,['focus','sounds','words'])||!focus(r.focus)||!list(r.sounds,catalog.sounds,/^[a-z]{1,4}$/,0)||!list(r.words,catalog.words,/^[a-z]{1,20}$/,0)||!(r.sounds.length+r.words.length))throw Error('Unknown reading priority');}
  }return copy(p);
 };
}
module.exports={windowFor,prepare,inspectDocument,replacement,verifyReadback,appValidator,canonical,day,addDay};
if(require.main===module){
 const fs=require('node:fs'),[mode,inputPath,outputPath]=process.argv.slice(2),read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
 if(!outputPath||!['prepare','verify'].includes(mode))throw Error('Usage: node tools/nightly-publication.cjs prepare|verify private-input.json private-output.json');
 const input=read(inputPath);let output;
 if(mode==='prepare'){
  const now=Date.now(),{verify}=require('./verify-learning-source.cjs');
  const checked=verify(fs.readFileSync(input.sourcePath),read(input.beforePath),read(input.afterPath),{student:input.student,fileId:input.sourceFileId,parentId:input.parentId},now);
  const doc=inspectDocument(read(input.documentPath),input.documentId,input.student),validate=appValidator(input.student);
  const prepared=prepare({student:input.student,sourceExportedAt:checked.proof.sourceExportedAt,subjects:input.subjects,existing:doc.plan,validate,now});
  output={...prepared,request:replacement(doc,prepared.plan,validate,now),sourceProof:checked.proof};
 }else{const prepared=read(input.preparedPath);output=verifyReadback(read(input.documentPath),input.documentId,prepared.plan);}
 fs.writeFileSync(outputPath,JSON.stringify(output,null,2));
 console.log(mode==='prepare'?'Prepared guarded private publication. Invoke the returned request, then verify native readback.':'Verified native plan publication. Device receipt remains separately unverified.');
}
