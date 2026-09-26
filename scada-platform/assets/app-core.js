/* ============================================================
   Industrial SCADA + IIoT platform — front-end prototype
   Demo mode: all data simulated in-browser, clearly labeled.
   ============================================================ */
'use strict';

/* ---------------- utilities ---------------- */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const fmt=n=>Math.round(n).toLocaleString('en-US');
const fmt1=n=>(Math.round(n*10)/10).toFixed(1);
const fmtH=s=>{const h=Math.floor(s/3600),m=Math.floor(s%3600/60);return h+'h '+String(m).padStart(2,'0')+'m'};
const rnd=(a,b)=>a+Math.random()*(b-a);
const now=()=>new Date();
const ts=d=>d.toLocaleTimeString('en-GB');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------------- domain state ---------------- */
const PLANTS=[{id:'P01',name:'Plant 01 — Pune'},{id:'P02',name:'Plant 02 — Chennai'}];
const LINES=[{id:'L1',name:'Line 1 — Machining'},{id:'L2',name:'Line 2 — Assembly'}];

const STATE={
  running:{c:'var(--green)',hex:'#2ecc71',label:'Running'},
  warning:{c:'var(--yellow)',hex:'#f5b942',label:'Warning'},
  fault:{c:'var(--red)',hex:'#ef5350',label:'Fault'},
  idle:{c:'var(--blue)',hex:'#4aa8ff',label:'Idle'},
  offline:{c:'var(--grey)',hex:'#6b7683',label:'Offline'},
};
const chip=st=>{const s=STATE[st];return `<span class="chip" style="color:${s.c};background:color-mix(in srgb,${s.c} 13%,transparent)"><span class="dot ${st==='fault'?'pulse':''}" style="background:${s.c}"></span>${s.label}</span>`};

const M_TYPE={CNC:'CNC milling',INJ:'Injection molder',CMP:'Compressor',CNV:'Conveyor',RBT:'Packing robot',FUR:'Furnace'};
const MACHINES=[
 {id:'M-101',name:'CNC milling 1',type:'CNC',line:'L1',plc:'PLC-S7-01',st:'running',temp:72,press:6.2,rpm:2400,vib:1.8,curr:14.2,volt:415,pow:5.9,flow:0,level:0,prod:4120,run:15420,down:840,oee:91.2,mfr:'DMG MORI',model:'CTX beta 800',inst:'2023-04-18',energy:412},
 {id:'M-102',name:'CNC milling 2',type:'CNC',line:'L1',plc:'PLC-S7-01',st:'running',temp:69,press:6.0,rpm:2350,vib:1.6,curr:13.8,volt:414,pow:5.7,flow:0,level:0,prod:3890,run:14900,down:1240,oee:88.7,mfr:'DMG MORI',model:'CTX beta 800',inst:'2023-04-18',energy:398},
 {id:'M-103',name:'Injection molder',type:'INJ',line:'L1',plc:'PLC-S7-02',st:'idle',temp:48,press:2.1,rpm:0,vib:0.4,curr:2.1,volt:413,pow:0.9,flow:1.2,level:64,prod:2210,run:9200,down:3100,oee:74.3,mfr:'ENGEL',model:'e-victory 80',inst:'2022-11-02',energy:512},
 {id:'M-104',name:'Compressor A',type:'CMP',line:'L1',plc:'PLC-S7-02',st:'running',temp:78,press:8.4,rpm:1500,vib:2.2,curr:22.5,volt:416,pow:9.4,flow:3.8,level:0,prod:0,run:18100,down:420,oee:96.1,mfr:'Atlas Copco',model:'GA 110',inst:'2021-06-30',energy:764},
 {id:'M-105',name:'Conveyor line 1',type:'CNV',line:'L2',plc:'PLC-AB-01',st:'running',temp:41,press:0.9,rpm:120,vib:0.9,curr:6.4,volt:415,pow:2.7,flow:0,level:0,prod:6640,run:17020,down:180,oee:93.8,mfr:'Siemens',model:'SIMOGEAR',inst:'2024-01-12',energy:236},
 {id:'M-106',name:'Packing robot',type:'RBT',line:'L2',plc:'PLC-AB-01',st:'running',temp:52,press:3.3,rpm:600,vib:1.2,curr:9.8,volt:413,pow:4.1,flow:0,level:0,prod:5980,run:16240,down:660,oee:90.4,mfr:'ABB',model:'IRB 6700',inst:'2023-08-25',energy:305},
 {id:'M-107',name:'Heat furnace 1',type:'FUR',line:'L2',plc:'PLC-AB-02',st:'warning',temp:91,press:1.4,rpm:0,vib:0.6,curr:31.0,volt:418,pow:12.9,flow:0.8,level:22,prod:0,run:12480,down:1980,oee:71.6,mfr:'SECOWARWICK',model:'Vector 15',inst:'2020-09-14',energy:1180},
 {id:'M-108',name:'CNC lathe 3',type:'CNC',line:'L2',plc:'PLC-AB-02',st:'offline',temp:28,press:0.2,rpm:0,vib:0.1,curr:0.2,volt:410,pow:0.1,flow:0,level:0,prod:1450,run:3400,down:12600,oee:0,mfr:'Okuma',model:'LB3000',inst:'2022-03-08',energy:96},
];

