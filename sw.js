const VERSION = '2.2.3';
const CACHE = 'nutrition-' + VERSION;

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(['./', './index.html', './manifest.json']))
    .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Для index.html и sw.js — всегда сначала сеть, потом кеш
  const url = new URL(e.request.url);
  const isCore = url.pathname.endsWith('/') ||
    url.pathname.endsWith('index.html') ||
    url.pathname.endsWith('sw.js') ||
    url.pathname.endsWith('manifest.json');

  if(isCore){
    e.respondWith(
      fetch(e.request).then(resp => {
        if(resp && resp.status === 200){
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => caches.match(e.request))
    );
  }else{
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
        if(resp && resp.status === 200 && e.request.method === 'GET'){
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      }))
    );
  }
});
