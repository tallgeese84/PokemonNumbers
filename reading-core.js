/* Reading engine: segmentation, decodability, per-item mastery with spaced
   review, route gates, round building, placement and P1 readiness.
   Pure functions over the shared learning sessions (section 'read'). */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./reading-data.js'),require('./learning-core.js'));else root.PokeReadingCore=factory(root.PokeReadingData,root.PokeLearning);})(typeof globalThis!=='undefined'?globalThis:this,function(D,C){
'use strict';
const {G,LONG,VOWELS,MULTI,ART,ROUTES,DOLCH}=D;
const LAST=ROUTES.length, DAY=86400000;
const DOUBLES=['ll','ss','ff','zz'];
const route=n=>ROUTES[Math.max(1,Math.min(LAST,n))-1];
const clean=w=>String(w).replace(/[+·]/g,'');

/* ---------- what has been taught ---------- */
function graphemesUpTo(n){const out=[];for(let i=0;i<Math.min(n,LAST);i++)ROUTES[i].add.forEach(g=>{if(!out.includes(g))out.push(g);});return out;}
function heartUpTo(n){const out=[];for(let i=0;i<Math.min(n,LAST);i++)ROUTES[i].heart.forEach(h=>{if(!out.some(x=>x.w===h.w))out.push(h);});return out;}
const magicAt=n=>graphemesUpTo(n).some(g=>g.includes('_'));
const endsAt=n=>graphemesUpTo(n).includes('ed');
function singleLetters(n){return graphemesUpTo(n).filter(g=>g.length===1);}

/* ---------- segmentation ---------- */
function soundOf(g){return G[g]?G[g][0]:g;}
function classOf(g){const e=G[g];if(e&&e[3]==='vowel')return 'vowel';if(e&&e[3]==='end')return 'end';if(g.length>1)return 'team';return VOWELS.includes(g)?'vowel':'cons';}
function splitSyllable(w,taught,magic){
  let m=null;
  if(magic&&w.length>=3&&w.endsWith('e')){
    const stem=w.slice(0,-1);let vi=-1;
    for(let i=stem.length-1;i>=0;i--)if(VOWELS.includes(stem[i])){vi=i;break;}
    const tail=vi>=0?stem.slice(vi+1):'';
    const team=vi>0&&VOWELS.includes(stem[vi-1]);
    if(vi>=0&&!team&&(tail.length===1||(tail.length===2&&MULTI.includes(tail)))&&taught.includes(stem[vi]+'_e'))m={v:stem[vi],vi};
  }
  const parts=[];let i=0;
  while(i<w.length){
    if(m&&i===m.vi){parts.push({g:m.v,sound:LONG[m.v],cls:'vowel',magic:'start',play:m.v+'_e'});i++;continue;}
    if(m&&i===w.length-1){parts.push({g:'e',sound:null,cls:'silent',magic:'end'});i++;continue;}
    let hit=null;
    for(const g of MULTI){if(w.substr(i,g.length)===g&&taught.includes(g)){if(m&&i+g.length>w.length-1)continue;hit=g;break;}}
    if(hit){parts.push({g:hit,sound:soundOf(hit),cls:classOf(hit)});i+=hit.length;}
    else{const ch=w[i];parts.push({g:ch,sound:soundOf(ch),cls:classOf(ch)});i++;}
  }
  return parts;
}
const VOICELESS=['p','t','k','c','ck','f','ff','s','ss','sh','ch','th','x'];
/* Split a word as a child taught up to route n would sound it out. */
const OVERRIDE={away:'a·w·ay'};   // greedy matching would read "aw-ay"
function splitWord(word,n=LAST){
  const raw=OVERRIDE[String(word).toLowerCase()]||String(word);const taught=graphemesUpTo(n);const magic=magicAt(n);
  const [base,suf]=raw.toLowerCase().split('+');
  const syls=base.split('·');const parts=[];
  syls.forEach((s,k)=>{const p=splitSyllable(s.replace(/[^a-z]/g,''),taught,magic&&k===syls.length-1);if(k>0&&p[0])p[0].syl=true;parts.push(...p);});
  if(suf){
    const last=parts[parts.length-1]?.g;
    if(suf==='s')parts.push({g:'s',sound:VOICELESS.includes(last)?'sss':'zzz',cls:'end',play:VOICELESS.includes(last)?'s':'z',suffix:true});
    else if(suf==='ed'){const kind=['t','d'].includes(last)?'id':VOICELESS.includes(last)?'t':'d';parts.push({g:'ed',sound:kind==='id'?'id':kind==='t'?'tuh':'duh',cls:'end',play:kind==='id'?null:kind,suffix:true});}
    else parts.push({g:suf,sound:soundOf(suf),cls:'end',play:suf,suffix:true});
  }
  return parts;
}
/* Graphemes a word really uses (segmented with everything the app ever
   teaches) that are not taught by route n. [] means decodable at route n. */
