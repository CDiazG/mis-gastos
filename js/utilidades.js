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
  for(const g of GROUPS){h+=`<optgroup label="${g.n}">`+CATS.filter(c=>c.g===g.id).map(c=>`<option value="${c.id}"${c.id===sel?' selected':''}>${c.n}</option>`).join('')+'</optgroup>'}
  h+='<optgroup label="Otros movimientos (no son gasto)">'+SPECIAL.map(c=>`<option value="${c.id}"${c.id===sel?' selected':''}>${c.n}</option>`).join('')+'</optgroup>';
  return h;
}
