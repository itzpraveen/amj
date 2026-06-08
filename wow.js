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
    const dot = document.createElement('div'); dot.className = 'cursor-dot cursor-hidden';
    const ring = document.createElement('div'); ring.className = 'cursor-ring cursor-hidden';
    const clabel = document.createElement('span'); clabel.className = 'clabel'; ring.appendChild(clabel);
    document.body.append(dot, ring);
    document.body.classList.add('has-cursor');

    const hero = document.querySelector('.hero');
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, vis = false;
    const hideCursor = () => {
      dot.classList.add('cursor-hidden');
      ring.classList.add('cursor-hidden');
      vis = false;
    };
    window.addEventListener('pointermove', (e) => {
      if (hero && e.target instanceof Node && hero.contains(e.target)) {
        document.body.classList.add('hero-native-cursor');
        hideCursor();
        return;
      }
      document.body.classList.remove('hero-native-cursor');
      mx = e.clientX; my = e.clientY;
      if (!vis) { vis = true; dot.classList.remove('cursor-hidden'); ring.classList.remove('cursor-hidden'); }
      dot.style.transform = `translate(${mx}px, ${my}px)`;
    });
    document.addEventListener('mouseleave', () => {
      hideCursor();
      document.body.classList.remove('hero-native-cursor');
    });
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
      el.addEventListener('pointerenter', () => setHover(true, ''));
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
    // balanced distribution network filling the full-width backdrop,
    // radiating from a central hub (Doha HQ)
    const CITIES = [
      { n: 'Doha · HQ',     x: 50, y: 50, hub: true },
      { n: 'Al Khor',       x: 50, y: 15 },
      { n: 'Ash Shamal',    x: 36, y: 23 },
      { n: 'Ras Laffan',    x: 64, y: 22 },
      { n: 'Lusail',        x: 23, y: 18 },
      { n: 'Sealine',       x: 77, y: 19 },
      { n: 'Al Rayyan',     x: 31, y: 43 },
      { n: 'Al Khor Coast', x: 69, y: 43 },
      { n: 'Dukhan',        x: 12, y: 33 },
      { n: 'Madinat',       x: 88, y: 33 },
      { n: 'Al Shahaniya',  x: 9,  y: 60 },
      { n: 'Al Daayen',     x: 91, y: 60 },
      { n: 'Industrial',    x: 22, y: 73 },
      { n: 'Port',          x: 78, y: 73 },
      { n: 'Mesaieed',      x: 37, y: 80 },
      { n: 'Al Wakrah',     x: 63, y: 80 },
      { n: 'Umm Salal',     x: 50, y: 86 }
    ];
    const hub = CITIES[0];
    // light mesh: connect each node to its two nearest neighbours
    const LINKS = [];
    (function () {
      const seen = new Set();
      CITIES.forEach((a, i) => {
        CITIES.map((b, j) => ({ j, d: (a.x - b.x) ** 2 + (a.y - b.y) ** 2 }))
          .filter(o => o.j !== i).sort((p, q) => p.d - q.d).slice(0, 2)
          .forEach(o => { const k = i < o.j ? i + '_' + o.j : o.j + '_' + i; if (!seen.has(k)) { seen.add(k); LINKS.push([i, o.j]); } });
      });
    })();
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
    const pulses = [];
    for (let i = 0; i < 9; i++) {
      const c = CITIES[1 + Math.floor(Math.random() * (CITIES.length - 1))];
      pulses.push({ c, t: Math.random(), speed: 0.0022 + Math.random() * 0.0026 });
    }
    function px(c) { return [c.x / 100 * W, c.y / 100 * H]; }
    function ctrl(ax, ay, bx, by) { return [(ax + bx) / 2 + (ay - by) * 0.12, (ay + by) / 2 + (bx - ax) * 0.12]; }
    function frame() {
      ctx.clearRect(0, 0, W, H);
      const [hx, hy] = px(hub);
      // faint network fabric — each node to its nearest neighbours
      ctx.lineWidth = 1 * dpr; ctx.strokeStyle = 'rgba(120,170,225,0.10)';
      LINKS.forEach(([i, j]) => {
        const [ax, ay] = px(CITIES[i]), [bx, by] = px(CITIES[j]);
        const [cx2, cy2] = ctrl(ax, ay, bx, by);
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(cx2, cy2, bx, by); ctx.stroke();
      });
      // delivery lanes radiating from the hub
      ctx.strokeStyle = 'rgba(132,188,236,0.20)';
      CITIES.forEach((c) => {
        if (c.hub) return;
        const [x, y] = px(c);
        const [mx2, my2] = ctrl(hx, hy, x, y);
        ctx.beginPath(); ctx.moveTo(hx, hy); ctx.quadraticCurveTo(mx2, my2, x, y); ctx.stroke();
      });
      // traveling delivery pulses (van glints)
      pulses.forEach((p) => {
        if (motionOn()) p.t += p.speed; if (p.t > 1) p.t -= 1;
        const [x, y] = px(p.c);
        const [mx2, my2] = ctrl(hx, hy, x, y);
        const t = p.t, it = 1 - t;
        const bx = it * it * hx + 2 * it * t * mx2 + t * t * x;
        const by = it * it * hy + 2 * it * t * my2 + t * t * y;
        const g = ctx.createRadialGradient(bx, by, 0, bx, by, 8 * dpr);
        g.addColorStop(0, 'rgba(130,240,180,0.95)'); g.addColorStop(1, 'rgba(130,240,180,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bx, by, 8 * dpr, 0, 7); ctx.fill();
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
