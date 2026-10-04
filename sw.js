/* Service Worker — برای باز شدن برنامه بدون اینترنت بعد از اولین بار.
   صفحه‌ی اصلی همیشه اول از اینترنت گرفته می‌شود (تا نسخه‌ی جدید فوری دیده شود) و فقط وقتی اینترنت نیست از حافظه خوانده می‌شود.
   این فایل فقط حافظه‌هایی را پاک می‌کند که اسمشان با atelier- شروع می‌شود و به برنامه‌های دیگر روی همین دامنه دست نمی‌زند. */
const CACHE = 'atelier-v4';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
const CDN_HOSTS = ['cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('atelier-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin && !CDN_HOSTS.includes(url.hostname)) return;

  // صفحه‌ی اصلی: اول اینترنت، بعد حافظه
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }
  // بقیه (فونت، کتابخانه، آیکن): اول حافظه و پشت صحنه به‌روزرسانی
  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(req);
      const network = fetch(req)
        .then(res => { if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()); return res; })
        .catch(() => null);
      if (cached) { e.waitUntil(network); return cached; }
      return (await network) || Response.error();
    })
  );
});
