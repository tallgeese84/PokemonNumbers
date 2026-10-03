// Reproduce with @echogarden/espeak-ng-emscripten 0.3.5, passed as the first argument.
// Audio is generated output; the synthesizer itself is not shipped in the app.
import {pathToFileURL} from 'node:url';import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const {default:factory}=await import(pathToFileURL(path.resolve(process.argv[2])));const m=await factory(),w=new m.eSpeakNGWorker();w.set_voice('en-us');w.set_rate(120);w.set_pitch(55);
const out=path.resolve(process.argv[3]||'assets/phonemes');fs.mkdirSync(out,{recursive:true});
// Vowels are sampled within real word contexts to avoid the synthesizer's final-vowel substitution (I -> i).
const sources={a:['cat',1],e:['bed',1],i:['pin',1],o:['pot',1],u:['cup',1],uu:['book',1],ee:['feet',1],oo:['moon',1],ay:['rain',1],oh:['boat',1],eye:['bike',1],ow:['cow',1],oy:['coin',1],aw:['saw',1],ar:['car',1],or:['fork',1],er:['bird',1],ear:['ear',0],air:['hair',1]};
const cons={b:'b',d:'d',f:'f',g:'g',h:'h',j:'dZ',k:'k',l:'l',m:'m',n:'n',p:'p',r:'r',s:'s',t:'t',v:'v',w:'w',y:'j',z:'z',sh:'S',ch:'tS',th:'T',dh:'D',ng:'N',zh:'Z'};
for(const [key,phon] of Object.entries(cons))sources[key]=['[['+phon+']]',0];
sources.r=['rain',0];sources.w=['web',0];sources.y=['yes',0];
const manifest={engine:'eSpeak NG, Echogarden Emscripten package 0.3.5',voice:'en-us',rate:120,pitch:55,validation:'Phoneme-event boundaries and non-silent PCM checked. Synthetic voice; not a human pronunciation assessment.',clips:{}};
for(const [key,[input,index]] of Object.entries(sources)){
 const chunks=[],events=[];w.synthesize(input,(buf,ev)=>{chunks.push(Buffer.from(buf.buffer,buf.byteOffset,buf.byteLength));events.push(...ev);return false;});
 const raw=Buffer.concat(chunks),phones=events.filter(e=>e.type==='phoneme'&&e.id),phone=phones[index];if(!phone)throw Error('No phoneme for '+key);
 const position=events.indexOf(phone),next=events.slice(position+1).find(e=>e.type==='phoneme'&&e.audio_position>phone.audio_position);
 const start=Math.max(0,Math.floor(phone.audio_position*w.samplerate/1000)),end=Math.min(raw.length/2,Math.floor((next?.audio_position??raw.length/2/w.samplerate*1000)*w.samplerate/1000));
 const clip=raw.subarray(start*2,end*2),pad=Buffer.alloc(Math.round(w.samplerate*.06)*2),pcm=Buffer.concat([pad,clip,pad]);
 let energy=0;for(let i=0;i<clip.length;i+=2)energy+=clip.readInt16LE(i)**2;if(!energy||clip.length<400)throw Error('Silent or missing clip '+key);
 const head=Buffer.alloc(44);head.write('RIFF');head.writeUInt32LE(36+pcm.length,4);head.write('WAVEfmt ',8);head.writeUInt32LE(16,16);head.writeUInt16LE(1,20);head.writeUInt16LE(1,22);head.writeUInt32LE(w.samplerate,24);head.writeUInt32LE(w.samplerate*2,28);head.writeUInt16LE(2,32);head.writeUInt16LE(16,34);head.write('data',36);head.writeUInt32LE(pcm.length,40);const wav=Buffer.concat([head,pcm]);fs.writeFileSync(path.join(out,key+'.wav'),wav);
 manifest.clips[key]={source:input,phoneme:phone.id,fromMs:phone.audio_position,toMs:next?.audio_position,samples:pcm.length/2,sha256:crypto.createHash('sha256').update(wav).digest('hex')};
}
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');console.log(Object.fromEntries(Object.entries(manifest.clips).map(([k,x])=>[k,x.phoneme])));
