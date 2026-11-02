// Cuentas Claras · Chat con Rufo (responde con las preguntas frecuentes) y, si no sabe, con el administrador
// La conversación con Rufo se queda en el dispositivo; solo lo que se manda al administrador se guarda.
"use strict";
/* ============ Rufo responde ============ */
const CH_VACIAS=new Set('DE LA EL LO LOS LAS UN UNA UNOS UNAS QUE QUE COMO MI MIS ME SE TE ES SON POR PARA EN Y O A AL DEL CON NO SI HAY HAGO PUEDO PUEDE QUIERO TENGO ESTO ESTA ESTE ESO MAS YA HOLA BUENAS GRACIAS RUFO'.split(' '));
const CH_SINON={SUBIR:'IMPORTAR EXTRACTO',SUBO:'IMPORTAR EXTRACTO',PDF:'EXTRACTO',BANCO:'EXTRACTO',MOVIMIENTO:'MOVIMIENTOS',CATEGORIZAR:'CATEGORIA',CLASIFICAR:'CATEGORIA',CLASIFICA:'CATEGORIA',
  CONTRASENA:'CONTRASENA',CLAVE:'CONTRASENA',OSCURO:'OSCURO',COLOR:'COLORES',COLORES:'COLORES',BORRAR:'BORRADO',BORRE:'BORRADO',ELIMINAR:'BORRADO',INSTALAR:'INSTALO',MOVIL:'MOVIL',
  AHORRAR:'AHORRO',AHORRO:'AHORRO',SUELDO:'NOMINA',SALARIO:'NOMINA',CASH:'EFECTIVO',METALICO:'EFECTIVO',VIAJE:'ETIQUETA',BODA:'ETIQUETA',PRIVACIDAD:'SEGUROS DATOS',SEGURIDAD:'SEGUROS DATOS'};
