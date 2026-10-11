(window.__atlas=window.__atlas||{})['scene']='atlas-4';
/* ==== Scena 3D (Three.js) — riscritta da zero ==== */
(function(){
'use strict';
var Scene = window.Scene = { started:false, onPick:null, onView:null, onSpinStop:null };
var $ = function(id){ return document.getElementById(id); };
var wrap, canvas, renderer, scene, camera, controls, raycaster, mouse, DIRS;
var S = { sel:null, dirty:true, anim:null, mode:'x' };
var O = { names:true, grid:true, proj:true, links:false, spin:false, lock:false };
var nodes = {}, pickables = [], grpGrid, grpProj, grpLinks, ring, axisGrp = [], poleSp = [[],[],[]];
var readySent=false;
var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

/* coordinate mappa -> scena: X = economia, Y(three) = valori sociali, Z(three) = -autorità */
function P(p){ return new THREE.Vector3(p.x, p.z, -p.y); }
function people(){ return PM.people; }

/* ---- Messaggi ---- */
Scene.showMsg = function(text){ var m=$('mpMsg'); if(!m) return; $('mpMsgText').textContent=text; m.style.display='flex'; };
Scene.hideMsg = function(){ var m=$('mpMsg'); if(m) m.style.display='none'; };

/* ---- Etichette (sprite con canvas 2D) ---- */
function makeLabel(text, o){
  o = o || {};
  var fs=o.fs||30, pad=o.pad==null?14:o.pad, sub=o.sub||'', k=2;
  var c=document.createElement('canvas'), g=c.getContext('2d');
  var f1='700 '+fs+'px system-ui,-apple-system,"Segoe UI",sans-serif';
  var f2='600 '+Math.round(fs*.5)+'px system-ui,-apple-system,"Segoe UI",sans-serif';
  g.font=f1; var w1=g.measureText(text).width, w2=0;
  if(sub){ g.font=f2; w2=g.measureText(sub.toUpperCase()).width+sub.length*1.5; }
  var W=Math.ceil(Math.max(w1,w2)+pad*2), H=Math.ceil(fs*1.45+(sub?fs*.62:0)+pad*.6);
  c.width=W*k; c.height=H*k; g=c.getContext('2d'); g.scale(k,k);
  if(o.bg){
    g.fillStyle=o.bg; g.strokeStyle=o.border||'rgba(18,48,42,.25)'; g.lineWidth=2;
    var r=Math.min(18,H/2), x=1, y=1, w=W-2, h=H-2;
    g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); g.fill(); g.stroke();
  }
  g.textAlign='center'; g.textBaseline='middle';
  var cy=sub?H/2-fs*.22:H/2+1;
  g.font=f1; g.fillStyle=o.color||'#12302a'; g.fillText(text,W/2,cy);
  if(sub){
    g.font=f2; g.fillStyle=o.subColor||'#5b6b64';
    if('letterSpacing' in g) g.letterSpacing='1.5px';
    g.fillText(sub.toUpperCase(),W/2,cy+fs*.82);
  }
  var tex=new THREE.CanvasTexture(c); tex.minFilter=THREE.LinearFilter; tex.generateMipmaps=false;
  var sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false,depthWrite:false}));
  var hh=o.h||1; sp.scale.set(hh*W/H,hh,1);
  if(o.anchorBottom) sp.center.set(.5,0);
  sp.renderOrder=o.order||10;
  return sp;
}

