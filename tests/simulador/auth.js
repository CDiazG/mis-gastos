// Firebase simulado para las pruebas: guarda todo en localStorage y aplica unas reglas parecidas a firestore.rules.
const st=()=>JSON.parse(localStorage.getItem('__mockAuth')||'{"users":{},"cur":null,"mails":[]}');
const sv=s=>localStorage.setItem('__mockAuth',JSON.stringify(s));
const listeners=[];
const uo=u=>u?{uid:u.uid,email:u.email,emailVerified:!!u.verified}:null;
const err=c=>{const e=new Error(c);e.code=c;return e};
export function getAuth(app){return app._auth||(app._auth={app,languageCode:null,mem:app.name!=='[DEFAULT]',cur:null})}
export function initializeAuth(app,o){if(app._auth)throw err('auth/already-initialized');return getAuth(app)}
export const inMemoryPersistence={};
function notify(a){if(a.mem)return;const s=st();listeners.forEach(cb=>cb(uo(s.users[s.cur])))}
export function onAuthStateChanged(a,cb){listeners.push(cb);const s=st();setTimeout(()=>cb(uo(s.users[s.cur])),0)}
export async function signInWithEmailAndPassword(a,email,pw){const s=st();const u=Object.values(s.users).find(u=>u.email===email.toLowerCase());if(!u||u.pw!==pw)throw err('auth/invalid-credential');if(a.mem){a.cur=u.uid;return {user:uo(u)}}s.cur=u.uid;sv(s);notify(a);return {user:uo(u)}}
export async function createUserWithEmailAndPassword(a,email,pw){const s=st();email=email.toLowerCase();if(Object.values(s.users).some(u=>u.email===email))throw err('auth/email-already-in-use');const u={uid:'u'+Math.random().toString(36).slice(2,8),email,pw,verified:false};s.users[u.uid]=u;if(a.mem)a.cur=u.uid;else s.cur=u.uid;sv(s);if(!a.mem)notify(a);return {user:uo(u)}}
export async function sendPasswordResetEmail(a,email){const s=st();s.mails.push({tipo:'reset',email});sv(s)}
export async function sendEmailVerification(u){const s=st();s.mails.push({tipo:'verify',email:u.email});sv(s)}
export async function signOut(a){if(a.mem){a.cur=null;return}const s=st();s.cur=null;sv(s);notify(a)}
