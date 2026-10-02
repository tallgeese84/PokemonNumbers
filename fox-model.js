/* Buddy, model v3: a sitting fox cub with real fur.
   Fur is drawn as ~18 stacked "shells": copies of each surface pushed out along the
   normals, each keeping only the hair strands tall enough to reach it. Strands come
   from a clumped strand texture; roots are shaded darker and tips lighter, with a
   soft rim light, so the coat reads as individual fluffy hairs. Original design. */
function buildFoxModel(THREE,opts){
 'use strict';opts=opts||{};
 const LAYERS=opts.layers||18;
 const lin=h=>new THREE.Color(h).convertSRGBToLinear();
 const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
 const O=lin(0xE2621B),OL=lin(0xF39A4A),OD=lin(0xB8460F),W=lin(0xFFF7EE),D=lin(0x2A1810),DB=lin(0x4A2A18);
 const mix=(a,b,t,out)=>out.copy(a).lerp(b,Math.max(0,Math.min(1,t)));

 /* ---------- strand texture: R = strand height (0 = gap), G = per-strand tint ---------- */
 const furTex=(()=>{const n=256,c=document.createElement('canvas');c.width=c.height=n;const x=c.getContext('2d'),img=x.createImageData(n,n);
  const noise=(px,py)=>.5+.25*Math.sin(px*.11+Math.sin(py*.07)*2)+.25*Math.sin(py*.13+Math.cos(px*.05)*2);
  for(let i=0;i<n*n;i++){const px=i%n,py=(i/n)|0;const clump=noise(px,py);const on=Math.random()<.62;
   const h=on?Math.min(1,(.3+.7*Math.random())*(.65+.5*clump)):0;img.data[i*4]=h*255;img.data[i*4+1]=150+Math.random()*105;img.data[i*4+2]=0;img.data[i*4+3]=255;}
  x.putImageData(img,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestMipmapLinearFilter;return t;})();

 /* ---------- fur shader (all shells share one program) ---------- */
 const light={uKey:{value:new THREE.Vector3(.45,.8,.55).normalize()},uKeyCol:{value:lin(0xFFF0DC)},uSky:{value:lin(0xEAF3FF)},uGround:{value:lin(0x6E8A5C)},uRim:{value:lin(0xFFE2B0)}};
 const VS=`uniform float uLayer;uniform float uLen;uniform vec3 uGrav;attribute vec3 color;attribute float furLen;
  varying vec3 vColor;varying vec3 vN;varying vec2 vUv;varying vec3 vView;varying float vF;
  void main(){float h=uLayer*uLen*furLen;vec3 p=position+normal*h+uGrav*h*uLayer;
   vec4 wp=modelMatrix*vec4(p,1.0);vN=normalize(mat3(modelMatrix)*normal);vView=normalize(cameraPosition-wp.xyz);vUv=uv;vColor=color;vF=furLen;
   gl_Position=projectionMatrix*viewMatrix*wp;}`;
 const FS=`uniform sampler2D uFur;uniform float uLayer;uniform vec2 uRepeat;uniform vec3 uKey;uniform vec3 uKeyCol;uniform vec3 uSky;uniform vec3 uGround;uniform vec3 uRim;
  varying vec3 vColor;varying vec3 vN;varying vec2 vUv;varying vec3 vView;varying float vF;
  void main(){vec4 s=texture2D(uFur,vUv*uRepeat+vec2(0.0,uLayer*0.012));
   if(uLayer>0.0&&(s.r<uLayer||vF<0.02))discard;
   vec3 n=normalize(vN);float ao=mix(0.42,1.08,uLayer);
   vec3 amb=mix(uGround,uSky,0.5+0.5*n.y)*0.62;float d=max(dot(n,uKey)*0.6+0.4,0.0);
   float rim=pow(1.0-max(dot(n,normalize(vView)),0.0),2.6)*uLayer;
   vec3 c=vColor*(0.86+0.28*s.g)*ao*(amb+uKeyCol*d*0.78)+uRim*rim*0.32;
   gl_FragColor=vec4(c,1.0);
   #include <tonemapping_fragment>
   #include <encodings_fragment>
  }`;
 function furMat(layer,len,repeat,grav){
  return new THREE.ShaderMaterial({vertexShader:VS,fragmentShader:FS,uniforms:{uFur:{value:furTex},uLayer:{value:layer},uLen:{value:len},uRepeat:{value:new THREE.Vector2(repeat[0],repeat[1])},uGrav:{value:grav},...light}});
 }
 const shellGroups=[];
 /* A furry part: base surface plus LAYERS shells. len = longest hair, scaled per vertex by furLen. */
 function furry(geo,len,repeat=[6,6],grav=new THREE.Vector3(0,-.5,-.25)){
  const g=new THREE.Group(),shells=[];
  for(let k=0;k<=LAYERS;k++){const m=new THREE.Mesh(geo,furMat(k/LAYERS,len,repeat,grav));m.renderOrder=k;m.frustumCulled=false;g.add(m);if(k)shells.push(m);}
  shellGroups.push(shells);return g;
 }
 function attrs(geo,fn){const p=geo.attributes.position,c=new Float32Array(p.count*3),f=new Float32Array(p.count),v=new THREE.Vector3(),col=new THREE.Color();
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const fl=fn(v,col);c.set([col.r,col.g,col.b],i*3);f[i]=fl;}
  geo.setAttribute('color',new THREE.BufferAttribute(c,3));geo.setAttribute('furLen',new THREE.BufferAttribute(f,1));return geo;}
 function sculpt(geo,fn){const p=geo.attributes.position,v=new THREE.Vector3();for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);fn(v);p.setXYZ(i,v.x,v.y,v.z);}geo.computeVertexNormals();return geo;}
 const fluff=(v,amt,freq=9)=>{const a=Math.atan2(v.x,v.z),b=Math.atan2(v.y,Math.hypot(v.x,v.z));return 1+amt*Math.pow(Math.abs(Math.sin(a*freq)*Math.sin(b*freq*.8+a*3)),1.5);};
 const std=(c,o={})=>new THREE.MeshStandardMaterial({roughness:.6,...o,color:lin(c),...(o.emissive!==undefined?{emissive:lin(o.emissive)}:{})});

 const fox=new THREE.Group(),parts={};
 const bodyWrap=new THREE.Group();fox.add(bodyWrap);parts.body=bodyWrap;

 /* ---------- body: sitting, chest forward ---------- */
 const bodyG=sculpt(new THREE.SphereGeometry(1,64,48),v=>{
  v.x*=.44;v.y*=.56;v.z*=.44;v.z+=v.y*.32;                               // lean the chest forward
  const chest=smooth(.05,.35,v.z)*smooth(-.1,.35,v.y);v.multiplyScalar(1+chest*.06*fluff(v,1.2,7));   // fluffy ruff
 });
 attrs(bodyG,(v,c)=>{const front=smooth(.12,.34,v.z-v.y*.2)*smooth(-.45,.1,v.y+.1);mix(OD,O,smooth(-.4,.2,v.z+v.y*.3),c);c.lerp(OL,smooth(.2,.5,v.y)*.2);c.lerp(W,front);
  return .9+.6*smooth(.1,.4,v.z)*smooth(-.1,.4,v.y);});
 const body=furry(bodyG,.075,[11,6]);body.position.set(0,.72,-.05);bodyWrap.add(body);
 /* haunches */
 [-1,1].forEach(s=>{const g=sculpt(new THREE.SphereGeometry(.3,44,32),v=>{v.y*=.82;v.z*=1.2;});attrs(g,(v,c)=>{mix(O,OD,smooth(.1,-.25,v.y),c);return 1;});
  const h=furry(g,.06,[7,4]);h.position.set(s*.26,.33,-.12);bodyWrap.add(h);});
 /* front legs with dark stockings, and paws */
 [-1,1].forEach(s=>{const g=sculpt(new THREE.CylinderGeometry(.115,.09,.56,28,12,true),v=>{});attrs(g,(v,c)=>{mix(D,O,smooth(-.16,.02,v.y),c);return .8;});
  const leg=furry(g,.045,[4,3]);leg.position.set(s*.14,.3,.26);leg.rotation.x=-.08;bodyWrap.add(leg);
  const paw=new THREE.Mesh(sculpt(new THREE.SphereGeometry(.1,28,20),v=>{v.y*=.6;v.z*=1.3;}),std(0x2a1810,{roughness:.9}));paw.position.set(s*.15,.05,.33);bodyWrap.add(paw);
  const hp=paw.clone();hp.position.set(s*.33,.05,.08);hp.scale.set(1.15,1,1.2);bodyWrap.add(hp);});

 /* ---------- head ---------- */
 const head=new THREE.Group();head.position.set(0,1.42,.2);fox.add(head);parts.head=head;
 const EYE=[[-.19,.03,.4],[.19,.03,.4]];
 const headG=sculpt(new THREE.SphereGeometry(.48,72,56),v=>{
  v.x*=1.1;v.y*=.95;
  const z=Math.max(0,v.z/.48),m=Math.pow(z,3)*Math.exp(-Math.pow((v.y+.17)/.15,2));v.z+=.16*m;v.x*=1-.25*m;   // short cub muzzle
  const ch=smooth(.26,.5,Math.abs(v.x))*smooth(.05,-.25,v.y);if(ch>0)v.multiplyScalar(1+ch*.1*fluff(v,1.4,6));   // fluffy cheeks
 });
 attrs(headG,(v,c)=>{const muzzle=smooth(-.06,-.16,v.y)*smooth(.1,.3,v.z);const cheek=smooth(.24,.42,Math.abs(v.x))*smooth(.0,-.16,v.y);const brow=smooth(.2,.45,v.y)*.15;
  mix(O,OL,smooth(.1,.45,v.z)*.35+brow,c);c.lerp(W,Math.max(muzzle,cheek));
  let f=1;EYE.forEach(([ex,ey])=>{const d=Math.hypot(v.x-ex,v.y-ey);f=Math.min(f,smooth(.15,.22,d));});      // no fur over the eyes
  f=Math.min(f,smooth(.06,.14,Math.hypot(v.x,v.y+.12)+(v.z<.3?1:0)));                                    // or the nose
  return f*(.55+.9*Math.max(cheek,0)+.25*smooth(.2,.4,v.y)-.35*muzzle);});
 head.add(furry(headG,.055,[11,5.5],new THREE.Vector3(0,-.3,-.35)));
 const nose=new THREE.Mesh(sculpt(new THREE.SphereGeometry(.058,32,24),v=>{v.y*=.72;v.x*=1.25;if(v.y<0)v.x*=1+v.y*4;}),std(0x120806,{roughness:.22}));nose.position.set(0,-.12,.62);head.add(nose);
 /* eyes: big, round and watery */
 const T=512,irisC=document.createElement('canvas');irisC.width=irisC.height=T;{const x=irisC.getContext('2d'),c=T/2;x.beginPath();x.arc(c,c,c,0,Math.PI*2);x.clip();
  const base=x.createLinearGradient(0,0,0,T);base.addColorStop(0,'#160a04');base.addColorStop(.45,'#3e1f0d');base.addColorStop(.82,'#94551f');base.addColorStop(1,'#d89750');x.fillStyle=base;x.fillRect(0,0,T,T);
  for(let i=0;i<160;i++){const a=Math.random()*Math.PI*2,r1=c*.45,r2=c*(.8+Math.random()*.16);x.strokeStyle=`rgba(${200+Math.random()*55|0},${130+Math.random()*60|0},${60+Math.random()*40|0},${.1+Math.random()*.16})`;x.lineWidth=2+Math.random()*3;x.beginPath();x.moveTo(c+Math.cos(a)*r1,c+Math.sin(a)*r1);x.lineTo(c+Math.cos(a)*r2,c+Math.sin(a)*r2);x.stroke();}
  const pupil=x.createRadialGradient(c,c*.95,0,c,c*.95,c*.55);pupil.addColorStop(0,'#000');pupil.addColorStop(.82,'#050201');pupil.addColorStop(1,'rgba(5,2,1,0)');x.fillStyle=pupil;x.beginPath();x.arc(c,c*.95,c*.55,0,Math.PI*2);x.fill();
  const rim=x.createRadialGradient(c,c,c*.8,c,c,c);rim.addColorStop(0,'rgba(0,0,0,0)');rim.addColorStop(1,'rgba(8,3,1,.95)');x.fillStyle=rim;x.fillRect(0,0,T,T);
  const pool=x.createRadialGradient(c,T*.95,4,c,T*.95,c*.8);pool.addColorStop(0,'rgba(255,210,150,.7)');pool.addColorStop(1,'rgba(255,210,150,0)');x.fillStyle=pool;x.fillRect(0,0,T,T);}
 const shineC=document.createElement('canvas');shineC.width=shineC.height=T;{const x=shineC.getContext('2d'),c=T/2;
  const blob=(px,py,r,a=1)=>{const g=x.createRadialGradient(px,py,0,px,py,r);g.addColorStop(0,`rgba(255,255,255,${a})`);g.addColorStop(.72,`rgba(255,255,255,${a})`);g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.beginPath();x.arc(px,py,r,0,Math.PI*2);x.fill();};
  blob(c*.64,c*.58,c*.27);blob(c*1.36,c*1.3,c*.12,.9);blob(c*1.2,c*.46,c*.06,.85);
  x.strokeStyle='rgba(255,255,255,.45)';x.lineWidth=c*.05;x.lineCap='round';x.beginPath();x.arc(c,c*1.02,c*.74,Math.PI*.22,Math.PI*.78);x.stroke();}
 const irisT=new THREE.CanvasTexture(irisC),shineT=new THREE.CanvasTexture(shineC);irisT.encoding=shineT.encoding=THREE.sRGBEncoding;
 const eyes=[],shines=[];EYE.forEach(([x,y,z])=>{const s=Math.sign(x),e=new THREE.Group();e.position.set(x,y,z);e.rotation.y=s*.3;
  const ball=new THREE.Mesh(sculpt(new THREE.SphereGeometry(.13,48,36),v=>{v.z*=.55;}),std(0x0b0503,{roughness:.08}));
  const iris=new THREE.Mesh(new THREE.CircleGeometry(.122,64),new THREE.MeshBasicMaterial({map:irisT,transparent:true,toneMapped:false}));iris.position.z=.068;iris.renderOrder=40;
  const shine=new THREE.Mesh(new THREE.CircleGeometry(.122,64),new THREE.MeshBasicMaterial({map:shineT,transparent:true,depthWrite:false,toneMapped:false}));shine.position.z=.073;shine.renderOrder=41;
  e.add(ball,iris,shine);head.add(e);eyes.push(e);shines.push(shine);});parts.eyes=eyes;parts.eyeShine=shines;
 /* ears: orange outside, dark brown back and rims, white fluffy insides */
 const ears=[];[-1,1].forEach(s=>{const e=new THREE.Group();e.position.set(s*.27,.36,-.02);e.rotation.z=-s*.36;e.rotation.x=-.1;
  const outerG=sculpt(new THREE.ConeGeometry(.21,.52,40,10,true),v=>{v.z*=.5;});
  attrs(outerG,(v,c)=>{const back=smooth(.0,-.06,v.z),tip=smooth(.1,.22,v.y);mix(O,DB,Math.max(back*.9,tip),c);return .35;});
  const outer=furry(outerG,.03,[3,4]);outer.position.y=.21;e.add(outer);
  const innerG=sculpt(new THREE.ConeGeometry(.15,.42,32,8),v=>{v.z*=.28;});attrs(innerG,(v,c)=>{c.copy(W);return 1.6;});
  const inner=furry(innerG,.05,[3,4],new THREE.Vector3(0,.2,.4));inner.position.set(0,.14,.075);inner.scale.setScalar(.78);e.add(inner);
  head.add(e);ears.push(e);});parts.ears=ears;

 /* ---------- tails ---------- */
 function tailGeometry(){
  const pts=[new THREE.Vector3(0,0,0),new THREE.Vector3(0,.28,-.26),new THREE.Vector3(0,.72,-.36),new THREE.Vector3(0,1.08,-.18),new THREE.Vector3(0,1.24,.08)];
  const curve=new THREE.CatmullRomCurve3(pts),seg=36,rad=14,pos=[],uv=[],idx=[],col=[],fl=[],c=new THREE.Color(),fr=curve.computeFrenetFrames(seg,false);
  for(let i=0;i<=seg;i++){const s=i/seg,p=curve.getPointAt(s),N=fr.normals[i],B=fr.binormals[i];
   const r=s>=1?.0:(.06+.17*Math.pow(Math.sin(Math.PI*Math.min(1,s*1.03)),.7));
   for(let j=0;j<=rad;j++){const a=j/rad*Math.PI*2,cx=Math.cos(a),sy=Math.sin(a);
    pos.push(p.x+r*(cx*N.x+sy*B.x),p.y+r*(cx*N.y+sy*B.y),p.z+r*(cx*N.z+sy*B.z));uv.push(j/rad,s);
    mix(O,OL,.3*Math.sin(Math.PI*s),c);c.lerp(OD,smooth(.15,0,s)*.5);c.lerp(W,smooth(.76,.86,s));col.push(c.r,c.g,c.b);fl.push(.6+.8*Math.sin(Math.PI*Math.min(1,s*1.1)));}}
  for(let i=0;i<seg;i++)for(let j=0;j<rad;j++){const a=i*(rad+1)+j,b=a+rad+1;idx.push(a,a+1,b,b,a+1,b+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setAttribute('furLen',new THREE.Float32BufferAttribute(fl,1));g.setIndex(idx);g.computeVertexNormals();return g;}
 const tailGeo=tailGeometry();
 const tailRoot=new THREE.Group();tailRoot.position.set(0,.3,-.42);tailRoot.scale.setScalar(1.25);fox.add(tailRoot);
 const tails=[];for(let i=0;i<9;i++){const t=furry(tailGeo,.085,[5,9],new THREE.Vector3(0,.1,-.3));const pivot=new THREE.Group();pivot.add(t);pivot.visible=false;pivot.userData.grow=1;tailRoot.add(pivot);tails.push(pivot);}
 /* Buddy's own touch: a small teal leaf mark */
 const leaf=new THREE.Mesh(sculpt(new THREE.SphereGeometry(.04,20,14),v=>{v.x*=.6;v.y*=1.5;v.z*=.3;}),std(0x3CC7B4,{emissive:0x1d7a6e,emissiveIntensity:.5,roughness:.4}));leaf.position.set(0,.3,.43);leaf.rotation.x=-.6;head.add(leaf);

 /* ---------- accessories ---------- */
 const acc={};
 acc.scarf=new THREE.Group();{const sc=new THREE.Mesh(new THREE.TorusGeometry(.31,.08,18,48),std(0x2F6FB0,{roughness:.85}));sc.rotation.x=Math.PI/2;acc.scarf.add(sc);const end=new THREE.Mesh(new THREE.BoxGeometry(.14,.32,.05),std(0x2F6FB0,{roughness:.85}));end.position.set(.18,-.18,.27);end.rotation.z=.25;acc.scarf.add(end);acc.scarf.position.set(0,1.1,.12);}
 acc.bell=new THREE.Group();{const c2=new THREE.Mesh(new THREE.TorusGeometry(.3,.028,12,48),std(0xC23B3B));c2.rotation.x=Math.PI/2;acc.bell.add(c2);const b=new THREE.Mesh(new THREE.SphereGeometry(.07,32,24),std(0xF2C94C,{metalness:.8,roughness:.25}));b.position.set(0,-.08,.3);acc.bell.add(b);acc.bell.position.set(0,1.1,.12);}
 acc.crown=new THREE.Group();for(let i=0;i<11;i++){const a=i/11*Math.PI*2;const f=new THREE.Mesh(new THREE.SphereGeometry(.052,20,14),std(i%2?0xF7A8C4:0xFFFFFF));f.position.set(Math.cos(a)*.3,0,Math.sin(a)*.3);acc.crown.add(f);}acc.crown.position.set(0,.4,-.02);head.add(acc.crown);
 acc.hat=new THREE.Group();{const m=std(0x1f1f1f);const brim=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.03,40),m);const top=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,.32,40),m);top.position.y=.17;const band=new THREE.Mesh(new THREE.CylinderGeometry(.185,.185,.06,40),std(0x3CC7B4));band.position.y=.05;acc.hat.add(brim,top,band);acc.hat.position.set(0,.48,-.04);head.add(acc.hat);}
 fox.add(acc.scarf,acc.bell);Object.values(acc).forEach(a=>a.visible=false);parts.acc=acc;
 parts.shellGroups=shellGroups;parts.light=light;
 return {fox,parts,tails};
}
if(typeof module==='object'&&module.exports)module.exports={buildFoxModel};
