// Service worker mínimo: permite instalar Cuentas Claras como aplicación y recibir extractos
// desde «Compartir» del móvil (Android). No guarda páginas en caché, así que siempre se carga
// la última versión publicada.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method === 'POST' && url.searchParams.has('compartir')) { e.respondWith(recibir(e.request)); return; }
  if (e.request.mode === 'navigate') e.respondWith(fetch(e.request));
});
// El banco comparte el extracto: se deja un momento en una caché local del propio móvil
// (no sale de él) y se abre la app, que lo recoge, lo borra de ahí y lo lleva a Importar.
async function recibir(req) {
  try {
    const fd = await req.formData();
    const files = fd.getAll('extracto').filter(f => f && typeof f !== 'string' && f.size);
    const c = await caches.open('compartido');
    let i = 0;
    for (const f of files) {
      await c.put(`./compartido/${Date.now()}-${i++}`, new Response(f, { headers: { 'content-type': f.type || 'application/octet-stream', 'x-nombre': encodeURIComponent(f.name || 'extracto'), 'x-fecha': String(Date.now()) } }));
    }
  } catch (e) { /* si falla, se abre la app igualmente */ }
  return Response.redirect('./?compartido=1', 303);
}
