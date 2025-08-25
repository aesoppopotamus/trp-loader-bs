/* --- TRP Node Overlay v2.2 (slow + map-bounded + red-kill) --- */
(function () {
  var CFG = {
    // Selector to bound the network to (try these in order if empty)
    mapTargetSel: '', // e.g. "#us-map-img" if you add id to your <image>
    fallbackInset: { top: 14, right: 16, bottom: 14, left: 16 }, // if map image not found

    // visuals
    count: 50,
    nodeSize: [2.2, 4.4],
    nodeOpacity: 0.85,
    linkOpacity: 0.32,
    linkChance: 0.12,
    maxLinksPerNode: 0,
    linkDash: [7, 12],

    // motion — SLOWER
    jitter: 0.4,
    pulsePeriod: [1600, 3200],
    driftSpeed: [2, 5],                 // px/sec toward waypoint
    retaskEvery: [10_000, 20_000],
    reseedLinksEvery: [18_000, 28_000],
    dashOffsetPerFrame: 0.06,

    // clustering
    clusterBias: 0.35,

    // alerts
    alertRatePerSec: 0.40,
    alertTTL: [1200, 2400],
    alertWeights: { yellow: 0.6, red: 0.025 },

    // --- NEW: destruction/respawn tuning ---
    killOnRed: true,                    // if a red ping occurs, destroy node
    killFxMs: 650,                      // explosion ring animation time
    respawnDelay: [3000, 5000],         // ms before a new node respawns
    boomRadius: [12, 24],               // target radius of the expanding ring
    boomStroke: 1.6                     // px width of the expanding ring
  };

  var COLORS = {
    yellow: cssVar('--alert-yellow', '#ffd166'),
    red:    cssVar('--alert-red',    '#ff6b6b')
  };

  function cssVar(name, fallback){
    var v = getComputedStyle(document.documentElement).getPropertyValue(name);
    v = (v || '').trim();
    return v || fallback;
  }
  function ns(tag){ return document.createElementNS('http://www.w3.org/2000/svg', tag); }
  function R(a,b){ return a + Math.random()*(b-a); }
  function RI(a,b){ return (R(a,b))|0; }
  function pick(arr){ return arr[(Math.random()*arr.length)|0]; }
  function clamp(v,a,b){ return v<a?a:v>b?b:v; }
  function chance(p){ return Math.random()<p; }
  function now(){ return performance.now(); }

  function boot() {
    var root = document.getElementById('diag-root');
    if (!root) return;
    var svg = root.querySelector('svg');
    if (!svg) return;

    var gLayer = ns('g'); gLayer.setAttribute('id','trp-node-layer'); svg.appendChild(gLayer);
    var defs = svg.querySelector('defs') || svg.insertBefore(ns('defs'), svg.firstChild);
    var clip = ns('clipPath'); var clipId = 'trp-node-clip';
    clip.setAttribute('id', clipId);
    var clipRect = ns('rect'); clip.appendChild(clipRect);
    defs.appendChild(clip);
    gLayer.setAttribute('clip-path', 'url(#'+clipId+')');

    var gLinks = ns('g'); gLinks.setAttribute('class','trp-links'); gLayer.appendChild(gLinks);
    var gNodes = ns('g'); gNodes.setAttribute('class','trp-nodes'); gLayer.appendChild(gNodes);
    var gFx    = ns('g'); gFx.setAttribute('class','trp-fx');     gLayer.appendChild(gFx); // explosions

    // --- map bounds (relative to SVG viewport) ---
    var bounds = { x:0, y:0, w:0, h:0 };
    function findMapElement() {
      if (CFG.mapTargetSel) return svg.querySelector(CFG.mapTargetSel);
      return svg.querySelector('#map-image, .map-image, image'); // common cases
    }
    function updateBoundsRect(){
      var sRect = svg.getBoundingClientRect();
      var target = findMapElement();
      if (target) {
        var tRect = target.getBoundingClientRect();
        var x = tRect.left - sRect.left;
        var y = tRect.top  - sRect.top;
        var w = tRect.width, h = tRect.height;
        var inPx = 6;
        bounds = { x: x+inPx, y: y+inPx, w: Math.max(0,w-2*inPx), h: Math.max(0,h-2*inPx) };
      } else {
        var W = sRect.width|0, H = sRect.height|0;
        var L = CFG.fallbackInset.left, T = CFG.fallbackInset.top, Rg=CFG.fallbackInset.right, B=CFG.fallbackInset.bottom;
        bounds = { x:L, y:T, w:Math.max(0, W-L-Rg), h:Math.max(0, H-T-B) };
      }
      clipRect.setAttribute('x', bounds.x);
      clipRect.setAttribute('y', bounds.y);
      clipRect.setAttribute('width', bounds.w);
      clipRect.setAttribute('height', bounds.h);
    }
    updateBoundsRect();

    function clampToBounds(x,y){
      return {
        x: clamp(x, bounds.x, bounds.x + bounds.w),
        y: clamp(y, bounds.y, bounds.y + bounds.h)
      };
    }
    function randomPointInBounds(){
      return {
        x: bounds.x + Math.random() * bounds.w,
        y: bounds.y + Math.random() * bounds.h
      };
    }

    // anchors (normalized 0..1)
    var anchors = (window.DIAG && window.DIAG.mapAnchors || [])
      .map(function(a){ return {x:('x' in a?a.x:0.5), y:('y' in a?a.y:0.5)}; });
    if (!anchors.length) anchors = [{x:0.5,y:0.5}];

    // build a node
    function makeNode(){
      var g = pick(anchors), bx=Math.random(), by=Math.random();
      var nx = CFG.clusterBias*g.x + (1-CFG.clusterBias)*bx;
      var ny = CFG.clusterBias*g.y + (1-CFG.clusterBias)*by;
      var p0 = { x: bounds.x + nx * bounds.w, y: bounds.y + ny * bounds.h };
      var rBase = R(CFG.nodeSize[0], CFG.nodeSize[1]);
      var drift = pickNewDrift(p0.x, p0.y);
      return {
        x: p0.x, y: p0.y,
        rBase: rBase, rNow: rBase,
        pulse: R(CFG.pulsePeriod[0], CFG.pulsePeriod[1]),
        t0: now() * R(0.5,1.5),
        dash: R(CFG.linkDash[0], CFG.linkDash[1]),
        links: [],
        drift: drift,
        retaskAt: now() + R(CFG.retaskEvery[0], CFG.retaskEvery[1]),
        alert: null,         // {color, until}
        dead: false          // flag for removal
      };
    }

    function pickNewDrift(x,y){
      var p = randomPointInBounds();
      var spd = R(CFG.driftSpeed[0], CFG.driftSpeed[1]); // px/s
      return { tx: p.x, ty: p.y, spd: spd };
    }

    // pools
    var nodes = Array.from({length: CFG.count}, makeNode);
    var linkEls = [];
    var nodeEls = nodes.map(mountNode);
    var booms = []; // [{el,start, dur, r0, r1}]

    // mount node SVG elements
    function mountNode(n){
      var c = ns('circle');
      c.setAttribute('cx', n.x.toFixed(2));
      c.setAttribute('cy', n.y.toFixed(2));
      c.setAttribute('r', n.rBase.toFixed(2));
      c.setAttribute('fill','currentColor');
      c.setAttribute('fill-opacity', String(CFG.nodeOpacity));
      c.setAttribute('class','trp-node');
      gNodes.appendChild(c);

      var ring = ns('circle');
      ring.setAttribute('cx', n.x.toFixed(2));
      ring.setAttribute('cy', n.y.toFixed(2));
      ring.setAttribute('r', (n.rBase+3).toFixed(2));
      ring.setAttribute('fill','none');
      ring.setAttribute('stroke','currentColor');
      ring.setAttribute('stroke-opacity','0.12');
      ring.setAttribute('stroke-width','1');
      ring.setAttribute('class','trp-node-ring');
      gNodes.appendChild(ring);

      return { n:n, c:c, ring:ring };
    }

    // links
    function reseedLinks(){
      gLinks.innerHTML = '';
      linkEls.length = 0;
      nodes.forEach(function(n){ n.links=[]; });
      nodes.forEach(function(a,i){
        if (a.dead) return;
        var made = 0;
        for (var j=i+1;j<nodes.length;j++){
          var b = nodes[j]; if (b.dead) continue;
          if (made>=CFG.maxLinksPerNode) break;
          if (Math.random()<CFG.linkChance){ a.links.push(b); made++; }
        }
      });
      nodes.forEach(function(a){
        a.links.forEach(function(b){
          var ln = ns('line');
          ln.setAttribute('stroke','currentColor');
          ln.setAttribute('stroke-width','1');
          ln.setAttribute('stroke-opacity', String(CFG.linkOpacity));
          ln.setAttribute('stroke-dasharray', a.dash+' '+a.dash);
          ln.setAttribute('vector-effect','non-scaling-stroke');
          gLinks.appendChild(ln);
          linkEls.push({ el: ln, a:a, b:b, off: R(0,a.dash) });
        });
      });
      nextReseedAt = now() + R(CFG.reseedLinksEvery[0], CFG.reseedLinksEvery[1]);
    }
    reseedLinks();
    var nextReseedAt = now() + R(CFG.reseedLinksEvery[0], CFG.reseedLinksEvery[1]);

    // alerts
    var lastTime = now();
    function maybeTriggerAlert(dt){
      var p = CFG.alertRatePerSec * (dt/1000);
      if (!chance(p)) return;
      var target = pick(nodeEls);
      if (!target || target.n.dead) return;
      var sev = Math.random() < CFG.alertWeights.yellow ? 'yellow' : 'red';
      target.n.alert = { color: sev, until: now() + R(CFG.alertTTL[0], CFG.alertTTL[1]) };
    }

    // explosion effect queue
    function queueBoom(x, y, color) {
      var boom = ns('circle');
      boom.setAttribute('cx', x.toFixed(2));
      boom.setAttribute('cy', y.toFixed(2));
      boom.setAttribute('r', '0.1');
      boom.setAttribute('fill', 'none');
      boom.setAttribute('stroke', color);
      boom.setAttribute('stroke-width', String(CFG.boomStroke));
      boom.setAttribute('stroke-opacity', '0.9');
      gFx.appendChild(boom);

      booms.push({
        el: boom,
        start: now(),
        dur: CFG.killFxMs,
        r0: 2,
        r1: R(CFG.boomRadius[0], CFG.boomRadius[1])
      });
    }

    function killNode(o){
      var n = o.n;
      if (n.dead) return;
      n.dead = true;

      // boom
      queueBoom(n.x, n.y, COLORS.red);

      // remove its SVG node visuals
      if (o.c && o.c.parentNode) o.c.parentNode.removeChild(o.c);
      if (o.ring && o.ring.parentNode) o.ring.parentNode.removeChild(o.ring);

      // purge links involving this node
      for (var i = linkEls.length - 1; i >= 0; i--) {
        var Lk = linkEls[i];
        if (Lk.a === n || Lk.b === n) {
          if (Lk.el.parentNode) Lk.el.parentNode.removeChild(Lk.el);
          linkEls.splice(i, 1);
        }
      }

      // remove from nodeEls pool
      var idx = nodeEls.indexOf(o);
      if (idx >= 0) nodeEls.splice(idx, 1);

      // schedule respawn + refresh links later
      setTimeout(function(){
        var fresh = makeNode();
        nodes.push(fresh);
        nodeEls.push(mountNode(fresh));
        reseedLinks();
      }, RI(CFG.respawnDelay[0], CFG.respawnDelay[1]));
    }

    // rAF loop (paused when tab hidden)
    function frame(t){
      if (document.hidden) { requestAnimationFrame(frame); return; }
      var dt = t - lastTime; if (dt<0) dt = 16; lastTime = t;

      if ((RI(0,1000) % 15) === 0) updateBoundsRect();
      maybeTriggerAlert(dt);

      // animate nodes
      for (var i=0;i<nodeEls.length;i++){
        var o = nodeEls[i], n=o.n;
        if (n.dead) continue;

        // retask / drift
        if (t >= n.retaskAt || dist2(n.x,n.y,n.drift.tx,n.drift.ty) < 9) {
          n.drift = pickNewDrift(n.x,n.y);
          n.retaskAt = t + R(CFG.retaskEvery[0], CFG.retaskEvery[1]);
        }

        var dx = n.drift.tx - n.x, dy = n.drift.ty - n.y;
        var len = Math.hypot(dx, dy) || 1;
        n.x += (dx/len) * (n.drift.spd * dt / 1000);
        n.y += (dy/len) * (n.drift.spd * dt / 1000);

        n.x += (Math.random()-0.5) * CFG.jitter * 0.08;
        n.y += (Math.random()-0.5) * CFG.jitter * 0.08;

        var cl = clampToBounds(n.x, n.y); n.x = cl.x; n.y = cl.y;

        // pulse
        var tt = ((t - n.t0) % n.pulse) / n.pulse;
        var pPulse = Math.sin(tt*Math.PI);
        n.rNow = n.rBase + pPulse*1.0;

        // alert -> color & blink
        var fillColor = null;
        if (n.alert) {
          if (t >= n.alert.until) {
            // resolve alert
            if (CFG.killOnRed && n.alert.color === 'red') {
              killNode(o);
              // skip drawing this frame; it's gone
              continue;
            }
            n.alert = null;
          } else {
            fillColor = (n.alert.color === 'red') ? COLORS.red : COLORS.yellow;
            var blink = (Math.sin(t*0.02) * 0.5 + 0.5) * 0.55 + 0.45; // 0.45..1.0
            o.c.setAttribute('fill-opacity', blink.toFixed(2));
            o.ring.setAttribute('stroke-opacity', (0.26*blink).toFixed(2));
          }
        }
        if (!n.alert) {
          o.c.setAttribute('fill-opacity', String(CFG.nodeOpacity));
          o.ring.setAttribute('stroke-opacity', '0.12');
        }

        // commit node attrs
        o.c.setAttribute('cx', n.x.toFixed(2));
        o.c.setAttribute('cy', n.y.toFixed(2));
        o.c.setAttribute('r', n.rNow.toFixed(2));
        if (fillColor) o.c.setAttribute('fill', fillColor); else o.c.setAttribute('fill','currentColor');

        o.ring.setAttribute('cx', n.x.toFixed(2));
        o.ring.setAttribute('cy', n.y.toFixed(2));
        o.ring.setAttribute('r', (n.rBase + 2.6 + Math.sin((t - n.t0)*0.0028)).toFixed(2));
      }

      // follow links & slow dash “traffic”
      for (var k=0;k<linkEls.length;k++){
        var Lk = linkEls[k];
        if (Lk.a.dead || Lk.b.dead) continue; // quietly skip removed ones
        Lk.el.setAttribute('x1', Lk.a.x.toFixed(2));
        Lk.el.setAttribute('y1', Lk.a.y.toFixed(2));
        Lk.el.setAttribute('x2', Lk.b.x.toFixed(2));
        Lk.el.setAttribute('y2', Lk.b.y.toFixed(2));
        Lk.off += CFG.dashOffsetPerFrame;
        Lk.el.setAttribute('stroke-dashoffset', Lk.off.toFixed(2));
      }

      // animate booms
      for (var b = booms.length - 1; b >= 0; b--) {
        var fx = booms[b];
        var tRel = (t - fx.start) / fx.dur;
        if (tRel >= 1) {
          if (fx.el.parentNode) fx.el.parentNode.removeChild(fx.el);
          booms.splice(b, 1);
          continue;
        }
        var r = fx.r0 + (fx.r1 - fx.r0) * tRel;
        var alpha = 0.9 * (1 - tRel);
        fx.el.setAttribute('r', r.toFixed(2));
        fx.el.setAttribute('stroke-opacity', alpha.toFixed(2));
      }

      if (t >= nextReseedAt) reseedLinks();
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    setInterval(updateBoundsRect, 400);

    function dist2(x1,y1,x2,y2){ var dx=x1-x2, dy=y1-y2; return dx*dx+dy*dy; }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(boot,200); });
  } else {
    setTimeout(boot,200);
  }
})();