const SENSOR_DEFS=[
 ['TEMP','Temperature','°C','thermal'], ['PRESS','Pressure','bar','pressure'], ['VIB','Vibration','mm/s','vibration'],
 ['RPM','Spindle speed','rpm','motion'], ['CURR','Current','A','electrical'], ['VOLT','Voltage','V','electrical'],
 ['POW','Power','kW','electrical'], ['FLOW','Flow rate','m³/h','flow'], ['LVL','Tank level','%','level'],
];
const SENSORS=[];
MACHINES.forEach(m=>{
  SENSOR_DEFS.forEach(([sid,name,unit,cat])=>{
    if((m.type==='FUR'&&['RPM','FLOW'].includes(sid))||(m.type==='CNV'&&['PRESS','LVL'].includes(sid)))return;
    SENSORS.push({id:'S-'+m.id.slice(2)+'-'+sid,machine:m.id,name:m.name+' '+name.toLowerCase(),type:name,unit,topic:`v1/plant01/line/${m.line}/machine/${m.id}/sensor/${sid}/telemetry`,
      min:0,max:sid==='TEMP'?120:sid==='PRESS'?12:sid==='RPM'?3000:sid==='CURR'?40:sid==='VOLT'?440:sid==='POW'?20:sid==='FLOW'?6:sid==='LVL'?100:sid==='VIB'?10:10,
      warn:sid==='TEMP'?85:sid==='PRESS'?9:sid==='VIB'?4:sid==='CURR'?28:sid==='POW'?15:Infinity,
      crit:sid==='TEMP'?95:sid==='PRESS'?10.5:sid==='VIB'?6:sid==='CURR'?35:sid==='POW'?18:Infinity,
      val:0,batt:rnd(78,100),sig:rnd(72,99),last:now(),status:'ok'});
  });
});
const SMAP={}; SENSORS.forEach(s=>SMAP[s.id]=s);
const sval=(m,sid)=>m[sid==='TEMP'?'temp':sid==='PRESS'?'press':sid==='VIB'?'vib':sid==='RPM'?'rpm':sid==='CURR'?'curr':sid==='VOLT'?'volt':sid==='POW'?'pow':sid==='FLOW'?'flow':'level'];

const PROD={target:15000,actual:12450,good:12190,rej:260,scrap:44,cycle:8.4,shift:'B',batch:'B-2209'};
const K={energy:4820,alarms:0,oee:87.4};

let ALARMS=[],almSeq=1,MQ=[],hist={temp:[],press:[],rpm:[],vib:[],energy:[],prod:[]},seq=1000;
let selected=null,currentView='overview',chartRange=300,live=true,chartPaused=false;

/* ---------------- alarm engine ---------------- */
function raiseAlarm(m,param,val,thr,sev){
  ALARMS.unshift({id:'ALM-'+String(almSeq++).padStart(4,'0'),t:now(),m:m.id,param,val,thr,sev,status:'ACTIVE',ackBy:null,ackT:null,res:null});
  if(ALARMS.length>80)ALARMS.pop();
  flash(`Alarm ${sev}: ${m.id} ${param} ${val} > ${thr}`);
  renderView();
}
function flash(msg){
  const f=document.createElement('div');f.className='flash';f.textContent=msg;document.body.appendChild(f);
  setTimeout(()=>f.remove(),3200);
}

