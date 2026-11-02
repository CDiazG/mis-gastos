// Cuentas Claras · Pestañas y mes seleccionado
"use strict";
/* ============ Navegación ============ */
let MES=mesDe(hoy()),TAB='inicio';
function setMes(m){MES=m;F.todos=false;render()}
$('#mPrev').onclick=()=>setMes(addMes(MES,-1));
$('#mNext').onclick=()=>setMes(addMes(MES,1));
$('#mHoy').onclick=()=>setMes(mesDe(hoy()));
$$('.tab[data-t]').forEach(b=>b.onclick=()=>go(b.dataset.t));
/* Móvil: barra inferior con Inicio, Resumen, Añadir, Movimientos y «Más» */
const EN_MAS=['importar','hist','patri','ajustes','ayuda','usuarios','perfil'];
function abrirMas(){
  cerrarMas();
  const it=EN_MAS.filter(t=>t!=='perfil').map(t=>$(`.tab[data-t="${t}"]`)).filter(b=>b&&!b.classList.contains('hide'));
  const d=document.createElement('div');d.id='masSheet';d.innerHTML=`<div class="msfondo"></div><div class="mscaja" role="menu">`+
    it.map(b=>`<button type="button" class="msit${TAB===b.dataset.t?' on':''}" data-t="${b.dataset.t}">${b.querySelector('svg').outerHTML}<span>${b.querySelector('span').textContent}</span>${b.querySelector('.tag')?b.querySelector('.tag').outerHTML:''}</button>`).join('')+
    `<button type="button" class="msit${TAB==='perfil'?' on':''}" data-t="perfil">${$('#uAv').outerHTML.replace('id="uAv"','')}<span>Mi perfil</span></button></div>`;
  document.body.appendChild(d);requestAnimationFrame(()=>d.classList.add('on'));
  $('.msfondo',d).onclick=cerrarMas;
  $$('.msit',d).forEach(b=>b.onclick=()=>{cerrarMas();go(b.dataset.t)});
}
function cerrarMas(){const d=$('#masSheet');if(d)d.remove()}
$('#tabMas').onclick=()=>$('#masSheet')?cerrarMas():abrirMas();
document.addEventListener('keydown',e=>{if(e.key==='Escape')cerrarMas()});
/* Los botones flotantes se apartan al bajar y vuelven al subir */
let _sy=0;
addEventListener('scroll',()=>{const y=scrollY,d=y-_sy;if(Math.abs(d)<8)return;
  document.body.classList.toggle('bajando',d>0&&y>140);_sy=y},{passive:true});
const sumaPct=()=>r2(CATS.reduce((a,c)=>a+(+S.aj.pct[c.id]||0),0));
function go(t){
  if(TAB==='ajustes'&&t!=='ajustes'&&Math.abs(sumaPct()-100)>0.01){
    const s=sumaPct();
    dialog('El presupuesto no suma 100%',`<p>Los porcentajes suman <b>${fmt(s,1)}%</b>. ${s>100?`Te pasas en <b>${fmt(s-100,1)} puntos</b>: baja alguna categoría.`:`Faltan <b>${fmt(100-s,1)} puntos</b> por repartir: súbelos a alguna categoría (por ejemplo, al ahorro).`}</p><p class="small mut">Hasta que no sumen 100% no puedes salir de Ajustes.</p>`,[{t:'Arreglarlo',cls:'pri',fn:()=>{$('#pctTable').scrollIntoView({behavior:'smooth',block:'center'})}}]);
    return;
  }
  TAB=t;$$('.tab[data-t]').forEach(b=>b.classList.toggle('on',b.dataset.t===t));$('#tabMas').classList.toggle('on',EN_MAS.includes(t));document.body.classList.remove('bajando');$('#uWho').classList.toggle('on',t==='perfil');$$('main>section').forEach(s=>s.classList.toggle('on',s.id==='s-'+t));
  const tp=$('#tip');if(tp)tp.classList.remove('on');
  const sec=$('#s-'+t);if(sec){sec.classList.add('anim');clearTimeout(sec._a);sec._a=setTimeout(()=>sec.classList.remove('anim'),900)}
  render()}
function render(){
  refreshCats();
  const act=mesDe(hoy()),esAct=MES===act,estado=esAct?'mes actual':MES<act?'mes pasado':'mes futuro';
  $('#mLabel').innerHTML=`${nombreMes(MES)}<small>${estado}</small>`;
  $('#monthnav').classList.toggle('pasado',!esAct);$('#mHoy').classList.toggle('oculto',esAct);
  $$('.mesTit').forEach(el=>{el.innerHTML=`<span class="mt">${nombreMes(MES)}</span>${esAct?'<span class="tag good">mes actual</span>':`<span class="tag cash">${estado}</span><button class="link mtHoy" type="button">Volver a ${nombreMes(act)}</button>`}`;
    const b=$('.mtHoy',el);if(b)b.onclick=()=>setMes(act)});
  $('#monthnav').classList.toggle('nomes',!(TAB==='resumen'||TAB==='movs'||TAB==='efectivo'));
  $('#fabCash').classList.toggle('hide',TAB==='efectivo'||(NUBE&&!USER)||!pref('fab'));
  if(typeof rChatBtn==='function')rChatBtn();
  ({usuarios:rUsuarios,resumen:rResumen,efectivo:rEfectivo,movs:rMovs,importar:()=>{},hist:rHist,patri:rPatri,ajustes:rAjustes,ayuda:rAyuda,inicio:rInicio,perfil:rPerfil})[TAB]();
}

function pintarCuenta(){if(!USER)return;$('#uName').textContent=USER.nombre;const av=$('#uAv');
  if(USER.foto){av.textContent='';av.style.background=`center/cover url("${USER.foto}")`}else{av.style.background='';av.textContent=(USER.nombre||USER.email||'?').trim().charAt(0).toUpperCase()}$('#uWho').title=USER.nombre+' · '+USER.email}
