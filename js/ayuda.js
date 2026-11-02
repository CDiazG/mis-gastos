// Cuentas Claras · Pestaña Ayuda: la mascota (un zorro), tutorial, preguntas frecuentes, foro y foto de perfil
"use strict";
/* ============ La mascota: un zorro ============ */
const MASCOTA='Rufo';
function mascota(px=72,saluda=true){
  return `<svg class="mascota" width="${px}" height="${px}" viewBox="0 0 120 120" aria-hidden="true">
  <ellipse cx="60" cy="113" rx="30" ry="4.5" fill="#000" opacity=".1"/>
  <path d="M86 104c20-4 28-26 18-40-6 14-14 18-22 20z" fill="#e2733a"/><path d="M98 76c-2 10-8 16-14 18 8 0 14-4 17-12z" fill="#fff4e8"/>
  <ellipse cx="56" cy="88" rx="24" ry="22" fill="#e2733a"/><ellipse cx="56" cy="94" rx="13" ry="14" fill="#fff4e8"/>
  <ellipse cx="44" cy="108" rx="7" ry="4" fill="#5a3324"/><ellipse cx="68" cy="108" rx="7" ry="4" fill="#5a3324"/>
  <g class="${saluda?'brazo':''}"><path d="M40 90C31 84 27 76 28 68" stroke="#e2733a" stroke-width="8" stroke-linecap="round" fill="none"/><circle cx="28" cy="67" r="4.6" fill="#5a3324"/></g>
  <path d="M72 92c4 4 5 9 3 13" stroke="#e2733a" stroke-width="8" stroke-linecap="round" fill="none"/>
  <path d="M32 50l-4-28 22 16zM80 50l4-28-22 16z" fill="#e2733a"/><path d="M33 42l-2-13 10 8zM79 42l2-13-10 8z" fill="#5a3324"/>
  <path d="M56 34c-20 0-28 12-28 22 0 10 12 22 28 26 16-4 28-16 28-26 0-10-8-22-28-22z" fill="#e2733a"/>
  <path d="M56 82c-10-3-20-10-24-20 8 4 16 4 24 8 8-4 16-4 24-8-4 10-14 17-24 20z" fill="#fff4e8"/>
  <circle cx="46" cy="56" r="4.2" fill="#1c1a19"/><circle cx="66" cy="56" r="4.2" fill="#1c1a19"/><circle cx="47.4" cy="54.5" r="1.3" fill="#fff"/><circle cx="67.4" cy="54.5" r="1.3" fill="#fff"/>
  <circle cx="38" cy="64" r="3.6" fill="#f29b8c" opacity=".6"/><circle cx="74" cy="64" r="3.6" fill="#f29b8c" opacity=".6"/>
  <ellipse cx="56" cy="70" rx="4" ry="3" fill="#2a1d18"/><path d="M52 74q4 3 8 0" stroke="#2a1d18" stroke-width="1.6" fill="none" stroke-linecap="round"/>
</svg>`}

