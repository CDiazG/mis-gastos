// Cuentas Claras · Datos del usuario: guardado local o en Firebase y sincronización en tiempo real
"use strict";
/* ============ Estado ============ */
const KEY='mis-gastos-v1';
let S;
function defState(){
  return {v:1,mov:[],reglas:SEED_RULES.map(([t,c])=>({t,c,u:0})),
    cats:CATS_DEF.map(({id,n,g})=>({id,n,g})),
    aj:{pct:Object.fromEntries(CATS_DEF.map(c=>[c.id,c.p])),base:'ingresos',baseFija:0,diaNomina:25,umbralNomina:1000,nominaMes:'siguiente',
      bizumReglas:false,aprender:true,aviso80:true,comparar:true,avisoCopia:true,verFijos:true,verObjetivos:true,verGrafico:true,fab:true},
    cuentas:[],
    fijos:[],objetivos:[],mig:{actividades:true,inversion:true,ahorroAuto:true,prestamo:true},
    ultimaCopia:null,histCargado:false,histOfrecido:false};
}
// Cambios de categorías de la versión 2.8.0: «Salud y bienestar» se separa en «Salud» y «Deporte y actividades»
function migrarActividades(){
  if(!S||(S.mig&&S.mig.actividades))return false;
  S.mig={...(S.mig||{}),actividades:true};
  if(!Array.isArray(S.cats))return true; // usuario nuevo: ya nace con las categorías nuevas
  const salud=S.cats.find(c=>c.id==='SALUD');
  if(!S.cats.some(c=>c.id==='ACTIVIDADES')){
    const i=S.cats.map(c=>c.g).lastIndexOf('VARIABLES');const j=S.cats.findIndex((c,k)=>c.g==='VARIABLES'&&c.id==='REGALOS');
    S.cats.splice(j>=0?j:(i>=0?i+1:S.cats.length),0,{id:'ACTIVIDADES',n:'Deporte y actividades',g:'VARIABLES'});
    const ps=+S.aj.pct.SALUD||0;const pasa=Math.min(2,ps);S.aj.pct.SALUD=ps-pasa;S.aj.pct.ACTIVIDADES=pasa;
  }
  if(salud&&salud.n==='Salud y bienestar')salud.n='Salud';
  const esAct=t=>RE_ACTIVIDAD.test(norm(t));
  for(const x of S.mov||[])if(x.cat==='SALUD'&&esAct(x.concepto+' '+(x.detalle||'')))x.cat='ACTIVIDADES';
  for(const r of S.reglas||[])if(r.c==='SALUD'&&esAct(r.t))r.c='ACTIVIDADES';
  for(const f of S.fijos||[])if(f.cat==='SALUD'&&esAct(f.nombre+' '+(f.texto||'')))f.cat='ACTIVIDADES';
  return true;
}
// Versión 2.9.0: «Ahorro / inversión» se separa en «Ahorro» e «Inversión»
function migrarInversion(){
  if(!S||(S.mig&&S.mig.inversion))return false;
  S.mig={...(S.mig||{}),inversion:true};
  if(!Array.isArray(S.cats))return true;
  if(!S.cats.some(c=>c.id==='INVERSION')){
    const i=S.cats.findIndex(c=>c.id==='AHORRO');S.cats.splice(i>=0?i+1:S.cats.length,0,{id:'INVERSION',n:'Inversión',g:'AHORRO'});
    const pa=+S.aj.pct.AHORRO||0,inv=Math.round(pa/2);S.aj.pct.AHORRO=pa-inv;S.aj.pct.INVERSION=inv;
  }
  const ah=S.cats.find(c=>c.id==='AHORRO');if(ah&&ah.n==='Ahorro / inversión')ah.n='Ahorro';
  const esInv=t=>RE_INVERSION.test(norm(t));
  for(const x of S.mov||[])if(x.cat==='AHORRO'&&esInv(x.concepto+' '+(x.detalle||'')))x.cat='INVERSION';
  for(const r of S.reglas||[])if(r.c==='AHORRO'&&esInv(r.t))r.c='INVERSION';
  return true;
}
// Versión 2.11.0: el ahorro es lo que no se gasta. «Ahorro» deja de ser una categoría que se elige:
// pasar dinero a otra cuenta propia es un traspaso y ya cuenta como ahorro.
function migrarAhorroAuto(){
  if(!S||(S.mig&&S.mig.ahorroAuto))return false;
  S.mig={...(S.mig||{}),ahorroAuto:true};
  for(const x of S.mov||[])if(x.cat==='AHORRO'){x.cat='TRASPASO';x.exAhorro=true}
  for(const r of S.reglas||[])if(r.c==='AHORRO')r.c='TRASPASO';
  for(const f of S.fijos||[])if(f.cat==='AHORRO')f.cat='TRASPASO';
  return true;
}
// Versión 2.20.2: la palabra «préstamo» en el banco suele ser la cuota de una hipoteca o un préstamo
// que pagas tú, no dinero que te devuelven. Se quita esa regla de serie y la hipoteca va a Vivienda.
// Los movimientos ya clasificados no se tocan: se avisa una vez para que se revisen.
function migrarPrestamo(){
  if(!S||(S.mig&&S.mig.prestamo))return false;
  S.mig={...(S.mig||{}),prestamo:true};
  S.reglas=(S.reglas||[]).filter(r=>!(!r.u&&norm(r.t).trim()==='PRESTAMO'&&r.c==='PRESTAMO'));
  if(!S.reglas.some(r=>norm(r.t).trim()==='HIPOTEC'))S.reglas.unshift({t:'HIPOTEC',c:'VIVIENDA',u:0});
  if(prestamosDudosos().length)S.aj.revisarPrestamos=true;
  return true;
}
// Cuotas del banco que quedaron como «Préstamo (me lo devuelven)» por la regla antigua
function prestamosDudosos(){return (S.mov||[]).filter(x=>x.cat==='PRESTAMO'&&x.importe<0&&x.origen!=='manual'&&!x.persona&&/ PRESTAMO| HIPOTEC| AMORTIZ/.test(norm(' '+x.concepto+' '+(x.detalle||''))))}
let HAY_MIGRACION=false;
function completar(){if(S&&S.aj&&migrarActividades())HAY_MIGRACION=true;if(S&&S.aj&&migrarInversion())HAY_MIGRACION=true;if(S&&S.aj&&migrarAhorroAuto())HAY_MIGRACION=true;if(S&&S.aj&&S.reglas&&migrarPrestamo())HAY_MIGRACION=true;if(Array.isArray(S&&S.mov))for(const x of S.mov)if(x.nomina===undefined&&x.cat==='INGRESO'&&x.importe>0&&/ (NOMI|NOMINA) /.test(norm(x.concepto)))x.nomina=true;
  const d=defState();for(const k in d)if(S[k]===undefined)S[k]=d[k];for(const k in d.aj)if(S.aj[k]===undefined)S.aj[k]=d.aj[k];if(!Array.isArray(S.mov))S.mov=[]}
