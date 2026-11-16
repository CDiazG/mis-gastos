// Fluvi · Reglas de categorías automáticas y cálculos del mes
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
// Sugerencia para un Bizum sin categoría (no se pone sola: es un botón para ponerla de un toque).
// 1) palabras del concepto («cena», «regalo», «gasolina»…); 2) lo que más sueles poner a los Bizum; 3) Restaurantes (lo normal: ajustar una cena).
const BIZUM_PAL=[
 [/ (CENA|CENITA|CENAS|COMIDA|COMIDAS|COMER|CENAR|ALMUERZO|ALMORZAR|DESAYUNO|MERIENDA|BRUNCH|APERITIVO|VERMUT|VERMU|TAPAS|TAPEO|CANAS|CANA|CERVEZA|CERVEZAS|BIRRAS|COPAS|COPA|CAFE|CAFES|PIZZA|PIZZAS|SUSHI|BURGER|HAMBURGUESA|PAELLA|KEBAB|RESTAURANTE|RESTAURANT|BAR|TERRACEO|CINE|ENTRADA|ENTRADAS|CONCIERTO|FIESTA|DISCOTECA) /,'OCIO'],
 [/ (REGALO|REGALOS|REGALITO|CUMPLE|CUMPLEANOS|BODA|BAUTIZO|COMUNION|AMIGO INVISIBLE|FLORES) /,'REGALOS'],
 [/ (GASOLINA|GASOIL|DIESEL|TAXI|UBER|CABIFY|PEAJE|PARKING|COCHE) /,'TRANSPORTE'],
 [/ (VIAJE|HOTEL|AIRBNB|APARTAMENTO|VUELO|VUELOS|BILLETE|BILLETES|TREN|ESCAPADA|CASA RURAL) /,'VIAJES'],
 [/ (SUPER|COMPRA|MERCADONA|LIDL|CARREFOUR) /,'SUPERMERCADO'],
 [/ (ALQUILER|COMUNIDAD) /,'VIVIENDA'],
 [/ (LUZ|AGUA|GAS|INTERNET|WIFI|FIBRA|MOVIL) /,'FACTURAS'],
 [/ (NETFLIX|SPOTIFY|HBO|DISNEY|DAZN|PRIME) /,'SUSCRIPCIONES'],
 [/ (GYM|GIMNASIO|PADEL|PISTA|PARTIDO|FUTBOL|YOGA|PILATES) /,'ACTIVIDADES'],
 [/ (FARMACIA|MEDICO|DENTISTA|FISIO) /,'SALUD'],
 [/ (ROPA|ZAPATILLAS|ZARA) /,'PERSONAL'],
];
function catDisponible(id){
  if(CATS.some(c=>c.id===id))return id;
  if(id==='OCIO'){const r=CATS.find(c=>/RESTAURANT|OCIO|COMIDA|SALIDAS/.test(norm(c.n)));return r?r.id:''}
  if(id==='FACTURAS'&&CATS.some(c=>c.id==='VIVIENDA'))return 'VIVIENDA';
  return '';
}
// Lo que dice el Bizum (el «Concepto: …» del banco o lo que va tras el nombre)
function textoBizum(desc){const s=String(desc||'');const m=s.match(/concepto:?\s*(.+)$/i);return norm(m?m[1]:s)}
function sugerirBizum(x){
  if(!x||x.cat||!isBizum(x.concepto))return null;
  const t=textoBizum(x.concepto);
  for(const [re,c] of BIZUM_PAL){const m=t.match(re);const id=m&&catDisponible(c);if(id)return {c:id,por:'el concepto dice «'+m[1].toLowerCase()+'»'}}
  // lo que más sueles poner a los Bizum (del mismo sentido: los que mandas o los que recibes)
  const cuenta={};for(const y of (S.mov||[]))if(y.cat&&y!==x&&isBizum(y.concepto)&&(y.importe<0)===(x.importe<0)&&CATS.some(c=>c.id===y.cat))cuenta[y.cat]=(cuenta[y.cat]||0)+1;
  const top=Object.entries(cuenta).sort((a,b)=>b[1]-a[1])[0];
  if(top&&top[1]>=2)return {c:top[0],por:'es lo que más sueles poner a los Bizum'};
  const o=catDisponible('OCIO');return o?{c:o,por:'los Bizum suelen ser para ajustar una cena o una comida'}:null;
}
// Botón de la sugerencia (en Movimientos, en el panel del móvil y en Importar)
const botonSug=s=>s?`<button type="button" class="btn sm sugbiz" data-sug="${s.c}" title="Sugerencia: ${esc(s.por)}">✓ ${catI(s.c)}${esc(catN(s.c))}</button>`:'';
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
    if(sinCatX(x)){sinCat++;sinCatImp+=x.importe;by.SINCAT=(by.SINCAT||0)-x.importe;continue}
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
// Frases que cuentan el mes: categoría que se dispara o se modera frente a tu media, ahorro frente al mes anterior y mayor gasto
function frasesMes(m){
  const st=stats(m);if(!st.ms.length)return [];
  const out=[],hoyM=mesDe(hoy()),prev=mesesConDatos().filter(x=>x<m);
  const dias=new Date(+m.slice(0,4),+m.slice(5,7),0).getDate();
  const frac=m===hoyM?Math.min(1,+hoy().slice(8,10)/dias):1;
  const ult=prev.slice(-3);
  if(m===hoyM&&frac>=0.2&&frac<0.97&&st.consumo>0){ // previsión de fin de mes a este ritmo
    const prev_=Math.round(st.consumo/frac/10)*10;
    out.push(st.base>0?(prev_>st.base*1.02?`A este ritmo cerrarás el mes en unos <b>${eur(prev_,0)}</b> de gasto, <b>${eur(prev_-st.base,0)} por encima</b> de tu presupuesto.`:`A este ritmo cerrarás el mes en unos <b>${eur(prev_,0)}</b> de gasto: te quedarías <b>${eur(st.base-prev_,0)} dentro</b> del presupuesto.`):`A este ritmo cerrarás el mes en unos <b>${eur(prev_,0)}</b> de gasto.`);
  }
  if(ult.length>=2&&frac>=0.25){
    let up=null,down=null;
    for(const c of CATS.filter(c=>c.g!=='AHORRO')){
      const media=ult.reduce((a,p)=>a+(stats(p).by[c.id]||0),0)/ult.length,esp=media*frac,real=st.by[c.id]||0,d=real-esp;
      if(media>=30&&real>=esp*1.3&&d>=25&&(!up||d>up.d))up={c,d,p:Math.round((real/esp-1)*100)};
      if(media>=40&&frac>=0.6&&real<=esp*0.6&&-d>=25&&(!down||-d>down.d))down={c,d:-d};
    }
    if(up)out.push(`Llevas un <b>${up.p} % más</b> en ${esc(catN(up.c.id))} que tu media (${eur(up.d,0)} de más).`);
    if(down)out.push(`En ${esc(catN(down.c.id))} vas <b>${eur(down.d,0)} por debajo</b> de tu media.`);
  }
  if(m<hoyM&&prev.length){const pm=prev[prev.length-1],sp=stats(pm);
    if(sp.ingresos>0){const d=r2(st.ahorro-sp.ahorro);if(Math.abs(d)>=20)out.push(d>0?`Ahorraste <b>${eur(d,0)} más</b> que en ${nombreMes(pm)}.`:`Ahorraste <b>${eur(-d,0)} menos</b> que en ${nombreMes(pm)}.`)}}
  if(st.consumo>0&&out.length<3){let top=null;for(const c of CATS.filter(c=>c.g!=='AHORRO')){const v=st.by[c.id]||0;if(v>0&&(!top||v>top.v))top={c,v}}
    if(top&&top.v/st.consumo>=0.25)out.push(`Tu mayor gasto es ${esc(catN(top.c.id))}: <b>${Math.round(top.v/st.consumo*100)} %</b> (${eur(top.v,0)}).`)}
  return out.slice(0,3);
}
// Suscripciones (categoría «Suscripciones»): avisa de las nuevas y de las que suben de precio en el mes m
function avisosSuscripciones(m){
  if(!mesesConDatos().some(x=>x<m))return [];
  const g=new Map();
  for(const x of S.mov){if(x.cat!=='SUSCRIPCIONES'||x.importe>=0)continue;
    const k=norm(x.concepto).replace(/\d+/g,' ').split(' ').filter(w=>w&&!/^(COMPRA|RECIBO|PAGO|CARGO|TARJETA|COM|WWW|HTTPS?)$/.test(w)).slice(0,2).join(' ');if(!k)continue;
    (g.get(k)||g.set(k,[]).get(k)).push(x)}
  const vistas=new Set(S.aj.subVistas||[]),out=[];
  for(const [k,xs] of g){
    xs.sort((a,b)=>a.fecha.localeCompare(b.fecha));
    const ahora=xs.filter(x=>x.mes===m);if(ahora.length!==1)continue; // varios cobros en el mes: no es una cuota fija clara
    const ant=xs.filter(x=>x.mes<m);const nom=ahora[0].concepto.replace(/\s*\d.*$/,'').replace(/^(Compra|Recibo|Pago)\s+/i,'').trim()||k;
    const a=-ahora[0].importe;
    const ult=ant[ant.length-1],mismaMon=ahora[0].mon&&ult&&ult.mon&&ahora[0].mon.c===ult.mon.c; // si cobran en otra moneda, se compara el importe original (el cambio varía)
    if(!ant.length){const id=k+'|nueva|'+m;if(!vistas.has(id))out.push({id,t:`<b>Suscripción nueva:</b> ${esc(nom)} (${eur(a)})`})}
    else{const p=-ult.importe,sube=mismaMon?ahora[0].mon.v>=ult.mon.v+0.5&&ahora[0].mon.v>ult.mon.v*1.02:a>=p+0.5&&a>p*1.02;if(sube){const id=k+'|sube|'+m;if(!vistas.has(id))out.push({id,t:`<b>${esc(nom)}</b> ha subido de ${eur(p)} a ${eur(a)}`})}}
  }
  return out;
}
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
  const cand=S.mov.filter(x=>!x.par&&(x.cat==='TRASPASO'||sinCatX(x)));
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

