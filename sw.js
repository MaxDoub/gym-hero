/* Gym Hero — service worker : l'app fonctionne intégralement hors ligne */
const CACHE = 'gym-hero-v2';
const ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './css/style.css',
  './js/muscles.js', './js/exercises.js', './js/anatomy.js',
  './js/store.js', './js/ui.js', './js/programs.js', './js/session.js', './js/app.js',
  './assets/vendor/chart.umd.min.js',
  './icons/icon.svg', './assets/logo.svg',
  './icons/apple-touch-icon.png', './icons/icon-192.png', './icons/icon-512.png'
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
