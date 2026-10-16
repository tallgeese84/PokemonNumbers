'use strict';
// Complete authenticated connector download verification. No network or credentials.
// Metadata must come from independent before/after Drive reads, not from the source.
const crypto=require('node:crypto');
const APPS={Euna:'Mochi learning',Hana:'Hana learning',Jonah:'PokéMath learning'};
function verify(raw,before,after,expected,now=Date.now()){
 const fail=reason=>{throw Error('Learning source rejected: '+reason);};
 const normalize=m=>({id:m.id,name:m.name||m.title,mime:m.mimeType||m.mime_type,size:Number(m.size||m.file_size_bytes),modified:m.modifiedTime||m.modified_time,parents:m.parents||m.parent_ids,trashed:m.trashed});
 if(!expected||!APPS[expected.student]||!expected.fileId||!expected.parentId)fail('expected identity required');
 const a=normalize(before||{}),z=normalize(after||{}),bytes=Buffer.isBuffer(raw)?raw:Buffer.from(raw,'utf8');
 for(const m of [a,z])if(m.id!==expected.fileId||!m.parents?.includes(expected.parentId)||m.trashed===true||!['text/plain','application/json'].includes(m.mime)||!Number.isFinite(Date.parse(m.modified))||m.size!==bytes.length)fail('metadata identity or complete byte size');
 if(a.modified!==z.modified||a.name!==z.name||a.mime!==z.mime)fail('source changed during download');
 if(bytes.length<2||bytes.length>16000000)fail('source size limit');
 let b;try{b=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch(_){fail('incomplete or invalid UTF-8 JSON');}
 if(b.app!==APPS[expected.student]||(expected.student==='Hana'?b.schemaVersion!==1:b.version!==1))fail('app or schema');
 if(expected.student==='Jonah'&&(b.child!=='Jonah'||!b.sessions||Array.isArray(b.sessions)))fail('child or sessions');
 if(expected.student==='Hana'&&(!Array.isArray(b.learning?.events)||!Array.isArray(b.learning?.checks)))fail('events');
 if(expected.student==='Euna'&&(!b.learning||!b.entrance||!b.sciencePath))fail('learning domains');
 const stamp=expected.student==='Euna'?b.exported:b.exportedAt,ms=typeof stamp==='number'?stamp:Date.parse(stamp);
 if(!Number.isFinite(ms)||ms>now+300000||ms>Date.parse(z.modified)+300000)fail('export timestamp');
 if(expected.student==='Hana'&&new Date(ms).toISOString()!==b.exportedAtISO)fail('conflicting export dates');
 const zone=b.timeZone||b.timezone||b.learningPlanReview?.timeZone;
 if(zone&&zone!=='America/Chicago')fail('unexpected learning timezone');
 return {source:b,proof:{student:expected.student,fileId:z.id,sourceModifiedAt:z.modified,sourceExportedAt:new Date(ms).toISOString(),bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),transport:'complete-authenticated-download'}};
}
module.exports={verify};
if(require.main===module){const fs=require('node:fs'),[source,before,after,expected]=process.argv.slice(2);if(!expected)throw Error('Usage: node verify-learning-source.cjs source.txt before.json after.json expected.json');const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));process.stdout.write(JSON.stringify(verify(fs.readFileSync(source),read(before),read(after),read(expected))));}
