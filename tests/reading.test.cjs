// Reading wing: content, engine and the decode-first interaction. Synthetic data only.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('../learning-core.js'),D=require('../reading-data.js'),R=require('../reading-core.js');
const day='2026-10-02',T0=Date.parse(day+'T15:00:00Z');
function q(skill,item,ok,extra={}){return {section:'read',skill,item,kind:skill,route:1,day,startedAt:T0,completedAt:T0+1,responses:[{correct:ok}],helped:false,...extra};}
const sess=qs=>({s:{id:'s',rev:1,days:{},questions:Object.fromEntries(qs.map((x,i)=>[i,{...x,startedAt:x.startedAt+i,completedAt:x.completedAt+i}]))}});

test('every practice word, book sentence and readable name decodes with only the sounds taught by its route',()=>{
 assert.deepEqual(R.validate(),[]);
 assert.equal(D.ROUTES.length,18);
 for(const L of D.ROUTES)assert.ok(L.book.quiz?.length>=1,'route '+L.n+' book has a comprehension question');
});
test('segmentation follows the taught code: teams, split digraphs, endings and syllables',()=>{
 const s=w=>R.splitWord(w).map(p=>p.magic==='start'?p.play:p.g).join(' ');
 assert.equal(s('night'),'n igh t');assert.equal(s('whale'),'wh a_e l e');assert.equal(s('cloud'),'c l ou d');assert.equal(s('away'),'a w ay');
 assert.equal(s('pic·nic'),'p i c n i c');assert.equal(R.splitWord('pic·nic')[3].syl,true);
 const ed=w=>R.splitWord(w).at(-1);
 assert.equal(ed('jump+ed').play,'t');assert.equal(ed('rest+ed').play,null);assert.equal(ed('rain+ed').play,'d');
 assert.equal(ed('cat+s').play,'s');assert.equal(ed('bell+s').play,'z');
 // "blue" is not readable as b-l-u-e before ue is taught
 assert.deepEqual(R.missing('blue',4),['ue']);assert.deepEqual(R.missing('blue',15),[]);
});
test('all 92 Dolch pre-primer and primer words are taught by some route and every letter is written once',()=>{
 for(const w of D.DOLCH)assert.ok(R.dolchRoute(w),w);
 assert.equal(R.dolchRoute('no'),3,'open-syllable o is a heart word, not short o');
 const letters=new Set(D.ROUTES.flatMap(L=>R.writeSet(L)));assert.equal(letters.size,26);
});
test('items become secure after two independent reads and mastered only on a later day; any help drops back',()=>{
 let st=R.itemStats(sess([q('read','w:pin',true),q('read','w:pin',true)]));assert.equal(st['w:pin'].box,2);
 st=R.itemStats(sess([q('read','w:pin',true),q('read','w:pin',true),q('read','w:pin',true)]));assert.equal(st['w:pin'].box,2,'same day cannot master');
 st=R.itemStats(sess([q('read','w:pin',true),q('read','w:pin',true),q('read','w:pin',true,{day:'2026-10-03'})]));assert.equal(st['w:pin'].box,3);
 st=R.itemStats(sess([q('read','w:pin',true),q('read','w:pin',true),q('read','w:pin',true,{helped:true})]));assert.equal(st['w:pin'].box,1);
 st=R.itemStats(sess([q('meet','g:s',true,{teach:true})]));assert.equal(st['g:s'],undefined,'teaching steps are not evidence');
});
test('a route opens only when its sounds, words, tricky words and book are secure',()=>{
 const L=D.ROUTES[0],qs=[];
 for(const g of L.add)qs.push(q('hunt','g:'+g,true),q('hunt','g:'+g,true));
 for(const w of L.blend)qs.push(q('read','w:'+w,true),q('read','w:'+w,true));
 assert.equal(R.gate(1,R.itemStats(sess(qs)),{}).met,false);
 for(const h of L.heart)qs.push(q('heart','h:'+h.w.toLowerCase(),true),q('heart','h:'+h.w.toLowerCase(),true));
 assert.equal(R.gate(1,R.itemStats(sess(qs)),{}).met,false,'book still unread');
 qs.push(q('book','b:1:0',true));
 const g=R.gate(1,R.itemStats(sess(qs)),{});assert.equal(g.met,true);
 const teach=['ears','hunt','read','build','heart','sentence','book'].map(a=>({...q(a,'x',true)}));
 const marks=[...L.add.map(g=>q('shapes','s:'+g,true)),...L.add.map(g=>q('write','l:'+g,true))];
 assert.equal(R.nextActivity(sess([...qs,...teach,...marks]),{assessV:2},[]).act,'advance');
});
test('the English check runs first (and again for children placed by the old check); new sounds come two or three at a time',()=>{
 assert.equal(R.nextActivity({},{}).act,'placement');
 assert.equal(R.nextActivity({},{placedAt:1,passed:{1:1}}).act,'placement','old placement is redone');
 const st={assessV:2};
 const p=R.nextActivity({},st);assert.equal(p.act,'meet');
 assert.deepEqual(R.makeRound('meet',1,{},st).items.map(i=>i.g),['s','a','t']);
 // after meeting s a t, more sounds wait until each has one clean success
 const met=['s','a','t'].map(g=>({...q('meet','g:'+g,true),teach:true}));
 assert.equal(R.nextActivity(sess(met),st).act,'shapes');
 const marks=['s','a','t'].flatMap(g=>[q('shapes','s:'+g,true),q('write','l:'+g,true)]);
 assert.notEqual(R.nextActivity(sess([...met,...marks]),st).act,'meet');
 const ok=['s','a','t'].map(g=>q('hunt','g:'+g,true));
 assert.equal(R.nextActivity(sess([...met,...marks,...ok]),st).act,'meet');
 assert.deepEqual(R.makeRound('meet',1,sess([...met,...marks,...ok]),st).items.map(i=>i.g),['p','i','n']);
});
test('a Sound explorer gets listening and letter-sound games, not words, until blending and four sounds are secure',()=>{
 const st={assessV:2,profile:{pre:true}};
 const intro=R.route(1).add.flatMap(g=>[{...q('meet','g:'+g,true),teach:true},q('shapes','s:'+g,true),q('write','l:'+g,true),q('hunt','g:'+g,true)]);
 const base=[...intro,q('ears','pa:x',true),q('hunt','x',true)];
 for(let i=0;i<6;i++){const a=R.nextActivity(sess(base),st,['ears','hunt'][i%2]==='ears'?['ears']:['hunt']).act;assert.ok(['hunt','ears','review','spell'].includes(a),a);}
 assert.equal(R.preReading(sess(base),st),true);
 const secure=['s','a','t','p'].flatMap(g=>[q('hunt','g:'+g,true),q('hunt','g:'+g,true)]);
 const blends=Array.from({length:5},()=>({...q('ears','pa:blend',true),kind:'blend'}));
 assert.equal(R.preReading(sess([...base,...secure,...blends]),st),false);
 const round=R.makeRound('ears',1,{},st);assert.ok(round.items.some(i=>i.kind==='rhyme'));
});
test('placed routes return as unconfirmed review items, mixed across sounds, words and tricky words',()=>{
 const st={placedAt:1,passed:{1:1,2:1}};
 const r=R.makeRound('review',3,{},st).items.map(i=>i.item[0]);
 assert.deepEqual(r.slice(0,3),['g','w','h']);
 assert.ok(R.dueReviews({},st).length>20);
});
test('every generated item contains its answer and options are distinct',()=>{
 let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
 for(let n=1;n<=18;n++)for(const a of ['hunt','read','build','heart','sentence','ears','name','shapes','caps','book']){
  for(const it of R.makeRound(a,n,{},{},rnd).items){
   if(!it.options)continue;
   const vals=it.options.map(o=>typeof o==='object'?(o.w?R.clean(o.w):o.id??o.e):o);
   if(it.kind==='sentence'||it.kind==='quiz')assert.ok(it.answer>=0&&it.answer<it.options.length);
   else assert.ok(vals.map(String).includes(String(it.answer)),n+' '+a+' '+it.item);
   if(!['sentence','quiz'].includes(it.kind))assert.equal(new Set(vals.map(String)).size,vals.length,n+' '+a+' '+vals);
  }
 }
});
test('reading state merges monotonically and route passes are rebuilt from shared sessions',()=>{
 const a={passed:{1:5},books:{1:3},placedAt:10,placedRoute:2},b={passed:{1:4,2:9},books:{2:1},placedAt:5,placedRoute:4,aloud:{3:{at:7,ok:5,total:6,route:3}}};
 const m=R.mergeState(a,b);assert.deepEqual(m.passed,{1:5,2:9});assert.equal(m.placedRoute,2);assert.equal(m.aloud[3].ok,5);
 const s=R.withSessions({},sess([{...q('placed','placed',true),route:3,teach:true},{...q('advance','route:4',true),route:4,teach:true}]));
 assert.deepEqual(Object.keys(s.passed),['1','2','3','4']);assert.equal(R.currentRoute(s),5);
 assert.equal(R.importLegacy('{"at":4,"books":[1,2],"caught":[25,"x"]}').caught.length,1);assert.equal(R.importLegacy('nope'),null);
});
test('readiness reports honest denominators and pace against the P1 timeline',()=>{
 const r=R.readiness({},{placedAt:Date.parse('2026-10-01'),placedRoute:0},Date.parse('2027-04-15'));
 assert.ok(r.expected>=8&&r.expected<=11,String(r.expected));assert.equal(r.pace,'behind');
 assert.equal(r.rows.find(x=>x.key==='dolch').target,92);assert.equal(r.rows.find(x=>x.key==='cvc').value,null);
 assert.match(R.report({},{},day),/count as helped, not independent/);
});

