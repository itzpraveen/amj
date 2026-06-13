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
    <a href="history.html"${isA('history')}>Legacy</a>
    <a href="infrastructure.html"${isA('infrastructure')}>Excellence</a>
    <div class="mm-dd${ddActive}${ddActive ? ' is-open' : ''}">
      <button type="button" class="mm-dd-toggle" aria-expanded="${ddActive ? 'true' : 'false'}">Division <span class="mm-dd-caret" aria-hidden="true">▾</span></button>
      <div class="mm-dd-menu">
        <div class="mm-dd-inner">
          <a href="brands.html"${isA('brands')}>FMCG Brands<small>Distributed food &amp; beverage labels</small></a>
          <a href="restaurants.html"${isA('restaurants')}>F&amp;B Brands<small>Dining &amp; restaurant concepts</small></a>
        </div>
      </div>
    </div>
    <a href="news.html"${isA('news')}>Media</a>
    <a href="locate.html"${isA('locate')}>Locate Us</a>`;

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
    <button class="mm-close" type="button" data-menu-close aria-label="Close menu">
      <span class="mm-close-icon" aria-hidden="true"></span>
      <span>Close</span>
    </button>
    <nav class="mm-links">${mmLinks}</nav>
    <a class="mm-cta" href="contact.html"><span class="pulse"></span>Connect</a>
    <div class="mm-foot">info@amjqatar.me · Doha, State of Qatar</div>
  </div>`;

  const icons = {
    linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
    email: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/></svg>'
  };

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
            <li class="foot-group">
              <span class="foot-group-label">Division</span>
              <ul>
                <li><a href="brands.html">FMCG Brands</a></li>
                <li><a href="restaurants.html">F&amp;B Brands</a></li>
              </ul>
            </li>
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
            <li><a href="https://www.instagram.com/almajidjawadqatar/" target="_blank" rel="noopener">Instagram</a></li>
            <li><a href="https://www.facebook.com/almajidjawadqatar" target="_blank" rel="noopener">Facebook</a></li>
            <li><a href="contact.html">Connect</a></li>
          </ul>
        </div>
      </div>
      <div class="foot-bottom">
        <p>© <span id="year">2026</span> Al Majid Jawad W.L.L. All rights reserved.</p>
        <div class="foot-social">
          <a href="https://www.linkedin.com/company/al-majid-jawad/" target="_blank" rel="noopener" aria-label="LinkedIn">${icons.linkedin}</a>
          <a href="https://www.instagram.com/almajidjawadqatar/" target="_blank" rel="noopener" aria-label="Instagram">${icons.instagram}</a>
          <a href="https://www.facebook.com/almajidjawadqatar" target="_blank" rel="noopener" aria-label="Facebook">${icons.facebook}</a>
          <a href="mailto:info@amjqatar.me" aria-label="Email">${icons.email}</a>
        </div>
      </div>
    </div>
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
