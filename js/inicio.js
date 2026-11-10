// Cuentas Claras · Pestaña Inicio: visión general en tarjetas que se pliegan
"use strict";
/* ============ Inicio ============ */
const INI_PLEGADAS=(()=>{try{return new Set(JSON.parse(localStorage.getItem('mg-inicio-plegadas')||'[]'))}catch(e){return new Set()}})();
function guardarPlegadas(){try{localStorage.setItem('mg-inicio-plegadas',JSON.stringify([...INI_PLEGADAS]))}catch(e){}}
function tarjeta(id,titulo,cuerpo,extra=''){
  return `<details class="card icard" data-ic="${id}" ${INI_PLEGADAS.has(id)?'':'open'}><summary><span class="t">${titulo}</span>${extra?`<span class="r">${extra}</span>`:''}<span class="chev" aria-hidden="true"></span></summary><div class="ib">${cuerpo}</div></details>`}
// Columnas en HTML (se adaptan al ancho). Admite valores negativos y una línea de media.
function columnas(items,{media=false,neg=false}={}){
  if(!items.length)return '<p class="small mut">Sin datos todavía.</p>';
  const max=Math.max(0,...items.map(i=>i.v)),min=Math.min(0,...items.map(i=>i.v)),rango=(max-min)||1,z=max/rango*100;
  const avg=items.reduce((a,i)=>a+i.v,0)/items.length;
  return `<div class="cplot"><div class="cbars" style="--z:${z}%">${media?`<div class="cmed" style="top:${(max-avg)/rango*100}%"><span>media ${eur(avg,0)}</span></div>`:''}
    ${items.map(i=>{const h=Math.abs(i.v)/rango*100;return `<div class="col${i.actual?' act':''}" ${i.m?`data-m="${i.m}" data-ir="resumen"`:''} ${i.h?`data-tiph="${esc(i.h)}"`:`data-tip="${esc(i.tip)}"`} tabindex="0" aria-label="${esc(i.tip)}"><i class="${i.v<0?'n':neg?'p':media&&i.v>avg*1.2?'alto':''}" style="height:${Math.max(i.v?1.5:0,h)}%;${i.v>=0?`bottom:${100-z}%`:`top:${z}%`}"></i></div>`}).join('')}</div>
    <div class="clabels">${items.map((i,k)=>`<span>${items.length>8&&k%2?'':i.l}</span>`).join('')}</div></div>`}
// Contenido del bocadillo: título y filas [color, nombre, valor, clase]
function tipHtml(tit,filas){return `<div class="tt">${tit}</div>`+filas.map(([c,n,v,cl])=>`<div class="tr">${c?`<i style="background:${c}"></i>`:'<i class="nada"></i>'}<span>${n}</span><b class="${cl||''}">${v}</b></div>`).join('')}
// Rosco de categorías con el total en el centro y la leyenda al lado (cada fila lleva a sus movimientos)
function rosco(items,opt){
  const tot=items.reduce((a,x)=>a+x.v,0)||1,R=40,L=2*Math.PI*R,hueco=items.length>1?1.2:0;let ac=0;
  const segs=items.map((x,k)=>{const f=x.v/tot*L,s=`<circle class="rseg" r="${R}" cx="50" cy="50" fill="none" stroke="${x.col||(x.id?`var(--c${k+1})`:'var(--muted)')}" stroke-width="15" stroke-dasharray="${Math.max(0.01,f-hueco).toFixed(2)} ${L.toFixed(2)}" stroke-dashoffset="${(-ac).toFixed(2)}" transform="rotate(-90 50 50)" data-cat="${x.id||''}" data-tiph="${esc(tipHtml(esc(x.n),[[x.col||(x.id?`var(--c${k+1})`:'var(--muted)'),x.tip||'Gastado',eur(x.v,0)],['','Del total',Math.round(x.v/tot*100)+' %'],...(x.id?[['','',IR_TXT('sus movimientos')]]:[])]))}"></circle>`;ac+=f;return s}).join('');
  return `<div class="rosco"><svg viewBox="0 0 100 100" role="img" aria-label="Reparto del gasto"><circle r="${R}" cx="50" cy="50" fill="none" stroke="var(--soft)" stroke-width="15"/>${segs}
      <text x="50" y="${opt&&opt.centro?51:48}" text-anchor="middle" font-size="${opt&&opt.centro?15:11}" font-weight="700" fill="var(--ink)">${opt&&opt.centro?opt.centro.t:eur(tot,0)}</text><text x="50" y="${opt&&opt.centro?62:60}" text-anchor="middle" font-size="6.5" fill="var(--muted)">${opt&&opt.centro?opt.centro.s:'gastado'}</text></svg>
    <div class="rleyenda">${items.map((x,k)=>`<div class="gbar rfila" data-cat="${x.id}" ${x.id?'title="Ver movimientos"':''}><span class="gn"><i style="background:${x.col||(x.id?`var(--c${k+1})`:'var(--muted)')}"></i>${x.e?`<span class="ce">${x.e}</span>`:''}${esc(x.n)}</span><span class="gv num">${eur(x.v,0)} <span class="mut">${Math.round(x.v/tot*100)}%</span></span></div>`).join('')}</div></div>`}
