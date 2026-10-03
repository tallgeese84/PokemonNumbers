// Maths path: answers re-derived from what the child sees, mastery, unlocking, routing and the real UI.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('../learning-core.js'),F=require('../foundations.js'),M=require('../math-path-core.js');
const day='2026-10-02',T0=Date.parse(day+'T15:00:00Z');
const ORD=['first','second','third','fourth','fifth','sixth','seventh','eighth','ninth','tenth'];
const nums=s=>(s.match(/\d+/g)||[]).map(Number);

/* An independent reading of each item, written without the generator code. */
function solve(it){
 const s=it.show;
 switch(it.kind){
  case 'numeralToQty':return s.numeral;
  case 'qtyToNumeral':return s.frame;
  case 'compareFrames':case 'compareNums':{const v=it.options.map(o=>o.value);return /bigger|more|greatest/.test(it.say)?Math.max(...v):Math.min(...v);}
  case 'teen':return 10+s.ones;
  case 'teenSplit':return s.numeral-10;
  case 'track':{const t=s.track,i=t.indexOf(null);const known=t.map((x,k)=>[k,x]).filter(([,x])=>x!==null);const [k1,x1]=known[0],[k2,x2]=known[1];const step=(x2-x1)/(k2-k1);return x1+(i-k1)*step;}
  case 'sum':{const m=s.eq.match(/^(\d+) ([+−]) (\d+) = \?$/);if(m)return m[2]==='+'?+m[1]+ +m[3]:m[1]-m[3];const n=s.eq.match(/^(\d+) (more|less) than (\d+)$/);return n[2]==='more'?+n[3]+ +n[1]:n[3]-n[1];}
  case 'vertical':return s.op==='+'?s.top+s.bottom:s.top-s.bottom;
  case 'blocks':return s.tens*10+s.ones;
  case 'placeValue':return /tens/.test(it.say)?Math.floor(s.numeral/10):s.numeral%10;
  case 'hearNumber':return nums(it.say)[0];
  case 'story':{const [a,b]=nums(s.text);return /more\.|more \w+ now|gets/.test(s.text)&&/gets/.test(s.text)?a+b:a-b;}
  case 'groups':return s.groups*s.each;
  case 'share':return s.plates?s.n/s.plates:s.n/s.per;
  case 'money':return [...(s.coins||[]),...(s.notes||[])].reduce((x,y)=>x+y,0);
  case 'shapes':return it.say.replace(/^Find the |\.$/g,'');
  case 'clock':return s.h+':'+String(s.m).padStart(2,'0');
  case 'bars':{const v=it.options.map(o=>o.bar);return /longest/.test(it.say)?Math.max(...v):Math.min(...v);}
  case 'ruler':return s.len;
  case 'graph':{const names={apples:'🍎',bananas:'🍌',grapes:'🍇',strawberries:'🍓'};const c=s.counts,k=s.cats;
   if(/most/.test(it.say))return k[c.indexOf(Math.max(...c))];if(/fewest/.test(it.say))return k[c.indexOf(Math.min(...c))];
   const ns=Object.keys(names).filter(n=>it.say.includes(n)).sort((x,y)=>it.say.indexOf(x)-it.say.indexOf(y)).map(n=>c[k.indexOf(names[n])]);
   return /more/.test(it.say)?ns[0]-ns[1]:ns[0];}
  case 'ordinalTap':return ORD.findIndex(w=>it.say.includes(' '+w+' '));
  case 'ordinalName':return s.mark;
 }
 throw new Error('unsolved kind '+it.kind);
}
test('every generated maths question has the answer a reader of the screen would compute, within its pad or options',()=>{
 let seed=11;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
 for(const s of M.SKILLS.filter(x=>!x.delegate))for(let L=0;L<M.levelsOf(s.id);L++)for(let i=0;i<300;i++){
  const it=M.make(s.id,L,rnd);
  assert.equal(String(solve(it)),String(it.answer),s.id+' L'+L+': '+it.say);
  if(it.input==='pad')assert.ok(it.answer>=0&&it.answer<=it.max&&Number.isInteger(it.answer),s.id);
  else{const v=it.options.map(o=>String(o.value));assert.ok(v.includes(String(it.answer)));assert.equal(new Set(v).size,v.length);}
  assert.doesNotMatch(it.say,/undefined|NaN| 1 (stickers|berries|shells|cards|marbles)/);
 }
});
test('P1 limits: sums stay within 100, products within 40, division within 20, money to $1 / $100, clock in 5-minute steps',()=>{
 let seed=5;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
 for(let i=0;i<500;i++){
  for(const id of ['addones','addtens','add2d','story100'])for(let L=0;L<M.levelsOf(id);L++){const it=M.make(id,L,rnd);assert.ok(it.answer>=0&&it.answer<=100&&Math.max(it.a,Math.abs(it.b))<=100,id);}
  const m=M.make('mult40',1,rnd);assert.ok(m.answer<=40);const d=M.make('div20',i%2,rnd);assert.ok(d.show.n<=20);
  assert.ok(M.make('coins',1,rnd).answer<=100);assert.ok(M.make('notes',1,rnd).answer<=100);assert.equal(M.make('clock',2,rnd).show.m%5,0);
 }
 // renaming levels really rename
 for(let i=0;i<200;i++){const r=M.make('add2d',1,rnd),a=r.a,b=Math.abs(r.b);assert.ok(r.b>0?a%10+b%10>=10:a%10<b%10);const n=M.make('add2d',0,rnd);assert.ok(n.b>0?n.a%10+n.b%10<10:n.a%10>=Math.abs(n.b)%10);}
});
const q=(skill,level,ok,i,extra={})=>({section:'path',skill,level,a:i,b:0,expected:String(i),format:skill+':'+level,day,startedAt:T0+i*10,completedAt:T0+i*10+5,responses:[{correct:ok}],helped:false,...extra});
const sess=qs=>({s:{id:'s',rev:1,days:{},questions:Object.fromEntries(qs.map((x,i)=>[i,x]))}});
test('a new skill levels up and becomes secure only on 5 of 6 varied first-try answers, mastered on a later day',()=>{
 const L0=Array.from({length:6},(_,i)=>q('teens',0,true,i));
 assert.equal(M.newSkillPlan('teens',sess(L0)).level,1);
 const L1=Array.from({length:6},(_,i)=>q('teens',1,true,10+i));
 let p=M.newSkillPlan('teens',sess([...L0,...L1]));assert.equal(p.secure,true);assert.equal(p.mastered,false);
 p=M.newSkillPlan('teens',sess([...L0,...L1,q('teens',1,true,30,{day:'2026-10-03'})]));assert.equal(p.mastered,true);
 const same=Array.from({length:6},()=>q('teens',0,true,1));assert.equal(M.newSkillPlan('teens',sess(same)).level,0,'repeating one fact cannot level up');
 const helped=Array.from({length:6},(_,i)=>q('teens',0,true,i,{helped:true}));assert.equal(M.newSkillPlan('teens',sess(helped)).level,0);
});
test('existing part-whole and adding history counts: delegated skills read the foundation and quiz plans',()=>{
 const f=(skill,range,i)=>({section:'foundation',skill,...F.make(skill,F.stages(skill)[range===5?0:1],()=>i%5/5),range,level:range===5?0:1,support:F.stages(skill)[range===5?0:1].support,day,startedAt:T0+i,completedAt:T0+i+1,responses:[{correct:true}],helped:false});
 const qs=[];for(const s of ['split','patterns','missing'])for(let i=0;i<6;i++)qs.push(f(s,5,qs.length*7+i));
 const st=M.statusAll(sess(qs.map((x,i)=>({...x,a:x.a,b:x.b+(i%4)}))),{});
 assert.equal(st.bond5.secure,true);assert.equal(st.bond10.unlocked,true);assert.equal(st.addsub10.unlocked,true);assert.equal(st.story10.unlocked,false);
});
test('skills unlock from their prerequisites; a placed skill opens what builds on it and comes back for review',()=>{
 let st=M.statusAll({},{});assert.deepEqual(M.frontier(st),['count10','numeral10','compare10']);
 st=M.statusAll({},{placed:{teens:1,numeral10:1}});assert.ok(st.order20.unlocked&&st.tensones.unlocked);assert.equal(st.add20.unlocked,false,'needs adding within 10 too');
 assert.ok(M.dueReviews(st,T0).includes('teens'));
 assert.deepEqual(M.placeWithPrereqs(['tensones']).sort(),['numeral10','teens','tensones']);
 assert.deepEqual(M.checkResult([[true,true],[true,true],[true,false]]),['numeral10','compare10']);
});
test('Play routing: first a short check, then frontier skills, delegated ones to the existing games, a review in the last slot',()=>{
 assert.equal(M.next({},{}).type,'check');
 const s={checkedAt:1};
 assert.deepEqual(M.next({},s,0,0),{type:'foundation',skill:'take'});
 assert.equal(M.next({},s,1,0).skill,'numeral10');
 assert.equal(M.next({},s,2,0).skill,'addsub10','arithmetic is protected from endless counting');
 const placed={checkedAt:1,placed:{numeral10:1,compare10:1,teens:1}};
 const r=M.next({},placed,3,0,T0);assert.equal(r.review,true);
 assert.equal(M.route('bond10',3).type,'foundation');assert.equal(M.route('addsub10',1).mode,'sub');
});
test('path state merges monotonically, and a redo clears earlier placements even after sync',()=>{
 const a={placed:{teens:5},badges:{1:4},checkedAt:5},b={placed:{tensones:9},badges:{2:7},checkedAt:9,redoAt:8};
 const m=M.mergeState(a,b);assert.deepEqual(m.placed,{tensones:9});assert.deepEqual(m.badges,{1:4,2:7});assert.equal(m.checkedAt,9);
 const w=M.withSessions({redoAt:T0+100},sess([{section:'path',skill:'checked',placed:['teens'],completedAt:T0,day,startedAt:T0,responses:[{correct:true}]}]));
 assert.equal(w.checkedAt,0);assert.deepEqual(w.placed,{});
 const r=M.readiness({},{checkedAt:Date.parse('2026-10-02')},Date.parse('2027-04-01'));
 assert.equal(r.strands.length,8);assert.equal(r.current,1);assert.equal(r.pace,'behind');
 assert.match(M.report({},{},day),/Maths path/);
});

