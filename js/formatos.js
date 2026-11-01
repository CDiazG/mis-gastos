// Cuentas Claras · Lectura de movimientos en Norma 43 (CSB43), CSV y Excel (.xlsx y .xls en HTML)
"use strict";
/* ============ Formatos de extracto ============ */
// Todos devuelven lo mismo que parseStatement (pdf.js): {banco, movs:[{fecha,concepto,detalle,importe,saldo}], saldoIni, saldoFin, finCalc, cuadra, malos}

const ENTIDADES={'0049':'Santander','0182':'BBVA','2100':'CaixaBank','0081':'Sabadell','0128':'Bankinter','0239':'EVO','1465':'ING','0073':'Openbank','2103':'Unicaja','2085':'Ibercaja','0487':'Banco Mare Nostrum','3058':'Cajamar','2080':'Abanca','0030':'Santander','0075':'Santander','0019':'Deutsche Bank','1583':'Revolut','1491':'Triodos','0186':'Mediolanum','2095':'Kutxabank','3025':'Caixa d\'Enginyers','0216':'Targobank','0131':'Novo Banco'};
const CONCEPTO43={'01':'Talón','02':'Abonaré','03':'Recibo domiciliado','04':'Transferencia','05':'Préstamo','06':'Remesa de efectos','07':'Suscripciones','08':'Dividendos','09':'Bolsa','10':'Gasolina','11':'Retirada en cajero','12':'Pago con tarjeta','13':'Operación en el extranjero','14':'Devolución','15':'Nómina','16':'Timbres','17':'Intereses y comisiones','98':'Anulación','99':'Varios'};

function resumenCuadre(movs,saldoIni,saldoFin,banco){
  const sum=r2(movs.reduce((a,m)=>a+m.importe,0));
  const finCalc=saldoIni!=null?r2(saldoIni+sum):null;
  const fin=saldoFin!=null?saldoFin:(movs.length&&movs[movs.length-1].saldo!=null?movs[movs.length-1].saldo:null);
  return {banco,movs,saldoIni,saldoFin:fin,finCalc,cuadra:finCalc!=null&&fin!=null?Math.abs(finCalc-fin)<0.011:null,malos:movs.filter(m=>m.chk===false).length};
}

/* ---- Norma 43 (cuaderno 43 de la AEB) ---- */
function esNorma43(txt){const ls=txt.split(/\r?\n/).filter(l=>l.trim());return ls.length>=2&&/^11\d{18}/.test(ls[0])&&ls.some(l=>/^22/.test(l))}
function parseNorma43(txt){
  const cuentas=[];let c=null,ult=null;
  const fecha=s=>`20${s.slice(0,2)}-${s.slice(2,4)}-${s.slice(4,6)}`;
  const imp=s=>parseInt(s,10)/100;
  for(const l0 of txt.split(/\r?\n/)){
    const l=l0.padEnd(80,' ');const t=l.slice(0,2);
    if(t==='11'){c={entidad:l.slice(2,6),cuenta:l.slice(10,20),saldoIni:(l[32]==='1'?-1:1)*imp(l.slice(33,47)),movs:[],saldoFin:null};cuentas.push(c);ult=null}
    else if(t==='22'&&c){
      const comun=l.slice(22,24),signo=l[27]==='1'?-1:1;
      ult={fecha:fecha(l.slice(10,16)),concepto:'',detalle:'',importe:r2(signo*imp(l.slice(28,42))),saldo:null,comun,ref:l.slice(64,80).trim()};
      c.movs.push(ult);
    }else if(t==='23'&&ult){
      const txt23=(l.slice(4,42)+' '+l.slice(42,80)).replace(/\s+/g,' ').trim();
      if(txt23)ult.concepto=(ult.concepto?ult.concepto+' ':'')+txt23;
    }else if(t==='33'&&c){c.saldoFin=(l[58]==='1'?-1:1)*imp(l.slice(59,73))}
  }
  return cuentas.map(c=>{
    let saldo=c.saldoIni;
    for(const m of c.movs){
      saldo=r2(saldo+m.importe);m.saldo=saldo;
      const base=CONCEPTO43[m.comun]||'';
      if(!m.concepto)m.concepto=(base+' '+m.ref).trim()||'(sin concepto)';
      // pistas para las reglas automáticas
      if(m.comun==='11'&&!/CAJERO/i.test(m.concepto))m.detalle='Retirada en cajero';
      if(m.comun==='15'&&m.importe>0&&!/NOMIN/i.test(m.concepto))m.detalle='Nómina';
      delete m.comun;delete m.ref;
    }
    const r=resumenCuadre(c.movs,r2(c.saldoIni),c.saldoFin!=null?r2(c.saldoFin):null,ENTIDADES[c.entidad]||'');
    r.cuentaTxt='…'+c.cuenta.slice(-4);return r;
  });
}

