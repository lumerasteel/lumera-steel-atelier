/* آتلیه — Service Worker
 * Shell caching for GitHub Pages / installed PWA.
 * Keep this file in the same directory as index.html.
 */
'use strict';

const CACHE_PREFIX = 'atelier-pwa-';
const CACHE_VERSION = 'v15';
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './manifest.json',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Install should not fail entirely if an optional alias is unavailable.
    await Promise.all(APP_SHELL.map(async path => {
      try {
        const response = await fetch(new Request(path, { cache: 'reload' }));
        if (response.ok && (response.type === 'basic' || response.type === 'default')) {
          await cache.put(path, response);
        }
      } catch (_) {
        // A later navigation can still load the app online.
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(key => {
      if (key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME) return caches.delete(key);
      return Promise.resolve(false);
    }));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin) return; // Do not interfere with third-party APIs/CDNs.

  // HTML navigations: prefer fresh content, use cached app shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          await cache.put('./index.html', response.clone());
          return response;
        }
      } catch (_) {
        // Fall back to the most recently cached app shell.
      }
      return (await cache.match(request)) ||
             (await cache.match('./index.html')) ||
             (await cache.match('./')) ||
             Response.error();
    })());
    return;
  }

  // Same-origin static assets: cache-first, refresh successful responses.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) {
      event.waitUntil(fetch(request).then(response => {
        if (response && response.ok && response.type === 'basic') {
          return cache.put(request, response.clone());
        }
      }).catch(() => {}));
      return cached;
    }
    try {
      const response = await fetch(request);
      if (response && response.ok && response.type === 'basic') {
        await cache.put(request, response.clone());
      }
      return response;
    } catch (_) {
      return Response.error();
    }
  })());
});
