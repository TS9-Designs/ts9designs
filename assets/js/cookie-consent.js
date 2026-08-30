/**
 * Sitewide cookie-consent banner + gate.
 *
 * This tag must be the first <script> in <head> on every page (before any
 * tracker snippets), so window.TS9_CONSENT exists by the time they run.
 *
 * Trackers (GA, Meta Pixel, Clarity) must not fire until the visitor has
 * accepted. Each tracker snippet registers a callback instead of running
 * immediately:
 *
 *   window.TS9_CONSENT.onDecision(function (granted) {
 *     if (!granted) return;
 *     // ...original tracker init code...
 *   });
 *
 * onDecision() fires the callback right away if consent was already decided
 * on a previous visit, or queues it until the visitor clicks Accept/Decline.
 */
(function () {
  var STORAGE_KEY = 'ts9_cookie_consent';
  var decided = false;
  var granted = false;

  function getStored() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function setStored(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch (e) {}
  }

  function runQueue() {
    var queue = window.TS9_CONSENT_QUEUE || [];
    window.TS9_CONSENT_QUEUE = [];
    queue.forEach(function (fn) {
      try {
        fn(granted);
      } catch (e) {}
    });
  }

  function decide(value) {
    decided = true;
    granted = value === 'granted';
    setStored(value);
    runQueue();
    hideBanner();
  }

  window.TS9_CONSENT = {
    onDecision: function (fn) {
      if (decided) {
        fn(granted);
      } else {
        (window.TS9_CONSENT_QUEUE = window.TS9_CONSENT_QUEUE || []).push(fn);
      }
    }
  };

  var bannerEl = null;

  function hideBanner() {
    if (bannerEl && bannerEl.parentNode) {
      bannerEl.parentNode.removeChild(bannerEl);
    }
    document.documentElement.classList.remove('ts9-cookie-banner-open');
  }

  function injectStyles() {
    var style = document.createElement('style');
    style.textContent = [
      '.ts9-cookie-banner{position:fixed;left:0;right:0;bottom:0;z-index:999;',
      'background:#ffffff;border-top:2px solid #0f172a;',
      'box-shadow:0 -8px 24px rgba(15,23,42,0.08);',
      'font-family:"Montserrat",sans-serif;}',
      '.ts9-cookie-banner__inner{max-width:1200px;margin:0 auto;padding:1.1rem 1.5rem;',
      'display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:1rem;}',
      '.ts9-cookie-banner__text{flex:1 1 380px;font-size:0.85rem;line-height:1.55;color:#334155;margin:0;}',
      '.ts9-cookie-banner__text a{color:#4da6e7;text-decoration:underline;}',
      '.ts9-cookie-banner__actions{display:flex;gap:0.6rem;flex-shrink:0;}',
      '.ts9-cookie-btn{border:none;cursor:pointer;border-radius:4px;padding:0.6rem 1.2rem;',
      'font-size:0.76rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;',
      'font-family:inherit;transition:background-color 0.2s ease,border-color 0.2s ease,color 0.2s ease;}',
      '.ts9-cookie-btn--accept{background:#0f172a;color:#ffffff;}',
      '.ts9-cookie-btn--accept:hover{background:#4da6e7;}',
      '.ts9-cookie-btn--decline{background:#ffffff;color:#334155;border:1px solid #cbd5e1;}',
      '.ts9-cookie-btn--decline:hover{border-color:#0f172a;color:#0f172a;}',
      '@media (max-width:600px){.ts9-cookie-banner__inner{padding:1rem;}',
      '.ts9-cookie-banner__actions{width:100%;}.ts9-cookie-btn{flex:1 1 0;}}'
    ].join('');
    document.head.appendChild(style);
  }

  function showBanner() {
    injectStyles();

    bannerEl = document.createElement('div');
    bannerEl.className = 'ts9-cookie-banner';
    bannerEl.setAttribute('role', 'region');
    bannerEl.setAttribute('aria-label', 'Cookie notice');
    bannerEl.innerHTML =
      '<div class="ts9-cookie-banner__inner">' +
        '<p class="ts9-cookie-banner__text">' +
          'We use cookies for essential site functionality and to understand how visitors use this site. ' +
          'See our <a href="/privacypolicy.html">Privacy Policy</a> for details.' +
        '</p>' +
        '<div class="ts9-cookie-banner__actions">' +
          '<button type="button" class="ts9-cookie-btn ts9-cookie-btn--decline" id="ts9CookieDecline">Decline</button>' +
          '<button type="button" class="ts9-cookie-btn ts9-cookie-btn--accept" id="ts9CookieAccept">Accept</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(bannerEl);

    document.getElementById('ts9CookieAccept').addEventListener('click', function () {
      decide('granted');
    });
    document.getElementById('ts9CookieDecline').addEventListener('click', function () {
      decide('denied');
    });
  }

  var stored = getStored();
  if (stored === 'granted' || stored === 'denied') {
    decided = true;
    granted = stored === 'granted';
    runQueue();
    return;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showBanner);
  } else {
    showBanner();
  }
})();
