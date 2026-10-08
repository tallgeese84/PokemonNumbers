/* Family relay 1.2.0: existing three-child uploads plus fixed, read-only nightly plan routes.
 * Compatibility patch only: retains shared-secret authentication, NOT Google sign-in.
 * Do not change deployment access or publish without the owner's approval.
 * The relay serves a plan written by a separate reviewer; it does not run that review.
 * Upgrade of Euna's existing Mochi relay; preserves its URL, properties and filenames.
 * Keep MIRROR_SECRET and MIRROR_FOLDER_ID unchanged. Optional JONAH_FOLDER_ID
 * and HANA_FOLDER_ID select separate private folders. No secrets belong here.
 * Deploy a NEW VERSION of the EXISTING web-app deployment, executing as yourself.
 */
function doGet(){return json_({ok:true,service:'family-learning-mirror',apps:['Mochi learning','PokéMath learning','Hana learning'],writeOnly:false,planApi:1,relayVersion:'1.2.0'});}
function doPost(e){
 var lock=null,locked=false;
 try{
  var props=PropertiesService.getScriptProperties();
  var secret=String(props.getProperty('MIRROR_SECRET')||'');
  var raw=e&&e.postData?String(e.postData.contents||''):'';
  if(!secret||!raw||raw.length>8000000)throw Error('Relay is not configured or payload is invalid.');
  var body=JSON.parse(raw);
  if(String(body.secret||'')!==secret)throw Error('Unauthorized.');
  // Read requests exit before backup parsing, folder selection, locks or any write.
  if(body.action==='readNextSession'){
   if(Object.keys(body).some(function(k){return k!=='action'&&k!=='secret';}))throw Error('Invalid plan request.');
   return readNextSession_(props);
  }
  if(body.action==='readHanaNextSession'||body.action==='readJonahNextSession'){
   if(Object.keys(body).some(function(k){return k!=='action'&&k!=='secret';}))throw Error('Invalid plan request.');
   return readSiblingPlan_(props,body.action==='readHanaNextSession'?'Hana':'Jonah');
  }
  if(body.action)throw Error('Unknown relay action.');
  var b=body.backup,isJonah=b&&b.app==='PokéMath learning',isHana=b&&b.app==='Hana learning';
  if(!b||(isHana?b.schemaVersion!==1:b.version!==1)||(!isHana&&!isJonah&&b.app!=='Mochi learning'))throw Error('Unsupported learning backup.');
  if(isHana)validateHana_(b);
  var folderId=(isHana?props.getProperty('HANA_FOLDER_ID'):isJonah?props.getProperty('JONAH_FOLDER_ID'):'')||props.getProperty('MIRROR_FOLDER_ID');
  if(!folderId)throw Error('Missing mirror folder.');
  // Serialize read/merge/write so a late device cannot erase another device's sessions.
  lock=LockService.getScriptLock();locked=lock.tryLock(20000);if(!locked)throw Error('Mirror is busy; retry later.');
  var folder=DriveApp.getFolderById(folderId),prefix=isHana?'hana-learning':isJonah?'jonah-pokemath':'euna-mochi',name=prefix+'-latest.json';
  if(isHana){
   var hanaFiles=folder.getFilesByName(name),previous=hanaFiles.hasNext()?JSON.parse(hanaFiles.next().getBlob().getDataAsString()):null;
   if(previous&&(previous.app!=='Hana learning'||previous.schemaVersion!==1||!Number.isFinite(previous.exportedAt)))throw Error('Existing Hana file has an unexpected schema; refusing to replace it.');
   if(previous&&b.exportedAt<=previous.exportedAt)return json_({ok:true,latest:name,status:'older snapshot skipped'});
   b=hanaReview_(b);
  }
  if(isJonah){
   validateJonah_(b);
   var current=folder.getFilesByName(name),old=current.hasNext()?JSON.parse(current.next().getBlob().getDataAsString()):null;
   b=mergeJonah_(old,b,new Date().toISOString());
  }
  var text=JSON.stringify(b,null,2);
  if(text.length>12000000)throw Error('Merged history is too large; existing files retained.');
  upsert_(folder,name,text);
  var weekly=prefix+'-'+isoWeek_(new Date())+'.json';upsert_(folder,weekly,text);
  return json_({ok:true,latest:name,weekly:weekly,bytes:text.length});
 }catch(err){return json_({ok:false,error:String(err&&err.message||err)});}
 finally{if(locked)lock.releaseLock();}
}
function validateHana_(b){
 if(!b.learning||!Array.isArray(b.learning.events)||!Array.isArray(b.learning.checks)||!Array.isArray(b.skills)||!Array.isArray(b.next)||!b.periods)throw Error('Invalid Hana review.');
 if(!Number.isFinite(b.exportedAt)||b.exportedAt<0||b.exportedAt>Date.now()+300000)throw Error('Invalid Hana export time.');
 if(b.learning.events.length>5000||b.learning.checks.length>2000)throw Error('Hana review exceeds history limits.');
}
function hanaReview_(b){
 // This is Hana's analysis snapshot, not its full game/cloud backup.
 var result={};
 ['app','schemaVersion','appVersion','exportedAt','exportedAtISO','timeZone','limits','learning','periods','next','skills'].forEach(function(key){if(b[key]!==undefined)result[key]=b[key];});
 result.receivedAt=new Date().toISOString();
 return result;
}
function validateJonah_(b){
 if(!b.sessions||typeof b.sessions!=='object'||Array.isArray(b.sessions))throw Error('Invalid sessions.');
 Object.keys(b.sessions).forEach(function(id){var s=b.sessions[id];if(!/^[A-Za-z0-9_-]+$/.test(id)||!s||s.id!==id||!Number.isFinite(s.rev)||s.rev<0||!s.days||!s.questions)throw Error('Invalid session record.');});
 if(!Number.isFinite(Date.parse(b.exportedAt)))throw Error('Invalid export time.');
}
function mergeJonah_(old,incoming,receivedAt){
 if(old&&(old.app!=='PokéMath learning'||old.version!==1))throw Error('Existing file has an unexpected schema; refusing to replace it.');
 var newer=!old||Date.parse(incoming.exportedAt)>=Date.parse(old.exportedAt),meta=newer?incoming:old;
 var sessions=Object.assign(Object.create(null),old?old.sessions:{});
 Object.keys(incoming.sessions).forEach(function(id){var s=incoming.sessions[id];if(!sessions[id]||s.rev>sessions[id].rev)sessions[id]=s;});
 // Explicit envelope allowlist: no connection settings or credentials in the mirror.
 return {app:'PokéMath learning',version:1,schema:1,build:meta.build,child:'Jonah',timezone:'America/Chicago',exportedAt:meta.exportedAt,receivedAt:receivedAt,
  lastCloudSyncAt:Math.max(Number(old&&old.lastCloudSyncAt)||0,Number(incoming.lastCloudSyncAt)||0),settings:{goalMinutes:meta.settings&&meta.settings.goalMinutes||15},sessions:sessions,
  notes:'Merged by session ID and revision; retains earlier uploads. Other devices may have unsynced activity. receivedAt is relay receipt time, not proof of new practice.'};
}
function upsert_(folder,name,text){var files=folder.getFilesByName(name);if(files.hasNext()){files.next().setContent(text);return;}folder.createFile(name,text,MimeType.PLAIN_TEXT);}
function isoWeek_(date){
 var day=Utilities.formatDate(date,'America/Chicago','yyyy-MM-dd'),d=new Date(day+'T12:00:00Z');
 d.setUTCDate(d.getUTCDate()+4-(d.getUTCDay()||7));var year=d.getUTCFullYear(),start=new Date(Date.UTC(year,0,1));
 return year+'-W'+String(Math.ceil((((d-start)/86400000)+1)/7)).padStart(2,'0');
}
function json_(value){return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);}


