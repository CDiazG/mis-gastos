// Cuentas Claras · Pestaña Importar extracto: revisión y guardado
"use strict";
/* ============ Importar ============ */
let IMP=null;
const drop=$('#drop');
drop.onclick=()=>$('#pdfInput').click();
drop.ondragover=e=>{e.preventDefault();drop.classList.add('hover')};
drop.ondragleave=()=>drop.classList.remove('hover');
drop.ondrop=e=>{e.preventDefault();drop.classList.remove('hover');leerArchivos([...e.dataTransfer.files])};
$('#pdfInput').onchange=e=>{leerArchivos([...e.target.files]);e.target.value=''};
async function leerArchivos(files){
  files=files.filter(f=>/\.(pdf|csv|txt|xlsx|xls|n43|q43|aeb|c43)$/i.test(f.name)||/pdf|csv|sheet|excel|text/.test(f.type));
  if(!files.length){toast('Elige un extracto en PDF, Norma 43, CSV o Excel',true);return}
  $('#impOut').innerHTML='<div class="card pad" style="margin-top:14px">Leyendo '+files.length+' archivo'+(files.length>1?'s':'')+'…</div>';
  const res=[];
  for(const f of files){
    try{const rs=await leerExtracto(f);if(!rs.length)res.push({archivo:f.name,error:'cancelado',movs:[]});
      rs.forEach((r,i)=>{r.archivo=f.name+(rs.length>1?' · cuenta '+(r.cuentaTxt||i+1):'');res.push(r)})}
    catch(e){console.error(e);res.push({archivo:f.name,error:e.message||String(e),movs:[]})}
  }
  prepararRevision(res);
}
function prepararRevision(res){
  const rows=[];
  for(const r of res){
    if(r.error)continue;
    if(r.banco&&!S.cuentas.some(c=>c.n===r.banco))S.cuentas.push({n:r.banco,v:null,f:null,banco:1});
    if(r.inversion){const c=S.cuentas.find(c=>c.n===r.banco);if(c)c.inversion=1}
    r.cuenta=r.banco||(S.cuentas.find(c=>c.banco)||{n:'EVO'}).n;
    r.movs.forEach((m,i)=>{
      const ac=m.cat?{c:m.cat,r:{t:m.regla||r.banco,u:false}}:autoCatR(m.concepto,m.detalle,m.importe);let cat=ac.c;
      const nomina=!m.cat&&!r.inversion&&esNomina(m.concepto,m.importe,m.fecha);if(nomina)cat='INGRESO';
      const mes=mesPara({cat,nomina,fecha:m.fecha});
      const key=[r.cuenta,m.fecha,m.importe.toFixed(2),m.saldo!=null?m.saldo.toFixed(2):'',norm(m.concepto).trim().slice(0,24)].join('|');
      rows.push({...m,i,cuenta:r.cuenta,cat,nomina,mes,key,src:r,sel:true,estado:'nuevo',auto:!!cat,regla:ac.r?ac.r.t:'',reglaU:ac.r?!!ac.r.u:false});
    });
  }
  const dobles=buscarDobles(rows);
  // meses con datos del Excel que el extracto puede sustituir (no con una cuenta de inversión)
  const sust={};
  for(const x of rows){
    if(x.cat==='INGRESO'||x.src.inversion)continue;
    const m=mesDe(x.fecha);
    if(sust[m]===undefined){const n=S.mov.filter(y=>y.origen==='excel'&&y.mes===m&&y.metodo!=='efectivo'&&y.cat!=='INGRESO').length;sust[m]=n?{n,on:true}:null}
  }
  IMP={res,rows,sust,dobles,soloPend:false};
  marcarDuplicados();
  rImport();
}
// Cuentas de inversión (Trade Republic): el dinero que llega desde otra cuenta tuya es un traspaso
// y la inversión se cuenta al comprar los fondos. La transferencia que salió de la otra cuenta
// estaba como Inversión, así que se pasa a traspaso para no contarla dos veces.
function buscarDobles(rows){
  const inv=new Set(S.cuentas.filter(c=>c.inversion).map(c=>c.n));
  rows.filter(x=>x.src.inversion).forEach(x=>inv.add(x.cuenta));
  const cerca=(a,b)=>Math.abs(TR_DIAS(a)-TR_DIAS(b))<=5;
  const usados=new Set(),lista=[];
  // 1) movimientos de este mismo extracto: transferencia a la cuenta de inversión ya registrada
  for(const x of rows){
    if(x.src.inversion||x.cat!=='INVERSION'||x.importe>=0)continue;
    const y=S.mov.find(y=>inv.has(y.cuenta)&&y.cat==='TRASPASO'&&Math.abs(y.importe+x.importe)<0.005&&cerca(y.fecha,x.fecha)&&!usados.has(y));
    const z=!y&&rows.find(z=>z.src.inversion&&z.cat==='TRASPASO'&&Math.abs(z.importe+x.importe)<0.005&&cerca(z.fecha,x.fecha)&&!usados.has(z));
    if(y||z){usados.add(y||z);x.cat='TRASPASO';x.auto=true;x.regla='ya está en '+(y?y.cuenta:z.cuenta);x.reglaU=false}
  }
  // 2) movimientos ya guardados de otras cuentas que corresponden a los traspasos de este extracto
  for(const x of rows){
    if(!x.src.inversion||x.cat!=='TRASPASO'||x.importe<=0)continue;
    if(rows.some(z=>!z.src.inversion&&z.cat==='TRASPASO'&&Math.abs(z.importe+x.importe)<0.005&&cerca(z.fecha,x.fecha)))continue;
    const y=S.mov.find(y=>!inv.has(y.cuenta)&&y.cat==='INVERSION'&&!usados.has(y.id)&&Math.abs(y.importe+x.importe)<0.005&&(cerca(y.fecha,x.fecha)||(y.origen==='excel'&&(y.mes||mesDe(y.fecha))===mesDe(x.fecha))));
    if(y){usados.add(y.id);lista.push(y)}
  }
  return lista.length?{lista,on:true}:null;
}
function marcarDuplicados(){
  const quitar=new Set();
  for(const m in IMP.sust)if(IMP.sust[m]&&IMP.sust[m].on)S.mov.forEach(y=>{if(y.origen==='excel'&&y.mes===m&&y.metodo!=='efectivo'&&y.cat!=='INGRESO')quitar.add(y.id)});
  const keys=new Set(S.mov.map(x=>x.key).filter(Boolean));
  const usados=new Set();
  for(const x of IMP.rows){
    if(keys.has(x.key)){x.estado='ya';x.sel=false;x.dupDe=null;continue}
    const d=S.mov.find(y=>!y.key&&y.metodo!=='efectivo'&&!quitar.has(y.id)&&!usados.has(y.id)&&y.mes===x.mes&&Math.abs(y.importe-x.importe)<0.005&&(!x.src.inversion||y.cuenta===x.cuenta));
    if(d){usados.add(d.id);x.estado='dup';x.dupDe=d;if(x._userSel===undefined)x.sel=false}
    else{x.estado='nuevo';x.dupDe=null;if(x._userSel===undefined)x.sel=true}
  }
}
function rImport(){
  const o=$('#impOut');if(!IMP){o.innerHTML='';return}
  let h='';
  for(const r of IMP.res){
    if(r.error==='cancelado')continue;
    if(r.error){h+=`<div class="alert bad" style="margin-top:14px"><span class="grow"><b>${esc(r.archivo)}</b>: no se ha podido leer (${esc(r.error)}).</span></div>`;continue}
    if(!r.movs.length){h+=`<div class="alert bad" style="margin-top:14px"><span class="grow"><b>${esc(r.archivo)}</b>: no he encontrado movimientos. Si es un PDF escaneado (una foto), no tiene texto que leer.</span></div>`;continue}
    const f=r.movs.map(m=>m.fecha).sort();
    h+=`<div class="card pad" style="margin-top:14px"><div class="sumline">
      <div class="it"><div class="l">Archivo</div><div class="v">${esc(r.archivo)}</div></div>
      <div class="it"><div class="l">Cuenta</div><div class="v"><select data-cuenta="${IMP.res.indexOf(r)}">${S.cuentas.map(c=>`<option${c.n===r.cuenta?' selected':''}>${esc(c.n)}</option>`).join('')}</select></div></div>
      <div class="it"><div class="l">Movimientos</div><div class="v">${r.movs.length} · ${fFecha(f[0])} – ${fFecha(f[f.length-1])}</div></div>
      <div class="it"><div class="l">Saldo inicial → final</div><div class="v num">${r.saldoIni!=null?eur(r.saldoIni):'?'} → ${r.saldoFin!=null?eur(r.saldoFin):'?'}</div></div>
      <div class="it"><div class="l">Comprobación</div><div class="v">${r.cuadra===true?'<span class="ok">✓ Cuadra con el saldo del banco</span>':r.cuadra===false?`<span class="ko">✗ No cuadra (calculado ${eur(r.finCalc)})</span>`:'<span class="mut">Sin saldo para comprobar</span>'}</div></div>
    </div>${r.inversion?`<p class="small mut" style="margin:8px 0 0">Cuenta de inversión: las compras de fondos cuentan como <b>Inversión</b> el día que se hacen, las ventas la reducen y el dinero que llega desde tus otras cuentas es un <b>traspaso</b>. El saldo es el dinero sin invertir, no el valor de los fondos.</p>`:''}${r.malos?`<p class="small ko" style="margin:8px 0 0">${r.malos} líneas no encajan con el saldo; revisa sus importes.</p>`:''}</div>`;
  }
  const sm=Object.entries(IMP.sust).filter(([m,v])=>v);
  if(sm.length)h+=`<div class="alert info" style="margin-top:14px;flex-direction:column;align-items:stretch">${sm.map(([m,v])=>`<label class="pill"><input type="checkbox" data-sust="${m}" ${v.on?'checked':''}> Sustituir los ${v.n} apuntes del Excel de <b>${nombreMes(m)}</b> por los del extracto (el efectivo y los ingresos del Excel se mantienen)</label>`).join('')}</div>`;
  const db=IMP.dobles;
  if(db){const tot=r2(-db.lista.reduce((a,y)=>a+y.importe,0)),cs=[...new Set(db.lista.map(y=>y.cuenta||'el Excel'))].join(', ');
    h+=`<div class="alert info" style="margin-top:14px"><label class="pill grow"><input type="checkbox" id="impDobles" ${db.on?'checked':''}> Pasar a «Traspaso entre mis cuentas» ${db.lista.length} transferencia${db.lista.length>1?'s':''} a ${esc(IMP.res.find(r=>r.inversion).banco)} (${eur(tot)}) que ya tenías como Inversión en ${esc(cs)}. Con este extracto la inversión se cuenta al comprar los fondos; así no se cuenta dos veces (recomendado).</label></div>`}
  const R=IMP.rows;
  if(R.length){
    const pend=R.filter(x=>x.sel&&!x.cat).length,nsel=R.filter(x=>x.sel).length;
    const vis=IMP.soloPend?R.filter(x=>!x.cat):R;
    h+=`<div class="toolbar"><label class="pill small"><input type="checkbox" id="impPend" ${IMP.soloPend?'checked':''}> Ver solo los que no tienen categoría (${R.filter(x=>!x.cat).length})</label><span class="sp"></span>
      ${R.some(x=>!x.cat&&isBizum(x.concepto)&&x.importe>0)?`<label class="pill small">Bizum recibidos sin categoría → <select id="impBiz">${catOptions('',{blankText:'elige…'})}</select></label>`:''}
      <span class="small ${pend?'ko':'mut'}">${pend?pend+' marcados sin categoría':''}</span>
      <button class="btn" id="impCancel">Cancelar</button><button class="btn pri" id="impGo" ${nsel?'':'disabled'}>Guardar ${nsel} movimientos</button></div>
    <div class="card tablewrap"><table class="rtable"><thead><tr><th style="width:28px"><input type="checkbox" id="impAll" ${R.every(x=>x.sel||x.estado==='ya')?'checked':''}></th><th>Fecha</th><th>Concepto</th><th>Categoría</th><th class="r">Importe</th><th>Estado</th></tr></thead><tbody>`+
    vis.map(x=>{const k=R.indexOf(x);
      const est=x.estado==='ya'?'<span class="tag">ya importado</span>':x.estado==='dup'?`<span class="tag bad" title="${esc(x.dupDe.concepto)} · ${fFecha(x.dupDe.fecha)}">¿repetido? ${esc(x.dupDe.concepto.slice(0,18))}</span>`:(x.cat&&x.auto?`<span class="tag good" title="${x.reglaU?'Regla aprendida':'Regla de serie'}: el concepto contiene «${esc(x.regla)}». Si no es correcta, cambia la categoría.">auto · ${esc(x.regla)}</span>`:'');
      return `<tr data-k="${k}" class="${x.sel?'':'off'} ${x.cat||!x.sel?'':'nocat'}"><td><input type="checkbox" class="isel" ${x.sel?'checked':''} ${x.estado==='ya'?'disabled':''}></td>
      <td class="num">${fFecha(x.fecha)}</td>
      <td><div>${esc(x.concepto)}${x.nomina&&x.cat==='INGRESO'?`<span class="tag good">nómina</span> <select class="imes" style="font-size:12.5px;padding:2px 4px;margin-left:4px" title="Mes al que cuenta esta nómina">${[mesDe(x.fecha),addMes(mesDe(x.fecha),1)].map(m=>`<option value="${m}"${m===x.mes?' selected':''}>cuenta en ${nombreMes(m)}</option>`).join('')}</select>`:(x.mes!==mesDe(x.fecha)?`<span class="tag acc">cuenta en ${nombreMesC(x.mes)}</span>`:'')}</div>${x.detalle?`<div class="det">${esc(x.detalle)}</div>`:''}</td>
      <td><select class="icat">${catOptions(x.cat)}</select></td>
      <td class="r num ${x.importe>0?'pos':''}">${x.importe>0?'+':''}${eur(x.importe)}</td><td>${est}</td></tr>`}).join('')+`</tbody></table></div>
    <p class="small mut">Las etiquetas «auto» indican qué palabra del concepto ha decidido la categoría; revísalas antes de guardar. Al cambiar una categoría, el programa aprende la regla (con las palabras del nombre del comercio) y la aplica a los movimientos con ese mismo nombre. Los Bizum que te mandan suelen ser devoluciones: ponles la categoría del gasto que pagaste (por ejemplo, Restaurantes y ocio) y se restan de ese gasto.</p>`;
  }
  o.innerHTML=h;
  $$('[data-cuenta]',o).forEach(s=>s.onchange=()=>{const r=IMP.res[+s.dataset.cuenta];r.cuenta=s.value;IMP.rows.filter(x=>x.src===r).forEach(x=>{x.cuenta=s.value;x.key=[x.cuenta,...x.key.split('|').slice(1)].join('|')});marcarDuplicados();rImport()});
  $$('[data-sust]',o).forEach(c=>c.onchange=()=>{IMP.sust[c.dataset.sust].on=c.checked;marcarDuplicados();rImport()});
  const ib=$('#impBiz');if(ib)ib.onchange=()=>{const c=ib.value;if(!c)return;let n=0;IMP.rows.forEach(x=>{if(!x.cat&&isBizum(x.concepto)&&x.importe>0){x.cat=c;x.auto=false;n++}});toast(n+' Bizum actualizados');marcarDuplicados();rImport()};
  const idb=$('#impDobles');if(idb)idb.onchange=()=>{IMP.dobles.on=idb.checked};
  const ip=$('#impPend');if(ip)ip.onchange=()=>{IMP.soloPend=ip.checked;rImport()};
  const ia=$('#impAll');if(ia)ia.onchange=()=>{IMP.rows.forEach(x=>{if(x.estado!=='ya'){x.sel=ia.checked;x._userSel=true}});rImport()};
  $$('tr[data-k]',o).forEach(tr=>{const x=IMP.rows[+tr.dataset.k];
    $('.isel',tr).onchange=e=>{x.sel=e.target.checked;x._userSel=true;rImport()};
    const im=$('.imes',tr);if(im)im.onchange=e=>{x.mes=e.target.value;marcarDuplicados();rImport()};
    $('.icat',tr).onchange=e=>{
      x.cat=e.target.value;x.auto=false;
      marcarNomina(x);
      if(x.cat){learn(x.concepto,x.cat);save();
        const k=learnKey(x.concepto);let n=0;
        if(pref('aprender')&&(!isBizum(x.concepto)||pref('bizumReglas')))IMP.rows.forEach(y=>{if(y!==x&&!y.cat&&learnKey(y.concepto)===k){y.cat=x.cat;y.auto=true;y.regla=k;y.reglaU=true;marcarNomina(y);n++}});
        if(n)toast(`También aplicado a ${n} movimiento${n>1?'s':''} parecido${n>1?'s':''}`);
      }
      marcarDuplicados();rImport();
    };
  });
  const cg=$('#impCancel');if(cg)cg.onclick=()=>{IMP=null;rImport()};
  const gb=$('#impGo');if(gb)gb.onclick=guardarImport;
}
function guardarImport(){
  const sel=IMP.rows.filter(x=>x.sel&&x.estado!=='ya');
  const quitar=new Set();
  for(const m in IMP.sust)if(IMP.sust[m]&&IMP.sust[m].on)S.mov.forEach(y=>{if(y.origen==='excel'&&y.mes===m&&y.metodo!=='efectivo'&&y.cat!=='INGRESO')quitar.add(y.id)});
  S.mov=S.mov.filter(y=>!quitar.has(y.id));
  if(IMP.dobles&&IMP.dobles.on)IMP.dobles.lista.forEach(y=>{y.cat='TRASPASO'});
  let orden=0;
  for(const x of sel)S.mov.push({id:uid(),fecha:x.fecha,mes:x.mes,concepto:x.concepto,detalle:x.detalle||'',importe:x.importe,cat:x.cat,nomina:!!x.nomina,metodo:'banco',cuenta:x.cuenta,origen:'extracto',key:x.key,orden:orden++});
  for(const r of IMP.res){
    if(r.error||!r.movs.length||r.saldoFin==null)continue;
    const c=S.cuentas.find(c=>c.n===r.cuenta);const ff=r.movs.map(m=>m.fecha).sort().pop();
    if(c&&(!c.f||ff>=c.f)){c.v=r.saldoFin;c.f=ff;c.banco=1}
  }
  save();
  const meses=[...new Set(sel.map(x=>x.mes))].sort();
  const pend=sel.filter(x=>!x.cat).length;
  IMP=null;rImport();
  toast(`Guardados ${sel.length} movimientos${quitar.size?` · sustituidos ${quitar.size} del Excel`:''}`);
  if(meses.length){const m=meses.filter(m=>sel.filter(x=>x.mes===m).length>2).pop()||meses[meses.length-1];MES=m}
  if(pend){F.sinCat=true;F.cat='';go('movs')}else go('resumen');
}
