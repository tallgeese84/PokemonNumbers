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
 function loadThree(){if(window.THREE)return Promise.resolve();return new Promise((ok,fail)=>{const s=document.createElement('script');s.src='assets/vendor/three-r128.min.js?v=71';s.onload=ok;s.onerror=fail;document.head.append(s);});}
 function buildFox(){const m=buildFoxModel(THREE,{shells:quality.shells});fox=m.fox;parts=m.parts;tailGroups=m.tails;fox.traverse(o=>{if(o.isMesh&&o.parent===fox)o.castShadow=true;});scene.add(fox);}
 function layoutTails(count,time){
  // one tail stands up; more tails open into a fan behind him
  const spread=count===1?0:Math.min(2.2,.3*(count-1));
  tailGroups.forEach((g,i)=>{g.visible=i<count;if(!g.visible)return;const f=count===1?0:i/(count-1)-.5;
   g.rotation.order='ZXY';g.rotation.z=f*spread+Math.sin(time*1.5+i*.6)*.06;g.rotation.x=-.1+Math.abs(f)*.3+Math.sin(time*1.1+i)*.04;
   const s=g.userData.grow*(1-Math.abs(f)*.12);g.scale.set(s,s,s);});
 }
 /* Fur detail adapts to the tablet: if frames are slow, drop every other fur layer. */
 const quality={shells:(window.__foxShells??8),frames:0,t0:0,reduced:false};
 function adapt(t){if(quality.reduced)return;if(!quality.t0){quality.t0=t;return;}quality.frames++;
  if(quality.frames===90){const ms=(t-quality.t0)/90;if(ms>34){quality.reduced=true;parts.shellGroups.forEach(sh=>sh.forEach((m,k)=>{if(k%2===0)m.visible=false;}));renderer.setPixelRatio(Math.min(1.5,window.devicePixelRatio||1));sizeRenderer();}}}
 let progCache=null,progAt=0;
 function progressCached(){const now=Date.now();if(!progCache||now-progAt>2000){progCache=progress();progAt=now;}return progCache;}
 function sizeRenderer(){const st=$('foxStage'),w=st.clientWidth||360,h=Math.round(Math.min(w*.95,540));renderer.setSize(w,h,false);$('foxCanvas').style.height=h+'px';camera.aspect=w/h;camera.updateProjectionMatrix();}
 async function init3d(){
  if(T)return true;
  try{await loadThree();}catch(e){$('foxNote').textContent='Connect to the internet once to wake your fox.';return false;}
  const canvas=$('foxCanvas');
  try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});}catch(e){$('foxNote').textContent='This tablet cannot show 3D right now.';return false;}
  renderer.setPixelRatio(Math.min(3,window.devicePixelRatio||1));
  renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(34,1,.1,50);camera.position.set(0,1.6,5.6);camera.lookAt(0,1.05,0);
  scene.add(new THREE.HemisphereLight(0xfff3e0,0x7d9a80,.7));
  const key=new THREE.DirectionalLight(0xfff1dc,1.25);key.position.set(2.5,5,3.5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.radius=6;key.shadow.bias=-.0004;
  Object.assign(key.shadow.camera,{left:-2.5,right:2.5,top:3,bottom:-1.5,near:.5,far:14});scene.add(key);
  const rim=new THREE.DirectionalLight(0xbfe6ff,.65);rim.position.set(-3,2.5,-3.5);scene.add(rim);
  const fill=new THREE.DirectionalLight(0xffe0c4,.35);fill.position.set(-2,1,4);scene.add(fill);
  const ground=new THREE.Mesh(new THREE.CircleGeometry(3.2,96),new THREE.MeshStandardMaterial({color:0xBFD9AE,roughness:1}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
  parts.shadow={scale:{setScalar(){}}};
  buildFox();fox.rotation.y=.55;parts.shadow={scale:{setScalar(){}}};T=true;sizeRenderer();window.addEventListener('resize',()=>{if(mode==='fox')sizeRenderer();});
  // drag to turn, tap to play
  let down=null;canvas.addEventListener('pointerdown',e=>{down={x:e.clientX,r:fox.rotation.y,moved:false};canvas.setPointerCapture?.(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!down)return;const dx=e.clientX-down.x;if(Math.abs(dx)>6)down.moved=true;fox.rotation.y=down.r+dx*.012;});
  canvas.addEventListener('pointerup',()=>{if(down&&!down.moved)hop();down=null;});
  return true;
 }
 function loop(t){
  if(mode!=='fox'){raf=0;return;}raf=requestAnimationFrame(loop);adapt(t);
  const time=t/1000,g=X.growth(progressCached().points);
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
