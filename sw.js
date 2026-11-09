/* Service worker PortalKelas v2.0.0
 * - Cangkang aplikasi (HTML/CSS/JS/ikon) di-cache → aplikasi terbuka instan & tetap tampil saat offline.
 * - Permintaan ke Apps Script, CDN, dan font TIDAK pernah di-cache oleh SW (data harus segar;
 *   data offline dikelola aplikasi lewat localStorage).
 * - Versi baru: nama cache berganti → cache lama dihapus saat aktivasi. */
const CACHE_NAME = 'portalkelas-v2.0.0';
const STATIC_ASSETS = [
  './', './index.html', './manifest.json',
  './css/style.css?v=2.0.0', './js/config.js?v=2.0.0',
  './js/core.js?v=2.0.0', './js/ui.js?v=2.0.0', './js/publik.js?v=2.0.0', './js/member.js?v=2.0.0',
  './js/admin-katalog.js?v=2.0.0', './js/admin-crm.js?v=2.0.0', './js/admin-sistem.js?v=2.0.0', './js/init.js?v=2.0.0',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png', './icons/favicon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;              // Apps Script, CDN, font → langsung ke jaringan
  if (url.pathname.endsWith('/js/config.js')) {                  // config: jaringan dulu (GAS_URL baru langsung terpakai)
    event.respondWith(fetch(req).then(res => { const c = res.clone(); caches.open(CACHE_NAME).then(x => x.put(req, c)); return res; }).catch(() => caches.match(req)));
    return;
  }
  if (req.mode === 'navigate') {                                 // halaman: jaringan dulu, cadangan cache saat offline
    event.respondWith(fetch(req).then(res => { const c = res.clone(); caches.open(CACHE_NAME).then(x => x.put('./index.html', c)); return res; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {   // aset bervesi: cache dulu
    if (res.ok) { const c = res.clone(); caches.open(CACHE_NAME).then(x => x.put(req, c)); }
    return res;
  })));
});
