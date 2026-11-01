// Sin categorizar, comparación, diezmo, préstamos, informe, extracto pendiente y último acceso.
const assert = require('assert');
const L = require('./lib');

async function dentro(browser, estado) {
  const ctx = await L.nuevoContexto(browser); (estado.contextos ||= []).push(ctx);
  const p = await L.nuevaPagina(ctx); estado.paginas.push(p);
  await L.crearAdminYEntrar(p); return p;
}
const mov = (p, o) => p.evaluate(o => { S.mov.push({ id: uid(), metodo: 'banco', cuenta: 'EVO', origen: 'manual', ...o, mes: o.mes || o.fecha.slice(0, 7) }); save(); render(); }, o);

module.exports = {
  'los movimientos sin categoría cuentan como «Sin categorizar»'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado); const m = await p.evaluate(() => MES);
      await mov(p, { fecha: m + '-03', concepto: 'algo raro', importe: -40, cat: '' });
      await mov(p, { fecha: m + '-04', concepto: 'café', importe: -10, cat: 'OCIO' });
      const st = await p.evaluate(m => stats(m), m);
      assert.equal(st.consumo, 50); assert.equal(st.by.SINCAT, 40);
      assert.ok(await p.isVisible('#groups .crow[data-cat=SINCAT]'));
      assert.ok(await p.isVisible('#grafCard .gbar'));
    })();
  },

  'compara cada categoría con el mes anterior'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado); const m = await p.evaluate(() => MES), ant = await p.evaluate(() => addMes(MES, -1));
      await mov(p, { fecha: ant + '-05', concepto: 'cena', importe: -60, cat: 'OCIO' });
      await mov(p, { fecha: m + '-05', concepto: 'cena', importe: -100, cat: 'OCIO' });
      assert.match(await p.textContent('#groups .crow[data-cat=OCIO]'), /▲ 40/);
    })();
  },

  'diezmo automático: pendiente y marcar pagado'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado); const m = await p.evaluate(() => MES);
      await p.evaluate(() => go('ajustes')); await p.check('#dzAuto');
      await mov(p, { fecha: m + '-02', concepto: 'Nómina', importe: 2000, cat: 'INGRESO' });
      await p.evaluate(() => go('resumen'));
      assert.match(await p.textContent('#groups .crow[data-cat=DIEZMO]'), /pendiente/);
      await p.click('.dzpag'); await L.esperar(200);
      assert.equal(await p.evaluate(() => TAB), 'efectivo');
      assert.equal(await p.inputValue('#cImp'), '200,00');
      await p.click('#aGo'); await L.esperar(200);
      await p.evaluate(() => go('resumen'));
      assert.match(await p.textContent('#groups .crow[data-cat=DIEZMO]'), /al día/);
    })();
  },

  'préstamos por persona'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado); const m = await p.evaluate(() => MES);
      await p.evaluate(() => go('efectivo'));
      await p.fill('#cImp', '50'); await p.fill('#cCon', 'le dejo para el regalo'); await p.click('#cChips .chip[data-c=PRESTAMO]');
      await p.fill('#aPer', 'Ana'); await p.click('#aGo'); await L.esperar(150);
      await mov(p, { fecha: m + '-09', concepto: 'PAGO BIZUM DE ANA', importe: 20, cat: 'PRESTAMO', persona: 'Ana' });
      await p.evaluate(() => go('patri'));
      const t = await p.textContent('#prestamos');
      assert.match(t, /Ana/); assert.match(t, /30,00/);
      await p.click('#prestamos .pdev'); await L.esperar(200);
      assert.equal(await p.inputValue('#cImp'), '30,00');
      assert.equal(await p.inputValue('#aPer'), 'Ana');
    })();
  },

  'informe para imprimir'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado); const m = await p.evaluate(() => MES);
      await mov(p, { fecha: m + '-05', concepto: 'cena', importe: -30, cat: 'OCIO' });
      await p.evaluate(() => { window.print = () => {}; });
      await p.click('#s-resumen [data-informe]'); await p.click('#dlgF >> text=Imprimir'); await L.esperar(200);
      const html = await p.innerHTML('#informe');
      assert.match(html, /Presupuesto por categoría/); assert.match(html, /cena/);
      await p.emulateMedia({ media: 'print' });
      assert.ok(await p.isVisible('#informe section h2'), 'las secciones se ven al imprimir');
      await p.emulateMedia({ media: 'screen' });
      await p.evaluate(y => imprimirInforme('anio', y), m.slice(0, 4)); await L.esperar(100);
      assert.match(await p.innerHTML('#informe'), /Mes a mes/);
    })();
  },

  'aviso de extracto pendiente y último acceso'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      await p.evaluate(() => { const c = S.cuentas.find(c => c.n === 'EVO'); c.f = addMes(mesDe(hoy()), -2) + '-28'; c.v = 100; MES = mesDe(hoy()); save(); render(); });
      assert.match(await p.textContent('#alerts'), /Extracto pendiente/);
      await p.evaluate(() => go('usuarios')); await L.esperar(300);
      assert.match(await p.textContent('#uTable'), /entró hoy/);
      await mov(p, { fecha: (await p.evaluate(() => MES)) + '-05', concepto: 'cena', importe: -30, cat: 'OCIO' });
      await p.evaluate(() => go('hist')); await L.esperar(200);
      assert.ok(await p.$('#evoChart svg'), 'gráfico de evolución');
    })();
  },
};
