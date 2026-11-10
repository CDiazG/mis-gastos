// Cuentas Claras · Mi perfil: tu foto y tus datos, cómo ves la app, tus avisos y tu actividad
"use strict";
/* ============ Mi perfil ============ */
$('#pfSalir').onclick=()=>$('#logout').click();
function rPerfil(){
  const nube=NUBE&&USER;
  $('#pfFoto').innerHTML=nube?avatarHtml(USER.uid,USER.nombre,USER.foto||'',72):(typeof mascota==='function'?mascota(72,false):'');
  $('#pfNombre').textContent=nube?USER.nombre:'En este ordenador';
  $('#pfMail').textContent=nube?USER.email+(USER.admin?' · administrador':''):'Sin cuenta: los datos se guardan solo en este navegador';
  const desde=S.mov.length?S.mov.map(x=>x.mes).sort()[0]:'';
  $('#pfDesde').textContent=desde?'Con datos desde '+nombreMes(desde):'';
  $('#pfSalir').classList.toggle('hide',!nube);
  rPrefs();rFotoAj();
  const reglas=S.reglas.filter(r=>r.u).length,propias=S.cats.filter(c=>/^C/.test(c.id)).length,tags=todasEtiquetas().length,meses=mesesConDatos().length;
  $('#pfAct').innerHTML=`<div class="pfact">
    <div><small>Movimientos</small><b class="num">${S.mov.length.toLocaleString('es-ES')}</b></div>
    <div><small>Meses con datos</small><b class="num">${meses}</b></div>
    <div><small>Reglas aprendidas</small><b class="num">${reglas}</b></div>
    <div><small>Categorías tuyas</small><b class="num">${propias}</b></div>
    <div><small>Etiquetas</small><b class="num">${tags}</b></div>
    <div><small>Última copia</small><b style="font-size:14px">${S.ultimaCopia?fFecha(new Date(S.ultimaCopia).toISOString().slice(0,10)):'nunca'}</b></div></div>`;
}
