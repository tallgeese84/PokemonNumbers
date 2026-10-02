/* Jonah's fox den: an original 3D nine-tailed fox (Three.js r128, bundled for offline use).
   Built from simple rounded shapes; no external models or artwork. */
function createFox(){
 'use strict';
 const X=PokeFox,$=id=>document.getElementById(id),KEY='pokemath_fox_v1';
 let state=X.freshState();try{state=X.mergeState(state,JSON.parse(localStorage.getItem(KEY)||'null'));}catch(e){}
 function save(){state.at=Date.now();try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}if(typeof schedulePush==='function')schedulePush();}
 const foxName=()=>state.name||'Kit';
 const reduce=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

 /* Learning progress → tails. Reading routes and maths Gym badges, rebuilt from synced records. */
 function progress(){
  try{const s=adventure.tracker?.sessions||{};
   const r=PokeReadingCore.withSessions(reading.state,s),routes=Object.keys(r.passed||{}).length;
   const m=PokeMathPath.withSessions(mathPath.state,s),badges=Object.keys(m.badges||{}).length;
   return {routes,badges,points:X.points(routes,badges)};}catch(e){return {routes:0,badges:0,points:0};}
 }
 /* Every star he earns anywhere also drops a leaf for the fox. */
 function earn(n){if(n>0){state.earned+=n;save();updateHomeBadge();}}

 /* ---------- screen ---------- */
 const root=document.createElement('div');root.id='scr-fox';root.className='screen';
 root.innerHTML='<header class="activity-header"><h2 class="sr-only">My fox</h2><button class="btn listen-btn" id="foxListen" aria-label="Hear it again">'+PokeVisuals.icon('listen')+'</button></header>'+
  '<div class="fox-den"><div class="fox-stage" id="foxStage"><canvas id="foxCanvas" aria-label="Your fox. Tap to play."></canvas><div class="fox-fx" id="foxFx"></div><div class="fox-note" id="foxNote"></div></div>'+
  '<div class="fox-bar"><div class="fox-name" id="foxName"></div><div class="fox-leaves" id="foxLeaves" aria-label="Leaves"></div></div>'+
  '<div class="fox-tails" id="foxTails" aria-label="Tails"></div><div class="fox-shop" id="foxShop"></div></div>';
 $('scr-quiz').after(root);screens.fox=root.id;
 let phrase='';$('foxListen').onclick=()=>{audio();if(!soundOn)$('soundBtn').click();say(phrase,true);};

 /* ---------- 3D ---------- */
 let T=null,renderer,scene,camera,fox,parts={},tailGroups=[],raf=0,clock0=0,anim={},sprites=[];
 function loadThree(){if(window.THREE)return Promise.resolve();return new Promise((ok,fail)=>{const s=document.createElement('script');s.src='assets/vendor/three-r128.min.js?v=70';s.onload=ok;s.onerror=fail;document.head.append(s);});}
 const C={gold:0xEFA03C,goldD:0xD38A2A,cream:0xFFF2DA,teal:0x3CC7B4,dark:0x3A2A25,eye:0x1D1D2B,ear:0xF6C7A6,paw:0x6B4A35};
 function mat(c,extra={}){return new THREE.MeshStandardMaterial({color:c,roughness:.75,metalness:0,...extra});}
 function ball(r,c,x,y,z,sx=1,sy=1,sz=1,seg=24){const m=new THREE.Mesh(new THREE.SphereGeometry(r,seg,Math.round(seg*.75)),typeof c==='number'?mat(c):c);m.position.set(x,y,z);m.scale.set(sx,sy,sz);return m;}
 function buildFox(){
  fox=new THREE.Group();const body=new THREE.Group();fox.add(body);parts.body=body;
  body.add(ball(.55,C.gold,0,.68,0,1,.92,1.32));                 // body
  body.add(ball(.36,C.cream,0,.66,.42,1.05,1.05,.8));            // chest
  const legs=[[-.26,.42],[.26,.42],[-.26,-.42],[.26,-.42]];
  legs.forEach(([x,z])=>{const leg=new THREE.Mesh(new THREE.CylinderGeometry(.1,.09,.42,16),mat(C.gold));leg.position.set(x,.26,z);body.add(leg);body.add(ball(.115,C.paw,x,.06,z+.03,1,.7,1.25));});
  // head
  const head=new THREE.Group();head.position.set(0,1.18,.48);fox.add(head);parts.head=head;
  head.add(ball(.44,C.gold,0,0,0,1.08,.98,1));
  head.add(ball(.22,C.cream,-.25,-.12,.18,1.1,.9,.9),ball(.22,C.cream,.25,-.12,.18,1.1,.9,.9)); // cheek fluff
  head.add(ball(.2,C.cream,0,-.08,.36,1,.78,1.15));             // muzzle
  head.add(ball(.065,C.dark,0,.0,.58,1.2,.9,1));                 // nose
  const eyes=[];[-1,1].forEach(s=>{const e=new THREE.Group();e.position.set(s*.17,.08,.37);const eb=ball(.085,mat(C.eye,{roughness:.25}),0,0,0,1,1.15,.7);e.add(eb);e.add(ball(.03,mat(0xffffff,{emissive:0xffffff,emissiveIntensity:.6}),.025,.04,.05,1,1,.5,10));head.add(e);eyes.push(e);});parts.eyes=eyes;
  head.add(ball(.05,mat(C.teal,{emissive:C.teal,emissiveIntensity:.45}),0,.3,.33,1.3,.6,.4));     // little leaf mark on the forehead
  const ears=[];[-1,1].forEach(s=>{const e=new THREE.Group();e.position.set(s*.25,.34,-.02);e.rotation.z=-s*.32;
   const outer=new THREE.Mesh(new THREE.ConeGeometry(.17,.44,24),mat(C.gold));outer.position.y=.18;e.add(outer);
   const inner=new THREE.Mesh(new THREE.ConeGeometry(.1,.3,20),mat(C.ear));inner.position.set(0,.14,.07);e.add(inner);
   const tip=new THREE.Mesh(new THREE.ConeGeometry(.07,.12,16),mat(C.teal,{emissive:C.teal,emissiveIntensity:.3}));tip.position.y=.36;e.add(tip);head.add(e);ears.push(e);});parts.ears=ears;
  // accessories (hidden until worn)
  const acc={};
  acc.scarf=new THREE.Group();const sc=new THREE.Mesh(new THREE.TorusGeometry(.33,.075,14,36),mat(0xE2574C));sc.rotation.x=Math.PI/2;acc.scarf.add(sc);const tail=new THREE.Mesh(new THREE.BoxGeometry(.13,.3,.05),mat(0xE2574C));tail.position.set(.18,-.17,.27);tail.rotation.z=.25;acc.scarf.add(tail);acc.scarf.position.set(0,.98,.4);
  acc.bell=new THREE.Group();const col=new THREE.Mesh(new THREE.TorusGeometry(.32,.03,10,36),mat(0x2F6FB0));col.rotation.x=Math.PI/2;acc.bell.add(col);acc.bell.add(ball(.07,mat(0xF2C94C,{metalness:.6,roughness:.3}),0,-.07,.31));acc.bell.position.set(0,.98,.4);
  acc.crown=new THREE.Group();for(let i=0;i<9;i++){const a=i/9*Math.PI*2;acc.crown.add(ball(.06,i%2?0xF7A8C4:0xFFFFFF,Math.cos(a)*.27,0,Math.sin(a)*.27));}acc.crown.position.set(0,.38,0);head.add(acc.crown);
  acc.hat=new THREE.Group();const brim=new THREE.Mesh(new THREE.CylinderGeometry(.28,.28,.03,28),mat(0x222222));const top=new THREE.Mesh(new THREE.CylinderGeometry(.17,.17,.3,28),mat(0x222222));top.position.y=.16;const band=new THREE.Mesh(new THREE.CylinderGeometry(.175,.175,.06,28),mat(C.teal));band.position.y=.05;acc.hat.add(brim,top,band);acc.hat.position.set(0,.42,-.02);head.add(acc.hat);
  fox.add(acc.scarf,acc.bell);Object.values(acc).forEach(a=>a.visible=false);parts.acc=acc;
  // tails
  const tailRoot=new THREE.Group();tailRoot.position.set(0,.62,-.7);fox.add(tailRoot);parts.tailRoot=tailRoot;
  for(let i=0;i<9;i++){const tg=makeTail();tg.visible=false;tailRoot.add(tg);tailGroups.push(tg);}
  scene.add(fox);
 }
 function makeTail(){
  const g=new THREE.Group(),n=24,goldM=mat(C.gold),creamM=mat(C.cream),tipM=mat(C.teal,{emissive:C.teal,emissiveIntensity:.35});
  for(let k=0;k<n;k++){const s=k/(n-1);if(k===0)continue;const r=.07+.13*Math.pow(Math.sin(Math.PI*Math.min(1,s*1.06)),.75);
   // rises up behind the fox, curling back, so a fan of tails reads from the front
   const x=0,y=s*1.3+Math.sin(s*Math.PI)*.08,z=-Math.sin(s*Math.PI*.5)*.5+s*s*.25;
   g.add(ball(r+.01,s>.78?tipM:s>.68?creamM:goldM,x,y,z,1,1,1,16));}
  g.userData.grow=1;return g;
 }
 function layoutTails(count,time){
  // one tail stands up; more tails open into a fan like a peacock's
  const spread=count===1?0:Math.min(2.7,.36*(count-1));
  tailGroups.forEach((g,i)=>{g.visible=i<count;if(!g.visible)return;const f=count===1?0:i/(count-1)-.5;
   g.rotation.order='ZXY';g.rotation.z=f*spread+Math.sin(time*1.6+i*.6)*.07;g.rotation.x=-.35+Math.abs(f)*.2+Math.sin(time*1.2+i)*.04;
   const s=g.userData.grow*(1-Math.abs(f)*.15);g.scale.set(s,s,s);});
 }
 function sizeRenderer(){const st=$('foxStage'),w=st.clientWidth||360,h=Math.round(Math.min(w*.9,420));renderer.setSize(w,h,false);$('foxCanvas').style.height=h+'px';camera.aspect=w/h;camera.updateProjectionMatrix();}
 async function init3d(){
  if(T)return true;
  try{await loadThree();}catch(e){$('foxNote').textContent='Connect to the internet once to wake your fox.';return false;}
  const canvas=$('foxCanvas');
  try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});}catch(e){$('foxNote').textContent='This tablet cannot show 3D right now.';return false;}
  renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
  scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(36,1,.1,50);camera.position.set(0,1.55,5.4);camera.lookAt(0,1.05,0);
  scene.add(new THREE.HemisphereLight(0xfff6e6,0x88a888,.95));const sun=new THREE.DirectionalLight(0xffffff,.75);sun.position.set(2,4,3);scene.add(sun);
  // soft round shadow on a grassy disc
  const cv=document.createElement('canvas');cv.width=cv.height=128;const cx=cv.getContext('2d');const gr=cx.createRadialGradient(64,64,4,64,64,64);gr.addColorStop(0,'rgba(40,70,50,.35)');gr.addColorStop(1,'rgba(40,70,50,0)');cx.fillStyle=gr;cx.fillRect(0,0,128,128);
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(2.4,2.4),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(cv),transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.005;scene.add(shadow);parts.shadow=shadow;
  const ground=new THREE.Mesh(new THREE.CircleGeometry(2.6,48),mat(0xCFE6C2));ground.rotation.x=-Math.PI/2;scene.add(ground);
  buildFox();fox.rotation.y=.55;T=true;sizeRenderer();window.addEventListener('resize',()=>{if(mode==='fox')sizeRenderer();});
  // drag to turn, tap to play
  let down=null;canvas.addEventListener('pointerdown',e=>{down={x:e.clientX,r:fox.rotation.y,moved:false};canvas.setPointerCapture?.(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!down)return;const dx=e.clientX-down.x;if(Math.abs(dx)>6)down.moved=true;fox.rotation.y=down.r+dx*.012;});
  canvas.addEventListener('pointerup',()=>{if(down&&!down.moved)hop();down=null;});
  return true;
 }
 function loop(t){
  if(mode!=='fox'){raf=0;return;}raf=requestAnimationFrame(loop);
  const time=t/1000,g=X.growth(progress().points);
  // cub → grown: body scales up, head stays relatively bigger when small
  const s=.72+.38*g;fox.scale.set(s,s,s);parts.head.scale.setScalar(1.14-.14*g);
  const breathe=reduce()?0:Math.sin(time*2.2)*.012;parts.body.scale.set(1,1+breathe,1);
  let y=0;if(anim.hop){const k=(t-anim.hop.t0)/600;if(k>=1)anim.hop=null;else y=Math.sin(k*Math.PI)*.45;}
  if(anim.spin){const k=(t-anim.spin.t0)/1100;if(k>=1){anim.spin=null;}else fox.rotation.y=anim.spin.r+k*Math.PI*2;}
  fox.position.y=y;parts.shadow.scale.setScalar(1-y*.6);
  if(anim.eat){const k=(t-anim.eat.t0)/1800;if(k>=1){anim.eat=null;parts.head.rotation.x=0;}else parts.head.rotation.x=.35+Math.sin(k*Math.PI*8)*.12;}
  else parts.head.rotation.x=reduce()?0:Math.sin(time*.7)*.05;
  parts.head.rotation.z=reduce()?0:Math.sin(time*.5)*.06;
  const blink=(time%4.2)<.12;parts.eyes.forEach(e=>e.scale.y=blink?.12:1);
  parts.ears.forEach((e,i)=>e.rotation.x=(Math.sin(time*3+i)>.97)?-.25:0);
  // newly grown tail swells in
  tailGroups.forEach(gp=>{if(gp.userData.grow<1)gp.userData.grow=Math.min(1,gp.userData.grow+.012);});
  layoutTails(X.tails(progress().points),reduce()?0:time);
  // sprites (treats, toys)
  sprites=sprites.filter(sp=>{const k=(t-sp.t0)/sp.dur;if(k>=1){scene.remove(sp.obj);return false;}sp.step(k,sp.obj);return true;});
  renderer.render(scene,camera);
 }
 function emojiSprite(e,size=.5){const cv=document.createElement('canvas');cv.width=cv.height=128;const c=cv.getContext('2d');c.font='100px serif';c.textAlign='center';c.textBaseline='middle';c.fillText(e,64,70);
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(cv),transparent:true}));sp.scale.set(size,size,size);return sp;}
 function hearts(n=5){const fx=$('foxFx');for(let i=0;i<n;i++){const h=document.createElement('span');h.className='fox-heart';h.textContent=['💛','✨','🧡'][i%3];h.style.left=(35+Math.random()*30)+'%';h.style.animationDelay=(i*.12)+'s';fx.append(h);setTimeout(()=>h.remove(),1800);}}
 function hop(){if(!T)return;anim.hop={t0:performance.now()};sndTap();hearts(3);if(Math.random()<.35)say(pick(['Yip yip!','Hello '+(childName||'Jonah')+'!','Again! Again!']),true);}
 const pick=a=>a[Math.floor(Math.random()*a.length)];
 function useItem(it){const t0=performance.now();
  if(it.kind==='treat'){const sp=emojiSprite(it.emoji,.45);scene.add(sp);sprites.push({obj:sp,t0,dur:1900,step:(k,o)=>{o.position.set(0,.25,1.05);const s=.45*(1-Math.max(0,k-.5)*2);o.scale.set(s,s,s);}});anim.eat={t0:t0+150};setTimeout(()=>{hearts(6);sndGood();},1500);say(pick(['Yum!','Mmm, thank you!','Delicious!']),true);}
  if(it.id==='ball'){const sp=emojiSprite(it.emoji,.35);scene.add(sp);sprites.push({obj:sp,t0,dur:2600,step:(k,o)=>{o.position.set(Math.sin(k*Math.PI*2)*1.2,.2+Math.abs(Math.sin(k*Math.PI*5))*.4,.9);}});anim.spin={t0:t0+600,r:fox.rotation.y};setTimeout(()=>anim.hop={t0:performance.now()},1900);setTimeout(()=>hearts(5),2300);say('Catch!',true);}
  if(it.id==='bubbles'){for(let i=0;i<7;i++){const sp=emojiSprite('🫧',.25+Math.random()*.15);scene.add(sp);const x0=(Math.random()-.5)*1.8;sprites.push({obj:sp,t0:t0+i*180,dur:2400,step:(k,o)=>{o.position.set(x0+Math.sin(k*6+i)*.15,.3+k*2.2,.6);}});}setTimeout(()=>anim.hop={t0:performance.now()},700);setTimeout(()=>anim.hop={t0:performance.now()},1500);say('Pop! Pop!',true);}
 }
 function wear(){Object.entries(parts.acc).forEach(([k,o])=>o.visible=state.wearing===k);}

 /* ---------- den UI ---------- */
 function drawUI(){
  const p=progress(),tails=X.tails(p.points),nt=X.nextTail(p.points);
  $('foxName').textContent=foxName();
  $('foxLeaves').innerHTML='🍃 <b>'+X.balance(state)+'</b>';
  const tl=$('foxTails');tl.replaceChildren();
  for(let i=0;i<9;i++){const s=document.createElement('span');s.className='fox-tailicon'+(i<tails?' on':'');s.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20C6 10 13 4 20 4c-1 8-6 15-16 16z"/></svg>';tl.append(s);}
  if(nt){const bar=document.createElement('div');bar.className='fox-next';const prev=X.TAIL_AT[tails-1]||0,f=(p.points-prev)/Math.max(1,nt.at-prev);bar.innerHTML='<span style="width:'+Math.round(f*100)+'%"></span>';bar.setAttribute('aria-label','Next tail');tl.append(bar);}
  const shop=$('foxShop');shop.replaceChildren();
  X.SHOP.forEach(it=>{const owned=state.owned.includes(it.id),b=document.createElement('button');b.type='button';b.className='fox-item'+(owned?' owned':'')+(state.wearing===it.id?' wearing':'')+(!owned&&X.balance(state)<it.cost?' poor':'');
   b.setAttribute('aria-label',it.label+(owned?'':' costs '+it.cost+' leaves'));b.innerHTML='<span class="fox-ie">'+it.emoji+'</span><small>'+(owned?(state.wearing===it.id?'on':'✓'):'🍃'+it.cost)+'</small>';
   b.onclick=()=>{if(mode!=='fox')return;const r=X.buy(state,it.id);
    if(!r.ok){sndOops();say('You need '+r.need+' more leaves. Read and play to collect leaves!',true);return;}
    state=r.state;save();if(it.kind==='wear'){wear();hearts(4);sndGood();say(state.wearing===it.id?'Looking great!':'All done.',true);}else useItem(it);drawUI();};shop.append(b);});
 }
 async function open(){
  shutUp();mode='fox';show('fox');drawUI();
  if(!await init3d())return;wear();
  const p=progress(),tails=X.tails(p.points);
  if(tails>(state.tailsSeen||1)){tailGroups.slice(state.tailsSeen,tails).forEach(g=>g.userData.grow=.05);
   phrase='Wow! '+foxName()+' grew '+(tails-state.tailsSeen>1?'new tails':'tail number '+tails)+'! All your reading and maths made it grow.';
   state.tailsSeen=tails;save();setTimeout(()=>{hearts(10);sndGood();say(phrase,true);},400);}
  else{phrase='This is '+foxName()+'. Tap to play. Use your leaves for treats and toys.';say(phrase,true);}
  updateHomeBadge();
  if(!raf)raf=requestAnimationFrame(loop);
 }
 /* Home: the Fox button sparkles when a new tail is waiting. */
 function updateHomeBadge(){const b=$('foxBtn');if(!b)return;const t=X.tails(progress().points);b.classList.toggle('fox-new',t>(state.tailsSeen||1));}
 function leave(){if(raf){cancelAnimationFrame(raf);raf=0;}}
 // grown-ups: name the fox
 const panel=document.createElement('details');panel.className='parent-settings';panel.innerHTML='<summary>Jonah’s fox</summary><p class="muted">His fox grows a tail at learning milestones: reading routes passed, plus two points for each maths Gym badge. All nine tails come when both paths are finished. Every star he earns also gives the fox a leaf to spend on treats, toys and things to wear. The fox is never hungry or sad.</p><label>Name <input class="syinput" id="foxNameIn" maxlength="14" placeholder="Kit"></label> <button class="btn" id="foxNameSave">Save</button><p class="muted" id="foxStatus"></p>';
 ($('mathPathPanel')||$('learningDashboard')).after(panel);
 panel.addEventListener('toggle',()=>{if(!panel.open)return;$('foxNameIn').value=state.name||'';const p=progress(),nt=X.nextTail(p.points);$('foxStatus').textContent=`${X.tails(p.points)} of 9 tails · ${p.routes} reading routes + ${p.badges} Gym badges = ${p.points} of ${X.MAX_POINTS} points${nt?` · next tail at ${nt.at}`:''} · ${X.balance(state)} leaves to spend (${state.earned} earned).`;});
 $('foxNameSave').onclick=()=>{state.name=$('foxNameIn').value.trim().slice(0,14);save();$('foxStatus').textContent='Saved.';};
 return {open,leave,earn,updateHomeBadge,get state(){return state;},payload:()=>state,applyState(m){if(m){state=X.mergeState(state,m);save();}}};
}
