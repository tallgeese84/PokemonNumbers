/* Browser transcription is a practice hint, never a phoneme assessment or adult observation. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PokeVoiceFeedback=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const ALIASES=['a|ay','b|bee|be','c|see|sea','d|dee','e|ee','f|ef|eff','g|gee','h|aitch|haitch','i|eye','j|jay','k|kay','l|el|ell','m|em','n|en','o|oh','p|pee|pea','q|cue|queue','r|ar|are','s|es|ess','t|tee|tea','u|you','v|vee','w|double u|double you','x|ex','y|why','z|zee|zed'];
const normalize=s=>String(s||'').toLowerCase().replace(/[.,!?]/g,'').trim().replace(/^(?:(?:it is|it's|this is|my answer is)\s+)?(?:the\s+)?(?:letter\s+)?/,'').replace(/\s+/g,' ').trim();
const named=s=>{const i=ALIASES.findIndex(group=>group.split('|').includes(normalize(s)));return i<0?null:String.fromCharCode(97+i);};
function judge(letter,alternatives=[],skill='name'){
 if(skill!=='name')return {verdict:'model',reason:'isolated-sounds-need-a-listener'};
 const top=alternatives[0],heard=named(top?.transcript),confidence=Number(top?.confidence)||0;
 // Confidence is only a conservative filter, not a probability of correctness.
 if(!heard||confidence<.7)return {verdict:'unclear',reason:'not-clear-enough'};
 if(alternatives.slice(1).some(a=>named(a.transcript)&&named(a.transcript)!==heard&&Number(a.confidence)>confidence-.12))return {verdict:'unclear',reason:'conflicting-alternatives'};
 return {verdict:heard===letter?'match':'different',heard,confidence};
}
function create(win,{letter,onReady,onResult}={}){
 const Recognition=win.SpeechRecognition||win.webkitSpeechRecognition;
 let engine=null,timer=null,finished=false,results=[],problem=null;
 function cleanup(){win.clearTimeout(timer);if(engine){engine.onresult=engine.onerror=engine.onend=engine.onaudiostart=null;try{engine.abort();}catch(e){}}engine=null;}
 function deliver(){if(finished)return;finished=true;cleanup();onResult?.({...judge(letter,results),source:'browser-speech',error:problem||undefined});}
 return {supported:!!Recognition,
  start(){if(!Recognition||engine||finished)return;try{engine=new Recognition();engine.lang='en-US';engine.continuous=false;engine.interimResults=false;engine.maxAlternatives=3;
   engine.onaudiostart=()=>onReady?.();
   engine.onresult=e=>{const r=e.results[e.resultIndex||0];if(r?.isFinal!==false)results=Array.from(r||[],a=>({transcript:a.transcript,confidence:a.confidence}));};
   engine.onerror=e=>{problem=e.error;deliver();};engine.onend=deliver;engine.start();
   timer=win.setTimeout(()=>{problem='timeout';deliver();},12000);
  }catch(e){problem='unavailable';deliver();}},
  finish(){if(finished)return;try{engine?.stop();}catch(e){deliver();}win.clearTimeout(timer);timer=win.setTimeout(()=>{problem='timeout';deliver();},2500);},
  cancel(){finished=true;cleanup();}
 };
}
return {judge,named,create};
});
