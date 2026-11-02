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

// ---- Formato tipo Trade Republic inventado: cada movimiento en tres líneas
// (día y mes arriba, tipo + importes en medio, año abajo); septiembre partido («02» / «sept»).
function htmlTradeRepublic() {
  const inicial = 400;
  const movs = [
    { d: '02', m: 'sept', partido: true, tipo: 'Operar', l1: 'Savings plan execution IE00B4ND3602 iShares Physical Gold ETC, quantity:', l3: '1.5', i: -150 },
    { d: '05', m: 'oct', tipo: 'Transferencia', medio: 'Incoming transfer from PERSONA INVENTADA EJEMPLO (ES0012345678901234567890)', i: 500 },
    { d: '10', m: 'oct', tipo: 'Operar', l1: 'Buy trade IE00B4L5Y983 iShares Core MSCI World, quantity: 2', i: -200 },
    { d: '12', m: 'oct', tipo: 'Operar', l1: 'Sell trade IE000KHX9DX6 Fondo Inventado de Metales', l3: 'UCITS ETF - USD Acc, quantity: 1.41526', i: 70.12 },
    { d: '20', m: 'oct', tipo: 'Transferencia', medio: 'Incoming transfer from OTRA GENTE DISTINTA (ES9912345678901234567890)', i: 30 },
  ];
  let saldo = inicial, ent = 0, sal = 0, top = 0;
  const s = (x, y, t) => `<span style="position:absolute;left:${x}px;top:${y}px">${t}</span>`;
  let h = s(0, 0, 'TRADE REPUBLIC BANK GMBH BRUNNENSTRASSE 19-21 10119 BERLIN')
    + s(0, 30, 'PERSONA INVENTADA EJEMPLO') + s(350, 30, 'FECHA') + s(400, 30, '01 sept 2026 - 01 nov 2026')
    + s(0, 70, 'RESUMEN DE ESTADO DE CUENTA');
  const filas = [];
  top = 200;
  for (const m of movs) {
    saldo = Math.round((saldo + m.i) * 100) / 100; if (m.i > 0) ent += m.i; else sal -= m.i;
    const imp = `${eurTR(Math.abs(m.i))} €`;
    filas.push(s(0, top, m.partido ? m.d : `${m.d} ${m.m}`) + (m.l1 ? s(110, top, m.l1) : '')
      + (m.partido ? s(0, top + 9, m.m) : '') + s(40, top + 9, m.tipo) + (m.medio ? s(110, top + 9, m.medio) : '')
      + s(m.i > 0 ? 470 : 540, top + 9, imp) + s(610, top + 9, `${eurTR(saldo)} €`)
      + s(0, top + 18, '2026') + (m.l3 ? s(110, top + 18, m.l3) : ''));
    top += 50;
  }
  h += s(0, 100, 'PRODUCTO') + s(120, 100, 'BALANCE INICIAL') + s(250, 100, 'ENTRADA DE DINERO') + s(380, 100, 'SALIDA DE DINERO') + s(520, 100, 'BALANCE FINAL')
    + s(0, 115, 'Cuenta corriente') + s(120, 115, `${eurTR(inicial)} €`) + s(250, 115, `${eurTR(ent)} €`) + s(380, 115, `${eurTR(sal)} €`) + s(520, 115, `${eurTR(saldo)} €`)
    + s(470, 160, 'ENTRADA DE') + s(540, 160, 'SALIDA DE') + s(0, 170, 'FECHA') + s(40, 170, 'TIPO') + s(110, 170, 'DESCRIPCIÓN') + s(610, 170, 'BALANCE')
    + s(470, 180, 'DINERO') + s(540, 180, 'DINERO') + filas.join('')
    + s(0, top + 30, 'RESUMEN DEL BALANCE') + s(0, top + 60, 'Trade Republic Bank GmbH www.traderepublic.com');
  return { n: movs.length, saldoFinal: saldo, html: `<html><head><style>body{font:8px Arial,sans-serif;position:relative;margin:0}span{white-space:nowrap}</style></head><body><div style="position:relative;height:${top + 100}px">${h}</div></body></html>` };
}
const eurTR = n => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' });
module.exports.htmlTradeRepublic = htmlTradeRepublic;

