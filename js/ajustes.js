// Cuentas Claras · Pestaña Ajustes: presupuesto, categorías, reglas, copias
"use strict";
/* ============ Ajustes ============ */
function rAjustes(){
  $$('#baseSeg button').forEach(b=>{b.classList.toggle('on',b.dataset.b===S.aj.base);b.onclick=()=>{S.aj.base=b.dataset.b;save();rAjustes()}});
  $('#baseFija').classList.toggle('hide',S.aj.base!=='fija');$('#baseFija').value=S.aj.baseFija?fmt(S.aj.baseFija):'';
  $('#baseFija').onchange=e=>{const v=parseNum(e.target.value);S.aj.baseFija=isFinite(v)?v:0;save()};
  refreshCats();rPrefs();rCatSug();$('#dzAutoW').classList.toggle('hide',!diezmoOn());
  const gOpts=sel=>GROUPS.map(g=>`<option value="${g.id}"${g.id===sel?' selected':''}>${g.n}</option>`).join('');
  $('#caGrupo').innerHTML=gOpts('VARIABLES');
  $('#pctTable').innerHTML='<tbody>'+GROUPS.map(g=>{const cs=S.cats.filter(c=>c.g===g.id&&(c.id!=='DIEZMO'||diezmoOn()));
    return `<tr><td colspan="4" class="small mut" style="padding-top:12px"><b>${g.n}</b></td></tr>`+cs.map((c,k)=>`<tr data-cid="${c.id}">
      <td><div class="cnw"><button type="button" class="asa" title="Arrastra para cambiar el orden (o usa las flechas del teclado)" aria-label="Mover ${esc(c.n)}">⠿</button><input type="text" class="cn" value="${esc(c.n)}" style="width:100%;min-width:150px"></div>${c.id==='AHORRO'?'<div class="small mut" style="margin-top:2px">Automático: lo que queda sin repartir</div>':''}</td>
      <td><select class="cg" style="max-width:118px;font-size:13px" ${FIJAS.has(c.id)?'disabled title="Esta categoría no se puede mover de grupo"':''}>${gOpts(c.g)}</select></td>
      <td class="r" style="white-space:nowrap">${valorCelda(c)}</td>
      <td style="white-space:nowrap">${c.g==='AHORRO'?'':`<button type="button" class="btn sm icon ac${S.aj.acumula&&S.aj.acumula[c.id]?' on':''}" title="${S.aj.acumula&&S.aj.acumula[c.id]?'Acumula: lo que sobra pasa al mes siguiente (pulsa para quitarlo)':'Pulsa para que lo que sobre pase al mes siguiente'}">↻</button>`}${FIJAS.has(c.id)?'':'<button type="button" class="btn sm icon dan cx" title="Borrar categoría">✕</button>'}</td></tr>`).join('')}).join('')+'</tbody>';
  $$('#pctTable tr[data-cid]').forEach(tr=>{const id=tr.dataset.cid;const c=S.cats.find(x=>x.id===id);
    $('.cn',tr).onchange=e=>{const n=e.target.value.trim();if(!n){e.target.value=c.n;return}
      if(S.cats.some(x=>x!==c&&norm(x.n)===norm(n))){toast('Ya hay una categoría con ese nombre',true);e.target.value=c.n;return}
      c.n=n;save();refreshCats();toast('Nombre cambiado')};
    $('.cg',tr).onchange=e=>{c.g=e.target.value;save();rAjustes();toast('Movida a '+GROUPS.find(g=>g.id===c.g).n)};
    const mover=d=>{const cs=S.cats.filter(x=>x.g===c.g);const k=cs.indexOf(c),o=cs[k+d];if(!o)return;const i=S.cats.indexOf(c),j=S.cats.indexOf(o);[S.cats[i],S.cats[j]]=[S.cats[j],S.cats[i]];save();rAjustes()};
    const asa=$('.asa',tr);asa.onkeydown=e=>{if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();mover(e.key==='ArrowUp'?-1:1);const b=$(`#pctTable tr[data-cid="${id}"] .asa`);if(b)b.focus()}};
    asa.onpointerdown=e=>arrastrarCat(e,tr,c);
    const cx=$('.cx',tr);if(cx)cx.onclick=()=>borrarCat(c);
    const ac=$('.ac',tr);if(ac)ac.onclick=()=>{const a=S.aj.acumula||(S.aj.acumula={});if(a[id]){delete a[id];toast(c.n+': ya no acumula')}else{a[id]=mesDe(hoy());toast(c.n+': lo que sobre de '+nombreMes(a[id])+' pasará al mes siguiente')}save();rAjustes()};
  });
  $('#catAdd').onsubmit=e=>{e.preventDefault();const n=$('#caNombre').value.trim();if(!n)return;
    if(S.cats.some(x=>norm(x.n)===norm(n))){toast('Ya hay una categoría con ese nombre',true);return}
    const id='C'+Date.now().toString(36).toUpperCase();
    const g=$('#caGrupo').value;const ult=S.cats.map((x,i)=>x.g===g?i:-1).filter(i=>i>=0).pop();
    S.cats.splice(ult==null?S.cats.length:ult+1,0,{id,n,g});S.aj.pct[id]=0;save();$('#caNombre').value='';rAjustes();
    toast('Categoría «'+n+'» añadida con 0%. Dale un porcentaje si quieres presupuesto.')};
  $$('#pctTable .un').forEach(b=>b.onclick=()=>{cambiarUnidad(b.dataset.u,!enEur(b.dataset.u));save();rAjustes()});
  const sumUI=()=>{const b=baseRef(),rep=b>0?repartido(b)/b*100:sumaOtrosPct(),ah=pctAhorro(b),pasa=b>0?repartido(b)>b+0.5:sumaOtrosPct()>100.01;
    const pg=g=>CATS.filter(c=>c.g===g.id).reduce((a,c)=>a+pctCat(c.id,b),0);
    $('#pctSum').innerHTML=GROUPS.map(g=>`${g.n}: <b>${fmt(pg(g),1)}%</b>`).join(' · ')+`<br>Repartido: <b class="${pasa?'ko':''}">${fmt(rep,1)}%</b> · Ahorro (lo que sobra): <b class="ok" style="font-size:16px">${fmt(ah,1)}%</b>${hayEur()&&b>0?` <span class="mut">· con ${eur(b,0)} de base este mes</span>`:''}
      <div class="unTodo"><span class="mut">Poner todas en</span><button type="button" class="btn sm" data-todo="eur">€</button><button type="button" class="btn sm" data-todo="pct">%</button></div>`;
    $$('#pctSum [data-todo]').forEach(x=>x.onclick=()=>{const aEur=x.dataset.todo==='eur';catsReparto().filter(c=>c.id!=='DIEZMO').forEach(c=>cambiarUnidad(c.id,aEur));save();rAjustes();toast(aEur?'Presupuesto en euros: cada categoría con su cantidad fija':'Presupuesto en porcentajes')});
    const ahc=$('#pctTable [data-ah]');if(ahc)ahc.innerHTML=ahorroCelda(b);
    $('#pctAlert').innerHTML=!pasa?'':`<div class="alert bad" style="margin-bottom:14px"><span class="grow"><b>Te pasas del 100 %.</b> Lo repartido suma ${fmt(rep,1)}%${hayEur()&&b>0?` de los ${eur(b,0)} de este mes`:''}, así que no queda nada para el ahorro. Baja alguna categoría.</span></div>`;
    $$('[data-p],[data-e]').forEach(i=>i.style.borderColor=pasa?'var(--bad)':'');};
  $$('[data-e]').forEach(i=>i.oninput=()=>{(S.aj.eur||(S.aj.eur={}))[i.dataset.e]=Math.max(0,parseFloat(String(i.value).replace(',','.'))||0);syncAhorro();save();sumUI()});
  $$('[data-p]').forEach(i=>i.oninput=()=>{S.aj.pct[i.dataset.p]=parseFloat(String(i.value).replace(',','.'))||0;syncAhorro();save();sumUI()});sumUI();
  rSug();
  $('#diaNomina').value=S.aj.diaNomina;$('#diaNomina').onchange=e=>{S.aj.diaNomina=Math.min(31,Math.max(1,+e.target.value||25));save();toast('Guardado. Se aplica a las nóminas nuevas')};
  $('#dzAuto').checked=!!S.aj.diezmoAuto;
  $('#dzTxt').textContent=S.aj.diezmoAuto?`Activado desde ${nombreMes(S.aj.diezmoDesde||mesDe(hoy()))} · ${S.aj.pct.DIEZMO||0} % de los ingresos (se cambia en el presupuesto, categoría Diezmo).`:'';
  $('#dzAuto').onchange=e=>{S.aj.diezmoAuto=e.target.checked;if(e.target.checked&&!S.aj.diezmoDesde)S.aj.diezmoDesde=mesDe(hoy());save();rAjustes();toast(e.target.checked?'Diezmo automático activado':'Diezmo automático desactivado')};
  $('#umbralNomina').value=fmt(S.aj.umbralNomina||1000,0);$('#umbralNomina').onchange=e=>{const v=parseNum(e.target.value);S.aj.umbralNomina=isFinite(v)&&v>0?v:1000;save();toast('Guardado')};
  const ps=S.aj.pagadores||[];
  $('#pagList').innerHTML=ps.length?`<b>Pagadores de nómina que recuerdo</b><div class="paglist">${ps.map((p,i)=>`<span class="tag acc">${esc(p.n)} <button type="button" class="link" data-pq="${i}" title="Olvidar este pagador" aria-label="Olvidar ${esc(p.n)}">✕</button></span>`).join('')}</div>`:'';
  $$('#pagList [data-pq]').forEach(b=>b.onclick=()=>{const p=ps.splice(+b.dataset.pq,1)[0];save();rAjustes();toast('Olvidado: '+p.n)});
  $$('#nomMes button').forEach(b=>{b.classList.toggle('on',b.dataset.v===(S.aj.nominaMes||'siguiente'));b.onclick=()=>{S.aj.nominaMes=b.dataset.v;save();rAjustes();toast('Guardado. Se aplica a las nóminas nuevas')}});
  instUI();
  $('#verTagAj').textContent='Versión '+VERSION;$('#irAyuda').onclick=()=>go('ayuda');
  $('#bkInfo').textContent=S.ultimaCopia?'Última copia: '+new Date(S.ultimaCopia).toLocaleDateString('es-ES'):'Aún no hay ninguna copia.';
  const nh=S.mov.filter(x=>x.origen==='excel').length;const hm=S.histMeta;
  $('#histInfo').textContent=nh?`Hay ${nh} apuntes que vienen del Excel${hm?` (${nombreMes(hm.desde)} – ${nombreMes(hm.hasta)})`:''}.`:'Si tienes el archivo del historial del Excel (historial-mis-gastos.json), puedes cargarlo aquí.';
  $('#histLoad').disabled=!!nh;$('#histDel').disabled=!nh;
  rReglas();rFijosAj();
  $('#rCat').innerHTML=catOptions('',{blank:false});
}
function borrarCat(c){
  const nm=S.mov.filter(x=>x.cat===c.id).length,nr=S.reglas.filter(r=>r.c===c.id).length,pc=+S.aj.pct[c.id]||0;
  const otras=S.cats.filter(x=>x.id!==c.id);
  dialog('Borrar «'+c.n+'»',`<p>${nm?`Tiene <b>${nm} movimientos</b>`:'No tiene movimientos'}${nr?` y <b>${nr} reglas</b>`:''}.${nm||nr?' ¿A qué categoría pasan?':''}</p>
    <div class="formgrid"><label>Pasar a</label><select id="bcDest">${GROUPS.map(g=>`<optgroup label="${g.n}">`+otras.filter(x=>x.g===g.id).map(x=>`<option value="${x.id}"${x.id==='OTROS'?' selected':''}>${esc(x.n)}</option>`).join('')+'</optgroup>').join('')}<option value="">Sin categoría</option></select></div>
    ${pc?`<p class="small mut">Su ${fmt(pc,1)}% de presupuesto se suma a la categoría elegida (si eliges «Sin categoría», tendrás que repartirlo).</p>`:''}`,
   [{t:'Cancelar'},{t:'Borrar categoría',cls:'pri',fn:()=>{
     const d=$('#bcDest').value;
     S.mov.forEach(x=>{if(x.cat===c.id)x.cat=d});
     S.reglas=S.reglas.filter(r=>r.c!==c.id||d).map(r=>r.c===c.id?{...r,c:d}:r);
     if(d){if(enEur(c.id)&&enEur(d))S.aj.eur[d]=r2(S.aj.eur[d]+S.aj.eur[c.id]);else if(!enEur(c.id)&&!enEur(d))S.aj.pct[d]=r2((+S.aj.pct[d]||0)+pc)}
     delete S.aj.pct[c.id];if(S.aj.eur)delete S.aj.eur[c.id];syncAhorro();S.cats=S.cats.filter(x=>x!==c);save();rAjustes();toast('Categoría borrada')}}]);
}
const mediana=a=>{const s=[...a].sort((x,y)=>x-y),n=s.length;return n?(n%2?s[(n-1)/2]:(s[n/2-1]+s[n/2])/2):0};
function sugerencia(){
  const cur=mesDe(hoy());
  const ms=mesesConDatos().filter(m=>m<cur).slice(-12).filter(m=>stats(m).consumo>0);
  if(ms.length<3)return null;
  const sts=ms.map(stats);
  const ings=sts.map(s=>s.ingresos).filter(v=>v>0);
  const mi=mediana(ings);const normales=ings.filter(v=>v>=mi*0.5&&v<=mi*1.3);
  const baseSug=Math.max(50,Math.floor(mediana(normales)/50)*50);
  const fija=S.aj.base==='fija'&&S.aj.baseFija>0;
  const base=fija?+S.aj.baseFija:baseSug;
  const filas=CATS.map(c=>{
    const v=sts.map(s=>s.by[c.id]||0);const mean=v.reduce((a,b)=>a+b,0)/v.length,md=mediana(v);
    const hab=(mean+md)/2,habP=hab/base*100,obj=r2(pctCat(c.id,base));
    const over=v.filter(x=>x>base*obj/100+0.5).length;
    const sinDatos=v.every(x=>Math.abs(x)<0.5);
    let sug=c.g==='AHORRO'||(sinDatos&&obj>0)?obj:Math.max(0,Math.ceil(habP-0.05));
    return {c,mean,md,hab,habP,obj,over,sug,n:v.length,sinDatos};
  });
  const fa=filas.find(f=>f.c.id==='AHORRO');
  let resto=100-filas.reduce((a,f)=>a+f.sug,0);
  let extraAhorro=0,deficit=0;
  if(resto>0){fa.sug+=resto;extraAhorro=resto}
  else if(resto<0){
    // No cabe todo: primero se reduce el ahorro, luego la inversión y, si aún no llega,
    // el ocio que más pesa, punto a punto, para que siempre sume 100 %.
    deficit=-resto;
    for(const f of [fa,filas.find(f=>f.c.id==='INVERSION')].filter(Boolean)){const red=Math.min(f.sug,-resto);if(red){f.sug-=red;f.recorte=red;resto+=red}}
    const vars=filas.filter(f=>f.c.g==='VARIABLES');
    while(resto<0){const f=vars.filter(x=>x.sug>0).sort((a,b)=>b.sug-a.sug)[0];if(!f)break;f.sug--;f.recorte=(f.recorte||0)+1;resto++}
  }
  const difs=filas.filter(f=>f.sug!==f.obj);
  const aplicada=!difs.length&&fija;
  const cambia=filas.some(f=>f.c.g!=='AHORRO'&&Math.abs(f.sug-f.obj)>=2)||(!fija);
  return {ms,base,baseSug,fija,filas,extraAhorro,deficit,cambia,ings,difs,aplicada};
}
function rSug(){
  const g=sugerencia();const el=$('#sugCard');
  if(!g){el.innerHTML='<h3>Sugerencia de presupuesto</h3><p class="small mut" style="margin:6px 0 0">Hacen falta al menos 3 meses con gastos para poder sugerir un presupuesto.</p>';return}
  const nota=f=>{
    if(f.c.id==='DIEZMO')return f.mean<0.5?'No hay ningún diezmo apuntado en estos meses':'Media '+eur(f.mean,0)+' al mes';
    if(f.c.id==='AHORRO')return g.extraAhorro?`Incluye ${g.extraAhorro} puntos que sobran del resto`:f.recorte?`<span class="neg">Reducido ${f.recorte} puntos: los gastos habituales no dejan más</span>`:'Se mantiene tu objetivo';
    if(f.c.g==='AHORRO')return f.recorte?`<span class="neg">Reducido ${f.recorte} puntos: los gastos habituales no dejan más</span>`:'Se mantiene tu objetivo';
    if(f.recorte)return `<span class="neg">Recortado ${f.recorte} punto${f.recorte>1?'s':''} por debajo de lo habitual para que todo sume 100 %</span>`;
    if(f.sinDatos)return f.obj>0?'<span class="mut">Sin gastos todavía; se mantiene</span>':'';
    if(f.sug-f.obj>=1)return `<span class="neg">Te pasas en ${f.over} de ${f.n} meses</span>`;
    if(f.obj-f.sug>=2)return `<span class="mut">Sobra presupuesto: sueles gastar ${eur(f.hab,0)}</span>`;
    return '<span class="pos">Bien ajustado</span>';
  };
  const sigMes=nombreMes(addMes(mesDe(hoy()),1));
  const tabla=()=>`<div class="tablewrap"><table><thead><tr><th>Categoría</th><th class="r">Gasto habitual</th><th class="r">Ahora</th><th class="r">Sugerido</th><th>Por qué</th></tr></thead><tbody>`+
   g.filas.map(f=>`<tr${f.sug!==f.obj?' class="sugdif"':''}><td>${f.c.n}</td><td class="r num">${f.c.g==='AHORRO'?'':eur(f.hab,0)+' <span class="mut small">('+fmt(f.habP,1)+'%)</span>'}</td><td class="r num">${f.obj}% <span class="mut small">${eur(g.base*f.obj/100,0)}</span></td><td class="r num">${f.sug===f.obj?'<span class="mut">igual</span>':`<b>${f.sug}%</b> <span class="mut small">${eur(g.base*f.sug/100,0)}</span>`}</td><td class="small">${nota(f)}</td></tr>`).join('')+`</tbody></table></div>`;
  // Ya aplicada: no hay nada que cambiar
  if(g.aplicada){
    el.innerHTML=`<h3>Sugerencia según los gastos reales</h3>
     <div class="alert" style="background:var(--good-soft);margin:10px 0 0"><span class="grow"><b>✓ Tu presupuesto ya está ajustado</b> a lo que gastas normalmente (calculado con ${g.ms.length} meses, de ${nombreMesC(g.ms[0])} a ${nombreMesC(g.ms[g.ms.length-1])}). Cada mes se vuelve a calcular con el mes que termina: si tus gastos cambian, aquí te avisaré.</span></div>
     <details style="margin-top:10px"><summary class="small" style="cursor:pointer">Ver el cálculo</summary><div style="margin-top:8px">${tabla()}</div></details>`;
    return;
  }
  const oculta=S.aj.sugOculta===mesDe(hoy());
  if(oculta){
    el.innerHTML=`<div class="toolbar" style="margin:0"><h3>Sugerencia según los gastos reales</h3><span class="sp"></span><button class="btn sm" id="sugVer" type="button">Ver la sugerencia</button></div><p class="small mut" style="margin:6px 0 0">La has dejado para más adelante; vuelve a aparecer en ${sigMes}.</p>`;
    $('#sugVer').onclick=()=>{S.aj.sugOculta='';save();rSug()};return;
  }
  el.innerHTML=`<div class="toolbar" style="margin-top:0"><h3>Sugerencia según los gastos reales</h3><span class="sp"></span><button class="btn" id="sugLuego" type="button">Ahora no</button><button class="btn pri" id="sugApply">Aplicar ${g.difs.length} cambio${g.difs.length===1?'':'s'}</button></div>
   <p class="small mut" style="margin:0 0 10px">Calculado con ${g.ms.length} meses (${nombreMesC(g.ms[0])} – ${nombreMesC(g.ms[g.ms.length-1])}). «Gasto habitual» es la media entre el gasto medio y el de un mes normal, para que un mes raro (un viaje, una compra grande) no lo distorsione. El ahorro y el diezmo no se tocan: son objetivos, no hábitos.</p>
   ${g.fija?'':`<div class="alert info" style="margin-bottom:10px"><span class="grow"><b>Base del presupuesto:</b> ahora es lo que entra cada mes, que varía mucho (entre ${eur(Math.min(...g.ings),0)} y ${eur(Math.max(...g.ings),0)} con las pagas extra y los cambios de fecha de la nómina). Se sugiere una cantidad fija de <b>${eur(g.baseSug,0)}</b>, la nómina de un mes normal; las pagas extra quedan como ahorro.</span></div>`}
   ${g.deficit?`<div class="alert bad" style="margin-bottom:10px"><span class="grow">Lo que sueles gastar no deja sitio para todo el ahorro (faltan ${g.deficit} puntos). Para que sume 100 % se reduce primero el ahorro, luego la inversión y, si hace falta, el ocio que más pesa.</span></div>`:''}
   ${tabla()}`;
  $('#sugLuego').onclick=()=>{S.aj.sugOculta=mesDe(hoy());save();rSug();toast('Vale, te lo vuelvo a enseñar en '+sigMes)};
  $('#sugApply').onclick=()=>confirmar('Aplicar sugerencia',`Se cambiarán los porcentajes${g.fija?'':' y la base pasará a una cantidad fija de '+eur(g.baseSug,0)}. Luego puedes retocarlos a mano.`,'Aplicar',()=>{
    const bs=g.fija?+S.aj.baseFija:g.baseSug;g.filas.forEach(f=>{if(f.c.id==='AHORRO')return;if(enEur(f.c.id))S.aj.eur[f.c.id]=Math.round(bs*f.sug/100);else S.aj.pct[f.c.id]=f.sug});if(!g.fija){S.aj.base='fija';S.aj.baseFija=g.baseSug}syncAhorro();save();rAjustes();toast('Presupuesto actualizado')});
}
function rFijosAj(){
  const fs=S.fijos||(S.fijos=[]);
  $('#fjTable').innerHTML=fs.length?`<thead><tr><th>Nombre</th><th>Texto del concepto</th><th class="r">Importe</th><th>Cada</th><th>Día</th><th>Categoría</th><th>Desde</th><th></th></tr></thead><tbody>`+fs.map((f,i)=>`<tr data-i="${i}">
    <td><input type="text" data-k="nombre" value="${esc(f.nombre)}" style="width:150px"></td>
    <td><input type="text" data-k="texto" value="${esc(f.texto||'')}" placeholder="(opcional)" style="width:150px"></td>
    <td class="r"><input type="text" data-k="importe" value="${fmt(f.importe)}" inputmode="decimal" class="right" style="width:90px"></td>
    <td><select data-k="cada">${[1,2,3,6,12].map(n=>`<option value="${n}"${n==(f.cada||1)?' selected':''}>${n===1?'mes':n+' meses'}</option>`).join('')}</select></td>
    <td><input type="number" data-k="dia" min="1" max="31" value="${f.dia||''}" style="width:60px"></td>
    <td><select data-k="cat">${catOptions(f.cat,{blankText:'—'})}</select></td>
    <td><input type="month" data-k="desde" value="${f.desde||''}"></td>
    <td><button class="btn sm icon dan fx" title="Quitar">✕</button></td></tr>`).join('')+'</tbody>':'<tbody><tr><td class="empty">Aún no hay gastos fijos. Pulsa «Detectar automáticamente» o «＋ Añadir».</td></tr></tbody>';
  $$('#fjTable tr[data-i]').forEach(tr=>{const f=fs[+tr.dataset.i];
    $$('[data-k]',tr).forEach(el=>el.onchange=()=>{const k=el.dataset.k;let v=el.value;
      if(k==='importe'){v=parseNum(v);if(!isFinite(v)||v<=0){toast('Importe no válido',true);el.value=fmt(f.importe);return}v=r2(v)}
      if(k==='cada'||k==='dia')v=+v||(k==='cada'?1:'');f[k]=v;save()});
    $('.fx',tr).onclick=()=>confirmar('Quitar gasto fijo','¿Dejar de vigilar «'+f.nombre+'»?','Quitar',()=>{fs.splice(+tr.dataset.i,1);save();rFijosAj()});
  });
}
$('#fjAdd').onclick=()=>{(S.fijos||(S.fijos=[])).push({id:uid(),nombre:'Nuevo gasto fijo',texto:'',importe:10,cada:1,dia:1,cat:'',desde:mesDe(hoy())});save();rFijosAj();const ins=$$('#fjTable [data-k=nombre]');ins[ins.length-1].select()};
$('#fjDet2').onclick=detectarFijos;
function rReglas(){
  const q=norm($('#rBuscar').value).trim();
  const rs=S.reglas.map((r,i)=>({r,i})).filter(({r})=>!q||norm(r.t).includes(q)||norm(catN(r.c)).includes(q));
  $('#rTable').innerHTML=`<thead><tr><th>Si el concepto contiene</th><th>Categoría</th><th>Tipo</th><th></th></tr></thead><tbody>`+
    rs.map(({r,i})=>`<tr data-i="${i}"><td><input type="text" class="rt" value="${esc(r.t)}" style="width:240px"></td><td><select class="rc">${catOptions(r.c,{blank:false})}</select></td><td class="small">${r.u?'<span class="tag acc">aprendida</span>':'<span class="tag">de serie</span>'}</td><td><button class="btn sm icon rd" title="Borrar">✕</button></td></tr>`).join('')+'</tbody>';
  $$('#rTable tr[data-i]').forEach(tr=>{const r=S.reglas[+tr.dataset.i];
    $('.rt',tr).onchange=e=>{r.t=e.target.value.trim();r.u=1;save()};
    $('.rc',tr).onchange=e=>{r.c=e.target.value;r.u=1;save()};
    $('.rd',tr).onclick=()=>{S.reglas.splice(+tr.dataset.i,1);save();rReglas()};
  });
}
$('#rBuscar').oninput=rReglas;
$('#rAdd').onsubmit=e=>{e.preventDefault();const t=$('#rTexto').value.trim();if(!t)return;S.reglas.unshift({t,c:$('#rCat').value,u:1});$('#rTexto').value='';save();rReglas();toast('Regla añadida')};
function exportar(){
  S.ultimaCopia=Date.now();S.app=VERSION;save();
  const blob=new Blob([JSON.stringify(S)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='mis-gastos-copia-'+hoy()+'.json';document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),2000);toast('Copia guardada en Descargas');render();
}
$('#bkExport').onclick=exportar;
$('#bkImport').onclick=()=>$('#bkFile').click();
$('#bkFile').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
  try{const d=JSON.parse(await f.text());if(!d||!Array.isArray(d.mov))throw new Error('no es una copia de este programa');
    confirmar('Restaurar copia',`La copia tiene ${d.mov.length} movimientos. Se sustituirá todo lo que hay ahora. ¿Seguir?`,'Restaurar',()=>{S=d;const df=defState();for(const k in df)if(S[k]===undefined)S[k]=df[k];save();render();toast('Copia restaurada')});
  }catch(err){toast('No se ha podido leer: '+err.message,true)}};
