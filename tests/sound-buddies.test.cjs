const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const B=require('../reading-buddies.js'),C=require('../learning-core.js'),R=require('../reading-core.js'),A=require('../reading-art.js'),P=require('../reading-phonics.js'),Mirror=require('../drive-mirror.js');
const day1=Date.parse('2026-10-03T16:00:00Z'),day2=day1+86400000;
const sessions=qs=>({s:{id:'s',rev:1,days:{},questions:Object.fromEntries(qs.map((q,i)=>['q'+i,q]))}});
const event=(it,at,extra={})=>({...it,section:'read',skill:'buddies',startedAt:at,completedAt:at+1,day:C.dayKey(at),responses:[{correct:true}],...extra});
test('all 26 letters have distinct real artwork, sound clips and illustrated keywords',()=>{
 assert.equal(B.ALL.map(b=>b.letter).join(''),'abcdefghijklmnopqrstuvwxyz');assert.equal(new Set(B.ALL.map(b=>b.id)).size,26);
 const m=require('../assets/sound-buddies/manifest.json');
 for(const b of B.ALL){const x=m.images.find(x=>x.id===b.id),data=fs.readFileSync(path.join(__dirname,'..',b.image));
  assert.equal(data.subarray(1,4).toString(),'PNG');assert.equal(crypto.createHash('sha256').update(data).digest('hex'),x.sha256);
  assert.ok(x.url.includes('/other/official-artwork/'));assert.ok(A.has(b.keyword));assert.ok(P.clipKeys(b.g).every(k=>P.clips.includes(k)));
 }
 assert.equal(B.get('q').g,'qu');assert.equal(B.get('qu').letter,'q');assert.equal(B.get('x').keyword,'box');
});
test('new lessons teach at most three targets and then test a fresh word without picture cues',()=>{
 const r=B.lesson(['s','a','t','p'],{},['s','a','t'],day1,()=>.4);
 assert.equal(new Set(r.items.map(x=>x.buddyLetter)).size,3);assert.equal(r.items.length,9);
 assert.ok(r.items.slice(0,6).every(x=>x.teach&&x.buddyCue));
 for(const it of r.items.slice(6)){assert.equal(it.kind,'buddyWord');assert.equal(it.teach,undefined);assert.equal(it.buddyCue,false);assert.notEqual(it.word,B.get(it.buddyLetter).keyword);assert.equal(it.phase,'independent');}
 for(const it of r.items){assert.ok(it.options.includes(it.answer));assert.equal(new Set(it.options).size,it.options.length);assert.ok(it.options.length>=2);}
 for(const l of ['c','k'])assert.ok(!B.lesson([l],{},['c','k','s'],day1).items.some(it=>it.options.includes('c')&&it.options.includes('k')));
});
test('a later-day lesson checks before teaching and one automatic block leaves time for other reading',()=>{
 const r=B.lesson(['p'],{},['s','a','p'],day1),s=sessions(r.items.map((it,i)=>event(it,day1+i*10)));
 const later=B.lesson(['p'],s,['s','a','p'],day2);
 assert.ok(later.items.every(it=>!it.teach&&!it.buddyCue&&it.phase==='retention'));assert.ok(later.items.some(it=>it.kind==='buddySound'));
 assert.deepEqual(B.select(s,['s','a','p'],day1),[]);assert.equal(B.select(s,['s','a','p'],day2).length,3);
 assert.notEqual(later.items.find(x=>x.kind==='buddyWord').word,r.items.find(x=>x.kind==='buddyWord').word);
});
test('badges require varied no-picture evidence, a sound check and uncued later-day retention',()=>{
 const word=(w,at,extra={})=>event({buddyLetter:'p',item:'g:p',kind:'buddyWord',word:w,phase:'independent'},at,extra);
 const qs=[word('pan',day1),word('pig',day1+10),word('pan',day1+20),event({buddyLetter:'p',kind:'buddySound',phase:'retention'},day2),word('pig',day2+10,{phase:'retention'})];
 assert.equal(B.progress(sessions(qs)).p.badge,true);
 assert.equal(B.progress(sessions(qs.map(q=>({...q,teach:true,buddyCue:true})))).p.badge,false);
 assert.equal(B.progress(sessions(qs.map(q=>({...q,day:C.dayKey(day1),phase:'independent'})))).p.badge,false);
 assert.equal(B.progress(sessions(qs.map(q=>({...q,helped:true})))).p.badge,false);
 assert.equal(B.progress(sessions(qs.map(q=>({...q,word:'pan',kind:'buddyWord'})))).p.badge,false);
 const warmed=[...qs,event({buddyLetter:'p',kind:'buddyMeet',teach:true,buddyCue:true},day2-1)];
 assert.equal(B.progress(sessions(warmed)).p.badge,false,'teaching before a check disqualifies later-day retention');
});
test('two unsuccessful checks bring explicit teaching back',()=>{
 const qs=['buddySound','buddyWord'].map((kind,i)=>event({buddyLetter:'p',kind,word:'pan'},day1+i*10,{responses:[{correct:false},{correct:true}]}));
 const r=B.lesson(['p'],sessions(qs),['s','a','p'],day2);
 assert.equal(r.items[0].kind,'buddyMeet');assert.equal(r.items[1].kind,'buddyGuide');assert.equal(r.items.at(-1).phase,'independent');
});
test('buddy evidence survives the existing Drive envelope and appears in both daily reports',()=>{
 const qs=B.lesson(['p'],{},['s','a','p'],day1).items.map((it,i)=>event(it,day1+i*10));
 const original=sessions(qs),backup=Mirror.backup({sessions:original}),restored=JSON.parse(JSON.stringify(backup));
 assert.deepEqual(B.progress(restored.sessions),B.progress(original));
 const report=R.report(restored.sessions,R.freshState(),C.dayKey(day1));assert.match(report,/Pikachu: 2 teaching\/helped steps; 1\/1 first-try checks without picture help/);
 assert.match(require('../scripts/daily-report.cjs').report(restored.sessions,{},C.dayKey(day1)).text,/Pokémon sound buddies/);
 assert.equal(C.summarize(original,C.dayKey(day1)).attempted,1);
});