/* Run ONCE in the Apps Script editor before deploying the new version. No new secret.
   Finds exactly one owner-controlled document; it never changes sharing permissions.
   No web route invokes this setup helper. */
function setupNightlyPlan() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('MIRROR_SECRET') || !props.getProperty('MIRROR_FOLDER_ID')) throw Error('Keep the existing mirror properties first.');
  const files = DriveApp.searchFiles("title = 'Euna — App next-session plan (JSON)' and 'me' in owners and trashed = false");
  const matches = [];
  while (files.hasNext()) { const file = files.next(); if (file.getMimeType() === MimeType.GOOGLE_DOCS) matches.push(file); }
  if (matches.length !== 1) throw Error('Expected exactly one private App next-session plan (JSON) document owned by you.');
  if (matches[0].getSharingAccess() !== DriveApp.Access.PRIVATE) throw Error('The plan document must not have public or domain link access.');
  // Opening the document requests the new Docs permission during the one-time editor run.
  DocumentApp.openById(matches[0].getId()).getBody().getText();
  props.setProperty('NIGHTLY_PLAN_DOC_ID', matches[0].getId());
  console.log('Private plan reader configured. Run checkFamilyRelayReadOnly next. Nothing has been deployed.');
}
function readNextSession_(props) {
  // Mochi v7.7.0 checks this exact service label. Keep it for this action only.
  const envelope = {service:'mochi-drive-mirror', planApi:1};
  try {
    const id = String(props.getProperty('NIGHTLY_PLAN_DOC_ID') || '');
    if (!id) return json_(Object.assign(envelope, {ok:false,error:'Plan reader is not configured.'}));
    const file = DriveApp.getFileById(id);
    if (file.isTrashed() || file.getMimeType() !== MimeType.GOOGLE_DOCS || file.getSharingAccess() !== DriveApp.Access.PRIVATE) throw Error('Unavailable');
    const text = DocumentApp.openById(id).getBody().getText().trim();
    if (!text) return json_(Object.assign(envelope, {ok:true,plan:null}));
    if (text.length > 20000) throw Error('Oversized');
    const plan = JSON.parse(text);
    validateNightlyPlan_(plan);
    // This action returns only the configured plan, never mirror history or arbitrary files.
    return json_(Object.assign(envelope, {ok:true,plan:plan}));
  } catch (_) {
    return json_(Object.assign(envelope, {ok:false,error:'Private plan is unavailable or invalid.'}));
  }
}