$('#wipe').onclick=()=>confirmar('Borrar todo','Se borrarán todos tus movimientos, reglas y ajustes. ¿Seguro?','Borrar todo',()=>{S=defState();S.histOfrecido=true;save();render();toast('Datos borrados')});
$('#histLoad').onclick=()=>$('#histFile').click();
$('#histFile').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
  try{const H=JSON.parse(await f.text());if(!H||H.tipo!=='historial-mis-gastos'||!Array.isArray(H.mov))throw new Error('no es un archivo de historial');
    confirmar('Cargar historial',`El archivo trae ${H.mov.length} apuntes de ${nombreMes(H.desde)} a ${nombreMes(H.hasta)}. ¿Cargarlos?`,'Cargar',()=>{cargarHist(H);render();toast('Historial cargado')});
  }catch(err){toast('No se ha podido leer: '+err.message,true)}};
$('#histDel').onclick=()=>confirmar('Quitar historial','¿Quitar todos los apuntes que vienen del Excel? Lo importado de extractos y lo añadido a mano se queda.','Quitar',()=>{S.mov=S.mov.filter(x=>x.origen!=='excel');S.histCargado=false;save();render()});

function cargarHist(H){
  for(const r of (H.reglas||[]))if(!S.reglas.some(x=>norm(x.t)===norm(r.t)))S.reglas.unshift({t:r.t,c:r.c,u:1});
  const legacy=new Set(['CAPRICHOS','GASTOS FIJOS','NECESIDADES','OTRAS NECESIDADES','']);
  for(const h of H.mov){
    let cat=h.k;const n=norm(h.c);
    if(n.includes(' PRESTAMO'))cat='PRESTAMO';
    else if(n.includes(' DESAJUST'))cat='AJUSTE';
    else if(legacy.has(cat)||!ALLC.some(c=>c.id===cat)){const r=matchRule(h.c);cat=r&&!['INGRESO','EFECTIVO','TRASPASO'].includes(r.c)?r.c:'OTROS'}
    if(cat==='SALUD'&&RE_ACTIVIDAD.test(norm(h.c)))cat='ACTIVIDADES';
    if(cat==='AHORRO')cat=RE_INVERSION.test(norm(h.c))?'INVERSION':'TRASPASO';
    S.mov.push({id:uid(),fecha:h.f,mes:h.f.slice(0,7),concepto:h.c,importe:h.i,cat,metodo:h.e?'efectivo':'banco',cuenta:h.e?'':'',origen:'excel'});
  }
  S.notas={...(S.notas||{}),...(H.notas||{})};S.histMeta={desde:H.desde,hasta:H.hasta,n:H.mov.length};
  S.histCargado=true;S.histOfrecido=true;save();
}

