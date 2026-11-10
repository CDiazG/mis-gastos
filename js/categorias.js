// Fluvi · Categorías, grupos y reglas de serie
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
const ICONOS={"casa": "<path d=\"M12 3 2 12h3v8h5v-5h4v5h5v-8h3z\"/>", "bombilla": "<path d=\"M12 2a7 7 0 0 0-4 12.700V18h8v-3.300A7 7 0 0 0 12 2zM9 20h6v2H9z\"/>", "carrito": "<path d=\"M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM1 2v2h2l3.600 7.600-1.400 2.400A2 2 0 0 0 7 17h12v-2H7.400l1-1.800h7.500a2 2 0 0 0 1.700-1L21 5H5.200L4.300 3z\"/>", "coche": "<path fill-rule=\"evenodd\" d=\"M5 11l1.500-4.500A2 2 0 0 1 8.400 5h7.200a2 2 0 0 1 1.900 1.500L19 11a2 2 0 0 1 2 2v5h-2v2h-3v-2H8v2H5v-2H3v-5a2 2 0 0 1 2-2zm2.200 0h9.600l-1-3H8.200zM7 13.500a1.200 1.200 0 1 0 0 2.400 1.200 1.200 0 0 0 0-2.400zm10 0a1.200 1.200 0 1 0 0 2.400 1.200 1.200 0 0 0 0-2.400z\"/>", "salud": "<path d=\"M9 3h6v6h6v6h-6v6H9v-6H3V9h6z\"/>", "cubiertos": "<path d=\"M7 2v8a2 2 0 0 0 1 1.700V22h2V11.700A2 2 0 0 0 11 10V2h-1.500v6h-1V2h-1v6h-1V2zm9 0c-2 1-3 4-3 7 0 2 1 3 3 3v10h2V2z\"/>", "camiseta": "<path d=\"M8 3 2 6l2 5 3-1v11h10V10l3 1 2-5-6-3a4 4 0 0 1-8 0z\"/>", "avion": "<path d=\"M21 16v-2l-8-5V3.500a1.500 1.500 0 0 0-3 0V9l-8 5v2l8-2.500V19l-2 1.500V22l3.500-1 3.500 1v-1.500L13 19v-5.500z\"/>", "repetir": "<path d=\"M7 7h10v3l4-4-4-4v3H5v6h2zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2z\"/>", "corredor": "<circle cx=\"14\" cy=\"4.500\" r=\"2.200\"/><path d=\"M9 8l-4 1 .5 2 3-.7 1.500 3-2 4-3 2 1 1.700 4-2.200 1.600-3 2.400 2.400V22h2v-6l-2.300-2.400L13 10l3 2h3v-2h-2.300L14 8z\"/>", "regalo": "<path d=\"M3 8h18v4H3zM5 13h6v8H5zm8 0h6v8h-6zM12 7c-1-3-5-3-5-1s3 1 5 1zm0 0c1-3 5-3 5-1s-3 1-5 1z\"/>", "caja": "<path d=\"M12 2 3 6.500v11L12 22l9-4.500v-11zM12 4.200 17.800 7 12 9.800 6.200 7zM5 8.600l6 3v8.200l-6-3zm14 0v8.200l-6 3v-8.200z\"/>", "moneda": "<path d=\"M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15.500V19h-2v-1.500c-1.300-.2-2.400-.9-2.800-2l1.800-.8c.3.700.9 1.100 1.800 1.100 1 0 1.700-.5 1.700-1.200 0-.8-.7-1.100-2-1.500-1.700-.5-3-1.100-3-2.900 0-1.300 1-2.200 2.500-2.500V6h2v1.500c1 .2 1.900.8 2.300 1.700l-1.700.8c-.3-.6-.8-.9-1.600-.9-.9 0-1.500.4-1.500 1 0 .7.6.9 1.900 1.300 1.800.5 3.100 1.200 3.100 3 0 1.400-1.100 2.400-2.500 2.600z\"/>", "grafica": "<path d=\"M4 20V10h4v10zm6 0V4h4v16zm6 0v-7h4v7z\"/>", "corazon": "<path d=\"M12 21s-8-5.200-8-11a4.500 4.500 0 0 1 8-2.800A4.500 4.500 0 0 1 20 10c0 5.800-8 11-8 11z\"/>", "estrella": "<path d=\"M12 2l2.900 6.300 6.900.7-5.200 4.600 1.500 6.800L12 16.900 5.900 20.400l1.500-6.800L2.200 9l6.900-.7z\"/>", "maletin": "<path d=\"M9 3v3H3v4h18V6h-6V3zm2 2h2v1h-2zM3 11v9h18v-9h-8v2h-2v-2z\"/>", "huella": "<circle cx=\"12\" cy=\"16\" r=\"4.500\"/><circle cx=\"5.500\" cy=\"10.500\" r=\"2\"/><circle cx=\"18.500\" cy=\"10.500\" r=\"2\"/><circle cx=\"9\" cy=\"5.500\" r=\"2\"/><circle cx=\"15\" cy=\"5.500\" r=\"2\"/>", "persona": "<circle cx=\"12\" cy=\"7\" r=\"3.800\"/><path d=\"M5 21a7 7 0 0 1 14 0z\"/>", "escudo": "<path d=\"M12 2 4 5v6c0 5 3.400 9.500 8 11 4.600-1.500 8-6 8-11V5z\"/>", "edificio": "<path d=\"M2 21h20v-2H2zM4 10h2v7H4zm4 0h2v7H8zm4 0h2v7h-2zm4 0h2v7h-2zM12 2 2 8v1h20V8z\"/>", "etiqueta": "<path fill-rule=\"evenodd\" d=\"M3 3h8l10 10-8 8L3 11zm4.500 3.500a1.500 1.500 0 1 0 0 3 1.500 1.500 0 0 0 0-3z\"/>", "pregunta": "<path d=\"M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 16h-2v-2h2zm1.800-6.500-.9.900c-.6.600-.9 1-.9 2.100h-2v-.5c0-1 .4-1.800 1-2.400l1.200-1.200a1.600 1.600 0 0 0 .5-1.200 2 2 0 0 0-4 0H7a4 4 0 0 1 8 0c0 .9-.4 1.700-.9 2.200z\"/>"};
const ICO_EMO={"🏠": "casa", "🏡": "casa", "💡": "bombilla", "🛒": "carrito", "🚗": "coche", "🩺": "salud", "🍽️": "cubiertos", "👕": "camiseta", "✈️": "avion", "🔁": "repetir", "🏃": "corredor", "🎁": "regalo", "📦": "caja", "🐷": "moneda", "📈": "grafica", "🤲": "corazon", "🙏": "estrella", "💼": "maletin", "🐾": "huella", "🧒": "persona", "🛡️": "escudo", "🏛️": "edificio", "🏷️": "etiqueta", "❓": "pregunta"};
// Icono sólido en círculo gris; si la categoría tiene un emoji elegido a mano, se respeta ese emoji
function catI(id){const c=(S.cats||[]).find(x=>x.id===id);const e=catE(id);if(!e)return '';
  const personal=c&&c.e&&c.e!==EMO_DEF[id]&&!ICO_EMO[c.e];
  if(personal)return `<span class="ci emo">${esc(c.e)}</span>`;
  const k=ICO_EMO[e];return k?`<span class="ci"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${ICONOS[k]}</svg></span>`:`<span class="ci emo">${esc(e)}</span>`}
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
