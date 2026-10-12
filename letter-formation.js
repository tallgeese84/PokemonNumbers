/* Original centre-line manuscript models: top 60, middle 180, baseline 300,
   descenders 390. See docs/letter-formation.md for formation choices/sources.
   M begins a pen stroke; L/C stay on the page. Never trace a font outline. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PokeLetterFormation=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const WIDTH=400,HEIGHT=440,VERSION=1;
 const s=(d,cue)=>({d,cue});
 // O starts at the top and travels anticlockwise. The a/d/g/q family starts
 // at the upper right, opens like c, closes its bowl, then adds its stem.
 const circle=(top,bottom)=>`M 200 ${top} C 100 ${top} 100 ${bottom} 200 ${bottom} C 300 ${bottom} 300 ${top} 200 ${top}`;
 const bowl='M 270 198 C 244 170 130 170 130 240 C 130 316 270 316 270 240 L 270 198';
 const DATA={
  A:[s('M 200 60 L 110 300','Slant down to the left.'),s('M 200 60 L 290 300','Slant down to the right.'),s('M 155 180 L 245 180','Go across to the right.')],
  B:[s('M 130 60 L 130 300','Go straight down.'),s('M 130 60 L 210 60 C 295 60 295 180 210 180 L 130 180 L 210 180 C 305 180 305 300 210 300 L 130 300','Around the top bump, then the bottom bump.')],
  C:[s('M 280 88 C 220 28 115 60 115 180 C 115 300 220 332 280 272','Curve left, down and around.')],
  D:[s('M 125 60 L 125 300','Go straight down.'),s('M 125 60 L 180 60 C 325 60 325 300 180 300 L 125 300','Go right, around and back to the bottom.')],
  E:[s('M 135 60 L 135 300','Go straight down.'),s('M 135 60 L 275 60','Go across the top.'),s('M 135 180 L 250 180','Go across the middle.'),s('M 135 300 L 275 300','Go across the bottom.')],
  F:[s('M 135 60 L 135 300','Go straight down.'),s('M 135 60 L 275 60','Go across the top.'),s('M 135 180 L 250 180','Go across the middle.')],
  G:[s('M 280 88 C 220 28 115 60 115 180 C 115 300 220 332 280 272 L 280 190 L 215 190','Curve left and around, go up, then left.')],
  H:[s('M 125 60 L 125 300','Go down the left side.'),s('M 275 60 L 275 300','Go down the right side.'),s('M 125 180 L 275 180','Go across the middle.')],
  I:[s('M 200 60 L 200 300','Go straight down.'),s('M 125 60 L 275 60','Go across the top.'),s('M 125 300 L 275 300','Go across the bottom.')],
  J:[s('M 255 60 L 255 235 C 255 320 125 325 125 250','Go down, then hook to the left.'),s('M 170 60 L 295 60','Go across the top.')],
  K:[s('M 125 60 L 125 300','Go straight down.'),s('M 280 60 L 125 180 L 285 300','Slant in to the middle, then out to the bottom.')],
  L:[s('M 135 60 L 135 300 L 280 300','Go down, then across to the right.')],
  M:[s('M 100 60 L 100 300','Go straight down.'),s('M 100 60 L 200 300 L 300 60 L 300 300','Slant down, slant up, then straight down.')],
  N:[s('M 125 60 L 125 300','Go straight down.'),s('M 125 60 L 275 300 L 275 60','Slant down to the right, then go up.')],
  O:[s(circle(60,300),'Go left and all the way around.')],
  P:[s('M 130 60 L 130 300','Go straight down.'),s('M 130 60 L 210 60 C 300 60 300 180 210 180 L 130 180','Go right and around to the middle.')],
  Q:[s(circle(60,300),'Go left and all the way around.'),s('M 220 250 L 290 320','Make a short slanting tail.')],
  R:[s('M 130 60 L 130 300','Go straight down.'),s('M 130 60 L 210 60 C 300 60 300 180 210 180 L 130 180 L 285 300','Around the top bump, then slant down.')],
  S:[s('M 275 90 C 230 35 125 55 130 120 C 135 180 270 180 275 240 C 280 310 175 325 125 270','Curve left, bend right, then curve left.')],
  T:[s('M 200 60 L 200 300','Go straight down.'),s('M 110 60 L 290 60','Go across the top.')],
  U:[s('M 120 60 L 120 225 C 120 325 280 325 280 225 L 280 60','Go down, curve around, then go up.')],
  V:[s('M 110 60 L 200 300 L 290 60','Slant down, then slant up.')],
  W:[s('M 85 60 L 140 300 L 200 60 L 260 300 L 315 60','Slant down, up, down and up.')],
  X:[s('M 120 60 L 280 300','Slant down to the right.'),s('M 280 60 L 120 300','Slant down to the left.')],
  Y:[s('M 115 60 L 200 180','Slant down to the middle.'),s('M 285 60 L 200 180 L 200 300','Slant in, then go straight down.')],
  Z:[s('M 120 60 L 280 60 L 120 300 L 280 300','Go across, slant down left, then across.')],
  a:[s(bowl,'Go left and around the small circle.'),s('M 270 180 L 270 300','Go down the right side.')],
  b:[s('M 130 60 L 130 300 L 130 210 C 150 165 275 160 275 240 C 275 310 150 315 130 300','Go down, back up, then around the bump.')],
  c:[s('M 270 198 C 230 162 130 170 130 240 C 130 310 230 318 270 282','Curve left, down and around.')],
  d:[s(bowl,'Go left and around the small circle.'),s('M 270 60 L 270 300','Start at the top. Go straight down.')],
  e:[s('M 130 238 L 270 238 C 270 160 130 160 130 238 C 130 305 225 320 267 282','Go right, curve left and around.')],
  f:[s('M 265 85 C 245 42 180 55 180 112 L 180 300','Curve over the top, then go down.'),s('M 125 180 L 250 180','Go across to the right.')],
  g:[s(bowl,'Go left and around the small circle.'),s('M 270 180 L 270 330 C 270 395 205 405 165 365','Go down below the line and hook left.')],
  h:[s('M 130 60 L 130 300 L 130 220 C 130 165 270 165 270 220 L 270 300','Go down, back up, over the hill and down.')],
  i:[s('M 200 180 L 200 300','Go straight down.'),s('M 200 128','Add a dot above.')],
  j:[s('M 235 180 L 235 330 C 235 395 170 405 140 365','Go down below the line and hook left.'),s('M 235 128','Add a dot above.')],
  k:[s('M 135 60 L 135 300','Go straight down.'),s('M 270 180 L 135 240 L 275 300','Slant in to the middle, then out to the bottom.')],
  l:[s('M 200 60 L 200 300','Go straight down.')],
  m:[s('M 100 180 L 100 300 L 100 220 C 100 167 200 167 200 220 L 200 300 L 200 220 C 200 167 300 167 300 220 L 300 300','Down, back up and over. Down, back up and over again.')],
  n:[s('M 130 180 L 130 300 L 130 220 C 130 167 270 167 270 220 L 270 300','Go down, back up, over the hill and down.')],
  o:[s(circle(180,300),'Go left and all the way around.')],
  p:[s('M 130 180 L 130 390 L 130 210 C 150 165 275 160 275 240 C 275 310 150 315 130 300','Go down below the line, back up, then around the bump.')],
  q:[s(bowl,'Go left and around the small circle.'),s('M 270 180 L 270 355 C 270 395 290 395 310 372','Go below the line, then hook right.')],
  r:[s('M 150 180 L 150 300 L 150 220 C 150 178 220 165 260 195','Go down, back up, then over the small shoulder.')],
  s:[s('M 260 195 C 225 165 145 175 145 210 C 145 244 265 238 265 272 C 265 308 185 312 140 283','Curve left, bend right, then curve left.')],
  t:[s('M 190 110 L 190 300','Go straight down.'),s('M 130 180 L 260 180','Go across to the right.')],
  u:[s('M 130 180 L 130 250 C 130 317 270 317 270 250 L 270 180 L 270 300','Go down, curve up, then go down again.')],
  v:[s('M 120 180 L 200 300 L 280 180','Slant down, then slant up.')],
  w:[s('M 85 180 L 140 300 L 200 180 L 260 300 L 315 180','Slant down, up, down and up.')],
  x:[s('M 130 180 L 270 300','Slant down to the right.'),s('M 270 180 L 130 300','Slant down to the left.')],
  y:[s('M 125 180 L 205 300','Slant down to the right.'),s('M 280 180 L 140 390','Slant down left, below the line.')],
  z:[s('M 130 180 L 270 180 L 130 300 L 270 300','Go across, slant down left, then across.')]
 };
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 function sample(d){
  const tokens=d.match(/[MLC]|-?\d+(?:\.\d+)?/g),raw=[];let at=0,p;
  const point=()=>({x:+tokens[at++],y:+tokens[at++]});
  while(at<tokens.length){const op=tokens[at++];if(op==='M'){p=point();raw.push(p);}else if(op==='L'){p=point();raw.push(p);}else if(op==='C'){
   const a=p,b=point(),c=point(),z=point(),steps=Math.ceil((distance(a,b)+distance(b,c)+distance(c,z))/2);
   for(let i=1;i<=steps;i++){const t=i/steps,u=1-t;raw.push({x:u*u*u*a.x+3*u*u*t*b.x+3*u*t*t*c.x+t*t*t*z.x,y:u*u*u*a.y+3*u*u*t*b.y+3*u*t*t*c.y+t*t*t*z.y});}p=z;
  }else throw Error('Unsupported formation command '+op);}
  const out=[{...raw[0],at:0}];let length=0;
  for(let i=1;i<raw.length;i++){const a=raw[i-1],b=raw[i],len=distance(a,b),n=Math.max(1,Math.ceil(len/2));for(let j=1;j<=n;j++)out.push({x:a.x+(b.x-a.x)*j/n,y:a.y+(b.y-a.y)*j/n,at:length+len*j/n});length+=len;}
  return out;
 }
 for(const strokes of Object.values(DATA))for(const stroke of strokes){stroke.points=sample(stroke.d);stroke.dot=stroke.points.length===1;}
 // Forward-only local projection. Every pointer segment is checked along its
 // length, so a line across an O or a jump between endpoints cannot complete it.
 function tracer(stroke){
  const pts=stroke.points,tolerance=18;let index=0,previous=null,drawing=false,ready=false;
  const target=()=>pts[index];
  function reset(){index=0;previous=null;drawing=false;ready=false;}
  function down(p){if(distance(p,target())>tolerance)return false;previous=p;drawing=true;ready=stroke.dot;return true;}
  function move(p){
   if(!drawing||ready)return ready;
   const a=previous,n=Math.max(1,Math.ceil(distance(a,p)/2));let candidate=index;
   for(let j=1;j<=n;j++){
    const at={x:a.x+(p.x-a.x)*j/n,y:a.y+(p.y-a.y)*j/n};let best=candidate,near=Infinity;
    // At a retraced stem's turnaround the same point occurs twice. Prefer
    // the forward occurrence within this small window so normal event
    // spacing does not trap a child just before the turn.
    for(let k=Math.max(0,candidate-10);k<=Math.min(pts.length-1,candidate+12);k++){const d=distance(at,pts[k]);if(d<near-.001||(Math.abs(d-near)<=.001&&k>best)){near=d;best=k;}}
    if(near>tolerance){drawing=false;previous=null;return false;}
    candidate=Math.max(candidate,best);
   }
   index=candidate;previous=p;
   ready=index>=pts.length-3&&distance(p,pts.at(-1))<=10;return true;
  }
  function up(p){if(drawing&&p)move(p);const completed=drawing&&ready&&(!stroke.dot||!p||distance(p,pts[0])<=tolerance);drawing=false;previous=null;return completed;}
  function cancel(){drawing=false;previous=null;}
  return {down,move,up,cancel,reset,target,get index(){return index;},get ready(){return ready;},get drawing(){return drawing;}};
 }
 return {DATA,WIDTH,HEIGHT,VERSION,sample,tracer,distance};
});