/* ---- Costruzione della scena ---- */
function buildScene(){
  scene=new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xffffff,.65));
  var dl=new THREE.DirectionalLight(0xffffff,.65); dl.position.set(12,24,16); scene.add(dl);
  var dl2=new THREE.DirectionalLight(0xfff0e0,.25); dl2.position.set(-14,6,-10); scene.add(dl2);

  /* cubo di riferimento (solo spigoli: nessuna superficie opaca) */
  scene.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(20,20,20)),new THREE.LineBasicMaterial({color:0xaec5bc,transparent:true,opacity:.75})));

  /* griglie sui tre piani posteriori */
  grpGrid=new THREE.Group();
  function grid(rot,pos){
    var g=new THREE.GridHelper(20,10,0xbed1c8,0xdfeae3);
    g.material.transparent=true; g.material.opacity=.9;
    g.rotation.set(rot[0],rot[1],rot[2]); g.position.set(pos[0],pos[1],pos[2]);
    grpGrid.add(g);
  }
  function tint(rot,pos,color){
    var m=new THREE.Mesh(new THREE.PlaneGeometry(20,20),new THREE.MeshBasicMaterial({color:color,transparent:true,opacity:.035,side:THREE.DoubleSide,depthWrite:false}));
    m.rotation.set(rot[0],rot[1],rot[2]); m.position.set(pos[0],pos[1],pos[2]);
    grpGrid.add(m);
  }
  grid([0,0,0],[0,-10,0]);            tint([-Math.PI/2,0,0],[0,-10,0],0x0f7a5c);
  grid([Math.PI/2,0,0],[0,0,-10]);    tint([0,0,0],[0,0,-10],0xb0467f);
  grid([0,0,Math.PI/2],[-10,0,0]);    tint([0,Math.PI/2,0],[-10,0,0],0xc08a1e);
  scene.add(grpGrid);

  /* assi con frecce e tacche */
  axisGrp=[new THREE.Group(),new THREE.Group(),new THREE.Group()];
  axisGrp.forEach(function(g){ scene.add(g); });
  var axMat=new THREE.LineBasicMaterial({color:0x12302a,transparent:true,opacity:.65});
  [[[-10,0,0],[10,0,0]],[[0,-10,0],[0,10,0]],[[0,0,-10],[0,0,10]]].forEach(function(a,ai){
    var gm=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(a[0][0],a[0][1],a[0][2]),new THREE.Vector3(a[1][0],a[1][1],a[1][2])]);
    axisGrp[ai].add(new THREE.Line(gm,axMat));
  });
  var coneMat=new THREE.MeshBasicMaterial({color:0x12302a});
  function cone(ai,pos,rot){ var m=new THREE.Mesh(new THREE.ConeGeometry(.28,.85,14),coneMat); m.position.set(pos[0],pos[1],pos[2]); m.rotation.set(rot[0],rot[1],rot[2]); axisGrp[ai].add(m); }
  cone(0,[10.4,0,0],[0,0,-Math.PI/2]); cone(0,[-10.4,0,0],[0,0,Math.PI/2]);
  cone(1,[0,10.4,0],[0,0,0]);          cone(1,[0,-10.4,0],[Math.PI,0,0]);
  cone(2,[0,0,-10.4],[-Math.PI/2,0,0]); cone(2,[0,0,10.4],[Math.PI/2,0,0]);
  var tickMat=new THREE.MeshBasicMaterial({color:0x5b6b64});
  [-8.9,-4.4,4.4,8.9].forEach(function(v){
    [[v,0,0],[0,v,0],[0,0,v]].forEach(function(p,ai){ var t=new THREE.Mesh(new THREE.SphereGeometry(.12,10,8),tickMat); t.position.set(p[0],p[1],p[2]); axisGrp[ai].add(t); });
  });
  scene.add(new THREE.Mesh(new THREE.OctahedronGeometry(.3),new THREE.MeshBasicMaterial({color:0x12302a})));

  /* nomi dei poli agli estremi degli assi */
  function pole(text,sub,pos,color,axis){ var s=makeLabel(text,{fs:34,sub:sub,h:1.9,color:color||'#12302a',order:12}); s.position.set(pos[0],pos[1],pos[2]); scene.add(s); poleSp[axis].push(s); }
  pole('Socialismo','Economia',[-13.4,0,0],'#a8302d',0);       pole('Capitalismo','Economia',[13.4,0,0],'#1d4f9e',0);
  pole('Progressismo','Valori sociali',[0,-13,0],'#b0467f',1); pole('Tradizionalismo','Valori sociali',[0,13,0],'#9a6a12',1);
  pole('Libertario','Autorità',[0,0,13.3],'#12302a',2);        pole('Autoritario','Autorità',[0,0,-13.3],'#12302a',2);

  /* linee verticali e dischi sul pavimento (aiutano a leggere l'altezza) */
  var stemMat=new THREE.LineBasicMaterial({color:0x12302a,transparent:true,opacity:.28});
  var discMat=new THREE.MeshBasicMaterial({color:0x12302a,transparent:true,opacity:.16,depthWrite:false});
  people().forEach(function(p){
    var v=P(p);
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([v,new THREE.Vector3(v.x,-10,v.z)]),stemMat));
    var d=new THREE.Mesh(new THREE.CircleGeometry(.42,20),discMat); d.rotation.x=-Math.PI/2; d.position.set(v.x,-9.98,v.z); scene.add(d);
  });

  /* partecipanti */
  people().forEach(function(p){
    var v=P(p), g=new THREE.Group(); g.position.copy(v);
    var s=new THREE.Mesh(new THREE.SphereGeometry(.42,32,24),new THREE.MeshStandardMaterial({color:new THREE.Color(PM.colorOf(S.mode,p[S.mode])),roughness:.5,metalness:0}));
    g.add(s);
    g.add(new THREE.Mesh(new THREE.SphereGeometry(.42*1.14,24,18),new THREE.MeshBasicMaterial({color:0x12302a,side:THREE.BackSide})));
    var pk=new THREE.Mesh(new THREE.SphereGeometry(1,12,10),new THREE.MeshBasicMaterial({visible:false})); pk.userData.id=p.id; g.add(pk); pickables.push(pk);
    var ln=makeLabel(p.name,{fs:30,h:.95,bg:'rgba(255,253,247,.92)',border:'rgba(18,48,42,.35)',anchorBottom:true,order:20}); ln.position.set(0,.78,0); g.add(ln);
    var ls=makeLabel(p.name,{fs:32,h:1.12,bg:'#0f7a5c',border:'#0b5c45',color:'#ffffff',anchorBottom:true,order:25}); ls.position.set(0,.9,0); ls.visible=false; g.add(ls);
    scene.add(g);
    nodes[p.id]={g:g,sphere:s,ln:ln,ls:ls,v:v};
  });

  ring=new THREE.Mesh(new THREE.TorusGeometry(.78,.07,10,40),new THREE.MeshBasicMaterial({color:0x0f7a5c,depthTest:false,transparent:true}));
  ring.renderOrder=15; ring.visible=false; scene.add(ring);

  /* affinità: ogni persona collegata alle due più vicine */
  grpLinks=new THREE.Group(); var seen={};
  people().forEach(function(p){
    PM.nearest(p,2).forEach(function(o){
      var q=o.p, k=[p.id,q.id].sort().join('|'); if(seen[k]) return; seen[k]=1;
      var op=Math.max(.25,Math.min(.8,1.2-o.d/8));
      grpLinks.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([P(p),P(q)]),new THREE.LineBasicMaterial({color:0x0f7a5c,transparent:true,opacity:op})));
    });
  });
  grpLinks.visible=O.links; scene.add(grpLinks);
  grpGrid.visible=O.grid;

  grpProj=new THREE.Group(); scene.add(grpProj);
}

