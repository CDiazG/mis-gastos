// Cuentas Claras · Pestañas Movimientos y Añadir
"use strict";
/* ============ Movimientos ============ */
const F={q:'',cat:'',sinCat:false,todos:false,tag:''};
const SEL=new Set();
function pagoOptions(sel){return S.cuentas.map(c=>`<option${c.n===sel?' selected':''}>${esc(c.n)}</option>`).join('')+`<option value="__efectivo"${sel==='__efectivo'?' selected':''}>Efectivo</option>`}
// Separador por día: «Hoy», «Ayer» o «lunes 14 de noviembre» (con el año si no es este)
function diaTxt(f){const h=hoy(),ay=new Date(h+'T12:00');ay.setDate(ay.getDate()-1);const ayer=ay.toISOString().slice(0,10);
  if(f===h)return 'Hoy';if(f===ayer)return 'Ayer';const d=new Date(f+'T12:00');
  const t=d.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',...(f.slice(0,4)!==h.slice(0,4)?{year:'numeric'}:{})});return t.charAt(0).toUpperCase()+t.slice(1)}
// Panel del móvil al tocar un movimiento: categorías de un toque, editar o etiquetar
function panelMov(x){
  cerrarPanelMov();
  let cats=[...CATS.map(c=>({id:c.id,n:c.n})),...SPECIAL.filter(s=>s.id!=='AJUSTE').map(s=>({id:s.id,n:s.n}))];
  const sug=sugerirBizum(x);if(sug)cats=[...cats.filter(c=>c.id===sug.c),...cats.filter(c=>c.id!==sug.c)];
  const d=document.createElement('div');d.id='movPanel';
  d.innerHTML=`<div class="msfondo"></div><div class="mscaja mpanel" role="dialog" aria-label="Movimiento"><div class="mph"><div><b>${esc(verConcepto(x))}</b><div class="small mut">${diaTxt(x.fecha)} · ${x.metodo==='efectivo'?'efectivo':esc(x.cuenta||'')}</div></div><b class="num ${x.importe>0?'pos':''}">${x.importe>0?'+':''}${eur(x.importe)}</b></div>
    ${x.cat==='TRASPASO'?`<div class="small" style="margin-top:8px">Traspaso: <b>${esc(trasDesde(x)||'sin especificar')} → ${esc(trasHacia(x)||'sin especificar')}</b> <button type="button" class="link" data-pm="otra">${x.par?'ver el otro lado':'cambiar'}</button></div>`:''}
    <div class="small mut" style="margin:10px 0 6px">Categoría</div>${sug?`<div class="small mut" style="margin:-2px 0 6px">Sugerida: ${esc(sug.por)}.</div>`:''}<div class="chips">${cats.map(c=>`<button type="button" class="chip${c.id===x.cat?' on':''}${sug&&c.id===sug.c?' sug':''}" data-c="${c.id}">${sug&&c.id===sug.c?'✓ ':''}${esc(c.n)}</button>`).join('')}</div>
    <div class="toolbar" style="margin:12px 0 0"><button type="button" class="btn" data-pm="editar">✎ Editar</button><span class="sp"></span><button type="button" class="btn" data-pm="cerrar">Cerrar</button></div></div>`;
  document.body.appendChild(d);requestAnimationFrame(()=>d.classList.add('on'));
  $$('.msfondo,[data-pm=cerrar]',d).forEach(b=>b.onclick=cerrarPanelMov);
  $$('[data-pm=editar]',d).forEach(b=>b.onclick=()=>{cerrarPanelMov();editar(x)});
  $$('[data-pm=otra]',d).forEach(b=>b.onclick=()=>{cerrarPanelMov();x.par?irAlPar(x):preguntarOtra(x)});
  $$('[data-c]',d).forEach(b=>b.onclick=()=>{const c=b.dataset.c;cerrarPanelMov();if(c===x.cat)return;
    ponerCategoria(x,c)});
}
// Cambiar la categoría de un movimiento (desde la lista o el panel). Si pasa a ser un traspaso, se busca el otro lado
// y, si no está, se pregunta a qué cuenta va o de cuál viene.
function ponerCategoria(x,c){
  conDeshacer('Categoría cambiada: '+(c?catN(c):'sin categoría'),()=>{if(x.cat==='TRASPASO'&&c!=='TRASPASO')desemparejar(x);x.cat=c;if(x.origen==='extracto'&&x.cat)learn(x.concepto,x.cat);if(x.origen!=='excel')marcarNomina(x);if(c==='TRASPASO')emparejarTraspasos()});
  if(c==='TRASPASO'&&!x.par&&x.otra===undefined)setTimeout(()=>preguntarOtra(x),60);
}
function preguntarOtra(x){
  const sale=x.importe<0,propia=norm(cuentaDe(x));
  const ops=[...S.cuentas.map(c=>c.n),'Efectivo'].filter(n=>norm(n)!==propia);
  dialog(sale?'¿A qué cuenta va?':'¿De qué cuenta viene?',`<p class="small mut" style="margin-top:0">${esc(verConcepto(x))} · <b>${eur(Math.abs(x.importe))}</b> ${sale?'sale de':'entra en'} ${esc(cuentaDe(x)||'—')}. Un traspaso no es un gasto: el dinero sigue siendo tuyo. Si la cuenta no tiene extracto (una hucha, el broker…), su saldo en Patrimonio se actualiza solo.</p>
    <div class="chips">${ops.map(n=>`<button type="button" class="chip${norm(n)===norm(x.otra||'')?' on':''}" data-otra="${esc(n)}">${esc(n)}</button>`).join('')}<button type="button" class="chip" data-otra="">Sin especificar</button><button type="button" class="chip add" data-nueva="1">＋ Otra cuenta</button></div>`,[{t:'Cerrar'}]);
  $$('#dlgB [data-otra]').forEach(b=>b.onclick=()=>{x.otra=b.dataset.otra;save();$('#dlg').close();render();toast(x.otra?(sale?'Traspaso a ':'Traspaso desde ')+x.otra:'Traspaso sin especificar')});
  const nv=$('#dlgB [data-nueva]');if(nv)nv.onclick=()=>{nv.outerHTML=`<span class="nuevacta"><input type="text" id="otraN" placeholder="Nombre (p. ej. Hucha, Broker, Oro)" maxlength="40"><button type="button" class="btn sm pri" id="otraOk">Añadir</button></span>`;
    const ok=()=>{const nn=$('#otraN').value.trim();if(!nn){toast('Escribe un nombre',true);return}
      if(!S.cuentas.some(c=>norm(c.n)===norm(nn)))S.cuentas.push({n:nn,v:null,f:null});x.otra=S.cuentas.find(c=>norm(c.n)===norm(nn)).n;save();$('#dlg').close();render();toast((sale?'Traspaso a ':'Traspaso desde ')+x.otra+'. Su saldo está en Patrimonio')};
    $('#otraOk').onclick=ok;$('#otraN').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();ok()}};$('#otraN').focus()};
}
function irAlPar(x){const b=S.mov.find(y=>y.id===x.par);if(!b)return;MES=b.mes;F.q='';F.cat='';F.sinCat=false;F.tag='';F.todos=false;go('movs');
  setTimeout(()=>{const r=$(`#movTable tr[data-id="${b.id}"]`);if(r){r.scrollIntoView({block:'center',behavior:'smooth'});r.classList.add('resalta');setTimeout(()=>r.classList.remove('resalta'),1600)}},80)}
