// js/loading.js — music + headings + start cursor typer
(function () {
  function getParams() {
    const p = new URLSearchParams(location.search);
    const o = {};
    p.forEach((v, k) => o[k] = v);
    return o;
  }

  function renderScanText() {
    const cfg = window.UI || {};
    const list = Array.isArray(cfg.scanText) ? cfg.scanText : [];
    const cls  = cfg.scanTextClass || "scan-text";
    const host = document.getElementById("top-right");
    if (!host) return;

    host.innerHTML = "";
    for (const item of list) {
      const tag = (item.tag || "h3").toLowerCase();
      const el  = document.createElement(tag);
      el.className = cls + " " + (item.className || "");
      el.textContent = item.text || "";
      host.appendChild(el);
    }
  }

  function initMusic() {
    const music = document.getElementById('background-music');
    const btn   = document.getElementById('play-music');
    if (!music || !btn) return;

    function autoPlay() {
      music.volume = 0.5;
      music.play().then(() => {
        btn.style.display = "none";
      }).catch(() => {
        btn.style.display = "block";
      });
    }
    btn.addEventListener('click', () => { music.play(); btn.style.display = "none"; });
    // Try autoplay
    autoPlay();

    const p = getParams();
    if (p.mute) {
      music.muted = true;
      btn.style.display = "none";
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderScanText();
    initMusic();

    // Kick off the console typer
    if (typeof window.runCursorTyperFromConfig === "function") {
      window.runCursorTyperFromConfig();
    }
  });
})();
