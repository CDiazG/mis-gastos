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

  'presupuesto: lo que no se reparte va al ahorro y solo bloquea si te pasas'(browser, estado) {
    return (async () => {
      const { p } = await dentro(browser, estado);
      await p.evaluate(() => go('ajustes'));
      const ah = () => p.evaluate(() => Math.round(pctAhorro(0) * 10) / 10);
      assert.equal(await ah(), 10, 'de serie el ahorro es el 10 %');
      await p.fill('[data-p=OCIO]', '5');
      assert.equal(await ah(), 13, 'baja ocio 3 puntos y el ahorro sube 3');
      assert.match(await p.textContent('#pctTable [data-ah]'), /13/);
      await p.evaluate(() => go('resumen'));
      assert.equal(await p.evaluate(() => TAB), 'resumen', 'ya no hace falta cuadrar a mano');
      await p.evaluate(() => go('ajustes'));
      await p.fill('[data-p=OCIO]', '20');
      assert.equal(await ah(), 0);
      assert.match(await p.textContent('#pctAlert'), /Te pasas del 100/);
      await p.evaluate(() => go('resumen'));
      assert.equal(await p.evaluate(() => TAB), 'ajustes', 'si te pasas no deja salir');
      assert.match(await p.textContent('#dlgB'), /102/);
      await p.click('#dlgF >> text=Arreglarlo');
      await p.fill('[data-p=OCIO]', '8');
      await p.evaluate(() => go('resumen'));
      assert.equal(await p.evaluate(() => TAB), 'resumen');
    })();
  },

  'presupuesto en euros: una categoría con cantidad fija y todas de golpe'(browser, estado) {
    return (async () => {
      const { p } = await dentro(browser, estado);
      const m = await p.evaluate(() => { const m = mesDe(hoy()); S.mov.push({ id: 'n', fecha: m + '-01', mes: m, concepto: 'NOMINA', importe: 2000, cat: 'INGRESO', cuenta: 'EVO' }, { id: 'c', fecha: m + '-03', mes: m, concepto: 'CENA', importe: -40, cat: 'OCIO', cuenta: 'EVO' }); MES = m; save(); go('ajustes'); return m; });
      await p.click('#pctTable .un[data-u=OCIO]');
      assert.equal(await p.inputValue('[data-e=OCIO]'), '160', 'el 8 % de 2.000 € pasa a 160 €');
      await p.fill('[data-e=OCIO]', '50');
      const r = await p.evaluate(m => { const st = stats(m); return { p: presupuestoCat(m, 'OCIO', st).p, ah: Math.round(pctAhorro(st.base) * 10) / 10 }; }, m);
      assert.equal(r.p, 50, 'el presupuesto de restaurantes es 50 € cobres lo que cobres');
      assert.equal(r.ah, 15.5, 'los 110 € que sobran van al ahorro');
      await p.evaluate(() => go('resumen'));
      assert.match(await p.textContent('#groups [data-cat=OCIO]'), /fijo · presupuesto 50/);
      // con otros ingresos el presupuesto sigue en 50 €
      await p.evaluate(m => { S.mov.find(x => x.id === 'n').importe = 3000; save(); }, m);
      assert.equal(await p.evaluate(m => presupuestoCat(m, 'OCIO').p, m), 50);
      // todas a euros y vuelta a porcentajes
      await p.evaluate(() => go('ajustes'));
      await p.click('#pctSum [data-todo=eur]');
      assert.ok(await p.evaluate(() => ['VIVIENDA', 'SUPERMERCADO', 'INVERSION'].every(enEur) && !enEur('DIEZMO')), 'el diezmo sigue en %');
      await p.click('#pctSum [data-todo=pct]');
      assert.ok(await p.evaluate(() => !hayEur()));
      assert.equal(await p.evaluate(() => Math.round(+S.aj.pct.OCIO * 10) / 10), 1.7, '50 € de 3.000 € es el 1,7 %');
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
      await p.evaluate(() => { S.cuentas.push({ n: 'Banco Inventado', v: 1500, f: hoy(), banco: 1 }, { n: 'Broker · Inversiones', v: 300, f: hoy(), cartera: { f: hoy(), pos: [{ n: 'Oro Imaginario', u: 2.5, v: 300, isin: 'IE0000000003' }] } });
        S.objetivos = [{ id: 'o', nombre: 'Viaje inventado', meta: 1000, aport: [{ f: hoy(), i: 250 }] }]; save(); go('movs'); });
      await p.click('#s-movs [data-export]'); await p.selectOption('#xAl', 'mes');
      const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#dlgF >> text=Descargar')]);
      const buf = require('fs').readFileSync(await dl.path());
      assert.equal(buf.slice(0, 2).toString(), 'PK', 'es un archivo zip/xlsx');
      assert.ok(buf.includes('xl/worksheets/sheet1.xml'));
      assert.match(dl.suggestedFilename(), /\.xlsx$/);
      // hoja «Patrimonio» con cuentas, cartera y objetivos (se lee con el propio lector de la app)
      const txt = await p.evaluate(async b64 => { const leer = await unzip(Uint8Array.from(atob(b64), c => c.charCodeAt(0)));
        let t = (await leer('xl/workbook.xml')) + ((await leer('xl/sharedStrings.xml')) || '');
        for (let i = 1; i <= 6; i++) t += (await leer(`xl/worksheets/sheet${i}.xml`)) || '';
        return t; }, buf.toString('base64'));
      assert.match(txt, /name="Patrimonio"/);
      assert.match(txt, /Patrimonio a/); assert.match(txt, /Banco Inventado/); assert.match(txt, /Oro Imaginario/); assert.match(txt, /Viaje inventado/);
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
      // si el presupuesto se pasa del 100 % no deja salir de Ajustes, tampoco con atrás
      await p.evaluate(() => { go('ajustes', { sub: 'presupuesto' }); S.aj.pct.OCIO += 15; });
      await atras();
      assert.equal(await p.evaluate(() => TAB), 'ajustes');
      assert.ok(await p.evaluate(() => $('#dlg').open), 'avisa de que te pasas');
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

  'gráficas: bocadillo al pasar por un mes y clic para ir a sus movimientos'(browser, estado) {
    return (async () => {
      const { p } = await dentro(browser, estado);
      const m = await p.evaluate(() => { const h = mesDe(hoy()), a = addMes(h, -2);
        for (const mm of [addMes(h, -3), a, h]) S.mov.push({ id: uid(), fecha: mm + '-01', mes: mm, concepto: 'NOMINA', importe: 2000, cat: 'INGRESO', cuenta: 'EVO' }, { id: uid(), fecha: mm + '-04', mes: mm, concepto: 'TAXI', importe: mm === a ? -90 : -20, cat: 'TRANSPORTE', cuenta: 'EVO' }, { id: uid(), fecha: mm + '-05', mes: mm, concepto: 'CENA', importe: -30, cat: 'OCIO', cuenta: 'EVO' });
        save(); EVO = 'TRANSPORTE'; go('hist'); return a; });
      const banda = `#evoChart .hz[data-m="${m}"]`;
      await p.$eval(banda, e => e.scrollIntoView({ block: 'center' })); await L.esperar(400);
      await p.mouse.move(1, 1); await p.hover(banda);
      await p.waitForSelector('#tip.on', { timeout: 2000 });
      const t = await p.textContent('#tip');
      assert.match(t, /Gastado\s*90/); assert.match(t, /Más que la media/); assert.match(t, /ver los movimientos/);
      await p.click(banda);
      const r = await p.evaluate(() => ({ tab: TAB, mes: MES, cat: F.cat }));
      assert.deepEqual(r, { tab: 'movs', mes: m, cat: 'TRANSPORTE' });
      assert.ok(!/CENA/.test(await p.textContent('#s-movs')), 'solo los de esa categoría');
      // la gráfica principal lleva al resumen del mes
      await p.evaluate(() => { F.cat = ''; go('hist'); });
      await p.mouse.move(1, 1); await p.$eval(`#chart .hz[data-m="${m}"]`, e => e.scrollIntoView({ block: 'center' })); await L.esperar(400);
      await p.hover(`#chart .hz[data-m="${m}"]`); await p.waitForSelector('#tip.on');
      assert.match(await p.textContent('#tip'), /Ingresos\s*2\.000/);
      await p.click(`#chart .hz[data-m="${m}"]`);
      assert.deepEqual(await p.evaluate(() => [TAB, MES]), ['resumen', m]);
    })();
  },

  'elegir mes en el calendario y deslizar en el móvil'(browser, estado) {
    return (async () => {
      const { p } = await dentro(browser, estado, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
      const h = await p.evaluate(() => { const h = mesDe(hoy()), a = addMes(h, -14); S.mov.push({ id: 'v', fecha: a + '-03', mes: a, concepto: 'CENA', importe: -20, cat: 'OCIO', cuenta: 'EVO' }); save(); go('resumen'); return h; });
      const viejo = await p.evaluate(() => addMes(mesDe(hoy()), -14));
      await p.tap('#mLabel'); await p.waitForSelector('#mesPicker .mpgrid');
      await p.tap('#mesPicker [data-y="-1"]');
      assert.ok(await p.$(`#mesPicker .mpm[data-m="${viejo}"] i`) || viejo.slice(0, 4) !== String(+h.slice(0, 4) - 1), 'marca los meses con datos');
      while (!(await p.$(`#mesPicker .mpm[data-m="${viejo}"]`))) await p.tap('#mesPicker [data-y="-1"]');
      await p.tap(`#mesPicker .mpm[data-m="${viejo}"]`);
      assert.equal(await p.evaluate(() => MES), viejo, 'un toque y estás en ese mes');
      assert.equal(await p.$('#mesPicker'), null);
      // deslizar: hacia la izquierda, mes siguiente; hacia la derecha, el anterior
      const desliza = (dx) => p.evaluate(dx => { const el = document.querySelector('#s-resumen .mesTit') || document.querySelector('#s-resumen');
        const t = (x) => new Touch({ identifier: 1, target: el, clientX: x, clientY: 400 });
        el.dispatchEvent(new TouchEvent('touchstart', { touches: [t(200)], changedTouches: [t(200)], bubbles: true }));
        el.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [t(200 + dx)], bubbles: true })); }, dx);
      await desliza(-150); assert.equal(await p.evaluate(() => MES), await p.evaluate(v => addMes(v, 1), viejo));
      await desliza(150); await desliza(150); assert.equal(await p.evaluate(() => MES), await p.evaluate(v => addMes(v, -1), viejo));
      await desliza(-30); assert.equal(await p.evaluate(() => MES), await p.evaluate(v => addMes(v, -1), viejo), 'un roce no cambia de mes');
    })();
  },

  'nómina de un segundo pagador: se marca a mano y lo recuerda'(browser, estado) {
    return (async () => {
      const { p } = await dentro(browser, estado);
      const r0 = await p.evaluate(() => esNomina('TRANSFERENCIA DE TALLERES INVENTADOS SL 05/10', 600, '2026-10-05'));
      assert.equal(r0, false, 'un ingreso pequeño a mitad de mes no parece nómina');
      await p.evaluate(() => { S.mov.push({ id: 'p2', fecha: '2026-10-05', mes: '2026-10', concepto: 'TRANSFERENCIA DE TALLERES INVENTADOS SL 05/10', importe: 600, cat: 'INGRESO', cuenta: 'EVO' }); MES = '2026-10'; save(); go('movs'); });
      await p.evaluate(() => editar(S.mov.find(x => x.id === 'p2')));
      await p.waitForSelector('#eNom'); await p.check('#eNom'); await p.click('#dlgF >> text=Guardar'); await L.esperar(200);
      assert.ok(await p.evaluate(() => S.mov.find(x => x.id === 'p2').nomina));
      assert.equal(await p.evaluate(() => esNomina('TRANSFERENCIA DE TALLERES INVENTADOS SL 05/11', 610, '2026-11-05')), true, 'el mes siguiente lo reconoce solo');
      await p.evaluate(() => go('ajustes', { sub: 'nomina' }));
      assert.match(await p.textContent('#pagList'), /TALLERES INVENTADOS/);
      await p.click('#pagList [data-pq="0"]');
      assert.equal(await p.evaluate(() => esNomina('TRANSFERENCIA DE TALLERES INVENTADOS SL 05/12', 600, '2026-12-05')), false, 'se puede olvidar');
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
