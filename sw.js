// Service worker mínimo: permite instalar Cuentas Claras como aplicación.
// No guarda nada en caché, así que siempre se carga la última versión publicada.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  if (e.request.mode === 'navigate') e.respondWith(fetch(e.request));
});