const HEART_ROUTE={};ROUTES.forEach(L=>L.heart.forEach(h=>{const k=h.w.toLowerCase();if(!HEART_ROUTE[k])HEART_ROUTE[k]=L.n;}));
function missing(word,n){
  const taught=graphemesUpTo(n);
  return splitWord(word,LAST).filter(p=>p.cls!=='silent'&&!(p.suffix&&p.g==='s')).map(p=>p.magic==='start'?p.play:p.g).filter(g=>!taught.includes(g));
}
function tokenOK(token,n){
  const w=token.replace(/[^A-Za-z]/g,'');if(!w)return true;
  const lw=w.toLowerCase();
  const heart=heartUpTo(n).map(h=>h.w.toLowerCase());
  const names=ROUTES.slice(0,n).flatMap(r=>r.mons.map(m=>m.name.toLowerCase()));
  if(names.includes(lw))return true;
  if(HEART_ROUTE[lw])return HEART_ROUTE[lw]<=n;
  if(!missing(lw,n).length)return true;
  if(endsAt(n)){
    for(const suf of ['s','ed','ing']){
      if(lw.endsWith(suf)&&lw.length>suf.length+1){const base=lw.slice(0,-suf.length);if(heart.includes(base)||!missing(base,n).length||!missing(base+'e',n).length)return true;}
    }
  }
  return false;
}
/* Everything the child reads must be decodable or a taught heart word. */
function validate(){
  const problems=[];
  ROUTES.forEach(L=>{
    const n=L.n;
    [...L.blend,...L.build].forEach(w=>{const m=missing(w,n);if(m.length)problems.push(`route ${n} word ${w}: ${m.join(',')}`);});
    L.book.pages.forEach(p=>p.t.split(/\s+/).forEach(tok=>{if(!tokenOK(tok,n))problems.push(`route ${n} book "${tok}"`);}));
    L.mons.filter(m=>m.read).forEach(m=>{const x=missing(m.name,n);if(x.length)problems.push(`route ${n} name ${m.name}: ${x.join(',')}`);});
    L.blend.forEach(w=>{if(!ART[clean(w)])problems.push(`route ${n} blend word ${w} has no picture`);});
    L.heart.forEach(h=>{if(h.i<0||h.i+h.n>h.w.length)problems.push(`route ${n} heart ${h.w} marks outside the word`);});
    (L.book.quiz||[]).forEach(q=>{if(!(q.a>=0&&q.a<q.o.length))problems.push(`route ${n} quiz answer out of range`);});
  });
  return problems;
}
/* When a Dolch word becomes readable: decodable route, heart route, or never. */
function dolchRoute(w){
  if(HEART_ROUTE[w.toLowerCase()])return HEART_ROUTE[w.toLowerCase()];
  for(let n=1;n<=LAST;n++){if(heartUpTo(n).some(h=>h.w.toLowerCase()===w.toLowerCase())||!missing(w.toLowerCase(),n).length)return n;}
  return null;
}

/* ---------- evidence ---------- */
function readQuestions(sessions){return C.allQuestions(sessions).filter(q=>q.section==='read'&&!q.teach&&q.item);}
const indep=q=>C.independent(q);
/* Leitner-style boxes rebuilt from history.
   0 new · 1 met once · 2 secure (two independent successes) · 3 mastered (success on a later day) · 4 long-term.
   Any miss or help drops the item back to 1. */
function itemStats(sessions){
  const out={};
  for(const q of readQuestions(sessions)){
    if(!q.responses?.length)continue;
    const s=out[q.item]||={item:q.item,n:0,ind:0,box:0,lastAt:0,lastDay:null,upDay:null,misses:0};
    s.n++;s.lastAt=q.completedAt||q.startedAt;s.lastDay=q.day;
    if(indep(q)){s.ind++;if(s.box<2)s.box++;else if(q.day!==s.upDay&&s.box<4)s.box++;s.upDay=q.day;}
    else if(q.completedAt||q.responses.length){s.misses++;s.box=Math.min(s.box,1);}
  }
  return out;
}
const INTERVAL=[0,0,DAY,3*DAY,7*DAY];
function due(stat,now){return !stat||stat.box<2||now-stat.lastAt>=INTERVAL[stat.box];}
const gKey=g=>'g:'+g, wKey=w=>'w:'+clean(w), hKey=w=>'h:'+w.toLowerCase(), uKey=l=>'u:'+l;

/* ---------- route gates ---------- */
function huntable(L){return L.add.filter(g=>!DOUBLES.includes(g));}
function gate(n,stats,state={}){
  const L=route(n),box=k=>stats[k]?.box||0;
  const gs=huntable(L),words=[...new Set([...L.blend,...L.build].map(clean))];
  const gOK=gs.filter(g=>box(gKey(g))>=2).length;
  const wOK=words.filter(w=>box(wKey(w))>=2).length,wNeed=Math.min(6,words.length);
  const hOK=L.heart.filter(h=>box(hKey(h.w))>=2).length;
  const bookDone=!!state.books?.[n] || readBookDone(stats,n);
  let caps={ok:0,need:0};
  if(L.caps){caps={ok:'abcdefghijklmnopqrstuvwxyz'.split('').filter(l=>box(uKey(l))>=2).length,need:20};}
  const met=gOK===gs.length&&wOK>=wNeed&&hOK===L.heart.length&&bookDone&&caps.ok>=caps.need;
  return {n,graphemes:{ok:gOK,total:gs.length},words:{ok:wOK,need:wNeed,total:words.length},heart:{ok:hOK,total:L.heart.length},book:bookDone,caps,met};
}
function readBookDone(stats,n){return Object.values(stats).some(s=>s.item.startsWith('b:'+n+':')&&s.n>0);}
/* Route passes and placement are also written into the shared sessions, so
   any device (and the email report) can rebuild where he is. */