/* ---------------- simulation engine ---------------- */
function tick(){
  MACHINES.forEach(m=>{
    const w=()=>rnd(-1,1);
    if(m.st==='running'){
      m.temp=Math.max(35,Math.min(106,m.temp+w()*1.3+0.04));
      m.rpm=Math.max(0,m.rpm+w()*70); m.vib=Math.max(0.3,m.vib+w()*0.24);
      m.press=Math.max(0.4,m.press+w()*0.16); m.curr=Math.max(4,m.curr+w()*0.8);
      m.pow=Math.max(1,m.pow+w()*0.3); m.run++; m.prod+=Math.floor(rnd(0,3));
      m.energy+=m.pow/3600;
    } else if(m.st==='idle'){
      m.temp=Math.max(30,m.temp-0.35+w()*0.4); m.rpm*=0.9; m.vib=Math.max(0.2,m.vib*0.95); m.curr=Math.max(0.5,m.curr*0.9); m.pow*=0.85;
    } else if(m.st==='fault'||m.st==='offline'){
      m.down++; m.rpm*=0.85; m.temp=Math.max(28,m.temp-0.1); m.curr*=0.8; m.pow*=0.6;
    } else if(m.st==='warning'){
      m.run++; m.temp=Math.max(70,m.temp+w()*1.1+0.1); m.rpm=Math.max(0,m.rpm+w()*50); m.prod+=Math.floor(rnd(0,2));
    }
    m.volt=415+w()*4;
    if(m.type==='INJ')m.level=Math.max(20,Math.min(95,m.level+w()*0.8));
    if(m.type==='FUR'){m.level=Math.max(10,Math.min(90,m.level+w()*0.3));m.flow=Math.max(0.3,m.flow+w()*0.08)}
    /* state transitions */
    if(m.st==='running'||m.st==='warning'){
      if(m.temp>95){if(m.st!=='fault'){m.st='fault';raiseAlarm(m,'Temperature',fmt1(m.temp)+' °C','95 °C','CRITICAL')}}
      else if(m.temp>85&&m.st==='running'){m.st='warning';raiseAlarm(m,'Temperature',fmt1(m.temp)+' °C','85 °C','WARNING')}
      if(m.st==='warning'&&m.temp<78)m.st='running';
      if(m.st==='fault'&&m.temp<70&&Math.random()<0.3){m.st='running';raiseAlarm(m,'Auto recovery','running','—','INFO')}
      if(m.vib>6&&Math.random()<0.1)raiseAlarm(m,'Vibration',fmt1(m.vib)+' mm/s','6 mm/s','WARNING');
    }
  });
  PROD.actual+=Math.floor(rnd(2,8)); PROD.good+=Math.floor(rnd(2,7)); if(Math.random()<0.3){PROD.rej++;PROD.scrap+=Math.random()<0.2?1:0}
  K.energy+=rnd(1.6,3.2);
  const run=MACHINES.filter(m=>m.st==='running'||m.st==='warning').length;
  K.oee=Math.max(78,Math.min(94,K.oee+rnd(-0.3,0.3)));
  SENSORS.forEach(s=>{const m=MACHINES.find(x=>x.id===s.machine);s.val=sval(m,s.id.split('-').pop());s.last=now();s.status=s.val>s.crit?'crit':s.val>s.warn?'warn':'ok'});
  pushHist();
}
setInterval(tick,1000);

setInterval(()=>{ /* random line events */
  const pool=MACHINES.filter(m=>m.st==='running'||m.st==='idle'); if(pool.length<2)return;
  const m=pool[Math.floor(Math.random()*pool.length)];
  if(m.st==='running'&&Math.random()<0.35){m.st='idle';raiseAlarm(m,'State change','idle','—','INFO')}
  else if(m.st==='idle'&&Math.random()<0.7){m.st='running';raiseAlarm(m,'State change','running','—','INFO')}
  if(Math.random()<0.18)m.temp+=rnd(7,14);
},9000);

