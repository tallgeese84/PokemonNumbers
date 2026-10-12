const {test}=require('node:test'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom'),F=require('../letter-formation.js'),UI=require('../alphabet-tracing.js');

test('all 52 manuscript models have finite ordered strokes inside the writing area',()=>{
 assert.equal(Object.keys(F.DATA).join(''),'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz');
 for(const [letter,strokes]of Object.entries(F.DATA)){
  assert(strokes.length>=1&&strokes.length<=4,letter);
  for(const stroke of strokes){assert(stroke.cue);assert.equal(stroke.dot,/^[ij]$/.test(letter)&&stroke===strokes.at(-1));
   for(const p of stroke.points)assert(Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>35&&p.x<365&&p.y>30&&p.y<420,letter);
  }
 }
 // Independent formation invariants: left-to-right bars, top-down stems,
 // anticlockwise round letters, ascenders, and descenders below the baseline.
 for(const letter of ['I','T','l','b','h','k']){const p=F.DATA[letter][0].points;assert.equal(p[0].y,60);assert(p[1].y>p[0].y,letter);}
 for(const [letter,i]of [['A',2],['E',1],['E',2],['E',3],['F',1],['F',2],['H',2],['I',1],['I',2],['J',1],['T',1],['f',1],['t',1]]){const p=F.DATA[letter][i].points;assert(p.at(-1).x>p[0].x);assert.equal(p.at(-1).y,p[0].y);}
 for(const letter of ['O','Q','o','a','d','g','q','c','C']){const p=F.DATA[letter][0].points;assert(p[1].x<p[0].x,letter+' opens left');}
 for(const letter of ['g','j','p','q','y'])assert(Math.max(...F.DATA[letter].flatMap(s=>s.points.map(p=>p.y)))>=380,letter+' descender');
 assert.deepEqual(F.DATA.A.map(s=>[s.points[0].x,s.points[0].y]),[[200,60],[200,60],[155,180]]);
});

test('every model completes with forward pen movement, including retraced stems and corners',()=>{
 for(const [letter,strokes]of Object.entries(F.DATA))for(const stroke of strokes)for(const stride of [1,5,9]){
  const t=F.tracer(stroke),p=stroke.points;assert(t.down(p[0]));
  for(let i=stride;i<p.length;i+=stride)assert(t.move(p[i]),letter+' stride '+stride+' point '+i);
  assert(t.up(p.at(-1)),letter);
 }
});

test('wrong starts, reversed paths, taps, stationary moves and curve shortcuts do not complete',()=>{
 for(const letter of ['l','A','L','S','O','o','m']){
  const s=F.DATA[letter][0],p=s.points,t=F.tracer(s);
  assert.equal(t.down({x:20,y:420}),false,letter);
  if(F.distance(p[0],p.at(-1))>18)assert.equal(t.down(p.at(-1)),false,letter+' wrong end');
  t.reset();assert(t.down(p[0]));for(let i=0;i<500;i++)t.move(p[0]);assert.equal(t.up(p[0]),false,letter+' held pen');
  t.reset();assert(t.down(p[0]));assert.equal(t.up(p[0]),false,letter+' tap');
 }
 for(const letter of ['O','o']){const s=F.DATA[letter][0],t=F.tracer(s),p=s.points;t.down(p[0]);for(const q of p.slice().reverse())t.move(q);assert.equal(t.up(p[0]),false,letter+' backwards');
  t.reset();t.down(p[0]);t.move(p[Math.floor(p.length/2)]);assert.equal(t.up(p.at(-1)),false,letter+' shortcut');}
 const t=F.tracer(F.DATA.L[0]);t.down({x:135,y:60});assert.equal(t.up({x:280,y:300}),false,'cannot cut an L corner');
});

test('a partial stroke resumes at its current point, and a dot requires a nearby lift',()=>{
 const s=F.DATA.l[0],t=F.tracer(s);t.down(s.points[0]);t.move({x:200,y:180});assert.equal(t.up({x:200,y:180}),false);
 assert.equal(t.down({x:200,y:280}),false,'pen lift cannot skip the remaining line');assert(t.down({x:200,y:180}));assert(t.up(s.points.at(-1)));
 const dot=F.tracer(F.DATA.i[1]);assert(dot.down({x:200,y:128}));assert.equal(dot.up({x:350,y:350}),false);assert(dot.down({x:200,y:128}));assert(dot.up({x:200,y:128}));
});

function harness(letter='A'){
 const dom=new JSDOM('<div id="host"></div>',{pretendToBeVisual:true}),w=dom.window,d=w.document;let complete=0,active=true;
 const tasks=new Map();let tid=0;w.setTimeout=fn=>{tasks.set(++tid,fn);return tid;};w.clearTimeout=id=>tasks.delete(id);
 const ui=UI.create(d.getElementById('host'),letter,{active:()=>active,onComplete:()=>complete++}),svg=d.querySelector('svg');
 let width=400;svg.getBoundingClientRect=()=>({left:10,top:20,width,height:width*F.HEIGHT/F.WIDTH});
 const captures=new Set();svg.setPointerCapture=id=>captures.add(id);svg.hasPointerCapture=id=>captures.has(id);svg.releasePointerCapture=id=>captures.delete(id);
 function event(name,p,type='pen',id=1){const e=new w.Event(name,{bubbles:true,cancelable:true});Object.assign(e,{pointerId:id,pointerType:type,button:0,clientX:p.x*width/400+10,clientY:p.y*width/400+20});svg.dispatchEvent(e);}
 function trace(stroke,type='pen',id=1){const p=stroke.points;event('pointerdown',p[0],type,id);for(let i=6;i<p.length;i+=6)event('pointermove',p[i],type,id);event('pointerup',p.at(-1),type,id);}
 return {dom,w,d,ui,svg,event,trace,tasks,captures,get complete(){return complete;},set active(x){active=x;},set width(x){width=x;},flush(){let guard=5000;while(tasks.size&&guard--){const [id,f]=tasks.entries().next().value;tasks.delete(id);f();}assert(guard>0);}};
}

test('SVG pad requires ordered strokes and pen lifts, completes once, and resets cleanly',()=>{
 const h=harness();h.trace(F.DATA.A[2]);assert.equal(h.ui.strokeIndex,0,'crossbar cannot be drawn first');
 const first=F.DATA.A[0];h.event('pointerdown',first.points[0]);for(const p of first.points.slice(1))h.event('pointermove',p);
 assert.equal(h.ui.strokeIndex,0,'must lift');assert.match(h.d.querySelector('.trace-status').textContent,/Lift/);h.event('pointerup',first.points.at(-1));assert.equal(h.ui.strokeIndex,1);
 h.trace(F.DATA.A[1]);h.width=620;h.trace(F.DATA.A[2]);assert.equal(h.complete,1);assert(h.ui.completed);h.trace(F.DATA.A[0]);assert.equal(h.complete,1);
 h.ui.reset();assert.equal(h.ui.strokeIndex,0);assert(!h.ui.completed);h.ui.destroy();assert.equal(h.d.querySelector('svg'),null);h.dom.window.close();
});

test('pen input locks fingers, ignores other pointer IDs and replaces an in-progress palm',()=>{
 const h=harness('l'),p=F.DATA.l[0].points;
 h.event('pointerdown',p[0],'touch',9);h.event('pointermove',p[30],'touch',9);
 h.event('pointerdown',p[0],'pen',1);assert(h.ui.penOnly);assert(h.d.querySelector('input').checked);
 h.event('pointermove',p.at(-1),'touch',9);h.event('pointerup',p.at(-1),'touch',9);assert.equal(h.complete,0);
 h.event('pointermove',p.at(-1),'pen',1);h.event('pointerup',p.at(-1),'pen',1);assert.equal(h.complete,1);assert.equal(h.captures.size,0);
 h.ui.reset();h.trace(F.DATA.l[0],'touch',9);assert.equal(h.complete,1);
 const check=h.d.querySelector('input');check.checked=false;check.dispatchEvent(new h.w.Event('change'));h.trace(F.DATA.l[0],'touch',9);assert.equal(h.complete,2,'passive stylus/finger override');h.dom.window.close();
});

test('pause, cancel, demonstration and leaving cannot produce a completed trace',()=>{
 const h=harness('i'),p=F.DATA.i[0].points;
 h.d.querySelector('.trace-tools button').click();assert(h.tasks.size);h.flush();assert.equal(h.complete,0);assert.equal(h.ui.strokeIndex,0);
 h.active=false;h.trace(F.DATA.i[0]);assert.equal(h.ui.strokeIndex,0);h.active=true;
 h.event('pointerdown',p[0]);h.event('pointermove',p[20]);h.event('pointercancel',p[20]);assert.equal(h.complete,0);assert.equal(h.captures.size,0);
 h.ui.reset();h.trace(F.DATA.i[0]);assert.equal(h.ui.strokeIndex,1);h.trace(F.DATA.i[1]);assert.equal(h.complete,1);
 h.d.querySelector('.trace-tools button').click();assert(h.tasks.size);h.ui.destroy();assert.equal(h.tasks.size,0);h.trace(F.DATA.i[0]);assert.equal(h.complete,1);h.dom.window.close();
});