function withSessions(state,sessions){
  const st={...freshState(),...(state||{})};st.passed={...(st.passed||{})};st.books={...(st.books||{})};
  for(const q of C.allQuestions(sessions||{})){
    if(q.section!=='read'||!q.completedAt)continue;
    if((q.skill==='advance'||q.skill==='placed')&&q.completedAt<(st.resetAt||0))continue;   // superseded by a newer English check
    if(q.skill==='advance'&&q.route)st.passed[q.route]=Math.max(st.passed[q.route]||0,q.completedAt);
    if(q.skill==='placed'){for(let n=1;n<=(q.route||0);n++)st.passed[n]=Math.max(st.passed[n]||0,q.completedAt);if(q.completedAt>(st.placedAt||0)){st.placedAt=q.completedAt;st.placedRoute=q.route||0;}}
    if(q.skill==='book'&&q.kind==='book')st.books[q.route]=Math.max(st.books[q.route]||0,q.completedAt);
  }
  return st;
}
function currentRoute(state={}){
  for(let n=1;n<=LAST;n++)if(!state.passed?.[n])return n;
  return LAST;
}
function allPassed(state={}){return ROUTES.every(L=>state.passed?.[L.n]);}

/* ---------- what next ---------- */
const TEACH=['shapes','meet','write','ears','hunt','read','build','heart','sentence','book','name'];
const PRACTICE=['read','sentence','build'];
function writeSet(L){
  const alone=new Set(ROUTES.flatMap(r=>r.add.filter(g=>g.length===1)));
  const out=[];
  L.add.forEach(g=>{if(g.length===1){if(D.WRITE[g]&&!out.includes(g))out.push(g);return;}
    if(G[g]?.[3]==='end')return;
    g.replace('_','').split('').forEach(ch=>{if(D.WRITE[ch]&&!alone.has(ch)&&!out.includes(ch))out.push(ch);});});
  return out;
}
function applies(act,L){
  if(act==='shapes')return L.add.some(g=>g.length===1)||!!L.caps;
  if(act==='meet')return L.add.length>0;
  if(act==='write')return writeSet(L).length>0;
  if(act==='hunt')return huntable(L).length>0;
  if(act==='name')return L.mons.some(m=>m.read);
  if(act==='ears')return L.n<=9;
  return true;
}
function doneActs(sessions,n){
  const s=new Set();
  for(const q of C.allQuestions(sessions))if(q.section==='read'&&q.route===n&&q.completedAt)s.add(q.skill);
  return s;
}
function earsAccuracy(sessions){const qs=readQuestions(sessions).filter(q=>q.skill==='ears').slice(-15);return qs.length>=5?qs.filter(indep).length/qs.length:null;}
/* Earlier routes' sounds, words and tricky words that are due: never confirmed
   (for example after a placement jump), or past their spacing interval. */
function dueReviews(sessions,state,now=Date.now()){
  const stats=itemStats(sessions),n=currentRoute(state),out=[];
  for(const L of ROUTES.slice(0,n-1)){
    const keys=[...huntable(L).map(gKey),...[...L.blend,...L.build].filter(w=>ART[clean(w)]).map(wKey),...L.heart.map(h=>hKey(h.w))];
    for(const k of keys){const s=stats[k];if(!s||due(s,now))out.push(s||{item:k,box:0,lastAt:0,n:0});}
  }
  const seen=new Set();
  return out.filter(s=>!seen.has(s.item)&&seen.add(s.item)).sort((a,b)=>(a.box-b.box)||(a.lastAt-b.lastAt));
}
function itemRoute(item){
  const [k,v]=item.split(':');
  for(const L of ROUTES){
    if(k==='g'&&L.add.includes(v))return L.n;
    if(k==='w'&&[...L.blend,...L.build].map(clean).includes(v))return L.n;
    if(k==='h'&&L.heart.some(h=>h.w.toLowerCase()===v))return L.n;
  }
  if(k==='h'){const r=dolchRoute(v);if(r)return r;}
  if(k==='u')return LAST;
  return 1;
}
/* ---------- building up from his level ----------
   Sounds are introduced two or three at a time; words are only offered once he has
   enough secure sounds to decode them; a "Sound explorer" (from the English check)
   stays on listening games and letter sounds until blending by ear and a few sounds
   are secure. */
// A sound counts as met once taught, practised, or known in the English check (a miss in the check does not count)
function touched(sessions){const s=new Set();for(const q of C.allQuestions(sessions))if(q.section==='read'&&q.item&&(q.completedAt||q.responses?.length)&&(q.skill!=='placement'||indep(q)))s.add(q.item);return s;}
function introduced(sessions,n){const t=touched(sessions);return route(n).add.filter(g=>t.has(gKey(g)));}
function available(sessions,n){return [...new Set([...graphemesUpTo(n-1),...introduced(sessions,n)])];}
function nextBatch(sessions,n,stats=itemStats(sessions)){
  const L=route(n),intro=introduced(sessions,n),left=L.add.filter(g=>!intro.includes(g));
  if(!left.length)return null;
  const ready=intro.filter(g=>!DOUBLES.includes(g)).every(g=>(stats[gKey(g)]?.box||0)>=1);
  return ready?left.slice(0,3):null;
}
/* Words are offered only from sounds he has already shown he knows (a clean success), not merely met. */
function knownSounds(sessions,n,stats=itemStats(sessions)){return [...new Set([...graphemesUpTo(n-1),...route(n).add.filter(g=>DOUBLES.includes(g)?(stats[gKey(g[0])]?.box||0)>=1:(stats[gKey(g)]?.box||0)>=1)])];}
function readableWords(sessions,n){const av=new Set(knownSounds(sessions,n));
  return [...new Set([...route(n).blend,...route(n).build])].filter(w=>splitWord(w,n).every(p=>p.cls==='silent'||p.suffix||av.has(p.magic==='start'?p.play:p.g)));}
