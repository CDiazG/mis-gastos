// Cuentas Claras · Pantalla de entrada, instalación como app y aviso de versión nueva
"use strict";
/* ============ Acceso ============ */
const ERR_AUTH={'auth/invalid-credential':'Correo o contraseña incorrectos.','auth/wrong-password':'Correo o contraseña incorrectos.','auth/user-not-found':'Correo o contraseña incorrectos.','auth/too-many-requests':'Demasiados intentos. Espera unos minutos o recupera la contraseña.','auth/invalid-email':'El correo no es válido.','auth/network-request-failed':'Sin conexión a internet.','auth/weak-password':'La contraseña tiene que tener al menos 6 caracteres.','auth/email-already-in-use':'Ya existe una cuenta con ese correo: entra con tu contraseña.','auth/password-does-not-meet-requirements':'La contraseña no cumple los requisitos: mínimo 8 caracteres, con minúsculas y números.'};
const errAuth=e=>ERR_AUTH[e.code]||('Error: '+(e.code||e.message));
function lMsg(t,err){$('#lMsg').innerHTML=t?`<div class="msg${err?' err':''}">${t}</div>`:''}
function modoContinuar(on){$('#lCont').classList.toggle('hide',!on);$('#lForm').classList.toggle('hide',on);$$('#login .links').forEach(l=>l.classList.toggle('hide',on));$('#lSub').classList.toggle('hide',on)}
let usuarioGuardado=null;
function mostrarContinuar(u){usuarioGuardado=u;mostrarLogin();modoContinuar(true);$('#lContMail').textContent=u.email;$('#lContAv').textContent=(u.email||'?').charAt(0).toUpperCase();$('#lContGo').focus()}
$('#lContGo').onclick=()=>{const u=usuarioGuardado;usuarioGuardado=null;modoContinuar(false);lMsg('Entrando…');entrar(u)};
$('#lContOtra').onclick=async()=>{usuarioGuardado=null;await fb.authM.signOut(fb.auth);modoContinuar(false);$('#lMail').value='';$('#lPass').value='';lMsg('');$('#lMail').focus()};
function mostrarLogin(msg,err){$('#login').classList.remove('hide');modoContinuar(false);$('#fabCash').classList.add('hide');$('#rufoBtn').classList.add('hide');$('#rufoPanel').classList.add('hide');$('#lPass').type='password';$('#lVer .tacha').style.display='none';$('#userbox').classList.add('hide');lMsg(msg,err);$('#lGo').disabled=false}
const adminYaCreado=()=>{try{return localStorage.getItem('mg-admin-ok')==='1'}catch(_){return false}};
$('#lMail').addEventListener('input',async()=>{$('#lAlta').classList.toggle('hide',adminYaCreado()||!(await esAdminMail($('#lMail').value)))});
let modoSolicitud=false;
function setModo(sol){modoSolicitud=sol;$('#lNomWrap').classList.toggle('hide',!sol);$('#lNom').required=sol;
  $('#lGo').textContent=sol?'Enviar solicitud':'Entrar';
  $('#lSub').textContent=sol?'Pide acceso con tu correo y elige una contraseña. El administrador tiene que aprobarlo antes de que puedas entrar.':'Entra con tu correo y tu contraseña.';
  $('#lPass').setAttribute('autocomplete',sol?'new-password':'current-password');
  $('#lPass').placeholder=sol?'Elige una contraseña (mín. 8, con minúsculas y números)':'Contraseña';
  $('#lSolic').textContent=sol?'Ya tengo cuenta: entrar':'¿No tienes cuenta? Solicitar acceso';
  $('#lOlvido').classList.toggle('hide',sol);if(sol)$('#lAlta').classList.add('hide');lMsg('');(sol?$('#lNom'):$('#lMail')).focus()}
