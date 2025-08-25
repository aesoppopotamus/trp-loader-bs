// js/dosBoot.js
(function () {
  // --- read config
  const CFG = window.DOS || {};
  const seed = CFG.seed ?? null;
  const LPS = Number(CFG.linesPerSecond ?? 18);
  const BANNER_P = Number(CFG.bannerChance ?? 0.15);
  const BLOCK_P  = Number(CFG.blockChance  ?? 0.12);
  let   lineNo   = Number(CFG.startLine    ?? 3100);

  const BANNERS = Array.isArray(CFG.banners) ? CFG.banners.slice() : [];
  const BLOCKS  = Array.isArray(CFG.labeledBlocks) ? CFG.labeledBlocks.slice() : [];

  const srcKeys = CFG.sources || {};
  const ADDR = window[srcKeys.addressesKey || "addresses"]   || [];
  const INST = window[srcKeys.instructionsKey || "instructions"] || [];
  const REGS = window[srcKeys.registersKey || "registers"]   || [];

  // --- utils 
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  function makeRng(s) {
    if (s == null) return Math.random;
    let t = (s >>> 0) + 0x6D2B79F5;
    return function () {
      t += 0x6D2B79F5;
      let x = Math.imul(t ^ (t >>> 15), 1 | t);
      x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rng = makeRng(seed);

  function rand(arr) { return arr[(rng() * arr.length) | 0]; }

  function shuffle(a) {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) {
      const j = (rng() * (i + 1)) | 0;
      [r[i], r[j]] = [r[j], r[i]];
    }
    return r;
  }

  function makeRingAppender(container, max) {
    const pool = [];
    return function appendLine(n, ...parts) {
      let opts = {};
      if (parts.length && typeof parts[parts.length - 1] === "object" && parts[parts.length - 1] !== null) {
        opts = parts.pop();
      }
      let node;
      if (pool.length < max) {
        node = document.createElement("div");
        node.className = "assembly-line";
        node.appendChild(document.createElement("span")); // number
        container.appendChild(node);
        pool.push(node);
      }
      node = pool.shift();
      node.className = "assembly-line" + (opts.className ? " " + opts.className : "");

      while (node.children.length < parts.length + 1) node.appendChild(document.createElement("span"));

      node.children[0].textContent = String(n);
      for (let i = 0; i < parts.length; i++) node.children[i + 1].textContent = parts[i];
      for (let j = parts.length + 1; j < node.children.length; j++) node.children[j].textContent = "";

      container.appendChild(node);
      pool.push(node);
    };
  }

  function estimateRows(container) {
    const probe = document.createElement("div");
    probe.className = "assembly-line";
    probe.innerHTML = "<span>3137</span><span>0x00ABCDEF</span><span>JMP 0xC0FFEEDE</span>";
    container.appendChild(probe);
    const h = Math.max(10, probe.offsetHeight);
    container.removeChild(probe);
    return Math.ceil(container.clientHeight / h);
  }

  // --- generators 
  function randomAsm() {
    if (!ADDR.length || !INST.length || !REGS.length) {
      // fallback line if sources are missing
      return { address: "0x00000000", instr: "NOP" };
    }
    return { address: rand(ADDR), instr: `${rand(INST)} ${rand(REGS)}` };
  }

  function appendBanner(append) {
    append(lineNo++, "--------------------");
  }

  function appendBlock(append) {
    const b = BLOCKS.length ? rand(BLOCKS) : { label: "BLOCK", lines: [ "..." ] };
    append(lineNo++, b.label);
    append(lineNo++, "--------------------");
    for (const l of b.lines) append(lineNo++, `> ${l}`, { className: "indented" });
    append(lineNo++, "--------------------");
  }

  function appendAsm(append) {
    const { address, instr } = randomAsm();
    append(lineNo++, address, instr);
  }

  function prefill(container, append, count) {
    // seed the screen with a mix of lines so it looks “already booting”
    const banners = shuffle(BANNERS);
    let bi = 0;
    while (count-- > 0) {
      const pick = rng();
      if (pick < 0.15) {
        append(lineNo++, banners[bi++ % Math.max(1, banners.length)] || "--------------------");
      } else if (pick < 0.15 + (BLOCK_P || 0.12)) {
        appendBlock(append);
      } else {
        appendAsm(append);
      }
    }
  }

  // --- main -----------------------------------------------------------------
  async function runBoot() {
    const root = document.getElementById("boot-feed"); // make sure this exists in HTML
    if (!root) return;

    const rowsOnScreen = estimateRows(root);
    const append = makeRingAppender(root, rowsOnScreen + 16);

    prefill(root, append, rowsOnScreen);

    const intervalMs = Math.max(16, 1000 / Math.max(1, LPS));
    while (true) {
      const p = rng();
      if (p < BANNER_P) appendBanner(append);
      else if (p < BANNER_P + BLOCK_P) appendBlock(append);
      else appendAsm(append);
      await sleep(intervalMs);
    }
  }

  document.addEventListener("DOMContentLoaded", runBoot);
})();
