/* ============================================================
   AMJ hero — a single moonlit desert dune (gothic, cold)
   One sculpted dune: smooth luminous windward face (sand
   reflecting moonlight) -> deep navy shadow, a curved crest
   with a nose/fold, distant mountains, stars, and live wind
   blowing sand off the crest. Canvas 2D.
   ============================================================ */
(function () {
  const canvas = document.querySelector('.hero-3d');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) { canvas.style.display = 'none'; return; }

  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const motionOn = () => root.getAttribute('data-motion') !== 'off' && !reduced.matches;

  const S = {
    w: 1, h: 1, dpr: 1, t: 0, last: performance.now(),
    px: 0, py: 0, tx: 0, ty: 0,
    raf: null, inView: true, tab: !document.hidden
  };

  const sky = document.createElement('canvas');
  const grain = document.createElement('canvas');
  const skyCtx = sky.getContext('2d');
  const grainCtx = grain.getContext('2d');

  function rng(seed) {
    return function () {
      seed = seed + 0x6D2B79F5 | 0;
      let x = Math.imul(seed ^ seed >>> 15, 1 | seed);
      x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x;
      return ((x ^ x >>> 14) >>> 0) / 4294967296;
    };
  }

  // smooth curve through normalized points (Catmull-Rom -> bezier), scaled + offset
  function smoothPath(pts, dx, dy) {
    const P = pts.map(([x, y]) => [x * S.w + dx, y * S.h + dy]);
    const p = new Path2D();
    p.moveTo(P[0][0], P[0][1]);
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || P[i + 1];
      p.bezierCurveTo(
        p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6,
        p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6,
        p2[0], p2[1]
      );
    }
    return p;
  }

  // --- dune geometry (normalized). Peak left-of-centre; crest folds to a nose on the right. ---
  const CREST = [
    [-0.03, 0.57], [0.10, 0.49], [0.22, 0.425], [0.31, 0.375], [0.385, 0.347],
    [0.45, 0.378], [0.51, 0.447], [0.565, 0.522], [0.612, 0.580], [0.648, 0.608],
    [0.72, 0.592], [0.84, 0.560], [1.03, 0.552]
  ];
  const LIT = CREST.slice(0, 10).concat([[0.55, 0.71], [0.36, 0.82], [0.16, 0.88], [-0.03, 0.83]]);

  // wind-blown sand off the crest
  let spray = [];
  function seedSpray() {
    const r = rng(5); spray = [];
    const N = finePointer ? 60 : 34;
    for (let i = 0; i < N; i++) spray.push(resetGrainP(r, r() * 1));
  }
  function resetGrainP(r, life0) {
    const i = Math.floor((r ? r() : Math.random()) * (CREST.length - 4));
    const c = CREST[i];
    return {
      x: c[0] + ((r ? r() : Math.random()) - 0.5) * 0.05,
      y: c[1] - 0.005,
      vx: 0.018 + (r ? r() : Math.random()) * 0.03,
      vy: -0.004 - (r ? r() : Math.random()) * 0.012,
      life: life0 != null ? life0 : 0,
      ttl: 2.2 + (r ? r() : Math.random()) * 2.4,
      s: (r ? r() : Math.random()) * 1.3 + 0.4
    };
  }

  function bakeSky() {
    sky.width = S.w * S.dpr; sky.height = S.h * S.dpr;
    skyCtx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);

    const g = skyCtx.createLinearGradient(0, 0, 0, S.h);
    g.addColorStop(0, '#070f1d');
    g.addColorStop(0.45, '#102036');
    g.addColorStop(0.72, '#1a2e49');
    g.addColorStop(1, '#1d3150');
    skyCtx.fillStyle = g; skyCtx.fillRect(0, 0, S.w, S.h);

    // soft cool moon-glow behind the peak
    const gx = S.w * 0.40, gy = S.h * 0.30;
    const glow = skyCtx.createRadialGradient(gx, gy, 0, gx, gy, S.w * 0.42);
    glow.addColorStop(0, 'rgba(150,176,214,0.16)');
    glow.addColorStop(0.5, 'rgba(74,102,144,0.06)');
    glow.addColorStop(1, 'rgba(10,18,32,0)');
    skyCtx.fillStyle = glow; skyCtx.fillRect(0, 0, S.w, S.h);

    // faint wispy clouds
    const cr = rng(404);
    skyCtx.save();
    for (let i = 0; i < 9; i++) {
      const x = cr() * S.w, y = cr() * S.h * 0.4, w = (cr() * 0.3 + 0.2) * S.w, h = (cr() * 0.04 + 0.02) * S.h;
      const cg = skyCtx.createRadialGradient(x, y, 0, x, y, w);
      const a = cr() * 0.05 + 0.02;
      cg.addColorStop(0, `rgba(120,144,180,${a})`);
      cg.addColorStop(1, 'rgba(120,144,180,0)');
      skyCtx.fillStyle = cg;
      skyCtx.save(); skyCtx.translate(x, y); skyCtx.scale(1, h / w); skyCtx.beginPath();
      skyCtx.arc(0, 0, w, 0, 6.2832); skyCtx.fill(); skyCtx.restore();
    }
    skyCtx.restore();

    // stars
    const r = rng(1997);
    for (let i = 0; i < 220; i++) {
      const x = r() * S.w, y = r() * S.h * 0.6;
      const rad = r() * 0.9 + 0.2;
      const a = (r() * 0.5 + 0.08) * Math.min(1, 0.35 + Math.hypot(x - gx, y - gy) / S.w);
      skyCtx.fillStyle = `rgba(206,222,244,${a})`;
      skyCtx.beginPath(); skyCtx.arc(x, y, rad, 0, 6.2832); skyCtx.fill();
    }

    // distant mountains (faint, left + right)
    drawMountains(skyCtx, 0.0, 0.55, 17, 0.07, 'rgba(22,36,58,0.85)');
    drawMountains(skyCtx, 0.62, 1.05, 23, 0.06, 'rgba(20,33,54,0.8)');
  }

  function drawMountains(c, x0, x1, seed, amp, fill) {
    const r = rng(seed); const base = 0.52; const n = 10;
    const p = new Path2D(); p.moveTo(x0 * S.w, S.h);
    for (let i = 0; i <= n; i++) {
      const x = (x0 + (x1 - x0) * i / n) * S.w;
      const y = (base - (r() * amp + amp * 0.2) * (0.5 + 0.5 * Math.sin(i * 1.7 + seed))) * S.h;
      p.lineTo(x, y);
    }
    p.lineTo(x1 * S.w, S.h); p.closePath();
    c.fillStyle = fill; c.fill(p);
  }

  function bakeGrain() {
    const size = 220; grain.width = size; grain.height = size;
    const img = grainCtx.createImageData(size, size); const d = img.data; const r = rng(99);
    for (let i = 0; i < d.length; i += 4) {
      const v = 196 + Math.floor(r() * 60);
      d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = Math.floor(r() * 18);
    }
    grainCtx.putImageData(img, 0, 0);
  }

  function drawDune() {
    const dx = -S.px * S.w * 0.018, dy = -S.py * S.h * 0.01;

    // whole dune silhouette -> deep navy shadow (the lee / right face stays dark)
    const shadow = smoothPath(CREST, dx, dy);
    shadow.lineTo(1.03 * S.w + dx, S.h + 4); shadow.lineTo(-0.03 * S.w + dx, S.h + 4); shadow.closePath();
    const sg = ctx.createLinearGradient(0, 0.33 * S.h + dy, 0, S.h);
    sg.addColorStop(0, '#0e1d33'); sg.addColorStop(0.5, '#081325'); sg.addColorStop(1, '#03060d');
    ctx.fillStyle = sg; ctx.fill(shadow);

    // lit windward face -> smooth moonlit gradient (sand reflecting the moon)
    const lit = smoothPath(LIT, dx, dy);
    ctx.save();
    ctx.clip(lit);
    const lg = ctx.createLinearGradient(0, 0.33 * S.h + dy, 0, 0.9 * S.h + dy);
    lg.addColorStop(0, '#c6ccde');
    lg.addColorStop(0.30, '#9aa4c4');
    lg.addColorStop(0.62, '#5d6b97');
    lg.addColorStop(0.86, '#33425f');
    lg.addColorStop(1, '#1c2c45');
    ctx.fillStyle = lg; ctx.fillRect(0, 0, S.w, S.h);
    // sky-reflection cool wash low on the face
    const refl = ctx.createLinearGradient(0, 0.7 * S.h + dy, 0, S.h);
    refl.addColorStop(0, 'rgba(70,96,140,0)');
    refl.addColorStop(1, 'rgba(58,84,128,0.4)');
    ctx.fillStyle = refl; ctx.fillRect(0, 0, S.w, S.h);
    // soft moonlight sheen hotspot on the upper face
    const sx = (0.26 - S.px * 0.02) * S.w + dx, sy = (0.5 + S.py * 0.01) * S.h + dy;
    const sheen = ctx.createRadialGradient(sx, sy, 0, sx, sy, S.w * 0.3);
    sheen.addColorStop(0, 'rgba(220,226,240,0.28)');
    sheen.addColorStop(0.5, 'rgba(180,190,214,0.08)');
    sheen.addColorStop(1, 'rgba(180,190,214,0)');
    ctx.fillStyle = sheen; ctx.fillRect(0, 0, S.w, S.h);

    // live wind: a soft veil drifting across the lit face
    const wv = ((S.t * 0.03) % 1.4 - 0.2);
    const veil = ctx.createLinearGradient((wv - 0.25) * S.w, 0, (wv + 0.25) * S.w, S.h);
    veil.addColorStop(0, 'rgba(206,214,234,0)');
    veil.addColorStop(0.5, 'rgba(206,214,234,0.05)');
    veil.addColorStop(1, 'rgba(206,214,234,0)');
    ctx.fillStyle = veil; ctx.fillRect(0, 0, S.w, S.h);
    ctx.restore();

    // nose / fold — a soft dark pocket under the right of the crest
    const nx = 0.605 * S.w + dx, ny = 0.60 * S.h + dy;
    const nose = ctx.createRadialGradient(nx, ny, 0, nx, ny, S.w * 0.14);
    nose.addColorStop(0, 'rgba(4,9,18,0.55)');
    nose.addColorStop(1, 'rgba(4,9,18,0)');
    ctx.save(); ctx.clip(shadow); ctx.fillStyle = nose; ctx.fillRect(0, 0, S.w, S.h); ctx.restore();

    // crest rim — a thin moonlit edge along the lit crest (up to the nose)
    const rim = smoothPath(CREST.slice(0, 10), dx, dy);
    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(214,222,240,0.55)'; ctx.lineWidth = 1.4; ctx.stroke(rim);
    ctx.strokeStyle = 'rgba(214,222,240,0.14)'; ctx.lineWidth = 4.5; ctx.stroke(rim);
    ctx.restore();
  }

  function drawSpray(dt) {
    const dx = -S.px * S.w * 0.018, dy = -S.py * S.h * 0.01;
    ctx.save();
    for (const p of spray) {
      if (dt > 0) {
        p.life += dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 0.010 * dt; p.vx *= (1 - 0.15 * dt);
        if (p.life > p.ttl || p.x > 1.1) Object.assign(p, resetGrainP(null, 0));
      }
      const k = p.life / p.ttl;
      const a = Math.sin(Math.min(k, 1) * Math.PI) * 0.5;
      if (a <= 0.01) continue;
      ctx.fillStyle = `rgba(206,216,238,${a.toFixed(3)})`;
      ctx.beginPath(); ctx.arc(p.x * S.w + dx, p.y * S.h + dy, p.s, 0, 6.2832); ctx.fill();
    }
    ctx.restore();
  }

  function drawVignette() {
    const g = ctx.createRadialGradient(S.w * 0.5, S.h * 0.44, S.h * 0.2, S.w * 0.5, S.h * 0.58, S.w * 0.8);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.72, 'rgba(2,5,12,0.16)');
    g.addColorStop(1, 'rgba(1,3,8,0.6)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, S.w, S.h);
  }

  function render(dt) {
    ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(sky, -S.px * 12, -S.py * 7, S.w + 24, S.h + 14);
    drawDune();
    drawSpray(dt);
    // soft elliptical scrim behind the centred hero text for legibility
    ctx.save();
    ctx.translate(S.w * 0.5, S.h * 0.52);
    ctx.scale(1, 0.46);
    const ts = ctx.createRadialGradient(0, 0, 0, 0, 0, S.w * 0.36);
    ts.addColorStop(0, 'rgba(3,7,15,0.58)');
    ts.addColorStop(0.55, 'rgba(3,7,15,0.30)');
    ts.addColorStop(1, 'rgba(3,7,15,0)');
    ctx.fillStyle = ts; ctx.fillRect(-S.w, -S.h, S.w * 2, S.h * 2);
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.5;
    const gx = (S.t * 7) % 220, gy = (S.t * 4) % 220;
    for (let x = -220; x < S.w; x += 220)
      for (let y = -220; y < S.h; y += 220) ctx.drawImage(grain, x - gx, y - gy);
    ctx.restore();
    drawVignette();
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    S.w = Math.max(1, rect.width); S.h = Math.max(1, rect.height);
    S.dpr = Math.min(window.devicePixelRatio || 1, S.w < 760 ? 1.3 : 1.5);
    canvas.width = Math.round(S.w * S.dpr); canvas.height = Math.round(S.h * S.dpr);
    bakeSky(); bakeGrain(); seedSpray(); render(0);
  }

  window.addEventListener('pointermove', (e) => {
    if (!finePointer) return;
    S.tx = (e.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2;
    S.ty = (e.clientY / Math.max(window.innerHeight, 1) - 0.5) * 2;
  }, { passive: true });

  function frame(now) {
    S.raf = requestAnimationFrame(frame);
    const dt = Math.min((now - S.last) / 1000, 0.05); S.last = now;
    const active = motionOn();
    if (active) S.t += dt;
    if (!finePointer && active) { S.tx = Math.sin(S.t * 0.11) * 0.5; S.ty = Math.cos(S.t * 0.08) * 0.3; }
    S.px += (S.tx - S.px) * 0.04; S.py += (S.ty - S.py) * 0.04;
    render(active ? dt : 0);
  }

  function start() { if (S.raf === null) { S.last = performance.now(); S.raf = requestAnimationFrame(frame); } }
  function stop() { if (S.raf !== null) { cancelAnimationFrame(S.raf); S.raf = null; } }
  function sync() { if (S.inView && S.tab) start(); else stop(); }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => { S.inView = es[0].isIntersecting; sync(); }, { threshold: 0 }).observe(canvas);
  }
  document.addEventListener('visibilitychange', () => { S.tab = !document.hidden; sync(); }, { passive: true });
  window.addEventListener('resize', resize, { passive: true });

  resize();
  if (motionOn()) start(); else render(0);
})();
