// Cuentas Claras · Pestañas Movimientos y Añadir
"use strict";
/* ============ Movimientos ============ */
const F={q:'',cat:'',sinCat:false,todos:false};
const SEL=new Set();
function pagoOptions(sel){return S.cuentas.map(c=>`<option${c.n===sel?' selected':''}>${esc(c.n)}</option>`).join('')+`<option value="__efectivo"${sel==='__efectivo'?' selected':''}>Efectivo</option>`}
function rMovs(){
  $('#fCat').innerHTML=catOptions(F.cat,{blankText:'Todas las categorías'});
  $('#fSinCat').checked=F.sinCat;$('#fBuscar').value=F.q;
  let list=F.todos&&F.cat?S.mov.filter(x=>x.cat===F.cat):S.mov.filter(x=>x.mes===MES);
  if(F.cat)list=list.filter(x=>x.cat===F.cat);
  if(F.sinCat)list=list.filter(x=>!x.cat);
  if(F.q){const q=norm(F.q).trim();list=list.filter(x=>norm(x.concepto+' '+(x.detalle||'')+' '+(x.nota||'')).includes(q))}
  list.sort((a,b)=>b.fecha.localeCompare(a.fecha)||(a.orden??0)-(b.orden??0));
  for(const id of [...SEL])if(!list.some(x=>x.id===id))SEL.delete(id);
  const tb=$('#movTable tbody');
  tb.innerHTML=list.length?list.map(x=>{
    const tags=[];
    if(x.metodo==='efectivo')tags.push('<span class="tag cash">efectivo</span>');else if(x.cuenta)tags.push(`<span class="tag">${esc(x.cuenta)}</span>`);
    if(x.mes!==mesDe(x.fecha))tags.push(`<span class="tag acc">cuenta en ${nombreMesC(x.mes)}</span>`);
    if(x.origen==='excel')tags.push('<span class="tag">Excel</span>');
    if(x.origen==='manual')tags.push('<span class="tag">a mano</span>');
    if(x.nomina&&x.cat==='INGRESO')tags.push('<span class="tag good">nómina</span>');
    return `<tr data-id="${x.id}" class="${x.cat?'':'nocat'}"><td><input type="checkbox" class="sel" ${SEL.has(x.id)?'checked':''}></td>
      <td class="num">${fFecha(x.fecha)}</td>
      <td><div>${esc(x.concepto)}${tags.join('')}</div>${x.detalle||x.nota?`<div class="det">${esc([x.detalle,x.nota].filter(Boolean).join(' · '))}</div>`:''}</td>
      <td><select class="cat">${catOptions(x.cat)}</select></td>
      <td class="r num ${x.importe>0?'pos':''}">${x.importe>0?'+':''}${eur(x.importe)}</td>
      <td><button class="btn sm icon edit" title="Editar">✎</button></td></tr>`}).join('')
    :`<tr><td colspan="6" class="empty">No hay movimientos${F.cat||F.sinCat||F.q?' con este filtro':' en '+nombreMes(MES)}.</td></tr>`;
  const tot=list.reduce((a,x)=>a+x.importe,0);
  $('#movFoot').textContent=`${list.length} movimientos · salidas ${eur(-list.filter(x=>x.importe<0).reduce((a,x)=>a+x.importe,0))} · entradas ${eur(list.filter(x=>x.importe>0).reduce((a,x)=>a+x.importe,0))}`+(F.todos&&F.cat?' · todos los meses':'');
  $$('#movTable tbody tr[data-id]').forEach(tr=>{
    const id=tr.dataset.id,x=S.mov.find(m=>m.id===id);
    $('.cat',tr).onchange=e=>{x.cat=e.target.value;if(x.origen==='extracto'&&x.cat)learn(x.concepto,x.cat);if(x.origen!=='excel'){marcarNomina(x)};save();rMovs();toast('Categoría cambiada')};
    $('.edit',tr).onclick=()=>editar(x);
    $('.sel',tr).onchange=e=>{e.target.checked?SEL.add(id):SEL.delete(id);selUI()};
  });
  $('#movAll').checked=list.length&&list.every(x=>SEL.has(x.id));
  $('#movAll').onchange=e=>{list.forEach(x=>e.target.checked?SEL.add(x.id):SEL.delete(x.id));rMovs()};
  selUI();
}
function selUI(){
  const n=SEL.size;$('#selInfo').textContent=n?n+' marcados':'';
  ['#bulkCat','#bulkApply','#bulkDel'].forEach(s=>$(s).classList.toggle('hide',!n));
  if(n&&!$('#bulkCat').options.length)$('#bulkCat').innerHTML=catOptions('',{blankText:'Categoría…'});
}
$('#bulkApply').onclick=()=>{const c=$('#bulkCat').value;for(const x of S.mov)if(SEL.has(x.id)){x.cat=c;if(x.origen!=='excel')marcarNomina(x)}save();toast(SEL.size+' movimientos actualizados');SEL.clear();rMovs()};
$('#bulkDel').onclick=()=>confirmar('Borrar movimientos',`¿Borrar ${SEL.size} movimientos?`,'Borrar',()=>{S.mov=S.mov.filter(x=>!SEL.has(x.id));SEL.clear();save();rMovs();toast('Borrados')});
$('#fBuscar').oninput=e=>{F.q=e.target.value;rMovs();$('#fBuscar').focus()};
$('#fCat').onchange=e=>{F.cat=e.target.value;if(!F.cat)F.todos=false;rMovs()};
$('#fSinCat').onchange=e=>{F.sinCat=e.target.checked;rMovs()};
// Nómina: solo el ingreso de la nómina (no los Bizum ni otros ingresos) puede contar para el mes siguiente.
const finDeMes=fecha=>+fecha.slice(8,10)>=(+S.aj.diaNomina||25);
function esNomina(concepto,importe,fecha){
  if(!(importe>0))return false;
  const n=norm(concepto);if(isBizum(concepto))return false;
  if(/ (NOMI|NOMINA|NOMINAS) /.test(n))return true;
  return importe>=(+S.aj.umbralNomina||1000)&&finDeMes(fecha);
}
function mesPara(x){return x.cat==='INGRESO'&&x.nomina&&finDeMes(x.fecha)&&S.aj.nominaMes!=='mismo'?addMes(mesDe(x.fecha),1):mesDe(x.fecha)}
function marcarNomina(x){x.nomina=x.cat==='INGRESO'&&esNomina(x.concepto,x.importe,x.fecha);x.mes=mesPara(x);return x}
$('#movAdd').onclick=()=>go('efectivo');
function editar(x){
  const meses=[];for(let i=-2;i<=2;i++)meses.push(addMes(mesDe(x.fecha),i));
  if(!meses.includes(x.mes))meses.push(x.mes);
  dialog('Editar movimiento',`<div class="formgrid">
    <label>Fecha</label><input type="date" id="eF" value="${x.fecha}">
    <label>Nómina</label><label class="pill small"><input type="checkbox" id="eNom" ${x.nomina?'checked':''}> Es la nómina</label>
    <label>Cuenta en el mes</label><select id="eM">${meses.map(m=>`<option value="${m}"${m===x.mes?' selected':''}>${nombreMes(m)}</option>`).join('')}</select>
    <label>Concepto</label><input type="text" id="eC" value="${esc(x.concepto)}">
    <label>Importe</label><input type="text" id="eI" value="${fmt(x.importe)}" inputmode="decimal">
    <label>Categoría</label><select id="eK">${catOptions(x.cat)}</select>
    <label>Pagado con</label><select id="eP">${pagoOptions(x.metodo==='efectivo'?'__efectivo':x.cuenta)}</select>
    <label>Nota</label><input type="text" id="eN" value="${esc(x.nota||'')}">
    <label>Persona (préstamos)</label><input type="text" id="ePer" value="${esc(x.persona||'')}" placeholder="${esc(x.cat==='PRESTAMO'?personaDe(x):'')}">
    </div><p class="small mut" style="margin:10px 0 0">Importe en negativo = salida; en positivo = entrada (ingresos, devoluciones, Bizum que te mandan).${x.detalle?'<br>Banco: '+esc(x.detalle):''}</p>`,
   [{t:'Borrar',cls:'dan',fn:()=>{confirmar('Borrar','¿Borrar «'+x.concepto+'»?','Borrar',()=>{S.mov=S.mov.filter(m=>m!==x);save();render()});return false}},
    {t:'Cancelar'},
    {t:'Guardar',cls:'pri',fn:()=>{
      const v=parseNum($('#eI').value);if(!isFinite(v)){toast('Importe no válido',true);return false}
      const nf=$('#eF').value,eraMes=x.mes,nom=$('#eNom').checked&&$('#eK').value==='INGRESO',cambioNom=nom!==!!x.nomina;
      x.nomina=nom;x.cat=$('#eK').value;
      x.mes=((nf!==x.fecha||cambioNom)&&$('#eM').value===eraMes)?mesPara({...x,fecha:nf}):$('#eM').value;x.fecha=nf;
      x.concepto=$('#eC').value.trim();x.importe=r2(v);x.cat=$('#eK').value;
      if($('#ePer').value.trim())x.persona=$('#ePer').value.trim();else delete x.persona;
      const p=$('#eP').value;x.metodo=p==='__efectivo'?'efectivo':'banco';x.cuenta=p==='__efectivo'?'':p;x.nota=$('#eN').value.trim();
      save();render();toast('Guardado')}}]);
}

