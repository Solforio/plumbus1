(window.__atlas=window.__atlas||{})['compare']='atlas-4';
/* ==== Confronto tra due persone e vicinanze ==== */
(function(){
'use strict';
var esc=function(s){return PM.esc(s);};
function word(a){ return a>=88?'molto vicini':(a>=75?'vicini':(a>=60?'a media distanza':'distanti')); }

function track(posA,posB){
  return '<div class="track"><span class="mk mkA" style="left:'+posA+'%" title="A"></span><span class="mk mkB" style="left:'+posB+'%" title="B"></span></div>';
}
function result(a,b){
  if(a.id===b.id) return '<div class="card"><p>Scegli due persone diverse per confrontarle.</p></div>';
  var ma=PM.mapAffinity(a,b), xa=PM.axesAffinity(a,b);
  var h='<div class="card"><h2>'+esc(a.name)+' e '+esc(b.name)+'</h2><div class="cols"><div><span class="big">'+ma+'%</span><p class="note">vicinanza sulla mappa ('+word(ma)+'), distanza '+PM.fmt(PM.dist3(a,b),1)+' su 34,6</p></div>';
  h+= xa==null? '<div><p class="note">Una delle due persone non ha la scheda 12 Axes: il confronto sui 12 assi non è disponibile.</p></div>' : '<div><span class="big">'+xa+'%</span><p class="note">vicinanza sui 12 assi ('+word(xa)+')</p></div>';
  h+='</div><p class="note">Questi indici misurano soltanto la vicinanza geometrica dei valori. Non sono percentuali di accordo politico o di affinità personale.</p><div class="legend-ab"><span><span class="dot" style="background:var(--em);display:inline-block;vertical-align:middle;width:14px;height:14px"></span> '+esc(a.name)+'</span><span><span style="display:inline-block;width:12px;height:12px;background:var(--mag);transform:rotate(45deg);vertical-align:middle"></span> '+esc(b.name)+'</span></div>';
  h+='<h3>Assi della mappa</h3>';
  ['x','y','z'].forEach(function(k){
    var m=PM.MAP[k];
    h+='<div class="cmp"><div class="bar-top"><span>'+esc(m.neg)+'</span><b>'+esc(m.name)+'</b><span>'+esc(m.pos)+'</span></div>'+track((a[k]+10)*5,(b[k]+10)*5)+'<div class="bar-top"><span>'+esc(a.name)+': '+esc(PM.phrase(k,a[k]))+'</span><span>'+esc(b.name)+': '+esc(PM.phrase(k,b[k]))+'</span></div></div>';
  });
  if(xa!=null){
    var agree=[],diff=[];
    PM.axes12.forEach(function(ax,i){
      var va=a.card.axes[i], vb=b.card.axes[i], d=Math.abs(va-vb);
      var same=(va*vb>0)||(Math.abs(va)<=15&&Math.abs(vb)<=15);
      if(same&&d<=25) agree.push(ax.name);
      else if(d>=60||(va*vb<0&&Math.abs(va)>=30&&Math.abs(vb)>=30)) diff.push(ax.name);
    });
    h+='<h3 style="margin-top:1rem">I 12 assi</h3>';
    PM.axes12.forEach(function(ax,i){
      var va=a.card.axes[i], vb=b.card.axes[i];
      h+='<div class="cmp"><div class="bar-top"><span>'+esc(ax.left)+'</span><b>'+esc(ax.name)+'</b><span>'+esc(ax.right)+'</span></div>'+track((va+100)/2,(vb+100)/2)+'<div class="bar-top"><span>'+esc(a.name)+': '+(va===0?'equilibrio':esc(PM.axisPole(i,va))+' '+Math.abs(va)+'%')+'</span><span>'+esc(b.name)+': '+(vb===0?'equilibrio':esc(PM.axisPole(i,vb))+' '+Math.abs(vb)+'%')+'</span></div></div>';
    });
    h+='<p><b>D\u2019accordo su:</b> '+(agree.length?agree.map(esc).join(', '):'nessun asse in modo netto')+'.</p><p><b>Più distanti su:</b> '+(diff.length?diff.map(esc).join(', '):'nessun asse in modo netto')+'.</p>';
  }
  return h+'</div>';
}
function ranking(a){
  var rows=PM.people.filter(function(q){return q.id!==a.id;}).map(function(q){return {q:q,m:PM.mapAffinity(a,q),x:PM.axesAffinity(a,q)};}).sort(function(x,y){return y.m-x.m;});
  var h='<div class="card"><h2>Chi è più vicino a '+esc(a.name)+'</h2><div class="scroll"><table class="t"><thead><tr><th>Persona</th><th>Mappa</th><th>12 assi</th></tr></thead><tbody>';
  rows.forEach(function(r){ h+='<tr><td><b>'+esc(r.q.name)+'</b></td><td>'+r.m+'%</td><td>'+(r.x==null?'—':r.x+'%')+'</td></tr>'; });
  return h+'</tbody></table></div><p class="note">Indice sulla mappa = 100 − distanza 3D / 34,6 × 100. Indice sui 12 assi = 100 − differenza media / 2.</p></div>';
}
function pairs(){
  var ps=PM.people, arr=[]; for(var i=0;i<ps.length;i++) for(var j=i+1;j<ps.length;j++) arr.push({a:ps[i],b:ps[j],m:PM.mapAffinity(ps[i],ps[j])});
  arr.sort(function(x,y){return y.m-x.m;});
  function list(a){ return '<ol>'+a.map(function(r){return '<li><b>'+esc(r.a.name)+' e '+esc(r.b.name)+'</b> — '+r.m+'%</li>';}).join('')+'</ol>'; }
  return '<div class="cols"><div class="card"><h2>Le coppie più vicine</h2>'+list(arr.slice(0,4))+'</div><div class="card"><h2>Le coppie più distanti</h2>'+list(arr.slice(-4).reverse())+'</div></div>';
}

PM.renderCompare=function(root){
  var ps=PM.people, opt=function(sel){ return ps.map(function(p){return '<option value="'+esc(p.id)+'"'+(p.id===sel?' selected':'')+'>'+esc(p.name)+'</option>';}).join(''); };
  var A=ps[0].id, B=ps[1]?ps[1].id:ps[0].id;
  root.innerHTML='<div class="pickers"><label>Persona A<select id="cmpA">'+opt(A)+'</select></label><label>Persona B<select id="cmpB">'+opt(B)+'</select></label></div><div id="cmpOut"></div><div id="cmpRank"></div>'+pairs();
  var sa=root.querySelector('#cmpA'), sb=root.querySelector('#cmpB');
  function upd(){ var a=PM.byId(sa.value), b=PM.byId(sb.value); root.querySelector('#cmpOut').innerHTML=result(a,b); root.querySelector('#cmpRank').innerHTML=ranking(a); }
  sa.addEventListener('change',upd); sb.addEventListener('change',upd); upd();
  PM.setCompare=function(id){ sa.value=id; upd(); };
};
})();
