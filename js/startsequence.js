// js/startsequence.js — two-tone ASCII splash, no user interaction, no events
(function () {
  const CFG = (window.INIT || {});
  if (CFG.introEnabled === false) {
    // just reveal the panel immediately
    document.getElementById('bracket-container')?.classList.add('is-visible');
    return;
  }

  const TYPE_MS = Math.max(0, CFG.introTypeMs ?? 6);
  const HOLD_MS = Math.max(0, CFG.introHoldMs ?? 1400);

  // Mount targets
  const bracket = document.getElementById('bracket-container');
  const splash  = document.getElementById('boot-seq') || (() => {
    const d = document.createElement('div');
    d.id = 'boot-seq';
    d.className = 'startseq startseq--visible';
    (bracket || document.body).appendChild(d);
    return d;
  })();

  // Hide diag until we're done
  bracket?.classList.remove('is-visible');

  // DOM
  splash.innerHTML = `
    <div class="startseq__panel">
      <div class="startseq__inner">
        <pre class="startseq__pre startseq__pre--logo" id="ss-pre-logo"></pre>
        <pre class="startseq__pre startseq__caption"   id="ss-pre-cap"></pre>
        <pre class="startseq__log"                      id="ss-log"></pre>
      </div>
    </div>
  `;
  if (typeof CFG.introDimBg === 'number') {
    splash.style.background = `rgba(0,0,0,${CFG.introDimBg})`;
  }

  const elLogo = splash.querySelector('#ss-pre-logo');
  const elCap  = splash.querySelector('#ss-pre-cap');
  const elLog  = splash.querySelector('#ss-log');

  // Split ASCII: art (top) + caption (after first blank line)
  const all = Array.isArray(CFG.asciiLogo) ? CFG.asciiLogo.slice() : [];
  const blankIdx = all.findIndex(l => !String(l).trim());
  const art     = blankIdx >= 0 ? all.slice(0, blankIdx)     : all;
  const caption = blankIdx >= 0 ? all.slice(blankIdx + 1)    : [];

  // No interaction at all on a loading screen
  splash.style.pointerEvents = 'none';

  // Typing helpers
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  async function typeLines(el, lines) {
    for (const line of lines) {
      if (TYPE_MS === 0) { el.textContent += line + '\n'; continue; }
      for (let i = 0; i < line.length; i++) {
        el.textContent += line[i];
        await sleep(TYPE_MS);
      }
      el.textContent += '\n';
      await sleep(TYPE_MS * 2);
    }
  }

  // Run sequence
  (async function run() {
    await typeLines(elLogo, art);
    await typeLines(elCap, caption);
    await sleep(250);
    await typeLines(elLog, Array.isArray(CFG.bootScript) ? CFG.bootScript : []);
    await sleep(HOLD_MS);

    splash.classList.add('startseq--fadeout');
    // reveal diag right away; remove splash after fade
    bracket?.classList.add('is-visible');

    setTimeout(() => {
      splash.remove();
    }, 800);
  })();
})();
