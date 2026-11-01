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

// ---- Norma 43 inventado ----
function norma43() {
  const pad = (s, n, c = ' ', izq = false) => { s = String(s); return izq ? s.padStart(n, c) : s.padEnd(n, c); };
  const imp = v => pad(Math.round(Math.abs(v) * 100), 14, '0', true);
  const ini = 1000;
  const movs = [
    ['261003', '12', -25.5, 'COMPRA TARJ MERCADONA VALENCIA'],
    ['261005', '15', 2100, 'NOMINA EMPRESA INVENTADA SL'],
    ['261010', '11', -50, ''],
    ['261012', '03', -40.25, 'RECIBO IBERDROLA CLIENTES'],
  ];
  const l = [];
  l.push(pad('11' + '0049' + '1234' + '0000123456' + '261001' + '261031' + '2' + imp(ini) + '978' + '3' + pad('TITULAR INVENTADO', 26), 80));
  let saldo = ini, nd = 0, td = 0, nh = 0, th = 0;
  for (const [f, c, v, t] of movs) {
    saldo = Math.round((saldo + v) * 100) / 100; if (v < 0) { nd++; td += -v; } else { nh++; th += v; }
    l.push(pad('22' + '    ' + '1234' + f + f + c + '000' + (v < 0 ? '1' : '2') + imp(v) + pad('', 10, '0') + pad('', 12, '0') + pad('REF' + f, 16), 80));
    if (t) l.push(pad('23' + '01' + pad(t, 38) + pad('', 38), 80));
  }
  l.push(pad('33' + '0049' + '1234' + '0000123456' + pad(nd, 5, '0', true) + imp(td) + pad(nh, 5, '0', true) + imp(th) + '2' + imp(saldo) + '978', 80));
  l.push(pad('88' + pad('', 18, '9') + pad(l.length, 6, '0', true), 80));
  return { texto: l.join('\r\n') + '\r\n', saldoFinal: saldo, n: movs.length };
}

// ---- CSV inventado: lo más reciente arriba, números en formato español ----
function csv() {
  return { texto: 'Movimientos de la cuenta;;;;\nTitular: Persona Inventada;;;;\n;;;;\nFecha;Fecha valor;Concepto;Importe;Saldo\n' +
    '20/10/2026;20/10/2026;"PAGO EN ZARA, VALENCIA";-57,00;1.390,00\n' +
    '15/10/2026;15/10/2026;TRANSFERENCIA RECIBIDA;500,00;1.447,00\n' +
    '02/10/2026;02/10/2026;PARKING DEL PUERTO;-3,00;947,00\n' +
    '01/10/2026;01/10/2026;COMPRA EN LIDL;-50,00;950,00\n', n: 4, saldoFinal: 1390 };
}

// ---- Excel (.xlsx comprimido) inventado, con Cargo y Abono separados y fechas como número ----
function xlsx() {
  const zlib = require('zlib');
  const CRC = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = b => { let c = 0xFFFFFFFF; for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const ss = ['Fecha', 'Concepto', 'Cargo', 'Abono', 'Saldo', 'MERCADONA', 'BIZUM RECIBIDO', 'GASOLINERA REPSOL'];
  const fila = (r, celdas) => `<row r="${r}">${celdas.map(([ref, v, t]) => t === 's' ? `<c r="${ref}${r}" t="s"><v>${ss.indexOf(v)}</v></c>` : `<c r="${ref}${r}"><v>${v}</v></c>`).join('')}</row>`;
  const serie = d => Math.round((Date.UTC(...d) - Date.UTC(1899, 11, 30)) / 864e5);
  const hoja = `<?xml version="1.0"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>` +
    fila(1, [['A', 'Fecha', 's'], ['B', 'Concepto', 's'], ['C', 'Cargo', 's'], ['D', 'Abono', 's'], ['E', 'Saldo', 's']]) +
    fila(2, [['A', serie([2026, 9, 3])], ['B', 'MERCADONA', 's'], ['C', 30.5], ['E', 969.5]]) +
    fila(3, [['A', serie([2026, 9, 9])], ['B', 'BIZUM RECIBIDO', 's'], ['D', 15], ['E', 984.5]]) +
    fila(4, [['A', serie([2026, 9, 12])], ['B', 'GASOLINERA REPSOL', 's'], ['C', 60], ['E', 924.5]]) + `</sheetData></worksheet>`;
  const archivos = {
    '[Content_Types].xml': '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>',
    'xl/workbook.xml': '<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Movimientos" sheetId="1" r:id="rId1"/></sheets></workbook>',
    'xl/_rels/workbook.xml.rels': '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
    'xl/sharedStrings.xml': `<?xml version="1.0"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${ss.map(s => `<si><t>${s}</t></si>`).join('')}</sst>`,
    'xl/worksheets/sheet1.xml': hoja,
  };
  const partes = [], central = []; let off = 0;
  for (const [nombre, txt] of Object.entries(archivos)) {
    const n = Buffer.from(nombre), d = Buffer.from(txt), z = zlib.deflateRawSync(d), c = crc32(d);
    const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(8, 8); h.writeUInt32LE(c, 14); h.writeUInt32LE(z.length, 18); h.writeUInt32LE(d.length, 22); h.writeUInt16LE(n.length, 26);
    partes.push(h, n, z);
    const k = Buffer.alloc(46); k.writeUInt32LE(0x02014b50, 0); k.writeUInt16LE(20, 4); k.writeUInt16LE(20, 6); k.writeUInt16LE(8, 10); k.writeUInt32LE(c, 16); k.writeUInt32LE(z.length, 20); k.writeUInt32LE(d.length, 24); k.writeUInt16LE(n.length, 28); k.writeUInt32LE(off, 42);
    central.push(k, n); off += 30 + n.length + z.length;
  }
  const cz = Buffer.concat(central); const e = Buffer.alloc(22); e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(central.length / 2, 8); e.writeUInt16LE(central.length / 2, 10); e.writeUInt32LE(cz.length, 12); e.writeUInt32LE(off, 16);
  return { buffer: Buffer.concat([...partes, cz, e]), n: 3 };
}

module.exports.norma43 = norma43;
module.exports.csv = csv;
module.exports.xlsx = xlsx;
