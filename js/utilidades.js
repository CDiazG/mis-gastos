// Fluvi · Funciones de apoyo: formato, fechas, normalización de texto
"use strict";
/* ============ Utilidades ============ */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const r2=n=>Math.round(n*100)/100;
const fmt=(n,d=2)=>Number(n||0).toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d,useGrouping:'always'});
// Cifra grande con los céntimos más pequeños: 1.234<small>,56</small> €
const eurG=n=>{const t=fmt(Math.abs(n),2),k=t.lastIndexOf(',');return (n<-0.0049?'−':'')+t.slice(0,k)+'<small>'+t.slice(k)+'</small> €'};
const eur=(n,d)=>(n<-0.0049?'−':'')+fmt(Math.abs(n),d===undefined?(Math.abs(n)>=1000?0:2):d)+'\u00a0€';
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const norm=s=>' '+String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase().replace(/[^A-Z0-9Ñ]+/g,' ').trim()+' ';
const mesDe=f=>f.slice(0,7);
const addMes=(m,d)=>{let [y,mm]=m.split('-').map(Number);mm+=d;while(mm>12){mm-=12;y++}while(mm<1){mm+=12;y--}return y+'-'+String(mm).padStart(2,'0')};
const nombreMes=m=>{const [y,mm]=m.split('-');return MESES[+mm-1]+' '+y};
const nombreMesC=m=>{const [y,mm]=m.split('-');return MESES[+mm-1].slice(0,3)+' '+y.slice(2)};
const hoy=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const fFecha=f=>{const [y,m,d]=f.split('-');return d+'/'+m+'/'+y.slice(2)};
const parseNum=s=>{s=String(s).trim().replace(/[€\s]/g,'');if(!s)return NaN;if(s.includes(',')){s=s.replace(/\./g,'').replace(',','.')}return parseFloat(s)};
const catN=id=>!id?'Sin categoría':id==='SINCAT'?'Sin categorizar':((ALLC.find(c=>c.id===id)||{n:id}).n);
const isGastoCat=id=>CATS.some(c=>c.id===id);
// Un movimiento cuenta como «sin categoría» si no tiene o si su categoría ya no existe (borrada o de una versión antigua).
const catConocida=id=>ALLC.some(c=>c.id===id)||(S.cats||[]).some(c=>c.id===id);
const sinCatX=x=>!x.cat||!catConocida(x.cat);

function toast(msg,err){const t=$('#toast');t.textContent=msg;t.className='on'+(err?' err':'');clearTimeout(t._h);t._h=setTimeout(()=>t.className='',err?5000:2600)}

function catOptions(sel,{blank=true,blankText='— Sin categoría —'}={}){
  if(sel&&!catConocida(sel))sel='';
  let h=blank?`<option value="">${blankText}</option>`:'';
  for(const g of GROUPS){h+=`<optgroup label="${g.n}">`+CATS.filter(c=>c.g===g.id&&(c.id!=='AHORRO'||sel==='AHORRO')).map(c=>`<option value="${c.id}"${c.id===sel?' selected':''}>${catEs(c.id)}${c.n}</option>`).join('')+'</optgroup>'}
  const oculta=sel&&!ALLC.some(c=>c.id===sel)&&(S.cats||[]).find(c=>c.id===sel);
  if(oculta)h+=`<option value="${oculta.id}" selected>${esc(oculta.n)}</option>`;
  h+='<optgroup label="Otros movimientos (no son gasto)">'+SPECIAL.map(c=>`<option value="${c.id}"${c.id===sel?' selected':''}>${c.n}</option>`).join('')+'</optgroup>';
  return h;
}

