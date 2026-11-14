// Fluvi · Ventanas de diálogo
"use strict";
// Los diálogos se cierran con una pequeña animación (cerrarYa lo cierra al instante)
(()=>{const nat=HTMLDialogElement.prototype.close;
  HTMLDialogElement.prototype.cerrarYa=function(){this._ct=null;this.classList.remove('cerrando');nat.call(this)};
  HTMLDialogElement.prototype.close=function(v){const d=this;if(!d.open||d._ct)return;
    if(typeof animOn!=='function'||!animOn()){nat.call(d,v);return}
    const t=d._ct=Symbol();d.classList.add('cerrando');
    setTimeout(()=>{if(d._ct!==t)return;d._ct=null;d.classList.remove('cerrando');if(d.open)nat.call(d,v)},170)};
  document.addEventListener('cancel',e=>{if(e.target instanceof HTMLDialogElement&&animOn()){e.preventDefault();e.target.close()}},true)})();
/* ============ Diálogos ============ */
function dialog(title,body,buttons){
  const d=$('#dlg');$('#dlgT').textContent=title;$('#dlgB').innerHTML=body;
  $('#dlgF').innerHTML='';
  buttons.forEach(b=>{const el=document.createElement('button');el.type='button';el.className='btn '+(b.cls||'');el.textContent=b.t;
    el.onclick=()=>{const r=b.fn?b.fn():undefined;if(r!==false&&d.open)d.close()};$('#dlgF').appendChild(el)});
  if(d.open)d.cerrarYa();d.showModal();
}
function confirmar(t,msg,ok,fn){dialog(t,`<p>${esc(msg)}</p>`,[{t:'Cancelar'},{t:ok,cls:'pri',fn}])}