/* ---------- the real UI with a small fake DOM ---------- */
function harness({teaching=false,audioMocks=false,gainMocks=false,audioDuration=200,recordings={}}={}){
 let now=T0;const timers=[];
 class El{constructor(tag='div'){this.tag=tag;this.children=[];this.attrs={};this.dataset={};this.style={setProperty(){}};this._cls=new Set();this.disabled=false;this._text='';
  const c=this._cls;this.classList={add:(...x)=>x.forEach(v=>c.add(v)),remove:(...x)=>x.forEach(v=>c.delete(v)),toggle:(v,f)=>(f??!c.has(v))?c.add(v):c.delete(v),contains:v=>c.has(v)};}
  set className(v){this._cls.clear();String(v).split(/\s+/).filter(Boolean).forEach(x=>this._cls.add(x));}get className(){return [...this._cls].join(' ');}
  set textContent(v){this._text=String(v);this.children=[];}get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
  set innerHTML(v){this._html=v;this.children=[];}get innerHTML(){return this._html||'';}
  append(...x){x.forEach(e=>{if(typeof e==='string')e=new El('#text'),e._text=String(e);e.parent=this;this.children.push(e);});}appendChild(x){this.append(x);}prepend(x){this.children.unshift(x);}
  after(){}before(){}replaceChildren(...x){this.children=[];this.append(...x);}remove(){if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this);}
  setAttribute(k,v){this.attrs[k]=v;}getAttribute(k){return this.attrs[k];}getBoundingClientRect(){return {left:0,top:0,width:0,height:0};}
  click(){if(!this.disabled)this.onclick?.();}addEventListener(){}
  all(){return [this,...this.children.flatMap(c=>c.all())];}
  querySelectorAll(sel){return this.all().slice(1).filter(e=>sel.startsWith('.')?e._cls.has(sel.slice(1)):e.tag===sel);}querySelector(sel){return this.querySelectorAll(sel)[0]||null;}}
 const els={},data={...recordings},spoken=[],utterances=[],played=[],players=[],listened=[],t=new C.Tracker({now:()=>now}),helps=[],answers=[];
 const adventure={recordState(){},recordListening:meta=>listened.push(meta),get tracker(){return t;},begin:meta=>t.begin(meta),respond:(v,c)=>{answers.push({v,c});t.answer(v,c);},help:k=>{helps.push(k);t.help(k);},isPaused:()=>false,beforeQuestion:()=>true};
 const ctx={PokeSoundBuddies:require('../reading-buddies.js'),PokePhonics:require('../reading-phonics.js'),PokeReadingTutor:teaching?require('../reading-tutor.js'):{prepare:r=>r},PokeReadingCore:R,PokeReadingData:D,PokeLearning:C,PokeReadingAssess:require('../reading-assess.js'),adventure,screens:{},mode:'home',soundOn:true,childName:'Jonah',caught:[],stars:0,
  document:{createElement:tag=>new El(tag),createElementNS:(_,tag)=>new El(tag),createTextNode:s=>{const e=new El('#text');e._text=s;return e;},getElementById:id=>els[id]||=new El(),body:{dataset:{}}},
  window:{speechSynthesis:{getVoices:()=>[],speak:u=>{spoken.push(u.text);utterances.push(u);timers.push({at:now+20,f:()=>u.onend?.()});},cancel(){}}},
  SpeechSynthesisUtterance:function(text){this.text=text;},
  localStorage:{setItem:(k,v)=>data[k]=v,getItem:k=>data[k]??null,removeItem:k=>delete data[k],key:i=>Object.keys(data)[i],get length(){return Object.keys(data).length;}},
  setTimeout:(f,ms=0)=>{timers.push({at:now+ms,f});return timers.length;},clearTimeout(){},requestAnimationFrame(){},Date:{now:()=>now},
  show(){},shutUp(){},speechIdle:()=>true,sndGood(){},sndOops(){},sndTap(){},burst(){},audio(){},readyForNext:()=>true,schedulePush(){},
  addStar:n=>{ctx.stars+=n;},imgArt:id=>'art'+id,PokeVisuals:{icon:()=>'',ball:()=>''},PokeCatalog:{byId:{}},catchMon(){},beginCeremony(){},pkState(){},renderBuddyHome(){},updateBallPill(){},confirm:()=>true,alert(){},navigator:{}};
 const ramps=[];
 if(gainMocks){const ac={state:'running',get currentTime(){return now/1000;},destination:{},createMediaElementSource(){return {connect(){},disconnect(){}};},createGain(){return {context:ac,connect(){},disconnect(){},gain:{value:1,cancelScheduledValues(){},setValueAtTime(){},linearRampToValueAtTime(value,at){ramps.push({value,at,started:now/1000});}}};}};ctx.audio=()=>ac;}
 if(audioMocks)ctx.Audio=class{constructor(src){this.src=src;this.volume=1;players.push(this);}play(){played.push({src:this.src,at:now});timers.push({at:now+audioDuration,f:()=>{if(!this.paused)this.onended?.();}});return {catch(){}};}pause(){this.paused=true;}};
 else ctx.Audio=class{play(){this.onended?.();return {catch(){}};}pause(){}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(require.resolve('../reading-art.js'),'utf8'),ctx);vm.runInContext(fs.readFileSync(require.resolve('../reading-ui.js'),'utf8')+'\nvar ui=createReading();',ctx);
 const flush=(ms=5000)=>{const end=now+ms;for(let guard=0;guard<5000;guard++){timers.sort((a,b)=>a.at-b.at);const t0=timers[0];if(!t0||t0.at>end)break;timers.shift();now=Math.max(now,t0.at);t0.f();}now=end;};
 const opts=()=>els.rdOptions.children,acts=()=>els.rdActions.children;
 return {ctx,ui:ctx.ui,t,spoken,utterances,played,players,listened,ramps,helps,answers,flush,opts,acts,data};
}
test('Read it never says the word before he answers; the app sounds out only on request or after a miss',()=>{
 const h=harness();h.ui._round('read',1);h.flush();
 const it=h.ui._current().item,word=R.clean(it.word);
 assert.ok(!h.spoken.includes(word),'word spoken before any answer');
 const wrong=h.opts().find(b=>b.dataset.w!==it.answer);wrong.click();h.flush(3000);
 assert.ok(!h.spoken.includes(word),'first miss models the sounds, not the word');
 const q=h.t.question();h.opts().find(b=>b.dataset.w===it.answer).click();h.flush(3000);
 assert.ok(q.completedAt);assert.equal(C.independent(q),false);
 assert.ok(h.spoken.includes(word),'the word is confirmed after he answers');
});
test('asking for help is recorded, and a clean first answer is independent and earns two stars',()=>{
 const h=harness();h.ui._round('read',1);h.flush();
 let it=h.ui._current().item,q=h.t.question();
 h.acts().find(b=>b.attrs['aria-label']==='Help me sound it out').click();h.flush(2000);
 assert.deepEqual(h.helps,['sounds modelled']);
 h.opts().find(b=>b.dataset.w===it.answer).click();h.flush(3000);assert.equal(C.independent(q),false);
 const before=h.ctx.stars;it=h.ui._current().item;q=h.t.question();
 h.opts().find(b=>b.dataset.w===it.answer).click();h.flush(3000);
 assert.equal(C.independent(q),true);assert.equal(h.ctx.stars-before,2);
});
test('the English check gives one try per item with no fading or help, then moves on',()=>{
 const h=harness();h.ui.startBlock(()=>{});h.flush(8000);
 const c=h.ui._current();assert.equal(c.placement,true);assert.equal(c.item.kind,'vocab','starts with the easiest listening game');
 const first=c.item;const wrong=h.opts().find(b=>(b.dataset.g||b.dataset.w)!==first.answer);wrong.click();h.flush(3000);
 assert.equal(h.helps.length,0);assert.ok(h.opts().every(b=>!b._cls.has('faded')));
 assert.notEqual(h.ui._current()?.item,first,'moved to the next item');
});
test('a child who answers nothing finishes the English check quickly and becomes a Sound explorer at route 1',()=>{
 const h=harness();let done=0;h.ui.startBlock(()=>done++);h.flush(8000);
 for(let i=0;i<60&&!done;i++){const c=h.ui._current();if(!c){h.flush(2000);continue;}
  const w=h.opts().find(b=>(b.dataset.g||b.dataset.w||b.textContent)!==String(c.item.answer)&&!b.disabled);if(w)w.click();h.flush(3000);}
 assert.equal(done,1);const p=h.ui.state.profile;assert.equal(p.pre,true);assert.equal(p.level.id,'explorer');assert.equal(p.passed,0);
 assert.ok(p.rows.find(r=>r.id==='words').skipped,'never shown words he cannot read');
 assert.equal(R.nextActivity(h.t.sessions,R.withSessions(h.ui.state,h.t.sessions)).act,'meet');
});
test('a book records page help, completes, then asks its comprehension question',()=>{
 const h=harness();h.ui._round('book',3);h.flush();
 const pages=D.ROUTES[2].book.pages.length;
 h.acts().find(b=>b.attrs['aria-label']==='Read this page to me').click();h.flush(4000);
 for(let i=0;i<pages;i++){h.acts().find(b=>b.attrs['aria-label']==='Next page').click();h.flush(500);}
 h.flush(3000);
 assert.ok(h.ui.state.books[3]);assert.equal(h.ui._current().item.kind,'quiz');
 const book=Object.values(h.t.sessions).flatMap(s=>Object.values(s.questions)).find(x=>x.kind==='book');
 assert.ok(book.teach&&book.completedAt&&book.helped);
 assert.ok(book.actions.some(a=>a.kind==='page read aloud'));
});
test('the old Poké Reading app adds its Pokémon once and stays a hint, not a placement',()=>{
 const h=harness();h.data.poke_reading_v1=JSON.stringify({at:6,books:[1,2],caught:[25,89],stars:12});
 h.ctx.PokeCatalog.byId={25:{},89:{}};h.ctx.caught.push(25);
 h.ui.importLegacy();h.ui.importLegacy();
 assert.deepEqual([...h.ctx.caught],[25,89]);assert.equal(h.ui.state.legacy.at,6);assert.deepEqual(h.ui.state.passed,{});
});
test('Build never greys out a letter that a later box still needs (stuck-screen regression)',()=>{
 const h=harness();h.ui._round('build',2);h.flush();
 for(let item=0;item<4;item++){const it=h.ui._current()?.item;if(!it)break;
  const wrongTile=()=>h.opts().find(b=>!b._cls.has('used')&&!b.disabled&&!it.parts.some(p=>p.g===b.dataset.g));
  for(let k=0;k<3;k++){const w=wrongTile();if(w){w.click();h.flush(600);}}     // three misses on the first box
  for(const p of it.parts){const b=h.opts().find(x=>x.dataset.g===p.g&&!x._cls.has('used')&&!x.disabled);assert.ok(b,'tile for '+p.g+' still tappable in '+it.word);b.click();h.flush(300);}
  h.flush(4000);
 }
});
test('words wait until he has shown he knows their sounds, not just met them',()=>{
 const st={assessV:2};
 const met=R.route(1).add.flatMap(g=>[{...q('meet','g:'+g,true),teach:true},q('shapes','s:'+g,true),q('write','l:'+g,true)]);
 const wrong=['p','i','n'].map(g=>q('hunt','g:'+g,false));const right=['s','a','t'].map(g=>q('hunt','g:'+g,true));
 assert.deepEqual(R.readableWords(sess([...met,...wrong,...right]),1).map(R.clean),['sat']);
 assert.ok(['hunt','ears','review','spell'].includes(R.nextActivity(sess([...met,...wrong,...right,q('ears','pa:x',true),q('hunt','x',true)]),st,['ears']).act));
 const more=['p','i','n'].map(g=>q('hunt','g:'+g,true));
 assert.ok(R.readableWords(sess([...met,...wrong,...right,...more]),1).length>=6);
});
test('a sound he keeps missing is shown again before more quizzing',()=>{
 const st={assessV:2};
 const met=R.route(1).add.flatMap(g=>[{...q('meet','g:'+g,true),teach:true},q('shapes','s:'+g,true),q('write','l:'+g,true)]);
 const miss=[q('hunt','g:p',false),q('hunt','g:p',false),q('ears','pa:x',true)];
 const p=R.nextActivity(sess([...met,...miss]),st,['hunt']);assert.equal(p.act,'reteach');
 assert.deepEqual(R.makeRound('reteach',1,sess([...met,...miss]),st).items.map(i=>i.g),['p']);
 assert.notEqual(R.nextActivity(sess([...met,...miss]),st,['reteach']).act,'reteach');
});

