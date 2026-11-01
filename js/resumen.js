// Cuentas Claras · Pestaña Resumen, gastos fijos previstos y objetivos de ahorro
"use strict";
/* ============ Resumen ============ */
function rResumen(){
  const h=$('#hola');if(NUBE&&USER){h.classList.remove('hide');h.innerHTML=`<span class="avatar">${esc((USER.nombre||'?').charAt(0).toUpperCase())}</span><span>Estás viendo las cuentas de <b>${esc(USER.nombre)}</b> · ${esc(USER.email)}</span>`}else h.classList.add('hide');
  const st=stats(MES);
  const libre=st.ingresos-st.consumo-st.diezmo;
  const tasa=st.ingresos>0?libre/st.ingresos:null;
  const queda=st.ingresos-st.consumo-st.ahorro-st.diezmo;
  $('#kpis').innerHTML=`
   <div class="card pad kpi"><div class="l">Ingresos</div><div class="v num pos">${eur(st.ingresos)}</div><div class="s">${st.ms.filter(x=>x.cat==='INGRESO').map(x=>esc(x.concepto)).slice(0,2).join(' · ')||'Sin ingresos apuntados'}</div></div>
   <div class="card pad kpi"><div class="l">Gastado</div><div class="v num">${eur(st.consumo)}</div><div class="s">${st.base>0?Math.round(st.consumo/st.base*100)+'% de la base del presupuesto':'&nbsp;'}</div></div>
   <div class="card pad kpi"><div class="l">Ahorro del mes</div><div class="v num ${libre<0?'neg':''}">${eur(libre)}</div><div class="s">${tasa!==null?Math.round(tasa*100)+'% de lo ingresado':'&nbsp;'}${st.ahorro?' · '+eur(st.ahorro,0)+' movidos a inversión':''}</div></div>
   <div class="card pad kpi"><div class="l">Sin asignar</div><div class="v num ${queda<0?'neg':''}">${eur(queda)}</div><div class="s">Ingresos − gastos − ahorro − diezmo</div></div>`;
  // alertas
  const al=[];
  if(st.sinCat)al.push(`<div class="alert"><span class="grow"><b>${st.sinCat} movimiento${st.sinCat>1?'s':''} sin categoría</b> (${eur(-st.sinCatImp)}). No cuentan en el resumen hasta que les pongas una.</span><button class="btn sm" data-act="sincat">Revisar</button></div>`);
  if(!st.ingresos&&S.aj.base==='ingresos'&&st.ms.length)al.push(`<div class="alert info"><span class="grow">Este mes no tiene ingresos apuntados, así que el presupuesto sale a 0. Puedes usar una base fija en Ajustes.</span></div>`);
  const pp=prestamosPendientes();
  if(Math.abs(pp)>0.009)al.push(`<div class="alert info"><span class="grow">${pp>0?'Te deben':'Debes'} <b>${eur(Math.abs(pp))}</b> en préstamos pendientes.</span><button class="btn sm" data-act="prest">Ver</button></div>`);
  if(S.mov.length&&(!S.ultimaCopia||Date.now()-S.ultimaCopia>30*864e5))al.push(`<div class="alert"><span class="grow">${S.ultimaCopia?'Hace más de un mes de la última copia de seguridad.':'Aún no has guardado ninguna copia de seguridad.'} Descárgala y guárdala en tu ordenador o en Drive: si algo se borra por error, se puede recuperar con ella.</span><button class="btn sm" data-act="copia">Guardar copia</button></div>`);
  if(NUBE&&USER&&USER.admin&&pendientesN())al.push(`<div class="alert"><span class="grow"><b>${pendientesN()} solicitud${pendientesN()>1?'es':''} de acceso</b> esperando tu aprobación.</span><button class="btn sm" data-act="usu">Revisar</button></div>`);
  if(Math.abs(sumaPct()-100)>0.01)al.push(`<div class="alert bad"><span class="grow">Los porcentajes del presupuesto suman <b>${fmt(sumaPct(),1)}%</b> y deberían sumar 100%.</span><button class="btn sm" data-act="aj">Arreglar</button></div>`);
  else{const sg=sugerencia();if(sg&&sg.cambia)al.push(`<div class="alert info"><span class="grow">El presupuesto no se parece a lo que se gasta normalmente. Hay una sugerencia para ajustarlo.</span><button class="btn sm" data-act="sug">Ver sugerencia</button></div>`)}
  if(MES===mesDe(hoy())&&st.base>0){
    const cerca=CATS.filter(c=>c.g!=='AHORRO').map(c=>({c,p:st.base*(S.aj.pct[c.id]||0)/100,v:st.by[c.id]||0})).filter(x=>x.p>0&&x.v>=x.p*0.8&&x.v<=x.p+0.5);
    if(cerca.length)al.push(`<div class="alert"><span class="grow"><b>Cerca del límite:</b> ${cerca.map(x=>`${esc(x.c.n)} (${Math.round(x.v/x.p*100)}%, quedan ${eur(x.p-x.v,0)})`).join(' · ')}</span></div>`);
  }
  {const fx=fijosDelMes(MES).filter(f=>f.estado==='falta'||f.estado==='cambia');
   if(fx.length)al.push(`<div class="alert"><span class="grow"><b>Gastos fijos:</b> ${fx.map(f=>f.estado==='falta'?`${esc(f.f.nombre)} no ha llegado`:`${esc(f.f.nombre)} ha cambiado (${eur(f.pagado)} en vez de ${eur(f.f.importe)})`).join(' · ')}</span></div>`)}
  if(!st.ms.length)al.push(`<div class="alert info"><span class="grow">No hay movimientos en ${nombreMes(MES)}. Importa un extracto o añade gastos a mano.</span><button class="btn sm" data-act="imp">Importar extracto</button></div>`);
  $('#alerts').innerHTML=al.join('');
  $$('#alerts [data-act]').forEach(b=>b.onclick=()=>{const a=b.dataset.act;
    if(a==='sincat'){F.sinCat=true;F.cat='';go('movs')}
    if(a==='prest'){F.cat='PRESTAMO';F.todos=true;go('movs')}
    if(a==='copia')exportar();
    if(a==='imp')go('importar');
    if(a==='aj'||a==='sug')go('ajustes');
    if(a==='usu')go('usuarios');
  });
  // grupos
  $('#groups').innerHTML=GROUPS.map(g=>{
    const cs=CATS.filter(c=>c.g===g.id);
    const gp=cs.reduce((a,c)=>a+st.base*(S.aj.pct[c.id]||0)/100,0);
    const gg=cs.reduce((a,c)=>a+(st.by[c.id]||0),0);
    const pctG=cs.reduce((a,c)=>a+(+S.aj.pct[c.id]||0),0);
    return `<div class="card"><div class="ghead"><span class="t">${g.n} <span class="mut small">${pctG}%</span></span><span class="r num">${eur(gg,0)} de ${eur(gp,0)}</span></div>`+
      cs.map(c=>{
        const p=st.base*(S.aj.pct[c.id]||0)/100, v=st.by[c.id]||0, rest=p-v;
        if(c.id==='OTROS'&&!v)return '';
        const w=p>0?Math.min(100,v/p*100):(v>0?100:0);
        const over=v>p+0.5;
        const isSave=g.id==='AHORRO';
        const cerca=!isSave&&!over&&p>0&&v>=p*0.8;
        return `<div class="crow" data-cat="${c.id}"><div class="a"><span>${c.n}${cerca?` <span class="tag cash">${Math.round(v/p*100)}%</span>`:''}</span><span class="num"><b>${eur(v)}</b></span></div>
          <div class="bar ${over&&!isSave?'over':cerca?'warn':''}"><i style="width:${w}%"></i></div>
          <div class="b"><span>${S.aj.pct[c.id]||0}% · presupuesto ${eur(p,0)}</span><span class="num ${isSave?(rest>0.5?'mut':'pos'):(rest<-0.5?'neg':'')}">${isSave?(rest>0.5?'faltan '+eur(rest,0):'cumplido'):(rest<-0.5?'te pasas '+eur(-rest,0):'quedan '+eur(rest,0))}</span></div></div>`;
      }).join('')+'</div>';
  }).join('');
  $$('#groups .crow').forEach(r=>r.onclick=()=>{F.cat=r.dataset.cat;F.sinCat=false;F.todos=false;go('movs')});
  rFijosCard();rObjCard();
  // especiales
  const esp=SPECIAL.filter(c=>c.id!=='INGRESO').map(c=>({c,v:st.by[c.id]||0})).filter(x=>Math.abs(x.v)>0.009);
  const cuentas=S.cuentas.filter(c=>c.banco&&c.v!=null);
  $('#especiales').innerHTML=`<div class="sumline">`+
    (esp.length?esp.map(x=>`<div class="it"><div class="l">${x.c.n}</div><div class="v num">${eur(x.v)}</div></div>`).join(''):`<div class="it"><div class="l">Otros movimientos</div><div class="v mut small">Ninguno este mes</div></div>`)+
    `<span style="flex:1"></span>`+
    cuentas.map(c=>`<div class="it right"><div class="l">Saldo ${esc(c.n)} ${c.f?'al '+fFecha(c.f):''}</div><div class="v num">${eur(c.v)}</div></div>`).join('')+
    `</div><p class="small mut" style="margin:10px 0 0">Los traspasos entre cuentas, las retiradas de efectivo, los préstamos y los ajustes no cuentan como gasto. Lo pagado o cobrado en efectivo, o en cuentas sin extracto, se apunta en la pestaña «Añadir».</p>`;
}

