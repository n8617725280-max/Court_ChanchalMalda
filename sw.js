const C = 'mcc-v7';
self.addEventListener('install', e => e.waitUntil(caches.open(C).then(c => c.addAll(['/', '/app.js', '/app.css', '/qr.js', '/law-sections.json'])).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.pathname.startsWith('/api/')) return;
  if (u.origin !== location.origin && !/^fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) return;   // Supabase download wagairah ko na chhuein
  e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); if (r.ok || r.type === 'opaque') caches.open(C).then(c => c.put(e.request, cp)); return r; })
    .catch(() => caches.match(e.request).then(m => m || caches.match('/'))));
});