/* ---- Colori ---- */
function recolor(){
  people().forEach(function(p){
    var n=nodes[p.id]; if(!n) return;
    n.sphere.material.color.set(PM.colorOf(S.mode,p[S.mode]));
  });
  S.dirty=true;
}

/* ---- Camera e animazioni ---- */
function baseDist(){ var a=camera.aspect||1; return Math.max(31,44/a); }
function ease(t){ return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2; }
function flyTo(pos,target){
  if(reduceMotion){ camera.position.copy(pos); controls.target.copy(target); controls.update(); S.dirty=true; return; }
  S.anim={t0:performance.now(),dur:750,p0:camera.position.clone(),p1:pos.clone(),g0:controls.target.clone(),g1:target.clone()};
}
Scene.setView = function(v){
  if(!Scene.started||!DIRS[v]) return;
  if(Scene.onView) Scene.onView(v);
  flyTo(DIRS[v].clone().normalize().multiplyScalar(baseDist()),new THREE.Vector3(0,0,0));
};
Scene.resetView = function(){ Scene.select(null,false); Scene.setView('persp'); };

/* ---- Etichette adattive ---- */
function declutter(){
  var W=wrap.clientWidth, H=wrap.clientHeight, tanH=Math.tan(camera.fov*Math.PI/360), items=[], placed=[];
  people().forEach(function(p){
    var n=nodes[p.id], sp=n.ls.visible?n.ls:(n.ln.visible?n.ln:null);
    n.ln.center.set(.5,0); n.ls.center.set(.5,0);
    if(!sp) return;
    var wp=n.v.clone(); wp.y+=sp.position.y;
    var d=camera.position.distanceTo(wp), ppu=(H/2)/(tanH*d), sc=wp.clone().project(camera);
    items.push({sp:sp,ax:(sc.x*.5+.5)*W,ay:(-sc.y*.5+.5)*H,w:sp.scale.x*ppu,h:sp.scale.y*ppu,sel:n.ls.visible?1:0});
  });
  items.sort(function(a,b){ return (b.sel-a.sel)||(b.ay-a.ay); });
  items.forEach(function(it){
    var off=0, tries=0;
    function hit(){
      var l=it.ax-it.w/2-3, r=it.ax+it.w/2+3, b=it.ay-off*it.h+2, t=it.ay-(off+1)*it.h-2;
      for(var i=0;i<placed.length;i++){ var q=placed[i]; if(l<q.r&&r>q.l&&t<q.b&&b>q.t) return true; }
      return false;
    }
    while(hit()&&tries<14){ off+=.62; tries++; }
    placed.push({l:it.ax-it.w/2,r:it.ax+it.w/2,b:it.ay-off*it.h,t:it.ay-(off+1)*it.h});
    it.sp.center.set(.5,-off);
  });
}
/* nasconde l'asse che punta verso la camera: niente nomi "fermi" nell'origine nelle viste piane */
function adaptLabels(){
  var d=camera.position.clone().sub(controls.target).normalize(), c=[Math.abs(d.x),Math.abs(d.y),Math.abs(d.z)];
  for(var i=0;i<3;i++){ var hide=c[i]>0.9; axisGrp[i].visible=!hide; poleSp[i].forEach(function(s){ s.visible=!hide; }); }
  declutter();
}

