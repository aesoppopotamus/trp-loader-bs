// js/startsequence.js
(function () {
  const CFG = (window.INIT || {});

  const mount =
    document.getElementById("console") ||
    document.getElementById("map-block") ||
    document.getElementById("diag-block") ||
    document.body;

  // What should be revealed when the intro finishes
  const REVEAL = (Array.isArray(CFG.revealSelectors) && CFG.revealSelectors.length)
    ? CFG.revealSelectors
    : ["#console", "#map-block", "#diag-block"]; // <-- fixed leading '#'

  // Keep underlay visible by default (set INIT.introHideUnderlay = true to hide)
  const HIDE_UNDERLAY = CFG.introHideUnderlay === true;

  function setVisible(on) {
    for (const sel of REVEAL) {
      const el = document.querySelector(sel);
      if (el) el.classList.toggle("is-visible", !!on);
    }
  }

  // Skip intro entirely?
  if (CFG.introEnabled === false) {
    setVisible(true);
    return;
  }

  // Type + timing
  const TYPE_MS = Math.max(0, CFG.introTypeMs ?? 6);
  const HOLD_MS = Math.max(0, CFG.introHoldMs ?? 1400);
  const DIM     = (typeof CFG.introDimBg === "number") ? CFG.introDimBg : null;

  // Create/reuse the overlay
  const splash = document.getElementById("boot-seq") || (() => {
    const d = document.createElement("div");
    d.id = "boot-seq";
    d.className = "startseq startseq--visible";
    mount.appendChild(d);
    return d;
  })();

  // Underlay visibility policy
  if (HIDE_UNDERLAY) setVisible(false);
  else               setVisible(true);

  // Render shell
  splash.innerHTML = `
    <div class="startseq__panel">
      <div class="startseq__inner">
        <pre class="startseq__pre startseq__pre--logo" id="ss-pre-logo"></pre>
        <pre class="startseq__pre startseq__caption"   id="ss-pre-cap"></pre>
        <pre class="startseq__log"                      id="ss-log"></pre>
      </div>
    </div>
  `;
  if (DIM !== null) splash.style.background = `rgba(0,0,0,${DIM})`;

  // Overlay shouldn't block clicks
  splash.style.pointerEvents = "none";

  const elLogo = splash.querySelector("#ss-pre-logo");
  const elCap  = splash.querySelector("#ss-pre-cap");
  const elLog  = splash.querySelector("#ss-log");

  // Split ASCII payload: art (top) + caption (after first blank line)
  const all = Array.isArray(CFG.asciiLogo) ? CFG.asciiLogo.slice() : [];
  const blankIdx = all.findIndex(l => !String(l).trim());
  const art     = blankIdx >= 0 ? all.slice(0, blankIdx)  : all;
  const caption = blankIdx >= 0 ? all.slice(blankIdx + 1) : [];

  // Boot lines
  const bootLines = Array.isArray(CFG.bootScript) ? CFG.bootScript : [];

  // Typing helpers
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const prefersReduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const TYPE = prefersReduced ? Math.min(TYPE_MS, 2) : TYPE_MS;
  const HOLD = prefersReduced ? Math.min(HOLD_MS, 600) : HOLD_MS;

  async function typeLines(el, lines) {
    if (!lines || !lines.length) return;
    if (TYPE === 0) {
      el.textContent += lines.join("\n") + (lines.length ? "\n" : "");
      return;
    }
    for (const line of lines) {
      for (let i = 0; i < line.length; i++) {
        el.textContent += line[i];
        await sleep(TYPE);
      }
      el.textContent += "\n";
      await sleep(TYPE * 2);
    }
  }

  // Run the splash
  (async function run() {
    await typeLines(elLogo, art);
    await typeLines(elCap, caption);
    await sleep(250);
    await typeLines(elLog, bootLines);
    await sleep(HOLD);

    splash.classList.add("startseq--fadeout");
    setVisible(true);
    setTimeout(() => { splash.remove(); }, 800);
  })();
})();
