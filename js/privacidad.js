// Cuentas Claras · Privacidad (qué se guarda, dónde y quién lo ve) y extracto de ejemplo para probar
"use strict";
const REPO='https://github.com/CDiazG/mis-gastos';
function privacidadHtml(){return `
  <p><b>🔒 Tus extractos no salen de tu dispositivo.</b> El PDF o el Excel se lee en tu propio móvil u ordenador. El archivo nunca se sube a ningún servidor.</p>
  <p><b>Qué se guarda:</b> los movimientos que confirmas (fecha, concepto, importe, categoría y saldo), tus ajustes, tu nombre, tu correo y, si la pones, tu foto. Se guarda en tu cuenta, en la base de datos de Firebase (de Google), para que te salga igual en el móvil y en el ordenador. La conexión va cifrada. En tu dispositivo queda una copia para que funcione rápido, y se borra al pulsar «Salir».</p>
  <p><b>Quién lo ve:</b> solo tú. La app no deja que nadie vea las cuentas de otra persona, tampoco el administrador. Por honestidad: como dueño de la base de datos, el administrador podría técnicamente verlas desde la consola de Firebase. Se compromete a no hacerlo.</p>
  <p><b>Lo que ven los demás usuarios:</b> tu nombre y tu foto solo en el foro, si escribes en él. Nada de tus cuentas.</p>
  <p><b>Lo que no se hace:</b> no hay anuncios, no se venden ni se comparten datos y no se registra cómo usas la app. Si algo falla al leer un extracto, se anota el error (el nombre y el formato del archivo, nunca su contenido) para poder arreglarlo.</p>
  <p><b>Borrar tus datos:</b> en Mi perfil → Tus datos → «Borrar todos mis datos». Para eliminar también tu cuenta, pídeselo al administrador.</p>
  <p><b>El código es abierto:</b> cualquiera puede revisarlo en <a href="${REPO}" target="_blank" rel="noopener">GitHub</a>.</p>`}
function verPrivacidad(){dialog('Privacidad',`<div class="priv">${privacidadHtml()}</div>`,[{t:'Entendido',cls:'pri'}])}
$$('[data-priv]').forEach(b=>b.onclick=verPrivacidad);
function rPrivCard(){const el=$('#privCard');if(!el)return;
  el.innerHTML=`<details class="faq"><summary>🔒 Privacidad: qué se guarda, dónde y quién lo ve</summary><div class="priv" style="margin-left:22px">${privacidadHtml()}</div></details>`}

/* ---- Extracto de ejemplo: se ve cómo clasifica sin guardar nada ---- */
$('#impDemo').onclick=()=>{
  const m=mesDe(hoy()),f=d=>m+'-'+String(d).padStart(2,'0');let saldo=1200;
  const xs=[[1,'TRANSFERENCIA NOMINA EMPRESA EJEMPLO SL',1850],[2,'RECIBO ALQUILER PISO',-650],[3,'COMPRA MERCADONA VALENCIA',-63.4],[4,'NETFLIX.COM',-13.99],[5,'REPSOL ESTACION DE SERVICIO',-48],
    [6,'PAGO BIZUM DE LAURA CENA',22.5],[7,'IBERDROLA CLIENTES SAU',-41.2],[8,'GLOVO PEDIDO',-24.9],[9,'FARMACIA CENTRAL',-12.35],[10,'ZARA VALENCIA',-59.95],[12,'CAJERO RETIRADA EFECTIVO',-50],[13,'COMERCIO DESCONOCIDO 123',-17.8]];
  const movs=xs.map(([d,c,i])=>{saldo=r2(saldo+i);return {fecha:f(d),concepto:c,detalle:'',importe:i,saldo,ref:'',chk:true}});
  prepararRevision([{archivo:'Extracto de ejemplo (inventado)',banco:'',demo:true,movs,saldoIni:1200,saldoFin:saldo,finCalc:saldo,cuadra:true,malos:0}]);
  $('#impOut').scrollIntoView({behavior:'smooth',block:'start'});
};
