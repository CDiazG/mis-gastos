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

  'migración: gimnasio a «Deporte y actividades» y Trade Republic a «Inversión»'(browser, estado) {
    return (async () => {
      const ctx = await browser.newContext(); (estado.contextos ||= []).push(ctx);
      await ctx.route('**/js/config.js*', r => r.fulfill({ contentType: 'text/javascript', body: 'window.MG_CONFIG={firebase:null};' }));
      // datos guardados con la versión anterior (sin la categoría nueva)
      await ctx.addInitScript(() => { if (localStorage.getItem('mis-gastos-v1')) return;
        const pct = { VIVIENDA: 25, SUPERMERCADO: 10, PROFESIONAL: 5, SALUD: 5, TRANSPORTE: 5, OCIO: 8, PERSONAL: 5, VIAJES: 5, REGALOS: 2, OTROS: 0, AHORRO: 20, DIEZMO: 10 };
        const cats = [['VIVIENDA','Vivienda','FIJOS'],['SUPERMERCADO','Supermercado','FIJOS'],['PROFESIONAL','Profesional','FIJOS'],['SALUD','Salud y bienestar','FIJOS'],['TRANSPORTE','Transporte','FIJOS'],['OCIO','Restaurantes y ocio','VARIABLES'],['PERSONAL','Personal','VARIABLES'],['VIAJES','Viajes y conciertos','VARIABLES'],['REGALOS','Regalos','VARIABLES'],['OTROS','Otros','VARIABLES'],['AHORRO','Ahorro / inversión','AHORRO'],['DIEZMO','Diezmo','AHORRO']].map(([id,n,g]) => ({ id, n, g }));
        localStorage.setItem('mis-gastos-v1', JSON.stringify({ v: 1, histOfrecido: true, verVista: '2.7.0', cats, aj: { pct, base: 'ingresos', baseFija: 0, diaNomina: 25 }, reglas: [{ t: 'GIMNASIO', c: 'SALUD', u: 0 }, { t: 'PSICOLOGO', c: 'SALUD', u: 0 }, { t: 'TRADE REPUBLIC', c: 'AHORRO', u: 0 }], cuentas: [], mov: [
          { id: 'a', fecha: '2026-10-02', mes: '2026-10', concepto: 'Gimnasio Energy', importe: -40, cat: 'SALUD', metodo: 'banco', cuenta: 'EVO', origen: 'extracto' },
          { id: 'b', fecha: '2026-10-03', mes: '2026-10', concepto: 'PSICOLOGO', importe: -60, cat: 'SALUD', metodo: 'banco', cuenta: 'EVO', origen: 'extracto' },
          { id: 'c', fecha: '2026-10-04', mes: '2026-10', concepto: 'TRANSFERENCIA A TRADE REPUBLIC', importe: -300, cat: 'AHORRO', metodo: 'banco', cuenta: 'EVO', origen: 'extracto' },
          { id: 'd', fecha: '2026-10-05', mes: '2026-10', concepto: 'A CUENTA REMUNERADA', importe: -100, cat: 'AHORRO', metodo: 'banco', cuenta: 'EVO', origen: 'extracto' }] })); });
      const p = await L.nuevaPagina(ctx); estado.paginas.push(p);
      await p.goto(L.URL_APP); await L.esperar(500);
      const r = await p.evaluate(() => ({ g: S.mov.find(x => x.id === 'a').cat, ps: S.mov.find(x => x.id === 'b').cat, suma: sumaPct(), salud: S.cats.find(c => c.id === 'SALUD').n, regla: S.reglas.find(r => r.t === 'GIMNASIO').c }));
      assert.equal(r.g, 'ACTIVIDADES'); assert.equal(r.ps, 'SALUD'); assert.equal(r.suma, 100); assert.equal(r.salud, 'Salud'); assert.equal(r.regla, 'ACTIVIDADES');
      assert.equal(await p.evaluate(() => S.reglas.find(r => r.t === 'TRADE REPUBLIC').c), 'INVERSION');
      const r2 = await p.evaluate(() => ({ t: S.mov.find(x => x.id === 'c').cat, a: S.mov.find(x => x.id === 'd').cat, pa: S.aj.pct.AHORRO, pi: S.aj.pct.INVERSION, n: S.cats.find(c => c.id === 'AHORRO').n }));
      assert.equal(r2.t, 'INVERSION'); assert.equal(r2.a, 'TRASPASO', 'el ahorro ya no es categoría: pasar a otra cuenta es traspaso'); assert.equal(r2.pa + r2.pi, 20); assert.equal(r2.n, 'Ahorro');
      assert.match(await p.textContent('#groups'), /Necesidades/);
      await p.reload(); await L.esperar(300);
      assert.equal(await p.evaluate(() => S.mov.find(x => x.id === 'a').cat), 'ACTIVIDADES', 'el cambio queda guardado');
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
