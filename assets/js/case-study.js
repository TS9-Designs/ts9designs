/**
 * Case study "On this page" list: marks the section currently being read
 * (the last heading that has scrolled past the top quarter of the screen).
 * The links work without this script; it only moves the highlight.
 */
(function () {
  var toc = document.querySelector('.cs-toc');
  if (!toc) return;
  var links = Array.prototype.slice.call(toc.querySelectorAll('a[href^="#"]'));
  var sections = links
    .map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); })
    .filter(Boolean);
  if (!sections.length) return;

  var queued = false;
  function update() {
    queued = false;
    var line = window.innerHeight * 0.25;
    var current = sections[0];
    sections.forEach(function (s) { if (s.getBoundingClientRect().top < line) current = s; });
    links.forEach(function (a) {
      if (a.getAttribute('href') === '#' + current.id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }

  window.addEventListener('scroll', function () {
    if (!queued) { queued = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
