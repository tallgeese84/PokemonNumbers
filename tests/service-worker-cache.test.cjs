const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../sw.js'),'utf8');
const scope='https://tallgeese84.github.io/PokemonNumbers/';
function harness(){
 const events={},saved=new Map(),network=[],precache=[];
 const key=x=>new URL(typeof x==='string'?x:x.url,scope).href;
 const cache={match:async x=>saved.get(key(x))?.clone(),put:async(x,r)=>saved.set(key(x),r.clone()),addAll:async xs=>precache.push(...xs)};
 const ctx={URL,Response,caches:{open:async()=>cache},fetch:async(req)=>{network.push(key(req));return new Response('downloaded');},self:{registration:{scope},addEventListener:(type,fn)=>events[type]=fn,skipWaiting:async()=>{ctx.activated=true;}}};
 vm.createContext(ctx);vm.runInContext(source,ctx);
 return {ctx,events,saved,network,precache,key,request(path,mode='cors'){let response;events.fetch({request:{method:'GET',url:key(path),mode},respondWith:p=>response=p});return response;}};
}
test('cached phonics, pictures and versioned scripts play without any network request',async()=>{
 const h=harness();h.ctx.fetch=()=>assert.fail('cached resource waited for the network');
 for(const path of ['assets/phonemes/recorded-v82/a.wav','assets/everyday/a-apple.png','reading-ui.js?v=97']){
  h.saved.set(h.key(path),new Response('saved '+path));
  assert.equal(await (await h.request(path)).text(),'saved '+path);
 }
});
test('a new sound downloads once and subsequent taps reuse the saved bytes',async()=>{
 const h=harness(),path='assets/phonemes/recorded-v82/qu.wav';
 assert.equal(await (await h.request(path)).text(),'downloaded');
 assert.equal(await (await h.request(path)).text(),'downloaded');
 assert.deepEqual(h.network,[h.key(path)]);
});
test('the home page checks for updates while media remains cached',async()=>{
 const h=harness();h.saved.set(h.key('index.html'),new Response('old home'));
 assert.equal(await (await h.request('index.html','navigate')).text(),'downloaded');
 assert.equal(h.network.length,1);
 assert.equal(await h.saved.get(h.key('index.html')).text(),'downloaded');
});
test('the saved home page remains available when offline',async()=>{
 const h=harness();h.saved.set(h.key('index.html'),new Response('offline home'));
 h.ctx.fetch=async()=>{throw new Error('offline');};
 assert.equal(await (await h.request('index.html','navigate')).text(),'offline home');
});
test('installing this cache fix reuses existing downloads and refreshes entry pages',async()=>{
 const h=harness();const paths=vm.runInContext('CORE',h.ctx);
 for(const path of paths)h.saved.set(h.key(path),new Response('already saved'));
 let work;h.events.install({waitUntil:p=>work=p});await work;
 assert.deepEqual(h.precache.sort(),['./','./index.html','./manifest.json'].sort());
 assert.equal(h.ctx.activated,true);
});
