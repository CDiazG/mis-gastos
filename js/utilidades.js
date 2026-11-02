// Cuentas Claras · Funciones de apoyo: formato, fechas, normalización de texto
"use strict";
/* ============ Utilidades ============ */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const r2=n=>Math.round(n*100)/100;
const fmt=(n,d=2)=>Number(n||0).toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d,useGrouping:'always'});
const eur=(n,d=2)=>(n<-0.0049?'−':'')+fmt(Math.abs(n),d)+' €';
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

function toast(msg,err){const t=$('#toast');t.textContent=msg;t.className='on'+(err?' err':'');clearTimeout(t._h);t._h=setTimeout(()=>t.className='',err?5000:2600)}

function catOptions(sel,{blank=true,blankText='— Sin categoría —'}={}){
  let h=blank?`<option value="">${blankText}</option>`:'';
  for(const g of GROUPS){h+=`<optgroup label="${g.n}">`+CATS.filter(c=>c.g===g.id&&(c.id!=='AHORRO'||sel==='AHORRO')).map(c=>`<option value="${c.id}"${c.id===sel?' selected':''}>${c.n}</option>`).join('')+'</optgroup>'}
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
function pintarTagList(){const d=$('#tagList');if(d)d.innerHTML=todasEtiquetas().map(t=>`<option value="${esc(t)}">`).join('')}
