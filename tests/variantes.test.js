const assert = require('assert'); const L = require('./lib');
module.exports = { 'Tablas en 108 combinaciones de fechas, números y columnas'(browser, estado) { return (async () => {
  const ctx = await L.nuevoContexto(browser); (estado.contextos ||= []).push(ctx);
  const p = await L.nuevaPagina(ctx); estado.paginas.push(p); await L.crearAdminYEntrar(p);
  const r = await p.evaluate(() => {
    const base = [['2026-11-16','COMPRA TIENDA UNO',-30.99],['2026-11-14','BIZUM DE ANA',2.7],['2026-11-13','RECIBO SUPER DOS',-1217.5],['2026-11-12','NOMINA EMPRESA',1000]];
    const dts = { iso: d=>d, es: d=>d.split('-').reverse().join('/'), guion: d=>d.split('-').reverse().join('-'), punto: d=>d.split('-').reverse().join('.'), corto: d=>{const [y,m,dd]=d.split('-');return dd+'/'+m+'/'+y.slice(2)}, texto: d=>{const [y,m,dd]=d.split('-');return (+dd)+' '+['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][+m-1]+' '+y} };
    const nums = { es: v=>v.toFixed(2).replace('.',','), esm: v=>v.toLocaleString('es-ES',{minimumFractionDigits:2,useGrouping:true}), en: v=>v.toFixed(2), enm: v=>v.toLocaleString('en-US',{minimumFractionDigits:2}), eur: v=>v.toFixed(2).replace('.',',')+' €', sig: v=>(v<0?'-':'+')+Math.abs(v).toFixed(2).replace('.',',') };
    const out = [];
    for (const [dn,df] of Object.entries(dts)) for (const [nn,nf] of Object.entries(nums)) for (const modo of ['una','dos','saldo']) {
      let filas;
      if (modo==='dos') filas=[['Fecha','Concepto','Cargo','Abono'],...base.map(b=>[df(b[0]),b[1],b[2]<0?nf(-b[2]):'',b[2]>0?nf(b[2]):''])];
      else if (modo==='saldo') { let s=1000+1000; filas=[['Fecha','Descripción','Importe','Saldo'],...base.slice().reverse().map(b=>{s+=b[2];return [df(b[0]),b[1],nf(b[2]),nf(s)]}).reverse()]; }
      else filas=[['Fecha','Concepto','Importe'],...base.map(b=>[df(b[0]),b[1],nf(b[2])])];
      try { const m=detectarColumnas(filas); const t=tablaAMovs(filas,m); const ok=t.movs.length===4&&t.movs.every(x=>base.some(b=>Math.abs(b[2]-x.importe)<.005&&b[0]===x.fecha)); if(!ok) out.push(dn+'/'+nn+'/'+modo+' '+JSON.stringify(t.movs.map(x=>[x.fecha,x.importe]))); } catch(e){ out.push(dn+'/'+nn+'/'+modo+' ERR '+e.message) }
    }
    return out;
  });
  assert.equal(r.length, 0, r.slice(0, 10).join('\n'));
})() } };
