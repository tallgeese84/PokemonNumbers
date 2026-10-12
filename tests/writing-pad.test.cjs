const {test}=require('node:test'),assert=require('node:assert/strict');
const Pad=require('../writing-pad.js');
function setup(){
 const w=new EventTarget(),document=new EventTarget(),canvas=new EventTarget(),draws=[];
 w.Event=Event;w.devicePixelRatio=1;w.close=()=>{};document.defaultView=w;canvas.ownerDocument=document;
 const ctx=new Proxy({},{get:(_,name)=>(...args)=>draws.push([name,...args]),set:()=>true});canvas.getContext=()=>ctx;
 let rect={left:10,top:20,width:400,height:250},active=true,changes=0,interactions=0,locked=false,captured=null;
 canvas.getBoundingClientRect=()=>rect;canvas.setPointerCapture=id=>{captured=id;};canvas.hasPointerCapture=id=>captured===id;canvas.releasePointerCapture=()=>{captured=null;};
 const pad=Pad.create(canvas,{active:()=>active,onChange:()=>changes++,onInteract:()=>interactions++,onPenOnly:value=>locked=value});
 const pointer=(name,x=210,y=145,id=1,type='pen',extras={})=>{const e=new w.Event(name,{bubbles:true,cancelable:true});Object.assign(e,{clientX:x,clientY:y,pointerId:id,pointerType:type,button:0,...extras});canvas.dispatchEvent(e);};
 return {pad,w,canvas,pointer,draws,setActive:v=>{active=v;},resize:r=>{rect=r;w.dispatchEvent(new w.Event('resize'));},get changes(){return changes;},get interactions(){return interactions;},get locked(){return locked;},close(){pad.destroy();w.close();}};
}
test('pen ink uses normalized coordinates, redraws at high DPI, survives rotation and is bounded in history',()=>{
 const t=setup();t.pointer('pointerdown');t.pointer('pointermove',250,185);t.pointer('pointerup',310,220);
 assert.deepEqual(t.pad.snapshot().strokes,[[[500,313],[600,413],[750,500]]]);assert.equal(t.locked,true);assert(t.interactions>=2);assert.equal(t.changes,1);
 const ink=t.pad.snapshot();Object.defineProperty(t.w,'devicePixelRatio',{value:2});t.resize({left:0,top:0,width:800,height:500});assert.equal(t.canvas.width,1600);assert.equal(t.canvas.height,1000);assert.deepEqual(t.pad.snapshot(),ink);
 const crowded=Array.from({length:64},()=>Array.from({length:3000},(_,i)=>[i%1001,i%626]));const small=Pad.sample(crowded);assert(small.flat().length<=512);assert.deepEqual(small[0][0],crowded[0][0]);assert.deepEqual(small[0].at(-1),crowded[0].at(-1));t.close();
});
test('a pen takes over from an accidental palm and finger input can be enabled for a passive stylus',()=>{
 const t=setup();t.pointer('pointerdown',20,30,9,'touch');t.pointer('pointermove',30,40,9,'touch');t.pointer('pointerdown',210,145,1,'pen');t.pointer('pointermove',230,165,1,'pen');t.pointer('pointerup',230,165,1,'pen');
 assert.equal(t.pad.snapshot().strokes.length,1);assert.deepEqual(t.pad.snapshot().strokes[0][0],[500,313]);
 t.pointer('pointerdown',30,40,9,'touch');t.pointer('pointerup',60,70,9,'touch');assert.equal(t.pad.snapshot().strokes.length,1);
 t.pad.setPenOnly(false);t.pointer('pointerdown',30,40,2,'touch');t.pointer('pointerdown',300,200,3,'touch');t.pointer('pointermove',350,240,3,'touch');t.pointer('pointerup',60,70,2,'touch');assert.equal(t.pad.snapshot().strokes.length,2);assert.equal(t.pad.snapshot().strokes[1].length,2);t.close();
});
test('undo, clear, pauses, cancellation, freeze and disposal cannot add stray ink',()=>{
 const t=setup();t.pointer('pointerdown');t.pointer('pointerup');assert(t.pad.hasInk);t.pad.undo();assert(!t.pad.hasInk);
 t.pointer('pointerdown');t.setActive(false);t.pointer('pointermove',320,220);assert.equal(t.pad.snapshot().strokes[0].length,1);t.pointer('pointerdown');assert.equal(t.pad.snapshot().strokes.length,1);
 t.setActive(true);t.pad.clear();t.pointer('pointerdown');t.pointer('pointercancel');t.pointer('pointermove',320,220);assert.equal(t.pad.snapshot().strokes[0].length,1);
 t.pointer('pointerdown',30,40);t.pad.freeze();const before=t.pad.snapshot();t.pointer('pointermove');t.pad.undo();t.pad.clear();t.pointer('pointerdown');assert.deepEqual(t.pad.snapshot(),before);
 t.pad.destroy();t.pointer('pointerdown');assert.deepEqual(t.pad.snapshot(),before);t.w.close();
});
test('mouse and coalesced pen events draw; captured coordinates stay inside the box',()=>{
 const t=setup();t.pointer('pointerdown',-100,-100,4,'mouse');t.pointer('pointermove',10000,10000,4,'mouse');t.pointer('pointerup',10000,10000,4,'mouse');assert.deepEqual(t.pad.snapshot().strokes[0],[[0,0],[1000,625]]);
 t.pad.clear();t.pointer('pointerdown');t.pointer('pointermove',310,220,1,'pen',{getCoalescedEvents:()=>[{clientX:230,clientY:160},{clientX:310,clientY:220}]});t.pointer('pointerup',310,220);assert.equal(t.pad.snapshot().strokes[0].length,3);t.close();
});
