const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
function extract(start,end){return html.slice(html.indexOf(start),html.indexOf(end,html.indexOf(start)));}
test('Count transitions into mixed practice after three completions and cannot be reset by reopening Games',()=>{
 const C=require('../learning-core.js'),F=require('../foundations.js');
 const tracker=new C.Tracker(),day=C.dayKey(Date.now()),storage={};
 const ctx={PokeFoundations:F,tracker,today:()=>day,mission:{enabled:false,answered:0},missionButton:{},blocks:0,
  localStorage:{getItem:k=>storage[k]||null},mode:'count',audio(){},shutUp(){},show(){},
  reading:{startBlock:()=>{ctx.blocks++;}},
  foundations:{start:skill=>{ctx.next=skill;ctx.mode='foundation';}},newQuestion:()=>ctx.routeMission()};
 const source=fs.readFileSync(require('node:path').join(__dirname,'../adventure.js'),'utf8');
 vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('  function enableMission()'),source.indexOf('  const idle=')),ctx);
 for(let i=0;i<3;i++){
  assert.equal(ctx.routeMission(),false);
  tracker.begin({section:'count',skill:'count',day,expected:i+1});
  if(i===2)tracker.help('picture support');
  tracker.answer(i+1,true);
 }
 // v68: Play opens with a short reading block, then a maths block from the saved cycle.
 assert.equal(ctx.routeMission(),true);assert.equal(ctx.blocks,1);
 assert.equal(ctx.routeMission(),true);assert.equal(ctx.next,'take');
 ctx.mission.enabled=false;ctx.mode='count';storage.pokemath_mission_step='1';
 assert.equal(ctx.routeMission(),true);assert.equal(ctx.blocks,2);assert.equal(ctx.mission.enabled,true);
 assert.equal(ctx.routeMission(),false);assert.equal(ctx.mode,'add');
 ctx.mission.answered=2;
 assert.equal(ctx.routeMission(),true);assert.equal(ctx.next,'predict');
 ctx.mission.enabled=false;ctx.mode='sub';assert.equal(ctx.routeMission(),false);assert.equal(ctx.mode,'sub');
 ctx.mission.enabled=false;ctx.mode='add';assert.equal(ctx.routeMission(),false);assert.equal(ctx.mode,'add');
 storage.pokemath_mission_step='Infinity';ctx.missionButton.onclick();assert.equal(ctx.blocks,3);
 ctx.routeMission();assert.equal(ctx.next,'take');
});
test('Play alternates blocks: four maths questions, never more than two reading blocks in a row, about 60% reading',()=>{
 const C=require('../learning-core.js'),F=require('../foundations.js');
 const tracker=new C.Tracker(),day=C.dayKey(Date.now());
 const ctx={PokeFoundations:F,tracker,today:()=>day,mission:{enabled:false,answered:0},missionButton:{},seq:[],
  localStorage:{getItem:()=>null},mode:'home',audio(){},shutUp(){},show(){},
  reading:{startBlock:()=>ctx.seq.push('R')},foundations:{start:()=>ctx.seq.push('m')},newQuestion:()=>ctx.routeMission()};
 const source=fs.readFileSync(require('node:path').join(__dirname,'../adventure.js'),'utf8');
 vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('  function enableMission()'),source.indexOf('  const idle=')),ctx);
 const s=tracker.sessions[tracker.sessionId];s.days[day]={sections:{read:60000,foundation:400000}};
 ctx.missionButton.onclick();
 for(let i=0;i<14;i++){ctx.mission.answered=0;ctx.routeMission();}
 const blocks=ctx.seq.join('').replace(/m+/g,x=>'M'.repeat(Math.ceil(x.length/4)));
 assert.equal(ctx.seq[0],'R');assert.ok(!/RRR/.test(ctx.seq.join('')));
 assert.ok(blocks.includes('RR'),'catches up when reading is behind: '+blocks);
 s.days[day]={sections:{}};ctx.seq=[];ctx.missionButton.onclick();for(let i=0;i<10;i++){ctx.mission.answered=0;ctx.routeMission();}
 assert.equal(ctx.seq.join('').replace(/m+/g,x=>'M'.repeat(Math.ceil(x.length/4))),'RMRMR','a fresh day alternates evenly');
 s.days[day]={sections:{read:400000,foundation:100000}};ctx.seq=[];ctx.mission.lastDomain='read';ctx.mission.run=1;ctx.mission.mathLeft=0;ctx.routeMission();assert.equal(ctx.seq[0],'m');
});
test('service worker ignores Firebase and all non-GET requests and retains unrelated caches',async()=>{const events={},deleted=[];const context={URL,Response,caches:{keys:async()=>['pokemath-v62','pokemath-v76','mochi-v9','chinese-v1'],delete:async k=>deleted.push(k)},self:{registration:{scope:'https://tallgeese84.github.io/PokemonNumbers/'},clients:{claim:async()=>{}},addEventListener:(n,f)=>events[n]=f}};vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../sw.js'),'utf8'),context);let work;events.activate({waitUntil:p=>work=p});await work;assert.deepEqual(deleted,['pokemath-v62']);for(const request of [{method:'GET',url:'https://example.firebaseio.com/fam/a/pokemath.json'},{method:'PUT',url:'https://example.firebaseio.com/fam/a/pokemath.json'},{method:'GET',url:'https://tallgeese84.github.io/Mochi/index.html'}])events.fetch({request,respondWith:()=>assert.fail('API or another app was intercepted')});});
test('guided hint always unlocks a story question and zero-object subtraction',()=>{for(const mode of ['add','sub']){const timers=[],sp={},pad={classList:{remove(){}}};const q={a:mode==='add'?1:0,b:mode==='add'?4:0,form:'result',generation:2};const holder={appendChild(){},querySelectorAll(){return mode==='add'?Array.from({length:5},()=>({classList:{add(){}}})):[];}};const ctx={q,mode,pending:{},padLocked:false,adventure:{help(){}},savePending(){},document:{getElementById:id=>id==='quizSpeech'?sp:id==='pad'?pad:{querySelector:()=>null,appendChild(){}},createElement:()=>holder},buildFrames:()=>({}),objSpan(){},speakNumber(){},setTimeout:f=>timers.push(f)};vm.runInNewContext(extract('function countHint(){','/* ============================================================\n   WILD CATCH'),ctx);ctx.countHint();assert.equal(ctx.padLocked,true);timers.forEach(f=>f());assert.equal(ctx.padLocked,false);assert.equal(q.usedHelp,true);}});
test('delayed hints cannot unlock a newly generated question',()=>{const timers=[],q={a:1,b:1,form:'missingB',generation:1};const ctx={q,mode:'add',pending:{},padLocked:false,adventure:{help(){}},document:{getElementById:()=>({})},setTimeout:f=>timers.push(f)};vm.runInNewContext(extract('function countHint(){','/* ============================================================\n   WILD CATCH'),ctx);ctx.countHint();q.generation++;timers.forEach(f=>f());assert.equal(ctx.padLocked,true);});
test('legacy sync never writes after a failed read and retries a conditional-write conflict',async()=>{const fn=extract('async function syncNow(manual){','function schedulePush(){');let writes=0;const ctx={getSyncCfg:async()=>({}),syncEndpoint:()=>'/db',syncBusy:false,setSyncStatus(){},adventure:{sync:async()=>{}},localPayload:async()=>({at:1,stars:10,caught:[]}),fetch:async(_url,opts)=>{if(opts.method)writes++;return new Response('',{status:500});},AbortSignal,Error,store:{set:async()=>{}},Date,JSON,applyState:()=>assert.fail('should not apply'),mergeStates:(a,b)=>({...a,...b})};vm.runInNewContext(fn,ctx);assert.equal(await ctx.syncNow(false),false);assert.equal(writes,0);let gets=0;ctx.fetch=async(_url,opts)=>{if(!opts.method){gets++;return new Response(JSON.stringify({at:2,stars:20,caught:[]}),{headers:{etag:'"v'+gets+'"'}});}writes++;assert.equal(opts.headers['if-match'],'"v'+gets+'"');return writes===1?new Response('',{status:412}):new Response('{}');};ctx.applyState=async m=>assert.equal(m.stars,20);assert.equal(await ctx.syncNow(false),true);assert.equal(gets,2);assert.equal(writes,2);});
test('generated pending operands, answer and form survive leaving and returning',()=>{
  const make=()=>({classList:{add(){},remove(){}},style:{},appendChild(){},addEventListener(){},querySelector(){return null;},innerHTML:'',textContent:''});
  const els={},q={a:99,b:99,ans:198,tries:0},pending={};
  const ctx={q,pending,mode:'add',padLocked:false,echoNext:null,THINGS:['star'],rnd:()=>0,pickMon:()=>25,warmArt(){},monName:()=> 'Pikachu',NUM_WORDS:['zero','one','two'],picMode:'none',buildFrames:null,objSpan:make,
    document:{getElementById:id=>els[id] ||= make(),createElement:make},clearTimeout(){},setTimeout(){},levelMax:()=>5,cpaStage:()=>0,questionForm:()=> 'missingB',buildPad(){},say(){},P:()=>({look:0}),
    adventure:{routeMission(){},beforeQuestion:()=>true,plan:()=>({range:5}),begin:()=>({sid:'session',qid:'question'}),help(){}},savePending:(m,p)=>pending[m]=p,clearPending:m=>delete pending[m]};
  vm.runInNewContext(extract('function newQuestion(){','function showFramesForQuestion'),ctx);ctx.newQuestion();
  assert.equal(pending.add.a,1);assert.equal(pending.add.b,1);assert.equal(pending.add.n,2);assert.equal(pending.add.f,'missingB');
  pending.add.t=2;pending.add.help=true;ctx.newQuestion();assert.equal(q.a,1);assert.equal(q.b,1);assert.equal(q.ans,2);assert.equal(q.tries,2);assert.equal(q.usedHelp,true);assert.equal(q.target,1);
});
test('all shipped JavaScript parses',()=>{new vm.Script(html.slice(html.indexOf("<script>\n'use strict';")+8,html.lastIndexOf('</script>')));for(const file of ['drive-mirror.js','foundations.js','foundation-ui.js','learning-core.js','adventure.js','visuals.js','assets/pokemon-catalog.js','sw.js'])new vm.Script(fs.readFileSync(require('node:path').join(__dirname,'..',file),'utf8'));});

test('daily celebration waits for the current question and is shown only once per target',()=>{const source=fs.readFileSync(require('node:path').join(__dirname,'../adventure.js'),'utf8');const start=source.indexOf('  function celebrate()');const end=source.indexOf('  function beforeQuestion()',start);const els=new Map();const ctx={modal:false,total:()=>900000,goalMs:()=>900000,tracker:{current:{qid:'unfinished'},setBlocked(){}},blocked:()=>false,speechIdle:()=>true,today:()=> '2026-09-18',goalShown:{},save(){},$:id=>{if(!els.has(id))els.set(id,{style:{},focus(){}});return els.get(id);},childName:'Test learner',imgArt:()=> 'test.png',pkBuddy:0,settings:{bonusEnabled:false},bonusDay:null,goal:{hidden:true},sndGood(){},say(){},setTimeout(){},innerWidth:800,innerHeight:600};vm.runInNewContext(source.slice(start,end),ctx);assert.equal(ctx.celebrate(),false);assert.equal(ctx.goal.hidden,true);ctx.tracker.current=null;assert.equal(ctx.celebrate(),true);assert.equal(ctx.goal.hidden,false);ctx.modal=false;assert.equal(ctx.celebrate(),false);});


test('subtraction covers the entire whole before showing the removed part; help is recorded',()=>{
  function el(){return {children:[],dataset:{},classList:{remove(){}},appendChild(x){this.children.push(x);},replaceChildren(...xs){this.children=xs;},setAttribute(k,v){this[k]=v;},addEventListener(k,f){this[k]=f;},remove(){this.removed=true;}};}
  for(const b of [2,5]){
    const els={},q={a:5,b,ans:5-b},pending={sub:{}},helps=[];let live=true;
    const ctx={q,pending,mode:'sub',padLocked:true,NUM_WORDS:['zero','one','two','three','four','five'],clearTimeout(){},Date,
      document:{createElement:el,getElementById:id=>els[id] ||= el()},objSpan:()=>el(),PokeVisuals:{icon:()=>'<svg></svg>'},say(){},
      adventure:{isPaused:()=>false,help:k=>helps.push(k)},savePending:(m,p)=>pending[m]=p};
    vm.runInNewContext(extract('function buildSubtractionStory','function showFramesForQuestion'),ctx);
    ctx.buildSubtractionStory(25,()=>live);
    const scene=els.bubbles.children[0], [whole,away,button]=scene.children;
    assert.equal(whole.children[0].children.length,5);assert.equal(away.children.length,0);
    button.click();assert.equal(ctx.padLocked,false);
    assert.equal(whole.children[0].textContent,'?');assert.equal(whole.children[0].children.length,0);
    assert.equal(away.children[1].children.length,b);assert.equal(helps.length,0);
    assert.match(els.eqline.innerHTML,/5 −/);
    button.click();assert.equal(q.usedHelp,true);assert.equal(pending.sub.help,true);assert.deepEqual(helps,['reveal subtraction']);
    assert.equal(whole.children[0].children.length,5-b);assert.equal(button.removed,true);
    if(b===5) assert.equal(whole.textContent,'0');
    live=false;const before=helps.length;button.click();assert.equal(helps.length,before);
  }
});
test('Play asks the maths path for each maths question and follows its route',()=>{
 const C=require('../learning-core.js'),F=require('../foundations.js');
 const tracker=new C.Tracker(),day=C.dayKey(Date.now()),calls=[];
 const ctx={PokeFoundations:F,tracker,today:()=>day,mission:{enabled:false,answered:0},missionButton:{},log:[],
  localStorage:{getItem:()=>null},mode:'home',audio(){},shutUp(){},show(m){ctx.shown=m;},
  reading:{startBlock:()=>ctx.log.push('R')},foundations:{start:s=>ctx.log.push('f:'+s)},newQuestion:()=>ctx.routeMission(),
  mathPath:{route:(pos,answered)=>{calls.push(pos);return [{type:'path',start:()=>ctx.log.push('p')},{type:'foundation',skill:'split'},{type:'quiz',mode:'add'},{type:'path',start:()=>ctx.log.push('p')}][pos];}}};
 const source=fs.readFileSync(require('node:path').join(__dirname,'../adventure.js'),'utf8');
 vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('  function enableMission()'),source.indexOf('  const idle=')),ctx);
 ctx.missionButton.onclick();
 assert.equal(ctx.routeMission(),true);assert.equal(ctx.routeMission(),true);assert.equal(ctx.routeMission(),false);assert.equal(ctx.mode,'add');assert.equal(ctx.routeMission(),true);
 assert.deepEqual(calls,[0,1,2,3]);assert.deepEqual(ctx.log,['R','p','f:split','p']);
});

test('cached dayKey matches a fresh Intl lookup across midnights, DST changes and half-hour zones', () => {
  const L = require('../learning-core.js');
  const fresh = (ms, zone) => new Intl.DateTimeFormat('en-CA', {timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(ms));
  const starts = [Date.UTC(2026,2,7,0), Date.UTC(2026,10,1,0), Date.UTC(2026,11,31,0)];
  for (const zone of ['America/Chicago','Asia/Singapore','Asia/Kolkata','Asia/Kathmandu']) {
    for (const s of starts) for (let m = 0; m < 3*24*60; m += 7) {
      const ms = s + m*60000 + 13000;
      assert.equal(L.dayKey(ms, zone), fresh(ms, zone));
    }
  }
});