/* Structural validation only; the app performs curriculum, freshness and session-date
   validation. Old plans are never silently relabelled as today's plan. No eval/HTML. */
function validateNightlyPlan_(p) {
  function keys(o, allowed) {
    return o && typeof o === 'object' && !Array.isArray(o) &&
      Object.keys(o).every(function(k) { return allowed.indexOf(k) >= 0; });
  }
  function date(s) {
    return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) &&
      Number.isFinite(Date.parse(s+'T12:00:00Z')) &&
      new Date(s+'T12:00:00Z').toISOString().slice(0,10) === s;
  }
  function time(s) { return typeof s === 'string' && /^\d{4}-\d\d-\d\dT.*Z$/.test(s) && Number.isFinite(Date.parse(s)); }
  if (!keys(p, ['schema','id','revision','student','timeZone','reviewedDate','sessionDate','generatedAt','sourceExportedAt','subjects']) ||
      p.schema !== 1 || p.student !== 'Euna' || typeof p.id !== 'string' || !/^[a-zA-Z0-9_-]{8,100}$/.test(p.id) ||
      !Number.isInteger(p.revision) || p.revision < 1 || p.revision > 10000 ||
      typeof p.timeZone !== 'string' || !p.timeZone || p.timeZone.length > 60 ||
      !date(p.reviewedDate) || !date(p.sessionDate) || p.sessionDate <= p.reviewedDate ||
      (Date.parse(p.sessionDate)-Date.parse(p.reviewedDate)) > 3*86400000 ||
      !time(p.generatedAt) || !time(p.sourceExportedAt) || Date.parse(p.sourceExportedAt) > Date.parse(p.generatedAt) ||
      !keys(p.subjects, ['maths','science'])) throw Error('Invalid plan.');
  ['maths','science'].forEach(function(subject) {
    var b=p.subjects[subject], total=0;
    if (!keys(b,['focus','steps']) || typeof b.focus !== 'string' || !b.focus.length || b.focus.length>160 ||
        /[<>\u0000-\u001f]/.test(b.focus) || !Array.isArray(b.steps) || b.steps.length<1 || b.steps.length>5) throw Error('Invalid subject plan.');
    b.steps.forEach(function(s) {
      if (!keys(s,['kind','unit','phase','count']) || typeof s.unit !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(s.unit)) throw Error('Invalid lesson.');
      if (s.kind==='lesson') {
        if (s.phase!==undefined || s.count!==undefined) throw Error('Invalid lesson step.');
      } else if (s.kind==='practice') {
        if (['guided','apply','transfer'].indexOf(s.phase)<0 || !Number.isInteger(s.count) || s.count<1 || s.count>2) throw Error('Invalid practice step.');
        total+=s.count;
      } else throw Error('Invalid action.');
    });
    if (total>6) throw Error('Too many questions.');
  });
}

