// Cuentas Claras · Pestaña Resumen, gastos fijos previstos y objetivos de ahorro
"use strict";
// Grupos del presupuesto que la persona ha plegado (se recuerda en este dispositivo)
const GR_PLEG=(()=>{try{const g=localStorage.getItem('mg-grupos-plegados');if(g===null&&matchMedia('(max-width:640px)').matches)return new Set(['FIJOS','VARIABLES','AHORRO']);return new Set(JSON.parse(g||'[]'))}catch(e){return new Set()}})();
document.addEventListener('click',e=>{const b=e.target.closest('#groups .gtog');if(!b)return;const c=b.closest('.grupo'),g=c.dataset.g;
  if(GR_PLEG.has(g))GR_PLEG.delete(g);else GR_PLEG.add(g);c.classList.toggle('plegado',GR_PLEG.has(g));b.setAttribute('aria-expanded',!GR_PLEG.has(g));
  try{localStorage.setItem('mg-grupos-plegados',JSON.stringify([...GR_PLEG]))}catch(_){}});
/* ============ Resumen ============ */
function rResumen(){
  const h=$('#hola');h.innerHTML=NUBE&&USER?`${avatarHtml(USER.uid,USER.nombre,USER.foto||'',26)}<span>Estás viendo las cuentas de <b>${esc(USER.nombre)}</b><span class="hmail"> · ${esc(USER.email)}</span></span>`:'';
  const st=stats(MES);
  const libre=st.ahorro;
  const tasa=st.ingresos>0?libre/st.ingresos:null;
  const obj=r2(presAhorro(st.base)+presFijo('INVERSION',st.base)),pObj=st.base>0?Math.round(obj/st.base*100):0;
  const logrado=obj>0&&libre>=obj-0.5,esteMes=MES===mesDe(hoy());
  $('#kpis').innerHTML=`
   <div class="card pad kpi"><div class="l">Ingresos</div><div class="v num pos">${eur(st.ingresos)}</div><div class="s">${st.ms.filter(x=>x.cat==='INGRESO').map(x=>(x.nomina||/n[oó]mina/i.test(x.concepto))?'Nómina':esc(verConcepto(x))).slice(0,2).join(' · ')||'Sin ingresos apuntados'}</div></div>
   <div class="card pad kpi"><div class="l">Gastado</div><div class="v num neg">${eur(st.consumo)}</div><div class="s">${st.base>0?Math.round(st.consumo/st.base*100)+'% de la base del presupuesto':'&nbsp;'}</div></div>
   <div class="card pad kpi${libre<-0.5?' kpirufo':''}">${libre<-0.5?`<span class="kmasc" title="Este mes ha salido más de lo que ha entrado">${mascota(38,'preocupa')}</span>`:''}<div class="l">Ahorro del mes</div><div class="v num ${libre<0?'neg':libre>0.5?'pos':''}">${eur(libre)}</div><div class="s">${tasa!==null?Math.round(tasa*100)+'% de lo ingresado · ':''}lo que no has gastado${st.by.INVERSION?` <br>${eur(st.by.INVERSION,0)} invertidos · ${eur(st.by.AHORRO,0)} en cuenta`:''}</div></div>
   <div class="card pad kpi ${logrado?'kok kpirufo':''}" id="kObj">${logrado?`<span class="kmasc">${mascota(38,'celebra')}</span>`:''}<div class="l">Objetivo de ahorro ${pObj?`<span class="mut">· ${pObj}%</span>`:''}</div>${!pObj?'<div class="v mut" style="font-size:16px">Sin objetivo</div><div class="s">Ponlo en Ajustes (Ahorro + Inversión)</div>':!st.base?'<div class="v mut" style="font-size:16px">Sin ingresos</div><div class="s">Aún no hay ingresos este mes</div>':logrado?`<div class="v num pos">✓ Conseguido</div><div class="s">${eur(obj,0)} de objetivo · te sobran ${eur(libre-obj,0)}${esteMes?' (de momento)':''}</div>`:`<div class="v num">${eur(obj)}</div><div class="s">Te faltan ${eur(obj-libre,0)} · llevas ${Math.max(0,Math.round(libre/obj*100))}%</div><div class="bar" style="margin-top:8px"><i style="width:${Math.max(0,Math.min(100,libre/obj*100))}%"></i></div>`}</div>`;
  // alertas
  const al=[];
  if(S.aj.revisarPrestamos){const pd=prestamosDudosos();if(!pd.length)S.aj.revisarPrestamos=false;
    else al.push(`<div class="alert"><span class="grow"><b>Revisa ${pd.length} movimiento${pd.length>1?'s':''} del banco</b> que ${pd.length>1?'están':'está'} como «Préstamo (me lo devuelven)» pero ${pd.length>1?'parecen cuotas':'parece una cuota'} de una hipoteca o de un préstamo que pagas tú (por ejemplo, «${esc(verConcepto(pd[0]))}»). Si es así, ponles su categoría (la hipoteca, en Vivienda) para que cuenten como gasto.</span><button class="btn sm" data-act="prestrev">Revisar</button><button class="btn sm" data-act="prestok">Están bien</button></div>`)}
  if(st.sinCat)al.push(`<div class="alert"><span class="grow"><b>${st.sinCat} movimiento${st.sinCat>1?'s':''} sin categoría</b> (${eur(-st.sinCatImp)}). Cuentan como «Sin categorizar»; ponles categoría para que el presupuesto sea exacto.</span><button class="btn sm" data-act="sincat">Revisar</button></div>`);
  if(!st.ingresos&&S.aj.base==='ingresos'&&st.ms.length)al.push(`<div class="alert info"><span class="grow">Este mes no tiene ingresos apuntados, así que el presupuesto sale a 0. Puedes usar una base fija en Ajustes.</span></div>`);
  const pp=prestamosPendientes();
  if(Math.abs(pp)>0.009)al.push(`<div class="alert info"><span class="grow">${pp>0?'Te deben':'Debes'} <b>${eur(Math.abs(pp))}</b> en préstamos pendientes.</span><button class="btn sm" data-act="prest">Ver</button></div>`);
  if(pref('avisoCopia')&&S.mov.length&&(!S.ultimaCopia||Date.now()-S.ultimaCopia>30*864e5))al.push(`<div class="alert"><span class="grow">${S.ultimaCopia?'Hace más de un mes de la última copia de seguridad.':'Aún no has guardado ninguna copia de seguridad.'} Descárgala y guárdala en tu ordenador o en Drive: si algo se borra por error, se puede recuperar con ella.</span><button class="btn sm" data-act="copia">Guardar copia</button></div>`);
  if(NUBE&&USER&&USER.admin&&pendientesN())al.push(`<div class="alert"><span class="grow"><b>${pendientesN()} solicitud${pendientesN()>1?'es':''} de acceso</b> esperando tu aprobación.</span><button class="btn sm" data-act="usu">Revisar</button></div>`);
  if(NUBE&&USER&&USER.admin&&bzNuevas())al.push(`<div class="alert info"><span class="grow"><b>${bzNuevas()} sugerencia${bzNuevas()>1?'s':''} nueva${bzNuevas()>1?'s':''}</b> en el buzón.</span><button class="btn sm" data-act="bz">Leer</button></div>`);
  if(st.base>0&&repartido(st.base)>st.base+0.5)al.push(`<div class="alert bad"><span class="grow">Este mes el presupuesto reparte <b>${eur(repartido(st.base),0)}</b> y la base es de ${eur(st.base,0)}: te pasas en ${eur(repartido(st.base)-st.base,0)} y no queda nada para el ahorro.</span><button class="btn sm" data-act="aj">Arreglar</button></div>`);
  else{const sg=sugerencia();if(sg&&sg.cambia&&!sg.aplicada&&S.aj.sugOculta!==mesDe(hoy()))al.push(`<div class="alert info"><span class="grow">El presupuesto no se parece a lo que se gasta normalmente. Hay una sugerencia para ajustarlo.</span><button class="btn sm" data-act="sugno">Ahora no</button><button class="btn sm" data-act="sug">Ver sugerencia</button></div>`)}
  if(pref('aviso80')&&MES===mesDe(hoy())&&st.base>0){
    const cerca=CATS.filter(c=>c.g!=='AHORRO').map(c=>({c,p:presupuestoCat(MES,c.id,st).p,v:st.by[c.id]||0})).filter(x=>x.p>0&&x.v>=x.p*0.8&&x.v<=x.p+0.5);
    if(cerca.length)al.push(`<div class="alert"><span class="grow"><b>Cerca del límite:</b> ${cerca.map(x=>`${esc(x.c.n)} (${Math.round(x.v/x.p*100)}%, quedan ${eur(x.p-x.v,0)})`).join(' · ')}</span></div>`);
  }
  {const hoyM=mesDe(hoy());const fin=new Date(hoyM+'-01');fin.setDate(0);const finAnt=fin.toISOString().slice(0,10);
   const tarde=S.cuentas.filter(c=>c.banco&&c.f&&c.f<finAnt);
   if(MES===hoyM&&tarde.length)al.push(`<div class="alert info"><span class="grow"><b>Extracto pendiente:</b> ${tarde.map(c=>`el último de ${esc(c.n)} es del ${fFecha(c.f)}`).join(' · ')}. Sube el de ${nombreMes(addMes(hoyM,-1))} cuando lo tengas.</span><button class="btn sm" data-act="imp">Importar</button></div>`)}
  {const pend=[];for(let k=1;k<=6;k++){const m=addMes(mesDe(hoy()),-k);const d=diezmoMes(m);if(d&&d.pendiente>0.5)pend.push([m,d.pendiente])}
   if(pend.length)al.push(`<div class="alert"><span class="grow"><b>Diezmo pendiente:</b> ${pend.map(([m,v])=>nombreMes(m)+' '+eur(v,0)).join(' · ')}</span><button class="btn sm" data-act="dz" data-m="${pend[0][0]}">Ver</button></div>`)}
  {const fx=fijosDelMes(MES).filter(f=>f.estado==='falta'||f.estado==='cambia');
   if(fx.length)al.push(`<div class="alert"><span class="grow"><b>Gastos fijos:</b> ${fx.map(f=>f.estado==='falta'?`${esc(f.f.nombre)} no ha llegado`:`${esc(f.f.nombre)} ha cambiado (${eur(f.pagado)} en vez de ${eur(f.f.importe)})`).join(' · ')}</span></div>`)}
  if(!st.ms.length)al.push(`<div class="alert info"><span class="grow">No hay movimientos en ${nombreMes(MES)}. Importa un extracto o añade gastos a mano.</span><button class="btn sm" data-act="imp">Importar extracto</button></div>`);
  $('#alerts').innerHTML=al.length>2?al.slice(0,1).join('')+`<details class="masav"><summary>${al.length-1} avisos más</summary><div class="alerts" style="margin-top:8px">${al.slice(1).join('')}</div></details>`:al.join('');
  $$('#alerts [data-act]').forEach(b=>b.onclick=()=>{const a=b.dataset.act;
    if(a==='sincat'){F.sinCat=true;F.cat='';go('movs')}
    if(a==='prest'){go('patri');setTimeout(()=>$('#prestamos').scrollIntoView({behavior:'smooth'}),50)}
    if(a==='copia')exportar();
    if(a==='imp')go('importar');
    if(a==='aj'||a==='sug')go('ajustes');
    if(a==='prestrev'){F.cat='PRESTAMO';F.sinCat=false;F.todos=true;F.q='';F.tag='';go('movs');return}if(a==='prestok'){S.aj.revisarPrestamos=false;save();rResumen();toast('Vale, no te lo vuelvo a decir');return}if(a==='sugno'){S.aj.sugOculta=mesDe(hoy());save();rResumen();toast('Vale, te lo recuerdo el mes que viene')}
    if(a==='usu')go('usuarios');
    if(a==='bz'){go('usuarios');setTimeout(()=>$('#bzAdmin').scrollIntoView({behavior:'smooth'}),80)}
    if(a==='dz'){MES=b.dataset.m;render()}
  });
  // grupos
  const mAnt=addMes(MES,-1),stAnt=stats(mAnt),hayAnt=stAnt.ms.length>0;
  const dz=diezmoMes(MES,st);
  const cmp=(id,v)=>{if(!hayAnt||!pref('comparar'))return '';const d=r2(v-(stAnt.by[id]||0));if(Math.abs(d)<1)return '';
    return ` · <span class="${d>0?'neg':'pos'}" title="Comparado con ${nombreMes(mAnt)}">${d>0?'▲':'▼'} ${eur(Math.abs(d),0)} vs ${MESES[+mAnt.slice(5)-1].slice(0,3)}</span>`};
  $('#groups').innerHTML=GROUPS.map(g=>{
    const cs=CATS.filter(c=>c.g===g.id);
    const gp=cs.reduce((a,c)=>a+presupuestoCat(MES,c.id,st).p,0);
    const gg=cs.reduce((a,c)=>a+(st.by[c.id]||0),0)+(g.id==='VARIABLES'?(st.by.SINCAT||0):0);
    const pctG=Math.round(cs.reduce((a,c)=>a+pctCat(c.id,st.base),0)*10)/10;
    return `<div class="card grupo${GR_PLEG.has(g.id)?' plegado':''}" data-g="${g.id}"><button type="button" class="ghead gtog" aria-expanded="${!GR_PLEG.has(g.id)}" title="Plegar o desplegar"><span class="t">${g.n} <span class="mut small">${pctG}%</span></span><span class="r num">${eur(gg,0)} de ${eur(gp,0)}<span class="chev" aria-hidden="true"></span></span><span class="bar gb ${g.id==='AHORRO'?'':gg>gp+0.5?'over':gp>0&&gg>=gp*0.8?'warn':'ok'}"><i style="width:${gp>0?Math.max(0,Math.min(100,gg/gp*100)):(gg>0?100:0)}%"></i></span></button>`+
      cs.map(c=>{
        const pc=presupuestoCat(MES,c.id,st),p=pc.p, v=st.by[c.id]||0, rest=p-v;
        if(c.id==='OTROS'&&!v)return '';
        const w=p>0?Math.min(100,v/p*100):(v>0?100:0);
        const over=v>p+0.5;
        const isSave=g.id==='AHORRO';
        const cerca=pref('aviso80')&&!isSave&&!over&&p>0&&v>=p*0.8;
        if(c.id==='AHORRO'){const wa=p>0?Math.max(0,Math.min(100,v/p*100)):0;
          return `<div class="crow" data-cat="AHORRO"><div class="a"><span><span class="ce">${catE(c.id)}</span>${c.n} <span class="tag" title="Se calcula solo: ingresos − gastos − inversión − diezmo">automático</span></span><span class="num ${v<0?'neg':''}"><b>${eur(v)}</b></span></div>
            <div class="bar ${rest>0.5?'':'ok'}"><i style="width:${wa}%"></i></div>
            <div class="b"><span class="bd">Lo que no gastas ni inviertes · lo que sobra del presupuesto (${fmt(pctAhorro(st.base),1)}%) · objetivo ${eur(p,0)}</span><span class="num ${rest>0.5?'mut':'pos'}">${rest>0.5?'faltan '+eur(rest,0):'✓ cumplido'}</span></div></div>`}
        if(c.id==='DIEZMO'&&dz){
          const w2=dz.debido>0?Math.min(100,dz.pagado/dz.debido*100):0;
          return `<div class="crow" data-cat="${c.id}"><div class="a"><span><span class="ce">${catE(c.id)}</span>${c.n} ${dz.pendiente>0.5?'<span class="tag cash">pendiente</span>':dz.debido>0?'<span class="tag good">al día</span>':''}</span><span class="num"><b>${eur(dz.pagado)}</b> <span class="mut small">de ${eur(dz.debido,0)}</span></span></div>
            <div class="bar"><i style="width:${w2}%"></i></div>
            <div class="b"><span>${dz.pct}% de los ingresos del mes</span>${dz.pendiente>0.5?`<button class="btn sm dzpag" type="button">Marcar ${eur(dz.pendiente,0)} pagado</button>`:'<span class="pos">pagado</span>'}</div></div>`}
        return `<div class="crow" data-cat="${c.id}"><div class="a"><span><span class="ce">${catE(c.id)}</span>${c.n}${cerca?` <span class="tag cash">${Math.round(v/p*100)}%</span>`:''}</span><span class="num"><b>${eur(v)}</b></span></div>
          <div class="bar ${isSave?'':over?'over':p>0&&v>=p*0.8?'warn':'ok'}"><i style="width:${w}%"></i></div>
          <div class="b"><span class="bd">${enEur(c.id)?'fijo':fmt(+S.aj.pct[c.id]||0,1)+'%'} · presupuesto ${eur(p,0)}${pc.extra?` <span class="tag acc" title="Lo que no gastaste los meses anteriores">↻ ${eur(pc.extra,0)} acumulado</span>`:''}${isSave?'':cmp(c.id,v)}</span><span class="num ${isSave?(rest>0.5?'mut':'pos'):(rest<-0.5?'neg':'')}">${isSave?(p<=0.5&&v<=0.5?'':rest>0.5?'faltan '+eur(rest,0):'✓ cumplido'):(rest<-0.5?'te pasas '+eur(-rest,0):'quedan '+eur(rest,0))}</span></div></div>`;
      }).join('')+(g.id==='VARIABLES'&&Math.abs(st.by.SINCAT||0)>0.009?`<div class="crow" data-cat="SINCAT"><div class="a"><span><span class="ce">❓</span>Sin categorizar <span class="tag cash">${st.sinCat}</span></span><span class="num"><b>${eur(st.by.SINCAT)}</b></span></div>
          <div class="b"><span>Sin presupuesto · pulsa para ponerles categoría${cmp('SINCAT',st.by.SINCAT)}</span></div></div>`:'')+'</div>';
  }).join('');
  $$('#groups .crow').forEach(r=>r.onclick=e=>{if(e.target.closest('.dzpag')||r.dataset.cat==='AHORRO')return;if(r.dataset.cat==='SINCAT'){F.cat='';F.sinCat=true}else{F.cat=r.dataset.cat;F.sinCat=false}F.todos=false;go('movs')});
  $$('#groups .dzpag').forEach(b=>b.onclick=()=>{aTipo='gasto';cCat='DIEZMO';cCatManual=true;aPago='__efectivo';go('efectivo');$('#cImp').value=fmt(dz.pendiente);$('#cCon').value='Diezmo '+nombreMes(MES);
    const ult=addMes(MES,1)+'-01';const d=new Date(ult);d.setDate(0);const fin=d.toISOString().slice(0,10);$('#cFecha').value=hoy()<fin?hoy():fin;$('#cImp').focus();toast('Revisa el importe y la forma de pago, y pulsa «Añadir gasto»')});
  rGrafico(st);rFijosCard();rObjCard();
  $('#fijosCard').classList.toggle('hide',!pref('verFijos'));$('#objCard').classList.toggle('hide',!pref('verObjetivos'));
  // especiales
  const esp=SPECIAL.filter(c=>c.id!=='INGRESO').map(c=>({c,v:st.by[c.id]||0})).filter(x=>Math.abs(x.v)>0.009);
  const cuentas=S.cuentas.filter(c=>c.banco&&c.v!=null);
  $('#especiales').innerHTML=`<div class="sumline">`+
    (esp.length?esp.map(x=>`<div class="it"><div class="l">${x.c.n}</div><div class="v num">${eur(x.v)}</div></div>`).join(''):`<div class="it"><div class="l">Otros movimientos</div><div class="v mut small">Ninguno este mes</div></div>`)+
    `<span style="flex:1"></span>`+
    cuentas.map(c=>`<div class="it right"><div class="l">Saldo ${esc(c.n)} ${c.f?'al '+fFecha(c.f):''}</div><div class="v num">${eur(c.v)}</div></div>`).join('')+
    `</div><p class="small mut" style="margin:10px 0 0">Los traspasos entre cuentas, las retiradas de efectivo, los préstamos y los ajustes no cuentan como gasto. Lo pagado o cobrado en efectivo, o en cuentas sin extracto, se apunta en la pestaña «Añadir».</p>`;
}

