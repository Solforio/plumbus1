(window.__atlas=window.__atlas||{})['stats']='atlas-4';
/* ==== Statistiche (grafici in SVG/HTML, senza librerie) ==== */
(function(){
'use strict';
var esc=function(s){return PM.esc(s);}, f1=function(n){return PM.fmt(n,1);};

function hist(key){
  var m=PM.MAP[key], bins=new Array(9).fill(0), names=[[],[],[],[],[],[],[],[],[]];
  PM.people.forEach(function(p){ var b=Math.max(-4,Math.min(4,Math.round(p[key]/2.22)))+4; bins[b]++; names[b].push(p.name); });
  var mx=Math.max(2,Math.max.apply(null,bins)), W=300,Hh=154,bw=26,gap=7,x0=(W-9*(bw+gap)+gap)/2, base=118, svg='';
  bins.forEach(function(c,i){
    var hh=c/mx*86, x=x0+i*(bw+gap), v=(i-4)*2.22;
    svg+='<rect x="'+x+'" y="'+(base-hh)+'" width="'+bw+'" height="'+Math.max(hh,0)+'" rx="5" fill="'+PM.colorOf(key,v)+'" stroke="#123026" stroke-width="1.2"/>';
    if(c) svg+='<text x="'+(x+bw/2)+'" y="'+(base-hh-5)+'" text-anchor="middle" font-size="12" font-weight="700">'+c+'</text>';
  });
  svg+='<line x1="8" x2="'+(W-8)+'" y1="'+base+'" y2="'+base+'" stroke="#123026" stroke-width="1.4"/>';
  svg+='<text x="8" y="134" font-size="12" font-weight="700">'+esc(m.neg)+'</text><text x="'+(W/2)+'" y="134" font-size="12" text-anchor="middle" fill="#4d6056">Centro</text><text x="'+(W-8)+'" y="134" font-size="12" text-anchor="end" font-weight="700">'+esc(m.pos)+'</text>';
  svg+='<text x="8" y="149" font-size="10.5" fill="#4d6056">← più marcato</text><text x="'+(W-8)+'" y="149" font-size="10.5" text-anchor="end" fill="#4d6056">più marcato →</text>';
  return '<div class="card"><h3>'+esc(m.name)+'</h3><svg class="chart" viewBox="0 0 '+W+' '+Hh+'" role="img" aria-label="Istogramma '+esc(m.name)+'">'+svg+'</svg></div>';
}

function donut(segs,center){
  var tot=segs.reduce(function(s,a){return s+a.v;},0)||1, R=44, C=2*Math.PI*R, off=0, svg='';
  segs.forEach(function(s){ if(!s.v) return; var len=s.v/tot*C;
    svg+='<circle cx="60" cy="60" r="'+R+'" fill="none" stroke="'+s.c+'" stroke-width="20" stroke-dasharray="'+len+' '+(C-len)+'" stroke-dashoffset="'+(-off)+'" transform="rotate(-90 60 60)"/>'; off+=len; });
  svg+='<text x="60" y="66" text-anchor="middle" font-size="20" font-weight="700" font-family="Georgia,serif">'+center+'</text>';
  var leg=segs.map(function(s){return '<li><span class="dot" style="background:'+s.c+';width:12px;height:12px;display:inline-block;vertical-align:middle;margin-right:.4rem"></span>'+esc(s.l)+': <b>'+s.v+'</b></li>';}).join('');
  return '<div style="display:flex;gap:1rem;align-items:center;flex-wrap:wrap"><svg viewBox="0 0 120 120" width="130" height="130" role="img">'+svg+'</svg><ul class="note" style="list-style:none;padding:0;margin:0">'+leg+'</ul></div>';
}

function areaDonut(){
  var cnt={Left:0,Center:0,Libertarian:0,nl:0,nc:0};
  PM.people.forEach(function(p){ if(!p.card) cnt.nc++; else if(!p.card.area) cnt.nl++; else cnt[p.card.area]=(cnt[p.card.area]||0)+1; });
  return '<div class="card"><h2>Aree del test</h2>'+donut([
    {l:'Left',v:cnt.Left,c:'#b5457c'},{l:'Center',v:cnt.Center,c:'#0f7a57'},{l:'Libertarian',v:cnt.Libertarian,c:'#c9962f'},
    {l:'Area non leggibile',v:cnt.nl,c:'#9aa79f'},{l:'Senza scheda',v:cnt.nc,c:'#d8d3c4'}],PM.people.length)+'</div>';
}
function polesDonuts(){
  var h='<div class="card"><h2>Dove pende il gruppo</h2><div class="pole-distributions">';
  ['x','y','z'].forEach(function(k){
    var m=PM.MAP[k], l=0,c=0,r=0;
    PM.people.forEach(function(p){ if(Math.abs(p[k])<1.1) c++; else if(p[k]<0) l++; else r++; });
    h+='<div><h3>'+m.name+'</h3>'+donut([{l:m.neg,v:l,c:m.c[0]},{l:'Centro',v:c,c:'#d8d3c4'},{l:m.pos,v:r,c:m.c[1]}],PM.people.length)+'</div>';
  });
  return h+'</div></div>';
}

function avg12(cards){
  var rows=PM.axes12.map(function(a,i){ var vals=cards.map(function(p){return p.card.axes[i];}); return {i:i,m:PM.mean(vals),sd:PM.sd(vals)}; });
  var h='<div class="card"><h2>Media del gruppo sui 12 assi</h2><div class="bars">';
  rows.forEach(function(r){
    var a=PM.axes12[r.i], v=r.m, w=Math.abs(v)/2, left=v<0?50-w:50, col=PM.AX_PALETTE[r.i%12], pole=Math.abs(v)<3?'in equilibrio':(v<0?a.left:a.right)+' '+Math.round(Math.abs(v))+'%';
    h+='<div class="bar-row"><div class="bar-top"><span>'+esc(a.left)+'</span><b>'+esc(a.name)+'</b><span>'+esc(a.right)+'</span></div><div class="bar" style="height:16px;background:repeating-linear-gradient(90deg,#efe9d8,#efe9d8 10px,#f6f2e7 10px,#f6f2e7 20px)"><i style="left:'+left+'%;width:'+w+'%;background:'+col+';border:1px solid #123026"></i></div><div class="bar-top"><span></span><b style="color:'+col+'">'+esc(pole)+'</b><span></span></div></div>';
  });
  return h+'</div><p class="note">Media su '+cards.length+' schede disponibili.</p></div>';
}
function dispersion(cards){
  var rows=PM.axes12.map(function(a,i){ return {a:a,sd:PM.sd(cards.map(function(p){return p.card.axes[i];}))}; }).sort(function(x,y){return y.sd-x.sd;});
  var mx=Math.max.apply(null,rows.map(function(r){return r.sd;}))||1;
  var h='<div class="card"><h2>Dispersione: dove si divide il gruppo</h2><div class="bars">';
  rows.forEach(function(r){
    var lab=r.sd<25?'concordi':(r.sd<45?'variabili':'divisi');
    h+='<div class="bar-row"><div class="bar-top"><b>'+esc(r.a.name)+'</b><span>'+lab+' · dev. std '+Math.round(r.sd)+'</span></div><div class="bar plainbar" style="background:#efe9d8"><i style="left:0;width:'+(r.sd/mx*100)+'%;background:'+(r.sd>=45?'#b5457c':(r.sd>=25?'#c9962f':'#0f7a57'))+'"></i></div></div>';
  });
  return h+'</div><p class="note">Più la barra è lunga, più le posizioni sono distanti tra loro su quell\u2019asse.</p></div>';
}
function intensity(cards){
  var bins=[0,0,0,0,0], tot=0, sum=0;
  cards.forEach(function(p){ p.card.axes.forEach(function(v){ var a=Math.abs(v); bins[Math.min(4,Math.floor((a-1)/20<0?0:(a-1)/20))]++; tot++; sum+=a; }); });
  var mx=Math.max.apply(null,bins)||1, svg='', lab=['0–20%','21–40%','41–60%','61–80%','81–100%'];
  bins.forEach(function(c,i){ var hh=c/mx*90, x=20+i*55;
    svg+='<rect x="'+x+'" y="'+(110-hh)+'" width="42" height="'+hh+'" rx="6" fill="#0f7a57" opacity="'+(.35+i*.16)+'" stroke="#123026" stroke-width="1.2"/><text x="'+(x+21)+'" y="'+(104-hh)+'" text-anchor="middle" font-size="12" font-weight="700">'+c+'</text><text x="'+(x+21)+'" y="128" text-anchor="middle" font-size="11.5">'+lab[i]+'</text>'; });
  return '<div class="card"><h2>Intensità delle posizioni</h2><svg class="chart" viewBox="0 0 300 138" role="img" aria-label="Istogramma intensità">'+svg+'</svg><p class="note">Quante risposte cadono in ogni fascia di intensità (tutti i 12 assi, '+tot+' valori). Media: '+Math.round(sum/tot)+'%.</p></div>';
}
function compat(cards){
  var rows=cards.filter(function(p){return p.card.compat;}).sort(function(a,b){return b.card.compat.pct-a.card.compat.pct;});
  var h='<div class="card"><h2>Compatibilità massima</h2><div class="bars">';
  rows.forEach(function(p){ h+='<div class="bar-row"><div class="bar-top"><b>'+esc(p.name)+' → '+esc(p.card.compat.name)+'</b><span>'+p.card.compat.pct+'%</span></div><div class="bar" style="background:#efe9d8"><i style="left:0;width:'+p.card.compat.pct+'%;background:#0f7a57"></i></div></div>'; });
  return h+'</div><p class="note">Percentuali di somiglianza riportate dal test, non probabilità né approvazione di una personalità.</p></div>';
}
function corr(){
  var ks=['x','y','z'], col=function(r){ var a=Math.min(1,Math.abs(r)); return r>=0?'rgba(15,122,87,'+(.12+a*.55)+')':'rgba(181,69,124,'+(.12+a*.55)+')'; };
  var vec={}; ks.forEach(function(k){ vec[k]=PM.people.map(function(p){return p[k];}); });
  var h='<div class="card"><h2>Correlazioni tra gli assi</h2><div class="scroll"><table class="t"><thead><tr><th></th>'+ks.map(function(k){return '<th>'+PM.MAP[k].name+'</th>';}).join('')+'</tr></thead><tbody>';
  ks.forEach(function(a){ h+='<tr><th>'+PM.MAP[a].name+'</th>'; ks.forEach(function(b){ var r=PM.pearson(vec[a],vec[b]); h+='<td style="background:'+col(r)+';font-weight:700">'+(a===b?'1':f1(r))+'</td>'; }); h+='</tr>'; });
  h+='</tbody></table></div>';
  [['x','y'],['x','z'],['y','z']].forEach(function(pr){
    var r=PM.pearson(vec[pr[0]],vec[pr[1]]), a=Math.abs(r), w=a<.2?'quasi nulla':(a<.4?'debole':(a<.7?'moderata':'forte'));
    var A=PM.MAP[pr[0]],B=PM.MAP[pr[1]];
    h+='<p>'+A.name+' e '+B.name+': correlazione '+w+' ('+f1(r)+')'+(a>=.2?(r>0?'. Chi pende verso '+esc(A.pos.toLowerCase())+' tende a pendere verso '+esc(B.pos.toLowerCase())+'.':'. Chi pende verso '+esc(A.pos.toLowerCase())+' tende a pendere verso '+esc(B.neg.toLowerCase())+'.'):'.')+'</p>';
  });
  return h+'<p class="note">Con pochi partecipanti le correlazioni sono instabili: descrivono solo questo gruppo.</p></div>';
}
function mapTable(){
  var h='<div class="card"><h2>Assi della mappa in numeri</h2><div class="scroll"><table class="t"><thead><tr><th>Asse</th><th>Media</th><th>Mediana</th><th>Dev. std</th><th>Estremi</th></tr></thead><tbody>';
  ['x','y','z'].forEach(function(k){
    var v=PM.people.map(function(p){return p[k];}), s=PM.people.slice().sort(function(a,b){return a[k]-b[k];}), m=PM.MAP[k];
    h+='<tr><td><b>'+m.name+'</b></td><td>'+f1(PM.mean(v))+'</td><td>'+f1(PM.median(v))+'</td><td>'+f1(PM.sd(v))+'</td><td>'+esc(m.neg)+': '+esc(s[0].name)+' · '+esc(m.pos)+': '+esc(s[s.length-1].name)+'</td></tr>';
  });
  return h+'</tbody></table></div><p class="note">Valori su scala −10…+10 (stime dagli screenshot).</p></div>';
}
function kpis(cards){
  var all=[]; cards.forEach(function(p){ all=all.concat(p.card.axes.map(Math.abs)); });
  var sds=PM.axes12.map(function(a,i){ return {a:a,sd:PM.sd(cards.map(function(p){return p.card.axes[i];}))}; }).sort(function(x,y){return x.sd-y.sd;});
  return '<div class="kpis"><div class="kpi"><b>'+PM.people.length+'</b><span>partecipanti</span></div><div class="kpi"><b>'+cards.length+'</b><span>schede 12 Axes</span></div><div class="kpi"><b>'+Math.round(PM.mean(all))+'%</b><span>intensità media</span></div><div class="kpi"><b style="font-size:1.1rem">'+esc(sds[0].a.name)+' / '+esc(sds[sds.length-1].a.name)+'</b><span>più concorde / più diviso</span></div></div>';
}

PM.renderStats=function(root){
  var cards=PM.withCards();
  if(!cards.length){ root.innerHTML='<div class="card"><p>Nessuna scheda 12 Axes disponibile.</p></div>'; return; }
  root.innerHTML='<div class="stats-tools"><button type="button" class="btn ghost" id="statsCSV">Scarica i dati · CSV ↓</button></div>'+kpis(cards)+
    '<div class="cols c3">'+hist('x')+hist('y')+hist('z')+'</div>'+
    '<div class="cols">'+areaDonut()+polesDonuts()+'</div>'+
    '<div class="cols">'+avg12(cards)+dispersion(cards)+'</div>'+
    '<div class="cols">'+intensity(cards)+compat(cards)+'</div>'+
    '<div class="cols">'+corr()+mapTable()+'</div>';
  root.querySelector('#statsCSV').onclick=function(){ var heads=['id','nome','economia','autorita','valori_sociali'].concat(PM.axes12.map(function(a){return a.name;})); var rows=PM.people.map(function(p){return [p.id,p.name,p.x,p.y,p.z].concat(p.card&&p.card.axes?p.card.axes:new Array(12).fill(''));}); var cell=function(v){var s=String(v==null?'':v);if(/^[=+@]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}; var csv='\uFEFF'+[heads].concat(rows).map(function(r){return r.map(cell).join(';');}).join('\r\n');var url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='plumbus-risultati.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000); };
};
})();
