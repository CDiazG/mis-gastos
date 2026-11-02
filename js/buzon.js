// Cuentas Claras · Buzón de sugerencias y quejas (Ajustes) y su lectura por el administrador (Usuarios)
"use strict";
/* ============ Buzón de sugerencias ============ */
const BZ_TIPOS={sugerencia:'💡 Sugerencia',queja:'😕 Queja',error:'🐞 Algo no funciona'};
const BZ_EST={nueva:'<span class="tag">enviada</span>',vista:'<span class="tag acc">vista</span>',hecha:'<span class="tag good">hecha</span>'};
let bzTipo='sugerencia',BZ_MIAS=[],BZ_TODAS=[],BZ_VIVO=false,BZ_VIVO_PREVIO=false;
const bzNuevas=()=>BZ_TODAS.filter(x=>x.estado==='nueva').length;
function dispositivo(){const ua=navigator.userAgent;
  const so=/Android/.test(ua)?'Android':/iPhone|iPad|iPod/.test(ua)?'iPhone/iPad':/Macintosh/.test(ua)?'Mac':/Windows/.test(ua)?'Windows':/Linux/.test(ua)?'Linux':'otro';
  const nav=/Edg\//.test(ua)?'Edge':/Chrome\//.test(ua)?'Chrome':/Firefox\//.test(ua)?'Firefox':/Safari\//.test(ua)?'Safari':'navegador';
  return `${so} · ${nav}${typeof instalada==='function'&&instalada()?' · app instalada':''}`}
function rBuzon(){
  $('#bzTipo').innerHTML=Object.entries(BZ_TIPOS).map(([k,v])=>`<button type="button" class="chip${k===bzTipo?' on':''}" data-t="${k}">${v}</button>`).join('');
  $$('#bzTipo .chip').forEach(b=>b.onclick=()=>{bzTipo=b.dataset.t;rBuzon()});
  const activo=NUBE&&USER;$('#bzGo').disabled=!activo;$('#bzTxt').disabled=!activo;
  if(!activo){$('#bzMias').innerHTML='<p class="small mut">Disponible cuando entras con tu cuenta.</p>';return}
  $('#bzMias').innerHTML=BZ_MIAS.length?'<div class="small mut" style="margin:6px 0 4px">Lo que has enviado</div>'+BZ_MIAS.map(x=>`<div style="border-top:1px solid var(--line);padding:8px 0"><div class="small" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${BZ_TIPOS[x.tipo]||''} ${BZ_EST[x.estado]||''}<span class="mut">${new Date(x.fecha).toLocaleDateString('es-ES')}</span></div><div style="white-space:pre-wrap;margin-top:3px">${esc(x.texto)}</div></div>`).join(''):'';
}
async function cargarMias(){
  if(!NUBE||!USER)return;
  try{const {collection,query,where,getDocs}=fb.fsM;const r=[];
    (await getDocs(query(collection(fb.db,'sugerencias'),where('uid','==',USER.uid)))).forEach(d=>r.push({id:d.id,...d.data()}));
    BZ_MIAS=r.sort((a,b)=>b.fecha-a.fecha);if(TAB==='ayuda')rBuzon()}catch(e){console.warn('buzón',e.code||e)}
}
$('#buzonF').onsubmit=async e=>{
  e.preventDefault();const texto=$('#bzTxt').value.trim();if(!texto||!NUBE||!USER)return;
  $('#bzGo').disabled=true;
  try{await fb.fsM.addDoc(fb.fsM.collection(fb.db,'sugerencias'),{uid:USER.uid,nombre:USER.nombre,email:USER.email,tipo:bzTipo,texto,version:VERSION,dispositivo:dispositivo(),fecha:Date.now(),estado:'nueva'});
    $('#bzTxt').value='';toast('¡Gracias! Le ha llegado al administrador');await cargarMias()}
  catch(err){toast('No se ha podido enviar: '+(err.code||err.message),true)}
  finally{$('#bzGo').disabled=false;rBuzon()}
};
// Administrador: escuchar todas las sugerencias
function escucharBuzon(){
  BZ_VIVO_PREVIO=false;
  if(!USER||!USER.admin||!fb.fsM.onSnapshot)return;
  UNSUB.push(fb.fsM.onSnapshot(fb.fsM.collection(fb.db,'sugerencias'),qs=>{
    const r=[];qs.forEach(d=>r.push({id:d.id,...d.data()}));const antes=bzNuevas();
    BZ_TODAS=r.sort((a,b)=>b.fecha-a.fecha);BZ_VIVO=true;badgeUsuarios();
    if(TAB==='usuarios'&&!$('#dlg').open)rBuzonAdmin();
    if(TAB==='resumen'&&!$('#dlg').open&&bzNuevas()!==antes)rResumen();
    if(BZ_VIVO_PREVIO&&bzNuevas()>antes)toast('Nueva sugerencia de '+(BZ_TODAS.find(x=>x.estado==='nueva')||{}).nombre);
    BZ_VIVO_PREVIO=true;
  },e=>console.warn('buzón admin',e.code||e)));
}
function rBuzonAdmin(){
  const el=$('#bzAdmin');if(!USER||!USER.admin){el.innerHTML='';return}
  const xs=BZ_TODAS;
  el.innerHTML=`<div class="ghead"><span class="t">Sugerencias recibidas</span><span class="r">${bzNuevas()?bzNuevas()+' sin leer':''}</span></div>`+
    (xs.length?xs.map(x=>`<div class="crow" style="cursor:default" data-b="${x.id}"><div class="a" style="flex-wrap:wrap"><span>${BZ_TIPOS[x.tipo]||''} · <b>${esc(x.nombre||'')}</b> <span class="mut small">${new Date(x.fecha).toLocaleString('es-ES',{dateStyle:'short',timeStyle:'short'})}</span></span>
      <span style="display:flex;gap:6px;align-items:center"><select class="bzE" style="font-size:13px;padding:3px 6px">${Object.keys(BZ_EST).map(k=>`<option value="${k}"${k===x.estado?' selected':''}>${{nueva:'Nueva',vista:'Vista',hecha:'Hecha'}[k]}</option>`).join('')}</select><button class="btn sm icon dan bzX" title="Borrar">✕</button></span></div>
      <div style="white-space:pre-wrap;margin-top:6px;${x.estado==='nueva'?'font-weight:600':''}">${esc(x.texto)}</div>
      <div class="det" style="margin-top:4px">${esc(x.email||'')} · versión ${esc(x.version||'?')} · ${esc(x.dispositivo||'')}</div></div>`).join('')
    :'<div class="pad small mut">Todavía no ha llegado ninguna.</div>');
  $$('#bzAdmin [data-b]').forEach(r=>{const x=xs.find(y=>y.id===r.dataset.b);
    $('.bzE',r).onchange=async e=>{try{await fb.fsM.updateDoc(fb.fsM.doc(fb.db,'sugerencias',x.id),{estado:e.target.value});x.estado=e.target.value;badgeUsuarios();rBuzonAdmin();toast('Marcada como '+e.target.value)}catch(err){toast('Error: '+(err.code||err.message),true)}};
    $('.bzX',r).onclick=()=>confirmar('Borrar sugerencia','¿Borrar esta sugerencia de '+(x.nombre||'')+'?','Borrar',async()=>{try{await fb.fsM.deleteDoc(fb.fsM.doc(fb.db,'sugerencias',x.id));BZ_TODAS=BZ_TODAS.filter(y=>y!==x);badgeUsuarios();rBuzonAdmin()}catch(err){toast('Error: '+(err.code||err.message),true)}});
  });
}
