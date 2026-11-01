// Cuentas Claras · Pestaña Ajustes: presupuesto, categorías, reglas, copias
"use strict";
/* ============ Ajustes ============ */
function rAjustes(){
  $$('#baseSeg button').forEach(b=>{b.classList.toggle('on',b.dataset.b===S.aj.base);b.onclick=()=>{S.aj.base=b.dataset.b;save();rAjustes()}});
  $('#baseFija').classList.toggle('hide',S.aj.base!=='fija');$('#baseFija').value=S.aj.baseFija?fmt(S.aj.baseFija):'';
  $('#baseFija').onchange=e=>{const v=parseNum(e.target.value);S.aj.baseFija=isFinite(v)?v:0;save()};
  refreshCats();
  const gOpts=sel=>GROUPS.map(g=>`<option value="${g.id}"${g.id===sel?' selected':''}>${g.n}</option>`).join('');
  $('#caGrupo').innerHTML=gOpts('VARIABLES');
  $('#pctTable').innerHTML='<tbody>'+GROUPS.map(g=>{const cs=S.cats.filter(c=>c.g===g.id);
    return `<tr><td colspan="4" class="small mut" style="padding-top:12px"><b>${g.n}</b></td></tr>`+cs.map((c,k)=>`<tr data-cid="${c.id}">
      <td><input type="text" class="cn" value="${esc(c.n)}" style="width:100%;min-width:170px" ${c.id==='DIEZMO'||c.id==='AHORRO'?'':''}></td>
      <td><select class="cg" style="max-width:118px;font-size:13px" ${FIJAS.has(c.id)?'disabled title="Esta categoría no se puede mover de grupo"':''}>${gOpts(c.g)}</select></td>
      <td class="r" style="white-space:nowrap"><input type="number" min="0" max="100" step="0.5" data-p="${c.id}" value="${S.aj.pct[c.id]??0}" style="width:72px" class="right"> %</td>
      <td style="white-space:nowrap"><button type="button" class="btn sm icon cu" title="Subir" ${k===0?'disabled':''}>↑</button><button type="button" class="btn sm icon cd" title="Bajar" ${k===cs.length-1?'disabled':''}>↓</button>${FIJAS.has(c.id)?'':'<button type="button" class="btn sm icon dan cx" title="Borrar categoría">✕</button>'}</td></tr>`).join('')}).join('')+'</tbody>';
  $$('#pctTable tr[data-cid]').forEach(tr=>{const id=tr.dataset.cid;const c=S.cats.find(x=>x.id===id);
    $('.cn',tr).onchange=e=>{const n=e.target.value.trim();if(!n){e.target.value=c.n;return}
      if(S.cats.some(x=>x!==c&&norm(x.n)===norm(n))){toast('Ya hay una categoría con ese nombre',true);e.target.value=c.n;return}
      c.n=n;save();refreshCats();toast('Nombre cambiado')};
    $('.cg',tr).onchange=e=>{c.g=e.target.value;save();rAjustes();toast('Movida a '+GROUPS.find(g=>g.id===c.g).n)};
    const mover=d=>{const cs=S.cats.filter(x=>x.g===c.g);const k=cs.indexOf(c),o=cs[k+d];if(!o)return;const i=S.cats.indexOf(c),j=S.cats.indexOf(o);[S.cats[i],S.cats[j]]=[S.cats[j],S.cats[i]];save();rAjustes()};
    $('.cu',tr).onclick=()=>mover(-1);$('.cd',tr).onclick=()=>mover(1);
    const cx=$('.cx',tr);if(cx)cx.onclick=()=>borrarCat(c);
  });
  $('#catAdd').onsubmit=e=>{e.preventDefault();const n=$('#caNombre').value.trim();if(!n)return;
    if(S.cats.some(x=>norm(x.n)===norm(n))){toast('Ya hay una categoría con ese nombre',true);return}
    const id='C'+Date.now().toString(36).toUpperCase();
    const g=$('#caGrupo').value;const ult=S.cats.map((x,i)=>x.g===g?i:-1).filter(i=>i>=0).pop();
    S.cats.splice(ult==null?S.cats.length:ult+1,0,{id,n,g});S.aj.pct[id]=0;save();$('#caNombre').value='';rAjustes();
    toast('Categoría «'+n+'» añadida con 0%. Dale un porcentaje si quieres presupuesto.')};
  const sumUI=()=>{const s=sumaPct();const ok=Math.abs(s-100)<0.01;
    $('#pctSum').innerHTML=GROUPS.map(g=>`${g.n}: <b>${fmt(CATS.filter(c=>c.g===g.id).reduce((a,c)=>a+(+S.aj.pct[c.id]||0),0),1)}%</b>`).join(' · ')+`<br>Total: <b class="${ok?'ok':'ko'}" style="font-size:16px">${fmt(s,1)}%</b>`;
    $('#pctAlert').innerHTML=ok?'':`<div class="alert bad" style="margin-bottom:14px"><span class="grow"><b>Los porcentajes suman ${fmt(s,1)}%.</b> ${s>100?`Te pasas en ${fmt(s-100,1)} puntos.`:`Faltan ${fmt(100-s,1)} puntos por repartir.`} Tienen que sumar exactamente 100% para poder salir de Ajustes.</span><button class="btn sm" onclick="document.getElementById('pctTable').scrollIntoView({behavior:'smooth',block:'center'})">Ir a los porcentajes</button></div>`;
    $$('[data-p]').forEach(i=>i.style.borderColor=ok?'':'var(--bad)');};
  $$('[data-p]').forEach(i=>i.oninput=()=>{S.aj.pct[i.dataset.p]=parseFloat(String(i.value).replace(',','.'))||0;save();sumUI()});sumUI();
  rSug();
  $('#diaNomina').value=S.aj.diaNomina;$('#diaNomina').onchange=e=>{S.aj.diaNomina=Math.min(31,Math.max(1,+e.target.value||25));save();toast('Guardado. Se aplica a las nóminas nuevas')};
  $('#umbralNomina').value=fmt(S.aj.umbralNomina||1000,0);$('#umbralNomina').onchange=e=>{const v=parseNum(e.target.value);S.aj.umbralNomina=isFinite(v)&&v>0?v:1000;save();toast('Guardado')};
  $$('#nomMes button').forEach(b=>{b.classList.toggle('on',b.dataset.v===(S.aj.nominaMes||'siguiente'));b.onclick=()=>{S.aj.nominaMes=b.dataset.v;save();rAjustes();toast('Guardado. Se aplica a las nóminas nuevas')}});
  instUI();
  $('#verTag').textContent='Versión '+VERSION;$('#verList').innerHTML=cambiosHtml(null).replace('<div class="chlog">','');
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
     if(d)S.aj.pct[d]=r2((+S.aj.pct[d]||0)+pc);
     delete S.aj.pct[c.id];S.cats=S.cats.filter(x=>x!==c);save();rAjustes();toast('Categoría borrada')}}]);
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
    const hab=(mean+md)/2,habP=hab/base*100,obj=+S.aj.pct[c.id]||0;
    const over=v.filter(x=>x>base*obj/100+0.5).length;
    const sinDatos=v.every(x=>Math.abs(x)<0.5);
    let sug=c.g==='AHORRO'||(sinDatos&&obj>0)?obj:Math.max(0,Math.ceil(habP-0.05));
    return {c,mean,md,hab,habP,obj,over,sug,n:v.length,sinDatos};
  });
  const fa=filas.find(f=>f.c.id==='AHORRO');
  let resto=100-filas.reduce((a,f)=>a+f.sug,0);
  let extraAhorro=0,deficit=0;
  if(resto>0){fa.sug+=resto;extraAhorro=resto}
  else if(resto<0){const red=Math.min(fa.sug,-resto);fa.sug-=red;deficit=-resto}
  const cambia=filas.some(f=>f.c.g!=='AHORRO'&&Math.abs(f.sug-f.obj)>=2)||(!fija);
  return {ms,base,baseSug,fija,filas,extraAhorro,deficit,cambia,ings};
}
function rSug(){
  const g=sugerencia();const el=$('#sugCard');
  if(!g){el.innerHTML='<h3>Sugerencia de presupuesto</h3><p class="small mut" style="margin:6px 0 0">Hacen falta al menos 3 meses con gastos para poder sugerir un presupuesto.</p>';return}
  const nota=f=>{
    if(f.c.id==='DIEZMO')return f.mean<0.5?'No hay ningún diezmo apuntado en estos meses':'Media '+eur(f.mean,0)+' al mes';
    if(f.c.g==='AHORRO'&&f.c.id!=='AHORRO')return 'Se mantiene tu objetivo';
    if(f.c.id==='AHORRO')return (g.extraAhorro?`Incluye ${g.extraAhorro} puntos que sobran del resto`:g.deficit?`Reducido ${g.deficit} puntos porque los gastos habituales no caben`:'Se mantiene tu objetivo');
    if(f.sinDatos)return f.obj>0?'<span class="mut">Sin gastos todavía; se mantiene</span>':'';
    if(f.sug-f.obj>=1)return `<span class="neg">Te pasas en ${f.over} de ${f.n} meses</span>`;
    if(f.obj-f.sug>=2)return `<span class="mut">Sobra presupuesto: sueles gastar ${eur(f.hab,0)}</span>`;
    return '<span class="pos">Bien ajustado</span>';
  };
  el.innerHTML=`<div class="toolbar" style="margin-top:0"><h3>Sugerencia según los gastos reales</h3><span class="sp"></span><button class="btn pri" id="sugApply">Aplicar sugerencia</button></div>
   <p class="small mut" style="margin:0 0 10px">Calculado con ${g.ms.length} meses (${nombreMesC(g.ms[0])} – ${nombreMesC(g.ms[g.ms.length-1])}). «Gasto habitual» es la media entre el gasto medio y el de un mes normal, para que un mes raro (un viaje, una compra grande) no lo distorsione. El ahorro y el diezmo no se tocan: son objetivos, no hábitos.</p>
   ${g.fija?'':`<div class="alert info" style="margin-bottom:10px"><span class="grow"><b>Base del presupuesto:</b> ahora es lo que entra cada mes, que varía mucho (entre ${eur(Math.min(...g.ings),0)} y ${eur(Math.max(...g.ings),0)} con las pagas extra y los cambios de fecha de la nómina). Se sugiere una cantidad fija de <b>${eur(g.baseSug,0)}</b>, la nómina de un mes normal; las pagas extra quedan como ahorro.</span></div>`}
   ${g.deficit?`<div class="alert bad" style="margin-bottom:10px"><span class="grow">Con los gastos habituales no llega para el ${S.aj.pct.AHORRO}% de ahorro: faltan ${g.deficit} puntos.</span></div>`:''}
   <div class="tablewrap"><table><thead><tr><th>Categoría</th><th class="r">Gasto habitual</th><th class="r">Ahora</th><th class="r">Sugerido</th><th>Por qué</th></tr></thead><tbody>`+
   g.filas.map(f=>`<tr><td>${f.c.n}</td><td class="r num">${f.c.g==='AHORRO'?'':eur(f.hab,0)+' <span class="mut small">('+fmt(f.habP,1)+'%)</span>'}</td><td class="r num">${f.obj}% <span class="mut small">${eur(g.base*f.obj/100,0)}</span></td><td class="r num"><b>${f.sug}%</b> <span class="mut small">${eur(g.base*f.sug/100,0)}</span></td><td class="small">${nota(f)}</td></tr>`).join('')+
   `</tbody></table></div>`;
  $('#sugApply').onclick=()=>confirmar('Aplicar sugerencia',`Se cambiarán los porcentajes${g.fija?'':' y la base pasará a una cantidad fija de '+eur(g.baseSug,0)}. Luego puedes retocarlos a mano.`,'Aplicar',()=>{
    g.filas.forEach(f=>S.aj.pct[f.c.id]=f.sug);if(!g.fija){S.aj.base='fija';S.aj.baseFija=g.baseSug}save();rAjustes();toast('Presupuesto actualizado')});
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
    S.mov.push({id:uid(),fecha:h.f,mes:h.f.slice(0,7),concepto:h.c,importe:h.i,cat,metodo:h.e?'efectivo':'banco',cuenta:h.e?'':'',origen:'excel'});
  }
  S.notas={...(S.notas||{}),...(H.notas||{})};S.histMeta={desde:H.desde,hasta:H.hasta,n:H.mov.length};
  S.histCargado=true;S.histOfrecido=true;save();
}
