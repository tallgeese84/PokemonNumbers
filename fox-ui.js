/* Jonah's fox den: Buddy, the 3D "Fox" by pxltiger (CC BY 4.0), with Three.js r128 bundled for offline use.
   Built from simple rounded shapes; no external models or artwork. */
function createFox(){
 'use strict';
 const X=PokeFox,$=id=>document.getElementById(id),KEY='pokemath_fox_v1';
 let state=X.freshState();try{state=X.mergeState(state,JSON.parse(localStorage.getItem(KEY)||'null'));}catch(e){}
 function save(){state.at=Date.now();try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}if(typeof schedulePush==='function')schedulePush();}
 const foxName=()=>state.name||'Buddy';
 const reduce=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

 /* Learning progress → milestones and tricks. Reading routes and maths Gym badges, rebuilt from synced records. */
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
  '<div class="fox-tails" id="foxTails" aria-label="Tricks learned"></div><div class="fox-shop" id="foxShop"></div></div>';
 $('scr-quiz').after(root);screens.fox=root.id;
 let phrase='';$('foxListen').onclick=()=>{audio();if(!soundOn)$('soundBtn').click();say(phrase,true);};

 /* ---------- 3D ---------- */
 let T=null,renderer,scene,camera,fox,parts={},raf=0,clock0=0,anim={},sprites=[];
 function script(src){return new Promise((ok,fail)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=fail;document.head.append(s);});}
 async function loadThree(){if(!window.THREE)await script('assets/vendor/three-r128.min.js?v=76');if(!THREE.GLTFLoader)await script('assets/vendor/three-GLTFLoader-r128.js?v=76');if(!THREE.SkeletonUtils)await script('assets/vendor/three-SkeletonUtils-r128.js?v=76');}
 let model=null;
 async function buildFox(){model=await loadFoxModel(THREE,'assets/fox.glb?v=76');fox=model.fox;parts=model.parts;scene.add(fox);}
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
  // Lit like the author's Sketchfab scene: one strong key light with a real shadow, gentle fill, no film tone curve
  renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.NoToneMapping;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(30,1,.1,60);camera.position.set(0,1.25,4.6);camera.lookAt(0,.8,0);
  scene.background=forestBackdrop();
  scene.add(new THREE.HemisphereLight(0xffffff,0x8a8f99,.45));
  const key=new THREE.DirectionalLight(0xffffff,1.4);key.position.set(-2.2,4.5,3.2);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.radius=4;key.shadow.bias=-.0005;
  Object.assign(key.shadow.camera,{left:-2,right:2,top:2.5,bottom:-1,near:.5,far:12});scene.add(key);
  const fill=new THREE.DirectionalLight(0xdfe8ff,.35);fill.position.set(3,2,2);scene.add(fill);
  const rim=new THREE.DirectionalLight(0xffffff,.35);rim.position.set(0,3,-4);scene.add(rim);
  const catcher=new THREE.Mesh(new THREE.PlaneGeometry(6,6),new THREE.ShadowMaterial({opacity:.35}));catcher.rotation.x=-Math.PI/2;catcher.position.y=.002;catcher.receiveShadow=true;scene.add(catcher);
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
  try{await buildFox();}catch(e){$('foxNote').textContent='Buddy is still on his way. Connect to the internet once.';return false;}
  fox.rotation.y=-.75;parts.shadow=shadow;shadow.visible=false;T=true;sizeRenderer();window.addEventListener('resize',()=>{if(mode==='fox')sizeRenderer();});
  // drag to turn, tap to play
  let down=null;canvas.addEventListener('pointerdown',e=>{down={x:e.clientX,r:fox.rotation.y,moved:false};try{canvas.setPointerCapture?.(e.pointerId);}catch(_){}});
  canvas.addEventListener('pointermove',e=>{if(!down)return;const dx=e.clientX-down.x;if(Math.abs(dx)>6)down.moved=true;fox.rotation.y=down.r+dx*.012;});
  canvas.addEventListener('pointerup',()=>{if(down&&!down.moved)hop();down=null;});
  return true;
 }
 let lastT=0;
 function loop(t){
  if(mode!=='fox'){raf=0;lastT=0;return;}raf=requestAnimationFrame(loop);
  const dt=lastT?Math.min(.1,(t-lastT)/1000):0;lastT=t;const time=t/1000,g=X.growth(progressCached().points);
  const s=.8+.3*g;fox.scale.set(s,s,s);
  let y=0;if(anim.hop){const k=(t-anim.hop.t0)/600;if(k>=1)anim.hop=null;else y=Math.sin(k*Math.PI)*.12;}
  if(anim.spin){const k=(t-anim.spin.t0)/1100;if(k>=1){anim.spin=null;}else fox.rotation.y=anim.spin.r+k*Math.PI*2;}
  fox.position.y=y;parts.shadow.scale.setScalar(1-y*.6);
  if(!reduce())flies.forEach(f=>{f.m.position.set(f.x+Math.sin(time*.4+f.p)*.35,f.y+Math.sin(time*.7+f.p*2)*.2,f.z+Math.cos(time*.3+f.p)*.2);f.m.material.opacity=.35+.65*Math.max(0,Math.sin(time*1.6+f.p*3));});
  model.update(reduce()?dt*.5:dt);
  sprites=sprites.filter(sp=>{const k=(t-sp.t0)/sp.dur;if(k>=1){scene.remove(sp.obj);return false;}sp.step(k,sp.obj);return true;});
  renderer.render(scene,camera);
 }
 function emojiSprite(e,size=.5){const cv=document.createElement('canvas');cv.width=cv.height=128;const c=cv.getContext('2d');c.font='100px serif';c.textAlign='center';c.textBaseline='middle';c.fillText(e,64,70);
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(cv),transparent:true}));sp.scale.set(size,size,size);return sp;}
 function hearts(n=5){const fx=$('foxFx');for(let i=0;i<n;i++){const h=document.createElement('span');h.className='fox-heart';h.textContent=['💛','✨','🧡'][i%3];h.style.left=(35+Math.random()*30)+'%';h.style.animationDelay=(i*.12)+'s';fx.append(h);setTimeout(()=>h.remove(),1800);}}
 function hop(){if(!T)return;model.play(pick(X.tricks(progressCached().points)).clip);sndTap();hearts(3);if(Math.random()<.35)say(pick(['Yip yip!','Hello '+(childName||'Jonah')+'!','Again! Again!']),true);}
 const pick=a=>a[Math.floor(Math.random()*a.length)];
 function useItem(it){const t0=performance.now();
  if(it.kind==='treat'){const sp=emojiSprite(it.emoji,.45);scene.add(sp);sprites.push({obj:sp,t0,dur:1900,step:(k,o)=>{o.position.set(0,.18,.75);const s=.45*(1-Math.max(0,k-.5)*2);o.scale.set(s,s,s);}});model.play('Fox_Sit_Yes');setTimeout(()=>{hearts(6);sndGood();},1500);say(pick(['Yum!','Mmm, thank you!','Delicious!']),true);}
  if(it.id==='ball'){const sp=emojiSprite(it.emoji,.35);scene.add(sp);sprites.push({obj:sp,t0,dur:2600,step:(k,o)=>{o.position.set(Math.sin(k*Math.PI*2)*1.2,.2+Math.abs(Math.sin(k*Math.PI*5))*.4,.9);}});setTimeout(()=>model.play('Fox_Somersault_InPlace'),500);setTimeout(()=>hearts(5),2300);say('Catch!',true);}
  if(it.id==='bubbles'){for(let i=0;i<7;i++){const sp=emojiSprite('🫧',.25+Math.random()*.15);scene.add(sp);const x0=(Math.random()-.5)*1.8;sprites.push({obj:sp,t0:t0+i*180,dur:2400,step:(k,o)=>{o.position.set(x0+Math.sin(k*6+i)*.15,.3+k*2.2,.6);}});}setTimeout(()=>model.play('Fox_Jump_Pivot_InPlace'),600);say('Pop! Pop!',true);}
 }
 function wear(){if(parts.acc)Object.entries(parts.acc).forEach(([k,o])=>o.visible=state.wearing===k);}

 /* ---------- den UI ---------- */
 function drawUI(){
  const p=progress(),tails=X.tails(p.points),nt=X.nextTail(p.points);
  $('foxName').textContent=foxName();
  $('foxLeaves').innerHTML='🍃 <b>'+X.balance(state)+'</b>';
  const tl=$('foxTails');tl.replaceChildren();
  for(let i=0;i<9;i++){const s=document.createElement('span');s.className='fox-tailicon'+(i<tails?' on':'');s.title=i<tails?X.TRICKS[i].name:'';s.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="15.5" rx="5" ry="4.2"/><circle cx="6" cy="9.5" r="2.2"/><circle cx="10" cy="6.5" r="2.2"/><circle cx="14" cy="6.5" r="2.2"/><circle cx="18" cy="9.5" r="2.2"/></svg>';tl.append(s);}
  if(nt){const bar=document.createElement('div');bar.className='fox-next';const prev=X.TAIL_AT[tails-1]||0,f=(p.points-prev)/Math.max(1,nt.at-prev);bar.innerHTML='<span style="width:'+Math.round(f*100)+'%"></span>';bar.setAttribute('aria-label','Next trick');tl.append(bar);}
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
  if(tails>(state.tailsSeen||1)){const tr=X.TRICKS[tails-1];setTimeout(()=>model.play(tr.clip),600);
   phrase='Wow! '+foxName()+' learned a new trick: '+tr.name+'! All your reading and maths taught him. Tap him to see his tricks.';
   state.tailsSeen=tails;save();setTimeout(()=>{hearts(10);sndGood();say(phrase,true);},400);}
  else{phrase='This is '+foxName()+'. Tap to play. Use your leaves for treats and toys.';say(phrase,true);}
  updateHomeBadge();
  if(!raf)raf=requestAnimationFrame(loop);
 }
 /* Home: the Fox button sparkles when a new trick is waiting. */
 function updateHomeBadge(){const b=$('foxBtn');if(!b)return;const t=X.tails(progress().points);b.classList.toggle('fox-new',t>(state.tailsSeen||1));}
 function leave(){if(raf){cancelAnimationFrame(raf);raf=0;}}
 // grown-ups: name the fox
 const panel=document.createElement('details');panel.className='parent-settings';panel.innerHTML='<summary>Jonah’s fox</summary><p class="muted">Buddy grows bigger as Jonah learns, and learns a new trick at each of nine milestones: reading routes passed, plus two points for each maths Gym badge. The ninth trick comes when both paths are finished. Every star he earns also gives Buddy a leaf to spend on treats, toys and things to wear. The fox is never hungry or sad.</p><p class="muted">3D fox: “Fox” by pxltiger (sketchfab.com/pxltiger), licensed CC BY 4.0. Accessories added.</p><label>Name <input class="syinput" id="foxNameIn" maxlength="14" placeholder="Buddy"></label> <button class="btn" id="foxNameSave">Save</button><p class="muted" id="foxStatus"></p>';
 ($('mathPathPanel')||$('learningDashboard')).after(panel);
 panel.addEventListener('toggle',()=>{if(!panel.open)return;$('foxNameIn').value=state.name||'';const p=progress(),nt=X.nextTail(p.points);$('foxStatus').textContent=`${X.tails(p.points)} of 9 tricks · ${p.routes} reading routes + ${p.badges} Gym badges = ${p.points} of ${X.MAX_POINTS} points${nt?` · next trick at ${nt.at}`:''} · ${X.balance(state)} leaves to spend (${state.earned} earned).`;});
 $('foxNameSave').onclick=()=>{state.name=$('foxNameIn').value.trim().slice(0,14);save();$('foxStatus').textContent='Saved.';};
 return {_model:()=>model,open,leave,earn,updateHomeBadge,get state(){return state;},payload:()=>state,applyState(m){if(m){state=X.mergeState(state,m);save();}}};
}
