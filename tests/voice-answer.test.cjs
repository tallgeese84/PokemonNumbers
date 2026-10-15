const {test}=require('node:test'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom'),{IDBFactory}=require('fake-indexeddb');
const V=require('../voice-answer.js'),F=require('../voice-feedback.js');
const tick=()=>new Promise(r=>setTimeout(r,5));
function setup(extra={}){
 const dom=new JSDOM('<div id="host"></div>',{url:'https://example.test',pretendToBeVisual:true}),w=dom.window;
 w.PokeVoiceFeedback=F;w.indexedDB=new IDBFactory();w.Blob=Blob;let now=1000,requested=0,stopped=0,created=0;
 w.Date.now=()=>now;w.URL.createObjectURL=()=>`blob:answer-${++created}`;w.URL.revokeObjectURL=()=>{};
 w.HTMLMediaElement.prototype.pause=function(){};w.HTMLMediaElement.prototype.play=()=>Promise.resolve();
 const stream={getTracks:()=>[{stop(){stopped++;}}]};
 Object.defineProperty(w.navigator,'mediaDevices',{value:{getUserMedia:()=>{requested++;return extra.permission?extra.permission(stream):Promise.resolve(stream);}}});
 class Recorder{static isTypeSupported=()=>true;constructor(){this.state='inactive';this.mimeType='audio/webm';}start(){this.state='recording';}stop(){this.state='inactive';this.ondataavailable?.({data:new w.Blob(['audio'],{type:this.mimeType})});queueMicrotask(()=>this.onstop?.());}}
 w.MediaRecorder=Recorder;const saved=[],feedback=[];
 const controller=V.create(w.document.querySelector('#host'),{prompt:{letter:'m',letterSkill:'name',glyph:'M'},onSave:m=>saved.push(m),onFeedback:r=>feedback.push(r),...extra.options});
 const tap=()=>w.document.querySelector('.voice-tap').click();
 return {dom,w,controller,saved,feedback,tap,advance:()=>{now+=700;},requested:()=>requested,stopped:()=>stopped};
}
test('letter-name recognition accepts name variants but does not pretend to grade isolated sounds',()=>{
 for(const [text,letter] of [['bee','b'],['The letter M.','m'],['double you','w'],['zed','z'],['zee','z']])assert.equal(F.named(text),letter);
 assert.equal(F.judge('m',[{transcript:'em',confidence:.95}]).verdict,'match');
 assert.equal(F.judge('m',[{transcript:'en',confidence:.96}]).verdict,'different');
 assert.equal(F.judge('m',[{transcript:'em',confidence:.2}]).verdict,'unclear');
 assert.equal(F.judge('m',[{transcript:'a whole sentence',confidence:.99}]).verdict,'unclear');
 assert.equal(F.judge('m',[{transcript:'em',confidence:.9},{transcript:'en',confidence:.85}]).verdict,'unclear');
 assert.equal(F.judge('m',[{transcript:'em',confidence:1}],'sound').verdict,'model');
});
test('microphone starts only after a press; stopping saves local audio and sync-safe metadata',async()=>{
 const t=setup();assert.equal(t.requested(),0);t.tap();await tick();assert(t.controller.recording);t.advance();await t.controller.finish();
 assert(t.stopped()>0);assert.equal(t.saved.length,1);assert.equal(t.saved[0].blob,undefined);assert.equal(t.saved[0].saved,true);
 const recordings=await V.storage(t.w).list();assert.equal(recordings.length,1);assert.equal(recordings[0].letter,'m');assert(recordings[0].blob.size>0);
 assert.equal(t.feedback[0].verdict,'model');assert.equal(t.w.document.querySelector('.voice-play').hidden,false);
 await V.storage(t.w).clear();assert.equal((await V.storage(t.w).list()).length,0);t.controller.destroy();t.dom.window.close();
});
test('release or navigation while microphone permission is pending discards a late stream',async()=>{
 let release;const t=setup({permission:stream=>new Promise(r=>{release=()=>r(stream);})});t.tap();assert(t.controller.pending);t.controller.cancel();release();await tick();
 assert(!t.controller.recording);assert.equal(t.stopped(),1);assert.equal(t.saved.length,0);t.controller.destroy();t.dom.window.close();
});
test('background cancellation stops recording without storing an answer',async()=>{
 const t=setup();t.tap();await tick();t.advance();t.w.dispatchEvent(new t.w.Event('blur'));await tick();assert(!t.controller.recording);assert.equal(t.saved.length,0);assert.equal(t.feedback.length,0);t.controller.destroy();t.dom.window.close();
});
test('permission denial is recoverable without inventing an answer',async()=>{
 const t=setup({permission:()=>Promise.reject(Object.assign(Error('no'),{name:'NotAllowedError'}))});t.tap();await tick();assert.match(t.w.document.querySelector('.voice-status').textContent,/permission is off/);assert(!t.controller.recording);assert.equal(t.saved.length,0);t.controller.destroy();t.dom.window.close();
});
test('device recording store keeps only the latest 100 answers',async()=>{
 const t=setup(),s=V.storage(t.w);for(let i=0;i<103;i++)await s.put({id:String(i),createdAt:i});
 const rows=await s.list();assert.equal(rows.length,100);assert.equal(rows[0].id,'102');assert.equal(rows.at(-1).id,'3');t.controller.destroy();t.dom.window.close();
});
test('recognition waits for final results; cancellation ignores late events',()=>{
 const engines=[],got=[],win={setTimeout,clearTimeout,SpeechRecognition:class{constructor(){engines.push(this);}start(){}stop(){}abort(){this.aborted=true;}}};
 const r=F.create(win,{letter:'m',onResult:x=>got.push(x)});r.start();const list=Object.assign([{transcript:'en',confidence:.95}],{isFinal:true});engines[0].onresult({results:[list]});r.finish();assert.equal(got.length,0);engines[0].onend();assert.equal(got[0].verdict,'different');assert(engines[0].aborted);
 const r2=F.create(win,{letter:'m',onResult:x=>got.push(x)});r2.start();const late=engines[1].onend;r2.cancel();late();assert.equal(got.length,1);
});