/* ============ Gastos fijos previstos ============ */
const difMeses=(a,b)=>{const [y1,m1]=a.split('-').map(Number),[y2,m2]=b.split('-').map(Number);return (y2-y1)*12+(m2-m1)};
function tocaEnMes(f,m){const d=difMeses(f.desde||m,m);return d>=0&&d%(+f.cada||1)===0}
// 2 = coincide por texto, 1 = por categoría e importe parecido, 0 = no coincide
function coincideFijo(f,x){
  if(!(x.importe<0))return 0;
  if(f.texto&&norm(x.concepto+' '+(x.detalle||'')).includes(' '+norm(f.texto).trim()))return 2;
  return f.cat&&x.cat===f.cat&&Math.abs(-x.importe-f.importe)<=Math.max(2,f.importe*0.1)?1:0;
}
function fijosDelMes(m){
  const hoyM=mesDe(hoy()),dia=+hoy().slice(8,10);
  const usados=new Set();
  return (S.fijos||[]).filter(f=>tocaEnMes(f,m)).map(f=>{
    // el movimiento que mejor encaja: primero por texto, luego por importe más parecido
    const opc=S.mov.filter(x=>mesDe(x.fecha)===m&&!usados.has(x.id)).map(x=>({x,c:coincideFijo(f,x)})).filter(o=>o.c)
      .sort((a,b)=>b.c-a.c||Math.abs(-a.x.importe-f.importe)-Math.abs(-b.x.importe-f.importe));
    const cands=opc.length?[opc[0].x]:[];
    cands.forEach(x=>usados.add(x.id));
    const pagado=r2(-cands.reduce((a,x)=>a+x.importe,0));
    let estado;
    if(!cands.length)estado=(m<hoyM||(m===hoyM&&f.dia&&dia>(+f.dia)+3))?'falta':'pendiente';
    else estado=Math.abs(pagado-f.importe)>Math.max(1,f.importe*0.05)?'cambia':'ok';
    return {f,cands,pagado,estado};
  });
}
function rFijosCard(){
  const el=$('#fijosCard');const fs=fijosDelMes(MES);
  if(!(S.fijos||[]).length){el.innerHTML=`<div class="ghead"><span class="t">Gastos fijos previstos</span></div><div class="pad small mut">Apunta el alquiler, el garaje, las suscripciones… y el programa te avisará si alguno no llega o cambia de importe.<div class="toolbar" style="margin:10px 0 0"><button class="btn sm pri" id="fjDet">Detectarlos automáticamente</button><button class="btn sm" id="fjAj">Configurar</button></div></div>`;
    $('#fjDet').onclick=detectarFijos;$('#fjAj').onclick=()=>{go('ajustes');setTimeout(()=>$('#fijosAj').scrollIntoView({behavior:'smooth'}),50)};return}
  const prev=fs.reduce((a,x)=>a+x.f.importe,0),pag=fs.reduce((a,x)=>a+x.pagado,0);
  const tag={ok:'<span class="tag good">pagado</span>',cambia:'<span class="tag bad">ha cambiado</span>',pendiente:'<span class="tag">pendiente</span>',falta:'<span class="tag bad">no ha llegado</span>'};
  el.innerHTML=`<div class="ghead"><span class="t">Gastos fijos previstos</span><span class="r num">${eur(pag,0)} de ${eur(prev,0)}</span></div>`+
    (fs.length?fs.map(x=>`<div class="crow" style="cursor:default"><div class="a"><span>${esc(x.f.nombre)} ${tag[x.estado]}</span><span class="num">${x.cands.length?eur(x.pagado):eur(x.f.importe)}</span></div>
      <div class="b"><span>${x.estado==='cambia'?'Previsto '+eur(x.f.importe):x.estado==='ok'?fFecha(x.cands[0].fecha):(x.f.dia?'Sobre el día '+x.f.dia:'Durante el mes')}</span><span>${(+x.f.cada||1)>1?'cada '+x.f.cada+' meses':'mensual'}</span></div></div>`).join('')
    :'<div class="pad small mut">Este mes no toca ninguno.</div>')+`<div class="pad small" style="padding-top:8px"><button class="link" id="fjAj2">Editar gastos fijos</button></div>`;
  $('#fjAj2').onclick=()=>{go('ajustes');setTimeout(()=>$('#fijosAj').scrollIntoView({behavior:'smooth'}),50)};
}
function detectarFijos(){
  const hoyM=mesDe(hoy());const desde=addMes(hoyM,-6);
  const excl=new Set(['TRASPASO','EFECTIVO','AHORRO','DIEZMO','PRESTAMO','AJUSTE','INGRESO','']);
  const grupos={};
  for(const x of S.mov){const m=mesDe(x.fecha);if(x.importe>=0||m<desde||m>=hoyM||excl.has(x.cat||'')||isBizum(x.concepto))continue;
    const k=learnKey(x.concepto);if(!k||k.length<3)continue;(grupos[k]||(grupos[k]=[])).push(x)}
  const ya=new Set((S.fijos||[]).map(f=>norm(f.texto||'')));
  const sug=[];
  for(const k in grupos){const xs=grupos[k];const meses=[...new Set(xs.map(x=>mesDe(x.fecha)))].sort();if(meses.length<3||ya.has(norm(k)))continue;
    const porMes=meses.map(m=>-xs.filter(x=>mesDe(x.fecha)===m).reduce((a,x)=>a+x.importe,0));
    const med=mediana(porMes);if(med<5)continue;
    if(porMes.filter(v=>Math.abs(v-med)<=med*0.2).length<porMes.length*0.75)continue;
    const gaps=meses.slice(1).map((m,i)=>difMeses(meses[i],m));const cada=meses.length>=4?1:Math.max(1,Math.round(mediana(gaps)));
    const reales=xs.filter(x=>x.origen!=='excel');const dia=reales.length?Math.round(mediana(reales.map(x=>+x.fecha.slice(8,10)))):'';
    const cats={};xs.forEach(x=>cats[x.cat]=(cats[x.cat]||0)+1);const cat=Object.entries(cats).sort((a,b)=>b[1]-a[1])[0][0];
    sug.push({id:uid(),nombre:xs[xs.length-1].concepto.slice(0,40),texto:k,importe:r2(med),cada,dia,cat,desde:meses[meses.length-1]});
  }
  if(!sug.length){dialog('Detectar gastos fijos','<p>No he encontrado gastos que se repitan con el mismo importe en los últimos meses. Puedes añadirlos a mano en Ajustes.</p>',[{t:'Entendido',cls:'pri'}]);return}
  sug.sort((a,b)=>b.importe-a.importe);
  dialog('Gastos fijos encontrados',`<p class="small mut" style="margin-top:0">Se repiten con importe parecido en los últimos meses. Marca los que quieras vigilar:</p>`+
    sug.map((g,i)=>`<label class="pill" style="display:flex;margin:6px 0"><input type="checkbox" data-sg="${i}" checked> <span style="flex:1">${esc(g.nombre)} <span class="mut small">· ${catN(g.cat)}${g.cada>1?' · cada '+g.cada+' meses':''}</span></span><b class="num">${eur(g.importe)}</b></label>`).join(''),
   [{t:'Cancelar'},{t:'Añadir marcados',cls:'pri',fn:()=>{const sel=$$('[data-sg]').filter(c=>c.checked).map(c=>sug[+c.dataset.sg]);S.fijos=[...(S.fijos||[]),...sel];save();render();toast(sel.length+' gastos fijos añadidos')}}]);
}

