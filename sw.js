// PokéMath v64: only app resources and allowlisted artwork enter this cache.
const CACHE = 'pokemath-v64';
const CORE = ['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./learning-core.js?v=64','./adventure.js?v=64','./adventure.css?v=64','./visuals.js?v=64','./visuals.css?v=64','./assets/meadow.svg','./assets/jonah-avatar.webp','./assets/pokemon-catalog.js?v=64'];
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
