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
// ---- Estilos: se registran al usarlos y se escriben en styles.xml ----
// st({b,sz,c:'RRGGBB',bg:'RRGGBB',fmt:'eur'|'eurneg'|'pct'|'date',al:'center'|'right'|'left',bd:'thin'|'none',wrap,i})
const XLF={num:'0.######',eur:'#,##0.00\\ "€"',eurneg:'#,##0.00\\ "€";[Red]\\-#,##0.00\\ "€"',pct:'0%',date:'dd/mm/yyyy',mes:'mmmm yyyy'};
function nuevoLibroEstilos(){
  const fonts=['<font><sz val="11"/><color rgb="FF264540"/><name val="Calibri"/></font>'],fills=['<fill><patternFill patternType="none"/></fill>','<fill><patternFill patternType="gray125"/></fill>'],
    borders=['<border><left/><right/><top/><bottom/><diagonal/></border>','<border><left style="thin"><color rgb="FFD9E5DF"/></left><right style="thin"><color rgb="FFD9E5DF"/></right><top style="thin"><color rgb="FFD9E5DF"/></top><bottom style="thin"><color rgb="FFD9E5DF"/></bottom><diagonal/></border>'],
    fmts=[],xfs=['<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'],idx={'{}':0};
  const add=(arr,x)=>{let i=arr.indexOf(x);if(i<0){arr.push(x);i=arr.length-1}return i};
  const st=(o={})=>{const k=JSON.stringify(o);if(idx[k]!=null)return idx[k];
    const f=add(fonts,`<font>${o.b?'<b/>':''}${o.i?'<i/>':''}<sz val="${o.sz||11}"/><color rgb="FF${o.c||'264540'}"/><name val="Calibri"/></font>`);
    const fi=o.bg?add(fills,`<fill><patternFill patternType="solid"><fgColor rgb="FF${o.bg}"/><bgColor indexed="64"/></patternFill></fill>`):0;
    const bd=o.bd==='none'?0:(o.bd==='thin'?1:0);
    let nf=0;if(o.fmt){const code=XLF[o.fmt];let j=fmts.indexOf(code);if(j<0){fmts.push(code);j=fmts.length-1}nf=164+j}
    const al=o.al||o.wrap||o.va?`<alignment${o.al?` horizontal="${o.al}"`:''}${o.va?` vertical="${o.va}"`:' vertical="center"'}${o.wrap?' wrapText="1"':''}/>`:'<alignment vertical="center"/>';
    xfs.push(`<xf numFmtId="${nf}" fontId="${f}" fillId="${fi}" borderId="${bd}" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">${al}</xf>`);
    return idx[k]=xfs.length-1};
  st.xml=()=>`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${fmts.length?`<numFmts count="${fmts.length}">${fmts.map((c,j)=>`<numFmt numFmtId="${164+j}" formatCode="${xesc(c)}"/>`).join('')}</numFmts>`:''}<fonts count="${fonts.length}">${fonts.join('')}</fonts><fills count="${fills.length}">${fills.join('')}</fills><borders count="${borders.length}">${borders.join('')}</borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="${xfs.length}">${xfs.join('')}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  return st;
}
// Colores del Excel de Loreto (tema verde)
const XC={tit:'0F6B4F',hdr:'8CCFAC',grp:'A0DBC1',grpT:'D7EFE3',tot:'5DA68A',pres:'F1F3F2',ok:'2C7A4B',okBg:'E2F2E7',bad:'9C0006',badBg:'FFC7CE',warn:'7A5600',warnBg:'FFEB9C',blue:'1F4E9C',ingBg:'FFF2CC',mut:'7B8782'};
// Hoja: celdas en un mapa {ref:{v,s,f}}; opciones: widths, merges, heights, freeze (fila), filter, grid
function hoja(){const c={},h={};return {c,h,merges:[],set(ref,v,s,f){c[ref]={v,s,f};return this},alto(r,x){h[r]=x}}}
function hojaXml(H,{widths=[],freeze=0,filter='',grid=true,tab=''}={}){
  const rows={};for(const ref in H.c){const m=ref.match(/^([A-Z]+)(\d+)$/);(rows[+m[2]]||(rows[+m[2]]={}))[ref]=H.c[ref]}
  for(const r in H.h)rows[r]||(rows[r]={});
  const colN=s=>s.split('').reduce((a,ch)=>a*26+ch.charCodeAt(0)-64,0);
  let x='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">';
  if(tab)x+=`<sheetPr><tabColor rgb="FF${tab}"/></sheetPr>`;
  x+=`<sheetViews><sheetView workbookViewId="0"${grid?'':' showGridLines="0"'}>${freeze?`<pane ySplit="${freeze}" topLeftCell="A${freeze+1}" activePane="bottomLeft" state="frozen"/>`:''}</sheetView></sheetViews>`;
  if(widths.length)x+='<cols>'+widths.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('')+'</cols>';
  x+='<sheetData>';
  for(const r of Object.keys(rows).map(Number).sort((a,b)=>a-b)){
    x+=`<row r="${r}"${H.h[r]?` ht="${H.h[r]}" customHeight="1"`:''}>`;
    for(const ref of Object.keys(rows[r]).sort((a,b)=>colN(a.match(/[A-Z]+/)[0])-colN(b.match(/[A-Z]+/)[0]))){
      const {v,s=0,f}=rows[r][ref];
      if(f)x+=`<c r="${ref}" s="${s}"><f>${xesc(f)}</f>${typeof v==='number'?`<v>${v}</v>`:''}</c>`;
      else if(v==null||v==='')x+=`<c r="${ref}" s="${s}"/>`;
      else if(typeof v==='number')x+=`<c r="${ref}" s="${s}"><v>${v}</v></c>`;
      else x+=`<c r="${ref}" s="${s}" t="inlineStr"><is><t xml:space="preserve">${xesc(v)}</t></is></c>`;
    }
    x+='</row>';
  }
  x+='</sheetData>';
  if(filter)x+=`<autoFilter ref="${filter}"/>`;
  if(H.merges.length)x+=`<mergeCells count="${H.merges.length}">${H.merges.map(m=>`<mergeCell ref="${m}"/>`).join('')}</mergeCells>`;
  x+='<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/><pageSetup orientation="landscape" paperSize="9" fitToHeight="0"/>';
  return x+'</worksheet>';
}
function libroXlsx(sheets,st,activa=0){
  const files=[];
  files.push({name:'[Content_Types].xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+sheets.map((s,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')+'</Types>'});
  files.push({name:'_rels/.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'});
  const fl=sheets.map((s,i)=>s.opt.filter?`<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${xesc(s.name).replace(/'/g,"''")}'!${s.opt.filter.replace(/([A-Z]+)(\d+)/g,'$$$1$$$2')}</definedName>`:'').join('');
  files.push({name:'xl/workbook.xml',data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView activeTab="${activa}"/></bookViews><sheets>`+sheets.map((s,i)=>`<sheet name="${xesc(s.name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')+'</sheets>'+(fl?`<definedNames>${fl}</definedNames>`:'')+'<calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>'});
  files.push({name:'xl/_rels/workbook.xml.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+sheets.map((s,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')+`<Relationship Id="rId${sheets.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`});
  const xmls=sheets.map(s=>hojaXml(s.H,s.opt));
  files.push({name:'xl/styles.xml',data:st.xml()});
  xmls.forEach((x,i)=>files.push({name:`xl/worksheets/sheet${i+1}.xml`,data:x}));
  return zipStore(files);
}
const grupoN=id=>{const c=CATS.find(c=>c.id===id);return c?GROUPS.find(g=>g.id===c.g).n:(id?'No es gasto':'')};
const MESC=['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEPT','OCT','NOV','DIC'];
const nombreHoja=m=>MESC[+m.slice(5)-1]+m.slice(2,4);
// Hoja de un mes, al estilo del Excel de gastos de siempre
function hojaMes(m,st){
  const H=hoja(),s=stats(m),R=v=>r2(v);
  const T=st({sz:26,b:true,c:XC.tit}),hd=st({b:true,c:'FFFFFF',bg:XC.hdr,al:'center',bd:'thin'}),hdL=st({b:true,c:'FFFFFF',bg:XC.hdr,bd:'thin'});
  const eur=st({fmt:'eurneg',bd:'thin'}),eurB=st({fmt:'eurneg',bd:'thin',b:true}),txt=st({bd:'thin'}),mut=st({c:XC.mut,i:true}),pct=st({fmt:'pct',bd:'thin',al:'center'});
  const g=st({b:true,bg:XC.grp,bd:'thin'}),gE=st({b:true,bg:XC.grp,bd:'thin',fmt:'eurneg'}),gP=st({b:true,bg:XC.grp,bd:'thin',fmt:'pct',al:'center'}),gT=st({b:true,bg:XC.tot,c:'FFFFFF',bd:'thin',fmt:'eurneg'});
  const pres=st({bg:XC.pres,bd:'thin',fmt:'eur',c:'5B6763'}),totC=st({bg:XC.grpT,bd:'thin',fmt:'eurneg',b:true});
  const okS=st({b:true,c:XC.ok,bg:XC.okBg,bd:'thin',al:'center'}),badS=st({b:true,c:XC.bad,bg:XC.badBg,bd:'thin',al:'center'}),warnS=st({b:true,c:XC.warn,bg:XC.warnBg,bd:'thin',al:'center'});
  const big=st({b:true,sz:14,fmt:'eurneg',bd:'thin',al:'center'}),bigOk=st({b:true,sz:14,fmt:'eurneg',bd:'thin',al:'center',c:XC.ok}),bigP=st({b:true,sz:14,fmt:'pct',bd:'thin',al:'center'});
  // título
  const [y,mm]=m.split('-');H.set('A1',nombreMes(m).replace(/^./,c=>c.toUpperCase()),T);H.merges.push('A1:D2');H.alto(1,22);H.alto(2,22);
  H.set('F1',NUBE&&USER?'Cuentas de '+USER.nombre:'Cuentas Claras',st({c:XC.mut,i:true}));H.set('F2','Exportado el '+fFecha(hoy()),st({c:XC.mut,i:true,sz:9}));
  // cifras del mes
  const kp=[['INGRESOS',s.ingresos,bigOk],['GASTADO',s.consumo,big],['AHORRO DEL MES',s.ahorro,s.ahorro<0?big:bigOk],['% AHORRO',s.ingresos?R(s.ahorro/s.ingresos*100)/100:'',bigP],['INVERTIDO',s.by.INVERSION||0,big],...(diezmoOn()||s.diezmo?[['DIEZMO',s.diezmo,big]]:[])];
  kp.forEach(([t,v,sv],i)=>{const c=String.fromCharCode(65+i);H.set(c+'4',t,hd);H.set(c+'5',typeof v==='number'?R(v):v,sv)});H.alto(5,24);
  // categorías
  let r=7;
  ['GRUPO','CATEGORÍA','% OBJETIVO','PRESUPUESTO','BANCO','EFECTIVO','TOTAL','ESTADO'].forEach((t,i)=>H.set(String.fromCharCode(65+i)+r,t,i<2?hdL:hd));
  const banco=id=>-s.ms.filter(x=>x.cat===id&&x.metodo!=='efectivo').reduce((a,x)=>a+x.importe,0),efe=id=>-s.ms.filter(x=>x.cat===id&&x.metodo==='efectivo').reduce((a,x)=>a+x.importe,0);
  const filasGrupo=[];
  for(const G of GROUPS){
    r++;const gr=r;filasGrupo.push(gr);
    const cs=CATS.filter(c=>c.g===G.id&&(c.id!=='OTROS'||s.by.OTROS));
    const extra=G.id==='VARIABLES'&&Math.abs(s.by.SINCAT||0)>0.009;
    H.set('A'+gr,G.n.toUpperCase(),g);H.set('B'+gr,'',g);
    const ini=gr+1,fin=gr+cs.length+(extra?1:0);
    H.set('C'+gr,R(cs.reduce((a,c)=>a+pctCat(c.id,s.base),0))/100,gP);
    for(const col of ['D','E','F','G'])H.set(col+gr,null,col==='G'?gT:gE,`SUM(${col}${ini}:${col}${fin})`);
    const gv=cs.reduce((a,c)=>a+(s.by[c.id]||0),0)+(extra?s.by.SINCAT:0),gp=cs.reduce((a,c)=>a+presupuestoCat(m,c.id,s).p,0);
    H.c['G'+gr].v=R(gv);H.c['D'+gr].v=R(gp);
    const sumB=cs.filter(c=>c.id!=='AHORRO').reduce((a,c)=>a+banco(c.id),0)+(extra?banco(''):0),sumE=cs.filter(c=>c.id!=='AHORRO').reduce((a,c)=>a+efe(c.id),0)+(extra?efe(''):0);
    H.c['E'+gr].v=R(sumB);H.c['F'+gr].v=R(sumE);
    H.set('H'+gr,G.id==='AHORRO'?(gv>=gp-0.5?'CUMPLIDO':'POR DEBAJO'):(gv>gp+0.5?'SOBRE PRESUPUESTO':'DENTRO'),G.id==='AHORRO'?(gv>=gp-0.5?okS:warnS):(gv>gp+0.5?badS:okS));
    for(const c of cs){r++;const p=presupuestoCat(m,c.id,s).p,v=R(s.by[c.id]||0);
      H.set('A'+r,'',txt);H.set('B'+r,c.n+(c.id==='AHORRO'?' (lo que sobra)':''),txt);H.set('C'+r,R(pctCat(c.id,s.base))/100,pct);H.set('D'+r,p,pres);
      if(c.id==='AHORRO'){H.set('E'+r,'',txt);H.set('F'+r,'',txt)}else{H.set('E'+r,R(banco(c.id)),eur);H.set('F'+r,R(efe(c.id)),eur)}
      H.set('G'+r,v,totC,c.id==='AHORRO'?undefined:`E${r}+F${r}`);
      let e,es;if(G.id==='AHORRO'){if(p<=0.5&&Math.abs(v)<=0.5){e='';es=txt}else if(v>=p-0.5){e='CUMPLIDO';es=okS}else{e='FALTAN '+eurTxt(p-v);es=warnS}}
      else if(p<=0&&v<=0.5){e='';es=txt}else if(v>p+0.5){e='TE PASAS '+eurTxt(v-p);es=badS}else if(p>0&&v>=p*0.8){e='CERCA ('+Math.round(v/p*100)+'%)';es=warnS}else{e='OK';es=okS}
      H.set('H'+r,e,es);}
    if(extra){r++;H.set('A'+r,'',txt);H.set('B'+r,'Sin categorizar',st({bd:'thin',i:true,c:XC.bad}));H.set('C'+r,'',txt);H.set('D'+r,'',pres);H.set('E'+r,R(banco('')),eur);H.set('F'+r,R(efe('')),eur);H.set('G'+r,R(s.by.SINCAT),totC,`E${r}+F${r}`);H.set('H'+r,'PONLES CATEGORÍA',warnS)}
  }
  r++;const tr=r;const [fN,fV]=filasGrupo;
  H.set('A'+tr,'TOTAL GASTADO',st({b:true,c:'FFFFFF',bg:XC.tot,bd:'thin'}));H.set('B'+tr,'(banco + efectivo)',st({c:'FFFFFF',bg:XC.tot,bd:'thin',i:true}));H.set('C'+tr,'',st({bg:XC.tot,bd:'thin'}));
  for(const col of ['D','E','F','G'])H.set(col+tr,null,gT,`${col}${fN}+${col}${fV}`);
  H.c['G'+tr].v=R(s.consumo);for(const col of ['D','E','F'])H.c[col+tr].v=R((H.c[col+fN].v||0)+(H.c[col+fV].v||0));H.set('H'+tr,'',st({bg:XC.tot,bd:'thin'}));
  // otros movimientos
  r+=2;H.set('A'+r,'NO SON GASTO',hdL);H.set('B'+r,'',hdL);H.set('C'+r,'€',hd);
  const esp=SPECIAL.filter(c=>c.id!=='INGRESO').map(c=>({c,v:s.by[c.id]||0})).filter(x=>Math.abs(x.v)>0.009);
  if(!esp.length){r++;H.set('A'+r,'Ningún traspaso, retirada de efectivo, préstamo ni ajuste este mes.',mut)}
  for(const x of esp){r++;H.set('A'+r,x.c.n,txt);H.set('B'+r,'',txt);H.set('C'+r,R(-x.v),eur)}
  // lista de movimientos a la derecha
  const L=['J','K','L','M','N'];const mv=s.ms.slice().sort((a,b)=>a.fecha.localeCompare(b.fecha)||(a.orden??0)-(b.orden??0));
  ['FECHA','CONCEPTO','€','CATEGORÍA','PAGADO CON'].forEach((t,i)=>H.set(L[i]+'7',t,i===1||i===3||i===4?hdL:hd));
  const dt=st({fmt:'date',bd:'thin',al:'center'}),sinC=st({bd:'thin',i:true,c:XC.bad}),ingS=st({fmt:'eurneg',bd:'thin',bg:XC.ingBg,c:XC.blue,b:true});
  mv.forEach((x,k)=>{const rr=8+k;H.set('J'+rr,dSerial(x.fecha),dt);H.set('K'+rr,verConcepto(x)+(x.nota?' · '+x.nota:''),txt);H.set('L'+rr,R(x.importe),x.cat==='INGRESO'?ingS:eur);
    H.set('M'+rr,x.cat?catN(x.cat):'Sin categoría',x.cat?txt:sinC);H.set('N'+rr,x.metodo==='efectivo'?'Efectivo':(x.cuenta||''),txt)});
  if(!mv.length)H.set('K8','Sin movimientos',mut);
  return {name:nombreHoja(m),H,opt:{widths:[22,26,11,13,12,12,13,20,3,11,40,12,22,13],grid:false,filter:mv.length?`J7:N${7+mv.length}`:'',tab:XC.hdr}};
}
const eurTxt=v=>eur(v,0).replace(/\s/g,' ');
// Hoja «Resumen»: un mes por fila
function hojaResumen(meses,st){
  const H=hoja();const T=st({sz:20,b:true,c:XC.tit}),hd=st({b:true,c:'FFFFFF',bg:XC.hdr,al:'center',bd:'thin',wrap:true}),hdL=st({b:true,c:'FFFFFF',bg:XC.hdr,bd:'thin'});
  const eu=st({fmt:'eurneg',bd:'thin'}),euB=st({fmt:'eurneg',bd:'thin',b:true}),pc=st({fmt:'pct',bd:'thin',al:'center'}),mesS=st({bd:'thin',b:true}),totS=st({b:true,c:'FFFFFF',bg:XC.tot,bd:'thin',fmt:'eurneg'}),totL=st({b:true,c:'FFFFFF',bg:XC.tot,bd:'thin'}),totP=st({b:true,c:'FFFFFF',bg:XC.tot,bd:'thin',fmt:'pct',al:'center'});
  const cc=[...CATS.filter(c=>c.g!=='AHORRO'),{id:'SINCAT',n:'Sin categorizar'}].filter(c=>meses.some(m=>Math.abs(stats(m).by[c.id]||0)>0.009));
  H.set('A1','Resumen '+(meses.length>1?nombreMes(meses[0])+' – '+nombreMes(meses[meses.length-1]):nombreMes(meses[0])),T);H.alto(1,30);
  const cab=['MES','INGRESOS','GASTADO','AHORRO','% AHORRO','INVERTIDO','DIEZMO',...cc.map(c=>c.n.toUpperCase())];
  cab.forEach((t,i)=>H.set(colL(i)+'3',t,i?hd:hdL));H.alto(3,32);
  meses.forEach((m,k)=>{const s=stats(m),r=4+k;const v=[s.ingresos,s.consumo,s.ahorro,null,s.by.INVERSION||0,s.diezmo,...cc.map(c=>s.by[c.id]||0)];
    H.set('A'+r,nombreMes(m).replace(/^./,c=>c.toUpperCase()),mesS);
    v.forEach((x,i)=>{const c=colL(i+1);if(i===3)H.set(c+r,s.ingresos?r2(s.ahorro/s.ingresos*100)/100:'',pc);else H.set(c+r,r2(x),i===1?euB:eu)})});
  const n=meses.length,tr=4+n;H.set('A'+tr,'TOTAL',totL);
  const tot=i=>r2(meses.reduce((a,m)=>{const s=stats(m);const v=[s.ingresos,s.consumo,s.ahorro,0,s.by.INVERSION||0,s.diezmo,...cc.map(c=>s.by[c.id]||0)];return a+v[i-1]},0));
  for(let i=1;i<cab.length;i++){const c=colL(i);if(i===4)H.set(c+tr,tot(1)?r2(tot(3)/tot(1)*100)/100:0,totP,`IF(B${tr}=0,"",D${tr}/B${tr})`);else H.set(c+tr,tot(i),totS,`SUM(${c}4:${c}${tr-1})`)}
  H.set('A'+(tr+1),'MEDIA AL MES',st({b:true,bd:'thin',bg:XC.grpT}));
  for(let i=1;i<cab.length;i++){const c=colL(i);if(i!==4)H.set(c+(tr+1),r2(tot(i)/n),st({fmt:'eurneg',bd:'thin',bg:XC.grpT,b:true}),`${c}${tr}/${n}`);else H.set(c+(tr+1),'',st({bd:'thin',bg:XC.grpT}))}
  H.set('A'+(tr+3),'El ahorro es lo que no se gasta: ingresos − gastado − diezmo. Lo invertido es parte del ahorro.',st({i:true,c:XC.mut}));
  return {name:'Resumen',H,opt:{widths:[18,12,12,12,10,12,11,...cc.map(()=>13)],freeze:3,grid:false,tab:XC.tit}};
}
// Hoja «Movimientos»: todo en una tabla con filtros
function hojaMovs(movs,st){
  const H=hoja();const hd=st({b:true,c:'FFFFFF',bg:XC.hdr,bd:'thin'}),dt=st({fmt:'date',bd:'thin',al:'center'}),tx=st({bd:'thin'}),eu=st({fmt:'eurneg',bd:'thin'}),sinC=st({bd:'thin',i:true,c:XC.bad});
  ['FECHA','MES','CONCEPTO','DETALLE DEL BANCO','CATEGORÍA','GRUPO','PAGADO CON','IMPORTE','ORIGEN','NOTA','ETIQUETAS'].forEach((t,i)=>H.set(colL(i)+'1',t,hd));
  movs.forEach((x,k)=>{const r=2+k;H.set('A'+r,dSerial(x.fecha),dt);H.set('B'+r,nombreMesC(x.mes),tx);H.set('C'+r,ocultarNumeros(x.concepto),tx);H.set('D'+r,ocultarNumeros(x.detalle||''),tx);
    H.set('E'+r,x.cat?catN(x.cat):'Sin categoría',x.cat?tx:sinC);H.set('F'+r,x.cat==='AHORRO'?'':grupoN(x.cat),tx);H.set('G'+r,x.metodo==='efectivo'?'Efectivo':(x.cuenta||''),tx);H.set('H'+r,r2(x.importe),eu);
    H.set('I'+r,{extracto:'Extracto',excel:'Excel antiguo',manual:'A mano'}[x.origen]||x.origen||'',tx);H.set('J'+r,x.nota||'',tx);H.set('K'+r,tagsDe(x).join(', '),tx)});
  return {name:'Movimientos',H,opt:{widths:[11,10,36,34,22,18,13,12,13,22,20],freeze:1,filter:`A1:K${movs.length+1}`,tab:'76B59A'}};
}
// Hoja «Patrimonio»: cuentas, cartera de inversión, objetivos de ahorro y préstamos (cómo está todo hoy)
function hojaPatrimonio(st){
  const cs=S.cuentas||[],os=S.objetivos||[],ps=prestamosPorPersona().filter(x=>Math.abs(x.pendiente)>0.009);
  const cart=cs.filter(c=>c.cartera&&c.cartera.pos&&c.cartera.pos.length);
  if(!cs.length&&!os.length&&!ps.length)return null;
  const H=hoja();const T=st({sz:20,b:true,c:XC.tit}),S2=st({sz:13,b:true,c:XC.tit}),hd=st({b:true,c:'FFFFFF',bg:XC.hdr,bd:'thin'}),tx=st({bd:'thin'}),dt=st({fmt:'date',bd:'thin',al:'center'}),
    eu=st({fmt:'eurneg',bd:'thin'}),pc=st({fmt:'pct',bd:'thin',al:'center'}),num=st({bd:'thin',fmt:'num'}),totL=st({b:true,c:'FFFFFF',bg:XC.tot,bd:'thin'}),totS=st({b:true,c:'FFFFFF',bg:XC.tot,bd:'thin',fmt:'eurneg'}),
    nota=st({i:true,c:XC.mut});
  H.set('A1','Patrimonio a '+fFecha(hoy()),T);H.alto(1,30);let r=3;
  const cab=(arr)=>{arr.forEach((t,i)=>H.set(colL(i)+r,t,hd));r++};
  if(cs.length){H.set('A'+r,'Cuentas',S2);r++;cab(['CUENTA','SALDO','% DEL TOTAL','ACTUALIZADO','TIPO']);
    const tot=cs.reduce((a,c)=>a+(saldoCuenta(c)||0),0),ini=r;
    cs.forEach(c=>{const cv=saldoCuenta(c);H.set('A'+r,c.n,tx);H.set('B'+r,cv!=null?r2(cv):'',eu);H.set('C'+r,tot&&cv?r2(cv/tot*1000)/1000:'',pc);H.set('D'+r,c.f?dSerial(c.f):'',c.f?dt:tx);
      H.set('E'+r,c.cartera?'Inversiones':c.inversion?'Inversión':c.banco?'Con extracto':'A mano',tx);r++});
    H.set('A'+r,'TOTAL',totL);H.set('B'+r,r2(tot),totS,`SUM(B${ini}:B${r-1})`);['C','D','E'].forEach(x=>H.set(x+r,'',totL));r+=2}
  for(const c of cart){const pos=c.cartera.pos.slice().sort((a,b)=>b.v-a.v),t=pos.reduce((a,x)=>a+x.v,0);
    H.set('A'+r,'Cartera de '+c.n+' a '+fFecha(c.cartera.f),S2);r++;cab(['VALOR','UNIDADES','VALOR EN €','% DE LA CARTERA','ISIN']);const ini=r;
    pos.forEach(x=>{H.set('A'+r,x.n,tx);H.set('B'+r,x.u||'',num);H.set('C'+r,r2(x.v),eu);H.set('D'+r,t?r2(x.v/t*1000)/1000:'',pc);H.set('E'+r,x.isin||'',tx);r++});
    H.set('A'+r,'TOTAL',totL);H.set('B'+r,'',totL);H.set('C'+r,r2(t),totS,`SUM(C${ini}:C${r-1})`);H.set('D'+r,'',totL);H.set('E'+r,'',totL);r+=2}
  if(os.length){H.set('A'+r,'Objetivos de ahorro',S2);r++;cab(['OBJETIVO','META','AHORRADO','FALTA','PARA']);
    os.forEach(o=>{const i=infoObj(o);H.set('A'+r,o.nombre+(i.falta<=0?' ✓':''),tx);H.set('B'+r,r2(o.meta),eu);H.set('C'+r,r2(i.ah),eu);H.set('D'+r,r2(i.falta),eu);H.set('E'+r,o.mesMeta?nombreMes(o.mesMeta):'',tx);r++});r++}
  if(ps.length){H.set('A'+r,'Préstamos pendientes',S2);r++;cab(['PERSONA','PRESTADO','DEVUELTO','PENDIENTE','']);
    ps.forEach(x=>{H.set('A'+r,x.persona,tx);H.set('B'+r,r2(x.prestado),eu);H.set('C'+r,r2(x.devuelto),eu);H.set('D'+r,r2(x.pendiente),eu);H.set('E'+r,'',tx);r++});r++}
  H.set('A'+r,'Los saldos son los últimos que hay en la app (los de las cuentas con extracto se actualizan al importarlo).',nota);
  return {name:'Patrimonio',H,opt:{widths:[44,14,14,14,16],grid:false,tab:'C9A227'}};
}
function exportarExcel(alcance){
  let meses;const all=mesesConDatos();
  if(alcance==='mes')meses=[MES];else if(alcance==='todo')meses=all;else meses=all.filter(m=>m.startsWith(alcance));
  const set=new Set(meses);
  const movs=S.mov.filter(x=>set.has(x.mes)).sort((a,b)=>a.fecha.localeCompare(b.fecha)||(a.orden??0)-(b.orden??0));
  if(!movs.length){toast('No hay movimientos en ese periodo',true);return}
  meses=meses.filter(m=>S.mov.some(x=>x.mes===m));
  const st=nuevoLibroEstilos();
  const hojas=[...(meses.length>1?[hojaResumen(meses,st)]:[]),...meses.map(m=>hojaMes(m,st)),hojaMovs(movs,st)];
  const activa=meses.length>1?hojas.length-2:0;const hp=hojaPatrimonio(st);if(hp)hojas.push(hp);
  const nombre='Gastos '+(alcance==='mes'?nombreMes(MES):alcance==='todo'?'completo':alcance)+'.xlsx';
  const a=document.createElement('a');a.href=URL.createObjectURL(libroXlsx(hojas,st,activa));a.download=nombre;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),3000);toast('Descargado: '+nombre);
}
/* ============ Informe para imprimir ============ */
function informeMes(m){
  const st=stats(m),ant=stats(addMes(m,-1)),libre=st.ahorro;
  const filas=[...CATS.filter(c=>c.g!=='AHORRO'),{id:'SINCAT',n:'Sin categorizar'}].map(c=>{const p=c.id==='SINCAT'?0:presupuestoCat(m,c.id,st).p,v=st.by[c.id]||0,d=v-(ant.by[c.id]||0);
    return (v||p)?`<tr><td>${esc(c.n)}</td><td class="r">${p?eur(p,0):'—'}</td><td class="r">${eur(v)}</td><td class="r ${p&&v>p+0.5?'neg':''}">${p?eur(p-v,0):''}</td><td class="r">${ant.ms.length&&Math.abs(d)>=1?(d>0?'+':'−')+eur(Math.abs(d),0):''}</td></tr>`:''}).join('');
  const items=[...CATS.filter(c=>c.g!=='AHORRO').map(c=>({n:c.n,id:c.id,v:st.by[c.id]||0})),{n:'Sin categorizar',id:'SINCAT',v:st.by.SINCAT||0}].filter(x=>x.v>0.5).sort((a,b)=>b.v-a.v);
  const top=st.ms.filter(x=>x.importe<0&&x.cat!=='TRASPASO'&&x.cat!=='EFECTIVO').sort((a,b)=>a.importe-b.importe).slice(0,10);
  const fx=fijosDelMes(m),ps=prestamosPorPersona().filter(p=>Math.abs(p.pendiente)>0.5),os=S.objetivos||[],dz=diezmoMes(m,st);
  return `<section><div class="kp"><div>Ingresos<b>${eur(st.ingresos)}</b></div><div>Gastado<b>${eur(st.consumo)}</b></div><div>Ahorro del mes<b>${eur(libre)}</b>${st.ingresos?Math.round(libre/st.ingresos*100)+'% de lo ingresado':''}</div>${st.by.INVERSION?`<div>Invertido<b>${eur(st.by.INVERSION)}</b></div>`:''}${st.diezmo||dz?`<div>Diezmo<b>${eur(st.diezmo)}</b>${dz&&dz.pendiente>0.5?'pendiente '+eur(dz.pendiente,0):''}</div>`:''}</div></section>
   <section><h2>Presupuesto por categoría</h2><table><thead><tr><th>Categoría</th><th class="r">Presupuesto</th><th class="r">Gastado</th><th class="r">Queda</th><th class="r">vs mes anterior</th></tr></thead><tbody>${filas}</tbody></table></section>
   ${items.length?`<section><h2>En qué se ha ido el dinero</h2>${barrasHtml(items)}</section>`:''}
   ${top.length?`<section><h2>Mayores gastos</h2><table><tbody>${top.map(x=>`<tr><td>${fFecha(x.fecha)}</td><td>${esc(verConcepto(x))}</td><td>${catN(x.cat)}</td><td class="r">${eur(-x.importe)}</td></tr>`).join('')}</tbody></table></section>`:''}
   ${fx.length?`<section><h2>Gastos fijos</h2><table><tbody>${fx.map(x=>`<tr><td>${esc(x.f.nombre)}</td><td>${{ok:'pagado',cambia:'ha cambiado',pendiente:'pendiente',falta:'no ha llegado'}[x.estado]}</td><td class="r">${eur(x.cands.length?x.pagado:x.f.importe)}</td></tr>`).join('')}</tbody></table></section>`:''}
   ${ps.length?`<section><h2>Préstamos pendientes</h2><table><tbody>${ps.map(p=>`<tr><td>${esc(p.persona)}</td><td class="r">${p.pendiente>0?'te debe ':'le debes '}${eur(Math.abs(p.pendiente))}</td></tr>`).join('')}</tbody></table></section>`:''}
   ${os.length?`<section><h2>Objetivos de ahorro</h2><table><tbody>${os.map(o=>{const i=infoObj(o);return `<tr><td>${esc(o.nombre)}</td><td class="r">${eur(i.ah,0)} de ${eur(o.meta,0)}</td><td class="r">${i.falta>0?'faltan '+eur(i.falta,0):'conseguido'}</td></tr>`}).join('')}</tbody></table></section>`:''}`;
}
function informeAnio(y){
  const ms=[];for(let k=1;k<=12;k++)ms.push(y+'-'+String(k).padStart(2,'0'));
  const sts=ms.map(m=>({m,...stats(m)})).filter(x=>x.ms.length);
  if(!sts.length)return '<p>No hay datos de ese año.</p>';
  const I=sts.reduce((a,x)=>a+x.ingresos,0),G=sts.reduce((a,x)=>a+x.consumo,0),D=sts.reduce((a,x)=>a+x.diezmo,0),A=sts.reduce((a,x)=>a+(x.by.INVERSION||0),0);
  const cats=[...CATS.filter(c=>c.g!=='AHORRO'),{id:'SINCAT',n:'Sin categorizar'}].map(c=>({n:c.n,id:c.id,v:sts.reduce((a,x)=>a+(x.by[c.id]||0),0)})).filter(x=>x.v>0.5).sort((a,b)=>b.v-a.v);
  return `<section><div class="kp"><div>Ingresos<b>${eur(I,0)}</b></div><div>Gastado<b>${eur(G,0)}</b>${eur(G/sts.length,0)} al mes</div><div>Ahorro<b>${eur(I-G-D,0)}</b>${I?Math.round((I-G-D)/I*100)+'% de lo ingresado':''}</div>${A?`<div>Invertido<b>${eur(A,0)}</b></div>`:''}${D?`<div>Diezmo<b>${eur(D,0)}</b></div>`:''}</div></section>
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


function dlgExportar(){
  const ys=[...new Set(mesesConDatos().map(m=>m.slice(0,4)))].reverse();
  dialog('Exportar a Excel',`<p class="small mut" style="margin-top:0">Se descarga un Excel con una hoja por mes (presupuesto, gastos y movimientos, como el Excel de siempre), un resumen y la lista de todos los movimientos.</p><div class="formgrid"><label>Periodo</label><select id="xAl"><option value="mes">${nombreMes(MES)}</option>${ys.map(y=>`<option value="${y}">Año ${y}</option>`).join('')}<option value="todo">Todo</option></select></div>`,
    [{t:'Cancelar'},{t:'Descargar',cls:'pri',fn:()=>exportarExcel($('#xAl').value)}]);
}
// Un solo botón «Exportar» en Resumen, Movimientos e Histórico: Excel o informe para imprimir / PDF
function dlgExportarTodo(){
  dialog('Exportar',`<div class="expopts"><button type="button" class="expop" data-ex="xls"><span class="ei">📊</span><span><b>Excel</b><small>Una hoja por mes como el Excel de siempre, un resumen, todos los movimientos y tu patrimonio.</small></span></button>
    <button type="button" class="expop" data-ex="inf"><span class="ei">🖨️</span><span><b>Informe para imprimir o PDF</b><small>Un resumen bonito de un mes o de un año, listo para imprimir o guardar como PDF.</small></span></button></div>`,[{t:'Cancelar'}]);
  $$('#dlgB [data-ex]').forEach(b=>b.onclick=()=>{$('#dlg').close();setTimeout(b.dataset.ex==='xls'?dlgExportar:dlgInforme,30)});
}
$$('[data-exportar]').forEach(b=>b.onclick=dlgExportarTodo);
