/* --- TRP TACMAP Node Overlay (map-bounded + slow drift + red-kill + events) ---
   Attaches ONLY to the MAP SVG (#map-svg) and clips nodes to the map image (#map-image).
   Emits:
     - TRP_NODE_ALERT  { color: 'yellow' }
     - TRP_NODE_KILL   { x, y }
*/
(function () {
  // ------- CONFIG (reads window.TACMAP, with sane defaults you can override) -------
  var MAPCFG = Object.assign({
    targetId: "map-svg",
    imageSel: "#map-image, .map-image, image",
    count: 40,
    clusterBias: 0.3,
    nodeSize: [2.5, 5.0],
    nodeOpacity: 0.85,
    linkChance: 0.12,
    maxLinksPerNode: 0,
    linkOpacity: 0.32,
    linkDash: [7, 12],
    jitter: 0.4,
    driftSpeed: [2, 5],
    retaskEvery: [10_000, 20_000],
    reseedLinksEvery: [18_000, 28_000],
    alertRatePerSec: 0.4,
    alertTTL: [1200, 2400],
    alertWeights: { yellow: 0.6, red: 0.025 },
    killOnRed: true,
    killFxMs: 650,
    respawnDelay: [3000, 5000],
    boomRadius: [12, 24],
    boomStroke: 1.6,
    dashOffsetPerFrame: 0.06,
    pulsePeriod: [1600, 3200],
    fallbackInset: { top: 14, right: 16, bottom: 14, left: 14 },
    anchors: []
  }, window.TACMAP || {});

  // ------- Utilities -------
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

  var COLORS = {
    yellow: cssVar('--alert-yellow', '#ffd166'),
    red:    cssVar('--alert-red',    '#ff6b6b')
  };

  function boot() {
    // ----- HARD LOCK to MAP SVG -----
    var svg = document.getElementById(MAPCFG.targetId);
    if (!svg) return;

    // Create overlay group + defs/clip
    var gLayer = ns('g'); gLayer.setAttribute('id','tacmap-node-layer'); svg.appendChild(gLayer);
    var defs = svg.querySelector('defs') || svg.insertBefore(ns('defs'), svg.firstChild);
    var clip = ns('clipPath'); var clipId = 'tacmap-node-clip';
    clip.setAttribute('id', clipId);
    var clipRect = ns('rect'); clip.appendChild(clipRect);
    defs.appendChild(clip);
    gLayer.setAttribute('clip-path', 'url(#'+clipId+')');

    var gLinks = ns('g'); gLinks.setAttribute('class','trp-links'); gLayer.appendChild(gLinks);
    var gNodes = ns('g'); gNodes.setAttribute('class','trp-nodes'); gLayer.appendChild(gNodes);
    var gFx    = ns('g'); gFx.setAttribute('class','trp-fx');     gLayer.appendChild(gFx);

    // --- Bounds (in SVG user units) ---
    var bounds = { x:0, y:0, w:0, h:0 };

    // Convert a client (screen) point to SVG user units
    function clientToSvg(svgEl, x, y) {
      var pt = svgEl.createSVGPoint();
      pt.x = x; pt.y = y;
      var m = svgEl.getScreenCTM();
      return pt.matrixTransform(m.inverse());
    }

    // Get <image> box in SVG units (falls back to viewBox)
    function updateBoundsRect() {
      var img = svg.querySelector(MAPCFG.imageSel);
      if (img) {
        var r = img.getBoundingClientRect();
        var p1 = clientToSvg(svg, r.left,  r.top);
        var p2 = clientToSvg(svg, r.right, r.bottom);
        var inset = 6;
        var x = Math.min(p1.x, p2.x) + inset;
        var y = Math.min(p1.y, p2.y) + inset;
        var w = Math.abs(p2.x - p1.x) - inset*2;
        var h = Math.abs(p2.y - p1.y) - inset*2;
        bounds = { x:x, y:y, w:Math.max(0,w), h:Math.max(0,h) };
      } else {
        var vb = svg.viewBox.baseVal || { x:0, y:0, width:svg.width.baseVal.value, height:svg.height.baseVal.value };
        var fi = MAPCFG.fallbackInset;
        bounds = { x: vb.x + fi.left, y: vb.y + fi.top,
                   w: Math.max(0, vb.width  - fi.left - fi.right),
                   h: Math.max(0, vb.height - fi.top  - fi.bottom) };
      }
      clipRect.setAttribute("x", bounds.x);
      clipRect.setAttribute("y", bounds.y);
      clipRect.setAttribute("width", bounds.w);
      clipRect.setAttribute("height", bounds.h);
    }

    function clampToBounds(x,y){
      return {
        x: clamp(x, bounds.x, bounds.x + bounds.w),
        y: clamp(y, bounds.y, bounds.y + bounds.h)
      };
    }
    function randomPointInBounds(){
      return { x: bounds.x + Math.random()*bounds.w,
               y: bounds.y + Math.random()*bounds.h };
    }

    updateBoundsRect();
    window.addEventListener('resize', updateBoundsRect);
    setInterval(updateBoundsRect, 400);

    // Anchors (normalized 0..1) from window.TACMAP.anchors
    var anchors = (MAPCFG.anchors && MAPCFG.anchors.length ? MAPCFG.anchors : [{x:0.5,y:0.5}]);

    // Node factory
    function makeNode(){
      var g = pick(anchors), bx=Math.random(), by=Math.random();
      var nx = MAPCFG.clusterBias*g.x + (1-MAPCFG.clusterBias)*bx;
      var ny = MAPCFG.clusterBias*g.y + (1-MAPCFG.clusterBias)*by;
      var p0 = { x: bounds.x + nx * bounds.w, y: bounds.y + ny * bounds.h };
      var rBase = R(MAPCFG.nodeSize[0], MAPCFG.nodeSize[1]);
      var drift = pickNewDrift(p0.x, p0.y);
      return {
        x: p0.x, y: p0.y,
        rBase: rBase, rNow: rBase,
        pulse: R(MAPCFG.pulsePeriod[0], MAPCFG.pulsePeriod[1]),
        t0: now() * R(0.5,1.5),
        dash: R(MAPCFG.linkDash[0], MAPCFG.linkDash[1]),
        links: [],
        drift: drift,
        retaskAt: now() + R(MAPCFG.retaskEvery[0], MAPCFG.retaskEvery[1]),
        alert: null,
        dead: false
      };
    }
    function pickNewDrift(x,y){
      var p = randomPointInBounds();
      var spd = R(MAPCFG.driftSpeed[0], MAPCFG.driftSpeed[1]); // px/s in user units
      return { tx: p.x, ty: p.y, spd: spd };
    }

    // Pools
    var nodes = Array.from({length: MAPCFG.count}, makeNode);
    var linkEls = [];
    var nodeEls = nodes.map(mountNode);
    var booms = []; // [{el,start,dur,r0,r1}]

    function mountNode(n){
      var c = ns('circle');
      c.setAttribute('cx', n.x.toFixed(2));
      c.setAttribute('cy', n.y.toFixed(2));
      c.setAttribute('r', n.rBase.toFixed(2));
      c.setAttribute('fill','currentColor');
      c.setAttribute('fill-opacity', String(MAPCFG.nodeOpacity));
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

    // Links
    function reseedLinks(){
      gLinks.innerHTML = '';
      linkEls.length = 0;
      nodes.forEach(function(n){ n.links=[]; });
      nodes.forEach(function(a,i){
        if (a.dead) return;
        var made = 0;
        for (var j=i+1;j<nodes.length;j++){
          var b = nodes[j]; if (b.dead) continue;
          if (made>=MAPCFG.maxLinksPerNode) break;
          if (Math.random()<MAPCFG.linkChance){ a.links.push(b); made++; }
        }
      });
      nodes.forEach(function(a){
        a.links.forEach(function(b){
          var ln = ns('line');
          ln.setAttribute('stroke','currentColor');
          ln.setAttribute('stroke-width','1');
          ln.setAttribute('stroke-opacity', String(MAPCFG.linkOpacity));
          ln.setAttribute('stroke-dasharray', a.dash+' '+a.dash);
          ln.setAttribute('vector-effect','non-scaling-stroke');
          gLinks.appendChild(ln);
          linkEls.push({ el: ln, a:a, b:b, off: R(0,a.dash) });
        });
      });
      nextReseedAt = now() + R(MAPCFG.reseedLinksEvery[0], MAPCFG.reseedLinksEvery[1]);
    }
    reseedLinks();
    var nextReseedAt = now() + R(MAPCFG.reseedLinksEvery[0], MAPCFG.reseedLinksEvery[1]);

    // Alerts
    var lastTime = now();
    function maybeTriggerAlert(dt){
      var p = MAPCFG.alertRatePerSec * (dt/1000);
      if (!chance(p)) return;
      var target = pick(nodeEls);
      if (!target || target.n.dead) return;
      var sev = Math.random() < MAPCFG.alertWeights.yellow ? 'yellow' : 'red';
      target.n.alert = { color: sev, until: now() + R(MAPCFG.alertTTL[0], MAPCFG.alertTTL[1]) };

      // Emit alert event (yellow or red)
      window.dispatchEvent(new CustomEvent('TRP_NODE_ALERT', { detail: { color: sev } }));
    }

    // Effects
    function queueBoom(x, y, color) {
      var boom = ns('circle');
      boom.setAttribute('cx', x.toFixed(2));
      boom.setAttribute('cy', y.toFixed(2));
      boom.setAttribute('r', '0.1');
      boom.setAttribute('fill', 'none');
      boom.setAttribute('stroke', color);
      boom.setAttribute('stroke-width', String(MAPCFG.boomStroke));
      boom.setAttribute('stroke-opacity', '0.9');
      gFx.appendChild(boom);
// brief inner white flash for critical red kills
    if (color === COLORS.red) {
      var flash = ns('circle');
      flash.setAttribute('cx', x.toFixed(2));
      flash.setAttribute('cy', y.toFixed(2));
      flash.setAttribute('r', '2');
      flash.setAttribute('fill', '#ffffff');
      flash.setAttribute('fill-opacity', '0.9');
      gFx.appendChild(flash);
      setTimeout(function(){
        if (flash.parentNode) flash.parentNode.removeChild(flash);
      }, 120);
    }

      booms.push({
        el: boom,
        start: now(),
        dur: MAPCFG.killFxMs,
        r0: 2,
        r1: R(MAPCFG.boomRadius[0], MAPCFG.boomRadius[1])

        
      });
    }

    function killNode(o){
      var n = o.n;
      if (n.dead) return;
      n.dead = true;

      // FX ring
      queueBoom(n.x, n.y, COLORS.red);

      // Emit kill event (for diagnostics counters)
      window.dispatchEvent(new CustomEvent('TRP_NODE_KILL', { detail: { x: n.x, y: n.y } }));

      // Remove visuals
      if (o.c && o.c.parentNode) o.c.parentNode.removeChild(o.c);
      if (o.ring && o.ring.parentNode) o.ring.parentNode.removeChild(o.ring);

      // Purge links that touch this node
      for (var i = linkEls.length - 1; i >= 0; i--) {
        var Lk = linkEls[i];
        if (Lk.a === n || Lk.b === n) {
          if (Lk.el.parentNode) Lk.el.parentNode.removeChild(Lk.el);
          linkEls.splice(i, 1);
        }
      }

      // Remove from pool
      var idx = nodeEls.indexOf(o);
      if (idx >= 0) nodeEls.splice(idx, 1);

      // Respawn later + reseed links
      setTimeout(function(){
        var fresh = makeNode();
        nodes.push(fresh);
        nodeEls.push(mountNode(fresh));
        reseedLinks();
      }, RI(MAPCFG.respawnDelay[0], MAPCFG.respawnDelay[1]));
    }

    // RAF loop
    function frame(t){
      if (document.hidden) { requestAnimationFrame(frame); return; }
      var dt = t - lastTime; if (dt<0) dt = 16; lastTime = t;

      if ((RI(0,1000) % 15) === 0) updateBoundsRect();
      maybeTriggerAlert(dt);

      // Animate nodes
      for (var i=0;i<nodeEls.length;i++){
        var o = nodeEls[i], n=o.n;
        if (n.dead) continue;

        // Retask/drift
        if (t >= n.retaskAt || dist2(n.x,n.y,n.drift.tx,n.drift.ty) < 9) {
          n.drift = pickNewDrift(n.x,n.y);
          n.retaskAt = t + R(MAPCFG.retaskEvery[0], MAPCFG.retaskEvery[1]);
        }

        var dx = n.drift.tx - n.x, dy = n.drift.ty - n.y;
        var len = Math.hypot(dx, dy) || 1;
        n.x += (dx/len) * (n.drift.spd * dt / 1000);
        n.y += (dy/len) * (n.drift.spd * dt / 1000);
        n.x += (Math.random()-0.5) * MAPCFG.jitter * 0.08;
        n.y += (Math.random()-0.5) * MAPCFG.jitter * 0.08;

        var cl = clampToBounds(n.x, n.y); n.x = cl.x; n.y = cl.y;

        // Pulse
        var tt = ((t - n.t0) % n.pulse) / n.pulse;
        var pPulse = Math.sin(tt*Math.PI);
        n.rNow = n.rBase + pPulse*1.0;

        // Alert color/blink (STRONGER)
        var fillColor = null;
        if (n.alert) {
          if (t >= n.alert.until) {
            if (MAPCFG.killOnRed && n.alert.color === 'red') {
              killNode(o);
              continue; // killed this frame
            }
            n.alert = null;
            // clear classes when alert ends
            o.c.classList.remove('alert-yellow','alert-red');
            o.ring.classList.remove('alert-yellow','alert-red');
          } else {
            // pick fill color and classes
            var isRed = (n.alert.color === 'red');
            fillColor = isRed ? COLORS.red : COLORS.yellow;
        
            // add CSS classes for big neon glow
            o.c.classList.toggle('alert-yellow', !isRed);
            o.c.classList.toggle('alert-red', isRed);
            o.ring.classList.toggle('alert-yellow', !isRed);
            o.ring.classList.toggle('alert-red', isRed);
        
            // stronger blink range (0.78..1.0 instead of 0.45..1.0)
            var blink = (Math.sin(t * 0.024) * 0.11) + 0.89; // 0.78..1.0 after clamping
            o.c.setAttribute('fill-opacity', blink.toFixed(2));
            o.ring.setAttribute('stroke-opacity', (0.30 + 0.30*(blink-0.78)/0.22).toFixed(2)); // ~0.30..0.60
        
            // slight pulse scale on alert
            o.c.setAttribute('r', (n.rNow * (isRed ? 1.15 : 1.08)).toFixed(2));
          }
        }
        if (!n.alert) {
          // baseline look when no alert
          o.c.setAttribute('fill-opacity', String(MAPCFG.nodeOpacity));
          o.ring.setAttribute('stroke-opacity', '0.12');
          o.c.classList.remove('alert-yellow','alert-red');
          o.ring.classList.remove('alert-yellow','alert-red');
        }


        // Commit
        o.c.setAttribute('cx', n.x.toFixed(2));
        o.c.setAttribute('cy', n.y.toFixed(2));
        o.c.setAttribute('r', n.rNow.toFixed(2));
        if (fillColor) o.c.setAttribute('fill', fillColor); else o.c.setAttribute('fill','currentColor');

        o.ring.setAttribute('cx', n.x.toFixed(2));
        o.ring.setAttribute('cy', n.y.toFixed(2));
        o.ring.setAttribute('r', (n.rBase + 2.6 + Math.sin((t - n.t0)*0.0028)).toFixed(2));
      }

      // Links follow nodes + slow dash traffic
      for (var k=0;k<linkEls.length;k++){
        var Lk = linkEls[k];
        if (Lk.a.dead || Lk.b.dead) continue;
        Lk.el.setAttribute('x1', Lk.a.x.toFixed(2));
        Lk.el.setAttribute('y1', Lk.a.y.toFixed(2));
        Lk.el.setAttribute('x2', Lk.b.x.toFixed(2));
        Lk.el.setAttribute('y2', Lk.b.y.toFixed(2));
        Lk.off += MAPCFG.dashOffsetPerFrame;
        Lk.el.setAttribute('stroke-dashoffset', Lk.off.toFixed(2));
      }

      // FX rings
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

    function dist2(x1,y1,x2,y2){ var dx=x1-x2, dy=y1-y2; return dx*dx+dy*dy; }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(boot,200); });
  } else {
    setTimeout(boot,200);
  }
})();
