const C = 'mcc-v4';
self.addEventListener('install', e => e.waitUntil(caches.open(C).then(c => c.addAll(['/', '/app.js', '/app.css']))));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.pathname.startsWith('/api/')) return;
  e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); return r; })
    .catch(() => caches.match(e.request).then(m => m || caches.match('/'))));
});
