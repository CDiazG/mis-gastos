const assert = require('assert');
const L = require('./lib');
// Extractos PDF inventados en 96 combinaciones de fechas, números y columnas: todos deben leerse bien.
const base = [['2026-11-10', 'COMPRA SUPER DOS VALENCIA', -60], ['2026-11-12', 'NOMINA EMPRESA INVENTADA', 1000], ['2026-11-13', 'RECIBO LUZ UNO', -1234.5], ['2026-11-14', 'BIZUM DE ANA', 2.7]];
const MES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const dts = { es: d => d.split('-').reverse().join('/'), iso: d => d, guion: d => d.split('-').reverse().join('-'), corto: d => { const [y, m, dd] = d.split('-'); return dd + '/' + m + '/' + y.slice(2) }, txt: d => { const [y, m, dd] = d.split('-'); return +dd + ' ' + MES[+m - 1] + ' ' + y }, txtg: d => { const [y, m, dd] = d.split('-'); return dd + '-' + MES[+m - 1] + '-' + y } };
const nums = { es: v => v.toLocaleString('es-ES', { minimumFractionDigits: 2, useGrouping: 'always' }), en: v => v.toLocaleString('en-US', { minimumFractionDigits: 2 }), eur: v => v.toLocaleString('es-ES', { minimumFractionDigits: 2, useGrouping: 'always' }) + ' EUR' , sym: v => v.toLocaleString('es-ES', { minimumFractionDigits: 2, useGrouping: 'always' }) + ' €' };
module.exports = { 'PDF en 96 combinaciones de fechas, números y columnas'(browser, estado) { return (async () => {
  const ctx = await L.nuevoContexto(browser); (estado.contextos ||= []).push(ctx);
  const p = await L.nuevaPagina(ctx); estado.paginas.push(p); await L.crearAdminYEntrar(p);
  const fallos = [];
  for (const [dn, df] of Object.entries(dts)) for (const [nn, nf] of Object.entries(nums)) for (const modo of ['una', 'dos', 'saldo', 'saldoDos']) {
    let s = 2000; const filas = base.map(b => { s += b[2]; return [df(b[0]), b[1], b[2], s] });
    const R = 'style="text-align:right"';
    let html = '<p>Extracto de cuenta</p><table style="width:100%">';
    if (modo === 'una') html += '<tr><td>Fecha</td><td>Concepto</td><td>Importe</td></tr>' + filas.map(f => `<tr><td>${f[0]}</td><td>${f[1]}</td><td ${R}>${nf(f[2])}</td></tr>`).join('');
    if (modo === 'saldo') html += '<tr><td>Fecha</td><td>Concepto</td><td>Importe</td><td>Saldo</td></tr>' + filas.map(f => `<tr><td>${f[0]}</td><td>${f[1]}</td><td ${R}>${nf(f[2])}</td><td ${R}>${nf(f[3])}</td></tr>`).join('');
    if (modo === 'dos') html += '<tr><td>Fecha</td><td>Concepto</td><td>Cargo</td><td>Abono</td></tr>' + filas.map(f => `<tr><td>${f[0]}</td><td>${f[1]}</td><td ${R}>${f[2] < 0 ? nf(-f[2]) : ''}</td><td ${R}>${f[2] > 0 ? nf(f[2]) : ''}</td></tr>`).join('');
    if (modo === 'saldoDos') html += '<tr><td>Fecha</td><td>Concepto</td><td>Cargo</td><td>Abono</td><td>Saldo</td></tr>' + filas.map(f => `<tr><td>${f[0]}</td><td>${f[1]}</td><td ${R}>${f[2] < 0 ? nf(-f[2]) : ''}</td><td ${R}>${f[2] > 0 ? nf(f[2]) : ''}</td><td ${R}>${nf(f[3])}</td></tr>`).join('');
    html += '</table>';
    const buf = await L.pdfDesdeHtml(browser, html);
    try {
      await p.evaluate(() => { go('importar'); if (typeof IMP !== 'undefined' && IMP) IMP.res = []; });
      await p.setInputFiles('#pdfInput', [{ name: 'x.pdf', mimeType: 'application/pdf', buffer: buf }]);
      await p.waitForFunction(() => typeof IMP !== 'undefined' && IMP && IMP.res && IMP.res.length, null, { timeout: 15000 });
      const r = await p.evaluate(() => IMP.res[0] ? IMP.res[0].movs.map(x => [x.fecha, x.importe]) : null);
      const ok = r && r.length === 4 && base.every(b => r.some(x => x[0] === b[0] && Math.abs(x[1] - b[2]) < .005));
      if (!ok) fallos.push(dn + '/' + nn + '/' + modo + ' ' + JSON.stringify(r));
    } catch (e) { fallos.push(dn + '/' + nn + '/' + modo + ' ERR ' + e.message.slice(0, 60)) }
    await p.evaluate(() => { const d = document.querySelector('#dlg'); if (d && d.close) try { d.close() } catch (_) {} });
  }
  assert.equal(fallos.length, 0, fallos.slice(0, 8).join('\n'));
})() } };
