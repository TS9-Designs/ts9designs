/**
 * Site analytics, one file on every page. Nothing loads until the visitor
 * clicks Accept on the cookie notice (cookie-consent.js); after that this
 * loads the Google tag, Microsoft Clarity, the Meta Pixel and Mailchimp's
 * site script (which shows the Mailchimp popup sign-up form).
 *
 * The Google tag (AW-11480937225) is the combined tag Google Analytics gives
 * for this site's web stream (Admin > Data streams > View tag instructions).
 * It carries its own destinations, the GA4 stream G-5EF8FS2WDW among them,
 * so the page loads the tag and Google applies its configuration.
 *
 * It also records the actions that matter, in both GA and Meta:
 *   - a contact or estimate request sent  GA generate_lead   Meta Lead
 *   - a newsletter sign-up                GA sign_up         Meta NewsletterSignup
 *   - a "Book A Call" (Cal.com) click     GA book_call_click Meta BookCallClick
 *   - a plan checkout started             GA begin_checkout  Meta InitiateCheckout
 *
 * Form sends are picked up by watching window.TS9_sendMail (ts9-mailer.js),
 * so the forms themselves need no analytics code. Other code can call
 * window.TS9_track(name, params) with one of the names in EVENTS.
 */
(function () {
  var GOOGLE_TAG_ID = 'AW-11480937225';
  var CLARITY_ID = 'offy18fm86';
  var PIXEL_ID = '716800377403198';
  var MAILCHIMP_SRC = 'https://chimpstatic.com/mcjs-connected/js/users/917b146be904b4721308c650a/538b9484670cd508dfdf2b5de.js';

  var EVENTS = {
    lead: { ga: 'generate_lead', meta: 'Lead' },
    newsletter: { ga: 'sign_up', metaCustom: 'NewsletterSignup' },
    book_call: { ga: 'book_call_click', metaCustom: 'BookCallClick' },
    checkout: { ga: 'begin_checkout', meta: 'InitiateCheckout' }
  };

  var state = 'waiting'; // waiting | on | off
  var pending = [];

  // Google's own snippet for this tag, loaded after consent.
  function loadGoogleTag() {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtm.js?id=' + GOOGLE_TAG_ID;
    document.head.appendChild(s);
    window.gtag('js', new Date());
  }

  function loadClarity() {
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', CLARITY_ID);
  }

  function loadMetaPixel() {
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
      n.queue = []; t = b.createElement(e); t.async = !0;
      t.src = v; s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', PIXEL_ID);
    window.fbq('track', 'PageView');
  }

  function send(name, params, eventId) {
    var ev = EVENTS[name];
    if (!ev) return;
    params = params || {};
    if (window.gtag) window.gtag('event', ev.ga, params);
    if (window.fbq) {
      // eventID lets Meta de-duplicate this against the server-side copy.
      var opts = eventId ? { eventID: eventId } : undefined;
      if (ev.meta) window.fbq('track', ev.meta, params, opts);
      else window.fbq('trackCustom', ev.metaCustom, params, opts);
    }
  }

  window.TS9_track = function (name, params, eventId) {
    if (state === 'on') send(name, params, eventId);
    else if (state === 'waiting') pending.push([name, params, eventId]);
  };

  function cookie(name) {
    var m = document.cookie.match('(?:^|; )' + name + '=([^;]*)');
    return m ? decodeURIComponent(m[1]) : '';
  }

  function newEventId() {
    return (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
      : String(Date.now()) + '-' + Math.random().toString(36).slice(2);
  }

  // Mailchimp's connected-site script: shows the "Sitewide Email & SMS
  // Capture" popup form and records page visits for subscribers.
  function loadMailchimp() {
    if (document.getElementById('mcjs')) return;
    var s = document.createElement('script');
    s.id = 'mcjs';
    s.async = true;
    s.src = MAILCHIMP_SRC;
    document.head.appendChild(s);
  }

  window.TS9_CONSENT.onDecision(function (granted) {
    if (!granted) { state = 'off'; pending = []; return; }
    state = 'on';
    try { loadGoogleTag(); } catch (e) {}
    try { loadClarity(); } catch (e) {}
    try { loadMetaPixel(); } catch (e) {}
    try { loadMailchimp(); } catch (e) {}
    pending.forEach(function (p) { send(p[0], p[1], p[2]); });
    pending = [];
  });

  // Form sends: wrap the mailer once every deferred script has run.
  function watchMailer() {
    var sendMail = window.TS9_sendMail;
    if (typeof sendMail !== 'function' || sendMail.ts9Tracked) return;
    var wrapped = function (formType, fields, opts) {
      // Only after Accept: share the browser's event id and Meta cookies so
      // the Worker can send the matching server-side event.
      var eventId = '';
      var args = Array.prototype.slice.call(arguments);
      if (state === 'on') {
        eventId = newEventId();
        args[2] = Object.assign({}, opts, {
          meta: { eventId: eventId, fbp: cookie('_fbp'), fbc: cookie('_fbc') }
        });
      }
      var result = sendMail.apply(this, args);
      Promise.resolve(result).then(function () {
        if (formType === 'newsletter') {
          window.TS9_track('newsletter', { page_path: location.pathname }, eventId);
          return;
        }
        var params = { form_type: formType, page_path: location.pathname };
        var low = fields && Number(fields.estimateLow);
        if (formType === 'estimate' && low > 0) { params.value = low; params.currency = 'USD'; }
        window.TS9_track('lead', params, eventId);
      }, function () { /* failed sends are not leads */ });
      return result;
    };
    wrapped.ts9Tracked = true;
    window.TS9_sendMail = wrapped;
  }
  // This file is deferred, so it runs before the mailer script (also deferred)
  // has defined itself. DOMContentLoaded fires after every deferred script;
  // the load event is a fallback. Wrapping twice is prevented by ts9Tracked.
  document.addEventListener('DOMContentLoaded', watchMailer);
  window.addEventListener('load', watchMailer);

  // "Book A Call" links anywhere on the page (they all go to Cal.com).
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="cal.com/"]');
    if (!a) return;
    window.TS9_track('book_call', { link_url: a.href, page_path: location.pathname });
  });
})();