const chToks=t=>norm(t).trim().split(' ').filter(w=>w.length>2&&!CH_VACIAS.has(w)).flatMap(w=>[w,...(CH_SINON[w]?CH_SINON[w].split(' '):[])]).map(w=>w.slice(0,6));
function buscarRespuesta(texto){
  const q=[...new Set(chToks(texto))];if(!q.length)return [];
  return FAQ.map((f,i)=>{const tp=new Set(chToks(f.p)),tr=new Set(chToks(f.r));let s=0;for(const w of q){if(tp.has(w))s+=2;else if(tr.has(w))s+=0.7}return {f,i,s:s/Math.sqrt(q.length)}})
    .filter(x=>x.s>=1.1).sort((a,b)=>b.s-a.s).slice(0,3);
}
/* ============ Estado del chat ============ */
let CH_ABIERTO=false,CH_MODO='rufo',CH_RUFO=[],CH_MSGS=[],CH_ADMIN_SEL=null,CH_VIVO=false,CH_PRES=null;
const chNoLeidosUsuario=()=>CH_MSGS.filter(m=>m.de==='admin'&&!m.leido).length;
const chNoLeidosAdmin=()=>CH_MSGS.filter(m=>m.de==='usuario'&&!m.leido).length;
function chSaludo(){CH_RUFO=[{de:'rufo',t:`¡Hola${USER&&USER.nombre?', '+esc(USER.nombre.split(' ')[0]):''}! Soy ${MASCOTA} 🦊 Pregúntame lo que quieras sobre la app. Si no lo sé, te paso con el administrador.`,chips:['¿Cómo subo el extracto?','¿Qué es el ahorro del mes?','¿Cómo apunto un gasto en efectivo?']}]}
function escucharChat(){
  if(!NUBE||!USER||!fb.fsM.onSnapshot||CH_VIVO)return;CH_VIVO=true;
  const {collection,query,where,onSnapshot,doc}=fb.fsM;
  const ref=USER.admin?collection(fb.db,'mensajes'):query(collection(fb.db,'mensajes'),where('uid','==',USER.uid));
  let primera=true;
  UNSUB.push(onSnapshot(ref,qs=>{const antes=USER.admin?chNoLeidosAdmin():chNoLeidosUsuario();const r=[];qs.forEach(d=>r.push({id:d.id,...d.data()}));CH_MSGS=r.sort((a,b)=>a.fecha-b.fecha);
    const ahora=USER.admin?chNoLeidosAdmin():chNoLeidosUsuario();
    if(!primera&&ahora>antes&&!(CH_ABIERTO&&CH_MODO==='admin'))toast(USER.admin?'Mensaje nuevo en el chat':'El administrador te ha respondido');
    primera=false;chMarcarLeidos();rChat();rChatBtn();if(USER.admin){badgeUsuarios();if(TAB==='inicio')rInicio()}},e=>{console.warn('chat',e.code||e);CH_VIVO=false}));
  if(!USER.admin)UNSUB.push(onSnapshot(doc(fb.db,'presencia','admin'),sn=>{CH_PRES=sn.exists()?sn.data():null;rChat()},()=>{}));
}
// El administrador avisa de que está conectado (si no lo ha desactivado en Mi perfil)
let tPres=null;
function presencia(){
  clearInterval(tPres);if(!NUBE||!USER||!USER.admin)return;
  const latir=()=>{if(document.hidden)return;fb.fsM.setDoc(fb.fsM.doc(fb.db,'presencia','admin'),{visto:Date.now(),mostrar:pref('enLinea')}).catch(()=>{})};
  latir();tPres=setInterval(latir,60000);
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&USER&&USER.admin)presencia()});
function presenciaTxt(){
  const p=CH_PRES;if(!p||p.mostrar===false)return '<span class="mut">Te contestará en cuanto pueda</span>';
  const hace=Date.now()-(p.visto||0);
  return hace<150000?'<span class="enlinea">En línea</span>':`<span class="mut">Visto ${cuando(p.visto)} · te contestará en cuanto pueda</span>`;
}
function chMarcarLeidos(){
  if(!CH_ABIERTO||!NUBE||!USER)return;
  const xs=USER.admin?(CH_ADMIN_SEL?CH_MSGS.filter(m=>m.uid===CH_ADMIN_SEL&&m.de==='usuario'&&!m.leido):[]):(CH_MODO==='admin'?CH_MSGS.filter(m=>m.de==='admin'&&!m.leido):[]);
  for(const m of xs){m.leido=true;fb.fsM.updateDoc(fb.fsM.doc(fb.db,'mensajes',m.id),{leido:true}).catch(()=>{})}
}
async function chEnviarAdmin(texto,uidDestino){
  texto=String(texto||'').trim().slice(0,2000);if(!texto||!NUBE||!USER)return false;
  const admin=USER.admin&&uidDestino;
  const m={uid:admin?uidDestino:USER.uid,nombre:admin?((CH_MSGS.find(x=>x.uid===uidDestino)||{}).nombre||''):USER.nombre,de:admin?'admin':'usuario',texto,fecha:Date.now(),leido:false};
  try{const r=await fb.fsM.addDoc(fb.fsM.collection(fb.db,'mensajes'),m);if(!CH_MSGS.some(x=>x.id===r.id))CH_MSGS.push({id:r.id,...m});rChat();return true}
  catch(e){toast('No se ha podido enviar: '+(e.code||e.message)+(e.code==='permission-denied'?' (¿están publicadas las reglas nuevas?)':''),true);return false}
}
/* ============ Pintar ============ */
function rChatBtn(){
  const b=$('#rufoBtn');if(!b)return;
  b.classList.toggle('hide',!(NUBE?USER:S)||!pref('rufo'));
  const n=USER&&USER.admin?chNoLeidosAdmin():chNoLeidosUsuario();
  $('#rufoN').textContent=n||'';$('#rufoN').classList.toggle('hide',!n);
}
function burbuja(m){
  if(m.de==='rufo')return `<div class="cm rufo">${mascota(28,false)}<div class="cb">${m.t}${m.chips?`<div class="cchips">${m.chips.map(c=>`<button type="button" class="chip" data-q="${esc(c)}">${esc(c)}</button>`).join('')}</div>`:''}</div></div>`;
  if(m.de==='yo')return `<div class="cm yo"><div class="cb">${esc(m.t)}</div></div>`;
  const mio=USER&&(USER.admin?m.de==='admin':m.de==='usuario');
  return `<div class="cm ${mio?'yo':'otro'}"><div class="cb">${esc(m.texto)}<div class="ch">${new Date(m.fecha).toLocaleString('es-ES',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}${mio&&m.leido?' · leído':''}</div></div></div>`;
}
function rChat(){
  const p=$('#rufoPanel');if(!p||!CH_ABIERTO)return;
  const admin=USER&&USER.admin;
  let cab,cuerpo,pie=true;
  if(admin&&CH_MODO==='admin'){
    if(!CH_ADMIN_SEL){
      const convs={};for(const m of CH_MSGS){const c=convs[m.uid]||(convs[m.uid]={uid:m.uid,nombre:'',ult:m,n:0});if(m.de==='usuario'&&m.nombre)c.nombre=m.nombre;if(m.fecha>=c.ult.fecha)c.ult=m;if(m.de==='usuario'&&!m.leido)c.n++}
      const xs=Object.values(convs).sort((a,b)=>b.ult.fecha-a.ult.fecha);
      cab=`<button type="button" class="btn sm icon" id="chAtras" title="Volver con Rufo">‹</button><b>Mensajes de los usuarios</b>`;pie=false;
      cuerpo=xs.length?xs.map(c=>`<button type="button" class="cconv" data-u="${esc(c.uid)}">${avatarHtml(c.uid,c.nombre,undefined,34)}<span class="cc"><b>${esc(c.nombre||'Usuario')}</b><span class="mut small">${esc(c.ult.texto.slice(0,60))}</span></span>${c.n?`<span class="tag bad">${c.n}</span>`:''}</button>`).join(''):'<p class="mut small" style="padding:12px">Nadie te ha escrito todavía. Cuando Rufo no sepa responder algo, la persona te escribirá aquí.</p>';
    }else{
      const nombre=(CH_MSGS.find(m=>m.uid===CH_ADMIN_SEL&&m.de==='usuario')||{}).nombre||'Usuario';
      cab=`<button type="button" class="btn sm icon" id="chAtras" title="Volver">‹</button>${avatarHtml(CH_ADMIN_SEL,nombre,undefined,26)}<b>${esc(nombre)}</b>`;
      cuerpo=CH_MSGS.filter(m=>m.uid===CH_ADMIN_SEL).map(burbuja).join('');
    }
  }else if(CH_MODO==='admin'){
    cab=`<button type="button" class="btn sm icon" id="chAtras" title="Volver con Rufo">‹</button><span><b>El administrador</b><br><span class="small">${presenciaTxt()}</span></span>`;
    const mios=CH_MSGS.filter(m=>m.uid===USER.uid);
    cuerpo=(mios.length?'':`<div class="cm rufo">${mascota(28,false)}<div class="cb">Escribe aquí tu pregunta y le llegará al administrador. Te avisaré cuando conteste.</div></div>`)+mios.map(burbuja).join('');
  }else{
    cab=`${mascota(30,false)}<span><b>${MASCOTA}</b><br><span class="small mut">Te ayuda con la app</span></span>`;
    cuerpo=CH_RUFO.map(burbuja).join('');
  }
  const nAdm=admin?chNoLeidosAdmin():chNoLeidosUsuario();
  p.innerHTML=`<div class="chead">${cab}<span class="sp"></span>${CH_MODO==='rufo'&&NUBE&&USER?`<button type="button" class="btn sm" id="chAdm">${admin?'Mensajes':'Administrador'}${nAdm?` <span class="tag bad">${nAdm}</span>`:''}</button>`:''}<button type="button" class="btn sm icon" id="chCerrar" title="Cerrar">✕</button></div>
    <div class="cbody" id="chBody">${cuerpo}</div>
    ${pie?`<form class="cpie" id="chForm" autocomplete="off"><input type="text" id="chTxt" maxlength="2000" placeholder="${CH_MODO==='admin'?'Escribe un mensaje…':'Pregúntale a '+MASCOTA+'…'}"><button class="btn pri" type="submit">Enviar</button></form>`:''}`;
  const body=$('#chBody');body.scrollTop=body.scrollHeight;
  $('#chCerrar').onclick=()=>abrirChat(false);
  const at=$('#chAtras');if(at)at.onclick=()=>{if(admin&&CH_ADMIN_SEL)CH_ADMIN_SEL=null;else CH_MODO='rufo';rChat()};
  const ad=$('#chAdm');if(ad)ad.onclick=()=>{CH_MODO='admin';chMarcarLeidos();rChat();rChatBtn();const i=$('#chTxt');if(i)i.focus()};
  $$('#rufoPanel .cconv').forEach(b=>b.onclick=()=>{CH_ADMIN_SEL=b.dataset.u;chMarcarLeidos();rChat();rChatBtn();badgeUsuarios()});
  $$('#rufoPanel [data-q]').forEach(b=>b.onclick=()=>preguntarRufo(b.dataset.q));
  $$('#rufoPanel [data-ir]').forEach(b=>b.onclick=()=>{const f=FAQ[+b.dataset.ir];abrirChat(false);if(b.dataset.modo==='guia')guia({tab:f.ir.tab,sel:f.ir.padre?null:f.ir.sel,card:f.ir.card,t:f.p,d:f.ir.g||f.r});else{go(f.ir.tab);setTimeout(()=>{let el=$(f.ir.sel);if(el&&f.ir.card)el=el.closest('.card')||el;if(el)el.scrollIntoView({block:'center',behavior:'smooth'})},60)}});
  $$('#rufoPanel [data-esc]').forEach(b=>b.onclick=async()=>{const t=b.dataset.esc;CH_MODO='admin';rChat();if(await chEnviarAdmin(t))toast('Se lo he pasado al administrador')});
  $$('#rufoPanel [data-ok]').forEach(b=>b.onclick=()=>{CH_RUFO.push({de:'rufo',t:'¡Genial! Si tienes otra duda, aquí estoy 🦊'});rChat()});
  const fm=$('#chForm');if(fm)fm.onsubmit=async e=>{e.preventDefault();const t=$('#chTxt').value.trim();if(!t)return;$('#chTxt').value='';
    if(CH_MODO==='admin')await chEnviarAdmin(t,admin?CH_ADMIN_SEL:undefined);else preguntarRufo(t);
    const i=$('#chTxt');if(i)i.focus()};
}
function preguntarRufo(t){
  CH_RUFO.push({de:'yo',t});
  const rs=buscarRespuesta(t);
  const escalar=NUBE&&USER&&!USER.admin?`<button type="button" class="chip" data-esc="${esc(t)}">Preguntárselo al administrador</button>`:'';
  if(!rs.length)CH_RUFO.push({de:'rufo',t:`Uy, eso no lo sé 🤔 ${NUBE&&USER&&!USER.admin?'¿Quieres que se lo pregunte al administrador? Le llegará tu pregunta tal cual.':'Prueba con otras palabras o mira las preguntas frecuentes en Ayuda.'}<div class="cchips">${escalar}</div>`});
  else{const [a,...otras]=rs,f=a.f;
    CH_RUFO.push({de:'rufo',t:`<b>${esc(f.p)}</b><br>${esc(f.r)}${f.ir?`<div class="cchips"><button type="button" class="chip" data-ir="${a.i}">Ir a ${esc(f.ir.t)} →</button><button type="button" class="chip" data-ir="${a.i}" data-modo="guia">Enséñamelo</button></div>`:''}
      ${otras.length?`<div class="small mut" style="margin-top:8px">¿O quizá buscabas…?</div><div class="cchips">${otras.map(o=>`<button type="button" class="chip" data-q="${esc(o.f.p)}">${esc(o.f.p)}</button>`).join('')}</div>`:''}
      <div class="small mut" style="margin-top:8px">¿Te ha servido?</div><div class="cchips"><button type="button" class="chip" data-ok="1">Sí, gracias</button>${escalar.replace('Preguntárselo al administrador','No, pregúntaselo al administrador')}</div>`});}
  rChat();
}
function abrirChat(si){
  CH_ABIERTO=si;$('#rufoPanel').classList.toggle('hide',!si);$('#rufoBtn').classList.toggle('on',si);
  if(si){if(!CH_RUFO.length)chSaludo();escucharChat();chMarcarLeidos();rChat();rChatBtn();const i=$('#chTxt');if(i&&matchMedia('(min-width:641px)').matches)i.focus()}
}
$('#rufoBtn').onclick=()=>abrirChat(!CH_ABIERTO);
$('#rufoBtn').innerHTML=mascota(46,false)+'<span class="tag bad hide" id="rufoN"></span>';
