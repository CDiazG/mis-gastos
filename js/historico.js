// Cuentas Claras · Pestañas Histórico y Patrimonio
"use strict";
/* ============ Histórico ============ */
let YEAR=null;
let EVO='OCIO';
function rEvol(data){
  const opts=[...CATS.filter(c=>c.g!=='AHORRO'),{id:'SINCAT',n:'Sin categorizar'},{id:'__TOTAL',n:'Todo lo gastado'},{id:'__ING',n:'Ingresos'}];
  if(!opts.some(o=>o.id===EVO))EVO='__TOTAL';
  $('#evoCat').innerHTML=opts.map(o=>`<option value="${o.id}"${o.id===EVO?' selected':''}>${esc(o.n)}</option>`).join('');
  $('#evoCat').onchange=e=>{EVO=e.target.value;rEvol(data)};
  const d=data.slice(-24);const val=x=>EVO==='__TOTAL'?x.consumo:EVO==='__ING'?x.ingresos:(x.by[EVO]||0);
  const vs=d.map(val),con=d.filter(x=>!x.vacio).map(val);
  const media=con.length?con.reduce((a,b)=>a+b,0)/con.length:0;
  const W=1100,H=210,pl=46,pb=26,pt=10;const max=Math.max(1,...vs);
  const step=(W-pl-10)/d.length,bw=Math.max(4,step*0.6);const y=v=>pt+(H-pt-pb)*(1-Math.max(0,v)/max);
  let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolución mensual">`;
  for(let i=0;i<=4;i++){const v=max*i/4;svg+=`<line x1="${pl}" x2="${W-6}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${pl-6}" y="${y(v)+4}" font-size="11" text-anchor="end" fill="var(--muted)">${v>=1000?fmt(v/1000,1)+'k':fmt(v,0)}</text>`}
  d.forEach((x,i)=>{const cx=pl+step*i+step/2,v=vs[i];
    if(!x.vacio)svg+=`<rect x="${cx-bw/2}" y="${y(v)}" width="${bw}" height="${Math.max(0,y(0)-y(v))}" rx="2" fill="var(--acc)"><title>${nombreMes(x.m)} · ${eur(v)}</title></rect>`;
    if(i%2===0||d.length<14)svg+=`<text x="${cx}" y="${H-8}" font-size="11" text-anchor="middle" fill="var(--muted)">${nombreMesC(x.m)}</text>`});
  if(media>0)svg+=`<line x1="${pl}" x2="${W-6}" y1="${y(media)}" y2="${y(media)}" stroke="var(--warn)" stroke-dasharray="5 4" stroke-width="1.5"/><text x="${W-8}" y="${y(media)-5}" font-size="11" text-anchor="end" fill="var(--warn)">media ${eur(media,0)}</text>`;
  svg+='</svg>';
  const ult=d.filter(x=>!x.vacio).slice(-1)[0];
  $('#evoChart').innerHTML=svg+`<p class="small mut" style="margin:6px 0 0">${ult?`${nombreMes(ult.m)}: ${eur(val(ult),0)} · media de estos meses: ${eur(media,0)}`:''}</p>`;
}
function rHist(){
  const ms=mesesConDatos();
  if(!ms.length){$('#chart').innerHTML='<div class="empty">Todavía no hay datos.</div>';$('#years').innerHTML='';$('#histTable').innerHTML='';$('#catAvg').innerHTML='';return}
  const notas=S.notas||{};
  const all=[];for(let m=ms[0];m<=ms[ms.length-1];m=addMes(m,1))all.push(m);
  const data=all.map(m=>{const s=stats(m);return {m,...s,ahorroMes:r2(s.ingresos-s.consumo-s.diezmo),vacio:!s.ms.length}});
  // gráfico últimos 24 meses
  const d=data.slice(-24);const W=1100,Hh=240,pl=46,pb=26,pt=10;const max=Math.max(1,...d.map(x=>Math.max(x.ingresos,x.consumo)));
  const step=(W-pl-10)/d.length,bw=Math.max(4,step*0.34);
  const y=v=>pt+(Hh-pt-pb)*(1-v/max);
  let svg=`<svg viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Ingresos y gastos por mes">`;
  const ticks=4;for(let i=0;i<=ticks;i++){const v=max*i/ticks;svg+=`<line x1="${pl}" x2="${W-6}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${pl-6}" y="${y(v)+4}" font-size="11" text-anchor="end" fill="var(--muted)">${fmt(v/1000,1)}k</text>`}
  d.forEach((x,i)=>{const cx=pl+step*i+step/2;
    svg+=`<rect x="${cx-bw-1}" y="${y(x.ingresos)}" width="${bw}" height="${Math.max(0,y(0)-y(x.ingresos))}" rx="2" fill="var(--good)" opacity=".55"><title>${nombreMes(x.m)} · ingresos ${eur(x.ingresos)}</title></rect>`;
    svg+=`<rect x="${cx+1}" y="${y(x.consumo)}" width="${bw}" height="${Math.max(0,y(0)-y(x.consumo))}" rx="2" fill="var(--acc)"><title>${nombreMes(x.m)} · gastado ${eur(x.consumo)}</title></rect>`;
    if(i%2===0||d.length<14)svg+=`<text x="${cx}" y="${Hh-8}" font-size="11" text-anchor="middle" fill="var(--muted)">${nombreMesC(x.m)}</text>`});
  svg+='</svg>';
  $('#chart').innerHTML=`<h3 style="margin-bottom:8px">Últimos ${d.length} meses</h3>`+svg+`<div class="legend"><span><i style="background:var(--good);opacity:.55"></i>Ingresos</span><span><i style="background:var(--acc)"></i>Gastado</span></div>`;
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
    [...CATS,{id:'SINCAT',n:'Sin categorizar',g:'VARIABLES'}].map(c=>{const v=xs.reduce((a,x)=>a+(x.by[c.id]||0),0)/n;if(c.id==='SINCAT'&&v<0.5)return '';const p=ingM?v/ingM*100:0;const o=+S.aj.pct[c.id]||0;
      const bad=c.g!=='AHORRO'?p>o+0.5:false;
      return `<tr><td>${c.n}</td><td class="r num">${eur(v,0)}</td><td class="r num ${bad?'neg':''}">${fmt(p,1)}%</td><td class="r num mut">${o}%</td></tr>`}).join('')+
    `</tbody></table><p class="small mut" style="margin:8px 0 0">${xs.length} meses. En los meses antiguos del Excel, lo que estaba como «Caprichos» o «Necesidades» se ha repartido por el concepto; lo que no se ha podido identificar está en «Otros».</p>`;
  // tabla
  $('#histTable').innerHTML=`<thead><tr><th>Mes</th><th class="r">Ingresos</th><th class="r">Gastado</th><th class="r">Inversión</th><th class="r">Diezmo</th><th class="r">Ahorro del mes</th><th>Mayor gasto</th></tr></thead><tbody>`+
    data.slice().reverse().map(x=>{
      if(x.vacio)return `<tr><td style="text-transform:capitalize">${nombreMes(x.m)}</td><td colspan="6" class="mut small">${notas[x.m]?esc(notas[x.m]):'Sin datos'}</td></tr>`;
      const top=CONSUMO.map(c=>[c,x.by[c]||0]).sort((a,b)=>b[1]-a[1])[0];
      const t=x.ingresos?Math.round(x.ahorroMes/x.ingresos*100):null;
      return `<tr data-m="${x.m}" style="cursor:pointer"><td><span style="text-transform:capitalize">${nombreMes(x.m)}</span>${notas[x.m]?` <span class="tag">${esc(notas[x.m])}</span>`:''}</td><td class="r num">${eur(x.ingresos,0)}</td><td class="r num">${eur(x.consumo,0)}</td><td class="r num">${x.ahorro?eur(x.ahorro,0):'–'}</td><td class="r num">${x.diezmo?eur(x.diezmo,0):'–'}</td>
        <td class="r num ${x.ahorroMes<0?'neg':''}">${eur(x.ahorroMes,0)}${t!==null?` <span class="mut small">${t}%</span>`:''}</td><td class="small">${top&&top[1]>0?catN(top[0])+' · '+eur(top[1],0):''}</td></tr>`}).join('')+'</tbody>';
  $$('#histTable tr[data-m]').forEach(tr=>tr.onclick=()=>{MES=tr.dataset.m;go('resumen')});
  rEvol(data);
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
    S.cuentas.map((c,i)=>`<tr data-i="${i}"><td><input type="text" class="pn" value="${esc(c.n)}" style="width:150px">${c.banco?' <span class="tag">con extracto</span>':''}</td>
      <td class="r"><input type="text" class="pv num right" value="${c.v!=null?fmt(c.v):''}" placeholder="—" style="width:120px" inputmode="decimal"></td>
      <td class="small mut">${c.f?fFecha(c.f):''}</td><td><button class="btn sm icon pd" title="Quitar">✕</button></td></tr>`).join('')+
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
    <div style="margin-top:14px">${S.cuentas.filter(c=>c.v).map(c=>{const w=tot>0?Math.max(0,c.v/tot*100):0;return `<div class="small" style="display:flex;justify-content:space-between;margin-top:8px"><span>${esc(c.n)}</span><span class="num">${Math.round(w)}%</span></div><div class="bar"><i style="width:${w}%"></i></div>`}).join('')}</div>
    <p class="small mut" style="margin-top:14px">Para las cuentas sin extracto (inversión, oro…), pon el valor a mano cuando lo mires; se guarda con la fecha de hoy.</p>`;
}
