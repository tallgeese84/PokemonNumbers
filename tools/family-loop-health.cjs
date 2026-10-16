'use strict';
// Pure operational health, not educational assessment. Unknown/offline is not failure.
const day=(at,zone='America/Chicago')=>new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(at));
const stamp=x=>Number.isFinite(x)?x:Date.parse(x);
const matches=(a,b)=>!!a&&a.planId===b.id&&a.revision===b.revision&&a.sessionDate===b.sessionDate;
function assess({source,feed,plan,receipt,events=[],newestDeviceActivityAt,hasReviewedActivity=false,safeBoundariesAfterAdoption=0,hasPendingWork=true,now=Date.now()}){
 const result={date:day(now),feedLagging:!!feed&&feed.sourceModifiedAt!==source?.sourceModifiedAt,stage:'unknown',alert:false};
 if(!source?.verified)return {...result,stage:'source-unverified',alert:true};
 if(!hasReviewedActivity)return {...result,stage:'no-new-evidence'};
 if(!plan||plan.sessionDate!==result.date)return {...result,stage:'publication-missing',alert:true};
 if(stamp(plan.sourceExportedAt)>stamp(plan.generatedAt)||stamp(plan.generatedAt)>now+300000||stamp(plan.generatedAt)-stamp(plan.sourceExportedAt)>3*86400000)return {...result,stage:'plan-invalid',alert:true};
 // A newer mirror may contain later work; that alone does not invalidate a bounded plan.
 const identified=events.filter(e=>matches(e.nightlyPlan,plan));
 const completed=identified.filter(e=>e.completedAt||e.answeredAt||e.at&&('correct' in e||'independent' in e));
 if(completed.length)return {...result,stage:'work-recorded',completed:completed.length};
 if(identified.length||matches(receipt?.active,plan)&&receipt.active.startedAt)return {...result,stage:'work-started'};
 if(matches(receipt?.active,plan)){
  if(!hasPendingWork&&safeBoundariesAfterAdoption>=2&&stamp(source.sourceExportedAt)>stamp(receipt.active.adoptedAt)+30*60000)return {...result,stage:'routing-delayed',alert:true};
  return {...result,stage:'adopted-awaiting-safe-task'};
 }
 if(matches(receipt?.received,plan))return {...result,stage:'received-awaiting-boundary'};
 const check=stamp(receipt?.lastCheckedAt),published=stamp(plan.generatedAt),device=stamp(newestDeviceActivityAt);
 // Only a later online check plus later device use can establish a delivery issue.
 if(check>published+15*60000&&device>published+15*60000&&stamp(source.sourceExportedAt)>=check&&receipt?.diagnostics?.reasonCode!=='OFFLINE')return {...result,stage:'delivery-not-confirmed-after-check',alert:true};
 return {...result,stage:'device-receipt-pending'};
}
module.exports={assess,matches,day};
if(require.main===module){const fs=require('node:fs');const path=process.argv[2];if(!path)throw Error('Usage: node family-loop-health.cjs private-input.json');const input=JSON.parse(fs.readFileSync(path,'utf8'));process.stdout.write(JSON.stringify(assess(input)));}
