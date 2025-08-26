// js/cursorTyper.js

(function () {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // If no seed, fall back to Math.random.
  function makeRng(seed) {
    if (seed == null) return Math.random;
    let t = (seed >>> 0) + 0x6D2B79F5;
    return function () {
      t += 0x6D2B79F5;
      let x = Math.imul(t ^ (t >>> 15), 1 | t);
      x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffleArray(arr, rng = Math.random) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  async function typeLine(el, text, msPerChar) {
    el.textContent = "";
    if (msPerChar <= 0) {
      el.textContent = text;
      return;
    }
    for (let i = 0; i < text.length; i++) {
      el.textContent = text.slice(0, i + 1);
      await sleep(msPerChar);
    }
  }

  // Core runner: lines is an array of strings
  async function runCursorTyperRaw(el, lines, opts) {
    const {
      msPerChar = 0,
      pauseAfterTyping = 12000,
      shuffle = true,
      reshuffleOnExhaust = true,
      seed = null,
      skipEmpty = true,
    } = opts || {};

    const rng = makeRng(seed);
    const base = (lines || []).filter(s => (skipEmpty ? String(s || "").trim().length : true));

    if (base.length === 0) return;

    let queue = shuffle ? shuffleArray(base, rng) : base.slice();
    let idx = 0;

    while (true) {
      const line = queue[idx++];
      await typeLine(el, line, msPerChar);
      await sleep(pauseAfterTyping);

      if (idx >= queue.length) {
        idx = 0;
        queue = reshuffleOnExhaust ? shuffleArray(base, rng) : base.slice();
      }
    }
  }

  // Convenience: read config and start
  async function runCursorTyperFromConfig() {
    const target = window.UI?.cursorTyperTarget || {};
    const sel = target.selector || "#console-text";
    const el = document.querySelector(sel);
    if (!el) return;

    const key = target.sourceKey || "rumors";
    // Allow scanText objects: map to just their .text
    let src = (window[key] || []);
    if (key === "scanText" && Array.isArray(src)) {
      src = src.map(x => (x && x.text) || "");
    }

    const opts = window.UI?.cursorTyper || {};
    await runCursorTyperRaw(el, src, opts);
  }

  // expose minimal API
  window.runCursorTyperRaw = runCursorTyperRaw;
  window.runCursorTyperFromConfig = runCursorTyperFromConfig;
})();
