// Cuentas Claras · Exportar a Excel (.xlsx) sin librerías externas
"use strict";
/* ============ Exportar a Excel (.xlsx) ============ */
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function crc32(u){let c=0xFFFFFFFF;for(let i=0;i<u.length;i++)c=CRC[(c^u[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0}
function zipStore(files){
  const enc=new TextEncoder();const parts=[];const central=[];let off=0;
  const d=new Date();const dt=((d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1)),dd=(((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate());
  for(const f of files){
    const name=enc.encode(f.name),data=typeof f.data==='string'?enc.encode(f.data):f.data,crc=crc32(data);
    const h=new DataView(new ArrayBuffer(30));
    h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(8,0,true);h.setUint16(10,dt,true);h.setUint16(12,dd,true);
    h.setUint32(14,crc,true);h.setUint32(18,data.length,true);h.setUint32(22,data.length,true);h.setUint16(26,name.length,true);h.setUint16(28,0,true);
    parts.push(new Uint8Array(h.buffer),name,data);
    const c=new DataView(new ArrayBuffer(46));
    c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint16(10,0,true);c.setUint16(12,dt,true);c.setUint16(14,dd,true);
    c.setUint32(16,crc,true);c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);c.setUint16(28,name.length,true);c.setUint32(42,off,true);
    central.push(new Uint8Array(c.buffer),name);
    off+=30+name.length+data.length;
  }
  const csize=central.reduce((a,u)=>a+u.length,0);
  const e=new DataView(new ArrayBuffer(22));e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,csize,true);e.setUint32(16,off,true);
  return new Blob([...parts,...central,new Uint8Array(e.buffer)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
const xesc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'');
function colL(i){let s='';i++;while(i>0){const m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=Math.floor((i-1)/26)}return s}
const dSerial=f=>{const [y,m,d]=f.split('-').map(Number);return (Date.UTC(y,m-1,d)-Date.UTC(1899,11,30))/864e5};
// estilos: 0 normal, 1 cabecera, 2 fecha, 3 euros, 4 porcentaje, 5 euros negrita, 6 negrita
function sheetXml(rows,widths,{freeze=true,filter=true}={}){
  let x='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">';
  if(freeze)x+='<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>';
  x+='<cols>'+widths.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('')+'</cols><sheetData>';
  rows.forEach((r,ri)=>{x+=`<row r="${ri+1}">`;r.forEach((c,ci)=>{if(c==null||c==='')return;const ref=colL(ci)+(ri+1);
    let v=c,st=ri===0?1:0;if(typeof c==='object'){v=c.v;st=c.s??st}
    if(v==null||v==='')return;
    if(typeof v==='number')x+=`<c r="${ref}" s="${st}"><v>${v}</v></c>`;
    else x+=`<c r="${ref}" s="${st}" t="inlineStr"><is><t xml:space="preserve">${xesc(v)}</t></is></c>`});x+='</row>'});
  x+='</sheetData>';
  if(filter&&rows.length>1)x+=`<autoFilter ref="A1:${colL(rows[0].length-1)}${rows.length}"/>`;
  return x+'</worksheet>';
}
function buildXlsx(sheets){
  const files=[];
  files.push({name:'[Content_Types].xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+sheets.map((s,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')+'</Types>'});
  files.push({name:'_rels/.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'});
  files.push({name:'xl/workbook.xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+sheets.map((s,i)=>`<sheet name="${xesc(s.name.slice(0,31))}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')+'</sheets>'+(sheets.some(s=>s.filter!==false&&s.rows.length>1)?'<definedNames>'+sheets.map((s,i)=>s.filter!==false&&s.rows.length>1?`<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${xesc(s.name.slice(0,31)).replace(/'/g,"''")}'!$A$1:$${colL(s.rows[0].length-1)}$${s.rows.length}</definedName>`:'').join('')+'</definedNames>':'')+'</workbook>'});
  files.push({name:'xl/_rels/workbook.xml.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+sheets.map((s,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')+`<Relationship Id="rId${sheets.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`});
  files.push({name:'xl/styles.xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="2"><numFmt numFmtId="164" formatCode="#,##0.00\\ &quot;€&quot;"/><numFmt numFmtId="165" formatCode="dd/mm/yyyy"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE1F0EB"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="7"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="10" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="164" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>'});
  sheets.forEach((s,i)=>files.push({name:`xl/worksheets/sheet${i+1}.xml`,data:sheetXml(s.rows,s.widths,s)}));
  return zipStore(files);
}
const grupoN=id=>{const c=CATS.find(c=>c.id===id);return c?GROUPS.find(g=>g.id===c.g).n:(id?'No es gasto':'')};
function exportarExcel(alcance){
  let meses;const all=mesesConDatos();
  if(alcance==='mes')meses=[MES];else if(alcance==='todo')meses=all;else meses=all.filter(m=>m.startsWith(alcance));
  const set=new Set(meses);
  const movs=S.mov.filter(x=>set.has(x.mes)).sort((a,b)=>a.fecha.localeCompare(b.fecha)||(a.orden??0)-(b.orden??0));
  if(!movs.length){toast('No hay movimientos en ese periodo',true);return}
  const E=v=>({v:r2(v),s:3});
  const m1=[['Fecha','Mes','Concepto','Detalle del banco','Categoría','Grupo','Pagado con','Importe','Origen','Nota']];
  for(const x of movs)m1.push([{v:dSerial(x.fecha),s:2},x.mes,x.concepto,x.detalle||'',catN(x.cat),grupoN(x.cat),x.metodo==='efectivo'?'Efectivo':(x.cuenta||''),E(x.importe),{extracto:'Extracto',excel:'Excel antiguo',manual:'A mano'}[x.origen]||x.origen,x.nota||'']);
  const cc=[...CATS.filter(c=>c.g!=='AHORRO'),{id:'SINCAT',n:'Sin categorizar'}];
  const m2=[['Mes','Ingresos',...cc.map(c=>c.n),'Total gastado','Inversión','Diezmo','Ahorro del mes','% ahorro']];
  const mm=[...new Set(movs.map(x=>x.mes))].sort();
  for(const m of mm){const st=stats(m);const ah=st.ingresos-st.consumo-st.diezmo;
    m2.push([m,E(st.ingresos),...cc.map(c=>E(st.by[c.id]||0)),{v:st.consumo,s:5},E(st.ahorro),E(st.diezmo),E(ah),st.ingresos?{v:r2(ah/st.ingresos*10000)/10000,s:4}:''])}
  const sheets=[{name:'Movimientos',rows:m1,widths:[11,9,34,34,22,18,12,12,13,20]},{name:'Resumen mensual',rows:m2,widths:[10,12,...cc.map(()=>13),14,12,11,14,10]}];
  if(alcance==='mes'){
    const st=stats(MES);
    const m3=[['Categoría','Grupo','% objetivo','Presupuesto','Gastado','Diferencia']];
    for(const c of CATS){const p=st.base*(S.aj.pct[c.id]||0)/100,v=st.by[c.id]||0;m3.push([c.n,grupoN(c.id),{v:(+S.aj.pct[c.id]||0)/100,s:4},E(p),E(v),E(p-v)])}
    m3.push([{v:'Total',s:6},'','',{v:r2(st.base*CATS.reduce((a,c)=>a+(+S.aj.pct[c.id]||0),0)/100),s:5},{v:r2(CATS.reduce((a,c)=>a+(st.by[c.id]||0),0)),s:5},'']);
    sheets.unshift({name:'Presupuesto '+nombreMesC(MES),rows:m3,widths:[24,18,11,13,13,13],filter:false});
  }
  const nombre='Gastos '+(alcance==='mes'?nombreMes(MES):alcance==='todo'?'completo':alcance)+'.xlsx';
  const a=document.createElement('a');a.href=URL.createObjectURL(buildXlsx(sheets));a.download=nombre;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),3000);toast('Descargado: '+nombre);
}
/* ============ Informe para imprimir ============ */
function informeMes(m){
  const st=stats(m),ant=stats(addMes(m,-1)),libre=st.ingresos-st.consumo-st.diezmo;
  const filas=[...CATS.filter(c=>c.g!=='AHORRO'),{id:'SINCAT',n:'Sin categorizar'}].map(c=>{const p=st.base*(S.aj.pct[c.id]||0)/100,v=st.by[c.id]||0,d=v-(ant.by[c.id]||0);
    return (v||p)?`<tr><td>${esc(c.n)}</td><td class="r">${p?eur(p,0):'—'}</td><td class="r">${eur(v)}</td><td class="r ${p&&v>p+0.5?'neg':''}">${p?eur(p-v,0):''}</td><td class="r">${ant.ms.length&&Math.abs(d)>=1?(d>0?'+':'−')+eur(Math.abs(d),0):''}</td></tr>`:''}).join('');
  const items=[...CATS.filter(c=>c.g!=='AHORRO').map(c=>({n:c.n,id:c.id,v:st.by[c.id]||0})),{n:'Sin categorizar',id:'SINCAT',v:st.by.SINCAT||0}].filter(x=>x.v>0.5).sort((a,b)=>b.v-a.v);
  const top=st.ms.filter(x=>x.importe<0&&x.cat!=='TRASPASO'&&x.cat!=='EFECTIVO').sort((a,b)=>a.importe-b.importe).slice(0,10);
  const fx=fijosDelMes(m),ps=prestamosPorPersona().filter(p=>Math.abs(p.pendiente)>0.5),os=S.objetivos||[],dz=diezmoMes(m,st);
  return `<section><div class="kp"><div>Ingresos<b>${eur(st.ingresos)}</b></div><div>Gastado<b>${eur(st.consumo)}</b></div><div>Ahorro del mes<b>${eur(libre)}</b>${st.ingresos?Math.round(libre/st.ingresos*100)+'% de lo ingresado':''}</div>${st.ahorro?`<div>A inversión<b>${eur(st.ahorro)}</b></div>`:''}${st.diezmo||dz?`<div>Diezmo<b>${eur(st.diezmo)}</b>${dz&&dz.pendiente>0.5?'pendiente '+eur(dz.pendiente,0):''}</div>`:''}</div></section>
   <section><h2>Presupuesto por categoría</h2><table><thead><tr><th>Categoría</th><th class="r">Presupuesto</th><th class="r">Gastado</th><th class="r">Queda</th><th class="r">vs mes anterior</th></tr></thead><tbody>${filas}</tbody></table></section>
   ${items.length?`<section><h2>En qué se ha ido el dinero</h2>${barrasHtml(items)}</section>`:''}
   ${top.length?`<section><h2>Mayores gastos</h2><table><tbody>${top.map(x=>`<tr><td>${fFecha(x.fecha)}</td><td>${esc(x.concepto)}</td><td>${catN(x.cat)}</td><td class="r">${eur(-x.importe)}</td></tr>`).join('')}</tbody></table></section>`:''}
   ${fx.length?`<section><h2>Gastos fijos</h2><table><tbody>${fx.map(x=>`<tr><td>${esc(x.f.nombre)}</td><td>${{ok:'pagado',cambia:'ha cambiado',pendiente:'pendiente',falta:'no ha llegado'}[x.estado]}</td><td class="r">${eur(x.cands.length?x.pagado:x.f.importe)}</td></tr>`).join('')}</tbody></table></section>`:''}
   ${ps.length?`<section><h2>Préstamos pendientes</h2><table><tbody>${ps.map(p=>`<tr><td>${esc(p.persona)}</td><td class="r">${p.pendiente>0?'te debe ':'le debes '}${eur(Math.abs(p.pendiente))}</td></tr>`).join('')}</tbody></table></section>`:''}
   ${os.length?`<section><h2>Objetivos de ahorro</h2><table><tbody>${os.map(o=>{const i=infoObj(o);return `<tr><td>${esc(o.nombre)}</td><td class="r">${eur(i.ah,0)} de ${eur(o.meta,0)}</td><td class="r">${i.falta>0?'faltan '+eur(i.falta,0):'conseguido'}</td></tr>`}).join('')}</tbody></table></section>`:''}`;
}
function informeAnio(y){
  const ms=[];for(let k=1;k<=12;k++)ms.push(y+'-'+String(k).padStart(2,'0'));
  const sts=ms.map(m=>({m,...stats(m)})).filter(x=>x.ms.length);
  if(!sts.length)return '<p>No hay datos de ese año.</p>';
  const I=sts.reduce((a,x)=>a+x.ingresos,0),G=sts.reduce((a,x)=>a+x.consumo,0),D=sts.reduce((a,x)=>a+x.diezmo,0),A=sts.reduce((a,x)=>a+x.ahorro,0);
  const cats=[...CATS.filter(c=>c.g!=='AHORRO'),{id:'SINCAT',n:'Sin categorizar'}].map(c=>({n:c.n,id:c.id,v:sts.reduce((a,x)=>a+(x.by[c.id]||0),0)})).filter(x=>x.v>0.5).sort((a,b)=>b.v-a.v);
  return `<section><div class="kp"><div>Ingresos<b>${eur(I,0)}</b></div><div>Gastado<b>${eur(G,0)}</b>${eur(G/sts.length,0)} al mes</div><div>Ahorro<b>${eur(I-G-D,0)}</b>${I?Math.round((I-G-D)/I*100)+'% de lo ingresado':''}</div>${A?`<div>A inversión<b>${eur(A,0)}</b></div>`:''}${D?`<div>Diezmo<b>${eur(D,0)}</b></div>`:''}</div></section>
   <section><h2>Mes a mes</h2><table><thead><tr><th>Mes</th><th class="r">Ingresos</th><th class="r">Gastado</th><th class="r">Ahorro</th><th class="r">%</th></tr></thead><tbody>${sts.map(x=>{const l=x.ingresos-x.consumo-x.diezmo;return `<tr><td style="text-transform:capitalize">${nombreMes(x.m)}</td><td class="r">${eur(x.ingresos,0)}</td><td class="r">${eur(x.consumo,0)}</td><td class="r ${l<0?'neg':''}">${eur(l,0)}</td><td class="r">${x.ingresos?Math.round(l/x.ingresos*100)+'%':''}</td></tr>`}).join('')}</tbody></table></section>
   <section><h2>Gasto por categoría en el año</h2>${barrasHtml(cats)}<table style="margin-top:8pt"><tbody>${cats.map(c=>`<tr><td>${esc(c.n)}</td><td class="r">${eur(c.v,0)}</td><td class="r mut">${eur(c.v/sts.length,0)} al mes</td></tr>`).join('')}</tbody></table></section>`;
}
function imprimirInforme(tipo,val){
  const quien=NUBE&&USER?esc(USER.nombre)+' · ':'';
  $('#informe').innerHTML=`<h1>Cuentas Claras · ${tipo==='mes'?'Informe de '+nombreMes(val):'Informe del año '+val}</h1><p class="sub">${quien}generado el ${fFecha(hoy())}</p>`+(tipo==='mes'?informeMes(val):informeAnio(val));
  const limpiar=()=>{$('#informe').innerHTML='';window.removeEventListener('afterprint',limpiar)};
  window.addEventListener('afterprint',limpiar);
  setTimeout(()=>window.print(),50);
}
function dlgInforme(){
  const ys=[...new Set(mesesConDatos().map(m=>m.slice(0,4)))].reverse();
  dialog('Informe para imprimir',`<p class="small mut" style="margin-top:0">Se abre la ventana de impresión. Para guardarlo como PDF, elige «Guardar como PDF» como impresora.</p><div class="formgrid"><label>Periodo</label><select id="infP"><option value="mes:${MES}">${nombreMes(MES)}</option>${ys.map(y=>`<option value="anio:${y}">Año ${y}</option>`).join('')}</select></div>`,
    [{t:'Cancelar'},{t:'Imprimir',cls:'pri',fn:()=>{const [t,v]=$('#infP').value.split(':');imprimirInforme(t==='mes'?'mes':'anio',v)}}]);
}
$$('[data-informe]').forEach(b=>b.onclick=dlgInforme);

function dlgExportar(){
  const ys=[...new Set(mesesConDatos().map(m=>m.slice(0,4)))].reverse();
  dialog('Exportar a Excel',`<p class="small mut" style="margin-top:0">Se descarga un archivo .xlsx con los movimientos y un resumen por mes.</p><div class="formgrid"><label>Periodo</label><select id="xAl"><option value="mes">${nombreMes(MES)}</option>${ys.map(y=>`<option value="${y}">Año ${y}</option>`).join('')}<option value="todo">Todo</option></select></div>`,
    [{t:'Cancelar'},{t:'Descargar',cls:'pri',fn:()=>exportarExcel($('#xAl').value)}]);
}
$$('[data-export]').forEach(b=>b.onclick=dlgExportar);
