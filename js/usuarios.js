// Cuentas Claras · Pestaña Usuarios (solo administrador)
"use strict";
/* ============ Usuarios (administrador) ============ */
function haceCuanto(t){const d=Math.floor((Date.now()-t)/864e5);const h=new Date(t);
  if(d<1&&h.toDateString()===new Date().toDateString())return 'hoy';if(d<2)return 'ayer';if(d<30)return 'hace '+d+' días';return 'el '+h.toLocaleDateString('es-ES')}
let USERS=[],USERS_VIVO=false;
function parcheLocal(id,patch){const u=USERS.find(x=>x.id===id);if(u)Object.assign(u,patch);badgeUsuarios()}
const pendientesN=()=>USERS.filter(u=>u.estado==='pendiente'&&!u.eliminado).length;
function badgeUsuarios(){const n=pendientesN()+(typeof bzNuevas==='function'?bzNuevas():0)+(typeof ERR_TODOS!=='undefined'?ERR_TODOS.length:0);const t=$('#tabUsuarios');let b=$('.tag',t);if(!n){if(b)b.remove();return}if(!b){b=document.createElement('span');b.className='tag bad';t.appendChild(b)}b.textContent=n}
async function rUsuarios(){
  if(!USER||!USER.admin)return;
  rBuzonAdmin();rErroresAdmin();
  if(!USERS_VIVO){
    const {collection,getDocs}=fb.fsM;
    $('#uTable').innerHTML='<tbody><tr><td class="empty">Cargando…</td></tr></tbody>';
    const us=[];try{(await getDocs(collection(fb.db,'users'))).forEach(d=>us.push({id:d.id,...d.data()}))}catch(e){$('#uTable').innerHTML=`<tbody><tr><td class="empty">No se han podido leer los usuarios (${esc(e.code||e.message)}).</td></tr></tbody>`;return}
    USERS=us;badgeUsuarios();
  }
  const us=USERS;
  const pend=us.filter(u=>u.estado==='pendiente'&&!u.eliminado).sort((a,b)=>(a.creado||0)-(b.creado||0));
  const vivos=us.filter(u=>!u.eliminado&&u.estado!=='pendiente').sort((a,b)=>(b.rol==='admin')-(a.rol==='admin')||String(a.nombre).localeCompare(b.nombre));
  const bajas=us.filter(u=>u.eliminado).sort((a,b)=>(b.eliminadoEn||0)-(a.eliminadoEn||0));
  $('#uTable').innerHTML=`<thead><tr><th>Nombre</th><th>Estado</th><th></th></tr></thead><tbody>`+
    (pend.length?`<tr><td colspan="3" class="small" style="padding-top:12px"><b>Solicitudes de acceso</b> · esperan tu aprobación</td></tr>`+pend.map(u=>`<tr data-u="${u.id}" class="nocat"><td><div class="ucell">${avatarHtml(u.id,u.nombre,u.foto||'',32)}<div><div>${esc(u.nombre||'')}</div><div class="det">${esc(u.email||'')} · pedido ${u.creado?new Date(u.creado).toLocaleDateString('es-ES'):''}</div></div></div></td><td><span class="tag cash">pendiente</span></td><td class="r" style="white-space:nowrap"><button class="btn sm pri uok">Aprobar</button> <button class="btn sm dan uno">Rechazar</button></td></tr>`).join('')+`<tr><td colspan="3" class="small mut" style="padding-top:12px"><b>Usuarios</b></td></tr>`:'')+
    vivos.map(u=>`<tr data-u="${u.id}">
    <td><div class="ucell">${avatarHtml(u.id,u.nombre,u.foto||'',36)}<div><div>${esc(u.nombre||'')}${u.rol==='admin'?' <span class="tag acc">administrador</span>':''}</div><div class="det">${esc(u.email||'')}${u.creado?' · alta '+new Date(u.creado).toLocaleDateString('es-ES'):''}${u.ultimoAcceso?' · entró '+haceCuanto(u.ultimoAcceso):''}</div></div></div></td>
    <td>${u.activo?'<span class="tag good">activo</span>':'<span class="tag bad">desactivado</span>'}</td>
    <td class="r" style="white-space:nowrap"><button class="btn sm ur" title="Enviar correo para poner o cambiar la contraseña">Correo de contraseña</button>${u.id===USER.uid?'':` <button class="btn sm ua">${u.activo?'Desactivar':'Activar'}</button> <button class="btn sm dan ux" title="Eliminar usuario y todos sus datos">Eliminar</button>`}</td></tr>`).join('')+
    (bajas.length?`<tr><td colspan="3" class="small mut" style="padding-top:14px"><b>Eliminados</b> · sin datos ni acceso</td></tr>`+bajas.map(u=>`<tr data-u="${u.id}" class="off"><td><div>${esc(u.nombre||'')}</div><div class="det">${esc(u.email||'')} · eliminado ${u.eliminadoEn?new Date(u.eliminadoEn).toLocaleDateString('es-ES'):''}</div></td><td><span class="tag">eliminado</span></td><td class="r"><button class="btn sm urev">Dar de alta de nuevo</button></td></tr>`).join(''):'')+'</tbody>';
  $$('#uTable tr[data-u]').forEach(tr=>{const u=us.find(x=>x.id===tr.dataset.u);
    const ur=$('.ur',tr);if(ur)ur.onclick=async()=>{try{await fb.authM.sendPasswordResetEmail(fb.auth,u.email);toast('Correo enviado a '+u.email)}catch(e){toast('Error: '+(e.code||e.message),true)}};
    const ua=$('.ua',tr);if(ua)ua.onclick=()=>confirmar(u.activo?'Desactivar usuario':'Activar usuario',u.activo?`${u.nombre} no podrá entrar. Sus datos se conservan.`:`${u.nombre} podrá volver a entrar.`,u.activo?'Desactivar':'Activar',async()=>{
      try{await fb.fsM.updateDoc(fb.fsM.doc(fb.db,'users',u.id),{activo:!u.activo});toast('Hecho');parcheLocal(u.id,{activo:!u.activo});rUsuarios()}catch(e){toast('Error: '+(e.code||e.message),true)}});
    const ux=$('.ux',tr);if(ux)ux.onclick=()=>eliminarUsuario(u);
    const urev=$('.urev',tr);if(urev)urev.onclick=()=>reactivarUsuario(u,u.nombre);
    const uok=$('.uok',tr);if(uok)uok.onclick=async()=>{try{await fb.fsM.updateDoc(fb.fsM.doc(fb.db,'users',u.id),{activo:true,estado:'activo',aprobado:Date.now()});toast(u.nombre+' ya puede entrar');parcheLocal(u.id,{activo:true,estado:'activo'});rUsuarios()}catch(e){toast('Error: '+(e.code||e.message),true)}};
    const uno=$('.uno',tr);if(uno)uno.onclick=()=>confirmar('Rechazar solicitud',`${u.nombre} (${u.email}) no podrá entrar.`,'Rechazar',async()=>{try{await fb.fsM.updateDoc(fb.fsM.doc(fb.db,'users',u.id),{activo:false,estado:'rechazada',eliminado:true,eliminadoEn:Date.now()});toast('Solicitud rechazada');parcheLocal(u.id,{activo:false,estado:'rechazada',eliminado:true,eliminadoEn:Date.now()});rUsuarios()}catch(e){toast('Error: '+(e.code||e.message),true)}});
  });
}
function eliminarUsuario(u){
  dialog('Eliminar a '+u.nombre,`<p>Se borrarán <b>todos sus movimientos, ajustes y presupuesto</b>, y ya no podrá entrar. <b>No se puede deshacer.</b></p>
    <p class="small mut">Si solo quieres quitarle el acceso por un tiempo, usa «Desactivar»: conserva sus datos.</p>
    <p style="margin-bottom:6px">Para confirmar, escribe <b>ELIMINAR</b>:</p><input type="text" id="uxConf" autocomplete="off" style="width:100%">`,
   [{t:'Cancelar'},{t:'Eliminar definitivamente',cls:'dan',fn:()=>{
     if($('#uxConf').value.trim().toUpperCase()!=='ELIMINAR'){toast('Escribe ELIMINAR para confirmar',true);$('#uxConf').focus();return false}
     borrarDatosUsuario(u);}}]);
  setTimeout(()=>$('#uxConf')&&$('#uxConf').focus(),50);
}
async function borrarDatosUsuario(u){
  const {doc,writeBatch,updateDoc}=fb.fsM;
  toast('Eliminando a '+u.nombre+'…');
  try{
    await updateDoc(doc(fb.db,'users',u.id),{activo:false});
    // Borrar sus datos: ajustes y un documento por mes (2000 → dentro de 2 años)
    const refs=[doc(fb.db,'users',u.id,'estado','meta')];
    const fin=new Date().getFullYear()+2;
    for(let y=2000;y<=fin;y++)for(let m=1;m<=12;m++)refs.push(doc(fb.db,'users',u.id,'meses',y+'-'+String(m).padStart(2,'0')));
    for(let i=0;i<refs.length;i+=450){const b=writeBatch(fb.db);refs.slice(i,i+450).forEach(r=>b.delete(r));await b.commit()}
    try{await fb.fsM.deleteDoc(doc(fb.db,'perfiles',u.id))}catch(_){}
    await updateDoc(doc(fb.db,'users',u.id),{activo:false,eliminado:true,eliminadoEn:Date.now()});
    dialog('Usuario eliminado',`<p>Se han borrado los datos de <b>${esc(u.nombre)}</b> y ya no puede entrar.</p><p class="small mut">Su correo sigue registrado en Firebase por si algún día quieres darle de alta de nuevo (empezaría sin datos). Si quieres borrarlo también de ahí: consola de Firebase → Authentication → Usuarios → ⋮ junto a ${esc(u.email)} → Eliminar cuenta.</p>`,[{t:'Entendido',cls:'pri'}]);
  }catch(e){console.error(e);toast('No se ha podido eliminar: '+(e.code||e.message)+(e.code==='permission-denied'?' (¿están publicadas las reglas nuevas?)':''),true)}
  USERS_VIVO=false;rUsuarios();
}
async function reactivarUsuario(u,nombre){
  try{
    await fb.fsM.setDoc(fb.fsM.doc(fb.db,'users',u.id),{nombre:nombre||u.nombre,email:u.email,activo:true,rol:'usuario',creado:Date.now()});
    await fb.authM.sendPasswordResetEmail(fb.auth,u.email);
    dialog('Alta de nuevo',`<p><b>${esc(nombre||u.nombre)}</b> vuelve a tener cuenta (empieza sin datos). Le ha llegado un correo a <b>${esc(u.email)}</b> para poner su contraseña.</p>`,[{t:'Entendido',cls:'pri'}]);
  }catch(e){toast('Error: '+(e.code||e.message),true)}
  USERS_VIVO=false;rUsuarios();
}
$('#uAdd').onsubmit=async e=>{
  e.preventDefault();const nombre=$('#uNom').value.trim(),email=$('#uMail').value.trim().toLowerCase();if(!nombre||!email)return;
  const prev=USERS.find(u=>(u.email||'').toLowerCase()===email);
  if(prev&&prev.eliminado){$('#uNom').value='';$('#uMail').value='';return reactivarUsuario(prev,nombre)}
  if(prev){toast('Ese correo ya tiene cuenta',true);return}
  const btn=$('#uAdd button');btn.disabled=true;
  try{
    const {appM,authM,fsM}=fb;
    const sec=appM.getApps().find(a=>a.name==='alta')||appM.initializeApp(CFG.firebase,'alta');
    let sAuth;try{sAuth=authM.initializeAuth(sec,{persistence:authM.inMemoryPersistence})}catch(_){sAuth=authM.getAuth(sec)}
    const pw=[...crypto.getRandomValues(new Uint8Array(24))].map(b=>'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!$%*'[b%61]).join('');
    const cred=await authM.createUserWithEmailAndPassword(sAuth,email,pw);
    await fsM.setDoc(fsM.doc(fb.db,'users',cred.user.uid),{nombre,email,activo:true,rol:'usuario',creado:Date.now()});
    await authM.signOut(sAuth);
    await authM.sendPasswordResetEmail(fb.auth,email);
    $('#uNom').value='';$('#uMail').value='';
    dialog('Usuario creado',`<p><b>${esc(nombre)}</b> ya tiene cuenta. Le ha llegado un correo a <b>${esc(email)}</b> para poner su contraseña. Después solo tiene que abrir el programa y entrar.</p>`,[{t:'Entendido',cls:'pri'}]);
    USERS_VIVO=false;rUsuarios();
  }catch(err){toast(err.code==='auth/email-already-in-use'?'Ya existe una cuenta con ese correo':'No se ha podido crear: '+(err.code||err.message),true)}
  finally{btn.disabled=false}
};
