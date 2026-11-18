/**
 * Header nav highlight: a soft pill glides under the hovered (or focused)
 * link and settles back on the current page, which also gets a small gold
 * dot. On pages with no current link in the list, the pill fades out when
 * the pointer leaves. Phones use the drop-down sheet instead (CSS hides
 * both marks there).
 *
 * Works with the shared header (load-header.js calls TS9_initSiteNav after
 * mounting it) and with pages that write the header into their own HTML.
 *
 * Nothing is measured during page load: CSS draws the current page's pill and
 * dot on the link itself, and the gliding version takes over (in the same
 * spot) the first time the pointer or keyboard reaches the menu.
 */
(function () {
  function init(scope) {
    var root = scope || document;
    root.querySelectorAll('.nav-links:not([data-glide-ready])').forEach(function (list) {
      var glide = list.querySelector('.nav-glide');
      var dot = list.querySelector('.nav-dot');
      if (!glide || !dot) return;
      list.setAttribute('data-glide-ready', '');

      var links = Array.prototype.slice.call(list.querySelectorAll('a'));
      var current = function () { return list.querySelector('a[aria-current]'); };

      var ready = false;
      function getReady() {
        if (ready) return;
        ready = true;
        list.classList.add('is-gliding');
        place();
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
        if (window.ResizeObserver) new ResizeObserver(place).observe(list);
        else window.addEventListener('resize', place);
      }

      function moveTo(a) {
        getReady();
        glide.style.width = a.offsetWidth + 'px';
        glide.style.transform = 'translateX(' + a.offsetLeft + 'px)';
        glide.classList.add('is-on');
      }

      function settle() {
        var cur = current();
        if (cur) moveTo(cur); else glide.classList.remove('is-on');
      }

      // Place everything without animating (first paint, resize, font load).
      function place() {
        glide.style.transition = 'none';
        dot.style.transition = 'none';
        settle();
        var cur = current();
        if (cur) {
          dot.style.transform = 'translateX(' + (cur.offsetLeft + cur.offsetWidth / 2 - 2) + 'px)';
          dot.classList.add('is-on');
        } else {
          dot.classList.remove('is-on');
        }
        void glide.offsetWidth;
        glide.style.transition = '';
        dot.style.transition = '';
      }

      links.forEach(function (a) {
        a.addEventListener('mouseenter', function () { moveTo(a); });
        a.addEventListener('focus', function () { moveTo(a); });
      });
      list.addEventListener('mouseleave', settle);
      list.addEventListener('focusout', function (e) {
        if (!list.contains(e.relatedTarget)) settle();
      });

      list.addEventListener('pointerenter', getReady);
      list.addEventListener('focusin', getReady);
    });
  }

  window.TS9_initSiteNav = init;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(); });
  } else {
    init();
  }
})();