/* ---- Deshacer: guarda los movimientos antes de un cambio y deja volver atrás unos segundos ---- */
let UNDO=null;
function conDeshacer(msg,fn){
  const antes=JSON.stringify(S.mov);fn();save();render();
  const u=$('#undo');$('#undoTxt').textContent=msg;u.classList.add('on');clearTimeout(u._h);UNDO=antes;
  u._h=setTimeout(()=>{u.classList.remove('on');UNDO=null},8000);
}
$('#undoBtn').onclick=()=>{if(!UNDO)return;S.mov=JSON.parse(UNDO);UNDO=null;clearTimeout($('#undo')._h);$('#undo').classList.remove('on');save();render();toast('Deshecho')};
/* ---- Etiquetas de eventos (p. ej. «Boda Ana», «Viaje a Roma») ---- */
const tagsDe=x=>Array.isArray(x.tags)?x.tags:[];
function todasEtiquetas(){const m=new Map();for(const x of S.mov)for(const t of tagsDe(x)){const k=norm(t).trim();if(!m.has(k))m.set(k,t)}return [...m.values()].sort((a,b)=>a.localeCompare(b,'es'))}
const parseTags=s=>[...new Set(String(s||'').split(',').map(t=>t.trim().replace(/^#/,'')).filter(Boolean).map(t=>t.slice(0,40)))];
function pintarTagList(){const d=$('#tagList');if(d)d.innerHTML=todasEtiquetas().map(t=>`<option value="${esc(t)}">`).join('');
  const e=$('#eT');if(e)pintarSugTags(e,($('#eC')||{}).value);const a=$('#aTag');if(a)pintarSugTags(a,($('#cCon')||{}).value)}
// Etiquetas por orden de uso reciente (la más nueva primero)
function etiquetasRecientes(){const v=new Set();[...S.mov].sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha))).forEach(x=>tagsDe(x).forEach(t=>v.add(t)));return [...v]}
// Botoncitos bajo un campo de etiquetas: primero las que llevan otros movimientos parecidos, luego las últimas usadas.
function pintarSugTags(input,concepto){
  let box=input.nextElementSibling;if(!box||!box.classList.contains('tagsug')){box=document.createElement('div');box.className='tagsug';input.after(box)}
  if(!input._sug){input._sug=1;input.addEventListener('input',()=>pintarSugTags(input,input._con))}
  input._con=concepto;
  const puestas=new Set(parseTags(input.value).map(t=>norm(t))),k=norm(String(concepto||'')).trim().slice(0,12),parecidas=[];
  if(k.length>=4)for(const x of S.mov)if(norm(String(x.concepto||'')).trim().startsWith(k))for(const t of tagsDe(x))if(!parecidas.includes(t))parecidas.push(t);
  const lista=[...parecidas,...etiquetasRecientes().filter(t=>!parecidas.includes(t))].filter(t=>!puestas.has(norm(t))).slice(0,8);
  box.innerHTML=lista.length?`<span class="small mut">${parecidas.length?'Sugeridas':'Últimas usadas'}</span>`+lista.map(t=>`<button type="button" class="tagchip" data-t="${esc(t)}">${esc(t)}</button>`).join(''):'';
  box.onclick=e=>{const b=e.target.closest('.tagchip');if(!b)return;const cur=parseTags(input.value);cur.push(b.dataset.t);input.value=cur.join(', ');input.dispatchEvent(new Event('input'));input.focus()}}
/* ---- Conceptos del banco más legibles (sin tocar lo guardado) ---- */
// Oculta números de tarjeta y de cuenta largos: deja solo las 4 últimas cifras
const ocultarNumeros=s=>String(s||'').replace(/\b\d(?:[ -]?\d){11,18}\b/g,m=>'…'+m.replace(/\D/g,'').slice(-4));
function conceptoCorto(c){
  let s=ocultarNumeros(c);const orig=s;
  s=s.replace(/,?\s*Comisi[oó]n\s*[\d.,]+\s*$/i,'')
    .replace(/,?\s*Tarj(?:eta)?\.?\s*:?\s*\*?…?\d{4,}\s*,?/gi,'')
    .replace(/^(Compra Internet En|Compra En|Compra|Transacci[oó]n Contactless En|Transaccion Contactless En|Pago M[oó]vil En|Pago Con Tarjeta En|Pago En|Recibo|Adeudo De|Cargo Por)\s+/i,'')
    .replace(/^Devoluci[oó]n Pago M[oó]vil En\s+/i,'Devolución · ')
    .replace(/^Bizum A Favor De\s+(.+?)\s+Concepto:\s*(.+)$/i,'Bizum a $1 · $2').replace(/^Bizum De\s+(.+?)\s+Concepto:\s*(.+)$/i,'Bizum de $1 · $2')
    .replace(/^Transferencia De\s+(.+?),\s*Concepto\s+(.+)$/i,'De $1 · $2').replace(/^Transferencia A Favor De\s+(.+?)(,\s*Concepto\s+(.+))?$/i,(m,a,b,cn)=>'A '+a+(cn?' · '+cn:''))
    .replace(/\b\d{1,2}(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic|jan|apr|aug|dec)\b/gi,'')
    .replace(/\b(?=[A-Za-z0-9]*\d)(?=[A-Za-z0-9]*[A-Za-z])[A-Za-z0-9]{7,}\b/g,'')
    .replace(/\s*,\s*,/g,',').replace(/\s{2,}/g,' ').replace(/^[\s,·.-]+|[\s,·.-]+$/g,'').replace(/\s+,/g,',');
  s=s.replace(/\*+(?=\s|,|$)/g,'').replace(/,\s*(?!S\.?\s?[AL]\.?\b|SL\b|SA\b|SAU\b)(?=\S{3,})/,' · ');
  return s.length>=3?s:orig;
}
// Algunos bancos (CaixaBank, por ejemplo) ponen en la primera línea solo el tipo de operación («Bizum», «Compra con tarjeta»)
// y en la segunda la referencia seguida de lo que es de verdad. Si el concepto es solo un tipo, se le añade lo que viene detrás de la referencia.
const TIPO_OP=new Set('BIZUM COMPRA COMPRAS PAGO PAGOS RETIRADA REINTEGRO EFECTIVO CAJERO TRANSFERENCIA TRANSFERENCIAS TRASPASO RECIBO RECIBOS ADEUDO INGRESO ABONO DOMICILIACION DOMICILIADO COMISION COMISIONES TARJETA DE EN CON POR A LA EL DEL OPERACION MOVIMIENTO CARGO INMEDIATA INSTANTANEA RECIBIDA RECIBIDO EMITIDA ENVIADA MOVIL INTERNET CONTACTLESS NOMINA DEVOLUCION'.split(' '));
function mejorConcepto(c,d){
  c=String(c||'').trim();d=String(d||'').trim();if(!d||!c)return c;
  const w=norm(c).trim().split(' ').filter(Boolean);if(!w.length||w.length>6||!w.every(x=>TIPO_OP.has(x)))return c;
  const r=d.replace(/\b(?:N[º°o]\.?\s*)?(?:referencia|ref)\b\.?\s*:?\s*\S+/gi,' ').replace(/\s{2,}/g,' ').replace(/^[\s·,;:-]+|[\s·,;:-]+$/g,'');
  if(!/[A-Za-zÁÉÍÓÚÑáéíóúñ]{3}/.test(r))return c;
  return norm(r).trim().startsWith(w[0])?r:c+' · '+r;
}
const verConcepto=x=>conceptoCorto(x&&x.concepto!==undefined?x.concepto:x);

/* ===== Animación de plegado y desplegado (respeta «Animaciones» y prefers-reduced-motion) ===== */
const animOn=()=>!document.documentElement.classList.contains('sinanim')&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
function cerrarAnim(hs,fin){
  hs=hs.filter(Boolean);
  if(!animOn()||!hs.length||!hs.some(c=>c.offsetHeight)){fin();return}
  hs.forEach(c=>{c.style.setProperty('--h',c.offsetHeight+'px');c.classList.add('cierra')});
  setTimeout(()=>{hs.forEach(c=>{c.classList.remove('cierra');c.style.removeProperty('--h')});fin()},310)}
function abrirAnim(hs){if(!animOn())return;hs=hs.filter(c=>c&&c.offsetHeight);hs.forEach(c=>{c.style.setProperty('--h',c.offsetHeight+'px');c.classList.add('abre')});
  setTimeout(()=>hs.forEach(c=>{c.classList.remove('abre');c.style.removeProperty('--h')}),320)}
// Fichas desplegables (<details>): se pliegan y se abren con animación
document.addEventListener('click',e=>{
  const sm=e.target.closest('details.icard>summary,details.diacard>summary,details.faq>summary,details.masav>summary,details.cartera>summary,details.impmas>summary');
  if(!sm||e.target.closest('a,button,input,select'))return;
  const d=sm.parentNode,hs=[...d.children].filter(c=>c!==sm);
  if(d.open){if(!animOn())return;e.preventDefault();if(d._cierra)return;d._cierra=1;cerrarAnim(hs,()=>{d.open=false;d._cierra=0})}
  else setTimeout(()=>abrirAnim(hs),0)});
