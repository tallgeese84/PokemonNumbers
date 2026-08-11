// PokéMath Adventure — offline cache
const CACHE = 'pokemath-v13';
const ART = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/';
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(CORE);
    // precache every artwork; tolerate individual failures
    const LEGEND_IDS = [243,244,245,249,250,251,377,378,379,380,381,382,383,384,385,386,480,481,482,483,484,485,486,487,488,489,490,491,492,493,494,638,639,640,641,642,643,644,645,646,647,648,649,716,717,718,719,720,721,785,786,787,788,789,790,791,792,800,801,802,807,808,809,888,889,890,894,895,896,897,898,905,1007,1008,1017,1024,1025];
    const all = [];
    for (let i = 1; i <= 151; i++) all.push(i);
    LEGEND_IDS.forEach(i => all.push(i));
    for (const i of all){
      try{
        const r = await fetch(ART + i + '.png', { mode: 'no-cors' });
        await c.put(ART + i + '.png', r);
      }catch(err){}
    }
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const isPage = e.request.mode === 'navigate' ||
    new URL(e.request.url).pathname.endsWith('index.html');
  e.respondWith((async () => {
    if (isPage){
      // page: network-first so a repo update shows on the next online visit
      try{
        const r = await fetch(e.request);
        const c = await caches.open(CACHE);
        c.put(e.request, r.clone());
        return r;
      }catch(err){
        return (await caches.match(e.request, { ignoreSearch: true })) || Response.error();
      }
    }
    // everything else (sprites, icons): cache-first for instant offline
    const hit = await caches.match(e.request, { ignoreSearch: true });
    if (hit) return hit;
    try{
      const r = await fetch(e.request);
      if (r && (r.ok || r.type === 'opaque')){
        const c = await caches.open(CACHE);
        c.put(e.request, r.clone());
      }
      return r;
    }catch(err){
      return Response.error();
    }
  })());
});
