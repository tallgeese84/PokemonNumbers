/* Buddy's 3D model: a natural red-fox colouring (orange coat, white chest, muzzle and
   tail tips, dark "stockings" and ear backs) on a friendly cub shape. Smooth sculpted
   geometry, procedural fur texture, and shell fur (layered offset surfaces with an
   alpha-tested fur pattern) for a soft, fluffy look. Original design; no external assets. */
function buildFoxModel(THREE,opts){
 'use strict';opts=opts||{};
 const COL={orange:0xE8661C,orangeL:0xF59A45,white:0xFFF6EA,dark:0x2C1B14,ear:0xF3B9A0,nose:0x1C1210,iris:'#3d2312'};
 const lin=h=>new THREE.Color(h).convertSRGBToLinear();
 const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
 const SHELLS=opts.shells??8,FUR=opts.fur??.035;

 /* ---------- procedural textures ---------- */
 function furTextures(){
  const n=512,c=document.createElement('canvas');c.width=c.height=n;const x=c.getContext('2d');
  x.fillStyle='#000';x.fillRect(0,0,n,n);
  // strand density: thousands of soft dots of varying brightness = hair roots
  for(let i=0;i<60000;i++){const px=Math.random()*n,py=Math.random()*n,v=Math.floor(110+Math.random()*145);x.fillStyle=`rgb(${v},${v},${v})`;x.fillRect(px,py,1.2,1.2);}
  const alpha=new THREE.CanvasTexture(c);alpha.wrapS=alpha.wrapT=THREE.RepeatWrapping;
  // directional strokes for the base coat bump
  const b=document.createElement('canvas');b.width=b.height=n;const y=b.getContext('2d');y.fillStyle='#808080';y.fillRect(0,0,n,n);
  for(let i=0;i<9000;i++){const px=Math.random()*n,py=Math.random()*n,l=4+Math.random()*10,v=Math.floor(90+Math.random()*120);y.strokeStyle=`rgb(${v},${v},${v})`;y.lineWidth=.8+Math.random();y.beginPath();y.moveTo(px,py);y.lineTo(px+(Math.random()-.5)*2,py+l);y.stroke();}
  const bump=new THREE.CanvasTexture(b);bump.wrapS=bump.wrapT=THREE.RepeatWrapping;
  // colour map: soft light and dark strands, multiplied over the vertex colours
  const m=document.createElement('canvas');m.width=m.height=n;const z=m.getContext('2d');z.fillStyle='#f2f2f2';z.fillRect(0,0,n,n);
  for(let i=0;i<14000;i++){const px=Math.random()*n,py=Math.random()*n,l=5+Math.random()*12,v=Math.floor(200+Math.random()*55);z.strokeStyle=`rgba(${v},${v},${v},.8)`;z.lineWidth=1+Math.random()*1.2;z.beginPath();z.moveTo(px,py);z.quadraticCurveTo(px+(Math.random()-.5)*4,py+l/2,px+(Math.random()-.5)*3,py+l);z.stroke();}
  const map=new THREE.CanvasTexture(m);map.wrapS=map.wrapT=THREE.RepeatWrapping;map.encoding=THREE.sRGBEncoding;
  return {alpha,bump,map};
 }
 const TEX=furTextures();
 function coat(repeat=4){const t=TEX.bump.clone();t.needsUpdate=true;t.repeat.set(repeat,repeat);const c=TEX.map.clone();c.needsUpdate=true;c.repeat.set(repeat,repeat);
  return new THREE.MeshStandardMaterial({vertexColors:true,map:c,roughness:.9,metalness:0,bumpMap:t,bumpScale:.02});}
 /* One fur shell: the same surface pushed out along its normals, keeping only hair pixels. */
 function shellMat(k,repeat){
  const a=TEX.alpha.clone();a.needsUpdate=true;a.repeat.set(repeat,repeat);
  const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0,alphaMap:a,alphaTest:.42+.5*(k/SHELLS),side:THREE.FrontSide});
  const off=FUR*k/SHELLS,shade=.82+.16*(k/SHELLS);m.color=new THREE.Color(shade,shade,shade);
  // The offset is a uniform: every layer shares one shader program but sits at its own height.
  m.userData.shellOff={value:off};
  m.onBeforeCompile=sh=>{sh.uniforms.shellOff=m.userData.shellOff;sh.vertexShader='uniform float shellOff;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n transformed += normal * shellOff;\n transformed.y -= shellOff*shellOff*6.0;');};
  m.customProgramCacheKey=()=>'fox-shell';
  return m;
 }
 function furry(geo,repeat,castShadow=true){
  const g=new THREE.Group();const base=new THREE.Mesh(geo,coat(repeat));base.castShadow=castShadow;base.receiveShadow=true;g.add(base);
  const shells=[];for(let k=1;k<=SHELLS;k++){const s=new THREE.Mesh(geo,shellMat(k,repeat));s.renderOrder=k;g.add(s);shells.push(s);}
  g.userData.shells=shells;return g;
 }
 function colorize(geo,fn){const p=geo.attributes.position,c=new Float32Array(p.count*3),v=new THREE.Vector3(),col=new THREE.Color();
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);fn(v,col,i);c[i*3]=col.r;c[i*3+1]=col.g;c[i*3+2]=col.b;}geo.setAttribute('color',new THREE.BufferAttribute(c,3));return geo;}
 function sculpt(geo,fn){const p=geo.attributes.position,v=new THREE.Vector3();for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);fn(v);p.setXYZ(i,v.x,v.y,v.z);}geo.computeVertexNormals();return geo;}
 const O=lin(COL.orange),OL=lin(COL.orangeL),W=lin(COL.white),D=lin(COL.dark);
 const mix=(a,b,t,out)=>out.copy(a).lerp(b,t);

 const fox=new THREE.Group(),parts={};
 /* ---------- body ---------- */
 const bodyG=sculpt(new THREE.SphereGeometry(1,72,54),v=>{
  v.x*=.5;v.y*=.46;v.z*=.74;
  if(v.z>0&&v.y<.1)v.z+=.06*smooth(0,.6,v.z/.74);       // chest
  v.y+=.04*Math.cos(v.z*3);                               // gentle back line
 });
 colorize(bodyG,(v,c)=>{const chest=smooth(.15,.45,v.z)*smooth(.15,-.25,v.y);const belly=smooth(-.2,-.42,v.y)*.85;mix(O,OL,smooth(.3,-.1,v.y)*.25,c);c.lerp(W,Math.max(chest,belly));});
 const body=furry(bodyG,5);body.position.y=.66;const bodyWrap=new THREE.Group();bodyWrap.add(body);fox.add(bodyWrap);parts.body=bodyWrap;
 /* ---------- legs with dark stockings ---------- */
 [[-.25,.42],[.25,.42],[-.25,-.42],[.25,-.42]].forEach(([x,z])=>{
  const g=colorize(new THREE.CylinderGeometry(.13,.095,.5,28,10,false),(v,c)=>mix(D,O,smooth(-.05,.2,v.y),c));
  const leg=new THREE.Mesh(g,coat(2));leg.position.set(x,.28,z);leg.castShadow=true;bodyWrap.add(leg);
  const paw=new THREE.Mesh(colorize(sculpt(new THREE.SphereGeometry(.12,28,20),v=>{v.y*=.62;v.z*=1.25;}),(v,c)=>c.copy(D)),coat(2));paw.position.set(x,.06,z+.04);paw.castShadow=true;bodyWrap.add(paw);
 });
 /* ---------- head ---------- */
 const head=new THREE.Group();head.position.set(0,1.14,.5);fox.add(head);parts.head=head;
 const headG=sculpt(new THREE.SphereGeometry(.47,80,60),v=>{
  const z=Math.max(0,v.z/.47),f=Math.pow(z,2.2)*Math.exp(-Math.pow((v.y+.11)/.2,2));
  v.z+=.36*f;v.y-=.04*f;v.x*=1-.42*f;                    // muzzle
  if(Math.abs(v.x)>.26&&v.y<.06){const s=Math.sign(v.x);v.x+=s*.09*smooth(.26,.44,Math.abs(v.x))*smooth(.06,-.18,v.y);}   // cheek ruff
  v.y*=1-.08*smooth(-.1,-.47,v.y);                       // flatter chin
 });
 colorize(headG,(v,c)=>{const lower=smooth(-.02,-.14,v.y)*smooth(-.05,.2,v.z+.02);const cheek=smooth(.22,.4,Math.abs(v.x))*smooth(.02,-.15,v.y);const brow=smooth(.15,.32,v.y)*smooth(.25,.4,v.z)*.0;
  mix(O,OL,smooth(-.1,.3,v.z)*.3,c);c.lerp(W,Math.min(1,Math.max(lower,cheek)));});
 const headFur=furry(headG,4);head.add(headFur);
 const nose=new THREE.Mesh(sculpt(new THREE.SphereGeometry(.07,32,24),v=>{v.y*=.78;v.x*=1.15;}),new THREE.MeshStandardMaterial({color:COL.nose,roughness:.28}));nose.position.set(0,-.08,.84);head.add(nose);
 /* eyes: glossy dark eye, warm brown iris, two highlights */
 const irisC=document.createElement('canvas');irisC.width=irisC.height=256;{const x=irisC.getContext('2d');const g=x.createRadialGradient(128,128,20,128,128,128);g.addColorStop(0,'#000');g.addColorStop(.42,'#0b0604');g.addColorStop(.55,COL.iris);g.addColorStop(.9,'#6b3a18');g.addColorStop(1,'#1a0d06');x.fillStyle=g;x.beginPath();x.arc(128,128,128,0,Math.PI*2);x.fill();
  x.fillStyle='#fff';x.beginPath();x.arc(88,82,30,0,Math.PI*2);x.fill();x.globalAlpha=.85;x.beginPath();x.arc(166,170,13,0,Math.PI*2);x.fill();}
 const irisT=new THREE.CanvasTexture(irisC);irisT.encoding=THREE.sRGBEncoding;
 const eyes=[];[-1,1].forEach(s=>{const e=new THREE.Group();e.position.set(s*.19,.07,.425);e.rotation.y=s*.34;
  const ball=new THREE.Mesh(sculpt(new THREE.SphereGeometry(.115,40,30),v=>{v.z*=.5;}),new THREE.MeshStandardMaterial({color:0x120a07,roughness:.08,metalness:.1}));
  const iris=new THREE.Mesh(new THREE.CircleGeometry(.108,48),new THREE.MeshBasicMaterial({map:irisT,transparent:true}));iris.position.z=.059;iris.renderOrder=20;
  e.add(ball,iris);head.add(e);eyes.push(e);});parts.eyes=eyes;
 /* ears: orange front, dark back, soft pink inner */
 const ears=[];[-1,1].forEach(s=>{const e=new THREE.Group();e.position.set(s*.25,.32,-.04);e.rotation.z=-s*.28;e.rotation.x=-.08;
  const outerG=colorize(sculpt(new THREE.ConeGeometry(.2,.5,40,8),v=>{v.z*=.55;v.z-=.04*Math.pow((v.y+.25)/.5,2);}),(v,c)=>{const back=smooth(-.01,-.06,v.z);mix(O,D,Math.max(back*smooth(-.1,.1,v.y),smooth(.12,.22,v.y)),c);});
  const outer=furry(outerG,2,true);outer.position.y=.2;e.add(outer);
  const inner=new THREE.Mesh(sculpt(new THREE.ConeGeometry(.12,.34,32,6),v=>{v.z*=.3;}),new THREE.MeshStandardMaterial({color:COL.ear,roughness:.9}));inner.position.set(0,.16,.06);e.add(inner);
  head.add(e);ears.push(e);});parts.ears=ears;
 /* ---------- tails: smooth tapered tubes, white tips, shell fur ---------- */
 function tailGeometry(){
  const pts=[new THREE.Vector3(0,0,0),new THREE.Vector3(0,.25,-.28),new THREE.Vector3(0,.72,-.48),new THREE.Vector3(0,1.15,-.36),new THREE.Vector3(0,1.42,-.1)];
  const curve=new THREE.CatmullRomCurve3(pts),seg=64,rad=24,pos=[],uv=[],idx=[],col=[],c=new THREE.Color();
  const frames=curve.computeFrenetFrames(seg,false);
  for(let i=0;i<=seg;i++){const s=i/seg,p=curve.getPointAt(s),N=frames.normals[i],B=frames.binormals[i];
   const r=s>=1?0:(.06+.2*Math.pow(Math.sin(Math.PI*Math.min(1,s*1.02)),.7))*(1-.15*s)+.0;
   for(let j=0;j<=rad;j++){const a=j/rad*Math.PI*2,cx=Math.cos(a),sy=Math.sin(a);
    pos.push(p.x+r*(cx*N.x+sy*B.x),p.y+r*(cx*N.y+sy*B.y),p.z+r*(cx*N.z+sy*B.z));uv.push(j/rad*2,s*6);
    mix(O,OL,.25*Math.sin(Math.PI*s),c);c.lerp(W,smooth(.74,.84,s));col.push(c.r,c.g,c.b);}}
  for(let i=0;i<seg;i++)for(let j=0;j<rad;j++){const a=i*(rad+1)+j,b=a+rad+1;idx.push(a,b,a+1,b,b+1,a+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();return g;
 }
 const tailGeo=tailGeometry();
 const tailRoot=new THREE.Group();tailRoot.position.set(0,.66,-.66);tailRoot.scale.setScalar(1.45);fox.add(tailRoot);parts.tailRoot=tailRoot;
 const tails=[];for(let i=0;i<9;i++){const t=furry(tailGeo,3,i<3);const pivot=new THREE.Group();pivot.add(t);pivot.visible=false;pivot.userData.grow=1;pivot.userData.shells=t.userData.shells;tailRoot.add(pivot);tails.push(pivot);}
 /* small leaf mark: Buddy's own touch */
 const leaf=new THREE.Mesh(sculpt(new THREE.SphereGeometry(.05,24,16),v=>{v.x*=.6;v.y*=1.5;v.z*=.3;}),new THREE.MeshStandardMaterial({color:0x3CC7B4,emissive:0x1d7a6e,emissiveIntensity:.5,roughness:.4}));leaf.position.set(0,.3,.36);leaf.rotation.x=-.5;head.add(leaf);
 /* ---------- accessories ---------- */
 const acc={},M=(c,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:.7,...o});
 acc.scarf=new THREE.Group();{const sc=new THREE.Mesh(new THREE.TorusGeometry(.33,.08,18,48),M(0x2F6FB0));sc.rotation.x=Math.PI/2;acc.scarf.add(sc);const end=new THREE.Mesh(new THREE.BoxGeometry(.14,.32,.05),M(0x2F6FB0));end.position.set(.18,-.18,.28);end.rotation.z=.25;acc.scarf.add(end);acc.scarf.position.set(0,1.0,.42);}
 acc.bell=new THREE.Group();{const col=new THREE.Mesh(new THREE.TorusGeometry(.32,.03,12,48),M(0xC23B3B));col.rotation.x=Math.PI/2;acc.bell.add(col);const b=new THREE.Mesh(new THREE.SphereGeometry(.075,32,24),M(0xF2C94C,{metalness:.8,roughness:.25}));b.position.set(0,-.08,.32);acc.bell.add(b);acc.bell.position.set(0,1.0,.42);}
 acc.crown=new THREE.Group();for(let i=0;i<11;i++){const a=i/11*Math.PI*2;const f=new THREE.Mesh(new THREE.SphereGeometry(.055,20,14),M(i%2?0xF7A8C4:0xFFFFFF));f.position.set(Math.cos(a)*.3,0,Math.sin(a)*.3);acc.crown.add(f);}acc.crown.position.set(0,.36,-.02);head.add(acc.crown);
 acc.hat=new THREE.Group();{const brim=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.03,40),M(0x1f1f1f));const top=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,.32,40),M(0x1f1f1f));top.position.y=.17;const band=new THREE.Mesh(new THREE.CylinderGeometry(.185,.185,.06,40),M(0x3CC7B4));band.position.y=.05;acc.hat.add(brim,top,band);acc.hat.position.set(0,.44,-.04);head.add(acc.hat);}
 fox.add(acc.scarf,acc.bell);Object.values(acc).forEach(a=>a.visible=false);parts.acc=acc;
 parts.shellGroups=[body,headFur,...tails].map(g=>g.userData.shells);
 return {fox,parts,tails};
}
if(typeof module==='object'&&module.exports)module.exports={buildFoxModel};
