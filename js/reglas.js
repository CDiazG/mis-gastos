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
  if(!diezmoOn()||!S.aj.diezmoAuto||!pct||(S.aj.diezmoDesde&&m<S.aj.diezmoDesde))return null;
  const debido=r2(st.ingresos*pct/100),pagado=r2(st.diezmo);return {pct,debido,pagado,pendiente:r2(Math.max(0,debido-pagado))}}
// Persona de un préstamo: la guardada o, si no, el nombre del Bizum o el concepto
function personaDe(x){if(x.persona)return x.persona;const m=String(x.concepto||'').match(/BIZUM (?:A|DE) (.+)$/i);return (m?m[1]:x.concepto||'Sin nombre').trim()}
function prestamosPorPersona(){const g={};
  for(const x of S.mov.filter(x=>x.cat==='PRESTAMO')){const p=personaDe(x),k=norm(p).trim();const o=g[k]||(g[k]={persona:p,prestado:0,devuelto:0,movs:[]});
    if(x.importe<0)o.prestado+=-x.importe;else o.devuelto+=x.importe;o.movs.push(x)}
  return Object.values(g).map(o=>({...o,prestado:r2(o.prestado),devuelto:r2(o.devuelto),pendiente:r2(o.prestado-o.devuelto)})).sort((a,b)=>b.pendiente-a.pendiente)}
function prestamosPendientes(){return r2(-S.mov.filter(x=>x.cat==='PRESTAMO').reduce((a,x)=>a+x.importe,0))}

// Presupuesto de una categoría en un mes. Si la categoría «acumula», lo que no se gastó en los meses
// anteriores (desde que se activó) se suma; si un mes te pasas, se resta de lo acumulado (nunca baja de 0).
/* ---- Traspasos entre mis cuentas ----
   x.otra = la otra cuenta del traspaso (a la que va el dinero si sale, o de la que viene si entra); '' = sin especificar.
   x.par = el movimiento de la otra cuenta cuando están los dos extractos. Un traspaso no es gasto ni resta del ahorro. */
const cuentaDe=x=>x.metodo==='efectivo'?'Efectivo':(x.cuenta||'');
const trasDesde=x=>x.importe<0?cuentaDe(x):(x.otra||''),trasHacia=x=>x.importe<0?(x.otra||''):cuentaDe(x);
const diasEntre=(a,b)=>Math.abs(new Date(a+'T12:00')-new Date(b+'T12:00'))/864e5;
// Une la salida de una cuenta con la entrada en otra (mismo importe, pocos días de diferencia)
function emparejarTraspasos(){
  let n=0;const ids=new Set(S.mov.map(x=>x.id));
  for(const x of S.mov)if(x.par&&!ids.has(x.par)){delete x.par}
  const cand=S.mov.filter(x=>!x.par&&(x.cat==='TRASPASO'||!x.cat));
  for(const a of cand){
    if(a.par||a.cat!=='TRASPASO')continue;
    const b=cand.find(b=>!b.par&&b!==a&&Math.abs(b.importe+a.importe)<0.005&&norm(cuentaDe(b))!==norm(cuentaDe(a))&&diasEntre(a.fecha,b.fecha)<=4
      &&(!a.otra||norm(a.otra)===norm(cuentaDe(b)))&&(!b.otra||norm(b.otra)===norm(cuentaDe(a))));
    if(!b)continue;
    a.par=b.id;b.par=a.id;b.cat='TRASPASO';a.otra=cuentaDe(b);b.otra=cuentaDe(a);n++;
  }
  return n;
}
function desemparejar(x){const b=x.par&&S.mov.find(y=>y.id===x.par);if(b){delete b.par}delete x.par}
// Cuentas sin extracto (una hucha, el broker, el oro…): su saldo es el último que pusiste más lo que ha entrado
// o salido después con traspasos o pagos desde ella. Las que tienen extracto usan el saldo del banco.
const esCuentaManual=c=>!!c&&!c.banco&&!c.cartera;
function saldoCuenta(c){
  if(!c)return null;if(!esCuentaManual(c))return c.v;
  let v=c.v||0,mov=false;const desde=c.v!=null&&c.f?c.f:'';
  for(const x of S.mov){if(desde&&x.fecha<=desde)continue;
    if(x.cat==='TRASPASO'&&x.otra&&norm(x.otra)===norm(c.n)){v-=x.importe;mov=true}
    else if(x.metodo!=='efectivo'&&x.cuenta&&norm(x.cuenta)===norm(c.n)){v+=x.importe;mov=true}}
  return c.v==null&&!mov?null:r2(v);
}
// Cada categoría va en % (de la base del mes) o en € fijos; el Ahorro es lo que queda sin repartir.
const enEur=id=>!!(S.aj.eur&&S.aj.eur[id]!=null&&id!=='AHORRO'&&id!=='DIEZMO');
const hayEur=()=>CATS.some(c=>enEur(c.id));
const catsReparto=()=>CATS.filter(c=>c.id!=='AHORRO'&&(c.id!=='DIEZMO'||diezmoOn()));
function presFijo(id,base){return enEur(id)?(+S.aj.eur[id]||0):base*(+S.aj.pct[id]||0)/100}
function repartido(base){return catsReparto().reduce((a,c)=>a+presFijo(c.id,base),0)}
const sumaOtrosPct=()=>r2(catsReparto().filter(c=>!enEur(c.id)).reduce((a,c)=>a+(+S.aj.pct[c.id]||0),0));
function presAhorro(base){return Math.max(0,base-repartido(base))}
function pctAhorro(base){return base>0?presAhorro(base)/base*100:Math.max(0,100-sumaOtrosPct())}
const pctCat=(id,base)=>id==='AHORRO'?pctAhorro(base):enEur(id)?(base>0?(+S.aj.eur[id]||0)/base*100:0):(+S.aj.pct[id]||0);
// base de referencia para convertir entre % y € (la del mes en curso o, si aún no hay, la cantidad fija o los últimos ingresos)
function baseRef(){const b=stats(mesDe(hoy())).base;if(b>0)return b;if(S.aj.base==='fija'&&S.aj.baseFija>0)return +S.aj.baseFija;
  for(let k=1;k<=3;k++){const s=stats(addMes(mesDe(hoy()),-k));if(s.base>0)return s.base}return 0}
// guarda el % de ahorro (lo que sobra) para que el resto del programa lo tenga a mano
function syncAhorro(){S.aj.pct.AHORRO=r2(pctAhorro(baseRef()))}
function presupuestoCat(m,id,st){
  st=st||stats(m);const base=r2(id==='AHORRO'?presAhorro(st.base):presFijo(id,st.base));
  const desde=S.aj.acumula&&S.aj.acumula[id];if(!desde||m<=desde)return {p:base,base,extra:0};
  let carry=0;for(let k=desde;k<m;k=addMes(k,1)){const s=stats(k);carry=Math.max(0,carry+presFijo(id,s.base)-(s.by[id]||0))}
  carry=r2(carry);return {p:r2(base+carry),base,extra:carry};
}
