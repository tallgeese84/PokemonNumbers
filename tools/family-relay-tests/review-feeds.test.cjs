'use strict';
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict'),test=require('node:test');
const {assemble}=require('../read-family-review-feed.cjs');
const code=fs.readFileSync(require('node:path').join(__dirname,'../family-review-feeds.gs'),'utf8');
const clone=x=>JSON.parse(JSON.stringify(x));
const PREFIX={Euna:'euna-mochi',Hana:'hana-learning',Jonah:'jonah-pokemath'};
const NOW=Date.parse('2026-10-09T00:00:00Z');
function fixture(student,extra={}){
 const common={notes:'Synthetic only: 🦊 Pokémon \n preserve every answer.',...extra};
 if(student==='Euna')return {...common,app:'Mochi learning',version:1,exported:'2026-10-08T23:00:00Z',state:{cats:['earned'],answers:[{helped:true}]}};
 if(student==='Hana')return {...common,app:'Hana learning',schemaVersion:1,exportedAt:NOW-3600000,learning:{events:[{id:'e1',revealed:true}],checks:[]}};
 return {...common,app:'PokéMath learning',version:1,child:'Jonah',exportedAt:'2026-10-08T23:00:00Z',sessions:{s1:{id:'s1',rev:9,days:{},questions:{q1:{helped:true}}}}};
}
function env({shared=false}={}){
 let id=0,t=NOW,held=false;const items=new Map(),writes=[],logs=[],triggers=[],props={MIRROR_SECRET:'synthetic-do-not-log',MIRROR_FOLDER_ID:'root-Euna',HANA_FOLDER_ID:shared?'root-Euna':'root-Hana',JONAH_FOLDER_ID:shared?'root-Euna':'root-Jonah'};
 const iter=a=>{let i=0;return{hasNext:()=>i<a.length,next:()=>a[i++]};};
 const e={items,writes,logs,triggers,props,failWrite:null,onWrite:null,busy:false};
 function item(name,parent,folder=false,data='',givenId){
  const x={id:givenId||'id-'+(++id),name,parent,folder,data,modified:++t,sharing:'PRIVATE',trashed:false,mime:folder?'folder':'text/plain',
   getId(){return this.id;},getName(){return this.name;},getMimeType(){return this.mime;},isTrashed(){return this.trashed;},getSharingAccess(){return this.sharing;},getLastUpdated(){return new Date(this.modified);},
   getBlob(){return{getDataAsString:()=>this.data};},
   setContent(text){if(e.failWrite&&e.failWrite(this))throw Error('synthetic disk failure');this.data=text;this.modified=++t;writes.push(this.id);e.onWrite?.(this);return this;},
   getFilesByName(n){return iter([...items.values()].filter(y=>!y.folder&&y.parent===this.id&&y.name===n&&!y.trashed));},
   getFoldersByName(n){return iter([...items.values()].filter(y=>y.folder&&y.parent===this.id&&y.name===n&&!y.trashed));},
   createFile(n,text,mime){const f=item(n,this.id,false,text);f.mime=mime;writes.push(f.id);e.onWrite?.(f);return f;},
   createFolder(n){const f=item(n,this.id,true);writes.push(f.id);return f;}
  };items.set(x.id,x);return x;
 }
 e.make=item;
 for(const root of new Set([props.MIRROR_FOLDER_ID,props.HANA_FOLDER_ID,props.JONAH_FOLDER_ID]))item(root,null,true,'',root);
 e.sources={};for(const [student,p] of Object.entries(PREFIX))e.sources[student]=item(p+'-latest.json',props[student==='Euna'?'MIRROR_FOLDER_ID':student.toUpperCase()+'_FOLDER_ID'],false,JSON.stringify(fixture(student),null,2));
 const context={console:{log:s=>logs.push(s)},Date,JSON,String,Number,Math,Error,MimeType:{PLAIN_TEXT:'text/plain'},
  PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k],setProperty:()=>{throw Error('properties must not change');}})},
  DriveApp:{Access:{PRIVATE:'PRIVATE'},getFolderById:id=>{if(!items.get(id)?.folder)throw Error('missing folder');return items.get(id);}},
  Utilities:{DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},computeDigest:(_,s)=>[...crypto.createHash('sha256').update(s).digest()].map(b=>b>127?b-256:b)},
  LockService:{getScriptLock:()=>{throw Error('must not contend with uploads');},getUserLock:()=>({tryLock:()=>{if(e.busy||held)return false;held=true;return true;},releaseLock:()=>{held=false;}})},
  ScriptApp:{getProjectTriggers:()=>triggers,newTrigger:handler=>({timeBased(){return this;},everyMinutes(n){assert.equal(n,5);return this;},create(){const x={getHandlerFunction:()=>handler};triggers.push(x);return x;}})}
 };vm.createContext(context);vm.runInContext(code,context);e.c=context;
 e.index=student=>{const f=[...items.values()].find(x=>x.name===PREFIX[student]+'-review-index.json');return f?JSON.parse(f.data):null;};
 e.read=student=>{const index=e.index(student),parts={};for(const ref of index.parts){const f=items.get(ref.fileId);parts[ref.fileId]={fileId:f.id,parentId:f.parent,name:f.name,content:JSON.parse(f.data)};}return{index,parts,expected:{student,sourceFileId:e.sources[student].id,sourceModifiedAt:e.sources[student].getLastUpdated().toISOString()}};};
 e.restore=student=>{const r=e.read(student);return assemble(r.index,r.parts,r.expected);};
 return e;
}
test('preview is read-only for all children and never logs the secret or learner answers',()=>{
 const e=env(),before=clone(e.props);const r=e.c.previewFamilyReviewFeeds();assert(Object.values(r).every(x=>x.ok));assert.equal(e.writes.length,0);assert.equal(e.triggers.length,0);assert.deepEqual(e.props,before);assert(!e.logs.join('').includes(e.props.MIRROR_SECRET));assert(!e.logs.join('').includes('earned'));
});
for(const shared of [false,true])test('all three complete mirrors round-trip with '+(shared?'shared':'separate')+' folders, no source or property changes',()=>{
 const e=env({shared}),before=Object.fromEntries(Object.entries(e.sources).map(([k,x])=>[k,[x.data,x.modified]])),props=clone(e.props);
 const unrelated={getHandlerFunction:()=> 'existingOtherJob'};e.triggers.push(unrelated);
 e.c.setupFamilyReviewFeeds();for(const s of Object.keys(PREFIX)){assert.deepEqual(e.restore(s),JSON.parse(before[s][0]));assert.deepEqual([e.sources[s].data,e.sources[s].modified],before[s]);}
 assert.deepEqual(e.props,props);assert.equal(e.triggers.length,2);assert.equal(e.triggers[0],unrelated);
 const n=e.writes.length;e.c.setupFamilyReviewFeeds();assert.equal(e.triggers.length,2);assert.equal(e.writes.length,n);
});
test('changed source uses inactive slot and preserves all old sessions and metadata',()=>{
 const e=env();e.c.setupFamilyReviewFeeds();const first=e.read('Jonah'),oldPart=e.items.get(first.index.parts[0].fileId).data;
 const b=JSON.parse(e.sources.Jonah.data);b.sessions.s2={id:'s2',rev:1,days:{},questions:{}};e.sources.Jonah.setContent(JSON.stringify(b));e.c.refreshFamilyReviewFeeds();
 assert.equal(e.index('Jonah').slot,'B');assert.equal(e.items.get(first.index.parts[0].fileId).data,oldPart);assert.deepEqual(e.restore('Jonah'),b);
 e.sources.Jonah.setContent(JSON.stringify({...b,notes:'third generation'}));e.c.refreshFamilyReviewFeeds();assert.equal(e.index('Jonah').slot,'A');
});
test('a failed partial write or concurrent upload cannot publish a mixed index',()=>{
 for(const mode of ['failure','changed']){
  const e=env();e.c.setupFamilyReviewFeeds();const old=e.index('Jonah');e.sources.Jonah.setContent(JSON.stringify(fixture('Jonah',{notes:'new'})));
  if(mode==='failure')e.failWrite=f=>f.name===PREFIX.Jonah+'-review-B-001.json';
  else e.onWrite=f=>{if(f.name===PREFIX.Jonah+'-review-B-001.json')e.sources.Jonah.modified++;};
  // Pre-create the inactive part to exercise a write failure without touching source.
  if(mode==='failure')e.make(PREFIX.Jonah+'-review-B-001.json',old.feedFolderId,false,JSON.stringify({schema:1,service:'family-review-feed-part',student:'Jonah',index:0}));
  const result=e.c.refreshFamilyReviewFeeds();assert.equal(result.Jonah.ok,false);assert.equal(result.Hana.ok,true);assert.equal(result.Euna.ok,true);assert.deepEqual(e.index('Jonah'),old);
 }
});
test('private/unique source and generated files fail closed without altering originals',()=>{
 for(const mutation of [e=>e.sources.Jonah.sharing='ANYONE',e=>e.sources.Jonah.data='{',e=>e.sources.Jonah.data=JSON.stringify(fixture('Hana')),e=>e.make(e.sources.Jonah.name,e.sources.Jonah.parent,false,e.sources.Jonah.data)]){
  const e=env();mutation(e);const before=e.sources.Jonah.data;assert.throws(()=>e.c.setupFamilyReviewFeeds(),/Not all/);assert.equal(e.sources.Jonah.data,before);assert.equal(e.triggers.length,0);assert.equal(e.index('Jonah'),null);
 }
 const e=env();e.c.setupFamilyReviewFeeds();const old=e.index('Jonah');e.items.get(old.feedFolderId).sharing='ANYONE';e.sources.Jonah.modified++;assert.equal(e.c.refreshFamilyReviewFeeds().Jonah.ok,false);assert.deepEqual(e.index('Jonah'),old);
});
test('busy lock, unconfigured run and duplicate triggers do not change source or add triggers',()=>{
 const e=env();assert.equal(e.c.refreshFamilyReviewFeeds().Jonah.ok,false);assert.equal(e.writes.length,0);e.busy=true;assert.equal(e.c.refreshFamilyReviewFeeds().busy,true);e.busy=false;
 e.triggers.push({getHandlerFunction:()=> 'refreshFamilyReviewFeeds'},{getHandlerFunction:()=> 'refreshFamilyReviewFeeds'});assert.throws(()=>e.c.setupFamilyReviewFeeds(),/Duplicate/);assert.equal(e.writes.length,0);
});
test('surrogate pairs and escaped text reconstruct exactly across bounded chunks',()=>{
 const e=env(),b=fixture('Jonah',{notes:'x'.repeat(95999)+'🦊'.repeat(60000)+'\\quotes"\nlast'});e.sources.Jonah.data=JSON.stringify(b);e.c.setupFamilyReviewFeeds();assert.deepEqual(e.restore('Jonah'),b);assert(e.index('Jonah').partCount>1);
 for(const p of e.index('Jonah').parts)assert(p.characters<=96000);
});
test('reader rejects missing, crossed, reordered, modified, stale and hash-mismatched input',()=>{
 const e=env();e.c.setupFamilyReviewFeeds();
 const changes=[r=>delete r.parts[r.index.parts[0].fileId],r=>r.index.student='Hana',r=>r.parts[r.index.parts[0].fileId].parentId='other',r=>r.parts[r.index.parts[0].fileId].content.text+='x',r=>r.parts[r.index.parts[0].fileId].content.index=2,r=>r.index.generation='0'.repeat(64),r=>r.expected.sourceModifiedAt='2000-01-01T00:00:00Z',r=>r.expected.sourceFileId='other'];
 for(const change of changes){const r=clone(e.read('Jonah'));change(r);assert.throws(()=>assemble(r.index,r.parts,r.expected),/rejected/);}
});
test('source has no web handlers, destructive operations, secret reads, or property writes',()=>{
 assert(!/function\s+do(?:Get|Post)\s*\(/.test(code));assert(!/setTrashed|setSharing|removeFile|deleteTrigger|setProperty|setProperties|getProperty\(['"]MIRROR_SECRET/.test(code));
});
module.exports={env};
