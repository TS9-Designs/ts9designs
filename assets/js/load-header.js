/**
 * Mounts the shared site header/nav "component" (assets/partials/header.html)
 * into <div id="site-header-root"></div>. The host page declares which nav
 * item is current via <body data-nav-active="home|about|services|pricing|
 * projects|plans|case-studies|estimate"> (omit the attribute for pages with
 * no matching nav item, e.g. contact.html).
 */
(function () {
  const root = document.getElementById('site-header-root');
  if (!root) return;

  fetch('/assets/partials/header.html')
    .then(function (res) { return res.text(); })
    .then(function (html) {
      root.innerHTML = html;
      markActiveLink();
      initToggle();
    })
    .catch(function (err) {
      console.error('Failed to load site header:', err);
    });

  function markActiveLink() {
    const activeKey = document.body.getAttribute('data-nav-active');
    if (!activeKey) return;
    const link = root.querySelector('[data-nav-key="' + activeKey + '"]');
    if (link) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  }

  function initToggle() {
    const toggle = document.getElementById('mobileNavToggle');
    const nav = document.getElementById('topNav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', function () {
      const active = nav.classList.toggle('active');
      toggle.classList.toggle('active', active);
      toggle.setAttribute('aria-expanded', active ? 'true' : 'false');
    });

    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('active');
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('click', function (e) {
      if (!nav.classList.contains('active')) return;
      if (nav.contains(e.target) || toggle.contains(e.target)) return;
      nav.classList.remove('active');
      toggle.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
    });
  }
})();
