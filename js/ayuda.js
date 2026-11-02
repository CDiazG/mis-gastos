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

/* ============ Guía inicial con Rufo ============ */
// Sube GUIA_V cuando la guía tenga cosas nuevas: a quien ya la vio le vuelve a salir una vez.
const GUIA_V=2;
const PERSONALIZAR=[
  {t:'¡Hola! Soy '+MASCOTA+' 👋',d:'Te enseño Cuentas Claras en un par de minutos. Primero la dejamos a tu gusto y luego damos una vuelta por las pestañas. Puedes saltarte cualquier paso, y volver a verlo desde Ayuda.'},
  {t:'Tu foto',solo:()=>NUBE&&USER,d:'Si quieres, pon una foto: la verán los demás en el foro. Si no, se queda tu inicial.',html:()=>`<div style="display:flex;gap:12px;align-items:center;margin-top:10px">${avatarHtml(USER.uid,USER.nombre,USER.foto||'',52)}<button class="btn sm pri" type="button" id="gFoto">${USER.foto?'Cambiar foto':'Subir foto'}</button></div>`,
    init:()=>{const b=$('#gFoto');if(b)b.onclick=()=>$('#fotoFile').click()}},
  {t:'Tus colores',d:'Elige los colores de la app y si la quieres clara, oscura o como tu móvil. Lo ves al momento y lo puedes cambiar cuando quieras en Mi perfil (pulsando tu nombre, arriba).',
    html:()=>{const pal=S.aj.paleta||'verde',tema=S.aj.tema||'auto';return `<div class="palopts gpal">${Object.entries(PALETAS).map(([k,p])=>`<button type="button" class="palopt${k===pal?' on':''}" data-gpal="${k}"><span class="sw3">${p.l.map(c=>`<i style="background:${c}"></i>`).join('')}</span><b>${p.n}</b></button>`).join('')}</div>
      <span class="seg" style="margin-top:8px">${[['claro','☀️ Claro'],['oscuro','🌙 Oscuro'],['auto','Auto']].map(([k,t])=>`<button type="button" data-gtema="${k}" class="${k===tema?'on':''}">${t}</button>`).join('')}</span>`},
    init:()=>{$$('[data-gpal]').forEach(b=>b.onclick=()=>{S.aj.paleta=b.dataset.gpal;aplicarTema();save();pintarTuto()});$$('[data-gtema]').forEach(b=>b.onclick=()=>{S.aj.tema=b.dataset.gtema;aplicarTema();save();pintarTuto()})}},
];
PERSONALIZAR.push({t:'¿Das diezmo?',d:'Si lo das, tendrá su sitio en el presupuesto y te avisaré si queda pendiente. Si no, lo quito de todas partes (se puede cambiar en Ajustes → Diezmo).',
  html:()=>`<span class="seg" style="margin-top:10px"><button type="button" data-gdz="1" class="${diezmoOn()?'on':''}">Sí, doy diezmo</button><button type="button" data-gdz="0" class="${diezmoOn()?'':'on'}">No</button></span>`,
  init:()=>$$('[data-gdz]').forEach(b=>b.onclick=()=>{const on=b.dataset.gdz==='1';if(on!==diezmoOn())ponerDiezmo(on);pintarTuto()})});
PERSONALIZAR.push({t:'¿Te faltan categorías?',d:'Ya tienes las de siempre. Si quieres, añade alguna más: traen sus palabras para clasificar solas. Luego les das su porcentaje en Ajustes.',
  html:()=>`<div class="chips" style="margin-top:10px">${CAT_SUG.map(c=>{const ya=S.cats.some(x=>norm(x.n)===norm(c.n));return `<button type="button" class="chip${ya?' on':''}" data-gcat="${esc(c.n)}">${c.e} ${esc(c.n)}${ya?' ✓':''}</button>`}).join('')}</div>`,
  init:()=>$$('[data-gcat]').forEach(b=>b.onclick=()=>{const sg=CAT_SUG.find(c=>c.n===b.dataset.gcat);const ex=S.cats.find(x=>norm(x.n)===norm(sg.n));
    if(ex){if(!S.mov.some(m=>m.cat===ex.id)&&!(+S.aj.pct[ex.id])){S.cats=S.cats.filter(x=>x!==ex);S.reglas=S.reglas.filter(r=>r.c!==ex.id);delete S.aj.pct[ex.id];save();refreshCats()}}else anadirCatSug(sg,{silencio:true});pintarTuto()})});
