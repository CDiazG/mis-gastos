// Ejecuta todas las pruebas: node tests/run.js  (o npm test)
// Levanta un servidor local, abre Chromium con Firebase simulado y comprueba el programa de punta a punta.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { RAIZ, URL_APP } = require('./lib');

const SALIDA = path.join(__dirname, 'resultados');

async function servidorListo() {
  for (let i = 0; i < 50; i++) { try { const r = await fetch(URL_APP); if (r.ok) return; } catch (_) {} await new Promise(r => setTimeout(r, 200)); }
  throw new Error('El servidor local no arranca');
}

(async () => {
  fs.rmSync(SALIDA, { recursive: true, force: true }); fs.mkdirSync(SALIDA, { recursive: true });
  const srv = spawn('python3', ['-m', 'http.server', '8765', '--bind', '127.0.0.1'], { cwd: RAIZ, stdio: 'ignore' });
  let fallos = 0, total = 0;
  try {
    await servidorListo();
    const browser = await chromium.launch();
    const filtro = process.argv[2] || '';
    const archivos = fs.readdirSync(__dirname).filter(f => f.endsWith('.test.js') && f.includes(filtro)).sort();
    for (const a of archivos) {
      const pruebas = require(path.join(__dirname, a));
      for (const [nombre, fn] of Object.entries(pruebas)) {
        total++;
        const t0 = Date.now();
        const estado = { paginas: [] };
        try {
          await Promise.race([fn(browser, estado), new Promise((_, rej) => setTimeout(() => rej(new Error('Tiempo agotado (120 s)')), 120000))]);
          const errores = estado.paginas.flatMap(p => p.errores || []);
          if (errores.length) throw new Error('Errores de JavaScript en la página:\n  ' + errores.join('\n  '));
          console.log(`  ✓ ${a} › ${nombre} (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
        } catch (e) {
          fallos++;
          console.log(`  ✗ ${a} › ${nombre}\n    ${String(e && e.stack || e).split('\n').slice(0, 6).join('\n    ')}`);
          for (const [i, p] of estado.paginas.entries()) { try { await p.screenshot({ path: path.join(SALIDA, `${a}-${nombre}-${i}.png`.replace(/[^\w.-]+/g, '_')), fullPage: true }); } catch (_) {} }
        } finally {
          for (const c of estado.contextos || []) { try { await c.close(); } catch (_) {} }
        }
      }
    }
    await browser.close();
  } finally { srv.kill(); }
  console.log(`\n${total - fallos} de ${total} pruebas correctas${fallos ? ` · ${fallos} con fallos (capturas en tests/resultados)` : ''}`);
  process.exit(fallos ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
