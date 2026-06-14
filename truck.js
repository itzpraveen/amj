/* ============================================================
   Scroll-linked delivery truck (top-down).
   Runs straight down the right side of the viewport in sync with
   page scroll progress, like a custom scroll indicator.
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
    on = true;
    track.style.display = 'block';
    if (!truck.getAttribute('href')) truck.setAttribute('href', 'assets/truck-art.svg');

    const mobile = W < 768;
    const hero = document.querySelector('.hero');
    heroH = hero ? hero.offsetHeight : 0;
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    // Keep the right-edge indicator readable without covering the content column.
    const tw = mobile ? 68 : 104, th = tw / 2;
    truck.setAttribute('x', -tw / 2);
    truck.setAttribute('y', -th / 2);
    truck.setAttribute('width', tw);
    truck.setAttribute('height', th);

    const rightInset = mobile ? 24 : 58;
    const x = W - rightInset;
    const yTop = mobile ? 90 : 112;
    const yBot = H - (mobile ? 78 : 92);
    road.setAttribute('d', `M ${x.toFixed(1)} ${yTop.toFixed(1)} L ${x.toFixed(1)} ${yBot.toFixed(1)}`);
    len = road.getTotalLength();
    place();
  }

  function place() {
    if (!on) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const start = Math.min(heroH, max);
    const span = max - start;
    const prog = span > 0 ? Math.min(1, Math.max(0, (window.scrollY - start) / span)) : 0;
    // flip the truck to face its travel direction, so reversing reads as driving back
    if (prog > lastProg + 0.0008) { dir = 1; lastProg = prog; }
    else if (prog < lastProg - 0.0008) { dir = -1; lastProg = prog; }
    const l = prog * len;
    const p = road.getPointAtLength(l);
    const a = road.getPointAtLength(Math.max(0, l - 1.5));
    const b = road.getPointAtLength(Math.min(len, l + 1.5));
    const ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI + (dir < 0 ? 180 : 0);
    truckPos.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
    truck.style.transform = `rotate(${ang.toFixed(1)}deg)`;
    const op = span > 0 ? Math.min(1, Math.max(0, (window.scrollY - start) / 120)) : 0;
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
