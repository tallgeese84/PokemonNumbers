/* Upgrade of Euna's existing Mochi relay; preserves its URL, properties and filenames.
 * Keep MIRROR_SECRET and MIRROR_FOLDER_ID unchanged. Optional JONAH_FOLDER_ID
 * and HANA_FOLDER_ID select separate private folders. No secrets belong here.
 * Deploy a NEW VERSION of the EXISTING web-app deployment, executing as yourself.
 */
function doGet(){return json_({ok:true,service:'family-learning-mirror',apps:['Mochi learning','PokéMath learning','Hana learning'],writeOnly:true});}
function doPost(e){
 var lock=null,locked=false;
 try{
  var props=PropertiesService.getScriptProperties();
  var secret=String(props.getProperty('MIRROR_SECRET')||'');
  var raw=e&&e.postData?String(e.postData.contents||''):'';
  if(!secret||!raw||raw.length>8000000)throw Error('Relay is not configured or payload is invalid.');
  var body=JSON.parse(raw);
  if(String(body.secret||'')!==secret)throw Error('Unauthorized.');
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
