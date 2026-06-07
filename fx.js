/* ============================================================
   AMJ — FX: cursor 3D depth, tilt, hero particles, media reel
   ============================================================ */
(function () {
  const root = document.documentElement;
  const motionOn = () => root.getAttribute('data-motion') !== 'off';

  /* ---- Hero depth is fixed: the dune canvas owns the only hero motion. ---- */
  const heroCursor = document.querySelector('.hero-bg-cursor');
  if (heroCursor) heroCursor.style.transform = 'none';

  /* ---- 3D tilt-on-cursor for [data-tilt] ---- */
  document.querySelectorAll('[data-tilt]').forEach((el) => {
    const max = parseFloat(el.dataset.tilt) || 8;
    el.addEventListener('pointermove', (e) => {
      if (!motionOn()) return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty('--ry', (px * max).toFixed(2) + 'deg');
      el.style.setProperty('--rx', (-py * max).toFixed(2) + 'deg');
      el.style.setProperty('--gx', (px * 90 + 50).toFixed(1) + '%');
      el.style.setProperty('--gy', (py * 90 + 50).toFixed(1) + '%');
      el.classList.add('tilting');
    });
    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--ry', '0deg');
      el.style.setProperty('--rx', '0deg');
      el.classList.remove('tilting');
    });
  });

  /* ---- Hero particles (floating brand shards = video-like motion) ---- */
  const cvs = document.querySelector('.hero-particles');
  const allowParticles = window.innerWidth > 760 && window.matchMedia('(hover: hover)').matches;
  if (cvs && allowParticles) {
    const ctx = cvs.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W, H, parts;
    function init() {
      const n = Math.max(10, Math.round((W * H) / (150000 * dpr)));
      parts = [];
      for (let i = 0; i < n; i++) {
        parts.push({
          x: Math.random() * W, y: Math.random() * H,
          s: (Math.random() * 12 + 6) * dpr,
          vx: (Math.random() - 0.5) * 0.12 * dpr,
          vy: (-Math.random() * 0.18 - 0.04) * dpr,
          a: Math.random() * 0.35 + 0.08,
          r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.004
        });
      }
    }
    function resize() {
      W = cvs.width = Math.max(1, cvs.offsetWidth * dpr);
      H = cvs.height = Math.max(1, cvs.offsetHeight * dpr);
      init();
    }
    function frame() {
      ctx.clearRect(0, 0, W, H);
      for (const p of parts) {
        if (motionOn()) { p.x += p.vx + cx * 0.35 * dpr; p.y += p.vy; p.r += p.vr; }
        if (p.y < -30) { p.y = H + 30; p.x = Math.random() * W; }
        if (p.x < -30) p.x = W + 30; if (p.x > W + 30) p.x = -30;
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = p.a;
        ctx.fillStyle = 'rgba(150,200,235,0.95)';
        ctx.beginPath();
        ctx.moveTo(0, -p.s); ctx.lineTo(p.s * 0.9, p.s * 0.7); ctx.lineTo(-p.s * 0.9, p.s * 0.7);
        ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      requestAnimationFrame(frame);
    }
    window.addEventListener('resize', resize);
    resize(); frame();
  }

  /* ---- Restaurant hover thumbnail: swap image per row ---- */
  const thumb = document.querySelector('.resto-thumb');
  if (thumb) {
    const img = thumb.querySelector('img');
    document.querySelectorAll('.resto-row').forEach((row) => {
      row.addEventListener('mouseenter', () => {
        if (!motionOn()) return;
        const res = window.__resources || {};
        const src = (row.dataset.imgId && res[row.dataset.imgId]) || row.dataset.img;
        if (src) img.src = src;
        thumb.classList.add('show');
      });
      row.addEventListener('mouseleave', () => thumb.classList.remove('show'));
    });
    document.addEventListener('mousemove', (e) => {
      if (!thumb.classList.contains('show')) return;
      thumb.style.left = (e.clientX + 26) + 'px';
      thumb.style.top = (e.clientY - 110) + 'px';
    });
  }

  /* ---- Real media operations reel ---- */
  document.querySelectorAll('[data-reel]').forEach((reel) => {
    const frames = [...reel.querySelectorAll('.ops-frame')];
    const steps = [...reel.querySelectorAll('[data-reel-step]')];
    const kicker = reel.querySelector('[data-reel-kicker]');
    const title = reel.querySelector('[data-reel-title]');
    const copy = reel.querySelector('[data-reel-copy]');
    if (!frames.length || !steps.length) return;

    let active = 0;
    let timer = null;
    const setActive = (next) => {
      active = (next + frames.length) % frames.length;
      frames.forEach((frame, i) => frame.classList.toggle('active', i === active));
      steps.forEach((step, i) => step.classList.toggle('active', i === active));
      const step = steps[active];
      if (kicker) kicker.textContent = step.dataset.kicker || '';
      if (title) title.textContent = step.dataset.title || '';
      if (copy) copy.textContent = step.dataset.copy || '';
    };
    const start = () => {
      clearInterval(timer);
      timer = setInterval(() => {
        if (motionOn()) setActive(active + 1);
      }, 4800);
    };

    steps.forEach((step, i) => {
      step.addEventListener('click', (e) => {
        e.stopPropagation();
        setActive(i);
        start();
      });
    });
    reel.addEventListener('pointerenter', () => clearInterval(timer));
    reel.addEventListener('pointerleave', start);
    setActive(0);
    start();
  });
})();
