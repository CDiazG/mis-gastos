// Añadir a mano, resumen, presupuesto, gastos fijos, objetivos, Excel, sincronización y móvil.
const assert = require('assert');
const L = require('./lib');

async function dentro(browser, estado, opciones) {
  const ctx = await L.nuevoContexto(browser, opciones); (estado.contextos ||= []).push(ctx);
  const p = await L.nuevaPagina(ctx); estado.paginas.push(p);
  await L.crearAdminYEntrar(p);
  return { ctx, p };
}
async function anadir(p, { tipo = 'gasto', imp, con, cat, pago = '__efectivo', fecha }) {
  await p.evaluate(() => go('efectivo'));
  await p.click(`#aTipo [data-v=${tipo}]`);
  await p.fill('#cImp', imp); await p.fill('#cCon', con);
  if (cat) await p.click(`#cChips .chip[data-c=${cat}]`);
  await p.click(`#aPago .chip[data-p="${pago}"]`);
  if (fecha) await p.fill('#cFecha', fecha);
  await p.click('#aGo'); await L.esperar(250);
}

module.exports = {
  'añadir gastos e ingresos a mano y verlos en el resumen'(browser, estado) {
    return (async () => {
      const { p } = await dentro(browser, estado);
      const mes = await p.evaluate(() => MES);
      await anadir(p, { tipo: 'ingreso', imp: '2000', con: 'Nómina', cat: 'INGRESO', fecha: mes + '-05' });
      await anadir(p, { imp: '3,50', con: 'café', fecha: mes + '-06' });
      assert.equal(await p.evaluate(() => S.mov.find(x => x.concepto === 'café').cat), 'OCIO', 'categoría automática por el texto');
      await p.click('#aOtra'); await p.fill('#aOtraN', 'Banco Extra'); await p.click('#dlgF >> text=Añadir cuenta');
      await anadir(p, { imp: '100', con: 'ropa', cat: 'PERSONAL', pago: 'Banco Extra', fecha: mes + '-07' });
      await anadir(p, { tipo: 'ingreso', imp: '20', con: 'me devuelven la cena', cat: 'OCIO', fecha: mes + '-08' });
      const st = await p.evaluate(m => stats(m), mes);
      assert.equal(st.ingresos, 2000);
      assert.equal(st.by.OCIO, -16.5 * -1 === 16.5 ? -16.5 : st.by.OCIO); // 3,50 − 20 de devolución
      assert.equal(Math.round(st.consumo * 100) / 100, 83.5);
      assert.equal(await p.evaluate(() => S.mov.find(x => x.concepto === 'ropa').cuenta), 'Banco Extra');
      await p.evaluate(() => go('resumen'));
      assert.match(await p.textContent('#hola'), /Administrador/);
    })();
  },

  'el presupuesto no deja salir de Ajustes si no suma 100'(browser, estado) {
    return (async () => {
      const { p } = await dentro(browser, estado);
      await p.evaluate(() => go('ajustes'));
      await p.fill('[data-p=OCIO]', '13');
      await p.evaluate(() => go('resumen'));
      assert.equal(await p.evaluate(() => TAB), 'ajustes');
      assert.match(await p.textContent('#dlgB'), /105/);
      await p.click('#dlgF >> text=Arreglarlo');
      await p.fill('[data-p=OCIO]', '8');
      await p.evaluate(() => go('resumen'));
      assert.equal(await p.evaluate(() => TAB), 'resumen');
    })();
  },

  'categorías: crear, renombrar y borrar pasando los movimientos'(browser, estado) {
    return (async () => {
      const { p } = await dentro(browser, estado);
      const mes = await p.evaluate(() => MES);
      await anadir(p, { imp: '30', con: 'regalo cumple', cat: 'REGALOS', fecha: mes + '-03' });
      await p.evaluate(() => go('ajustes'));
      await p.fill('#caNombre', 'Mascotas'); await p.click('#catAdd button'); await L.esperar(150);
      assert.ok(await p.evaluate(() => S.cats.some(c => c.n === 'Mascotas')));
      await p.click('tr[data-cid=REGALOS] .cx'); await p.selectOption('#bcDest', 'PERSONAL'); await p.click('#dlgF >> text=Borrar categoría');
      assert.equal(await p.evaluate(() => S.mov.find(x => x.concepto === 'regalo cumple').cat), 'PERSONAL');
      assert.equal(await p.evaluate(() => sumaPct()), 100);
    })();
  },

  'gastos fijos: detecta, avisa si cambia'(browser, estado) {
    return (async () => {
      const { p } = await dentro(browser, estado);
      await p.evaluate(() => {
        const hoyM = mesDe(hoy());
        for (let k = 1; k <= 4; k++) { const m = addMes(hoyM, -k);
          S.mov.push({ id: 'a' + k, fecha: m + '-05', mes: m, concepto: 'TRANS /CASERO INVENTADO', importe: -600, cat: 'VIVIENDA', metodo: 'banco', cuenta: 'EVO', origen: 'extracto' });
          S.mov.push({ id: 'b' + k, fecha: m + '-10', mes: m, concepto: 'NETFLIX', importe: -12.99, cat: 'PERSONAL', metodo: 'banco', cuenta: 'EVO', origen: 'extracto' }); }
        const m1 = addMes(hoyM, -1);
        S.mov.find(x => x.id === 'b1').importe = -15.99;
        save(); MES = m1; go('resumen');
      });
      await p.click('#fjDet'); await L.esperar(200);
      const txt = await p.textContent('#dlgB');
      assert.match(txt, /CASERO/); assert.match(txt, /NETFLIX/);
      await p.click('#dlgF >> text=Añadir marcados'); await L.esperar(200);
      const est = await p.evaluate(() => fijosDelMes(MES).map(x => x.f.nombre + ':' + x.estado).join(','));
      assert.match(est, /NETFLIX:cambia/);
      assert.match(est, /CASERO INVENTADO:ok/);
    })();
  },

  'objetivos de ahorro'(browser, estado) {
    return (async () => {
      const { p } = await dentro(browser, estado);
      await p.evaluate(() => go('patri'));
      await p.fill('#oNom', 'Viaje'); await p.fill('#oMeta', '1200'); await p.click('#objAdd button');
      await p.click('#objetivos .oa'); await p.fill('#oImp', '300'); await p.click('#dlgF >> text=Aportar'); await L.esperar(150);
      assert.match(await p.textContent('#objetivos'), /Faltan 900/);
    })();
  },

  'exportar a Excel genera un .xlsx válido'(browser, estado) {
    return (async () => {
      const { p } = await dentro(browser, estado);
      await anadir(p, { imp: '5', con: 'café', cat: 'OCIO' });
      await p.evaluate(() => go('movs'));
      await p.click('#s-movs [data-export]'); await p.selectOption('#xAl', 'mes');
      const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#dlgF >> text=Descargar')]);
      const buf = require('fs').readFileSync(await dl.path());
      assert.equal(buf.slice(0, 2).toString(), 'PK', 'es un archivo zip/xlsx');
      assert.ok(buf.includes('xl/worksheets/sheet1.xml'));
      assert.match(dl.suggestedFilename(), /\.xlsx$/);
    })();
  },

  'sincroniza entre dos dispositivos'(browser, estado) {
    return (async () => {
      const { ctx, p } = await dentro(browser, estado);
      const m = await L.nuevaPagina(ctx); estado.paginas.push(m);
      await L.abrir(m); await m.click('#lContGo'); await L.esperar(500); await L.cerrarBienvenida(m);
      await anadir(m, { imp: '3,40', con: 'café', cat: 'OCIO' }); await L.esperar(1200);
      assert.ok(await p.evaluate(() => S.mov.some(x => x.concepto === 'café')), 'el otro dispositivo recibe el gasto');
    })();
  },

  'en el móvil no se sale nada de la pantalla'(browser, estado) {
    return (async () => {
      const { p } = await dentro(browser, estado, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
      for (const t of ['resumen', 'efectivo', 'movs', 'importar', 'hist', 'patri', 'ajustes', 'usuarios']) {
        await p.evaluate(t => go(t), t); await L.esperar(150);
        const w = await p.evaluate(() => document.documentElement.scrollWidth);
        assert.ok(w <= 391, `la pestaña ${t} se sale (${w}px)`);
      }
      assert.ok(await p.isVisible('#fabCash') || await p.evaluate(() => TAB === 'efectivo'));
    })();
  },

  'funciona sin Firebase (modo local)'(browser, estado) {
    return (async () => {
      const ctx = await browser.newContext(); (estado.contextos ||= []).push(ctx);
      await ctx.route('**/js/config.js*', r => r.fulfill({ contentType: 'text/javascript', body: 'window.MG_CONFIG={firebase:null};' }));
      const p = await L.nuevaPagina(ctx); estado.paginas.push(p);
      await p.goto(L.URL_APP); await L.esperar(400);
      assert.equal(await p.textContent('#dlgT'), 'Bienvenida');
      await p.click('#dlgF >> text=Empezar vacío');
      await anadir(p, { imp: '7', con: 'mercado', cat: 'SUPERMERCADO' });
      await p.reload(); await L.esperar(300);
      assert.ok(await p.evaluate(() => S.mov.some(x => x.concepto === 'mercado')), 'se guarda en el navegador');
    })();
  },
};
