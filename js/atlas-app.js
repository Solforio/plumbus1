(window.__atlas=window.__atlas||{})['app']='atlas-4';
/* ==== Avvio e interfaccia ==== */
(function(){
'use strict';
var $ = function(id){ return document.getElementById(id); };
var esc = function(s){ return PM.esc(s); };
var state = { mode:'x', rendered:{}, libsTried:false };

/* ---- Caricamento di Three.js (vendor → radice → CDN) ---- */
function loadFirst(urls,cb){
  var i=0;
  (function next(){
    if(i>=urls.length){ cb(false); return; }
    var s=document.createElement('script'); s.src=urls[i++];
    s.onload=function(){ cb(true); };
    s.onerror=function(){ if(s.parentNode) s.parentNode.removeChild(s); next(); };
    document.head.appendChild(s);
  })();
}
function loadLibs(cb){
  if(window.THREE&&THREE.OrbitControls){ cb(true); return; }
  loadFirst(['vendor/three.min.js','three.min.js'],function(ok){
    if(!ok){ cb(false); return; }
    loadFirst(['vendor/OrbitControls.js','OrbitControls.js'],function(ok2){ cb(ok2&&!!THREE.OrbitControls); });
  });
}
function startScene(){
  loadLibs(function(ok){
    if(!ok){ Scene.showMsg('Non sono riuscito a caricare Three.js. Controlla che three.min.js e OrbitControls.js siano nella cartella vendor del repository, poi premi Riprova.'); return; }
    var r=Scene.start();
    if(!r.ok){ Scene.showMsg(r.msg); return; }
    Scene.hideMsg();
    Scene.setMode(state.mode);
    if(PM.sel) Scene.select(PM.sel,false);
  });
}

/* ---- Selezione condivisa ---- */
PM.select = function(id){
  PM.sel=id||null; renderList(); renderDetail();
  Scene.select(PM.sel,true);
  PM.emit('select',PM.sel);
};

/* ---- Elenco partecipanti ---- */
function renderList(){
  var q=($('mpSearch').value||'').trim().toLowerCase(), ul=$('mpList'); ul.textContent='';
  PM.people.filter(function(p){ return !q||p.name.toLowerCase().indexOf(q)>=0; }).forEach(function(p){
    var li=document.createElement('li'), b=document.createElement('button');
    b.type='button';
    b.setAttribute('aria-label',p.name+', '+PM.phrase(state.mode,p[state.mode]));
    if(p.id===PM.sel) b.setAttribute('aria-current','true');
    var d=document.createElement('span'); d.className='mp-dot'; d.style.background=PM.colorOf(state.mode,p[state.mode]);
    var n=document.createElement('span'); n.className='mp-name'; n.textContent=p.name;
    var s=document.createElement('small'); s.textContent=PM.phrase(state.mode,p[state.mode]);
    b.appendChild(d); b.appendChild(n); b.appendChild(s);
    b.addEventListener('click',function(){ PM.select(p.id===PM.sel?null:p.id); });
    li.appendChild(b); ul.appendChild(li);
  });
  if(!ul.children.length){ var e=document.createElement('li'); e.className='mp-note'; e.textContent='Nessun risultato.'; ul.appendChild(e); }
}

/* ---- Scheda del partecipante ---- */
function renderDetail(){
  var box=$('mpDetail'), p=PM.byId(PM.sel);
  if(!p){ box.innerHTML='<div class="mp-empty"><svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><circle cx="20" cy="20" r="12"/><circle cx="20" cy="20" r="4"/><path d="M20 1v8m0 22v8M1 20h8m22 0h8"/></svg><b>Ogni punto, una prospettiva.</b><p class="mp-note">Scegli un nome o tocca una sfera per esplorare il profilo.</p></div>'; return; }
  var c=p.card, h='<h3>'+esc(p.name)+'</h3><div class="mp-tags">'+(c&&c.area?'<span class="tag">'+esc(c.area)+'</span>':'')+(c&&c.result?'<span class="tag">'+esc(c.result)+'</span>':'')+(p.estimated?'<span class="tag est">stimato</span>':'')+'</div>';
  h+='<dl class="mp-kv"><dt>Economia</dt><dd>'+esc(PM.phrase('x',p.x))+'</dd><dt>Autorità</dt><dd>'+esc(PM.phrase('y',p.y))+'</dd><dt>Valori sociali</dt><dd>'+esc(PM.phrase('z',p.z))+'</dd></dl>';
  h+='<p class="mp-note">Valori indicativi: X '+PM.fmt(p.x)+' · Y '+PM.fmt(p.y)+' · Z '+PM.fmt(p.z)+'. Origine: '+esc(p.source)+'.</p>';
  if(c&&c.compat) h+='<p><b>Più compatibile:</b> '+esc(c.compat.name)+' ('+c.compat.pct+'%)</p>';
  h+='<p class="mp-note"><b>Più vicini sulla mappa:</b> '+PM.nearest(p,2).map(function(n){ return esc(n.p.name); }).join(' e ')+'</p>';
  if(p.notes) h+='<p class="mp-note">'+esc(p.notes)+'</p>';
  h+='<details><summary>Lettura descrittiva</summary>'+PM.reading(p).map(function(t){ return '<p>'+esc(t)+'</p>'; }).join('')+'</details>';
  h+='<details><summary>Profilo sui 12 assi</summary>'+PM.axisBars(c)+'</details>';
  h+='<button class="mp-btn mp-wide" id="mpGoCmp" type="button">Confronta con un amico</button>';
  box.innerHTML=h;
  var g=$('mpGoCmp'); if(g) g.onclick=function(){ showTab('compare'); if(PM.setCompare) PM.setCompare(p.id); };
}

/* ---- Legenda dei colori ---- */
function updateLegend(){
  var m=PM.MAP[state.mode], lg=$('mpLegend'); lg.textContent='';
  var a=document.createElement('span'); a.className='mp-end'; a.textContent=m.neg+' −10';
  var bar=document.createElement('span'); bar.className='mp-lgbar'; bar.setAttribute('aria-hidden','true'); bar.style.background=PM.gradient(state.mode);
  var b=document.createElement('span'); b.className='mp-end'; b.textContent=m.pos+' +10';
  lg.appendChild(a); lg.appendChild(bar); lg.appendChild(b);
}
function markViews(v){
  Array.prototype.forEach.call(document.querySelectorAll('#mpViews button'),function(b){ b.setAttribute('aria-pressed',b.dataset.v===v?'true':'false'); });
}

/* ---- Schede ---- */
function showTab(name){
  document.querySelectorAll('.tab').forEach(function(t){ var on=t.dataset.tab===name; t.classList.toggle('is-active',on); t.setAttribute('aria-selected',on?'true':'false'); t.setAttribute('tabindex',on?'0':'-1'); });
  document.querySelectorAll('.panel').forEach(function(p){ var on=p.id==='panel-'+name; p.hidden=!on; p.classList.toggle('is-active',on); });
  if(PM.people.length){
    if(name==='profiles'&&!state.rendered.profiles){ PM.renderProfiles($('profilesRoot')); state.rendered.profiles=1; }
    if(name==='stats'&&!state.rendered.stats){ PM.renderStats($('statsRoot')); state.rendered.stats=1; }
    if(name==='compare'&&!state.rendered.compare){ PM.renderCompare($('compareRoot')); state.rendered.compare=1; }
  }
  if(name==='map'){ setTimeout(function(){ Scene.resize(); Scene.requestRender(); },40); }
  window.scrollTo({top:0,behavior:'auto'});
}

PM.openTab=showTab;
function bind(){
  Scene.onReady=function(){ $('mpRenderStatus').textContent='3D interattivo'; };
  var originalMsg=Scene.showMsg; Scene.showMsg=function(text){ originalMsg(text); $('mpRenderStatus').textContent='3D non disponibile'; };
  document.querySelectorAll('.tab').forEach(function(t){ t.addEventListener('keydown',function(e){ var list=Array.from(document.querySelectorAll('.tab')), n=list.indexOf(t); if(e.key==='ArrowRight'||e.key==='ArrowLeft'||e.key==='Home'||e.key==='End'){ e.preventDefault(); var to=e.key==='Home'?0:e.key==='End'?list.length-1:(n+(e.key==='ArrowRight'?1:-1)+list.length)%list.length; list[to].focus(); showTab(list[to].dataset.tab); } }); });
  document.querySelectorAll('.tab').forEach(function(t){ t.addEventListener('click',function(){ showTab(t.dataset.tab); }); });
  Array.prototype.forEach.call(document.querySelectorAll('#mpViews button'),function(b){ b.addEventListener('click',function(){ markViews(b.dataset.v); Scene.setView(b.dataset.v); }); });
  Array.prototype.forEach.call(document.querySelectorAll('#mpColor button'),function(b){
    b.addEventListener('click',function(){
      state.mode=b.dataset.c;
      Array.prototype.forEach.call(document.querySelectorAll('#mpColor button'),function(x){ x.setAttribute('aria-pressed',x===b?'true':'false'); });
      Scene.setMode(state.mode); updateLegend(); renderList();
    });
  });
  [['mpNames','names'],['mpGrid','grid'],['mpProj','proj'],['mpLinks','links'],['mpSpin','spin'],['mpLock','lock']].forEach(function(a){
    $(a[0]).addEventListener('change',function(e){
      Scene.setOpt(a[1],e.target.checked);
      if(a[1]==='lock'&&e.target.checked) $('mpSpin').checked=false;
      if(a[1]==='spin'&&e.target.checked&&$('mpLock').checked){ $('mpLock').checked=false; Scene.setOpt('lock',false); }
    });
  });
  $('mpReset').addEventListener('click',function(){ PM.sel=null; renderList(); renderDetail(); markViews('persp'); Scene.resetView(); PM.emit('select',null); });
  $('mpAll').addEventListener('click',function(){ $('mpSearch').value=''; PM.sel=null; renderList(); renderDetail(); markViews('persp'); Scene.resetView(); PM.emit('select',null); });
  $('mpSearch').addEventListener('input',renderList);
  $('mpRetry').addEventListener('click',function(){ Scene.hideMsg(); startScene(); });
  Scene.onPick=function(id){ PM.select(id); };
  Scene.onView=function(v){ markViews(v); };
  Scene.onSpinStop=function(){ $('mpSpin').checked=false; };
}

function boot(){
  bind(); updateLegend();
  PM.load().then(function(){
    $('atlasCount').textContent=PM.people.length; $('atlasCards').textContent=PM.withCards().length;
    renderList(); renderDetail(); startScene();
  }).catch(function(e){
    var box=$('loadError'); box.hidden=false;
    box.textContent='Impossibile caricare i dati ('+e.message+'). Se hai aperto il file direttamente dal computer, pubblicalo su GitHub Pages o avvia un piccolo server locale: i browser bloccano la lettura di data/people.json dai file locali.';
    Scene.showMsg('Dati non disponibili.');
  });
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
