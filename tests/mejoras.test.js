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
      await p.click('#catSug [data-sug="Suscripciones"]');
      assert.match(await p.textContent('#dlgB'), /2<\/b>|2 movimientos/);
      await p.click('#dlgF >> text=Pasarlos');
      const id = await p.evaluate(() => S.cats.find(c => c.n === 'Suscripciones').id);
      assert.deepEqual(await p.evaluate(i => S.mov.filter(x => x.cat === i).map(x => x.concepto).sort(), id), ['NETFLIX.COM', 'SPOTIFY P1234']);
      assert.equal(await p.evaluate(i => autoCat('HBO MAX', '', -9), id), id, 'las nuevas se clasifican solas');
      assert.equal(await p.$('#catSug [data-sug="Suscripciones"]'), null, 'ya no se ofrece');
    })();
  },

  'inicio: tarjetas que se pliegan y gráficos con la cifra al pasar por encima'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado, { inicio: true });
      const h = await p.evaluate(() => mesDe(hoy()));
      await p.evaluate(m => { for (let k = 0; k < 4; k++) { const mm = addMes(m, -k); S.mov.push({ id: uid(), fecha: mm + '-01', mes: mm, concepto: 'NOMINA', importe: 2000, cat: 'INGRESO', metodo: 'banco', cuenta: 'EVO', origen: 'extracto' }, { id: uid(), fecha: mm + '-02', mes: mm, concepto: 'ALQUILER', importe: -700, cat: 'VIVIENDA', metodo: 'banco', cuenta: 'EVO', origen: 'extracto' }); } save(); go('inicio'); }, h);
      assert.equal(await p.evaluate(() => TAB), 'inicio');
      for (const c of ['dinero', 'mes', 'pend', 'gasto', 'ahorro', 'cats']) assert.ok(await p.$(`#inicio details[data-ic="${c}"][open]`), 'tarjeta ' + c);
      await p.click('#inicio details[data-ic="gasto"] > summary');
      assert.equal(await p.$('#inicio details[data-ic="gasto"][open]'), null);
      await p.evaluate(() => go('resumen')); await p.evaluate(() => go('inicio'));
      assert.equal(await p.$('#inicio details[data-ic="gasto"][open]'), null, 'recuerda las plegadas');
      await p.$eval('#inicio details[data-ic="ahorro"]', e => e.scrollIntoView({ block: 'center' }));
      await p.hover('#inicio details[data-ic="ahorro"] .col:last-child');
      await p.waitForSelector('#tip.on', { timeout: 3000 });
      assert.match(await p.textContent('#tip'), /Ahorrado/);
      await p.click('#iniTodo');
      assert.ok(await p.$('#inicio details[data-ic="gasto"][open]'));
    })();
  },
  'mi perfil: se abre desde el nombre, cambia el nombre y la apariencia; Usuarios con foto'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      await p.click('#uWho');
      assert.equal(await p.evaluate(() => TAB), 'perfil');
      assert.match(await p.textContent('#pfNombre'), /Administrador/);
      for (const id of ['#fotoAj', '#aparCard #palSel', '#aparCard #temaSeg', '#prefCard [data-pref="aviso80"]', '#pfAct', '#wipe']) assert.ok(await p.$(id), id);
      assert.equal(await p.$('#prefCard [data-pref="bizumReglas"]'), null, 'lo de clasificar se queda en Ajustes');
      // cambiar el nombre
      await p.fill('#miNombre', 'Carlos'); await p.click('#miNombreF button'); await L.esperar(300);
      assert.equal(await p.textContent('#uName'), 'Carlos');
      assert.equal(await p.evaluate(() => JSON.parse(localStorage.__mockDb)['perfiles/' + USER.uid].nombre), 'Carlos');
      // el icono de la pestaña sigue a la paleta
      await p.evaluate(() => irApartado('perfil', 'apariencia')); await p.click('#palSel [data-pal="frambuesa"]');
      assert.match(await p.evaluate(() => decodeURIComponent(document.querySelector('link[rel="icon"][type="image/svg+xml"]').href)), /#ad2f5b/);
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
