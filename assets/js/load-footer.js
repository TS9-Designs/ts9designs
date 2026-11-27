/**
 * Mounts the shared site footer "component" into <div id="site-footer-root">.
 * Every page gets the same footer. (Pages may still carry an old
 * data-footer-variant attribute; it is ignored.)
 *
 * The partials use a non-.html extension on purpose: VS Code Live Server injects
 * its reload script before every </svg> in .html responses, which truncates
 * the footer markup in local dev.
 */
(function () {
  const root = document.getElementById('site-footer-root');
  if (!root) return;

  // Bump ?v= with site-footer.css so browsers fetch the matching markup.
  const partial = '/assets/partials/footer.partial?v=20261127';

  // The footer stylesheet loads without blocking the page (media="print",
  // switched to "all" once it arrives). Wait for it before showing the
  // footer so it never appears unstyled; give up waiting after 3 seconds.
  const css = document.querySelector('link[href*="site-footer.css"]');
  const cssReady = (!css || css.media !== 'print') ? Promise.resolve() : new Promise(function (resolve) {
    css.addEventListener('load', resolve, { once: true });
    css.addEventListener('error', resolve, { once: true });
    setTimeout(resolve, 3000);
  });

  Promise.all([fetch(partial).then(function (res) { return res.text(); }), cssReady])
    .then(function (results) {
      const html = results[0];
      root.innerHTML = html;
      if (typeof window.TS9_initNewsletterForms === 'function') {
        window.TS9_initNewsletterForms();
      }
    })
    .catch(function (err) {
      console.error('Failed to load site footer:', err);
    });
})();