/* ============ Objetivos de ahorro ============ */
const ahorradoObj=o=>r2((o.aport||[]).reduce((a,x)=>a+x.i,0));
function infoObj(o){const ah=ahorradoObj(o),falta=Math.max(0,r2(o.meta-ah));let alMes=null,meses=null;
  if(o.mesMeta){meses=difMeses(mesDe(hoy()),o.mesMeta)+1;if(meses>0&&falta>0)alMes=falta/meses}
  return {ah,falta,alMes,meses,pct:o.meta>0?Math.min(100,ah/o.meta*100):0}}
function objHtml(o,compacto){const i=infoObj(o);
  return `<div class="crow" style="cursor:default" data-o="${o.id}"><div class="a"><span>${esc(o.nombre)}${i.falta<=0?' <span class="tag good">conseguido</span>':''}</span><span class="num"><b>${eur(i.ah,0)}</b> <span class="mut small">de ${eur(o.meta,0)}</span></span></div>
    <div class="bar"><i style="width:${i.pct}%"></i></div>
    <div class="b"><span>${i.falta>0?'Faltan '+eur(i.falta,0):'¡Objetivo cumplido!'}${o.mesMeta?' · para '+nombreMes(o.mesMeta):''}</span><span>${i.alMes?'≈ '+eur(i.alMes,0)+' al mes':(o.mesMeta&&i.falta>0&&i.meses<=0?'<span class="neg">fecha pasada</span>':'')}</span></div>
    ${compacto?'':`<div class="toolbar" style="margin:8px 0 0"><button class="btn sm pri oa">＋ Aportar</button><button class="btn sm or">− Retirar</button><span class="sp"></span><button class="btn sm icon oe" title="Editar">✎</button><button class="btn sm icon dan od" title="Borrar">✕</button></div>`}</div>`}
