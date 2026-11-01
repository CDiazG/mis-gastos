// Firebase simulado para las pruebas: guarda todo en localStorage y aplica unas reglas parecidas a firestore.rules.
const apps=[];
export function initializeApp(cfg,name='[DEFAULT]'){const a={name,options:cfg};apps.push(a);return a}
export function getApps(){return apps}
