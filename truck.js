/* ============================================================
   Scroll-linked delivery truck (top-down).
   Winds down a curved road in the left page margin, positioned
   by scroll progress: scroll down drives it down, scroll up
   reverses it. Stays strictly in the margin (off the content);
   auto-hides when the margin is too narrow.
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
    <g class="truck" filter="url(#amjTruckShadow)">
      <rect x="-12" y="-25" width="24" height="31" rx="3.2" fill="#e9eef4" stroke="#14324f" stroke-width="1"/>
      <line x1="-12" y1="-9" x2="12" y2="-9" stroke="#b9c4d2" stroke-width="0.8"/>
      <rect x="-14.6" y="-19" width="3.4" height="9" rx="1.6" fill="#1b1c22"/>
      <rect x="11.2" y="-19" width="3.4" height="9" rx="1.6" fill="#1b1c22"/>
      <rect x="-14.6" y="-1" width="3.4" height="8" rx="1.6" fill="#1b1c22"/>
      <rect x="11.2" y="-1" width="3.4" height="8" rx="1.6" fill="#1b1c22"/>
      <rect x="-12" y="5" width="24" height="14" rx="3.2" fill="#164f7a" stroke="#14324f" stroke-width="1"/>
      <rect x="-8.5" y="12.5" width="17" height="4.5" rx="1.8" fill="#bcd6ee"/>
      <circle cx="-6.6" cy="9" r="1.2" fill="#ffe0a0"/>
      <circle cx="6.6" cy="9" r="1.2" fill="#ffe0a0"/>
    </g>`;
  track.appendChild(svg);

  const road = svg.querySelector('.truck-road');
  const truck = svg.querySelector('.truck');

  let W = 0, H = 0, len = 0, on = false, ticking = false;

  function build() {
    const wrap = document.querySelector('.sect .wrap') || document.querySelector('.wrap');
    const margin = wrap ? wrap.getBoundingClientRect().left : 0;
    on = margin >= 90 && window.innerWidth >= 1024;
    track.style.display = on ? 'block' : 'none';
    if (!on) return;

    W = Math.min(152, margin);
    H = window.innerHeight;
    track.style.width = W + 'px';
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    // winding road kept strictly inside the margin band [16, W-16]
    const x0 = 16, x1 = W - 16, mid = (x0 + x1) / 2, amp = (x1 - x0) / 2;
    const yTop = 100, yBot = H - 30, N = 96;
    let d = '';
    for (let i = 0; i <= N; i++) {
      const tt = i / N;
      const y = yTop + (yBot - yTop) * tt;
      const x = mid + amp * Math.sin(tt * Math.PI * 3);
      d += (i ? ' L ' : 'M ') + x.toFixed(1) + ' ' + y.toFixed(1);
    }
    road.setAttribute('d', d);
    len = road.getTotalLength();
    place();
  }

  function place() {
    if (!on) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const prog = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    const l = prog * len;
    const p = road.getPointAtLength(l);
    const q = road.getPointAtLength(Math.min(len, l + 1.5));
    const ang = Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI;
    truck.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${(ang - 90).toFixed(1)})`);
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
