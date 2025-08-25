(function () {
  const CFG = window.RADAR || {};
  const COLOR = CFG.color || "#37ddfa";
  const RINGS = Math.max(3, CFG.rings | 0 || 6);
  const SWEEP = (CFG.sweepSpeed ?? 0.9) * (Math.PI / 180); // deg → rad
  const BLIP_COUNT = Math.max(6, CFG.blips | 0 || 18);
  const NOISE = Math.max(0, Math.min(0.2, CFG.noise ?? 0.05));

  const canvas = document.getElementById("radar");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  // Hi-DPI sizing
  function fitCanvas() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  fitCanvas();
  window.addEventListener("resize", fitCanvas);

  // Polar helpers
  const rand = (a=1)=>Math.random()*a;
  const TAU = Math.PI * 2;

  // Blips live in polar coords and drift a little
  const blips = new Array(BLIP_COUNT).fill(0).map(()=>({
    r: 0.12 + rand(0.78),             // 0..1 of radius
    a: rand(TAU),
    vr: (rand(0.0008) - 0.0004),      // slow radial drift
    va: (rand(0.004) - 0.002),        // slow angular drift
    pulse: 0
  }));

  let angle = -Math.PI / 2; // start top

  function draw() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const cx = w / 2, cy = h / 2;
    const r = Math.min(cx, cy) - 8;

    // clear
    ctx.clearRect(0, 0, w, h);

    // subtle background
    if (NOISE > 0) {
      ctx.fillStyle = `rgba(0,0,0,${0.35 + NOISE})`;
      ctx.fillRect(0, 0, w, h);
    }

    // grid rings
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    for (let i = 1; i <= RINGS; i++) {
      const rr = (i / RINGS) * r;
      ctx.beginPath();
      ctx.arc(cx, cy, rr, 0, TAU);
      ctx.stroke();
    }

    // crosshairs
    ctx.beginPath();
    ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy);
    ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r);
    ctx.stroke();

    // sweep wedge (additive glow)
    const sweepWidth = Math.max(0.12, 0.2 - (r / 2000)); // radians
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0.0,  "rgba(55,221,250,0.00)");
    grad.addColorStop(0.7,  "rgba(55,221,250,0.10)");
    grad.addColorStop(1.0,  "rgba(55,221,250,0.22)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle - sweepWidth, angle);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // blips
    blips.forEach(b => {
      // drift
      b.a += b.va;
      b.r += b.vr;
      if (b.r < 0.08 || b.r > 0.92) b.vr *= -1;

      // cartesian
      const px = cx + Math.cos(b.a) * (b.r * r);
      const py = cy + Math.sin(b.a) * (b.r * r);

      // how near the sweep? (0..1)
      let diff = Math.atan2(Math.sin(b.a - angle), Math.cos(b.a - angle));
      const excite = Math.max(0, 1 - Math.abs(diff) / (sweepWidth * 1.4));
      b.pulse = Math.max(b.pulse * 0.92, excite);

      // draw blip
      const sz = 2 + 2 * b.pulse;
      ctx.fillStyle = `${hexToRgba(COLOR, 0.9)}`;
      ctx.beginPath();
      ctx.arc(px, py, sz, 0, TAU);
      ctx.fill();

      // pulse ring
      if (b.pulse > 0.2) {
        ctx.strokeStyle = `${hexToRgba(COLOR, 0.45 * b.pulse)}`;
        ctx.beginPath();
        ctx.arc(px, py, sz + 5*b.pulse, 0, TAU);
        ctx.stroke();
      }
    });

    // advance sweep
    angle += SWEEP;
    requestAnimationFrame(draw);
  }

  function hexToRgba(hex, a) {
    // supports #rgb, #rrggbb
    const h = hex.replace('#','');
    const v = h.length === 3
      ? h.split('').map(c=>c+c).join('')
      : h.padEnd(6,'0').slice(0,6);
    const r = parseInt(v.slice(0,2),16);
    const g = parseInt(v.slice(2,4),16);
    const b = parseInt(v.slice(4,6),16);
    return `rgba(${r},${g},${b},${a})`;
  }

  // kick
  requestAnimationFrame(draw);
})();
