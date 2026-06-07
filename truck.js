/* ============================================================
   Scroll-linked delivery truck (top-down).
   Sweeps left <-> right in a smooth elliptical serpentine down the
   page, positioned by scroll progress: scroll down drives it down,
   scroll up reverses it. Starts below the hero; desktop only.
   ============================================================ */
(function () {
  const NS = 'http://www.w3.org/2000/svg';

  const track = document.createElement('div');
  track.className = 'truck-track';
  track.setAttribute('aria-hidden', 'true');

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'truck-svg');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.innerHTML = `
    <defs>
      <filter id="amjTruckShadow" x="-80%" y="-80%" width="260%" height="260%">
        <feDropShadow dx="0" dy="1.6" stdDeviation="2.6" flood-color="#03070f" flood-opacity="0.55"/>
      </filter>
    </defs>
    <path class="truck-road" fill="none"></path>
    <image class="truck" filter="url(#amjTruckShadow)" x="-29" y="-14.5" width="58" height="29" preserveAspectRatio="xMidYMid meet"></image>`;
  track.appendChild(svg);

  const road = svg.querySelector('.truck-road');
  const truck = svg.querySelector('.truck');

  let W = 0, H = 0, len = 0, on = false, ticking = false, heroH = 0;

  function build() {
    on = window.innerWidth >= 1024;
    track.style.display = on ? 'block' : 'none';
    if (!on) return;
    if (!truck.getAttribute('href')) truck.setAttribute('href', 'assets/truck-art.svg');

    W = window.innerWidth;
    H = window.innerHeight;
    const hero = document.querySelector('.hero');
    heroH = hero ? hero.offsetHeight : H;
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    // full-width elliptical serpentine: the truck sweeps left <-> right as it descends
    const pad = 48, mid = W / 2, amp = (W - 2 * pad) / 2;
    const yTop = 96, yBot = H - 46, N = 150, waves = 2.5;
    let d = '';
    for (let i = 0; i <= N; i++) {
      const tt = i / N;
      const y = yTop + (yBot - yTop) * tt;
      const x = mid + amp * Math.sin(tt * Math.PI * waves);
      d += (i ? ' L ' : 'M ') + x.toFixed(1) + ' ' + y.toFixed(1);
    }
    road.setAttribute('d', d);
    len = road.getTotalLength();
    place();
  }

  function place() {
    if (!on) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const span = max - heroH;
    const prog = span > 0 ? Math.min(1, Math.max(0, (window.scrollY - heroH) / span)) : 0;
    const l = prog * len;
    const p = road.getPointAtLength(l);
    const q = road.getPointAtLength(Math.min(len, l + 1.5));
    const ang = Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI;
    truck.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${ang.toFixed(1)})`);
    // never on the hero — fade in once the hero has (mostly) scrolled away
    const op = Math.min(1, Math.max(0, (window.scrollY - heroH * 0.7) / (heroH * 0.3)));
    truck.style.opacity = op.toFixed(2);
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { place(); ticking = false; });
  }

  function init() {
    document.body.appendChild(track);
    build();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', build, { passive: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