$('#lSolic').onclick=()=>setModo(!modoSolicitud);
async function solicitar(){
  const nombre=$('#lNom').value.trim(),m=$('#lMail').value.trim().toLowerCase(),p=$('#lPass').value;
  if(!nombre){lMsg('Escribe tu nombre.',true);$('#lNom').focus();return}
  if(await esAdminMail(m)){lMsg('Ese es el correo del administrador: usa «Entrar».',true);return}
  if(p.length<8||!/[a-z]/.test(p)||!/\d/.test(p)){lMsg('La contraseña tiene que tener al menos 8 caracteres, con minúsculas y números.',true);$('#lPass').focus();return}
  creandoAdmin=true;$('#lGo').disabled=true;lMsg('Enviando solicitud…');
  let existia=false;
  try{
    let u;
    try{u=(await fb.authM.createUserWithEmailAndPassword(fb.auth,m,p)).user}
    catch(err){if(err.code!=='auth/email-already-in-use')throw err;existia=true;u=(await fb.authM.signInWithEmailAndPassword(fb.auth,m,p)).user}
    const ref=fb.fsM.doc(fb.db,'users',u.uid);
    let perfil=null;try{const sn=await fb.fsM.getDoc(ref);perfil=sn.exists()?sn.data():null}catch(_){}
    if(perfil){await fb.authM.signOut(fb.auth);setModo(false);
      lMsg(perfil.activo?'Ya tienes cuenta: entra con tu correo y tu contraseña.':perfil.estado==='pendiente'?'Ya enviaste la solicitud y está pendiente de aprobación.':'Esa cuenta no está activa. Habla con el administrador.',!perfil.activo&&perfil.estado!=='pendiente');return}
    await fb.fsM.setDoc(ref,{nombre,email:m,activo:false,rol:'usuario',estado:'pendiente',creado:Date.now()});
    await fb.authM.signOut(fb.auth);
    setModo(false);$('#lPass').value='';
    lMsg('Solicitud enviada. Cuando el administrador la apruebe, podrás entrar con tu correo y la contraseña que acabas de elegir.');
  }catch(err){try{await fb.authM.signOut(fb.auth)}catch(_){}
    lMsg(existia&&(err.code==='auth/invalid-credential'||err.code==='auth/wrong-password')?'Ese correo ya tiene cuenta. Si es tuyo, entra o usa «¿Has olvidado la contraseña?».':errAuth(err),true)}
  finally{creandoAdmin=false;$('#lGo').disabled=false}
}
$('#lForm').onsubmit=async e=>{e.preventDefault();if(modoSolicitud)return solicitar();$('#lGo').disabled=true;lMsg('Entrando…');
  try{await fb.authM.signInWithEmailAndPassword(fb.auth,$('#lMail').value.trim(),$('#lPass').value)}catch(err){lMsg(errAuth(err),true);$('#lGo').disabled=false}};
$('#lVer').onclick=()=>{const i=$('#lPass'),ver=i.type==='password';i.type=ver?'text':'password';
  $('#lVer .tacha').style.display=ver?'':'none';const t=ver?'Ocultar contraseña':'Mostrar contraseña';$('#lVer').title=t;$('#lVer').setAttribute('aria-label',t);i.focus()};
$('#lOlvido').onclick=async()=>{const m=$('#lMail').value.trim();if(!m){lMsg('Escribe primero tu correo.',true);$('#lMail').focus();return}
  try{await fb.authM.sendPasswordResetEmail(fb.auth,m);lMsg('Si ese correo tiene cuenta, te llegará un enlace para poner una contraseña nueva. Mira también en spam.')}catch(err){lMsg(errAuth(err),true)}};
$('#lAlta').onclick=async()=>{const m=$('#lMail').value.trim(),p=$('#lPass').value;
  if(!(await esAdminMail(m)))return;if(p.length<8||!/[a-z]/.test(p)||!/\d/.test(p)){lMsg('Elige una contraseña de al menos 8 caracteres, con minúsculas y números, y vuelve a pulsar.',true);$('#lPass').focus();return}
  creandoAdmin=true;
  try{const c=await fb.authM.createUserWithEmailAndPassword(fb.auth,m,p);await fb.authM.sendEmailVerification(c.user);try{localStorage.setItem('mg-verif',Date.now())}catch(_){}await fb.authM.signOut(fb.auth);
    mostrarLogin('Cuenta creada. Te he enviado un correo para verificarla: ábrelo, pulsa el enlace y vuelve aquí a entrar.')}catch(err){lMsg(errAuth(err),true)}
  finally{creandoAdmin=false}};
