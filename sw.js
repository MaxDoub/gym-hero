/* Gym Hero — service worker : l'app fonctionne intégralement hors ligne */
const CACHE = 'gym-hero-v6';
const ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './css/style.css?v=6',
  './js/muscles.js?v=6', './js/exercises.js?v=6', './js/anatomy.js?v=6',
  './js/store.js?v=6', './js/ui.js?v=6', './js/programs.js?v=6', './js/session.js?v=6', './js/app.js?v=6',
  './assets/vendor/chart.umd.min.js',
  './assets/body-front.png', './assets/body-back.png',
  './icons/apple-touch-icon.png', './icons/icon-192.png', './icons/icon-512.png',
  './icons/icon-120.png', './icons/icon-152.png', './icons/icon-167.png', './icons/icon-180.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(ASSETS.map(a => c.add(a))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Cache d'abord (l'app doit démarrer sans réseau à la salle),
   puis mise à jour silencieuse en arrière-plan. */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(hit => {
      const net = fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
