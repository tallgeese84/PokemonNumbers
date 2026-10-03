const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const P=require('../reading-phonics.js'),m=require('../assets/phonemes/manifest.json');
test('all phoneme clips use the slower female voice and valid, non-silent, unclipped offline audio',()=>{
 assert.equal(m.voice,'af_heart');assert.equal(m.speed,.7);
 assert.deepEqual(Object.keys(m.clips).sort(),[...P.clips].sort());
 assert.deepEqual(['a','e','i','o','u'].map(k=>m.clips[k].phoneme),['æ','ɛ','ɪ','ɑ','ʌ']);
 assert.deepEqual(['b','p','d','t','g','k'].map(k=>m.clips[k].phoneme),['b','p','d','t','ɡ','k']);
 const sw=fs.readFileSync(path.join(__dirname,'../sw.js'),'utf8');
 for(const [key,c] of Object.entries(m.clips)){
  const data=fs.readFileSync(path.join(__dirname,'../assets/phonemes',c.file));
  assert.equal(data.subarray(0,4).toString(),'RIFF');assert.equal(data.subarray(8,12).toString(),'WAVE');assert.equal(data.readUInt32LE(24),24000);
  assert.equal(crypto.createHash('sha256').update(data).digest('hex'),c.sha256,key);
  assert.ok(c.durationMs>=120&&c.durationMs<=2500);assert.ok(c.rms>.01);assert.ok(sw.includes('./assets/phonemes/'+c.file));
  let peak=0;for(let i=44;i<data.length;i+=2)peak=Math.max(peak,Math.abs(data.readInt16LE(i)));assert.ok(peak>1000&&peak<32767,key);
 }
});
test('female clips soften the audible ending, including short consonants, and retain quiet playback margins',()=>{
 for(const [key,c] of Object.entries(m.clips)){
  const data=fs.readFileSync(path.join(__dirname,'../assets/phonemes',c.file));
  const samples=Array.from({length:(data.length-44)/2},(_,i)=>data.readInt16LE(44+i*2)/32768);
  const start=c.activeStart,end=start+c.activeSamples,n=c.sampleRate/100;
  const rms=a=>Math.sqrt(a.reduce((s,v)=>s+v*v,0)/a.length);
  assert.ok(start>=c.sampleRate*.05&&samples.length-end>=c.sampleRate*.15,key+' has quiet margins');
  assert.ok(samples.slice(0,start).every(x=>x===0)&&samples.slice(end).every(x=>x===0),key+' has silent margins');
  assert.ok(rms(samples.slice(end-n,end))<.012,key+' gently reaches silence over the sound itself');
  if(!['b','d','g','k','p','t','ch','j'].includes(key))assert.ok(rms(samples.slice(start,start+n))<.025,key+' gently enters');
  assert.ok(Math.max(...samples.map(Math.abs))<=.701,key+' leaves headroom');
 }
});
