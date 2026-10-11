/* Real app DOM integration with a synthetic learner and no external traffic. */
const {JSDOM,VirtualConsole,requestInterceptor}=require('jsdom'),assert=require('node:assert/strict');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const C=require('../learning-core.js');
let now=Date.parse('2026-10-11T15:00:00Z');const day=C.dayKey(now);
const question=(stage,id,ms)=>({id,section:'read',skill:stage,kind:'hunt',item:'g:s',route:1,range:1,day,dailyVersion:1,dailyDay:day,dailyCycle:0,dailyStage:stage,startedAt:now-600000+Number(id),completedAt:now-599000+Number(id),activeMs:ms,activeByDay:{[day]:ms},responses:[{correct:true}],teach:false,helped:false});
const old={id:'sittings-synthetic',rev:1,days:{},questions:{1:question('sounds','1',120000),2:question('sounds','2',0),3:question('words','3',239000),4:question('words','4',0)}};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label){const start=Date.now();while(Date.now()-start<10000){if(fn())return;await sleep(20);}throw Error('Timeout: '+label);}
(async()=>{
 const root=path.resolve(__dirname,'..'),server=http.createServer((req,res)=>{const url=req.url.split('?')[0],file=path.resolve(root,'.'+decodeURIComponent(url==='/'?'/index.html':url));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.html')?'text/html':'text/css');fs.createReadStream(file).on('error',()=>res.writeHead(404).end()).pipe(res);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const BASE=`http://127.0.0.1:${server.address().port}/`;
 const errors=[];let saved;
 async function load(){
  const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/Not implemented|getContext|scrollTo|HTMLMediaElement/.test(e.message))errors.push(e.message);});
  const dom=await JSDOM.fromURL(BASE,{runScripts:'dangerously',resources:{interceptors:[requestInterceptor(request=>request.url.startsWith(BASE)?undefined:new Response('',{status:403}))]},pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
   w.Date.now=()=>now;w.TextEncoder=TextEncoder;w.AbortController=AbortController;w.AbortSignal=AbortSignal;
   const ctx=new Proxy({},{get:(t,k)=>k==='measureText'?()=>({width:10}):k==='getImageData'?()=>({data:new Uint8ClampedArray(4)}):()=>{},set:()=>true});w.HTMLCanvasElement.prototype.getContext=()=>ctx;
   w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.scrollTo=()=>{};w.confirm=()=>true;w.alert=()=>{};
   for(const [k,v] of Object.entries(saved||{pokemath_learning_v1:JSON.stringify({sessions:{[old.id]:old}}),cubs_caught:'25,151,382',cubs_pbuddy:'151',cubs_shiny:'151',cubs_sound:'off'}))w.localStorage.setItem(k,v);
   w.fetch=async(u,o)=>{if(!String(new URL(u,BASE)).startsWith(BASE))throw Error('External requests disabled in test');return fetch(new URL(u,BASE),o);};
  }});
  await until(()=>dom.window.eval('typeof adventure!=="undefined"'),'app boot');await dom.window.eval('adventure.ready');await until(()=>dom.window.eval('collectionReady'),'collection');return dom;
 }
 let dom=await load(),w=dom.window,d=w.document,$=id=>d.getElementById(id),click=el=>el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
 click($('startAdventure'));await until(()=>w.eval('adventure.tracker.question()')?.dailyStage==='words','first sitting task');
 const id=w.eval('adventure.tracker.question().id');
 w.eval('adventure.tracker.sessions["sittings-synthetic"].questions[3].activeMs=240001;adventure.tracker.sessions["sittings-synthetic"].questions[3].activeByDay["'+day+'"]=240001;');
 assert.equal(w.eval('adventure.dailyStatus().stage.id'),'actions');assert.equal(w.eval('adventure.beforeQuestion()'),true);assert.equal($('readingBreak').hidden,true,'never cuts off an unfinished answer');assert.equal(w.eval('adventure.tracker.question().id'),id);
 w.eval('adventure.respond("done",true)');assert.equal(w.eval('adventure.beforeQuestion()'),false);assert.equal($('readingBreak').hidden,false);
 const minutes=w.eval('adventure.dailyStatus().creditedMs');now+=3000;w.eval('adventure.tracker.tick()');assert.equal(w.eval('adventure.dailyStatus().creditedMs'),minutes,'break time is not practice');
 click($('readingBreakHome'));assert.equal(w.eval('mode'),'home');assert.match($('startAdventure').textContent,/Finish reading/);assert.match($('dailyReadingNext').textContent,/Second sitting/);
 w.dispatchEvent(new w.Event('pagehide'));saved=Object.fromEntries(Array.from({length:w.localStorage.length},(_,i)=>{const k=w.localStorage.key(i);return [k,w.localStorage.getItem(k)];}));dom.window.close();
 dom=await load();w=dom.window;d=w.document;$=id=>d.getElementById(id);click=el=>el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
 assert.equal(w.eval('adventure.dailyStatus().cycle'),0);assert.equal(w.eval('adventure.dailyStatus().stage.id'),'actions');assert.equal(w.eval('adventure.dailyStatus().creditedMs'),minutes);
 click($('startAdventure'));await until(()=>w.eval('adventure.tracker.question()')?.dailyStage==='actions','second sitting resumes actions');assert.equal($('readingBreak').hidden,true,'same-day break choice survives reload');
 click($('adventurePause'));assert.equal($('adventureIdle').hidden,false);const qtime=w.eval('adventure.tracker.question().activeMs');now+=3000;w.eval('adventure.tracker.tick()');assert.equal(w.eval('adventure.tracker.question().activeMs'),qtime);
 click($('adventureResume'));assert.equal($('adventureIdle').hidden,true);now+=1000;w.eval('adventure.tracker.tick()');assert(w.eval('adventure.tracker.question().activeMs')>qtime);
 assert.equal(w.localStorage.getItem('cubs_caught'),'25,151,382');assert.equal(w.localStorage.getItem('cubs_pbuddy'),'151');assert.equal(w.localStorage.getItem('cubs_shiny'),'151');
 now=Date.parse('2026-10-12T15:00:00Z');assert.equal(w.eval('adventure.dailyStatus().stage.id'),'sounds');assert.equal(w.eval('adventure.dailyStatus().creditedMs'),0,'yesterday never credits a new day');
 assert.deepEqual(errors,[]);w.close();server.close();console.log('PASS: between-task midpoint break, no break credit, reload/same-cycle resume, pause/resume, fresh next day, earned Pokémon/shiny/buddy preserved.');
})().catch(e=>{console.error(e);process.exit(1);});
