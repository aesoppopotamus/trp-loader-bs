// Skynet System Diagnostics (aligned grid layout)
// Vanilla JS + SVG + tiny canvas noise overlay
(function () {
  // ===== Config =====
  const CFG   = window.DIAG || {};
  const theme = CFG.theme || {};
  const R     = CFG.readouts || {};

  const C_PRIMARY = theme.primary || "#37ddfa";
  const C_ACCENT  = theme.accent  || "#ff3b3b";
  const C_TEXT    = theme.text    || "#cfe7ff";
  const C_GRID    = theme.grid    || "rgba(255,255,255,0.045)";

  const SWEEP_VERT_SECONDS = CFG.sweepV ?? 6;
  const SWEEP_HORZ_SECONDS = CFG.sweepH ?? 9;

  const NODE_COUNT   = Math.max(10, Math.min(30, CFG.nodeCount ?? 18));
  const NEIGHBORS    = Math.max(1,  Math.min(5,  CFG.neighbors  ?? 3));
  const PACKETS_PER  = Math.max(0,  Math.min(4,  CFG.packetsPer ?? 2));
  const PACKET_SPEED = CFG.packetSpeed ?? 70;

  const NOISE_ENABLE = CFG.noise !== false;
  const NOISE_FPS    = CFG.noiseFps ?? 24;
  const NOISE_ALPHA  = CFG.noiseAlpha ?? 0.06;

  const CPU_RANGE = R.cpuTemp || { min:41, max:55, unit:"°C" };
  const PWR_RANGE = R.power   || { min:74, max:89, unit:"%"  };
  const ACTUATORS = R.actuators || { ok: 28, total: 32 };

  // ===== Mount =====
  const root = document.getElementById("diag-root");
  if (!root) return;
  root.innerHTML = "";

  const wrap = div("diag-wrap");
  root.appendChild(wrap);

  // ===== SVG root =====
  const W = 1200, H = 560;
  const svg = svgEl("svg", { viewBox:`0 0 ${W} ${H}`, class:"diag-svg", preserveAspectRatio:"xMidYMid meet" });
  wrap.appendChild(svg);

  // ===== defs =====
  const defs = svgEl("defs");
  defs.append(
    glow("glow", 2.2),
    glow("hardglow", 3.6),
    gradY("sweepY", [[0, C_PRIMARY, 0], [0.5, C_PRIMARY, .55], [1, C_PRIMARY, 0]]),
    gradX("sweepX", [[0, C_PRIMARY, 0], [0.5, C_PRIMARY, .5], [1, C_PRIMARY, 0]])
  );
  svg.append(defs);

  // ===== Backdrop + grid =====
  rect(svg, 0,0,W,H, { fill:"rgba(0,0,0,0.58)" });
  grid(svg, W, H, 20, C_GRID);

  // ===== Layout anchors =====
  const PAD = 48;
  const LEFT_X = PAD;
  const LEFT_W = 540;
  const RIGHT_X = LEFT_X + LEFT_W + 56;
  const TOP_Y  = 38;

  // Right column grid
  const COL_LABEL_X = RIGHT_X;        // "MODEL:", "CPU CORE:", etc
  const COL_VALUE_X = RIGHT_X + 170;  // value text
  const COL_VIS_X   = RIGHT_X + 360;  // bars/scope start
  const BASE_Y      = TOP_Y + 46;     // first baseline
  const ROW         = 28;             // row height

  const rowY = (n) => BASE_Y + n*ROW;

  // Divider between left/right panes
  line(svg, LEFT_X+LEFT_W, TOP_Y-16, LEFT_X+LEFT_W, H-PAD, {
    stroke:C_PRIMARY, "stroke-opacity":0.55, "stroke-width":2.4,
    filter:"url(#glow)", "vector-effect":"non-scaling-stroke"
  });

  // ===== Header =====
  text(svg, COL_LABEL_X, TOP_Y+6, "SYSTEM DIAGNOSTICS", {
    fill:C_PRIMARY, "font-family":"'TerminatorReal','Orbitron','Audiowide',sans-serif",
    "font-size":22, "letter-spacing":2, filter:"url(#glow)"
  });

  // ===== Readouts (label → value → visual) =====
  function row(label, id, n) {
    const y = rowY(n);
    text(svg, COL_LABEL_X, y, label + ":", {
      fill:C_TEXT, "font-family":"'Courier New', monospace", "font-size":18
    });
    text(svg, COL_VALUE_X, y, "—", {
      id, fill:"#fff", "font-family":"'Courier New', monospace", "font-size":18
    });
    return y;
  }

  row("MODEL",     "ro_model",     0);
  row("REGION",    "ro_region",    1);
  // spacer row 2
  const yCPU = row("CPU CORE",  "ro_cpu_core", 3);
  const yPWR = row("PWR BUS",   "ro_pwr_bus",  4);
  row("ACTUATORS", "ro_actuators", 5);
  row("TARGETING", "ro_targeting", 6);
  row("NETLINK",   "ro_netlink",   7);

  // ===== right-column visuals sized to the panel =====
  const gauges = new Map();

  // how far from the panel's right border we stop drawing
  const R_MARGIN    = 18;                        // bump to 22–24 if you see glow kissing the border
  const RIGHT_SAFE  = Math.floor(W - PAD - R_MARGIN);

  // ---- Bars (CPU/PWR) ---------------------------------------------------------
  const GAUGE_W = Math.max(140, RIGHT_SAFE - COL_VIS_X);
  gauge(svg, COL_VIS_X, yCPU - 9, GAUGE_W, 12, "CPU", C_PRIMARY, gauges);
  gauge(svg, COL_VIS_X, yPWR - 9, GAUGE_W, 12, "PWR", C_ACCENT,  gauges);

  // ---- Charts UNDER the text rows ---------------------------------------------
  const VIS_W        = Math.max(140, RIGHT_SAFE - COL_VALUE_X);
  const VIS_H        = 18;
  const VIS_Y_OFFSET = 8;                        // you already liked 8; tweak if needed

  // TARGETING sparkline (under the text)
  const tgtY = rowY(8) + VIS_Y_OFFSET;
  const tgtSpark = sparkline(svg, COL_VALUE_X, tgtY, VIS_W, VIS_H, C_PRIMARY, 0.9);

  // NETLINK oscilloscope (under the text), clipped to its own band
  const netY = rowY(7) + VIS_Y_OFFSET;
  const clip = svgEl("clipPath", { id: "clip_net" });
  clip.append(rectEl(COL_VALUE_X, netY, VIS_W, VIS_H));
  defs.append(clip);

  const netScope = oscilloscope(
    svg,
    COL_VALUE_X, netY,
    VIS_W, VIS_H,
    C_PRIMARY,
    "clip_net"
  );

  // Seed readouts
  setT("ro_model",   R.model    || "T-800 / Series 101");
  setT("ro_region",  R.location || "UNKNOWN");
  setT("ro_targeting","SEARCHING");
  tickReadouts(); setInterval(tickReadouts, 900);

  // ===== Left pane: network scan =====
  const netBox = { x: LEFT_X+12, y: TOP_Y+6, w: LEFT_W-24, h: H-(TOP_Y+PAD)-6 };
  const netG   = svgEl("g"); svg.append(netG);

  rect(netG, netBox.x, netBox.y, netBox.w, netBox.h, {
    fill:"none", stroke:C_PRIMARY, "stroke-opacity":0.25, "stroke-width":1.5,
    "vector-effect":"non-scaling-stroke", filter:"url(#glow)"
  });

  // nodes
  const nodes = [];
  for (let i=0;i<NODE_COUNT;i++){
    const x = netBox.x + 20 + Math.random()*(netBox.w-40);
    const y = netBox.y + 20 + Math.random()*(netBox.h-40);
    nodes.push({x,y});
  }

  // edges
  const edges = [];
  for (let i=0;i<nodes.length;i++){
    const dists = nodes.map((n,j)=>({j,d:dist(nodes[i],n)})).filter(v=>v.j!==i).sort((a,b)=>a.d-b.d).slice(0,NEIGHBORS);
    dists.forEach(({j})=>{
      const key = i<j ? i+"-"+j : j+"-"+i;
      if (!edges.some(e=>e.key===key)){
        const l = line(netG, nodes[i].x,nodes[i].y,nodes[j].x,nodes[j].y, {
          stroke:C_PRIMARY, "stroke-opacity":0.18, "stroke-width":1.6,
          "vector-effect":"non-scaling-stroke", filter:"url(#glow)"
        });
        edges.push({key, a:i, b:j, line:l});
      }
    });
  }

  // packets
  const packets = [];
  edges.forEach(e=>{
    for(let k=0;k<PACKETS_PER;k++){
      const p = svgEl("circle",{ r:3, fill:"#fff", "fill-opacity":0.0 });
      netG.append(p);
      packets.push({ e, t: Math.random(), dir: Math.random()<0.5?1:-1, node:p });
    }
  });

  // node visuals
  nodes.forEach(n=>{
    n.dot  = svgEl("circle",{cx:n.x,cy:n.y,r:3.2,fill:"#fff","fill-opacity":0.18});
    n.ring = svgEl("circle",{cx:n.x,cy:n.y,r:6.5,fill:"none",stroke:C_PRIMARY,"stroke-width":2,"stroke-opacity":0.0,filter:"url(#glow)"});
    netG.append(n.ring); netG.append(n.dot);
  });

  // sweeps
  const vSweep = svgEl("rect", { x: netBox.x, y: netBox.y, width: netBox.w, height: 16, fill:"url(#sweepY)", opacity:0.95, filter:"url(#glow)" });
  const hSweep = svgEl("rect", { x: netBox.x, y: netBox.y, width: 16, height: netBox.h, fill:"url(#sweepX)", opacity:0.85, filter:"url(#glow)" });
  svg.append(vSweep, hSweep);

  // lock indicator
  const lockG = svgEl("g", { opacity:0, filter:"url(#hardglow)" });
  const b = 14;
  lockG.append(
    svgEl("path",{d:`M -${b} -${b} h ${b} v 2 h -${b} z`, fill:C_ACCENT}),
    svgEl("path",{d:`M ${b} -${b} h -${b} v 2 h ${b} z`, fill:C_ACCENT}),
    svgEl("path",{d:`M -${b} ${b} h ${b} v -2 h -${b} z`, fill:C_ACCENT}),
    svgEl("path",{d:`M ${b} ${b} h -${b} v -2 h ${b} z`, fill:C_ACCENT})
  );
  svg.append(lockG);

  // ===== Noise overlay =====
  let noiseCanvas, nctx, lastNoise=0;
  if (NOISE_ENABLE){
    noiseCanvas = document.createElement("canvas");
    noiseCanvas.className = "diag-noise";
    wrap.appendChild(noiseCanvas);
    nctx = noiseCanvas.getContext("2d",{alpha:true});
    resizeNoise();
    window.addEventListener("resize", resizeNoise);
  }

  // ===== Animation =====
  let t0 = performance.now(), last = t0, lockAlpha=0, lockedNode=null;

  function loop(now){
    const dt = (now - last)/1000; last = now;

    // sweeps
    const pv = ((now - t0)/1000) % SWEEP_VERT_SECONDS;
    const ph = ((now - t0)/1000) % SWEEP_HORZ_SECONDS;
    const y  = netBox.y + (pv / SWEEP_VERT_SECONDS) * (netBox.h - vSweep.height.baseVal.value);
    const x  = netBox.x + (ph / SWEEP_HORZ_SECONDS) * (netBox.w - hSweep.width.baseVal.value);
    vSweep.setAttribute("y", y.toFixed(1));
    hSweep.setAttribute("x", x.toFixed(1));

    // packets
    packets.forEach(p=>{
      const a = nodes[p.e.a], b = nodes[p.e.b];
      const L = dist(a,b);
      const step = (PACKET_SPEED / Math.max(1,L)) * dt * p.dir;
      p.t += step;
      if (p.t > 1) p.t -= 1;
      if (p.t < 0) p.t += 1;
      const px = a.x + (b.x - a.x) * p.t;
      const py = a.y + (b.y - a.y) * p.t;
      p.node.setAttribute("cx", px.toFixed(1));
      p.node.setAttribute("cy", py.toFixed(1));
      const nearV = Math.abs(py - y) < 12;
      const nearH = Math.abs(px - x) < 12;
      p.node.setAttribute("fill-opacity", (nearV||nearH) ? 0.9 : 0.08);
      p.node.setAttribute("fill", (nearV&&nearH) ? C_ACCENT : "#fff");
    });

    // node pulses & lock
    lockedNode = null;
    nodes.forEach(n=>{
      const nearV = Math.abs(n.y - y) < 10;
      const nearH = Math.abs(n.x - x) < 10;

      if (nearV || nearH){
        n.ring.setAttribute("stroke-opacity", "0.95");
        n.dot.setAttribute("fill-opacity", (nearV&&nearH)? "0.95" : "0.35");
        n.dot.setAttribute("fill", (nearV&&nearH)? C_ACCENT : "#fff");
      } else {
        const cur = +n.ring.getAttribute("stroke-opacity") || 0;
        const next = Math.max(0, cur - dt*1.4);
        n.ring.setAttribute("stroke-opacity", next.toFixed(2));
        n.dot.setAttribute("fill-opacity", "0.18");
        n.dot.setAttribute("fill", "#fff");
      }
      if (nearV && nearH && !lockedNode) lockedNode = n;
    });

    if (lockedNode){
      lockAlpha = Math.min(1, lockAlpha + dt*3);
      lockG.setAttribute("opacity", lockAlpha.toFixed(2));
      lockG.setAttribute("transform", `translate(${lockedNode.x},${lockedNode.y}) scale(${1+Math.sin(now/120)/40})`);
      setT("ro_targeting","LOCKED");
    } else {
      lockAlpha = Math.max(0, lockAlpha - dt*2);
      lockG.setAttribute("opacity", lockAlpha.toFixed(2));
      setT("ro_targeting","SEARCHING");
    }

    // charts
    tgtSpark.push(Math.random()*0.6 + 0.2);
    netScope.advance(dt);

    // noise
    if (NOISE_ENABLE && now - lastNoise > (1000/NOISE_FPS)){
      drawNoise();
      lastNoise = now;
    }

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // ===== Readout ticking =====
  function tickReadouts(){
    const cpu = rand(CPU_RANGE.min, CPU_RANGE.max);
    const pwr = rand(PWR_RANGE.min, PWR_RANGE.max);
    const wiggle = Math.max(0, ACTUATORS.ok + (Math.random()<0.18 ? (Math.random()<0.5?-1:1) : 0));

    setT("ro_cpu_core", cpu.toFixed(1) + (CPU_RANGE.unit||"°C"));
    setT("ro_pwr_bus",  Math.round(pwr) + (PWR_RANGE.unit||"%"));
    setT("ro_actuators", `${wiggle}/${ACTUATORS.total} OK`);
    setT("ro_model",   R.model    || "T-800 / Series 101");
    setT("ro_region",  R.location || "UNKNOWN");

    const cpuPct = (cpu - CPU_RANGE.min) / (CPU_RANGE.max - CPU_RANGE.min);
    const pwrPct = (pwr - PWR_RANGE.min) / (PWR_RANGE.max - PWR_RANGE.min);
    gaugeSet(gauges, "CPU", clamp(cpuPct,0,1));
    gaugeSet(gauges, "PWR", clamp(pwrPct,0,1));

    if (Array.isArray(R.netlink)){
      setT("ro_netlink", R.netlink[(Math.random()*R.netlink.length)|0]);
    } else setT("ro_netlink","UPLINK: READY");
  }

  // ===== Primitives & widgets =====
  function div(cls){ const d=document.createElement("div"); if (cls) d.className=cls; return d; }
  function svgEl(tag, attrs){ const n=document.createElementNS("http://www.w3.org/2000/svg", tag); if (attrs) for(const k in attrs) n.setAttribute(k, attrs[k]); return n; }
  function rect(p,x,y,w,h,attrs){ const r=rectEl(x,y,w,h); for(const k in attrs) r.setAttribute(k, attrs[k]); p.append(r); return r; }
  function rectEl(x,y,w,h){ return svgEl("rect",{x,y,width:w,height:h}); }
  function line(p,x1,y1,x2,y2,attrs){ const l=svgEl("line",{x1,y1,x2,y2,...attrs}); p.append(l); return l; }
  function text(p,x,y,str,attrs){ const t=svgEl("text",{x,y,...attrs}); t.textContent=str; p.append(t); return t; }
  function grid(p,w,h,step,color){
    for(let x=0;x<=w;x+=step) line(p,x,0,x,h,{stroke:color,"stroke-width":1});
    for(let y=0;y<=h;y+=step) line(p,0,y,w,y,{stroke:color,"stroke-width":1});
  }
  function glow(id, sd){
    const f = svgEl("filter", { id, x:"-40%", y:"-40%", width:"180%", height:"180%" });
    f.append(svgEl("feGaussianBlur", { stdDeviation:String(sd), result:"b" }));
    const m = svgEl("feMerge");
    m.append(svgEl("feMergeNode",{in:"b"}));
    m.append(svgEl("feMergeNode",{in:"SourceGraphic"}));
    f.append(m); return f;
  }
  function gradY(id, stops){
    const g = svgEl("linearGradient",{id, x1:"0",y1:"0",x2:"0",y2:"1"});
    stops.forEach(([off,col,op])=>g.append(svgEl("stop",{offset:(off*100)+"%","stop-color":col,"stop-opacity":op})));
    return g;
  }
  function gradX(id, stops){
    const g = svgEl("linearGradient",{id, x1:"0",y1:"0",x2:"1",y2:"0"});
    stops.forEach(([off,col,op])=>g.append(svgEl("stop",{offset:(off*100)+"%","stop-color":col,"stop-opacity":op})));
    return g;
  }
  function dist(a,b){ const dx=a.x-b.x, dy=a.y-b.y; return Math.hypot(dx,dy); }
  function setT(id, val){ const t = svg.getElementById ? svg.getElementById(id) : svg.querySelector("#"+id); if (t) t.textContent = val; }
  function clamp(x,a,b){ return Math.max(a,Math.min(b,x)); }
  function rand(a,b){ return a + Math.random()*(b-a); }

  function gauge(p, x, y, w, h, label, color, map){
    // ticks
    for(let i=0;i<=10;i++){
      const tx = x + i*(w/10);
      line(p, tx, y+h, tx, y+h+4, { stroke:"rgba(255,255,255,0.35)", "stroke-width":1 });
    }
    const fill = rect(p, x, y, 1, h, { fill:color, filter:"url(#glow)" });
    map.set(label, { x,y,w,h, fill });
  }
  function gaugeSet(map, label, pct){
    const g = map.get(label); if (!g) return;
    g.fill.setAttribute("width", Math.max(1, g.w * pct).toFixed(1));
  }

  function sparkline(p, x,y,w,h,color, alpha=1){
    rect(p, x,y,w,h, { fill:`rgba(255,255,255,${0.06*alpha})`, stroke:"rgba(255,255,255,0.2)", "stroke-width":1 });
    const path = svgEl("path", { fill:"none", stroke:color, "stroke-width":1.5, filter:"url(#glow)" });
    p.append(path);
    const N = 80; const vals = Array.from({length:N}, ()=>0.5);
    function draw(){
      let d="";
      for(let i=0;i<N;i++){
        const px = x + (i/(N-1))*w;
        const py = y + (1-vals[i])*h;
        d += (i===0?`M ${px} ${py}`:` L ${px} ${py}`);
      }
      path.setAttribute("d", d);
    }
    draw();
    return {
      push(v){ vals.push(clamp(v,0,1)); vals.shift(); draw(); }
    };
  }

  function oscilloscope(p, x,y,w,h,color, clipId){
    const g = svgEl("g", clipId ? { "clip-path":`url(#${clipId})` } : {});
    p.append(g);
    rect(g, x,y,w,h, { fill:"rgba(255,255,255,0.06)", stroke:"rgba(255,255,255,0.2)", "stroke-width":1 });
    const path = svgEl("path", { fill:"none", stroke:color, "stroke-width":1.6, filter:"url(#glow)" });
    g.append(path);
    let t=0, phase=Math.random()*Math.PI*2;
    function draw(){
      const N=120; let d="";
      for(let i=0;i<N;i++){
        const px = x + (i/(N-1))*w;
        const s = Math.sin((i*0.18)+phase)*0.35 + (Math.random()-0.5)*0.15;
        const py = y + (0.5 - s*0.45)*h;
        d += (i===0?`M ${px} ${py}`:` L ${px} ${py}`);
      }
      path.setAttribute("d", d);
    }
    draw();
    return {
      advance(dt){ t+=dt; if(t>0.06){ t=0; phase+=0.22; draw(); } }
    };
  }

  // ===== Noise =====
  function resizeNoise(){
    if (!noiseCanvas) return;
    const r = wrap.getBoundingClientRect();
    noiseCanvas.width  = Math.max(1, Math.floor(r.width));
    noiseCanvas.height = Math.max(1, Math.floor(r.height));
    noiseCanvas.style.position = "absolute";
    noiseCanvas.style.inset = "0";
    noiseCanvas.style.pointerEvents = "none";
  }
  function drawNoise(){
    if (!nctx) return;
    const { width, height } = noiseCanvas;
    const id = nctx.createImageData(width, height);
    const data = id.data, A = (NOISE_ALPHA*255)|0;
    for (let i=0;i<data.length;i+=4){
      const v = (Math.random()*255)|0;
      data[i]=data[i+1]=data[i+2]=v; data[i+3]=A;
    }
    nctx.putImageData(id, 0, 0);
  }
})();
