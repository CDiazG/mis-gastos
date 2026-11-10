// Cuentas Claras · Pestañas y mes seleccionado
"use strict";
/* ============ Navegación ============ */
let MES=mesDe(hoy()),TAB='resumen';
function setMes(m){MES=m;F.todos=false;render()}
$('#mPrev').onclick=()=>setMes(addMes(MES,-1));
$('#mNext').onclick=()=>setMes(addMes(MES,1));
$('#mHoy').onclick=()=>setMes(mesDe(hoy()));
/* Calendario de meses: al tocar el nombre del mes, todos los meses por año (con un punto los que tienen datos) */
function abrirMesPicker(){
  if($('#mesPicker')){cerrarMesPicker();return}
  const conDatos=new Set(S.mov.map(x=>x.mes)),act=mesDe(hoy());
  const anios=[...new Set([...conDatos].map(m=>m.slice(0,4)).concat(act.slice(0,4)))].sort().reverse();
  let y=MES.slice(0,4);
  const d=document.createElement('div');d.id='mesPicker';d.setAttribute('role','dialog');d.setAttribute('aria-label','Elegir mes');
  const pintar=()=>{d.innerHTML=`<div class="mpfondo"></div><div class="mpcaja"><div class="mphead"><button type="button" class="btn sm icon" data-y="-1" ${y<=anios[anios.length-1]?'disabled':''} aria-label="Año anterior">‹</button><b>${y}</b><button type="button" class="btn sm icon" data-y="1" ${y>=anios[0]?'disabled':''} aria-label="Año siguiente">›</button></div>
    <div class="mpgrid">${MESES.map((n,i)=>{const m=y+'-'+String(i+1).padStart(2,'0');return `<button type="button" class="mpm${m===MES?' on':''}${m===act?' hoy':''}" data-m="${m}">${n.slice(0,3)}${conDatos.has(m)?'<i></i>':''}</button>`}).join('')}</div>
    <div class="mppie"><span class="small mut"><i class="mpdot"></i> con movimientos</span><button type="button" class="btn sm" data-m="${act}">Ir a hoy</button></div></div>`;
    $('.mpfondo',d).onclick=cerrarMesPicker;
    $$('[data-y]',d).forEach(b=>b.onclick=()=>{y=String(+y+ +b.dataset.y);pintar()});
    $$('[data-m]',d).forEach(b=>b.onclick=()=>{cerrarMesPicker();setMes(b.dataset.m)});
    const r=$('#monthnav').getBoundingClientRect(),c=$('.mpcaja',d);if(!esMovil()){c.style.left=Math.max(8,r.left+r.width/2-150)+'px';c.style.top=(r.bottom+6)+'px'}};
  pintar();document.body.appendChild(d);requestAnimationFrame(()=>d.classList.add('on'));
}
function cerrarMesPicker(){const d=$('#mesPicker');if(d)d.remove()}
$('#mLabel').onclick=abrirMesPicker;$('#mLabel').setAttribute('role','button');$('#mLabel').tabIndex=0;$('#mLabel').title='Elegir mes';
$('#mLabel').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();abrirMesPicker()}};
document.addEventListener('keydown',e=>{if(e.key==='Escape')cerrarMesPicker()});
/* En el móvil, deslizar a los lados en el Resumen o en Movimientos cambia de mes */
(()=>{let x0=null,y0=0,t0=0;
  const zona=e=>{const s=e.target.closest('#s-resumen,#s-movs');if(!s)return false;
    return !e.target.closest('input,select,textarea,button,.tablewrap,.apchips,dialog,svg,.rtable,#movTable')};
  document.addEventListener('touchstart',e=>{if(e.touches.length!==1||!zona(e)){x0=null;return}x0=e.touches[0].clientX;y0=e.touches[0].clientY;t0=Date.now()},{passive:true});
  document.addEventListener('touchend',e=>{if(x0==null)return;const t=e.changedTouches[0],dx=t.clientX-x0,dy=t.clientY-y0;x0=null;
    if(Date.now()-t0>700||Math.abs(dx)<70||Math.abs(dx)<Math.abs(dy)*2)return;
    setMes(addMes(MES,dx<0?1:-1));const s=$('#s-'+TAB);if(s){s.classList.remove('desliza-i','desliza-d');void s.offsetWidth;s.classList.add(dx<0?'desliza-i':'desliza-d')}},{passive:true});
})();
$$('.tab[data-t]').forEach(b=>b.onclick=()=>go(b.dataset.t));
document.addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(b)go(b.dataset.go)});
/* Ordenador: la columna lateral empieza justo debajo de la cabecera */
const _hh=()=>document.documentElement.style.setProperty('--hh',($('header').offsetHeight)+'px');_hh();addEventListener('resize',_hh);if(window.ResizeObserver)new ResizeObserver(_hh).observe($('header'));
/* Móvil: barra inferior con Inicio, Resumen, Añadir, Movimientos y «Más» */
const EN_MAS=['hist','ajustes','ayuda','usuarios','perfil'];
const TAB_DE={patri:'hist',importar:'movs'}; // pestañas que viven dentro de otra de la barra
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
// lo repartido + el ahorro (lo que sobra): siempre 100 salvo que te pases
const sumaPct=()=>{const b=baseRef();return r2(b>0?repartido(b)/b*100+pctAhorro(b):sumaOtrosPct()+pctAhorro(0))};
// solo bloquea salir de Ajustes si, todo en %, te pasas del 100 %
const presupuestoImposible=()=>!hayEur()&&sumaOtrosPct()>100.01;
/* ---- Apartados de Ajustes y Ayuda: menú + un apartado cada vez (en el ordenador, el menú a la izquierda) ---- */
const APARTADOS={
  ajustes:[
    {id:'presupuesto',t:'Presupuesto y categorías',d:'Porcentajes, nombres, orden y categorías nuevas',ic:'<path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M15 3.4A9 9 0 0 1 20.6 9H15z"/>'},
    {id:'reglas',t:'Reglas de categorías',d:'Qué categoría se pone según el concepto del banco',ic:'<path d="M4 6h16M4 12h10M4 18h7"/><path d="m16 16 2 2 4-4"/>'},
    {id:'fijos',t:'Gastos fijos',d:'Recibos que llegan cada mes y avisos si cambian',ic:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'},
    {id:'nomina',t:'Nómina',d:'Cómo se reconoce y a qué mes cuenta',ic:'<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9.5v5M18 9.5v5"/>'},
    {id:'diezmo',t:'Diezmo',d:'Activarlo o quitarlo y cómo se calcula',ic:'<path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10z"/>'},
    {id:'clasif',t:'Clasificación automática',d:'Cómo aprende las categorías (Bizum, reglas)',ic:'<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/><circle cx="12" cy="12" r="3"/>'},
    {id:'_perfil',t:'Apariencia y avisos',d:'Colores, tema oscuro y qué avisos ver (en Mi perfil)',ic:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',ir:'perfil',sub:'apariencia'},
    {id:'copia',t:'Copias de seguridad',d:'Guardar o restaurar tus datos e historial del Excel',ic:'<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 17v3h16v-3"/>'},
    {id:'instalar',t:'Instalar la app',d:'Tenerla en el móvil o en el escritorio',ic:'<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>'},
  ],
  ayuda:[
    {id:'faq',t:'Preguntas frecuentes',d:'Las dudas más habituales, con atajos',ic:'<circle cx="12" cy="12" r="9"/><path d="M9.6 9.2a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.6"/><path d="M12 17h.01" stroke-width="2.6"/>'},
    {id:'privacidad',t:'Privacidad',d:'Qué se guarda y quién puede verlo',ic:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'},
    {id:'foro',t:'Foro',d:'Preguntas y trucos entre usuarios',ic:'<path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.2A8 8 0 1 1 21 12z"/>'},
    {id:'sugerencias',t:'Sugerencias y quejas',d:'Escríbele al administrador',ic:'<path d="M4 4h16v12H8l-4 4z"/><path d="M8 9h8M8 12h5"/>'},
    {id:'novedades',t:'Novedades',d:'Qué trae cada versión',ic:'<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>'},
  ],
  perfil:[
    {id:'datos',t:'Tus datos',d:'Foto, nombre, contraseña y borrar tus datos',ic:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'},
    {id:'apariencia',t:'Apariencia',d:'Colores, tema claro u oscuro, animaciones y botones',ic:'<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor"/>'},
    {id:'avisos',t:'Avisos y Resumen',d:'Qué avisos y tarjetas quieres ver',ic:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>'},
    {id:'actividad',t:'Tu actividad y guía',d:'Lo que llevas apuntado y volver a ver la guía',ic:'<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>'},
  ],
  // el histórico va con pestañas internas (chips) en vez de menú
  hist:[
    {id:'evolucion',t:'Evolución'},{id:'meses',t:'Mes a mes'},{id:'categorias',t:'Por categoría'},{id:'comparar',t:'Frente al año pasado'},{id:'etiquetas',t:'Etiquetas'},
  ]};
const SUB={ajustes:'',ayuda:'',perfil:'',hist:''};
const esChips=t=>t==='hist';
const esMovil=()=>matchMedia('(max-width:760px)').matches;
function pintarApartado(t){
  const sec=$('#s-'+t);if(!sec||!APARTADOS[t])return;
  const L=APARTADOS[t],sub=SUB[t]||(esMovil()&&!esChips(t)?'':L[0].id),it=L.find(x=>x.id===sub);
  if(esChips(t)){
    $$('.apcont>[data-ap]',sec).forEach(c=>c.classList.toggle('on',c.dataset.ap===sub));
    const m=$('.apchips',sec);m.innerHTML=L.map(x=>`<button type="button" class="apchip${x.id===sub?' on':''}" data-ap="${x.id}" aria-pressed="${x.id===sub}">${x.t}</button>`).join('');
    $$('.apchip',m).forEach(b=>b.onclick=()=>irApartado(t,b.dataset.ap));
    const on=$('.apchip.on',m);if(on&&m.scrollWidth>m.clientWidth)m.scrollLeft=on.offsetLeft-m.clientWidth/2+on.offsetWidth/2;
    return}
  sec.classList.toggle('apsub',!!sub);sec.classList.toggle('apmen',!sub);
  $$('.apcont>[data-ap]',sec).forEach(c=>c.classList.toggle('on',c.dataset.ap===sub));
  const m=$('.apmenu',sec);
  m.innerHTML=L.map(x=>`<button type="button" class="apit${x.id===sub?' on':''}" data-ap="${x.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${x.ic}</svg><span><b>${x.t}</b><small>${x.d}</small></span><span class="apch" aria-hidden="true">›</span></button>`).join('');
  $$('.apit',m).forEach(b=>b.onclick=()=>{const x=L.find(y=>y.id===b.dataset.ap);if(x.ir){go(x.ir,{sub:x.sub});return}irApartado(t,x.id)});
  const nom={ajustes:'Ajustes',ayuda:'Ayuda',perfil:'Mi perfil'}[t];
  $('.migas',sec).innerHTML=sub&&it?`<button type="button" class="link" data-mg="1">${nom}</button><span aria-hidden="true">›</span><b>${it.t}</b>`:'';
  const mg=$('.migas [data-mg]',sec);if(mg)mg.onclick=()=>irApartado(t,'');
}
function irApartado(t,sub,{hist=false}={}){
  if(TAB!==t){go(t,{sub,hist});return}
  SUB[t]=sub;pintarApartado(t);if(!hist)navGuardar();requestAnimationFrame(marcarDeslizables);
  if(t==='hist'&&typeof rHist==='function')rHist(); // las gráficas se dibujan con el ancho que tienen al verse
  if(esChips(t)){const n=$('#s-'+t+' .apchips');if(n&&n.getBoundingClientRect().top<0)n.scrollIntoView({block:'start'})}else scrollTo(0,0);
}
// Abre el apartado en el que está un elemento (para los atajos de Ayuda y la guía de Rufo)
function revelar(el){if(!el)return;const c=el.closest('[data-ap]'),sec=el.closest('section.conap');if(!c||!sec)return;const t=sec.id.slice(2);if(SUB[t]!==c.dataset.ap||TAB!==t){SUB[t]=c.dataset.ap;if(TAB===t){pintarApartado(t);navGuardar()}}}
addEventListener('resize',()=>{if(APARTADOS[TAB])pintarApartado(TAB)});

/* ---- Botón «atrás» del móvil o del navegador ----
   Niveles: 1 Resumen · 2 una pestaña · 3 un apartado de Ajustes/Ayuda (en el móvil). Atrás sube un nivel;
   desde Resumen avisa y, si lo pulsas otra vez enseguida, sale de la app. Si hay algo abierto, primero lo cierra. */
let NAV_ON=false,NAV_CUR=null,NAV_PEND=null,NAV_SALIR=0;
const nivelDe=(t,sub)=>t==='resumen'?1:sub&&esMovil()&&!esChips(t)?3:2;
function navInit(){if(NAV_ON)return;NAV_ON=true;
  NAV_CUR={n:1,t:'resumen',sub:''};
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
  if($('#mesPicker')){cerrarMesPicker();return true}
  if($('#movPanel')){cerrarPanelMov();return true}
  if($('#masSheet')){cerrarMas();return true}
  if($('#cuentaMenu')&&!$('#cuentaMenu').classList.contains('hide')){cerrarCuenta();return true}
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
    NAV_CUR={n:1,t:'resumen',sub:''};history.pushState(NAV_CUR,'');
    if(TAB!=='resumen')go('resumen',{hist:true});return}
  const antes=TAB;
  if(go(st.t,{sub:st.sub||'',hist:true})===false){history.pushState(NAV_CUR,'');return}
  NAV_CUR=st;
});
function avisoPct(){const s=sumaOtrosPct();
  dialog('Te pasas del 100 %',`<p>Lo que has repartido suma <b>${fmt(s,1)}%</b>: te pasas en <b>${fmt(s-100,1)} puntos</b> y no queda nada para el ahorro. Baja alguna categoría.</p><p class="small mut">Hasta que no lo arregles no puedes salir de Ajustes.</p>`,[{t:'Arreglarlo',cls:'pri',fn:()=>{irApartado('ajustes','presupuesto');setTimeout(()=>$('#pctTable').scrollIntoView({behavior:'smooth',block:'center'}),60)}}]);
}
function go(t,{sub,hist=false}={}){
  if(TAB==='ajustes'&&t!=='ajustes'&&presupuestoImposible()){avisoPct();return false}
  if(APARTADOS[t])SUB[t]=sub!==undefined?sub:'';
  _hh();TAB=t;$$('.tab[data-t]').forEach(b=>b.classList.toggle('on',b.dataset.t===(TAB_DE[t]||t)));$$('.evseg button').forEach(b=>b.classList.toggle('on',b.dataset.go===t));$('#tabMas').classList.toggle('on',EN_MAS.includes(TAB_DE[t]||t));document.body.classList.remove('bajando');$('#uWho').classList.toggle('on',t==='perfil');$$('main>section').forEach(s=>s.classList.toggle('on',s.id==='s-'+t));
  const tp=$('#tip');if(tp)tp.classList.remove('on');
  const sec=$('#s-'+t);if(sec){sec.classList.add('anim');clearTimeout(sec._a);sec._a=setTimeout(()=>sec.classList.remove('anim'),900)}
  if(APARTADOS[t])pintarApartado(t);
  if(!hist)navGuardar();
  render()}
// Tablas que no caben en el móvil: sombra a la derecha y un aviso «Desliza» hasta que la mueves
function marcarDeslizables(){
  $$('.deslizaHint').forEach(h=>{const w=h.nextElementSibling;if(!w||!w.offsetParent)h.classList.add('hide')});
  $$('section.on .tablewrap').forEach(w=>{if(!w.offsetParent)return;
    const mas=w.scrollWidth>w.clientWidth+2;w.classList.toggle('hayMas',mas);
    let h=w.previousElementSibling;if(!(h&&h.classList.contains('deslizaHint'))){h=null}
    if(mas&&!h&&!w._visto){h=document.createElement('div');h.className='deslizaHint';h.innerHTML='<span>Desliza para ver más columnas</span><i aria-hidden="true">→</i>';w.before(h)}
    if(h)h.classList.toggle('hide',!mas||!!w._visto);
    const fin=()=>w.classList.toggle('fin',w.scrollLeft+w.clientWidth>=w.scrollWidth-2);fin();
    if(!w._oyente){w._oyente=1;w.addEventListener('scroll',()=>{fin();if(w.scrollLeft>8&&!w._visto){w._visto=1;const hh=w.previousElementSibling;if(hh&&hh.classList.contains('deslizaHint'))hh.classList.add('hide')}},{passive:true})}
  });
}
addEventListener('resize',()=>requestAnimationFrame(marcarDeslizables));
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
  ({usuarios:rUsuarios,resumen:()=>{rResumen();rInicio()},efectivo:rEfectivo,movs:rMovs,importar:()=>{},hist:()=>{rHist();rInicio()},patri:rPatri,ajustes:rAjustes,ayuda:rAyuda,perfil:rPerfil})[TAB]();
  requestAnimationFrame(marcarDeslizables);
}

function pintarCuenta(){if(!USER)return;$('#uName').textContent=USER.nombre;$('#uCorreo').textContent=USER.email||'';const av=$('#uAv');
  const ini=(USER.nombre||USER.email||'?').trim().split(/\s+/).slice(0,2).map(s=>s.charAt(0)).join('').toUpperCase();
  [av,$('#uAv2')].forEach(a=>{if(USER.foto){a.textContent='';a.style.background=`center/cover url("${USER.foto}")`}else{a.style.background='';a.textContent=ini}});$('#uWho').title=USER.nombre+' · '+USER.email}
function cerrarCuenta(){$('#cuentaMenu').classList.add('hide')}
$('#uWho').onclick=e=>{e.stopPropagation();$('#cuentaMenu').classList.toggle('hide')};
$$('#cuentaMenu [data-cm]').forEach(b=>b.onclick=()=>{cerrarCuenta();go(b.dataset.cm)});
document.addEventListener('click',e=>{if(!e.target.closest('#userbox'))cerrarCuenta()});
