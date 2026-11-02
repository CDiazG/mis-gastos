// Cuentas Claras · Registro de errores: lo que falla (extractos que no se leen, fallos de la app)
// queda anotado para que el administrador lo vea en Usuarios. Nunca se guarda el contenido del extracto.
"use strict";
let ERR_TODOS=[],ERR_N=0;const ERR_VISTOS=new Set();
async function registrarError(tipo,mensaje,detalle=''){
  try{
    const k=tipo+'|'+mensaje+'|'+detalle;if(ERR_VISTOS.has(k)||ERR_N>=15)return false;ERR_VISTOS.add(k);ERR_N++;
    if(!NUBE||!USER||!fb||!fb.fsM)return false;
    await fb.fsM.addDoc(fb.fsM.collection(fb.db,'errores'),{uid:USER.uid,nombre:USER.nombre,tipo,mensaje:String(mensaje).slice(0,1000),detalle:String(detalle).slice(0,1000),version:VERSION,dispositivo:dispositivo(),fecha:Date.now()});
    return true;
  }catch(e){console.warn('registro de errores',e.code||e);return false}
}
// Descripción del archivo sin su contenido: nombre, formato y tamaño
const descArchivo=f=>`${String(f.name||'').slice(0,80)} · ${(f.name.split('.').pop()||'?').toLowerCase()} · ${f.type||'sin tipo'} · ${Math.round((f.size||0)/1024)} KB`;
// Fallos inesperados de la app
window.addEventListener('error',e=>{if(!e.message||/ResizeObserver/.test(e.message))return;registrarError('app',e.message,`${(e.filename||'').split('/').pop()}:${e.lineno||''}:${e.colno||''} · pestaña ${typeof TAB!=='undefined'?TAB:'?'}`)});
window.addEventListener('unhandledrejection',e=>{const r=e.reason||{};const m=r.message||String(r);if(/permission-denied|offline|network/i.test(m+(r.code||'')))return;registrarError('app',m,'promesa sin capturar · pestaña '+(typeof TAB!=='undefined'?TAB:'?'))});
// Administrador: escuchar y ver los errores
function escucharErrores(){
  if(!USER||!USER.admin||!fb.fsM.onSnapshot)return;
  UNSUB.push(fb.fsM.onSnapshot(fb.fsM.collection(fb.db,'errores'),qs=>{const r=[];qs.forEach(d=>r.push({id:d.id,...d.data()}));ERR_TODOS=r.sort((a,b)=>b.fecha-a.fecha);
    badgeUsuarios();if(TAB==='usuarios'&&!$('#dlg').open)rErroresAdmin()},e=>console.warn('errores',e.code||e)));
}
const ERR_TIPOS={importar:'📄 Extracto',app:'⚠️ App'};
function rErroresAdmin(){
  const el=$('#errAdmin');if(!el)return;if(!USER||!USER.admin){el.innerHTML='';return}
  const xs=ERR_TODOS;
  el.innerHTML=`<div class="ghead"><span class="t">Errores registrados</span><span class="r">${xs.length?`<button class="btn sm" type="button" id="errBorrarTodo">Borrar todos</button>`:''}</span></div>`+
    (xs.length?xs.slice(0,100).map(x=>`<div class="crow" style="cursor:default" data-e="${x.id}"><div class="a" style="flex-wrap:wrap"><span>${ERR_TIPOS[x.tipo]||esc(x.tipo)} · <b>${esc(x.nombre||'')}</b> <span class="mut small">${new Date(x.fecha).toLocaleString('es-ES',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span></span><button class="btn sm erX" type="button">Resuelto</button></div>
      <div style="margin-top:4px;font-weight:600">${esc(x.mensaje)}</div>${x.detalle?`<div class="det" style="margin-top:2px">${esc(x.detalle)}</div>`:''}<div class="det">versión ${esc(x.version||'?')} · ${esc(x.dispositivo||'')}</div></div>`).join('')
    :'<div class="pad small mut">No hay errores. Si un extracto no se puede leer o algo falla, aparecerá aquí.</div>');
  $$('#errAdmin [data-e]').forEach(r=>$('.erX',r).onclick=async()=>{try{await fb.fsM.deleteDoc(fb.fsM.doc(fb.db,'errores',r.dataset.e));ERR_TODOS=ERR_TODOS.filter(x=>x.id!==r.dataset.e);badgeUsuarios();rErroresAdmin()}catch(e){toast('No se ha podido: '+(e.code||e.message),true)}});
  const bt=$('#errBorrarTodo');if(bt)bt.onclick=()=>confirmar('Borrar errores','¿Borrar los '+xs.length+' errores registrados?','Borrar',async()=>{try{for(const x of xs)await fb.fsM.deleteDoc(fb.fsM.doc(fb.db,'errores',x.id));ERR_TODOS=[];badgeUsuarios();rErroresAdmin();toast('Borrados')}catch(e){toast('No se ha podido: '+(e.code||e.message),true)}});
}
