// PokéMath Adventure — offline cache
const CACHE = 'pokemath-v1';
const ART = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/';
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(CORE);
    // precache every artwork; tolerate individual failures
    for (let i = 1; i <= 151; i++){
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
  e.respondWith((async () => {
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
      return hit || Response.error();
    }
  })());
});