/* ---------- the real UI on a fake DOM ---------- */
const seeded=k=>{let x=k;return ()=>(x=(x*16807)%2147483647)/2147483647;};
function harness({teaching=false}={}){
 let now=T0;const timers=[];
 class El{constructor(tag='div'){this.tag=tag;this.children=[];this.attrs={};this.dataset={};this.style={setProperty(){}};this._cls=new Set();this.disabled=false;this._text='';const c=this._cls;
  this.classList={add:(...x)=>x.forEach(v=>c.add(v)),remove:(...x)=>x.forEach(v=>c.delete(v)),toggle(){},contains:v=>c.has(v)};}
  set className(v){this._cls.clear();String(v).split(/\s+/).filter(Boolean).forEach(x=>this._cls.add(x));}get className(){return [...this._cls].join(' ');}
  set textContent(v){this._text=String(v);this.children=[];}get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
  set innerHTML(v){this._html=v;this.children=[];}get innerHTML(){return this._html||'';}
  append(...x){x.forEach(e=>{e.parent=this;this.children.push(e);});}prepend(x){this.children.unshift(x);}after(){}replaceChildren(...x){this.children=[];this.append(...x);}
  setAttribute(k,v){this.attrs[k]=v;}click(){if(!this.disabled)this.onclick?.();}addEventListener(){}
  all(){return [this,...this.children.flatMap(c=>c.all())];}querySelectorAll(sel){return this.all().slice(1).filter(e=>e.tag===sel);}}
 const els={},data={},said=[],t=new C.Tracker({now:()=>now}),helps=[];
 const adventure={recordState(){},get tracker(){return t;},begin:m=>t.begin(m),respond:(v,c)=>t.answer(v,c),help:k=>{helps.push(k);t.help(k);},isPaused:()=>false,beforeQuestion:()=>true};
 const ctx={PokeMathTutor:require('../math-tutor.js'),PokeLearning:C,PokeReadingTutor:teaching?require('../reading-tutor.js'):{needsModel:()=>false},PokeMathPath:M,adventure,screens:{},mode:'home',soundOn:true,childName:'Jonah',stars:0,
  document:{createElement:tag=>new El(tag),getElementById:id=>els[id]||=new El()},window:{},
  localStorage:{setItem:(k,v)=>data[k]=v,getItem:k=>data[k]??null},setTimeout:(f,ms=0)=>{timers.push({at:now+ms,f});},Date:{now:()=>now},confirm:()=>true,
  show(){},shutUp(){},say:t=>said.push(t),sndGood(){},sndOops(){},burst(){},audio(){},readyForNext:()=>true,schedulePush(){},praiseLine:()=>'Well done!',
  addStar:n=>{ctx.stars+=n;},imgArt:()=>'',pickMon:()=>25,PokeVisuals:{icon:()=>''}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(require.resolve('../reading-art.js'),'utf8'),ctx);vm.runInContext(fs.readFileSync(require.resolve('../math-path-ui.js'),'utf8')+'\nvar ui=createMathPath();',ctx);
 const flush=(ms=5000)=>{const end=now+ms;for(let g=0;g<3000;g++){timers.sort((a,b)=>a.at-b.at);const x=timers[0];if(!x||x.at>end)break;timers.shift();now=Math.max(now,x.at);x.f();}now=end;};
 const pad=()=>els.mpEntry.all().filter(e=>e.tag==='button'),opts=()=>els.mpOptions.children;
 const tapNumber=n=>{const p=pad();const direct=p.find(b=>b.attrs['aria-label']==='Answer '+n);if(direct)return direct.click();for(const d of String(n))p.find(b=>b.attrs['aria-label']==='Digit '+d).click();p.find(b=>b.attrs['aria-label']==='Check').click();};
 return {ctx,ui:ctx.ui,t,said,helps,flush,pad,opts,tapNumber,els};
}
test('a clean first answer is independent and earns two stars; two misses show the help and count as helped',()=>{
 const h=harness();let done=0;
 h.ui.startItem(M.make('tensones',0,seeded(3)),()=>done++);h.flush(500);
 let q=h.t.question(),it=h.ui._current().item;h.tapNumber(it.answer);h.flush();
 assert.equal(C.independent(q),true);assert.equal(h.ctx.stars,2);assert.equal(done,1);
 h.ui.startItem(M.make('add2d',1,seeded(9)),()=>done++);h.flush(500);q=h.t.question();it=h.ui._current().item;
 h.tapNumber(it.answer+1);h.flush(500);assert.equal(h.helps.length,0);
 h.tapNumber(it.answer+2);h.flush(500);assert.equal(h.helps.length,1);assert.ok(h.els.mpHelpView.children.length>0,'help picture shown');
 h.tapNumber(it.answer);h.flush();assert.ok(q.completedAt);assert.equal(C.independent(q),false);assert.equal(h.ctx.stars,3);
});
test('the maths check gives one try per item, places passed skills with their prerequisites, then hands back to Play',()=>{
 const h=harness();const r=h.ui.route(0,0);assert.equal(r.type,'path');let back=0;r.start(()=>back++);h.flush(500);
 for(let i=0;i<40&&!back;i++){const c=h.ui._current();if(!c){h.flush(500);continue;}
  const it=c.item;if(it.skill==='tensones'){if(it.input==='pad')h.tapNumber(it.answer+1);else [...h.opts()].find(b=>b.dataset.v!==String(it.answer)).click();}
  else if(it.input==='pad')h.tapNumber(it.answer);else [...h.opts()].find(b=>b.dataset.v===String(it.answer)).click();h.flush(3000);}
 assert.equal(back,1);assert.equal(h.helps.length,0);
 assert.deepEqual(Object.keys(h.ui.state.placed).sort(),['compare10','numeral10','order20','teens']);
 assert.ok(h.ui.state.checkedAt);
});

test('math model and guided answer hand back to a different independent question',()=>{
 const h=harness({teaching:true});h.ui.startItem(M.make('teens',0,seeded(3)),()=>{});h.flush(500);const model=h.t.question();assert.equal(model.phase,'model');
 h.els.mpActions.children.find(b=>b.attrs['aria-label']==='Try together').click();const guide=h.t.question();assert.equal(guide.phase,'guided');h.tapNumber(h.ui._current().item.answer);h.flush();const independent=h.t.question();assert.equal(independent.teach,false);assert.notEqual(C.factKey(independent),C.factKey(guide));assert.equal(C.independent(model),false);assert.equal(C.independent(guide),false);
});
