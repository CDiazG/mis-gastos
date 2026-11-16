// Accesibilidad básica: todo control visible tiene nombre, el teclado no cae en cosas ocultas y el foco se ve.
const assert = require('assert');
const L = require('./lib');
module.exports = { 'accesibilidad: controles con nombre, Tab sin trampas y foco visible'(browser, estado) { return (async () => {
  const ctx = await L.nuevoContexto(browser); (estado.contextos ||= []).push(ctx);
  const p = await L.nuevaPagina(ctx); estado.paginas.push(p); await L.crearAdminYEntrar(p);
  await p.evaluate(() => { const h = mesDe(hoy()); S.aj.primerosPasos = false; S.mov.push({ id: 'a', fecha: h + '-02', mes: h, concepto: 'CAFE', importe: -3, cat: 'OCIO', metodo: 'banco' }, { id: 'b', fecha: h + '-03', mes: h, concepto: 'NOMINA', importe: 1500, cat: 'INGRESO', metodo: 'banco', nomina: true }); S.objetivos = [{ id: 'o', nombre: 'Viaje', meta: 500, aport: [] }]; save(); });
  const fallos = {};
  for (const t of ['resumen', 'efectivo', 'movs', 'hist', 'patri', 'importar', 'ajustes', 'ayuda', 'perfil']) {
    await p.evaluate(t => go(t), t); await L.esperar(250);
    const r = await p.evaluate(() => {
      const vis = e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' };
      const nombre = e => (e.getAttribute('aria-label') || (e.getAttribute('aria-labelledby') || '').split(' ').map(i => (document.getElementById(i) || {}).textContent).join(' ') || e.title || (e.labels && [...e.labels].map(l => l.textContent).join(' ')) || e.textContent || e.getAttribute('placeholder') || e.getAttribute('alt') || '').trim();
      const sin = [];
      document.querySelectorAll('button,a[href],input:not([type=hidden]),select,textarea,[role=button],[tabindex="0"]').forEach(e => { if (!vis(e) || e.closest('[hidden],.hide')) return; if (!nombre(e)) sin.push(e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className ? '.' + String(e.className).split(' ')[0] : '')); });
      return [...sin, ...[...document.querySelectorAll('img:not([alt])')].filter(vis).map(e => 'img sin alt')];
    });
    if (r.length) fallos[t] = r;
  }
  assert.deepEqual(fallos, {}, 'controles sin nombre');
  await p.evaluate(() => go('resumen')); const seq = [];
  for (let k = 0; k < 8; k++) { await p.keyboard.press('Tab'); seq.push(await p.evaluate(() => { const e = document.activeElement, cs = getComputedStyle(e); return e.tagName + (e.id ? '#' + e.id : '') + ' | ' + cs.outlineStyle + ' ' + cs.outlineWidth })); }
  assert.ok(!seq.some(x => /^BUTTON#undoBtn/.test(x)), 'el aviso oculto de «Deshacer» no recibe el foco');
  assert.ok(seq.every(x => !/none 0px/.test(x)), 'todo lo enfocado muestra contorno: ' + seq.join(' / '));
})() } };