/* ============ Tutorial por tarjetas ============ */
const TUTO=[
  {t:'¡Hola! Soy '+MASCOTA+' 👋',d:'Te enseño Cuentas Claras en un minuto. Puedes saltártelo cuando quieras y volver a verlo desde Ayuda o Ajustes.'},
  {tab:'resumen',sel:'.mesTit',t:'El mes que estás viendo',d:'Aquí pone siempre en qué mes estás. Para cambiar de mes usa las flechas ‹ › de arriba; «Hoy» te devuelve al mes actual.'},
  {tab:'resumen',sel:'#kpis',t:'Tu mes de un vistazo',d:'Lo que ha entrado, lo que has gastado, lo que ahorras (todo lo que no gastas) y si llegas a tu objetivo de ahorro.'},
  {tab:'resumen',sel:'#groups',t:'Tu presupuesto',d:'Tres columnas: Necesidades, Ocio y caprichos, y Ahorro y donativos. Pulsa una categoría para ver sus movimientos.'},
  {tab:'importar',sel:'[data-t="importar"]',t:'Importar el extracto',d:'Sube el extracto del banco (PDF, Excel, CSV o Norma 43). Yo pongo las categorías y tú solo revisas antes de guardar.'},
  {tab:'efectivo',sel:'[data-t="efectivo"]',t:'Añadir a mano',d:'Lo que pagas en efectivo, o lo que entra o sale de una cuenta sin extracto, se apunta aquí. En el móvil tienes también el botón «＋ Añadir».'},
  {tab:'movs',sel:'[data-t="movs"]',t:'Movimientos',d:'Todos los movimientos del mes. Si cambias una categoría, aprendo para la próxima vez (menos en los Bizum, que se clasifican a mano).'},
  {tab:'hist',sel:'[data-t="hist"]',t:'Histórico',d:'Cómo vas mes a mes y año a año, y la evolución de cada categoría.'},
  {tab:'patri',sel:'[data-t="patri"]',t:'Patrimonio',d:'El saldo de tus cuentas, lo que te deben y tus objetivos de ahorro (huchas).'},
  {tab:'ajustes',sel:'#prefCard',t:'Ajustes',d:'Presupuesto, preferencias (tema claro u oscuro, avisos…), tu foto y la copia de seguridad.'},
  {tab:'ayuda',sel:'[data-t="ayuda"]',t:'¿Dudas?',d:'En Ayuda tienes las preguntas frecuentes y el foro para preguntar a los demás. ¡Ya está, a ahorrar! 🌱'},
];
let tutoI=-1;
function tutorial(forzar){
  if(!forzar&&(S.aj.tutoVisto||(()=>{try{return localStorage.getItem('mg-sin-tuto')}catch(e){return null}})()))return;
  tutoI=0;pintarTuto();
}
function cerrarTuto(){tutoI=-1;$('#tuto').classList.add('hide');$('#tutoSpot').classList.add('hide');if(S&&!S.aj.tutoVisto){S.aj.tutoVisto=true;save()}window.removeEventListener('resize',colocarSpot)}
function colocarSpot(){
  const p=TUTO[tutoI];const sp=$('#tutoSpot');if(!p||!p.sel){sp.classList.add('hide');return}
  const el=$(p.sel);if(!el||!el.offsetParent){sp.classList.add('hide');return}
  const r=el.getBoundingClientRect(),m=6;sp.classList.remove('hide');
  Object.assign(sp.style,{left:(r.left-m)+'px',top:(r.top-m)+'px',width:(r.width+2*m)+'px',height:Math.min(r.height+2*m,window.innerHeight*0.55)+'px'});
}
function pintarTuto(){
  const p=TUTO[tutoI];if(!p){cerrarTuto();return}
  if(p.tab&&TAB!==p.tab)go(p.tab);
  const el=p.sel&&$(p.sel);if(el)el.scrollIntoView({block:el.offsetHeight>window.innerHeight*0.45?'start':'center',behavior:'instant'});
  const ult=tutoI===TUTO.length-1;
  $('#tuto').innerHTML=`<div class="tcard">${mascota(76,tutoI===0||ult)}<div class="tbody"><div class="tt">${p.t}</div><div class="td">${p.d}</div>
    <div class="tdots">${TUTO.map((_,i)=>`<i class="${i===tutoI?'on':''}"></i>`).join('')}</div>
    <div class="tbtns"><button class="btn sm" type="button" id="tutoSkip">${ult?'Cerrar':'Saltar'}</button><span class="sp"></span>${tutoI?'<button class="btn sm" type="button" id="tutoAnt">Anterior</button>':''}<button class="btn sm pri" type="button" id="tutoSig">${ult?'¡Empezar!':'Siguiente'}</button></div></div></div>`;
  $('#tuto').classList.remove('hide');
  $('#tutoSkip').onclick=()=>{cerrarTuto();if(ult)go('resumen')};
  const a=$('#tutoAnt');if(a)a.onclick=()=>{tutoI--;pintarTuto()};
  $('#tutoSig').onclick=()=>{if(ult){cerrarTuto();go('resumen')}else{tutoI++;pintarTuto()}};
  requestAnimationFrame(colocarSpot);window.addEventListener('resize',colocarSpot);
}
document.addEventListener('keydown',e=>{if(tutoI>=0&&e.key==='Escape')cerrarTuto()});
window.addEventListener('scroll',()=>{if(tutoI>=0)colocarSpot()},{passive:true});
// Se enseña sola la primera vez, cuando no hay ningún diálogo abierto
function tutorialInicial(){
  let n=0;const t=()=>{if(!S||!USER&&NUBE)return;if($('#dlg').open){if(++n<200)setTimeout(t,700);return}tutorial(false)};
  setTimeout(t,700);
}