// ---- Excel antiguo (.xls, BIFF8 dentro de OLE2) inventado, con la cabecera de una exportación del Santander ----
function xlsSantander() {
  const filas = [[null, null, 'CUENTA ONLINE SANTANDER', 'FECHA'], [null, null, 'ES0000490000000000001234', '02/11/2026 | 10:00:00'], [null, null, 'Titular', 'Saldo'],
    [null, null, 'PERSONA INVENTADA', '1.390,00 EUR'], [], ['Movimientos'], [], ['FECHA OPERACIÓN', 'FECHA VALOR', 'CONCEPTO', 'IMPORTE EUR', 'SALDO'],
    ['20/10/2026', '20/10/2026', 'Compra Zara, Valencia, Tarj. :*0000', -57, 1390], ['15/10/2026', '15/10/2026', 'Transferencia De Empresa Inventada, Concepto Nomina', 500, 1447],
    ['02/10/2026', '02/10/2026', 'Bizum A Favor De Persona Inventada', -3, 947], ['01/10/2026', '01/10/2026', 'Compra Lidl, Valencia, Tarj. :*0000', -50, 950]];
  const rec = (t, d) => { const b = Buffer.alloc(4 + d.length); b.writeUInt16LE(t, 0); b.writeUInt16LE(d.length, 2); d.copy(b, 4); return b; };
  const bof = dt => { const d = Buffer.alloc(16); d.writeUInt16LE(0x0600, 0); d.writeUInt16LE(dt, 2); d.writeUInt16LE(0x0DBB, 4); d.writeUInt16LE(0x07CC, 6); return rec(0x0809, d); };
  const eof = () => rec(0x000A, Buffer.alloc(0));
  const textos = []; const idx = t => { let i = textos.indexOf(t); if (i < 0) { textos.push(t); i = textos.length - 1; } return i; };
  const celdas = [];
  filas.forEach((f, r) => f.forEach((v, c) => { if (v == null || v === '') return;
    if (typeof v === 'number') { const d = Buffer.alloc(14); d.writeUInt16LE(r, 0); d.writeUInt16LE(c, 2); d.writeDoubleLE(v, 6); celdas.push(rec(0x0203, d)); }
    else { const d = Buffer.alloc(10); d.writeUInt16LE(r, 0); d.writeUInt16LE(c, 2); d.writeUInt32LE(idx(v), 6); celdas.push(rec(0x00FD, d)); } }));
  const sst = Buffer.concat([(() => { const h = Buffer.alloc(8); h.writeUInt32LE(textos.length, 0); h.writeUInt32LE(textos.length, 4); return h; })(),
    ...textos.map(t => { const s = Buffer.from(t, 'latin1'); const h = Buffer.alloc(3); h.writeUInt16LE(s.length, 0); return Buffer.concat([h, s]); })]);
  const nombre = Buffer.from('Movimientos', 'latin1');
  const bsData = off => { const d = Buffer.alloc(8 + nombre.length); d.writeUInt32LE(off, 0); d[6] = nombre.length; nombre.copy(d, 8); return rec(0x0085, d); };
  const globalesSin = [bof(5), bsData(0), rec(0x00FC, sst), eof()];
  const off = Buffer.concat(globalesSin).length;
  let wb = Buffer.concat([bof(5), bsData(off), rec(0x00FC, sst), eof(), bof(0x10), ...celdas, eof()]);
  while (wb.length < 4200) wb = Buffer.concat([wb, rec(0x00EF, Buffer.alloc(Math.min(1000, 4200 - wb.length)))]); // relleno: registros que no se usan
  const ns = Math.ceil(wb.length / 512), datos = Buffer.alloc(ns * 512); wb.copy(datos);
  const cab = Buffer.alloc(512, 0); Buffer.from('D0CF11E0A1B11AE1', 'hex').copy(cab, 0);
  cab.writeUInt16LE(0x3E, 24); cab.writeUInt16LE(3, 26); cab.writeUInt16LE(0xFFFE, 28); cab.writeUInt16LE(9, 30); cab.writeUInt16LE(6, 32);
  cab.writeUInt32LE(1, 44); cab.writeUInt32LE(1, 48); cab.writeUInt32LE(4096, 56); cab.writeInt32LE(-2, 60); cab.writeInt32LE(-2, 68);
  cab.writeUInt32LE(0, 76); for (let i = 1; i < 109; i++) cab.writeInt32LE(-1, 76 + i * 4);
  const fat = Buffer.alloc(512); for (let i = 0; i < 128; i++) fat.writeInt32LE(-1, i * 4);
  fat.writeInt32LE(-3, 0); fat.writeInt32LE(-2, 4); for (let i = 0; i < ns; i++) fat.writeInt32LE(i === ns - 1 ? -2 : 3 + i, (2 + i) * 4);
  const dir = Buffer.alloc(512);
  const ent = (k, nom, tipo, ini, tam, hijo) => { const o = k * 128; Buffer.from(nom + '\0', 'utf16le').copy(dir, o); dir.writeUInt16LE((nom.length + 1) * 2, o + 64); dir[o + 66] = tipo; dir[o + 67] = 1;
    dir.writeInt32LE(-1, o + 68); dir.writeInt32LE(-1, o + 72); dir.writeInt32LE(hijo, o + 76); dir.writeInt32LE(ini, o + 116); dir.writeUInt32LE(tam, o + 120); };
  ent(0, 'Root Entry', 5, -2, 0, 1); ent(1, 'Workbook', 2, 2, wb.length, -1);
  return { buffer: Buffer.concat([cab, fat, dir, datos]), n: 4, saldoFinal: 1390 };
}
module.exports.xlsSantander = xlsSantander;

