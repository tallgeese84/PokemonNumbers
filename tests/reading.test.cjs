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
 const teach=['shapes','meet','write','ears','hunt','read','build','heart','sentence','book'].map(a=>({...q(a,'x',true),teach:a==='meet'}));
 assert.equal(R.nextActivity(sess([...qs,...teach]),{placedAt:1},[]).act,'advance');
});
test('first play runs a placement check; afterwards new routes teach in a fixed order before practice',()=>{
 assert.equal(R.nextActivity({},{}).act,'placement');
 assert.deepEqual(['shapes','meet'].map((a,i)=>a),[R.nextActivity({},{placedAt:1}).act,'meet']);
 const done=sess([q('shapes','s:s',true)]);assert.equal(R.nextActivity(done,{placedAt:1}).act,'meet');
 assert.equal(R.placementResult([[true,true,true],[true,true,false]]),1);
 assert.equal(R.placementResult([[true,true,true],[true,true,true],[false]]),3);
 assert.equal(R.placementResult([[false,true,true]]),0);
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
function harness(){
 let now=T0;const timers=[];
 class El{constructor(tag='div'){this.tag=tag;this.children=[];this.attrs={};this.dataset={};this.style={setProperty(){}};this._cls=new Set();this.disabled=false;this._text='';
  const c=this._cls;this.classList={add:(...x)=>x.forEach(v=>c.add(v)),remove:(...x)=>x.forEach(v=>c.delete(v)),toggle:(v,f)=>(f??!c.has(v))?c.add(v):c.delete(v),contains:v=>c.has(v)};}
  set className(v){this._cls.clear();String(v).split(/\s+/).filter(Boolean).forEach(x=>this._cls.add(x));}get className(){return [...this._cls].join(' ');}
  set textContent(v){this._text=String(v);this.children=[];}get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
  set innerHTML(v){this._html=v;this.children=[];}get innerHTML(){return this._html||'';}
  append(...x){x.forEach(e=>{if(typeof e==='string')e=new El('#text'),e._text=String(e);e.parent=this;this.children.push(e);});}appendChild(x){this.append(x);}prepend(x){this.children.unshift(x);}
  after(){}replaceChildren(...x){this.children=[];this.append(...x);}remove(){if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this);}
  setAttribute(k,v){this.attrs[k]=v;}getAttribute(k){return this.attrs[k];}getBoundingClientRect(){return {left:0,top:0,width:0,height:0};}
  click(){if(!this.disabled)this.onclick?.();}addEventListener(){}
  all(){return [this,...this.children.flatMap(c=>c.all())];}
  querySelectorAll(sel){return this.all().slice(1).filter(e=>sel.startsWith('.')?e._cls.has(sel.slice(1)):e.tag===sel);}querySelector(sel){return this.querySelectorAll(sel)[0]||null;}}
 const els={},data={},spoken=[],t=new C.Tracker({now:()=>now}),helps=[],answers=[];
 const adventure={get tracker(){return t;},begin:meta=>t.begin(meta),respond:(v,c)=>{answers.push({v,c});t.answer(v,c);},help:k=>{helps.push(k);t.help(k);},isPaused:()=>false,beforeQuestion:()=>true};
 const ctx={PokeReadingCore:R,PokeReadingData:D,PokeLearning:C,adventure,screens:{},mode:'home',soundOn:true,childName:'Jonah',caught:[],stars:0,
  document:{createElement:tag=>new El(tag),createElementNS:(_,tag)=>new El(tag),createTextNode:s=>{const e=new El('#text');e._text=s;return e;},getElementById:id=>els[id]||=new El(),body:{dataset:{}}},
  window:{speechSynthesis:{getVoices:()=>[],speak:u=>{spoken.push(u.text);timers.push({at:now+20,f:()=>u.onend?.()});},cancel(){}}},
  SpeechSynthesisUtterance:function(text){this.text=text;},
  localStorage:{setItem:(k,v)=>data[k]=v,getItem:k=>data[k]??null,removeItem:k=>delete data[k],key:i=>Object.keys(data)[i],get length(){return Object.keys(data).length;}},
  setTimeout:(f,ms=0)=>{timers.push({at:now+ms,f});return timers.length;},clearTimeout(){},requestAnimationFrame(){},Date:{now:()=>now},
  show(){},shutUp(){},speechIdle:()=>true,sndGood(){},sndOops(){},sndTap(){},burst(){},audio(){},readyForNext:()=>true,schedulePush(){},
  addStar:n=>{ctx.stars+=n;},imgArt:id=>'art'+id,PokeVisuals:{icon:()=>'',ball:()=>''},PokeCatalog:{byId:{}},catchMon(){},beginCeremony(){},pkState(){},renderBuddyHome(){},updateBallPill(){},confirm:()=>true,alert(){},navigator:{}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(require.resolve('../reading-ui.js'),'utf8')+'\nvar ui=createReading();',ctx);
 const flush=(ms=5000)=>{const end=now+ms;for(let guard=0;guard<5000;guard++){timers.sort((a,b)=>a.at-b.at);const t0=timers[0];if(!t0||t0.at>end)break;timers.shift();now=Math.max(now,t0.at);t0.f();}now=end;};
 const opts=()=>els.rdOptions.children,acts=()=>els.rdActions.children;
 return {ctx,ui:ctx.ui,t,spoken,helps,answers,flush,opts,acts,data};
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
test('the reading check gives one try per item with no fading or help, then moves on',()=>{
 const h=harness();h.ui.startBlock(()=>{});h.flush(8000);
 const c=h.ui._current();assert.equal(c.placement,true);
 const first=c.item;const wrong=h.opts().find(b=>(b.dataset.g||b.dataset.w)!==first.answer);wrong.click();h.flush(3000);
 assert.equal(h.helps.length,0);assert.ok(h.opts().every(b=>!b._cls.has('faded')));
 assert.notEqual(h.ui._current()?.item,first,'moved to the next item');
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
