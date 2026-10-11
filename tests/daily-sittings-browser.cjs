/* Isolated Chromium regression. Use PLAYWRIGHT_MODULE / CHROMIUM_EXECUTABLE if supplied. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const now=Date.parse('2026-10-11T15:00:00Z'),day='2026-10-11';
const q=(stage,id,ms)=>({id,section:'read',skill:stage,kind:'hunt',item:'g:s',route:1,range:1,day,dailyVersion:1,dailyDay:day,dailyCycle:0,dailyStage:stage,startedAt:now-600000+Number(id),completedAt:now-599000+Number(id),activeMs:ms,activeByDay:{[day]:ms},responses:[{correct:true}],teach:false,helped:false});
const old={id:'browser-sittings',rev:1,days:{},questions:{1:q('sounds','1',120000),2:q('sounds','2',0),3:q('words','3',240000),4:q('words','4',0)}};
(async()=>{
 const root=path.resolve(__dirname,'..'),server=http.createServer((req,res)=>{const name=req.url.split('?')[0],file=path.resolve(root,'.'+decodeURIComponent(name==='/'?'/index.html':name));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':'application/octet-stream');fs.createReadStream(file).on('error',()=>res.writeHead(404).end()).pipe(res);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const BASE=`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--single-process','--no-zygote']});
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await context.route('**/*',r=>r.request().url().startsWith(BASE)?r.continue():r.abort());
 await context.addInitScript(({old,now})=>{window.__sittingsNow=now;Date.now=()=>window.__sittingsNow;if(!localStorage.getItem('sittings-seeded')){localStorage.setItem('pokemath_learning_v1',JSON.stringify({sessions:{[old.id]:old}}));for(const [k,v]of Object.entries({cubs_caught:'25,151,382',cubs_pbuddy:'151',cubs_shiny:'151',cubs_sound:'off'}))localStorage.setItem(k,v);localStorage.setItem('sittings-seeded','1');}localStorage.removeItem('pokemath_timer_lease');},{old,now});
 await page.goto(BASE);await page.waitForFunction(()=>typeof adventure!=='undefined'&&collectionReady);await page.evaluate(()=>adventure.ready);
 assert.match(await page.locator('#startAdventure').textContent(),/Finish reading/);assert.equal(await page.locator('#adventureRing').count(),1,'one practice clock');
 await page.screenshot({path:'/tmp/jonah-v91-home.png',fullPage:true});
 await page.locator('#startAdventure').click();await page.waitForFunction(()=>!document.getElementById('readingBreak').hidden);assert.equal(await page.evaluate(()=>adventure.tracker.current),null);
 await page.screenshot({path:'/tmp/jonah-v91-break.png',fullPage:true});
 const progress=await page.evaluate(()=>adventure.dailyStatus().creditedMs);await page.evaluate(()=>{__sittingsNow+=3000;adventure.tracker.tick();});assert.equal(await page.evaluate(()=>adventure.dailyStatus().creditedMs),progress);
 await page.locator('#readingBreakContinue').click();await page.waitForFunction(()=>adventure.tracker.question()?.dailyStage==='actions');await page.locator('#backBtn').click();assert.match(await page.locator('#dailyReadingNext').textContent(),/Second sitting/);
 await page.reload();await page.waitForFunction(()=>typeof adventure!=='undefined'&&collectionReady);await page.evaluate(()=>adventure.ready);assert.equal(await page.evaluate(()=>adventure.dailyStatus().cycle),0);
 await page.locator('#startAdventure').click();await page.waitForFunction(()=>adventure.tracker.question()?.dailyStage==='actions');assert.equal(await page.locator('#readingBreak').isVisible(),false);
 await page.locator('#adventurePause').click();const active=await page.evaluate(()=>adventure.tracker.question().activeMs);await page.evaluate(()=>{__sittingsNow+=3000;adventure.tracker.tick();});assert.equal(await page.evaluate(()=>adventure.tracker.question().activeMs),active);
 await page.locator('#adventureResume').click();await page.evaluate(()=>{__sittingsNow+=1000;adventure.tracker.tick();});assert((await page.evaluate(()=>adventure.tracker.question().activeMs))>active);
 await page.locator('#backBtn').click();await page.evaluate(()=>{document.getElementById('parentPanel').style.display='flex';document.getElementById('app').inert=true;reading.renderPanel();});
 await page.locator('#readingPanel').evaluate(e=>e.open=true);await page.locator('#rdBriefAloud').click();await page.locator('#rdOk').click();await page.locator('#rdNo').click();assert.deepEqual(await page.evaluate(()=>[reading.state.aloud[1].ok,reading.state.aloud[1].total]),[1,2]);
 await page.locator('#ppClose').click();await page.locator('#teamBtn').click();assert.deepEqual(await page.evaluate(()=>[localStorage.getItem('cubs_caught'),localStorage.getItem('cubs_pbuddy'),localStorage.getItem('cubs_shiny')]),['25,151,382','151','151']);
 await page.locator('#backBtn').click();for(const width of [320,390,768,1024]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'no home overflow at '+width);}
 await page.evaluate(()=>{__sittingsNow=Date.parse('2026-10-12T15:00:00Z');adventure.render();});assert.equal(await page.evaluate(()=>adventure.dailyStatus().stage.id),'sounds');assert.equal(await page.evaluate(()=>adventure.dailyStatus().creditedMs),0);
 assert.deepEqual(errors,[]);await browser.close();server.close();console.log('PASS: Chromium mobile break/resume, saved progress, pause/active clock, brief adult check, Pokémon preservation, fresh day, 320–1024px layout, no page errors.');
})().catch(e=>{console.error(e);process.exit(1);});
