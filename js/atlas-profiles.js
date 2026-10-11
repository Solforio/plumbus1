(window.__atlas=window.__atlas||{})['profiles']='atlas-4';
/* ==== Profili: schede, barre dei 12 assi, sintesi del gruppo ==== */
(function(){
'use strict';
var esc=function(s){return PM.esc(s);};

PM.axisBars=function(card,color){
  if(!card||!card.axes) return '<p class="note">Scheda 12 Axes non disponibile: lettura basata solo sulla bussola.</p>';
  var h='<div class="bars">';
  card.axes.forEach(function(v,i){
    var a=PM.axes12[i], w=Math.abs(v)/2, left=v<0?50-w:50;
    var pole=PM.axisPole(i,v);
    h+='<div class="bar-row"><div class="bar-top"><span>'+esc(a.left)+'</span><b>'+esc(a.name)+'</b><span>'+esc(a.right)+'</span></div>'+
       '<div class="bar" role="img" aria-label="'+esc(a.name+': '+(v===0?'in equilibrio':pole+' '+Math.abs(v)+'%'))+'"><i style="left:'+left+'%;width:'+w+'%'+(color?';background:'+color:'')+'"></i></div>'+
       '<div class="bar-top"><span></span><span>'+(v===0?'in equilibrio':'<b>'+esc(pole)+' '+Math.abs(v)+'%</b>')+'</span><span></span></div></div>';
  });
  return h+'</div>';
};

function groupSummary(){
  var ps=PM.people, h='<div class="card"><h2>Sintesi del gruppo</h2><div class="cols c3">';
  ['x','y','z'].forEach(function(k){
    var m=PM.MAP[k], l=0,c=0,r=0;
    ps.forEach(function(p){ if(Math.abs(p[k])<1.1) c++; else if(p[k]<0) l++; else r++; });
    h+='<div><h3>'+m.name+'</h3><p class="note">'+esc(m.neg)+': <b>'+l+'</b> · Centro: <b>'+c+'</b> · '+esc(m.pos)+': <b>'+r+'</b></p></div>';
  });
  h+='</div>';
  var cen=ps.slice().sort(function(a,b){return (Math.abs(a.x)+Math.abs(a.y)+Math.abs(a.z))-(Math.abs(b.x)+Math.abs(b.y)+Math.abs(b.z));});
  var pairs=[]; for(var i=0;i<ps.length;i++) for(var j=i+1;j<ps.length;j++) pairs.push({a:ps[i],b:ps[j],d:PM.dist3(ps[i],ps[j])});
  pairs.sort(function(a,b){return a.d-b.d;});
  h+='<p>Più vicino al centro della mappa: <b>'+esc(cen[0].name)+'</b>. Più lontano dal centro: <b>'+esc(cen[cen.length-1].name)+'</b>.</p>';
  h+='<p>Coppia più vicina: <b>'+esc(pairs[0].a.name)+' e '+esc(pairs[0].b.name)+'</b>. Coppia più distante: <b>'+esc(pairs[pairs.length-1].a.name)+' e '+esc(pairs[pairs.length-1].b.name)+'</b>.</p>';
  return h+'<p class="note">Le letture sono descrittive e calcolate sulle posizioni stimate; non sono risultati del test.</p></div>';
}

function guide(){
  var h='<details class="guide"><summary>Guida ai 12 assi del test</summary><div class="scroll"><table class="t"><thead><tr><th>#</th><th>Asse</th><th>Polo sinistro</th><th>Polo destro</th></tr></thead><tbody>';
  PM.axes12.forEach(function(a,i){ h+='<tr><td>'+(i+1)+'</td><td><b>'+esc(a.name)+'</b></td><td>'+esc(a.left)+'</td><td>'+esc(a.right)+'</td></tr>'; });
  h+='</tbody></table></div><p class="note">Ogni barra parte dal centro e va verso il polo scelto; la percentuale indica quanto. Il sito descrive il test come educativo e non validato clinicamente. L\u2019orientamento sinistra/destra dei poli è ricavato dalle schede (in particolare da quella in italiano).</p></details>';
  return h;
}

function card(p){
  var c=p.card, col=PM.colorOf('x',p.x);
  var h='<article class="card pcard" style="--person:'+col+'" id="pf-'+esc(p.id)+'"><div class="pname"><span class="person-avatar" aria-hidden="true">'+esc(p.name.slice(0,2).toUpperCase())+'</span><span class="dot" style="background:'+col+'"></span><h2 style="margin:0">'+esc(p.name)+'</h2></div>';
  h+='<div>'+(c&&c.area?'<span class="tag">'+esc(c.area)+'</span>':'')+(c&&c.result?'<span class="tag">'+esc(c.result)+'</span>':'')+(p.estimated?'<span class="tag est">posizione stimata</span>':'')+'</div>';
  h+='<dl class="kv" style="margin:.6rem 0"><dt>Economia</dt><dd>'+esc(PM.phrase('x',p.x))+'</dd><dt>Autorità</dt><dd>'+esc(PM.phrase('y',p.y))+'</dd><dt>Valori sociali</dt><dd>'+esc(PM.phrase('z',p.z))+'</dd></dl>';
  PM.reading(p).forEach(function(t){ h+='<p>'+esc(t)+'</p>'; });
  h+='<details open><summary>Profilo sui 12 assi</summary>'+PM.axisBars(c)+'</details>';
  if(c&&c.compat) h+='<p><b>Più compatibile:</b> '+esc(c.compat.name)+' ('+c.compat.pct+'%)</p>';
  if(c&&c.others&&c.others.length) h+='<p class="note"><b>Altre personalità:</b> '+c.others.map(function(o){return esc(o.name)+' '+o.pct+'%';}).join(' · ')+'</p>';
  if(c&&c.countries&&c.countries.length) h+='<p class="note"><b>Paesi vicini:</b> '+c.countries.map(function(o){return esc(o.name)+' '+o.pct+'%';}).join(' · ')+'</p>';
  var nn=PM.nearest(p,2).map(function(n){return esc(n.p.name);}).join(' e ');
  h+='<p class="note"><b>Più vicini sulla mappa:</b> '+nn+'</p>';
  if(p.notes) h+='<p class="note">'+esc(p.notes)+'</p>';
  h+='<div class="profile-actions"><button type="button" class="btn ghost" data-map="'+esc(p.id)+'">Trova sulla mappa ↗</button><button type="button" class="btn" data-compare="'+esc(p.id)+'">Confronta</button></div>';
  return h+'</article>';
}

PM.renderProfiles=function(root){
  var h=groupSummary()+guide()+'<div class="profile-toolbar"><input id="profileSearch" type="search" aria-label="Cerca nei profili" placeholder="Trova un profilo…"><span id="profileCount">'+PM.people.length+' prospettive da esplorare</span></div><div class="cols">';
  PM.people.forEach(function(p){ h+=card(p); });
  root.innerHTML=h+'</div>';
  root.querySelector('#profileSearch').addEventListener('input',function(e){ var q=e.target.value.trim().toLowerCase(),n=0; PM.people.forEach(function(p){ var el=root.querySelector('#pf-'+p.id),on=p.name.toLowerCase().indexOf(q)>=0; el.hidden=!on;if(on)n++; }); root.querySelector('#profileCount').textContent=n+' profili visibili'; });
  root.querySelectorAll('[data-map]').forEach(function(b){b.onclick=function(){PM.openTab('map');PM.select(b.dataset.map);};});
  root.querySelectorAll('[data-compare]').forEach(function(b){b.onclick=function(){PM.openTab('compare');PM.setCompare(b.dataset.compare);};});
};
})();
