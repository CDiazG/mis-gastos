// Firebase simulado para las pruebas: guarda todo en localStorage y aplica unas reglas parecidas a firestore.rules.
const db=()=>JSON.parse(localStorage.getItem('__mockDb')||'{}');
const sv=d=>localStorage.setItem('__mockDb',JSON.stringify(d));
const auth=()=>{const s=JSON.parse(localStorage.getItem('__mockAuth')||'{"users":{}}');return s.users[s.cur]||null};
const err=c=>{const e=new Error(c);e.code=c;return e};
const ADMIN='admin@prueba.test';
function isAdmin(){const u=auth();return !!(u&&u.email===ADMIN&&u.verified)}
function can(path,op,data){
  const u=auth();const p=path.split('/');
  if(p[0]==='sugerencias'){const d=db()[path];
    if(op==='read')return isAdmin()||(!!u&&!!d&&d.uid===u.uid);
    if(op==='create')return !!u&&!!data&&data.uid===u.uid&&data.estado==='nueva'&&!d;
    return isAdmin();}
  if(p[0]!=='users')return false;
  if(p.length===1)return op==='list'&&isAdmin();
  if(p.length===2)return op==='read'?(isAdmin()||(u&&u.uid===p[1])):(isAdmin()||(!!u&&u.uid===p[1]&&!!data&&data.activo===false&&data.estado==='pendiente'&&data.rol==='usuario'&&!db()[path]));
  const prof=db()['users/'+p[1]];
  if(op==='write'&&window.__delOp&&isAdmin())return true;
  return !!(u&&u.uid===p[1]&&prof&&prof.activo===true);
}
export function initializeFirestore(app,o){return {app}} export function getFirestore(app){return {app}}
export function persistentLocalCache(){return {}} export function persistentMultipleTabManager(){return {}}
export function doc(d,...s){return {path:s.join('/'),id:s[s.length-1]}}
export function collection(d,...s){return {path:s.join('/'),col:true}}
export function where(f,op,v){return {f,op,v}}
export function query(c,...w){return {...c,filtros:w}}
const pasaFiltros=(c,data)=>(c.filtros||[]).every(w=>data&&data[w.f]===w.v);
export async function addDoc(c,data){const id='s'+Math.random().toString(36).slice(2,9);const path=c.path+'/'+id;if(!can(path,'create',data))throw err('permission-denied');const d=db();d[path]=JSON.parse(JSON.stringify(data));sv(d);return {path,id}}
export async function deleteDoc(r){if(!can(r.path,'write'))throw err('permission-denied');const d=db();delete d[r.path];sv(d)}
const snap=(path,data)=>({id:path.split('/').pop(),exists:()=>data!==undefined,data:()=>data});
export async function getDoc(r){if(!can(r.path,'read'))throw err('permission-denied');return snap(r.path,db()[r.path])}
export async function getDocs(c){
  if(c.path==='sugerencias'){const u=auth();if(!isAdmin()&&!(u&&(c.filtros||[]).some(w=>w.f==='uid'&&w.v===u.uid)))throw err('permission-denied');
    const d=db();const docs=Object.keys(d).filter(k=>k.startsWith('sugerencias/')&&pasaFiltros(c,d[k])).map(k=>snap(k,d[k]));return {empty:!docs.length,forEach:cb=>docs.forEach(cb),docs}}const depth=c.path.split('/').length+1;if(!can(c.path+(c.path.split('/').length===1?'':'/x'),c.path.split('/').length===1?'list':'read'))throw err('permission-denied');
  const d=db();const docs=Object.keys(d).filter(k=>k.startsWith(c.path+'/')&&k.split('/').length===depth).map(k=>snap(k,d[k]));return {empty:!docs.length,forEach:cb=>docs.forEach(cb),docs}}
export async function setDoc(r,data){if(!can(r.path,'write',data))throw err('permission-denied');const d=db();d[r.path]=JSON.parse(JSON.stringify(data));sv(d)}
export async function updateDoc(r,data){const u=auth();const propio=u&&r.path==='users/'+u.uid&&Object.keys(data).every(k=>k==='ultimoAcceso');if(!propio&&!can(r.path,'write'))throw err('permission-denied');const d=db();d[r.path]={...d[r.path],...data};sv(d)}
export function writeBatch(){const ops=[];return {set:(r,v)=>ops.push(['s',r,v]),delete:r=>ops.push(['d',r]),commit:async()=>{for(const o of ops){window.__delOp=o[0]==='d';const ok=can(o[1].path,'write');window.__delOp=false;if(!ok)throw err('permission-denied')}const d=db();for(const o of ops){if(o[0]==='s')d[o[1].path]=JSON.parse(JSON.stringify(o[2]));else delete d[o[1].path]}sv(d)}}}
export async function waitForPendingWrites(d){if(window.__offline)return new Promise(()=>{});}
export async function terminate(d){window.__terminated=(window.__terminated||0)+1}
export async function clearIndexedDbPersistence(d){localStorage.setItem('__cleared',String(+(localStorage.getItem('__cleared')||0)+1))}
export function onSnapshot(ref,cb,errCb){
  let prev=null;
  const emit=()=>{
    const d=db();
    if(ref.col){const depth=ref.path.split('/').length+1;const cur={};
      for(const k of Object.keys(d))if(k.startsWith(ref.path+'/')&&k.split('/').length===depth)cur[k.split('/').pop()]=d[k];
      const ch=[];for(const id in cur)if(!prev||JSON.stringify(prev[id])!==JSON.stringify(cur[id]))ch.push({type:prev&&prev[id]?'modified':'added',doc:snap(ref.path+'/'+id,cur[id])});
      if(prev)for(const id in prev)if(!(id in cur))ch.push({type:'removed',doc:snap(ref.path+'/'+id,prev[id])});
      const first=prev===null;prev=cur;const docs=Object.keys(cur).map(id=>snap(ref.path+'/'+id,cur[id]));if(ch.length||first)cb({metadata:{hasPendingWrites:false},docChanges:()=>ch,docs,forEach:f=>docs.forEach(f)});
    }else{const cur=d[ref.path];const j=JSON.stringify(cur);if(prev!==null&&prev===j)return;prev=j;cb({...snap(ref.path,cur),metadata:{hasPendingWrites:false}})}
  };
  setTimeout(emit,0);const h=e=>{if(e.key==='__mockDb')emit()};window.addEventListener('storage',h);return ()=>window.removeEventListener('storage',h);
}
