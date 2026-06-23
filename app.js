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
  }, { threshold: 0.06, rootMargin: '0px 0px -2% 0px' });
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
    const fmt = (v) => v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    if (!motionOn()) { el.textContent = fmt(target); return; }
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * eased);
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = fmt(target);
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
    const original = track.innerHTML;
    track.innerHTML = original + original;

    let x = 0;
    let loopWidth = 0;
    let last = performance.now();

    const measureLoop = () => {
      const itemCount = track.children.length / 2;
      const first = track.children[0];
      const repeat = track.children[itemCount];
      if (!first || !repeat) return;
      loopWidth = repeat.getBoundingClientRect().left - first.getBoundingClientRect().left;
      x = loopWidth ? x % loopWidth : 0;
      track.style.transform = `translate3d(${-x}px, 0, 0)`;
    };

    measureLoop();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureLoop);
    window.addEventListener('resize', measureLoop, { passive: true });

    function marq(now) {
      if (motionOn() && loopWidth > 0) {
        const dt = Math.min(now - last, 64);
        x = (x + dt * 0.035) % loopWidth;
        track.style.transform = `translate3d(${-x}px, 0, 0)`;
      }
      last = now;
      requestAnimationFrame(marq);
    }
    requestAnimationFrame(marq);
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
    const closeBtns = menu.querySelectorAll('[data-menu-close]');
    const setMenu = (open) => {
      document.body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    };
    burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
    closeBtns.forEach((btn) => btn.addEventListener('click', () => setMenu(false)));
    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

    menu.querySelectorAll('.mm-dd').forEach((dd) => {
      const toggle = dd.querySelector('.mm-dd-toggle');
      if (!toggle) return;
      toggle.addEventListener('click', () => {
        const open = dd.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
  }

  /* ---- Contact: preselect enquiry type from ?topic= ---- */
  const topicSel = document.querySelector('select[name="topic"]');
  const topicQ = new URLSearchParams(location.search).get('topic');
  if (topicSel && topicQ) {
    const want = topicQ.toLowerCase();
    for (const opt of topicSel.options) {
      const label = opt.text.toLowerCase();
      const value = opt.value.toLowerCase();
      if (label.includes(want) || value.includes(want)) { topicSel.value = opt.value; break; }
    }
  }
})();