const RECORRIDO=[
  {tab:'inicio',sel:'#inicio',t:'Inicio',d:'Tu visión general: lo que tienes, cómo vas en el año, cómo evolucionan tus gastos y tu ahorro, y lo que tienes pendiente. Cada tarjeta se pliega y despliega.'},
  {tab:'resumen',sel:'.mesTit',t:'Resumen del mes',d:'Aquí pone siempre en qué mes estás. Para cambiarlo, usa las flechas ‹ › de arriba; «Hoy» te devuelve al mes actual.'},
  {tab:'resumen',sel:'#kpis',t:'El mes de un vistazo',d:'Lo que ha entrado, lo que has gastado, lo que ahorras (todo lo que no gastas) y si llegas a tu objetivo de ahorro, que se marca con ✓.'},
  {tab:'resumen',sel:'#groups',t:'Tu presupuesto',d:'Tres columnas: Necesidades, Ocio y caprichos, y Ahorro y donativos. Pulsa una categoría para ver sus movimientos. Si una categoría acumula (↻), lo que no gastas pasa al mes siguiente.'},
  {tab:'efectivo',sel:'#cashForm',t:'Añadir a mano',d:'Lo que pagas en efectivo, o lo que entra o sale de una cuenta sin extracto. Puedes ponerle una etiqueta (por ejemplo «Viaje a Roma»). En el móvil tienes también el botón «＋ Añadir».'},
  {tab:'movs',sel:'#movTable',t:'Movimientos',d:'Cambia la categoría y aprendo para la próxima vez (los Bizum se clasifican a mano). Con ✎ puedes editar, dividir un gasto en varias categorías o etiquetarlo. Si te equivocas, pulsa «Deshacer».'},
  {tab:'importar',sel:'#drop',t:'Importar el extracto',d:'Sube el extracto del banco (PDF, Excel, CSV o Norma 43), también el de Trade Republic. Yo pongo las categorías y tú solo revisas antes de guardar.'},
  {tab:'hist',sel:'#chart',t:'Histórico',d:'Ingresos, gastos y la línea de tu ahorro mes a mes. Debajo: comparación con el mismo mes del año pasado y cuánto ha costado cada etiqueta.'},
  {tab:'patri',sel:'[data-t="patri"]',t:'Patrimonio',d:'El saldo de tus cuentas, lo que te deben y tus objetivos de ahorro (huchas).'},
  {tab:'ajustes',sel:'#pctTable',card:true,t:'Ajustes',d:'Cómo funcionan tus cuentas: presupuesto y categorías, cómo se clasifican los movimientos, nómina, diezmo, gastos fijos y copia de seguridad.'},
  {tab:'perfil',sel:'#uWho',t:'Mi perfil',d:'Pulsa en tu foto o tu nombre, arriba a la derecha: ahí cambias tu foto, tu nombre, los colores, los avisos y la contraseña.'},
  {tab:'ayuda',sel:'#faqList',t:'Ayuda',d:'Preguntas frecuentes (con un botón para que te lleve al sitio), el foro para preguntar a los demás y el buzón de sugerencias. ¡Ya está, a ahorrar! 🌱'},
];
let tutoI=-1,PASOS=[],GUIA_COMPLETA=false;
function tutorial(forzar){
  if(!forzar&&((S.aj.guiaV||0)>=GUIA_V||(()=>{try{return localStorage.getItem('mg-sin-tuto')}catch(e){return null}})()))return;
  PASOS=[...PERSONALIZAR.filter(p=>!p.solo||p.solo()),...RECORRIDO];GUIA_COMPLETA=true;tutoI=0;pintarTuto();
}
// Un solo paso: «Que Rufo me lo enseñe» desde una pregunta frecuente
function guia(paso){PASOS=[{...paso,ult:true}];GUIA_COMPLETA=false;tutoI=0;pintarTuto()}
function cerrarTuto(){const completa=GUIA_COMPLETA;tutoI=-1;$('#tuto').classList.add('hide');$('#tutoSpot').classList.add('hide');window.removeEventListener('resize',colocarSpot);
  if(completa&&S&&(S.aj.guiaV||0)<GUIA_V){S.aj.guiaV=GUIA_V;S.aj.tutoVisto=true;save()}}
