// PokéMath v79: only app resources and allowlisted artwork enter this cache.
const CACHE = 'pokemath-v79';
const CORE = ["./reading-buddies.js?v=79", "./assets/sound-buddies/359.png", "./assets/sound-buddies/1.png", "./assets/sound-buddies/10.png", "./assets/sound-buddies/50.png", "./assets/sound-buddies/239.png", "./assets/sound-buddies/653.png", "./assets/sound-buddies/92.png", "./assets/sound-buddies/116.png", "./assets/sound-buddies/174.png", "./assets/sound-buddies/39.png", "./assets/sound-buddies/109.png", "./assets/sound-buddies/131.png", "./assets/sound-buddies/151.png", "./assets/sound-buddies/29.png", "./assets/sound-buddies/43.png", "./assets/sound-buddies/25.png", "./assets/sound-buddies/195.png", "./assets/sound-buddies/447.png", "./assets/sound-buddies/27.png", "./assets/sound-buddies/175.png", "./assets/sound-buddies/197.png", "./assets/sound-buddies/37.png", "./assets/sound-buddies/194.png", "./assets/sound-buddies/178.png", "./assets/sound-buddies/835.png", "./assets/sound-buddies/41.png",'./assets/phonemes/female/a.wav','./assets/phonemes/female/e.wav','./assets/phonemes/female/i.wav','./assets/phonemes/female/o.wav','./assets/phonemes/female/u.wav','./assets/phonemes/female/uu.wav','./assets/phonemes/female/ee.wav','./assets/phonemes/female/oo.wav','./assets/phonemes/female/ay.wav','./assets/phonemes/female/oh.wav','./assets/phonemes/female/eye.wav','./assets/phonemes/female/ow.wav','./assets/phonemes/female/oy.wav','./assets/phonemes/female/aw.wav','./assets/phonemes/female/ar.wav','./assets/phonemes/female/or.wav','./assets/phonemes/female/er.wav','./assets/phonemes/female/ear.wav','./assets/phonemes/female/air.wav','./assets/phonemes/female/b.wav','./assets/phonemes/female/d.wav','./assets/phonemes/female/f.wav','./assets/phonemes/female/g.wav','./assets/phonemes/female/h.wav','./assets/phonemes/female/j.wav','./assets/phonemes/female/k.wav','./assets/phonemes/female/l.wav','./assets/phonemes/female/m.wav','./assets/phonemes/female/n.wav','./assets/phonemes/female/p.wav','./assets/phonemes/female/r.wav','./assets/phonemes/female/s.wav','./assets/phonemes/female/t.wav','./assets/phonemes/female/v.wav','./assets/phonemes/female/w.wav','./assets/phonemes/female/y.wav','./assets/phonemes/female/z.wav','./assets/phonemes/female/sh.wav','./assets/phonemes/female/ch.wav','./assets/phonemes/female/th.wav','./assets/phonemes/female/dh.wav','./assets/phonemes/female/ng.wav','./assets/phonemes/female/zh.wav','./math-tutor.js?v=79',"./reading-phonics.js?v=79","./reading-art.js?v=79","./reading-tutor.js?v=79","./reading-art.css?v=79","./assets/reading/atlas-1.webp","./assets/reading/atlas-2.webp","./assets/reading/atlas-3.webp","./assets/reading/atlas-4.webp","./assets/reading/atlas-5.webp","./assets/reading/atlas-6.webp","./assets/reading/atlas-7.webp",'./drive-mirror.js?v=79','./foundations.js?v=79','./foundation-ui.js?v=79','./foundations.css?v=79','./reading-data.js?v=79','./reading-core.js?v=79','./reading-assess.js?v=79','./reading-ui.js?v=79','./reading.css?v=79','./math-path-core.js?v=79','./math-path-ui.js?v=79','./math-path.css?v=79','./fox-core.js?v=79','./fox-ui.js?v=79','./fox-model.js?v=79','./fox.css?v=79','./assets/vendor/three-r128.min.js?v=79','./assets/vendor/three-GLTFLoader-r128.js?v=79','./assets/vendor/three-SkeletonUtils-r128.js?v=79','./assets/fox.glb?v=79','./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./learning-core.js?v=79','./adventure.js?v=79','./adventure.css?v=79','./visuals.js?v=79','./visuals.css?v=79','./assets/meadow.svg','./assets/jonah-avatar.webp','./assets/pokemon-catalog.js?v=79'];
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
