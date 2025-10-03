// ./js/snow.js
// Snow effect overlay for TRP loader

(() => {
  const cfg = (window.TRPLoaderConfig || {});
  if (!cfg.enableSnow) return; // respect config.js flag

  const c = document.getElementById("snow");
  if (!c) return;
  const ctx = c.getContext("2d");

  const CONF = {
    densityDivisor: 15000, // smaller = more flakes
    speedY: [30, 60],      // vertical speed px/sec
    windX: [-20, 20],      // horizontal drift
    size: [1, 3],          // flake radius px
    alpha: [0.35, 0.85],   // flake opacity
    twirl: 0.002           // horizontal wobble
  };

  let width = 0, height = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);
  let flakes = [];

  const rand = (a, b) => a + Math.random() * (b - a);

  function resize() {
    width  = window.innerWidth;
    height = window.innerHeight;
    c.width  = Math.floor(width * DPR);
    c.height = Math.floor(height * DPR);
    c.style.width  = width + "px";
    c.style.height = height + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    const targetCount = Math.max(8, Math.round((width * height) / CONF.densityDivisor));
    flakes.length = targetCount;
    for (let i = 0; i < targetCount; i++) {
      if (!flakes[i]) flakes[i] = newFlake(true);
    }
  }

  function newFlake(anywhere) {
    const f = {};
    resetFlake(f, anywhere);
    return f;
  }

  function resetFlake(f, anywhere) {
    f.x = rand(0, width);
    f.y = anywhere ? rand(0, height) : -5;
    f.r = rand(CONF.size[0], CONF.size[1]);
    f.alpha = rand(CONF.alpha[0], CONF.alpha[1]);
    f.vy = rand(CONF.speedY[0], CONF.speedY[1]) / 60;
    f.vx = rand(CONF.windX[0], CONF.windX[1]) / 60;
    f.phase = Math.random() * Math.PI * 2;
  }

  function tick() {
    ctx.clearRect(0, 0, width, height);
    for (const f of flakes) {
      f.phase += CONF.twirl;
      const wobble = Math.sin(f.phase) * 0.4;
      f.x += f.vx + wobble;
      f.y += f.vy;
      if (f.y > height + 6 || f.x < -6 || f.x > width + 6) resetFlake(f, false);

      ctx.globalAlpha = f.alpha;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
    }
    requestAnimationFrame(tick);
  }

  window.addEventListener("resize", resize);
  resize();
  tick();
})();
