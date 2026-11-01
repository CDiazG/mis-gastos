// Entrada, administrador, solicitudes de acceso, alta y baja de usuarios.
const assert = require('assert');
const L = require('./lib');

async function preparar(browser, estado, opciones) {
  const ctx = await L.nuevoContexto(browser, opciones); (estado.contextos ||= []).push(ctx);
  const p = await L.nuevaPagina(ctx); estado.paginas.push(p); return { ctx, p };
}

module.exports = {
  'el administrador necesita verificar el correo'(browser, estado) {
    return (async () => {
      const { p } = await preparar(browser, estado);
      await L.abrir(p);
      await p.fill('#lMail', L.ADMIN); await p.fill('#lPass', L.CLAVE_ADMIN);
      await p.waitForSelector('#lAlta:not(.hide)');
      await p.click('#lAlta'); await L.esperar(250);
      assert.match(await p.textContent('#lMsg'), /verificarla/);
      await L.entrar(p, L.ADMIN, L.CLAVE_ADMIN);
      assert.match(await p.textContent('#lMsg'), /verifica tu correo/);
    })();
  },

  'al abrir pide confirmar la sesión guardada'(browser, estado) {
    return (async () => {
      const { ctx, p } = await preparar(browser, estado);
      await L.crearAdminYEntrar(p);
      assert.ok(await p.isVisible('#userbox'));
      const p2 = await L.nuevaPagina(ctx); estado.paginas.push(p2);
      await L.abrir(p2);
      assert.ok(await p2.isVisible('#lCont'), 'debería preguntar antes de entrar');
      await p2.click('#lContGo'); await L.esperar(500);
      assert.ok(await p2.isVisible('#userbox'));
      await p2.reload(); await L.esperar(500);
      assert.ok(await p2.isVisible('#userbox'), 'al recargar la misma pestaña sigue dentro');
      const p3 = await L.nuevaPagina(ctx); estado.paginas.push(p3);
      await L.abrir(p3); await p3.click('#lContOtra'); await L.esperar(300);
      assert.ok(await p3.isVisible('#lForm'));
    })();
  },

  'solicitar acceso, aprobar y entrar'(browser, estado) {
    return (async () => {
      const { p } = await preparar(browser, estado);
      await L.crearAdminYEntrar(p); await L.salir(p);
      await p.click('#lSolic');
      await p.fill('#lNom', 'Persona de prueba'); await p.fill('#lMail', 'nueva@prueba.test'); await p.fill('#lPass', 'corta');
      await p.click('#lGo'); await L.esperar(200);
      assert.match(await p.textContent('#lMsg'), /al menos 8/);
      await p.fill('#lPass', 'clave1234'); await p.click('#lGo'); await L.esperar(500);
      assert.match(await p.textContent('#lMsg'), /Solicitud enviada/);
      await L.entrar(p, 'nueva@prueba.test', 'clave1234');
      assert.match(await p.textContent('#lMsg'), /pendiente/);
      await L.entrar(p, L.ADMIN, L.CLAVE_ADMIN);
      assert.match(await p.textContent('#tabUsuarios'), /1/);
      await p.evaluate(() => go('usuarios')); await L.esperar(300);
      await p.click('.uok'); await L.esperar(400);
      await L.salir(p);
      await L.entrar(p, 'nueva@prueba.test', 'clave1234'); await L.cerrarBienvenida(p);
      assert.equal(await p.textContent('#uName'), 'Persona de prueba');
      assert.ok(await p.isHidden('#tabUsuarios'), 'un usuario normal no ve la pestaña Usuarios');
    })();
  },

  'alta por el administrador, desactivar y eliminar'(browser, estado) {
    return (async () => {
      const { p } = await preparar(browser, estado);
      await L.crearAdminYEntrar(p);
      await p.evaluate(() => go('usuarios')); await L.esperar(200);
      await p.fill('#uNom', 'Hermana'); await p.fill('#uMail', 'hermana@prueba.test'); await p.click('#uAdd button'); await L.esperar(400);
      assert.match(await p.textContent('#dlgB'), /correo/);
      await p.click('#dlgF >> text=Entendido');
      await L.salir(p); await L.ponerClave(p, 'hermana@prueba.test', 'hermana1');
      await L.entrar(p, 'hermana@prueba.test', 'hermana1'); await L.cerrarBienvenida(p);
      await p.evaluate(() => go('efectivo'));
      await p.fill('#cImp', '10'); await p.fill('#cCon', 'mercado'); await p.click('#cChips .chip[data-c=SUPERMERCADO]'); await p.click('#aGo'); await L.esperar(900);
      const uid = await p.evaluate(() => USER.uid);
      const docs = () => p.evaluate(u => Object.keys(JSON.parse(localStorage.__mockDb)).filter(k => k.startsWith('users/' + u + '/')).length, uid);
      assert.ok(await docs() > 0);
      await L.salir(p); await L.entrar(p, L.ADMIN, L.CLAVE_ADMIN);
      await p.evaluate(() => go('usuarios')); await L.esperar(300);
      await p.click(`tr[data-u="${uid}"] .ua`); await p.click('#dlgF >> text=Desactivar'); await L.esperar(300);
      await L.salir(p); await L.entrar(p, 'hermana@prueba.test', 'hermana1');
      assert.match(await p.textContent('#lMsg'), /no está activa/);
      await L.entrar(p, L.ADMIN, L.CLAVE_ADMIN); await p.evaluate(() => go('usuarios')); await L.esperar(300);
      await p.click(`tr[data-u="${uid}"] .ux`);
      await p.fill('#uxConf', 'otra cosa'); await p.click('#dlgF >> text=Eliminar definitivamente'); await L.esperar(150);
      assert.ok(await p.evaluate(() => document.getElementById('dlg').open), 'sin escribir ELIMINAR no borra');
      await p.fill('#uxConf', 'eliminar'); await p.click('#dlgF >> text=Eliminar definitivamente'); await L.esperar(800);
      assert.equal(await docs(), 0, 'se han borrado sus datos');
    })();
  },
};