/* ---- Proiezioni del selezionato ---- */
function clearGroup(g){ while(g.children.length){ var c=g.children.pop(); if(c.geometry) c.geometry.dispose(); if(c.material) c.material.dispose(); } }
function buildProj(){
  clearGroup(grpProj);
  var p=S.sel&&PM.byId(S.sel); if(!p||!O.proj) return;
  var v=P(p), T=[new THREE.Vector3(v.x,-10,v.z),new THREE.Vector3(v.x,v.y,-10),new THREE.Vector3(-10,v.y,v.z)];
  T.forEach(function(t){
    var l=new THREE.Line(new THREE.BufferGeometry().setFromPoints([v,t]),new THREE.LineDashedMaterial({color:0x0f7a5c,dashSize:.4,gapSize:.28,transparent:true,opacity:.9}));
    l.computeLineDistances(); grpProj.add(l);
    var d=new THREE.Mesh(new THREE.SphereGeometry(.2,12,10),new THREE.MeshBasicMaterial({color:0x0f7a5c})); d.position.copy(t); grpProj.add(d);
  });
}

/* ---- Selezione ---- */
function applyLabels(){
  people().forEach(function(p){
    var n=nodes[p.id], isSel=p.id===S.sel;
    n.ln.visible=O.names&&!isSel; n.ls.visible=isSel;
  });
  var n=S.sel&&nodes[S.sel];
  if(n){ ring.visible=true; ring.position.copy(n.v); } else ring.visible=false;
  S.dirty=true;
}
Scene.select = function(id,fly){
  S.sel=id||null;
  if(!Scene.started) return;
  buildProj(); applyLabels();
  if(id&&fly!==false){
    var n=nodes[id]; if(!n) return;
    var dir=camera.position.clone().sub(controls.target).normalize();
    var d=Math.max(20,Math.min(30,baseDist()*.65));
    flyTo(n.v.clone().add(dir.multiplyScalar(d)),n.v.clone());
    if(Scene.onView) Scene.onView(null);
  }
};

