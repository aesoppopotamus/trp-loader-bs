// Skynet System Diagnostics – layout with gauges UNDER values
(function () {
  const CFG   = window.DIAG || {};
  const theme = CFG.theme || {};
  const R     = CFG.readouts || {};
  const MAP   = CFG.map || {};

  const C_PRIMARY = theme.primary || "#37ddfa";
  const C_ACCENT  = theme.accent  || "#ff3b3b";
  const C_TEXT    = theme.text    || "#cfe7ff";
  const C_GRID    = theme.grid    || "rgba(255,255,255,0.045)";

  // ----- mount ---------------------------------------------------------------
  const root = document.getElementById("diag-root");
  if (!root) return;
  root.innerHTML = "";

  const wrap = div("diag-wrap");
  root.appendChild(wrap);

  const W = 1200, H = 560;
  const svg = svgEl("svg", {
    viewBox:`0 0 ${W} ${H}`,
    class:"diag-svg",
    preserveAspectRatio:"xMidYMid meet"
  });
  wrap.appendChild(svg);

  // defs
  const defs = svgEl("defs");
  defs.append(glow("glow", 2.2), glow("hardglow", 3.4));
  svg.append(defs);

  // backdrop + grid
  rect(svg, 0,0,W,H, { fill:"rgba(0,0,0,0.58)" });
  grid(svg, W, H, 20, C_GRID);

  // ----- layout anchors ------------------------------------------------------
  const PAD     = 48;
  const LEFT_X  = PAD;
  const LEFT_W  = 720;                 // big map pane
  const RIGHT_X = LEFT_X + LEFT_W + 26;
  const TOP_Y   = 38;

  // right-panel columns
  const RIGHT_SAFE_R   = W - PAD - 18; // right “safe” edge
  const COL_GAP        = 14;
  const LABEL_COL_W    = 125;
  const VALUE_COL_W    = 210;

  const COL_LABEL_X = RIGHT_X;
  const COL_VALUE_X = COL_LABEL_X + LABEL_COL_W + COL_GAP; // values start here

  // row spacing (we’ll put gauges under the value, so give them room)
  const BASE_Y = TOP_Y + 46;
  const ROW    = 32;                   // taller rows = breathing room
  const rowY   = (n)=> BASE_Y + n*ROW;

  // header
  text(svg, COL_LABEL_X, TOP_Y + 6, "SYSTEM DIAGNOSTICS", {
    fill:C_PRIMARY,
    "font-family":"'TerminatorReal','Orbitron','Audiowide',sans-serif",
    "font-size":22, "letter-spacing":2, filter:"url(#glow)"
  });

  // ----- readout rows (label → value) ---------------------------------------
  function makeRow(label, id, n){
    const y = rowY(n);
    text(svg, COL_LABEL_X, y, label + ":", {
      fill:C_TEXT, "font-family":"'Courier New',monospace", "font-size":18
    });
    const v = text(svg, COL_VALUE_X, y, "—", {
      id, fill:"#fff", "font-family":"'Courier New',monospace", "font-size":18
    });
    return { y, valueNode: v };
  }

  // top: quorum/cohesion/uplink/survivability
  makeRow("QUORUM",       "ro_quorum", 0);
  makeRow("COHESION",     "ro_cohesion", 1);
  makeRow("UPLINK",       "ro_uplink", 2);
  const rowSurv = makeRow("SURVIVABILITY", "ro_survivability", 3);
  // intel rows (free text)
  makeRow("STATUS",   "ro_war", 4);
  makeRow("INTEL FEED",   "ro_intel", 5);
  // CPU & PWR (gauges go UNDER these)
  const rowCPU = makeRow("CORE TEMP", "ro_cpu_core", 6);
  const rowPWR = makeRow("PWR BUS",  "ro_pwr_bus",  7);
  // netlink scope
  const rowNET = makeRow("NETLINK",  "ro_netlink",  8);

  // ----- widgets -------------------------------------------------------------
  // gauges map
  const gauges = new Map();

  // bar under helper: fills from value column to the safe right edge
  const GAUGE_H         = 12;
  const GAUGE_BELOW_GAP = 9;  // distance from value baseline → bar center

  function gaugeUnder(row, key, color){
    const x = COL_VALUE_X;
    const w = Math.max(120, RIGHT_SAFE_R - x);
    const y = row.y + GAUGE_BELOW_GAP - GAUGE_H/2;
    gauge(svg, x, y, w, GAUGE_H, key, color, gauges);
  }
  gaugeUnder(rowCPU, "CPU", C_PRIMARY);
  gaugeUnder(rowPWR, "PWR", C_ACCENT);

  // NETLINK oscilloscope band (under the value text)
  const NET_H = 24, NET_GAP = 8;
  const netX  = COL_VALUE_X;
  const netY  = rowNET.y + NET_GAP;
  const netW  = Math.max(200, RIGHT_SAFE_R - netX);
  const clip  = svgEl("clipPath", { id:"clip_net" });
  clip.append(rectEl(netX, netY, netW, NET_H));
  defs.append(clip);
  const netScope = oscilloscope(svg, netX, netY, netW, NET_H, C_PRIMARY, "clip_net");

  // divider between columns (for style)
  line(svg, LEFT_X+LEFT_W, TOP_Y-16, LEFT_X+LEFT_W, H-PAD, {
    stroke:C_PRIMARY, "stroke-opacity":0.55, "stroke-width":2.2,
    "vector-effect":"non-scaling-stroke", filter:"url(#glow)"
  });

  // ----- left: map + subtle route lines (kept minimal here) ------------------
  const mapBox = { x: LEFT_X+12, y: TOP_Y+6, w: LEFT_W-24, h: H-(TOP_Y+PAD)-6 };
  const clipMap = svgEl("clipPath", { id:"clipMap" });
  clipMap.append(rectEl(mapBox.x, mapBox.y, mapBox.w, mapBox.h));
  defs.append(clipMap);

  // map image
  const img = svgEl("image", {
    href: MAP.src || "img/washingtonmap2.png",
    x: mapBox.x, y: mapBox.y, width: mapBox.w, height: mapBox.h,
    preserveAspectRatio: "xMidYMid slice",
    opacity: (MAP.opacity ?? 1)
  });
  const mapG = svgEl("g", { "clip-path":"url(#clipMap)" });
  mapG.append(img);
  svg.append(mapG);

  // frame
  rect(svg, mapBox.x, mapBox.y, mapBox.w, mapBox.h, {
    fill:"none", stroke:C_PRIMARY, "stroke-opacity":0.25, "stroke-width":1.5,
    "vector-effect":"non-scaling-stroke", filter:"url(#glow)"
  });

function tick() {
  const core = (window.DIAG && window.DIAG.core) || {};
  setFit("ro_quorum",        core.quorum?.label ?? (Math.round(rand(82,93)) + "% — STABLE"));
  setFit("ro_cohesion",      core.cohesion?.label ?? (Math.random() < 0.5 ? "IN-SYNC" : "PARTIAL"));
  setFit("ro_uplink",        core.uplink?.label ?? "READY  links:3  loss:0.0");
  setFit("ro_survivability", core.survivability?.label ?? "REDLINE");

  // --- rotating domain lines (INLINE SANITIZER) ---
//  const FALLBACK = {
//    CORE: [
//      "Process Integrity: NOMINAL",
//      "Memory Checksum: STABLE",
//      "Hive Sync: 99.99%",
//      "Uptime: 418h",
//    ],
//    ASSETS: [
//      "HK Squadrons Active: 147",
//      "Drones Operational: 92%",
//      "Production Lines Online: 4 (NW-01/03, SE-02/07)",
//      "Attrition (24h): 2.1%",
//    ],
//    BATTLESPACE: [
//      "Sector 7 resistance: ELEVATED",
//      "Territorial Cohesion: 63%",
//      "Civilian Neutralization Index: 0.47",
//      "SIGINT/Jamming: INTERMITTENT",
//    ],
//    NETWORK: [
//      "Uplink: READY  links:3  loss:0.0",
//      "Tactical Nodes Linked: 312",
//      "Backhaul Utilization: 41%",
//      "Median Propagation: 23 ms",
//    ],
//  };

  const user = (window.DIAG && window.DIAG.domains) || {};
  function list(key) {
    const raw = Array.isArray(user[key]) ? user[key] : [];
    const cleaned = raw.map(v => (v == null ? "" : String(v)).trim()).filter(Boolean);
    return cleaned.length ? cleaned : FALLBACK[key];
  }

  const ORDER = ["CORE", "ASSETS", "BATTLESPACE", "NETWORK"];
  const L = { CORE: list("CORE"), ASSETS: list("ASSETS"), BATTLESPACE: list("BATTLESPACE"), NETWORK: list("NETWORK") };

  const t = Date.now();
  const slot = Math.floor(t / 6000) % 4; // change every ~6s
  function pick(arr, salt) { return arr[(salt % arr.length + arr.length) % arr.length]; }

  const kA = ORDER[slot];
  const kB = ORDER[(slot + 1) % 4];

  setFit("ro_war",   `${kA}: ${pick(L[kA],  t >> 10)}`);
  setFit("ro_intel", `${kB}: ${pick(L[kB], t >> 11)}`);

  // --- GAUGES (use DIAG.readouts; NaN-proof) ---
  const RD  = (window.DIAG && window.DIAG.readouts) || {};
  const CPU = RD.cpuTemp || { min: 41, max: 55, unit: "°C" };
  const PWR = RD.power   || { min: 72, max: 90, unit: "%"  };

  const cpuVal = rand(CPU.min, CPU.max);
  const pwrVal = rand(PWR.min, PWR.max);

  setFit("ro_cpu_core", (isFinite(cpuVal) ? cpuVal.toFixed(1) : "--") + (CPU.unit || "°C"));
  setFit("ro_pwr_bus",  (isFinite(pwrVal) ? Math.round(pwrVal) : "--") + (PWR.unit || "%"));

  function safeGauge(v, lo, hi) {
    const L = Number(lo), H = Number(hi), V = Number(v);
    if (!isFinite(L) || !isFinite(H) || L === H || !isFinite(V)) return 0;
    const t = (V - L) / (H - L);
    return Math.max(0, Math.min(1, t));
  }
  gaugeSet(gauges, "CPU", safeGauge(cpuVal, CPU.min, CPU.max));
  gaugeSet(gauges, "PWR", safeGauge(pwrVal, PWR.min, PWR.max));

  // --- Netlink label (string-only) ---
  const net = Array.isArray(RD.netlink)
    ? RD.netlink[(Math.random() * RD.netlink.length) | 0]
    : (core.netlink || "UPLINK: READY");
  setFit("ro_netlink", String(net));
}
  tick();
  setInterval(tick, 1500);

  // animate the net scope
  let last = performance.now();
  function loop(now){
    const dt = (now - last)/1000; last = now;
    netScope.advance(dt);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // ----- utils ---------------------------------------------------------------
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
    m.append(svgEl("feMergeNode",{in:"b"}), svgEl("feMergeNode",{in:"SourceGraphic"}));
    f.append(m); return f;
  }
  function clamp(x,a,b){ return Math.max(a,Math.min(b,x)); }
  function rand(a,b){ return a + Math.random()*(b-a); }

// SVG-safe ellipsis in the value column
function fitText(node, full, maxWidth) {
  if (!node) return;
  const txt = full == null ? "" : String(full);
  node.textContent = txt;
  if (!txt) return;
  if (node.getComputedTextLength() <= maxWidth) return;
  let lo = 1, hi = txt.length, best = 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    node.textContent = txt.slice(0, mid) + "…";
    if (node.getComputedTextLength() <= maxWidth) { best = mid; lo = mid + 1; }
    else hi = mid - 1;
  }
  node.textContent = txt.slice(0, best) + "…";
}
function setFit(id, value) {
  const n = svg.getElementById ? svg.getElementById(id) : svg.querySelector("#" + id);
  const max = RIGHT_SAFE_R - COL_VALUE_X; // uses your existing layout constants
  fitText(n, value, max);
}

  // draw a labeled bar and register in a map
  function gauge(p, x, y, w, h, label, color, map){
    // ticks (ten)
    const g = svgEl("g"); p.append(g);
    for(let i=0;i<=10;i++){
      const tx = x + i*(w/10);
      line(g, tx, y+h, tx, y+h+4, { stroke:"rgba(255,255,255,0.35)", "stroke-width":1 });
    }
    rect(g, x, y, w, h, { fill:"rgba(255,255,255,0.06)" });
    const fill = rect(g, x, y, 1, h, { fill:color, filter:"url(#glow)" });
    map.set(label, { x,y,w,h, fill, group:g });
  }
  function gaugeSet(map, label, pct){
    const g = map.get(label); if (!g) return;
    g.fill.setAttribute("width", Math.max(1, g.w * pct).toFixed(1));
  }

// NaN-proof gauge calc
function safeGauge(val, min, max) {
  const lo = Number(min), hi = Number(max), v = Number(val);
  if (!isFinite(lo) || !isFinite(hi) || lo === hi || !isFinite(v)) return 0;
  const t = (v - lo) / (hi - lo);
  return Math.max(0, Math.min(1, t));
}

  // simple oscilloscope
  function oscilloscope(p, x,y,w,h,color,clipId){
    const g = svgEl("g", clipId ? { "clip-path":`url(#${clipId})` } : {});
    p.append(g);
    rect(g, x,y,w,h, { fill:"rgba(255,255,255,0.06)", stroke:"rgba(255,255,255,0.2)", "stroke-width":1 });
    const path = svgEl("path", { fill:"none", stroke:color, "stroke-width":1.6, filter:"url(#glow)" });
    g.append(path);
    let t=0, phase=Math.random()*Math.PI*2;
    function draw(){
      const N=140; let d="";
      for(let i=0;i<N;i++){
        const px = x + (i/(N-1))*w;
        const s  = Math.sin((i*0.16)+phase)*0.32 + (Math.random()-0.5)*0.12;
        const py = y + (0.5 - s*0.46)*h;
        d += (i===0?`M ${px} ${py}`:` L ${px} ${py}`);
      }
      path.setAttribute("d", d);
    }
    draw();
    return { advance(dt){ t+=dt; if(t>0.06){ t=0; phase+=0.22; draw(); } } };
  }
})();
