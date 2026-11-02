// Lectura de extractos en PDF (EVO y Revolut inventados), categorías, nómina y duplicados.
const assert = require('assert');
const L = require('./lib');
const { htmlEvo, htmlRevolut, htmlTradeRepublic, xlsSantander, csv } = require('./extractos');

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
  'lee un extracto de Trade Republic sin contar dos veces la inversión'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      // ya tenía la transferencia de EVO a Trade Republic como Inversión y un mes del Excel
      await p.evaluate(() => {
        S.mov.push({ id: uid(), fecha: '2026-10-04', mes: '2026-10', concepto: 'TRANSF /TRADE REPUBLIC', importe: -500, cat: 'INVERSION', metodo: 'banco', cuenta: 'EVO', origen: 'extracto', key: 'x' });
        S.mov.push({ id: uid(), fecha: '2026-09-01', mes: '2026-09', concepto: 'Supermercado', importe: -150, cat: 'SUPERMERCADO', metodo: 'banco', cuenta: '', origen: 'excel' });
        save();
      });
      const tr = htmlTradeRepublic();
      await subir(p, [{ name: 'Certificado.pdf', mimeType: 'application/pdf', buffer: await L.pdfDesdeHtml(browser, tr.html) }]);
      const r = await p.evaluate(() => ({ res: IMP.res[0], sust: Object.values(IMP.sust).filter(Boolean).length, dobles: IMP.dobles && IMP.dobles.lista.length,
        filas: IMP.rows.map(x => ({ c: x.concepto, f: x.fecha, i: x.importe, cat: x.cat, nom: !!x.nomina, est: x.estado })) }));
      assert.equal(r.res.banco, 'Trade Republic');
      assert.equal(r.res.movs.length, tr.n);
      assert.equal(r.res.cuadra, true);
      assert.equal(r.res.saldoFin, tr.saldoFinal);
      const f = c => r.filas.find(x => x.c.startsWith(c));
      assert.equal(f('Plan de inversión').f, '2026-09-02', 'septiembre partido en dos líneas');
      assert.equal(f('Plan de inversión').cat, 'INVERSION');
      assert.equal(f('Plan de inversión').i, -150);
      assert.equal(f('Plan de inversión').est, 'nuevo', 'no se confunde con un apunte del Excel');
      assert.equal(f('Compra').cat, 'INVERSION');
      assert.equal(f('Venta').i, 70.12);
      assert.equal(f('Transferencia de PERSONA').cat, 'TRASPASO');
      assert.equal(f('Transferencia de PERSONA').nom, false);
      assert.equal(f('Transferencia de OTRA').cat, '');
      assert.equal(r.sust, 0, 'no ofrece sustituir el Excel');
      assert.equal(r.dobles, 1);
      await p.click('#impGo'); await L.esperar(500);
      const d = await p.evaluate(() => ({ evo: S.mov.find(x => x.concepto === 'TRANSF /TRADE REPUBLIC').cat, inv: stats('2026-10').by.INVERSION,
        c: S.cuentas.find(c => c.n === 'Trade Republic') }));
      assert.equal(d.evo, 'TRASPASO');
      assert.equal(Math.round(d.inv * 100) / 100, 129.88);
      assert.equal(d.c.v, tr.saldoFinal);
      assert.equal(d.c.inversion, 1);
    })();
  },
  'un extracto que no se puede leer queda en el registro de errores'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      await p.evaluate(() => go('importar'));
      await p.setInputFiles('#pdfInput', [{ name: 'extracto-raro.pdf', mimeType: 'application/pdf', buffer: await L.pdfDesdeHtml(browser, '<p>Esto no es un extracto</p>') }]);
      await p.waitForSelector('#impOut .alert.bad', { timeout: 30000 });
      assert.match(await p.textContent('#impOut'), /anotado al administrador/);
      await L.esperar(300);
      const e = await p.evaluate(() => { const d = JSON.parse(localStorage.__mockDb); return Object.keys(d).filter(k => k.startsWith('errores/')).map(k => d[k]); });
      assert.equal(e.length, 1);
      assert.match(e[0].mensaje, /No he encontrado movimientos/);
      assert.match(e[0].detalle, /extracto-raro\.pdf · pdf/);
      assert.ok(!/Esto no es un extracto/.test(JSON.stringify(e[0])), 'no guarda el contenido del extracto');
      // el administrador lo ve en Usuarios
      await p.reload(); await L.esperar(800);
      if (await p.isVisible('#lCont:not(.hide)')) await p.click('#lCont .btn.pri').catch(() => {});
      await L.esperar(600);
      await p.evaluate(() => go('usuarios')); await L.esperar(300);
      assert.match(await p.textContent('#errAdmin'), /No he encontrado movimientos/);
      await p.click('#errAdmin .erX'); await L.esperar(300);
      assert.match(await p.textContent('#errAdmin'), /No hay errores/);
    })();
  },
  'lee un Excel antiguo (.xls) del Santander y lo pone en su cuenta'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      const x = xlsSantander();
      await subir(p, [{ name: 'transactions.xls', mimeType: 'application/vnd.ms-excel', buffer: x.buffer }]);
      const r = await p.evaluate(() => ({ b: IMP.res[0].banco, c: IMP.res[0].cuenta, iban: IMP.res[0].iban, n: IMP.res[0].movs.length, cuadra: IMP.res[0].cuadra, fin: IMP.res[0].saldoFin }));
      assert.deepEqual(r, { b: 'Santander', c: 'Santander', iban: '1234', n: x.n, cuadra: true, fin: x.saldoFinal });
    })();
  },

  'si no reconoce el banco pregunta la cuenta, y la recuerda'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      const c = csv();
      await subir(p, [{ name: 'movimientos.csv', mimeType: 'text/csv', buffer: Buffer.from(c.texto) }]);
      assert.equal(await p.evaluate(() => IMP.res[0].cuenta), '', 'no la mete en EVO');
      assert.ok(await p.isDisabled('#impGo'), 'no deja guardar sin elegir cuenta');
      assert.match(await p.textContent('#impOut'), /No reconozco el banco/);
      await p.selectOption('[data-cuenta="0"]', 'Santander');
      assert.ok(await p.isEnabled('#impGo'));
      await p.click('#impGo'); await L.esperar(300);
      assert.equal(await p.evaluate(() => S.mov.filter(x => x.cuenta === 'Santander').length), c.n);
    })();
  },

  'un extracto guardado en la cuenta equivocada se puede pasar a la buena'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      const x = xlsSantander();
      await subir(p, [{ name: 'transactions.xls', mimeType: 'application/vnd.ms-excel', buffer: x.buffer }]);
      await p.selectOption('[data-cuenta="0"]', 'EVO'); await p.click('#impGo'); await L.esperar(300);
      assert.equal(await p.evaluate(() => S.cuentas.find(c => c.n === 'EVO').v), x.saldoFinal);
      await p.evaluate(() => { delete S.aj.ibanCuenta; }); // como en las versiones de antes, que no lo recordaban
      await subir(p, [{ name: 'transactions.xls', mimeType: 'application/vnd.ms-excel', buffer: x.buffer }]);
      assert.match(await p.textContent('#impOut'), /ya estaban guardados, pero en/);
      await p.click('#impMover'); await L.esperar(300);
      const r = await p.evaluate(() => ({ evo: S.mov.filter(m => m.cuenta === 'EVO').length, san: S.mov.filter(m => m.cuenta === 'Santander').length, vEvo: S.cuentas.find(c => c.n === 'EVO').v, vSan: S.cuentas.find(c => c.n === 'Santander').v }));
      assert.deepEqual(r, { evo: 0, san: x.n, vEvo: null, vSan: x.saldoFinal });
      await p.click('#undoBtn');
      assert.equal(await p.evaluate(() => S.mov.filter(m => m.cuenta === 'EVO').length), x.n, 'se puede deshacer');
    })();
  },
  'extracto de ejemplo: se ve cómo clasifica y no se guarda nada'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      await p.evaluate(() => go('importar'));
      assert.match(await p.textContent('#s-importar'), /nunca se sube/);
      const antes = await p.evaluate(() => [S.mov.length, S.reglas.length, S.cuentas.length]);
      await p.click('#impDemo');
      assert.match(await p.textContent('#impOut'), /ejemplo con movimientos inventados/);
      assert.ok(await p.evaluate(() => IMP.rows.some(x => x.concepto.startsWith('COMPRA MERCADONA') && x.cat === 'SUPERMERCADO')));
      assert.ok(!(await p.isVisible('#impGo')), 'no se puede guardar');
      const k = await p.evaluate(() => IMP.rows.findIndex(x => x.concepto.startsWith('COMERCIO DESCONOCIDO')));
      await p.selectOption(`tr[data-k="${k}"] .icat`, 'PERSONAL');
      await p.click('#impDemoFin');
      assert.deepEqual(await p.evaluate(() => [S.mov.length, S.reglas.length, S.cuentas.length]), antes, 'ni movimientos, ni reglas, ni cuentas');
    })();
  },

  'privacidad: se puede leer antes de entrar y en Ayuda'(browser, estado) {
    return (async () => {
      const ctx = await L.nuevoContexto(browser); (estado.contextos ||= []).push(ctx);
      const p = await L.nuevaPagina(ctx); estado.paginas.push(p);
      await L.abrir(p);
      await p.click('#login [data-priv]');
      const t = await p.textContent('#dlgB');
      assert.match(t, /nunca se sube/); assert.match(t, /consola de Firebase/); assert.match(t, /github\.com|GitHub/);
    })();
  },
};
