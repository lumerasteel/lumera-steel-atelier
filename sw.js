/* Service worker: آفلاین‌شدن برنامه. با هر تغییر فایل‌ها، عدد VERSION را بالا ببرید. */
const VERSION = 'atelier-stage11-contacts-bank-1';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const isPage = req.mode === 'navigate';
  e.respondWith(
    // صفحه: اول شبکه (نسخه‌ی تازه)، اگر نبود از حافظه؛ بقیه: اول حافظه
    isPage
      ? fetch(req).then(r => { const cp = r.clone(); caches.open(VERSION).then(c => c.put(req, cp)); return r; }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
      : caches.match(req).then(r => r || fetch(req).then(n => { const cp = n.clone(); caches.open(VERSION).then(c => c.put(req, cp)); return n; }))
  );
});