setInterval(()=>{ /* mqtt feed */
  const m=MACHINES[Math.floor(Math.random()*MACHINES.length)];
  const sid=['TEMP','PRESS','VIB','RPM'][Math.floor(Math.random()*4)];
  MQ.unshift({t:now(),topic:`v1/plant01/line/${m.line}/machine/${m.id}/sensor/${sid}/telemetry`,p:`{"ts":${Date.now()},"v":${fmt1(sval(m,sid==='TEMP'?'TEMP':sid==='PRESS'?'PRESS':sid==='VIB'?'VIB':'RPM'))},"q":${Math.floor(rnd(90,99))},"seq":${seq++}}`});
  if(MQ.length>9)MQ.pop();
  const el=$('#mqfeed'); if(el)el.innerHTML=MQ.map(l=>`<div><span class="t">${ts(l.t)}</span> <span class="topic">${l.topic}</span> ${esc(l.p)}</div>`).join('');
},1500);

setInterval(()=>{const c=$('#clock');if(c)c.textContent=now().toLocaleString('en-GB',{weekday:'short',hour:'2-digit',minute:'2-digit',second:'2-digit'})},1000);

function pushHist(){
  const m=MACHINES[0];
  [['temp',m.temp],['press',m.press],['rpm',m.rpm],['vib',m.vib],['energy',K.energy],['prod',PROD.actual]].forEach(([k,v])=>{
    hist[k].push({t:now(),v}); if(hist[k].length>1800)hist[k].shift();
  });
  const el=$('#liveVals'); if(el)el.innerHTML=liveKpis();
  const ac=$('#almCount');if(ac){const a=ALARMS.filter(x=>x.status==='ACTIVE');ac.textContent=a.length;$('#bellN').textContent=a.length;$('#critN').textContent=a.filter(x=>x.sev==='CRITICAL'||x.sev==='EMERGENCY').length}
  if(!chartPaused&&['overview','process','trends','energy'].includes(currentView))drawMainChart();
  if(currentView==='scada'||currentView==='overview')updateScadaStates();
}

