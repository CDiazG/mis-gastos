// Cuentas Claras · Reglas de categorías automáticas y cálculos del mes
"use strict";
/* ============ Reglas ============ */
function matchRule(text){
  const n=norm(text);let best=null,bs=-1;
  for(const r of S.reglas){
    const p=norm(r.t);const core=p.trim();if(core.length<2)continue;
    const hit=core.length<=4? n.includes(p) : n.includes(' '+core);
    if(!hit)continue;
    const score=(r.u?1000:0)+core.length;
    if(score>bs){bs=score;best=r}
  }
  return best;
}
const isBizum=d=>/ BIZUM /.test(norm(d));
function autoCatR(desc,detalle,imp){
  const full=desc+' '+(detalle||'');
  const r=matchRule(full);
  if(!r)return {c:'',r:null};
  if(isBizum(desc)&&(!r.u||!pref('bizumReglas')))return {c:'',r:null}; // Bizum: a mano (salvo que se active en Preferencias)
  if(r.c==='INGRESO'&&imp<0)return {c:'',r:null};
  return {c:r.c,r};
}
function autoCat(desc,detalle,imp){return autoCatR(desc,detalle,imp).c}
const STOP=new Set(['RECIB','TRANS','TRANSF','TRANSFERENCIA','COMPRA','TARJ','TARJETA','PAGO','CON','EN','DE','DEL','LA','EL','LOS','LAS','WWW','COM','ES','SL','SA','SP','Y','A']);
function learnKey(desc){
  if(isBizum(desc)){const n=norm(desc).trim().replace(/^PAGO /,'');return n.split(' ').slice(0,5).join(' ')}
  const toks=norm(desc).trim().split(' ').filter(t=>t&&!/\d/.test(t)&&!STOP.has(t)&&t.length>1);
  return toks.slice(0,4).join(' ');
}
function learn(desc,cat){
  if(!cat||!pref('aprender')||(isBizum(desc)&&!pref('bizumReglas')))return;
  const k=learnKey(desc);if(!k||k.length<3)return;
  const ex=S.reglas.find(r=>r.u&&norm(r.t)===norm(k));
  if(ex)ex.c=cat;else S.reglas.unshift({t:k,c:cat,u:1});
}

/* ============ Cálculos ============ */
function mesesConDatos(){return [...new Set(S.mov.map(x=>x.mes))].sort()}
function stats(m){
  const ms=S.mov.filter(x=>x.mes===m);
  const by={};let ingresos=0,sinCat=0,sinCatImp=0;
  for(const x of ms){
    if(!x.cat){sinCat++;sinCatImp+=x.importe;by.SINCAT=(by.SINCAT||0)-x.importe;continue}
    if(x.cat==='INGRESO')ingresos+=x.importe;
    else by[x.cat]=(by[x.cat]||0)-x.importe;
  }
  const consumo=CONSUMO.reduce((a,c)=>a+(by[c]||0),0)+(by.SINCAT||0);
  // El ahorro es todo lo que no se gasta: ingresos − gastos − diezmo. Lo invertido es parte del ahorro;
  // la fila «Ahorro» del presupuesto es lo que queda en cuenta (se calcula, no se elige como categoría).
  const diezmo=by.DIEZMO||0,ahorro=ingresos-consumo-diezmo;
  by.AHORRO=r2(ahorro-(by.INVERSION||0));
  const base=S.aj.base==='fija'?(+S.aj.baseFija||0):ingresos;
  return {ms,by,ingresos:r2(ingresos),consumo:r2(consumo),ahorro:r2(ahorro),diezmo:r2(diezmo),sinCat,sinCatImp:r2(sinCatImp),base};
}
// Diezmo automático: un porcentaje de los ingresos del mes, pendiente hasta que se paga.
function diezmoMes(m,st){st=st||stats(m);const pct=+S.aj.pct.DIEZMO||0;
  if(!S.aj.diezmoAuto||!pct||(S.aj.diezmoDesde&&m<S.aj.diezmoDesde))return null;
  const debido=r2(st.ingresos*pct/100),pagado=r2(st.diezmo);return {pct,debido,pagado,pendiente:r2(Math.max(0,debido-pagado))}}
// Persona de un préstamo: la guardada o, si no, el nombre del Bizum o el concepto
function personaDe(x){if(x.persona)return x.persona;const m=String(x.concepto||'').match(/BIZUM (?:A|DE) (.+)$/i);return (m?m[1]:x.concepto||'Sin nombre').trim()}
function prestamosPorPersona(){const g={};
  for(const x of S.mov.filter(x=>x.cat==='PRESTAMO')){const p=personaDe(x),k=norm(p).trim();const o=g[k]||(g[k]={persona:p,prestado:0,devuelto:0,movs:[]});
    if(x.importe<0)o.prestado+=-x.importe;else o.devuelto+=x.importe;o.movs.push(x)}
  return Object.values(g).map(o=>({...o,prestado:r2(o.prestado),devuelto:r2(o.devuelto),pendiente:r2(o.prestado-o.devuelto)})).sort((a,b)=>b.pendiente-a.pendiente)}
function prestamosPendientes(){return r2(-S.mov.filter(x=>x.cat==='PRESTAMO').reduce((a,x)=>a+x.importe,0))}
