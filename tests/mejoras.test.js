// Versión 2.12.0: deshacer, etiquetas, dividir, acumular, año pasado, diezmo opcional, más categorías, Inicio.
const assert = require('assert');
const L = require('./lib');

async function dentro(browser, estado, opciones) {
  const ctx = await L.nuevoContexto(browser, opciones); (estado.contextos ||= []).push(ctx);
  const p = await L.nuevaPagina(ctx); estado.paginas.push(p);
  await L.crearAdminYEntrar(p);
  return p;
}
const meter = (p, movs, mes) => p.evaluate(([ms, mes]) => {
  for (const [f, c, i, cat] of ms) S.mov.push({ id: 'm' + Math.random().toString(36).slice(2, 8), fecha: f, mes: f.slice(0, 7), concepto: c, importe: i, cat, metodo: 'banco', cuenta: 'EVO', origen: 'extracto', key: uid() });
  MES = mes || '2026-10'; save(); render();
}, [movs, mes]);

module.exports = {
  'previsión de fin de mes: a este ritmo y frente al presupuesto'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      const mes = await p.evaluate(() => mesDe(hoy())); const dia = await p.evaluate(() => +hoy().slice(8, 10));
      if (dia < 7 || dia > 28) return; // fuera de la franja en la que se muestra
      await meter(p, [[mes + '-01', 'NOMINA', 2000, 'INGRESO'], [mes + '-02', 'CENA', -300, 'OCIO']], mes);
      const f = await p.evaluate(m => frasesMes(m).map(t => t.replace(/<[^>]+>/g, '')), mes);
      assert.ok(f.some(t => /A este ritmo cerrarás el mes en unos/.test(t)), JSON.stringify(f));
    })();
  },
  'mes sin movimientos: ofrece importar o añadir a mano'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      await p.evaluate(() => go('movs'));
      await p.waitForSelector('#movTable [data-go="importar"]', { state: 'attached' });
      assert.equal(await p.locator('#movTable [data-go="efectivo"]').count(), 1);
    })();
  },
  'letra más grande: opcional, apagada por defecto, y el foco con teclado se ve'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      const r = await p.evaluate(() => { const antes = document.documentElement.classList.contains('letragrande'); S.aj.letraGrande = true; aplicarTema(); const z = getComputedStyle(document.documentElement).zoom; S.aj.letraGrande = false; aplicarTema(); return { antes, z, hay: pref('letraGrande'), live: document.querySelector('#toast').getAttribute('aria-live') }; });
      assert.equal(r.antes, false); assert.equal(r.z, '1.15'); assert.equal(r.hay, false); assert.equal(r.live, 'polite');
    })();
  },
  'gasto a medias: tu parte queda como gasto y la del otro como préstamo a su nombre'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      await meter(p, [['2026-10-05', 'CENA GRUPO', -60, 'OCIO']]);
      await p.evaluate(() => { go('movs'); });
      await p.waitForSelector('#movTable .edit'); await p.click('#movTable .edit >> nth=0');
      await p.click('#dlgF >> text=A medias…'); await p.waitForSelector('#amP');
      await p.fill('#amP', 'Ana'); await p.click('#dlgF .pri'); await p.waitForTimeout(450);
      const r = await p.evaluate(() => ({ ocio: stats('2026-10').by.OCIO, pend: prestamosPorPersona().map(x => [x.persona, x.pendiente]), tot: S.mov.reduce((a, m) => a + m.importe, 0) }));
      assert.equal(r.ocio, 30); assert.deepEqual(r.pend, [['Ana', 30]]); assert.equal(r.tot, -60);
    })();
  },
  'frases del mes: categoría por encima de tu media, ahorro frente al mes anterior y mayor gasto'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      const mv = [];
      for (const [m, ocio] of [['2026-07', 100], ['2026-08', 100], ['2026-09', 100], ['2026-10', 300]]) {
        mv.push([m + '-01', 'NOMINA', 2000, 'INGRESO'], [m + '-05', 'ALQUILER', -600, 'VIVIENDA'], [m + '-10', 'CENA', -ocio, 'OCIO']);
      }
      await meter(p, mv, '2026-10');
      const f = await p.evaluate(() => frasesMes('2026-10').map(t => t.replace(/<[^>]+>/g, '').replace(/\u00a0/g, ' ')));
      assert.ok(f.some(t => /200 % más.*Restaurantes/.test(t)), JSON.stringify(f));
      assert.ok(f.some(t => /Ahorraste 200 € menos que en septiembre/.test(t)), JSON.stringify(f));
      assert.ok(f.length <= 3);
      await p.evaluate(() => { S.aj.primerosPasos = false; go('resumen'); });
      await p.waitForTimeout(300);
      assert.ok((await p.locator('#frases .frase').count()) >= 1);
      await p.evaluate(() => { S.aj.frases = false; render(); });
      assert.equal(await p.locator('#frases .frase').count(), 0);
    })();
  },
  'comercios habituales: reglas de serie en cuentas nuevas y botón para añadirlas sin tocar las del usuario'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      const c = await p.evaluate(() => ({ ikea: autoCat('Compra Ikea Valencia Tarjeta', '', -50), moeve: autoCat('Moeve Estacion', '', -40), dia: autoCat('SUPERMERCADOS DIA 123', '', -9), bk: autoCat('BURGER KING VALENCIA', '', -9) }));
      assert.deepEqual(c, { ikea: 'PERSONAL', moeve: 'TRANSPORTE', dia: 'SUPERMERCADO', bk: 'OCIO' });
      // una cuenta que ya existía: le faltan y las añade; su regla propia (Ikea → Hogar/Otros) no se toca
      await p.evaluate(() => { S.reglas = S.reglas.filter(r => !/IKEA|MOEVE|BURGER KING/.test(r.t)); S.reglas.unshift({ t: 'IKEA', c: 'OTROS', u: 1 }); save(); go('ajustes', { sub: 'reglas' }); });
      await p.click('#rComunes'); await p.waitForSelector('#dlg[open]');
      await p.click('#dlgF .pri'); await p.waitForTimeout(450);
      const r = await p.evaluate(() => ({ ik: S.reglas.filter(r => r.t === 'IKEA').map(r => r.c), mo: S.reglas.some(r => r.t === 'MOEVE'), n: autoCat('Compra Ikea', '', -5) }));
      assert.deepEqual(r.ik, ['OTROS']); assert.equal(r.mo, true); assert.equal(r.n, 'OTROS');
    })();
  },
  'reducir movimiento: sin desplazamientos pero con cambios suaves de color'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado, { reducedMotion: 'reduce' });
      const r = await p.evaluate(() => { const b = document.querySelector('.btn'); const cs = getComputedStyle(b); return { tp: cs.transitionProperty, dur: cs.transitionDuration, anim: [...document.querySelectorAll('main section.on, .card')].slice(0, 5).map(e => getComputedStyle(e).animationName) }; });
      assert.ok(!/transform|all/.test(r.tp), r.tp); assert.ok(/background-color/.test(r.tp), r.tp); assert.ok(parseFloat(r.dur) > 0, 'duración ' + r.dur);
      assert.ok(r.anim.every(a => a === 'none'), JSON.stringify(r.anim));
    })();
  },
  'suscripciones: avisa de las nuevas y de las que suben de precio'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      await meter(p, [['2026-09-05', 'Compra Servicio Uno, Madrid', -8.99, 'SUSCRIPCIONES'], ['2026-09-06', 'Compra Servicio Dos, Dublin', -5, 'SUSCRIPCIONES'],
        ['2026-10-05', 'Compra Servicio Uno, Madrid', -10.99, 'SUSCRIPCIONES'], ['2026-10-06', 'Compra Servicio Dos, Dublin', -5, 'SUSCRIPCIONES'], ['2026-10-07', 'Compra Servicio Tres, Cork', -3.5, 'SUSCRIPCIONES']], '2026-10');
      const r = await p.evaluate(() => avisosSuscripciones('2026-10').map(x => x.t.replace(/<[^>]+>/g, '')));
      assert.equal(r.length, 2, JSON.stringify(r));
      assert.ok(r.some(x => /Servicio Uno.*8,99.*10,99/.test(x.replace(/\u00a0/g, ' '))), JSON.stringify(r));
      assert.ok(r.some(x => /nueva.*Servicio Tres/i.test(x)), JSON.stringify(r));
      await p.evaluate(() => go('resumen')); await p.waitForSelector('#alerts [data-act="subok"]', { state: 'attached' });
      await p.evaluate(() => document.querySelector('#alerts [data-act="subok"]').click()); await p.waitForTimeout(300);
      assert.equal(await p.evaluate(() => avisosSuscripciones('2026-10').length), 0);
    })();
  },
  'menú del perfil: guardar copia de seguridad desde cualquier sitio'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      await p.click('#uWho'); await p.waitForSelector('#cmCopia');
      const [d] = await Promise.all([p.waitForEvent('download'), p.click('#cmCopia')]);
      assert.match(d.suggestedFilename(), /^mis-gastos-copia-.*\.json$/);
      assert.ok(await p.evaluate(() => !!S.ultimaCopia));
    })();
  },
  'quitar números de tarjeta de lo ya guardado'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      await meter(p, [['2026-10-05', 'Compra Tienda, Tarjeta 4000123412341234 , Comision 0,00', -12, 'TRANSPORTE'], ['2026-10-06', 'Pan', -3, 'SUPERMERCADO']]);
      await p.evaluate(() => { go('ajustes', { sub: 'copia' }); });
      await p.click('#tarjLimpiar'); await p.waitForSelector('#dlg[open]');
      await p.click('#dlgF .pri'); await p.waitForTimeout(450);
      const c = await p.evaluate(() => S.mov.map(x => x.concepto).join('|'));
      assert.ok(!/4000123412341234/.test(c) && /…1234/.test(c), c);
    })();
  },
  'fichas del histórico: al cerrar no queda ninguna transición pendiente que repita el plegado'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      await meter(p, [['2026-10-05', 'TIENDA UNO', -12, 'TRANSPORTE'], ['2026-10-06', 'NOMINA', 1500, 'INGRESO']]);
      await p.evaluate(() => go('hist')); await p.waitForSelector('#evoCards details.icard[open]');
      await p.click('#evoCards details.icard >> nth=0 >> summary');
      await p.waitForTimeout(290);
      const r = await p.evaluate(() => { const d = document.querySelector('#evoCards details.icard'); return { abierta: d.open, tr: getComputedStyle(d, '::details-content').transitionDuration, anim: d.getAnimations({ subtree: true }).filter(a => a.playState === 'running').length }; });
      assert.equal(r.abierta, false);
      assert.match(r.tr, /^0s/, 'transición nativa: ' + r.tr);
    })();
  },
  'fichas del histórico: al abrir y cerrar no se repite la animación (sin parpadeo)'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      await meter(p, [['2026-10-05', 'TIENDA UNO', -12, 'TRANSPORTE'], ['2026-10-06', 'NOMINA', 1500, 'INGRESO']]);
      await p.evaluate(() => { go('hist'); }); await p.waitForSelector('#evoCards details.icard');
      await p.evaluate(() => { const d = document.querySelector('#evoCards details.icard'); d.open = false; });
      await p.click('#evoCards details.icard >> nth=0 >> summary');
      await p.waitForTimeout(380);
      const n = await p.evaluate(() => document.querySelector('#evoCards details.icard').querySelectorAll(':scope > :not(summary)').length && [...document.querySelectorAll('#evoCards details.icard')[0].children].filter(c => c.tagName !== 'SUMMARY').reduce((a, c) => a + c.getAnimations().length, 0));
      assert.equal(n, 0, 'sigue habiendo animación después de abrir: ' + n);
    })();
  },
  'primeros pasos: salen en cuentas nuevas y se quitan solos al tener movimientos categorizados'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      await p.evaluate(() => go('resumen')); await p.waitForSelector('#pasos');
      assert.match(await p.textContent('#pasos'), /Mete tus movimientos/);
      await meter(p, [['2026-10-05', 'TIENDA UNO', -12, 'TRANSPORTE']]);
      await p.evaluate(() => go('resumen')); await p.waitForTimeout(300);
      assert.equal(await p.locator('#pasos').count(), 0);
      assert.equal(await p.evaluate(() => S.aj.primerosPasos), false);
    })();
  },
  'primeros pasos: una cuenta que ya existía no los ve'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      await p.evaluate(() => { delete S.aj.primerosPasos; const d = defState(); for (const k in d.aj) if (S.aj[k] === undefined && k !== 'diezmo' && k !== 'paleta' && k !== 'primerosPasos') S.aj[k] = d.aj[k]; save(); go('resumen'); });
      await p.waitForTimeout(300);
      assert.equal(await p.locator('#pasos').count(), 0);
    })();
  },
  'buscador único: movimientos, categorías y ajustes'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      await meter(p, [['2026-09-05', 'TIENDA UNO', -12, 'TRANSPORTE']], '2026-09');
      await p.click('#bBuscar');
      await p.fill('#bqIn', 'tienda');
      assert.match(await p.textContent('#bqRes'), /TIENDA UNO/);
      await p.click('#bqRes [data-bq]');
      await p.waitForTimeout(450);
      assert.equal(await p.evaluate(() => TAB), 'movs');
      assert.equal(await p.inputValue('#fBuscar'), 'tienda');
      await p.click('#bBuscar'); await p.fill('#bqIn', 'diezmo');
      assert.match(await p.textContent('#bqRes'), /Diezmo/);
      await p.click('#bqRes [data-bq] >> nth=0'); await p.waitForTimeout(450);
      assert.equal(await p.evaluate(() => TAB), 'ajustes');
    })();
  },
  'categorizar con «solo sin categoría»: el movimiento se queda a la vista y el foco pasa al siguiente'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      await meter(p, [['2026-10-05', 'TIENDA UNO', -12, ''], ['2026-10-04', 'TIENDA DOS', -8, '']]);
      await p.evaluate(() => { F.sinCat = true; F.cat = ''; go('movs'); });
      await p.waitForSelector('#movTable select.cat');
      assert.equal(await p.locator('#movTable tbody tr[data-id]').count(), 2);
      await p.selectOption('#movTable tbody tr[data-id] >> nth=0 >> select.cat', 'TRANSPORTE');
      await p.waitForTimeout(300);
      assert.equal(await p.locator('#movTable tbody tr[data-id]').count(), 2, 'sigue a la vista');
      assert.ok(await p.evaluate(() => { const a = document.activeElement; return a && a.classList.contains('cat') && a.closest('tr') === document.querySelectorAll('#movTable tbody tr[data-id]')[1]; }), 'foco en el siguiente');
    })();
  },
  'Añadir: retirada de efectivo a mano (desde una cuenta) y pregunta si ya se gastó'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      await p.evaluate(() => { S.cuentas.push({ n: 'Cuenta prueba', v: null, f: null }); save(); go('efectivo'); });
      await p.fill('#cImp', '60'); await p.fill('#cCon', 'Cajero');
      await p.click('#cChips .chip[data-c="EFECTIVO"]');
      assert.equal(await p.evaluate(() => aPago), 'Cuenta prueba');
      await p.click('#aGo');
      await p.waitForSelector('#dlg[open]');
      assert.match(await p.textContent('#dlgB'), /60/);
      const m = await p.evaluate(() => S.mov.find(x => x.concepto === 'Cajero'));
      assert.equal(m.cat, 'EFECTIVO'); assert.equal(m.metodo, 'banco'); assert.equal(m.importe, -60);
    })();
  },
  'selector de categoría: opciones que empiezan por letra (para teclear) y deshacer que dice qué cambió'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      await meter(p, [['2026-10-05', 'TIENDA UNO', -12, '']]);
      await p.evaluate(() => go('movs'));
      await p.waitForSelector('#movTable select.cat');
      const ini = await p.evaluate(() => [...document.querySelector('#movTable select.cat').options].filter(o => o.value).map(o => o.text[0]));
      assert.ok(ini.length > 5 && ini.every(c => /[A-Za-zÁÉÍÓÚÑ]/.test(c)), 'empiezan por letra: ' + ini.join(''));
      await p.selectOption('#movTable select.cat', 'TRANSPORTE');
      await p.waitForTimeout(300);
      const t = await p.textContent('#undoTxt');
      assert.ok(/TIENDA UNO/.test(t) && /sin categoría →/.test(t), t);
    })();
  },
  'menú del perfil: Usuarios conserva su icono aunque haya avisos'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      await p.evaluate(() => { badgeUsuarios(); });
      assert.ok(await p.evaluate(() => !!document.querySelector('#cmUsuarios svg.cmi')), 'icono de Usuarios');
    })();
  },
  'exportar a Excel: últimos 12 meses y fechas elegidas'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      await meter(p, [['2026-10-03', 'Cena', -30, 'OCIO'], ['2026-10-20', 'Cine', -20, 'OCIO']]);
      await p.evaluate(() => dlgExportar());
      assert.ok(await p.locator('#xAl option[value="12m"]').count(), 'opción de 12 meses');
      assert.ok(!(await p.isVisible('#xDe')), 'las fechas no salen hasta pedirlas');
      await p.selectOption('#xAl', 'fechas');
      assert.ok(await p.isVisible('#xDe') && await p.isVisible('#xA'), 'salen desde y hasta');
      await p.fill('#xDe', '2026-10-10'); await p.fill('#xA', '2026-10-31');
      const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#dlgF .pri')]);
      assert.match(dl.suggestedFilename(), /2026-10-10 a 2026-10-31/);
    })();
  },
  'Resumen: la evolución del mes suma día a día sin contar traspasos ni retiradas'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      await meter(p, [['2026-10-01', 'NOMINA', 2000, 'INGRESO'], ['2026-10-02', 'Mercadona', -50, 'VIVIENDA'], ['2026-10-02', 'Cajero', -100, 'EFECTIVO'], ['2026-10-05', 'Cine', -20, 'OCIO'], ['2026-10-06', 'A hucha', -300, 'TRASPASO']]);
      await p.evaluate(() => { go('resumen'); document.getElementById('diaCard').open = true; });
      await p.waitForSelector('#diaChart svg');
      const t = await p.textContent('#diaCard summary');
      assert.match(t, /Evolución del mes/);
      const d = await p.evaluate(() => document.getElementById('diaCard')._d);
      assert.equal(d.total, 70, 'solo cuenta lo gastado: ' + JSON.stringify(d));
      assert.equal(d.acum[2], 50);
      assert.equal(d.acum[5], 70);
      assert.ok(await p.locator('#diaChart path').count() >= 1);
      assert.ok(await p.locator('#diaChart rect[fill="var(--c1)"]').count() >= 1, 'barras con el color de la categoría mayor, como el rosco');
      assert.ok(await p.locator('#diaChart rect[fill="var(--c2)"]').count() >= 1, 'y de la segunda');
    })();
  },
  'retirada de efectivo: pregunta si ya se gastó, lo apunta y el Resumen avisa de lo que falta'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      await meter(p, [['2026-10-03', 'RETIRADA CAJERO', -100, ''], ['2026-10-05', 'Pan', -10, 'ALIMENTACION']]);
      await p.evaluate(() => { const x = S.mov.find(m => m.concepto === 'Pan'); x.metodo = 'efectivo'; x.cuenta = ''; save(); go('movs'); });
      const k = await p.evaluate(() => S.mov.find(x => x.concepto === 'RETIRADA CAJERO').id);
      await p.selectOption(`tr[data-id="${k}"] .cat`, 'EFECTIVO');
      await p.waitForSelector('#dlg[open]');
      assert.match(await p.textContent('#dlgB'), /100/);
      await p.fill('#efImp', '40');
      await p.click('#dlgF .pri');
      const e = await p.evaluate(() => efectivoMes('2026-10'));
      assert.deepEqual(e, { ret: 100, ent: 0, gas: 50, resto: 50 });
      await p.evaluate(() => { S.mov.push({ id: 'pd1', fecha: '2026-10-06', mes: '2026-10', concepto: 'Devolución préstamo Ana', importe: 20, cat: 'PRESTAMO', persona: 'Ana', metodo: 'efectivo', cuenta: '', origen: 'manual' }); });
      assert.deepEqual(await p.evaluate(() => efectivoMes('2026-10')), { ret: 100, ent: 20, gas: 50, resto: 70 });
      await p.evaluate(() => go('resumen'));
      assert.match(await p.textContent('#alerts'), /Efectivo sin justificar/);
    })();
  },
  'categorizar uno pregunta si poner la misma a los de igual concepto; también los huérfanos salen como sin categoría'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      const bz = 'Bizum A Favor De Marta Lopez Concepto: Cena';
      await meter(p, [['2026-10-02', bz, -20, ''], ['2026-10-09', bz, -20, ''], ['2026-10-16', bz, -20, ''], ['2026-10-17', 'Bizum A Favor De Marta Lopez Concepto: Regalo', -30, ''], ['2026-10-18', 'RESTO', -5, 'CATBORRADA']]);
      await p.evaluate(() => go('movs'));
      assert.equal(await p.evaluate(() => stats('2026-10').sinCat), 5, 'la categoría borrada cuenta como sin categoría');
      await p.check('#fSinCat');
      assert.equal(await p.locator('#movTable tbody tr[data-id]').count(), 5, 'el filtro enseña también la que tiene una categoría que ya no existe');
      await p.uncheck('#fSinCat');
      const k = await p.evaluate(b => S.mov.find(x => x.concepto === b).id, bz);
      await p.selectOption(`tr[data-id="${k}"] .cat`, 'OCIO');
      await p.waitForSelector('#dlg[open]');
      assert.match(await p.textContent('#dlgB'), /2<\/b>|2 movimientos|Hay 2/);
      assert.ok(!/<span|<svg/.test(await p.textContent('#dlgB')), 'el icono de la categoría no se enseña como código');
      await p.click('#dlgF .pri');
      const r = await p.evaluate(() => S.mov.map(x => [x.concepto.slice(-5), x.cat]));
      assert.equal(r.filter(x => x[0] === ' Cena' && x[1] === 'OCIO').length, 3, 'las 3 de «Cena» con la misma categoría: ' + JSON.stringify(r));
      assert.equal(r.find(x => x[0] === 'egalo')[1], '', 'la de otro concepto no se toca');
    })();
  },

  'deshacer: borrar y cambiar en bloque se puede deshacer'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      await meter(p, [['2026-10-02', 'CENA', -40, 'OCIO'], ['2026-10-03', 'ZARA', -60, 'PERSONAL'], ['2026-10-04', 'CINE', -12, 'OCIO']]);
      await p.evaluate(() => go('movs'));
      await p.click('#movAll'); await p.click('#bulkDel');
      assert.equal(await p.evaluate(() => S.mov.filter(x => x.mes === '2026-10').length), 0);
      assert.ok(await p.isVisible('#undo.on'));
      await p.click('#undoBtn');
      assert.equal(await p.evaluate(() => S.mov.filter(x => x.mes === '2026-10').length), 3, 'vuelven los 3');
      // cambiar la categoría de uno y deshacer
      const k = await p.evaluate(() => S.mov.find(x => x.concepto === 'CINE').id);
      await p.selectOption(`tr[data-id="${k}"] .cat`, 'REGALOS');
      assert.equal(await p.evaluate(() => S.mov.find(x => x.concepto === 'CINE').cat), 'REGALOS');
      await p.click('#undoBtn');
      assert.equal(await p.evaluate(() => S.mov.find(x => x.concepto === 'CINE').cat), 'OCIO');
    })();
  },

  'etiquetas: etiquetar varios y ver lo que ha costado el evento'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      await meter(p, [['2026-10-02', 'VUELO ROMA', -180, 'VIAJES'], ['2026-10-10', 'HOTEL ROMA', -320, 'VIAJES'], ['2026-10-11', 'CENA TRASTEVERE', -55, 'OCIO'], ['2026-10-12', 'MERCADONA', -80, 'SUPERMERCADO']]);
      await p.evaluate(() => { go('movs'); for (const x of S.mov) if (/ROMA|TRASTEVERE/.test(x.concepto)) SEL.add(x.id); rMovs(); });
      await p.click('#bulkTag'); await p.fill('#btT', 'Viaje a Roma'); await p.click('#dlgF >> text=Etiquetar');
      assert.equal(await p.evaluate(() => S.mov.filter(x => (x.tags || []).includes('Viaje a Roma')).length), 3);
      await p.evaluate(() => go('hist', { sub: 'etiquetas' })); await L.esperar(200);
      const t = await p.textContent('#tagsCard');
      assert.match(t, /Viaje a Roma/); assert.match(t, /555,00/);
      await p.click('#tagsCard [data-tag]');
      assert.equal(await p.evaluate(() => TAB), 'movs');
      assert.match(await p.textContent('#tagBar'), /3 movimientos/);
      assert.equal((await p.$$('#movTable tbody tr[data-id]')).length, 3);
      // también al añadir a mano
      await p.evaluate(() => go('efectivo'));
      await p.fill('#cImp', '15'); await p.fill('#cCon', 'helado'); await p.click('#cChips .chip[data-c=OCIO]'); await p.fill('#aTag', 'Viaje a Roma'); await p.click('#aGo'); await L.esperar(200);
      assert.equal(await p.evaluate(() => S.mov.filter(x => (x.tags || []).includes('Viaje a Roma')).length), 4);
    })();
  },

  'dividir un gasto en dos categorías'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      await meter(p, [['2026-10-05', 'CARREFOUR', -80, 'SUPERMERCADO']]);
      await p.evaluate(() => { go('movs'); editar(S.mov.find(x => x.concepto === 'CARREFOUR')); });
      await p.click('#dlgF >> text=Dividir');
      const filas = await p.$$('#dvRows .dvrow');
      await filas[1].$eval('.dvi', (e) => { e.value = '20'; e.dispatchEvent(new Event('input')); e.dispatchEvent(new Event('change')); });
      await filas[1].$eval('.dvk', (e) => { e.value = 'PERSONAL'; });
      assert.match(await p.textContent('#dvFalta'), /Cuadra/);
      await p.click('#dlgF >> text=Dividir');
      const r = await p.evaluate(() => S.mov.filter(x => x.mes === '2026-10').map(x => [x.cat, x.importe]).sort());
      assert.deepEqual(r, [['PERSONAL', -20], ['SUPERMERCADO', -60]]);
      assert.equal(await p.evaluate(() => stats('2026-10').consumo), 80, 'el total no cambia');
      // y re-importar el mismo extracto no lo duplica: la clave original sigue en el primer trozo
      assert.ok(await p.evaluate(() => S.mov.some(x => x.dividido && x.key) && S.mov.some(x => x.divDe && /#2$/.test(x.key))));
    })();
  },

  'lo que sobra de una categoría pasa al mes siguiente'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      await p.evaluate(() => { S.aj.base = 'fija'; S.aj.baseFija = 2000; S.aj.acumula = { REGALOS: '2026-08' }; save(); }); // Regalos 2 % = 40 €
      await meter(p, [['2026-08-10', 'FLORES', -10, 'REGALOS'], ['2026-09-10', 'LIBRO', -0.01, 'REGALOS'], ['2026-10-10', 'CUMPLE', -100, 'REGALOS']]);
      const r = await p.evaluate(() => [presupuestoCat('2026-08', 'REGALOS'), presupuestoCat('2026-09', 'REGALOS'), presupuestoCat('2026-10', 'REGALOS'), presupuestoCat('2026-11', 'REGALOS')].map(x => x.p));
      assert.deepEqual(r, [40, 70, 109.99, 49.99], 'agosto 40; septiembre 40+30; octubre 40+69,99; noviembre 40+9,99');
      await p.evaluate(() => { MES = '2026-10'; go('resumen'); });
      assert.match(await p.textContent('#groups [data-cat="REGALOS"]'), /acumulado/);
      // se activa y desactiva desde Ajustes
      await p.evaluate(() => go('ajustes'));
      await p.evaluate(() => $('#catCard').classList.remove('cerrada'));
      await p.click('tr[data-cid="REGALOS"] .ac');
      assert.equal(await p.evaluate(() => !!(S.aj.acumula || {}).REGALOS), false);
      await p.click('tr[data-cid="VIAJES"] .ac');
      assert.ok(await p.evaluate(() => !!S.aj.acumula.VIAJES));
    })();
  },

  'frente al año pasado y línea de ahorro en el histórico'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      await meter(p, [['2025-10-01', 'NOMINA', 2000, 'INGRESO'], ['2025-10-02', 'CENAS', -300, 'OCIO'], ['2026-09-01', 'NOMINA', 2000, 'INGRESO'], ['2026-10-01', 'NOMINA', 2100, 'INGRESO'], ['2026-10-02', 'CENAS', -200, 'OCIO']]);
      await p.evaluate(() => go('hist')); await L.esperar(200);
      const t = await p.textContent('#vsAnio');
      assert.match(t, /oct 2025/i); assert.match(t, /▼ 100/);
      assert.ok(await p.$('#chart polyline'), 'línea del ahorro');
      assert.match(await p.textContent('#chart .legend'), /Ahorro del mes/);
    })();
  },

  'diezmo opcional: al quitarlo su porcentaje pasa al ahorro'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      await p.evaluate(() => { ponerDiezmo(true); go('ajustes', { sub: 'diezmo' }); });
      const antes = await p.evaluate(() => [S.aj.pct.AHORRO, S.aj.pct.DIEZMO]);
      await p.click('label.pref:has([data-pref="diezmo"])');
      const r = await p.evaluate(() => ({ pa: S.aj.pct.AHORRO, pd: S.aj.pct.DIEZMO, suma: sumaPct(), opt: catOptions('').includes('DIEZMO'), fila: !!document.querySelector('#pctTable tr[data-cid="DIEZMO"]') }));
      assert.equal(r.pa, antes[0] + antes[1]); assert.equal(r.pd, 0); assert.equal(r.suma, 100); assert.equal(r.opt, false); assert.equal(r.fila, false);
      assert.ok(await p.isHidden('#dzAuto'));
      await p.evaluate(() => go('resumen'));
      assert.ok(!/Diezmo/.test(await p.textContent('#groups')));
      await p.evaluate(() => go('ajustes', { sub: 'diezmo' }));
      await p.click('label.pref:has([data-pref="diezmo"])');
      assert.deepEqual(await p.evaluate(() => [S.aj.pct.AHORRO, S.aj.pct.DIEZMO, sumaPct()]), [antes[0], antes[1], 100]);
    })();
  },

  'más categorías: añadir una sugerida clasifica sola y ofrece pasar las antiguas'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      await meter(p, [['2026-10-03', 'NETFLIX.COM', -13.99, 'PERSONAL'], ['2026-10-04', 'SPOTIFY P1234', -10.99, 'PERSONAL'], ['2026-10-05', 'ZARA', -40, 'PERSONAL']]);
      // como alguien con las categorías de antes (sin Suscripciones)
      await p.evaluate(() => { const c = S.cats.find(c => c.id === 'SUSCRIPCIONES'); S.cats = S.cats.filter(x => x !== c); S.reglas = S.reglas.filter(r => r.c !== 'SUSCRIPCIONES'); delete S.aj.pct.SUSCRIPCIONES; save(); go('ajustes'); });
      await p.evaluate(() => $('#catCard').classList.remove('cerrada'));
      await p.click('#catSug [data-sug="Suscripciones"]');
      assert.match(await p.textContent('#dlgB'), /2<\/b>|2 movimientos/);
      await p.click('#dlgF >> text=Pasarlos');
      const id = await p.evaluate(() => S.cats.find(c => c.n === 'Suscripciones').id);
      assert.deepEqual(await p.evaluate(i => S.mov.filter(x => x.cat === i).map(x => x.concepto).sort(), id), ['NETFLIX.COM', 'SPOTIFY P1234']);
      assert.equal(await p.evaluate(i => autoCat('HBO MAX', '', -9), id), id, 'las nuevas se clasifican solas');
      assert.equal(await p.$('#catSug [data-sug="Suscripciones"]'), null, 'ya no se ofrece');
    })();
  },

  'evolución: tarjetas que se pliegan y gráficos con la cifra al pasar por encima'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado, { inicio: true });
      const h = await p.evaluate(() => mesDe(hoy()));
      await p.evaluate(m => { for (let k = 0; k < 4; k++) { const mm = addMes(m, -k); S.mov.push({ id: uid(), fecha: mm + '-01', mes: mm, concepto: 'NOMINA', importe: 2000, cat: 'INGRESO', metodo: 'banco', cuenta: 'EVO', origen: 'extracto' }, { id: uid(), fecha: mm + '-02', mes: mm, concepto: 'ALQUILER', importe: -700, cat: 'VIVIENDA', metodo: 'banco', cuenta: 'EVO', origen: 'extracto' }); } save(); go('resumen'); }, h);
      await p.evaluate(() => go('hist'));
      for (const c of ['dinero', 'gasto', 'ahorro', 'cats']) assert.ok(await p.$(`#evoCards details[data-ic="${c}"][open]`), 'tarjeta ' + c);
      assert.ok(await p.$('#uWho.avisoP'), 'los avisos se marcan con un puntito en el círculo');
      await p.click('#evoCards details[data-ic="gasto"] > summary');
      await L.esperar(450); // se pliega con animación
      assert.equal(await p.$('#evoCards details[data-ic="gasto"][open]'), null);
      await p.evaluate(() => go('resumen')); await p.evaluate(() => go('hist'));
      assert.equal(await p.$('#evoCards details[data-ic="gasto"][open]'), null, 'recuerda las plegadas');
      await p.$eval('#evoCards details[data-ic="ahorro"]', e => e.scrollIntoView({ block: 'center' })); await L.esperar(300);
      await p.hover('#evoCards details[data-ic="ahorro"] .col:last-child'); await L.esperar(700); await p.hover('#evoCards details[data-ic="ahorro"] .col:last-child', { position: { x: 10, y: 60 } });
      await p.waitForSelector('#tip.on', { timeout: 3000 });
      assert.match(await p.textContent('#tip'), /Ahorrado/);
      await p.click('#evoCards details[data-ic="gasto"] > summary');
      assert.ok(await p.$('#evoCards details[data-ic="gasto"][open]'));
    })();
  },
  'mi perfil: se abre desde el nombre, cambia el nombre y la apariencia; Usuarios con foto'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      await p.click('#uWho'); await p.click('#cmPerfil');
      assert.equal(await p.evaluate(() => TAB), 'perfil');
      assert.match(await p.textContent('#pfNombre'), /Administrador/);
      for (const id of ['#fotoAj', '#aparCard #palSel', '#aparCard #temaSeg', '#prefCard [data-pref="aviso80"]', '#pfAct', '#wipe']) assert.ok(await p.$(id), id);
      assert.equal(await p.$('#prefCard [data-pref="bizumReglas"]'), null, 'lo de clasificar se queda en Ajustes');
      // cambiar el nombre
      await p.fill('#miNombre', 'Carlos'); await p.click('#miNombreF button'); await L.esperar(300);
      assert.equal(await p.textContent('#uName'), 'Carlos');
      assert.equal(await p.evaluate(() => JSON.parse(localStorage.__mockDb)['perfiles/' + USER.uid].nombre), 'Carlos');
      // el icono de la pestaña es siempre el logo de la marca
      await p.evaluate(() => irApartado('perfil', 'apariencia')); await p.click('#palSel [data-pal="frambuesa"]');
      assert.match(await p.evaluate(() => document.querySelector('link[rel="icon"][type="image/svg+xml"]').href), /logo\.svg$/);
      await p.click('#palSel [data-pal="verde"]');
      assert.match(await p.evaluate(() => document.querySelector('link[rel="icon"][type="image/svg+xml"]').href), /logo\.svg$/);
      // apariencia: quitar animaciones
      await p.click('label.pref:has([data-pref="animaciones"])');
      assert.ok(await p.evaluate(() => document.documentElement.classList.contains('sinanim')));
      // Ajustes: clasificación y diezmo
      await p.evaluate(() => go('ajustes'));
      assert.ok(await p.$('#clasCard [data-pref="bizumReglas"]'));
      assert.ok(await p.$('#dzOn'));
      // foto y lista de usuarios con su foto
      await p.evaluate(() => go('perfil'));
      const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVR42mNk+M/AwMDAxMDAwMDAAAAOFQEBcNqzKwAAAABJRU5ErkJggg==', 'base64');
      await p.setInputFiles('#fotoFile', { name: 'yo.png', mimeType: 'image/png', buffer: png }); await L.esperar(500);
      await p.evaluate(() => { USERS_VIVO = false; go('usuarios'); }); await L.esperar(500);
      assert.ok(await p.$('#uTable .ucell img.avatar'), 'la foto sale en la lista de usuarios');
    })();
  },
};