/* ============ Preguntas frecuentes ============ */
const FAQ=[
  ['¿Están seguros mis datos?','Cada persona solo puede ver sus propias cuentas; ni siquiera los demás usuarios pueden verlas. Se guardan en la nube de Google (Firebase), con la conexión cifrada, y en tu dispositivo para que funcione rápido. Al pulsar «Salir» se borra la copia del dispositivo.'],
  ['¿Cómo meto los movimientos del banco?','En «Importar extracto» sube el extracto en PDF (EVO, Revolut, Trade Republic y muchos otros), en Excel, en CSV o en Norma 43. El programa comprueba que cuadra con el saldo del banco, pone las categorías y te deja revisarlo antes de guardar. Si subes el mismo extracto dos veces, no se duplica.'],
  ['Un movimiento no tiene categoría, ¿qué hago?','Ponle la categoría en «Movimientos» o al importar. La próxima vez que aparezca ese comercio se clasificará solo. Mientras no la tenga cuenta como «Sin categorizar» dentro de Ocio y caprichos, para que no se pierda ningún gasto.'],
  ['¿Por qué los Bizum no se clasifican solos?','Porque la misma persona te puede mandar dinero por motivos distintos (una cena, un regalo, un préstamo). Cada Bizum se clasifica a mano. Si prefieres que aprenda por persona, actívalo en Ajustes → Preferencias.'],
  ['Me han devuelto dinero de una cena por Bizum, ¿cómo lo pongo?','Ponle la misma categoría que el gasto (por ejemplo, Restaurantes y ocio): se resta de lo gastado en esa categoría.'],
  ['¿Qué es el «Ahorro del mes»?','Todo lo que no gastas: ingresos − gastos − diezmo. Lo que inviertes es parte de tu ahorro. La fila «Ahorro» del presupuesto se calcula sola: es lo que queda en cuenta después de gastar e invertir. El objetivo de ahorro se marca con ✓ cuando lo consigues.'],
  ['¿Qué cuenta como gasto y qué no?','No son gasto los traspasos entre tus cuentas, sacar dinero del cajero (lo que pagues después en efectivo sí, apuntándolo en «Añadir»), los préstamos a otras personas ni los ajustes. Tampoco la inversión ni el diezmo, que van en su columna.'],
  ['La nómina llega a final de mes, ¿a qué mes cuenta?','Por defecto, al mes siguiente, porque es el dinero con el que vives ese mes. Se puede cambiar en Ajustes → Nómina, o en cada nómina al importarla o con ✎ en Movimientos.'],
  ['¿Cómo apunto un gasto en efectivo?','En «Añadir» (o con el botón «＋ Añadir» del móvil): importe, concepto, categoría y «Efectivo». Si lo pagaste desde una cuenta que no importas, elígela o pulsa «＋ Otra cuenta».'],
  ['Tengo Trade Republic, ¿cómo se cuenta?','Sube su «Certificado de saldo y movimientos» en PDF. Las compras de fondos cuentan como Inversión el día que se hacen y el dinero que mandas desde tus otras cuentas es un traspaso, así no se cuenta dos veces.'],
  ['¿Cómo instalo la app en el móvil o en el ordenador?','En Ajustes → «Acceso directo en el escritorio» tienes los pasos. En el iPhone: Safari → Compartir → «Añadir a pantalla de inicio». En Android: Chrome → menú ⋮ → «Instalar aplicación».'],
  ['¿Puedo verlo en modo oscuro?','Sí: Ajustes → Preferencias → Tema: Claro, Oscuro o Automático (como tu dispositivo).'],
  ['¿Cómo saco un Excel o un informe?','En «Movimientos», «Exportar a Excel»: una hoja por mes como el Excel de siempre, un resumen y todos los movimientos. En el Resumen, «Informe para imprimir» crea un PDF del mes o del año.'],
  ['He borrado algo sin querer','Restaura una copia de seguridad en Ajustes → Copia de seguridad. Guarda una copia de vez en cuando (el Resumen te lo recuerda cada mes).'],
  ['¿Cómo cambio mi contraseña o mi foto?','En Ajustes → Mi cuenta. Si no te acuerdas de la contraseña, en la pantalla de entrada pulsa «¿Has olvidado la contraseña?» y te llega un correo.'],
  ['Algo no funciona o tengo una idea','Escríbelo en Ajustes → «Sugerencias y quejas» y le llega al administrador. Si es una duda de uso, pregúntala en el foro de aquí abajo.'],
];
let faqQ='';
function rFaq(){
  const q=norm(faqQ).trim();const xs=FAQ.filter(([p,r])=>!q||norm(p+' '+r).includes(q));
  $('#faqList').innerHTML=xs.length?xs.map(([p,r])=>`<details class="faq"><summary>${esc(p)}</summary><p>${esc(r)}</p></details>`).join(''):'<p class="small mut pad">No encuentro nada con eso. Pregúntalo en el foro.</p>';
}
$('#faqBuscar').oninput=e=>{faqQ=e.target.value;rFaq();if(faqQ)$$('#faqList details').forEach(d=>d.open=true)};
$('#ayTuto').onclick=()=>tutorial(true);

