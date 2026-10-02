/* Poké Reading retired: reading is now part of PokéMath. This worker removes the
   old app cache, lets the redirect page load from the network, and unregisters. */
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil((async()=>{
  for(const k of await caches.keys())if(k.startsWith('poke-reading-'))await caches.delete(k);
  await self.registration.unregister();
  for(const c of await self.clients.matchAll({type:'window'}))c.navigate(c.url);
})()));
