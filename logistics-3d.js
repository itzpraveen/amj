/* ============================================================
   AMJ hero — a single star-lit desert dune (gothic, cold)
   One sculpted dune: smooth luminous windward face -> deep navy
   shadow, a curved crest with a nose/fold, distant mountains,
   bright moving stars, a subtle corner glow, and live wind blowing
   sand off the crest. Canvas 2D.

   Every page hero runs the same scene; data-dune on the canvas
   picks a colour theme (hue-rotated from the home navy).
   ============================================================ */
(function () {
  // theme = hue shift (deg) + saturation multiplier applied to the navy base
  const THEMES = {
    night: { dh: 0, sm: 1 },      // home — cold navy
    dusk: { dh: 168, sm: 1.05 },  // legacy — bronze dusk
    plum: { dh: 88, sm: 1.1 },    // FMCG brands — royal plum
    garnet: { dh: 128, sm: 1.1 }, // restaurants — wine garnet
    steel: { dh: -32, sm: 1.05 }, // infrastructure — steel teal
    oasis: { dh: -60, sm: 1.0 },  // locate — oasis green
    indigo: { dh: 38, sm: 1.1 }   // contact — violet indigo
  };

  const BASE = {
    sky0: [7, 15, 29], sky1: [16, 32, 54], sky2: [26, 46, 73], sky3: [29, 49, 80],
    glow0: [160, 188, 228], glow1: [74, 102, 144],
    cloud: [120, 144, 180], star: [206, 222, 244],
    mtn0: [22, 36, 58], mtn1: [20, 33, 54],
    sh0: [14, 29, 51], sh1: [8, 19, 37], sh2: [3, 6, 13],
    lit0: [198, 204, 222], lit1: [154, 164, 196], lit2: [93, 107, 151],
    lit3: [51, 66, 95], lit4: [28, 44, 69],
    refl0: [70, 96, 140], refl1: [58, 84, 128],
    sheen0: [220, 226, 240], sheen1: [180, 190, 214],
    veil: [206, 214, 234], spur: [7, 14, 28], nose: [4, 9, 18],
    rim: [214, 222, 240], spray: [206, 216, 238], twk: [220, 232, 250],
    shoot0: [234, 242, 255], shoot1: [240, 246, 255],
    scrim: [3, 7, 15], vig0: [2, 5, 12], vig1: [1, 3, 8]
  };

  function shiftColor([r, g, b], dh, sm) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
    let h = 0, s = 0;
    if (mx !== mn) {
      const d = mx - mn;
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h *= 60;
    }
    h = ((h + dh) % 360 + 360) % 360;
    s = Math.min(1, s * sm);
    const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
    const [r2, g2, b2] =
      h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] :
      h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return [Math.round((r2 + m) * 255), Math.round((g2 + m) * 255), Math.round((b2 + m) * 255)];
  }

  function makePalette(theme) {
    const t = THEMES[theme] || THEMES.night;
    const C = {};
    for (const k in BASE) C[k] = shiftColor(BASE[k], t.dh, t.sm);
    return C;
  }
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;

  function initDune(canvas) {
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) { canvas.style.display = 'none'; return; }

    const C = makePalette(canvas.dataset.dune || 'night');
    // the centred text scrim only belongs on the home hero layout
    const centredScrim = !canvas.closest('.page-hero');

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

    // --- dune geometry (normalized). Wide layout for desktop; a lower, simpler
    //     dune band for tall/portrait screens so it never squishes on mobile. ---
    const DESK = {
      crest: [
        [-0.03, 0.57], [0.10, 0.49], [0.22, 0.425], [0.31, 0.375], [0.385, 0.347],
        [0.45, 0.378], [0.51, 0.447], [0.565, 0.522], [0.612, 0.580], [0.648, 0.608],
        [0.72, 0.592], [0.84, 0.560], [1.03, 0.552]
      ],
      tail: [[0.55, 0.71], [0.36, 0.82], [0.16, 0.88], [-0.03, 0.83]],
      rimEnd: 10, peakY: 0.33, litBottom: 0.9, reflTop: 0.70,
      nose: [0.605, 0.60], noseR: 0.14, sheen: [0.26, 0.50], sheenR: 0.30
    };
    const MOB = {
      crest: [
        [-0.06, 0.83], [0.14, 0.77], [0.30, 0.715], [0.44, 0.68],
        [0.55, 0.695], [0.70, 0.76], [0.86, 0.82], [1.06, 0.825]
      ],
      tail: [[0.46, 0.90], [0.28, 0.96], [0.10, 1.0], [-0.06, 0.98]],
      rimEnd: 5, peakY: 0.65, litBottom: 1.0, reflTop: 0.90,
      nose: [0.55, 0.74], noseR: 0.16, sheen: [0.30, 0.83], sheenR: 0.42
    };
    let G = DESK, CREST = DESK.crest, LIT = CREST.slice(0, DESK.rimEnd).concat(DESK.tail);
    function setGeo() {
      G = (S.h / S.w > 1.15 || window.innerWidth < 720) ? MOB : DESK;
      CREST = G.crest;
      LIT = CREST.slice(0, G.rimEnd).concat(G.tail);
    }

    // wind-blown sand off the crest
    let spray = [];
    // live twinkling, drifting stars + an occasional shooting star
    let twinkle = [];
    let shoot = null, nextShoot = 5 + Math.random() * 6;
    function seedSpray() {
      const r = rng(5); spray = [];
      const N = finePointer ? 60 : 34;
      for (let i = 0; i < N; i++) spray.push(resetGrainP(r, r() * 1));
    }
    function seedTwinkle() {
      const r = rng(77); twinkle = [];
      const N = finePointer ? 52 : 32;
      for (let i = 0; i < N; i++) {
        twinkle.push({
          x: r(),
          y: r() * 0.55,
          s: r() * 1.2 + 0.45,
          ph: r() * 6.2832,
          sp: 0.65 + r() * 1.65,
          drift: (r() * 0.012 + 0.004) * (r() > 0.5 ? 1 : -1),
          bob: r() * 0.003 + 0.001
        });
      }
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
      g.addColorStop(0, rgb(C.sky0));
      g.addColorStop(0.45, rgb(C.sky1));
      g.addColorStop(0.72, rgb(C.sky2));
      g.addColorStop(1, rgb(C.sky3));
      skyCtx.fillStyle = g; skyCtx.fillRect(0, 0, S.w, S.h);

      // subtle off-canvas corner glow. It gives the dune shape without adding
      // a visible object or obvious light source.
      const gx = -S.w * 0.08, gy = S.h * 0.10;
      const glow = skyCtx.createRadialGradient(gx, gy, 0, gx, gy, S.w * 0.55);
      glow.addColorStop(0, rgba(C.glow0, 0.18));
      glow.addColorStop(0.45, rgba(C.glow1, 0.07));
      glow.addColorStop(1, 'rgba(10,18,32,0)');
      skyCtx.fillStyle = glow; skyCtx.fillRect(0, 0, S.w, S.h);

      // faint wispy clouds
      const cr = rng(404);
      skyCtx.save();
      for (let i = 0; i < 9; i++) {
        const x = cr() * S.w, y = cr() * S.h * 0.4, w = (cr() * 0.3 + 0.2) * S.w, h = (cr() * 0.04 + 0.02) * S.h;
        const cg = skyCtx.createRadialGradient(x, y, 0, x, y, w);
        const a = cr() * 0.05 + 0.02;
        cg.addColorStop(0, rgba(C.cloud, a));
        cg.addColorStop(1, rgba(C.cloud, 0));
        skyCtx.fillStyle = cg;
        skyCtx.save(); skyCtx.translate(x, y); skyCtx.scale(1, h / w); skyCtx.beginPath();
        skyCtx.arc(0, 0, w, 0, 6.2832); skyCtx.fill(); skyCtx.restore();
      }
      skyCtx.restore();

      // fixed star field; brighter away from the corner glow so the sky stays
      // star-led instead of centered around a single object.
      const r = rng(1997);
      for (let i = 0; i < 310; i++) {
        const x = r() * S.w, y = r() * S.h * 0.64;
        const rad = r() * 0.95 + 0.18;
        const a = (r() * 0.58 + 0.10) * Math.min(1, 0.42 + Math.hypot(x - gx, y - gy) / S.w);
        skyCtx.fillStyle = rgba(C.star, a.toFixed(3));
        skyCtx.beginPath(); skyCtx.arc(x, y, rad, 0, 6.2832); skyCtx.fill();
      }

      // distant mountains (faint, left + right)
      drawMountains(skyCtx, 0.0, 0.55, 17, 0.07, rgba(C.mtn0, 0.85));
      drawMountains(skyCtx, 0.62, 1.05, 23, 0.06, rgba(C.mtn1, 0.8));
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

      const lastX = CREST[CREST.length - 1][0], firstX = CREST[0][0];

      // whole dune silhouette -> deep navy shadow (the lee / right face stays dark)
      const shadow = smoothPath(CREST, dx, dy);
      shadow.lineTo(lastX * S.w + dx, S.h + 4); shadow.lineTo(firstX * S.w + dx, S.h + 4); shadow.closePath();
      const sg = ctx.createLinearGradient(0, G.peakY * S.h + dy, 0, S.h);
      sg.addColorStop(0, rgb(C.sh0)); sg.addColorStop(0.5, rgb(C.sh1)); sg.addColorStop(1, rgb(C.sh2));
      ctx.fillStyle = sg; ctx.fill(shadow);

      // lit windward face -> smooth cool gradient catching the off-canvas glow
      const lit = smoothPath(LIT, dx, dy);
      ctx.save();
      ctx.clip(lit);
      const lg = ctx.createLinearGradient(0, G.peakY * S.h + dy, 0, G.litBottom * S.h + dy);
      lg.addColorStop(0, rgb(C.lit0));
      lg.addColorStop(0.30, rgb(C.lit1));
      lg.addColorStop(0.62, rgb(C.lit2));
      lg.addColorStop(0.86, rgb(C.lit3));
      lg.addColorStop(1, rgb(C.lit4));
      ctx.fillStyle = lg; ctx.fillRect(0, 0, S.w, S.h);
      // sky-reflection cool wash low on the face
      const refl = ctx.createLinearGradient(0, G.reflTop * S.h + dy, 0, S.h);
      refl.addColorStop(0, rgba(C.refl0, 0));
      refl.addColorStop(1, rgba(C.refl1, 0.4));
      ctx.fillStyle = refl; ctx.fillRect(0, 0, S.w, S.h);
      // soft corner-light sheen hotspot on the upper face
      const sx = (G.sheen[0] - S.px * 0.02) * S.w + dx, sy = (G.sheen[1] + S.py * 0.01) * S.h + dy;
      const sheen = ctx.createRadialGradient(sx, sy, 0, sx, sy, S.w * G.sheenR);
      sheen.addColorStop(0, rgba(C.sheen0, 0.28));
      sheen.addColorStop(0.5, rgba(C.sheen1, 0.08));
      sheen.addColorStop(1, rgba(C.sheen1, 0));
      ctx.fillStyle = sheen; ctx.fillRect(0, 0, S.w, S.h);

      // live wind: a soft veil drifting across the lit face
      const wv = ((S.t * 0.03) % 1.4 - 0.2);
      const veil = ctx.createLinearGradient((wv - 0.25) * S.w, 0, (wv + 0.25) * S.w, S.h);
      veil.addColorStop(0, rgba(C.veil, 0));
      veil.addColorStop(0.5, rgba(C.veil, 0.05));
      veil.addColorStop(1, rgba(C.veil, 0));
      ctx.fillStyle = veil; ctx.fillRect(0, 0, S.w, S.h);
      // soften the thin spur where the lit face tapers into the lee
      const spx = (CREST[G.rimEnd - 1][0] + 0.015) * S.w + dx, spy = CREST[G.rimEnd - 1][1] * S.h + dy;
      const spur = ctx.createRadialGradient(spx, spy, 0, spx, spy, S.w * 0.11);
      spur.addColorStop(0, rgba(C.spur, 0.55));
      spur.addColorStop(1, rgba(C.spur, 0));
      ctx.fillStyle = spur; ctx.fillRect(0, 0, S.w, S.h);
      ctx.restore();

      // nose / fold — a soft dark pocket under the right of the crest
      const nx = G.nose[0] * S.w + dx, ny = G.nose[1] * S.h + dy;
      const nose = ctx.createRadialGradient(nx, ny, 0, nx, ny, S.w * G.noseR);
      nose.addColorStop(0, rgba(C.nose, 0.55));
      nose.addColorStop(1, rgba(C.nose, 0));
      ctx.save(); ctx.clip(shadow); ctx.fillStyle = nose; ctx.fillRect(0, 0, S.w, S.h); ctx.restore();

      // crest rim — a thin star-lit edge along the lit crest, fading out before
      // the tip so it doesn't form a hard bright spur where it meets the lee
      const rim = smoothPath(CREST.slice(0, G.rimEnd), dx, dy);
      const rimX0 = CREST[0][0] * S.w + dx, rimX1 = CREST[G.rimEnd - 1][0] * S.w + dx;
      const rgThin = ctx.createLinearGradient(rimX0, 0, rimX1, 0);
      rgThin.addColorStop(0, rgba(C.rim, 0.55));
      rgThin.addColorStop(0.7, rgba(C.rim, 0.5));
      rgThin.addColorStop(1, rgba(C.rim, 0));
      const rgWide = ctx.createLinearGradient(rimX0, 0, rimX1, 0);
      rgWide.addColorStop(0, rgba(C.rim, 0.14));
      rgWide.addColorStop(0.7, rgba(C.rim, 0.12));
      rgWide.addColorStop(1, rgba(C.rim, 0));
      ctx.save();
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.strokeStyle = rgThin; ctx.lineWidth = 1.4; ctx.stroke(rim);
      ctx.strokeStyle = rgWide; ctx.lineWidth = 4.5; ctx.stroke(rim);
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
        ctx.fillStyle = rgba(C.spray, a.toFixed(3));
        ctx.beginPath(); ctx.arc(p.x * S.w + dx, p.y * S.h + dy, p.s, 0, 6.2832); ctx.fill();
      }
      ctx.restore();
    }

    function drawTwinkle() {
      const ox = -S.px * 12, oy = -S.py * 7;
      for (const t of twinkle) {
        const sx = ((t.x + S.t * t.drift) % 1 + 1) % 1;
        const sy = t.y + Math.sin(S.t * 0.18 + t.ph) * t.bob;
        const pulse = 0.5 + 0.5 * Math.sin(S.t * t.sp + t.ph);
        const a = 0.26 + 0.58 * pulse;
        ctx.fillStyle = rgba(C.twk, a.toFixed(3));
        ctx.beginPath(); ctx.arc(sx * S.w + ox, sy * S.h + oy, t.s, 0, 6.2832); ctx.fill();
      }
    }

    function drawShoot(dt) {
      if (!shoot) {
        if (dt > 0 && S.t >= nextShoot) {
          const r = Math.random;
          shoot = { x: 0.12 + r() * 0.5, y: 0.06 + r() * 0.20, ang: 0.36 + r() * 0.26, vlen: 0.55 + r() * 0.30, len: 0.15 + r() * 0.10, t: 0, dur: 0.85 };
        }
        return;
      }
      shoot.t += dt;
      const k = shoot.t / shoot.dur;
      if (k >= 1) { shoot = null; nextShoot = S.t + 13 + Math.random() * 13; return; }
      const dist = shoot.vlen * k;
      const hx = (shoot.x + Math.cos(shoot.ang) * dist) * S.w;
      const hy = (shoot.y + Math.sin(shoot.ang) * dist) * S.h;
      const tailK = Math.min(1, k * 3) * (1 - Math.max(0, (k - 0.65) / 0.35));
      const tlen = shoot.len * S.w * tailK;
      const tx = hx - Math.cos(shoot.ang) * tlen, ty = hy - Math.sin(shoot.ang) * tlen;
      const fade = Math.sin(Math.min(k, 1) * Math.PI);
      ctx.save();
      ctx.lineCap = 'round';
      const g = ctx.createLinearGradient(hx, hy, tx, ty);
      g.addColorStop(0, rgba(C.shoot0, (0.9 * fade).toFixed(3)));
      g.addColorStop(1, rgba(C.shoot0, 0));
      ctx.strokeStyle = g; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(tx, ty); ctx.stroke();
      const hg = ctx.createRadialGradient(hx, hy, 0, hx, hy, 5);
      hg.addColorStop(0, rgba(C.shoot1, (0.95 * fade).toFixed(3)));
      hg.addColorStop(1, rgba(C.shoot1, 0));
      ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(hx, hy, 5, 0, 6.2832); ctx.fill();
      ctx.restore();
    }

    function drawVignette() {
      const g = ctx.createRadialGradient(S.w * 0.5, S.h * 0.44, S.h * 0.2, S.w * 0.5, S.h * 0.58, S.w * 0.8);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(0.72, rgba(C.vig0, 0.16));
      g.addColorStop(1, rgba(C.vig1, 0.6));
      ctx.fillStyle = g; ctx.fillRect(0, 0, S.w, S.h);
    }

    function render(dt) {
      ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(sky, -S.px * 12, -S.py * 7, S.w + 24, S.h + 14);
      drawTwinkle();
      drawShoot(dt);
      drawDune();
      drawSpray(dt);
      if (centredScrim) {
        // soft elliptical scrim behind the centred hero text for legibility
        ctx.save();
        ctx.translate(S.w * 0.5, S.h * 0.52);
        ctx.scale(1, 0.46);
        const ts = ctx.createRadialGradient(0, 0, 0, 0, 0, S.w * 0.36);
        ts.addColorStop(0, rgba(C.scrim, 0.58));
        ts.addColorStop(0.55, rgba(C.scrim, 0.30));
        ts.addColorStop(1, rgba(C.scrim, 0));
        ctx.fillStyle = ts; ctx.fillRect(-S.w, -S.h, S.w * 2, S.h * 2);
        ctx.restore();
      }
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
      setGeo();
      bakeSky(); bakeGrain(); seedSpray(); seedTwinkle(); render(0);
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
  }

  document.querySelectorAll('.hero-3d').forEach(initDune);
})();
