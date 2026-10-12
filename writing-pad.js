/* Free writing, kept separate from tracing and adult assessment. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PokeWritingPad=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const WIDTH=1000,HEIGHT=625,MAX_SAMPLE_POINTS=512,MAX_STROKES=64;
 const clamp=(n,max)=>Math.round(Math.max(0,Math.min(max,n)));
 function resample(points,limit){
  if(points.length<=limit)return points.map(p=>p.slice());
  return Array.from({length:limit},(_,i)=>points[Math.round(i*(points.length-1)/(limit-1))].slice());
 }
 function sample(strokes){
  // Bound cloud/history size while retaining the beginning and end of each stroke.
  const nonempty=strokes.filter(s=>s.length).slice(0,MAX_STROKES);
  const perStroke=Math.max(2,Math.floor(MAX_SAMPLE_POINTS/Math.max(1,nonempty.length)));
  return nonempty.map(s=>resample(s,Math.min(96,perStroke)));
 }
 function create(canvas,options={}){
  const ctx=canvas.getContext('2d'),win=canvas.ownerDocument.defaultView;
  let strokes=[],inputs=new Set(),current=null,pointer=null,pointerType='',penOnly=false,frozen=false,destroyed=false;
  const enabled=()=>!destroyed&&!frozen&&!!ctx&&options.active?.()!==false;
  const changed=()=>options.onChange?.();
  function point(e){const r=canvas.getBoundingClientRect();return [clamp((e.clientX-r.left)*WIDTH/(r.width||1),WIDTH),clamp((e.clientY-r.top)*HEIGHT/(r.height||1),HEIGHT)];}
  function render(){
   if(!ctx||destroyed)return;
   const r=canvas.getBoundingClientRect(),width=r.width||560,height=r.height||350,dpr=Math.min(win.devicePixelRatio||1,3);
   const pw=Math.round(width*dpr),ph=Math.round(height*dpr);
   if(canvas.width!==pw)canvas.width=pw;if(canvas.height!==ph)canvas.height=ph;
   ctx.setTransform(pw/WIDTH,0,0,ph/HEIGHT,0,0);ctx.clearRect(0,0,WIDTH,HEIGHT);
   ctx.fillStyle='#ffffff';ctx.fillRect(0,0,WIDTH,HEIGHT);ctx.lineWidth=2;
   for(const [y,dashed] of [[100,false],[290,true],[480,false]]){
    ctx.strokeStyle=y===480?'#749bc2':'#bed5ec';ctx.setLineDash(dashed?[12,12]:[]);ctx.beginPath();ctx.moveTo(24,y);ctx.lineTo(WIDTH-24,y);ctx.stroke();
   }
   ctx.setLineDash([]);ctx.strokeStyle='#175fbb';ctx.fillStyle='#175fbb';ctx.lineWidth=9;ctx.lineCap='round';ctx.lineJoin='round';
   for(const stroke of strokes){
    if(stroke.length===1){ctx.beginPath();ctx.arc(stroke[0][0],stroke[0][1],4.5,0,Math.PI*2);ctx.fill();continue;}
    ctx.beginPath();ctx.moveTo(...stroke[0]);for(let i=1;i<stroke.length;i++)ctx.lineTo(...stroke[i]);ctx.stroke();
   }
  }
  function finish(discard=false){
   if(pointer===null)return;
   const id=pointer;pointer=null;pointerType='';current=null;
   if(discard)strokes.pop();
   try{if(canvas.hasPointerCapture?.(id))canvas.releasePointerCapture(id);}catch(e){}
   render();changed();
  }
  function add(e){
   if(!current)return;const p=point(e),last=current[current.length-1];
   if(last&&p[0]===last[0]&&p[1]===last[1])return;
   current.push(p);
   // Long scribbles stay bounded in memory too, without changing other strokes.
   if(current.length>2048){const compact=resample(current,1024);current.splice(0,current.length,...compact);}
  }
  function down(e){
   if(!enabled()||(e.button!=null&&e.button!==0))return;
   const type=e.pointerType||'unknown';
   if(type==='pen'){
    if(pointer!==null&&pointerType==='touch')finish(true);
    if(!penOnly){penOnly=true;options.onPenOnly?.(true);}
   }
   if(pointer!==null||(penOnly&&type!=='pen'))return;
   if(strokes.length>=MAX_STROKES){options.onLimit?.();return;}
   e.preventDefault();pointer=e.pointerId;pointerType=type;current=[point(e)];strokes.push(current);inputs.add(type);
   try{canvas.setPointerCapture?.(pointer);}catch(e){}
   options.onInteract?.();render();
  }
  function move(e){
   if(e.pointerId!==pointer)return;
   if(!enabled()){finish();return;}
   e.preventDefault();options.onInteract?.();
   const batch=e.getCoalescedEvents?.();for(const p of batch?.length?batch:[e])add(p);render();
  }
  function up(e){if(e.pointerId!==pointer)return;if(enabled())add(e);finish();}
  function cancel(e){if(e.pointerId===pointer)finish();}
  function blur(){finish();}
  function visibility(){if(canvas.ownerDocument.hidden)finish();}
  const events={pointerdown:down,pointermove:move,pointerup:up,pointercancel:cancel,lostpointercapture:cancel};
  for(const [name,fn] of Object.entries(events))canvas.addEventListener(name,fn,{passive:false});
  win.addEventListener('resize',render);win.addEventListener('blur',blur);canvas.ownerDocument.addEventListener('visibilitychange',visibility);
  const observer=win.ResizeObserver?new win.ResizeObserver(render):null;observer?.observe(canvas);render();
  return {
   get supported(){return !!ctx;},get hasInk(){return strokes.length>0;},get penOnly(){return penOnly;},
   snapshot(){return {version:1,strokes:sample(strokes),inputs:[...inputs]};},
   finish(){finish();},render,
   undo(){if(!enabled())return;finish();strokes.pop();if(!strokes.length)inputs.clear();render();changed();},
   clear(){if(!enabled())return;finish();strokes=[];inputs.clear();render();changed();},
   setPenOnly(value){if(!enabled())return;finish();penOnly=!!value;options.onPenOnly?.(penOnly);},
   freeze(){finish();frozen=true;},
   destroy(){finish();destroyed=true;observer?.disconnect();for(const [name,fn] of Object.entries(events))canvas.removeEventListener(name,fn);win.removeEventListener('resize',render);win.removeEventListener('blur',blur);canvas.ownerDocument.removeEventListener('visibilitychange',visibility);}
  };
 }
 return {create,sample,WIDTH,HEIGHT};
});
