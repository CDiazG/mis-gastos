// Lectura de extractos en PDF (EVO y Revolut inventados), categorías, nómina y duplicados.
const assert = require('assert');
const L = require('./lib');
const { htmlEvo, htmlRevolut } = require('./extractos');

async function dentro(browser, estado) {
  const ctx = await L.nuevoContexto(browser); (estado.contextos ||= []).push(ctx);
  const p = await L.nuevaPagina(ctx); estado.paginas.push(p);
  await L.crearAdminYEntrar(p);
  return p;
}
async function subir(p, archivos) {
  await p.evaluate(() => go('importar'));
  await p.setInputFiles('#pdfInput', archivos);
  await p.waitForSelector('#impGo', { timeout: 30000 });
}

module.exports = {
  'lee un extracto tipo EVO y cuadra con el saldo'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      const evo = htmlEvo();
      await subir(p, [{ name: 'evo.pdf', mimeType: 'application/pdf', buffer: await L.pdfDesdeHtml(browser, evo.html) }]);
      const r = await p.evaluate(() => ({ res: IMP.res.map(x => ({ banco: x.banco, n: x.movs.length, cuadra: x.cuadra, fin: x.saldoFin })),
        filas: IMP.rows.map(x => ({ c: x.concepto, i: x.importe, cat: x.cat, mes: x.mes, nom: !!x.nomina })) }));
      assert.equal(r.res[0].banco, 'EVO');
      assert.equal(r.res[0].n, evo.n);
      assert.equal(r.res[0].cuadra, true);
      assert.equal(r.res[0].fin, evo.saldoFinal);
      const f = c => r.filas.find(x => x.c.startsWith(c));
      assert.equal(f('MERCADONA').cat, 'SUPERMERCADO');
      assert.equal(f('MERCADONA').i, -20.9);
      assert.equal(f('RECIB /IBERDROLA').cat, 'VIVIENDA');
      assert.equal(f('PARKING').cat, 'TRANSPORTE');
      assert.equal(f('ZARA').cat, 'PERSONAL');
      assert.equal(f('COMERCIO DESCONOCIDO').cat, '', 'lo desconocido queda sin categoría');
      assert.equal(f('PAGO BIZUM DE AMIGA').cat, '', 'los Bizum no se clasifican solos');
      // nómina: se reconoce y cuenta para el mes siguiente; un Bizum a final de mes no se mueve
      assert.equal(f('TRANSF NOMI').nom, true);
      assert.equal(f('TRANSF NOMI').cat, 'INGRESO');
      assert.equal(f('TRANSF NOMI').mes, '2026-11');
      assert.equal(f('PAGO BIZUM DE PRIMA').mes, '2026-10');
      // se puede cambiar el mes de la nómina
      await p.selectOption('.imes', '2026-10');
      assert.equal(await p.evaluate(() => IMP.rows.find(x => x.nomina).mes), '2026-10');
      await p.selectOption('.imes', '2026-11');
      // aprender una categoría
      const k = await p.evaluate(() => IMP.rows.findIndex(x => x.concepto.startsWith('COMERCIO DESCONOCIDO')));
      await p.selectOption(`tr[data-k="${k}"] .icat`, 'PERSONAL');
      assert.ok(await p.evaluate(() => S.reglas.some(r => r.u && r.t === 'COMERCIO DESCONOCIDO')));
      await p.selectOption('#impBiz', 'OCIO');
      await p.click('#impGo'); await L.esperar(500);
      assert.equal(await p.evaluate(() => S.mov.filter(x => x.origen === 'extracto').length), evo.n);
      assert.equal(await p.evaluate(() => S.cuentas.find(c => c.n === 'EVO').v), evo.saldoFinal);
      // volver a subir el mismo extracto: todo «ya importado»
      await subir(p, [{ name: 'evo.pdf', mimeType: 'application/pdf', buffer: await L.pdfDesdeHtml(browser, evo.html) }]);
      assert.equal(await p.evaluate(() => IMP.rows.filter(x => x.estado === 'ya').length), evo.n);
    })();
  },

  'lee un extracto tipo Revolut con detalle y traspaso'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      const rev = htmlRevolut();
      await subir(p, [{ name: 'revolut.pdf', mimeType: 'application/pdf', buffer: await L.pdfDesdeHtml(browser, rev.html) }]);
      const r = await p.evaluate(() => ({ res: IMP.res[0], filas: IMP.rows.map(x => ({ c: x.concepto, d: x.detalle, i: x.importe, cat: x.cat })) }));
      assert.equal(r.res.banco, 'Revolut');
      assert.equal(r.res.movs.length, rev.n);
      assert.equal(r.res.cuadra, true);
      const f = c => r.filas.find(x => x.c.startsWith(c));
      assert.equal(f('Una recarga').cat, 'TRASPASO');
      assert.equal(f('Una recarga').i, 200);
      assert.equal(f('INDIGO').cat, 'TRANSPORTE', 'se clasifica por el detalle (Parkia)');
      assert.ok(!/Tarjeta/.test(f('Pizzeria').d || ''), 'la línea de la tarjeta no se guarda');
      assert.equal(f('Pizzeria').cat, 'OCIO');
    })();
  },
};