/* ---------------- charts ---------------- */
function setupCanvas(cv){
  const dpr=window.devicePixelRatio||1,r=cv.getBoundingClientRect();
  cv.width=r.width*dpr;cv.height=(+cv.dataset.h||220)*dpr;
  const ctx=cv.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);return[ctx,r.width,+cv.dataset.h||220];
}
function lineChart(cv,series,opts={}){
  const[ctx,W,H]=setupCanvas(cv);ctx.clearRect(0,0,W,H);
  const pl=46,pr=46,pt=10,pb=24,iw=W-pl-pr,ih=H-pt-pb;
  const min=opts.min??Math.min(...series.flatMap(s=>s.data.map(p=>p.v)))*0.95;
  const max=opts.max??Math.max(...series.flatMap(s=>s.data.map(p=>p.v)))*1.05;
  ctx.strokeStyle='#202934';ctx.lineWidth=1;
  for(let g=0;g<=4;g++){const y=pt+ih*g/4;ctx.beginPath();ctx.moveTo(pl,y);ctx.lineTo(pl+iw,y);ctx.stroke()}
  (opts.thresholds||[]).forEach(t=>{const y=pt+ih*(1-(t.v-min)/(max-min));if(y<pt||y>pt+ih)return;ctx.setLineDash([4,4]);ctx.strokeStyle=t.c;ctx.beginPath();ctx.moveTo(pl,y);ctx.lineTo(pl+iw,y);ctx.stroke();ctx.setLineDash([])});
  series.forEach(s=>{
    if(!s.data.length)return;
    ctx.strokeStyle=s.c;ctx.lineWidth=1.6;ctx.beginPath();
    s.data.forEach((p,i)=>{const x=pl+iw*i/(s.data.length-1),y=pt+ih*(1-(p.v-min)/(max-min));i?ctx.lineTo(x,y):ctx.moveTo(x,y)});
    ctx.stroke();
  });
  ctx.fillStyle='#5f6b78';ctx.font='10px JetBrains Mono,monospace';
  ctx.fillText(fmt1(max),8,pt+9);ctx.fillText(fmt1(min),8,pt+ih);
  if(series[0]&&series[0].data.length>1){const d=series[0].data;ctx.fillText(ts(d[0].t),pl,H-6);ctx.textAlign='right';ctx.fillText(ts(d[d.length-1].t),pl+iw,H-6);ctx.textAlign='left'}
}
function barChart(cv,labels,vals,opts={}){
  const[ctx,W,H]=setupCanvas(cv);ctx.clearRect(0,0,W,H);
  const pl=8,pr=8,pt=10,pb=22,iw=W-pl-pr,ih=H-pt-pb,mx=Math.max(...vals,1);
  const bw=iw/vals.length;
  vals.forEach((v,i)=>{
    const h=ih*v/mx,x=pl+i*bw+bw*0.18;
    ctx.fillStyle=opts.colors?opts.colors[i]:(opts.color||'#4aa8ff');
    ctx.fillRect(x,pt+ih-h,bw*0.64,h);
    ctx.fillStyle='#9aa7b4';ctx.font='10px JetBrains Mono,monospace';ctx.textAlign='center';
    ctx.fillText(labels[i],x+bw*0.32,H-6);ctx.textAlign='left';
  });
}
function gaugeHTML(val,min,max,zones,label,unit){
  let col=zones[0][1];zones.forEach(z=>{if(val>=z[0])col=z[1]});
  const frac=Math.max(0,Math.min(1,(val-min)/(max-min))),C=2*Math.PI*34,arc=C*0.75;
  return `<div style="text-align:center"><svg viewBox="0 0 96 86" style="width:130px;max-width:100%"><circle cx="48" cy="47" r="34" fill="none" stroke="#1c2530" stroke-width="7" stroke-linecap="round" stroke-dasharray="${arc} ${C-arc}" transform="rotate(135 48 47)"/><circle cx="48" cy="47" r="34" fill="none" stroke="${col}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${arc*frac} ${C-arc*frac}" transform="rotate(135 48 47)" style="transition:all .5s"/><text x="48" y="45" text-anchor="middle" style="font-size:16px;font-weight:600;fill:#e8edf3;font-family:inherit" class="tnum">${fmt1(val)}</text><text x="48" y="59" text-anchor="middle" style="font-size:10px;fill:#5f6b78">${unit}</text></svg><div style="font-size:12px;color:#9aa7b4">${label}</div></div>`;
}
function ringHTML(score,color){
  const C=2*Math.PI*34,off=C*(1-score/100);
  return `<div class="health-ring"><svg width="86" height="86"><circle cx="43" cy="43" r="34" fill="none" stroke="#1c2530" stroke-width="7"/><circle cx="43" cy="43" r="34" fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${off}" style="transition:stroke-dashoffset .6s"/></svg><div class="v tnum" style="color:${color}">${Math.round(score)}%</div></div>`;
}

