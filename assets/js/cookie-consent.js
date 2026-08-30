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
      '.ts9-cookie-banner{position:fixed;left:1.25rem;bottom:1.25rem;z-index:999;',
      'width:min(380px, calc(100% - 2.5rem));',
      'background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;',
      'box-shadow:0 20px 45px rgba(15,23,42,0.14);padding:1.35rem;',
      'font-family:"Montserrat",sans-serif;',
      'opacity:0;transform:translateY(12px);transition:opacity 0.3s ease,transform 0.3s ease;}',
      '.ts9-cookie-banner.is-visible{opacity:1;transform:translateY(0);}',
      '.ts9-cookie-banner__icon{width:38px;height:38px;border-radius:10px;background:#f1f5f9;',
      'display:flex;align-items:center;justify-content:center;color:#0f172a;margin-bottom:0.9rem;}',
      '.ts9-cookie-banner__icon svg{width:20px;height:20px;}',
      '.ts9-cookie-banner__text{font-size:0.85rem;line-height:1.6;color:#334155;margin:0 0 1.1rem;}',
      '.ts9-cookie-banner__text a{color:#4da6e7;text-decoration:underline;}',
      '.ts9-cookie-banner__actions{display:flex;gap:0.6rem;}',
      '.ts9-cookie-btn{border:none;cursor:pointer;border-radius:15px;padding:0.65rem 1rem;flex:1 1 0;',
      'font-size:0.82rem;font-weight:600;font-family:inherit;',
      'transition:background-color 0.2s ease,border-color 0.2s ease,color 0.2s ease;}',
      '.ts9-cookie-btn--accept{background:#0f172a;color:#ffffff;}',
      '.ts9-cookie-btn--accept:hover{background:#d5a80f;color:#0f172a;}',
      '.ts9-cookie-btn--decline{background:#ffffff;color:#334155;border:1px solid #cbd5e1;}',
      '.ts9-cookie-btn--decline:hover{border-color:#0f172a;color:#0f172a;}',
      '@media (max-width:480px){.ts9-cookie-banner{left:0.75rem;right:0.75rem;bottom:0.75rem;width:auto;}}'
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
      '<div class="ts9-cookie-banner__icon" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<circle cx="12" cy="12" r="9"/>' +
          '<circle cx="9" cy="9" r="0.6" fill="currentColor"/>' +
          '<circle cx="14.5" cy="10.5" r="0.6" fill="currentColor"/>' +
          '<circle cx="10" cy="14" r="0.6" fill="currentColor"/>' +
          '<circle cx="14" cy="15" r="0.6" fill="currentColor"/>' +
        '</svg>' +
      '</div>' +
      '<p class="ts9-cookie-banner__text">' +
        'We use cookies for essential site functionality and to understand how visitors use this site. ' +
        'See our <a href="/privacypolicy.html">Privacy Policy</a> for details.' +
      '</p>' +
      '<div class="ts9-cookie-banner__actions">' +
        '<button type="button" class="ts9-cookie-btn ts9-cookie-btn--decline" id="ts9CookieDecline">Decline</button>' +
        '<button type="button" class="ts9-cookie-btn ts9-cookie-btn--accept" id="ts9CookieAccept">Accept</button>' +
      '</div>';

    document.body.appendChild(bannerEl);
    requestAnimationFrame(function () {
      bannerEl.classList.add('is-visible');
    });

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
