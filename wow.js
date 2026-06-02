/* ============================================================
   AMJ — "wow" interactions
   ============================================================ */
(function () {
  const root = document.documentElement;
  const motionOn = () => root.getAttribute('data-motion') !== 'off';
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Kinetic hero intro ---------- */
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('hero-loaded')));
  setTimeout(() => document.querySelectorAll('.display.reveal-lines .ln').forEach(l => l.style.overflow = 'visible'), 1500);

  /* ---------- Custom magnetic cursor ---------- */
  if (fine) {
    const dot = document.createElement('div'); dot.className = 'cursor-dot';
    const ring = document.createElement('div'); ring.className = 'cursor-ring';
    const clabel = document.createElement('span'); clabel.className = 'clabel'; ring.appendChild(clabel);
    document.body.append(dot, ring);
    document.body.classList.add('has-cursor');

    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, vis = false;
    window.addEventListener('pointermove', (e) => {
      mx = e.clientX; my = e.clientY;
      if (!vis) { vis = true; dot.classList.remove('cursor-hidden'); ring.classList.remove('cursor-hidden'); }
      dot.style.transform = `translate(${mx}px, ${my}px)`;
    });
    document.addEventListener('mouseleave', () => { dot.classList.add('cursor-hidden'); ring.classList.add('cursor-hidden'); vis = false; });
    (function ringLoop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      requestAnimationFrame(ringLoop);
    })();

    const setHover = (on, label) => {
      ring.classList.toggle('hover', on && !label);
      ring.classList.toggle('label', !!label);
      clabel.textContent = label || '';
    };
    document.querySelectorAll('a, button, .nav-cta, [data-tilt], input, .chip, .net-node').forEach((el) => {
      const label = el.classList.contains('video-card') || el.classList.contains('video-play') ? 'Play' : '';
      el.addEventListener('pointerenter', () => setHover(true, label));
      el.addEventListener('pointerleave', () => setHover(false, ''));
    });
    document.querySelectorAll('.video-card').forEach((el) => {
      el.addEventListener('pointerenter', () => setHover(true, 'Play'));
      el.addEventListener('pointerleave', () => setHover(false, ''));
    });

    /* magnetic pull on key CTAs */
    document.querySelectorAll('[data-magnetic]').forEach((el) => {
      const strength = parseFloat(el.dataset.magnetic) || 0.4;
      el.addEventListener('pointermove', (e) => {
        if (!motionOn()) return;
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- Live distribution network map ---------- */
  const map = document.querySelector('.netmap');
  if (map) {
    const cv = map.querySelector('.netmap-canvas');
    const ctx = cv.getContext('2d');
    const nodesEl = map.querySelector('.nodes');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    // abstract Qatar layout (% of frame). hub = Doha
    const CITIES = [
      { n: 'Doha · HQ', x: 70, y: 60, hub: true },
      { n: 'Al Wakrah', x: 72, y: 72 },
      { n: 'Mesaieed', x: 74, y: 84 },
      { n: 'Al Rayyan', x: 58, y: 58 },
      { n: 'Umm Salal', x: 64, y: 47 },
      { n: 'Al Khor', x: 66, y: 32 },
      { n: 'Ras Laffan', x: 62, y: 19 },
      { n: 'Ash Shamal', x: 54, y: 9 },
      { n: 'Dukhan', x: 30, y: 50 },
      { n: 'Al Shahaniya', x: 46, y: 52 }
    ];
    const hub = CITIES[0];
    let W, H;
    function place() {
      nodesEl.innerHTML = '';
      CITIES.forEach((c, i) => {
        const d = document.createElement('div');
        d.className = 'net-node' + (c.hub ? ' hub' : '');
        d.style.left = c.x + '%'; d.style.top = c.y + '%';
        const l = document.createElement('div');
        l.className = 'net-label'; l.textContent = c.n;
        l.style.left = c.x + '%'; l.style.top = c.y + '%';
        nodesEl.append(d, l);
      });
    }
    function resize() {
      W = cv.width = map.clientWidth * dpr;
      H = cv.height = map.clientHeight * dpr;
    }
    const pulses = CITIES.filter(c => !c.hub).map((c, i) => ({ c, t: Math.random(), speed: 0.0025 + Math.random() * 0.0025 }));
    function px(c) { return [c.x / 100 * W, c.y / 100 * H]; }
    function frame() {
      ctx.clearRect(0, 0, W, H);
      const [hx, hy] = px(hub);
      // routes
      CITIES.forEach((c) => {
        if (c.hub) return;
        const [x, y] = px(c);
        const mx2 = (hx + x) / 2 + (hy - y) * 0.12, my2 = (hy + y) / 2 + (x - hx) * 0.12;
        ctx.beginPath(); ctx.moveTo(hx, hy); ctx.quadraticCurveTo(mx2, my2, x, y);
        ctx.strokeStyle = 'rgba(120,180,230,0.22)'; ctx.lineWidth = 1 * dpr; ctx.stroke();
      });
      // traveling delivery pulses (van glints)
      pulses.forEach((p) => {
        if (motionOn()) p.t += p.speed; if (p.t > 1) p.t -= 1;
        const [x, y] = px(p.c);
        const mx2 = (hx + x) / 2 + (hy - y) * 0.12, my2 = (hy + y) / 2 + (x - hx) * 0.12;
        const t = p.t, it = 1 - t;
        const bx = it * it * hx + 2 * it * t * mx2 + t * t * x;
        const by = it * it * hy + 2 * it * t * my2 + t * t * y;
        const g = ctx.createRadialGradient(bx, by, 0, bx, by, 7 * dpr);
        g.addColorStop(0, 'rgba(120,235,170,0.95)'); g.addColorStop(1, 'rgba(120,235,170,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bx, by, 7 * dpr, 0, 7); ctx.fill();
      });
      requestAnimationFrame(frame);
    }
    window.addEventListener('resize', () => { resize(); });
    place(); resize(); frame();
  }

  /* ---------- Filterable brand portfolio ---------- */
  const filter = document.querySelector('.brand-filter');
  if (filter) {
    const cells = [...document.querySelectorAll('.brand-cell')];
    filter.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip'); if (!chip) return;
      filter.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const cat = chip.dataset.cat;
      cells.forEach((cell) => {
        const match = cat === 'all' || (cell.dataset.cat || '').split(' ').includes(cat);
        if (match) {
          cell.classList.remove('gone');
          requestAnimationFrame(() => cell.classList.remove('filtered'));
        } else {
          cell.classList.add('filtered');
          setTimeout(() => cell.classList.add('gone'), 500);
        }
      });
    });
  }
})();