/* ---------------- shared fragments ---------------- */
function liveKpis(){
  const a=ALARMS.filter(x=>x.status==='ACTIVE');
  return `<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(135px,1fr))">
    <div class="card"><div class="plabel">Plant status</div><div style="margin-top:5px">${chip('running')}</div></div>
    <div class="card"><div class="plabel">Production</div><div class="pval tnum" id="kProd">${fmt(PROD.actual)}</div><div class="psub">units · today · target ${fmt(PROD.target)}</div></div>
    <div class="card"><div class="plabel">OEE</div><div class="pval tnum" style="color:${K.oee>85?'var(--green)':'var(--yellow)'}">${fmt1(K.oee)}%</div><div class="psub">A 91 · P 96 · Q 99</div></div>
    <div class="card"><div class="plabel">Energy</div><div class="pval tnum" id="kEnergy">${fmt(K.energy)}</div><div class="psub">kWh · today</div></div>
    <div class="card"><div class="plabel">Downtime</div><div class="pval tnum">${fmtH(MACHINES.reduce((s,m)=>s+m.down,0))}</div><div class="psub">shift total</div></div>
    <div class="card"><div class="plabel">Active alarms</div><div class="pval tnum" style="color:var(--red)">${a.length}</div><div class="psub">critical: <span class="tnum">${a.filter(x=>x.sev==='CRITICAL'||x.sev==='EMERGENCY').length}</span></div></div>
  </div>`;
}
function machineCards(){
  return `<div class="mgrid">${MACHINES.map((m,i)=>`
    <div class="mcard ${selected===i?'sel':''}" data-i="${i}">
      <div class="bar" style="background:${STATE[m.st].hex}"></div>
      <h4>${m.name}</h4><div class="mid">${m.id} · ${m.plc}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">${chip(m.st)}<span class="mono" style="color:var(--text3)">${fmt1(m.temp)}°C</span></div>
      <div class="rowline"><span>RPM</span><b class="tnum">${fmt(m.rpm)}</b></div>
      <div class="rowline"><span>Power</span><b class="tnum">${fmt1(m.pow)} kW</b></div>
      <div class="rowline"><span>Output</span><b class="tnum">${fmt(m.prod)} u</b></div>
    </div>`).join('')}</div>`;
}
function machineDetail(){
  if(selected===null)return'';
  const m=MACHINES[selected];
  return `<div class="panel" style="margin-top:12px">
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px">
      <span style="font-size:16px;font-weight:600">${m.name} · ${m.id}</span>${chip(m.st)}
      <span class="mono" style="color:var(--text3)">v1/plant01/line/${m.line}/machine/${m.id}/sensor/#</span>
      <button class="btn" style="margin-left:auto" onclick="selectMachine(null)">Close</button>
    </div>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr));align-items:center">
      ${gaugeHTML(m.temp,0,120,[[95,'#ef5350'],[85,'#f5b942'],[0,'#2ecc71']],'Temperature','°C')}
      ${gaugeHTML(m.press,0,12,[[10.5,'#ef5350'],[9,'#f5b942'],[0,'#2ecc71']],'Pressure','bar')}
      ${gaugeHTML(m.vib,0,10,[[6,'#ef5350'],[4,'#f5b942'],[0,'#2ecc71']],'Vibration','mm/s')}
      <div>
        <div class="rowline"><span>Runtime</span><b class="tnum">${fmtH(m.run)}</b></div>
        <div class="rowline"><span>Downtime</span><b class="tnum">${fmtH(m.down)}</b></div>
        <div class="rowline"><span>Production</span><b class="tnum">${fmt(m.prod)} units</b></div>
        <div class="rowline"><span>Last maintenance</span><b>2026-09-12</b></div>
        <div class="rowline"><span>Next maintenance</span><b>2026-10-12</b></div>
        <div class="rowline"><span>Active alarms</span><b class="tnum">${ALARMS.filter(a=>a.m===m.id&&a.status==='ACTIVE').length}</b></div>
      </div>
    </div></div>`;
}
window.selectMachine=i=>{selected=i;renderView()};
function alarmListHTML(limit=8){
  const list=ALARMS.slice(0,limit);
  if(!list.length)return '<div style="padding:10px;font-size:12px;color:var(--text3)">No alarms — all clear</div>';
  return list.map(a=>`<div class="rowline" style="border-bottom:1px solid var(--border);padding:8px 2px">
    <span class="sev ${a.sev}">${a.sev}</span>
    <span style="flex:1;min-width:0">${a.m} · ${a.param} <b class="tnum">${a.val}</b> &gt; ${a.thr}</span>
    <span class="mono" style="color:var(--text3)">${ts(a.t)}</span>
    ${a.status==='ACTIVE'?`<button class="btn" onclick="ackAlarm('${a.id}')">Ack</button>`:`<span style="font-size:11px;color:var(--text3)">${a.status}</span>`}
  </div>`).join('');
}
window.ackAlarm=id=>{const a=ALARMS.find(x=>x.id===id);if(a){a.status='ACKNOWLEDGED';a.ackBy='A. Sharma';a.ackT=now();flash('Alarm '+id+' acknowledged');renderView()}};
window.silenceAlarm=id=>{const a=ALARMS.find(x=>x.id===id);if(a){a.status='SILENCED';renderView()}};

