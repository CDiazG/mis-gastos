// Importar extractos en Norma 43, CSV y Excel (todos inventados).
const assert = require('assert');
const L = require('./lib');
const X = require('./extractos');

async function dentro(browser, estado) {
  const ctx = await L.nuevoContexto(browser); (estado.contextos ||= []).push(ctx);
  const p = await L.nuevaPagina(ctx); estado.paginas.push(p);
  await L.crearAdminYEntrar(p); await p.evaluate(() => go('importar'));
  return p;
}
const filas = p => p.evaluate(() => ({ res: IMP.res.map(r => ({ banco: r.banco, n: r.movs.length, cuadra: r.cuadra, ini: r.saldoIni, fin: r.saldoFin, err: r.error })), filas: IMP.rows.map(x => ({ f: x.fecha, c: x.concepto, i: x.importe, cat: x.cat, nom: !!x.nomina })) }));

module.exports = {
  'Excel con una tabla de pendientes arriba y los movimientos debajo, con otra cabecera'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      const r = await p.evaluate(() => {
        const filas = [['MOVIMIENTOS DE LA CUENTA'], [], ['MOVIMIENTOS PENDIENTES -40,00'], [], ['Fecha', 'Descripción', 'Importe', 'Divisa'], ['14/11/2026', 'CAFE ESTE', '-11', 'EUR'], ['12/11/2026', 'HOTEL X', '-29', 'EUR'], [],
          ['MOVIMIENTOS'], ['Concepto', '-'], ['Fecha', '01/08/2026 - 15/11/2026'], [],
          ['Fecha contable', 'Fecha valor', 'Descripción', 'Importe', 'Saldo', 'Divisa'],
          ['16/11/2026', '16/11/2026', 'TIENDA UNO', -30.99, 1000.01, 'EUR'], ['14/11/2026', '14/11/2026', 'PAGO BIZUM DE ANA', 2.7, 1031, 'EUR'], ['13/11/2026', '12/11/2026', 'SUPER DOS', -17.5, 1028.3, 'EUR']];
        const m = detectarColumnas(filas); const t = tablaAMovs(filas, m);
        return { cab: m.cab, saldo: m.saldo, n: t.movs.length, f: t.movs.map(x => x.concepto) };
      });
      assert.equal(r.cab, 12, 'elige la cabecera con los movimientos de verdad'); assert.equal(r.saldo, 4);
      assert.equal(r.n, 3, JSON.stringify(r));
    })();
  },
  'Norma 43'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado); const n = X.norma43();
      await p.setInputFiles('#pdfInput', { name: 'movimientos.n43', mimeType: 'text/plain', buffer: Buffer.from(n.texto, 'latin1') });
      await p.waitForSelector('#impGo', { timeout: 30000 });
      const r = await filas(p);
      assert.equal(r.res[0].err, undefined);
      assert.equal(r.res[0].banco, 'Santander', 'reconoce el banco por el código de entidad');
      assert.equal(r.res[0].n, n.n); assert.equal(r.res[0].cuadra, true); assert.equal(r.res[0].fin, n.saldoFinal);
      const f = c => r.filas.find(x => x.c.includes(c));
      assert.equal(f('MERCADONA').i, -25.5); assert.equal(f('MERCADONA').cat, 'SUPERMERCADO'); assert.equal(f('MERCADONA').f, '2026-10-03');
      assert.equal(f('NOMINA').nom, true); assert.equal(f('NOMINA').cat, 'INGRESO');
      assert.equal(f('cajero').cat, 'EFECTIVO', 'la retirada en cajero se reconoce por el código 11');
      assert.equal(f('IBERDROLA').cat, 'FACTURAS');
      assert.ok(await p.evaluate(() => S.cuentas.some(c => c.n === 'Santander')), 'crea la cuenta del banco');
    })();
  },

  'CSV con lo más reciente arriba'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado); const c = X.csv();
      await p.setInputFiles('#pdfInput', { name: 'movimientos.csv', mimeType: 'text/csv', buffer: Buffer.from(c.texto) });
      await p.waitForSelector('#impGo', { timeout: 30000 });
      const r = await filas(p);
      assert.equal(r.res[0].n, c.n); assert.equal(r.res[0].cuadra, true); assert.equal(r.res[0].ini, 1000); assert.equal(r.res[0].fin, c.saldoFinal);
      assert.equal(r.filas[0].f, '2026-10-01', 'se ordena de más antiguo a más nuevo');
      assert.equal(r.filas.find(x => x.c.includes('ZARA')).i, -57);
      assert.equal(r.filas.find(x => x.c.includes('ZARA')).cat, 'PERSONAL');
      assert.equal(r.filas.find(x => x.c.includes('LIDL')).cat, 'SUPERMERCADO');
    })();
  },

  'CSV con el tipo en una columna y la referencia con lo importante en otra (estilo CaixaBank)'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      const txt = ['Fecha;Fecha valor;Movimiento;Más datos;Importe;Saldo',
        '05/10/2026;05/10/2026;Bizum;Referencia: 0012345678 Cena con Marta;-24,50;975,50',
        '06/10/2026;06/10/2026;Compra con tarjeta;Ref. 99887766 Mercadona Valencia;-31,20;944,30',
        '07/10/2026;07/10/2026;Recibo;Referencia 5544332211;-9,99;934,31'].join('\n');
      await p.setInputFiles('#pdfInput', { name: 'caixa.csv', mimeType: 'text/csv', buffer: Buffer.from(txt) });
      await p.waitForSelector('#impGo', { timeout: 30000 });
      const r = await filas(p);
      const c = r.filas.map(f => f.c);
      assert.ok(c.some(x => /Cena con Marta/.test(x)), 'lee lo que va después de la referencia: ' + c.join(' | '));
      assert.ok(c.some(x => /Mercadona/.test(x)), 'compra: ' + c.join(' | '));
      assert.ok(c.some(x => /^Recibo$/i.test(x.trim())), 'si solo hay código, se queda el tipo');
      assert.ok(!c.some(x => /0012345678|99887766/.test(x)), 'el código de referencia no ensucia el concepto');
    })();
  },

  'Excel con cargo y abono en columnas'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado); const x = X.xlsx();
      await p.setInputFiles('#pdfInput', { name: 'movimientos.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: x.buffer });
      await p.waitForSelector('#impGo', { timeout: 30000 });
      const r = await filas(p);
      assert.equal(r.res[0].n, x.n); assert.equal(r.res[0].cuadra, true);
      assert.deepEqual(r.filas.map(f => [f.f, f.i]), [['2026-10-03', -30.5], ['2026-10-09', 15], ['2026-10-12', -60]]);
      assert.equal(r.filas.find(f => f.c.includes('REPSOL')).cat, 'TRANSPORTE');
    })();
  },

  'CSV con columnas desconocidas: las pregunta y las recuerda'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      const txt = 'Día;Qué;Euros\n05/10/2026;Panadería;-2,50\n06/10/2026;Farmacia;-8,00\n';
      await p.setInputFiles('#pdfInput', { name: 'raro.csv', mimeType: 'text/csv', buffer: Buffer.from(txt) });
      await p.waitForSelector('#mcF');
      await p.selectOption('#mcF', '0'); await p.selectOption('#mcC', '1'); await p.selectOption('#mcI', '2');
      await p.click('#dlgF >> text=Leer');
      await p.waitForSelector('#impGo', { timeout: 30000 });
      assert.equal(await p.evaluate(() => IMP.rows.length), 2);
      await p.click('#impCancel');
      await p.setInputFiles('#pdfInput', { name: 'raro2.csv', mimeType: 'text/csv', buffer: Buffer.from(txt) });
      await p.waitForSelector('#impGo', { timeout: 30000 });
      assert.equal(await p.evaluate(() => IMP.rows.length), 2, 'la segunda vez ya no pregunta');
    })();
  },
};