// ---- Extracto del patrimonio neto tipo Trade Republic inventado (sin movimientos: cartera y efectivo)
function htmlPatrimonioTR(fecha = '15.10.2026') {
  const pos = [
    { u: '12,5', n: 'Fondo Inventado Mundial USD (Acc)', p: '100,00', v: 1250, isin: 'IE0000000001', partido: true },
    { u: '0,25', n: 'Empresa Ficticia Inc.', p: '400,00', v: 100, isin: 'US0000000002' },
    { u: '30', n: 'Oro Imaginario USD (Acc)', p: '50,10', v: 1503, isin: 'IE0000000003' },
  ];
  const valores = pos.reduce((a, x) => a + x.v, 0), efectivo = 87.65;
  const s = (x, y, t) => `<span style="position:absolute;left:${x}px;top:${y}px">${t}</span>`;
  let h = s(0, 0, 'TRADE REPUBLIC BANK GMBH BRUNNENSTRASSE 19-21 10119 BERLIN') + s(0, 30, 'PERSONA INVENTADA EJEMPLO') + s(400, 30, 'FECHA ' + fecha)
    + s(0, 60, 'EXTRACTO DEL PATRIMONIO NETO') + s(0, 72, 'a ' + fecha)
    + s(0, 100, 'CARTERA') + s(500, 100, 'VALOR EN EUR')
    + s(0, 115, 'Cuenta de valores') + s(500, 115, eurTR(valores)) + s(0, 130, 'Efectivo') + s(500, 130, eurTR(efectivo))
    + s(0, 145, 'TOTAL') + s(500, 145, eurTR(valores + efectivo) + ' EUR')
    + s(0, 180, 'UNIDADES / NOMINAL') + s(100, 180, 'NOMBRE DEL VALOR') + s(380, 180, 'PRECIO POR UNIDAD') + s(500, 180, 'VALOR EN EUR');
  let top = 200;
  for (const x of pos) {
    h += s(0, top, x.u + (x.partido ? '' : ' unidades')) + s(100, top, x.n) + s(380, top, x.p) + s(500, top, eurTR(x.v))
      + (x.partido ? s(0, top + 12, 'unidades') : '') + s(100, top + 12, 'ISIN: ' + x.isin) + s(380, top + 12, fecha);
    top += 40;
  }
  h += s(0, top, 'NÚMERO DE POSICIONES: ' + pos.length) + s(500, top, eurTR(valores) + ' EUR')
    + s(0, top + 30, 'EFECTIVO') + s(0, top + 45, 'Cuenta corriente') + s(500, top + 45, eurTR(efectivo) + ' EUR');
  return { valores, efectivo, n: pos.length, html: `<html><head><style>body{font:8px Arial,sans-serif;margin:0}span{white-space:nowrap}</style></head><body><div style="position:relative;height:${top + 100}px">${h}</div></body></html>` };
}
module.exports.htmlPatrimonioTR = htmlPatrimonioTR;