/* EDITOR-ONLY CHECK. No backup writes, property changes, sharing changes or deployment.
   This checks saved source/configuration, NOT the published /exec endpoint or CORS.
   Logs only filenames/status and plan dates, never tokens, private IDs or answers. */
function checkFamilyRelayReadOnly() {
  var props=PropertiesService.getScriptProperties();
  var result={relayVersion:'1.2.0',check:'saved-source-only',deploymentVerified:false,uploads:{}};
  if (!props.getProperty('MIRROR_SECRET')) throw Error('Existing MIRROR_SECRET is missing. Do not generate a replacement.');
  [
    {child:'Euna',key:'MIRROR_FOLDER_ID',file:'euna-mochi-latest.json',app:'Mochi learning'},
    {child:'Hana',key:'HANA_FOLDER_ID',file:'hana-learning-latest.json',app:'Hana learning'},
    {child:'Jonah',key:'JONAH_FOLDER_ID',file:'jonah-pokemath-latest.json',app:'PokéMath learning'}
  ].forEach(function(route) {
    try {
      var id=props.getProperty(route.key)||props.getProperty('MIRROR_FOLDER_ID');
      if (!id) throw Error('Missing folder setting.');
      var files=DriveApp.getFolderById(id).getFilesByName(route.file);
      if (!files.hasNext()) { result.uploads[route.child]={file:route.file,status:'No existing mirror in configured folder; live upload still needs checking.'}; return; }
      var file=files.next(), b=JSON.parse(file.getBlob().getDataAsString());
      if (b.app!==route.app || (route.child==='Hana'?b.schemaVersion!==1:b.version!==1)) throw Error('Unexpected format.');
      if (route.child==='Hana') validateHana_(b);
      if (route.child==='Jonah') validateJonah_(b);
      result.uploads[route.child]={file:route.file,status:files.hasNext()?'Duplicate filenames: inspect before deployment.':'Existing mirror readable; format recognised.'};
    } catch (_) { result.uploads[route.child]={file:route.file,status:'Check failed: inspect folder setting, access and backup format.'}; }
  });
  var answer=JSON.parse(readNextSession_(props).getContent());
  result.nightlyPlan={readable:answer.ok===true && !!answer.plan};
  if (result.nightlyPlan.readable) {
    result.nightlyPlan.sessionDate=answer.plan.sessionDate;
    result.nightlyPlan.revision=answer.plan.revision;
    try { result.nightlyPlan.datedForToday=answer.plan.sessionDate===Utilities.formatDate(new Date(),answer.plan.timeZone,'yyyy-MM-dd'); }
    catch (_) { result.nightlyPlan.datedForToday=false; }
  } else result.nightlyPlan.status='Plan missing, unavailable or invalid; upload routes remain independent.';
  result.siblingPlans={};
  ['Hana','Jonah'].forEach(function(child){
    var response=JSON.parse(readSiblingPlan_(props,child).getContent());
    result.siblingPlans[child]={readable:response.ok===true&&!!response.plan};
    if(response.ok&&response.plan){result.siblingPlans[child].sessionDate=response.plan.sessionDate;result.siblingPlans[child].revision=response.plan.revision;}
  });
  console.log(JSON.stringify(result,null,2));
  return result;
}

