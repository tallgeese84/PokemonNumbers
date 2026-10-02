/* Buddy: "Fox" by pxltiger (https://sketchfab.com/3d-models/fox-39f97fe58f0b47ce80b6e02814001dd7),
   licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Used as made, with its
   hand-painted 2k texture and animations; the only addition is optional accessories. */
function loadFoxModel(THREE,url){
 'use strict';
 return new Promise((resolve,reject)=>new THREE.GLTFLoader().load(url,gltf=>{
  const HEIGHT=1.62;                                   // ear tip height in scene units
  const fox=new THREE.Group(),inner=gltf.scene;fox.add(inner);
  let mesh=null;inner.traverse(o=>{if(o.isSkinnedMesh)mesh=o;if(o.isMesh){o.frustumCulled=false;}});
  const mat=mesh.material;mat.roughness=.6;mat.metalness=0;if(mat.map){mat.map.anisotropy=8;}if(mat.normalMap)mat.normalMap.anisotropy=8;mesh.castShadow=true;
  const bones=Object.fromEntries(mesh.skeleton.bones.map(b=>[b.name.replace(/_\d+$/,''),b]));
  // scale by the ear tip in the rest pose so the fox is a known size
  inner.updateMatrixWorld(true);const w=new THREE.Vector3();bones.Fox_LEar2.getWorldPosition(w);
  const s=HEIGHT/w.y;inner.scale.multiplyScalar(s);inner.updateMatrixWorld(true);

  /* ---- animations ---- */
  const mixer=new THREE.AnimationMixer(inner);const clips=Object.fromEntries(gltf.animations.map(c=>[c.name,c]));
  const act=n=>clips[n]?mixer.clipAction(clips[n]):null;
  const idle=act('Fox_Idle');idle.play();let current=idle;
  function play(name,{once=true,fade=.25}={}){const a=act(name);if(!a||a===current)return;a.reset();a.setLoop(once?THREE.LoopOnce:THREE.LoopRepeat);a.clampWhenFinished=true;
   current.crossFadeTo(a,fade,false);a.play();current=a;
   if(once){const back=e=>{if(e.action!==a)return;mixer.removeEventListener('finished',back);if(current===a){idle.reset().play();a.crossFadeTo(idle,.35,false);current=idle;}};mixer.addEventListener('finished',back);}}

  /* ---- accessories he can wear, fixed to the head and chest (hidden unless bought) ---- */
  const std=(c,o={})=>new THREE.MeshStandardMaterial({roughness:.6,...o,color:new THREE.Color(c).convertSRGBToLinear(),...(o.emissive!==undefined?{emissive:new THREE.Color(o.emissive).convertSRGBToLinear()}:{})});
  const at=(bone,obj,x,y,z)=>{obj.position.set(x*s,y*s,z*s);fox.add(obj);fox.updateMatrixWorld(true);bone.attach(obj);};
  const acc={};
  acc.crown=new THREE.Group();for(let i=0;i<11;i++){const a=i/11*Math.PI*2,f=new THREE.Mesh(new THREE.SphereGeometry(.035,18,12),std(i%2?0xF7A8C4:0xFFFFFF));f.position.set(Math.cos(a)*.2,0,Math.sin(a)*.2);acc.crown.add(f);}acc.crown.scale.setScalar(1.15);at(bones.Fox_Head,acc.crown,0,14.3,5.0);
  acc.hat=new THREE.Group();{const m=std(0x1f1f1f),b=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.02,40),m),t=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.22,40),m),band=new THREE.Mesh(new THREE.CylinderGeometry(.124,.124,.04,40),std(0x3CC7B4));t.position.y=.12;band.position.y=.04;acc.hat.add(b,t,band);}acc.hat.scale.setScalar(1.35);at(bones.Fox_Head,acc.hat,0,14.2,4.6);
  acc.scarf=new THREE.Group();{const sc=new THREE.Mesh(new THREE.TorusGeometry(.3,.07,16,48),std(0x2F6FB0,{roughness:.85}));sc.rotation.x=Math.PI/2+.5;acc.scarf.add(sc);const e=new THREE.Mesh(new THREE.BoxGeometry(.09,.22,.035),std(0x2F6FB0,{roughness:.85}));e.position.set(.14,-.2,.26);e.rotation.z=.25;acc.scarf.add(e);}at(bones.Fox_Spine,acc.scarf,0,9.0,4.9);
  acc.bell=new THREE.Group();{const c=new THREE.Mesh(new THREE.TorusGeometry(.29,.022,10,48),std(0xC23B3B));c.rotation.x=Math.PI/2+.5;acc.bell.add(c);const b=new THREE.Mesh(new THREE.SphereGeometry(.045,28,20),std(0xF2C94C,{metalness:.8,roughness:.25}));b.scale.setScalar(1.4);b.position.set(0,-.17,.3);acc.bell.add(b);}at(bones.Fox_Spine,acc.bell,0,9.0,4.9);
  Object.values(acc).forEach(a=>a.visible=false);

  function update(dt){mixer.update(dt);}
  resolve({fox,parts:{acc,head:bones.Fox_Head},play,update,mixer,clips:Object.keys(clips)});
 },undefined,reject));
}
if(typeof module==='object'&&module.exports)module.exports={loadFoxModel};