function colocarSpot(){
  const p=PASOS[tutoI];const sp=$('#tutoSpot');if(!p||!p.sel){sp.classList.add('hide');return}
  let el=$(p.sel);if(el&&p.card)el=el.closest('.card')||el;if(!el||!el.offsetParent){sp.classList.add('hide');return}
  const r=el.getBoundingClientRect(),m=6;sp.classList.remove('hide');
  Object.assign(sp.style,{left:(r.left-m)+'px',top:(r.top-m)+'px',width:(r.width+2*m)+'px',height:Math.min(r.height+2*m,window.innerHeight*0.55)+'px'});
}
function pintarTuto(){
  const p=PASOS[tutoI];if(!p){cerrarTuto();return}
  if(p.tab&&TAB!==p.tab)go(p.tab);
  let el=p.sel&&$(p.sel);if(el&&p.card)el=el.closest('.card')||el;
  if(el)revelar(el);
  if(el)el.scrollIntoView({block:el.offsetHeight>window.innerHeight*0.45?'start':'center',behavior:'instant'});
  const ult=p.ult||tutoI===PASOS.length-1,uno=PASOS.length===1;
  $('#tuto').innerHTML=`<div class="tcard">${mascota(76,tutoI===0||ult)}<div class="tbody"><div class="tt">${p.t}</div><div class="td">${p.d}</div>${p.html?p.html():''}
    ${uno?'':`<div class="tdots">${PASOS.map((_,i)=>`<i class="${i===tutoI?'on':''}"></i>`).join('')}</div>`}
    <div class="tbtns">${uno?'':`<button class="btn sm" type="button" id="tutoSkip">${ult?'Cerrar':p.html?'Omitir':'Saltar'}</button>`}<span class="sp"></span>${tutoI?'<button class="btn sm" type="button" id="tutoAnt">Anterior</button>':''}<button class="btn sm pri" type="button" id="tutoSig">${uno?'Entendido':ult?'¡Empezar!':'Siguiente'}</button></div></div></div>`;
  $('#tuto').classList.remove('hide');if(p.init)p.init();
  const sk=$('#tutoSkip');if(sk)sk.onclick=()=>{if(p.html&&!ult){tutoI++;pintarTuto()}else{cerrarTuto();if(ult&&!uno)go('inicio')}};
  const a=$('#tutoAnt');if(a)a.onclick=()=>{tutoI--;pintarTuto()};
  $('#tutoSig').onclick=()=>{if(ult){cerrarTuto();if(!uno)go('inicio')}else{tutoI++;pintarTuto()}};
  requestAnimationFrame(colocarSpot);window.addEventListener('resize',colocarSpot);
}
document.addEventListener('keydown',e=>{if(tutoI>=0&&e.key==='Escape'){if(GUIA_COMPLETA&&S){S.aj.guiaV=GUIA_V;save()}cerrarTuto()}});
window.addEventListener('scroll',()=>{if(tutoI>=0)colocarSpot()},{passive:true});
// Sale sola la primera vez (y una vez más cuando la guía trae novedades), cuando no hay ningún diálogo abierto
function tutorialInicial(){
  let n=0;const t=()=>{if(!S||!USER&&NUBE)return;if($('#dlg').open){if(++n<200)setTimeout(t,700);return}tutorial(false)};
  setTimeout(t,700);
}