function cerrarPanelMov(){const d=$('#movPanel');if(d)d.remove()}
function rMovs(){
  $('#fCat').innerHTML=catOptions(F.cat,{blankText:'Todas las categorías'});
  $('#fSinCat').checked=F.sinCat;$('#fBuscar').value=F.q;
  pintarTagList();
  // al buscar se busca en todos los meses
  const qn=norm(F.q).trim(),buscaTodo=qn.length>=2&&!F.tag;
  let list=F.tag?S.mov.filter(x=>tagsDe(x).some(t=>norm(t)===norm(F.tag))):buscaTodo||F.todos&&F.cat?S.mov.slice():S.mov.filter(x=>x.mes===MES);
  if(F.cat)list=list.filter(x=>x.cat===F.cat);
  if(F.sinCat)list=list.filter(x=>!x.cat);
  if(qn){list=list.filter(x=>norm(x.concepto+' '+(x.detalle||'')+' '+(x.nota||'')+' '+verConcepto(x)+' '+tagsDe(x).join(' ')).includes(qn))}
  list.sort((a,b)=>b.fecha.localeCompare(a.fecha)||(a.orden??0)-(b.orden??0));
  for(const id of [...SEL])if(!list.some(x=>x.id===id))SEL.delete(id);
  const tb=$('#movTable tbody');
  let diaAnt='';
  tb.innerHTML=list.length?list.map(x=>{
    const sep=x.fecha!==diaAnt?`<tr class="sepdia"><td colspan="6">${diaTxt(x.fecha)}</td></tr>`:'';diaAnt=x.fecha;
    const tags=[];
    if(x.metodo==='efectivo')tags.push('<span class="tag cash">efectivo</span>');else if(x.cuenta)tags.push(`<span class="tag">${esc(x.cuenta)}</span>`);
    if(x.mes!==mesDe(x.fecha))tags.push(`<span class="tag acc">cuenta en ${nombreMesC(x.mes)}</span>`);
    if(x.origen==='excel')tags.push('<span class="tag">Excel</span>');
    if(x.origen==='manual')tags.push('<span class="tag">a mano</span>');
    if(x.nomina&&x.cat==='INGRESO')tags.push('<span class="tag good">nómina</span>');
    if(x.divDe||x.dividido)tags.push('<span class="tag" title="Parte de un gasto dividido">dividido</span>');
    if(x.cat==='TRASPASO'){const de=trasDesde(x),a=trasHacia(x);
      tags.push(x.otra===undefined&&!x.par?'<span class="tag warn tras" data-tras="1" title="Indica a qué cuenta va o de cuál viene">¿qué cuenta?</span>'
        :`<span class="tag acc tras" data-tras="1" title="${x.par?'Toca para ver el otro lado del traspaso':'Toca para cambiar la cuenta'}">${esc(de||'sin especificar')} → ${esc(a||'sin especificar')}${x.par?' ↔':''}</span>`)}
    for(const t of tagsDe(x))tags.push(`<span class="tag tg" data-tag="${esc(t)}" title="Ver todo lo de «${esc(t)}»">#${esc(t)}</span>`);
    const sug=sugerirBizum(x),bs=botonSug(sug);
    return sep+`<tr data-id="${x.id}" class="${x.cat?'':'nocat'}"><td><input type="checkbox" class="sel" ${SEL.has(x.id)?'checked':''} aria-label="Marcar"></td>
      <td class="num">${fFecha(x.fecha)}</td>
      <td><div><span title="${esc(ocultarNumeros(x.concepto))}">${esc(verConcepto(x))}</span>${tags.join('')}</div><span class="catchip${x.cat?'':' sin'}">${x.cat?esc(catN(x.cat)):'Sin categoría · toca para ponerla'}</span>${bs.replace('sugbiz','sugbiz movil')}${x.detalle||x.nota?`<div class="det">${esc([x.detalle,x.nota].filter(Boolean).join(' · '))}</div>`:''}</td>
      <td><select class="cat">${catOptions(x.cat)}</select>${bs}</td>
      <td class="r num ${x.importe>0?'pos':''}">${x.importe>0?'+':''}${eur(x.importe)}</td>
      <td><button class="btn sm icon edit" title="Editar">✎</button></td></tr>`}).join('')
    :`<tr><td colspan="6" class="empty">${buscaTodo?`No encuentro «${esc(F.q)}» en ningún mes.`:`No hay movimientos${F.cat||F.sinCat||F.q?' con este filtro':' en '+nombreMes(MES)}.`}</td></tr>`;
  const tot=list.reduce((a,x)=>a+x.importe,0);
  const tb2=$('#tagBar');if(F.tag){const g=-list.reduce((a,x)=>a+(x.cat==='INGRESO'?0:x.importe),0);const fs=list.map(x=>x.fecha).sort();
    tb2.innerHTML=`<span class="tag tg">#${esc(F.tag)}</span><span class="small">${list.length} movimientos${fs.length?` · ${fFecha(fs[0])} – ${fFecha(fs[fs.length-1])}`:''} · <b>${eur(g)}</b> en total</span><span class="sp" style="flex:1"></span><button class="btn sm" type="button" id="tagQuitar">Quitar filtro</button>`;
    tb2.classList.remove('hide');$('#tagQuitar').onclick=()=>{F.tag='';rMovs()}}else tb2.classList.add('hide');
  $('#movFoot').textContent=`${list.length} movimientos · salidas ${eur(-list.filter(x=>x.importe<0).reduce((a,x)=>a+x.importe,0))} · entradas ${eur(list.filter(x=>x.importe>0).reduce((a,x)=>a+x.importe,0))}`+(buscaTodo?` · buscando «${F.q}» en todos los meses`:F.todos&&F.cat?' · todos los meses':'');
  $('#s-movs').classList.toggle('buscando',buscaTodo);
  $$('#movTable tbody tr[data-id]').forEach(tr=>{
    const id=tr.dataset.id,x=S.mov.find(m=>m.id===id);
    $('.cat',tr).onchange=e=>ponerCategoria(x,e.target.value);
    $$('.sugbiz',tr).forEach(b=>b.onclick=e=>{e.stopPropagation();ponerCategoria(x,b.dataset.sug)});
    const tt=$('.tag.tras',tr);if(tt)tt.onclick=e=>{e.stopPropagation();if(x.par){irAlPar(x)}else preguntarOtra(x)};
    $$('.tag.tg',tr).forEach(t=>t.onclick=()=>{F.tag=t.dataset.tag;F.q='';F.cat='';F.sinCat=false;rMovs()});
    $('.edit',tr).onclick=()=>editar(x);
    // en el móvil, tocar la fila abre un panel para cambiar la categoría o editar
    tr.onclick=e=>{if(!esMovil()||e.target.closest('input,select,button,.tag.tg,a'))return;panelMov(x)};
    $('.sel',tr).onchange=e=>{e.target.checked?SEL.add(id):SEL.delete(id);selUI()};
  });
  $('#movAll').checked=list.length&&list.every(x=>SEL.has(x.id));
  $('#movAll').onchange=e=>{list.forEach(x=>e.target.checked?SEL.add(x.id):SEL.delete(x.id));rMovs()};
  selUI();
}
function selUI(){
  const n=SEL.size;$('#selInfo').textContent=n?n+' marcados':'';
  ['#bulkCat','#bulkApply','#bulkTag','#bulkDel'].forEach(s=>$(s).classList.toggle('hide',!n));
  if(n&&!$('#bulkCat').options.length)$('#bulkCat').innerHTML=catOptions('',{blankText:'Categoría…'});
}
$('#bulkApply').onclick=()=>{const c=$('#bulkCat').value,n=SEL.size;conDeshacer(n+' movimientos cambiados a '+(c?catN(c):'sin categoría'),()=>{for(const x of S.mov)if(SEL.has(x.id)){if(x.cat==='TRASPASO'&&c!=='TRASPASO')desemparejar(x);x.cat=c;if(x.origen!=='excel')marcarNomina(x)}SEL.clear();if(c==='TRASPASO')emparejarTraspasos()})};
$('#bulkDel').onclick=()=>{const n=SEL.size;conDeshacer(n+' movimiento'+(n>1?'s':'')+' borrado'+(n>1?'s':''),()=>{S.mov=S.mov.filter(x=>!SEL.has(x.id));SEL.clear()})};
$('#bulkTag').onclick=()=>{pintarTagList();dialog('Etiquetar '+SEL.size+' movimientos',`<p class="small mut" style="margin-top:0">Por ejemplo «Boda Ana» o «Viaje a Roma». Luego verás cuánto ha costado en total en Histórico → Etiquetas.</p><input type="text" id="btT" list="tagList" maxlength="40" style="width:100%" placeholder="Nombre de la etiqueta">${todasEtiquetas().length?'<div class="chips" style="margin-top:8px">'+todasEtiquetas().slice(0,12).map(t=>`<button type="button" class="chip" data-t="${esc(t)}">#${esc(t)}</button>`).join('')+'</div>':''}`,
  [{t:'Cancelar'},{t:'Etiquetar',cls:'pri',fn:()=>{const t=parseTags($('#btT').value)[0];if(!t){toast('Escribe una etiqueta',true);return false}const n=SEL.size;
    conDeshacer(n+' movimientos con #'+t,()=>{for(const x of S.mov)if(SEL.has(x.id)&&!tagsDe(x).some(y=>norm(y)===norm(t)))x.tags=[...tagsDe(x),t];SEL.clear()})}}]);
  $$('#dlgB .chip[data-t]').forEach(b=>b.onclick=()=>{$('#btT').value=b.dataset.t})};
