/* ============================================================
   AMJ — interactions
   ============================================================ */
(function () {
  const root = document.documentElement;
  const motionOn = () => root.getAttribute('data-motion') !== 'off';

  /* Enable scroll-reveal hiding only when JS runs and motion is allowed.
     Without this class, .reveal elements stay visible (no-JS / print). */
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.add('reveal-on');
  }

  /* ---- Nav solidify on scroll ---- */
  const nav = document.querySelector('.nav');
  const onScroll = () => {
    if (window.scrollY > 40) nav.classList.add('solid');
    else nav.classList.remove('solid');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- Scroll reveals ---- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  /* Safety net: ensure anything in/above the viewport is shown even if
     IO is delayed (paint throttling, capture contexts). Runs on load and
     once more shortly after, so reveals can never get stuck hidden. */
  function revealInView() {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    document.querySelectorAll('.reveal:not(.in)').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.95) el.classList.add('in');
    });
  }
  window.addEventListener('load', () => { revealInView(); setTimeout(revealInView, 600); });
  setTimeout(revealInView, 1400);

  /* ---- Animated counters ---- */
  function animateCount(el) {
    const target = parseFloat(el.dataset.count);
    const dur = 1700;
    const dec = (el.dataset.dec | 0);
    if (!motionOn()) { el.textContent = target.toFixed(dec); return; }
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(dec);
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target.toFixed(dec);
    }
    requestAnimationFrame(tick);
  }
  const cio = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { animateCount(e.target); cio.unobserve(e.target); }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-count]').forEach((el) => cio.observe(el));

  /* ---- Hero parallax disabled: dune depth must stay stable. ---- */
  const heroBg = document.querySelector('.hero-bg');
  const heroInner = document.querySelector('.hero-inner');
  if (heroBg) heroBg.style.transform = 'none';
  if (heroInner) {
    heroInner.style.transform = 'none';
    heroInner.style.opacity = '1';
  }

  /* ---- Marquee strip (duplicated, css-less JS loop for seamless) ---- */
  const track = document.querySelector('.strip .track');
  if (track) {
    track.innerHTML += track.innerHTML; // duplicate
    let x = 0;
    function marq() {
      if (motionOn()) {
        x -= 0.4;
        if (Math.abs(x) >= track.scrollWidth / 2) x = 0;
        track.style.transform = `translateX(${x}px)`;
      }
      requestAnimationFrame(marq);
    }
    marq();
  }

  /* ---- Restaurant hover thumbnail handled in fx.js ---- */

  /* ---- Newsletter form ---- */
  const form = document.querySelector('.sub-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const inp = form.querySelector('input');
      const btn = form.querySelector('button');
      if (inp.value && inp.value.includes('@')) {
        btn.textContent = 'Subscribed ✓';
        btn.style.background = 'var(--brass)';
        inp.value = '';
        inp.placeholder = 'Thank you — you are on the list.';
        setTimeout(() => { btn.textContent = 'Subscribe'; btn.style.background = ''; inp.placeholder = 'your@email.com'; }, 2600);
      } else {
        inp.style.borderColor = 'var(--accent)';
        inp.focus();
      }
    });
  }

  /* ---- Year ---- */
  const yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---- Mobile menu ---- */
  const burger = document.querySelector('.nav-burger');
  const menu = document.getElementById('mobile-menu');
  if (burger && menu) {
    const setMenu = (open) => {
      document.body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    };
    burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  }
})();
