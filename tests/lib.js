// Utilidades comunes de las pruebas de Cuentas Claras.
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const RAIZ = path.resolve(__dirname, '..');
const URL_APP = 'http://127.0.0.1:8765/';
const ADMIN = 'admin@prueba.test';
const CLAVE_ADMIN = 'secreta123';

const leer = f => fs.readFileSync(path.join(__dirname, f), 'utf8');

// Contexto de navegador con Firebase simulado y configuración de prueba.
async function nuevoContexto(browser, opciones = {}) {
  const { conTutorial, inicio, ...resto } = opciones;
  const ctx = await browser.newContext({ viewport: { width: 1300, height: 900 }, acceptDownloads: true, ...resto });
  await ctx.route('https://www.gstatic.com/**', r => {
    const u = r.request().url();
    const f = u.includes('auth') ? 'auth.js' : u.includes('firestore') ? 'fs.js' : 'app.js';
    r.fulfill({ contentType: 'text/javascript', body: leer('simulador/' + f) });
  });
  // las pruebas antiguas empiezan en el Resumen (la app empieza en Inicio)
  if (!inicio) await ctx.addInitScript(() => { window.__TAB_INICIAL = 'resumen'; });
  if (!conTutorial) await ctx.addInitScript(() => { try { localStorage.setItem('mg-sin-tuto', '1'); } catch (e) {} });
  const hash = crypto.createHash('sha256').update(ADMIN).digest('hex');
  await ctx.route('**/js/config.js*', r => r.fulfill({
    contentType: 'text/javascript',
    body: `window.MG_CONFIG={firebase:{apiKey:'prueba',projectId:'prueba'},adminHash:'${hash}'};`
  }));
  return ctx;
}

// Página con registro de errores de JavaScript.
async function nuevaPagina(ctx) {
  const p = await ctx.newPage();
  p.errores = [];
  p.on('pageerror', e => p.errores.push(e.message));
  p.on('console', m => { if (m.type() === 'error') p.errores.push(m.text()); });
  return p;
}

const esperar = ms => new Promise(r => setTimeout(r, ms));

async function abrir(p) { await p.goto(URL_APP); await p.waitForSelector('#login:not(.hide), #userbox:not(.hide)'); await esperar(200); }

// Crea la cuenta de administrador, la verifica y entra.
async function crearAdminYEntrar(p) {
  await abrir(p);
  await p.fill('#lMail', ADMIN); await p.fill('#lPass', CLAVE_ADMIN);
  await p.waitForSelector('#lAlta:not(.hide)');
  await p.click('#lAlta'); await esperar(250);
  await p.evaluate(a => { const s = JSON.parse(localStorage.__mockAuth); Object.values(s.users).find(u => u.email === a).verified = true; localStorage.__mockAuth = JSON.stringify(s); }, ADMIN);
  await entrar(p, ADMIN, CLAVE_ADMIN);
  await cerrarBienvenida(p);
  await esperar(900); // que se guarde en la nube simulada
}

async function entrar(p, correo, clave) {
  await p.fill('#lMail', correo); await p.fill('#lPass', clave); await p.click('#lGo'); await esperar(500);
}

async function cerrarBienvenida(p) {
  if (await p.evaluate(() => document.getElementById('dlg').open && document.getElementById('dlgT').textContent === 'Bienvenida'))
    await p.click('#dlgF >> text=Empezar vacío');
}

async function salir(p) { if (!(await p.isVisible('#logout'))) await p.click('#uWho'); await Promise.all([p.waitForNavigation(), p.click('#logout')]); await esperar(300); }

// Fija la contraseña de un usuario simulado (como si hubiera usado el correo de contraseña).
async function ponerClave(p, correo, clave) {
  await p.evaluate(([c, k]) => { const s = JSON.parse(localStorage.__mockAuth); Object.values(s.users).find(u => u.email === c).pw = k; localStorage.__mockAuth = JSON.stringify(s); }, [correo, clave]);
}

// Genera un PDF a partir de HTML con el Chromium de Playwright.
async function pdfDesdeHtml(browser, html) {
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await p.setContent(html);
  const buf = await p.pdf({ format: 'A4', printBackground: false, margin: { top: '15mm', bottom: '15mm', left: '10mm', right: '10mm' } });
  await ctx.close();
  return buf;
}

module.exports = { RAIZ, URL_APP, ADMIN, CLAVE_ADMIN, nuevoContexto, nuevaPagina, esperar, abrir, crearAdminYEntrar, entrar, cerrarBienvenida, salir, ponerClave, pdfDesdeHtml, leer };
