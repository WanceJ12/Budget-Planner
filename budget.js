(function(){
var DEF={Housing:15000,Food:8000,Transport:4000,Fun:2000,Bills:5000,Other:2000};
var state={budgets:Object.assign({},DEF),tx:[]},store=null,$=function(i){return document.getElementById(i)};
var cur="KSh ",HUES=[152,12,210,280,38,340,180,60,250,100];
function fmt(n){return cur+n.toLocaleString("en-KE",{minimumFractionDigits:0,maximumFractionDigits:2})}
function esc(s){var d=document.createElement("div");d.textContent=s;return d.innerHTML}
var today=new Date().toISOString().slice(0,10);
$("month").value=today.slice(0,7);$("date").value=today;
 
/* persistence: private db doc if available, else localStorage */
var saveT;
function save(){
  clearTimeout(saveT);
  saveT=setTimeout(function(){
    if(store){store.set(state).then(function(){$("status").textContent="Saved"}).catch(function(){$("status").textContent="Could not save"});}
    else{try{localStorage.setItem("bp",JSON.stringify(state));$("status").textContent="Saved on this device"}catch(e){$("status").textContent="Not saved (storage unavailable)"}}
  },300);
}
function load(){
  try{var s=localStorage.getItem("bp");if(s&&!store)state=JSON.parse(s)}catch(e){}
  render();
  if(window.claude&&claude.use){
    Promise.all([claude.use("db"),claude.use("user")]).then(function(r){
      if(!r[0]||!r[1])return;
      return r[1].id().then(function(id){
        var ref=r[0].collection("data/users/"+id).doc("budget");
        return ref.get().then(function(snap){
          store=ref;
          if(snap.exists){state=JSON.parse(JSON.stringify(snap.data()));}
          else{save();}
          render();
        });
      });
    }).catch(function(e){$("status").textContent="Could not load saved data: "+(e&&e.message||e)});
  }
}
 
var PAL={dark:{Ocean:["#0a1b45","#17489a","#2a88d4"],Sky:["#06304f","#0f6fa8","#4fc3f7"],Indigo:["#130f40","#3a3aa8","#6c8cff"],Teal:["#052a33","#0c6b7a","#2fc4c0"]},light:{Ocean:["#dbeafe","#a9c9f5","#7fb2ee"],Sky:["#e0f4ff","#b3e0fb","#86cdf5"],Indigo:["#e6e8ff","#c3caff","#9eaaf7"],Teal:["#dcf7f5","#aee9e4","#7fd6d0"]}};
function applyUi(){
  var u=state.ui=state.ui||{},mode=u.mode==="light"?"light":"dark",sh=PAL[mode][u.shade]?u.shade:"Ocean",b=u.blur==null?18:u.blur,p=PAL[mode][sh],s=document.documentElement;
  s.setAttribute("data-mode",mode);s.style.setProperty("--g1",p[0]);s.style.setProperty("--g2",p[1]);s.style.setProperty("--g3",p[2]);s.style.setProperty("--blur",b+"px");
  $("blur").value=b;
  $("mDark").style.outline=mode==="dark"?"2px solid var(--tx)":"";$("mLight").style.outline=mode==="light"?"2px solid var(--tx)":"";
  $("shades").innerHTML=Object.keys(PAL[mode]).map(function(n){return '<button data-sh="'+n+'" style="background:linear-gradient(135deg,'+PAL[mode][n].join(",")+');color:'+(mode==="light"?"#0c2350":"#fff")+(n===sh?";outline:2px solid var(--tx)":"")+'">'+n+'</button>'}).join("");
}
$("mDark").onclick=function(){state.ui=state.ui||{};state.ui.mode="dark";applyUi();save()};
$("mLight").onclick=function(){state.ui=state.ui||{};state.ui.mode="light";applyUi();save()};
$("shades").onclick=function(e){var n=e.target.getAttribute("data-sh");if(!n)return;state.ui=state.ui||{};state.ui.shade=n;applyUi();save()};
$("blur").oninput=function(){state.ui=state.ui||{};state.ui.blur=+this.value;document.documentElement.style.setProperty("--blur",this.value+"px");save()};
function num(s){return parseFloat(String(s||"").replace(/,/g,""))}
function pad(n){return ("0"+n).slice(-2)}
function applyRec(){
  var d=new Date(),ym=d.getFullYear()+"-"+pad(d.getMonth()+1),ch=0;state.rec=state.rec||[];
  state.rec.forEach(function(r){if(d.getDate()<r.day||state.tx.some(function(t){return t.rid===r.id&&t.date.slice(0,7)===ym}))return;
    state.tx.push({id:Date.now()+""+Math.random().toString(36).slice(2,5),type:"exp",amt:r.amt,cat:r.cat,date:ym+"-"+pad(r.day),note:r.name+" (recurring)",rid:r.id});ch=1});
  if(ch)save();
}
function extra(){
  var cats=Object.keys(state.budgets),mt=monthTx(),pv=$("recC").value;
  $("recC").innerHTML=cats.map(function(c){return "<option>"+esc(c)+"</option>"}).join("");if(pv)$("recC").value=pv;
  $("recL").innerHTML=state.rec.map(function(r){return '<div class="tx"><div>'+esc(r.name)+'<small>'+esc(r.cat)+' · day '+r.day+'</small></div><div><b>'+fmt(r.amt)+'</b> <button data-r="'+r.id+'">✕</button></div></div>'}).join("")||"<small>No recurring bills yet.</small>";
  $("goalL").innerHTML=(state.goals||[]).map(function(g){var p=Math.min(100,g.saved/g.target*100);return '<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;gap:8px"><b>'+esc(g.name)+'</b><span>'+fmt(g.saved)+' / '+fmt(g.target)+'</span></div><div class="bar"><i style="width:'+p+'%"></i></div><div class="row" style="margin-top:6px"><input data-gi="'+g.id+'" type="text" inputmode="decimal" placeholder="Add savings (KSh)"><button data-g="'+g.id+'">Add</button><button class="g" data-gd="'+g.id+'">Remove</button></div></div>'}).join("")||"<small>No goals yet.</small>";
  var by={},tot=0,off=0,seg="",lg="";
  mt.forEach(function(t){if(t.type!=="inc")by[t.cat]=(by[t.cat]||0)+t.amt});
  cats.forEach(function(c){tot+=by[c]||0});
  cats.forEach(function(c,i){var v=by[c]||0;if(!v)return;var f=v/tot*251.33,col="hsl("+HUES[i%HUES.length]+" 85% 62%)";seg+='<circle r="40" cx="50" cy="50" fill="none" stroke="'+col+'" stroke-width="16" stroke-dasharray="'+f+' '+(251.33-f)+'" stroke-dashoffset="'+(-off)+'" transform="rotate(-90 50 50)"/>';off+=f;lg+='<div><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:'+col+';margin-right:6px"></span>'+esc(c)+' '+Math.round(v/tot*100)+'%</div>'});
  $("donut").innerHTML=tot?'<div class="row" style="align-items:center"><svg viewBox="0 0 100 100" style="flex:0 0 140px;width:140px;min-width:0"><circle r="40" cx="50" cy="50" fill="none" stroke="rgba(255,255,255,.15)" stroke-width="16"/>'+seg+'</svg><div style="font-size:13px">'+lg+'</div></div>':"<small>No spending this month yet.</small>";
  var sp=($("month").value||today.slice(0,7)).split("-"),mo=[],mx=1;
  for(var k=5;k>=0;k--){var d=new Date(+sp[0],+sp[1]-1-k,1),key=d.getFullYear()+"-"+pad(d.getMonth()+1),I=0,E=0;state.tx.forEach(function(t){if(t.date.slice(0,7)===key){if(t.type==="inc")I+=t.amt;else E+=t.amt}});mx=Math.max(mx,I,E);mo.push({l:d.toLocaleString("en",{month:"short"}),i:I,e:E})}
  var bars="";mo.forEach(function(o,j){var x=j*50+8,hi=o.i/mx*85,he=o.e/mx*85;bars+='<rect x="'+x+'" y="'+(100-hi)+'" width="16" height="'+hi+'" rx="3" style="fill:var(--ok)"/><rect x="'+(x+18)+'" y="'+(100-he)+'" width="16" height="'+he+'" rx="3" style="fill:var(--bad)"/><text x="'+(x+17)+'" y="116" text-anchor="middle" font-size="10" style="fill:var(--mu)">'+o.l+'</text>'});
  $("trend").innerHTML='<small style="color:var(--mu)"><span style="color:var(--ok)">■</span> Income &nbsp;<span style="color:var(--bad)">■</span> Spent, last 6 months</small><svg viewBox="0 0 300 122" style="width:100%;display:block">'+bars+'</svg>';
}
$("recAdd").onclick=function(){var a=num($("recA").value),d=parseInt($("recD").value,10),n=$("recN").value.trim();if(!n||!(a>0)||!(d>=1&&d<=28))return;state.rec=state.rec||[];state.rec.push({id:"r"+Date.now(),name:n,amt:a,cat:$("recC").value,day:d});$("recN").value=$("recA").value=$("recD").value="";save();render()};
$("recL").onclick=function(e){var id=e.target.getAttribute("data-r");if(!id)return;state.rec=state.rec.filter(function(r){return r.id!==id});save();render()};
$("gAdd").onclick=function(){var n=$("gN").value.trim(),t=num($("gT").value);if(!n||!(t>0))return;state.goals=state.goals||[];state.goals.push({id:"g"+Date.now(),name:n,target:t,saved:0});$("gN").value=$("gT").value="";save();render()};
$("goalL").onclick=function(e){var t=e.target,id=t.getAttribute("data-g"),gd=t.getAttribute("data-gd");
  if(id){var v=num(document.querySelector('[data-gi="'+id+'"]').value);if(!(v>0))return;state.goals.forEach(function(g){if(g.id===id)g.saved+=v});save();render()}
  else if(gd){state.goals=state.goals.filter(function(g){return g.id!==gd});save();render()}};
function csv(){var q=function(s){return '"'+String(s==null?"":s).replace(/"/g,'""')+'"'};return "Date,Type,Category,Amount (KSh),Note\n"+state.tx.slice().sort(function(a,b){return a.date.localeCompare(b.date)}).map(function(t){return [t.date,t.type==="inc"?"Income":"Expense",t.type==="inc"?"":t.cat,t.amt,t.note].map(q).join(",")}).join("\n")}
$("exp").onclick=function(){var c=csv(),name="budget-"+today+".csv";
  function fb(){var ta=$("csvOut");ta.style.display="block";ta.value=c;ta.select();$("err2").textContent="Copy this text and paste it into a sheet or file."}
  if(window.claude&&claude.use){claude.use("downloads").then(function(d){if(!d)return fb();return d.save({filename:name,data:c}).catch(fb)}).catch(fb)}
  else{var a=document.createElement("a");a.href=URL.createObjectURL(new Blob([c],{type:"text/csv"}));a.download=name;a.click()}};
(function(){try{var c=document.createElement("canvas");c.width=c.height=180;var x=c.getContext("2d"),g=x.createLinearGradient(0,0,180,180);g.addColorStop(0,"#17489a");g.addColorStop(1,"#2a88d4");x.fillStyle=g;x.fillRect(0,0,180,180);var rr=function(a,b,w,h,r){x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath()},o=x.createRadialGradient(40,30,5,40,30,120),f=x.createLinearGradient(0,60,0,145);
o.addColorStop(0,"rgba(150,215,255,.75)");o.addColorStop(1,"rgba(150,215,255,0)");x.fillStyle=o;x.fillRect(0,0,180,180);
rr(44,48,92,36,12);x.fillStyle="rgba(255,255,255,.2)";x.fill();x.strokeStyle="rgba(255,255,255,.5)";x.lineWidth=2;x.stroke();
x.shadowColor="rgba(5,20,70,.5)";x.shadowBlur=16;x.shadowOffsetY=7;
f.addColorStop(0,"rgba(255,255,255,.5)");f.addColorStop(1,"rgba(255,255,255,.14)");rr(30,64,120,80,18);x.fillStyle=f;x.fill();
x.shadowColor="transparent";x.strokeStyle="rgba(255,255,255,.75)";x.lineWidth=2.5;x.stroke();
rr(106,90,52,30,15);x.fillStyle="rgba(255,255,255,.38)";x.fill();x.strokeStyle="rgba(255,255,255,.8)";x.lineWidth=2;x.stroke();
x.beginPath();x.arc(124,105,5,0,6.2832);x.fillStyle="#fff";x.fill();var l=document.createElement("link"),l2=document.createElement("link");l2.rel="icon";l2.href=c.toDataURL("image/png");document.head.appendChild(l2);l.rel="apple-touch-icon";l.href=c.toDataURL("image/png");document.head.appendChild(l)}catch(e){}})();
var editId=null,unl=false;
function eff(c){var l=state.budgets[c];if(!(state.ui&&state.ui.roll))return l;var s=($("month").value||today.slice(0,7)).split("-"),d=new Date(+s[0],+s[1]-2,1),k=d.getFullYear()+"-"+pad(d.getMonth()+1),sp=0,had=0;state.tx.forEach(function(t){if(t.date.slice(0,7)===k){had=1;if(t.type!=="inc"&&t.cat===c)sp+=t.amt}});return had?l+Math.max(0,l-sp):l}
function extra2(){
  var mt=monthTx(),cats=Object.keys(state.budgets),by={},inc=0,exp=0,tl=0,w=[],now=new Date(),cm=$("month").value===now.getFullYear()+"-"+pad(now.getMonth()+1);
  mt.forEach(function(t){if(t.type==="inc")inc+=t.amt;else{exp+=t.amt;by[t.cat]=(by[t.cat]||0)+t.amt}});
  cats.forEach(function(c){var l=eff(c);tl+=l;if(l&&by[c]>=l*.8)w.push(esc(c)+(by[c]>l?" is over":" is at "+Math.round(by[c]/l*100)+"%"))});
  var dl=new Date(now.getFullYear(),now.getMonth()+1,0).getDate()-now.getDate()+1,al=Math.max(0,tl-exp)/dl;
  $("warn").innerHTML=(w.length?'<div class="neg">⚠ '+w.join(" · ")+'</div>':"")+(cm?'<div>You can spend about <b>'+fmt(Math.round(al))+'</b> a day for the rest of the month ('+fmt(Math.max(0,tl-exp))+' left of '+fmt(tl)+').</div>':"");
  $("warn").style.display=$("warn").innerHTML?"block":"none";
  var ne=0,wa=0;cats.forEach(function(c){var v=by[c]||0;if(/^(Housing|Food|Transport|Bills)$/.test(c))ne+=v;else wa+=v});
  var sv=Math.max(0,inc-exp),rows=[["Needs",ne,50],["Wants",wa,30],["Savings",sv,20]];
  $("s532").innerHTML=inc?rows.map(function(r){var p=r[1]/inc*100,bad=r[0]==="Savings"?p<r[2]:p>r[2];return '<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;gap:8px"><span>'+r[0]+' · target '+r[2]+'%</span><b class="'+(bad?"neg":"pos")+'">'+Math.round(p)+'% · '+fmt(r[1])+'</b></div><div class="bar"><i style="width:'+Math.min(100,p)+'%"></i></div></div>'}).join(""):"<small>Add this month's income to see your split.</small>";
  $("debtL").innerHTML=(state.debts||[]).map(function(d){var p=Math.min(100,d.paid/d.amt*100);return '<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;gap:8px"><b>'+esc(d.who)+' <small style="color:var(--mu)">'+(d.dir==="owe"?"I owe":"owes me")+'</small></b><span>'+fmt(Math.max(0,d.amt-d.paid))+' left</span></div><div class="bar"><i style="width:'+p+'%"></i></div><div class="row" style="margin-top:6px"><input data-di="'+d.id+'" type="text" inputmode="decimal" placeholder="Payment (KSh)"><button data-dp="'+d.id+'">Record</button><button class="g" data-dd="'+d.id+'">Remove</button></div></div>'}).join("")||"<small>No debts tracked.</small>";
  $("roll").checked=!!(state.ui&&state.ui.roll);
}
function mp(txt){
  var parts=txt.split(/(?=\b[A-Z0-9]{8,12}\s+Confirmed\b)/i),n=0,sk=0,bad=0,K={Bills:/airtime|kplc|token|water|zuku|safaricom|wifi|dstv|pay ?bill/i,Transport:/uber|bolt|matatu|fuel|shell|petrol|rubis|total ?energies/i,Food:/kfc|java|naivas|quickmart|carrefour|restaurant|cafe|pizza|chicken|supermarket|butchery|eatery/i,Housing:/rent|landlord/i};
  parts.forEach(function(m){
    if(!m.trim())return;
    var c=(m.match(/\b([A-Z0-9]{8,12})\s+Confirmed\b/i)||[])[1],a=m.match(/\b(?:KSh|KES)\.?\s*([\d,]+(?:\.\d{1,2})?)/i);
    if(!a){bad++;return}
    if(c&&state.tx.some(function(t){return t.code===c})){sk++;return}
    var inc=/received|credited|deposit/i.test(m),dm=m.match(/\bon\s+(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})/),year=dm?(+dm[3]<100?2000+ +dm[3]:+dm[3]):0,dt=dm?(year+"-"+pad(+dm[2])+"-"+pad(+dm[1])):today,w=(m.match(/(?:sent to|paid to|from|bought)\s+(.+?)(?:\s+\d{9,}|\s+on\s|\.\s|\.$|$)/i)||[])[1]||"M-Pesa",cat="";
    for(var k in K)if(state.budgets[k]!==undefined&&K[k].test(m)){cat=k;break}
    if(!cat)cat=state.budgets.Other!==undefined?"Other":Object.keys(state.budgets)[0];
    state.tx.push({id:Date.now()+""+Math.random().toString(36).slice(2,6)+n,type:inc?"inc":"exp",amt:parseFloat(a[1].replace(/,/g,"")),cat:cat,date:dt,note:w.trim(),code:c});n++});
  return [n,sk,bad]}
$("mpGo").onclick=function(){var r=mp($("mpIn").value);$("mpMsg").textContent="Imported "+r[0]+", skipped "+r[1]+" already added"+(r[2]?"; "+r[2]+" message(s) had no recognizable KSh/KES amount.":"; no unrecognized messages.");if(r[0]){$("mpIn").value="";save();render()}};
$("askB").onclick=function(e){var k=e.target.getAttribute("data-ask");if(!k)return;
  var mt=monthTx(),cats=Object.keys(state.budgets),by={},exp=0,tl=0,a;
  mt.forEach(function(t){if(t.type!=="inc"){exp+=t.amt;by[t.cat]=(by[t.cat]||0)+t.amt}});cats.forEach(function(c){tl+=eff(c)});
  var rank=cats.filter(function(c){return by[c]}).sort(function(x,y){return by[y]-by[x]});
  if(k==="over"){var ov=cats.filter(function(c){return by[c]>eff(c)});a=ov.length?"You're over in "+ov.map(function(c){return c+" by "+fmt(by[c]-eff(c))}).join(", ")+". Total spent is "+fmt(exp)+" against limits of "+fmt(tl)+".":"You're within every category limit this month. Spent "+fmt(exp)+" of "+fmt(tl)+"."}
  else if(k==="cut"){a=rank.length?"Your biggest areas are "+rank.slice(0,3).map(function(c){return c+" ("+fmt(by[c])+", "+Math.round(by[c]/exp*100)+"%)"}).join(", ")+". Trimming 10% from them would save about "+fmt(Math.round(rank.slice(0,3).reduce(function(s,c){return s+by[c]},0)*.1))+" a month.":"No spending recorded this month yet."}
  else if(k==="track"){var n=new Date(),cm=$("month").value===n.getFullYear()+"-"+pad(n.getMonth()+1),dim=new Date(n.getFullYear(),n.getMonth()+1,0).getDate(),pr=cm?exp/n.getDate()*dim:exp;a=(cm?"At this pace you'll spend about "+fmt(Math.round(pr))+" by month end":"You spent "+fmt(exp))+" against total limits of "+fmt(tl)+(pr>tl?", which is "+fmt(Math.round(pr-tl))+" over.":". You're on track.")}
  else{a=mt.filter(function(t){return t.type!=="inc"}).sort(function(x,y){return y.amt-x.amt}).slice(0,5).map(function(t){return fmt(t.amt)+" · "+(t.note||t.cat)+" ("+t.date+")"}).join("\n")||"No expenses yet."}
  $("askA").textContent=a};
$("dAdd").onclick=function(){var w=$("dW").value.trim(),a=num($("dA").value);if(!w||!(a>0))return;state.debts=state.debts||[];state.debts.push({id:"d"+Date.now(),who:w,amt:a,paid:0,dir:$("dD").value});$("dW").value=$("dA").value="";save();render()};
$("debtL").onclick=function(e){var t=e.target,p=t.getAttribute("data-dp"),x=t.getAttribute("data-dd");if(p){var v=num(document.querySelector('[data-di="'+p+'"]').value);if(!(v>0))return;state.debts.forEach(function(d){if(d.id===p)d.paid+=v})}else if(x){state.debts=state.debts.filter(function(d){return d.id!==x})}else return;save();render()};
$("roll").onchange=function(){state.ui=state.ui||{};state.ui.roll=this.checked;save();render()};
$("q").oninput=render;
$("list").addEventListener("click",function(e){var id=e.target.getAttribute("data-e");if(!id)return;var t=state.tx.filter(function(x){return x.id===id})[0];if(!t)return;editId=id;$("type").value=t.type;$("amt").value=t.amt;$("cat").style.display=t.type==="inc"?"none":"";if(t.type!=="inc")$("cat").value=t.cat;$("date").value=t.date;$("note").value=t.note||"";$("add").textContent="Save";window.scrollTo(0,0)});
function hp(s){var h=5381;for(var i=0;i<s.length;i++)h=(h*33+s.charCodeAt(i))|0;return ""+h}
function lockChk(){$("lock").style.display=state.pin&&!unl?"flex":"none"}
$("unl").onclick=function(){if(hp($("pinIn").value)===state.pin){unl=true;$("pinIn").value="";$("lockE").textContent="";lockChk()}else $("lockE").textContent="Wrong PIN"};
$("pinSet").onclick=function(){var v=$("pinNew").value;if(!/^\d{4}$/.test(v)){$("pinMsg").textContent="Use exactly 4 digits";return}state.pin=hp(v);unl=true;$("pinNew").value="";$("pinMsg").textContent="PIN set. It will be asked next time you open the app.";save()};
$("pinOff").onclick=function(){delete state.pin;$("pinMsg").textContent="PIN removed";save()};
var ORD=["","warn","Add","Category","Transactions","Import","Recurring","Savings","Debts","Charts","Ask","50/30","History","Export","Appearance"];
(function(){
  var cs=[].slice.call(document.querySelectorAll("main .card"));
  cs.forEach(function(c){var h=c.querySelector("h2"),t=h?h.textContent:"",i=c.id==="warn"?1:Math.max(0,ORD.findIndex(function(k){return k&&t.indexOf(k)===0}));c.style.order=i;c.setAttribute("data-pg",i<=5?"home":i<=8?"plan":"ins")});
  window.showPg=function(p){cs.forEach(function(c){c.classList.toggle("hid",c.getAttribute("data-pg")!==p)});[].forEach.call(document.querySelectorAll("#nav button"),function(b){b.classList.toggle("on",b.getAttribute("data-pg")===p)});window.scrollTo(0,0)};
  $("nav").onclick=function(e){var b=e.target.closest("button");if(b)showPg(b.getAttribute("data-pg"))};
  showPg("home");
})();
function hist(){
  var m={};state.tx.forEach(function(t){var k=t.date.slice(0,7),o=m[k]||(m[k]={i:0,e:0});if(t.type==="inc")o.i+=t.amt;else o.e+=t.amt});
  var ks=Object.keys(m).sort().reverse(),sel=$("month").value;
  $("hist").innerHTML=ks.map(function(k){var o=m[k],l=o.i-o.e,d=new Date(k+"-01T00:00:00");
    return '<div class="tx" data-m="'+k+'" style="cursor:pointer'+(k===sel?';font-weight:600':'')+'"><div>'+d.toLocaleString("en-KE",{month:"long",year:"numeric"})+'<small>In '+fmt(o.i)+' · Spent '+fmt(o.e)+'</small></div><b class="'+(l<0?"neg":"pos")+'">'+(l<0?"−":"")+fmt(Math.abs(l))+'</b></div>'}).join("")||"<small>No history yet.</small>";
}
function monthTx(){var m=$("month").value;return state.tx.filter(function(t){return t.date.slice(0,7)===m})}
function render(){
  state.tx=(Array.isArray(state.tx)?state.tx:[]).filter(function(t){return t&&typeof t.date==="string"});if(!state.budgets||!Object.keys(state.budgets).length)state.budgets=Object.assign({},DEF);[applyRec,hist,applyUi,extra,extra2,lockChk].forEach(function(f){try{f()}catch(e){$("status").textContent="Error: "+e.message}});
  var cats=Object.keys(state.budgets),mt=monthTx(),inc=0,exp=0,by={};
  mt.forEach(function(t){if(t.type==="inc")inc+=t.amt;else{exp+=t.amt;by[t.cat]=(by[t.cat]||0)+t.amt}});
  $("sInc").textContent=fmt(inc);$("sExp").textContent=fmt(exp);
  var left=inc-exp;$("sBal").textContent=fmt(left);$("sBal").className=left<0?"neg":"pos";
  var sel=$("cat"),prev=sel.value;
  sel.innerHTML=cats.map(function(c){return "<option>"+esc(c)+"</option>"}).join("");
  if(prev)sel.value=prev;
  $("cats").innerHTML=cats.map(function(c,i){
    var lim=eff(c),sp=by[c]||0,p=lim?Math.min(100,sp/lim*100):0,over=lim&&sp>lim;
    return '<div class="cc" style="--h:'+HUES[i%HUES.length]+'"><div class="cn">'+esc(c)+'</div><div class="cs">'+fmt(sp)+'</div><div class="cl">of '+fmt(lim)+'</div><div class="bar"><i style="width:'+p+'%;'+(over?'background:var(--bad)':'')+'"></i></div><div class="cf '+(over?"neg":"")+'">'+(over?"Over by "+fmt(sp-lim):fmt(Math.max(0,lim-sp))+" left")+'</div><a href="#" data-del="'+esc(c)+'">remove</a></div>';
  }).join("")||"<small>No categories yet.</small>";
  var q=($("q")&&$("q").value||"").toLowerCase(),sorted=mt.filter(function(t){return !q||((t.note||"")+" "+t.cat).toLowerCase().indexOf(q)>-1}).sort(function(a,b){return b.date.localeCompare(a.date)});
  $("list").innerHTML=sorted.map(function(t){
    return '<div class="tx"><div>'+esc(t.type==="inc"?"Income":t.cat)+(t.note?" · "+esc(t.note):"")+'<small>'+t.date+'</small></div><div><b class="'+(t.type==="inc"?"pos":"")+'">'+(t.type==="inc"?"+":"−")+fmt(t.amt)+'</b> <button data-e="'+t.id+'">✎</button> <button data-id="'+t.id+'">✕</button></div></div>';
  }).join("")||"<small>Nothing recorded this month.</small>";
}
 
$("add").onclick=function(){try{add()}catch(e){$("err").textContent="Error: "+e.message}};function add(){$("err").textContent="";
  var a=parseFloat(($("amt").value||"").replace(/,/g,""));if(!(a>0)){$("err").textContent="Enter an amount greater than 0";return $("amt").focus();}
  var nt={type:$("type").value,amt:a,cat:$("cat").value||"Other",date:$("date").value||today,note:$("note").value.trim()};
  if(editId){state.tx.forEach(function(t){if(t.id===editId)Object.assign(t,nt)});editId=null;$("add").textContent="Add"}else{nt.id=Date.now()+""+Math.random().toString(36).slice(2,5);state.tx.push(nt)}
  $("amt").value="";$("note").value="";
  if($("date").value.slice(0,7)!==$("month").value)$("month").value=$("date").value.slice(0,7);
  save();render();
};
$("addCat").onclick=function(){
  var n=$("newCat").value.trim(),l=parseFloat($("newLim").value);if(!n||!(l>=0))return;
  state.budgets[n]=l;$("newCat").value="";$("newLim").value="";save();render();
};
$("list").onclick=function(e){var id=e.target.getAttribute("data-id");if(!id)return;state.tx=state.tx.filter(function(t){return t.id!==id});save();render()};
$("cats").onclick=function(e){var c=e.target.getAttribute("data-del");if(!c)return;e.preventDefault();delete state.budgets[c];save();render()};
$("month").onchange=render;
$("hist").onclick=function(e){var r=e.target.closest("[data-m]");if(!r)return;$("month").value=r.getAttribute("data-m");render();window.scrollTo(0,0)};
$("type").onchange=function(){$("cat").style.display=$("type").value==="inc"?"none":""};
load();
})();2004