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
  if(isBizum(desc)&&!r.u)return {c:'',r:null}; // Bizum: solo reglas puestas a mano
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
  if(!cat||isBizum(desc))return;
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
    if(!x.cat){sinCat++;sinCatImp+=x.importe;continue}
    if(x.cat==='INGRESO')ingresos+=x.importe;
    else by[x.cat]=(by[x.cat]||0)-x.importe;
  }
  const consumo=CONSUMO.reduce((a,c)=>a+(by[c]||0),0);
  const ahorro=CATS.filter(c=>c.g==='AHORRO'&&c.id!=='DIEZMO').reduce((a,c)=>a+(by[c.id]||0),0),diezmo=by.DIEZMO||0;
  const base=S.aj.base==='fija'?(+S.aj.baseFija||0):ingresos;
  return {ms,by,ingresos:r2(ingresos),consumo:r2(consumo),ahorro:r2(ahorro),diezmo:r2(diezmo),sinCat,sinCatImp:r2(sinCatImp),base};
}
function prestamosPendientes(){return r2(-S.mov.filter(x=>x.cat==='PRESTAMO').reduce((a,x)=>a+x.importe,0))}
