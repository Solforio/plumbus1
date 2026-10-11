(window.__atlas=window.__atlas||{})['core']='atlas-4';
/* ==== Dati, utilità e logica condivisa ==== */
(function(){
'use strict';
var PM = window.PM = { people:[], axes12:[], sel:null, listeners:{} };

PM.on = function(e,f){ (PM.listeners[e]=PM.listeners[e]||[]).push(f); };
PM.emit = function(e,a){ (PM.listeners[e]||[]).forEach(function(f){ try{f(a);}catch(err){console.error(err);} }); };
PM.esc = function(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); };
PM.fmt = function(n,d){ return (Math.round(n*Math.pow(10,d==null?1:d))/Math.pow(10,d==null?1:d)).toString().replace('.',','); };
PM.byId = function(id){ return PM.people.filter(function(p){return p.id===id;})[0]||null; };

/* ---- Assi della mappa ---- */
PM.MAP = {
  x:{name:'Economia', neg:'Socialismo', pos:'Capitalismo', c:['#c43230','#2462c4']},
  y:{name:'Autorità', neg:'Libertario', pos:'Autoritario', c:['#169680','#703a98']},
  z:{name:'Valori sociali', neg:'Progressismo', pos:'Tradizionalismo', c:['#c4408a','#c48a18']}
};
var NEUTRAL=[206,202,188];
function hex2rgb(h){ return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]; }
PM.colorOf = function(key,v){
  var m=PM.MAP[key], t=Math.max(-1,Math.min(1,v/7)), a=Math.pow(Math.abs(t),0.8);
  var tgt=hex2rgb(t<0?m.c[0]:m.c[1]);
  var r=[0,1,2].map(function(i){return Math.round(NEUTRAL[i]+(tgt[i]-NEUTRAL[i])*a);});
  return '#'+r.map(function(n){return ('0'+n.toString(16)).slice(-2);}).join('');
};
PM.gradient = function(key){
  var m=PM.MAP[key];
  return 'linear-gradient(90deg,'+m.c[0]+' 15%,rgb('+NEUTRAL.join(',')+') 50%,'+m.c[1]+' 85%)';
};
PM.degree = function(v){
  var k=Math.round(Math.abs(v)/2.22);
  return ['centrale','lieve','moderato','marcato','forte'][Math.min(4,k)];
};
PM.phrase = function(key,v){
  var m=PM.MAP[key];
  if(Math.abs(v)<1.1) return 'Centro';
  return (v<0?m.neg:m.pos)+' '+PM.degree(v);
};
PM.dist3 = function(a,b){ var dx=a.x-b.x,dy=a.y-b.y,dz=a.z-b.z; return Math.sqrt(dx*dx+dy*dy+dz*dz); };
PM.mapAffinity = function(a,b){ return Math.round(100*(1-PM.dist3(a,b)/34.64)); };
PM.axesAffinity = function(a,b){
  if(!a.card||!b.card) return null;
  var s=0; for(var i=0;i<12;i++) s+=Math.abs(a.card.axes[i]-b.card.axes[i]);
  return Math.round(100-(s/12)/2);
};
PM.nearest = function(p,n){
  return PM.people.filter(function(q){return q.id!==p.id;})
    .map(function(q){return {p:q,d:PM.dist3(p,q)};})
    .sort(function(a,b){return a.d-b.d;}).slice(0,n||2);
};

/* ---- Statistica ---- */
PM.mean = function(a){ return a.length? a.reduce(function(s,v){return s+v;},0)/a.length : 0; };
PM.median = function(a){ if(!a.length) return 0; var s=a.slice().sort(function(x,y){return x-y;}),m=s.length>>1; return s.length%2?s[m]:(s[m-1]+s[m])/2; };
PM.sd = function(a){ if(a.length<2) return 0; var m=PM.mean(a); return Math.sqrt(PM.mean(a.map(function(v){return (v-m)*(v-m);}))); };
PM.pearson = function(a,b){
  var ma=PM.mean(a),mb=PM.mean(b),n=0,da=0,db=0;
  for(var i=0;i<a.length;i++){ n+=(a[i]-ma)*(b[i]-mb); da+=(a[i]-ma)*(a[i]-ma); db+=(b[i]-mb)*(b[i]-mb); }
  return (da&&db)? n/Math.sqrt(da*db) : 0;
};
PM.withCards = function(){ return PM.people.filter(function(p){return p.card&&p.card.axes;}); };
PM.AX_PALETTE=['#0f7a57','#c9962f','#b5457c','#2563a8','#7a4cab','#12908e','#c0392b','#5a8f29','#d2691e','#4a6fa5','#a14a76','#6b7f3a'];