/* ============ Preguntas frecuentes ============ */
// ir: a qué pestaña y elemento lleva el botón; g: lo que dice Rufo al enseñarlo
const FAQ=[
  {p:'¿Están seguros mis datos? ¿Quién los ve?',r:'El extracto se lee en tu dispositivo y nunca se sube. Solo se guardan los movimientos que confirmas, en tu cuenta de la base de datos (Firebase, de Google), con la conexión cifrada. La app no deja que nadie vea las cuentas de otra persona, tampoco el administrador; aunque, como dueño de la base de datos, técnicamente podría verlas desde la consola de Firebase, y se compromete a no hacerlo. Lo tienes todo explicado en «Privacidad», arriba.',ir:{tab:'ayuda',sel:'#privCard',t:'Privacidad',g:'Aquí está todo lo que se guarda, dónde y quién lo ve.'}},
  {p:'¿Cómo meto los movimientos del banco?',r:'En «Importar extracto» sube el extracto en PDF (EVO, Revolut, Trade Republic y muchos otros), en Excel, en CSV o en Norma 43. El programa comprueba que cuadra con el saldo del banco, pone las categorías y te deja revisarlo antes de guardar. Si subes el mismo extracto dos veces, no se duplica.',ir:{tab:'importar',sel:'#drop',t:'Importar extracto',g:'Arrastra aquí el extracto o pulsa para elegirlo.'}},
  {p:'¿Puedo mandar el extracto desde la app del banco con «Compartir»?',r:'En Android, sí, si tienes Cuentas Claras instalada como aplicación: en la app del banco descarga el extracto, pulsa «Compartir» y elige «Cuentas Claras». Se abre directamente en Importar, listo para revisar. Si ya la tenías instalada de antes y no sale en la lista, desinstálala y vuelve a instalarla (tus datos no se pierden: están en tu cuenta). El archivo se lee en tu móvil, igual que al subirlo a mano. En iPhone no se puede: Safari no lo permite, así que allí súbelo desde Importar.'},
  {p:'Un movimiento no tiene categoría, ¿qué hago?',r:'Ponle la categoría en «Movimientos» o al importar. La próxima vez que aparezca ese comercio se clasificará solo. Mientras no la tenga cuenta como «Sin categorizar» dentro de Ocio y caprichos, para que no se pierda ningún gasto.',ir:{tab:'movs',sel:'#fSinCat',card:false,t:'Movimientos',g:'Marca «Solo sin categoría» para ver los que faltan y elige la categoría en cada fila.'}},
  {p:'¿Por qué los Bizum no se clasifican solos?',r:'Porque la misma persona te puede mandar dinero por motivos distintos (una cena, un regalo, un préstamo). Cada Bizum se clasifica a mano. Si prefieres que aprenda por persona, actívalo en Ajustes → Clasificación automática.',ir:{tab:'ajustes',sel:'[data-pref="bizumReglas"]',t:'Ajustes',g:'Este interruptor hace que aprenda la categoría de los Bizum por persona.',padre:'.pref'}},
  {p:'Me han devuelto dinero de una cena por Bizum, ¿cómo lo pongo?',r:'Ponle la misma categoría que el gasto (por ejemplo, Restaurantes y ocio): se resta de lo gastado en esa categoría.',ir:{tab:'movs',sel:'#movTable',t:'Movimientos',g:'Busca el Bizum y elige la categoría del gasto que pagaste.'}},
  {p:'¿Qué es el «Ahorro del mes»?',r:'Todo lo que no gastas: ingresos − gastos − diezmo. Lo que inviertes es parte de tu ahorro. La fila «Ahorro» del presupuesto se calcula sola: es lo que queda en cuenta después de gastar e invertir. El objetivo de ahorro se marca con ✓ cuando lo consigues.',ir:{tab:'resumen',sel:'#kpis',t:'Resumen',g:'Aquí ves el ahorro del mes y si llegas a tu objetivo.'}},
  {p:'¿Qué cuenta como gasto y qué no?',r:'No son gasto los traspasos entre tus cuentas, sacar dinero del cajero (lo que pagues después en efectivo sí, apuntándolo en «Añadir»), los préstamos a otras personas ni los ajustes. Tampoco la inversión ni el diezmo, que van en su columna.',ir:{tab:'resumen',sel:'#especiales',t:'Resumen',g:'Aquí abajo ves los movimientos del mes que no cuentan como gasto.'}},
  {p:'La nómina llega a final de mes, ¿a qué mes cuenta?',r:'Por defecto, al mes siguiente, porque es el dinero con el que vives ese mes. Se puede cambiar en Ajustes → Nómina, o en cada nómina al importarla o con ✎ en Movimientos.',ir:{tab:'ajustes',sel:'#nomMes',card:true,t:'Ajustes → Nómina',g:'Aquí eliges si la nómina de final de mes cuenta para el mes siguiente o para el mismo.'}},
  {p:'¿Cómo apunto un gasto en efectivo?',r:'En «Añadir» (o con el botón «＋ Añadir» del móvil): importe, concepto, categoría y «Efectivo». Si lo pagaste desde una cuenta que no importas, elígela o pulsa «＋ Otra cuenta».',ir:{tab:'efectivo',sel:'#cashForm',t:'Añadir',g:'Rellena el importe, qué es y la categoría, y elige «Efectivo».'}},
  {p:'¿Puedo repartir un gasto en varias categorías?',r:'Sí. En «Movimientos» pulsa ✎ en el gasto y luego «Dividir»: por ejemplo, una compra de 80 € que es 60 de supermercado y 20 de casa. Las partes tienen que sumar el total.',ir:{tab:'movs',sel:'#movTable',t:'Movimientos',g:'Pulsa ✎ en el gasto y después «Dividir».'}},
  {p:'¿Cómo sé cuánto me ha costado un viaje o una boda?',r:'Ponle una etiqueta (por ejemplo «Viaje a Roma») a todos sus gastos, aunque sean de categorías distintas: al añadirlos, con ✎, o marcando varios en Movimientos y pulsando «Etiquetar». En Histórico → Etiquetas ves el total.',ir:{tab:'hist',sel:'#tagsCard',t:'Histórico → Etiquetas',g:'Aquí ves lo que ha costado cada etiqueta, sumando todas sus categorías.'}},
  {p:'Me he equivocado al borrar o cambiar algo',r:'Justo después, abajo aparece «Deshacer» durante unos segundos. Si ya no está, restaura una copia de seguridad en Ajustes → Copia de seguridad.'},
  {p:'¿Qué significa la flecha ↻ de las categorías?',r:'Que esa categoría acumula: lo que no gastas de ella pasa al mes siguiente. Útil para Regalos, Viajes o Ropa, que no se gastan todos los meses. Se activa en Ajustes, en la tabla de categorías.',ir:{tab:'ajustes',sel:'#pctTable',t:'Ajustes → Categorías',g:'Pulsa ↻ en la categoría que quieras que acumule.'}},
  {p:'¿Gasto más o menos que el año pasado?',r:'En Histórico → «Frente al año pasado» comparas un mes con el mismo mes del año anterior, categoría a categoría.',ir:{tab:'hist',sel:'#vsAnio',t:'Histórico',g:'Elige el mes y compáralo con el mismo mes del año pasado.'}},
  {p:'Tengo Trade Republic, ¿cómo se cuenta?',r:'Sube su «Certificado de saldo y movimientos» en PDF. Las compras de fondos cuentan como Inversión el día que se hacen y el dinero que mandas desde tus otras cuentas es un traspaso, así no se cuenta dos veces.',ir:{tab:'importar',sel:'#drop',t:'Importar extracto',g:'Sube aquí el PDF de Trade Republic.'}},
  {p:'¿Cómo instalo la app en el móvil o en el ordenador?',r:'En Ajustes → «Acceso directo en el escritorio» tienes los pasos. En el iPhone: Safari → Compartir → «Añadir a pantalla de inicio». En Android: Chrome → menú ⋮ → «Instalar aplicación».',ir:{tab:'ajustes',sel:'#instTxt',card:true,t:'Ajustes',g:'Aquí tienes los pasos para tu móvil u ordenador.'}},
  {p:'¿Puedo cambiar los colores o ponerla en modo oscuro?',r:'Sí: en Mi perfil (pulsa tu nombre o tu foto, arriba) → Apariencia: seis paletas de colores y el tema Claro, Oscuro o Automático (como tu dispositivo).',ir:{tab:'perfil',sel:'#aparCard',t:'Mi perfil',g:'Elige los colores y el tema; se ve al momento.'}},
  {p:'¿Cómo saco un Excel o un informe?',r:'En «Movimientos» o «Histórico», «Exportar a Excel»: una hoja por mes como el Excel de siempre, un resumen y todos los movimientos. En el Resumen, «Informe para imprimir» crea un PDF del mes o del año.',ir:{tab:'hist',sel:'#s-hist [data-export]',t:'Histórico',g:'Este botón descarga el Excel.'}},
  {p:'He borrado algo sin querer y ya no sale «Deshacer»',r:'Restaura una copia de seguridad en Ajustes → Copia de seguridad. Guarda una copia de vez en cuando (el Resumen te lo recuerda cada mes).',ir:{tab:'ajustes',sel:'#bkExport',card:true,t:'Copia de seguridad',g:'Guarda una copia o restaura una anterior.'}},
  {p:'¿Cómo cambio mi contraseña, mi nombre o mi foto?',r:'En Mi perfil: pulsa tu nombre o tu foto, arriba a la derecha. Si no te acuerdas de la contraseña, en la pantalla de entrada pulsa «¿Has olvidado la contraseña?» y te llega un correo.',ir:{tab:'perfil',sel:'#fotoAj',card:true,t:'Mi perfil',g:'Aquí cambias tu foto y tu contraseña.'}},
  {p:'Algo no funciona o tengo una idea',r:'Escríbelo en el buzón de «Sugerencias y quejas» (aquí, en Ayuda) y le llega al administrador. Si es una duda de uso, pregúntala en el foro.',ir:{tab:'ayuda',sel:'#buzonCard',t:'Sugerencias y quejas',g:'Escribe aquí lo que quieras contarle al administrador.'}},
];
let faqQ='',faqT='';
// Temas de las preguntas frecuentes (por palabras de la pregunta)
const FAQ_TEMAS=[
  {id:'empezar',t:'Empezar',re:/movimientos del banco|Compartir|Trade Republic|instalo/i},
  {id:'categorias',t:'Categorías',re:/categor|Bizum/i},
  {id:'ahorro',t:'Ahorro y presupuesto',re:/Ahorro del mes|cuenta como gasto|nómina|año pasado|viaje o una boda/i},
  {id:'apuntar',t:'Apuntar y corregir',re:/efectivo|equivocado|Deshacer|Excel o un informe/i},
  {id:'cuenta',t:'Tu cuenta',re:/./},
];
const temaFaq=f=>FAQ_TEMAS.find(t=>t.re.test(f.p)).id;
function faqHtml(f){return `<details class="faq"><summary>${esc(f.p)}</summary><p>${esc(f.r)}</p>${f.ir?`<div class="faqir"><button class="btn sm" type="button" data-ir="${FAQ.indexOf(f)}">Ir a ${esc(f.ir.t)} →</button><button class="btn sm pri" type="button" data-guia="${FAQ.indexOf(f)}">${mascota(18,false)} Que ${MASCOTA} me lo enseñe</button></div>`:''}</details>`}
function rFaq(){
  const q=norm(faqQ).trim();const xs=FAQ.filter(f=>(!q||norm(f.p+' '+f.r).includes(q))&&(q||!faqT||temaFaq(f)===faqT));
  const ch=$('#faqTemas');if(ch){ch.innerHTML=[{id:'',t:'Todas'},...FAQ_TEMAS].map(t=>`<button type="button" class="apchip${t.id===faqT&&!q?' on':''}" data-ft="${t.id}">${t.t}</button>`).join('');$$('[data-ft]',ch).forEach(b=>b.onclick=()=>{faqT=b.dataset.ft;faqQ='';$('#faqBuscar').value='';rFaq()})}
  $('#faqList').innerHTML=xs.length?(q||faqT?xs.map(faqHtml).join(''):FAQ_TEMAS.map(t=>{const ys=xs.filter(f=>temaFaq(f)===t.id);return ys.length?`<h4 class="faqtema">${t.t}</h4>`+ys.map(faqHtml).join(''):''}).join('')):'<p class="small mut pad">No encuentro nada con eso. Pregúntalo en el foro.</p>';
  $$('#faqList [data-ir]').forEach(b=>b.onclick=()=>{const ir=FAQ[+b.dataset.ir].ir;go(ir.tab);setTimeout(()=>{let el=$(ir.sel);revelar(el);if(el&&ir.card)el=el.closest('.card')||el;if(el){el.scrollIntoView({block:'center',behavior:'smooth'});el.classList.add('resalta');setTimeout(()=>el.classList.remove('resalta'),1600)}},60)});
  $$('#faqList [data-guia]').forEach(b=>b.onclick=()=>{const f=FAQ[+b.dataset.guia];const ir=f.ir;
    guia({tab:ir.tab,sel:ir.padre?null:ir.sel,card:ir.card,t:f.p,d:ir.g||f.r,_padre:ir.padre?[ir.sel,ir.padre]:null});
    if(ir.padre){const el=$(ir.sel);const pe=el&&el.closest(ir.padre);if(pe){pe.id=pe.id||'guiaPadre';PASOS[0].sel='#'+pe.id;tutoI=0;pintarTuto()}}});
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
  rPrivCard();rFaq();escucharForo();rForo();rBuzon();cargarMias();
  $('#verTag').textContent='Versión '+VERSION;$('#verList').innerHTML=cambiosHtml(null).replace('<div class="chlog">','');
  const on=NUBE&&USER;$('#foroGo').disabled=!on;$('#foroTxt').disabled=!on;$('#foroTit').disabled=!on;
}
