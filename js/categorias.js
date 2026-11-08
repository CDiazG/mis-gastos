// Cuentas Claras · Categorías, grupos y reglas de serie
"use strict";
/* ============ Configuración ============ */
// Categorías de las cuentas nuevas (versión 2.22.0): reparto 50 / 30 / 20.
// A quien ya tiene las suyas no se le cambia nada.
const CATS_DEF=[
 {id:'VIVIENDA',n:'Vivienda',g:'FIJOS',p:25},
 {id:'FACTURAS',n:'Facturas (luz, agua, móvil…)',g:'FIJOS',p:7},
 {id:'SUPERMERCADO',n:'Supermercado',g:'FIJOS',p:10},
 {id:'TRANSPORTE',n:'Transporte',g:'FIJOS',p:5},
 {id:'SALUD',n:'Salud',g:'FIJOS',p:3},
 {id:'OCIO',n:'Restaurantes y ocio',g:'VARIABLES',p:10},
 {id:'PERSONAL',n:'Ropa y compras',g:'VARIABLES',p:7},
 {id:'VIAJES',n:'Viajes y escapadas',g:'VARIABLES',p:5},
 {id:'SUSCRIPCIONES',n:'Suscripciones',g:'VARIABLES',p:3},
 {id:'ACTIVIDADES',n:'Deporte y actividades',g:'VARIABLES',p:3},
 {id:'REGALOS',n:'Regalos',g:'VARIABLES',p:2},
 {id:'OTROS',n:'Otros',g:'VARIABLES',p:0},
 {id:'AHORRO',n:'Ahorro',g:'AHORRO',p:10},
 {id:'INVERSION',n:'Inversión',g:'AHORRO',p:10},
 {id:'DONATIVOS',n:'Donativos',g:'AHORRO',p:0},
 {id:'DIEZMO',n:'Diezmo',g:'AHORRO',p:0},
];
// Reglas de serie de las cuentas nuevas: las de siempre, con luz/agua/móvil a Facturas y plataformas a Suscripciones
const A_FACTURAS=['IBERDROLA','CURENERGIA','NATURGY','ENDESA','EMIVASA','HOLALUZ','TOTALENERGIES','AGUAS DE','CANAL DE ISABEL','MOVISTAR','VODAFONE','ORANGE','DIGI','MASMOVIL','PEPEPHONE','YOIGO','JAZZTEL','LOWI','SIMYO','REPSOL LUZ','GAS NATURAL'];
const A_SUSCRIP=['NETFLIX','SPOTIFY','HBO','DISNEY','PRIME VIDEO','AMAZON PRIME','YOUTUBE','ICLOUD','APPLE COM','GOOGLE ONE','FILMIN','DAZN','AUDIBLE','DEEZER'];
function reglasDeSerie(){
  const out=[],vistos=new Set();
  const poner=(t,c)=>{const k=norm(t).trim();if(vistos.has(k))return;vistos.add(k);out.push({t,c,u:0})};
  A_FACTURAS.forEach(t=>poner(t,'FACTURAS'));A_SUSCRIP.forEach(t=>poner(t,'SUSCRIPCIONES'));
  for(const [t,c] of SEED_RULES){if(c==='PROFESIONAL')continue;poner(t,c)}
  return out;
}
const SPECIAL=[
 {id:'INGRESO',n:'Ingreso'},
 {id:'PRESTAMO',n:'Préstamo (me lo devuelven)'},
 {id:'EFECTIVO',n:'Retirada de efectivo'},
 {id:'TRASPASO',n:'Traspaso entre mis cuentas'},
 {id:'AJUSTE',n:'Ajuste / descuadre'},
];
const GROUPS=[{id:'FIJOS',n:'Necesidades'},{id:'VARIABLES',n:'Ocio y caprichos'},{id:'AHORRO',n:'Ahorro y donativos'}];
// Palabras que identifican inversiones (acciones, ETFs, fondos, oro…) dentro de lo que antes era «Ahorro / inversión»
const RE_INVERSION=/ (TRADE|TRADE REPUBLIC|ORO|ETF|ETFS|ACCIONES|FONDO|FONDOS|INDEXA|MYINVESTOR|DEGIRO|BROKER|INVERSION|INVERTIR|CRIPTO|BITCOIN|BITPANDA|FINIZENS|SCALABLE|ETORO|INTERACTIVE)/
// Palabras que identifican deporte y actividades (gimnasio, baile…) dentro de lo que antes era «Salud y bienestar»
const RE_ACTIVIDAD=/ (GIMNASIO|GIMANSIO|GYM|SYNERGYM|ALTAFIT|BASIC FIT|BELLALBA|BALLET|BAILE|YOGA|PILATES|PADEL|PISCINA|CROSSFIT|DEPORTE|DEPORTES|ACTIVIDADES|ESCALADA|TENIS|NATACION|CLUB)/
const FIJAS=new Set(['AHORRO','DIEZMO','OTROS']); // no se pueden borrar
// Emoji de cada categoría: el de serie por identificador, o el que haya elegido el usuario (c.e). No toca datos guardados.
const EMO_DEF={VIVIENDA:'🏠',FACTURAS:'💡',SUPERMERCADO:'🛒',TRANSPORTE:'🚗',SALUD:'🩺',OCIO:'🍽️',PERSONAL:'👕',VIAJES:'✈️',SUSCRIPCIONES:'🔁',ACTIVIDADES:'🏃',REGALOS:'🎁',OTROS:'📦',AHORRO:'🐷',INVERSION:'📈',DONATIVOS:'🤲',DIEZMO:'🙏'};
const EMO_LISTA='🏠 🏡 💡 🔌 📱 🌐 🛒 🥦 🍎 🍞 🚗 ⛽ 🚌 🚆 🚲 🩺 💊 🦷 👓 🍽️ 🍕 ☕ 🍺 🎬 🎮 🎵 📚 👕 👟 💄 💇 ✈️ 🏖️ 🧳 🔁 📺 🏃 🏋️ ⚽ 🎾 🎁 🎂 💐 📦 🧾 🐷 💰 📈 🏦 🤲 ❤️ 🙏 🐶 🐱 👶 🎓 🔧 🧹 💼 🎉'.split(' ');
const EMO_NOMBRE=[[/coche|auto|gasolin|combustible|parking|aparcamiento|taller|moto/i,'🚗'],[/profesional|trabajo|negocio|aut[oó]nomo|empresa|oficina|colegi|congreso|formaci[oó]n|m[aá]ster|curso/i,'💼'],[/mascota|perro|gato|veterin/i,'🐾'],[/hijo|ni[ñn]o|beb[eé]|colegio|guarder/i,'🧒'],[/gimnas|deporte/i,'🏃'],[/seguro/i,'🛡️'],[/impuesto|hacienda|tasa/i,'🏛️'],[/hogar|casa|mueble|reforma|obra/i,'🛠️'],[/belleza|peluquer|est[eé]tica/i,'💇'],[/caf[eé]|bar\b/i,'☕'],[/libro|estudio/i,'📚'],[/tecnolog|electr[oó]nic|inform[aá]tic/i,'💻']];
function catE(id){const c=(S.cats||[]).find(x=>x.id===id);if(!c)return EMO_DEF[id]||'';if(c.e||EMO_DEF[id])return c.e||EMO_DEF[id];const m=EMO_NOMBRE.find(r=>r[0].test(c.n||''));return m?m[1]:'🏷️'}
const catEs=id=>{const e=catE(id);return e?e+' ':''};
let CATS=[],ALLC=[],CONSUMO=[];
const diezmoOn=()=>!(typeof S!=='undefined'&&S&&S.aj&&S.aj.diezmo===false);
function refreshCats(){
  if(!Array.isArray(S.cats)||!S.cats.length)S.cats=CATS_DEF.map(({id,n,g})=>({id,n,g}));
  for(const id of FIJAS)if(!S.cats.some(c=>c.id===id)){const d=CATS_DEF.find(c=>c.id===id);S.cats.push({id,n:d.n,g:d.g})}
  // El diezmo se puede desactivar en Preferencias (quien no lo da no lo ve en ningún sitio)
  CATS=S.cats.filter(c=>c.id!=='DIEZMO'||diezmoOn()).map(c=>({...c}));ALLC=[...CATS,...SPECIAL];CONSUMO=CATS.filter(c=>c.g!=='AHORRO').map(c=>c.id);
}
const MESES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const MABR={ene:1,feb:2,mar:3,abr:4,may:5,jun:6,jul:7,ago:8,sep:9,sept:9,set:9,oct:10,nov:11,dic:12};