// ---- «¿Qué pasaría si…?»: simulador sobre la media de los últimos meses (no toca ningún dato) ----
function mediasUltimos(){
  const hoyM=mesDe(hoy());let ms=[];
  for(let k=1;k<=6&&ms.length<3;k++){const st=stats(addMes(hoyM,-k));if(st.ms.length)ms.push(st)}
  if(!ms.length){const st=stats(hoyM);if(st.ms.length)ms=[st]}
  if(!ms.length)return null;
  const med=f=>ms.reduce((a,st)=>a+f(st),0)/ms.length,by={};CATS.forEach(c=>by[c.id]=med(st=>st.by[c.id]||0));
  return {n:ms.length,ing:med(st=>st.ingresos),cons:med(st=>st.consumo),dz:med(st=>st.diezmo),by};
}
function simular({cat,pct,gasto,ingreso}){
  const b=mediasUltimos();if(!b)return null;
  const cm=cat?b.by[cat]||0:0,delta=cm*(pct||0)/100-(gasto||0)+(ingreso||0),antes=b.ing-b.cons-b.dz;
  return {n:b.n,antes,despues:antes+delta,delta,anual:delta*12,catMedia:cm};
}
function abrirSimulador(){
  const b=mediasUltimos();
  if(!b){dialog('¿Qué pasaría si…?','<p>Aún no tengo suficientes movimientos para calcular tu media. Importa un extracto o apunta unos gastos y vuelve a probar.</p>',[{t:'Entendido',cls:'pri'}]);return}
  dialog('¿Qué pasaría si…?',`<p class="small mut" style="margin-top:0">Se calcula con tu media de los últimos ${b.n} ${b.n===1?'mes':'meses'}. No cambia ningún dato.</p>
    <div class="formgrid"><label for="smC">Gasto que quieres cambiar</label><select id="smC"><option value="">Ninguno</option>${CATS.filter(c=>c.g!=='AHORRO').map(c=>`<option value="${c.id}">${esc(c.n)}</option>`).join('')}</select>
    <label for="smP">Gastar menos (%)</label><input type="text" id="smP" inputmode="decimal" placeholder="20">
    <label for="smG">Gasto nuevo al mes (€)</label><input type="text" id="smG" inputmode="decimal" placeholder="0">
    <label for="smI">Ingreso extra al mes (€)</label><input type="text" id="smI" inputmode="decimal" placeholder="0"></div>
    <div id="smOut" class="alert info" style="margin-top:12px" aria-live="polite"></div>`,[{t:'Cerrar',cls:'pri'}]);
  const pintar=()=>{const n=x=>{const v=parseNum($(x).value);return isFinite(v)?v:0},r=simular({cat:$('#smC').value,pct:n('#smP'),gasto:n('#smG'),ingreso:n('#smI')});
    $('#smOut').innerHTML=`Ahorro medio al mes: <b>${eur(r.antes,0)}</b> → <b>${eur(r.despues,0)}</b>${Math.abs(r.delta)>=1?` (<span class="${r.delta>0?'pos':'neg'}">${r.delta>0?'+':'−'}${eur(Math.abs(r.delta),0)}</span>)`:''}<br>En un año: <b class="${r.anual>0?'pos':r.anual<0?'neg':''}">${r.anual>0?'+':r.anual<0?'−':''}${eur(Math.abs(r.anual),0)}</b>`};
  $$('#smC,#smP,#smG,#smI').forEach(e=>e.oninput=pintar);pintar();
}