function rObjCard(){
  const el=$('#objCard');const os=S.objetivos||[];
  el.innerHTML=`<div class="ghead"><span class="t">Objetivos de ahorro</span>${os.length?`<span class="r num">${eur(os.reduce((a,o)=>a+ahorradoObj(o),0),0)} ahorrados</span>`:''}</div>`+
    (os.length?os.map(o=>objHtml(o,true)).join(''):'<div class="pad small mut">Por ejemplo «Viaje en verano: 1.200 €». Ve apartando dinero y el programa te dice cuánto te falta y cuánto apartar al mes.</div>')+
    `<div class="pad small" style="padding-top:8px"><button class="link" id="objIr">${os.length?'Gestionar objetivos':'Crear un objetivo'}</button></div>`;
  $('#objIr').onclick=()=>{go('patri');setTimeout(()=>$('#objetivos').scrollIntoView({behavior:'smooth'}),50)};
}
function rObjetivos(){
  const el=$('#objetivos');const os=S.objetivos||[];
  el.innerHTML=`<div class="ghead"><span class="t">Objetivos de ahorro</span></div>`+
    (os.length?os.map(o=>objHtml(o,false)).join(''):'<div class="pad small mut">Aún no hay objetivos.</div>')+
    `<form class="toolbar pad" id="objAdd" style="margin:0;border-top:1px solid var(--line)" autocomplete="off"><input type="text" id="oNom" placeholder="Objetivo (p. ej. Viaje en verano)" required style="flex:2;min-width:160px"><input type="text" id="oMeta" placeholder="Meta €" inputmode="decimal" required style="width:100px"><input type="month" id="oMes" title="¿Para cuándo? (opcional)"><button class="btn pri">Crear</button></form>
    <p class="small mut pad" style="margin:0;padding-top:0">Son «huchas»: cuando apartes dinero para un objetivo, pulsa «Aportar». No cambian tus movimientos ni el resumen del mes.</p>`;
  $('#objAdd').onsubmit=e=>{e.preventDefault();const meta=parseNum($('#oMeta').value);if(!isFinite(meta)||meta<=0){toast('Meta no válida',true);return}
    (S.objetivos||(S.objetivos=[])).push({id:uid(),nombre:$('#oNom').value.trim(),meta:r2(meta),mesMeta:$('#oMes').value||'',aport:[]});save();rObjetivos();toast('Objetivo creado')};
  $$('#objetivos [data-o]').forEach(row=>{const o=os.find(x=>x.id===row.dataset.o);
    const mov=signo=>dialog((signo>0?'Aportar a «':'Retirar de «')+o.nombre+'»',`<div class="formgrid"><label>Importe</label><input type="text" id="oImp" inputmode="decimal"><label>Fecha</label><input type="date" id="oF" value="${hoy()}"></div>`,
      [{t:'Cancelar'},{t:signo>0?'Aportar':'Retirar',cls:'pri',fn:()=>{const v=parseNum($('#oImp').value);if(!isFinite(v)||v<=0){toast('Importe no válido',true);return false}
        (o.aport||(o.aport=[])).push({f:$('#oF').value,i:r2(v*signo)});save();rObjetivos();toast(signo>0?'Aportado':'Retirado')}}]);
    $('.oa',row).onclick=()=>mov(1);$('.or',row).onclick=()=>mov(-1);
    $('.oe',row).onclick=()=>dialog('Editar objetivo',`<div class="formgrid"><label>Nombre</label><input type="text" id="eoN" value="${esc(o.nombre)}"><label>Meta</label><input type="text" id="eoM" value="${fmt(o.meta)}" inputmode="decimal"><label>Para cuándo</label><input type="month" id="eoF" value="${o.mesMeta||''}"></div>
      ${(o.aport||[]).length?'<p class="small mut">Aportaciones: '+o.aport.slice(-6).map(a=>fFecha(a.f)+' '+(a.i>0?'+':'')+eur(a.i,0)).join(' · ')+'</p>':''}`,
      [{t:'Cancelar'},{t:'Guardar',cls:'pri',fn:()=>{const m=parseNum($('#eoM').value);if(!isFinite(m)||m<=0){toast('Meta no válida',true);return false}o.nombre=$('#eoN').value.trim()||o.nombre;o.meta=r2(m);o.mesMeta=$('#eoF').value||'';save();rObjetivos()}}]);
    $('.od',row).onclick=()=>confirmar('Borrar objetivo','¿Borrar «'+o.nombre+'»? Sus aportaciones se olvidan (no afecta a tus movimientos).','Borrar',()=>{S.objetivos=os.filter(x=>x!==o);save();rObjetivos()});
  });
}
