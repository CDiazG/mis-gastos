// Chat con Rufo (preguntas frecuentes) y con el administrador
const assert = require('assert');
const L = require('./lib');

async function dentro(browser, estado) {
  const ctx = await L.nuevoContexto(browser); (estado.contextos ||= []).push(ctx);
  const p = await L.nuevaPagina(ctx); estado.paginas.push(p);
  await L.crearAdminYEntrar(p);
  return p;
}
async function preguntar(p, t) { await p.fill('#chTxt', t); await p.click('#chForm button'); await L.esperar(150); }

module.exports = {
  'Rufo responde con las preguntas frecuentes y lleva al sitio'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      assert.ok(await p.isVisible('#rufoBtn'));
      await p.click('#rufoBtn');
      assert.match(await p.textContent('#rufoPanel'), /Soy Rufo/);
      await preguntar(p, 'como subo el pdf del banco');
      assert.match(await p.textContent('#chBody'), /movimientos del banco/i);
      await preguntar(p, 'quiero poner modo oscuro');
      assert.match(await p.textContent('#chBody'), /modo oscuro/);
      await p.click('#chBody .cm:last-child [data-ir]:not([data-modo])');
      assert.equal(await p.evaluate(() => TAB), 'perfil', 'te lleva a Mi perfil');
      assert.ok(!(await p.isVisible('#rufoPanel')));
      await p.click('#rufoBtn');
      await preguntar(p, 'zxcv qwerty');
      assert.match(await p.textContent('#chBody'), /no lo sé/);
    })();
  },

  'lo que Rufo no sabe se le pregunta al administrador, que contesta'(browser, estado) {
    return (async () => {
      const p = await dentro(browser, estado);
      // alta de una usuaria
      await p.evaluate(() => go('usuarios')); await L.esperar(200);
      await p.fill('#uNom', 'Hermana'); await p.fill('#uMail', 'hermana@prueba.test'); await p.click('#uAdd button'); await L.esperar(400);
      await p.click('#dlgF >> text=Entendido');
      // el administrador está en línea
      await p.evaluate(() => fb.fsM.setDoc(fb.fsM.doc(fb.db, 'presencia', 'admin'), { visto: Date.now(), mostrar: true }));
      await L.salir(p); await L.ponerClave(p, 'hermana@prueba.test', 'hermana1');
      await L.entrar(p, 'hermana@prueba.test', 'hermana1'); await L.cerrarBienvenida(p);
      await p.click('#rufoBtn');
      await preguntar(p, 'zxcv puedo compartir cuentas con mi pareja');
      await p.click('#chBody [data-esc]'); await L.esperar(400);
      assert.match(await p.textContent('#rufoPanel'), /El administrador/);
      assert.match(await p.textContent('#rufoPanel'), /En línea/);
      assert.match(await p.textContent('#chBody'), /compartir cuentas/);
      // no puede leer los mensajes de otros ni escribir como administrador
      const r = await p.evaluate(async () => { try { await fb.fsM.addDoc(fb.fsM.collection(fb.db, 'mensajes'), { uid: USER.uid, nombre: 'x', de: 'admin', texto: 'hola', fecha: 1, leido: false }); return 'enviado'; } catch (e) { return e.code; } });
      assert.equal(r, 'permission-denied');
      // el administrador lo ve y contesta
      await L.salir(p); await L.entrar(p, L.ADMIN, L.CLAVE_ADMIN); await L.esperar(500);
      assert.match(await p.textContent('#rufoN'), /1/);
      await p.click('#rufoBtn'); await p.click('#chAdm');
      await p.click('#rufoPanel .cconv');
      assert.match(await p.textContent('#chBody'), /compartir cuentas/);
      await p.fill('#chTxt', 'De momento cada uno tiene las suyas'); await p.click('#chForm button'); await L.esperar(400);
      // ella ve la respuesta
      await L.salir(p); await L.entrar(p, 'hermana@prueba.test', 'hermana1'); await L.esperar(600);
      assert.match(await p.textContent('#rufoN'), /1/);
      await p.click('#rufoBtn'); await p.click('#chAdm');
      assert.match(await p.textContent('#chBody'), /cada uno tiene las suyas/);
      await L.esperar(300);
      assert.equal(await p.textContent('#rufoN'), '', 'al leerlo se quita el aviso');
    })();
  },
};
