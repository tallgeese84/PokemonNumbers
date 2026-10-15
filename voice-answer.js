/* Local voice recordings, with optional browser-service letter-name feedback.
   Microphone access is requested only after a deliberate button press. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PokeVoiceAnswer=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const MAX_MS=8000,MAX_RECORDINGS=100,DB='pokemath_voice_answers_v1';
function storage(win){
 async function use(mode,work){
  if(!win.indexedDB)throw Error('Local recording storage unavailable');
  const db=await new Promise((resolve,reject)=>{const r=win.indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore('answers',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  return new Promise((resolve,reject)=>{const tx=db.transaction('answers',mode),s=tx.objectStore('answers');let result;
   tx.oncomplete=()=>{db.close();resolve(result);};tx.onerror=tx.onabort=()=>{db.close();reject(tx.error||Error('Storage failed'));};
   work(s,value=>{result=value;});
  });
 }
 return {
  put:answer=>use('readwrite',(s,done)=>{s.put(answer);const r=s.getAll();r.onsuccess=()=>{const all=r.result.sort((a,b)=>b.createdAt-a.createdAt);all.slice(MAX_RECORDINGS).forEach(x=>s.delete(x.id));done(answer.id);};}),
  list:()=>use('readonly',(s,done)=>{const r=s.getAll();r.onsuccess=()=>done(r.result.sort((a,b)=>b.createdAt-a.createdAt));}),
  remove:id=>use('readwrite',s=>s.delete(id)),clear:()=>use('readwrite',s=>s.clear())
 };
}
function element(doc,tag,cls,text){const n=doc.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;}
function create(host,options={}){
 const doc=host.ownerDocument,win=doc.defaultView,store=options.store||storage(win),node=(...args)=>element(doc,...args);
 const box=node('div','voice-answer'),hold=node('button','btn voice-hold','Hold to talk'),tap=node('button','btn secondary voice-tap','Or tap to record'),status=node('p','voice-status','Say your answer aloud, or record it.'),play=node('button','btn voice-play','Hear my answer'),player=node('audio','voice-answer-audio');
 hold.type=tap.type=play.type='button';hold.setAttribute('aria-label','Hold to record your answer');hold.setAttribute('aria-pressed','false');status.setAttribute('role','status');play.hidden=true;player.controls=true;player.hidden=true;
 box.append(hold,tap,status,play,player);host.append(box);
 let destroyed=false,frozen=false,wanted=false,pending=false,recording=false,settling=false,discard=false,epoch=0,stream=null,recorder=null,startedAt=0,limit=null,poll=null,url=null,heldPointer=null,heldKey=false,completion=Promise.resolve(),resolveCompletion=null;
 let recognition=null,recognized=null,feedbackSent=false,hasAnswer=false,autoEnabled=false;
 const nameMode=options.prompt?.letterSkill==='name',canRecognize=!!(win.SpeechRecognition||win.webkitSpeechRecognition),preference='pokemath_auto_letter_names_v1';
 try{autoEnabled=win.localStorage.getItem(preference)==='on';}catch(e){}
 const settings=node('details','voice-settings'),choice=node('label'),toggle=node('input');toggle.type='checkbox';toggle.checked=autoEnabled;toggle.disabled=!canRecognize;
 choice.append(toggle,doc.createTextNode('Automatic letter-name feedback'));
 settings.append(node('summary','','Voice feedback settings'),choice,node('p','',canRecognize?'When enabled, your browser’s speech service may send audio online to recognize letter names. It can mishear a child. Recordings kept by this app stay on this device.':'Automatic voice recognition is unavailable in this browser. Recording and the sound-matching game still work.'),node('p','','Single letter sounds are played for Jonah to copy; they are not automatically scored. A grown-up checks spoken recall.'));
 settings.open=nameMode&&!autoEnabled;box.append(settings);toggle.onchange=()=>{autoEnabled=toggle.checked;try{win.localStorage.setItem(preference,autoEnabled?'on':'off');}catch(e){}if(!autoEnabled)recognition?.cancel();};
 const supported=!!(win.navigator.mediaDevices?.getUserMedia&&win.MediaRecorder&&win.URL.createObjectURL);
 const active=()=>!destroyed&&options.active?.()!==false;
 function cleanStream(s=stream){s?.getTracks().forEach(t=>t.stop());if(s===stream)stream=null;}
 function clearTimers(){win.clearTimeout(limit);win.clearInterval(poll);limit=poll=null;}
 function stopPlayback(){player.pause();}
 function draw(){if(destroyed)return;box.classList.toggle('is-recording',recording);hold.textContent=pending?'Allow the microphone…':recording?'Listening… release to finish':'Hold to talk';hold.setAttribute('aria-pressed',String(recording));tap.textContent=recording?'Stop recording':'Or tap to record';hold.disabled=tap.disabled=!supported||frozen||settling;tap.disabled||=pending;play.disabled=pending||recording||settling;player.hidden=!url||pending||recording||settling;toggle.disabled=!canRecognize||pending||recording||settling;}
 function deliverFeedback(){
  if(feedbackSent||!hasAnswer||recording||pending||settling||destroyed||discard||frozen||!active())return;
  const result=nameMode?recognized:{verdict:'model',source:'sound-model'};if(!result)return;
  feedbackSent=true;
  status.textContent=result.verdict==='match'?'That matches!':result.verdict==='different'?'Let’s listen to this letter’s name, then try again.':result.verdict==='model'?'Listen to the '+(nameMode?'name':'sound')+', then say it again.':result.error?'Voice checking is unavailable right now. Listen, then try again.':'I couldn’t hear clearly. Listen, then try again.';
  options.onFeedback?.(result);
 }
 function stop(keep=true){
  if(pending&&!destroyed)status.textContent='After allowing the microphone, press again and say your answer.';
  wanted=false;epoch++;pending=false;if(!keep){discard=true;recognition?.cancel();}else recognition?.finish();clearTimers();
  if(recorder&&recorder.state!=='inactive'){recording=false;settling=true;draw();if(!destroyed)status.textContent=keep?'Saving your answer…':'Recording stopped.';try{recorder.stop();}catch(e){cleanStream();settling=false;resolveCompletion?.();draw();}cleanStream();return completion;}
  cleanStream();draw();return completion;
 }
 async function start(){
  if(!supported||!active()||frozen||pending||recording||settling)return;
  stopPlayback();recognition?.cancel();recognition=null;recognized=null;feedbackSent=hasAnswer=false;options.onStart?.();wanted=true;pending=true;discard=false;const token=++epoch;status.textContent='Allow the microphone if your browser asks.';draw();
  let incoming;
  try{
   incoming=await win.navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:false},video:false});
   if(token!==epoch||!wanted||!active()||frozen){cleanStream(incoming);return;}
   stream=incoming;pending=false;
   const mime=['audio/webm;codecs=opus','audio/mp4','audio/ogg;codecs=opus'].find(t=>win.MediaRecorder.isTypeSupported?.(t));
   recorder=new win.MediaRecorder(stream,mime?{mimeType:mime,audioBitsPerSecond:64000}:undefined);const capture=recorder,chunks=[];
   completion=new Promise(resolve=>{resolveCompletion=resolve;});
   capture.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data);};
   capture.onerror=()=>{discard=true;stop(false);status.textContent='Could not record. You can still say it to your grown-up.';};
   capture.onstop=async()=>{
    clearTimers();cleanStream();recording=false;settling=true;draw();
    try{
     if(destroyed||discard)return;
     const durationMs=Math.min(MAX_MS,Math.max(0,win.Date.now()-startedAt)),blob=new win.Blob(chunks,{type:capture.mimeType||chunks[0]?.type||'audio/webm'});
     if(!blob.size||durationMs<200){status.textContent='Hold a little longer, then say your answer.';return;}
     if(blob.size>1024*1024){status.textContent='Try a shorter answer.';return;}
     if(url)win.URL.revokeObjectURL(url);url=win.URL.createObjectURL(blob);player.src=url;player.hidden=false;play.hidden=false;
     const id=win.crypto.randomUUID(),createdAt=win.Date.now(),meta={id,createdAt,durationMs,mimeType:blob.type,bytes:blob.size,deviceLocal:true,saved:true};
     try{await store.put({...meta,...options.prompt,blob});}catch(e){meta.saved=false;}
     if(destroyed||discard){if(meta.saved)await store.remove(id).catch(()=>{});return;}
     hasAnswer=true;options.onSave?.(meta);status.textContent=meta.saved?'You said it! Listen back.':'You said it! Replay works for this turn; this browser could not save it.';
     if(nameMode&&!recognition)recognized={verdict:'model',source:'name-model'};
    }finally{recorder=null;settling=false;resolveCompletion?.();resolveCompletion=null;draw();deliverFeedback();}
   };
   startedAt=win.Date.now();recording=true;capture.start(250);status.textContent='I’m listening. Say your answer!';draw();
   if(nameMode&&autoEnabled&&canRecognize&&win.PokeVoiceFeedback){
    status.textContent='Getting the voice checker ready…';recognition=win.PokeVoiceFeedback.create(win,{letter:options.prompt.letter,onReady:()=>{if(recording&&!destroyed)status.textContent='I’m listening. Say the letter name!';},onResult:result=>{recognized=result;deliverFeedback();}});recognition.start();
   }
   limit=win.setTimeout(()=>stop(true),MAX_MS);poll=win.setInterval(()=>{if(!active())stop(false);},100);
  }catch(e){
   if(incoming)cleanStream(incoming);if(token!==epoch||destroyed)return;
   wanted=pending=recording=settling=false;recorder=null;clearTimers();resolveCompletion?.();resolveCompletion=null;
   status.textContent=e.name==='NotAllowedError'?'Microphone permission is off. You can still say it to your grown-up.':'Microphone unavailable. You can still say it to your grown-up.';draw();
  }
 }
 function release(e){if(heldPointer!==null&&e.pointerId===heldPointer){heldPointer=null;stop(true);}}
 function press(e){if(e.button!=null&&e.button!==0)return;e.preventDefault();if(heldPointer!==null||recording||pending||settling)return;heldPointer=e.pointerId;try{hold.setPointerCapture(e.pointerId);}catch(e){}start();}
 function cancelPointer(e){if(e.pointerId===heldPointer){heldPointer=null;stop(false);}}
 function keyDown(e){if([' ','Enter'].includes(e.key)&&!e.repeat){e.preventDefault();heldKey=true;start();}}
 function keyUp(e){if(heldKey&&[' ','Enter'].includes(e.key)){e.preventDefault();heldKey=false;stop(true);}}
 const cancel=()=>{heldPointer=null;heldKey=false;stopPlayback();return stop(false);},hide=()=>{if(doc.hidden)cancel();};
 hold.addEventListener('pointerdown',press);win.addEventListener('pointerup',release);win.addEventListener('pointercancel',cancelPointer);hold.addEventListener('keydown',keyDown);hold.addEventListener('keyup',keyUp);hold.addEventListener('contextmenu',e=>e.preventDefault());
 tap.onclick=()=>{if(!active())return;if(recording)stop(true);else start();};
 player.onplay=()=>{if(!active()||recording||pending)player.pause();else options.onPlayback?.();};
 play.onclick=()=>{if(!active()||!url||recording||pending)return;options.onPlayback?.();player.play().catch(()=>{status.textContent='Tap the audio play control to listen.';});};
 win.addEventListener('blur',cancel);win.addEventListener('pagehide',cancel);doc.addEventListener('visibilitychange',hide);
 if(!supported)status.textContent='This browser cannot record here. Say your answer to your grown-up.';draw();
 return {get recording(){return recording;},get pending(){return pending;},finish:()=>stop(true),cancel,
  freeze(){frozen=true;recognition?.cancel();stop(true);draw();},
  destroy(){destroyed=true;cancel();if(url)win.URL.revokeObjectURL(url);hold.removeEventListener('pointerdown',press);win.removeEventListener('pointerup',release);win.removeEventListener('pointercancel',cancelPointer);hold.removeEventListener('keydown',keyDown);hold.removeEventListener('keyup',keyUp);win.removeEventListener('blur',cancel);win.removeEventListener('pagehide',cancel);doc.removeEventListener('visibilitychange',hide);box.remove();}
 };
}
function review(host,options={}){
 const doc=host.ownerDocument,win=doc.defaultView,store=options.store||storage(win),node=(...args)=>element(doc,...args),detail=node('details','voice-review'),list=node('div'),notice=node('p','','The latest 100 recordings stay on this tablet and are not included in family learning-history sync. Optional automatic name feedback uses your browser’s speech service, which may send audio online. A grown-up checks spoken recall; automatic feedback is a practice hint.'),player=node('audio','voice-answer-audio'),clear=node('button','btn secondary','Delete recordings on this tablet');
 detail.append(node('summary','','Listen to recent answers'),notice,list,player,clear);player.controls=true;player.hidden=true;clear.type='button';host.append(detail);let destroyed=false,url=null,confirm=false;
 async function load(){
  try{const rows=await store.list();if(destroyed)return;list.replaceChildren();if(!rows.length)list.append(node('p','','No recordings saved on this tablet yet.'));
   for(const r of rows.slice(0,12)){const b=node('button','btn voice-review-answer',(r.glyph||r.letter||'Letter')+' · '+(r.letterSkill||'answer')+' · '+new Date(r.createdAt).toLocaleDateString());b.type='button';b.onclick=()=>{if(options.active?.()===false)return;options.onPlayback?.();player.pause();if(url)win.URL.revokeObjectURL(url);url=win.URL.createObjectURL(r.blob);player.src=url;player.hidden=false;player.play().catch(()=>{});};list.append(b);}clear.disabled=!rows.length;
  }catch(e){if(!destroyed){list.textContent='Saved recordings are unavailable in this browser.';clear.disabled=true;}}
 }
 detail.ontoggle=()=>{if(detail.open)load();else player.pause();};
 clear.onclick=async()=>{if(options.active?.()===false)return;if(!confirm){confirm=true;clear.textContent='Tap again to delete all local recordings';return;}try{player.pause();if(url)win.URL.revokeObjectURL(url);url=null;player.removeAttribute('src');player.hidden=true;await store.clear();confirm=false;clear.textContent='Delete recordings on this tablet';await load();}catch(e){notice.textContent='Could not delete recordings. Please try again.';}};
 const pause=()=>player.pause(),hide=()=>{if(doc.hidden)pause();};win.addEventListener('blur',pause);doc.addEventListener('visibilitychange',hide);
 return {destroy(){destroyed=true;pause();if(url)win.URL.revokeObjectURL(url);win.removeEventListener('blur',pause);doc.removeEventListener('visibilitychange',hide);detail.remove();}};
}
return {create,review,storage,MAX_MS,MAX_RECORDINGS};
});