/* ---------------- SCADA svg floor ---------------- */
const SCADA_POS={'M-101':[60,70],'M-102':[60,170],'M-103':[240,70],'M-104':[240,170],'M-105':[430,70],'M-106':[430,170],'M-107':[610,70],'M-108':[610,170]};
function scadaSVG(){
  const nodes=MACHINES.map(m=>{
    const[x,y]=SCADA_POS[m.id];
    return `<g class="scada-node" data-mid="${m.id}" onclick="selectMachine(${MACHINES.indexOf(m)});location.hash='#/machines'">
      <rect class="node-body" x="${x}" y="${y}" width="120" height="64" rx="8" fill="#161d26" stroke="${STATE[m.st].hex}" stroke-width="1.6"/>
      <circle cx="${x+14}" cy="${y+16}" r="5" fill="${STATE[m.st].hex}" class="${m.st==='fault'?'pulse':''}"/>
      <text x="${x+26}" y="${y+20}" style="font-size:11px;font-weight:600;fill:#e8edf3">${m.id}</text>
      <text x="${x+12}" y="${y+38}" style="font-size:10px;fill:#9aa7b4">${m.name}</text>
      <text x="${x+12}" y="${y+54}" style="font-size:10px;fill:#5f6b78" class="tnum">${fmt1(m.temp)}°C · ${fmt(m.rpm)}rpm</text>
    </g>`;
  }).join('');
  const links=[[60,102,240,102],[60,202,240,202],[240,102,430,102],[240,202,430,202],[430,102,610,102],[430,202,610,202]].map(l=>
    `<line class="flowline" x1="${l[0]+120}" y1="${l[1]}" x2="${l[2]}" x2="${l[2]}" y2="${l[3]}" stroke="#2e3946" stroke-width="2"/>`).join('');
  return `<div class="floor"><svg viewBox="0 0 800 300" style="min-height:280px">
    <rect x="0" y="0" width="800" height="300" fill="#0d1218"/>
    ${Array.from({length:16},(_,i)=>`<line x1="${i*50}" y1="0" x2="${i*50}" y2="300" stroke="#141b23"/>`).join('')}
    ${Array.from({length:7},(_,i)=>`<line x1="0" y1="${i*50}" x2="800" y2="${i*50}" stroke="#141b23"/>`).join('')}
    <text x="16" y="24" style="font-size:11px;fill:#5f6b78;letter-spacing:2px">PLANT 01 · FLOOR A · LINE 1 + LINE 2</text>
    ${links}${nodes}
  </svg></div>`;
}
function updateScadaStates(){
  $$('.scada-node').forEach(g=>{
    const m=MACHINES.find(x=>x.id===g.dataset.mid);if(!m)return;
    g.querySelector('.node-body').setAttribute('stroke',STATE[m.st].hex);
    const c=g.querySelector('circle');c.setAttribute('fill',STATE[m.st].hex);
    g.querySelectorAll('text')[2].textContent=`${fmt1(m.temp)}°C · ${fmt(m.rpm)}rpm`;
  });
  $$('.mcard .bar').forEach((b,i)=>{if(MACHINES[i])b.style.background=STATE[MACHINES[i].st].hex});
  $$('.mcard').forEach((c,i)=>{if(MACHINES[i])c.querySelector('.chip').outerHTML=chip(MACHINES[i].st)});
}

/* ---------------- main chart (process/trends/overview) ---------------- */
let chartCfg={series:()=>[{c:'#4aa8ff',data:hist.temp.slice(-chartRange)},{c:'#9b7bff',data:hist.press.map(p=>({t:p.t,v:p.v*10})).slice(-chartRange)}],min:30,max:130};
function drawMainChart(){
  const cv=$('#mainChart');if(!cv)return;
  lineChart(cv,chartCfg.series(),{min:chartCfg.min,max:chartCfg.max,thresholds:[{v:85,c:'#f5b942'},{v:95,c:'#ef5350'}]});
}
window.setRange=r=>{chartRange=r;$$('.tbtn[data-r]').forEach(b=>b.classList.toggle('on',+b.dataset.r===r));drawMainChart()};
window.toggleLive=()=>{chartPaused=!chartPaused;const b=$('#liveBtn');if(b){b.classList.toggle('on',!chartPaused);b.textContent=chartPaused?'❚❚ Paused':'● Live'}};
