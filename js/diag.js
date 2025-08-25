// js/diag.js — balanced layout + stronger contrast (fixed)
(function () {
  const CFG = window.DIAG || {};
  const theme = CFG.theme || {};
  const SCAN  = CFG.scan  || {};
  const R     = CFG.readouts || {};

  const C_PRIMARY = theme.primary || "#37ddfa";
  const C_ACCENT  = theme.accent  || "#ff3b3b";
  const C_TEXT    = theme.text    || "#cfe7ff";
  const C_GRID    = theme.grid    || "rgba(255,255,255,0.045)";

  const SPEED = Math.max(600, +SCAN.speedMs || 2600);
  const BAR_H = Math.max(6, +SCAN.thickness || 16);
  const BAR_A = Math.max(0, Math.min(1, +SCAN.alpha || 0.38));

  const root = document.getElementById("diag-root");
  if (!root) return;

  const svg = mk("svg", {
    class: "diag-svg",
    viewBox: "0 0 1200 560",
    preserveAspectRatio: "xMidYMid meet"
  });

  // --- defs ------------------------------------------------------------------
  const defs = mk("defs");
  defs.append(
    mk("filter", { id:"glow", x:"-30%", y:"-30%", width:"160%", height:"160%" },
      mk("feGaussianBlur", { stdDeviation:"2.2", result:"b" }),
      mk("feMerge", {}, mk("feMergeNode", { in:"b" }), mk("feMergeNode", { in:"SourceGraphic" }))
    ),
    mk("filter", { id:"eyeglow", x:"-80%", y:"-80%", width:"260%", height:"260%" },
      mk("feGaussianBlur", { stdDeviation:"4.2", result:"b" }),
      mk("feMerge", {}, mk("feMergeNode", { in:"b" }), mk("feMergeNode", { in:"SourceGraphic" }))
    ),
    mk("linearGradient", { id:"scanGrad", x1:"0", y1:"0", x2:"0", y2:"1" },
      mk("stop", { offset:"0%",  "stop-color": C_PRIMARY, "stop-opacity": 0 }),
      mk("stop", { offset:"50%", "stop-color": C_PRIMARY, "stop-opacity": BAR_A }),
      mk("stop", { offset:"100%","stop-color": C_PRIMARY, "stop-opacity": 0 })
    )
  );
  svg.append(defs);

  // --- panel background FIRST (no inner stroke) ------------------------------
  svg.appendChild(
    mk("rect", {
      x: 10, y: 10, width: 1180, height: 540, rx: 12, ry: 12,
      fill: "rgba(0,0,0,0.58)",   // tweak 0.48–0.58 to taste
      stroke: "none"
    })
  );

  // --- soft grid ON TOP of the panel -----------------------------------------
  for (let x = 20; x <= 1180; x += 20) {
    svg.append(mk("line", { x1:x, y1:10, x2:x, y2:550, stroke:C_GRID, "stroke-width":1 }));
  }
  for (let y = 10; y <= 550; y += 20) {
    svg.append(mk("line", { x1:20, y1:y, x2:1180, y2:y, stroke:C_GRID, "stroke-width":1 }));
  }

  // layout geometry (two columns)
  const PAD = 40;
  const LEFT_X = PAD;
  const LEFT_W = 560;
  const RIGHT_X = LEFT_X + LEFT_W + 40;
  const TOP_Y  = 36;

  // vertical divider line
  svg.append(mk("line", {
    x1: LEFT_X + LEFT_W, y1: TOP_Y - 16,
    x2: LEFT_X + LEFT_W, y2: 520,
    stroke: C_PRIMARY, "stroke-opacity": 0.55,
    "stroke-width": 2.4, "vector-effect":"non-scaling-stroke", filter:"url(#glow)"
  }));

  // --- left column: skull schematic -----------------------------------------
  const strokeAttrs = {
    fill: "none",
    stroke: C_PRIMARY,
    "stroke-width": 4.2,               // was 3.2
    "stroke-opacity": 0.95,
    "vector-effect": "non-scaling-stroke",
    filter: "url(#glow)",
    "stroke-linejoin": "round",
    "stroke-linecap": "round"
  };

  const skull = mk("g", { transform:`translate(${LEFT_X+8},${TOP_Y})` });
  skull.append(mk("path", {
    d: "M140,40 C220,20 320,40 360,120 C380,150 380,210 360,240 C320,300 200,320 140,300 C100,288 60,250 50,210 C30,140 60,70 140,40 Z",
    fill: hexA(C_PRIMARY, 0.10),  // was 0.06
    stroke: "none"
  }));

  skull.append(mk("path", {
  d: "M140,40 C220,20 320,40 360,120 C380,150 380,210 360,240 C320,300 200,320 140,300 C100,288 60,250 50,210 C30,140 60,70 140,40 Z",
  fill: "none",
  stroke: "#ffffff",
  "stroke-opacity": 0.08,
  "stroke-width": 1.6,
  "vector-effect": "non-scaling-stroke"
}));
  skull.append(
    mk("path", { ...strokeAttrs, d:"M140,40 C220,20 320,40 360,120 C380,150 380,210 360,240 C320,300 200,320 140,300 C100,288 60,250 50,210 C30,140 60,70 140,40 Z" }),
    mk("path", { ...strokeAttrs, d:"M120,290 L340,290 C360,290 360,310 340,320 L180,330 C150,332 130,320 120,300 Z" }),
    mk("line", { ...strokeAttrs, x1:210,y1:215,x2:300,y2:260 }),
    mk("line", { ...strokeAttrs, x1:210,y1:215,x2:130,y2:260 }),
    mk("rect", { ...strokeAttrs, x:190,y:330,width:16,height:60 }),
    mk("rect", { ...strokeAttrs, x:220,y:330,width:16,height:60 }),
    mk("rect", { ...strokeAttrs, x:250,y:330,width:16,height:60 }),
    mk("circle", { cx:220, cy:180, r:18, fill:C_ACCENT, filter:"url(#eyeglow)" }),
    mk("circle", { cx:280, cy:180, r:18, fill:C_ACCENT, filter:"url(#eyeglow)" })
  );
  svg.append(skull);

  // scan bar
  const scanBar = mk("rect", {
    x: LEFT_X + 8, y: TOP_Y + 6, width: LEFT_W - 56, height: BAR_H,
    fill: "url(#scanGrad)", opacity: 1, filter:"url(#glow)"
  });
  svg.append(scanBar);

  // --- right column: header + readouts --------------------------------------
  const HDR_X = RIGHT_X;
  const HDR_Y = TOP_Y + 8;
  svg.append(mk("text", {
    x: HDR_X, y: HDR_Y,
    fill: C_PRIMARY,
    "font-family": "'TerminatorReal','Orbitron','Audiowide',sans-serif",
    "font-size": 24,
    "letter-spacing": 2,
    "text-anchor": "start",
    filter: "url(#glow)"
  }, "T-800 DIAGNOSTIC INTERFACE"));

  const RX = RIGHT_X;
  const RY = HDR_Y + 40;
  const ROW = 28;

  function readout(y, label, id) {
    svg.append(mk("text", {
      x: RX, y, fill: C_TEXT, "font-family":"'Courier New',monospace", "font-size": 18
    }, label + ":"));
    svg.append(mk("text", {
      id, x: RX + 200, y, fill: "#ffffff",
      "font-family":"'Courier New',monospace", "font-size": 18
    }, "—"));
  }

  readout(RY + ROW*0, "MODEL",     "ro_model");
  readout(RY + ROW*1, "REGION",    "ro_region");
  readout(RY + ROW*3, "CPU CORE",  "ro_cpu_core");
  readout(RY + ROW*4, "PWR BUS",   "ro_pwr_bus");
  readout(RY + ROW*5, "ACTUATORS", "ro_actuators");
  readout(RY + ROW*6, "TARGETING", "ro_targeting");
  readout(RY + ROW*7, "NETLINK",   "ro_netlink");

  root.append(svg);

  // seed + animate
  set("ro_model",   R.model    || "T-800 / Series 101");
  set("ro_region",  R.location || "UNKNOWN");
  updateDynamics();
  setInterval(updateDynamics, 900);

  let t0 = performance.now();
  function loop(now) {
    const top = TOP_Y + 6, bottom = 480 - BAR_H;
    const pct = ((now - t0) % SPEED) / SPEED;
    const y = top + pct * (bottom - top);
    scanBar.setAttribute("y", y.toFixed(2));
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // ---- helpers --------------------------------------------------------------
  function updateDynamics() {
    const ct = R.cpuTemp || { min:41, max:55, unit:"°C" };
    const pw = R.power   || { min:74, max:89, unit:"%"  };
    const ac = R.actuators || { ok: 28, total: 32 };

    set("ro_cpu_core", (rand(ct.min, ct.max)).toFixed(1) + (ct.unit || "°C"));
    set("ro_pwr_bus",  Math.round(rand(pw.min, pw.max)) + (pw.unit || "%"));

    const wiggle = Math.max(0, ac.ok + (Math.random() < 0.18 ? (Math.random()<0.5?-1:1) : 0));
    set("ro_actuators", `${wiggle}/${ac.total} OK`);

    if (Array.isArray(R.targeting)) set("ro_targeting", pick(R.targeting));
    if (Array.isArray(R.netlink))   set("ro_netlink",   pick(R.netlink));
  }

  function mk(tag, attrs, child) {
    const n = document.createElementNS("http://www.w3.org/2000/svg", tag);
    if (attrs) for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (child != null) n.textContent = child;
    return n;
  }
  function set(id, val) {
    const node = svg.getElementById ? svg.getElementById(id) : svg.querySelector("#"+id);
    if (node) node.textContent = val;
  }
  const rand = (a,b)=> a + Math.random()*(b-a);
  const pick = (arr)=> arr[(Math.random()*arr.length)|0];
  function hexA(hex, a){
    const h = hex.replace('#',''); const v = h.length===3 ? h.split('').map(c=>c+c).join('') : h.padEnd(6,'0').slice(0,6);
    const r = parseInt(v.slice(0,2),16), g = parseInt(v.slice(2,4),16), b = parseInt(v.slice(4,6),16);
    return `rgba(${r},${g},${b},${a})`;
  }
})();