function rInicio(){
  const hoyM=mesDe(hoy()),anio=hoyM.slice(0,4),nombre=NUBE&&USER?USER.nombre.split(' ')[0]:'';
  const h=new Date().getHours();$('#iniHola').textContent=(h<6?'Buenas noches':h<14?'Buenos días':h<21?'Buenas tardes':'Buenas noches')+(nombre?', '+nombre:'');
  $('#iniFecha').textContent=new Date().toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const todos=mesesConDatos();
  $('#iniTodo').classList.toggle('hide',!S.mov.length);
  if(!S.mov.length){$('#inicio').innerHTML=`<div class="card pad ivacio"><span class="ivico">💸</span><div><h3>Aún no hay movimientos</h3><p class="small mut">Empieza subiendo el extracto del banco o apuntando un gasto a mano.</p><div class="toolbar" style="margin:8px 0 0"><button class="btn pri" type="button" data-go="importar">Importar extracto</button><button class="btn" type="button" data-go="efectivo">Añadir a mano</button></div></div></div>`;
    $$('#inicio [data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));return}
  // 12 meses hasta el actual
  const ult12=[];for(let k=11;k>=0;k--)ult12.push(addMes(hoyM,-k));
  const st12=ult12.map(m=>({m,...stats(m)})),conDatos=st12.filter(x=>x.ms.length);
  const delAnio=todos.filter(m=>m.startsWith(anio)).map(m=>stats(m));
  const I=delAnio.reduce((a,x)=>a+x.ingresos,0),G=delAnio.reduce((a,x)=>a+x.consumo,0),A=delAnio.reduce((a,x)=>a+x.ahorro,0),Inv=delAnio.reduce((a,x)=>a+(x.by.INVERSION||0),0);
  const patr=S.cuentas.reduce((a,c)=>a+(saldoCuenta(c)||0),0),nC=S.cuentas.filter(c=>saldoCuenta(c)).length;
  const st=stats(hoyM),pres=CATS.filter(c=>c.g!=='AHORRO').reduce((a,c)=>a+presupuestoCat(hoyM,c.id,st).p,0);
  const dia=+hoy().slice(8,10),diasMes=new Date(+anio,+hoyM.slice(5),0).getDate();
  const ritmo=dia>3&&st.consumo>0?st.consumo/dia*diasMes:null;
  const obj=presAhorro(st.base)+presFijo('INVERSION',st.base),pObj=obj>0?1:0,okObj=obj>0&&st.ahorro>=obj-0.5;
  let html='';
  // 1. Tu dinero
  html+=tarjeta('dinero','Tu dinero',`<div class="istats dos">
    <div><small>Patrimonio</small><b class="num">${eur(patr,0)}</b><span>${nC?`en ${nC} cuenta${nC>1?'s':''}`:'Pon los saldos en Patrimonio'}</span></div>
    <div><small>Ahorrado en ${anio}</small><b class="num ${A<0?'neg':'pos'}">${eur(A,0)}</b><span>${I?Math.round(A/I*100)+'% de lo ingresado':'&nbsp;'}</span></div>
    <div><small>Invertido en ${anio}</small><b class="num">${eur(Inv,0)}</b><span>dentro del ahorro</span></div>
    <div><small>Gasto medio al mes</small><b class="num">${eur(delAnio.length?G/delAnio.length:0,0)}</b><span>${delAnio.length} mes${delAnio.length>1?'es':''} de ${anio}</span></div></div>
    <div class="toolbar" style="margin:10px 0 0"><button class="link small" type="button" data-go="patri">Ver patrimonio →</button></div>`);
  // 2. Este mes
  const pct=pres>0?st.consumo/pres*100:0;
  html+=tarjeta('mes',`Este mes · <span style="text-transform:capitalize">${nombreMes(hoyM)}</span>`,`
    <div class="imeter"><div class="a"><span>Gastado <b class="num">${eur(st.consumo,0)}</b> de ${eur(pres,0)} de presupuesto</span><span class="num ${pct>100?'neg':''}">${Math.round(pct)}%</span></div>
    <div class="bar ${pct>100?'over':pct>=80?'warn':'ok'}"><i style="width:${Math.min(100,pct)}%"></i></div>
    <div class="bar dias" title="Días del mes"><i style="width:${dia/diasMes*100}%"></i></div><div class="small mut" style="margin-top:3px">Día ${dia} de ${diasMes}${ritmo?` · a este ritmo terminarías en <b class="${ritmo>pres?'neg':''}">${eur(ritmo,0)}</b>`:''}</div></div>
    <div class="istats" style="margin-top:12px"><div><small>Ingresos</small><b class="num pos">${eur(st.ingresos,0)}</b></div><div><small>Ahorro del mes</small><b class="num ${st.ahorro<0?'neg':''}">${eur(st.ahorro,0)}</b></div>
    <div><small>Objetivo de ahorro</small><b class="${okObj?'pos':''}">${!pObj?'—':okObj?'✓ Conseguido':eur(Math.max(0,obj-st.ahorro),0)+' por llegar'}</b></div></div>
    <div class="toolbar" style="margin:10px 0 0"><button class="link small" type="button" data-mes="${hoyM}">Ver el resumen del mes →</button></div>`);
  // 3. Pendiente
  const pend=[];
  const sc=st12.reduce((a,x)=>a+x.sinCat,0);if(sc)pend.push([`<b>${sc}</b> movimiento${sc>1?'s':''} sin categoría en el último año`,'sincat']);
  const finAnt=addMes(hoyM,-1)+'-28';const tarde=S.cuentas.filter(c=>c.banco&&c.f&&c.f<finAnt);if(tarde.length)pend.push([`Extracto pendiente de ${tarde.map(c=>esc(c.n)).join(', ')} (último del ${fFecha(tarde[0].f)})`,'importar']);
  for(let k=0;k<=3;k++){const m=addMes(hoyM,-k),d=diezmoMes(m);if(d&&d.pendiente>0.5)pend.push([`Diezmo de ${nombreMes(m)}: faltan ${eur(d.pendiente,0)}`,'dz:'+m])}
  const pp=prestamosPendientes();if(pp>0.5)pend.push([`Te deben <b>${eur(pp,0)}</b> en préstamos`,'patri']);
  if(typeof fijosDelMes==='function')for(const f of fijosDelMes(hoyM).filter(x=>x.estado==='falta'||x.estado==='cambia'))pend.push([`Gasto fijo «${esc(f.f.nombre)}» ${f.estado==='falta'?'no ha llegado':'ha cambiado de importe'}`,'resumen']);
  if(USER&&USER.admin&&typeof chNoLeidosAdmin==='function'&&chNoLeidosAdmin())pend.push([`<b>${chNoLeidosAdmin()}</b> mensaje${chNoLeidosAdmin()>1?'s':''} sin leer en el chat`,'chat']);
  if(USER&&USER.admin&&typeof ERR_TODOS!=='undefined'&&ERR_TODOS.length)pend.push([`<b>${ERR_TODOS.length}</b> error${ERR_TODOS.length>1?'es':''} registrado${ERR_TODOS.length>1?'s':''} (extractos que no se leen o fallos)`,'usuarios']);
  if(pref('avisoCopia')&&(!S.ultimaCopia||Date.now()-S.ultimaCopia>30*864e5))pend.push(['Hace más de un mes que no guardas una copia de seguridad','copia']);
  html+=tarjeta('pend','Pendiente',pend.length?`<div class="ilist">${pend.map(([t,a])=>`<button type="button" class="iitem" data-acc="${a}"><span>${t}</span><span class="mut">→</span></button>`).join('')}</div>`:'<p class="pos" style="margin:0">✓ Todo al día. ¡Bien hecho!</p>',pend.length?`<span class="tag cash">${pend.length}</span>`:'');
  // 4. Gasto mes a mes
  const media=conDatos.length?conDatos.reduce((a,x)=>a+x.consumo,0)/conDatos.length:0;
  html+=tarjeta('gasto','Gasto de los últimos 12 meses',columnas(st12.map(x=>({m:x.m,l:MESES[+x.m.slice(5)-1].slice(0,3),v:r2(x.consumo),actual:x.m===hoyM,tip:`${nombreMes(x.m)}: ${eur(x.consumo)} gastado`,
      h:tipHtml(nombreMesCap(x.m)+(x.m===hoyM?' <span class="mut">(en curso)</span>':''),[['var(--acc)','Gastado',eur(x.consumo,0)],...(media?[['',x.consumo>=media?'▲ Más que la media':'▼ Menos que la media',eur(Math.abs(x.consumo-media),0),x.consumo>media*1.2?'neg':x.consumo<=media?'pos':'']]:[]),['','',IR_TXT('el resumen del mes')]])})),{media:true})+
    `<p class="small mut" style="margin:8px 0 0">La línea discontinua es tu gasto medio (${eur(media,0)} al mes). La columna más clara es el mes en curso, que aún no ha terminado.</p>`);
  // 5. Ahorro mes a mes
  html+=tarjeta('ahorro','Ahorro de los últimos 12 meses',columnas(st12.map(x=>({m:x.m,l:MESES[+x.m.slice(5)-1].slice(0,3),v:r2(x.ahorro),actual:x.m===hoyM,tip:`${nombreMes(x.m)}: ${x.ahorro<0?'gastaste '+eur(-x.ahorro)+' más de lo que entró':'ahorraste '+eur(x.ahorro)}${x.ingresos?' ('+Math.round(x.ahorro/x.ingresos*100)+'%)':''}`,
      h:tipHtml(nombreMesCap(x.m)+(x.m===hoyM?' <span class="mut">(en curso)</span>':''),[['var(--good)','Ingresos',eur(x.ingresos,0)],['var(--acc)','Gastado',eur(x.consumo,0)],[x.ahorro<0?'var(--bad)':'var(--good)',x.ahorro<0?'Gastaste de más':'Ahorrado',eur(x.ahorro,0)+(x.ingresos?` · ${Math.round(x.ahorro/x.ingresos*100)} %`:''),x.ahorro<0?'neg':'pos'],['','',IR_TXT('el resumen del mes')]])})),{neg:true})+
    `<p class="small mut" style="margin:8px 0 0">Lo que no gastas cada mes. En rojo, los meses en los que salió más de lo que entró.</p>`);
  // 6. En qué se va el dinero este año
  const cats=[...CATS.filter(c=>c.g!=='AHORRO'),{id:'SINCAT',n:'Sin categorizar'}].map(c=>({n:c.n,id:c.id,v:delAnio.reduce((a,x)=>a+(x.by[c.id]||0),0)})).filter(x=>x.v>0.5).sort((a,b)=>b.v-a.v);
  const top=cats.slice(0,6),resto=cats.slice(6).reduce((a,x)=>a+x.v,0);if(resto>0.5)top.push({n:'Resto',id:'',v:resto});
  html+=tarjeta('cats',`En qué se va el dinero en ${anio}`,top.length?rosco(top):'<p class="small mut">Sin gastos este año.</p>');
  // 7. Objetivos
  const os=S.objetivos||[];
  if(os.length)html+=tarjeta('obj','Objetivos de ahorro',os.map(o=>objHtml(o,true)).join('')+`<div class="toolbar" style="margin:8px 0 0"><button class="link small" type="button" data-go="patri">Gestionar objetivos →</button></div>`,`${os.filter(o=>infoObj(o).falta<=0).length}/${os.length} ✓`);
  $('#inicio').innerHTML=html;
  $$('#inicio details.icard').forEach(d=>d.addEventListener('toggle',()=>{d.open?INI_PLEGADAS.delete(d.dataset.ic):INI_PLEGADAS.add(d.dataset.ic);guardarPlegadas();botonTodo()}));
  $$('#inicio [data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
  $$('#inicio [data-mes]').forEach(b=>b.onclick=()=>{MES=b.dataset.mes;go('resumen')});
  // el reparto es del año: al tocar una categoría se ven todos sus movimientos (no solo los de este mes)
  $$('#inicio .gbar[data-cat],#inicio .rseg[data-cat]').forEach(r=>r.onclick=()=>{const c=r.dataset.cat;if(!c)return;F.q='';F.tag='';if(c==='SINCAT'){F.cat='';F.sinCat=true;F.todos=false;MES=hoyM}else{F.cat=c;F.sinCat=false;F.todos=true}go('movs');scrollTo(0,0)});
  $$('#inicio .iitem').forEach(b=>b.onclick=()=>{const a=b.dataset.acc;
    if(a==='sincat'){F.sinCat=true;F.cat='';const m=[...st12].reverse().find(x=>x.sinCat);if(m)MES=m.m;go('movs')}
    else if(a.startsWith('dz:')){MES=a.slice(3);go('resumen')}else if(a==='copia')exportar();else if(a==='chat'){CH_MODO='admin';abrirChat(true)}else go(a)});
  botonTodo();
}
function botonTodo(){const ds=$$('#inicio details.icard');const b=$('#iniTodo');if(!b)return;const todasAbiertas=ds.length&&ds.every(d=>d.open);b.textContent=todasAbiertas?'Plegar todo':'Desplegar todo';
  b.onclick=()=>{ds.forEach(d=>d.open=!todasAbiertas)}}

/* ---- Bocadillo con la cifra al pasar el ratón o tocar una columna ---- */
(()=>{const tip=document.createElement('div');tip.id='tip';document.body.appendChild(tip);
  // sigue al ratón (o al dedo): a la derecha y debajo del puntero, y se da la vuelta si no cabe
  let ult=null;
  const ver=(el,x,y)=>{if(ult!==el){if(el.dataset.tiph!==undefined)tip.innerHTML=el.dataset.tiph;else tip.textContent=el.dataset.tip;ult=el}
    tip.classList.add('on');const r=tip.getBoundingClientRect(),W=window.innerWidth,H=window.innerHeight;
    let l=x+16,t=y+16;if(l+r.width>W-8)l=x-r.width-16;if(t+r.height>H-8)t=y-r.height-16;
    tip.style.left=Math.max(8,l)+'px';tip.style.top=Math.max(8,t)+'px'};
  const quitar=()=>{tip.classList.remove('on');ult=null};
  const sel='[data-tip],[data-tiph]';
  document.addEventListener('pointerover',e=>{const el=e.target.closest(sel);if(el)ver(el,e.clientX,e.clientY)});
  document.addEventListener('pointermove',e=>{const el=e.target.closest(sel);if(el)ver(el,e.clientX,e.clientY);else if(ult)quitar()});
  document.addEventListener('pointerleave',quitar);
  document.addEventListener('focusin',e=>{const el=e.target.closest&&e.target.closest(sel);if(el){const r=el.getBoundingClientRect();ver(el,r.left+r.width/2,r.top)}});
  document.addEventListener('focusout',quitar);
  document.addEventListener('scroll',quitar,{passive:true,capture:true});
})();
