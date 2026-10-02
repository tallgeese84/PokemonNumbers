/* Jonah's fox den: an original 3D nine-tailed fox (Three.js r128, bundled for offline use).
   Built from simple rounded shapes; no external models or artwork. */
function createFox(){
 'use strict';
 const X=PokeFox,$=id=>document.getElementById(id),KEY='pokemath_fox_v1';
 let state=X.freshState();try{state=X.mergeState(state,JSON.parse(localStorage.getItem(KEY)||'null'));}catch(e){}
 function save(){state.at=Date.now();try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}if(typeof schedulePush==='function')schedulePush();}
 const foxName=()=>state.name||'Buddy';
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
 function loadThree(){if(window.THREE)return Promise.resolve();return new Promise((ok,fail)=>{const s=document.createElement('script');s.src='assets/vendor/three-r128.min.js?v=72';s.onload=ok;s.onerror=fail;document.head.append(s);});}
 function buildFox(){const m=buildFoxModel(THREE,{layers:quality.layers});fox=m.fox;parts=m.parts;tailGroups=m.tails;scene.add(fox);}
 function layoutTails(count,time){
  if(count===1){const g=tailGroups[0];g.visible=true;tailGroups.slice(1).forEach(t=>t.visible=false);
   // a single tail curls round his side onto the ground, like a sitting cub
   g.rotation.order='YZX';g.rotation.y=-.95;g.rotation.z=-1.2+Math.sin(time*1.3)*.05;g.rotation.x=.1;const s=g.userData.grow;g.scale.set(s,s,s);return;}
  // more tails open into a fan behind him
  const spread=Math.min(2.4,.32*(count-1));
  tailGroups.forEach((g,i)=>{g.visible=i<count;if(!g.visible)return;const f=i/(count-1)-.5;
   g.rotation.order='ZXY';g.rotation.y=0;g.rotation.z=f*spread+Math.sin(time*1.5+i*.6)*.06;g.rotation.x=-.15+Math.abs(f)*.35+Math.sin(time*1.1+i)*.04;
   const s=g.userData.grow*(1-Math.abs(f)*.12);g.scale.set(s,s,s);});
 }
 /* Fur detail adapts to the tablet: if frames are slow, show fewer fur layers (each shell is a whole layer of hair tips). */
 const quality={layers:(window.__foxLayers??18),frames:0,t0:0,level:window.__foxNoAdapt?2:0};
 function adapt(t){if(quality.level>=2)return;if(!quality.t0){quality.t0=t;quality.frames=0;return;}quality.frames++;
  if(quality.frames===60){const ms=(t-quality.t0)/60;quality.t0=0;
   if(ms>30){quality.level++;const keep=quality.level===1?2:3;parts.shellGroups.forEach(sh=>sh.forEach((m,k)=>{m.visible=(k%keep===keep-1);}));
    if(quality.level===2){renderer.setPixelRatio(Math.min(1.5,window.devicePixelRatio||1));sizeRenderer();}}else quality.level=2;}}
 let progCache=null,progAt=0;
 function progressCached(){const now=Date.now();if(!progCache||now-progAt>2000){progCache=progress();progAt=now;}return progCache;}
 function sizeRenderer(){const st=$('foxStage'),w=st.clientWidth||360,h=Math.round(Math.min(w*.95,540));renderer.setSize(w,h,false);$('foxCanvas').style.height=h+'px';camera.aspect=w/h;camera.updateProjectionMatrix();}
 let flies=[];
 /* A soft, misty forest painted once on a canvas: trunks, foliage, flowers and glow. */
 function forestBackdrop(){const W=1024,H=1024,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  const sky=x.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#9fbf96');sky.addColorStop(.45,'#7ea476');sky.addColorStop(.75,'#5c8655');sky.addColorStop(1,'#3a5e38');x.fillStyle=sky;x.fillRect(0,0,W,H);
  const glow=x.createRadialGradient(W*.55,H*.32,10,W*.55,H*.32,W*.6);glow.addColorStop(0,'rgba(255,248,215,.75)');glow.addColorStop(1,'rgba(255,248,215,0)');x.fillStyle=glow;x.fillRect(0,0,W,H);
  [[.06,110,'#3e2e22',.9],[.94,130,'#35281e',.92],[.28,46,'#6b5c48',.45],[.7,52,'#665643',.45],[.48,30,'#7c6d58',.3],[.17,34,'#74654f',.35],[.83,38,'#6f604b',.38]].forEach(([px,w,col,a])=>{x.globalAlpha=a;x.filter='blur('+(a>.8?3:9)+'px)';x.fillStyle=col;x.fillRect(px*W-w/2,0,w,H*.82);});x.filter='none';
  x.globalAlpha=1;
  for(let i=0;i<260;i++){const px=Math.random()*W,py=H*(.55+Math.random()*.35),r=12+Math.random()*40;x.fillStyle=`hsla(${95+Math.random()*50},${35+Math.random()*25}%,${30+Math.random()*25}%,.55)`;x.beginPath();x.arc(px,py,r,0,Math.PI*2);x.fill();}
  for(let i=0;i<70;i++){const px=Math.random()*W,py=H*(.6+Math.random()*.32),r=5+Math.random()*9;x.fillStyle=pick(['rgba(240,130,170,.8)','rgba(255,190,215,.8)','rgba(200,90,140,.75)','rgba(255,255,255,.7)']);x.beginPath();x.arc(px,py,r,0,Math.PI*2);x.fill();}
  for(let i=0;i<120;i++){const px=Math.random()*W,py=Math.random()*H*.85,r=1+Math.random()*4;x.fillStyle=`rgba(255,250,200,${.25+Math.random()*.5})`;x.beginPath();x.arc(px,py,r,0,Math.PI*2);x.fill();}
  const v=x.createRadialGradient(W/2,H*.45,W*.25,W/2,H*.45,W*.75);v.addColorStop(0,'rgba(20,35,20,0)');v.addColorStop(1,'rgba(20,35,20,.55)');x.fillStyle=v;x.fillRect(0,0,W,H);
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;return t;}
 async function init3d(){
  if(T)return true;
  try{await loadThree();}catch(e){$('foxNote').textContent='Connect to the internet once to wake your fox.';return false;}
  const canvas=$('foxCanvas');
  try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});}catch(e){$('foxNote').textContent='This tablet cannot show 3D right now.';return false;}
  renderer.setPixelRatio(Math.min(3,window.devicePixelRatio||1));
  renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
  scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(32,1,.1,60);camera.position.set(0,1.45,5.4);camera.lookAt(0,1.0,0);
  scene.background=forestBackdrop();
  scene.add(new THREE.HemisphereLight(0xfff3e0,0x6e8a5c,.75));
  const key=new THREE.DirectionalLight(0xfff1dc,1.1);key.position.set(2.5,5,3.5);scene.add(key);
  const rim=new THREE.DirectionalLight(0xffe2b0,.6);rim.position.set(-3,2.5,-3.5);scene.add(rim);
  // mossy clearing with soft edges, and a soft shadow under him
  const gc=document.createElement('canvas');gc.width=gc.height=256;{const x=gc.getContext('2d'),g=x.createRadialGradient(128,128,10,128,128,128);g.addColorStop(0,'rgba(120,160,90,1)');g.addColorStop(.7,'rgba(95,140,75,.9)');g.addColorStop(1,'rgba(80,120,70,0)');x.fillStyle=g;x.fillRect(0,0,256,256);
   for(let i=0;i<900;i++){x.fillStyle=`rgba(${60+Math.random()*60|0},${110+Math.random()*70|0},${50+Math.random()*30|0},.5)`;const a=Math.random()*Math.PI*2,r=Math.random()*110;x.fillRect(128+Math.cos(a)*r,128+Math.sin(a)*r,1.5,4);}}
  const gt=new THREE.CanvasTexture(gc);gt.encoding=THREE.sRGBEncoding;
  const ground=new THREE.Mesh(new THREE.CircleGeometry(3.4,96),new THREE.MeshBasicMaterial({map:gt,transparent:true,depthWrite:false,toneMapped:false}));ground.rotation.x=-Math.PI/2;ground.position.y=-.01;scene.add(ground);
  const sc=document.createElement('canvas');sc.width=sc.height=128;{const x=sc.getContext('2d'),g=x.createRadialGradient(64,64,4,64,64,64);g.addColorStop(0,'rgba(20,35,15,.55)');g.addColorStop(1,'rgba(20,35,15,0)');x.fillStyle=g;x.fillRect(0,0,128,128);}
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(1.9,1.6),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(sc),transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.005;scene.add(shadow);
  // fireflies
  const fc=document.createElement('canvas');fc.width=fc.height=64;{const x=fc.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,248,170,1)');g.addColorStop(.2,'rgba(245,225,90,.85)');g.addColorStop(1,'rgba(240,220,80,0)');x.fillStyle=g;x.fillRect(0,0,64,64);}
  const ft=new THREE.CanvasTexture(fc);flies=[];for(let i=0;i<22;i++){const m=new THREE.Sprite(new THREE.SpriteMaterial({map:ft,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
   const f={m,x:(Math.random()-.5)*5.5,y:.3+Math.random()*2.6,z:-2.6+Math.random()*2.4,p:Math.random()*10,s:.04+Math.random()*.06};m.scale.setScalar(f.s);scene.add(m);flies.push(f);}
  buildFox();fox.rotation.y=.35;parts.shadow=shadow;T=true;sizeRenderer();window.addEventListener('resize',()=>{if(mode==='fox')sizeRenderer();});
  // drag to turn, tap to play
  let down=null;canvas.addEventListener('pointerdown',e=>{down={x:e.clientX,r:fox.rotation.y,moved:false};try{canvas.setPointerCapture?.(e.pointerId);}catch(_){}});
  canvas.addEventListener('pointermove',e=>{if(!down)return;const dx=e.clientX-down.x;if(Math.abs(dx)>6)down.moved=true;fox.rotation.y=down.r+dx*.012;});
  canvas.addEventListener('pointerup',()=>{if(down&&!down.moved)hop();down=null;});
  return true;
 }
 function loop(t){
  if(mode!=='fox'){raf=0;return;}raf=requestAnimationFrame(loop);adapt(t);
  const time=t/1000,g=X.growth(progressCached().points);
  // cub → grown: body scales up, head stays relatively bigger when small
  const s=.78+.32*g;fox.scale.set(s,s,s);parts.head.scale.setScalar(1.1-.12*g);
  const breathe=reduce()?0:Math.sin(time*2.2)*.012;parts.body.scale.set(1,1+breathe,1);
  let y=0;if(anim.hop){const k=(t-anim.hop.t0)/600;if(k>=1)anim.hop=null;else y=Math.sin(k*Math.PI)*.45;}
  if(anim.spin){const k=(t-anim.spin.t0)/1100;if(k>=1){anim.spin=null;}else fox.rotation.y=anim.spin.r+k*Math.PI*2;}
  fox.position.y=y;if(parts.shadow.scale)parts.shadow.scale.setScalar(1-y*.6);
  if(!reduce())flies.forEach(f=>{f.m.position.set(f.x+Math.sin(time*.4+f.p)*.35,f.y+Math.sin(time*.7+f.p*2)*.2,f.z+Math.cos(time*.3+f.p)*.2);f.m.material.opacity=.35+.65*Math.max(0,Math.sin(time*1.6+f.p*3));});
  if(anim.eat){const k=(t-anim.eat.t0)/1800;if(k>=1){anim.eat=null;parts.head.rotation.x=0;}else parts.head.rotation.x=.35+Math.sin(k*Math.PI*8)*.12;}
  else parts.head.rotation.x=reduce()?0:Math.sin(time*.7)*.05;
  parts.head.rotation.z=reduce()?0:Math.sin(time*.5)*.06;
  const blink=(time%4.2)<.12;parts.eyes.forEach(e=>e.scale.y=blink?.12:1);
  // watery shimmer: the highlights drift a hair's breadth, like light on water
  if(parts.eyeShine&&!reduce())parts.eyeShine.forEach((m,i)=>{m.position.x=Math.sin(time*2.3+i)*.004;m.position.y=Math.cos(time*1.9+i*2)*.004;m.material.opacity=.9+Math.sin(time*3.1+i)*.1;});
  parts.ears.forEach((e,i)=>e.rotation.x=(Math.sin(time*3+i)>.97)?-.25:0);
  // newly grown tail swells in
  tailGroups.forEach(gp=>{if(gp.userData.grow<1)gp.userData.grow=Math.min(1,gp.userData.grow+.012);});
  layoutTails(X.tails(progressCached().points),reduce()?0:time);
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
  progCache=null;shutUp();mode='fox';show('fox');drawUI();
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
 const panel=document.createElement('details');panel.className='parent-settings';panel.innerHTML='<summary>Jonah’s fox</summary><p class="muted">His fox grows a tail at learning milestones: reading routes passed, plus two points for each maths Gym badge. All nine tails come when both paths are finished. Every star he earns also gives the fox a leaf to spend on treats, toys and things to wear. The fox is never hungry or sad.</p><label>Name <input class="syinput" id="foxNameIn" maxlength="14" placeholder="Buddy"></label> <button class="btn" id="foxNameSave">Save</button><p class="muted" id="foxStatus"></p>';
 ($('mathPathPanel')||$('learningDashboard')).after(panel);
 panel.addEventListener('toggle',()=>{if(!panel.open)return;$('foxNameIn').value=state.name||'';const p=progress(),nt=X.nextTail(p.points);$('foxStatus').textContent=`${X.tails(p.points)} of 9 tails · ${p.routes} reading routes + ${p.badges} Gym badges = ${p.points} of ${X.MAX_POINTS} points${nt?` · next tail at ${nt.at}`:''} · ${X.balance(state)} leaves to spend (${state.earned} earned).`;});
 $('foxNameSave').onclick=()=>{state.name=$('foxNameIn').value.trim().slice(0,14);save();$('foxStatus').textContent='Saved.';};
 return {open,leave,earn,updateHomeBadge,get state(){return state;},payload:()=>state,applyState(m){if(m){state=X.mergeState(state,m);save();}}};
}