/* ============ Añadir (gasto o ingreso a mano) ============ */
let aTipo='gasto',cCat='',cCatManual=false,aPago='__efectivo';
const catsGasto=()=>[...CATS.filter(c=>c.g!=='AHORRO').map(c=>c.id),'PRESTAMO',...CATS.filter(c=>c.g==='AHORRO'&&c.id!=='AHORRO').map(c=>c.id),'TRASPASO'];
function rEfectivo(){
  const f=$('#cFecha');if(!f.value||mesDe(f.value)!==MES)f.value=mesDe(hoy())===MES?hoy():MES+'-01';
  const g=aTipo==='gasto';
  $$('#aTipo button').forEach(b=>{b.classList.toggle('on',b.dataset.v===aTipo);b.onclick=()=>{if(aTipo!==b.dataset.v){aTipo=b.dataset.v;cCat='';cCatManual=false;rEfectivo()}}});
  $('#aConL').textContent=g?'¿En qué?':'¿De qué?';
  $('#cCon').placeholder=g?'Ej.: café, mercado, peluquería…':'Ej.: venta en Wallapop, me devuelven la cena…';
  const chip=(id,txt)=>`<button type="button" class="chip${id===cCat?' on':''}" data-c="${id}">${esc(txt||catN(id))}</button>`;
  $('#cChips').innerHTML=g?catsGasto().map(id=>chip(id)).join('')
    :chip('INGRESO','Ingreso (sueldo, venta, regalo…)')+chip('PRESTAMO','Me devuelven un préstamo')+'<div class="chiplbl">o la devolución de algo que pagué en:</div>'+CATS.filter(c=>c.g!=='AHORRO').map(c=>chip(c.id)).join('');
  $$('#cChips .chip').forEach(b=>b.onclick=()=>{cCat=b.dataset.c;cCatManual=true;rEfectivo()});
  $('#aPagoL').textContent=g?'Pagado con':'Cobrado en';
  $('#aPerW').classList.toggle('hide',cCat!=='PRESTAMO');$('#aPerL').textContent=g?'¿A quién se lo prestas?':'¿Quién te lo devuelve?';
  $('#aPerList').innerHTML=prestamosPorPersona().map(p=>`<option value="${esc(p.persona)}">`).join('');
  if(aPago!=='__efectivo'&&!S.cuentas.some(c=>c.n===aPago))aPago='__efectivo';
  $('#aPago').innerHTML=[{v:'__efectivo',n:'Efectivo'},...S.cuentas.map(c=>({v:c.n,n:c.n}))].map(o=>`<button type="button" class="chip${o.v===aPago?' on':''}" data-p="${esc(o.v)}">${esc(o.n)}</button>`).join('')+'<button type="button" class="chip add" id="aOtra">＋ Otra cuenta</button>';
  $$('#aPago .chip[data-p]').forEach(b=>b.onclick=()=>{aPago=b.dataset.p;rEfectivo()});
  $('#aOtra').onclick=()=>dialog('Otra cuenta',`<p class="small mut" style="margin-top:0">Por ejemplo, una cuenta de otro banco de la que no subes extractos. Aparecerá también en Patrimonio.</p><input type="text" id="aOtraN" placeholder="Nombre de la cuenta" style="width:100%">`,
    [{t:'Cancelar'},{t:'Añadir cuenta',cls:'pri',fn:()=>{const n=$('#aOtraN').value.trim();if(!n){toast('Escribe un nombre',true);return false}
      if(!S.cuentas.some(c=>norm(c.n)===norm(n)))S.cuentas.push({n,v:null,f:null});aPago=S.cuentas.find(c=>norm(c.n)===norm(n)).n;save();rEfectivo()}}]);
  $('#aGo').textContent=g?'Añadir gasto':'Añadir ingreso';
  const ms=S.mov.filter(x=>x.mes===MES&&x.origen==='manual').sort((a,b)=>b.fecha.localeCompare(a.fecha));
  const gas=-ms.filter(x=>x.importe<0).reduce((a,x)=>a+x.importe,0),ent=ms.filter(x=>x.importe>0).reduce((a,x)=>a+x.importe,0);
  $('#cashKpis').innerHTML=`<div class="card pad kpi"><div class="l">Gastos apuntados a mano</div><div class="v num">${eur(gas)}</div><div class="s" style="text-transform:capitalize">${nombreMes(MES)}</div></div>
    <div class="card pad kpi"><div class="l">Ingresos apuntados a mano</div><div class="v num pos">${eur(ent)}</div><div class="s" style="text-transform:capitalize">${nombreMes(MES)}</div></div>`;
  $('#cashList').innerHTML=ms.length?ms.map(x=>`<div class="it" data-id="${x.id}"><span class="num small mut">${fFecha(x.fecha)}</span><div class="c"><div>${esc(x.concepto)}</div><div class="det">${catN(x.cat)} · ${x.metodo==='efectivo'?'efectivo':esc(x.cuenta||'')}</div></div><span class="num ${x.importe>0?'pos':''}">${x.importe>0?'+':''}${eur(x.importe)}</span><button class="btn sm icon edit" title="Editar">✎</button></div>`).join('')
    :`<div class="empty">Aún no has apuntado nada a mano en ${nombreMes(MES)}.</div>`;
  $$('#cashList .edit').forEach(b=>b.onclick=()=>editar(S.mov.find(m=>m.id===b.closest('.it').dataset.id)));
}
$('#cCon').addEventListener('input',()=>{if(cCatManual)return;const c=autoCat($('#cCon').value,'',aTipo==='gasto'?-1:1);
  const ok=aTipo==='gasto'?catsGasto().includes(c):(c==='INGRESO'||c==='PRESTAMO'||CONSUMO.includes(c));const nc=ok?c:'';
  if(nc!==cCat){cCat=nc;$$('#cChips .chip').forEach(b=>b.classList.toggle('on',b.dataset.c===cCat))}});
$('#cashForm').onsubmit=e=>{
  e.preventDefault();
  const v=parseNum($('#cImp').value);if(!isFinite(v)||v===0){toast('Escribe el importe',true);$('#cImp').focus();return}
  if(!cCat){toast('Elige una categoría',true);return}
  const fecha=$('#cFecha').value,ef=aPago==='__efectivo',g=aTipo==='gasto';
  const x={id:uid(),fecha,mes:mesDe(fecha),concepto:$('#cCon').value.trim(),importe:r2(Math.abs(v)*(g?-1:1)),cat:cCat,metodo:ef?'efectivo':'banco',cuenta:ef?'':aPago,origen:'manual'};
  if(cCat==='PRESTAMO'&&$('#aPer').value.trim())x.persona=$('#aPer').value.trim();
  marcarNomina(x);S.mov.push(x);save();
  $('#cImp').value='';$('#cCon').value='';$('#aPer').value='';cCat='';cCatManual=false;
  if(x.mes!==MES)MES=x.mes;
  render();$('#cImp').focus();toast('Apuntado: '+x.concepto+' '+(x.importe>0?'+':'')+eur(x.importe)+(ef?' (efectivo)':' ('+x.cuenta+')'));
};
