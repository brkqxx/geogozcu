// Uygulama kabuğunu önbelleğe alır: internet kesilse ya da çok yavaşlasa da site açılır.
// - Sayfanın kendisi (index.html): önce ağ; ağ 4 sn'de cevap vermezse önbellekteki sürüm açılır.
// - Sürüm numaralı dosyalar (app.js?v=…) ve vendor/ kütüphaneleri: önce önbellek (adı değişince yenisi indirilir).
// - Supabase, harita karoları gibi başka sunuculara giden istekler hiç önbelleğe alınmaz.
const CACHE = 'risk-haritasi-v48';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'vendor/leaflet.js', 'vendor/leaflet.css', 'vendor/markercluster.js',
  'vendor/markercluster.css', 'vendor/supabase.js', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
const NAV_TIMEOUT = 4000;

self.addEventListener('install', (e) => {
  // bir dosya inmezse kurulum tamamen düşmesin: tek tek eklenir
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => null)))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const put = (req, res) => { if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; };

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  // Video (media/) ve parça parça istekler (Range → 206) doğrudan tarayıcıya bırakılır; önbelleğe yazılmaz
  if (url.pathname.includes('/media/') || req.headers.has('range')) return;

  // Sayfa açılışı: ağ + zaman aşımı yedeği. (Not: navigate isteğine ek ayar verilmez, tarayıcı hata atar.)
  if (req.mode === 'navigate') {
    e.respondWith(new Promise((resolve) => {
      let done = false;
      const fallback = () => caches.match('index.html').then((hit) => hit || caches.match('./'));
      const timer = setTimeout(() => fallback().then((hit) => { if (hit && !done) { done = true; resolve(hit); } }), NAV_TIMEOUT);
      fetch(req).then((res) => { put('index.html', res); if (!done) { done = true; clearTimeout(timer); resolve(res); } })
        .catch(() => fallback().then((hit) => { if (!done) { done = true; clearTimeout(timer); resolve(hit || Response.error()); } }));
    }));
    return;
  }

  // Sürümlü dosyalar ve kütüphaneler: önbellekte varsa anında
  if (url.searchParams.has('v') || url.pathname.includes('/vendor/') || url.pathname.includes('/icons/') || url.pathname.includes('/fonts/')) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => put(req, res))));
    return;
  }

  // Diğerleri: önce ağ (tarayıcı önbelleği atlanır), olmazsa önbellek
  e.respondWith(fetch(req, { cache: 'no-cache' }).then((res) => put(req, res))
    .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('index.html'))));
});

// Telefon/bilgisayar bildirimine dokununca uygulamayı aç (açıksa öne getir) ve ilgili sayfaya git
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const link = (e.notification.data && e.notification.data.link) || '#/gelen';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) { if ('focus' in c) { c.focus(); if (c.navigate) c.navigate(self.registration.scope + link); return; } }
    return self.clients.openWindow(self.registration.scope + link);
  }));
});
