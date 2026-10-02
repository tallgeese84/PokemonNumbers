/* English check for a pre-reader. Seven short sections, easiest first, each stopping
   early after a run of misses, so a child who is not reading yet spends a few minutes
   on listening games and never sees a page of words he cannot read.
   One try per item, no help, no fading. Results give a skill profile and a start point. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./reading-data.js'),require('./reading-core.js'));else root.PokeReadingAssess=factory(root.PokeReadingData,root.PokeReadingCore);})(typeof globalThis!=='undefined'?globalThis:this,function(D,R){
'use strict';
const {ART}=D,clean=R.clean;
const shuffle=(a,rnd)=>{const b=a.slice();for(let i=b.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;};
/* Order letters are taught in (route order), so "how far through" is meaningful. */
const LETTERS=['s','a','t','p','i','n','m','d','g','o','c','k','e','u','r','h','b','f','l','j','v','w','x','y','z'];
const SAME_SOUND={c:['k'],k:['c']};
const RHYMES=D.RHYMES;
const VOCAB=['dog','cat','sun','bus','fish','cake','tree','car','duck','hat','moon','bed','fox','cup','star','boat','frog','bell'];
const TRICKY=['the','I','a','is','to','go','he','was','my','you','said','we'];
const SECTIONS=[
 {id:'vocab', label:'Understands spoken words', max:4, stop:2, intro:'Listen and tap the picture.'},
 {id:'rhyme', label:'Hears rhymes', max:5, stop:3, intro:'Now find the words that rhyme. Rhymes sound the same at the end, like cat and hat.'},
 {id:'first', label:'Hears the first sound in a word', max:6, stop:3, intro:'Now listen for the first sound.'},
 {id:'blend', label:'Blends sounds into a word (by ear)', max:6, stop:3, intro:'I will say a word in little sounds. Find the picture.'},
 {id:'letters', label:'Letter sounds', max:LETTERS.length, stop:4, intro:'Listen to the sound. Tap the letter that makes it.'},
 {id:'words', label:'Reads short words', max:6, stop:3, intro:'Now read the word and find its picture.'},
 {id:'tricky', label:'Tricky words', max:6, stop:3, intro:'Last one! Listen and tap the word.'}
];
const BY=Object.fromEntries(SECTIONS.map(s=>[s.id,s]));
const firstSound=w=>R.splitWord(w)[0];

