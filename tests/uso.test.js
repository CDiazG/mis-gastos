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

  'categorías: Donativos de serie y reordenar arrastrando'(browser, estado) {
    return (async () => {
      const { p } = await dentro(browser, estado);
      const d = await p.evaluate(() => ({ c: S.cats.find(c => c.id === 'DONATIVOS'), cat: autoCat('Transferencia a CARITAS Valencia', '', -20), pct: sumaPct() }));
      assert.deepEqual(d.c, { id: 'DONATIVOS', n: 'Donativos', g: 'AHORRO' });
      assert.equal(d.cat, 'DONATIVOS');
      assert.equal(d.pct, 100, 'el presupuesto sigue sumando 100');
      await p.evaluate(() => go('ajustes'));
      assert.ok(await p.isVisible('tr[data-cid=DONATIVOS] .cx'), 'se puede borrar');
      // arrastrar Transporte (5.º de Necesidades) hasta arriba del todo
      const orden = () => p.evaluate(() => S.cats.filter(c => c.g === 'FIJOS').map(c => c.id));
      const antes = await orden();
      const a = await p.locator('tr[data-cid=TRANSPORTE] .asa').boundingBox(), b = await p.locator('tr[data-cid=VIVIENDA] .asa').boundingBox();
      await p.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await p.mouse.down();
      for (let k = 1; k <= 10; k++) await p.mouse.move(a.x + a.width / 2, a.y + a.height / 2 + (b.y - a.y - 8) * k / 10);
      await p.mouse.up(); await L.esperar(200);
      assert.deepEqual(await orden(), ['TRANSPORTE', ...antes.filter(x => x !== 'TRANSPORTE')]);
      // y con el teclado
      await p.focus('tr[data-cid=TRANSPORTE] .asa'); await p.keyboard.press('ArrowDown');
      assert.deepEqual((await orden()).slice(0, 2), [antes[0], 'TRANSPORTE']);
      assert.equal(await p.evaluate(() => document.activeElement.closest('tr').dataset.cid), 'TRANSPORTE', 'el foco sigue en la categoría');
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
      // barra de abajo: Inicio, Resumen, Añadir, Movimientos y Más
      await p.evaluate(() => go('resumen'));
      const bar = await p.evaluate(() => { const r = $('#tabs').getBoundingClientRect(); return { abajo: Math.round(r.bottom), vis: [...$$('#tabs .tab')].filter(b => b.offsetParent).map(b => b.textContent.trim()) }; });
      assert.equal(bar.abajo, 844, 'la barra va pegada abajo');
      assert.deepEqual(bar.vis, ['Inicio', 'Resumen', 'Añadir', 'Movimientos', 'Más']);
      assert.ok(!(await p.isVisible('#fabCash')), 'en el móvil Añadir va en la barra');
      await p.tap('#tabMas'); await p.waitForSelector('#masSheet.on');
      const opc = await p.$$eval('#masSheet .msit', b => b.map(x => x.textContent.trim()));
      assert.ok(opc.includes('Histórico') && opc.includes('Ajustes') && opc.some(x => x.endsWith('Mi perfil')), opc.join());
      await p.tap('#masSheet .msit[data-t="hist"]'); await L.esperar(150);
      assert.equal(await p.evaluate(() => TAB), 'hist');
      assert.ok(await p.evaluate(() => $('#tabMas').classList.contains('on')), 'Más queda marcado');
      assert.equal(await p.$('#masSheet'), null);
      // al bajar se apartan los botones flotantes y al subir vuelven
      await p.evaluate(() => go('movs'));
      await p.evaluate(() => { document.body.style.minHeight = '3000px'; scrollTo(0, 0); });
      await L.esperar(50); await p.evaluate(() => scrollTo(0, 600)); await L.esperar(100);
      assert.ok(await p.evaluate(() => document.body.classList.contains('bajando')));
      await p.evaluate(() => scrollTo(0, 300)); await L.esperar(100);
      assert.ok(!(await p.evaluate(() => document.body.classList.contains('bajando'))));
    })();
  },

  'móvil: Ajustes por apartados y el botón atrás'(browser, estado) {
    return (async () => {
      const { p } = await dentro(browser, estado, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
      const atras = async () => { await p.evaluate(() => history.back()); await L.esperar(250); };
      const tab = () => p.evaluate(() => TAB + '/' + (SUB[TAB] || ''));
      await p.evaluate(() => go('ajustes'));
      assert.ok(await p.isVisible('.apmenu[data-menu=ajustes]'), 'sale el menú de apartados');
      assert.ok(!(await p.isVisible('#pctTable')), 'sin bajar por todo');
      await p.click('.apmenu[data-menu=ajustes] .apit[data-ap=reglas]');
      assert.ok(await p.isVisible('#rTable')); assert.ok(!(await p.isVisible('.apmenu[data-menu=ajustes]')));
      assert.match(await p.textContent('#s-ajustes .migas'), /Ajustes\s*›\s*Reglas de categorías/);
      await atras(); assert.equal(await tab(), 'ajustes/', 'atrás vuelve al menú de Ajustes');
      await p.click('.apmenu[data-menu=ajustes] .apit[data-ap=nomina]'); await p.click('#s-ajustes .migas [data-mg]');
      assert.equal(await tab(), 'ajustes/', 'las migas también vuelven');
      await atras(); assert.equal(await tab(), 'inicio/', 'y luego a Inicio');
      // atrás cierra primero lo que esté abierto
      await p.evaluate(() => go('movs')); await p.tap('#tabMas'); await p.waitForSelector('#masSheet');
      await atras(); assert.equal(await p.$('#masSheet'), null); assert.equal(await tab(), 'movs/');
      await atras(); assert.equal(await tab(), 'inicio/');
      // desde Inicio avisa antes de salir
      await atras();
      assert.match(await p.textContent('#toast'), /otra vez atrás para salir/);
      assert.equal(await tab(), 'inicio/');
      // con el presupuesto descuadrado no deja salir de Ajustes, tampoco con atrás
      await p.evaluate(() => { go('ajustes', { sub: 'presupuesto' }); S.aj.pct.OCIO += 5; });
      await atras();
      assert.equal(await p.evaluate(() => TAB), 'ajustes');
      assert.ok(await p.evaluate(() => $('#dlg').open), 'avisa de que no suma 100');
      await atras();
      assert.ok(!(await p.evaluate(() => $('#dlg').open)), 'atrás cierra el aviso');
      assert.equal(await p.evaluate(() => TAB), 'ajustes');
    })();
  },

  'histórico por pestañas, grupos del resumen que se pliegan y preguntas por temas'(browser, estado) {
    return (async () => {
      const { p } = await dentro(browser, estado);
      await p.evaluate(() => { const m = mesDe(hoy()); S.mov.push({ id: 'h1', fecha: m + '-02', mes: m, concepto: 'Cena', importe: -30, cat: 'OCIO', cuenta: 'EVO' }); save(); go('hist'); });
      assert.ok(await p.isVisible('#chart')); assert.ok(!(await p.isVisible('#histTable')));
      await p.click('.apchip[data-ap=meses]');
      assert.ok(await p.isVisible('#histTable')); assert.ok(!(await p.isVisible('#chart')));
      await p.evaluate(() => go('ayuda'));
      assert.ok(!(await p.isVisible('#s-hist')), 'el histórico no se queda a la vista');
      // grupos del resumen
      await p.evaluate(() => go('resumen'));
      await p.click('#groups .grupo[data-g=VARIABLES] .gtog');
      assert.ok(!(await p.isVisible('#groups [data-cat=OCIO]')), 'plegado');
      await p.evaluate(() => { go('movs'); go('resumen'); });
      assert.ok(!(await p.isVisible('#groups [data-cat=OCIO]')), 'lo recuerda');
      await p.click('#groups .grupo[data-g=VARIABLES] .gtog');
      assert.ok(await p.isVisible('#groups [data-cat=OCIO]'));
      // preguntas frecuentes por temas
      await p.evaluate(() => go('ayuda', { sub: 'faq' }));
      assert.equal((await p.$$('#faqList h4.faqtema')).length, 5);
      await p.click('#faqTemas [data-ft=categorias]');
      const n = (await p.$$('#faqList details')).length;
      assert.ok(n >= 3 && n <= 6, 'solo las de categorías: ' + n);
    })();
  },

  'conceptos del banco legibles y sin números de tarjeta'(browser, estado) {
    return (async () => {
      const { p } = await dentro(browser, estado);
      const r = await p.evaluate(() => [
        conceptoCorto('Compra En Glovo, Barcelona, Tarj. :*123456789015218, Comisión 0,00'),
        conceptoCorto('Bizum A Favor De Laura Concepto: Merienda'),
        ocultarNumeros('Pago con 4111 1111 1111 5218 ok'),
        conceptoCorto('RECIB /IBERDROLA CLIENTES, S.A'),
      ]);
      assert.equal(r[0], 'Glovo · Barcelona');
      assert.equal(r[1], 'Bizum a Laura · Merienda');
      assert.equal(r[2], 'Pago con …5218 ok');
      assert.ok(!/\d{8}/.test(r[3]) && /IBERDROLA/.test(r[3]));
      await p.evaluate(() => { S.mov.push({ id: 'q', fecha: hoy(), mes: mesDe(hoy()), concepto: 'Compra En Glovo, Barcelona, Tarj. :*123456789015218', importe: -12, cat: 'ACTIVIDADES', cuenta: 'EVO' }); MES = mesDe(hoy()); save(); go('movs'); });
      const t = await p.textContent('#s-movs');
      assert.match(t, /Glovo · Barcelona/);
      assert.ok(!/123456789015218/.test(t), 'no se ve el número de tarjeta');
    })();
  },

  'funciona sin Firebase (modo local)'(browser, estado) {
    return (async () => {
      const ctx = await browser.newContext(); (estado.contextos ||= []).push(ctx);
      await ctx.route('**/js/config.js*', r => r.fulfill({ contentType: 'text/javascript', body: 'window.MG_CONFIG={firebase:null};' }));
      await ctx.addInitScript(() => { try { localStorage.setItem('mg-sin-tuto', '1'); } catch (e) {} });
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
