let sSearchVal='',fSevVal='',fStVal='';
/* ---------------- views ---------------- */
const NAV=[
 ['Monitor',[['overview','Overview','var(--green)'],['scada','SCADA control room','var(--blue)'],['plant','Plant view','var(--purple)'],['machines','Machines','var(--text3)'],['production','Production','var(--red)'],['sensors','Sensors','var(--yellow)'],['process','Process monitoring','var(--green)'],['alarms','Alarms & events','var(--red)']]],
 ['Analyze',[['trends','Trends','var(--blue)'],['analytics','Analytics','var(--purple)'],['oee','OEE','var(--green)'],['energy','Energy','var(--yellow)'],['quality','Quality','var(--text3)']]],
 ['Maintain',[['maintenance','Maintenance','var(--red)'],['predictive','Predictive maintenance','var(--blue)'],['inventory','Inventory','var(--purple)'],['reports','Reports','var(--text3)'],['automation','Automation','var(--green)']]],
 ['System',[['devices','Devices & gateways','var(--blue)'],['users','Users & roles','var(--green)'],['settings','System settings','var(--text3)']]],
];
const TITLES=Object.fromEntries(NAV.flatMap(g=>g[1].map(i=>[i[0],i[1]])));

const VIEWS={
/* ============ 1. OVERVIEW ============ */
overview(){return `<div class="page">
  <div class="pagehead"><h1>Executive overview</h1><span class="sub">Command center · Plant 01 · all lines · live</span><span class="right"><span class="demo-badge">Demo · simulated data</span></span></div>
  <div id="liveVals">${liveKpis()}</div>
  <div class="grid" style="grid-template-columns:1fr 330px;margin-top:12px">
    <div>
      <div class="panel"><h3>Machine line — live status <span class="right" style="font-size:11px;color:var(--text3)">click a machine for detail</span></h3>${machineCards()}${machineDetail()}</div>
      <div class="panel" style="margin-top:12px"><h3>Process trends — M-101 temperature + pressure</h3>
        <canvas id="mainChart" class="chart" data-h="200"></canvas>
        <div class="legend"><span><span style="color:#4aa8ff">●</span> Temperature °C</span><span><span style="color:#9b7bff">●</span> Pressure (×10 bar)</span><span style="margin-left:auto"><button class="tbtn" data-r="60" onclick="setRange(60)">1m</button> <button class="tbtn on" data-r="300" onclick="setRange(300)">5m</button> <button class="tbtn" data-r="900" onclick="setRange(900)">15m</button> <button class="tbtn on" id="liveBtn" onclick="toggleLive()">● Live</button></span></div>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:12px">
      <div class="panel"><h3>Alarms <span class="right"><button class="btn" onclick="location.hash='#/alarms'">View all</button></span></h3><div id="almList">${alarmListHTML(7)}</div></div>
      <div class="panel"><h3>System health</h3>
        <div class="rowline"><span>API</span><b style="color:var(--green)">Online</b></div>
        <div class="rowline"><span>MQTT broker</span><b style="color:var(--green)">Online</b></div>
        <div class="rowline"><span>Database</span><b style="color:var(--green)">Online</b></div>
        <div class="rowline"><span>WebSocket</span><b style="color:var(--green)">Online</b></div>
        <div class="rowline"><span>PLC link</span><b style="color:var(--green)">Online</b></div>
        <div class="rowline"><span>n8n</span><b style="color:var(--yellow)">Degraded</b></div>
      </div>
      <div class="panel"><h3>MQTT event stream</h3><div class="mqtt-feed" id="mqfeed"></div></div>
    </div>
  </div></div>`},
/* ============ 2. SCADA ============ */
scada(){return `<div class="page">
  <div class="pagehead"><h1>SCADA control room</h1><span class="sub">Graphical machine floor · real-time states</span><span class="right"><span class="demo-badge">Demo · simulated</span></span></div>
  <div style="display:flex;gap:16px;margin-bottom:12px;flex-wrap:wrap;font-size:12px;color:var(--text2)">
    ${Object.entries(STATE).map(([k,s])=>`<span style="display:flex;gap:6px;align-items:center"><span class="dot" style="background:${s.hex}"></span>${s.label}</span>`).join('')}
  </div>
  ${scadaSVG()}
  <div id="scadaDetail">${machineDetail()}</div></div>`},
/* ============ 3. PLANT VIEW ============ */
plant(){const tree=(line)=>`<details open><summary><span class="dot" style="background:var(--blue)"></span>${line.name}</summary>
    ${MACHINES.filter(m=>m.line===line.id).map(m=>`<details><summary><span class="dot" style="background:${STATE[m.st].hex}"></span>${m.name} <span class="mono" style="color:var(--text3)">${m.id}</span> ${chip(m.st)}</summary>
      <div class="leaf"><span class="mono">${m.plc}</span> · ${m.mfr} ${m.model}</div>
      ${SENSOR_DEFS.filter(([sid])=>!(m.type==='FUR'&&['RPM','FLOW'].includes(sid))).map(([sid,name,unit])=>{const s=SENSORS.find(x=>x.id==='S-'+m.id.slice(2)+'-'+sid);return `<div class="leaf"><span class="dot" style="background:${s&&s.status==='crit'?'var(--red)':s&&s.status==='warn'?'var(--yellow)':'var(--green)'}"></span>${name} <b class="tnum" style="color:var(--text2)">${s?fmt1(s.val):'—'} ${unit}</b></div>`}).join('')}
    </details>`).join('')}</details>`;
  return `<div class="page"><div class="pagehead"><h1>Plant view</h1><span class="sub">Hierarchy: plant → area → line → machine → PLC → sensor</span></div>
  <div class="grid" style="grid-template-columns:1fr 1fr">
    <div class="panel"><h3>Plant 01 — Pune</h3><div class="tree">
      <details open><summary><span class="dot" style="background:var(--green)"></span>Area A — Production</summary>
        ${tree(LINES[0])}${tree(LINES[1])}
      </details>
      <details><summary><span class="dot" style="background:var(--yellow)"></span>Area B — Utilities</summary>
        <div class="leaf"><span class="dot" style="background:var(--green)"></span>Air compressor station</div>
        <div class="leaf"><span class="dot" style="background:var(--green)"></span>Water treatment</div>
      </details>
    </div></div>
    <div class="panel"><h3>Equipment map</h3>${scadaSVG()}</div>
  </div></div>`},
/* ============ 4. MACHINES ============ */
machines(){return `<div class="page">
  <div class="pagehead"><h1>Machines</h1><span class="sub">${MACHINES.length} assets · digital profiles</span></div>
  ${machineCards()}${machineDetail()}
  <div class="panel" style="margin-top:12px;overflow-x:auto"><h3>Machine register</h3><table class="tbl"><tr><th>ID</th><th>Name</th><th>Type</th><th>Line</th><th>Manufacturer</th><th>Model</th><th>Installed</th><th>Status</th><th>Runtime</th><th>OEE</th><th>Energy kWh</th></tr>
  ${MACHINES.map(m=>`<tr><td class="mono">${m.id}</td><td>${m.name}</td><td>${M_TYPE[m.type]}</td><td>${m.line}</td><td>${m.mfr}</td><td>${m.model}</td><td>${m.inst}</td><td>${chip(m.st)}</td><td class="tnum">${fmtH(m.run)}</td><td class="tnum">${fmt1(m.oee)}%</td><td class="tnum">${fmt(m.energy)}</td></tr>`).join('')}</table></div></div>`},
/* ============ 5. PRODUCTION ============ */
production(){
  const hours=[...Array(8)].map((_,i)=>{const h=new Date(now()- (7-i)*3600e3);return h.getHours()+':00'});
  const vals=[1120,1350,1290,1480,1395,1520,1460,PROD.actual%1600];
  return `<div class="page"><div class="pagehead"><h1>Production</h1><span class="sub">Batch ${PROD.batch} · shift ${PROD.shift} · cycle ${PROD.cycle}s</span></div>
  <div id="liveVals">${liveKpis()}</div>
  <div class="grid" style="grid-template-columns:1fr 1fr;margin-top:12px">
    <div class="panel"><h3>Target vs actual — hourly</h3><canvas id="prodChart" class="chart" data-h="220"></canvas>
      <div class="legend"><span><span style="color:#4aa8ff">■</span> Actual units/h</span><span style="margin-left:auto">Target/h: <b class="tnum">${fmt(PROD.target/10)}</b></span></div></div>
    <div class="panel"><h3>Shift summary</h3>
      <div class="rowline"><span>Production target</span><b class="tnum">${fmt(PROD.target)}</b></div>
      <div class="rowline"><span>Actual production</span><b class="tnum">${fmt(PROD.actual)}</b></div>
      <div class="rowline"><span>Good units</span><b class="tnum" style="color:var(--green)">${fmt(PROD.good)}</b></div>
      <div class="rowline"><span>Rejected units</span><b class="tnum" style="color:var(--yellow)">${fmt(PROD.rej)}</b></div>
      <div class="rowline"><span>Scrap</span><b class="tnum" style="color:var(--red)">${fmt(PROD.scrap)}</b></div>
      <div class="rowline"><span>Cycle time</span><b class="tnum">${PROD.cycle}s</b></div>
      <div class="rowline"><span>Efficiency</span><b class="tnum">${fmt1(PROD.actual/PROD.target*100)}%</b></div>
      <div style="margin-top:12px"><div class="rowline"><span>Progress to target</span><b class="tnum">${fmt1(PROD.actual/PROD.target*100)}%</b></div>
      <div class="progress"><i style="width:${Math.min(100,PROD.actual/PROD.target*100)}%;background:var(--blue)"></i></div></div>
    </div>
  </div></div>`},
/* ============ 6. SENSORS ============ */
sensors(){return `<div class="page"><div class="pagehead"><h1>Sensors</h1><span class="sub">${SENSORS.length} sensors · ${MACHINES.length} machines</span>
    <span class="right"><input type="text" placeholder="Search sensors…" value="${sSearchVal}" oninput="sSearchVal=this.value;renderView()"></span></div>
  <div class="panel" style="overflow-x:auto"><table class="tbl" id="sTable"><tr><th>Sensor</th><th>ID</th><th>Type</th><th>Machine</th><th>MQTT topic</th><th>Value</th><th>Warn</th><th>Crit</th><th>Status</th><th>Batt</th><th>Signal</th><th>Last update</th></tr>
  ${SENSORS.filter(s=>!sSearchVal||s.id.toLowerCase().includes(sSearchVal.toLowerCase())||s.name.toLowerCase().includes(sSearchVal.toLowerCase())).map(s=>{const m=MACHINES.find(x=>x.id===s.machine);return `<tr class="${s.status==='crit'?'crit':''}">
    <td>${s.name}</td><td class="mono">${s.id}</td><td>${s.type}</td><td>${s.machine}</td>
    <td class="mono" style="font-size:10px;max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${s.topic}</td>
    <td class="tnum" style="font-weight:600">${fmt1(s.val)} ${s.unit}</td><td class="tnum" style="color:var(--yellow)">${isFinite(s.warn)?s.warn:'—'}</td><td class="tnum" style="color:var(--red)">${isFinite(s.crit)?s.crit:'—'}</td>
    <td>${s.status==='crit'?'<span class="sev CRITICAL">CRIT</span>':s.status==='warn'?'<span class="sev WARNING">WARN</span>':'<span class="sev INFO">OK</span>'}</td>
    <td class="tnum">${Math.round(s.batt)}%</td><td class="tnum">${Math.round(s.sig)}%</td><td class="mono">${ts(s.last)}</td></tr>`}).join('')}</table></div></div>`},
/* ============ 7. PROCESS ============ */
process(){return `<div class="page"><div class="pagehead"><h1>Process monitoring</h1><span class="sub">M-101 · multi-parameter overlay · thresholds + alarm markers</span>
  <span class="right"><button class="tbtn" data-r="60" onclick="setRange(60)">1m</button> <button class="tbtn on" data-r="300" onclick="setRange(300)">5m</button> <button class="tbtn" data-r="900" onclick="setRange(900)">15m</button> <button class="tbtn on" onclick="toggleLive()">● Live</button></span></div>
  <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">
    ${(()=>{const m=MACHINES[0];return gaugeHTML(m.temp,0,120,[[95,'#ef5350'],[85,'#f5b942'],[0,'#2ecc71']],'Temperature','°C')+gaugeHTML(m.press,0,12,[[10.5,'#ef5350'],[9,'#f5b942'],[0,'#2ecc71']],'Pressure','bar')+gaugeHTML(m.rpm,0,3000,[[2700,'#ef5350'],[2500,'#f5b942'],[0,'#2ecc71']],'Spindle speed','rpm')+gaugeHTML(m.vib,0,10,[[6,'#ef5350'],[4,'#f5b942'],[0,'#2ecc71']],'Vibration','mm/s')})()}
  </div>
  <div class="panel" style="margin-top:12px"><h3>Trend canvas</h3><canvas id="mainChart" class="chart" data-h="260"></canvas>
  <div class="legend"><span><span style="color:#4aa8ff">●</span> Temp °C</span><span><span style="color:#9b7bff">●</span> Pressure ×10 bar</span><span><span style="color:#f5b942">- -</span> Warn 85°C</span><span><span style="color:#ef5350">- -</span> Crit 95°C</span></div></div></div>`},
/* ============ 8. ALARMS ============ */
alarms(){const a=ALARMS;return `<div class="page"><div class="pagehead"><h1>Alarms & events</h1><span class="sub">${a.filter(x=>x.status==='ACTIVE').length} active · ${a.length} total</span>
  <span class="right"><select onchange="fSevVal=this.value;renderView()"><option value="">All severities</option>${['EMERGENCY','CRITICAL','WARNING','INFO'].map(s=>`<option ${fSevVal===s?'selected':''}>${s}</option>`).join('')}</select>
  <select onchange="fStVal=this.value;renderView()"><option value="">All statuses</option>${['ACTIVE','ACKNOWLEDGED','SILENCED'].map(s=>`<option ${fStVal===s?'selected':''}>${s}</option>`).join('')}</select></span></div>
  <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr));margin-bottom:12px">
    ${['EMERGENCY','CRITICAL','WARNING','INFO'].map(s=>`<div class="card"><div class="plabel">${s.toLowerCase()}</div><div class="pval tnum" style="color:${{EMERGENCY:'var(--red)',CRITICAL:'var(--red)',WARNING:'var(--yellow)',INFO:'var(--blue)'}[s]}">${a.filter(x=>x.sev===s).length}</div></div>`).join('')}
  </div>
  <div class="panel" style="overflow-x:auto"><table class="tbl"><tr><th>ID</th><th>Time</th><th>Machine</th><th>Parameter</th><th>Actual</th><th>Threshold</th><th>Severity</th><th>Status</th><th>Ack by</th><th>Actions</th></tr>
  ${a.filter(x=>(!fSevVal||x.sev===fSevVal)&&(!fStVal||x.status===fStVal)).slice(0,30).map(x=>`<tr class="${x.sev==='CRITICAL'||x.sev==='EMERGENCY'?'crit':''}">
    <td class="mono">${x.id}</td><td class="mono">${x.t.toLocaleString('en-GB')}</td><td>${x.m}</td><td>${x.param}</td><td class="tnum">${x.val}</td><td class="tnum">${x.thr}</td>
    <td><span class="sev ${x.sev}">${x.sev}</span></td><td>${x.status}</td><td>${x.ackBy||'—'}</td>
    <td>${x.status==='ACTIVE'?`<button class="btn" onclick="ackAlarm('${x.id}')">Ack</button> <button class="btn" onclick="silenceAlarm('${x.id}')">Silence</button>`:'—'}</td></tr>`).join('')||'<tr><td colspan="10" style="text-align:center;color:var(--text3)">No alarms match filter</td></tr>'}</table></div></div>`},
/* ============ 9. TRENDS ============ */
trends(){return `<div class="page"><div class="pagehead"><h1>Trends</h1><span class="sub">Multi-sensor compare · zoom by range · min/max/avg</span>
  <span class="right"><button class="tbtn" data-r="60" onclick="setRange(60)">1m</button> <button class="tbtn on" data-r="300" onclick="setRange(300)">5m</button> <button class="tbtn" data-r="900" onclick="setRange(900)">15m</button> <button class="tbtn" onclick="toggleLive()">● Live</button></span></div>
  <div class="panel"><canvas id="mainChart" class="chart" data-h="280"></canvas>
  <div class="legend" id="trendLegend"></div></div>
  <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr));margin-top:12px">
    ${['temp','press','rpm','vib'].map(k=>{const d=hist[k].slice(-chartRange);if(!d.length)return'';const vs=d.map(p=>p.v);const mn=Math.min(...vs),mx=Math.max(...vs),av=vs.reduce((a,b)=>a+b,0)/vs.length;
      return `<div class="card"><div class="plabel">${k.toUpperCase()} · ${chartRange<=60?'1 min':chartRange<=300?'5 min':'15 min'}</div>
      <div class="rowline"><span>Min</span><b class="tnum">${fmt1(mn)}</b></div><div class="rowline"><span>Avg</span><b class="tnum">${fmt1(av)}</b></div><div class="rowline"><span>Max</span><b class="tnum">${fmt1(mx)}</b></div></div>`}).join('')}
  </div></div>`},
/* ============ 10. ANALYTICS ============ */
analytics(){return `<div class="page"><div class="pagehead"><h1>Analytics</h1><span class="sub">Downtime Pareto · state distribution · production by machine</span></div>
  <div class="grid" style="grid-template-columns:1fr 1fr 1fr">
    <div class="panel"><h3>Downtime by machine (min)</h3><canvas id="an1" class="chart" data-h="200"></canvas></div>
    <div class="panel"><h3>Production by machine (units)</h3><canvas id="an2" class="chart" data-h="200"></canvas></div>
    <div class="panel"><h3>Machine states</h3><canvas id="an3" class="chart" data-h="200"></canvas></div>
  </div>
  <div class="panel" style="margin-top:12px;overflow-x:auto"><h3>Key indicators</h3><table class="tbl"><tr><th>Machine</th><th>Availability</th><th>Performance</th><th>Quality</th><th>OEE</th><th>Downtime</th><th>Energy kWh</th></tr>
  ${MACHINES.map(m=>`<tr><td>${m.name}</td><td class="tnum">${fmt1(85+ (m.run/(m.run+m.down))*15)}%</td><td class="tnum">${fmt1(80+Math.random()*18)}%</td><td class="tnum">${fmt1(94+Math.random()*6)}%</td><td class="tnum" style="font-weight:600">${fmt1(m.oee)}%</td><td class="tnum">${fmtH(m.down)}</td><td class="tnum">${fmt(m.energy)}</td></tr>`).join('')}</table></div></div>`},
/* ============ 11. OEE ============ */
oee(){return `<div class="page"><div class="pagehead"><h1>OEE</h1><span class="sub">OEE = Availability × Performance × Quality</span></div>
  <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">
    ${gaugeHTML(91,0,100,[[60,'#ef5350'],[75,'#f5b942'],[0,'#2ecc71']],'Availability','%')}
    ${gaugeHTML(96,0,100,[[60,'#ef5350'],[75,'#f5b942'],[0,'#2ecc71']],'Performance','%')}
    ${gaugeHTML(99,0,100,[[60,'#ef5350'],[75,'#f5b942'],[0,'#2ecc71']],'Quality','%')}
    <div style="text-align:center">${ringHTML(K.oee,K.oee>85?'#2ecc71':'#f5b942')}<div style="font-size:12px;color:var(--text2);margin-top:4px">Overall OEE</div></div>
  </div>
  <div class="panel" style="margin-top:12px;overflow-x:auto"><h3>Machine-wise OEE</h3><table class="tbl"><tr><th>Machine</th><th>Planned</th><th>Actual</th><th>Downtime</th><th>Rejects</th><th>OEE</th><th>Trend</th></tr>
  ${MACHINES.map(m=>`<tr><td>${m.name}</td><td class="tnum">${fmt(2000)}</td><td class="tnum">${fmt(m.prod)}</td><td class="tnum">${fmtH(m.down)}</td><td class="tnum">${fmt(Math.round(m.prod*0.02))}</td><td class="tnum" style="font-weight:600;color:${m.oee>85?'var(--green)':m.oee>70?'var(--yellow)':'var(--red)'}">${fmt1(m.oee)}%</td>
  <td><div class="progress" style="width:120px"><i style="width:${m.oee}%;background:${m.oee>85?'var(--green)':m.oee>70?'var(--yellow)':'var(--red)'}"></i></div></td></tr>`).join('')}</table></div></div>`},
/* ============ 12. MAINTENANCE ============ */
maintenance(){const wos=[
  {id:'WO-1042',m:'M-108 · CNC lathe 3',pr:'HIGH',asgn:'R. Verma',due:'2026-09-27',st:'OPEN',desc:'Spindle bearing noise — replace bearing set',parts:'Bearing 6208 ×2, grease'},
  {id:'WO-1041',m:'M-103 · Injection molder',pr:'MEDIUM',asgn:'S. Iqbal',due:'2026-09-29',st:'IN_PROGRESS',desc:'Hydraulic seal leak on clamp unit',parts:'Seal kit HK-44'},
  {id:'WO-1039',m:'M-104 · Compressor A',pr:'LOW',asgn:'A. Sharma',due:'2026-10-02',st:'OPEN',desc:'Quarterly preventive service',parts:'Oil filter, air filter'},
  {id:'WO-1036',m:'M-107 · Heat furnace 1',pr:'HIGH',asgn:'R. Verma',due:'2026-09-26',st:'IN_PROGRESS',desc:'Thermocouple drift — calibrate zone 2',parts:'TC type K ×1'},
  {id:'WO-1032',m:'M-101 · CNC milling 1',pr:'LOW',asgn:'S. Iqbal',due:'2026-10-12',st:'DONE',desc:'Preventive maintenance completed',parts:'—',cost:'₹ 4,200'},
 ];
 const pc={OPEN:'var(--yellow)',IN_PROGRESS:'var(--blue)',DONE:'var(--green)'};const pp={HIGH:'var(--red)',MEDIUM:'var(--yellow)',LOW:'var(--green)'};
 return `<div class="page"><div class="pagehead"><h1>Maintenance</h1><span class="sub">Preventive · corrective · work orders</span><span class="right"><button class="btn primary" onclick="flash('Work order creation opens here (demo)')">+ New work order</button></span></div>
 <div class="kanban">${['OPEN','IN_PROGRESS','DONE'].map(st=>`<div class="kb-col"><h4>${st.replace('_',' ')} (${wos.filter(w=>w.st===st).length})</h4><div class="kb-list">
   ${wos.filter(w=>w.st===st).map(w=>`<div class="kb-card"><div style="display:flex;justify-content:space-between;margin-bottom:6px"><b class="mono">${w.id}</b><span class="sev ${w.pr==='HIGH'?'CRITICAL':w.pr==='MEDIUM'?'WARNING':'INFO'}">${w.pr}</span></div>
   <div style="color:var(--text);margin-bottom:4px">${w.desc}</div>
   <div style="color:var(--text3);font-size:11px">${w.m}</div>
   <div class="rowline" style="margin-top:6px"><span>👤 ${w.asgn}</span><span class="mono">due ${w.due}</span></div>
   <div style="color:var(--text3);font-size:11px;margin-top:4px">Parts: ${w.parts}</div></div>`).join('')}</div></div>`).join('')}</div>
 <div class="panel" style="margin-top:12px"><h3>Maintenance schedule</h3><table class="tbl"><tr><th>Machine</th><th>Task</th><th>Frequency</th><th>Last done</th><th>Next due</th><th>Status</th></tr>
 ${MACHINES.slice(0,6).map((m,i)=>`<tr><td>${m.name}</td><td>${['Lubrication','Filter change','Belt inspection','Calibration','Software backup','Safety check'][i]}</td><td>${['Weekly','Monthly','Monthly','Quarterly','Monthly','Weekly'][i]}</td><td>2026-09-${String(10+i).padStart(2,'0')}</td><td>2026-10-${String(8+i).padStart(2,'0')}</td><td><span class="sev INFO">SCHEDULED</span></td></tr>`).join('')}</table></div></div>`},
/* ============ 13. PREDICTIVE ============ */
predictive(){const risk={LOW:'var(--green)',MEDIUM:'var(--yellow)',HIGH:'var(--red)',CRITICAL:'var(--red)'};
 return `<div class="page"><div class="pagehead"><h1>Predictive maintenance</h1><span class="sub">AI/ML-ready architecture · demo heuristics — <b style="color:var(--yellow)">no real ML model connected</b></span></div>
 <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(230px,1fr))">
  ${MACHINES.map(m=>{const health=Math.max(20,Math.min(98,Math.round(m.oee+rnd(-6,6)-(m.st==='fault'?25:0)-(m.st==='warning'?12:0))));
   const r=health>85?'LOW':health>65?'MEDIUM':health>40?'HIGH':'CRITICAL';
   return `<div class="card" style="display:flex;gap:14px;align-items:center"><div>${ringHTML(health,health>85?'#2ecc71':health>65?'#f5b942':'#ef5350')}</div>
   <div style="flex:1"><div style="font-weight:600;font-size:13px">${m.name}</div><div class="mono" style="color:var(--text3);margin:2px 0">${m.id}</div>
   <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><span class="sev ${r==='LOW'?'INFO':r==='MEDIUM'?'WARNING':'CRITICAL'}">RISK: ${r}</span><span class="badge-sim">SIMULATED</span></div>
   <div style="font-size:11px;color:var(--text3);margin-top:6px">Vibration ${fmt1(m.vib)} mm/s · Temp ${fmt1(m.temp)}°C · Runtime ${fmtH(m.run)}</div></div></div>`}).join('')}
 </div>
 <div class="panel" style="margin-top:12px"><h3>Architecture note</h3><div style="font-size:12px;color:var(--text2);line-height:1.7">
  Production path: MQTT telemetry → feature store (vibration/temp/current spectra) → ML scoring service → health score + RUL estimate → this dashboard.
  Demo mode uses threshold heuristics and is labeled <span class="badge-sim">SIMULATED</span>. Real predictions require a trained model — do not present heuristics as ML output.</div></div></div>`},
/* ============ 14. ENERGY ============ */
energy(){return `<div class="page"><div class="pagehead"><h1>Energy management</h1><span class="sub">Electricity · gas · water · compressed air</span></div>
  <div id="liveVals">${liveKpis()}</div>
  <div class="grid" style="grid-template-columns:1fr 330px;margin-top:12px">
    <div class="panel"><h3>Energy consumption trend (kWh)</h3><canvas id="energyChart" class="chart" data-h="230"></canvas>
    <div class="legend"><span><span style="color:#f5b942">●</span> Total kWh · cumulative</span><span style="margin-left:auto">kWh/unit: <b class="tnum">${fmt1(K.energy/Math.max(1,PROD.actual))}</b></span></div></div>
    <div class="panel"><h3>By machine (kWh today)</h3>
      ${MACHINES.slice().sort((a,b)=>b.energy-a.energy).map(m=>`<div style="margin-bottom:9px"><div class="rowline"><span>${m.name}</span><b class="tnum">${fmt(m.energy)}</b></div><div class="progress"><i style="width:${m.energy/12}%;background:${m.energy>700?'var(--red)':m.energy>400?'var(--yellow)':'var(--green)'}"></i></div></div>`).join('')}
      <div class="rowline" style="margin-top:8px"><span>Peak demand</span><b class="tnum">142 kW @ 14:32</b></div>
      <div class="rowline"><span>Est. cost today</span><b class="tnum">₹ ${fmt(K.energy*8.4)}</b></div>
    </div>
  </div></div>`},
/* ============ 15. QUALITY ============ */
quality(){const defects=[['Dimensional',42],['Surface finish',26],['Material flaw',14],['Assembly error',10],['Other',8]];
 return `<div class="page"><div class="pagehead"><h1>Quality management</h1><span class="sub">Batch ${PROD.batch} · defect Pareto · machine correlation</span></div>
 <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr))">
   <div class="card"><div class="plabel">Good units</div><div class="pval tnum" style="color:var(--green)">${fmt(PROD.good)}</div></div>
   <div class="card"><div class="plabel">Rejects</div><div class="pval tnum" style="color:var(--yellow)">${fmt(PROD.rej)}</div></div>
   <div class="card"><div class="plabel">Scrap</div><div class="pval tnum" style="color:var(--red)">${fmt(PROD.scrap)}</div></div>
   <div class="card"><div class="plabel">Defect rate</div><div class="pval tnum">${fmt1(PROD.rej/Math.max(1,PROD.good+PROD.rej)*100)}%</div></div>
 </div>
 <div class="grid" style="grid-template-columns:1fr 1fr;margin-top:12px">
   <div class="panel"><h3>Defect Pareto</h3><canvas id="qChart" class="chart" data-h="220"></canvas></div>
   <div class="panel"><h3>Defect table</h3><table class="tbl"><tr><th>Defect type</th><th>Count</th><th>% of rejects</th></tr>
   ${defects.map(([n,v],i)=>`<tr><td>${n}</td><td class="tnum">${v}</td><td class="tnum">${v}%</td></tr>`).join('')}</table>
   <div style="font-size:11px;color:var(--text3);margin-top:8px">Worst correlation: M-103 injection molder — dimensional defects track mold temperature (see Process trends).</div></div>
 </div></div>`},
/* ============ 16. INVENTORY ============ */
inventory(){const items=[['Bearing 6208','Bearings',148,50,'OK'],['Hydraulic seal HK-44','Seals',12,20,'LOW'],['Cutting oil ISO 46','Lubricants',6,10,'LOW'],['Motor capacitor 45µF','Electrical',34,15,'OK'],['Conveyor belt 2m','Mechanical',8,4,'OK'],['Thermocouple type K','Sensors',3,10,'CRITICAL'],['Filter element AF-20','Filters',56,30,'OK'],['PLC backup battery','Electrical',19,10,'OK']];
 return `<div class="page"><div class="pagehead"><h1>Inventory</h1><span class="sub">Spare parts awareness · linked to work orders</span></div>
 <div class="panel" style="overflow-x:auto"><table class="tbl"><tr><th>Item</th><th>Category</th><th>Stock</th><th>Min level</th><th>Status</th><th>Reserved by</th></tr>
 ${items.map(([n,c,s,mn,st])=>`<tr><td>${n}</td><td>${c}</td><td class="tnum">${s}</td><td class="tnum">${mn}</td>
 <td><span class="sev ${st==='OK'?'INFO':st==='LOW'?'WARNING':'CRITICAL'}">${st}</span></td>
 <td>${st!=='OK'?'WO-1042 · WO-1044':'—'}</td></tr>`).join('')}</table></div></div>`},
/* ============ 17. REPORTS ============ */
reports(){const reps=['Daily production report','Shift report','Machine report','Downtime report','Alarm report','Energy report','Maintenance report','OEE report','Quality report','Sensor health report'];
 return `<div class="page"><div class="pagehead"><h1>Reports</h1><span class="sub">Generate · schedule · export (PDF / CSV / Excel)</span></div>
 <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(250px,1fr))">
 ${reps.map(r=>`<div class="card"><div style="font-weight:600;font-size:13px;margin-bottom:6px">${r}</div>
   <div style="font-size:11px;color:var(--text3);margin-bottom:10px">Auto-generated from live historian · last run today 06:00</div>
   <div style="display:flex;gap:6px"><button class="btn" onclick="flash('${r}: PDF queued (demo)')">PDF</button><button class="btn" onclick="flash('${r}: CSV downloaded (demo)')">CSV</button><button class="btn" onclick="flash('${r}: Excel downloaded (demo)')">Excel</button></div></div>`).join('')}
 </div></div>`},
/* ============ 18. AUTOMATION ============ */
automation(){const rules=[
  {n:'Temperature critical response',w:'sensor.telemetry received',i:'TEMP > 95°C',t:'create alarm + notify supervisor + Telegram + work order',en:true},
  {n:'Machine fault escalation',w:'machine.status = FAULT',i:'duration > 5 min',t:'email plant manager + create emergency WO + call n8n',en:true},
  {n:'Daily production digest',w:'cron 18:00 daily',i:'shift = complete',t:'generate report + send management summary via n8n',en:true},
  {n:'Energy threshold',w:'energy.hourly > 620 kWh',i:'peak hours',t:'notify energy manager + log event',en:false},
 ];
 return `<div class="page"><div class="pagehead"><h1>Automation engine</h1><span class="sub">WHEN event → IF condition → THEN action · n8n webhooks</span>
 <span class="right"><button class="btn primary" onclick="flash('Rule builder opens here (demo)')">+ New rule</button></span></div>
 <div style="display:flex;flex-direction:column;gap:10px">
 ${rules.map(r=>`<div class="rulebox"><div style="display:flex;align-items:center;gap:10px;margin-bottom:8px"><b>${r.n}</b><span class="tag">${r.en?'ENABLED':'DISABLED'}</span>
   <span style="margin-left:auto;display:flex;gap:6px"><button class="btn" onclick="flash('Rule executed (dry run, demo)')">Test</button><button class="btn">${r.en?'Disable':'Enable'}</button></span></div>
   <div style="color:var(--text2);line-height:1.9"><span class="when">WHEN</span> ${r.w} &nbsp;·&nbsp; <span class="if">IF</span> ${r.i} &nbsp;·&nbsp; <span class="then">THEN</span> ${r.t}</div></div>`).join('')}
 </div>
 <div class="panel" style="margin-top:12px"><h3>Execution log</h3><div class="mqtt-feed">
   <div><span class="t">18:00:02</span> <span class="topic">automation/daily-production</span> → n8n webhook 200 OK · report emailed to 4 recipients</div>
   <div><span class="t">14:32:11</span> <span class="topic">automation/energy-peak</span> → notify energy.manager@plant01 · logged</div>
   <div><span class="t">11:05:47</span> <span class="topic">automation/temp-critical</span> → ALM-0007 + Telegram sent + WO-1038 created</div>
 </div></div></div>`},
/* ============ 19. DEVICES ============ */
devices(){const gws=[['GW-01','Edge gateway','EMQX · TLS','Online','12 devices'],['GW-02','Edge gateway','EMQX · TLS','Online','11 devices'],['PLC-S7-01','Siemens S7-1500','PROFINET → MQTT','Online','2 machines'],['PLC-S7-02','Siemens S7-1200','PROFINET → MQTT','Online','2 machines'],['PLC-AB-01','Allen-Bradley 1756','EtherNet/IP → MQTT','Online','2 machines'],['PLC-AB-02','Allen-Bradley 1756','EtherNet/IP → MQTT','Warning','2 machines']];
 return `<div class="page"><div class="pagehead"><h1>Devices & gateways</h1><span class="sub">PLCs · edge gateways · MQTT clients</span></div>
 <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr));margin-bottom:12px">
   <div class="card"><div class="plabel">Connected</div><div class="pval tnum" style="color:var(--green)">58</div></div>
   <div class="card"><div class="plabel">Disconnected</div><div class="pval tnum" style="color:var(--red)">2</div></div>
   <div class="card"><div class="plabel">Messages/sec</div><div class="pval tnum" id="mps">247</div></div>
   <div class="card"><div class="plabel">Retained</div><div class="pval tnum">16</div></div>
 </div>
 <div class="panel" style="overflow-x:auto"><table class="tbl"><tr><th>ID</th><th>Type</th><th>Protocol</th><th>Status</th><th>Payload</th></tr>
 ${gws.map(g=>`<tr><td class="mono">${g[0]}</td><td>${g[1]}</td><td>${g[2]}</td><td><span class="sev ${g[3]==='Online'?'INFO':'WARNING'}">${g[3].toUpperCase()}</span></td><td>${g[4]}</td></tr>`).join('')}</table></div>
 <div class="panel" style="margin-top:12px"><h3>Broker status</h3>
   <div class="rowline"><span>EMQX 5.7 · broker.plant01.local:8883</span><b style="color:var(--green)">Online</b></div>
   <div class="rowline"><span>TLS</span><b>Enabled (TLS 1.3)</b></div>
   <div class="rowline"><span>Auth</span><b>Username/password per device + ACL</b></div>
   <div class="rowline"><span>Uptime</span><b class="tnum">47d 12h</b></div></div></div>`},
/* ============ 20. USERS ============ */
users(){const roles=[['Super Admin','Full platform control',1],['Plant Manager','All plants · reports · users',2],['Production Manager','Production · OEE · quality',3],['Process Engineer','Trends · process · sensors',4],['Maintenance Engineer','Work orders · predictive',6],['Operator','SCADA · alarms ack',18],['Quality Engineer','Quality · reports',2],['Viewer','Read-only dashboards',5]];
 const us=[['A. Sharma','a.sharma','Plant Manager','Online'],['R. Verma','r.verma','Maintenance Engineer','Online'],['S. Iqbal','s.iqbal','Operator','Online'],['J. Patel','j.patel','Viewer','Offline']];
 return `<div class="page"><div class="pagehead"><h1>Users & roles</h1><span class="sub">Role-based access control · audit logged</span>
 <span class="right"><button class="btn primary" onclick="flash('User creation is admin-only (demo)')">+ Add user</button></span></div>
 <div class="grid" style="grid-template-columns:1fr 1fr">
  <div class="panel"><h3>Roles</h3><table class="tbl"><tr><th>Role</th><th>Permissions</th><th>Users</th></tr>
  ${roles.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td class="tnum">${r[2]}</td></tr>`).join('')}</table></div>
  <div class="panel"><h3>Sessions</h3><table class="tbl"><tr><th>User</th><th>Login</th><th>Role</th><th>Status</th></tr>
  ${us.map(u=>`<tr><td>${u[0]}</td><td class="mono">${u[1]}</td><td>${u[2]}</td><td><span class="sev ${u[3]==='Online'?'INFO':'WARNING'}">${u[3].toUpperCase()}</span></td></tr>`).join('')}</table>
  <div style="font-size:11px;color:var(--text3);margin-top:8px">JWT auth · refresh rotation · every mutation writes to audit_logs. Demo build: auth simulated.</div></div>
 </div></div>`},
/* ============ 21. SETTINGS ============ */
settings(){return `<div class="page"><div class="pagehead"><h1>System settings</h1><span class="sub">Configuration lives in environment variables (production) — demo values shown</span></div>
 <div class="grid" style="grid-template-columns:1fr 1fr">
  <div class="panel"><h3>Connection</h3>
   <div class="field"><label>MQTT broker URI</label><input type="text" value="mqtts://broker.plant01.local:8883" style="width:100%"></div>
   <div class="field"><label>Database DSN</label><input type="text" value="postgresql://scada:***@timescale:5432/plant01" style="width:100%"></div>
   <div class="field"><label>WebSocket URL</label><input type="text" value="wss://api.plant01.local/ws/telemetry" style="width:100%"></div>
   <div class="field"><label>n8n webhook base</label><input type="text" value="https://n8n.plant01.local/webhook/" style="width:100%"></div>
   <button class="btn primary" onclick="flash('Settings saved (demo only — no backend connected)')">Save</button></div>
  <div class="panel"><h3>Platform</h3>
   <div class="rowline"><span>Version</span><b>0.1.0-phase1</b></div>
   <div class="rowline"><span>Mode</span><b><span class="demo-badge">DEMO / SIMULATION</span></b></div>
   <div class="rowline"><span>Data retention (raw)</span><b>30 days</b></div>
   <div class="rowline"><span>Downsampled (1m)</span><b>13 months</b></div>
   <div class="rowline"><span>Simulated machines</span><b class="tnum">${MACHINES.length}</b></div>
   <div class="rowline"><span>Simulated sensors</span><b class="tnum">${SENSORS.length}</b></div>
   <h3 style="margin-top:16px">Roadmap status</h3>
   <div class="rowline"><span>Phase 1 — architecture + UI foundation</span><b style="color:var(--green)">This build (frontend)</b></div>
   <div class="rowline"><span>Phase 2–5 — nav, MQTT, WS, historian</span><b style="color:var(--yellow)">Pending backend</b></div>
   <div class="rowline"><span>Phase 6–14</span><b style="color:var(--text3)">Planned</b></div></div>
 </div></div>`},
};

/* ---------------- router ---------------- */
function renderView(){
  const main=$('#view');if(!main)return;
  const fn=VIEWS[currentView];if(!fn)return;
  main.innerHTML=`<div class="page">${fn()}</div>`;
  $$('.navitem[data-v]').forEach(b=>b.classList.toggle('on',b.dataset.v===currentView));
  /* per-view charts */
  requestAnimationFrame(()=>{
    const m1=$('#prodChart');if(m1)barChart(m1,[...Array(8)].map((_,i)=>String(i+9)+':00'),[1120,1350,1290,1480,1395,1520,1460,1510],{color:'#4aa8ff'});
    const e1=$('#energyChart');if(e1){const d=hist.energy.slice(-300);lineChart(e1,[{c:'#f5b942',data:d}],{})}
    const q1=$('#qChart');if(q1)barChart(q1,['Dimensional','Surface','Material','Assembly','Other'],[42,26,14,10,8],{colors:['#ef5350','#f5b942','#4aa8ff','#9b7bff','#6b7683']});
    const a1=$('#an1');if(a1)barChart(a1,MACHINES.map(m=>m.id),MACHINES.map(m=>Math.round(m.down/60)),{colors:MACHINES.map(m=>STATE[m.st].hex)});
    const a2=$('#an2');if(a2)barChart(a2,MACHINES.map(m=>m.id),MACHINES.map(m=>m.prod),{color:'#2ecc71'});
    const a3=$('#an3');if(a3){const st=Object.keys(STATE).map(k=>MACHINES.filter(m=>m.st===k).length);barChart(a3,Object.keys(STATE),st,{colors:Object.values(STATE).map(s=>s.hex)})}
    if(currentView==='overview'||currentView==='process'||currentView==='trends')drawMainChart();
    if(currentView==='scada'||currentView==='plant')updateScadaStates();
    $$('.mcard').forEach(c=>c.onclick=()=>selectMachine(+c.dataset.i));
  });
  const el=$('#mqfeed');if(el)el.innerHTML=MQ.map(l=>`<div><span class="t">${ts(l.t)}</span> <span class="topic">${l.topic}</span> ${esc(l.p)}</div>`).join('');
  const al=$('#almList');if(al)al.innerHTML=alarmListHTML(7);
}
function route(){
  const h=(location.hash||'#/overview').slice(2);
  currentView=VIEWS[h]?h:'overview';
  document.title=TITLES[currentView]+' · Industrial Command Center';
  renderView();
}
window.addEventListener('hashchange',route);
window.addEventListener('resize',()=>{if(!chartPaused)drawMainChart()});