class Assess{
 constructor(rnd=Math.random){this.rnd=rnd;this.sec=0;this.res=Object.fromEntries(SECTIONS.map(s=>[s.id,{ok:0,n:0,run:0,done:false,skipped:false,items:[]}]));this.used=new Set();this.cur=null;this.known=[];}
 section(){return SECTIONS[this.sec];}
 /* Should this section run at all, given what came before? */
 eligible(id){
  const r=this.res;
  if(id==='letters')return true;                                     // always worth knowing
  if(id==='words'){const v=this.known.filter(g=>'aeiou'.includes(g));return this.known.length>=5&&v.length>=1&&this.decodable().length>=3;}
  if(id==='tricky')return r.words.ok>=3;
  return true;
 }
 decodable(){const k=new Set(this.known);return D.ROUTES.slice(0,6).flatMap(L=>[...L.blend,...L.build]).map(clean).filter((w,i,a)=>a.indexOf(w)===i&&ART[w]&&R.splitWord(w).every(p=>k.has(p.g)));}
 finished(id){const s=BY[id],r=this.res[id];
  if(r.n>=s.max)return true;
  if(r.run>=s.stop)return true;
  if(id==='letters'&&r.n===8&&r.ok<4)return true;                   // most early letters unknown: no need to try all 26
  if(id==='words'&&r.n>=this.decodable().length)return true;
  return false;}
 next(){
  while(this.sec<SECTIONS.length){const s=SECTIONS[this.sec];const r=this.res[s.id];
   if(!r.n&&!this.eligible(s.id)){r.skipped=true;this.sec++;continue;}
   if(this.finished(s.id)){r.done=true;this.sec++;continue;}
   const it=this.make(s.id,r.n);if(!it){r.done=true;this.sec++;continue;}
   it.section=s.id;it.first=r.n===0;it.intro=r.n===0?s.intro:null;it.route=1;it.placement=true;this.cur=it;return it;}
  return null;
 }
 record(ok){const it=this.cur;if(!it)return;const r=this.res[it.section];r.n++;r.items.push({item:it.item,ok:!!ok});
  if(ok){r.ok++;r.run=0;if(it.section==='letters')this.known.push(it.target);}else r.run++;this.cur=null;}
 pick(pool){const p=shuffle(pool.filter(x=>!this.used.has(x)),this.rnd);const w=p[0]??pool[0];this.used.add(w);return w;}
 make(id,k){
  const rnd=this.rnd;
  if(id==='vocab'){const w=this.pick(VOCAB);const others=shuffle(VOCAB.filter(x=>x!==w&&ART[x]!==ART[w]),rnd).slice(0,2);
   return {kind:'vocab',item:'pa:vocab',word:w,options:shuffle([w,...others],rnd).map(x=>({w:x,e:ART[x]})),answer:w};}
  if(id==='rhyme'){const sets=shuffle(RHYMES.filter(s=>!this.used.has(s[0])),rnd);const set=sets[0]||RHYMES[0];this.used.add(set[0]);const [target,match]=shuffle(set,rnd);
   const others=shuffle(RHYMES.filter(s=>s!==set).flat().filter(x=>ART[x]&&firstSound(x).g!==firstSound(match).g),rnd).filter((x,i,a)=>a.findIndex(y=>RHYMES.findIndex(s=>s.includes(y))===RHYMES.findIndex(s=>s.includes(x)))===i).slice(0,2);
   return {kind:'rhyme',item:'pa:rhyme',word:target,e:ART[target],options:shuffle([match,...others],rnd).map(x=>({w:x,e:ART[x]})),answer:match};}
  if(id==='first'){const pool=D.EARS.filter(w=>ART[w]&&R.splitWord(w)[0].g.length===1);const w=this.pick(pool);const f=firstSound(w).g;
   const others=shuffle(pool.filter(x=>x!==w&&firstSound(x).g!==f&&ART[x]!==ART[w]),rnd).filter((x,i,a)=>a.findIndex(y=>firstSound(y).g===firstSound(x).g)===i).slice(0,2);
   return {kind:'first',item:'pa:first',word:w,parts:R.splitWord(w),options:shuffle([w,...others],rnd).map(x=>({w:x,e:ART[x]})),answer:w};}
  if(id==='blend'){const pool=D.EARS.filter(w=>ART[w]&&R.splitWord(w).length<=(k<3?3:4));const w=this.pick(pool);
   const others=shuffle(pool.filter(x=>x!==w&&ART[x]!==ART[w]),rnd).sort((a,b)=>(firstSound(b).g===firstSound(w).g)-(firstSound(a).g===firstSound(w).g)).slice(0,2);
   return {kind:'blend',item:'pa:blend',word:w,parts:R.splitWord(w),options:shuffle([w,...others],rnd).map(x=>({w:x,e:ART[x]})),answer:w};}
  if(id==='letters'){const g=LETTERS[k];if(!g)return null;
   const near=(D.CONFUSE[g]||[]).filter(x=>!(SAME_SOUND[g]||[]).includes(x));const rest=LETTERS.filter(x=>x!==g&&!near.includes(x)&&!(SAME_SOUND[g]||[]).includes(x));
   const others=[...shuffle(near,rnd).slice(0,1),...shuffle(rest,rnd)].slice(0,3);
   return {kind:'hunt',item:R.keys.gKey(g),target:g,options:shuffle([g,...others],rnd),answer:g};}
  if(id==='words'){const pool=this.decodable();const w=this.pick(pool);if(!w)return null;
   const near=R.nearWords(w,6,6,rnd).filter(x=>ART[clean(x)]).slice(0,2);
   return {kind:'read',item:R.keys.wKey(w),word:w,parts:R.splitWord(w,6),options:shuffle([w,...near],rnd).map(x=>({w:x,e:ART[clean(x)]})),answer:w};}
  if(id==='tricky'){const w=TRICKY[k];if(!w)return null;const others=shuffle(TRICKY.filter(x=>x!==w),rnd).sort((a,b)=>(b[0]===w[0])-(a[0]===w[0])).slice(0,2);
   return {kind:'heart',item:R.keys.hKey(w),word:w,options:shuffle([w,...others],rnd),answer:w};}
  return null;
 }
 result(){return profile(this.res,this.known);}
 progress(){return {section:Math.min(this.sec,SECTIONS.length-1),sections:SECTIONS.length};}
}
/* Turn raw results into a profile, a level and where to start. */
function profile(res,known){
 const pct=r=>r.n?r.ok/r.n:null;
 const k=new Set(known);
 // Routes whose sounds are all known and whose words he could read
 let passed=0;
 if(res.words.ok>=3)for(const L of D.ROUTES.slice(0,5)){if(R.graphemesUpTo(L.n).filter(g=>g.length===1).every(g=>k.has(g)))passed=L.n;else break;}
 const listening=['rhyme','first','blend'].map(id=>pct(res[id])??0);
 const pre=known.length<4||(pct(res.blend)??0)<.5;
 const level=pre?{id:'explorer',name:'Sound explorer',what:'Building listening skills and his first letter sounds before reading words.'}
  :res.words.ok<3?{id:'letters',name:'Letter learner',what:'Knows some letter sounds; next is blending them into short words.'}
  :res.tricky.ok>=4&&res.words.ok>=5?{id:'reader',name:'Confident beginner reader',what:'Reads short words and some tricky words; starts further along the routes.'}
  :{id:'words',name:'Word blender',what:'Reads some short words; practises blending and adds tricky words.'};
 const rows=SECTIONS.map(s=>{const r=res[s.id];return {id:s.id,label:s.label,ok:r.ok,n:r.n,skipped:r.skipped,stoppedEarly:r.n<s.max&&r.run>=s.stop};});
 const missingFirst=D.ROUTES[0].add.filter(g=>!k.has(g));
 return {at:Date.now(),known:[...known],passed,pre,level,rows,listening,missingFirst};
}
return {SECTIONS,LETTERS,RHYMES,Assess,profile};
});