async function salir(forzar){
  const btn=$('#logout');btn.disabled=true;btn.textContent='Saliendo…';
  try{
    await flush();
    if(!forzar){
      const ok=await Promise.race([fb.fsM.waitForPendingWrites(fb.db).then(()=>true),new Promise(r=>setTimeout(()=>r(false),5000))]);
      if(!ok){btn.disabled=false;btn.textContent='Salir';
        dialog('Hay cambios sin guardar',`<p>Parece que no hay conexión a internet y quedan cambios por subir a la nube. Si sales ahora, <b>esos cambios se perderán</b>.</p><p class="small mut">Lo mejor es esperar a tener conexión y volver a pulsar «Salir».</p>`,[{t:'Esperar'},{t:'Salir igualmente',cls:'dan',fn:()=>{salir(true)}}]);
        return}
    }
    saliendo=true;pararEscucha();try{sessionStorage.removeItem('mg-sesion')}catch(_){}
    await fb.authM.signOut(fb.auth);
    try{await fb.fsM.terminate(fb.db)}catch(e){console.warn(e)}
    try{await fb.fsM.clearIndexedDbPersistence(fb.db)}catch(e){console.warn('No se pudo borrar la copia local (¿otra pestaña abierta?)',e)}
  }catch(e){console.error(e)}
  location.reload();
}
$('#logout').onclick=()=>salir(false);
$('#miNombreF').onsubmit=async e=>{e.preventDefault();const n=$('#miNombre').value.trim();if(!n||!USER)return;
  try{await fb.fsM.updateDoc(fb.fsM.doc(fb.db,'users',USER.uid),{nombre:n});USER.nombre=n;fb.fsM.setDoc(fb.fsM.doc(fb.db,'perfiles',USER.uid),{nombre:n,foto:USER.foto||''}).catch(()=>{});pintarCuenta();$('#cuentaTxt').innerHTML='Has entrado como <b>'+esc(n)+'</b> ('+esc(USER.email)+').';toast('Nombre guardado')}catch(err){toast('Error: '+(err.code||err.message),true)}};
$('#cambiarPass').onclick=async()=>{if(!NUBE||!USER)return;try{await fb.authM.sendPasswordResetEmail(fb.auth,USER.email);toast('Te he enviado un correo para cambiar la contraseña')}catch(e){toast(errAuth(e),true)}};
async function entrar(u){
  const {doc,getDoc,setDoc}=fb.fsM;
  const admin=await esAdminMail(u.email);
  if(admin&&!u.emailVerified){
    let ult=0;try{ult=+localStorage.getItem('mg-verif')||0}catch(_){}
    let reenviado=false;if(Date.now()-ult>10*60*1000){try{await fb.authM.sendEmailVerification(u);localStorage.setItem('mg-verif',Date.now());reenviado=true}catch(_){}}
    await fb.authM.signOut(fb.auth);mostrarLogin('Antes de entrar, verifica tu correo con el enlace que te llegó'+(reenviado?' (te acabo de enviar otro)':'')+'. Mira también en spam.',true);return}
  let perfil=null;
  try{const sn=await getDoc(doc(fb.db,'users',u.uid));perfil=sn.exists()?sn.data():null}catch(e){console.warn(e)}
  if(admin&&!perfil){perfil={nombre:'Administrador',email:u.email,activo:true,rol:'admin',creado:Date.now()};await setDoc(doc(fb.db,'users',u.uid),perfil)}
  if(!perfil||!perfil.activo){await fb.authM.signOut(fb.auth);
    mostrarLogin(perfil&&perfil.estado==='pendiente'&&!perfil.eliminado?'Tu solicitud de acceso está pendiente. Podrás entrar cuando el administrador la apruebe.':perfil&&perfil.estado==='rechazada'?'Tu solicitud de acceso no ha sido aceptada.':'Tu cuenta no está activa. Habla con el administrador.',!(perfil&&perfil.estado==='pendiente'));return}
  USER={uid:u.uid,email:u.email,nombre:perfil.nombre||u.email,admin,foto:perfil.foto||''};
  try{fb.fsM.setDoc(doc(fb.db,'perfiles',u.uid),{nombre:USER.nombre,foto:USER.foto}).catch(e=>console.warn('perfil público',e.code||e))}catch(_){}
  try{fb.fsM.updateDoc(doc(fb.db,'users',u.uid),{ultimoAcceso:Date.now()}).catch(e=>console.warn('último acceso',e.code||e))}catch(_){}
  try{sessionStorage.setItem('mg-sesion',u.uid)}catch(_){}
  if(admin){try{localStorage.setItem('mg-admin-ok','1')}catch(_){}$('#lAlta').classList.add('hide')}
  try{await cargarNube()}catch(e){console.error(e);mostrarLogin('No se han podido cargar tus datos: '+(e.code||e.message),true);return}
  $('#login').classList.add('hide');$('#userbox').classList.remove('hide');pintarCuenta();setSync('ok');
  $('#tabUsuarios').classList.toggle('hide',!admin);
  $('#cuentaTxt').innerHTML='Has entrado como <b>'+esc(USER.nombre)+'</b> ('+esc(USER.email)+').'+'';
  $('#miNombre').value=USER.nombre;
  iniciarUI();
}