/* ---------- v76: the school's reading plan (letter names, listening ladder, step-by-step spelling) ---------- */
test('listening steps open after varied practice, with retention tracked separately', () => {
 const st={assessV:2,profile:{pre:true}};
 const ok=(kind,n)=>Array.from({length:n},(_,i)=>({...q('ears','pa:'+kind,true),kind,word:['cat','dog','sun'][i%3]}));
 assert.deepEqual(R.ladder(sess([])).unlocked,['rhyme','first','blend']);
 assert.deepEqual(R.ladder(sess(ok('blend',5))).unlocked,['rhyme','first','blend','last']);
 const all=['blend','last','count','middle','delete'].flatMap(k=>ok(k,6));
 assert.deepEqual(R.ladder(sess(all)).unlocked,R.LADDER);
 // the newest open step leads the round, earlier secure steps come back for review
 const round=R.makeRound('ears',1,sess(all),st);
 assert.equal(round.items[0].kind,'swap');
 assert.ok(round.items.every(i=>R.LADDER.includes(i.kind)));
 for(let t=0;t<30;t++){const r=R.makeRound('ears',1,sess(all),{},Math.random);
  for(const it of r.items){assert.ok(it.options.some(o=>o.w===it.answer||it.kind==='count'),it.kind);
   if(it.options[0]?.e)assert.equal(new Set(it.options.map(o=>o.e)).size,it.options.length,'pictures must differ: '+it.kind+' '+it.word);
   if(it.kind==='swap'){const a=R.splitWord(it.word).map(p=>p.g),b=R.splitWord(it.to).map(p=>p.g);assert.equal(a.filter((g,i)=>g!==b[i]).length,1);}
   if(it.kind==='last')assert.ok(it.options.filter(o=>require('../reading-phonics.js').parts(o.w).at(-1).g===it.target.g).length===1,'only one picture ends with the sound');
   if(it.kind==='middle')assert.ok(it.options.filter(o=>require('../reading-phonics.js').parts(o.w)[1]?.g===it.target.g).length===1,'only one picture has the middle sound');}}
});
test('every take-away pair has pictures and really leaves the named word', () => {
 for(const [whole,gone,left,where] of D.DELETE){assert.ok(D.ART[whole]&&D.ART[left],whole);
  const w=R.splitWord(whole).map(p=>p.g),l=R.splitWord(left).map(p=>p.g);
  const cut=where==='first'?w.slice(1):w.slice(0,-1);
  // same sounds, different spelling: "bread" without /b/ sounds like "red"
  const SAME={bread:'red'};if(SAME[whole]!==left)assert.equal(cut.join(''),l.join(''),whole+' → '+left);
  assert.equal(where==='first'?w[0]:w.at(-1),gone==='c'?'c':gone);}
});
test('letter names are on from the start and appear in sound hunts; a grown-up can turn them off', () => {
 assert.equal(R.namesOn({}),true);assert.equal(R.namesOn({namesAt:1,names:false}),false);
 const met=R.route(1).add.map(g=>({...q('meet','g:'+g,true),teach:true}));
 const r=R.makeRound('hunt',1,sess(met),{assessV:2});assert.equal(r.items.filter(i=>i.kind==='lname').length,2);
 assert.ok(r.items.filter(i=>i.kind==='lname').every(i=>i.item==='ln:'+i.target&&i.options.includes(i.answer)));
 assert.equal(R.makeRound('hunt',1,sess(met),{assessV:2,namesAt:1,names:false}).items.filter(i=>i.kind==='lname').length,0);
 assert.equal(D.LETTER_NAME.z,'zee');
});
test('spelling builds up: first sound of a word he hears, then first and last, only with sounds he knows', () => {
 const st={assessV:2,profile:{pre:true}};
 const know=gs=>gs.flatMap(g=>[{...q('meet','g:'+g,true),teach:true},q('shapes','s:'+g,true),q('write','l:'+g,true),q('hunt','g:'+g,true)]);
 assert.equal(R.spellStage(sess(know(['s'])),1),0);
 const k=know(['s','a','t','p','i','n']);
 assert.equal(R.spellStage(sess(k),1),1);
 const r=R.makeRound('spell',1,sess(k),st);assert.ok(r.items.length>=3);
 const known=new Set(R.knownSounds(sess(k),1));
 for(const it of r.items){assert.equal(it.kind,'spell1');assert.deepEqual(it.ask,[0]);assert.ok(known.has(it.parts[0].g));assert.ok(it.tiles.includes(it.parts[0].g));assert.ok(it.tiles.length<=3);}
 const good=Array.from({length:6},(_,i)=>({...q('spell','pa:spell1',true),kind:'spell1',word:['pin','sat','tin'][i%3]}));
 assert.equal(R.spellStage(sess([...k,...good]),1),2);
 const r2=R.makeRound('spell',1,sess([...k,...good]),st);
 for(const it of r2.items){assert.equal(it.kind,'spell2');assert.equal(it.ask.length,2);for(const i of it.ask){assert.ok(known.has(it.parts[i].g));assert.ok(it.tiles.includes(it.parts[i].g));}}
 // a pre-reader rotates listening, letter sounds and spelling
 const acts=new Set();let recent=['ears','hunt','spell'];for(let i=0;i<9;i++){const a=R.nextActivity(sess([...k,...good,q('ears','pa:x',true),q('hunt','x',true),q('spell','pa:spell1',true)]),st,recent).act;acts.add(a);recent=[...recent,a];}
 assert.ok(['ears','hunt','spell'].every(a=>acts.has(a)),[...acts].join());
});

