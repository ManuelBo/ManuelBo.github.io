self.addEventListener('fetch', function(e){
    console.log('fetch');
});


self.addEventListener('install', function(event) {
    console.log('install');
});

return; 
// // A list of local resources we always want to be cached.
// const PRECACHE_URLS = [
//     // 'index.html',
// ];
  
// const CACHE_EXCLUDE_URLS = [
//     // 'sync.php',
//     // 'sync_store.json',
// ];


// self.addEventListener('install', function(event) {
//     console.log("[Service Worker] Install");

//     event.waitUntil(
//       caches.open(PRECACHE)
//         .then(cache => cache.addAll(PRECACHE_URLS))
//         .then(self.skipWaiting())
//     );
// });

// self.addEventListener('activate', event => {
//     const currentCaches = [PRECACHE, RUNTIME];
//     event.waitUntil(
//       caches.keys().then(cacheNames => {
//         return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
//       }).then(cachesToDelete => {
//         return Promise.all(cachesToDelete.map(cacheToDelete => {
//           return caches.delete(cacheToDelete);
//         }));
//       }).then(() => self.clients.claim())
//     );
// });


// self.addEventListener('fetch', function(e){
//     console.log('fetch');
// });