/* Fixed routes: callers cannot choose a document ID, folder or student.
   These optional properties must be configured only after owner approval.
   Missing sibling configuration never falls back to Euna's document. */
function readSiblingPlan_(props, student) {
  var key=student==='Hana'?'HANA_NIGHTLY_PLAN_DOC_ID':student==='Jonah'?'JONAH_NIGHTLY_PLAN_DOC_ID':null;
  var envelope={service:'family-learning-mirror',planApi:1,student:student};
  try {
    if(!key)throw Error('Invalid route');
    var id=String(props.getProperty(key)||'');
    if(!id)return json_(Object.assign(envelope,{ok:false,error:'Plan reader is not configured.'}));
    var file=DriveApp.getFileById(id);
    if(file.isTrashed()||file.getMimeType()!==MimeType.GOOGLE_DOCS||file.getSharingAccess()!==DriveApp.Access.PRIVATE)throw Error('Unavailable');
    var text=DocumentApp.openById(id).getBody().getText().trim();
    if(!text)return json_(Object.assign(envelope,{ok:true,plan:null}));
    if(text.length>20000)throw Error('Oversized');
    var plan=JSON.parse(text);if(plan!==null)validatePriorityPlan_(plan,student);
    return json_(Object.assign(envelope,{ok:true,plan:plan}));
  }catch(_){return json_(Object.assign(envelope,{ok:false,error:'Private plan is unavailable or invalid.'}));}
}

/* Data-only priority hints. Apps validate actual curriculum IDs and retain all
   prerequisite, recall, difficulty, time, reward and saved-work decisions. */
function validatePriorityPlan_(p,student) {
  function exact(o,keys){return o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).every(function(k){return keys.indexOf(k)>=0;});}
  function date(s){return typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;}
  function time(s){return typeof s==='string'&&/^\d{4}-\d\d-\d\dT.*Z$/.test(s)&&Number.isFinite(Date.parse(s));}
  function list(a,max,pattern){return Array.isArray(a)&&a.length<=max&&a.every(function(v){return typeof v==='string'&&pattern.test(v);})&&new Set(a).size===a.length;}
  function block(b,keys){return exact(b,keys)&&typeof b.focus==='string'&&b.focus.length>0&&b.focus.length<=160&&!/[<>\u0000-\u001f]/.test(b.focus);}
  if(['Hana','Jonah'].indexOf(student)<0||!exact(p,['schema','id','revision','student','timeZone','reviewedDate','sessionDate','generatedAt','sourceExportedAt','subjects'])||p.schema!==1||p.student!==student||
    typeof p.id!=='string'||!/^[a-zA-Z0-9_-]{8,100}$/.test(p.id)||!Number.isInteger(p.revision)||p.revision<1||p.revision>10000||p.timeZone!=='America/Chicago'||
    !date(p.reviewedDate)||!date(p.sessionDate)||p.sessionDate<=p.reviewedDate||Date.parse(p.sessionDate)-Date.parse(p.reviewedDate)>3*86400000||
    !time(p.generatedAt)||!time(p.sourceExportedAt)||Date.parse(p.sourceExportedAt)>Date.parse(p.generatedAt)||Date.parse(p.generatedAt)-Date.parse(p.sourceExportedAt)>3*86400000||
    !exact(p.subjects,student==='Hana'?['maths']:['reading','maths']))throw Error('Invalid priority plan.');
  var maths=p.subjects.maths;
  if(!block(maths,['focus','skills'])||!list(maths.skills,3,/^[a-zA-Z0-9_-]{1,100}$/)||!maths.skills.length)throw Error('Invalid maths priorities.');
  if(student==='Jonah'){
    var reading=p.subjects.reading;
    if(!block(reading,['focus','sounds','words'])||!list(reading.sounds,3,/^[a-z]{1,4}$/)||!list(reading.words,3,/^[a-z]{1,20}$/)||!(reading.sounds.length+reading.words.length))throw Error('Invalid reading priorities.');
  }
}
