// Extractos bancarios INVENTADOS para las pruebas (no contienen datos reales).
const eur = n => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' });

// Formato tipo EVO: Fecha | Referencia | Fecha valor | Descripción | Cargos(-) | Abonos(+) | Saldo
function htmlEvo() {
  const inicial = 1000;
  const movs = [
    ['01-10-26', 'MERCADONA C/ INVENTADA 1', -20.9],
    ['02-10-26', 'PAGO BIZUM A PERSONA INVENTADA', -17],
    ['03-10-26', 'PAGO BIZUM DE AMIGA INVENTADA', 7.7],
    ['07-10-26', 'TRANS /CASERO INVENTADO', -600],
    ['08-10-26', 'RECIB /IBERDROLA CLIENTES, S.A', -31.17],
    ['09-10-26', 'PARKING DEL PUERTO', -6.4],
    ['20-10-26', 'ZARA', -57],
    ['26-10-26', 'COMERCIO DESCONOCIDO SL', -4.8],
    ['29-10-26', 'TRANSF NOMI /EMPRESA INVENTADA', 2500],
    ['30-10-26', 'PAGO BIZUM DE PRIMA INVENTADA', 18],
  ];
  let saldo = inicial;
  const filas = movs.map(([f, d, i], k) => { saldo = Math.round((saldo + i) * 100) / 100;
    return `<tr><td>${f}</td><td>${100 + k}</td><td>${f}</td><td>${d}</td><td class="r">${i < 0 ? eur(-i) : ''}</td><td class="r">${i > 0 ? eur(i) : ''}</td><td class="r">${eur(saldo)}</td></tr>`; }).join('');
  return { saldoFinal: saldo, n: movs.length, html: `<html><head><style>body{font:9px Arial,sans-serif}td{padding:2px 8px;white-space:nowrap}.r{text-align:right}</style></head><body>
    <p>31-10-26 7820 - OFICINA DIGITAL EVO I</p><p>Movimientos y saldo de su cuenta</p>
    <table><tr><td>Fecha</td><td>Referencia</td><td>Fecha valor</td><td>Descripción</td><td class="r">Cargos(-)</td><td class="r">Abonos(+)</td><td class="r">Saldo</td></tr>
    <tr><td></td><td></td><td></td><td>**SALDO ANTERIOR EN EUROS**</td><td></td><td></td><td class="r">${eur(inicial)}</td></tr>
    ${filas}
    </table><p style="margin-top:40px">&nbsp;</p><table><tr><td></td><td></td><td></td><td>**SALDO FINAL EN EUROS**</td><td></td><td></td><td class="r">${eur(saldo)}</td></tr></table>
    <p style="margin-top:30px">BIC BKBKESMM</p></body></html>` };
}

// Formato tipo Revolut: fechas «4 oct 2026», importes con €, líneas de detalle debajo.
function htmlRevolut() {
  const inicial = 50;
  const movs = [
    ['4 oct 2026', 'Una recarga de Google Pay con *0000', 'De *1111', 200],
    ['8 oct 2026', 'Pizzeria Inventada', 'A Pizzeria Inventada, Valencia', -54],
    ['10 oct 2026', 'INDIGO Group', 'A Parkia Plaza Inventada, Valencia', -32.65],
    ['14 oct 2026', 'Mercadona', 'A Mercadona Calle Inventada, Valencia', -6.47],
  ];
  let saldo = inicial; let sal = 0, ent = 0;
  const filas = movs.map(([f, d, det, i]) => { saldo = Math.round((saldo + i) * 100) / 100; if (i < 0) sal -= i; else ent += i;
    return `<tr><td>${f}</td><td>${f}</td><td>${d}</td><td>${i < 0 ? eur(-i) + '€' : ''}</td><td>${i > 0 ? eur(i) + '€' : ''}</td><td class="r">${eur(saldo)}€</td></tr>
      <tr><td></td><td></td><td>${det}</td><td></td><td></td><td></td></tr><tr><td></td><td></td><td>Tarjeta: 000000******0000</td><td></td><td></td><td></td></tr>`; }).join('');
  return { saldoFinal: saldo, n: movs.length, html: `<html><head><style>body{font:9px Arial,sans-serif}td{padding:1px 8px;white-space:nowrap}.r{text-align:right}</style></head><body>
    <p>Extracto en EUR</p><p>Revolut Bank UAB Sucursal En España</p><p>BIC REVOESM2</p>
    <p>Resumen del saldo</p>
    <table><tr><td>Producto</td><td>Saldo inicial</td><td>Dinero saliente</td><td>Dinero entrante</td><td>Saldo final</td></tr>
    <tr><td>Cuenta (Cuenta Corriente)</td><td>${eur(inicial)}€</td><td>${eur(sal)}€</td><td>${eur(ent)}€</td><td>${eur(saldo)}€</td></tr></table>
    <p style="margin:30px 0 10px">Transacciones de la cuenta</p>
    <table><tr><td>Fecha de la transacción</td><td>Fecha valor</td><td>Descripción</td><td>Dinero saliente</td><td>Dinero entrante</td><td class="r">Saldo</td></tr>${filas}</table>
    <p style="margin-top:40px">Página 1 de 1</p></body></html>` };
}

module.exports = { htmlEvo, htmlRevolut };