test('new reading lesson models, guides, then tests a different word without speaking its answer',()=>{
 const h=harness({teaching:true});h.ui._round('read',1);h.flush(12000);let it=h.ui._current().item;
 assert.equal(it.phase,'model');const word=R.clean(it.word),model=h.t.question();assert.ok(h.spoken.some(x=>x.includes('Join the sounds. '+word)));
 h.acts().find(b=>b.attrs['aria-label']==='Try together').click();h.flush(12000);assert.equal(h.ui._current().item.phase,'guided');
 const guide=h.t.question();h.opts().find(b=>b.dataset.w===word).click();h.flush(12000);
 const next=h.ui._current().item;assert.notEqual(R.clean(next.word),word);assert.equal(next.teach,undefined);assert.equal(C.independent(model),false);assert.equal(C.independent(guide),false);
 assert.ok(!h.spoken.includes(R.clean(next.word)),'fresh answer was not given away');
});
test('two first-sound errors in spelling never disable the final-sound answer',()=>{
 const h=harness(),qs=[];for(const g of R.route(1).add)qs.push(q('hunt','g:'+g,true),q('hunt','g:'+g,true));
 for(let i=0;i<6;i++)qs.push(q('spell','pa:spell1',true,{kind:'spell1',word:['pin','sat','tin'][i%3]}));
 const s=h.t.sessions[h.t.sessionId];s.questions=Object.fromEntries(qs.map((x,i)=>['pre'+i,{...x,id:'pre'+i}]));
 h.ui._round('spell',1);h.flush(8000);const it=h.ui._current().item,question=h.t.question();assert.equal(it.kind,'spell2');
 const first=it.parts[it.ask[0]].g,last=it.parts[it.ask[1]].g,wrong=h.opts().find(x=>x.dataset.g!==first);wrong.click();h.flush(1000);wrong.click();h.flush(1000);
 h.opts().find(x=>x.dataset.g===first&&!x.disabled).click();h.flush(1000);
 const final=h.opts().find(x=>x.dataset.g===last&&!x.disabled);assert.ok(final,'last sound remains available');final.click();h.flush(6000);assert.ok(question.completedAt);assert.equal(C.independent(question),false);
});

