/* Full local DOM integration. All relay traffic is mocked; no learner accounts. */
const {JSDOM,VirtualConsole,requestInterceptor}=require('jsdom'),assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const Core=require('../nightly-priority-core.js');
const now=Date.now(),day=Core.day(now),previous=new Date(Date.parse(day+'T12:00:00Z')-86400000).toISOString().slice(0,10);
let remote={schema:1,id:'jonah-nightly-'+day,revision:1,student:'Jonah',timeZone:'America/Chicago',reviewedDate:previous,sessionDate:day,generatedAt:new Date(now).toISOString(),sourceExportedAt:new Date(now-60000).toISOString(),subjects:{reading:{focus:'Remember the A sound.',sounds:['a'],words:['pin']},maths:{focus:'Compare small numbers.',skills:['compare10']}}};
const old={id:'synthetic-old',rev:7,days:{'2026-10-01':{activeMs:1000}},questions:{q:{id:'q',section:'read',item:'g:s',startedAt:Date.parse('2026-10-01T15:00:00Z'),completedAt:Date.parse('2026-10-01T15:00:03Z'),responses:[{correct:true}],helped:false}}};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label,ms=10000){const t=Date.now();while(Date.now()-t<ms){try{if(fn())return;}catch(_){}await sleep(20);}throw Error('Timeout: '+label);}
(async()=>{
 const root=path.resolve(__dirname,'..'),server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.html')?'text/html':'text/css');fs.createReadStream(file).on('error',()=>res.writeHead(404).end()).pipe(res);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const BASE=`http://127.0.0.1:${server.address().port}/`;
 const errors=[],requests=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/Not implemented|getContext|scrollTo|HTMLMediaElement/.test(e.message))errors.push(e.message);});
 const dom=await JSDOM.fromURL(BASE,{runScripts:'dangerously',resources:{interceptors:[requestInterceptor(request=>request.url.startsWith(BASE)?undefined:new Response('',{status:403}))]},pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
  w.TextEncoder=TextEncoder;w.AbortController=AbortController;w.AbortSignal=AbortSignal;Object.defineProperty(w.crypto,'subtle',{value:webcrypto.subtle});
  const ctx=new Proxy({},{get:(t,k)=>k==='measureText'?()=>({width:10}):k==='getImageData'?()=>({data:new Uint8ClampedArray(4)}):()=>{},set:()=>true});w.HTMLCanvasElement.prototype.getContext=()=>ctx;
  w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.scrollTo=()=>{};w.confirm=()=>true;w.alert=()=>{};
  w.localStorage.setItem('pokemath_drive_mirror_v1',JSON.stringify({url:'https://script.google.com/macros/s/SYNTHETIC/exec',secret:'synthetic-secret-at-least-24-characters',enabled:true}));
  w.localStorage.setItem('pokemath_learning_v1',JSON.stringify({sessions:{[old.id]:old}}));
  for(const [k,v] of Object.entries({cubs_caught:'25,151,382',cubs_pbuddy:'151',cubs_shiny:'151',cubs_sound:'off',mochi_state_sentinel:'keep-euna',hq_learning_sentinel:'keep-hana'}))w.localStorage.setItem(k,v);
  w.fetch=async(u,o)=>{if(String(u).startsWith('https://script.google.com/')){const b=JSON.parse(o.body);requests.push(b);if(b.action)return {ok:true,type:'cors',text:async()=>JSON.stringify({ok:true,service:'family-learning-mirror',planApi:1,student:'Jonah',plan:remote})};return {type:'opaque'};}if(!String(new URL(u,BASE)).startsWith(BASE))throw Error('External requests disabled in test');return fetch(new URL(u,BASE),o);};
 }});
 const w=dom.window,d=w.document,$=id=>d.getElementById(id),click=el=>el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
 await until(()=>w.JonahNightly?.report().received,'receipt');await w.eval('adventure.ready');await until(()=>w.eval('collectionReady'),'collection loaded');
 assert.equal(w.JonahNightly.report().active,null);assert.equal(w.localStorage.getItem('cubs_caught'),'25,151,382');assert.equal(w.localStorage.getItem('cubs_pbuddy'),'151');
 click($('startAdventure'));
 await until(()=>w.eval('adventure.tracker.question()')?.nightlyTarget==='sound:a','prioritised sound starts');
 const first=w.eval('adventure.tracker.question()');assert.equal(first.nightlyPlan.revision,1);assert.equal(first.dailyStage,'sounds');assert.equal(first.teach,true);const currentId=first.id;
 remote={...remote,revision:2,subjects:{...remote.subjects,reading:{...remote.subjects.reading,sounds:['t']}}};await w.JonahNightly.refresh(true);
 assert.equal(w.eval('adventure.tracker.question().id'),currentId);assert.equal(w.eval('adventure.tracker.question().nightlyPlan.revision'),1);
 click($('rdActions').querySelector('button'));
 await until(()=>w.eval('adventure.tracker.sessions[adventure.tracker.sessionId].questions')[currentId].completedAt,'model completion');
 w.eval('adventure.cancelMission();reading.leave();mathPath.openGyms();');
 click(d.querySelector('.mp-gymbtn'));
 await until(()=>w.eval('mathPath._current()')?.item.skill==='compare10','prioritised real Gym task');
 const math=w.eval('adventure.tracker.question()');assert.equal(math.nightlyPlan.revision,2);assert.equal(math.skill,'compare10');assert.equal(math.teach,true);
 const mirror=w.eval('PokeMirror.backup({sessions:adventure.tracker.sessions})');
 assert.deepEqual(JSON.parse(JSON.stringify(mirror.sessions[old.id])),old);
 assert.ok(Object.values(mirror.sessions).some(s=>s.learningState?.nightlyPlan?.state.received?.revision===2));
 assert.equal(w.localStorage.getItem('cubs_caught'),'25,151,382');assert.equal(w.localStorage.getItem('cubs_pbuddy'),'151');assert.equal(w.localStorage.getItem('cubs_shiny'),'151');
 assert.equal(w.localStorage.getItem('mochi_state_sentinel'),'keep-euna');assert.equal(w.localStorage.getItem('hq_learning_sentinel'),'keep-hana');assert(!JSON.stringify(mirror).includes('synthetic-secret'));
 assert.deepEqual(errors,[],'no runtime errors');
 console.log('PASS: real daily sound and optional Gym task use priorities; in-flight work, history, earned Pokémon, shiny and buddy preserved; receipts mirrored.');
 w.close();server.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
