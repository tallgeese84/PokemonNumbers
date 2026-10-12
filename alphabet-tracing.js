/* Stylus tracing UI. Demonstrations never advance the child's trace. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./letter-formation.js'):root.PokeLetterFormation);if(typeof module==='object'&&module.exports)module.exports=api;else root.PokeAlphabetTracing=api;})(typeof globalThis!=='undefined'?globalThis:this,function(F){
 'use strict';
 function create(host,letter,options={}){
  const doc=host.ownerDocument,win=doc.defaultView,strokes=F.DATA[letter];if(!strokes)throw Error('Unknown trace letter');
  const node=(tag,cls,text)=>{const e=doc.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;};
  const svgNode=(tag,attrs)=>{const e=doc.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v]of Object.entries(attrs||{}))e.setAttribute(k,v);return e;};
  const box=node('div','alphabet-tracer'),status=node('p','trace-status'),cue=node('p','trace-cue'),steps=node('div','trace-steps');
  status.setAttribute('role','status');steps.setAttribute('aria-label','Pen strokes');
  const svg=svgNode('svg',{viewBox:`0 0 ${F.WIDTH} ${F.HEIGHT}`,class:'trace-board',role:'img','aria-label':`Trace ${letter===letter.toUpperCase()?'uppercase':'lowercase'} ${letter}. Start at the numbered green dot and follow the arrows.`});
  const tools=node('div','trace-tools'),show=node('button','btn','Show strokes'),reset=node('button','btn','Try again');
  show.type=reset.type='button';const label=node('label','trace-pen-lock'),check=node('input');check.type='checkbox';label.append(check,doc.createTextNode('Ignore fingers while I use my pen'));
  tools.append(show,reset);box.append(steps,status,cue,svg,tools,label);host.append(box);
  let index=0,engine=F.tracer(strokes[0]),pointer=null,pointerType='',penOnly=!!options.penOnly,ink=[],currentInk=null,destroyed=false,animation=null,timer=null,completed=false;
  check.checked=penOnly;
  const enabled=()=>!destroyed&&options.active?.()!==false;
  const path=points=>points.length?'M '+points.map(p=>`${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L '):'';
  const point=e=>{const r=svg.getBoundingClientRect(),scale=Math.min(r.width/F.WIDTH,r.height/F.HEIGHT),ox=(r.width-F.WIDTH*scale)/2,oy=(r.height-F.HEIGHT*scale)/2;return {x:(e.clientX-r.left-ox)/(scale||1),y:(e.clientY-r.top-oy)/(scale||1)};};
  function drawStroke(stroke,cls){svg.append(stroke.dot?svgNode('circle',{cx:stroke.points[0].x,cy:stroke.points[0].y,r:cls==='trace-ghost'?11:6,class:cls}):svgNode('path',{d:stroke.d,class:cls}));}
  function arrow(points,i){const a=points[Math.max(0,i-3)],b=points[Math.min(points.length-1,i+3)],p=points[i],angle=Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI;svg.append(svgNode('path',{d:'M -8 -7 L 0 0 L -8 7',transform:`translate(${p.x} ${p.y}) rotate(${angle})`,class:'trace-arrow'}));}
  function draw(){
   if(destroyed)return;svg.replaceChildren();
   for(const [y,cls]of [[60,'trace-line'],[180,'trace-line trace-middle'],[300,'trace-line trace-baseline'],[390,'trace-line trace-descender']])svg.append(svgNode('line',{x1:24,y1:y,x2:376,y2:y,class:cls}));
   strokes.forEach(s=>drawStroke(s,'trace-ghost'));
   const visible=animation?animation.stroke:index;
   for(let i=0;i<Math.min(visible,strokes.length);i++)drawStroke(strokes[i],'trace-finished');
   if(visible<strokes.length){
    const stroke=strokes[visible],from=animation?animation.point:engine.index;drawStroke(stroke,'trace-active');
    for(let j=from+14;j<Math.min(stroke.points.length-3,from+50);j+=25)arrow(stroke.points,j);
    if(animation){svg.append(svgNode('path',{d:path(stroke.points.slice(0,from+1)),class:'trace-demo-ink'}));}
    else for(const trail of ink){if(trail.length===1)svg.append(svgNode('circle',{cx:trail[0].x,cy:trail[0].y,r:3.5,class:'trace-ink-dot'}));else svg.append(svgNode('path',{d:path(trail),class:'trace-ink'}));}
    const start=stroke.points[Math.min(from,stroke.points.length-1)];svg.append(svgNode('circle',{cx:start.x,cy:start.y,r:13,class:animation?'trace-demo-dot':'trace-start'}));
    const num=svgNode('text',{x:start.x,y:start.y+5,'text-anchor':'middle',class:'trace-start-number'});num.textContent=String(visible+1);svg.append(num);
   }
   steps.replaceChildren();strokes.forEach((_,i)=>{const e=node('span',i<index?'done':i===visible?'current':'',String(i+1));e.setAttribute('aria-label','Stroke '+(i+1)+(i<index?' complete':i===visible?' current':''));steps.append(e);});
  }
  function instruction(message){
   status.textContent=message||(completed?'You traced '+letter+'!':`Stroke ${index+1} of ${strokes.length} · Start at ${index+1}.`);
   cue.textContent=completed?'Try it again, or choose another letter.':strokes[index].cue;
  }
  function stopDemo(){if(timer!==null)win.clearTimeout(timer);timer=null;animation=null;show.textContent='Show strokes';}
  function release(){if(pointer===null)return;const id=pointer;pointer=null;pointerType='';currentInk=null;try{if(svg.hasPointerCapture?.(id))svg.releasePointerCapture(id);}catch(e){}}
  function cancel(){engine.cancel();release();stopDemo();if(!destroyed){instruction();draw();}}
  function down(e){
   if(!enabled()||completed||(e.button!=null&&e.button!==0))return;
   const type=e.pointerType||'mouse';
   if(type==='pen'){
    if(pointer!==null&&pointerType==='touch'){engine.reset();release();ink=[];}
    if(!penOnly){penOnly=true;check.checked=true;options.onPenOnly?.(true);}
   }
   if(pointer!==null||(penOnly&&type!=='pen'))return;
   e.preventDefault();stopDemo();const p=point(e);
   if(!engine.down(p)){instruction('Start at the green '+(index+1)+'.');draw();return;}
   pointer=e.pointerId;pointerType=type;currentInk=[p];ink.push(currentInk);if(ink.length>128)ink.shift();
   try{svg.setPointerCapture?.(pointer);}catch(e){}options.onInteract?.();instruction(strokes[index].dot?'Touch the dot, then lift.':'Follow the arrows.');draw();
  }
  function move(e){
   if(e.pointerId!==pointer)return;if(!enabled()){cancel();return;}e.preventDefault();options.onInteract?.();
   const batch=e.getCoalescedEvents?.();for(const ev of batch?.length?batch:[e]){
    const p=point(ev);if(!engine.move(p)){release();instruction('Back to the green dot. Keep going.');break;}
    const last=currentInk?.at(-1);if(currentInk&&(!last||F.distance(last,p)>1))currentInk.push(p);
    if(currentInk?.length>2048)currentInk.splice(0,currentInk.length,...currentInk.filter((_,i)=>i%2===0));
   }
   if(engine.ready)instruction('Lift your pen.');draw();
  }
  function up(e){
   if(e.pointerId!==pointer)return;if(!enabled()){cancel();return;}
   const done=engine.up(point(e));release();
   if(done){index++;ink=[];completed=index===strokes.length;if(!completed)engine=F.tracer(strokes[index]);instruction();draw();options.onStroke?.(index);if(completed)options.onComplete?.();}
   else{instruction('Start at the green dot to keep going.');draw();}
  }
  function cancelled(e){if(e.pointerId===pointer)cancel();}
  function resetTrace(){if(!enabled())return;cancel();index=0;completed=false;engine=F.tracer(strokes[0]);ink=[];instruction();draw();}
  function demonstrate(){
   if(!enabled())return;if(animation){stopDemo();instruction();draw();return;}
   svg.scrollIntoView?.({block:'center',behavior:win.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
   engine.cancel();release();options.onDemonstrate?.();animation={stroke:0,point:0};show.textContent='Stop showing';
   function frame(){
    if(!enabled()||!animation){stopDemo();instruction();draw();return;}
    const stroke=strokes[animation.stroke];status.textContent=`Watch stroke ${animation.stroke+1} of ${strokes.length}.`;cue.textContent=stroke.cue;draw();
    if(animation.point>=stroke.points.length-1){status.textContent=animation.stroke<strokes.length-1?'Lift the pen.':'Your turn!';timer=win.setTimeout(()=>{if(!animation)return;animation.stroke++;animation.point=0;if(animation.stroke>=strokes.length){stopDemo();instruction();draw();}else frame();},700);}
    else{animation.point=Math.min(stroke.points.length-1,animation.point+3);timer=win.setTimeout(frame,30);}
   }frame();
  }
  show.addEventListener('click',demonstrate);reset.addEventListener('click',resetTrace);
  check.addEventListener('change',()=>{if(!enabled()){check.checked=penOnly;return;}cancel();penOnly=check.checked;options.onPenOnly?.(penOnly);});
  const events={pointerdown:down,pointermove:move,pointerup:up,pointercancel:cancelled,lostpointercapture:cancelled};
  for(const [name,fn]of Object.entries(events))svg.addEventListener(name,fn,{passive:false});
  const hide=()=>{if(doc.hidden)cancel();};win.addEventListener('blur',cancel);doc.addEventListener('visibilitychange',hide);instruction();draw();
  return {get penOnly(){return penOnly;},get completed(){return completed;},get strokeIndex(){return index;},reset:resetTrace,destroy(){cancel();destroyed=true;for(const [name,fn]of Object.entries(events))svg.removeEventListener(name,fn);show.removeEventListener('click',demonstrate);reset.removeEventListener('click',resetTrace);win.removeEventListener('blur',cancel);doc.removeEventListener('visibilitychange',hide);box.remove();}};
 }
 return {create};
});