function blendAccuracy(sessions){const qs=readQuestions(sessions).filter(q=>q.kind==='blend'&&q.responses?.length).slice(-5);return qs.length>=5?qs.filter(indep).length/qs.length:null;}
function preReading(sessions,state){
  if(!state.profile?.pre)return false;
  const stats=itemStats(sessions),first=route(1).add,secure=first.filter(g=>(stats[gKey(g)]?.box||0)>=2);
  const vowel=secure.some(g=>'ai'.includes(g)),blend=blendAccuracy(sessions);
  return !(secure.length>=4&&vowel&&blend!==null&&blend>=.8);
}
function pendingTeach(sessions,n,kind){
  const L=route(n),t=touched(sessions),intro=introduced(sessions,n);
  if(kind==='shapes')return intro.filter(g=>g.length===1&&!t.has('s:'+g));
  if(kind==='write'){const ws=writeSet(L);return ws.filter(l=>(intro.includes(l)||intro.some(g=>g.includes(l)))&&!t.has('l:'+l));}
  return [];
}
const needsCheck=(state,sessions)=>state.assessV!==2||(state.redoCheckAt||0)>(state.profile?.at||0);
/* recent: activities of the last few blocks, newest last */
function nextActivity(sessions,state={},recent=[],now=Date.now()){
  if(needsCheck(state,sessions))return {act:'placement',route:1};
  const n=currentRoute(state),L=route(n),stats=itemStats(sessions),last=recent[recent.length-1];
  const pre=preReading(sessions,state);
  if(nextBatch(sessions,n,stats))return {act:'meet',route:n,teach:true};
  if(!L.caps&&pendingTeach(sessions,n,'shapes').length)return {act:'shapes',route:n,teach:true};
  if(pendingTeach(sessions,n,'write').length)return {act:'write',route:n,teach:true};
  const reading=!pre&&readableWords(sessions,n).length>=3;
  const done=doneActs(sessions,n);
  if(L.caps&&!done.has('shapes'))return {act:'shapes',route:n,teach:true};
  for(const act of (reading?['ears','hunt','read','build','heart','sentence','book','name']:['ears','hunt']))
    if(applies(act,L)&&!done.has(act))return {act,route:n,teach:true};
  const g=gate(n,stats,state);
  if(g.met&&!allPassed(state))return {act:'advance',route:n};
  const options=[];
  const reviews=dueReviews(sessions,state,now);
  if(reviews.length>=3&&last!=='review')options.push('review');
  // A sound he keeps missing is shown again (picture, keyword, mouth sound) rather than only quizzed
  const weak=introduced(sessions,n).filter(g=>!DOUBLES.includes(g)&&(stats[gKey(g)]?.misses||0)>=2&&(stats[gKey(g)]?.box||0)<2);
  if(weak.length&&!recent.slice(-3).includes('reteach'))return {act:'reteach',route:n,teach:true};
  if(!reading){
    // Sound-building practice: letter sounds and listening, alternating
    options.push(last==='ears'?'hunt':last==='hunt'?'ears':(recent.length%2?'hunt':'ears'));
    return {act:options.find(a=>a!==last)||options[0],route:n};
  }
  const ea=earsAccuracy(sessions);
  if(n<=9&&recent.slice(-4).every(a=>a!=='ears')&&(ea===null||ea<0.85))options.push('ears');
  if(g.graphemes.ok<g.graphemes.total)options.push('hunt');
  if(g.heart.ok<g.heart.total)options.push('heart');
  if(g.words.ok<g.words.need){const rot=PRACTICE.filter(a=>a!==last);options.push(rot[recent.length%rot.length]);}
  if(L.caps&&g.caps.ok<g.caps.need)options.push('caps');
  if(!g.book)options.push('book');
  if(!options.length)options.push(...PRACTICE.filter(a=>a!==last),'name');
  const pick=options.find(a=>a!==last)||options[0];
  return {act:pick,route:n};
}