/* ---- Tablas (CSV, Excel, HTML) ---- */
function parseCSV(txt){
  txt=txt.replace(/^﻿/,'');
  const muestra=txt.split(/\r?\n/).slice(0,40).join('\n');
  const delim=[';','\t',',','|'].map(d=>[d,(muestra.match(new RegExp(d==='|'?'\\|':d,'g'))||[]).length]).sort((a,b)=>b[1]-a[1])[0][0];
  const filas=[];let fila=[],campo='',q=false;
  for(let i=0;i<txt.length;i++){const ch=txt[i];
    if(q){if(ch==='"'){if(txt[i+1]==='"'){campo+='"';i++}else q=false}else campo+=ch;continue}
    if(ch==='"'){q=true;continue}
    if(ch===delim){fila.push(campo);campo='';continue}
    if(ch==='\n'||ch==='\r'){if(ch==='\r'&&txt[i+1]==='\n')i++;fila.push(campo);filas.push(fila);fila=[];campo='';continue}
    campo+=ch;
  }
  if(campo||fila.length){fila.push(campo);filas.push(fila)}
  return filas.map(f=>f.map(x=>x.trim())).filter(f=>f.some(x=>x));
}
async function inflar(datos){const ds=new DecompressionStream('deflate-raw');const s=new Blob([datos]).stream().pipeThrough(ds);return new Uint8Array(await new Response(s).arrayBuffer())}
async function unzip(buf){
  const dv=new DataView(buf.buffer,buf.byteOffset,buf.byteLength);let e=buf.length-22;
  while(e>=0&&dv.getUint32(e,true)!==0x06054b50)e--;
  if(e<0)throw new Error('el archivo no es un Excel válido');
  const n=dv.getUint16(e+10,true);let p=dv.getUint32(e+16,true);const out={};const dec=new TextDecoder();
  for(let i=0;i<n;i++){
    const metodo=dv.getUint16(p+10,true),csize=dv.getUint32(p+20,true),nl=dv.getUint16(p+28,true),xl=dv.getUint16(p+30,true),cl=dv.getUint16(p+32,true),off=dv.getUint32(p+42,true);
    const nombre=dec.decode(buf.subarray(p+46,p+46+nl));
    const lnl=dv.getUint16(off+26,true),lxl=dv.getUint16(off+28,true);const ini=off+30+lnl+lxl;
    out[nombre]={metodo,datos:buf.subarray(ini,ini+csize)};p+=46+nl+xl+cl;
  }
  return async nombre=>{const f=out[nombre];if(!f)return null;const d=f.metodo===0?f.datos:await inflar(f.datos);return dec.decode(d)};
}
async function parseXLSX(buf){
  const leer=await unzip(buf);const dp=new DOMParser();
  const ss=[];const sst=await leer('xl/sharedStrings.xml');
  if(sst){const d=dp.parseFromString(sst,'application/xml');for(const si of d.getElementsByTagName('si'))ss.push([...si.getElementsByTagName('t')].map(t=>t.textContent).join(''))}
  // primera hoja del libro
  let ruta='xl/worksheets/sheet1.xml';
  const wb=await leer('xl/workbook.xml'),rels=await leer('xl/_rels/workbook.xml.rels');
  if(wb&&rels){const d=dp.parseFromString(wb,'application/xml');const sh=d.getElementsByTagName('sheet')[0];
    const rid=sh&&(sh.getAttribute('r:id')||sh.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id'));
    const r=dp.parseFromString(rels,'application/xml');for(const x of r.getElementsByTagName('Relationship'))if(x.getAttribute('Id')===rid){const t=x.getAttribute('Target');ruta=t.startsWith('/')?t.slice(1):'xl/'+t.replace(/^\.\//,'')}}
  const hoja=await leer(ruta);if(!hoja)throw new Error('no encuentro la hoja de cálculo');
  const d=dp.parseFromString(hoja,'application/xml');const filas=[];
  const col=ref=>{let n=0;for(const ch of ref.replace(/\d+/g,''))n=n*26+ch.charCodeAt(0)-64;return n-1};
  for(const row of d.getElementsByTagName('row')){const f=[];
    for(const c of row.getElementsByTagName('c')){const t=c.getAttribute('t');const v=c.getElementsByTagName('v')[0];let val='';
      if(t==='s')val=ss[+(v&&v.textContent)]||'';else if(t==='inlineStr')val=[...c.getElementsByTagName('t')].map(x=>x.textContent).join('');else val=v?v.textContent:'';
      f[col(c.getAttribute('r')||'A1')]=val}
    filas.push([...f].map(x=>(x==null?'':String(x)).trim()))}
  return filas.filter(f=>f.some(x=>x));
}
function parseHTMLTabla(txt){
  const d=new DOMParser().parseFromString(txt,'text/html');const tablas=[...d.querySelectorAll('table')];
  if(!tablas.length)return [];
  const t=tablas.sort((a,b)=>b.rows.length-a.rows.length)[0];
  return [...t.rows].map(r=>[...r.cells].map(c=>c.textContent.replace(/\s+/g,' ').trim())).filter(f=>f.some(x=>x));
}

// Números «1.234,56», «-1234.56», «12,30 €», «(12,30)»
function numFlexible(s){
  if(s==null)return NaN;s=String(s).trim();if(!s)return NaN;
  let neg=/^\(.*\)$/.test(s)||/^[-−]/.test(s)||/-$/.test(s);
  s=s.replace(/[()€\s]|EUR/gi,'').replace(/^[-−+]|-$/g,'');
  if(!/\d/.test(s)||/[^\d.,]/.test(s))return NaN;
  const ic=s.lastIndexOf(','),ip=s.lastIndexOf('.');
  if(ic>=0&&ip>=0)s=ic>ip?s.replace(/\./g,'').replace(',','.'):s.replace(/,/g,'');
  else if(ic>=0)s=(s.length-ic-1<=2)?s.replace(',','.'):s.replace(/,/g,'');
  else if(ip>=0&&s.length-ip-1===3)s=s.replace(/\./g,''); // «1.234» = mil doscientos treinta y cuatro
  const v=parseFloat(s);return isFinite(v)?(neg?-v:v):NaN;
}
// Fechas «31/10/2026», «31-10-26», «2026-10-31», o número de serie de Excel
function fechaFlexible(s){
  s=String(s||'').trim();let m;
  if((m=s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/))){let y=+m[3];if(y<100)y+=2000;return `${y}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`}
  if((m=s.match(/^(\d{4})[\/.\-](\d{1,2})[\/.\-](\d{1,2})/)))return `${m[1]}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`;
  if(/^\d{5}(\.\d+)?$/.test(s)){const n=+s;if(n>30000&&n<80000){const d=new Date(Date.UTC(1899,11,30)+Math.floor(n)*864e5);return d.toISOString().slice(0,10)}}
  return null;
}
const COLS={fecha:/^(FECHA( DE)?( LA)?( OPERACION| TRANSACCION| CONTABLE| MOVIMIENTO)?|F OPERACION|F CONTABLE|DATE|FECHA OPER)$/,valor:/VALOR/,
  concepto:/^(CONCEPTO|DESCRIPCION|DESCRIPCION DEL MOVIMIENTO|MOVIMIENTO|DETALLE|CONCEPTO COMUN|OBSERVACIONES|DESCRIPTION|BENEFICIARIO|COMERCIO)/,
  importe:/^(IMPORTE|CANTIDAD|IMPORTE EUR|IMPORTE \(EUR\)|IMPORTE EN EUROS|AMOUNT|MONTO)/,cargo:/^(CARGO|CARGOS|DEBE|SALIDA|DINERO SALIENTE|GASTOS?)$/,abono:/^(ABONO|ABONOS|HABER|ENTRADA|DINERO ENTRANTE|INGRESOS?)$/,saldo:/^(SALDO|SALDO DISPONIBLE|BALANCE)/};
function detectarColumnas(filas){
  for(let i=0;i<Math.min(filas.length,40);i++){
    const h=filas[i].map(x=>norm(x).trim());const m={};
    h.forEach((x,j)=>{if(!x)return;
      if(m.fecha==null&&COLS.fecha.test(x)&&!COLS.valor.test(x))m.fecha=j;
      else if(m.concepto==null&&COLS.concepto.test(x))m.concepto=j;
      else if(m.importe==null&&COLS.importe.test(x))m.importe=j;
      else if(m.cargo==null&&COLS.cargo.test(x))m.cargo=j;
      else if(m.abono==null&&COLS.abono.test(x))m.abono=j;
      else if(m.saldo==null&&COLS.saldo.test(x))m.saldo=j;
      else if(m.detalle==null&&/CONCEPTO|DESCRIPCION|INFORMACION/.test(x)&&m.concepto!=null)m.detalle=j;});
    if(m.fecha==null){const k=h.findIndex(x=>/^FECHA/.test(x));if(k>=0)m.fecha=k}
    if(m.fecha!=null&&m.concepto!=null&&(m.importe!=null||m.cargo!=null||m.abono!=null))return {cab:i,...m};
  }
  return null;
}
function tablaAMovs(filas,map){
  const movs=[];
  for(const f of filas.slice(map.cab+1)){
    const fecha=fechaFlexible(f[map.fecha]);if(!fecha)continue;
    let imp;
    if(map.importe!=null)imp=numFlexible(f[map.importe]);
    else{const c=numFlexible(f[map.cargo]),a=numFlexible(f[map.abono]);imp=(isFinite(a)?Math.abs(a):0)-(isFinite(c)?Math.abs(c):0);if(!isFinite(c)&&!isFinite(a))imp=NaN}
    if(!isFinite(imp)||imp===0)continue;
    const saldo=map.saldo!=null?numFlexible(f[map.saldo]):NaN;
    movs.push({fecha,concepto:(f[map.concepto]||'').trim()||'(sin concepto)',detalle:map.detalle!=null?(f[map.detalle]||'').trim():'',importe:r2(imp),saldo:isFinite(saldo)?r2(saldo):null});
  }
  // los bancos suelen poner lo más reciente arriba: ordenar de más antiguo a más nuevo
  if(movs.length>1&&movs[0].fecha>movs[movs.length-1].fecha)movs.reverse();
  let saldoIni=null,prev=null,malos=0;
  if(movs.length&&movs[0].saldo!=null){saldoIni=r2(movs[0].saldo-movs[0].importe);prev=saldoIni;
    for(const m of movs){if(m.saldo==null)continue;m.chk=Math.abs(r2(prev+m.importe)-m.saldo)<0.011;if(!m.chk)malos++;prev=m.saldo}}
  const r=resumenCuadre(movs,saldoIni,null,'');r.malos=malos;
  return r;
}
// Pide al usuario qué columna es cada cosa cuando no se reconocen solas
function pedirColumnas(filas,nombre){
  return new Promise(res=>{
    const ancho=Math.max(...filas.slice(0,30).map(f=>f.length));
    const opts=sel=>`<option value="">—</option>`+[...Array(ancho).keys()].map(j=>`<option value="${j}"${j===sel?' selected':''}>Columna ${j+1}: ${esc((filas.find(f=>f[j])||[])[j]||'').slice(0,24)}</option>`).join('');
    const vista=filas.slice(0,6).map(f=>`<tr>${f.map(x=>`<td style="white-space:nowrap">${esc(String(x).slice(0,20))}</td>`).join('')}</tr>`).join('');
    dialog('¿Qué es cada columna?',`<p class="small mut" style="margin-top:0">No reconozco las columnas de <b>${esc(nombre)}</b>. Indica cuál es cada una (solo hace falta una vez por banco).</p>
      <div class="tablewrap" style="max-height:150px;border:1px solid var(--line);border-radius:8px;margin-bottom:10px"><table class="small">${vista}</table></div>
      <div class="formgrid"><label>Fecha</label><select id="mcF">${opts()}</select><label>Concepto</label><select id="mcC">${opts()}</select>
      <label>Importe (con signo)</label><select id="mcI">${opts()}</select><label>o Cargo</label><select id="mcG">${opts()}</select><label>y Abono</label><select id="mcA">${opts()}</select><label>Saldo (opcional)</label><select id="mcS">${opts()}</select>
      <label>Los datos empiezan en la fila</label><input type="number" id="mcR" min="1" value="2" style="width:80px"></div>`,
      [{t:'Cancelar',fn:()=>res(null)},{t:'Leer',cls:'pri',fn:()=>{const v=id=>$(id).value===''?null:+$(id).value;
        const m={cab:Math.max(0,(+$('#mcR').value||2)-2),fecha:v('#mcF'),concepto:v('#mcC'),importe:v('#mcI'),cargo:v('#mcG'),abono:v('#mcA'),saldo:v('#mcS')};
        if(m.fecha==null||m.concepto==null||(m.importe==null&&m.cargo==null&&m.abono==null)){toast('Faltan la fecha, el concepto o el importe',true);return false}
        res(m)}}]);
  });
}
const firmaCab=f=>norm(f.join('|')).trim().slice(0,120);
async function leerTabla(filas,nombre){
  let map=detectarColumnas(filas);
  if(!map){
    const guardado=(S.mapeos||[]).find(x=>filas.slice(0,40).some((f,i)=>firmaCab(f)===x.firma&&(x.cab=i,true)));
    if(guardado)map={...guardado.map,cab:guardado.cab};
    else{map=await pedirColumnas(filas,nombre);if(!map)return null;
      const cab=filas[map.cab];if(cab){(S.mapeos||(S.mapeos=[])).push({firma:firmaCab(cab),map});save()}}
  }
  return tablaAMovs(filas,map);
}

// Lee cualquier archivo de extracto y devuelve una lista de resultados (uno por cuenta)
async function leerExtracto(f){
  const nombre=f.name,ext=(nombre.split('.').pop()||'').toLowerCase();
  const buf=new Uint8Array(await f.arrayBuffer());
  const ini=new TextDecoder('latin1').decode(buf.subarray(0,512));
  if(ext==='pdf'||ini.startsWith('%PDF'))return [parseStatement(await pdfLines(buf))];
  if(buf[0]===0x50&&buf[1]===0x4B){const r=await leerTabla(await parseXLSX(buf),nombre);return r?[r]:[]}
  if(buf[0]===0xD0&&buf[1]===0xCF)throw new Error('es un Excel antiguo (.xls). Ábrelo y guárdalo como .xlsx o CSV, o descarga el extracto en Norma 43');
  let txt=new TextDecoder('utf-8').decode(buf);if(txt.includes('�'))txt=new TextDecoder('latin1').decode(buf);
  if(esNorma43(txt))return parseNorma43(txt);
  if(/^\s*</.test(txt)&&/<table/i.test(txt)){const r=await leerTabla(parseHTMLTabla(txt),nombre);return r?[r]:[]}
  const r=await leerTabla(parseCSV(txt),nombre);return r?[r]:[];
}
