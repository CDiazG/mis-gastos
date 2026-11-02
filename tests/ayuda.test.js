// Versión 2.11.0: ahorro automático, preferencias, tema, mes visible, tutorial, foro y foto de perfil, Excel por meses.
const assert = require('assert');
const L = require('./lib');

async function dentro(browser, estado, opciones) {
  const ctx = await L.nuevoContexto(browser, opciones); (estado.contextos ||= []).push(ctx);
  const p = await L.nuevaPagina(ctx); estado.paginas.push(p);
  await L.crearAdminYEntrar(p);
  return p;
}
const meter = (p, movs) => p.evaluate(ms => {
  for (const [f, c, i, cat, met] of ms) S.mov.push({ id: uid(), fecha: f, mes: f.slice(0, 7), concepto: c, importe: i, cat, metodo: met || 'banco', cuenta: met ? '' : 'EVO', origen: met ? 'manual' : 'extracto', key: uid() });
  MES = '2026-10'; save(); render();
}, movs);

module.exports = {
  'el ahorro es lo que no se gasta y el objetivo se marca al conseguirlo'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      await meter(p, [['2026-10-01', 'NOMINA', 2000, 'INGRESO'], ['2026-10-02', 'ALQUILER', -600, 'VIVIENDA'], ['2026-10-03', 'TRADE REPUBLIC', -300, 'INVERSION'],
        ['2026-10-04', 'DIEZMO', -200, 'DIEZMO'], ['2026-10-05', 'A MI CUENTA AHORRO', -500, 'TRASPASO']]);
      const st = await p.evaluate(() => { const s = stats('2026-10'); return { ah: s.ahorro, cta: s.by.AHORRO, inv: s.by.INVERSION, cons: s.consumo }; });
      assert.equal(st.ah, 1200, 'ingresos − gastos − diezmo');
      assert.equal(st.cta, 900, 'lo que queda en cuenta: ahorro − inversión');
      assert.equal(st.cons, 600, 'el traspaso no es gasto');
      const k = await p.textContent('#kpis');
      assert.ok(!/Sin asignar/.test(k), 'ya no hay casilla «Sin asignar»');
      assert.match(k, /Objetivo de ahorro/);
      assert.match(k, /Conseguido/);
      assert.ok(await p.$('#kObj.kok'));
      assert.match(await p.textContent('#groups [data-cat="AHORRO"]'), /automático/);
      // «Ahorro» ya no se puede elegir como categoría
      assert.equal(await p.evaluate(() => catOptions('').includes('value="AHORRO"')), false);
      await p.evaluate(() => go('efectivo'));
      assert.equal(await p.$('#cChips .chip[data-c="AHORRO"]'), null);
      // sin llegar al objetivo
      await meter(p, [['2026-10-06', 'VIAJE', -1000, 'VIAJES']]);
      await p.evaluate(() => go('resumen'));
      assert.match(await p.textContent('#kObj'), /Te faltan/);
    })();
  },

  'el mes se ve claro y se puede volver al actual'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      const actual = await p.evaluate(() => nombreMes(mesDe(hoy())));
      assert.match(await p.textContent('#s-resumen .mesTit'), new RegExp(actual, 'i'));
      assert.match(await p.textContent('#s-resumen .mesTit'), /mes actual/);
      await p.click('#mPrev');
      assert.match(await p.textContent('#s-resumen .mesTit'), /mes pasado/);
      assert.equal(await p.evaluate(() => getComputedStyle(document.getElementById('mHoy')).visibility), 'visible');
      await p.click('#s-resumen .mtHoy');
      assert.match(await p.textContent('#mLabel'), /mes actual/);
      assert.equal(await p.evaluate(() => getComputedStyle(document.getElementById('mHoy')).visibility), 'hidden', '«Hoy» se esconde en el mes actual sin mover las flechas');
      // las flechas no se mueven aunque el nombre del mes sea más largo
      const pos = () => p.evaluate(() => [document.getElementById('mPrev').getBoundingClientRect().x, document.getElementById('mNext').getBoundingClientRect().x]);
      await p.evaluate(() => setMes('2026-05')); const a = await pos();
      await p.evaluate(() => setMes('2026-09')); const b = await pos();
      assert.deepEqual(a, b, 'mayo y septiembre dejan las flechas en el mismo sitio');
    })();
  },

  'el gráfico se vacía al quitar el último gasto del mes'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      await meter(p, [['2026-10-05', 'LIBRO MEDICINA', -26, 'PROFESIONAL']]);
      assert.match(await p.textContent('#grafCard'), /Profesional/);
      await p.evaluate(() => { S.mov.find(x => x.concepto === 'LIBRO MEDICINA').cat = 'PRESTAMO'; save(); go('resumen'); });
      assert.ok(!(await p.isVisible('#grafCard')), 'sin gastos no se enseña el gráfico');
      assert.equal(await p.textContent('#grafCard'), '');
    })();
  },

  'sugerencia de presupuesto: una vez aplicada deja de sugerirse'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      await p.evaluate(() => { const add = (f, c, i, cat) => S.mov.push({ id: uid(), fecha: f, mes: f.slice(0, 7), concepto: c, importe: i, cat, metodo: 'banco', cuenta: 'EVO', origen: 'extracto', key: uid() });
        for (const m of ['2026-06', '2026-07', '2026-08', '2026-09']) { add(m + '-01', 'NOMINA', 2000, 'INGRESO'); add(m + '-02', 'ALQUILER', -700, 'VIVIENDA'); add(m + '-03', 'CENAS', -300, 'OCIO'); add(m + '-04', 'MERCADONA', -150, 'SUPERMERCADO'); }
        save(); go('ajustes'); });
      assert.match(await p.textContent('#sugCard'), /Aplicar \d+ cambio/);
      await p.click('#sugApply'); await p.click('#dlgF >> text=Aplicar'); await L.esperar(200);
      assert.equal(await p.evaluate(() => sumaPct()), 100, 'aplicar la sugerencia siempre deja el 100 %');
      assert.equal(await p.evaluate(() => sugerencia().aplicada), true, 'recalculada con los mismos datos, no cambia nada');
      assert.match(await p.textContent('#sugCard'), /ya está ajustado/);
      assert.equal(await p.$('#sugApply'), null, 'sin botón de aplicar');
      await p.evaluate(() => go('resumen'));
      assert.ok(!/Hay una sugerencia/.test(await p.textContent('#alerts')));
      // si cambian los gastos vuelve a sugerir, y se puede dejar para el mes que viene
      await p.evaluate(() => { for (const m of ['2026-10']) S.mov.push({ id: uid(), fecha: m + '-05', mes: m, concepto: 'VIAJE', importe: -900, cat: 'VIAJES', metodo: 'banco', cuenta: 'EVO', origen: 'extracto', key: uid() }, { id: uid(), fecha: m + '-01', mes: m, concepto: 'NOMINA', importe: 2000, cat: 'INGRESO', metodo: 'banco', cuenta: 'EVO', origen: 'extracto', key: uid() });
        for (const m of ['2026-07', '2026-08', '2026-09']) S.mov.push({ id: uid(), fecha: m + '-06', mes: m, concepto: 'VIAJE', importe: -400, cat: 'VIAJES', metodo: 'banco', cuenta: 'EVO', origen: 'extracto', key: uid() });
        save(); go('ajustes'); });
      assert.match(await p.textContent('#sugCard'), /Aplicar \d+ cambio/);
      assert.equal(await p.evaluate(() => sugerencia().filas.reduce((a, f) => a + f.sug, 0)), 100, 'aunque no quepa todo el ahorro');
      await p.click('#sugLuego');
      assert.match(await p.textContent('#sugCard'), /vuelve a aparecer/);
    })();
  },

  'preferencias: Bizum sin reglas, interruptores y tema'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      // una regla aprendida de un Bizum no se aplica mientras esté desactivado
      const r = await p.evaluate(() => { S.reglas.unshift({ t: 'BIZUM DE AMPARO', c: 'OCIO', u: 1 }); learn('PAGO BIZUM DE LUCIA', 'REGALOS');
        return { cat: autoCat('PAGO BIZUM DE AMPARO', '', 10), aprendida: S.reglas.some(r => r.t.includes('LUCIA')) }; });
      assert.equal(r.cat, ''); assert.equal(r.aprendida, false);
      await p.evaluate(() => go('ajustes', { sub: 'clasif' }));
      await p.click('label.pref:has([data-pref="bizumReglas"])');
      assert.equal(await p.evaluate(() => autoCat('PAGO BIZUM DE AMPARO', '', 10)), 'OCIO');
      // quitar el gráfico y el botón flotante
      await p.evaluate(() => go('perfil', { sub: 'avisos' }));
      await p.click('label.pref:has([data-pref="verGrafico"])');
      await p.evaluate(() => irApartado('perfil', 'apariencia')); await p.click('label.pref:has([data-pref="fab"])');
      await p.evaluate(() => go('resumen'));
      assert.ok(!(await p.isVisible('#grafCard')));
      assert.ok(!(await p.isVisible('#fabCash')));
      // tema
      await p.evaluate(() => go('perfil', { sub: 'apariencia' }));
      await p.click('#temaSeg [data-v="oscuro"]');
      assert.equal(await p.evaluate(() => document.documentElement.dataset.theme), 'dark');
      const fondo = await p.evaluate(() => getComputedStyle(document.body).backgroundColor);
      assert.equal(fondo, 'rgb(19, 22, 21)');
      await p.click('#temaSeg [data-v="claro"]');
      assert.equal(await p.evaluate(() => document.documentElement.dataset.theme), 'light');
      await p.click('#temaSeg [data-v="auto"]');
      assert.equal(await p.evaluate(() => document.documentElement.dataset.theme), undefined);
      assert.equal(await p.evaluate(() => localStorage.getItem('mg-tema')), 'auto');
    })();
  },

  'guía inicial: personalizar (foto, colores, diezmo, categorías) y recorrido completo'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado, { conTutorial: true, inicio: true });
      await p.waitForSelector('#tuto:not(.hide)', { timeout: 5000 });
      assert.match(await p.textContent('#tuto'), /Soy Rufo/);
      assert.ok(await p.$('#tuto svg.mascota'));
      await p.click('#tutoSig');
      assert.match(await p.textContent('#tuto'), /Tu foto/);
      assert.ok(await p.$('#gFoto'));
      await p.click('#tutoSkip'); // omitir la foto
      assert.match(await p.textContent('#tuto'), /Tus colores/);
      await p.click('[data-gpal="oceano"]'); await p.click('[data-gtema="oscuro"]');
      assert.equal(await p.evaluate(() => [document.documentElement.dataset.pal, document.documentElement.dataset.theme].join()), 'oceano,dark');
      await p.click('#tutoSig');
      assert.match(await p.textContent('#tuto'), /diezmo/);
      await p.click('[data-gdz="0"]');
      assert.equal(await p.evaluate(() => [diezmoOn(), CATS.some(c => c.id === 'DIEZMO'), sumaPct()].join()), 'false,false,100');
      await p.click('#tutoSig');
      assert.match(await p.textContent('#tuto'), /categorías/);
      await p.click('[data-gcat="Mascotas"]');
      assert.ok(await p.evaluate(() => S.cats.some(c => c.n === 'Mascotas') && autoCat('KIWOKO VALENCIA', '', -20) === S.cats.find(c => c.n === 'Mascotas').id));
      // recorrido por las pestañas
      const vistas = new Set();
      for (let i = 0; i < 20 && await p.isVisible('#tuto'); i++) { vistas.add(await p.evaluate(() => TAB)); if (await p.textContent('#tutoSig') === '¡Empezar!') break; await p.click('#tutoSig'); }
      for (const t of ['inicio', 'resumen', 'efectivo', 'movs', 'importar', 'hist', 'patri', 'ajustes', 'perfil', 'ayuda']) assert.ok(vistas.has(t), 'la guía pasa por ' + t);
      await p.click('#tutoSig');
      assert.ok(!(await p.isVisible('#tuto')));
      assert.equal(await p.evaluate(() => S.aj.guiaV), await p.evaluate(() => GUIA_V));
      // no vuelve a salir sola, pero sí desde Ayuda
      await p.reload(); await L.esperar(1500);
      if (await p.isVisible('#lCont:not(.hide)')) await p.click('#lCont .btn.pri').catch(() => {});
      await L.esperar(1200);
      assert.ok(!(await p.isVisible('#tuto')), 'no vuelve a salir sola');
      await p.evaluate(() => go('ayuda'));
      await p.click('#ayTuto');
      assert.ok(await p.isVisible('#tuto'));
      await p.keyboard.press('Escape');
      assert.ok(!(await p.isVisible('#tuto')));
    })();
  },

  'quien ya vio la guía antigua la ve una vez con esta versión'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado, { conTutorial: true, inicio: true });
      await p.waitForSelector('#tuto:not(.hide)', { timeout: 5000 });
      await p.evaluate(() => { cerrarTuto(); S.aj.tutoVisto = true; delete S.aj.guiaV; tutorial(false); });
      assert.ok(await p.isVisible('#tuto'), 'tutoVisto de la 2.11 no basta: sale la guía nueva');
    })();
  },

  'preguntas frecuentes: «Ir allí» y «Que Rufo me lo enseñe»'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      await p.evaluate(() => go('ayuda'));
      await p.fill('#faqBuscar', 'Bizum no se clasifican');
      await p.click('#faqList [data-ir]');
      assert.equal(await p.evaluate(() => TAB), 'ajustes');
      await p.evaluate(() => go('ayuda'));
      await p.fill('#faqBuscar', 'nómina llega');
      await p.click('#faqList [data-guia]');
      assert.equal(await p.evaluate(() => TAB), 'ajustes');
      assert.ok(await p.isVisible('#tuto')); assert.ok(await p.isVisible('#tutoSpot'));
      assert.equal(await p.textContent('#tutoSig'), 'Entendido');
      await p.click('#tutoSig');
      assert.ok(!(await p.isVisible('#tuto')));
      assert.equal(await p.evaluate(() => S.aj.guiaV || 0), 0, 'una sola pista no cuenta como guía completa');
    })();
  },

  'ayuda: preguntas frecuentes, foro entre usuarios y foto de perfil'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      await p.evaluate(() => go('ayuda'));
      assert.ok((await p.$$('#faqList details')).length >= 10);
      await p.fill('#faqBuscar', 'bizum');
      const n = (await p.$$('#faqList details')).length;
      assert.ok(n >= 1 && n <= 4, 'la búsqueda filtra');
      // foto de perfil (se reduce a 160 px)
      await p.evaluate(() => go('perfil'));
      const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVR42mNk+M/AwMDAxMDAwMDAAAAOFQEBcNqzKwAAAABJRU5ErkJggg==', 'base64');
      await p.setInputFiles('#fotoFile', { name: 'yo.png', mimeType: 'image/png', buffer: png }); await L.esperar(600);
      const f = await p.evaluate(() => ({ u: USER.foto.slice(0, 15), pub: JSON.parse(localStorage.__mockDb)['perfiles/' + USER.uid].foto.length }));
      assert.equal(f.u, 'data:image/jpeg'); assert.ok(f.pub > 100 && f.pub < 60000);
      assert.ok(await p.$('#fotoAj img.avatar'));
      // el administrador pregunta en el foro
      await p.evaluate(() => go('ayuda', { sub: 'foro' }));
      await p.fill('#foroTit', '¿Cómo pongo el gimnasio?'); await p.fill('#foroTxt', 'No sé en qué categoría va.'); await p.click('#foroGo'); await L.esperar(400);
      assert.match(await p.textContent('#foroList'), /gimnasio/);
      // da de alta a su hermana, que responde
      await p.evaluate(() => go('usuarios')); await L.esperar(200);
      await p.fill('#uNom', 'Hermana'); await p.fill('#uMail', 'hermana@prueba.test'); await p.click('#uAdd button'); await L.esperar(400);
      await p.click('#dlgF >> text=Entendido');
      await L.salir(p); await L.ponerClave(p, 'hermana@prueba.test', 'hermana1');
      await L.entrar(p, 'hermana@prueba.test', 'hermana1'); await L.cerrarBienvenida(p);
      await p.evaluate(() => go('ayuda', { sub: 'foro' })); await L.esperar(300);
      assert.match(await p.textContent('#foroList'), /gimnasio/, 'la ve otro usuario');
      assert.ok(await p.$('#foroList img.avatar'), 'con la foto de quien pregunta');
      assert.equal(await p.$('#foroList .hilo .pX'), null, 'no puede borrar lo de otros');
      await p.click('#foroList .fAbrir');
      await p.fill('#foroList .fResp input', 'En «Deporte y actividades».'); await p.click('#foroList .fResp button'); await L.esperar(400);
      assert.match(await p.textContent('#foroList'), /Deporte y actividades/);
      // nadie puede publicar en nombre de otro
      const ajeno = await p.evaluate(async () => { try { await fb.fsM.addDoc(fb.fsM.collection(fb.db, 'foro'), { uid: 'otro', nombre: 'X', texto: 'hola', hilo: '', titulo: '', fecha: 1 }); return 'publicado'; } catch (e) { return e.code; } });
      assert.equal(ajeno, 'permission-denied');
    })();
  },

  'el Excel exportado tiene una hoja por mes como el de siempre'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      await meter(p, [['2026-09-01', 'NOMINA', 2000, 'INGRESO'], ['2026-09-02', 'ALQUILER', -600, 'VIVIENDA'], ['2026-10-01', 'NOMINA', 2000, 'INGRESO'],
        ['2026-10-02', 'ALQUILER', -600, 'VIVIENDA'], ['2026-10-03', 'Mercado', -20, 'SUPERMERCADO', 'efectivo'], ['2026-10-04', 'CENA', -400, 'OCIO']]);
      const [dl] = await Promise.all([p.waitForEvent('download'), p.evaluate(() => exportarExcel('2026'))]);
      const buf = require('fs').readFileSync(await dl.path());
      const txt = buf.toString('latin1');
      for (const h of ['Resumen', 'SEPT26', 'OCT26', 'Movimientos']) assert.ok(txt.includes(`name="${h}"`), 'hoja ' + h);
      assert.ok(txt.includes('Octubre 2026'), 'título grande del mes');
      assert.ok(txt.includes('TE PASAS'), 'estado de la categoría que se pasa');
      assert.ok(txt.includes('PRESUPUESTO') && txt.includes('EFECTIVO'), 'columnas de siempre');
      assert.ok(txt.includes('FF8CCFAC'), 'los verdes del Excel');
    })();
  },
};
