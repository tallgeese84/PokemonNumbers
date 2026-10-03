/* Reading wing UI. Decode first: the whole word is never spoken before he
   answers unless he asks for help, and asking is recorded as help. */
function createReading(){
 'use strict';
 const R=PokeReadingCore,D=PokeReadingData,B=PokeSoundBuddies,$=id=>document.getElementById(id);
 const STATE_KEY='pokemath_reading_v1',REC_PREFIX='poke_reading_rec_',LEGACY_KEY='poke_reading_v1';
 const reduce=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 let state=R.freshState();
 try{state=R.mergeState(state,JSON.parse(localStorage.getItem(STATE_KEY)||'null'));}catch(e){}
 const sessions=()=>adventure.tracker?.sessions||{};
 const st=()=>R.withSessions(state,sessions());
 function save(){try{localStorage.setItem(STATE_KEY,JSON.stringify(state));}catch(e){}adventure.recordState('reading',state);if(typeof schedulePush==='function')schedulePush();}

 /* ---------- screen ---------- */
 const root=document.createElement('div');root.id='scr-read';root.className='screen';
 root.innerHTML='<header class="activity-header"><h2 class="sr-only" id="rdTitle">Reading</h2><div class="read-route" id="rdRoute"></div><button class="btn listen-btn" id="rdListen" aria-label="Hear it again">'+PokeVisuals.icon('listen')+'</button></header>'+
  '<div class="read-card"><div class="read-pips" id="rdPips" aria-hidden="true"></div><div class="read-prompt" id="rdPrompt"></div><div class="read-stage" id="rdStage"></div><div class="read-options" id="rdOptions"></div><p class="read-feedback" id="rdFeedback" role="status"></p><div class="read-actions" id="rdActions"></div></div>';
 $('scr-quiz').after(root);screens.read=root.id;
 let replay=()=>{};
 $('rdListen').onclick=()=>{audio();if(!soundOn)$('soundBtn').click();replay();};

 /* ---------- voice ---------- */
 // A grown-up recording wins; the speech engine cannot say a clean /b/.
 const REC={};
 function loadRecs(){try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith(REC_PREFIX))REC[k.slice(REC_PREFIX.length)]=localStorage.getItem(k);}}catch(e){}}
 loadRecs();
 let voice=null,gen=0,busy=false,audioHandle=null;
 // Same American English voice as the rest of the app (see PokeVoice in index.html).
 function pickVoice(){voice=window.PokeVoice?window.PokeVoice.pick():null;}
 if(window.speechSynthesis){pickVoice();window.speechSynthesis.addEventListener?.('voiceschanged',pickVoice);}
 function stop(){gen++;busy=false;audioHandle?.stop();audioHandle=null;try{window.speechSynthesis?.cancel();}catch(e){}root.querySelectorAll('.sound-buddy-card').forEach(c=>{c.classList.remove('playing');c.setAttribute('aria-pressed','false');});}
 // Keep the current waveform continuous while a new tap takes over. The clip
 // itself has gentle audible edges; interruption needs its own short release.
 function playClip(src,done,failed){
  let el,source,gain,closed=false;
  const dispose=()=>{try{el?.pause();source?.disconnect();gain?.disconnect();}catch(e){}};
  const finish=fn=>{if(closed)return;closed=true;dispose();if(audioHandle===handle)audioHandle=null;fn?.();};
  const handle={stop(){
   if(closed)return;closed=true;
   if(el){el.onended=null;el.onerror=null;}
   if(gain){try{const t=gain.context.currentTime;gain.gain.cancelScheduledValues(t);gain.gain.setValueAtTime(gain.gain.value,t);gain.gain.linearRampToValueAtTime(0,t+.075);}catch(e){}}
   else if(el){const volume=el.volume??1;for(let i=1;i<=4;i++)setTimeout(()=>{try{el.volume=volume*(1-i/4);}catch(e){}},i*18);}
   setTimeout(dispose,80);
  }};
  try{
   el=new Audio(src);el.preservesPitch=true;
   // A running Web Audio context gives a reliable fade on iPad as well as
   // Chrome. Keep native media playback if routing is unavailable/suspended.
   const ac=audio();if(ac?.state==='running'&&ac.createMediaElementSource&&ac.createGain){
    try{gain=ac.createGain();source=ac.createMediaElementSource(el);source.connect(gain);gain.connect(ac.destination);}catch(e){if(source)source.connect(ac.destination);gain=null;}
   }
   audioHandle=handle;el.onended=()=>finish(done);el.onerror=()=>finish(failed);
   el.play().catch(()=>finish(failed));
  }catch(e){finish(failed);}
 }
 function waitTurn(fn,tries=0){if(speechIdle()||tries>16){if(!speechIdle())shutUp();fn();}else setTimeout(()=>waitTurn(fn,tries+1),250);}
 function speak(text,opts={}){
  const g=gen,done=()=>{if(g===gen){busy=false;opts.done?.();}};
  if(!soundOn||!window.speechSynthesis||!text){setTimeout(done,opts.silentMs||250);return;}
  busy=true;
  waitTurn(()=>{if(g!==gen)return;try{window.speechSynthesis.cancel();}catch(e){}
   const u=new SpeechSynthesisUtterance(String(text));if(!voice)pickVoice();if(voice){u.voice=voice;u.lang=voice.lang;}else u.lang='en-US';
   const slow=root.classList.contains('alphabet-view')||run?.round?.act==='buddies';
   u.rate=(opts.rate||0.82)*(slow?.85:1);u.pitch=opts.pitch||1.05;let fin=false;const end=()=>{if(fin)return;fin=true;done();};
   u.onend=end;u.onerror=end;setTimeout(end,Math.min(30000,Math.max(9000,1700+String(text).length*85/u.rate)));
   try{window.speechSynthesis.speak(u);}catch(e){end();}});
 }
 function playKey(p){return typeof p==='string'?p:(p.play||p.g);}
 function sound(p,done){
  const key=playKey(p),g=gen;
  const fin=()=>{if(g===gen){busy=false;done?.();}};
  if(p&&p.cls==='silent'){setTimeout(fin,150);return;}
  if(p&&p.suffix&&p.g==='ed'&&!p.play){speak('id',{rate:.75,done});return;}
  if(soundOn&&REC[key]){busy=true;waitTurn(()=>{if(g!==gen)return;playClip(REC[key],fin,fin);});return;}
  const keys=PokePhonics.clipKeys(p);
  if(soundOn&&keys.every(k=>PokePhonics.clips.includes(k))){busy=true;let at=0,failed=false;
   const next=()=>{if(g!==gen)return;if(at>=keys.length){fin();return;}playClip('assets/phonemes/female-v81/'+keys[at++]+'.wav',next,()=>{if(failed||g!==gen)return;failed=true;if(run?.ref)help('sound clip unavailable');feedback('Tap listen to try the sound again.');fin();});};waitTurn(next);return;
  }
  const text=(p&&p.magic==='start')?p.sound:(D.G[key]?D.G[key][0]:(p&&p.sound)||key);
  speak(text,{rate:.72,pitch:1,done});
 }
 function chain(jobs,gap,done){const g=gen;let i=0;(function step(){if(g!==gen)return;if(i>=jobs.length){done?.();return;}jobs[i++](()=>setTimeout(step,gap));})();}
 function letterName(l){return D.LETTER_NAME[l]||l;}
 const namesOn=()=>R.namesOn(state);

 /* ---------- helpers ---------- */
 function picture(cls,word,fallback){const node=el('div',cls,fallback);PokeReadingArt.paint(node,R.clean(word));return node;}
 function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;}
 function btn(cls,label,fn,html){const b=el('button',cls);b.type='button';b.setAttribute('aria-label',label);if(html!=null)b.innerHTML=html;b.onclick=()=>{if(active())fn(b);};return b;}
 function active(){return mode==='read'&&!adventure.isPaused();}
 function monImg(id,cls){const im=el('img',cls||'read-mon');im.alt='';im.src=imgArt(id);im.onerror=()=>{im.src=PokeVisuals.ball('poke-ball');};return im;}
 function label(g){return g.replace('_','–');}
 function clsOf(g){const e=D.G[g];return e?.[3]==='vowel'?'vowel':e?.[3]==='end'?'end':g.length>1?'team':'cons';}
 function tiles(host,parts,opts={}){
  host.replaceChildren();const out=[];
  parts.forEach((p,i)=>{
   const b=el('button','gtile '+(p.g.length>1&&p.cls!=='end'?'bar':'dot'));b.type='button';b.dataset.cls=p.cls;
   if(p.syl)b.classList.add('syl');if(p.suffix)b.classList.add('suffix');
   b.setAttribute('aria-label',p.cls==='silent'?'silent e':'sound '+p.g);
   b.append(el('span','g',p.g),el('span','mark'));
   if(!opts.mute)b.onclick=()=>{if(!active())return;flash(b);opts.onTap?.(i);sound(p);};else b.tabIndex=-1;
   host.append(b);out.push(b);
  });
  const s=parts.findIndex(p=>p.magic==='start'),e=parts.findIndex(p=>p.magic==='end');
  if(s>=0&&e>=0)requestAnimationFrame(()=>{const hr=host.getBoundingClientRect();if(!hr.width)return;const a=out[s].getBoundingClientRect(),z=out[e].getBoundingClientRect();
   const x1=a.left-hr.left+a.width/2,x2=z.left-hr.left+z.width/2,y=a.top-hr.top+a.height*.86;
   const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('class','swoop');const path=document.createElementNS('http://www.w3.org/2000/svg','path');
   path.setAttribute('d',`M ${x1} ${y} Q ${(x1+x2)/2} ${y+30} ${x2} ${y}`);svg.append(path);host.append(svg);});
  return out;
 }
 function flash(b){b.classList.add('lit');setTimeout(()=>b.classList.remove('lit'),360);}
 function soundOut(tl,parts,fast,done){chain(parts.map((p,i)=>next=>{tl.forEach(t=>t.classList.remove('lit'));tl[i]?.classList.add('lit');sound(p,next);}),fast?40:260,()=>{setTimeout(()=>tl.forEach(t=>t.classList.remove('lit')),300);done?.();});}
 function blendOut(tl,parts,word,done){soundOut(tl,parts,true,()=>{tl.forEach(t=>t.classList.add('lit'));speak(R.clean(word),{rate:.75,done:()=>{tl.forEach(t=>t.classList.remove('lit'));done?.();}});});}
 function fade(container,isRight){const kids=[...container.children].filter(b=>!b.disabled);const wrong=kids.filter(b=>!isRight(b));wrong.slice(0,Math.max(0,kids.length-2)).forEach(b=>{b.disabled=true;b.classList.add('faded');});}
 function feedback(t){$('rdFeedback').textContent=t||'';}
 function pips(total,i){const p=$('rdPips');p.replaceChildren();for(let k=0;k<total;k++){const d=el('span',k<i?'on':k===i?'now':'');p.append(d);}}
 function waitReady(fn){const r=run;(function w(){if(run!==r||mode!=='read')return;if(busy||!readyForNext()){setTimeout(w,250);return;}fn();})();}
 const praise=ind=>{const n=childName||'';const a=ind?['Brilliant reading, '+n+'!','You read it yourself!','Super sounding out!','Yes! Great reading!']:['You got it, '+n+'!','Well done!','Good thinking!'];return a[Math.floor(Math.random()*a.length)];};

 /* ---------- round runner ---------- */
 let run=null;            // {round, i, onDone, item, meta, wrong, help, ref}
 const recent=[];
 const TITLE={buddies:'Sound buddies',reteach:'Sounds again',meet:'New sounds',write:'Writing letters',shapes:'Letter shapes',hunt:'Sound hunt',read:'Read it',build:'Build it',heart:'Tricky words',sentence:'Read and tap',ears:'Sound ears',book:'Book time',name:'Name catch',review:'Remember these',caps:'Capital letters',placement:'Reading check',spell:'Spell it'};
 const INTRO={buddies:'Let us learn with our sound buddies.',reteach:'Let us look at these sounds again.',meet:'Meet a new letter and its sound.',write:'Trace the letter. Start on the green dot.',shapes:'Find the letter that looks the same.',hunt:'Listen. Find the sound.',read:'Tap each sound. Say them fast. Then find the picture.',build:'Listen, then build the word.',heart:'Tricky words. Learn them by heart.',sentence:'Read it, then tap the right picture.',ears:'Listen with your ears.',book:'Let us read a book.',name:'Read the name to catch the Pokémon!',review:'Do you remember these?',caps:'Find the one written the right way.',placement:'Show me what you can read!',spell:'Listen to the word. Find the letter for the sound.'};
 function setHeader(act,n){$('rdTitle').textContent=TITLE[act]||'Reading';const L=R.route(n);$('rdRoute').innerHTML='';const chip=el('span','route-chip','Route '+n);chip.style.setProperty('--route',L.colour);$('rdRoute').append(chip);}
 function enter(){root.classList.remove('alphabet-view');shutUp();mode='read';show('read');}
 function startRound(round,onDone){
  stop();
  round=PokeReadingTutor.prepare(round,sessions());
  run={round,i:0,onDone};recent.push(round.act);while(recent.length>8)recent.shift();
  enter();setHeader(round.act,round.route);feedback('');
  if(!round.items.length){finishRound();return;}
  speak(INTRO[round.act],{rate:.85,done:()=>nextItem()});
 }
 function nextItem(){
  if(!run)return;
  if(run.round.lazy&&run.i>=run.round.items.length){const nx=run.round.lazy.next();if(nx)run.round.items.push(nx);}
  if(run.i>=run.round.items.length){finishRound();return;}
  const upcoming=run.round.items[run.i];
  if(upcoming.intro&&!upcoming._introSaid){upcoming._introSaid=true;$('rdOptions').replaceChildren();$('rdStage').replaceChildren();$('rdActions').replaceChildren();$('rdPrompt').textContent='';feedback('');
   speak(upcoming.intro,{rate:.85,done:()=>setTimeout(nextItem,250)});return;}
  if(!adventure.beforeQuestion()){waitReady(nextItem);return;}
  const it=run.round.items[run.i];run.item=it;run.wrong=0;run.helped=false;run.done=false;
  if(run.round.lazy){const pr=run.round.lazy.progress();pips(pr.sections,pr.section);}else pips(run.round.items.length,run.i);feedback('');$('rdOptions').replaceChildren();$('rdActions').replaceChildren();$('rdStage').replaceChildren();$('rdPrompt').replaceChildren();
  run.ref=adventure.begin({section:'read',skill:run.round.placement?'placement':run.round.act,kind:it.kind,item:it.item,route:it.route,range:it.route,support:it.buddyLetter?(it.buddyCue?'Pokémon picture help':'no picture help'):(it.phase||'independent'),word:it.word||it.target||it.item,phase:it.phase||'independent',format:it.kind,level:it.route,teach:!!it.teach,...(it.buddyLetter?{buddyLetter:it.buddyLetter,buddyCue:!!it.buddyCue}:{}),a:it.route,b:0,expected:String(it.answer??it.item)});
  if(it.phase==='model'){renderModel(it);return;}
  (RENDER[it.kind]||RENDER.unknown)(it);
  if(!run.round.placement){const phase=el('div','tutor-phase',it.phase==='buddy-model'?'Meet your buddy':it.phase==='guided'?'Together':it.phase==='retention'?'Remember it':'Your turn');$('rdStage').prepend(phase);if(it.phase==='guided'){run.helped=true;highlightGuide(it);}}
 }
 function respond(value,correct){adventure.respond(value,correct);}
 function help(kind){if(!run.helped)run.helped=true;adventure.help(kind);}
 function right(target,value,afterSay){
  if(run.done)return;run.done=true;
  if(run.round.placement&&run.item._first===undefined){run.item._first=true;run.round.lazy?.record(true);}
  const answered=adventure.tracker.question();respond(value,true);
  const ind=PokeLearning.independent(answered);
  target?.classList.add('right');[...$('rdOptions').querySelectorAll('button')].forEach(b=>b.disabled=true);
  sndGood();if(!reduce())burst(target||$('rdStage'),ind?10:7);
  // Quick recognition items earn one star; reading words and sentences earn two.
  if(!run.item.teach&&!run.round.placement){const big=['read','sentence','build','name','quiz'].includes(run.item.kind);const n=big?(ind?2:1):(ind?1:0);if(n)addStar(n);}
  const line=run.round.placement?'Yes!':run.item.teach?'Well done. We tried it together.':run.item.buddyLetter?(ind?'Yes! You found the sound!':'We found the sound together!'):praise(ind);feedback(line+(run.round.placement?'':run.item.buddyLetter?'  ⭐':ind?'  ⭐⭐':'  ⭐'));
  const after=()=>speak(line,{done:()=>setTimeout(advance,350)});
  if(afterSay&&!run.round.placement)afterSay(after);else after();
 }
 function wrong(target,value){
  respond(value,false);run.wrong++;sndOops();
  if(target){target.classList.add('wrong');setTimeout(()=>{target.classList.remove('wrong');target.disabled=true;},420);}
  // The reading check never teaches or fades: one try, then move on kindly.
  if(run.round.placement&&!run.done){run.done=true;if(run.item._first===undefined){run.item._first=false;run.round.lazy?.record(false);}feedback('Good try!');setTimeout(advance,700);}
 }
 function advance(){if(!run)return;run.i++;waitReady(nextItem);}
 function finishRound(){
  const r=run;run=null;if(!r)return;
  const done=r.onDone;feedback('');
  waitReady2(()=>done?.());
 }
 function waitReady2(fn){(function w(){if(mode!=='read')return;if(busy||!readyForNext()){setTimeout(w,250);return;}fn();})();}
 function teachDone(next){if(run.done)return;run.done=true;respond('done',true);next?next():advance();}

 function highlightGuide(it){
  const want=String(it.kind==='spell1'||it.kind==='spell2'?it.parts[it.ask[0]].g:it.kind==='build'?it.parts[0].g:it.answer);
  for(const b of $('rdOptions').children){const val=b.dataset.w??b.dataset.g??b.dataset.k??b.textContent;if(String(val)===want)b.classList.add('tutor-guided');}
 }
 function renderModel(it){
  const stage=$('rdStage'),card=el('div','tutor-model');stage.append(el('div','tutor-phase','Watch'),card);
  const caption=el('p','tutor-caption');let jobs=[],parts=it.parts||PokePhonics.parts(it.word),tl=[];
  const tell=text=>done=>speak(text,{rate:.8,done});
  const play=p=>done=>sound(p,done);
  const dots=(ps,at)=>{const d=el('div','tutor-boxes');ps.forEach((p,i)=>d.append(el('span',i===at?'focus':'')));card.append(d);return d;};
  const showWord=(word,ps)=>{const box=el('div','sound-word');card.append(box);tl=tiles(box,ps,{mute:true});return box;};
  const w=R.clean(it.word||'');
  if(['shape','upper','hunt','lname'].includes(it.kind)){
   const g=it.answer,e=D.G[String(g).toLowerCase()];showWord(g,[{g,cls:clsOf(String(g).toLowerCase())}]);
   if(e)card.append(picture('meet-art',e[1],e[2]));
   caption.textContent=it.kind==='upper'?'A capital and a small letter make the same sound.':'Look at the shape. Listen to its name and sound.';
   jobs=[tell('This is the letter '+String(g).toUpperCase()+'.'),play(String(g).toLowerCase()),tell(e?'As in '+e[1]+'.':'Look at its shape.')];
  }else if(it.kind==='heart'){
   showWord(w,[{g:it.word,cls:'team'}]);caption.textContent='This word has a tricky part. Look, listen, and say it.';jobs=[tell(it.word+'. Look carefully. Say '+it.word+'.')];
  }else if(it.kind==='rhyme'){
   const pics=el('div','illustrated');pics.append(picture('build-art',it.word),picture('build-art',it.answer));card.append(pics);
   caption.textContent='Rhyming words sound the same at the end.';jobs=[tell(it.word+'. '+it.answer+'. Listen to their endings. '+it.word+', '+it.answer+'. They rhyme.')];
  }else if(['first','last','middle','count','blend','spell1','spell2'].includes(it.kind)){
   card.append(picture('build-art',w));const at=it.kind==='last'?parts.length-1:it.kind==='middle'?1:0;const row=dots(parts,at);
   if(it.kind==='spell1'||it.kind==='spell2'){
    caption.textContent=it.kind==='spell1'?'Hear the first sound. Match it to a letter.':'Hear the first and last sounds. Match each to a letter.';
    jobs=[tell('Listen to '+w+'.'),...it.ask.flatMap(i=>[tell(i===0?'The first sound is':'The last sound is'),play(parts[i]),done=>{row.children[i].textContent=parts[i].g;row.children[i].classList.add('focus');speak('Write the letter '+parts[i].g.toUpperCase()+'.',{done});}])];
   }else if(it.kind==='count'){
    caption.textContent='One box for each sound we hear.';jobs=[tell(w+'. Listen to each sound.'),...parts.map((p,i)=>done=>{[...row.children].forEach((x,j)=>x.classList.toggle('focus',j===i));sound(p,done);}),tell('We heard '+parts.length+' sounds. '+w+'.')];
   }else if(it.kind==='blend'){
    caption.textContent='Listen to the sounds, then join them into a word.';jobs=[...parts.map(play),tell('Put the sounds together. '+w+'.')];
   }else{
    const pos={first:'first',last:'last',middle:'middle'}[it.kind];caption.textContent='Listen for the '+pos+' sound.';
    jobs=[tell(w+'. Listen to its sounds.'),...parts.map(play),tell('The '+pos+' sound is'),play(parts[at]),tell(w+'.')];
   }
  }else if(it.kind==='delete'||it.kind==='swap'){
   card.append(picture('build-art',w));const ps=PokePhonics.parts(w),row=dots(ps,it.kind==='swap'?it.at:0);
   caption.textContent=it.kind==='delete'?'Take one sound away. What is left?':'Change one sound to make a new word.';
   jobs=it.kind==='delete'?[tell(w+'. Take away'),play(it.gone),done=>{row.children[it.where==='end'?ps.length-1:0]?.classList.add('removed');speak('What is left? '+it.answer+'.',{done});}]:[tell(w+'. Change'),play(it.out),tell('to'),play(it.in),tell('Now we have '+it.answer+'.')];
   jobs.push(done=>{card.append(picture('build-art',it.answer));done();});
  }else{
   showWord(w,parts);card.append(picture('build-art',w));caption.textContent=it.kind==='build'?'Say the word. Match the sounds to letters.':'Point to each sound. Blend them into a word.';
   jobs=[tell('Watch me.'),done=>soundOut(tl,parts,false,done),tell('Join the sounds. '+w+'.')];
  }
  card.append(caption);const next=btn('btn read-next','Try together',()=>teachDone(),'Try together →');next.disabled=true;$('rdActions').append(next);
  const current=run,idx=run.i;replay=()=>{next.disabled=true;chain(jobs,180,()=>{if(run===current&&run.i===idx)next.disabled=false;});};replay();
 }

 /* ---------- renderers ---------- */
 const RENDER={};
 RENDER.unknown=()=>advance();
 /* Sound buddies use the real, locally bundled official Pokémon artwork. */
 function buddyImage(b,cls='sound-buddy-mon'){
  const im=el('img',cls);im.src=b.image;im.alt=b.name;im.width=180;im.height=180;
  im.onerror=()=>{im.onerror=null;im.src=imgArt(b.id);};return im;
 }
 function buddyCard(b){
  const card=el('div','sound-buddy-lesson');
  const pair=el('div','sound-buddy-letter');pair.append(el('strong','',b.letter),el('span','',b.letter.toUpperCase()));
  card.append(pair,buddyImage(b),el('div','sound-buddy-name',b.name));
  const keyword=el('div','sound-buddy-keyword');keyword.append(picture('buddy-key-art',b.keyword),el('span','',b.keyword));card.append(keyword);
  if(b.letter==='q')card.append(el('p','buddy-note','q works with u: qu'));
  if(b.letter==='x')card.append(el('p','buddy-note','Listen at the end of box.'));
  return card;
 }
 function explainBuddy(b,done){
  const tail=b.letter==='x'?'Listen at the end of box.':b.letter==='q'?'Q works with U. Listen to the sounds at the start of queen.':'Listen to the first sound in '+b.keyword+'.';
  const intro=b.letter==='x'?'This is X. Xatu is our X buddy. Its name starts with a different sound.':b.letter==='q'?'This is Q. Quagsire is our buddy.':'This is the letter '+b.letter.toUpperCase()+'. '+b.name+'. Listen to the first sound.';
  chain([next=>speak(intro,{done:next}),next=>sound(b.g,next),next=>speak(tail,{done:next}),next=>sound(b.g,next)],650,done);
 }
 RENDER.buddyMeet=it=>{
  const b=B.get(it.buddyLetter);$('rdStage').append(buddyCard(b));$('rdPrompt').textContent='';
  replay=()=>explainBuddy(b);setTimeout(()=>{if(run?.item===it)replay();},250);
  $('rdActions').append(btn('btn read-next','Try together',()=>{stop();teachDone();},'Try together'));
 };
 function renderBuddyChoice(it){
  const b=B.get(it.buddyLetter),guided=it.kind==='buddyGuide';
  $('rdPrompt').textContent=guided?'Find our sound':it.kind==='buddyWord'?(b.letter==='x'?'Listen at the end':'Listen at the start'):'Listen. Find the sound.';
  if(guided)$('rdStage').append(buddyCard(b));
  else{const ear=btn('hunt-ear','Listen again',()=>replay(),PokeVisuals.icon('listen'));$('rdStage').append(ear);}
  // The fresh spoken word is the question. No Pokémon, keyword picture,
  // printed word, highlighted answer or modelled target sound is shown.
  replay=()=>it.kind==='buddyWord'?speak('Listen to '+it.word+'. '+(b.letter==='x'?'Find the letters for the last sounds.':b.letter==='q'?'Find the letters for the first sounds.':'Find the letter for the first sound.'),{rate:.8}):sound(b.g);
  setTimeout(()=>{if(run?.item===it)replay();},300);
  const showHelp=()=>{
   if(run?.item!==it||run.done)return;
   help('Pokémon sound buddy shown');const q=adventure.tracker.question();if(q){q.buddyCue=true;adventure.tracker.changed(run.ref.sid);}
   if(!$('rdStage').querySelector('.sound-buddy-lesson'))$('rdStage').append(buddyCard(b));
   for(const button of $('rdOptions').children)if(button.dataset.g===b.g)button.classList.add('tutor-guided');
   stop();explainBuddy(b);
  };
  it.options.forEach(g=>{const button=btn('ltile','Letters '+g,button=>{
   if(g===it.answer){stop();right(button,g);}
   else{wrong(button,g);setTimeout(showHelp,450);}
  },esc(g));button.dataset.g=g;$('rdOptions').append(button);});
  if(!guided)$('rdActions').append(btn('btn read-help','Show my sound buddy',showHelp,'Help me'));
 }
 RENDER.buddyGuide=renderBuddyChoice;RENDER.buddySound=renderBuddyChoice;RENDER.buddyWord=renderBuddyChoice;
 RENDER.meet=it=>{
  const e=D.G[it.g];const stage=$('rdStage');
  const card=el('div','meet-card');const t=el('div','meet-tile');const tl=tiles(t,[{g:label(it.g),sound:e[0],cls:clsOf(it.g),play:it.g}]);
  card.append(t,picture('meet-art',e[1],e[2]),el('div','meet-key',e[1]));stage.append(card);
  // Letter name and sound together, as at school: "This is the letter S. S says /s/, as in sun."
  const up=it.g.toUpperCase();
  const sayIt=()=>namesOn()&&it.g.length===1
   ?speak('This is the letter '+up+'. '+up+' says',{rate:.8,done:()=>sound(it.g,()=>setTimeout(()=>speak('as in '+e[1],{rate:.8}),200))})
   :sound(it.g,()=>setTimeout(()=>speak(e[1],{rate:.8}),250));
  replay=sayIt;setTimeout(()=>{flash(tl[0]);sayIt();},300);
  $('rdPrompt').textContent='';
  $('rdActions').append(btn('btn read-next','Next',()=>teachDone(),'▶'));
 };
 RENDER.shape=it=>{
  $('rdPrompt').textContent='';tiles($('rdStage'),[{g:it.target,cls:clsOf(it.target)}],{mute:true});
  replay=()=>sound(it.target);setTimeout(replay,300);
  it.options.forEach(g=>$('rdOptions').append(btn('ltile','Letter '+g,b=>{if(g===it.answer)right(b,g,go=>sound(g,go));else{wrong(b,g);if(run.wrong>=2)fade($('rdOptions'),x=>x.textContent===it.answer);}},esc(g))));
 };
 RENDER.upper=it=>{
  const big=el('div','upper-target',it.target);$('rdStage').append(big);$('rdPrompt').textContent='Find the capital';
  replay=()=>speak('Find the capital letter '+it.target.toUpperCase(),{rate:.8});setTimeout(replay,250);
  it.options.forEach(g=>$('rdOptions').append(btn('ltile upper','Capital '+g,b=>{if(g===it.answer)right(b,g);else{wrong(b,g);if(run.wrong>=2)fade($('rdOptions'),x=>x.textContent===it.answer);}},esc(g))));
 };
 RENDER.hunt=it=>{
  const ear=el('div','hunt-ear');ear.innerHTML=PokeVisuals.icon('listen');$('rdStage').append(ear);
  replay=()=>sound(it.target);setTimeout(replay,350);ear.onclick=replay;
  it.options.forEach(g=>{const b=btn('ltile','Sound '+label(g),b=>{if(g===it.answer)right(b,g,go=>sound(g,go));else{wrong(b,g);setTimeout(()=>sound(it.target),450);if(run.wrong>=2&&!run.round.placement)fade($('rdOptions'),x=>x.dataset.g===it.answer);}},esc(label(g)));b.dataset.g=g;b.dataset.cls=clsOf(g);$('rdOptions').append(b);});
 };
 /* The core change: he decodes; the app never says the word first. */
 RENDER.read=it=>{
  const wordBox=el('div','sound-word');$('rdStage').append(wordBox);
  const tl=tiles(wordBox,it.parts,{onTap:()=>{}});
  let level=0;
  replay=()=>speak('Tap each sound. Say them fast. Find the picture.',{rate:.85});
  const helpBtn=btn('btn read-help','Help me sound it out',()=>{
   if(run.round.placement)return;
   level++;help(level===1?'sounds modelled':level===2?'blend modelled':'word spoken');
   if(level===1)soundOut(tl,it.parts,false);else if(level===2)soundOut(tl,it.parts,true);else{blendOut(tl,it.parts,it.word);fade($('rdOptions'),x=>x.dataset.w===it.answer);}
  },PokeVisuals.icon('listen'));
  if(!run.round.placement)$('rdActions').append(helpBtn);
  it.options.forEach(o=>{const b=btn('pic','Picture '+(it.options.indexOf(o)+1),b=>{
   if(R.clean(o.w)===it.answer)right(b,o.w,go=>blendOut(tl,it.parts,it.word,go));
   else{wrong(b,o.w);if(!run.round.placement){if(run.wrong===1)setTimeout(()=>soundOut(tl,it.parts,false),450);else{help('word spoken');setTimeout(()=>blendOut(tl,it.parts,it.word),450);fade($('rdOptions'),x=>x.dataset.w===it.answer);}}}
  },'');PokeReadingArt.paint(b,R.clean(o.w));b.dataset.w=R.clean(o.w);$('rdOptions').append(b);});
 };
 RENDER.build=it=>{
  const art=picture('build-art',it.word);$('rdStage').append(art);
  const slots=el('div','build-slots');it.parts.forEach(p=>{const s=el('div','slot');s.dataset.cls=p.cls==='silent'?'team':p.cls;slots.append(s);});$('rdStage').append(slots);
  let at=0;replay=()=>speak(R.clean(it.word),{rate:.75});setTimeout(replay,300);art.onclick=replay;
  it.tiles.forEach(g=>{const b=btn('ltile','Sound '+label(g),b=>{
   const want=it.parts[at];if(!want||run.done)return;
   if(g===want.g&&!b.classList.contains('used')){[...$('rdOptions').children].forEach(x=>x.classList.remove('hint'));slots.children[at].textContent=g;slots.children[at].classList.add('filled');b.classList.add('used');b.disabled=true;sound(want);at++;
    if(at>=it.parts.length)setTimeout(()=>right(slots,R.clean(it.word),go=>speak(R.clean(it.word),{rate:.75,done:go})),450);}
   else{if(!run.wrong)respond(g,false);run.wrong++;sndOops();b.classList.add('wrong');setTimeout(()=>b.classList.remove('wrong'),400);
    setTimeout(()=>sound(want),300);
    // Help after two misses: fade only tiles this word no longer needs, and point at the next one.
    // (Fading by "not the next letter" used to grey out letters needed for later boxes, leaving him stuck.)
    if(run.wrong>=2){const need=it.parts.slice(at).map(p=>p.g),free=[...$('rdOptions').children].filter(x=>!x.classList.contains('used'));
     free.forEach(x=>{const k=need.indexOf(x.dataset.g);if(k>=0)need.splice(k,1);else{x.disabled=true;x.classList.add('faded');}});
     const next=free.find(x=>x.dataset.g===want.g&&!x.disabled);if(next){next.classList.remove('hint');void next.offsetWidth;next.classList.add('hint');}}}
  },esc(g));b.dataset.g=g;$('rdOptions').append(b);});
 };
 RENDER.heartTeach=it=>{
  const h=it.heart,w=h.w;const word=el('div','heart-word');word.innerHTML=esc(w.slice(0,h.i))+'<span class="tricky">'+esc(w.slice(h.i,h.i+h.n))+'</span>'+esc(w.slice(h.i+h.n));
  $('rdStage').append(el('div','heart-icon','❤️'),word);$('rdPrompt').textContent='';
  replay=()=>speak(w+'. The red part is tricky. '+w,{rate:.78});setTimeout(replay,300);
  $('rdActions').append(btn('btn read-next','Next',()=>teachDone(),'▶'));
 };
 RENDER.heart=it=>{
  const ear=el('div','hunt-ear');ear.innerHTML=PokeVisuals.icon('listen');$('rdStage').append(ear);
  replay=()=>speak(it.word,{rate:.75});setTimeout(replay,300);ear.onclick=replay;
  it.options.forEach(w=>{const b=btn('wchoice','Word '+(it.options.indexOf(w)+1),b=>{if(w===it.answer)right(b,w);else{wrong(b,w);setTimeout(replay,420);if(run.wrong>=2)fade($('rdOptions'),x=>x.textContent===it.answer);}},esc(w));$('rdOptions').append(b);});
 };
 RENDER.sentence=it=>{
  const s=el('div','read-sentence');it.text.split(' ').forEach((w,i)=>{const t=el('span','w',w);t.onclick=()=>{if(!active())return;help('word read aloud');flash(t);speak(w.replace(/[^A-Za-z]/g,''),{rate:.75});};s.append(t,document.createTextNode(' '));});
  $('rdStage').append(s);
  replay=()=>speak('Read it. Then tap the picture.',{rate:.85});
  $('rdActions').append(btn('btn read-help','Read it to me',()=>{help('sentence read aloud');speak(it.text,{rate:.78});},PokeVisuals.icon('listen')));
  it.options.forEach((o,k)=>{const b=btn('pic sentence-pic','Picture '+(k+1),b=>{if(k===it.answer)right(b,k,go=>speak(it.text,{rate:.8,done:go}));else{wrong(b,k);if(run.wrong>=2){help('sentence read aloud');speak(it.text,{rate:.78});fade($('rdOptions'),x=>+x.dataset.k===it.answer);}}},'');
   b.dataset.k=k;const n=o.count||1;for(let c=0;c<n;c++){const sp=el('span','pic-e');PokeReadingArt.paint(sp,R.clean(o.w));sp.style.fontSize=(o.size?o.size*52:n>1?40:52)+'px';b.append(sp);}$('rdOptions').append(b);});
 };
 RENDER.vocab=it=>{
  const ear=el('div','hunt-ear');ear.innerHTML=PokeVisuals.icon('listen');$('rdStage').append(ear);
  replay=()=>speak('Tap the '+it.word+'.',{rate:.82});ear.onclick=replay;setTimeout(replay,250);
  it.options.forEach(o=>{const b=btn('pic','Picture',b=>{if(o.w===it.answer)right(b,o.w);else wrong(b,o.w);},'');PokeReadingArt.paint(b,R.clean(o.w));b.dataset.w=o.w;$('rdOptions').append(b);});
 };
 RENDER.rhyme=it=>{
  const big=picture('build-art',it.word);big.onclick=()=>speak(it.word,{rate:.8});$('rdStage').append(big);
  const opts=()=>[...$('rdOptions').children];
  replay=()=>speak('Which one rhymes with '+it.word+'?',{rate:.85,done:()=>chain(opts().map(b=>next=>{flash(b);speak(b.dataset.w,{rate:.8,done:next});}),250)});
  it.options.forEach(o=>{const b=btn('pic','Picture',b=>{if(o.w===it.answer)right(b,o.w,go=>speak(it.word+', '+o.w+'. They rhyme!',{rate:.8,done:go}));else{wrong(b,o.w);if(!run.round.placement){speak(o.w,{rate:.8});if(run.wrong>=2){help('rhyme shown');fade($('rdOptions'),x=>x.dataset.w===it.answer);}}}},'');PokeReadingArt.paint(b,R.clean(o.w));b.dataset.w=o.w;$('rdOptions').append(b);});
  setTimeout(replay,300);
 };
 RENDER.first=it=>{
  const first=it.parts[0];
  replay=()=>{const opts=[...$('rdOptions').children];speak('Which one starts with',{rate:.85,done:()=>sound(first,()=>chain(opts.map(b=>next=>{flash(b);speak(b.dataset.w,{rate:.8,done:next});}),200))});};
  $('rdPrompt').textContent='';const ear=el('div','hunt-ear');ear.innerHTML=PokeVisuals.icon('listen');ear.onclick=()=>sound(first);$('rdStage').append(ear);
  it.options.forEach(o=>{const b=btn('pic','Picture',b=>{if(o.w===it.answer)right(b,o.w,go=>speak(o.w,{rate:.8,done:go}));else{wrong(b,o.w);speak(o.w,{rate:.8});if(run.wrong>=2)fade($('rdOptions'),x=>x.dataset.w===it.answer);}},'');PokeReadingArt.paint(b,R.clean(o.w));b.dataset.w=o.w;$('rdOptions').append(b);});
  setTimeout(replay,300);
 };
 RENDER.blend=it=>{
  const ear=el('div','hunt-ear');ear.innerHTML=PokeVisuals.icon('listen');$('rdStage').append(ear);
  const dots=el('div','ear-dots');it.parts.filter(p=>p.cls!=='silent').forEach(()=>dots.append(el('span')));$('rdStage').append(dots);
  replay=()=>{const ps=it.parts.filter(p=>p.cls!=='silent');chain(ps.map((p,i)=>next=>{[...dots.children].forEach((d,k)=>d.classList.toggle('lit',k===i));sound(p,next);}),320,()=>[...dots.children].forEach(d=>d.classList.remove('lit')));};
  ear.onclick=replay;setTimeout(()=>speak('Listen and blend.',{rate:.85,done:replay}),250);
  it.options.forEach(o=>{const b=btn('pic','Picture',b=>{if(o.w===it.answer)right(b,o.w,go=>speak(o.w,{rate:.8,done:go}));else{wrong(b,o.w);setTimeout(replay,400);if(run.wrong>=2){help('word spoken');fade($('rdOptions'),x=>x.dataset.w===it.answer);}}},'');PokeReadingArt.paint(b,R.clean(o.w));b.dataset.w=o.w;$('rdOptions').append(b);});
 };
 /* Shared by the listening steps: a target picture or ear, picture choices read aloud */
 function picChoices(it,onRight,onWrongExtra){
  it.options.forEach(o=>{const b=btn('pic','Picture',b=>{if(o.w===it.answer)right(b,o.w,go=>onRight(o,go));else{wrong(b,o.w);if(!run.round.placement){speak(o.w,{rate:.8});onWrongExtra?.();if(run.wrong>=2){help('answer shown');fade($('rdOptions'),x=>x.dataset.w===it.answer);}}}},'');PokeReadingArt.paint(b,R.clean(o.w));b.dataset.w=o.w;$('rdOptions').append(b);});
 }
 const readOptions=next=>chain([...$('rdOptions').children].map(b=>go=>{flash(b);speak(b.dataset.w,{rate:.8,done:go});}),200,next);
 RENDER.last=it=>{
  const ear=el('div','hunt-ear');ear.innerHTML=PokeVisuals.icon('listen');ear.onclick=()=>sound(it.target);$('rdStage').append(ear);
  replay=()=>speak('Which one ends with',{rate:.85,done:()=>sound(it.target,()=>readOptions())});
  picChoices(it,(o,go)=>speak(o.w+'. It ends with',{rate:.8,done:()=>sound(it.target,go)}));setTimeout(replay,300);
 };
 RENDER.middle=it=>{
  const ear=el('div','hunt-ear');ear.innerHTML=PokeVisuals.icon('listen');ear.onclick=()=>sound(it.target);$('rdStage').append(ear);
  replay=()=>speak('Which one has',{rate:.85,done:()=>sound(it.target,()=>speak('in the middle?',{rate:.85,done:()=>readOptions()}))});
  picChoices(it,(o,go)=>{const ps=it.parts||R.splitWord(o.w).filter(p=>p.cls!=='silent');chain(ps.map(p=>next=>sound(p,next)),260,()=>speak(o.w,{rate:.8,done:go}));});setTimeout(replay,300);
 };
 RENDER.delete=it=>{
  const big=picture('build-art',it.word);big.onclick=()=>speak(it.word,{rate:.78});$('rdStage').append(big);
  replay=()=>speak('Say '+it.word+'. Now say '+it.word+' without',{rate:.8,done:()=>sound(it.gone,()=>speak('What is left?',{rate:.85,done:()=>readOptions()}))});
  picChoices(it,(o,go)=>speak(it.word+' without',{rate:.8,done:()=>sound(it.gone,()=>speak('is '+o.w+'!',{rate:.8,done:go}))}));setTimeout(replay,300);
 };
 RENDER.swap=it=>{
  const big=picture('build-art',it.word);big.onclick=()=>speak(it.word,{rate:.78});$('rdStage').append(big);
  const pos=['first','middle','last'][it.at];
  replay=()=>speak('This is '+it.word+'. Change the '+pos+' sound',{rate:.8,done:()=>sound(it.out,()=>speak('to',{rate:.85,done:()=>sound(it.in,()=>speak('What do you get?',{rate:.85,done:()=>readOptions()}))}))});
  picChoices(it,(o,go)=>speak(it.word+', '+o.w+'!',{rate:.8,done:go}));setTimeout(replay,300);
 };
 /* Letter names, as at school: "Find the letter M." */
 RENDER.lname=it=>{
  const ear=el('div','hunt-ear');ear.innerHTML=PokeVisuals.icon('listen');$('rdStage').append(ear);
  const up=it.target.toUpperCase();replay=()=>speak('Find the letter '+up+'.',{rate:.8});ear.onclick=replay;setTimeout(replay,300);
  it.options.forEach(g=>{const b=btn('ltile','Letter '+g,b=>{if(g===it.answer)right(b,g,go=>speak(up+'. '+up+' says',{rate:.8,done:()=>sound(g,go)}));else{wrong(b,g);setTimeout(replay,450);if(run.wrong>=2)fade($('rdOptions'),x=>x.dataset.g===it.answer);}},esc(g));b.dataset.g=g;$('rdOptions').append(b);});
 };
 /* Spelling step by step: sound boxes for the whole word, only the first (then first and last) to fill. */
 function renderSpell(it){
  const art=picture('build-art',it.word);$('rdStage').append(art);
  const boxes=el('div','build-slots sound-boxes');it.parts.forEach((p,i)=>{const b=el('div','slot'+(it.ask.includes(i)?' ask':' given'));b.dataset.cls=p.cls;boxes.append(b);});$('rdStage').append(boxes);
  let k=0;const ask=()=>it.ask[k],word=()=>speak(it.word,{rate:.72});
  const prompt=()=>speak(it.ask.length===1?'What is the first sound?':k===0?'What is the first sound?':'What is the last sound?',{rate:.85});
  replay=()=>speak(it.word,{rate:.72,done:prompt});art.onclick=word;setTimeout(replay,300);
  const lightBoxes=done=>chain(it.parts.map((p,i)=>next=>{[...boxes.children].forEach((b,j)=>b.classList.toggle('lit',j===i));sound(p,next);}),220,()=>{[...boxes.children].forEach(b=>b.classList.remove('lit'));done?.();});
  it.tiles.forEach(g=>{const b=btn('ltile','Letter '+label(g),b=>{
   if(run.done)return;const want=it.parts[ask()];
   if(g===want.g&&!b.classList.contains('used')){[...$('rdOptions').children].forEach(x=>x.classList.remove('hint'));const box=boxes.children[ask()];box.textContent=label(g);box.classList.add('filled');b.classList.add('used');b.disabled=true;k++;
    if(k>=it.ask.length)sound(want,()=>setTimeout(()=>right(boxes,it.word,go=>lightBoxes(()=>speak(it.word,{rate:.75,done:go}))),200));
    else {run.wrong=0;[...$('rdOptions').children].forEach(x=>{if(!x.classList.contains('used')){x.disabled=false;x.classList.remove('faded','hint');}});sound(want,()=>setTimeout(prompt,250));}}
   else{if(!run.wrong)respond(g,false);run.wrong++;sndOops();b.classList.add('wrong');setTimeout(()=>b.classList.remove('wrong'),400);
    // First miss: stretch the word and say the sound he needs; second: fade the rest and point.
    setTimeout(()=>speak(it.word,{rate:.6,done:()=>sound(want)}),350);
    if(run.wrong>=2){help('sound given');[...$('rdOptions').children].forEach(x=>{if(x.dataset.g!==want.g&&!x.classList.contains('used')){x.disabled=true;x.classList.add('faded');}});
     const next=[...$('rdOptions').children].find(x=>x.dataset.g===want.g&&!x.disabled);if(next){next.classList.remove('hint');void next.offsetWidth;next.classList.add('hint');}}}
  },esc(label(g)));b.dataset.g=g;$('rdOptions').append(b);});
 }
 RENDER.spell1=renderSpell;RENDER.spell2=renderSpell;
 RENDER.count=it=>{
  const art=picture('build-art',it.word);$('rdStage').append(art);
  replay=()=>speak('How many sounds in '+it.word+'?',{rate:.8});art.onclick=()=>speak(it.word,{rate:.75});setTimeout(replay,250);
  const parts=PokePhonics.parts(it.word);
  $('rdActions').append(btn('btn read-help','Say the sounds',()=>{help('sounds modelled');chain(parts.map(p=>next=>sound(p,next)),300);},PokeVisuals.icon('listen')));
  it.options.forEach(k=>{const b=btn('count-choice',k+' sounds',b=>{if(k===it.answer)right(b,k,go=>chain(parts.map(p=>next=>sound(p,next)),260,go));else{wrong(b,k);if(run.wrong>=2)fade($('rdOptions'),x=>+x.dataset.k===it.answer);}},'');b.dataset.k=k;for(let c=0;c<k;c++)b.append(el('span','count-dot'));$('rdOptions').append(b);});
 };
 RENDER.punct=it=>{
  $('rdPrompt').textContent='';replay=()=>speak('Which one is written the right way?',{rate:.85});setTimeout(replay,250);
  it.options.forEach(t=>$('rdOptions').append(btn('wchoice punct','Sentence '+(it.options.indexOf(t)+1),b=>{if(t===it.answer)right(b,t,go=>speak('A sentence starts with a capital letter and ends with a full stop.',{rate:.85,done:go}));else{wrong(b,t);if(run.wrong>=1)speak('Look at the start and the end.',{rate:.85});}},esc(t))));
 };
 RENDER.name=it=>{
  const wordBox=el('div','sound-word name-word');$('rdStage').append(wordBox);const tl=tiles(wordBox,it.parts);
  replay=()=>speak('Read the name. Who is it?',{rate:.85});setTimeout(replay,250);
  $('rdActions').append(btn('btn read-help','Help me sound it out',()=>{help('sounds modelled');soundOut(tl,it.parts,false);},PokeVisuals.icon('listen')));
  it.options.forEach(m=>{const b=btn('pic mon-pic','Pokémon',b=>{
   if(m.id===it.answer)right(b,m.id,go=>blendOut(tl,it.parts,m.name,()=>{catchNamed(m.id);go();}));
   else{wrong(b,m.id);if(run.wrong>=2){help('word spoken');blendOut(tl,it.parts,m.name);fade($('rdOptions'),x=>+x.dataset.id===it.answer);}}},'');
   b.dataset.id=m.id;b.append(monImg(m.id));$('rdOptions').append(b);});
 };
 function catchNamed(id){
  if(caught.includes(id))return;
  beginCeremony(20000);
  setTimeout(function w(){if(!speechIdle()||busy){setTimeout(w,250);return;}catchMon(id);},600);
 }
 RENDER.quiz=it=>{
  const q=it.quiz;$('rdPrompt').textContent=q.q;replay=()=>speak(q.q,{rate:.85});setTimeout(replay,250);
  q.o.forEach((o,k)=>{const b=btn('pic quiz-pic','Answer '+(k+1),b=>{if(k===it.answer)right(b,k,go=>speak(o.t,{rate:.8,done:go}));else{wrong(b,k);if(run.wrong>=1)fade($('rdOptions'),x=>+x.dataset.k===it.answer);}},'');
   b.dataset.k=k;if(o.m)b.append(monImg(o.m));else{const art=el('span','pic-e',o.e);PokeReadingArt.emoji(art,o.e,D.ART);b.append(art);}b.append(el('small','',o.t));$('rdOptions').append(b);});
 };
 RENDER.book=it=>{
  const bk=it.book;let p=0,taps=0;
  const draw=()=>{
   const pg=bk.pages[p];pips(bk.pages.length,p);$('rdPrompt').textContent=p===0?bk.title:'';
   const stage=$('rdStage');stage.replaceChildren();const art=el('div','book-art');if(pg.m)art.append(monImg(pg.m));else{art.textContent=pg.a||'';PokeReadingArt.paint(art,pg.picture)||PokeReadingArt.emoji(art,pg.a,D.ART);}stage.append(art);
   const text=el('div','book-text');const names=D.ROUTES.flatMap(r=>r.mons.map(m=>m.name.toLowerCase()));
   pg.t.split(/(\s+)/).forEach(tok=>{if(/^\s+$/.test(tok)){text.append(document.createTextNode(' '));return;}const s=el('span','w',tok);const c=tok.replace(/[^A-Za-z']/g,'');if(names.includes(c.toLowerCase()))s.classList.add('mon');
    s.onclick=()=>{if(!active()||!c)return;taps++;recordAction('word tap',c);flash(s);speak(c,{rate:.72});};text.append(s);});
   stage.append(text);
   const acts=$('rdActions');acts.replaceChildren();
   acts.append(btn('btn','Back a page',()=>{if(p>0){p--;draw();}},'◀'));
   acts.append(btn('btn read-help','Read this page to me',()=>{recordAction('page read aloud',p);help('page read aloud');const ws=[...text.querySelectorAll('.w')];chain(ws.map(w=>next=>{ws.forEach(x=>x.classList.remove('on'));w.classList.add('on');speak(w.textContent.replace(/[^A-Za-z']/g,''),{rate:.75,done:next});}),80,()=>ws.forEach(x=>x.classList.remove('on')));},PokeVisuals.icon('listen')));
   acts.append(btn('btn read-next','Next page',()=>{if(p<bk.pages.length-1){p++;draw();sndTap();}else{state.books[it.route]=Date.now();save();teachDone();}},p===bk.pages.length-1?'✓':'▶'));
   acts.children[0].disabled=p===0;
  };
  replay=()=>speak(p===0?'Read the book. Tap a word if you need help.':'Read the page.',{rate:.85});
  draw();if(run.i===0)setTimeout(replay,250);
 };
 function recordAction(kind,value){const q=adventure.tracker.question();if(!q)return;q.actions||=[];q.actions.push({kind,value,at:Date.now(),activeMs:q.activeMs});adventure.tracker.changed(run.ref.sid);}

 /* ---------- writing (stroke order, generous tolerance) ---------- */
 const NS='http://www.w3.org/2000/svg',TOL=17,SAMPLES=64;
 function svgEl(tag,attrs){const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);return e;}
 RENDER.write=it=>{
  const svg=svgEl('svg',{viewBox:'0 0 100 140',class:'write-svg'});$('rdStage').append(svg);
  const hint=el('div','write-hint');$('rdStage').append(hint);
  const strokes=D.WRITE[it.letter];let k=0,W=null;
  replay=()=>sound(it.letter);
  const draw=()=>{
   svg.replaceChildren(svgEl('line',{x1:5,y1:56,x2:95,y2:56,class:'wguide'}),svgEl('line',{x1:5,y1:112,x2:95,y2:112,class:'wbase'}));
   strokes.forEach(d=>svg.append(svgEl('path',{d,class:'wghost'})));for(let i=0;i<k;i++)svg.append(svgEl('path',{d:strokes[i],class:'wdone'}));
   if(k>=strokes.length){sndGood();addStar(1);sound(it.letter);hint.textContent='';setTimeout(()=>teachDone(),900);return;}
   const guide=svgEl('path',{d:strokes[k],class:'wnext'});svg.append(guide);const ink=svgEl('path',{d:'',class:'wink'});svg.append(ink);
   const len=guide.getTotalLength?guide.getTotalLength():0;const pts=[];for(let i=0;i<SAMPLES;i++){const p=guide.getPointAtLength?guide.getPointAtLength(len*i/(SAMPLES-1)):{x:0,y:0};pts.push({x:p.x,y:p.y});}
   svg.append(svgEl('circle',{cx:pts[0].x,cy:pts[0].y,r:7,class:'wstart'}));
   W={pts,ink,reached:0,trail:[],drawing:false,guide};hint.textContent=strokes.length>1?'Stroke '+(k+1)+' of '+strokes.length:'';
  };
  const pt=e=>{const r=svg.getBoundingClientRect(),s=Math.min(r.width/100,r.height/140),ox=(r.width-100*s)/2,oy=(r.height-140*s)/2;return {x:(e.clientX-r.left-ox)/s,y:(e.clientY-r.top-oy)/s};};
  const d2=(a,b)=>(a.x-b.x)**2+(a.y-b.y)**2;
  svg.addEventListener('pointerdown',e=>{if(!W||!active())return;const p=pt(e);if(d2(p,W.pts[0])>(TOL*1.7)**2&&d2(p,W.pts[W.reached])>(TOL*1.7)**2){hint.textContent='Start on the green dot';return;}W.drawing=true;svg.setPointerCapture?.(e.pointerId);move(e);});
  const move=e=>{if(!W?.drawing)return;e.preventDefault();const p=pt(e);W.trail.push(p);W.ink.setAttribute('d','M '+W.trail.map(q=>q.x.toFixed(1)+' '+q.y.toFixed(1)).join(' L '));for(let j=W.reached;j<=Math.min(SAMPLES-1,W.reached+12);j++)if(d2(p,W.pts[j])<TOL*TOL)W.reached=j;if(W.reached>=SAMPLES-6){W.drawing=false;k++;W=null;setTimeout(draw,220);}};
  svg.addEventListener('pointermove',move);
  const up=()=>{if(!W?.drawing)return;W.drawing=false;if(W.reached<=4){W.trail=[];W.ink.setAttribute('d','');hint.textContent='Start on the green dot';}else hint.textContent='Keep going';};
  ['pointerup','pointercancel','pointerleave'].forEach(t=>svg.addEventListener(t,up));
  svg.addEventListener('touchstart',e=>e.preventDefault(),{passive:false});
  $('rdActions').append(btn('btn read-help','Show me',()=>{if(!W)return;help('stroke shown');const dot=svgEl('circle',{r:6,class:'wdot',cx:W.pts[0].x,cy:W.pts[0].y});svg.append(dot);let i=0;const t=setInterval(()=>{i+=1.4;if(i>=SAMPLES-1||!W){clearInterval(t);dot.remove();return;}const p=W.pts[Math.floor(i)];dot.setAttribute('cx',p.x);dot.setAttribute('cy',p.y);},26);},'👀'));
  draw();setTimeout(replay,300);
 };

 /* ---------- blocks, placement and routes ---------- */
 function startBlock(onDone){
  const s=st(),plan=R.nextActivity(sessions(),s,recent);
  if(plan.act==='placement'){startPlacement(onDone);return;}
  if(plan.act==='advance'){passRoute(plan.route,onDone);return;}
  const candidates=[...R.available(sessions(),plan.route),...(R.nextBatch(sessions(),plan.route)||[])];
  const buddies=B.select(sessions(),candidates,Date.now());
  if(buddies.length){startRound(B.lesson(buddies,sessions(),candidates,Date.now()),onDone);return;}
  startRound(R.makeRound(plan.act,plan.route,sessions(),s),onDone);
 }
 function passRoute(n,onDone){
  state.passed[n]=Date.now();save();
  enter();setHeader('read',Math.min(R.LAST,n+1));$('rdOptions').replaceChildren();$('rdActions').replaceChildren();$('rdPips').replaceChildren();
  const ref=adventure.begin({section:'read',skill:'advance',kind:'advance',item:'route:'+n,route:n,range:n,support:'gate',format:'advance',teach:true});adventure.respond('passed',true);
  const next=R.route(Math.min(R.LAST,n+1));const last=n>=R.LAST;
  $('rdPrompt').textContent=last?'Every route complete!':'New route: '+next.name;
  const box=el('div','route-open');box.style.setProperty('--route',next.colour);next.mons.slice(0,3).forEach(m=>box.append(monImg(m.id)));$('rdStage').replaceChildren(box);
  sndGood();if(!reduce())burst($('rdStage'),24);addStar(3);
  speak(last?'Amazing! You finished every reading route!':'You did it! Route '+(n+1)+' is open. '+next.name+'!',{rate:.85,done:()=>waitReady2(()=>onDone?.())});
 }
 /* The English check: listening first, then letters, then words, each part stopping early after misses. */
 function startPlacement(onDone){
  enter();setHeader('placement',1);
  const A=new PokeReadingAssess.Assess(),startedAt=Date.now();
  run={round:{act:'placement',route:1,items:[],placement:true,lazy:A},i:0,onDone:()=>finish()};
  const finish=()=>{
   const p=A.result();
   state.assessV=2;state.profile=p;state.resetAt=startedAt;state.placedAt=Date.now();state.placedRoute=p.passed;state.passed={};
   for(let n=1;n<=p.passed;n++)state.passed[n]=Date.now();save();
   adventure.begin({section:'read',skill:'placed',kind:'placed',item:'placed',route:p.passed,range:p.passed,support:'placement',format:'placed',teach:true,assessmentStartedAt:startedAt,profile:p});adventure.respond(p.passed,true);
   $('rdPrompt').textContent='';$('rdOptions').replaceChildren();$('rdActions').replaceChildren();$('rdStage').replaceChildren();
   sndGood();if(!reduce())burst($('rdStage'),16);
   speak('Great listening, '+(childName||'Jonah')+'! Now I know just what to play with you.',{rate:.85,done:()=>waitReady2(()=>onDone?.())});
  };
  speak('Let us play some listening games. Do your best. It is fine not to know.',{rate:.85,done:()=>nextItem()});
 }
 /* ---------- games menu entries ---------- */
 function startFree(){startBlock(()=>{if(mode==='read')startFree();});}
 function openShelf(){
  enter();run=null;setHeader('book',R.currentRoute(st()));$('rdTitle').textContent='My books';
  $('rdPrompt').textContent='';$('rdStage').replaceChildren();$('rdActions').replaceChildren();$('rdPips').replaceChildren();feedback('');
  const s=st(),open=D.ROUTES.filter(L=>L.n<=R.currentRoute(s));const shelf=el('div','shelf');
  open.forEach(L=>{const b=btn('shelf-book',L.book.title,()=>startRound({act:'book',route:L.n,items:R.makeRound('book',L.n,sessions(),s).items},openShelf),'');b.style.setProperty('--route',L.colour);
   const m=L.book.pages.find(p=>p.m);if(m)b.append(monImg(m.m));b.append(el('span','',L.book.title));if(s.books[L.n])b.classList.add('read');shelf.append(b);});
  $('rdOptions').replaceChildren(shelf);replay=()=>speak('Choose a book.',{rate:.85});replay();
 }
 function openLetterTiles(){
  enter();run=null;setHeader('write',R.currentRoute(st()));$('rdTitle').textContent='My letters';$('rdPrompt').textContent='';$('rdStage').replaceChildren();$('rdActions').replaceChildren();$('rdPips').replaceChildren();feedback('');
  const gs=R.graphemesUpTo(R.currentRoute(st())),grid=el('div','letter-grid');
  gs.forEach(g=>{const b=btn('ltile','Sound '+label(g),()=>{sound(g);if(namesOn()&&g.length===1)setTimeout(()=>speak('the letter '+g.toUpperCase(),{rate:.8}),700);},esc(label(g)));grid.append(b);});
  const writeBtn=btn('btn','Write a letter',()=>{const ls=R.singleLetters(R.currentRoute(st()));startRound({act:'write',route:R.currentRoute(st()),items:ls.slice(-6).map(l=>({route:R.currentRoute(st()),kind:'write',item:'l:'+l,letter:l,teach:true}))},openLetterTiles);},'✏️');
  $('rdOptions').replaceChildren(grid);$('rdActions').append(writeBtn);replay=()=>speak('Tap a sound to hear it.',{rate:.85});replay();
  $('rdActions').append(btn('btn','Sound buddies',openLetters,'Sound buddies'));
 }
 function startBuddies(letters){
  const n=R.currentRoute(st()),pool=[...R.available(sessions(),n),...(R.nextBatch(sessions(),n)||[])];
  startRound(B.lesson(letters,sessions(),pool,Date.now()),openLetters);
 }
 function openLetters(){
  stop();enter();run=null;adventure.section?.('cards');setHeader('buddies',R.currentRoute(st()));
  root.classList.add('alphabet-view');
  $('rdTitle').textContent='Pokémon alphabet';$('rdPrompt').textContent='My Pokémon alphabet';
  $('rdStage').replaceChildren();$('rdOptions').replaceChildren();$('rdActions').replaceChildren();$('rdPips').replaceChildren();feedback('');
  const ps=B.progress(sessions()),badges=Object.values(ps).filter(x=>x.badge).length;
  $('rdStage').append(el('p','buddy-collection-note','Tap a letter. Listen, then say the sound.'));
  const grid=el('div','sound-buddy-grid');grid.setAttribute('aria-label','All 26 letter sounds');
  let selected=null;
  const learn=btn('btn read-next','Choose a letter, then practise together',()=>{if(selected)startBuddies([selected.letter]);},'Practise together');learn.disabled=true;
  const playBuddy=(b,card)=>{
   // The automatic repeat is already queued: another tap on the same playing
   // letter must not chop its sound into little fragments.
   if(selected===b&&card.classList.contains('playing'))return;
   stop();shutUp();audio();if(!soundOn)$('soundBtn').click();selected=b;
   grid.querySelectorAll('.sound-buddy-card').forEach(c=>{c.classList.remove('selected','playing');c.setAttribute('aria-pressed','false');});
   card.classList.add('selected','playing');card.setAttribute('aria-pressed','true');
   learn.disabled=false;learn.textContent='Practise '+b.letter.toUpperCase()+' together';learn.setAttribute('aria-label',learn.textContent);
   feedback(b.letter==='x'?'X · hear the end of box. Xatu is our letter buddy.':b.letter==='q'?'Q · q and u work together, as in queen.':b.letter.toUpperCase()+' · '+b.keyword);
   // Exploration is listening, never an independent answer or badge check.
   // Interrupting increments gen, cancelling the pending repeat as well.
   adventure.recordListening?.({section:'read',skill:'buddies',kind:'buddyListen',phase:'explore',item:'g:'+b.g,buddyLetter:b.letter,buddyCue:true});
   chain([next=>sound(b.g,next),next=>sound(b.g,next)],750,()=>{card.classList.remove('playing');card.setAttribute('aria-pressed','false');});
   replay=()=>playBuddy(b,card);
  };
  for(const b of B.ALL){const card=btn('sound-buddy-card'+(ps[b.letter].badge?' remembered':''),'Hear '+b.letter.toUpperCase()+', '+b.name,card=>playBuddy(b,card),'');
   card.dataset.letter=b.letter;card.setAttribute('aria-pressed','false');
   card.append(el('span','buddy-card-letter',b.letter.toUpperCase()+' '+b.letter),buddyImage(b,'buddy-card-mon'),el('span','buddy-card-name',b.name),el('span','buddy-card-status',b.letter==='x'?'box · end sounds':b.letter==='q'?'qu · queen':b.keyword));grid.append(card);}
  $('rdOptions').append(grid);
  $('rdActions').append(learn,btn('btn','Letter writing and other sounds',()=>{stop();openLetterTiles();},'Write & sounds'),el('p','buddy-collection-note',badges+' / 26 remembered in practice'));
  replay=()=>speak('Tap a letter. Listen, then say the sound.',{rate:.8});
 }
 function esc(x){return String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

 /* ---------- old Poké Reading app (same site) ---------- */
 function importLegacy(){
  if(state.legacy)return;
  let raw=null;try{raw=localStorage.getItem(LEGACY_KEY);}catch(e){}
  const L=raw&&R.importLegacy(raw);if(!L)return;
  state.legacy={...L,importedAt:Date.now()};
  const add=L.caught.filter(id=>!caught.includes(id)&&PokeCatalog.byId?.[id]);
  if(add.length){caught.push(...add);pkState();renderBuddyHome();updateBallPill();}
  save();
 }

 /* ---------- grown-ups ---------- */
 const panel=document.createElement('details');panel.className='parent-settings reading-panel';panel.id='readingPanel';
 panel.innerHTML='<summary>Reading · P1 readiness</summary><div id="readingBody"></div>';
 $('learningDashboard').before(panel);   // readiness first: it is what a grown-up looks for
 panel.addEventListener('toggle',()=>{if(panel.open)renderPanel();});
 function profileHTML(p){
  if(!p)return '<p class="muted">The English check has not run yet. It starts automatically the next time he plays.</p>';
  const row=x=>`<tr><td>${esc(x.label)}${x.skipped?'<small>not needed yet</small>':x.stoppedEarly?'<small>stopped early after misses</small>':''}</td><td><b>${x.skipped?'—':x.ok+' / '+x.n}</b></td></tr>`;
  const plan=p.pre?'Starting with listening games (rhyme, first sounds, blending by ear) and letter sounds two or three at a time. Short words begin once four sounds and blending by ear are secure.'
   :p.passed?`Starting at route ${p.passed+1}; earlier sounds and words come back for review.`:'Starting at route 1 with letter sounds two or three at a time, then short words made only from sounds he knows.';
  return `<details open class="assess-box"><summary>English check · ${new Date(p.at).toLocaleDateString('en-US',{month:'short',day:'numeric'})} · <b>${esc(p.level.name)}</b></summary>
   <p>${esc(p.level.what)}</p><p class="muted">${esc(plan)}</p>
   <p class="muted">Letter sounds he knew: <b>${p.known.length?esc(p.known.join(' ')):'none yet'}</b>${p.known.length<25&&p.known.length?` (${25-p.known.length} to learn)`:''}.</p>
   <table class="journal-table"><tbody>${p.rows.map(row).join('')}</tbody></table>
   <p class="muted">One try per question with no help, so a few lucky guesses are possible. Each part stops after a few misses so he is never stuck on things he has not learned.</p></details>`;
 }
 function renderPanel(){
  const s=st(),r=R.readiness(sessions(),s),g=R.gate(r.route,R.itemStats(sessions()),s),L=R.route(r.route),bp=B.progress(sessions());
  const rows=r.rows.map(x=>`<tr><td>${esc(x.label)}${x.note?`<small>${esc(x.note)}</small>`:''}${x.n!==undefined?`<small>${x.n} attempts</small>`:''}</td><td><b>${x.value===null?'—':x.value+(x.unit||'')}</b> / ${x.target}${x.unit||''}${x.secure!==undefined?`<small>${x.secure} practised, ${x.value} confirmed later</small>`:''}</td></tr>`).join('');
  const body=$('readingBody');
  body.innerHTML=`<p><strong>Route ${r.route} of ${R.LAST}: ${esc(L.name)}</strong> · curriculum pace: route ${r.expected} · <b>${r.pace}</b> (target: all routes by ${r.target}, before P1 in January 2028)</p>
  <p class="muted">This route opens the next when: sounds ${g.graphemes.ok}/${g.graphemes.total} practised · words read alone ${g.words.ok}/${g.words.need} · tricky words ${g.heart.ok}/${g.heart.total} · book ${g.book?'✓':'not yet'}${L.caps?` · capitals ${g.caps.ok}/${g.caps.need}`:''}. Two independent successes allow more practice; a later-day success confirms retention. Tapping choices does not establish spoken recall.</p>
  <p class="muted">Curriculum pace is a schedule comparison, not a school-readiness assessment. Listening skills need varied words and success on another day to be marked secure. Adult listening checks separately confirm spoken reading.</p>
  ${profileHTML(s.profile)}
  <details class="assess-box"><summary>Pokémon sound buddies · ${Object.values(bp).filter(x=>x.badge).length}/26 remembered</summary><p class="muted">A badge requires at least five no-picture checks, 80% first-try success across the latest eight, two everyday words, an isolated sound check, and success across days including a later-day check before teaching. This is recognition, not a test of saying the sound aloud.</p><table><tbody>${B.ALL.filter(b=>bp[b.letter].met).map(b=>{const x=bp[b.letter];return `<tr><td>${b.letter.toUpperCase()} · ${b.name}<small>${x.cued} teaching/helped steps</small></td><td>${x.independent}/${x.n} without picture help<small>${x.status}</small></td></tr>`;}).join('')||'<tr><td>No sound-buddy practice yet.</td></tr>'}</tbody></table></details>
  <table class="journal-table"><tbody>${rows}</tbody></table>
  <div class="pprow reading-tools"><button class="btn" id="rdRecall">Check spoken letter sounds</button><button class="btn" id="rdAloud">Listen to ${esc(childName||'Jonah')} read</button><button class="btn" id="rdPlace">Redo English check</button>
  <label>Letter names <select id="rdNames"><option value="auto">On from the start (default)</option><option value="on">On</option><option value="off">Off</option></select></label>
  <label>Move to route <select id="rdMove">${D.ROUTES.map(x=>`<option value="${x.n}" ${x.n===r.route?'selected':''}>${x.n} · ${esc(x.name)}</option>`).join('')}</select></label></div>
  ${state.legacy?`<p class="muted">Imported from the old Poké Reading app: it had reached route ${state.legacy.at} and ${state.legacy.caught.length} Pokémon (added to his collection). Its routes opened on completion rather than mastery, so the reading check decides the starting route.</p>`:''}
  <details><summary>Listen to or record the sounds</summary><p class="muted">The built-in sounds use a female American English voice at a slower pace. They work offline. This recorded voice differs from the tablet voice that reads instructions. Tap ▶ to preview a sound, or ● to replace it with your own short, clean recording. Your recordings stay on this tablet; ✕ restores the built-in sound.</p><div id="rdRecGrid" class="rec-grid"></div></details>`;
  $('rdNames').value=state.namesAt?(state.names?'on':'off'):'auto';
  $('rdNames').onchange=()=>{const v=$('rdNames').value;if(v==='auto'){state.namesAt=0;state.names=false;}else{state.names=v==='on';state.namesAt=Date.now();}save();};
  $('rdMove').onchange=()=>{const to=+$('rdMove').value;if(!confirm('Move reading to route '+to+'? Routes before it are marked done; later routes are reopened.'))return renderPanel();
   for(let n=1;n<=R.LAST;n++){if(n<to)state.passed[n]=state.passed[n]||Date.now();else delete state.passed[n];}
   state.overrideAt=Date.now();save();renderPanel();};
  $('rdPlace').onclick=()=>{if(!confirm('Run the English check again next time he plays?'))return;state.redoCheckAt=Date.now();save();renderPanel();};
  $('rdAloud').onclick=aloudCheck;$('rdRecall').onclick=recallCheck;
  renderRec();
 }
 function recallCheck(){
  const s=st(),gs=R.introduced(sessions(),R.currentRoute(s)).filter(g=>g.length===1).sort((a,b)=>(s.recall?.[a]?.at||0)-(s.recall?.[b]?.at||0)).slice(0,5);let i=0;
  const draw=()=>{const box=$('readingBody');if(i>=gs.length){box.innerHTML='<p>Spoken observations saved. These are separate from picture-choice scores.</p><button class="btn" id="rdBack">Done</button>';$('rdBack').onclick=renderPanel;return;}
   const g=gs[i];box.innerHTML='<p>Show the letter. Ask: “What sound does it make?” Listen before marking. Do not play the sound first.</p><div class="aloud-page" style="font-size:80px;text-align:center">'+g+'</div><div class="pprow"><button class="btn" id="rdRecallYes">Said sound unaided</button><button class="btn" id="rdRecallNo">Needed help</button><button class="btn" id="rdRecallSkip">Skip</button></div>';
   const mark=ok=>{state.recall||={};state.recall[g]={g,ok,at:Date.now(),observer:'grown-up'};save();i++;draw();};$('rdRecallYes').onclick=()=>mark(true);$('rdRecallNo').onclick=()=>mark(false);$('rdRecallSkip').onclick=()=>{i++;draw();};};draw();
 }
 function aloudCheck(){
  const s=st(),n=Math.max(1,Math.min(R.LAST,R.currentRoute(s)-(s.books[R.currentRoute(s)]?0:1)))||1;const L=R.route(n);
  const box=$('readingBody');let p=0,ok=0;
  const draw=()=>{
   if(p>=L.book.pages.length){state.aloud[n]={at:Date.now(),ok,total:L.book.pages.length,route:n};save();box.innerHTML=`<p><strong>${ok}/${L.book.pages.length} pages read accurately.</strong> Saved to his readiness checklist.</p><button class="btn" id="rdBack">Done</button>`;$('rdBack').onclick=renderPanel;return;}
   box.innerHTML=`<p class="muted">Hand him the tablet open on “${esc(L.book.title)}” (Games → Books), or read from here together. Mark each page: read every word correctly without help?</p><div class="aloud-page">${esc(L.book.pages[p].t)}</div><div class="pprow"><button class="btn" id="rdOk">✓ Read it</button><button class="btn" id="rdNo">✗ Needed help</button></div><small>Page ${p+1} of ${L.book.pages.length}</small>`;
   $('rdOk').onclick=()=>{ok++;p++;draw();};$('rdNo').onclick=()=>{p++;draw();};
  };
  draw();
 }
 function renderRec(){
  const grid=$('rdRecGrid');if(!grid)return;grid.replaceChildren();
  // Short vowels and brief stop consonants are useful to preview first.
  const FIRST=['a','e','i','o','u','b','c','d','g','p','t','k','h','j'];
  const gs=[...FIRST,...Object.keys(D.G).filter(g=>(D.G[g][3]!=='end'||g==='ing')&&!FIRST.includes(g)),'id'];
  gs.forEach(g=>{const cell=el('div','rec-cell'+(REC[g]?' has':'')+(FIRST.includes(g)?' first':''));cell.append(el('b','',label(g)));
   const rec=el('button','btn','●');rec.onclick=()=>record(g,rec);const play=el('button','btn','▶');play.disabled=false;play.onclick=()=>{stop();sound(g);};
   const del=el('button','btn','✕');del.disabled=!REC[g];del.onclick=()=>{delete REC[g];try{localStorage.removeItem(REC_PREFIX+g);}catch(e){}renderRec();};
   cell.append(rec,play,del);grid.append(cell);});
 }
 let media=null;
 async function record(g,b){
  if(media){media.stop();return;}
  try{const stream=await navigator.mediaDevices.getUserMedia({audio:true});const chunks=[];media=new MediaRecorder(stream);b.textContent='■';
   media.ondataavailable=e=>chunks.push(e.data);
   media.onstop=()=>{stream.getTracks().forEach(t=>t.stop());media=null;const fr=new FileReader();fr.onload=()=>{REC[g]=fr.result;try{localStorage.setItem(REC_PREFIX+g,fr.result);}catch(e){alert('Storage is full — recording kept until the app closes.');}renderRec();};fr.readAsDataURL(new Blob(chunks,{type:chunks[0]?.type||'audio/webm'}));};
   media.start();setTimeout(()=>media?.stop(),1600);}
  catch(e){alert('Microphone not available on this device.');}
 }

 function leave(){stop();run=null;}
 // read-only hook for the browser regression script; children never see it
 const _current=()=>run&&{item:run.item,act:run.round.act,i:run.i,placement:!!run.round.placement};
 const _round=(act,n)=>startRound(R.makeRound(act,n,sessions(),st()),()=>{});
 return {_current,_round,startBuddies,startBlock,startFree,openShelf,openLetters,leave,importLegacy,renderPanel,
  get state(){return state;},applyState(m){if(!m)return;state=R.mergeState(state,m);save();},
  payload:()=>state,isReading:()=>mode==='read'};
}
