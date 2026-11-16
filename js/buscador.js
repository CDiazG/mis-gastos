// Fluvi · Buscador único (botón de la lupa o tecla «/»): movimientos, categorías, ajustes y preguntas frecuentes
"use strict";
function buscarTodo(q){
  const n=norm(q).trim();if(n.length<2)return null;
  const ok=s=>norm(s).includes(n);
  const pant=[{t:'Resumen',tab:'resumen'},{t:'Añadir un movimiento',tab:'efectivo'},{t:'Movimientos',tab:'movs'},{t:'Evolución e histórico',tab:'hist'},{t:'Importar un extracto',tab:'importar'}]
    .filter(x=>ok(x.t)).map(x=>({...x,d:'Ir a esta pantalla'}));
  const aps=[];for(const tab of ['ajustes','ayuda','perfil','hist'])for(const a of APARTADOS[tab]||[])if(ok(a.t+' '+(a.d||''))&&a.id[0]!=='_')aps.push({t:a.t,d:a.d||'',tab,sub:a.id});
  const cats=CATS.filter(c=>ok(c.n)).slice(0,5);
  const movs=S.mov.filter(x=>ok(x.concepto+' '+(x.detalle||'')+' '+(x.nota||'')+' '+verConcepto(x)+' '+tagsDe(x).join(' ')+' '+(sinCatX(x)?'':catN(x.cat))+' '+(x.cuenta||'')+' '+String(Math.abs(x.importe)).replace('.',',')+' '+Math.abs(x.importe).toFixed(2).replace('.',','))).sort((a,b)=>b.fecha.localeCompare(a.fecha));
  const faq=FAQ.filter(f=>ok(f.p+' '+f.r)).slice(0,4);
  return {pant,aps:aps.slice(0,5),cats,movs,faq};
}
function abrirBuscador(){
  dialog('Buscar',`<input type="search" id="bqIn" placeholder="Un movimiento, una categoría, un ajuste o una duda…" autocomplete="off" style="width:100%"><div id="bqRes" class="small" style="margin-top:10px"></div>`,[{t:'Cerrar'}]);
  const inp=$('#bqIn'),res=$('#bqRes');setTimeout(()=>inp.focus(),50);
  const fila=(i,t,d,r)=>`<button type="button" class="cmit" data-bq="${i}" style="width:100%;text-align:left"><span style="flex:1"><b>${t}</b>${d?`<small class="mut" style="display:block">${d}</small>`:''}</span>${r?`<span class="num">${r}</span>`:''}</button>`;
  let acc=[];
  let pinta=()=>{
    const r=buscarTodo(inp.value);acc=[];
    if(!r){res.innerHTML='<p class="mut">Escribe al menos dos letras.</p>';return}
    const sec=(tit,xs)=>xs.length?`<div class="chiplbl" style="margin:10px 0 2px">${tit}</div>`+xs.join(''):'';
    const add=f=>{acc.push(f);return acc.length-1};
    const H=[
      sec('Pantallas y ajustes',[...r.pant.map(x=>fila(add(()=>go(x.tab)),esc(x.t),esc(x.d))),...r.aps.map(x=>fila(add(()=>irApartado(x.tab,x.sub)),esc(x.t),esc(x.d)))]),
      sec('Categorías',r.cats.map(c=>fila(add(()=>{F.cat=c.id;F.sinCat=false;F.dud=false;F.q='';F.tag='';F.todos=true;go('movs')}),catI(c.id)+esc(c.n),'Ver sus movimientos'))),
      sec(`Movimientos (${r.movs.length})${r.movs.length>1?' · suma '+eur(r2(r.movs.reduce((a,x)=>a+x.importe,0))):''}`,[...r.movs.slice(0,6).map(x=>fila(add(()=>{MES=x.mes;F.q=inp.value.trim();F.cat='';F.sinCat=false;F.dud=false;F.tag='';go('movs')}),esc(verConcepto(x)),fFecha(x.fecha)+(sinCatX(x)?'':' · '+esc(catN(x.cat))),eur(x.importe))),
        r.movs.length>6?fila(add(()=>{F.q=inp.value.trim();F.cat='';F.sinCat=false;F.dud=false;F.tag='';go('movs')}),'Ver los '+r.movs.length+' en Movimientos','',''):'']),
      sec('Preguntas frecuentes',r.faq.map(f=>fila(add(()=>{irApartado('ayuda','faq');setTimeout(()=>{const b=$('#faqBuscar');if(b){b.value=f.p;b.oninput({target:b})}},60)}),esc(f.p),'')))
    ].join('');
    res.innerHTML=H||'<p class="mut">No he encontrado nada con «'+esc(inp.value)+'».</p>';
    $$('[data-bq]',res).forEach(b=>b.onclick=()=>{const f=acc[+b.dataset.bq];$('#dlg').close();f()});
  };
  // Teclado: ↑ ↓ para moverte por los resultados e Intro para abrir el marcado (el primero si no has movido nada)
  let sel=0;const marca=()=>{const bs=$$('[data-bq]',res);bs.forEach((b,i)=>{b.classList.toggle('sel',i===sel);b.setAttribute('aria-current',i===sel?'true':'false')});if(bs[sel])bs[sel].scrollIntoView({block:'nearest'})};
  inp.addEventListener('keydown',e=>{const bs=$$('[data-bq]',res);if(!bs.length)return;
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();sel=(sel+(e.key==='ArrowDown'?1:-1)+bs.length)%bs.length;marca()}
    else if(e.key==='Enter'){e.preventDefault();bs[sel].click()}});
  const pinta0=pinta;pinta=()=>{pinta0();sel=0;marca()};
  inp.oninput=pinta;pinta();
}
$('#bBuscar').onclick=abrirBuscador;
document.addEventListener('keydown',e=>{if(e.key==='/'&&!e.ctrlKey&&!e.metaKey&&!/^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement||{}).tagName)&&!$('#dlg').open&&!$('#userbox').classList.contains('hide')){e.preventDefault();abrirBuscador()}});