/* ---- Opzioni e colore ---- */
Scene.setMode = function(m){ S.mode=m; if(Scene.started) recolor(); };
Scene.setOpt = function(k,val){
  O[k]=!!val; if(!Scene.started) return;
  if(k==='names') applyLabels();
  else if(k==='grid') grpGrid.visible=O.grid;
  else if(k==='proj') buildProj();
  else if(k==='links') grpLinks.visible=O.links;
  else if(k==='spin'){ if(reduceMotion&&O.spin){O.spin=false;if(Scene.onSpinStop)Scene.onSpinStop();} controls.autoRotate=O.spin; }
  else if(k==='lock'){
    controls.enabled=!O.lock;
    canvas.style.touchAction=O.lock?'pan-y':'none';
    if(O.lock&&O.spin){ O.spin=false; controls.autoRotate=false; if(Scene.onSpinStop) Scene.onSpinStop(); }
  }
  S.dirty=true;
};
Scene.requestRender = function(){ S.dirty=true; };

/* ---- Tap/clic e hover ---- */
function pick(ev){
  var r=canvas.getBoundingClientRect();
  mouse.x=((ev.clientX-r.left)/r.width)*2-1; mouse.y=-((ev.clientY-r.top)/r.height)*2+1;
  raycaster.setFromCamera(mouse,camera);
  var hit=raycaster.intersectObjects(pickables,false);
  return hit.length?hit[0].object.userData.id:null;
}
function bindInput(){
  var down=null, tip=$('mpTip'), hint=$('mpHint');
  canvas.addEventListener('pointerdown',function(e){ down={x:e.clientX,y:e.clientY,t:performance.now()}; if(hint) hint.classList.add('off'); });
  canvas.addEventListener('pointercancel',function(){ down=null; });
  canvas.addEventListener('pointerup',function(e){
    if(!down) return;
    var dx=e.clientX-down.x, dy=e.clientY-down.y, dt=performance.now()-down.t; down=null;
    if(Math.sqrt(dx*dx+dy*dy)>7||dt>600) return;
    var id=pick(e); if(id&&Scene.onPick) Scene.onPick(id);
  });
  canvas.addEventListener('pointermove',function(e){
    if(e.pointerType!=='mouse'||e.buttons){ tip.style.display='none'; return; }
    var id=pick(e);
    if(!id){ tip.style.display='none'; canvas.style.cursor='grab'; return; }
    canvas.style.cursor='pointer';
    var p=PM.byId(id); tip.textContent='';
    var b=document.createElement('b'); b.textContent=p.name; tip.appendChild(b);
    ['x','y','z'].forEach(function(k){ tip.appendChild(document.createTextNode(PM.phrase(k,p[k]))); tip.appendChild(document.createElement('br')); });
    var r=wrap.getBoundingClientRect(); tip.style.display='block';
    var x=e.clientX-r.left+14, y=e.clientY-r.top+14;
    if(x+tip.offsetWidth>r.width-4) x=e.clientX-r.left-tip.offsetWidth-14;
    if(y+tip.offsetHeight>r.height-4) y=e.clientY-r.top-tip.offsetHeight-14;
    tip.style.left=Math.max(4,x)+'px'; tip.style.top=Math.max(4,y)+'px';
  });
  canvas.addEventListener('pointerleave',function(){ tip.style.display='none'; });
}