/* ---------- round building ---------- */
const NOT_NOUN=['nap','sit','spin','dig','mad','top','run','hug','fun','yes','jump','stop','sing','cut','red','smile','play','fight','down','burn','boil','time','day','hear','high','near','fair','pair','say','way','loud','shout','new','chew','draw','true','whip','dot','tap','pit','pat','nip','tip','sat','mat','nod','gap','pod'];
function shuffle(a,rnd=Math.random){const b=a.slice();for(let i=b.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
function choiceCount(n){return n<=2?2:n<=5?3:4;}
function weakFirst(keys,stats,rnd){return shuffle(keys,rnd).sort((a,b)=>(stats[a]?.box||0)-(stats[b]?.box||0));}
function pictureWords(n){
  const out=[];for(let i=0;i<Math.min(n,LAST);i++)for(const w of [...ROUTES[i].blend,...ROUTES[i].build])if(ART[clean(w)]&&!out.includes(w))out.push(w);
  return out;
}
/* Distractors that look and sound close, so the choice needs real decoding. */
function nearWords(w,n,count,rnd=Math.random){
  const target=clean(w),pool=pictureWords(n).filter(x=>clean(x)!==target&&ART[clean(x)]!==ART[target]);
  const score=x=>{x=clean(x);let s=0;if(x.length===target.length)s+=3;for(let i=0;i<Math.min(x.length,target.length);i++)if(x[i]===target[i])s+=2;if(x.at(-1)===target.at(-1))s+=1;return s+rnd()*1.6;};
  return pool.map(x=>[x,score(x)]).sort((a,b)=>b[1]-a[1]).slice(0,count).map(x=>x[0]);
}
function heartPool(n){
  const words=heartUpTo(n).map(h=>h.w);
  DOLCH.forEach(w=>{const r=dolchRoute(w);if(r&&r<=n&&!words.some(x=>x.toLowerCase()===w.toLowerCase()))words.push(w);});
  return words;
}
function wordChoices(w,pool,count,rnd){
  const lw=w.toLowerCase();
  const near=pool.filter(x=>x.toLowerCase()!==lw).map(x=>[x,(x[0].toLowerCase()===lw[0]?3:0)+(x.length===w.length?2:0)+rnd()]).sort((a,b)=>b[1]-a[1]).map(x=>x[0]);
  return shuffle([w,...near.slice(0,count)],rnd);
}
function makeRound(act,n,sessions,state={},rnd=Math.random){
  const L=route(n),stats=itemStats(sessions),taught=graphemesUpTo(n),c=choiceCount(n);
  const reviews=dueReviews(sessions,state).map(s=>s.item);
  const items=[];
  const base={route:n};
  const av=available(sessions,n),pre=preReading(sessions,state);
  if(act==='reteach'){const weak=introduced(sessions,n).filter(g=>!DOUBLES.includes(g)&&(stats[gKey(g)]?.misses||0)>=2&&(stats[gKey(g)]?.box||0)<2).slice(0,3);
    return {act,route:n,items:weak.map(g=>({...base,kind:'meet',item:gKey(g),g,teach:true}))};}
  if(act==='meet'){const batch=nextBatch(sessions,n,stats)||L.add;return {act,route:n,items:batch.map(g=>({...base,kind:'meet',item:gKey(g),g,teach:true}))};}
  if(act==='write'){const ls=pendingTeach(sessions,n,'write');return {act,route:n,items:(ls.length?ls:writeSet(L)).map(l=>({...base,kind:'write',item:'l:'+l,letter:l,teach:true}))};}
  if(act==='shapes'){
    if(L.caps){
      const letters=shuffle('abcdefghijklmnopqrstuvwxyz'.split(''),rnd).sort((a,b)=>(stats[uKey(a)]?.box||0)-(stats[uKey(b)]?.box||0)).slice(0,5);
      letters.forEach(l=>items.push({...base,kind:'upper',item:uKey(l),target:l,options:shuffle([l.toUpperCase(),...shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter(x=>x!==l.toUpperCase()),rnd).slice(0,3)],rnd),answer:l.toUpperCase()}));
      return {act,route:n,items};
    }
    const pend=pendingTeach(sessions,n,'shapes'),fresh=pend.length?pend:introduced(sessions,n).filter(g=>g.length===1),pool=singleLetters(n);
    fresh.forEach(t=>{const near=(D.CONFUSE[t]||[]).filter(g=>pool.includes(g)&&g!==t),rest=pool.filter(g=>g!==t&&!near.includes(g));
      const others=[...shuffle(near,rnd),...shuffle(rest,rnd)].slice(0,c-1);
      items.push({...base,kind:'shape',item:'s:'+t,target:t,options:shuffle([t,...others],rnd),answer:t});});
    return {act,route:n,items};
  }
  if(act==='caps'){
    const sentences=ROUTES.slice(0,n).flatMap(r=>r.book.pages.map(p=>p.t)).filter(t=>/^[A-Z][a-z ]+\.$/.test(t)&&t.split(' ').length<=6);
    shuffle(sentences,rnd).slice(0,4).forEach(t=>{
      const wrong=rnd()<.5?t[0].toLowerCase()+t.slice(1):t.slice(0,-1);
      items.push({...base,kind:'punct',item:'p:'+(wrong===t.slice(0,-1)?'stop':'capital'),options:shuffle([t,wrong],rnd),answer:t});
    });
    return {act,route:n,items};
  }
  // Few sounds known: two big choices; more choices as his set grows
  const hc=pre||av.length<=6?2:av.length<=12?3:c;
  const huntItem=(g,from)=>{const others=shuffle(av.filter(x=>x!==g&&!DOUBLES.includes(x)),rnd).slice(0,hc-1);return {...base,route:from||n,kind:'hunt',item:gKey(g),target:g,options:shuffle([g,...others],rnd),answer:g};};
  const readItem=(w,from)=>{const ws=nearWords(w,Math.max(n,from||n),2,rnd);return {...base,route:from||n,kind:'read',item:wKey(w),word:w,parts:splitWord(w,n),options:shuffle([w,...ws],rnd).map(x=>({w:x,e:ART[clean(x)]})),answer:clean(w)};};
  const heartItem=w=>({...base,kind:'heart',item:hKey(w),word:w,options:wordChoices(w,heartPool(n),Math.max(1,c-1),rnd),answer:w});
  if(act==='hunt'){
    const intro=introduced(sessions,n).filter(g=>!DOUBLES.includes(g));
    const cur=weakFirst((intro.length?intro:huntable(L)).map(gKey),stats,rnd).map(k=>k.slice(2));
    const old=reviews.filter(k=>k.startsWith('g:')).map(k=>k.slice(2)).filter(g=>!DOUBLES.includes(g));
    const pick=[];for(let i=0;i<5;i++){const useOld=old.length&&(i%3===2||!cur.length);pick.push(useOld?old.shift():cur[i%Math.max(1,cur.length)]);}
    pick.filter(Boolean).forEach(g=>items.push(huntItem(g,itemRoute(gKey(g)))));
  }
  if(act==='read'){
    const rw=readableWords(sessions,n);
    const words=weakFirst((rw.length?rw:[...new Set([...L.blend,...L.build])]).filter(w=>ART[clean(w)]),stats,rnd);
    const old=reviews.filter(k=>k.startsWith('w:')).map(k=>pictureWords(n).find(w=>clean(w)===k.slice(2))).filter(Boolean);
    const pick=[...words.slice(0,4)];if(old.length)pick.push(old[0]);else if(words[4])pick.push(words[4]);
    pick.forEach(w=>items.push(readItem(w,itemRoute(wKey(w)))));
  }
  if(act==='build'){
    const rw=readableWords(sessions,n);
    const words=weakFirst(rw.length?rw:[...new Set([...L.build,...L.blend])],stats,rnd).slice(0,n<=2?3:4);
    words.forEach(w=>{const parts=splitWord(w,n);const need=parts.map(p=>p.g);
      const extra=shuffle(av.filter(g=>!need.includes(g)&&G[g]?.[3]!=='end'&&!DOUBLES.includes(g)),rnd).slice(0,n<=2?1:2);
      items.push({...base,kind:'build',item:'sp:'+clean(w),word:w,parts,tiles:shuffle([...need,...extra],rnd),answer:clean(w)});});
  }
  if(act==='heart'){
    const fresh=L.heart.filter(h=>!(stats[hKey(h.w)]?.n));
    fresh.forEach(h=>items.push({...base,kind:'heartTeach',item:hKey(h.w),heart:h,teach:true}));
    const curr=weakFirst(L.heart.map(h=>hKey(h.w)),stats,rnd).map(k=>L.heart.find(h=>hKey(h.w)===k).w);
    const dolch=heartPool(n).filter(w=>!L.heart.some(h=>h.w===w));
    const old=reviews.filter(k=>k.startsWith('h:')).map(k=>heartPool(n).find(w=>hKey(w)===k)).filter(Boolean);
    const quiz=[...curr.slice(0,3),...(old.length?old.slice(0,1):[]),...weakFirst(dolch.map(hKey),stats,rnd).slice(0,1).map(k=>dolch.find(w=>hKey(w)===k))].filter(Boolean).slice(0,5);
    quiz.forEach(w=>items.push(heartItem(w)));
  }
  if(act==='sentence'){
    const words=shuffle(pictureWords(n).filter(w=>!w.includes('+')&&!NOT_NOUN.includes(clean(w))&&itemRoute(wKey(w))>=Math.max(1,n-3)),rnd).slice(0,4);
    const bigOK=n>=4,twoOK=n>=16;
    words.forEach((w,i)=>{
      const cw=clean(w),plural=cw.endsWith('s')&&!G[cw];
      let text='Tap the '+cw+'.',opts=[w,...nearWords(w,n,2,rnd)].map(x=>({w:x,e:ART[clean(x)],size:1})),answer=0;
      if(bigOK&&i%2===1&&!plural){text='Tap the big '+cw+'.';opts=[{w,e:ART[cw],size:1.6},{w,e:ART[cw],size:.75},{w:nearWords(w,n,1,rnd)[0],e:ART[clean(nearWords(w,n,1,rnd)[0]||w)],size:1.6}];}
      if(twoOK&&i===3&&!plural){text='Tap two '+cw+(/(s|x|sh|ch)$/.test(cw)?'es':'s')+'.';opts=[{w,e:ART[cw],count:2},{w,e:ART[cw],count:1},{w,e:ART[cw],count:3}];}
      const order=shuffle(opts.map((o,k)=>k),rnd);
      items.push({...base,kind:'sentence',item:wKey(w),text,options:order.map(k=>opts[k]),answer:order.indexOf(answer)});
    });
  }
  if(act==='ears'){
    const pool=D.EARS.filter(w=>ART[w]);
    const words=shuffle(pool.filter(w=>!pre||splitWord(w,LAST).length<=3),rnd).slice(0,5);
    words.forEach((w,i)=>{
      const parts=splitWord(w,LAST).filter(p=>p.cls!=='silent');
      const fmt=(pre?['rhyme','first','blend','blend','rhyme']:['first','blend','count','rhyme','blend'])[i%5];
      if(fmt==='rhyme'){const sets=shuffle(D.RHYMES,rnd);const set=sets[i%sets.length];const [t,m]=shuffle(set,rnd);const others=shuffle(D.RHYMES.filter(x=>x!==set).map(x=>x[0]),rnd).slice(0,2);
        items.push({...base,kind:'rhyme',item:'pa:rhyme',word:t,e:ART[t],options:shuffle([m,...others],rnd).map(x=>({w:x,e:ART[x]})),answer:m});return;}
      if(fmt==='count'){items.push({...base,kind:'count',item:'pa:count',word:w,answer:parts.length,options:[2,3,4,5].filter(x=>x<=Math.max(4,parts.length))});return;}
      const others=shuffle(pool.filter(x=>x!==w&&ART[x]!==ART[w]&&(fmt!=='first'||splitWord(x,LAST)[0].g!==parts[0].g)),rnd).slice(0,2);
      items.push({...base,kind:fmt,item:'pa:'+fmt,word:w,parts,options:shuffle([w,...others],rnd).map(x=>({w:x,e:ART[x]})),answer:w});
    });
  }
  if(act==='book')return {act,route:n,items:[{...base,kind:'book',item:'b:'+n,book:L.book,teach:true},...(L.book.quiz||[]).map((q,i)=>({...base,kind:'quiz',item:'b:'+n+':'+i,quiz:q,answer:q.a}))]};
  if(act==='name'){
    const mons=L.mons.filter(m=>m.read);const all=ROUTES.slice(0,n).flatMap(r=>r.mons);
    shuffle(mons,rnd).slice(0,2).forEach(m=>{const others=shuffle(all.filter(x=>x.id!==m.id),rnd).slice(0,2);
      items.push({...base,kind:'name',item:'n:'+m.id,mon:m,parts:splitWord(m.name,n),options:shuffle([m,...others],rnd),answer:m.id});});
  }
  if(act==='review'){
    // Alternate sounds, words and tricky words so a review round is mixed.
    const by={g:[],w:[],h:[]};reviews.forEach(k=>by[k[0]]?.push(k));
    const mixed=[];for(let i=0;mixed.length<5&&i<20;i++){const t='gwh'[i%3];if(by[t].length)mixed.push(by[t].shift());}
    mixed.forEach(k=>{const [t,v]=k.split(':');
      if(t==='g')items.push(huntItem(v,itemRoute(k)));
      else if(t==='w'){const w=pictureWords(n).find(x=>clean(x)===v);if(w)items.push(readItem(w,itemRoute(k)));}
      else if(t==='h'){const w=heartPool(n).find(x=>hKey(x)===k);if(w)items.push(heartItem(w));}
    });
  }
  return {act,route:n,items};
}

/* ---------- placement: a short staircase ---------- */
const PROBES=[1,3,5,7,9,11,12];
function placementProbe(step,rnd=Math.random){
  const n=PROBES[step],from=step?PROBES[step-1]+1:1;
  const span=ROUTES.slice(from-1,n);
  const gs=shuffle(span.flatMap(huntable),rnd),ws=shuffle(span.flatMap(L=>L.blend.filter(w=>ART[clean(w)])),rnd);
  const out=[];
  if(gs.length){out.push({g:gs[0]});if(gs[1])out.push({g:gs[1]});}
  while(out.length<3&&ws.length)out.push({w:ws.shift()});
  return out.map(x=>x.g?{kind:'hunt',item:gKey(x.g),target:x.g,options:shuffle([x.g,...shuffle(graphemesUpTo(n).filter(y=>y!==x.g&&!DOUBLES.includes(y)),rnd).slice(0,2)],rnd),answer:x.g,route:n,placement:true}
    :{kind:'read',item:wKey(x.w),word:x.w,parts:splitWord(x.w,n),options:shuffle([x.w,...nearWords(x.w,n,2,rnd)],rnd).map(y=>({w:y,e:ART[clean(y)]})),answer:clean(x.w),route:n,placement:true});
}
/* results: array per probe of booleans (first-try correct). Returns routes passed. */
function placementResult(results){
  let placed=0;
  for(let i=0;i<results.length;i++){const r=results[i];if(r.length===3&&r.every(Boolean))placed=PROBES[i];else break;}
  return placed;
}
const PROBE_COUNT=PROBES.length;

/* ---------- state (synced, merge-safe) ---------- */
function freshState(){return {v:1,passed:{},placedAt:0,placedRoute:0,books:{},aloud:{},legacy:null,names:false,assessV:0,resetAt:0,profile:null};}
function mergeState(a,b){
  a=a||freshState();b=b||freshState();
  const maxMap=(x,y)=>{const o={...(x||{})};for(const [k,v] of Object.entries(y||{}))o[k]=Math.max(o[k]||0,v||0);return o;};
  const aloud={...(a.aloud||{})};for(const [k,v] of Object.entries(b.aloud||{}))if(!aloud[k]||(v?.at||0)>(aloud[k].at||0))aloud[k]=v;
  const resetAt=Math.max(a.resetAt||0,b.resetAt||0),newer=(a.profile?.at||0)>=(b.profile?.at||0)?a:b;
  const passed=Object.fromEntries(Object.entries(maxMap(a.passed,b.passed)).filter(([,v])=>v>=resetAt));
  return {v:1,passed,books:maxMap(a.books,b.books),aloud,resetAt,assessV:Math.max(a.assessV||0,b.assessV||0),redoCheckAt:Math.max(a.redoCheckAt||0,b.redoCheckAt||0),profile:newer.profile||a.profile||b.profile||null,
    placedAt:Math.max(a.placedAt||0,b.placedAt||0),placedRoute:(a.placedAt||0)>=(b.placedAt||0)?(a.placedRoute||0):(b.placedRoute||0),
    legacy:a.legacy||b.legacy||null,names:(a.namesAt||0)>=(b.namesAt||0)?!!a.names:!!b.names,namesAt:Math.max(a.namesAt||0,b.namesAt||0)};
}
/* The old stand-alone app's progress. It is a hint, not proof: its routes
   opened on completion, not mastery, so placement still checks. */
function importLegacy(raw){
  try{const s=typeof raw==='string'?JSON.parse(raw):raw;if(!s||typeof s!=='object')return null;
    return {at:Math.max(1,Math.min(12,+s.at||1)),books:(Array.isArray(s.books)?s.books:[]).filter(Number.isInteger),caught:(Array.isArray(s.caught)?s.caught:[]).filter(Number.isInteger),stars:+s.stars||0};}
  catch(e){return null;}
}

/* ---------- P1 readiness ---------- */
const P1_TARGET='2027-10-31';            // all routes secure, leaving two terms of buffer before January 2028
function expectedRoute(state,now=Date.now()){
  const start=state.placedAt||now,from=Math.max(1,(state.placedRoute||0)+1);
  const end=Date.parse(P1_TARGET+'T12:00:00Z');
  if(now>=end)return LAST;
  return Math.min(LAST,Math.floor(from+(LAST+1-from)*Math.max(0,now-start)/Math.max(DAY,end-start)));
}
function readiness(sessions,state={},now=Date.now()){
  const stats=itemStats(sessions),box=k=>stats[k]?.box||0;
  const letters='abcdefghijklmnopqrstuvwxyz'.split('');
  const teams=ROUTES.flatMap(L=>L.add).filter(g=>g.length>1&&!DOUBLES.includes(g)&&G[g][3]!=='end');
  const qs=readQuestions(sessions),recent=qs.filter(q=>q.day>=C.shiftDay(C.dayKey(now),-29));
  const acc=k=>{const x=recent.filter(q=>q.skill===k&&q.responses?.length);return x.length?{n:x.length,p:x.filter(indep).length/x.length}:{n:0,p:null};};
  const cvc=recent.filter(q=>q.skill==='read'&&q.route<=6&&q.responses?.length);
  const dolchKnown=DOLCH.filter(w=>box(hKey(w))>=2||box(wKey(w))>=2);
  const books=ROUTES.filter(L=>readBookDone(stats,L.n)||state.books?.[L.n]).length;
  const quiz=recent.filter(q=>q.skill==='book'&&q.kind==='quiz');
  const aloud=Object.values(state.aloud||{}).sort((a,b)=>b.at-a.at)[0]||null;
  const n=currentRoute(state),exp=expectedRoute(state,now);
  const rows=[
    {key:'sounds',label:'Single letter sounds (a–z)',value:letters.filter(l=>box(gKey(l))>=3).length,secure:letters.filter(l=>box(gKey(l))>=2).length,target:26},
    {key:'teams',label:'Digraphs and vowel teams (sh, ai, igh, a–e …)',value:teams.filter(g=>box(gKey(g))>=3).length,secure:teams.filter(g=>box(gKey(g))>=2).length,target:teams.length},
    {key:'cvc',label:'Reads short words alone (cat, ship), last 30 days',value:cvc.length?Math.round(cvc.filter(indep).length/cvc.length*100):null,target:90,unit:'%',n:cvc.length},
    {key:'dolch',label:'P1 sight words (Dolch pre-primer + primer)',value:dolchKnown.length,target:DOLCH.length},
    {key:'books',label:'Decodable books read',value:books,target:LAST},
    {key:'comp',label:'Story questions right first time, last 30 days',value:quiz.length?Math.round(quiz.filter(indep).length/quiz.length*100):null,target:80,unit:'%',n:quiz.length},
    {key:'ears',label:'Hearing sounds in words, last 30 days',value:acc('ears').p===null?null:Math.round(acc('ears').p*100),target:85,unit:'%',n:acc('ears').n},
    {key:'caps',label:'Capital letters matched',value:letters.filter(l=>box(uKey(l))>=2).length,target:26},
    {key:'aloud',label:'Reading aloud to a grown-up (latest check)',value:aloud?Math.round(aloud.ok/Math.max(1,aloud.total)*100):null,target:90,unit:'%',note:aloud?('route '+aloud.route+', '+C.dayKey(aloud.at)):'not checked yet'}
  ];
  const pace=n>exp?'ahead':n===exp?'on track':n>=exp-1?'slightly behind':'behind';
  return {route:n,expected:exp,pace,rows,target:P1_TARGET};
}
function report(sessions,state,day){
  const r=readiness(sessions,state,Date.parse(day+'T20:00:00Z'));
  const s=C.summarize(sessions,day);const g=Object.values(s.groups).filter(x=>x.section==='read');
  const lines=[`Reading — route ${r.route} of ${LAST} (${route(r.route).name}); expected by now: route ${r.expected} → ${r.pace}.`];
  if(g.length)for(const x of g)lines.push(`Reading · ${x.format} · route ${x.range}: ${x.independent}/${x.n} first-try without help, ${x.helped} helped.`);
  else lines.push('Reading: no attempts recorded for this date.');
  const gt=gate(r.route,itemStats(sessions),state);
  lines.push(`Route ${r.route} gate: sounds ${gt.graphemes.ok}/${gt.graphemes.total} secure, words ${gt.words.ok}/${gt.words.need}, heart words ${gt.heart.ok}/${gt.heart.total}, book ${gt.book?'read':'not yet'}.`);
  lines.push('P1 readiness: '+r.rows.map(x=>`${x.label} ${x.value===null?'—':x.value+(x.unit||'')}/${x.target}${x.unit||''}`).join('; ')+'.');
  lines.push('Correct answers after the app sounds a word out count as helped, not independent reading.');
  return lines.join('\n\n');
}

return {LAST,route,clean,withSessions,knownSounds,introduced,available,nextBatch,readableWords,preReading,pendingTeach,blendAccuracy,graphemesUpTo,heartUpTo,singleLetters,splitWord,missing,tokenOK,validate,dolchRoute,
  itemStats,due,gate,currentRoute,allPassed,nextActivity,makeRound,applies,writeSet,doneActs,dueReviews,itemRoute,nearWords,heartPool,
  placementProbe,placementResult,PROBE_COUNT,freshState,mergeState,importLegacy,readiness,expectedRoute,report,choiceCount,
  keys:{gKey,wKey,hKey,uKey}};
});
