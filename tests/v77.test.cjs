const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('../learning-core.js'),R=require('../reading-core.js'),M=require('../math-path-core.js'),T=require('../reading-tutor.js'),P=require('../reading-phonics.js'),A=require('../reading-art.js'),D=require('../reading-data.js'),Mirror=require('../drive-mirror.js');
const sess=qs=>({s:{id:'s',rev:1,days:{},questions:Object.fromEntries(qs.map((q,i)=>[i,{startedAt:100+i,completedAt:200+i,day:'2026-10-02',responses:[{correct:true}],section:'read',skill:'ears',item:'pa:blend',kind:'blend',word:['cat','sun','pin'][i%3],...q}]))}});
test('phoneme counts follow pronunciation, not spelling; all auditory words have clips',()=>{
 for(const [w,n] of Object.entries({box:4,fox:4,six:4,queen:4,cat:3,ship:3,ear:1,hair:2}))assert.equal(P.parts(w).length,n,w);
 for(const w of Object.keys(P.ROWS))for(const part of P.parts(w))assert.ok(P.clips.includes(part.audio),w+' '+part.audio);
 assert.equal(P.has('unlisted'),false);assert.deepEqual(P.parts('unlisted'),[]);
 for(const g of Object.keys(D.G))if(g!=='ed')assert.ok(P.clipKeys(g).every(k=>P.clips.includes(k)),g);
 for(const w of ['cube','queen','box','hair','beard'])assert.deepEqual(P.annotate(w,R.splitWord(w)).filter(p=>p.cls!=='silent').flatMap(p=>P.audioKeys(p)),P.parts(w).map(p=>p.audio),w);
});
test('secure listening requires varied independent words and later-day evidence',()=>{
 assert.equal(R.kindStats(sess(Array(7).fill({word:'cat'})),['blend']).blend.secure,false);
 let st=R.kindStats(sess(Array(6).fill({})),['blend']).blend;assert.equal(st.provisional,true);assert.equal(st.secure,false);
 st=R.kindStats(sess([...Array(6).fill({}),{day:'2026-10-03',word:'ship'}]),['blend']).blend;assert.equal(st.secure,true);
 st=R.kindStats(sess(Array(8).fill({teach:true,phase:'guided'})),['blend']).blend;assert.equal(st.n,0);assert.equal(st.secure,false);
});
test('a model and its echo are teaching, and a different question stays independent',()=>{
 const a={kind:'blend',word:'cat',answer:'cat'},b={kind:'blend',word:'sun',answer:'sun'};
 const out=T.prepare({items:[a,b,a]},{});assert.deepEqual(out.items.map(x=>x.phase||'independent'),['model','guided','independent','guided']);
 assert.equal(out.items[2].teach,undefined);assert.deepEqual(T.prepare({placement:true,items:[a]},{}).items,[a]);
 assert.equal(T.needsModel('blend',[{kind:'blend',phase:'model',teach:true,completedAt:300},{kind:'blend',completedAt:301,responses:[{correct:false}]}]),false);
});
test('session snapshots survive the existing Drive envelope and clear obsolete placement',()=>{
 const current={...R.freshState(),assessV:2,resetAt:500,placedAt:501,placedRoute:0,profile:{at:501,pre:true,passed:0,known:[]},recall:{s:{at:510,g:'s',ok:true}}};
 const sessions={s:{id:'s',rev:1,days:{},questions:{},learningState:{reading:{updatedAt:510,state:current},math:{updatedAt:510,state:{...M.freshState(),checkedAt:501,placed:{teens:501}}}}}};
 const backup=Mirror.backup({sessions,settings:{goalMinutes:25}});
 // The already deployed relay retains these fields and strips unknown top-level keys.
 const mirrored=JSON.parse(JSON.stringify({app:backup.app,version:backup.version,sessions:backup.sessions,settings:backup.settings}));
 const restored=R.withSessions({...R.freshState(),placedAt:100,passed:{1:100,2:100}},mirrored.sessions);
 assert.deepEqual(restored.passed,{});assert.equal(restored.profile.pre,true);assert.equal(restored.assessV,2);assert.equal(restored.recall.s.ok,true);
 assert.equal(M.withSessions({},mirrored.sessions).placed.teens,501);assert.equal(backup.build,84);assert.equal(backup.settings.goalMinutes,25);
 const fromEvent=R.withSessions({...R.freshState(),placedAt:100,passed:{1:100}},sess([{skill:'placed',kind:'placed',route:0,teach:true,assessmentStartedAt:400,completedAt:501,profile:current.profile}]));assert.deepEqual(fromEvent.passed,{});assert.equal(fromEvent.assessV,2);
});
test('new path history repairs the old generic level from its skill format',()=>{
 const qs=Array.from({length:12},(_,i)=>({section:'path',skill:'teens',kind:'teen',format:'teens:'+(i<6?0:1),level:0,range:2,a:10,b:i%6+1,expected:i%6+11}));
 assert.equal(M.newSkillPlan('teens',sess(qs)).secure,true);
});
test('models never inflate answers, retention or foundation progression',()=>{
 const s=C.summarize(sess([{teach:true,phase:'model'},{teach:true,phase:'guided'},{}]),'2026-10-02');assert.equal(s.attempted,1);assert.equal(s.started,1);assert.equal(s.teaching,2);assert.equal(s.independent,1);
 assert.equal(C.independent({completedAt:1,responses:[{correct:true}],teach:true}),false);
});
test('all picture choices and teaching keywords have original artwork and every cache resource exists',()=>{
 for(const w of Object.keys(D.ART))assert.ok(A.has(w),w);for(const [g,v] of Object.entries(D.G))assert.ok(A.has(v[1]),g+' '+v[1]);
 const atlas=JSON.parse(fs.readFileSync(require.resolve('../assets/reading/atlas-plan.json')));for(const [w,[sheet,x,y,cols]] of Object.entries(A.MAP))assert.equal(atlas[sheet-1][y*cols+x],w);
 const sw=fs.readFileSync(require.resolve('../sw.js'),'utf8');const context={self:{addEventListener(){}},URL};vm.runInNewContext(sw+'\nthis.core=CORE;',context);
 for(const url of context.core){const p=require('node:path').join(__dirname,'..',url.split('?')[0]);assert.ok(fs.existsSync(p),url);}
});
