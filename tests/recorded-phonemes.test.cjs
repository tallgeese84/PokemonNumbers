const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const P=require('../reading-phonics.js'),B=require('../reading-buddies.js'),m=require('../assets/phonemes/recorded-v82/manifest.json');
test('all A-Z cards resolve to approved full recordings, with correct C/K and complete Q/X',()=>{
 for(const b of B.ALL){const files=P.clipFiles(b.g);assert.equal(files.length,1,b.letter);assert.match(files[0],/recorded-v82/);assert.ok(fs.existsSync(path.join(__dirname,'..',files[0])));}
 assert.deepEqual(P.clipFiles('c'),P.clipFiles('k'));
 assert.deepEqual(P.clipFiles('qu'),['assets/phonemes/recorded-v82/qu.wav']);
 assert.deepEqual(P.clipFiles('x'),['assets/phonemes/recorded-v82/x.wav']);
 assert.deepEqual(P.clipKeys('qu'),['k','w'],'sound-counting still has two phonemes');
 assert.deepEqual(P.clipKeys('x'),['k','s']);
 assert.deepEqual(P.clipFiles({g:'a',audio:'ay'}),['assets/phonemes/female-v81/ay.wav'],'word-specific pronunciation overrides letter spelling');
 for(const k of ['th','dh','zh','ar','or','er','uu','oo'])assert.match(P.clipFiles(k)[0],/female-v81/,'unreviewed advanced sound '+k);
});
test('bundled recordings retain full decoded duration, natural playback speed, licence and offline coverage',()=>{
 assert.equal(m.license,'MIT');assert.equal(m.language,'en-GB');assert.equal(m.playbackRate,1);
 assert.deepEqual(Object.keys(m.clips).sort(),[...P.recordedClips].sort());
 const sw=fs.readFileSync(path.join(__dirname,'../sw.js'),'utf8');
 const root=path.join(__dirname,'../assets/phonemes/recorded-v82');
 assert.match(fs.readFileSync(path.join(root,'LICENSE.txt'),'utf8'),/Copyright \(c\) 2022 Debbie Dann/);
 for(const [key,c] of Object.entries(m.clips)){
  const data=fs.readFileSync(path.join(root,c.file));assert.equal(data.subarray(0,4).toString(),'RIFF');assert.equal(data.readUInt32LE(24),24000);
  assert.equal((data.length-44)/2,c.samples,key);assert.equal(c.samples,c.sourceDecodedSamples,key+' is not cropped');
  assert.equal(crypto.createHash('sha256').update(data).digest('hex'),c.sha256,key);
  assert.ok(c.durationMs>=500&&c.durationMs<5000,key);assert.ok(c.rms>.003,key);
  assert.ok(sw.includes('./assets/phonemes/recorded-v82/'+c.file),key+' cached');
  let peak=0;for(let i=44;i<data.length;i+=2)peak=Math.max(peak,Math.abs(data.readInt16LE(i)));assert.ok(peak>1000&&peak<22000,key);
 }
});