/* ---- Ciclo di rendering (disegna solo quando serve) ---- */
function loop(now){
  requestAnimationFrame(loop);
  if(wrap.clientWidth<50||wrap.clientHeight<50) return;
  if(S.anim){
    var a=S.anim, t=Math.min(1,(now-a.t0)/a.dur), e=ease(t);
    camera.position.lerpVectors(a.p0,a.p1,e); controls.target.lerpVectors(a.g0,a.g1,e);
    if(t>=1) S.anim=null;
    S.dirty=true;
  }
  var ch=controls.update();
  if(ch||S.dirty){
    if(ring.visible) ring.quaternion.copy(camera.quaternion);
    adaptLabels();
    renderer.render(scene,camera);
    if(!readySent){ readySent=true; if(Scene.onReady) Scene.onReady(); }
    S.dirty=false;
  }
}
Scene.resize = function(){
  if(!Scene.started) return;
  var w=wrap.clientWidth, h=wrap.clientHeight; if(w<50||h<50) return;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  renderer.setSize(w,h,false);
  camera.aspect=w/h; camera.updateProjectionMatrix(); S.dirty=true;
};

/* ---- Avvio ---- */
Scene.start = function(){
  if(Scene.started) return {ok:true};
  if(!window.THREE||!THREE.OrbitControls) return {ok:false,msg:'Non sono riuscito a caricare Three.js. Controlla che i file three.min.js e OrbitControls.js siano nella cartella vendor del repository, poi premi Riprova.'};
  wrap=$('mpWrap'); canvas=$('mpCanvas');
  try{
    DIRS={persp:new THREE.Vector3(.5,.38,.78),top:new THREE.Vector3(0,1,.0001),front:new THREE.Vector3(0,0,1),side:new THREE.Vector3(1,0,0)};
    renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:true,alpha:true});
    renderer.setClearColor(0x000000,0);
    camera=new THREE.PerspectiveCamera(38,1,.1,400);
    controls=new THREE.OrbitControls(camera,canvas);
    controls.enableDamping=true; controls.dampingFactor=.09; controls.minDistance=8; controls.maxDistance=90; controls.rotateSpeed=.8; controls.autoRotateSpeed=1.1;
    raycaster=new THREE.Raycaster(); mouse=new THREE.Vector2();
    buildScene();
    Scene.started=true;
    Scene.resize();
    camera.position.copy(DIRS.persp.clone().normalize().multiplyScalar(baseDist())); controls.target.set(0,0,0); controls.update();
    controls.addEventListener('start',function(){
      S.anim=null; if(Scene.onView) Scene.onView(null);
      if(O.spin){ O.spin=false; controls.autoRotate=false; if(Scene.onSpinStop) Scene.onSpinStop(); }
      var h=$('mpHint'); if(h) h.classList.add('off');
    });
    controls.addEventListener('change',function(){ S.dirty=true; });
    bindInput();
    if(window.ResizeObserver) new ResizeObserver(Scene.resize).observe(wrap);
    window.addEventListener('resize',Scene.resize);
    window.addEventListener('orientationchange',function(){ setTimeout(Scene.resize,300); });
    applyLabels();
    if(S.sel) Scene.select(S.sel,false);
    requestAnimationFrame(loop);
    return {ok:true};
  }catch(e){
    Scene.started=false;
    var m=(e&&e.message)?e.message:String(e);
    return {ok:false,msg:/webgl/i.test(m)?'Questo dispositivo o browser non supporta WebGL: la vista 3D non è disponibile.':'Errore nella creazione della scena: '+m};
  }
};
})();
