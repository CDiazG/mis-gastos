// Cuentas Claras · Pestañas y mes seleccionado
"use strict";
/* ============ Navegación ============ */
let MES=mesDe(hoy()),TAB='resumen';
function setMes(m){MES=m;F.todos=false;render()}
$('#mPrev').onclick=()=>setMes(addMes(MES,-1));
$('#mNext').onclick=()=>setMes(addMes(MES,1));
$('#mHoy').onclick=()=>setMes(mesDe(hoy()));
$$('.tab').forEach(b=>b.onclick=()=>go(b.dataset.t));
const sumaPct=()=>r2(CATS.reduce((a,c)=>a+(+S.aj.pct[c.id]||0),0));
function go(t){
  if(TAB==='ajustes'&&t!=='ajustes'&&Math.abs(sumaPct()-100)>0.01){
    const s=sumaPct();
    dialog('El presupuesto no suma 100%',`<p>Los porcentajes suman <b>${fmt(s,1)}%</b>. ${s>100?`Te pasas en <b>${fmt(s-100,1)} puntos</b>: baja alguna categoría.`:`Faltan <b>${fmt(100-s,1)} puntos</b> por repartir: súbelos a alguna categoría (por ejemplo, al ahorro).`}</p><p class="small mut">Hasta que no sumen 100% no puedes salir de Ajustes.</p>`,[{t:'Arreglarlo',cls:'pri',fn:()=>{$('#pctTable').scrollIntoView({behavior:'smooth',block:'center'})}}]);
    return;
  }
  TAB=t;$$('.tab').forEach(b=>b.classList.toggle('on',b.dataset.t===t));$$('main>section').forEach(s=>s.classList.toggle('on',s.id==='s-'+t));render()}
function render(){
  refreshCats();
  const act=mesDe(hoy()),esAct=MES===act,estado=esAct?'mes actual':MES<act?'mes pasado':'mes futuro';
  $('#mLabel').innerHTML=`${nombreMes(MES)}<small>${estado}</small>`;
  $('#monthnav').classList.toggle('pasado',!esAct);$('#mHoy').classList.toggle('hide',esAct);
  $$('.mesTit').forEach(el=>{el.innerHTML=`<span class="mt">${nombreMes(MES)}</span>${esAct?'<span class="tag good">mes actual</span>':`<span class="tag cash">${estado}</span><button class="link mtHoy" type="button">Volver a ${nombreMes(act)}</button>`}`;
    const b=$('.mtHoy',el);if(b)b.onclick=()=>setMes(act)});
  $('#monthnav').classList.toggle('nomes',!(TAB==='resumen'||TAB==='movs'||TAB==='efectivo'));
  $('#fabCash').classList.toggle('hide',TAB==='efectivo'||(NUBE&&!USER)||!pref('fab'));
  ({usuarios:rUsuarios,resumen:rResumen,efectivo:rEfectivo,movs:rMovs,importar:()=>{},hist:rHist,patri:rPatri,ajustes:rAjustes,ayuda:rAyuda})[TAB]();
}

function pintarCuenta(){if(!USER)return;$('#uName').textContent=USER.nombre;const av=$('#uAv');
  if(USER.foto){av.textContent='';av.style.background=`center/cover url("${USER.foto}")`}else{av.style.background='';av.textContent=(USER.nombre||USER.email||'?').trim().charAt(0).toUpperCase()}$('#uWho').title=USER.nombre+' · '+USER.email}