/* ============ Perfiles (nombre y foto que ven los demás) ============ */
let PERFILES={},PERF_VIVO=false;
function avatarHtml(uid,nombre,foto,px=28){
  const f=foto!==undefined?foto:(PERFILES[uid]&&PERFILES[uid].foto);
  return f?`<img class="avatar" src="${esc(f)}" alt="" style="width:${px}px;height:${px}px;object-fit:cover">`:`<span class="avatar" style="width:${px}px;height:${px}px;font-size:${Math.round(px*.45)}px">${esc((nombre||'?').trim().charAt(0).toUpperCase())}</span>`}
async function guardarFoto(foto){
  if(!NUBE||!USER)return;
  await fb.fsM.updateDoc(fb.fsM.doc(fb.db,'users',USER.uid),{foto:foto||''});
  await fb.fsM.setDoc(fb.fsM.doc(fb.db,'perfiles',USER.uid),{nombre:USER.nombre,foto:foto||''});
  USER.foto=foto||'';PERFILES[USER.uid]={nombre:USER.nombre,foto:USER.foto};pintarCuenta();rFotoAj();if(TAB==='ayuda')rForo();
}
function fotoReducida(file){return new Promise((ok,ko)=>{
  const img=new Image();const u=URL.createObjectURL(file);
  img.onload=()=>{const c=document.createElement('canvas');c.width=c.height=160;const x=c.getContext('2d');const s=Math.min(img.width,img.height);
    x.drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,160,160);URL.revokeObjectURL(u);ok(c.toDataURL('image/jpeg',0.82))};
  img.onerror=()=>{URL.revokeObjectURL(u);ko(new Error('No es una imagen'))};img.src=u})}
function rFotoAj(){
  const el=$('#fotoAj');if(!el)return;
  if(!NUBE||!USER){el.innerHTML='';return}
  el.innerHTML=`${avatarHtml(USER.uid,USER.nombre,USER.foto||'',56)}<div style="display:flex;flex-direction:column;gap:6px"><span class="small mut">Foto de perfil (la ven los demás en el foro)</span><span class="toolbar" style="margin:0"><button class="btn sm" type="button" id="fotoCam">${USER.foto?'Cambiar foto':'Poner foto'}</button>${USER.foto?'<button class="btn sm" type="button" id="fotoQuitar">Quitar</button>':''}</span></div>`;
  $('#fotoCam').onclick=()=>$('#fotoFile').click();
  const q=$('#fotoQuitar');if(q)q.onclick=async()=>{try{await guardarFoto('');toast('Foto quitada')}catch(e){toast('No se ha podido: '+(e.code||e.message),true)}};
}
$('#fotoFile').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
  try{const foto=await fotoReducida(f);await guardarFoto(foto);toast('Foto guardada')}catch(err){toast('No se ha podido guardar la foto: '+(err.code||err.message),true)}};

/* ============ Foro entre usuarios ============ */
let FORO=[],FORO_VIVO=false,foroAbiertos=new Set();
function escucharForo(){
  if(!NUBE||!USER||!fb.fsM.onSnapshot||FORO_VIVO)return;FORO_VIVO=true;
  UNSUB.push(fb.fsM.onSnapshot(fb.fsM.collection(fb.db,'foro'),qs=>{const r=[];qs.forEach(d=>r.push({id:d.id,...d.data()}));FORO=r;if(TAB==='ayuda')rForo()},e=>{console.warn('foro',e.code||e);FORO_VIVO=false;$('#foroList')&&($('#foroList').innerHTML='<p class="small mut pad">El foro no está disponible todavía (falta publicar las reglas nuevas en Firebase).</p>')}));
  UNSUB.push(fb.fsM.onSnapshot(fb.fsM.collection(fb.db,'perfiles'),qs=>{const r={};qs.forEach(d=>r[d.id]=d.data());PERFILES=r;if(TAB==='ayuda')rForo()},e=>console.warn('perfiles',e.code||e)));
}
async function recargarForo(){try{const r=[];(await fb.fsM.getDocs(fb.fsM.collection(fb.db,'foro'))).forEach(d=>r.push({id:d.id,...d.data()}));FORO=r}catch(e){}rForo()}
const cuando=t=>{const d=Date.now()-t;if(d<6e4)return 'ahora';if(d<36e5)return 'hace '+Math.floor(d/6e4)+' min';if(d<864e5)return 'hace '+Math.floor(d/36e5)+' h';return new Date(t).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:new Date(t).getFullYear()===new Date().getFullYear()?undefined:'numeric'})};
function postHtml(x,resp){
  const mio=USER&&(x.uid===USER.uid||USER.admin);
  return `<div class="post${resp?' resp':''}" data-p="${x.id}">${avatarHtml(x.uid,x.nombre,undefined,resp?26:34)}<div class="pb"><div class="ph"><b>${esc((PERFILES[x.uid]&&PERFILES[x.uid].nombre)||x.nombre||'')}</b> <span class="mut small">${cuando(x.fecha)}</span>${mio?`<button class="link small pX" type="button" title="Borrar">borrar</button>`:''}</div>${x.titulo?`<div class="pt">${esc(x.titulo)}</div>`:''}<div class="ptx">${esc(x.texto)}</div></div></div>`}
