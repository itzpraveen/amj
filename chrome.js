/* ============================================================
   AMJ — shared site chrome (nav + mobile menu + footer)
   Injected into inner pages so markup stays identical everywhere.
   Load BEFORE app.js so .nav exists when listeners attach.
   Set the active item with <body data-page="brands"> etc.
   ============================================================ */
(function () {
  const active = document.body.getAttribute('data-page') || '';
  const isA = (id) => id === active ? ' class="is-active"' : '';
  const ddActive = (active === 'brands' || active === 'restaurants') ? ' is-active' : '';

  const navLinks = `
    <a href="history.html"${isA('history')}>Legacy</a>
    <a href="infrastructure.html"${isA('infrastructure')}>Excellence</a>
    <div class="nav-dd${ddActive}">
      <button type="button" class="nav-dd-toggle" aria-haspopup="true" aria-expanded="false">Division <span class="nav-dd-caret" aria-hidden="true">▾</span></button>
      <div class="nav-dd-menu" role="menu">
        <a href="brands.html" role="menuitem"${isA('brands')}>FMCG Brands<small>Distributed food &amp; beverage labels</small></a>
        <a href="restaurants.html" role="menuitem"${isA('restaurants')}>F&amp;B Brands<small>Dining &amp; restaurant concepts</small></a>
      </div>
    </div>
    <a href="news.html"${isA('news')}>Media</a>
    <a href="locate.html"${isA('locate')}>Locate Us</a>`;

  const mmLinks = `
    <a href="history.html"><span class="mm-no">01</span>Legacy</a>
    <a href="infrastructure.html"><span class="mm-no">02</span>Excellence</a>
    <span class="mm-group">Division</span>
    <a href="brands.html"><span class="mm-no">03</span>FMCG Brands</a>
    <a href="restaurants.html"><span class="mm-no">04</span>F&amp;B Brands</a>
    <a href="news.html"><span class="mm-no">05</span>Media</a>
    <a href="locate.html"><span class="mm-no">06</span>Locate Us</a>`;

  const navHTML = `
  <header class="nav nav--inner">
    <div class="wrap">
      <a class="brand" href="index.html" aria-label="Al Majid Jawad home">
        <img class="logo logo-light" src="assets/amj-logo.png" alt="Al Majid Jawad W.L.L" />
        <img class="logo logo-dark" src="assets/amj-logo-white.png" alt="Al Majid Jawad W.L.L" />
      </a>
      <nav class="nav-links">${navLinks}</nav>
      <a class="nav-cta" href="contact.html" data-magnetic="0.35"><span class="pulse"></span>Connect</a>
      <button class="nav-burger" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu">
        <span></span><span></span><span></span>
      </button>
    </div>
  </header>
  <div class="mobile-menu" id="mobile-menu" aria-hidden="true">
    <nav class="mm-links">${mmLinks}</nav>
    <a class="mm-cta" href="contact.html"><span class="pulse"></span>Connect</a>
    <div class="mm-foot">info@amjqatar.me · Doha, State of Qatar</div>
  </div>`;

  const footHTML = `
  <footer class="foot">
    <div class="wrap">
      <div class="foot-top">
        <div class="fbrand">
          <img class="foot-logo" src="assets/amj-logo-original.svg" alt="Al Majid Jawad" width="90" height="52" />
          <p style="color:var(--ink-3);font-size:15px;margin-top:18px;max-width:34ch;">Al Majid Jawad W.L.L — distributing the world's finest food &amp; beverage brands across the State of Qatar since 1997.</p>
        </div>
        <div>
          <h5>Company</h5>
          <ul>
            <li><a href="history.html">Legacy</a></li>
            <li><a href="infrastructure.html">Excellence</a></li>
            <li><a href="brands.html">FMCG Brands</a></li>
            <li><a href="restaurants.html">F&amp;B Brands</a></li>
          </ul>
        </div>
        <div>
          <h5>Explore</h5>
          <ul>
            <li><a href="news.html">Media</a></li>
            <li><a href="locate.html">Locate us</a></li>
            <li><a href="contact.html?topic=careers">Careers</a></li>
            <li><a href="contact.html">Connect</a></li>
          </ul>
        </div>
        <div>
          <h5>Contact</h5>
          <ul>
            <li><a href="mailto:info@amjqatar.me">info@amjqatar.me</a></li>
            <li><a href="https://www.linkedin.com/company/al-majid-jawad/" target="_blank" rel="noopener">LinkedIn</a></li>
            <li><a href="contact.html">Connect</a></li>
          </ul>
        </div>
      </div>
      <div class="foot-bottom">
        <p>© <span id="year">2026</span> Al Majid Jawad W.L.L. All rights reserved.</p>
        <div class="foot-social">
          <a href="https://www.linkedin.com/company/al-majid-jawad/" target="_blank" rel="noopener" aria-label="LinkedIn">in</a>
          <a href="mailto:info@amjqatar.me" aria-label="Email">@</a>
        </div>
      </div>
    </div>
    <div class="foot-mark"><img src="assets/amj-logo-original.svg" alt="" aria-hidden="true" /></div>
  </footer>`;

  function build() {
    const navMount = document.getElementById('amj-nav');
    const footMount = document.getElementById('amj-foot');
    if (navMount) navMount.outerHTML = navHTML;
    if (footMount) footMount.outerHTML = footHTML;
    injectBreadcrumbSchema();
    const yr = document.getElementById('year');
    if (yr) yr.textContent = new Date().getFullYear();
  }

  function injectBreadcrumbSchema() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    const labels = {
      'history.html': 'Legacy',
      'infrastructure.html': 'Excellence',
      'brands.html': 'FMCG Brands',
      'restaurants.html': 'F&B Brands',
      'news.html': 'Media',
      'contact.html': 'Connect',
      'locate.html': 'Locate Us',
      'news-national-sports-day-2026.html': 'National Sports Day 2026',
      'news-outback-porto-arabia.html': 'Outback Porto Arabia Opening',
      'news-frozen-storage-capacity.html': 'Frozen Storage Capacity',
      'news-portfolio-expansion.html': 'Portfolio Expansion'
    };
    const label = labels[path];
    if (!label || document.querySelector('script[data-amj-breadcrumb]')) return;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.amjBreadcrumb = 'true';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://amjqatar.me/'
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: label,
          item: `https://amjqatar.me/${path}`
        }
      ]
    });
    document.head.appendChild(script);
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
