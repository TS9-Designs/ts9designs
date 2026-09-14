/**
 * Mounts the shared site footer "component" into <div id="site-footer-root">.
 * The host page picks a variant via data-footer-variant="full" (default) or
 * "compact" on that same div.
 */
(function () {
  const root = document.getElementById('site-footer-root');
  if (!root) return;

  const variant = root.getAttribute('data-footer-variant') === 'compact' ? 'compact' : 'full';
  const partial = variant === 'compact'
    ? '/assets/partials/footer-compact.html'
    : '/assets/partials/footer.html';

  fetch(partial)
    .then(function (res) { return res.text(); })
    .then(function (html) {
      root.innerHTML = html;
      if (typeof window.TS9_initNewsletterForms === 'function') {
        window.TS9_initNewsletterForms();
      }
    })
    .catch(function (err) {
      console.error('Failed to load site footer:', err);
    });
})();
