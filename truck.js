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
    <g class="truck-pos"><image class="truck" filter="url(#amjTruckShadow)" x="-42" y="-21" width="84" height="42" preserveAspectRatio="xMidYMid meet"></image></g>`;
  track.appendChild(svg);

  const road = svg.querySelector('.truck-road');
  const truck = svg.querySelector('.truck');
  const truckPos = svg.querySelector('.truck-pos');

  let W = 0, H = 0, len = 0, on = false, ticking = false, heroH = 0, lastProg = 0, dir = 1;

  function build() {
    W = window.innerWidth;
    H = window.innerHeight;
    // phones/tablets have no gutter for the truck to drive in — skip entirely
    if (W < 1024) { on = false; track.style.display = 'none'; return; }
    on = true;
    track.style.display = 'block';
    if (!truck.getAttribute('href')) truck.setAttribute('href', 'assets/truck-art.svg');

    const mobile = false;
    const hero = document.querySelector('.hero');
    heroH = hero ? hero.offsetHeight : H;
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    // smaller truck on phones so it doesn't dominate the narrow screen
    const tw = mobile ? 60 : 96, th = tw / 2;
    truck.setAttribute('x', -tw / 2);
    truck.setAttribute('y', -th / 2);
    truck.setAttribute('width', tw);
    truck.setAttribute('height', th);

    // elliptical serpentine: the truck sweeps edge-to-edge as it descends.
    // sine dwells at the screen edges and only zips briefly through the centre,
    // so on mobile it spends most of its time clear of the body text.
    const pad = mobile ? 30 : 48, mid = W / 2, amp = (W - 2 * pad) / 2;
    const yTop = mobile ? 80 : 96, yBot = H - 46, N = 150, waves = mobile ? 3 : 2.5;
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
    // flip the truck to face its travel direction, so reversing reads as driving back
    if (prog > lastProg + 0.0008) { dir = 1; lastProg = prog; }
    else if (prog < lastProg - 0.0008) { dir = -1; lastProg = prog; }
    const l = prog * len;
    const p = road.getPointAtLength(l);
    const q = road.getPointAtLength(Math.min(len, l + 1.5));
    const ang = Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI + (dir < 0 ? 180 : 0);
    truckPos.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
    truck.style.transform = `rotate(${ang.toFixed(1)}deg)`;
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
