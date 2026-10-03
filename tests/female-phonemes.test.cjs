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