function load(){
  try{const t=localStorage.getItem(KEY);if(t){S=JSON.parse(t);completar();return}}catch(e){console.error(e)}
  S=defState();
}

/* ---- Nube (Firebase) ---- */
const CFG=window.MG_CONFIG||{};
const NUBE=!!(CFG.firebase&&CFG.firebase.apiKey);
const FBV='https://www.gstatic.com/firebasejs/10.14.1/';
let creandoAdmin=false,saliendo=false;
let fb=null,USER=null,LAST={meta:null,meses:{}},tSave=null,pendiente=false,cargadoEn=0;
function setSync(st,msg){const el=$('#sync');if(!el)return;el.className='sync'+(st==='error'?' err':'');
  el.textContent=st==='guardando'?'Guardando…':st==='ok'?'Guardado ✓':st==='offline'?'Sin conexión: se guardará al volver':st==='error'?'Error al guardar':'';
  el.title=msg||''}
function save(){
  if(!NUBE){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){toast('No se ha podido guardar: '+e.message,true)}return}
  if(!USER)return;
  pendiente=true;setSync(navigator.onLine?'guardando':'offline');clearTimeout(tSave);tSave=setTimeout(flush,600);
}
async function flush(){
  clearTimeout(tSave);if(!NUBE||!USER||!S)return;
  const {writeBatch,doc}=fb.fsM;const uid=USER.uid;
  const {mov,...meta}=S;const mj=JSON.stringify(meta);
  const by={};for(const x of mov)(by[x.mes]||(by[x.mes]=[])).push(x);
  const nuevos={};const ops=[];
  if(mj!==LAST.meta)ops.push(['set',doc(fb.db,'users',uid,'estado','meta'),{s:mj,app:VERSION,t:Date.now()}]);
  for(const m in by){const j=JSON.stringify(by[m]);nuevos[m]=j;if(j!==LAST.meses[m])ops.push(['set',doc(fb.db,'users',uid,'meses',m),{m:j,n:by[m].length,t:Date.now()}])}
  for(const m in LAST.meses)if(!(m in nuevos))ops.push(['del',doc(fb.db,'users',uid,'meses',m)]);
  pendiente=false;
  if(!ops.length){setSync('ok');return}
  for(const o of ops){const pth=o[1].path||'';const id=pth.split('/').pop();if(pth.includes('/meses/'))delete REMOTO.meses[id];else REMOTO.meta=null}
  const prev={meta:LAST.meta,meses:LAST.meses};LAST={meta:mj,meses:nuevos};
  try{
    for(let i=0;i<ops.length;i+=400){const b=writeBatch(fb.db);for(const o of ops.slice(i,i+400))o[0]==='set'?b.set(o[1],o[2]):b.delete(o[1]);await b.commit()}
    if(!pendiente)setSync('ok');
  }catch(e){console.error(e);LAST=prev;setSync('error',e.message);toast('No se ha podido guardar en la nube: '+(e.code||e.message),true)}
}
async function fbInit(){
  const [appM,authM,fsM]=await Promise.all([import(FBV+'firebase-app.js'),import(FBV+'firebase-auth.js'),import(FBV+'firebase-firestore.js')]);
  const app=appM.initializeApp(CFG.firebase);
  const auth=authM.getAuth(app);auth.languageCode='es';
  let db;try{db=fsM.initializeFirestore(app,{localCache:fsM.persistentLocalCache({tabManager:fsM.persistentMultipleTabManager()})})}catch(e){console.warn(e);db=fsM.getFirestore(app)}
  fb={appM,authM,fsM,app,auth,db};
}
async function cargarNube(){
  const {doc,getDoc,getDocs,collection}=fb.fsM;const uid=USER.uid;
  const [meta,ms]=await Promise.all([getDoc(doc(fb.db,'users',uid,'estado','meta')),getDocs(collection(fb.db,'users',uid,'meses'))]);
  LAST={meta:null,meses:{}};
  if(!meta.exists()&&ms.empty){S=defState();}
  else{S=meta.exists()?JSON.parse(meta.data().s):defState();LAST.meta=meta.exists()?meta.data().s:null;S.mov=[];
    ms.forEach(d=>{const j=d.data().m||'[]';LAST.meses[d.id]=j;S.mov.push(...JSON.parse(j))})}
  completar();cargadoEn=Date.now();
  escuchar();
}

