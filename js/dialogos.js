// Cuentas Claras · Ventanas de diálogo
"use strict";
/* ============ Diálogos ============ */
function dialog(title,body,buttons){
  const d=$('#dlg');$('#dlgT').textContent=title;$('#dlgB').innerHTML=body;
  $('#dlgF').innerHTML='';
  buttons.forEach(b=>{const el=document.createElement('button');el.type='button';el.className='btn '+(b.cls||'');el.textContent=b.t;
    el.onclick=()=>{const r=b.fn?b.fn():undefined;if(r!==false&&d.open)d.close()};$('#dlgF').appendChild(el)});
  if(d.open)d.close();d.showModal();
}
function confirmar(t,msg,ok,fn){dialog(t,`<p>${esc(msg)}</p>`,[{t:'Cancelar'},{t:ok,cls:'pri',fn}])}
