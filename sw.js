/* Gym Hero — service worker : l'app fonctionne intégralement hors ligne */
const CACHE = 'gym-hero-v10';
const ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './css/style.css?v=10',
  './js/muscles.js?v=10', './js/exercises.js?v=10', './js/howto.js?v=10', './js/anatomy.js?v=10',
  './js/store.js?v=10', './js/ui.js?v=10', './js/programs.js?v=10', './js/session.js?v=10', './js/app.js?v=10',
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
      .then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== DEMO_CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Les photos de démonstration viennent d'un CDN : une fois consultées, elles
   restent disponibles hors ligne, dans un cache séparé qui survit aux mises à jour. */
const DEMO_CACHE = 'gym-hero-demos';
const DEMO_HOST = 'cdn.jsdelivr.net';

/* Cache d'abord (l'app doit démarrer sans réseau à la salle),
   puis mise à jour silencieuse en arrière-plan. */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  if (url.hostname === DEMO_HOST) {
    e.respondWith(
      caches.open(DEMO_CACHE).then(c => c.match(e.request).then(hit => hit ||
        fetch(e.request).then(res => {
          if (res && (res.status === 200 || res.type === 'opaque')) c.put(e.request, res.clone());
          return res;
        })
      ))
    );
    return;
  }

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

/* Préchargement de toutes les démonstrations, demandé depuis les Paramètres. */
self.addEventListener('message', e => {
  const d = e.data || {};
  if (d.type !== 'precache-demos' || !Array.isArray(d.urls)) return;
  e.waitUntil((async () => {
    const c = await caches.open(DEMO_CACHE);
    let ok = 0;
    for (const u of d.urls) {
      try {
        if (await c.match(u)) { ok++; continue; }
        const r = await fetch(u);
        if (r && r.status === 200) { await c.put(u, r.clone()); ok++; }
      } catch (err) { /* on continue malgré une image manquante */ }
      if (ok % 10 === 0 && e.source) e.source.postMessage({ type: 'demos-progress', done: ok, total: d.urls.length });
    }
    if (e.source) e.source.postMessage({ type: 'demos-done', done: ok, total: d.urls.length });
  })());
});
