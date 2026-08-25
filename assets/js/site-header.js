/**
 * Site header mobile drawer — #mobileNavToggle + #topNav (same behavior as main site).
 */
(function () {
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
})();