/* ---- Sincronización en tiempo real entre dispositivos ---- */
let UNSUB=[],REMOTO={meta:null,meses:{}},tRemoto=null,renderPend=false;
function pararEscucha(){UNSUB.forEach(f=>{try{f()}catch(_){}});UNSUB=[];if(typeof BZ_TODAS!=='undefined'){BZ_TODAS=[];BZ_MIAS=[];BZ_VIVO=false}USERS_VIVO=false;USERS=[];if(typeof FORO!=='undefined'){FORO=[];FORO_VIVO=false;PERFILES={}}if(typeof CH_MSGS!=='undefined'){CH_MSGS=[];CH_RUFO=[];CH_VIVO=false;CH_ADMIN_SEL=null;CH_MODO='rufo';CH_PRES=null;clearInterval(tPres);if(CH_ABIERTO)abrirChat(false)}REMOTO={meta:null,meses:{}};clearTimeout(tRemoto)}
function escuchar(){
  pararEscucha();if(!fb.fsM.onSnapshot)return;
  const {doc,collection,onSnapshot}=fb.fsM;const uid=USER.uid;
  UNSUB.push(onSnapshot(doc(fb.db,'users',uid,'estado','meta'),sn=>{
    if(sn.metadata&&sn.metadata.hasPendingWrites)return;
    if(!sn.exists())return;const j=sn.data().s;if(j!==LAST.meta){REMOTO.meta=j;programarRemoto()}
  },e=>console.warn('sync meta',e)));
  UNSUB.push(onSnapshot(collection(fb.db,'users',uid,'meses'),qs=>{
    if(qs.metadata&&qs.metadata.hasPendingWrites)return;
    let n=0;qs.docChanges().forEach(ch=>{const id=ch.doc.id;
      if(ch.type==='removed'){if(LAST.meses[id]!==undefined){REMOTO.meses[id]=null;n++}}
      else{const j=ch.doc.data().m;if(j!==LAST.meses[id]){REMOTO.meses[id]=j;n++}}});
    if(n)programarRemoto();
  },e=>console.warn('sync meses',e)));
  if(typeof escucharBuzon==='function')escucharBuzon();
  if(typeof escucharErrores==='function')escucharErrores();
  if(typeof escucharChat==='function'){escucharChat();presencia()}
  if(USER.admin){
    UNSUB.push(onSnapshot(collection(fb.db,'users'),qs=>{
      const us=[];qs.forEach?qs.forEach(d=>us.push({id:d.id,...d.data()})):(qs.docs||[]).forEach(d=>us.push({id:d.id,...d.data()}));
      const antes=pendientesN();USERS=us;USERS_VIVO=true;badgeUsuarios();
      if(TAB==='usuarios'&&!$('#dlg').open)rUsuarios();
      if(TAB==='resumen'&&pendientesN()!==antes&&!$('#dlg').open)rResumen();
      if(pendientesN()>antes)toast('Nueva solicitud de acceso');
    },e=>console.warn('sync usuarios',e)));
  }
}
function programarRemoto(ms){clearTimeout(tRemoto);tRemoto=setTimeout(aplicarRemoto,ms||250)}
function aplicarRemoto(){
  if(!USER||!S)return;
  if(pendiente){programarRemoto(1200);return} // primero se guardan los cambios de este dispositivo
  let cambios=0;
  if(REMOTO.meta&&REMOTO.meta!==LAST.meta){const mov=S.mov;S=JSON.parse(REMOTO.meta);S.mov=mov;completar();LAST.meta=REMOTO.meta;cambios++}
  const nm={...LAST.meses};
  for(const m in REMOTO.meses){const j=REMOTO.meses[m];
    if(j===null){S.mov=S.mov.filter(x=>x.mes!==m);delete nm[m];cambios++}
    else if(j!==LAST.meses[m]){S.mov=S.mov.filter(x=>x.mes!==m).concat(JSON.parse(j));nm[m]=j;cambios++}}
  LAST.meses=nm;REMOTO={meta:null,meses:{}};
  if(cambios){renderPend=true;refrescarSiSeguro()}
}
function refrescarSiSeguro(){
  if(!renderPend)return;
  const ae=document.activeElement;
  const escribiendo=ae&&/^(INPUT|SELECT|TEXTAREA)$/.test(ae.tagName)&&ae.closest('main')&&TAB!=='efectivo'&&TAB!=='resumen';
  if($('#dlg').open||escribiendo){setTimeout(refrescarSiSeguro,1500);return}
  renderPend=false;render();setSync('ok');toast('Actualizado con cambios de otro dispositivo');
}
async function sha256(t){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function esAdminMail(m){return !!(CFG.adminHash&&m&&(await sha256(m.trim().toLowerCase()))===CFG.adminHash)}
