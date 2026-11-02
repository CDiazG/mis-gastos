// Cuentas Claras · Pestañas Histórico y Patrimonio
"use strict";
/* ============ Histórico ============ */
let YEAR=null;
let EVO='OCIO';
const pasoRedondo=x=>{const e=Math.pow(10,Math.floor(Math.log10(x||1))),f=x/e;return (f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*e};
const IR_TXT=q=>`<span class="tipir">${matchMedia('(hover:none)').matches?'Toca otra vez':'Haz clic'} para ver ${q} →</span>`;
// Al pulsar un mes de una gráfica: el Resumen de ese mes o sus movimientos (con la categoría de la gráfica).
// En el móvil el primer toque enseña el bocadillo y el segundo lleva al sitio.
let _toque=null;
document.addEventListener('click',e=>{const b=e.target.closest('[data-ir][data-m]');if(!b)return;
  if(matchMedia('(hover:none)').matches&&_toque!==b){_toque=b;return}
  _toque=null;const m=b.dataset.m;if(!S.mov.some(x=>x.mes===m))return;
  MES=m;$('#tip')&&$('#tip').classList.remove('on');
  if(b.dataset.ir==='resumen'){go('resumen');return}
  const c=b.dataset.cat!==undefined?b.dataset.cat:EVO;
  F.todos=false;F.q='';F.tag='';F.sinCat=c==='SINCAT';F.cat=c==='__ING'?'INGRESO':c==='__TOTAL'||c==='SINCAT'?'':c;
  go('movs');scrollTo(0,0)});
const nombreMesCap=m=>{const n=nombreMes(m);return n.charAt(0).toUpperCase()+n.slice(1)};
function rEvol(data){
  const opts=[...CATS.filter(c=>c.g!=='AHORRO'),{id:'SINCAT',n:'Sin categorizar'},{id:'__TOTAL',n:'Todo lo gastado'},{id:'__ING',n:'Ingresos'}];
  if(!opts.some(o=>o.id===EVO))EVO='__TOTAL';
  $('#evoCat').innerHTML=opts.map(o=>`<option value="${o.id}"${o.id===EVO?' selected':''}>${esc(o.n)}</option>`).join('');
  $('#evoCat').onchange=e=>{EVO=e.target.value;rEvol(data)};
  const d=data.slice(-24);const val=x=>EVO==='__TOTAL'?x.consumo:EVO==='__ING'?x.ingresos:(x.by[EVO]||0);
  const vs=d.map(val),con=d.filter(x=>!x.vacio).map(val);
  const media=con.length?con.reduce((a,b)=>a+b,0)/con.length:0;
  const W=1100,H=210,pl=46,pb=26,pt=10;const pasoE=pasoRedondo(Math.max(1,...vs)/4),max=Math.ceil(Math.max(1,...vs)/pasoE)*pasoE;
  const step=(W-pl-10)/d.length,bw=Math.max(4,step*0.6);const y=v=>pt+(H-pt-pb)*(1-Math.max(0,v)/max);
  let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolución mensual">`;
  // color según la media: en gastos, por debajo verde, algo por encima ámbar y bastante por encima rojo (en ingresos al revés)
  const esIng=EVO==='__ING',color=v=>{if(!media)return 'var(--acc)';const r=v/media;return esIng?(r>=0.97?'var(--good)':r>=0.85?'var(--warn)':'var(--bad)'):(r<=1.03?'var(--good)':r<=1.2?'var(--warn)':'var(--bad)')};
  for(let v=0;v<=max+0.01;v+=pasoE){svg+=`<line x1="${pl}" x2="${W-6}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" stroke-dasharray="2 4"/><text x="${pl-6}" y="${y(v)+4}" font-size="11" text-anchor="end" fill="var(--muted)">${v>=1000?fmt(v/1000,1)+'k':fmt(v,0)}</text>`}
  d.forEach((x,i)=>{const cx=pl+step*i+step/2,v=vs[i],dm=v-media;
    svg+=`<rect class="hz" data-m="${x.m}" data-ir="movs" x="${(cx-step/2).toFixed(1)}" y="${pt}" width="${step.toFixed(1)}" height="${H-pt-pb}" rx="6" data-tiph="${esc(x.vacio?tipHtml(nombreMesCap(x.m),[['','Sin datos este mes','']]):tipHtml(nombreMesCap(x.m),[[color(v),esIng?'Ingresos':'Gastado',eur(v,0)],...(media?[['','Media',eur(media,0)],['',dm>=0?'▲ Más que la media':'▼ Menos que la media',eur(Math.abs(dm),0),(esIng?dm<0:dm>0)&&Math.abs(dm)>=1?'neg':'pos']]:[]),['','',IR_TXT('los movimientos')]]))}"/>`});
  d.forEach((x,i)=>{const cx=pl+step*i+step/2,v=vs[i];
    if(!x.vacio)svg+=`<rect class="crece" x="${cx-bw/2}" y="${y(v)}" width="${bw}" height="${Math.max(0,y(0)-y(v))}" rx="3" fill="${color(v)}" opacity=".85"/>`;
    if(i%2===0||d.length<14)svg+=`<text x="${cx}" y="${H-8}" font-size="11" text-anchor="middle" fill="var(--muted)">${nombreMesC(x.m)}</text>`});
  if(media>0)svg+=`<line x1="${pl}" x2="${W-6}" y1="${y(media)}" y2="${y(media)}" stroke="var(--ink)" opacity=".55" stroke-dasharray="6 5" stroke-width="1.5"/><text x="${W-8}" y="${y(media)<20?y(media)+14:y(media)-5}" font-size="11" text-anchor="end" fill="var(--ink)" paint-order="stroke" stroke="var(--card)" stroke-width="3">media ${eur(media,0)}</text>`;
  svg+='</svg>';
  const ult=d.filter(x=>!x.vacio).slice(-1)[0];
  $('#evoChart').innerHTML=svg+`<div class="legend">${esIng?'<span><i style="background:var(--good)"></i>En la media o más</span><span><i style="background:var(--warn)"></i>Algo menos</span><span><i style="background:var(--bad)"></i>Bastante menos</span>':'<span><i style="background:var(--good)"></i>En la media o menos</span><span><i style="background:var(--warn)"></i>Algo más (hasta +20%)</span><span><i style="background:var(--bad)"></i>Bastante más</span>'}<span><i class="lin" style="background:var(--ink);opacity:.55"></i>Media</span></div>
    <p class="small mut" style="margin:6px 0 0">${ult?`${nombreMes(ult.m)}: ${eur(val(ult),0)} · media de estos meses: ${eur(media,0)}`:''}</p>`;
}
function rHist(){
  const ms=mesesConDatos();
  if(!ms.length){$('#chart').innerHTML='<div class="empty">Todavía no hay datos.</div>';$('#years').innerHTML='';$('#histTable').innerHTML='';$('#catAvg').innerHTML='';return}
  const notas=S.notas||{};
  const all=[];for(let m=ms[0];m<=ms[ms.length-1];m=addMes(m,1))all.push(m);
  const data=all.map(m=>{const s=stats(m);return {m,...s,ahorroMes:r2(s.ingresos-s.consumo-s.diezmo),vacio:!s.ms.length}});
  // gráfico últimos 24 meses
  const d=data.slice(-24);const W=1100,Hh=260,pl=46,pb=26,pt=14;
  // eje con valores redondos (500, 1.000…) que pasan por el cero
  const max0=Math.max(1,...d.map(x=>Math.max(x.ingresos,x.consumo,x.ahorroMes))),min0=Math.min(0,...d.filter(x=>!x.vacio).map(x=>x.ahorroMes));
  const paso=pasoRedondo((max0-min0)/4),max=Math.ceil(max0/paso)*paso,min=Math.floor(min0/paso)*paso;
  const step=(W-pl-10)/d.length,bw=Math.max(4,step*0.34);
  const y=v=>pt+(Hh-pt-pb)*(max-v)/(max-min);
  const y0=y(0);
  let svg=`<svg viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Ingresos, gastos y ahorro por mes" class="hchart">
    <defs><linearGradient id="gIng" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--good)" stop-opacity=".55"/><stop offset="1" stop-color="var(--good)" stop-opacity=".25"/></linearGradient>
    <linearGradient id="gGas" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--acc)"/><stop offset="1" stop-color="var(--acc)" stop-opacity=".7"/></linearGradient>
    <clipPath id="cpPos"><rect x="0" y="0" width="${W}" height="${y0}"/></clipPath><clipPath id="cpNeg"><rect x="0" y="${y0}" width="${W}" height="${Hh}"/></clipPath></defs>`;
  for(let v=min;v<=max+0.01;v+=paso){svg+=`<line x1="${pl}" x2="${W-6}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" stroke-dasharray="2 4"/><text x="${pl-6}" y="${y(v)+4}" font-size="11" text-anchor="end" fill="var(--muted)">${Math.abs(v)>=1000?fmt(v/1000,Math.abs(v)%1000?1:0)+'k':fmt(v,0)}</text>`}
  if(min<0)svg+=`<line x1="${pl}" x2="${W-6}" y1="${y(0)}" y2="${y(0)}" stroke="var(--muted)" stroke-width="1.2"/>`;
  // franjas por mes: al pasar por encima se resaltan y sale el bocadillo con el detalle
  d.forEach((x,i)=>{const cx=pl+step*i+step/2,am=x.ahorroMes;
    svg+=`<rect class="hz" data-m="${x.m}" data-ir="resumen" x="${(cx-step/2).toFixed(1)}" y="${pt}" width="${step.toFixed(1)}" height="${Hh-pt-pb}" rx="6" data-tiph="${esc(x.vacio?tipHtml(nombreMesCap(x.m),[['','Sin datos este mes','']]):tipHtml(nombreMesCap(x.m),[['var(--good)','Ingresos',eur(x.ingresos,0)],['var(--acc)','Gastado',eur(x.consumo,0)],[am<0?'var(--bad)':'var(--good)',am<0?'Gastaste de más':'Ahorro',eur(am,0)+(x.ingresos?` · ${Math.round(am/x.ingresos*100)} %`:''),am<0?'neg':'pos'],['','',IR_TXT('el resumen del mes')]]))}"/>`});
  d.forEach((x,i)=>{const cx=pl+step*i+step/2;
    svg+=`<rect class="crece" x="${cx-bw-1}" y="${y(x.ingresos)}" width="${bw}" height="${Math.max(0,y(0)-y(x.ingresos))}" rx="3" fill="url(#gIng)"></rect>`;
    svg+=`<rect class="crece" x="${cx+1}" y="${y(x.consumo)}" width="${bw}" height="${Math.max(0,y(0)-y(x.consumo))}" rx="3" fill="url(#gGas)"></rect>`;
    if(i%2===0||d.length<14)svg+=`<text x="${cx}" y="${Hh-8}" font-size="11" text-anchor="middle" fill="var(--muted)">${nombreMesC(x.m)}</text>`});
  // línea del ahorro del mes, sobre el mismo eje en euros (los meses sin datos cortan la línea)
  // verde por encima de cero (ahorras) y rojo por debajo (sale más de lo que entra), con el área sombreada
  let tramo=[],lineas='',areas='',puntos='';const cerrarTramo=()=>{if(tramo.length>1){const pts=tramo.join(' '),x0=tramo[0].split(',')[0],x1=tramo[tramo.length-1].split(',')[0];
      const area=`<polygon points="${x0},${y0.toFixed(1)} ${pts} ${x1},${y0.toFixed(1)}"`;
      areas+=`${area} fill="var(--good)" opacity=".13" clip-path="url(#cpPos)"/>${area} fill="var(--bad)" opacity=".16" clip-path="url(#cpNeg)"/>`;
      const lin=`<polyline class="traza" pathLength="1" points="${pts}" fill="none" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"`;
      lineas+=`${lin} stroke="var(--good)" clip-path="url(#cpPos)"/>${lin} stroke="var(--bad)" clip-path="url(#cpNeg)"/>`}tramo=[]};
  d.forEach((x,i)=>{if(x.vacio){cerrarTramo();return}const cx=pl+step*i+step/2,cy=y(x.ahorroMes);tramo.push(`${cx.toFixed(1)},${cy.toFixed(1)}`);
    puntos+=`<circle class="punto" cx="${cx}" cy="${cy}" r="4.5" fill="${x.ahorroMes<0?'var(--bad)':'var(--good)'}" stroke="var(--card)" stroke-width="2"/>`});
  cerrarTramo();svg+=areas+lineas+puntos;
  const ult=[...d].reverse().find(x=>!x.vacio);
  if(ult){const i=d.indexOf(ult),cx=pl+step*i+step/2;svg+=`<text x="${Math.min(cx,W-60)}" y="${Math.max(12,y(ult.ahorroMes)-10)}" font-size="12" font-weight="650" text-anchor="middle" fill="${ult.ahorroMes<0?'var(--bad)':'var(--good)'}" paint-order="stroke" stroke="var(--card)" stroke-width="4">${eur(ult.ahorroMes,0)}</text>`}
  svg+='</svg>';
  $('#chart').innerHTML=`<h3 style="margin-bottom:8px">Últimos ${d.length} meses</h3>`+svg+`<div class="legend"><span><i style="background:var(--good);opacity:.45"></i>Ingresos</span><span><i style="background:var(--acc)"></i>Gastado</span><span><i class="lin" style="background:var(--good)"></i>Ahorro del mes</span><span><i class="lin" style="background:var(--bad)"></i>Mes en negativo</span><span class="mut">Toca o pasa el ratón por un mes para ver el detalle</span></div>`;
  // años
  const years=[...new Set(all.map(m=>m.slice(0,4)))].reverse();
  $('#years').innerHTML=years.map(yr=>{const xs=data.filter(x=>x.m.startsWith(yr)&&!x.vacio);if(!xs.length)return '';
    const I=xs.reduce((a,x)=>a+x.ingresos,0),G=xs.reduce((a,x)=>a+x.consumo,0),D=xs.reduce((a,x)=>a+x.diezmo,0);
    return `<div class="card pad"><div class="mut small">${yr} · ${xs.length} meses con datos</div><div style="font-size:20px;font-weight:650;margin:2px 0" class="num">${eur(G/xs.length,0)}<span class="small mut" style="font-weight:400"> /mes gastado</span></div>
      <div class="small">Ingresos ${eur(I,0)} · gastado ${eur(G,0)}</div><div class="small">Ahorro ${I?Math.round((I-G-D)/I*100):0}% de lo ingresado</div></div>`}).join('');
  // medias por categoría
  if(!YEAR||!years.includes(YEAR))YEAR=years[0];
  $('#yearSel').innerHTML=years.map(y=>`<option${y===YEAR?' selected':''}>${y}</option>`).join('')+'<option value="12m"'+(YEAR==='12m'?' selected':'')+'>Últimos 12 meses</option>';
  $('#yearSel').onchange=e=>{YEAR=e.target.value;rHist()};
  const xs=(YEAR==='12m'?data.slice(-12):data.filter(x=>x.m.startsWith(YEAR))).filter(x=>!x.vacio);
  const n=xs.length||1;const ingM=xs.reduce((a,x)=>a+x.ingresos,0)/n;
  $('#catAvg').innerHTML=`<table><thead><tr><th>Categoría</th><th class="r">Media al mes</th><th class="r">% de ingresos</th><th class="r">Objetivo</th></tr></thead><tbody>`+
    [...CATS,{id:'SINCAT',n:'Sin categorizar',g:'VARIABLES'}].map(c=>{const v=xs.reduce((a,x)=>a+(x.by[c.id]||0),0)/n;if(c.id==='SINCAT'&&v<0.5)return '';const p=ingM?v/ingM*100:0;const o=Math.round(pctCat(c.id,ingM)*10)/10;
      const bad=c.g!=='AHORRO'?p>o+0.5:false;
      return `<tr><td>${c.n}</td><td class="r num">${eur(v,0)}</td><td class="r num ${bad?'neg':''}">${fmt(p,1)}%</td><td class="r num mut">${o}%</td></tr>`}).join('')+
    `</tbody></table><p class="small mut" style="margin:8px 0 0">${xs.length} meses. En los meses antiguos del Excel, lo que estaba como «Caprichos» o «Necesidades» se ha repartido por el concepto; lo que no se ha podido identificar está en «Otros».</p>`;
  // tabla
  $('#histTable').innerHTML=`<thead><tr><th>Mes</th><th class="r">Ingresos</th><th class="r">Gastado</th><th class="r">Invertido</th><th class="r">Diezmo</th><th class="r">Ahorro del mes</th><th>Mayor gasto</th></tr></thead><tbody>`+
    data.slice().reverse().map(x=>{
      if(x.vacio)return `<tr><td style="text-transform:capitalize">${nombreMes(x.m)}</td><td colspan="6" class="mut small">${notas[x.m]?esc(notas[x.m]):'Sin datos'}</td></tr>`;
      const top=CONSUMO.map(c=>[c,x.by[c]||0]).sort((a,b)=>b[1]-a[1])[0];
      const t=x.ingresos?Math.round(x.ahorroMes/x.ingresos*100):null;
      return `<tr data-m="${x.m}" style="cursor:pointer"><td><span style="text-transform:capitalize">${nombreMes(x.m)}</span>${notas[x.m]?` <span class="tag">${esc(notas[x.m])}</span>`:''}</td><td class="r num">${eur(x.ingresos,0)}</td><td class="r num">${eur(x.consumo,0)}</td><td class="r num">${x.by.INVERSION?eur(x.by.INVERSION,0):'–'}</td><td class="r num">${x.diezmo?eur(x.diezmo,0):'–'}</td>
        <td class="r num ${x.ahorroMes<0?'neg':''}">${eur(x.ahorroMes,0)}${t!==null?` <span class="mut small">${t}%</span>`:''}</td><td class="small">${top&&top[1]>0?catN(top[0])+' · '+eur(top[1],0):''}</td></tr>`}).join('')+'</tbody>';
  $$('#histTable tr[data-m]').forEach(tr=>tr.onclick=()=>{MES=tr.dataset.m;go('resumen')});
  rEvol(data);rVsAnio();rTagsCard();
}

/* ============ Patrimonio ============ */
function rPrestamos(){
  const el=$('#prestamos');const ps=prestamosPorPersona();
  const tot=r2(ps.reduce((a,p)=>a+p.pendiente,0));
  el.innerHTML=`<div class="ghead"><span class="t">Préstamos</span>${ps.length?`<span class="r num">${tot>0?'Te deben '+eur(tot,0):tot<0?'Debes '+eur(-tot,0):'Todo devuelto'}</span>`:''}</div>`+
    (ps.length?ps.map((p,i)=>`<div class="crow" data-i="${i}"><div class="a"><span>${esc(p.persona)} ${p.pendiente>0.5?'<span class="tag cash">pendiente</span>':p.pendiente<-0.5?'<span class="tag bad">le debes</span>':'<span class="tag good">devuelto</span>'}</span><span class="num"><b>${eur(Math.abs(p.pendiente))}</b></span></div>
      <div class="b"><span>Prestado ${eur(p.prestado,0)} · devuelto ${eur(p.devuelto,0)} · desde ${fFecha(p.movs.map(x=>x.fecha).sort()[0])}</span>${p.pendiente>0.5?`<button class="btn sm pdev" type="button">Me lo ha devuelto</button>`:''}</div>
      <div class="det hide pdet" style="margin-top:6px">${p.movs.sort((a,b)=>a.fecha.localeCompare(b.fecha)).map(x=>`${fFecha(x.fecha)} · ${esc(x.concepto)} · <span class="num">${x.importe>0?'+':''}${eur(x.importe)}</span>`).join('<br>')}</div></div>`).join('')
    :'<div class="pad small mut">Cuando prestes dinero, apúntalo con la categoría «Préstamo» y el nombre de la persona. Aquí verás quién te debe y cuánto.</div>');
  $$('#prestamos .crow').forEach(r=>{const p=ps[+r.dataset.i];
    r.onclick=e=>{if(e.target.closest('.pdev'))return;$('.pdet',r).classList.toggle('hide')};
    const b=$('.pdev',r);if(b)b.onclick=()=>{aTipo='ingreso';cCat='PRESTAMO';cCatManual=true;go('efectivo');$('#cImp').value=fmt(p.pendiente);$('#cCon').value='Devolución préstamo '+p.persona;$('#aPer').value=p.persona;$('#aPerW').classList.remove('hide');$('#cImp').focus();toast('Elige cómo te lo devolvió y pulsa «Añadir ingreso»')};
  });
}
function rPatri(){
  rObjetivos();rPrestamos();
  $('#patTable').innerHTML=`<thead><tr><th>Cuenta</th><th class="r">Saldo</th><th>Actualizado</th><th></th></tr></thead><tbody>`+
    (S.cuentas.length?'':'<tr><td colspan="4" class="small mut" style="padding:14px">Aún no tienes cuentas. Se crean solas al importar un extracto, o añádelas aquí (por ejemplo, una cuenta de ahorro o el oro).</td></tr>')+
    S.cuentas.map((c,i)=>`<tr data-i="${i}"><td><input type="text" class="pn" value="${esc(c.n)}" style="width:150px">${c.banco||c.cartera?' <span class="tag">con extracto</span>':''}</td>
      <td class="r"><input type="text" class="pv num right" value="${c.v!=null?fmt(c.v):''}" placeholder="—" style="width:120px" inputmode="decimal"></td>
      <td class="small mut">${c.f?fFecha(c.f):''}</td><td><button class="btn sm icon pd" title="Quitar">✕</button></td></tr>`+
      (c.cartera&&c.cartera.pos.length?`<tr class="cartrow"><td colspan="4"><details class="cartera"><summary>${c.cartera.pos.length} valores en cartera · ${fFecha(c.cartera.f)}</summary>${carteraHtml(c.cartera.pos.slice().sort((a,b)=>b.v-a.v),c.cartera.pos.reduce((a,x)=>a+x.v,0)||1)}</details></td></tr>`:'')).join('')+
    `</tbody><tfoot><tr><td colspan="4"><button class="btn sm" id="pAdd">+ Añadir cuenta</button></td></tr></tfoot>`;
  $$('#patTable tr[data-i]').forEach(tr=>{const c=S.cuentas[+tr.dataset.i];
    $('.pn',tr).onchange=e=>{const old=c.n;c.n=e.target.value.trim()||old;S.mov.forEach(x=>{if(x.cuenta===old)x.cuenta=c.n});save()};
    $('.pv',tr).onchange=e=>{const v=parseNum(e.target.value);c.v=isFinite(v)?r2(v):null;c.f=hoy();save();rPatri()};
    $('.pd',tr).onclick=()=>confirmar('Quitar cuenta','¿Quitar «'+c.n+'» de la lista? Los movimientos no se borran.','Quitar',()=>{S.cuentas.splice(+tr.dataset.i,1);save();rPatri()});
  });
  $('#pAdd').onclick=()=>{S.cuentas.push({n:'Nueva cuenta',v:null,f:null});save();rPatri()};
  const tot=S.cuentas.reduce((a,c)=>a+(c.v||0),0);
  const pp=prestamosPendientes();
  $('#patTotal').innerHTML=`<div class="mut small">Total</div><div style="font-size:30px;font-weight:650;letter-spacing:-.02em" class="num">${eur(tot)}</div>
    ${Math.abs(pp)>0.009?`<p class="small" style="margin:8px 0 0">${pp>0?'Más':'Menos'} ${eur(Math.abs(pp))} de préstamos pendientes de devolver.</p>`:''}
    <div style="margin-top:14px">${S.cuentas.filter(c=>c.v).map(c=>{const w=tot>0?Math.max(0,c.v/tot*100):0;return `<div class="patb" data-tiph="${esc(tipHtml(esc(c.n),[['var(--acc)','Saldo',eur(c.v)],['','Del total',fmt(w,1)+' %'],...(c.f?[['','Actualizado',fFecha(c.f)]]:[])]))}"><div class="small" style="display:flex;justify-content:space-between;margin-top:8px"><span>${esc(c.n)}</span><span class="num">${Math.round(w)}%</span></div><div class="bar"><i style="width:${w}%"></i></div></div>`}).join('')}</div>
    <p class="small mut" style="margin-top:14px">Para las cuentas sin extracto (inversión, oro…), pon el valor a mano cuando lo mires; se guarda con la fecha de hoy.</p>`;
}

/* ---- Este mes frente al mismo mes del año pasado ---- */
let VS_MES='';
function rVsAnio(){
  const el=$('#vsAnio');const ms=mesesConDatos().filter(m=>S.mov.some(x=>x.mes===addMes(m,-12)));
  if(!ms.length){el.innerHTML='<h3>Frente al año pasado</h3><p class="small mut" style="margin:6px 0 0">Cuando tengas el mismo mes de dos años distintos, aquí verás si gastas más o menos que hace un año.</p>';return}
  if(!ms.includes(VS_MES))VS_MES=ms.includes(MES)?MES:ms[ms.length-1];
  const a=stats(VS_MES),b=stats(addMes(VS_MES,-12)),ya=VS_MES.slice(0,4),yb=String(+ya-1);
  const dif=(v1,v0,bueno)=>{const d=r2(v1-v0);if(Math.abs(d)<1)return '<span class="mut">=</span>';const mejor=bueno==='menos'?d<0:d>0;return `<span class="${mejor?'pos':'neg'}">${d>0?'▲':'▼'} ${eur(Math.abs(d),0)}</span>`};
  const fila=(n,v1,v0,bueno,b)=>`<tr${b?' style="font-weight:650"':''}><td>${n}</td><td class="r num">${eur(v0,0)}</td><td class="r num">${eur(v1,0)}</td><td class="r num">${dif(v1,v0,bueno)}</td></tr>`;
  const cats=[...CATS.filter(c=>c.g!=='AHORRO'),{id:'SINCAT',n:'Sin categorizar'}].filter(c=>Math.abs(a.by[c.id]||0)>0.5||Math.abs(b.by[c.id]||0)>0.5);
  el.innerHTML=`<div class="toolbar" style="margin:0 0 8px"><h3>Frente al año pasado</h3><span class="sp"></span><select id="vsSel">${ms.slice().reverse().map(m=>`<option value="${m}"${m===VS_MES?' selected':''}>${nombreMes(m)}</option>`).join('')}</select></div>
    <div class="tablewrap"><table class="vstab"><thead><tr><th></th><th class="r">${MESES[+VS_MES.slice(5)-1].slice(0,3)} ${yb}</th><th class="r">${MESES[+VS_MES.slice(5)-1].slice(0,3)} ${ya}</th><th class="r">Dif.</th></tr></thead><tbody>
    ${fila('Ingresos',a.ingresos,b.ingresos,'mas',1)}${fila('Gastado',a.consumo,b.consumo,'menos',1)}${fila('Ahorro',a.ahorro,b.ahorro,'mas',1)}
    ${cats.map(c=>fila(c.n,a.by[c.id]||0,b.by[c.id]||0,'menos')).join('')}</tbody></table></div>
    <p class="small mut" style="margin:8px 0 0">▼ en verde = gastas menos que hace un año; ▲ en rojo = gastas más.</p>`;
  $('#vsSel').onchange=e=>{VS_MES=e.target.value;rVsAnio()};
}
/* ---- Etiquetas: cuánto ha costado cada evento ---- */
function rTagsCard(){
  const el=$('#tagsCard');const ts=todasEtiquetas();
  if(!ts.length){el.innerHTML='<h3>Etiquetas</h3><p class="small mut" style="margin:6px 0 0">Etiqueta gastos de distintas categorías con un mismo nombre (por ejemplo «Boda Ana» o «Viaje a Roma») para ver aquí cuánto ha costado en total. Se etiqueta al añadir un gasto, con ✎ en Movimientos o marcando varios y pulsando «Etiquetar».</p>';return}
  const rows=ts.map(t=>{const xs=S.mov.filter(x=>tagsDe(x).some(y=>norm(y)===norm(t)));const fs=xs.map(x=>x.fecha).sort();
    return {t,n:xs.length,g:r2(-xs.reduce((a,x)=>a+(x.cat==='INGRESO'?0:x.importe),0)),d:fs[0],h:fs[fs.length-1]}}).sort((a,b)=>b.h.localeCompare(a.h));
  el.innerHTML=`<h3>Etiquetas</h3><p class="small mut" style="margin:4px 0 8px">Lo que ha costado cada evento, sumando todas sus categorías. Pulsa una para ver sus movimientos.</p>`+
    rows.map(r=>`<div class="crow" data-tag="${esc(r.t)}"><div class="a"><span><span class="tag tg">#${esc(r.t)}</span></span><span class="num"><b>${eur(r.g)}</b></span></div><div class="b"><span>${r.n} movimiento${r.n>1?'s':''} · ${fFecha(r.d)}${r.d!==r.h?' – '+fFecha(r.h):''}</span></div></div>`).join('');
  $$('#tagsCard [data-tag]').forEach(r=>r.onclick=()=>{F.tag=r.dataset.tag;F.q='';F.cat='';F.sinCat=false;go('movs')});
}
