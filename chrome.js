/* ============================================================
   AMJ — shared site chrome (nav + mobile menu + footer)
   Injected into inner pages so markup stays identical everywhere.
   Load BEFORE app.js so .nav exists when listeners attach.
   Set the active item with <body data-page="brands"> etc.
   ============================================================ */
(function () {
  const NAV = [
    { id: 'history',        label: 'History',        href: 'history.html' },
    { id: 'infrastructure', label: 'Infrastructure', href: 'infrastructure.html' },
    { id: 'brands',         label: 'Brands',         href: 'brands.html' },
    { id: 'restaurants',    label: 'Restaurants',    href: 'restaurants.html' },
    { id: 'news',           label: 'News',           href: 'news.html' },
  ];
  const active = document.body.getAttribute('data-page') || '';

  const navLinks = NAV.map(n =>
    `<a href="${n.href}"${n.id === active ? ' class="is-active"' : ''}>${n.label}</a>`
  ).join('');

  const mmLinks = NAV.map((n, i) =>
    `<a href="${n.href}"><span class="mm-no">0${i + 1}</span>${n.label}</a>`
  ).join('');

  const navHTML = `
  <header class="nav nav--inner">
    <div class="wrap">
      <a class="brand" href="index.html" aria-label="Al Majid Jawad home">
        <img class="logo logo-light" src="assets/amj-logo.png" alt="Al Majid Jawad W.L.L" />
        <img class="logo logo-dark" src="assets/amj-logo-white.png" alt="Al Majid Jawad W.L.L" />
      </a>
      <nav class="nav-links">${navLinks}</nav>
      <a class="nav-cta" href="contact.html" data-magnetic="0.35"><span class="pulse"></span>Ask AMJ</a>
      <button class="nav-burger" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu">
        <span></span><span></span><span></span>
      </button>
    </div>
  </header>
  <div class="mobile-menu" id="mobile-menu" aria-hidden="true">
    <nav class="mm-links">${mmLinks}</nav>
    <a class="mm-cta" href="contact.html"><span class="pulse"></span>Ask AMJ</a>
    <div class="mm-foot">info@amjqatar.me · Doha, State of Qatar</div>
  </div>`;

  const footHTML = `
  <footer class="foot">
    <div class="wrap">
      <div class="foot-top">
        <div class="fbrand">
          <span class="mark">AM<b>J</b></span>
          <p style="color:var(--ink-3);font-size:15px;margin-top:18px;max-width:34ch;">Al Majid Jawad W.L.L — distributing the world's finest food &amp; beverage brands across the State of Qatar since 1997.</p>
        </div>
        <div>
          <h5>Company</h5>
          <ul>
            <li><a href="history.html">History</a></li>
            <li><a href="infrastructure.html">Infrastructure</a></li>
            <li><a href="brands.html">Brands</a></li>
            <li><a href="restaurants.html">Restaurants</a></li>
          </ul>
        </div>
        <div>
          <h5>Connect</h5>
          <ul>
            <li><a href="contact.html">Careers</a></li>
            <li><a href="news.html">News &amp; Events</a></li>
            <li><a href="locate.html">Locate us</a></li>
            <li><a href="contact.html">Contact</a></li>
          </ul>
        </div>
        <div>
          <h5>Contact</h5>
          <ul>
            <li><a href="mailto:info@amjqatar.me">info@amjqatar.me</a></li>
            <li><a href="#">LinkedIn</a></li>
            <li><a href="contact.html">Ask AMJ</a></li>
          </ul>
        </div>
      </div>
      <div class="foot-bottom">
        <p>© <span id="year">2026</span> Al Majid Jawad W.L.L. All rights reserved.</p>
        <div class="foot-social">
          <a href="#" aria-label="LinkedIn">in</a>
          <a href="mailto:info@amjqatar.me" aria-label="Email">@</a>
        </div>
      </div>
    </div>
    <div class="foot-mark">AM<b>J</b></div>
  </footer>`;

  function build() {
    const navMount = document.getElementById('amj-nav');
    const footMount = document.getElementById('amj-foot');
    if (navMount) navMount.outerHTML = navHTML;
    if (footMount) footMount.outerHTML = footHTML;
    const yr = document.getElementById('year');
    if (yr) yr.textContent = new Date().getFullYear();
  }

  // Build synchronously: this script is placed at the end of <body>,
  // so both mount points already exist, and app.js (which wires the
  // nav) runs immediately after — the chrome must be in the DOM first.
  if (document.getElementById('amj-nav') || document.getElementById('amj-foot')) {
    build();
  } else {
    document.addEventListener('DOMContentLoaded', build);
  }
})();