function rForo(){
  const el=$('#foroList');if(!el)return;
  if(!NUBE||!USER){el.innerHTML='<p class="small mut pad">Disponible cuando entras con tu cuenta.</p>';return}
  const hilos=FORO.filter(x=>!x.hilo),resp=id=>FORO.filter(x=>x.hilo===id).sort((a,b)=>a.fecha-b.fecha);
  const ult=h=>Math.max(h.fecha,...resp(h.id).map(r=>r.fecha));
  hilos.sort((a,b)=>ult(b)-ult(a));
  el.innerHTML=hilos.length?hilos.map(h=>{const rs=resp(h.id),ab=foroAbiertos.has(h.id);
    return `<div class="hilo" data-h="${h.id}">${postHtml(h)}<div class="hres">${ab?rs.map(r=>postHtml(r,true)).join('')+`<form class="toolbar fResp" style="margin:6px 0 0" autocomplete="off"><input type="text" placeholder="Responder…" maxlength="2000" required style="flex:1;min-width:150px"><button class="btn sm pri">Responder</button></form>`:`<button class="link small fAbrir" type="button">${rs.length?rs.length+' respuesta'+(rs.length>1?'s':'')+' · ver y responder':'Responder'}</button>`}</div></div>`}).join('')
    :'<p class="small mut pad">Aún no hay preguntas. ¡Estrena el foro!</p>';
  $$('#foroList .hilo').forEach(hd=>{const id=hd.dataset.h;
    const a=$('.fAbrir',hd);if(a)a.onclick=()=>{foroAbiertos.add(id);rForo();const i=$(`.hilo[data-h="${id}"] .fResp input`);if(i)i.focus()};
    const f=$('.fResp',hd);if(f)f.onsubmit=async e=>{e.preventDefault();const t=$('input',f).value.trim();if(!t)return;await publicarForo({texto:t,hilo:id})};
  });
  $$('#foroList .pX').forEach(b=>b.onclick=()=>{const id=b.closest('[data-p]').dataset.p;const x=FORO.find(y=>y.id===id);if(!x)return;
    confirmar('Borrar mensaje','¿Borrar este mensaje'+(x.hilo?'':' y sus respuestas')+'?','Borrar',async()=>{try{
      const ids=[id,...(x.hilo?[]:FORO.filter(y=>y.hilo===id&&(y.uid===USER.uid||USER.admin)).map(y=>y.id))];
      for(const i of ids)await fb.fsM.deleteDoc(fb.fsM.doc(fb.db,'foro',i));FORO=FORO.filter(y=>!ids.includes(y.id));rForo();toast('Borrado')}catch(err){toast('No se ha podido borrar: '+(err.code||err.message),true)}})});
}
async function publicarForo({titulo='',texto,hilo=''}){
  try{await fb.fsM.addDoc(fb.fsM.collection(fb.db,'foro'),{uid:USER.uid,nombre:USER.nombre,titulo,texto,hilo,fecha:Date.now()});
    if(hilo)foroAbiertos.add(hilo);await recargarForo();toast(hilo?'Respuesta publicada':'Pregunta publicada');return true}
  catch(err){toast('No se ha podido publicar: '+(err.code||err.message),true);return false}
}
$('#foroF').onsubmit=async e=>{e.preventDefault();const texto=$('#foroTxt').value.trim();if(!texto||!NUBE||!USER)return;
  $('#foroGo').disabled=true;if(await publicarForo({titulo:$('#foroTit').value.trim(),texto})){$('#foroTxt').value='';$('#foroTit').value=''}$('#foroGo').disabled=false};

function rAyuda(){
  $('#ayClara').innerHTML=mascota(88);$('#ayNombre').textContent=MASCOTA;
  rFaq();escucharForo();rForo();
  const on=NUBE&&USER;$('#foroGo').disabled=!on;$('#foroTxt').disabled=!on;$('#foroTit').disabled=!on;
}
