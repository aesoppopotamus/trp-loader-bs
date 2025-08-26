// js/diag.js — SKYNET // Proportional Cognitive Telemetry Viewport (no ticker)
(function () {
  // ---------- CONFIG / DEFAULTS ----------
  const DIAG = window.DIAG || {};
  if (!window.DIAG) {
    console.warn("[diag] window.DIAG was missing at boot; using internal defaults.");
  }
  const THEME = (DIAG && DIAG.theme) || {};
  const COLORS = {
    primary: THEME.primary || "#37ddfa",        // neon cyan
    text:    THEME.text    || "#cfe7ff",        // cold white/blue
    warn:    "#ffd166",
    crit:    "#ff5252",
    grid:    "rgba(255,255,255,0.045)"
  };

  const READ = (DIAG && DIAG.readouts) || {};
  const CPU = READ.cpuTemp || { min: 40, max: 65, unit: "°C" };
  const PWR = READ.power   || { min: 72, max: 92, unit: "%"  };
  const NET = Array.isArray(READ.netlink) && READ.netlink.length
    ? READ.netlink.slice()
    : [0.44,0.62,0.55,0.58,0.61,0.49,0.53];

  // ---------- SVG BOOT ----------
  const svg = document.getElementById("diag-pane");
  if (!svg) return;

  // Adopt existing viewBox (fallback to 720x560)
  let vb = svg.getAttribute("viewBox");
  let [vx, vy, vw, vh] = vb ? vb.split(/\s+/).map(Number) : [0, 0, 720, 560];
  if (!isFinite(vw) || !isFinite(vh) || vw <= 0 || vh <= 0) { vw = 720; vh = 560; }
  svg.setAttribute("viewBox", `0 0 ${vw} ${vh}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.innerHTML = "";

  // CSS-driven sizing knobs
  const FONT_HDR  = "'Orbitron','Audiowide',sans-serif";
  const FONT_MONO = "'Courier New',monospace";
  const FS = {
    base:  "var(--diag-fs, 14px)",
    small: "calc(var(--diag-fs, 14px) * 0.86)",
    head:  "calc(var(--diag-fs, 14px) * 1.25)"
  };
  const SW = {
    base:  "var(--diag-stroke, 1)",
    thick: "calc(var(--diag-stroke, 1) * 1.6)"
  };

  // ---------- PROPORTIONAL GEOMETRY ----------
  const VB_W = vw, VB_H = vh;

  const PAD_L = 0.05 * VB_W;
  const PAD_R = 0.05 * VB_W;
  const PAD_T = 0.06 * VB_H;
  const PAD_B = 0.05 * VB_H;

  const W_SAFE = VB_W - PAD_L - PAD_R;
  const H_SAFE = VB_H - PAD_T - PAD_B;

  const LABEL_W = 0.30 * W_SAFE;
  const GAP     = 0.02 * W_SAFE;
  const VAL_X   = PAD_L + LABEL_W + GAP;
  const VAL_W   = W_SAFE - LABEL_W - GAP;

  const HEADER_Y = PAD_T * 0.55;
  const ROW_H    = H_SAFE * 0.075;
  const BAR_H    = Math.max(6, ROW_H * 0.32);
  const SPARK_H  = Math.max(22, ROW_H * 1.15);

  // ---------- HELPERS ----------
  const NS = "http://www.w3.org/2000/svg";
  const ns  = (t,a={}) => { const n=document.createElementNS(NS,t); for(const k in a) n.setAttribute(k,a[k]); return n; };
  const add = (p,n) => (p.appendChild(n), n);
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const rand    = (lo,hi) => lo + Math.random()*(hi-lo);

  function fitText(node, str, maxW) {
    const s = str == null ? "" : String(str);
    node.textContent = s;
    if (!s) return;
    if (node.getComputedTextLength() <= maxW) return;
    let lo=1, hi=s.length, best=1;
    while (lo<=hi){
      const mid=(lo+hi)>>1;
      node.textContent = s.slice(0, mid) + "…";
      if (node.getComputedTextLength() <= maxW){ best=mid; lo=mid+1; } else hi=mid-1;
    }
    node.textContent = s.slice(0, best) + "…";
  }

  // text factories (use CSS-driven sizes)
  function tBase(parent, attrs){
    attrs.style = (attrs.style?attrs.style+";":"") + `font-size:${FS.base}`;
    return add(parent, ns("text", attrs));
  }
  function tSmall(parent, attrs){
    attrs.style = (attrs.style?attrs.style+";":"") + `font-size:${FS.small}`;
    return add(parent, ns("text", attrs));
  }
  function tHead(parent, attrs){
    attrs.style = (attrs.style?attrs.style+";":"") + `font-size:${FS.head}`;
    return add(parent, ns("text", attrs));
  }

  // ---------- ROOT & GRID ----------
  const g = add(svg, ns("g", { transform:`translate(0,0)` }));

  // subtle grid (inside safe area)
  (function grid(){
    const gg = add(g, ns("g"));
    const x0 = PAD_L, y0 = PAD_T;
    const x1 = PAD_L + W_SAFE, y1 = PAD_T + H_SAFE;
    const step = 20; // logical spacing
    for (let x=x0; x<=x1; x+=step) add(gg, ns("line",{x1:x,y1:y0,x2:x,y2:y1,stroke:COLORS.grid, style:`stroke-width:${SW.base}`}));
    for (let y=y0; y<=y1; y+=step) add(gg, ns("line",{x1:x0,y1:y,x2:x1,y2:y,stroke:COLORS.grid, style:`stroke-width:${SW.base}`}));
  })();

  // ---------- HEADER ----------
  tHead(g, {
    x: PAD_L, y: HEADER_Y, dy:"0.0em",
    fill: COLORS.primary,
    "font-family": FONT_HDR,
    "letter-spacing": 2,
    style: `font-variant:small-caps; font-size:${FS.head}`
  }).textContent = "OPERATIONAL STATUS";

  let yCursor = PAD_T + ROW_H * 0.3; // first row baseline

  // dot-leader row
  const LEADER = "2 3";
  function row(label, value, color=COLORS.text){
    const grp = add(g, ns("g", { transform:`translate(0,${yCursor})` }));

    // label (left column)
    tBase(grp, {
      x: PAD_L, y: 0, dy:"0.9em",
      fill: COLORS.text, "font-family": FONT_MONO
    }).textContent = label;

    // dotted leader
    const leaderY = ROW_H * 0.45;
    add(grp, ns("line", {
      x1: PAD_L + LABEL_W * 0.92, y1: leaderY,
      x2: VAL_X - 4,               y2: leaderY,
      stroke: "rgba(200,220,255,0.18)",
      "stroke-dasharray": LEADER,
      style: `stroke-width:${SW.base}`
    }));

    // value (right column)
    const val = tBase(grp, {
      x: VAL_X + VAL_W, y: 0, dy:"0.9em", "text-anchor":"end",
      fill: color, "font-family": FONT_MONO
    });
    fitText(val, value, VAL_W);

    yCursor += ROW_H;
    return val;
  }

  // bars aligned to value column
  function bar(label, pct, formatter){
    row(label,""); yCursor -= ROW_H;
    const bx = VAL_X, bw = VAL_W, by = ROW_H * 0.30;
    const grp = add(g, ns("g", { transform:`translate(0,${yCursor})` }));
    add(grp, ns("rect",{x:bx,y:by,width:bw,height:BAR_H,rx:2,fill:"rgba(255,255,255,0.08)"}));
    const fg = add(grp, ns("rect",{x:bx,y:by,width:clamp01(pct)*bw,height:BAR_H,rx:2,fill:COLORS.primary}));

    const num = tSmall(grp, {
      x: bx + bw - 2, y: by - 2, dy:"0.9em", "text-anchor":"end",
      fill:"#cfe7ff","font-family": FONT_MONO, opacity:0.9
    });
    const set = (v, raw) => {
      const c = clamp01(v);
      fg.setAttribute("width", (c*bw).toFixed(1));
      num.textContent = formatter ? formatter(raw) : Math.round(c*100)+"%";
    };
    set(pct, pct);
    yCursor += ROW_H;
    return set;
  }

  // sparkline sized to value column
  function sparkline(label, series){
    row(label,""); yCursor -= ROW_H;
    const bx = VAL_X, bw = VAL_W;
    const by = ROW_H * 0.20, bh = SPARK_H;
    const grp = add(g, ns("g", { transform:`translate(0,${yCursor})` }));
    add(grp, ns("rect",{x:bx,y:by,width:bw,height:bh,rx:2,fill:"rgba(255,255,255,0.06)",stroke:"rgba(255,255,255,0.2)", style:`stroke-width:${SW.base}`}));
    const path = add(grp, ns("path",{fill:"none",stroke:COLORS.primary, style:`stroke-width:${SW.thick}`}));

    let cur = (Array.isArray(series) && series.length) ? series.slice() : [0.5,0.5,0.5,0.5,0.5];
    const safe01 = v => {
      v = Number(v); if (!isFinite(v)) return 0.5;
      return v<0?0:v>1?1:v;
    };
    const draw = (points) => {
      const arr = (Array.isArray(points) && points.length) ? points : cur;
      const n = Math.max(2, arr.length);
      let d = "";
      for (let i=0;i<n;i++){
        const t = (n===1)?0:i/(n-1);
        const val = safe01(arr[Math.min(i,arr.length-1)]);
        const x = bx + t*bw;
        const y = by + (1 - val)*bh;
        d += (i?" L":"M") + x.toFixed(2) + " " + y.toFixed(2);
      }
      path.setAttribute("d", d);
      cur = arr.slice();
    };
    draw(cur);
    yCursor += ROW_H + (SPARK_H - BAR_H)*0.35;
    return draw;
  }

  // ---------- CONTENT ----------
  const n_qrm = row("QRM:",  "88% — STABLE");
  const n_coh = row("COH:",  "IN-SYNC");
  const n_upl = row("UPL:",  "READY links:3 loss:0.0");
  const n_srv = row("SURV:", "REDLINE");
  const n_sta = row("STAT:","—");
  const n_int = row("INTL:","—");

  const setCore = bar("CTMP:", 0.52, (raw)=>{
    const deg = (CPU.min + clamp01(raw)*(CPU.max-CPU.min));
    return deg.toFixed(1) + (CPU.unit || "°C");
  });
  const setPwr  = bar("PWR:",  0.85, (raw)=>{
    const pct = Math.round(clamp01(raw)*100);
    return pct + (PWR.unit || "%");
  });
  const drawNet = sparkline("NET:", NET);

  // ---------- ROTATION + ANIMATION ----------
  function lines(key) {
    const src = (DIAG && DIAG.domains && DIAG.domains[key]) || [];
    return Array.isArray(src)
      ? src.map(v => (v == null ? '' : String(v)).trim()).filter(Boolean)
      : [];
  }
  function pickRotating(key, salt = 0) {
    const a = lines(key);
    if (!a.length) return "—";
    const idx = (Math.floor(Date.now() / 1000) + salt) % a.length;
    return a[idx];
  }
  function setText(node, v){ fitText(node, v, VAL_W); }

  const ORDER = ["CORE","ASSETS","BIO","NET"];

  function tick(){
    const slot = Math.floor(Date.now() / 6000) % ORDER.length;
    const next = (slot + 1) % ORDER.length;

    setText(n_sta, `${ORDER[slot]}: ${pickRotating(ORDER[slot], 0)}`);
    setText(n_int, `${ORDER[next]}: ${pickRotating(ORDER[next], 7)}`);

    setText(n_qrm, `${Math.round(rand(82,93))}% — STABLE`);
    setText(n_coh, (Math.random()<0.5 ? "IN-SYNC" : "PARTIAL"));
    setText(n_upl, "READY links:3 loss:0.0");
    setText(n_srv, "REDLINE");

    const cpu = rand(CPU.min, CPU.max);
    const pwr = rand(PWR.min, PWR.max);
    setCore((cpu - CPU.min)/(CPU.max - CPU.min), cpu);
    setPwr ((pwr - PWR.min)/(PWR.max - PWR.min), pwr);
  }
  tick();
  setInterval(tick, 1200);

  function animate() {
    const s = NET.map(v => {
      v = Number(v); if (!isFinite(v)) v = 0.5;
      v += (Math.random()-0.5)*0.04;
      return clamp01(v);
    });
    drawNet(s);
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
})();