/* Etichetta del polo verso cui pende un asse a 12 valori */
PM.axisPole = function(i,v){
  var a=PM.axes12[i];
  if(v===0) return 'in equilibrio';
  return v<0?a.left:a.right;
};

/* ---- Lettura descrittiva generata dai valori (non sono risultati del test) ---- */
PM.reading = function(p){
  var out=[];
  var xs=PM.phrase('x',p.x), ys=PM.phrase('y',p.y), zs=PM.phrase('z',p.z);
  out.push('Sulla bussola si colloca in zona '+xs.toLowerCase()+' per l\u2019economia, '+ys.toLowerCase()+' per l\u2019autorità e '+zs.toLowerCase()+' per i valori sociali.');
  var c=p.card;
  if(c&&c.area&&c.result) out.push('Il test lo/la inserisce nell\u2019area '+c.area+', con risultato \u201c'+c.result+'\u201d.');
  if(c&&c.axes){
    var items=c.axes.map(function(v,i){return {i:i,v:v,a:Math.abs(v)};}).sort(function(a,b){return b.a-a.a;});
    var top=items.slice(0,3).filter(function(o){return o.a>0;});
    if(top.length) out.push('Gli assi più netti sono '+top.map(function(o){return PM.axes12[o.i].name.toLowerCase()+' ('+PM.axisPole(o.i,o.v)+' '+o.a+'%)';}).join(', ')+'.');
    var bal=items.filter(function(o){return o.a<=15;}).map(function(o){return PM.axes12[o.i].name.toLowerCase();});
    if(bal.length) out.push('Quasi in equilibrio: '+bal.join(', ')+'.');
    if(c.axes[1]>40&&c.axes[2]>40) out.push('Combina una preferenza per un potere centrale (Autocrazia '+c.axes[1]+'%) con molta Libertà ('+c.axes[2]+'%): sono dimensioni distinte del profilo. Questi valori non vengono usati per ricostruire o giustificare la posizione stimata sulla bussola.');
    var econ=(c.axes[6]+c.axes[7])/2;
    if(Math.abs(econ)>30&&Math.abs(p.x)>=2.2&&((econ<0)!==(p.x<0))) out.push('Nota: gli assi economici del test e la posizione sulla bussola puntano in direzioni diverse. Conviene ricontrollare lo screenshot.');
  } else {
    out.push('Senza scheda 12 Axes la lettura si basa solo sulle tre posizioni della bussola.');
  }
  return out;
};

/* ---- Validazione e caricamento ---- */
PM.validate = function(d){
  if(!d||!Array.isArray(d.people)||!Array.isArray(d.axes12)||d.axes12.length!==12) throw new Error('Formato dati non valido');
  var seen={};
  d.people.forEach(function(p){
    if(typeof p.id!=='string'||!/^[-a-zA-Z0-9_]+$/.test(p.id)||seen[p.id]) throw new Error('Identificativo mancante o duplicato: '+p.id);
    seen[p.id]=1;
    if(!p.name||!String(p.name).trim()) throw new Error('Nome vuoto per '+p.id);
    ['x','y','z'].forEach(function(k){ if(typeof p[k]!=='number'||!isFinite(p[k])||p[k]<-10||p[k]>10) throw new Error('Coordinata '+k+' non valida per '+p.name); });
    if(p.card){
      if(!Array.isArray(p.card.axes)||p.card.axes.length!==12) throw new Error('Scheda 12 assi non valida per '+p.name);
      p.card.axes.forEach(function(v){ if(typeof v!=='number'||!isFinite(v)||v<-100||v>100) throw new Error('Valore asse non valido per '+p.name); });
      p.card.others=p.card.others||[]; p.card.countries=p.card.countries||[];
    }
  });
  return d;
};
PM.load = function(){
  return fetch('data/people.json',{cache:'no-cache'}).then(function(r){
    if(!r.ok) throw new Error('data/people.json non trovato ('+r.status+')');
    return r.json();
  }).then(function(d){
    PM.validate(d); PM.people=d.people; PM.axes12=d.axes12; return d;
  });
};
})();
