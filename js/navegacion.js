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
/* ---- Apartados de Ajustes y Ayuda: menú + un apartado cada vez (en el ordenador, el menú a la izquierda) ---- */
const APARTADOS={
  ajustes:[
    {id:'presupuesto',t:'Presupuesto y categorías',d:'Porcentajes, nombres, orden y categorías nuevas',ic:'<path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M15 3.4A9 9 0 0 1 20.6 9H15z"/>'},
    {id:'reglas',t:'Reglas de categorías',d:'Qué categoría se pone según el concepto del banco',ic:'<path d="M4 6h16M4 12h10M4 18h7"/><path d="m16 16 2 2 4-4"/>'},
    {id:'fijos',t:'Gastos fijos',d:'Recibos que llegan cada mes y avisos si cambian',ic:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'},
    {id:'nomina',t:'Nómina',d:'Cómo se reconoce y a qué mes cuenta',ic:'<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9.5v5M18 9.5v5"/>'},
    {id:'diezmo',t:'Diezmo',d:'Activarlo o quitarlo y cómo se calcula',ic:'<path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10z"/>'},
    {id:'clasif',t:'Clasificación automática',d:'Cómo aprende las categorías (Bizum, reglas)',ic:'<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/><circle cx="12" cy="12" r="3"/>'},
    {id:'_perfil',t:'Apariencia y preferencias',d:'Colores, tema oscuro, foto y avisos (en Mi perfil)',ic:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',ir:'perfil'},
    {id:'copia',t:'Copias de seguridad',d:'Guardar o restaurar tus datos e historial del Excel',ic:'<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 17v3h16v-3"/>'},
    {id:'instalar',t:'Instalar la app',d:'Tenerla en el móvil o en el escritorio',ic:'<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>'},
  ],
  ayuda:[
    {id:'faq',t:'Preguntas frecuentes',d:'Las dudas más habituales, con atajos',ic:'<circle cx="12" cy="12" r="9"/><path d="M9.6 9.2a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.6"/><path d="M12 17h.01" stroke-width="2.6"/>'},
    {id:'privacidad',t:'Privacidad',d:'Qué se guarda y quién puede verlo',ic:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'},
    {id:'foro',t:'Foro',d:'Preguntas y trucos entre usuarios',ic:'<path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.2A8 8 0 1 1 21 12z"/>'},
    {id:'sugerencias',t:'Sugerencias y quejas',d:'Escríbele al administrador',ic:'<path d="M4 4h16v12H8l-4 4z"/><path d="M8 9h8M8 12h5"/>'},
    {id:'novedades',t:'Novedades',d:'Qué trae cada versión',ic:'<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>'},
  ]};
const SUB={ajustes:'',ayuda:''};
const esMovil=()=>matchMedia('(max-width:760px)').matches;
function pintarApartado(t){
  const sec=$('#s-'+t);if(!sec||!APARTADOS[t])return;
  const L=APARTADOS[t],sub=SUB[t]||(esMovil()?'':L[0].id),it=L.find(x=>x.id===sub);
  sec.classList.toggle('apsub',!!sub);sec.classList.toggle('apmen',!sub);
  $$('.apcont>[data-ap]',sec).forEach(c=>c.classList.toggle('on',c.dataset.ap===sub));
  const m=$('.apmenu',sec);
  m.innerHTML=L.map(x=>`<button type="button" class="apit${x.id===sub?' on':''}" data-ap="${x.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${x.ic}</svg><span><b>${x.t}</b><small>${x.d}</small></span><span class="apch" aria-hidden="true">›</span></button>`).join('');
  $$('.apit',m).forEach(b=>b.onclick=()=>{const x=L.find(y=>y.id===b.dataset.ap);if(x.ir){go(x.ir);return}irApartado(t,x.id)});
  const nom={ajustes:'Ajustes',ayuda:'Ayuda'}[t];
  $('.migas',sec).innerHTML=sub&&it?`<button type="button" class="link" data-mg="1">${nom}</button><span aria-hidden="true">›</span><b>${it.t}</b>`:'';
  const mg=$('.migas [data-mg]',sec);if(mg)mg.onclick=()=>irApartado(t,'');
}
function irApartado(t,sub,{hist=false}={}){
  if(TAB!==t){go(t,{sub,hist});return}
  SUB[t]=sub;pintarApartado(t);if(!hist)navGuardar();scrollTo(0,0);
}
// Abre el apartado en el que está un elemento (para los atajos de Ayuda y la guía de Rufo)
function revelar(el){if(!el)return;const c=el.closest('[data-ap]'),sec=el.closest('section.conap');if(!c||!sec)return;const t=sec.id.slice(2);if(SUB[t]!==c.dataset.ap||TAB!==t){SUB[t]=c.dataset.ap;if(TAB===t){pintarApartado(t);navGuardar()}}}
addEventListener('resize',()=>{if(APARTADOS[TAB])pintarApartado(TAB)});

/* ---- Botón «atrás» del móvil o del navegador ----
   Niveles: 1 Inicio · 2 una pestaña · 3 un apartado de Ajustes/Ayuda (en el móvil). Atrás sube un nivel;
   desde Inicio avisa y, si lo pulsas otra vez enseguida, sale de la app. Si hay algo abierto, primero lo cierra. */
let NAV_ON=false,NAV_CUR=null,NAV_PEND=null,NAV_SALIR=0;
const nivelDe=(t,sub)=>t==='inicio'?1:sub&&esMovil()?3:2;
function navInit(){if(NAV_ON)return;NAV_ON=true;
  NAV_CUR={n:1,t:'inicio',sub:''};
  history.replaceState({n:0},'');history.pushState(NAV_CUR,'');
}
function navGuardar(){
  if(!NAV_ON)return;
  const sub=SUB[TAB]||'',st={n:nivelDe(TAB,sub),t:TAB,sub};
  const cur=NAV_CUR||{n:1};
  if(st.n>cur.n)history.pushState(st,'');
  else if(st.n===cur.n)history.replaceState(st,'');
  else{NAV_PEND=st;history.go(st.n-cur.n);return}
  NAV_CUR=st;
}
function cerrarAbierto(){
  if($('#masSheet')){cerrarMas();return true}
  const d=$('#dlg');if(d&&d.open){d.close();return true}
  const rp=$('#rufoPanel');if(rp&&!rp.classList.contains('hide')&&typeof abrirChat==='function'){abrirChat(false);return true}
  return false;
}
addEventListener('popstate',e=>{
  if(!NAV_ON)return;
  const st=e.state||{n:0};
  if(NAV_PEND){const p=NAV_PEND;NAV_PEND=null;history.replaceState(p,'');NAV_CUR=p;return}
  if(cerrarAbierto()){history.pushState(NAV_CUR,'');return}
  if(st.n===0){
    if(Date.now()-NAV_SALIR<2200){NAV_SALIR=0;history.back();return}
    NAV_SALIR=Date.now();toast('Pulsa otra vez atrás para salir');
    NAV_CUR={n:1,t:'inicio',sub:''};history.pushState(NAV_CUR,'');
    if(TAB!=='inicio')go('inicio',{hist:true});return}
  const antes=TAB;
  if(go(st.t,{sub:st.sub||'',hist:true})===false){history.pushState(NAV_CUR,'');return}
  NAV_CUR=st;
});
function avisoPct(){const s=sumaPct();
  dialog('El presupuesto no suma 100%',`<p>Los porcentajes suman <b>${fmt(s,1)}%</b>. ${s>100?`Te pasas en <b>${fmt(s-100,1)} puntos</b>: baja alguna categoría.`:`Faltan <b>${fmt(100-s,1)} puntos</b> por repartir: súbelos a alguna categoría (por ejemplo, al ahorro).`}</p><p class="small mut">Hasta que no sumen 100% no puedes salir de Ajustes.</p>`,[{t:'Arreglarlo',cls:'pri',fn:()=>{irApartado('ajustes','presupuesto');setTimeout(()=>$('#pctTable').scrollIntoView({behavior:'smooth',block:'center'}),60)}}]);
}
function go(t,{sub,hist=false}={}){
  if(TAB==='ajustes'&&t!=='ajustes'&&Math.abs(sumaPct()-100)>0.01){avisoPct();return false}
  if(APARTADOS[t])SUB[t]=sub!==undefined?sub:'';
  TAB=t;$$('.tab[data-t]').forEach(b=>b.classList.toggle('on',b.dataset.t===t));$('#tabMas').classList.toggle('on',EN_MAS.includes(t));document.body.classList.remove('bajando');$('#uWho').classList.toggle('on',t==='perfil');$$('main>section').forEach(s=>s.classList.toggle('on',s.id==='s-'+t));
  const tp=$('#tip');if(tp)tp.classList.remove('on');
  const sec=$('#s-'+t);if(sec){sec.classList.add('anim');clearTimeout(sec._a);sec._a=setTimeout(()=>sec.classList.remove('anim'),900)}
  if(APARTADOS[t])pintarApartado(t);
  if(!hist)navGuardar();
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
