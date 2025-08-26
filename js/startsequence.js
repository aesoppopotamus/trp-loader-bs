(function () {
  const CFG = (window.INIT || {});

  // NEW: master switch to hide *everything* during the intro
  const HIDE_ALL = CFG.introHideAll === true;

  // NEW: tiny injector for a “hide all” CSS and a toggling class
  const STYLE_ID = "__ss-hide-all-style";
  function enableGlobalHide(on) {
    if (on) {
      if (!document.getElementById(STYLE_ID)) {
        const st = document.createElement("style");
        st.id = STYLE_ID;
        st.textContent = `
          .__ss-hide-all * { visibility: hidden !important; }
          .__ss-hide-all #boot-seq,
          .__ss-hide-all #boot-seq * { visibility: visible !important; }
        `;
        document.head.appendChild(st);
      }
      document.documentElement.classList.add("__ss-hide-all");
    } else {
      document.documentElement.classList.remove("__ss-hide-all");
      const st = document.getElementById(STYLE_ID);
      if (st) st.remove();
    }
  }

  const mount =
    document.getElementById("console") ||
    document.getElementById("map-block") ||
    document.getElementById("diag-block") ||
    document.body;

  const REVEAL = (Array.isArray(CFG.revealSelectors) && CFG.revealSelectors.length)
    ? CFG.revealSelectors
    : ["#console", "#map-block", "#diag-block"];

  const HIDE_UNDERLAY = CFG.introHideUnderlay === true;

  function setVisible(on) {
    for (const sel of REVEAL) {
      const el = document.querySelector(sel);
      if (el) el.classList.toggle("is-visible", !!on);
    }
  }

  // If intro disabled, just show everything and bail
  if (CFG.introEnabled === false) {
    setVisible(true);
    return;
  }

  // If we’re globally hiding, turn it on now (this supersedes introHideUnderlay)
  if (HIDE_ALL) {
    enableGlobalHide(true);
  } else {
    // old behavior: optionally hide the underlay
    if (HIDE_UNDERLAY) setVisible(false);
    else               setVisible(true);
  }

  const TYPE_MS = Math.max(0, CFG.introTypeMs ?? 6);
  const HOLD_MS = Math.max(0, CFG.introHoldMs ?? 1400);
  const DIM     = (typeof CFG.introDimBg === "number") ? CFG.introDimBg : null;

  const splash = document.getElementById("boot-seq") || (() => {
    const d = document.createElement("div");
    d.id = "boot-seq";
    d.className = "startseq startseq--visible";
    mount.appendChild(d);
    return d;
  })();

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
  splash.style.pointerEvents = "none";

  const elLogo = splash.querySelector("#ss-pre-logo");
  const elCap  = splash.querySelector("#ss-pre-cap");
  const elLog  = splash.querySelector("#ss-log");

  const all = Array.isArray(CFG.asciiLogo) ? CFG.asciiLogo.slice() : [];
  const blankIdx = all.findIndex(l => !String(l).trim());
  const art     = blankIdx >= 0 ? all.slice(0, blankIdx)  : all;
  const caption = blankIdx >= 0 ? all.slice(blankIdx + 1) : [];

  const bootLines = Array.isArray(CFG.bootScript) ? CFG.bootScript : [];

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

  (async function run() {
    await typeLines(elLogo, art);
    await typeLines(elCap, caption);
    await sleep(250);
    await typeLines(elLog, bootLines);
    await sleep(HOLD);

    splash.classList.add("startseq--fadeout");

    // Reveal target elements as before
    setVisible(true);

    // Turn off the global hide now that we’re done
    if (HIDE_ALL) enableGlobalHide(false);

    setTimeout(() => { splash.remove(); }, 800);
  })();
})();
