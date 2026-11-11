// Fondo de seda en 3D (opcional, solo móvil): una tela brillante que se mueve despacio, dibujada con la tarjeta gráfica.
// Usa los colores de la paleta (--wa --wb --wc --wd). Si el dispositivo no puede, se queda el fondo de siempre.
(function(){
  const VS='attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  const FS=`precision highp float;uniform vec2 R;uniform float T,BR;uniform vec3 A,B,C,D;
float f(vec2 p,float t){vec2 q=p;
  q+=.55*vec2(sin(q.y*1.3+t*.21),cos(q.x*1.1-t*.17));
  q+=.35*vec2(sin(q.y*2.1-t*.27+1.7),cos(q.x*1.9+t*.23+.6));
  return sin(q.x*1.5+q.y*.7+t*.15)*.6+sin(q.x*.8-q.y*1.6-t*.11)*.4+.25*sin(q.x*3.1+q.y*2.3+t*.2);}
void main(){vec2 uv=gl_FragCoord.xy/R;vec2 p=(uv-.5)*vec2(R.x/R.y,1.)*2.8;float e=.012;
  float h=f(p,T),dx=f(p+vec2(e,0.),T)-h,dy=f(p+vec2(0.,e),T)-h;
  vec3 n=normalize(vec3(-dx/e*.5,-dy/e*.5,1.));vec3 V=vec3(0.,0.,1.);
  vec3 L1=normalize(vec3(-.5,.7,.6)),L2=normalize(vec3(.75,-.35,.5));
  float d=max(dot(n,L1),0.),s1=pow(max(dot(n,normalize(L1+V)),0.),48.),s2=pow(max(dot(n,normalize(L2+V)),0.),22.);
  float fr=pow(1.-max(n.z,0.),2.2);
  float br2=pow(max(dot(n,normalize(L1+V)),0.),8.);
  vec3 col=D*.08;col=mix(col,A,pow(smoothstep(.1,1.,d),1.3));
  col+=B*br2*.32+B*s1*.7+C*s1*.3+C*fr*.4+B*s2*.45;col=min(col,vec3(1.));
  col*=mix(1.,.6,uv.y*.4);
  gl_FragColor=vec4(pow(col*BR,vec3(.95)),1.);}`;
  let cv,gl,pg,loc,raf=0,t0=0,ultimo=0,activo=false,col={A:[.03,.57,.7],B:[.02,.71,.83],C:[.65,.93,.97],D:[.04,.23,.29]},br=1;
  const mq=matchMedia('(max-width:900px)');
  const rgb=s=>{s=(s||'').trim();let m=s.match(/^#([0-9a-f]{6})$/i);if(m){const n=parseInt(m[1],16);return[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255]}
    m=s.match(/^#([0-9a-f]{3})$/i);if(m){const h=m[1];return[parseInt(h[0]+h[0],16)/255,parseInt(h[1]+h[1],16)/255,parseInt(h[2]+h[2],16)/255]}
    m=s.match(/rgba?\(([^)]+)\)/);if(m){const v=m[1].split(/[ ,\/]+/).map(Number);return[v[0]/255,v[1]/255,v[2]/255]}return null};
  function colores(){const cs=getComputedStyle(document.documentElement);
    for(const k of ['A','B','C','D']){const r=rgb(cs.getPropertyValue('--w'+k.toLowerCase()));if(r)col[k]=r}
    const b=parseFloat(cs.getPropertyValue('--br'));br=isNaN(b)?1:Math.max(.35,Math.min(1.15,b))}
  function crear(){
    cv=document.createElement('canvas');cv.id='seda3d';cv.setAttribute('aria-hidden','true');document.body.appendChild(cv);
    gl=cv.getContext('webgl',{antialias:false,alpha:false,powerPreference:'low-power'});
    if(!gl){cv.remove();cv=null;return false}
    const sh=(t,s)=>{const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);return gl.getShaderParameter(o,gl.COMPILE_STATUS)?o:null};
    const v=sh(gl.VERTEX_SHADER,VS),f=sh(gl.FRAGMENT_SHADER,FS);if(!v||!f){cv.remove();cv=null;gl=null;return false}
    pg=gl.createProgram();gl.attachShader(pg,v);gl.attachShader(pg,f);gl.linkProgram(pg);
    if(!gl.getProgramParameter(pg,gl.LINK_STATUS)){cv.remove();cv=null;gl=null;return false}
    gl.useProgram(pg);const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const a=gl.getAttribLocation(pg,'a');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
    loc={R:gl.getUniformLocation(pg,'R'),T:gl.getUniformLocation(pg,'T'),BR:gl.getUniformLocation(pg,'BR'),A:gl.getUniformLocation(pg,'A'),B:gl.getUniformLocation(pg,'B'),C:gl.getUniformLocation(pg,'C'),D:gl.getUniformLocation(pg,'D')};
    cv.addEventListener('webglcontextlost',e=>{e.preventDefault();parar(true)});
    return true}
  function medir(){const w=Math.max(2,Math.round(innerWidth*.5)),h=Math.max(2,Math.round(Math.min(innerHeight*1.12,940)*.5));
    if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;gl.viewport(0,0,w,h)}}
  function pintar(ts){
    medir();gl.uniform2f(loc.R,cv.width,cv.height);gl.uniform1f(loc.T,((ts-t0)/1000)%600);gl.uniform1f(loc.BR,br);
    gl.uniform3fv(loc.A,col.A);gl.uniform3fv(loc.B,col.B);gl.uniform3fv(loc.C,col.C);gl.uniform3fv(loc.D,col.D);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4)}
  function bucle(ts){raf=requestAnimationFrame(bucle);if(ts-ultimo<33)return;ultimo=ts;pintar(ts)}
  function sinMovimiento(){return document.documentElement.classList.contains('sinanim')||matchMedia('(prefers-reduced-motion:reduce)').matches}
  function parar(quitar){cancelAnimationFrame(raf);raf=0;if(quitar&&cv){cv.classList.remove('on');document.body.classList.remove('seda3d')}}
  function arrancar(){
    if(!cv&&!crear())return;
    colores();document.body.classList.add('seda3d');cv.classList.add('on');
    cancelAnimationFrame(raf);raf=0;t0=performance.now()-3000;
    if(sinMovimiento()){pintar(performance.now())}else if(!document.hidden){raf=requestAnimationFrame(bucle)}}
  window.sedaAplicar=function(){
    let on=false;try{on=!!(typeof S!=='undefined'&&S&&S.aj&&S.aj.seda3d===true)&&mq.matches}catch(_){}
    activo=on;if(on)arrancar();else parar(true)};
  document.addEventListener('visibilitychange',()=>{if(!activo)return;if(document.hidden){cancelAnimationFrame(raf);raf=0}else if(!sinMovimiento()&&!raf){raf=requestAnimationFrame(bucle)}});
  (mq.addEventListener?mq.addEventListener('change',()=>window.sedaAplicar()):0);
  matchMedia('(prefers-color-scheme:dark)').addEventListener?.('change',()=>{if(activo){colores();if(sinMovimiento())pintar(performance.now())}});
  addEventListener('resize',()=>{if(activo&&sinMovimiento())pintar(performance.now())});
})();
