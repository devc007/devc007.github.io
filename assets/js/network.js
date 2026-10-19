/* Hero background: a drifting "cluster" of nodes. Nearby nodes link up and
   glowing packets hop between them, like traffic through a gateway.
   Pauses when the hero is off screen or the tab is hidden. */
(() => {
  'use strict';
  const canvas = document.getElementById('network');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const LIME = '198,255,61';
  const CYAN = '61,224,255';
  const MOUSE_R = 190;

  let W = 0, H = 0, dpr = 1;
  let nodes = [];
  let packets = [];
  let linkDist = 150;
  let raf = 0, last = 0, visible = true;
  const mouse = { x: -1e4, y: -1e4 };

  function build() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width;
    H = rect.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    linkDist = Math.max(110, Math.min(165, W / 9));
    const count = Math.round(Math.min(105, Math.max(34, (W * H) / 15500)));
    nodes = Array.from({ length: count }, () => {
      const hub = Math.random() < 0.1;
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.24,
        vy: (Math.random() - 0.5) * 0.24,
        r: hub ? 2.3 : 1.1 + Math.random() * 0.7,
        hub,
      };
    });
    packets = [];
  }

  function neighbours(i) {
    const a = nodes[i];
    const out = [];
    const max = linkDist * linkDist;
    for (let j = 0; j < nodes.length; j++) {
      if (j === i) continue;
      const dx = a.x - nodes[j].x, dy = a.y - nodes[j].y;
      if (dx * dx + dy * dy < max) out.push(j);
    }
    return out;
  }

  function spawn() {
    const from = Math.floor(Math.random() * nodes.length);
    const nb = neighbours(from);
    if (!nb.length) return;
    packets.push({
      from,
      to: nb[Math.floor(Math.random() * nb.length)],
      t: 0,
      speed: 0.011 + Math.random() * 0.012,
      hops: 3 + Math.floor(Math.random() * 5),
      color: Math.random() < 0.62 ? LIME : CYAN,
    });
  }

  function step(dt) {
    for (const n of nodes) {
      n.x += n.vx * dt;
      n.y += n.vy * dt;
      if (n.x < -30) n.x = W + 30; else if (n.x > W + 30) n.x = -30;
      if (n.y < -30) n.y = H + 30; else if (n.y > H + 30) n.y = -30;
      const dx = n.x - mouse.x, dy = n.y - mouse.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < MOUSE_R * MOUSE_R && d2 > 1) {
        const d = Math.sqrt(d2);
        const f = (1 - d / MOUSE_R) * 0.55;
        n.x += (dx / d) * f * dt;
        n.y += (dy / d) * f * dt;
      }
    }
    if (packets.length < 10 && Math.random() < 0.07 * dt) spawn();
    for (let k = packets.length - 1; k >= 0; k--) {
      const p = packets[k];
      p.t += p.speed * dt;
      if (p.t < 1) continue;
      p.hops -= 1;
      const nb = neighbours(p.to).filter((j) => j !== p.from);
      if (p.hops <= 0 || !nb.length) { packets.splice(k, 1); continue; }
      p.from = p.to;
      p.to = nb[Math.floor(Math.random() * nb.length)];
      p.t = 0;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const max = linkDist * linkDist;
    ctx.lineWidth = 1;

    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 >= max) continue;
        ctx.strokeStyle = `rgba(190,205,230,${((1 - d2 / max) * 0.15).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      const mx = a.x - mouse.x, my = a.y - mouse.y;
      const md2 = mx * mx + my * my;
      if (md2 < MOUSE_R * MOUSE_R * 1.3) {
        ctx.strokeStyle = `rgba(${LIME},${((1 - md2 / (MOUSE_R * MOUSE_R * 1.3)) * 0.3).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
      }
    }

    for (const n of nodes) {
      ctx.fillStyle = n.hub ? `rgba(${LIME},0.9)` : 'rgba(222,230,242,0.5)';
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
      if (n.hub) {
        ctx.strokeStyle = `rgba(${LIME},0.22)`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + 5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.globalCompositeOperation = 'lighter';
    for (const p of packets) {
      const a = nodes[p.from], b = nodes[p.to];
      const x = a.x + (b.x - a.x) * p.t;
      const y = a.y + (b.y - a.y) * p.t;
      ctx.strokeStyle = `rgba(${p.color},0.35)`;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(x, y);
      ctx.stroke();
      const g = ctx.createRadialGradient(x, y, 0, x, y, 11);
      g.addColorStop(0, `rgba(${p.color},0.85)`);
      g.addColorStop(1, `rgba(${p.color},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgb(${p.color})`;
      ctx.beginPath();
      ctx.arc(x, y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(3, (now - last) / 16.67 || 1);
    last = now;
    step(dt);
    draw();
  }
  function start() {
    if (raf || reduce || !visible || document.hidden) return;
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }
  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
  }

  build();
  if (reduce) {
    for (let i = 0; i < 6; i++) spawn();
    draw();
  } else {
    start();
  }

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) start(); else stop();
  }).observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  window.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  }, { passive: true });
  document.addEventListener('pointerleave', () => { mouse.x = mouse.y = -1e4; });

  // Rebuild only on real size changes (mobile URL bars fire resize a lot).
  let lastW = window.innerWidth, lastH = window.innerHeight, timer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (window.innerWidth === lastW && Math.abs(window.innerHeight - lastH) < 120) return;
      lastW = window.innerWidth;
      lastH = window.innerHeight;
      build();
      if (reduce) draw();
    }, 200);
  });
})();