/* ---- Preferencias (interruptores) ---- */
// Interruptores. g: dónde salen (apar = Mi perfil → Apariencia, avisos = Mi perfil → Avisos, clas = Ajustes → Clasificación)
const PREFS=[
  {k:'bizumReglas',g:'clas',t:'Aprender la categoría de los Bizum',d:'Desactivado: cada Bizum se clasifica a mano, porque la misma persona te puede pagar por motivos distintos.'},
  {k:'aprender',g:'clas',t:'Aprender reglas al cambiar una categoría',d:'Al poner categoría a un movimiento del banco, los siguientes con el mismo comercio se clasifican solos.'},
  {k:'aviso80',g:'avisos',t:'Avisar al llegar al 80 % de una categoría',d:'Aviso en el Resumen cuando te acercas al presupuesto.'},
  {k:'comparar',g:'avisos',t:'Comparar con el mes anterior',d:'Muestra ▲ / ▼ junto a cada categoría.'},
  {k:'avisoCopia',g:'avisos',t:'Recordar la copia de seguridad',d:'Aviso si hace más de un mes de la última copia.'},
  {k:'verGrafico',g:'avisos',t:'Gráfico «En qué se ha ido el dinero»',d:'En el Resumen.'},
  {k:'verFijos',g:'avisos',t:'Gastos fijos previstos',d:'Tarjeta del Resumen que avisa si un fijo no llega o cambia de importe.'},
  {k:'verObjetivos',g:'avisos',t:'Objetivos de ahorro en el Resumen',d:'Siguen disponibles en Patrimonio aunque lo desactives.'},
  {k:'fab',g:'apar',t:'Botón flotante «＋ Añadir»',d:'El botón redondo de abajo a la derecha.'},
  {k:'animaciones',g:'apar',t:'Animaciones',d:'Movimientos suaves al abrir pestañas y desplegables.'},
  {k:'rufo',g:'apar',t:'Rufo en una esquina',d:'El botón del zorro, abajo a la izquierda, para preguntarle dudas o escribir al administrador.'},
  {k:'enLinea',g:'avisos',admin:true,t:'Mostrar cuando estoy en línea',d:'En el chat, los usuarios ven «En línea» si tienes la app abierta, o cuándo fue la última vez.'},
];
const pref=k=>S&&S.aj&&S.aj[k]!==false&&(k!=='bizumReglas'||S.aj[k]===true);
const prefHtml=p=>`<label class="pref"><span class="sw"><input type="checkbox" data-pref="${p.k}" ${pref(p.k)?'checked':''}><i></i></span><span><b>${p.t}</b><span class="small mut">${p.d}</span></span></label>`;
function rPrefs(){
  const tema=S.aj.tema||'auto';
  const pal=S.aj.paleta||'verde',osc=document.documentElement.dataset.theme==='dark'||(document.documentElement.dataset.theme!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);
  const palHtml=`<div class="pref" style="cursor:default;flex-direction:column;align-items:stretch;gap:0"><span><b>Colores</b><span class="small mut">Se ven bien en claro y en oscuro.</span></span><div class="palopts" id="palSel">${Object.entries(PALETAS).map(([k,p])=>`<button type="button" class="palopt${k===pal?' on':''}" data-pal="${k}"><span class="sw3">${p[osc?'d':'l'].map(c=>`<i style="background:${c}"></i>`).join('')}</span><b>${p.n}</b></button>`).join('')}</div></div>`;
  const temaHtml=`<div class="pref" style="cursor:default;align-items:center"><span style="flex:1"><b>Tema</b><span class="small mut">Automático: como tenga el dispositivo.</span></span><span class="seg" id="temaSeg">${[['claro','☀️ Claro'],['oscuro','🌙 Oscuro'],['auto','Auto']].map(([k,t])=>`<button type="button" data-v="${k}" class="${k===tema?'on':''}">${t}</button>`).join('')}</span></div>`;
  const grupo=g=>PREFS.filter(p=>p.g===g&&(!p.admin||(USER&&USER.admin))).map(prefHtml).join('');
  if($('#aparList'))$('#aparList').innerHTML=palHtml+temaHtml+grupo('apar');
  if($('#prefList'))$('#prefList').innerHTML=grupo('avisos');
  if($('#clasList'))$('#clasList').innerHTML=grupo('clas');
  const dz=$('#dzOn');if(dz)dz.checked=diezmoOn();
  $$('#palSel .palopt').forEach(b=>b.onclick=()=>{S.aj.paleta=b.dataset.pal;aplicarTema();save();rPrefs();toast('Colores: '+PALETAS[b.dataset.pal].n)});
  $$('#temaSeg button').forEach(b=>b.onclick=()=>{S.aj.tema=b.dataset.v;aplicarTema();save();rPrefs()});
  $$('[data-pref]').forEach(c=>c.onchange=()=>{const k=c.dataset.pref;if(k==='diezmo'){ponerDiezmo(c.checked);return}S.aj[k]=c.checked;save();toast(c.checked?'Activado':'Desactivado');if(k==='fab'||k==='rufo')render();if(k==='animaciones')aplicarTema();if(k==='enLinea'&&typeof presencia==='function')presencia()});
}
$('#verTuto').onclick=()=>{if(typeof tutorial==='function')tutorial(true)};
const PALETAS={"verde": {"n": "Verde", "l": ["#0f6b5c", "#e1f0eb", "#f5f4ef"], "d": ["#4db6a0", "#16332d", "#131615"]}, "lavanda": {"n": "Lavanda", "l": ["#6b4fbb", "#ece6fb", "#f6f4fa"], "d": ["#a58cf0", "#2b2445", "#15131c"]}, "oceano": {"n": "Océano", "l": ["#1f5fa8", "#e2edf8", "#f2f6f9"], "d": ["#6aa7ec", "#172b42", "#10151b"]}, "terracota": {"n": "Terracota", "l": ["#b9532f", "#f8e5dc", "#faf5ef"], "d": ["#e58a6b", "#3a241b", "#171311"]}, "frambuesa": {"n": "Frambuesa", "l": ["#ad2f5b", "#f9e1ea", "#fbf4f6"], "d": ["#ec7ca3", "#3d1f2b", "#181215"]}, "ciruela": {"n": "Ciruela", "l": ["#5b3a6e", "#efe7f3", "#f7f5f1"], "d": ["#b88fd0", "#33263b", "#151217"]}};
function aplicarTema(){const t=(S&&S.aj&&S.aj.tema)||'auto',p=(S&&S.aj&&S.aj.paleta)||'verde',de=document.documentElement;
  if(t==='auto')delete de.dataset.theme;else de.dataset.theme=t==='claro'?'light':'dark';
  if(p==='verde'||!PALETAS[p])delete de.dataset.pal;else de.dataset.pal=p;
  de.classList.toggle('sinanim',!!(S&&S.aj&&S.aj.animaciones===false));
  try{localStorage.setItem('mg-tema',t);localStorage.setItem('mg-paleta',p)}catch(_){}
  const col=(PALETAS[p]||PALETAS.verde).l[0];
  const m=document.querySelector('meta[name="theme-color"]');if(m)m.content=col;
  // el icono de la pestaña del navegador, del color elegido (el de la app instalada se queda verde)
  const ic=document.querySelector('link[rel="icon"][type="image/svg+xml"]');
  if(ic)ic.href=p==='verde'?'icons/logo.svg':'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="${col}"/><path d="M355 157 A140 140 0 1 0 355 355" fill="none" stroke="#fff" stroke-width="44" stroke-linecap="round"/><path d="M190 262 L240 312 L340 200" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="44" stroke-linecap="round" stroke-linejoin="round"/></svg>`);}
// Activar o desactivar el diezmo sin descuadrar el 100 %: su porcentaje va y viene del ahorro.
function ponerDiezmo(on){
  const p=S.aj.pct;
  if(!on){p.AHORRO=r2((+p.AHORRO||0)+(+p.DIEZMO||0));p.DIEZMO=0;S.aj.diezmo=false;S.aj.diezmoAuto=false;toast('Diezmo desactivado: su porcentaje pasa al ahorro')}
  else{const d=Math.min(10,Math.floor(pctAhorro(baseRef())*10)/10);p.DIEZMO=d;p.AHORRO=r2((+p.AHORRO||0)-d);S.aj.diezmo=true;toast(d?'Diezmo activado con el '+d+' %, que sale del ahorro':'Diezmo activado: ponle su porcentaje en el presupuesto')}
  refreshCats();syncAhorro();save();if(TAB==='ajustes')rAjustes();else render();
}

/* ---- Más categorías: sugerencias que se añaden con un toque, con sus palabras para clasificar solas ---- */
const CAT_SUG=[
  {n:'Mascotas',g:'FIJOS',e:'🐾',r:['KIWOKO','TIENDANIMAL','ZOOPLUS','VETERINARI','CLINICA VETERINARIA','PIENSO','MASCOTA']},
  {n:'Hijos y colegio',g:'FIJOS',e:'🎒',r:['GUARDERIA','ESCUELA INFANTIL','COLEGIO','MATERIAL ESCOLAR','COMEDOR ESCOLAR','EXTRAESCOLAR']},
  {n:'Seguros',g:'FIJOS',e:'🛡️',r:['MAPFRE','MUTUA MADRILENA','AXA','ALLIANZ','GENERALI','LINEA DIRECTA','SANITAS','ADESLAS','DKV','ASISA','SEGURO']},
  {n:'Teléfono e internet',g:'FIJOS',e:'📱',r:['MOVISTAR','VODAFONE','ORANGE','DIGI','MASMOVIL','PEPEPHONE','YOIGO','JAZZTEL','LOWI','SIMYO','O2 ']},
  {n:'Luz, agua y gas',g:'FIJOS',e:'💡',r:['IBERDROLA','ENDESA','NATURGY','HOLALUZ','TOTALENERGIES','EMIVASA','AGUAS DE','CANAL DE ISABEL']},
  {n:'Coche',g:'FIJOS',e:'🚗',r:['ITV','TALLER','NORAUTO','MIDAS','FEU VERT','NEUMATICO','CONFORTAUTO']},
  {n:'Farmacia',g:'FIJOS',e:'💊',r:['FARMACIA','PARAFARMACIA']},
  {n:'Impuestos y tasas',g:'FIJOS',e:'🏛️',r:['AEAT','AGENCIA TRIBUTARIA','AYUNTAMIENTO','IBI','TASA','DGT','HACIENDA','MODELO 303','MODELO 130','MOD. 303','MOD. 130','MOD 303','MOD 130']},
  {n:'Cuota de autónomos',g:'FIJOS',e:'🧾',r:['TGSS','TESORERIA GENERAL','SEGURIDAD SOCIAL','CUOTA AUTONOMO','CUOTA DE AUTONOMO']},
  {n:'Gestoría',g:'FIJOS',e:'🗂️',r:['GESTORIA','ASESORIA','ASESORES']},
  {n:'Trabajo',g:'FIJOS',e:'💼',r:['COLEGIO OFICIAL','COLEGIACION','CONGRESO','MATERIAL DE OFICINA']},
  {n:'Suscripciones',g:'VARIABLES',e:'📺',r:['NETFLIX','SPOTIFY','HBO','MAX ','DISNEY','PRIME VIDEO','AMAZON PRIME','YOUTUBE','ICLOUD','APPLE COM','GOOGLE ONE','FILMIN','DAZN']},
  {n:'Comida a domicilio',g:'VARIABLES',e:'🛵',r:['GLOVO','JUST EAT','UBER EATS','DELIVEROO','TELEPIZZA']},
  {n:'Hogar y decoración',g:'VARIABLES',e:'🛋️',r:['IKEA','LEROY MERLIN','BRICOMART','BRICODEPOT','ZARA HOME','MAISONS DU MONDE','JYSK','KAVE HOME']},
  {n:'Belleza y cuidado',g:'VARIABLES',e:'💅',r:['PELUQUERIA','ESTETICA','SEPHORA','DRUNI','PRIMOR','MANICURA','UNAS','CEJAS']},
  {n:'Tecnología',g:'VARIABLES',e:'💻',r:['MEDIA MARKT','MEDIAMARKT','PCCOMPONENTES','WORTEN','APPLE STORE','XIAOMI','BACK MARKET']},
  {n:'Formación',g:'VARIABLES',e:'📚',r:['ACADEMIA','UDEMY','COURSERA','MATRICULA','UNIVERSIDAD','CURSO']},
  {n:'Donativos',g:'AHORRO',e:'🤝',r:['UNICEF','CARITAS','CRUZ ROJA','MEDICOS SIN FRONTERAS','ACNUR','SAVE THE CHILDREN','DONATIVO','DONACION']},
];
const catSugDisponibles=()=>CAT_SUG.filter(c=>!S.cats.some(x=>norm(x.n)===norm(c.n)));
function rCatSug(){
  const el=$('#catSug');if(!el)return;const xs=catSugDisponibles();
  el.innerHTML=xs.length?`<div style="margin:14px 0 4px;padding-top:12px;border-top:1px solid var(--line)"><b>Más categorías</b><p class="small mut" style="margin:2px 0 8px">Añade las que te encajen con un toque. Ya traen sus palabras para clasificar solas (por ejemplo, Netflix o Spotify en Suscripciones). Empiezan con 0 %: luego les pones su parte del presupuesto.</p>
    <div class="chips">${xs.map(c=>`<button type="button" class="chip" data-sug="${esc(c.n)}">${c.e} ${esc(c.n)}</button>`).join('')}</div></div>`:'';
  $$('#catSug [data-sug]').forEach(b=>b.onclick=()=>anadirCatSug(CAT_SUG.find(c=>c.n===b.dataset.sug)));
}
// Reordenar categorías arrastrando el asa ⠿ (ratón o dedo), dentro de su grupo
// Celda del presupuesto: % o € con su botón para cambiar; el Ahorro se calcula solo
function valorCelda(c){
  if(c.id==='AHORRO')return `<span data-ah>${ahorroCelda(baseRef())}</span>`;
  const e=enEur(c.id),un=c.id==='DIEZMO'?'<span class="unf">%</span>':`<button type="button" class="un${e?' eur':''}" data-u="${c.id}" title="${e?'En euros fijos al mes. Pulsa para pasarlo a porcentaje':'En porcentaje de la base. Pulsa para poner una cantidad fija en euros'}">${e?'€':'%'}</button>`;
  return e?`<input type="number" min="0" step="1" data-e="${c.id}" value="${+S.aj.eur[c.id]||0}" style="width:84px" class="right" inputmode="decimal">${un}`
    :`<input type="number" min="0" max="100" step="0.5" data-p="${c.id}" value="${S.aj.pct[c.id]??0}" style="width:72px" class="right" inputmode="decimal">${un}`}
function ahorroCelda(b){return `<b class="num">${fmt(pctAhorro(b),1)}%</b>${b>0?`<div class="small mut">≈ ${eur(presAhorro(b),0)} este mes</div>`:''}`}
// Pasa una categoría de % a € (o al revés) con la base de este mes, para no empezar de cero
function cambiarUnidad(id,aEur){
  if(id==='AHORRO'||id==='DIEZMO')return;const b=baseRef();
  if(aEur&&!enEur(id)){(S.aj.eur||(S.aj.eur={}))[id]=Math.round(b*(+S.aj.pct[id]||0)/100)}
  else if(!aEur&&enEur(id)){S.aj.pct[id]=b>0?Math.round(S.aj.eur[id]/b*1000)/10:0;delete S.aj.eur[id]}
  syncAhorro();
}
function arrastrarCat(e,tr,c){
  if(e.button>0)return;e.preventDefault();
  const filas=[...$$('#pctTable tr[data-cid]')].filter(t=>S.cats.find(x=>x.id===t.dataset.cid).g===c.g);
  if(filas.length<2)return;
  const asa=e.currentTarget;asa.setPointerCapture(e.pointerId);
  const y0=e.clientY,cajas=filas.map(t=>t.getBoundingClientRect()),k0=filas.indexOf(tr),h=cajas[k0].height;
  let k=k0;tr.classList.add('arrastrando');document.body.classList.add('arrastrando-cat');
  const mov=ev=>{const dy=ev.clientY-y0;
    tr.style.transform=`translateY(${dy}px)`;
    const centro=cajas[k0].top+h/2+dy;
    k=cajas.findIndex(b=>centro<b.bottom);if(k<0)k=cajas.length-1;
    filas.forEach((t,i)=>{if(t===tr)return;const d=i>k0&&i<=k?-h:i<k0&&i>=k?h:0;t.style.transform=d?`translateY(${d}px)`:''});
    // se desplaza la página si llegas al borde
    if(ev.clientY<70)scrollBy(0,-8);else if(ev.clientY>innerHeight-90)scrollBy(0,8);
  };
  const fin=()=>{asa.removeEventListener('pointermove',mov);asa.removeEventListener('pointerup',fin);asa.removeEventListener('pointercancel',fin);
    document.body.classList.remove('arrastrando-cat');
    if(k!==k0){const grupo=S.cats.filter(x=>x.g===c.g),resto=grupo.filter(x=>x!==c);resto.splice(k,0,c);
      const pos=S.cats.map((x,i)=>x.g===c.g?i:-1).filter(i=>i>=0);pos.forEach((p,i)=>S.cats[p]=resto[i]);save();refreshCats()}
    rAjustes()};
  asa.addEventListener('pointermove',mov);asa.addEventListener('pointerup',fin);asa.addEventListener('pointercancel',fin);
}
function anadirCatSug(sg,{silencio=false}={}){
  if(!sg||S.cats.some(x=>norm(x.n)===norm(sg.n)))return null;
  const id='C'+Date.now().toString(36).toUpperCase()+Math.random().toString(36).slice(2,4).toUpperCase();
  const ult=S.cats.map((x,i)=>x.g===sg.g?i:-1).filter(i=>i>=0).pop();
  S.cats.splice(ult==null?S.cats.length:ult+1,0,{id,n:sg.n,g:sg.g});S.aj.pct[id]=0;
  // sus palabras van primero para que ganen a las reglas de serie
  for(const t of sg.r.slice().reverse())if(!S.reglas.some(r=>!r.u&&norm(r.t)===norm(t)&&r.c===id))S.reglas.unshift({t,c:id,u:0});
  save();refreshCats();
  if(silencio)return id;
  // movimientos de antes que encajan (sin contar los Bizum ni los clasificados a mano como préstamo, traspaso…)
  const enc=S.mov.filter(x=>x.cat!==id&&!isBizum(x.concepto)&&!SPECIAL.some(c=>c.id===x.cat)&&(()=>{const r=matchRule(x.concepto+' '+(x.detalle||''));return r&&r.c===id})());
  if(TAB==='ajustes')rAjustes();
  if(enc.length)dialog('«'+sg.n+'» añadida',`<p>He encontrado <b>${enc.length}</b> movimiento${enc.length>1?'s':''} de antes que encaja${enc.length>1?'n':''} (por ejemplo «${esc(enc[0].concepto)}»). ¿Los paso a «${esc(sg.n)}»?</p><p class="small mut">Si no te convence, luego puedes pulsar «Deshacer».</p>`,
    [{t:'No, solo los nuevos'},{t:'Pasarlos',cls:'pri',fn:()=>conDeshacer(enc.length+' movimientos pasados a «'+sg.n+'»',()=>{const ids=new Set(enc.map(x=>x.id));for(const x of S.mov)if(ids.has(x.id))x.cat=id})}]);
  else toast('«'+sg.n+'» añadida: ponle su porcentaje en el presupuesto');
  return id;
}
