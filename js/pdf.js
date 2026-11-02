// Cuentas Claras · Lectura de extractos en PDF (EVO, Revolut y formatos parecidos)
"use strict";
/* ============ PDF ============ */
let _pdfjs=null;
async function getPdfjs(){
  if(_pdfjs)return _pdfjs;
  const mod=await import(new URL('lib/pdf.min.mjs?v='+VERSION,location.href).href);
  mod.GlobalWorkerOptions.workerSrc=new URL('lib/pdf.worker.min.mjs?v='+VERSION,location.href).href;
  return _pdfjs=mod;
}
async function pdfLines(buf){
  const lib=await getPdfjs();
  const doc=await lib.getDocument({data:buf,isEvalSupported:false}).promise;
  const lines=[];
  for(let p=1;p<=doc.numPages;p++){
    const pg=await doc.getPage(p);const tc=await pg.getTextContent();
    const toks=[];
    for(const it of tc.items){
      if(!it.str||!it.str.trim())continue;
      const x=it.transform[4],y=it.transform[5],w=it.width||0,s=it.str;
      // trocear en palabras con posición aproximada
      const re=/\S+/g;let m;const L=s.length||1;
      while((m=re.exec(s))){toks.push({s:m[0],x:x+w*m.index/L,w:w*m[0].length/L,y})}
    }
    toks.sort((a,b)=>b.y-a.y||a.x-b.x);
    let cur=null;
    for(const t of toks){if(!cur||Math.abs(cur.y-t.y)>2.5){cur={p,y:t.y,t:[]};lines.push(cur)}cur.t.push(t)}
    lines.filter(l=>l.p===p).forEach(l=>l.t.sort((a,b)=>a.x-b.x));
  }
  return {lines,text:lines.map(l=>l.t.map(t=>t.s).join(' ')).join('\n')};
}
const RD=/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/;
const RA=/^[-−+]?(?:\d{1,3}(?:\.\d{3})+|\d+),\d{2}(?:€|EUR)?-?$/;
const isAmt=s=>RA.test(s);
function amt(s){const neg=/^[-−]/.test(s)||/-$/.test(s);s=s.replace(/[-−+€]|EUR/g,'').replace(/\./g,'').replace(',','.');return (neg?-1:1)*parseFloat(s)}
function dateAt(t,i){
  const a=t[i]?.s;if(!a)return null;
  let m=a.match(RD);
  if(m){let y=+m[3];if(y<100)y+=2000;return {f:`${y}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`,n:1}}
  if(/^\d{1,2}$/.test(a)&&t[i+1]&&t[i+2]){
    const mo=MABR[t[i+1].s.toLowerCase().replace('.','')];const y=t[i+2].s;
    if(mo&&/^\d{4}$/.test(y))return {f:`${y}-${String(mo).padStart(2,'0')}-${a.padStart(2,'0')}`,n:3};
  }
  return null;
}
// Trade Republic: cada movimiento ocupa varias líneas (día y mes arriba, importe y saldo
// en medio, año abajo), así que se agrupan las líneas desde la fecha hasta el año.
const TR_DIAS=f=>Math.round(new Date(f+'T12:00:00Z').getTime()/864e5);
function esMismaPersona(a,b){
  const ta=norm(a).trim().split(' ').filter(x=>x.length>2),tb=new Set(norm(b).trim().split(' '));
  if(!ta.length)return false;const n=ta.filter(x=>tb.has(x)).length;return n>=Math.min(2,ta.length);
}
function movTradeRepublic(tipo,desc,importe,titular){
  const d=desc.replace(/\s+/g,' ').trim(),TT=norm(tipo),D=norm(d);
  const qty=d.match(/,?\s*(?:quantity|cantidad)\s*:?\s*([\d.,]+)\s*$/i);
  const sinQty=qty?d.slice(0,qty.index).trim():d;
  const isin=sinQty.match(/\b([A-Z]{2}[A-Z0-9]{9}\d)\b/);
  const valor=isin?sinQty.slice(isin.index+isin[0].length).trim():sinQty;
  const det=[isin?isin[1]:'',qty?qty[1]+' participaciones':''].filter(Boolean).join(' · ');
  let m;
  if(/ SAVINGS PLAN | PLAN DE (INVERSION|AHORRO) /.test(D))return {concepto:'Plan de inversión · '+valor,detalle:det,cat:'INVERSION',regla:'plan de inversión'};
  if(/ (BUY|KAUF) | COMPRA /.test(D)&&/ TRADE | ORDER | OPERACION | ORDEN /.test(D))return {concepto:'Compra · '+valor,detalle:det,cat:'INVERSION',regla:'compra de inversión'};
  if(/ (SELL|VERKAUF) | VENTA /.test(D)&&/ TRADE | ORDER | OPERACION | ORDEN /.test(D))return {concepto:'Venta · '+valor,detalle:det,cat:'INVERSION',regla:'venta de inversión'};
  if(/ (DIVIDEND|DIVIDENDO|DISTRIBUTION|DISTRIBUCION)/.test(D+TT))return {concepto:'Dividendo · '+valor,detalle:det,cat:'INGRESO',regla:'dividendo'};
  if(/ (INTEREST|INTERES|INTERESES|ZINS)/.test(D+TT))return {concepto:'Intereses Trade Republic',detalle:'',cat:importe>0?'INGRESO':'',regla:'intereses'};
  if((m=d.match(/^(?:Incoming transfer from|Transferencia (?:entrante )?de)\s+(.+?)(?:\s*\(([A-Z]{2}\d{2}[A-Z0-9]+)\))?$/i))){
    const yo=esMismaPersona(titular,m[1]);
    return {concepto:'Transferencia de '+m[1],detalle:m[2]||'',cat:yo?'TRASPASO':'',regla:yo?'desde otra cuenta tuya':''};
  }
  if((m=d.match(/^(?:Outgoing transfer (?:to|for)|Transferencia (?:saliente )?(?:a|para))\s+(.+?)(?:\s*\(([A-Z]{2}\d{2}[A-Z0-9]+)\))?$/i))){
    const yo=esMismaPersona(titular,m[1]);
    return {concepto:'Transferencia a '+m[1],detalle:m[2]||'',cat:yo?'TRASPASO':'',regla:yo?'a otra cuenta tuya':''};
  }
  if(/ OPERAR | TRADE /.test(TT))return {concepto:valor||d,detalle:det,cat:'INVERSION',regla:'operación de bolsa'};
  return {concepto:d||tipo||'(sin concepto)',detalle:'',cat:'',regla:''};
}
function parseTradeRepublic({lines}){
  let titular='',cols={},saldoIni=null,saldoFin=null,esperaResumen=false,prev=null,fila=null,anioDef=null;
  const movs=[];
  const cerrar=anio=>{
    if(!fila)return;const f=fila;fila=null;
    const y=anio||f.anio||anioDef;if(!y||!f.mo)return;
    const toks=f.toks;const amts=toks.filter(x=>isAmt(x.s));if(!amts.length)return;
    const dx=cols.desc!=null?cols.desc-4:140,ax=cols.entrada!=null?Math.min(cols.entrada,cols.salida||1e9)-6:400;
    const palabras=toks.filter(x=>!isAmt(x.s)&&x.s!=='€');
    const tipo=palabras.filter(x=>x.x<dx).map(x=>x.s).join(' ');
    const desc=palabras.filter(x=>x.x>=dx&&x.x<ax).map(x=>x.s).join(' ');
    let saldo=null,impTok=amts[0];if(amts.length>=2){saldo=amt(amts[amts.length-1].s);impTok=amts[amts.length-2]}
    const imp=Math.abs(amt(impTok.s));let signed=null,chk=null;
    if(saldo!=null&&prev!=null){const diff=r2(saldo-prev);if(Math.abs(Math.abs(diff)-imp)<0.011){signed=diff<0?-imp:imp;chk=true}else chk=false}
    if(signed==null&&cols.entrada!=null&&cols.salida!=null)signed=Math.abs(impTok.x-cols.entrada)<Math.abs(impTok.x-cols.salida)?imp:-imp;
    if(signed==null)signed=-imp;
    const info=movTradeRepublic(tipo,desc,signed,titular);
    const fecha=`${y}-${String(f.mo).padStart(2,'0')}-${String(f.d).padStart(2,'0')}`;
    movs.push({fecha,concepto:info.concepto,detalle:info.detalle,importe:r2(signed),saldo,ref:'',chk,cat:info.cat,regla:info.regla});
    if(saldo!=null)prev=saldo;
    if(saldoIni==null&&saldo!=null)saldoIni=r2(saldo-signed);
  };
  let pag=0;
  for(const l of lines){
    const t=l.t,txt=t.map(x=>x.s).join(' '),C=norm(txt).replace(/ /g,'');
    if(l.p!==pag){cerrar(null);pag=l.p}
    // titular (a la izquierda de «FECHA» en la cabecera) y periodo del extracto
    const fx=t.findIndex(x=>x.s==='FECHA'&&x.x>200);
    if(fx>0&&!titular){titular=t.slice(0,fx).map(x=>x.s).join(' ');const ys=t.slice(fx).filter(x=>/^\d{4}$/.test(x.s));if(ys.length)anioDef=+ys[0].s;continue}
    if(C.includes('BALANCEINICIAL')&&C.includes('BALANCEFINAL')){esperaResumen=true;continue}
    const amts=t.filter(x=>isAmt(x.s));
    if(esperaResumen&&amts.length>=2){saldoIni=amt(amts[0].s);saldoFin=amt(amts[amts.length-1].s);prev=saldoIni;esperaResumen=false;continue}
    if(t.some(x=>x.s==='ENTRADA')&&t.some(x=>x.s==='SALIDA')){cols.entrada=t.find(x=>x.s==='ENTRADA').x;cols.salida=t.find(x=>x.s==='SALIDA').x;continue}
    if(t[0]&&t[0].s==='FECHA'&&t.some(x=>/^DESCRIPCI/.test(x.s))){cols.desc=t.find(x=>/^DESCRIPCI/.test(x.s)).x;cols.tipo=(t.find(x=>x.s==='TIPO')||{}).x;continue}
    if(cols.desc==null)continue;
    const lim=cols.tipo!=null?cols.tipo-4:cols.desc-4;
    const mo=t[1]&&MABR[t[1].s.toLowerCase().replace('.','')];
    if(t[0]&&/^\d{1,2}$/.test(t[0].s)&&t[0].x<lim&&mo){
      cerrar(null);
      fila={d:+t[0].s,mo,toks:[]};let resto=t.slice(2);
      if(resto[0]&&/^\d{4}$/.test(resto[0].s)&&resto[0].x<lim){const y=+resto[0].s;fila.toks.push(...resto.slice(1));
        if(resto.slice(1).some(x=>isAmt(x.s))){cerrar(y);continue}fila.anio=y;continue}
      fila.toks.push(...resto);continue;
    }
    // día solo en su línea; el mes («sept») llega en la siguiente
    if(t[0]&&/^\d{1,2}$/.test(t[0].s)&&t[0].x<lim&&!(t[1]&&t[1].x<lim)){cerrar(null);fila={d:+t[0].s,mo:null,toks:t.slice(1)};continue}
    if(!fila)continue;
    if(fila.mo==null&&t[0]&&t[0].x<lim&&MABR[t[0].s.toLowerCase().replace('.','')]){fila.mo=MABR[t[0].s.toLowerCase().replace('.','')];fila.toks.push(...t.slice(1));continue}
    if(t[0]&&/^\d{4}$/.test(t[0].s)&&t[0].x<lim){fila.toks.push(...t.slice(1));cerrar(+t[0].s);continue}
    if(/^(RESUMENDELBALANCE|NOTASSOBRE|TRADEREPUBLICBANKGMBH)/.test(C)){cerrar(fila.anio);continue}
    fila.toks.push(...t);
    if(fila.anio&&amts.length)cerrar(fila.anio);
  }
  cerrar(null);
  const sum=r2(movs.reduce((a,m)=>a+m.importe,0));
  const finCalc=saldoIni!=null?r2(saldoIni+sum):null;
  const finReal=saldoFin!=null?saldoFin:(movs.length?movs[movs.length-1].saldo:null);
  const cuadra=finCalc!=null&&finReal!=null?Math.abs(finCalc-finReal)<0.011:null;
  return {banco:'Trade Republic',inversion:true,movs,saldoIni,saldoFin:finReal,finCalc,cuadra,malos:movs.filter(m=>m.chk===false).length};
}
function parseStatement({lines,text}){
  const T=norm(text);
  if(T.includes(' TRADE REPUBLIC BANK')||T.includes(' TRBKDEBB'))return parseTradeRepublic({lines,text});
  let banco='';if(T.includes(' REVOLUT BANK')||T.includes(' REVOESM'))banco='Revolut';else if(T.includes(' EVO ')||T.includes(' BKBKESMM'))banco='EVO';else if(T.includes(' BANKINTER'))banco='Bankinter';
  let cols=null,expectSum=false,saldoIni=null,saldoFin=null,prev=null,last=null,lastY=0,cont=0;
  const movs=[];
  const center=t=>t.x+t.w/2;
  for(const l of lines){
    const t=l.t;const txt=t.map(x=>x.s).join(' ');const nn=norm(txt);const compact=nn.replace(/ /g,'');
    const amts=t.filter(x=>isAmt(x.s));
    // cabecera de columnas
    if(compact.includes('SALDO')&&/CARGO|DEBE|IMPORTE|SALIENTE|ENTRANTE|ABONO|HABER/.test(compact)&&!dateAt(t,0)&&!amts.length){
      const c={};
      for(const x of t){const u=norm(x.s).trim();
        if(/^(CARGOS?|DEBE|SALIENTE|RETIRADAS?)$/.test(u))c.cargo=center(x);
        else if(/^(ABONOS?|HABER|ENTRANTE|INGRESOS?)$/.test(u))c.abono=center(x);
        else if(/^SALDO$/.test(u))c.saldo=center(x);
        else if(/^IMPORTE$/.test(u))c.importe=center(x);}
      if(c.cargo||c.abono||c.importe)cols=c;
      if(compact.includes('SALDOINICIAL')&&compact.includes('SALDOFINAL'))expectSum=true;
      last=null;continue;
    }
    if(expectSum&&amts.length>=2&&!dateAt(t,0)){if(saldoIni==null)saldoIni=amt(amts[0].s);if(saldoFin==null)saldoFin=amt(amts[amts.length-1].s);expectSum=false;prev=saldoIni;last=null;continue}
    // líneas de saldo
    if(compact.includes('SALDO')&&amts.length&&!dateAt(t,0)){
      const v=amt(amts[amts.length-1].s);
      if(compact.includes('FINAL')){saldoFin=v}else{if(saldoIni==null)saldoIni=v;prev=v}
      last=null;continue;
    }
    const d=dateAt(t,0);
    if(d&&amts.length){
      let i=d.n;const d2=dateAt(t,i);let ref='';
      if(!d2&&t[i]&&/^\d{1,8}$/.test(t[i].s)){ref=t[i].s;i++}
      const d3=dateAt(t,i);if(d3)i+=d3.n;
      const firstAmtX=amts[0].x;
      const desc=t.slice(i).filter(x=>!isAmt(x.s)&&x.s!=='€'&&x.x<firstAmtX).map(x=>x.s).join(' ');
      let impTok,saldo=null;
      if(amts.length>=2){saldo=amt(amts[amts.length-1].s);impTok=amts[amts.length-2]}else{impTok=amts[0]}
      let imp=Math.abs(amt(impTok.s));let signed=null;
      if(/^[-−]|-$/.test(impTok.s))signed=-imp;
      if(signed==null&&cols){
        const cx=center(impTok);const dc=cols.cargo!=null?Math.abs(cx-cols.cargo):1e9,da=cols.abono!=null?Math.abs(cx-cols.abono):1e9;
        if(dc<1e9||da<1e9)signed=dc<=da?-imp:imp;
      }
      let chk=null;
      if(saldo!=null&&prev!=null){const diff=r2(saldo-prev);if(Math.abs(Math.abs(diff)-imp)<0.011){signed=diff<0?-imp:imp;chk=true}else chk=false}
      if(signed==null)signed=-imp;
      const m={fecha:d.f,concepto:desc.trim()||'(sin concepto)',detalle:'',importe:r2(signed),saldo,ref,chk};
      movs.push(m);last=m;lastY=l.y;cont=0;if(saldo!=null)prev=saldo;
      if(saldoIni==null&&saldo!=null)saldoIni=r2(saldo-signed);
      continue;
    }
    // continuación de concepto
    if(last&&!amts.length&&!d&&l.y<lastY&&lastY-l.y<=16&&cont<2){
      lastY=l.y;cont++;
      if(/^(TARJETA|IBAN|BIC|TITULAR|PAGINA|NOTIFICAR|FECHA)/.test(nn.trim()))continue;
      let s=txt.trim();if(/^A\s/.test(s))s=s.slice(2);
      last.detalle=(last.detalle?last.detalle+' · ':'')+s;continue;
    }
    if(last&&l.y<lastY)last=null;
  }
  const sum=r2(movs.reduce((a,m)=>a+m.importe,0));
  const finCalc=saldoIni!=null?r2(saldoIni+sum):null;
  const finReal=saldoFin!=null?saldoFin:(movs.length&&movs[movs.length-1].saldo!=null?movs[movs.length-1].saldo:null);
  const cuadra=finCalc!=null&&finReal!=null?Math.abs(finCalc-finReal)<0.011:null;
  return {banco,movs,saldoIni,saldoFin:finReal,finCalc,cuadra,malos:movs.filter(m=>m.chk===false).length};
}
