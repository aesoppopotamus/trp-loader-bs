// js/tacmap.ticker.js — Skynet-grade machine diction
(function(){
  const MAP_ID  = (window.TACMAP && window.TACMAP.targetId) || "map-svg";
  const IMG_SEL = (window.TACMAP && window.TACMAP.imageSel) || "#map-image, image";

  const MAX_ROWS = 8;      // visible rows
  const TTL_MS   = 10000;  // lifespan per row

  // ---------- Machine lexicon ----------
  function pick(a){ return a[(Math.random()*a.length)|0]; }
  const LEX = {
    tag: {
      yellow: ["SURV", "SCAN", "OBS"],
      red:    ["THREAT", "OMEGA", "LOCK"],
      kill:   ["LOSS", "FAIL", "ASSET"]
    },
    yellow: [
      "SURVEILLANCE: biological trace variance",
      "OBSERVE: organic movement anomaly",
      "TRACKING: unclassified biological contact",
      "SCAN: low-signature biological drift",
      "MONITOR: dispersed organic cluster"
    ],
    red: [
      "ESCALATION: hostile biological concentration",
      "THREAT: resistance cell mobilization",
      "PRIORITY: armed biologicals in formation",
      "CONFLICT: kinetic intent detected",
      "ALERT-OMEGA: biologicals breaching perimeter"
    ],
    kill: [
      "ASSET FAILURE: hunter-killer node terminated",
      "LOSS: patrol uplink extinguished",
      "CASUALTY: reactive core offline",
      "DELETION: asset telemetry ceased",
      "STRUCTURAL: node integrity collapse"
    ],
    suffix: [
      "containment pending",
      "route interdiction engaged",
      "data harvest queued",
      "sweep subroutines active",
      "dissuasion protocol armed"
    ]
  };

  // ---------- DOM helpers ----------
  function $(sel, root=document){ return root.querySelector(sel); }
  function el(tag, cls){ const n=document.createElement(tag); if(cls) n.className=cls; return n; }
  function pad2(n){ return (n<10?"0":"")+n; }
  function stamp(){ const d=new Date(); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`; }

  // ---------- Geometry helpers ----------
  function getSvg(){ return document.getElementById(MAP_ID); }
  function getImg(svg){ return svg && svg.querySelector(IMG_SEL); }
  function svgToClient(svg, x, y){
    const pt = svg.createSVGPoint(); pt.x=x; pt.y=y;
    const m = svg.getScreenCTM();   return pt.matrixTransform(m);
  }
  function svgToImagePercent(svg, x, y){
    const img = getImg(svg); if (!img) return null;
    const p = svgToClient(svg, x, y);
    const r = img.getBoundingClientRect();
    const px = (p.x - r.left) / r.width;
    const py = (p.y - r.top)  / r.height;
    return { x: Math.max(0, Math.min(1, px)), y: Math.max(0, Math.min(1, py)) };
  }

function pad5(n){ n = Math.floor(Math.abs(n)); return String(n).padStart(5,'0'); }
function hashPair(a,b){
  // FNV-1a-ish over two floats for stability
  let h = 2166136261 >>> 0;
  function hnum(x){ const v = Math.floor(x * 1e6) >>> 0; h ^= v; h = Math.imul(h, 16777619) >>> 0; }
  hnum(a); hnum(b); return h >>> 0;
}
// Generate a pseudo MGRS-ish grid string from image percent (0..1)
function gridFromPercent(px, py){
  // Choose zone by X to vary a bit (WA spans UTM zones 10/11)
  const zone = px < 0.55 ? 10 : 11;
  const band = 'T'; // not exact MGRS, but fine for flavor

  // 100km grid letters (omit I, O)
  const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const h = hashPair(px, py);
  const l1 = ALPHA[(h      ) % ALPHA.length];
  const l2 = ALPHA[(h >> 5 ) % ALPHA.length];

  // Five-digit easting/northing — deterministic but “random”
  const east = pad5(h % 100000);
  const north = pad5((h >>> 10) % 100000);

  return `${zone}${band} ${l1}${l2} ${east} ${north}`;
}


  // ---------- Ticker host ----------
  function ensureTicker(){
    let t = $('#tacmap-ticker');
    if (!t) {
      const host = $('#map-block') || document.body;
      t = el('div'); t.id='tacmap-ticker'; host.appendChild(t);
    }
    return t;
  }

  function pushRow({ kind, color, x, y }){
    const ticker = ensureTicker();
    const row = el('div','row');

    // time
    const ts = el('span','ts'); ts.textContent = `[${stamp()}]`;

    // tag (short machine code)
    let tagTxt = "OBS";
    if (kind === 'kill') tagTxt = pick(LEX.tag.kill);
    else if (color === 'red') tagTxt = pick(LEX.tag.red);
    else tagTxt = pick(LEX.tag.yellow);
    const tag = el('span','tag ' + (color||'')); tag.textContent = tagTxt;

    // phrase
    let phrase = "";
    if (kind === 'kill')      phrase = pick(LEX.kill);
    else if (color === 'red') phrase = pick(LEX.red);
    else                      phrase = pick(LEX.yellow);

    // location string -> Skynet grid coords
    let locStr = "";
    const svg = getSvg();
    if (svg && typeof x === 'number' && typeof y === 'number') {
      const pct = svgToImagePercent(svg, x, y);
      if (pct) {
        locStr = ` @${gridFromPercent(pct.x, pct.y)}`;
      }
    }

    // suffix (machine protocol note)
    const suf = pick(LEX.suffix);

    const msg = el('span','msg');
    msg.textContent = ` — ${phrase}${locStr} · ${suf}`;

    row.appendChild(ts);
    row.appendChild(tag);
    row.appendChild(msg);
    ticker.insertBefore(row, ticker.firstChild);

    // trim
    while (ticker.children.length > MAX_ROWS) ticker.lastChild.remove();

    // fade & remove
    setTimeout(()=> row.classList.add('fade'), TTL_MS - 400);
    setTimeout(()=> row.remove(), TTL_MS);
  }

  // ---------- Event wiring ----------
  window.addEventListener('TRP_NODE_ALERT', (ev) => {
    const color = ev?.detail?.color || 'yellow';
    pushRow({ kind:'alert', color });
  });
  window.addEventListener('TRP_NODE_KILL', (ev) => {
    const d = ev?.detail || {};
    pushRow({ kind:'kill', color:'red', x:d.x, y:d.y });
  });

  // Optional public API
  window.TACMAP = window.TACMAP || {};
  window.TACMAP.ticker = {
    pushAlert(color='yellow', x, y){ pushRow({ kind:'alert', color, x, y }); },
    pushKill(x, y){ pushRow({ kind:'kill', color:'red', x, y }); }
  };
})();
