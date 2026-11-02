// Cuentas Claras · Arranque del programa (debe cargarse el último)
"use strict";
/* ============ Arranque ============ */
let uiLista=false;
function iniciarUI(){
  if(HAY_MIGRACION){HAY_MIGRACION=false;save()}
  refreshCats();aplicarTema();MES=mesDe(hoy());go(window.__TAB_INICIAL||'inicio');
  if(uiLista&&!NUBE)return;uiLista=true;tutorialInicial();
  if(S.histOfrecido&&cmpV(VERSION,S.verVista||'1.0')>0){
    const desde=S.verVista||'1.0';S.verVista=VERSION;save();
    dialog('Novedades de la versión '+VERSION,'<p class="small mut" style="margin-top:0">Tus datos se mantienen. Esto es lo nuevo desde la versión '+esc(desde)+':</p>'+cambiosHtml(desde),[{t:'Entendido',cls:'pri'}]);
  }else if(!S.histOfrecido&&!S.mov.length){
    S.verVista=VERSION;
    dialog('Bienvenida',`<p>Es la primera vez que entras. ¿Tienes datos de antes?</p><p class="small mut">Puedes cargar una copia de seguridad del programa (.json) o el archivo del historial del Excel. También se puede hacer más tarde desde Ajustes.</p>`,
     [{t:'Empezar vacío',fn:()=>{S.histOfrecido=true;save()}},{t:'Historial del Excel…',fn:()=>{S.histOfrecido=true;save();$('#histFile').click()}},{t:'Copia de seguridad…',cls:'pri',fn:()=>{S.histOfrecido=true;save();$('#bkFile').click()}}]);
  }
}
$('#fabCash').onclick=()=>{MES=mesDe(hoy());go('efectivo');setTimeout(()=>$('#cImp').focus(),50)};
$('#verBtn').textContent='v'+VERSION;
$('#verBtn').onclick=()=>dialog('Novedades',cambiosHtml(null),[{t:'Cerrar',cls:'pri'}]);
window.addEventListener('beforeunload',e=>{
  if(NUBE&&pendiente)flush();
  if(Math.abs(sumaPct()-100)>0.01||(NUBE&&pendiente)){e.preventDefault();e.returnValue=''}});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&NUBE&&pendiente)flush();if(document.visibilityState==='visible')buscarVersion()});
window.addEventListener('online',()=>{if(NUBE&&USER)setSync('ok')});
window.addEventListener('offline',()=>{if(NUBE&&USER)setSync('offline')});
(async()=>{
  buscarVersion();setInterval(buscarVersion,30*60*1000);
  if(!NUBE){load();refreshCats();iniciarUI();return}
  S=defState();refreshCats();
  mostrarLogin('Cargando…');
  try{await fbInit()}catch(e){mostrarLogin('No se ha podido conectar. Revisa la conexión a internet y recarga la página.',true);return}
  lMsg('');
  let primerEvento=true;
  fb.authM.onAuthStateChanged(fb.auth,u=>{if(creandoAdmin||saliendo)return;
    const primero=primerEvento;primerEvento=false;
    if(u&&primero){let mismaPestana=false;try{mismaPestana=sessionStorage.getItem('mg-sesion')===u.uid}catch(_){}
      if(!mismaPestana){mostrarContinuar(u);return}}
    if(u)entrar(u);else{pararEscucha();USER=null;S=defState();mostrarLogin()}});
})();
/* iPhone ignora user-scalable=no: frenamos el gesto de pellizcar */
['gesturestart','gesturechange'].forEach(ev=>document.addEventListener(ev,e=>e.preventDefault(),{passive:false}));
