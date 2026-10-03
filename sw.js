// PokéMath v77: only app resources and allowlisted artwork enter this cache.
const CACHE = 'pokemath-v77';
const CORE = ['./assets/phonemes/a.wav','./assets/phonemes/e.wav','./assets/phonemes/i.wav','./assets/phonemes/o.wav','./assets/phonemes/u.wav','./assets/phonemes/uu.wav','./assets/phonemes/ee.wav','./assets/phonemes/oo.wav','./assets/phonemes/ay.wav','./assets/phonemes/oh.wav','./assets/phonemes/eye.wav','./assets/phonemes/ow.wav','./assets/phonemes/oy.wav','./assets/phonemes/aw.wav','./assets/phonemes/ar.wav','./assets/phonemes/or.wav','./assets/phonemes/er.wav','./assets/phonemes/ear.wav','./assets/phonemes/air.wav','./assets/phonemes/b.wav','./assets/phonemes/d.wav','./assets/phonemes/f.wav','./assets/phonemes/g.wav','./assets/phonemes/h.wav','./assets/phonemes/j.wav','./assets/phonemes/k.wav','./assets/phonemes/l.wav','./assets/phonemes/m.wav','./assets/phonemes/n.wav','./assets/phonemes/p.wav','./assets/phonemes/r.wav','./assets/phonemes/s.wav','./assets/phonemes/t.wav','./assets/phonemes/v.wav','./assets/phonemes/w.wav','./assets/phonemes/y.wav','./assets/phonemes/z.wav','./assets/phonemes/sh.wav','./assets/phonemes/ch.wav','./assets/phonemes/th.wav','./assets/phonemes/dh.wav','./assets/phonemes/ng.wav','./assets/phonemes/zh.wav','./math-tutor.js?v=77',"./reading-phonics.js?v=77","./reading-art.js?v=77","./reading-tutor.js?v=77","./reading-art.css?v=77","./assets/reading/atlas-1.webp","./assets/reading/atlas-2.webp","./assets/reading/atlas-3.webp","./assets/reading/atlas-4.webp","./assets/reading/atlas-5.webp","./assets/reading/atlas-6.webp","./assets/reading/atlas-7.webp",'./drive-mirror.js?v=77','./foundations.js?v=77','./foundation-ui.js?v=77','./foundations.css?v=77','./reading-data.js?v=77','./reading-core.js?v=77','./reading-assess.js?v=77','./reading-ui.js?v=77','./reading.css?v=77','./math-path-core.js?v=77','./math-path-ui.js?v=77','./math-path.css?v=77','./fox-core.js?v=77','./fox-ui.js?v=77','./fox-model.js?v=77','./fox.css?v=77','./assets/vendor/three-r128.min.js?v=77','./assets/vendor/three-GLTFLoader-r128.js?v=77','./assets/vendor/three-SkeletonUtils-r128.js?v=77','./assets/fox.glb?v=77','./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./learning-core.js?v=77','./adventure.js?v=77','./adventure.css?v=77','./visuals.js?v=77','./visuals.css?v=77','./assets/meadow.svg','./assets/jonah-avatar.webp','./assets/pokemon-catalog.js?v=77'];
self.addEventListener('install',event=>event.waitUntil((async()=>{
  await (await caches.open(CACHE)).addAll(CORE);
  await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  // CacheStorage is shared with every app on this origin. Never remove their caches.
  for(const key of await caches.keys())if(/^pokemath-v\d+$/.test(key) && key!==CACHE)await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  const req=event.request,url=new URL(req.url),scope=new URL(self.registration.scope);
  if(req.method!=='GET')return;
  const app=url.origin===scope.origin && url.pathname.startsWith(scope.pathname) &&
    CORE.some(path=>new URL(path,scope).pathname===url.pathname);
  const art=url.origin==='https://raw.githubusercontent.com' && url.pathname.startsWith('/PokeAPI/sprites/master/') && /\.(png|svg|gif)$/.test(url.pathname);
  // In particular Firebase, auth, and all other API requests bypass caches entirely.
  if(!app && !art)return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    if(art){const hit=await cache.match(req);if(hit)return hit;}
    try{
      const response=await fetch(req,{cache:'no-cache'});
      if(response.ok || response.type==='opaque')await cache.put(req,response.clone());
      if(!response.ok && response.type!=='opaque' && app){const hit=await cache.match(req);if(hit)return hit;}
      return response;
    }catch(error){
      return (await cache.match(req)) || (req.mode==='navigate' ? await cache.match(new URL('index.html',scope)) : null) || Response.error();
    }
  })());
});