/* ============ Instalar (acceso directo) ============ */
let promptInstalar=null;
const instalada=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
function instUI(){
  const puede=!!promptInstalar&&!instalada();
  $('#instalarTop').classList.toggle('hide',!puede);
  const b=$('#instalarBtn');if(!b)return;b.classList.toggle('hide',!puede);
  if(instalada()){$('#instTxt').textContent='Ya la estás usando como aplicación instalada. Aparece en el escritorio y en el menú de inicio.';$('#instPasos').innerHTML='';return}
  $('#instTxt').textContent=puede?'Crea un icono en el escritorio que abre Cuentas Claras en su propia ventana, como un programa más.':'Puedes crear un icono en el escritorio que abre Cuentas Claras en su propia ventana:';
  $('#instPasos').innerHTML=puede?'':`<ul style="margin:8px 0 0;padding-left:18px">
    <li><b>Chrome:</b> menú ⋮ → «Enviar, guardar y compartir» → «Instalar página como aplicación…» (o el icono de instalar a la derecha de la barra de direcciones).</li>
    <li><b>Edge:</b> menú … → «Aplicaciones» → «Instalar este sitio como una aplicación».</li>
    <li><b>Safari (Mac):</b> menú «Archivo» → «Añadir al Dock».</li>
    <li><b>Móvil:</b> en Chrome, menú ⋮ → «Añadir a pantalla de inicio»; en el iPhone, botón Compartir → «Añadir a pantalla de inicio».</li></ul>`;
}
async function instalar(){if(!promptInstalar)return;promptInstalar.prompt();const r=await promptInstalar.userChoice;promptInstalar=null;instUI();if(r&&r.outcome==='accepted')toast('Instalada. Ya tienes el icono en el escritorio.')}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();promptInstalar=e;instUI()});
window.addEventListener('appinstalled',()=>{promptInstalar=null;instUI()});
$('#instalarTop').onclick=instalar;$('#instalarBtn').onclick=instalar;
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(e=>console.warn(e));

/* ============ Actualizaciones ============ */
async function buscarVersion(){
  try{const r=await fetch('version.json?t='+Date.now(),{cache:'no-store'});if(!r.ok)return;const j=await r.json();
    if(j.version&&cmpV(j.version,VERSION)>0){$('#updTxt').textContent='Hay una versión nueva ('+j.version+').';$('#updBar').classList.remove('hide')}}catch(_){}
}
$('#updGo').onclick=async()=>{if(NUBE&&USER)await flush();const u=new URL(location.href);u.searchParams.set('v',Date.now());location.replace(u.href)};
