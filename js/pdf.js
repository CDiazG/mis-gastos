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
function parseStatement({lines,text}){
  const T=norm(text);
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