/* ---- Gráfico del mes ---- */
function barrasHtml(items){if(!items.length)return '';const tot=items.reduce((a,x)=>a+x.v,0),max=Math.max(...items.map(x=>x.v));
  return items.map(x=>`<div class="gbar" data-cat="${x.id}" data-tiph="${esc(tipHtml(esc(x.n),[['var(--acc)','Gastado',eur(x.v,0)],['','Del total',Math.round(x.v/tot*100)+' %'],...(x.p?[['','Presupuesto',eur(x.p,0)],['',x.v>x.p+0.5?'Te pasas':'Queda',eur(Math.abs(x.p-x.v),0),x.v>x.p+0.5?'neg':'pos']]:[]),...(x.id?[['','','<span class="mut" style="font-weight:400">Toca para ver los movimientos</span>']]:[])]))}"><span class="gn">${esc(x.n)}</span><span class="gt"><i style="width:${Math.max(1,x.v/max*100)}%"></i></span><span class="gv num">${eur(x.v,0)} <span class="mut">${Math.round(x.v/tot*100)}%</span></span></div>`).join('')}
function rGrafico(st){
  const el=$('#grafCard');
  const items=[...CATS.filter(c=>c.g!=='AHORRO').map(c=>({n:c.n,id:c.id,v:st.by[c.id]||0,p:presupuestoCat(MES,c.id,st).p})),{n:'Sin categorizar',id:'SINCAT',v:st.by.SINCAT||0}].filter(x=>x.v>0.5).sort((a,b)=>b.v-a.v);
  if(!items.length||!pref('verGrafico')){el.classList.add('hide');el.innerHTML='';return}
  el.classList.remove('hide');
  const tot=items.reduce((a,x)=>a+x.v,0);
  // rosco: lo gastado por categoría (las 6 mayores y «Resto»), lo invertido, los donativos y lo ahorrado
  const sl=items.slice(0,6).map(x=>({n:x.n,id:x.id,v:x.v,e:x.id==='SINCAT'?'❓':catE(x.id)})),rest=items.slice(6).reduce((a,x)=>a+x.v,0);
  if(rest>0.5)sl.push({n:'Resto',id:'',v:rest});
  const inv=st.by.INVERSION||0,don=(st.by.DONATIVOS||0)+(st.by.DIEZMO||0);
  if(inv>0.5)sl.push({n:'Inversión',id:'INVERSION',v:inv,e:catE('INVERSION'),col:'var(--c7)',tip:'Invertido'});
  if(don>0.5)sl.push({n:'Donativos y diezmo',id:'DONATIVOS',v:don,e:catE('DONATIVOS'),col:'var(--acc)',tip:'Donado'});
  if(st.ahorro>0.5)sl.push({n:'Ahorrado',id:'',v:st.ahorro,e:catE('AHORRO'),col:'var(--good)',tip:'Ahorrado'});
  const centro=st.ingresos>0&&st.ahorro>0.5?{t:Math.round(st.ahorro/st.ingresos*100)+' %',s:'ahorrado'}:null;
  el.innerHTML=`<div class="toolbar" style="margin:0 0 8px"><h3>En qué se ha ido el dinero</h3><span class="sp"></span><span class="small mut num">${eur(tot,0)} gastado en ${nombreMes(MES)}</span></div>`+rosco(sl,{centro});
  $$('#grafCard .gbar,#grafCard .rseg').forEach(r=>r.onclick=()=>{if(!r.dataset.cat)return;if(r.dataset.cat==='SINCAT'){F.cat='';F.sinCat=true}else{F.cat=r.dataset.cat;F.sinCat=false}F.todos=false;go('movs')});
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
    $('#fjDet').onclick=detectarFijos;$('#fjAj').onclick=()=>{go('ajustes',{sub:'fijos'})};return}
  const prev=fs.reduce((a,x)=>a+x.f.importe,0),pag=fs.reduce((a,x)=>a+x.pagado,0);
  const tag={ok:'<span class="tag good">pagado</span>',cambia:'<span class="tag bad">ha cambiado</span>',pendiente:'<span class="tag">pendiente</span>',falta:'<span class="tag bad">no ha llegado</span>'};
  el.innerHTML=`<div class="ghead"><span class="t">Gastos fijos previstos</span><span class="r num">${eur(pag,0)} de ${eur(prev,0)}</span></div>`+
    (fs.length?fs.map(x=>`<div class="crow" style="cursor:default"><div class="a"><span>${esc(x.f.nombre)} ${tag[x.estado]}</span><span class="num">${x.cands.length?eur(x.pagado):eur(x.f.importe)}</span></div>
      <div class="b"><span>${x.estado==='cambia'?'Previsto '+eur(x.f.importe):x.estado==='ok'?fFecha(x.cands[0].fecha):(x.f.dia?'Sobre el día '+x.f.dia:'Durante el mes')}</span><span>${(+x.f.cada||1)>1?'cada '+x.f.cada+' meses':'mensual'}</span></div></div>`).join('')
    :'<div class="pad small mut">Este mes no toca ninguno.</div>')+`<div class="pad small" style="padding-top:8px"><button class="link" id="fjAj2">Editar gastos fijos</button></div>`;
  $('#fjAj2').onclick=()=>{go('ajustes',{sub:'fijos'})};
}
function detectarFijos(){
  const hoyM=mesDe(hoy());const desde=addMes(hoyM,-6);
  const excl=new Set(['TRASPASO','EFECTIVO','AHORRO','INVERSION','DIEZMO','PRESTAMO','AJUSTE','INGRESO','']);
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
  return `<div class="crow ${i.falta<=0?'objok':''}" style="cursor:default" data-o="${o.id}"><div class="a"><span>${i.falta<=0?mascota(26,'celebra')+' ':''}${esc(o.nombre)}${i.falta<=0?' <span class="tag good">conseguido</span>':''}</span><span class="num"><b>${eur(i.ah,0)}</b> <span class="mut small">de ${eur(o.meta,0)}</span></span></div>
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
        const antes=infoObj(o).falta;(o.aport||(o.aport=[])).push({f:$('#oF').value,i:r2(v*signo)});save();rObjetivos();
        toast(antes>0&&infoObj(o).falta<=0?'🎉 ¡Objetivo «'+o.nombre+'» conseguido!':signo>0?'Aportado':'Retirado')}}]);
    $('.oa',row).onclick=()=>mov(1);$('.or',row).onclick=()=>mov(-1);
    $('.oe',row).onclick=()=>dialog('Editar objetivo',`<div class="formgrid"><label>Nombre</label><input type="text" id="eoN" value="${esc(o.nombre)}"><label>Meta</label><input type="text" id="eoM" value="${fmt(o.meta)}" inputmode="decimal"><label>Para cuándo</label><input type="month" id="eoF" value="${o.mesMeta||''}"></div>
      ${(o.aport||[]).length?'<p class="small mut">Aportaciones: '+o.aport.slice(-6).map(a=>fFecha(a.f)+' '+(a.i>0?'+':'')+eur(a.i,0)).join(' · ')+'</p>':''}`,
      [{t:'Cancelar'},{t:'Guardar',cls:'pri',fn:()=>{const m=parseNum($('#eoM').value);if(!isFinite(m)||m<=0){toast('Meta no válida',true);return false}o.nombre=$('#eoN').value.trim()||o.nombre;o.meta=r2(m);o.mesMeta=$('#eoF').value||'';save();rObjetivos()}}]);
    $('.od',row).onclick=()=>confirmar('Borrar objetivo','¿Borrar «'+o.nombre+'»? Sus aportaciones se olvidan (no afecta a tus movimientos).','Borrar',()=>{S.objetivos=os.filter(x=>x!==o);save();rObjetivos()});
  });
}

// En el móvil, «Gastos fijos» y «Objetivos» empiezan plegados; se abren tocando su título
document.addEventListener('click',e=>{const h=e.target.closest('.pleg>.ghead');if(!h||e.target.closest('button,a,input,select'))return;h.parentNode.classList.toggle('abierta')});