$('#fBuscar').oninput=e=>{F.q=e.target.value;rMovs();$('#fBuscar').focus()};
$('#fCat').onchange=e=>{F.cat=e.target.value;if(!F.cat)F.todos=false;rMovs()};
$('#fSinCat').onchange=e=>{F.sinCat=e.target.checked;rMovs()};
// Nómina: solo el ingreso de la nómina (no los Bizum ni otros ingresos) puede contar para el mes siguiente.
const finDeMes=fecha=>+fecha.slice(8,10)>=(+S.aj.diaNomina||25);
// Pagadores de nómina aprendidos: el concepto del banco sin números ni fechas (p. ej. «TRANSFERENCIA DE EMPRESA X»)
function clavePagador(c){return norm(conceptoCorto(c)).replace(/[0-9]+([.,/-][0-9]+)*/g,' ').replace(/\b(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|SEPT|OCT|NOV|DIC|ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE)\b/g,' ').replace(/[^A-Z ]/g,' ').replace(/\s+/g,' ').trim().slice(0,48)}
const esPagador=c=>{const k=clavePagador(c);return !!k&&k.length>=4&&(S.aj.pagadores||[]).some(p=>p.k===k)};
function aprenderPagador(x,si){const k=clavePagador(x.concepto);if(!k||k.length<4)return;const ps=S.aj.pagadores||(S.aj.pagadores=[]);const i=ps.findIndex(p=>p.k===k);
  if(si&&i<0){ps.push({k,n:conceptoCorto(x.concepto).slice(0,60)});toast('Recordaré «'+conceptoCorto(x.concepto).slice(0,40)+'» como nómina');}
  else if(!si&&i>=0){ps.splice(i,1)}}