const SEED_RULES=[
 // la hipoteca es parte de la vivienda (no un préstamo que te devuelven)
 ['HIPOTEC','VIVIENDA'],
 // donativos
 ...['UNICEF','CARITAS','CRUZ ROJA','MEDICOS SIN FRONTERAS','ACNUR','SAVE THE CHILDREN','DONATIVO','DONACION'].map(t=>[t,'DONATIVOS']),
 // supermercado
 ['MERCADONA','SUPERMERCADO'],['LIDL','SUPERMERCADO'],['CONSUM','SUPERMERCADO'],['CARREFOUR','SUPERMERCADO'],['ALDI','SUPERMERCADO'],['SUPER ASIA','SUPERMERCADO'],['SUPERASIA','SUPERMERCADO'],['MISUPER','SUPERMERCADO'],['HIPERCOR','SUPERMERCADO'],['ALCAMPO','SUPERMERCADO'],['EROSKI','SUPERMERCADO'],['AHORRAMAS','SUPERMERCADO'],['SUPERMERCADO','SUPERMERCADO'],['SUPERMACADOS','SUPERMERCADO'],['LA DESPENSA','SUPERMERCADO'],['CARNICERIA','SUPERMERCADO'],['FRUTERIA','SUPERMERCADO'],['PESCADERIA','SUPERMERCADO'],
 // vivienda
 ['IBERDROLA','VIVIENDA'],['CURENERGIA','VIVIENDA'],['NATURGY','VIVIENDA'],['ENDESA','VIVIENDA'],['EMIVASA','VIVIENDA'],['ALQUILER','VIVIENDA'],
 // transporte
 ['PARKING','TRANSPORTE'],['PARKIA','TRANSPORTE'],['INDIGO','TRANSPORTE'],['APARCAMIENTO','TRANSPORTE'],['GARAJE','TRANSPORTE'],['GASOLINERA','TRANSPORTE'],['GASOLINA','TRANSPORTE'],['REPSOL','TRANSPORTE'],['CEPSA','TRANSPORTE'],['GALP','TRANSPORTE'],['BALLENOIL','TRANSPORTE'],['PLENOIL','TRANSPORTE'],['PETRONOR','TRANSPORTE'],['TAXI','TRANSPORTE'],['CABIFY','TRANSPORTE'],['METROVALENCIA','TRANSPORTE'],['VALENBISI','TRANSPORTE'],['PEAJE','TRANSPORTE'],['AUTOPISTA','TRANSPORTE'],
 // viajes
 ['TRAINLINE','VIAJES'],['RENFE','VIAJES'],['OUIGO','VIAJES'],['IRYO','VIAJES'],['EDREAMS','VIAJES'],['RYANAIR','VIAJES'],['VUELING','VIAJES'],['IBERIA','VIAJES'],['BOOKING','VIAJES'],['AIRBNB','VIAJES'],['HOTEL','VIAJES'],['TICKETMASTER','VIAJES'],['FEVER','VIAJES'],['CONCIERTO','VIAJES'],['VUELOS','VIAJES'],['CASA RURAL','VIAJES'],['NIEVE','VIAJES'],
 // profesional
 ['COLEGIO OFICIAL DE MEDI','PROFESIONAL'],['COLEGIO MEDICOS','PROFESIONAL'],['COLEGIACION','PROFESIONAL'],['CONGRESOS Y EDICIONES','PROFESIONAL'],['CONGRESO','PROFESIONAL'],['SEMFYC','PROFESIONAL'],['SEMERGEN','PROFESIONAL'],['SEMG','PROFESIONAL'],
 // salud y bienestar
 ['PSICOLOGO','SALUD'],['PSICOLOGA','SALUD'],['PSICO','SALUD'],['FARMACIA','SALUD'],['NUTRI','SALUD'],['FISIO','SALUD'],['BELLALBA','ACTIVIDADES'],['GIMNASIO','ACTIVIDADES'],['GIMANSIO','ACTIVIDADES'],['SYNERGYM','ACTIVIDADES'],['ALTAFIT','ACTIVIDADES'],['BASIC FIT','ACTIVIDADES'],['DENTAL','SALUD'],['YOGA','ACTIVIDADES'],['PILATES','ACTIVIDADES'],['PADEL','ACTIVIDADES'],['PISCINA','ACTIVIDADES'],['CROSSFIT','ACTIVIDADES'],['BAILE','ACTIVIDADES'],['BALLET','ACTIVIDADES'],
 // personal
 ['AMAZON','PERSONAL'],['ZARA','PERSONAL'],['MANGO','PERSONAL'],['PRIMARK','PERSONAL'],['STRADIVARIUS','PERSONAL'],['BERSHKA','PERSONAL'],['PULL BEAR','PERSONAL'],['TEZENIS','PERSONAL'],['SEPHORA','PERSONAL'],['KIKO','PERSONAL'],['ZAPA','PERSONAL'],['LIBRERIA','PERSONAL'],['LIBROS','PERSONAL'],['CASA DEL LIBRO','PERSONAL'],['FNAC','PERSONAL'],['IKEA','PERSONAL'],['DECATHLON','PERSONAL'],['EL CORTE INGLES','PERSONAL'],['SHEIN','PERSONAL'],['VINTED','PERSONAL'],['PELUQUERIA','PERSONAL'],['PELU','PERSONAL'],['GOOGLE ONE','PERSONAL'],['SPOTIFY','PERSONAL'],['NETFLIX','PERSONAL'],['RELOJERIA','PERSONAL'],['ROPA','PERSONAL'],['ZAPATOS','PERSONAL'],['ZAPATILLAS','PERSONAL'],['BOTAS','PERSONAL'],['CONVERSE','PERSONAL'],['UNAS','PERSONAL'],['CEJAS','PERSONAL'],['ESTETICA','PERSONAL'],['PERFUME','PERSONAL'],['COLONIA','PERSONAL'],['ADIDAS','PERSONAL'],['PANTALONES','PERSONAL'],['MACETAS','PERSONAL'],['CUADROS','PERSONAL'],
 // restaurantes y ocio
 ['GLOVO','OCIO'],['JUST EAT','OCIO'],['UBER EATS','OCIO'],['CAFE','OCIO'],['CAFES','OCIO'],['CAFETERIA','OCIO'],['COFFEE','OCIO'],['COFFE','OCIO'],['BAR','OCIO'],['RESTAURANTE','OCIO'],['PIZZERIA','OCIO'],['RAMEN','OCIO'],['SUSHI','OCIO'],['BURGER','OCIO'],['MCDONALDS','OCIO'],['TELEPIZZA','OCIO'],['TABERNA','OCIO'],['CERVECERIA','OCIO'],['PANADERIA','OCIO'],['HORNO','OCIO'],['HELADERIA','OCIO'],['GELATERIA','OCIO'],['BAKE','OCIO'],['CINE','OCIO'],['YELMO','OCIO'],['KINEPOLIS','OCIO'],['COMIDA','OCIO'],['CENA','OCIO'],['CENAS','OCIO'],['CENITA','OCIO'],['DESAYUNO','OCIO'],['BRUNCH','OCIO'],['CERVEZAS','OCIO'],['CERVEZA','OCIO'],['COPAS','OCIO'],['TAPAS','OCIO'],['PIZZA','OCIO'],['CHINO','OCIO'],['WOK','OCIO'],['TASCA','OCIO'],['POKE','OCIO'],['MATCHA','OCIO'],
 // regalos
 ['REGALO','REGALOS'],['REGALOS','REGALOS'],['REGALITO','REGALOS'],['REGALITOS','REGALOS'],['CUMPLE','REGALOS'],['AMIGO INVISIBLE','REGALOS'],['BODA','REGALOS'],['FLORES','REGALOS'],
 // especiales
 ['NOMI','INGRESO'],['NOMINA','INGRESO'],['TRANSF NOMI','INGRESO'],
 ['CAJERO','EFECTIVO'],['REINTEGRO','EFECTIVO'],['RETIRADA EFECTIVO','EFECTIVO'],
 ['REVOLUT','TRASPASO'],['RECARGA','TRASPASO'],['TRASPASO','TRASPASO'],
 ['TRADE REPUBLIC','INVERSION'],['MYINVESTOR','INVERSION'],['INDEXA','INVERSION'],['FINIZENS','INVERSION'],['DEGIRO','INVERSION'],['INTERACTIVE BROKERS','INVERSION'],['SCALABLE','INVERSION'],['ETORO','INVERSION'],['BITPANDA','INVERSION'],['FONDO DE INVERSION','INVERSION'],['DIEZMO','DIEZMO'],
 ['DESAJUSTE','AJUSTE'],['DESAJUSTES','AJUSTE'],
];