test('sound buddy UI teaches with actual artwork then removes cues for fresh-word checks',()=>{
 const h=harness({teaching:true});h.ui.startBuddies(['p']);h.flush(14000);
 const all=()=>h.ctx.document.getElementById('rdStage').all();
 assert.equal(h.ui._current().item.kind,'buddyMeet');assert.ok(all().some(x=>x.tag==='img'&&x.src==='assets/sound-buddies/25.png'));
 h.acts().find(b=>b.attrs['aria-label']==='Try together').click();h.flush(8000);
 assert.equal(h.ui._current().item.kind,'buddyGuide');const guided=h.t.question();h.opts().find(x=>x.dataset.g==='p').click();h.flush(10000);
 const it=h.ui._current().item;assert.equal(it.kind,'buddyWord');assert.notEqual(it.word,'pin');assert.equal(C.independent(guided),false);
 assert.ok(!all().some(x=>x.tag==='img'||x.classList.contains('sound-buddy-letter')));assert.ok(h.opts().every(x=>!x.classList.contains('tutor-guided')));
 assert.ok(h.spoken.some(x=>x.startsWith('Listen to '+it.word+'.')));const check=h.t.question();h.opts().find(x=>x.dataset.g==='p').click();h.flush(10000);
 assert.equal(C.independent(check),true);assert.equal(check.buddyCue,false);assert.equal(h.ui._current(),null);
});
test('asking for a buddy in a no-picture check saves help and cannot earn independent credit',()=>{
 const h=harness();h.ui.startBuddies(['x']);h.flush(14000);assert.ok(h.spoken.some(x=>x.includes('name starts with a different sound')));
 h.acts().find(b=>b.attrs['aria-label']==='Try together').click();h.flush(5000);h.opts().find(x=>x.dataset.g==='x').click();h.flush(10000);
 assert.equal(h.ui._current().item.kind,'buddyWord');const q=h.t.question();h.acts().find(x=>x.attrs['aria-label']==='Show my sound buddy').click();h.flush(1000);
 assert.equal(q.helped,true);assert.equal(q.buddyCue,true);h.opts().find(x=>x.dataset.g==='x').click();h.flush(10000);assert.equal(C.independent(q),false);
});
test('one alphabet page shows all 26 Pokémon; each tap plays once without an automatic repeat',()=>{
 const h=harness({audioMocks:true});h.ui.openLetters();h.flush();
 assert.equal(h.spoken.length,0,'poster opens quietly without narration to interrupt');
 const cards=h.opts()[0].children,names=cards.flatMap(c=>c.all().filter(x=>x.tag==='img').map(x=>x.alt));
 assert.equal(cards.length,26);assert.equal(names.length,26);assert.equal(new Set(names).size,26);
 assert.equal(cards.map(c=>c.dataset.letter).join(''),'abcdefghijklmnopqrstuvwxyz');
 h.ctx.document.getElementById('rdListen').click();h.flush();assert.ok(h.utterances[0].rate<=.7,'slower spoken instructions on request');
 const questions=JSON.stringify(h.t.sessions),p=cards.find(c=>c.dataset.letter==='p'),before=h.spoken.length;
 p.click();assert.equal(h.played.length,1);assert.match(h.played[0].src,/phonemes\/recorded-v82\/p.wav$/);
 assert.equal(h.listened[0].kind,'buddyListen');assert.equal(h.listened[0].buddyLetter,'p');
 assert.equal(h.ui._current(),null);assert.equal(h.spoken.length,before,'no spoken letter name before the sound');
 h.flush(5000);assert.equal(h.played.length,1);assert.equal(p.classList.contains('playing'),false);
 p.click();assert.equal(h.played.length,2);h.flush(5000);assert.equal(h.played.length,2);
 assert.equal(h.answers.length,0);assert.equal(JSON.stringify(h.t.sessions),questions);
 h.acts().find(b=>b.attrs['aria-label']==='Practise P together').click();h.flush(18000);assert.equal(h.ui._current().item.kind,'buddyMeet');
});
test('each new tap on the same letter plays once and records listening only',()=>{
 const h=harness({audioMocks:true});h.ui.openLetters();const p=h.opts()[0].children.find(c=>c.dataset.letter==='p');
 p.click();h.flush(40);p.click();h.flush(40);p.click();
 assert.equal(h.played.length,3);assert.equal(h.listened.length,3);
 h.flush(2200);assert.equal(h.played.length,3);assert.equal(p.classList.contains('playing'),false);assert.ok(h.players.every(p=>p.paused));
 p.click();assert.equal(h.played.length,4);assert.equal(h.listened.length,4);assert.equal(h.answers.length,0);
});
test('switching letters releases the playing clip over 75ms, then stops it without interrupting the next clip',()=>{
 for(const gainMocks of [false,true]){
  const h=harness({audioMocks:true,gainMocks});h.ui.openLetters();const cards=h.opts()[0].children;
  cards[0].click();h.flush(40);const old=h.players[0];cards[1].click();
  assert.equal(old.paused,undefined,'no immediate hard stop');assert.equal(old.onended,null,'cancelled completion cannot change the new playback');
  if(gainMocks){assert.equal(h.ramps.length,1);assert.equal(h.ramps[0].value,0);assert.ok(Math.abs(h.ramps[0].at-h.ramps[0].started-.075)<.001);}
  h.flush(40);assert.equal(old.paused,undefined);if(!gainMocks)assert.ok(old.volume<1&&old.volume>0);
  h.flush(45);assert.equal(old.paused,true);assert.equal(h.players[1].paused,undefined);
  h.flush(2200);assert.deepEqual(h.played.map(x=>x.src.split('/').at(-1)),['a.wav','b.wav']);
 }
});
test('new taps and leaving cancel old audio; Q and X each play one complete recording',()=>{
 const h=harness({audioMocks:true});h.ui.openLetters();h.flush();const cards=h.opts()[0].children;
 cards.find(c=>c.dataset.letter==='p').click();h.flush(220);
 cards.find(c=>c.dataset.letter==='s').click();h.flush(2200);
 assert.deepEqual(h.played.map(x=>x.src.split('/').at(-1)),['p.wav','s.wav']);assert.ok(h.players[0].paused);
 h.played.length=0;cards.find(c=>c.dataset.letter==='q').click();h.flush(3000);
 assert.deepEqual(h.played.map(x=>x.src.split('/').at(-1)),['qu.wav']);
 h.played.length=0;cards.find(c=>c.dataset.letter==='x').click();h.flush(3000);
 assert.deepEqual(h.played.map(x=>x.src.split('/').at(-1)),['x.wav']);
 h.played.length=0;cards[0].click();h.ui.leave();h.flush(5000);assert.equal(h.played.length,1);assert.ok(h.players.at(-1).paused);
});
test('a natural recording finishes once at its original speed and can be replayed by tapping',()=>{
 const h=harness({audioMocks:true,audioDuration:1942});h.ui.openLetters();const m=h.opts()[0].children.find(c=>c.dataset.letter==='m');m.click();
 h.flush(1941);assert.equal(h.played.length,1);assert.equal(h.players[0].paused,undefined);assert.equal(m.classList.contains('playing'),true);
 h.flush(1);assert.equal(h.players[0].paused,true);assert.equal(m.classList.contains('playing'),false);
 h.flush(5000);assert.equal(h.played.length,1);m.click();assert.equal(h.played.length,2);
 h.flush(5000);assert.equal(h.played.length,2);
 assert.equal(h.players[0].playbackRate,undefined,'native speed is retained');
});
test('letter tile names wait for the full recording, and parent recordings still take priority',()=>{
 const h=harness({audioMocks:true,audioDuration:1900});h.ui.openLetters();h.acts().find(b=>b.attrs['aria-label']==='Letter writing and other sounds').click();h.flush();
 h.opts()[0].children.find(b=>b.attrs['aria-label']==='Sound s').click();
 h.flush(900);assert.ok(!h.spoken.includes('the letter S'));h.flush(1010);assert.ok(h.spoken.includes('the letter S'));
 const custom='data:audio/webm;base64,parent-recording';
 const parent=harness({audioMocks:true,recordings:{poke_reading_rec_p:custom}});parent.ui.openLetters();parent.opts()[0].children.find(c=>c.dataset.letter==='p').click();assert.equal(parent.played[0].src,custom);
});