function esNomina(concepto,importe,fecha){
  if(!(importe>0))return false;
  const n=norm(concepto);if(isBizum(concepto))return false;
  if(esPagador(concepto))return true;
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
    <label class="eOtraL">Traspaso: la otra cuenta</label><select id="eOtra" class="eOtraL" ${x.par?'disabled title="Unido con el movimiento de la otra cuenta"':''}><option value="">Sin especificar</option>${[...S.cuentas.map(c=>c.n),'Efectivo'].map(n=>`<option${norm(n)===norm(x.otra||'')?' selected':''}>${esc(n)}</option>`).join('')}</select>
    <label>Nota</label><input type="text" id="eN" value="${esc(x.nota||'')}">
    <label>Persona (préstamos)</label><input type="text" id="ePer" value="${esc(x.persona||'')}" placeholder="${esc(x.cat==='PRESTAMO'?personaDe(x):'')}">
    <label>Etiquetas</label><input type="text" id="eT" list="tagList" value="${esc(tagsDe(x).join(', '))}" placeholder="p. ej. Viaje a Roma (separa varias con comas)">
    </div><p class="small mut" style="margin:10px 0 0">Importe en negativo = salida; en positivo = entrada (ingresos, devoluciones, Bizum que te mandan).${x.detalle?'<br>Banco: '+esc(x.detalle):''}</p>`,
   [{t:'Borrar',cls:'dan',fn:()=>{conDeshacer('Borrado «'+x.concepto+'»',()=>{S.mov=S.mov.filter(m=>m!==x)})}},
    {t:'Dividir',fn:()=>{dividir(x);return false}},
    {t:'Cancelar'},
    {t:'Guardar',cls:'pri',fn:()=>{
      const v=parseNum($('#eI').value);if(!isFinite(v)){toast('Importe no válido',true);return false}
      const vals={otra:$('#eOtra').value,nf:$('#eF').value,nom:$('#eNom').checked,m:$('#eM').value,c:$('#eC').value.trim(),k:$('#eK').value,per:$('#ePer').value.trim(),p:$('#eP').value,n:$('#eN').value.trim(),t:parseTags($('#eT').value)};
      conDeshacer('Guardado «'+vals.c+'»',()=>{
      const nf=vals.nf,eraMes=x.mes,nom=vals.nom&&vals.k==='INGRESO',cambioNom=nom!==!!x.nomina;
      if(cambioNom&&pref('aprender'))aprenderPagador({concepto:vals.c},nom);
      if(x.cat==='TRASPASO'&&vals.k!=='TRASPASO'){desemparejar(x);delete x.otra}
      if(vals.k==='TRASPASO'&&!x.par)x.otra=vals.otra;
      x.nomina=nom;x.cat=vals.k;
      x.mes=((nf!==x.fecha||cambioNom)&&vals.m===eraMes)?mesPara({...x,fecha:nf}):vals.m;x.fecha=nf;
      x.concepto=vals.c;x.importe=r2(v);
      if(vals.per)x.persona=vals.per;else delete x.persona;
      if(vals.t.length)x.tags=vals.t;else delete x.tags;
      const p=vals.p;x.metodo=p==='__efectivo'?'efectivo':'banco';x.cuenta=p==='__efectivo'?'':p;x.nota=vals.n;if(x.cat==='TRASPASO')emparejarTraspasos()})}}]);
  const vOtra=()=>$$('.eOtraL').forEach(e=>e.classList.toggle('hide',$('#eK').value!=='TRASPASO'));$('#eK').addEventListener('change',vOtra);vOtra();
  pintarTagList();
}

/* ============ Añadir (gasto o ingreso a mano) ============ */
let aTipo='gasto',cCat='',cCatManual=false,aPago='__efectivo',aHacia='';
const catsGasto=()=>[...CATS.filter(c=>c.g!=='AHORRO').map(c=>c.id),'PRESTAMO',...CATS.filter(c=>c.g==='AHORRO'&&c.id!=='AHORRO').map(c=>c.id),'TRASPASO'];
function rapidos(gasto){
  const g={};
  for(const x of S.mov){if(x.origen!=='manual'||!x.cat||(x.importe<0)!==gasto)continue;const c=String(x.concepto||'').trim();if(!c)continue;
    const k=norm(c).trim()+'|'+x.cat,o=g[k]||(g[k]={c:c.charAt(0).toUpperCase()+c.slice(1),cat:x.cat,n:0,ult:'',imps:new Set(),pago:''});
    o.n++;o.imps.add(Math.abs(x.importe));if(x.fecha>o.ult){o.ult=x.fecha;o.pago=x.metodo==='efectivo'?'__efectivo':(x.cuenta||'__efectivo')}}
  return Object.values(g).filter(o=>o.n>=2).sort((a,b)=>b.n-a.n||b.ult.localeCompare(a.ult)).slice(0,6)
    .map(o=>({c:o.c,cat:o.cat,pago:o.pago,imp:o.imps.size===1?[...o.imps][0]:0}));
}
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
  // traspaso: de qué cuenta sale («Pagado con» pasa a «Desde») y a cuál va
  const tras=cCat==='TRASPASO';$('#aHaciaW').classList.toggle('hide',!tras);if(tras&&g)$('#aPagoL').textContent='Desde';
  if(tras){const desde=aPago==='__efectivo'?'Efectivo':aPago;
    $('#aHacia').innerHTML=[...S.cuentas.map(c=>c.n),'Efectivo'].filter(n=>norm(n)!==norm(desde)).map(n=>`<button type="button" class="chip${norm(n)===norm(aHacia)?' on':''}" data-h="${esc(n)}">${esc(n)}</button>`).join('')+`<button type="button" class="chip${aHacia?'':' on'}" data-h="">Sin especificar</button>`;
    $$('#aHacia [data-h]').forEach(b=>b.onclick=()=>{aHacia=b.dataset.h;rEfectivo()})}
  $('#aGo').textContent=g?'Añadir gasto':'Añadir ingreso';
  // Atajos: lo que más apuntas a mano (concepto y categoría; el importe si siempre es el mismo)
  const rs=rapidos(g);$('#aRapidos').classList.toggle('hide',!rs.length);
  $('#aRapidos').innerHTML=rs.length?`<span class="l">Lo de siempre</span><div class="chips">${rs.map((r,i)=>`<button type="button" class="chip rap" data-r="${i}" title="${esc(catN(r.cat))}${r.imp?' · '+eur(r.imp):''}">${esc(r.c)}${r.imp?` <span class="mut">${eur(r.imp,r.imp%1?2:0)}</span>`:''}</button>`).join('')}</div>`:'';
  $$('#aRapidos [data-r]').forEach(b=>b.onclick=()=>{const r=rs[+b.dataset.r];$('#cCon').value=r.c;cCat=r.cat;cCatManual=true;if(r.pago)aPago=r.pago;if(r.imp)$('#cImp').value=fmt(r.imp,r.imp%1?2:0);rEfectivo();
    const i=$('#cImp');if(!r.imp){i.focus()}else{$('#aGo').focus()}});
  const ms=S.mov.filter(x=>x.mes===MES&&x.origen==='manual').sort((a,b)=>b.fecha.localeCompare(a.fecha));
  const gas=-ms.filter(x=>x.importe<0).reduce((a,x)=>a+x.importe,0),ent=ms.filter(x=>x.importe>0).reduce((a,x)=>a+x.importe,0);
  $('#cashKpis').innerHTML=`<div class="card pad kpi"><div class="l">Gastos apuntados a mano</div><div class="v num">${eur(gas)}</div><div class="s" style="text-transform:capitalize">${nombreMes(MES)}</div></div>
    <div class="card pad kpi"><div class="l">Ingresos apuntados a mano</div><div class="v num pos">${eur(ent)}</div><div class="s" style="text-transform:capitalize">${nombreMes(MES)}</div></div>`;
  $('#cashList').innerHTML=ms.length?ms.map(x=>`<div class="it" data-id="${x.id}"><span class="num small mut">${fFecha(x.fecha)}</span><div class="c"><div>${esc(verConcepto(x))}</div><div class="det">${catN(x.cat)} · ${x.metodo==='efectivo'?'efectivo':esc(x.cuenta||'')}</div></div><span class="num ${x.importe>0?'pos':''}">${x.importe>0?'+':''}${eur(x.importe)}</span><button class="btn sm icon edit" title="Editar">✎</button></div>`).join('')
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
  if(cCat==='TRASPASO'){x.otra=aHacia;aHacia=''}
  const tg=parseTags($('#aTag').value);if(tg.length)x.tags=tg;
  if(cCat==='PRESTAMO'&&$('#aPer').value.trim())x.persona=$('#aPer').value.trim();
  marcarNomina(x);S.mov.push(x);save();
  $('#cImp').value='';$('#cCon').value='';$('#aPer').value='';cCat='';cCatManual=false;pintarTagList();
  if(x.mes!==MES)MES=x.mes;
  render();$('#cImp').focus();toast('Apuntado: '+x.concepto+' '+(x.importe>0?'+':'')+eur(x.importe)+(ef?' (efectivo)':' ('+x.cuenta+')'));
};

/* ---- Dividir un movimiento en varias categorías ---- */
function dividir(x){
  const signo=x.importe<0?-1:1,total=Math.abs(x.importe);
  const fila=(imp,cat,con)=>`<div class="dvrow"><input type="text" class="dvi right" inputmode="decimal" value="${imp?fmt(imp):''}" placeholder="€"><select class="dvk">${catOptions(cat)}</select><input type="text" class="dvc" value="${esc(con)}" placeholder="Concepto"><button type="button" class="btn sm icon dvx" title="Quitar">✕</button></div>`;
  dialog('Dividir «'+x.concepto+'»',`<p class="small mut" style="margin-top:0">Reparte los ${eur(total)} en varias categorías (por ejemplo, una compra que es parte supermercado y parte casa). Las partes tienen que sumar el total.</p>
    <div id="dvRows">${fila(total,x.cat,x.concepto)}${fila(0,'',x.concepto)}</div>
    <div class="toolbar" style="margin:4px 0 0"><button type="button" class="btn sm" id="dvMas">＋ Otra parte</button><span class="sp"></span><span class="small" id="dvFalta"></span></div>`,
   [{t:'Cancelar'},{t:'Dividir',cls:'pri',fn:()=>{
     const ps=$$('#dvRows .dvrow').map(r=>({v:parseNum($('.dvi',r).value),k:$('.dvk',r).value,c:$('.dvc',r).value.trim()||x.concepto})).filter(p=>isFinite(p.v)&&p.v!==0);
     if(ps.length<2){toast('Pon al menos dos partes',true);return false}
     if(ps.some(p=>p.v<0)){toast('Escribe las partes sin signo',true);return false}
     if(Math.abs(ps.reduce((a,p)=>a+p.v,0)-total)>0.005){toast('Las partes no suman '+eur(total),true);return false}
     conDeshacer('Dividido en '+ps.length+' partes',()=>{
       const [p0,...resto]=ps;x.importe=r2(signo*p0.v);x.cat=p0.k;x.concepto=p0.c;x.dividido=true;
       resto.forEach((p,i)=>S.mov.push({...JSON.parse(JSON.stringify(x)),id:uid(),importe:r2(signo*p.v),cat:p.k,concepto:p.c,dividido:undefined,divDe:x.id,key:x.key?x.key+'#'+(i+2):undefined}));
     })}}]);
  const falta=()=>{const s=$$('#dvRows .dvi').reduce((a,i)=>a+(isFinite(parseNum(i.value))?parseNum(i.value):0),0),d=r2(total-s);
    $('#dvFalta').innerHTML=Math.abs(d)<0.005?'<span class="pos">✓ Cuadra</span>':d>0?`Falta por repartir: <b>${eur(d)}</b>`:`<span class="neg">Te pasas en ${eur(-d)}</span>`};
  const enlazar=()=>{$$('#dvRows .dvi').forEach(i=>i.oninput=falta);$$('#dvRows .dvx').forEach(b=>b.onclick=()=>{if($$('#dvRows .dvrow').length>2){b.closest('.dvrow').remove();falta()}});falta()};
  // al escribir la segunda parte, la primera se ajusta sola
  const auto=()=>{const is=$$('#dvRows .dvi');if(is.length<2)return;const otros=is.slice(1).reduce((a,i)=>a+(isFinite(parseNum(i.value))?parseNum(i.value):0),0);if(otros<total)is[0].value=fmt(r2(total-otros));falta()};
  $('#dvMas').onclick=()=>{$('#dvRows').insertAdjacentHTML('beforeend',fila(0,'',x.concepto));enlazar();$$('#dvRows .dvi').slice(1).forEach(i=>i.addEventListener('change',auto))};
  enlazar();$$('#dvRows .dvi').slice(1).forEach(i=>i.addEventListener('change',auto));
}
