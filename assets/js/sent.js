/**
 * "Sent" confirmation shown after any site form goes through (estimator,
 * contact page, homepage contact form, newsletter).
 *
 *   window.TS9_showSent({ kind, title, text, returnFocus })
 *
 * A line drawing of the project type traces itself (house, apartments,
 * restaurant, storefront, warehouse or a general commercial building), a
 * green check pops in, and the form's own message follows. It closes with
 * "Back to the page", Escape, a click outside, or by itself after a few
 * seconds, and focus goes back to where it was (or to `returnFocus`).
 * With { error: true } it shows the message alone, without the drawing.
 *
 * window.TS9_sentKind(value) maps a form's project-type value to a drawing.
 */
(function () {
  var CLOSE_AFTER_MS = 8000;

  // Drawings share one 200 x 150 frame with the ground line at y = 130.
  var DRAWINGS = {
    house: 'M30 130V72L90 30l60 42v58ZM74 130V98h32v32M42 84h18v16H42ZM120 84h18v16h-18Z',
    apartments: 'M50 130V28h100v102ZM50 40h100M62 50h14v12H62Zm31 0h14v12H93Zm31 0h14v12h-14ZM62 74h14v12H62Zm31 0h14v12H93Zm31 0h14v12h-14ZM62 98h14v12H62Zm62 0h14v12h-14ZM92 130v-20h16v20',
    restaurant: 'M28 130V60h144v70ZM28 60V46h144v14M28 60l8 16h128l8-16M44 90h50v40H44ZM116 130V90h32v40M60 53h80',
    storefront: 'M36 130V38h128v92ZM36 80h128M50 50h100v18H50ZM48 92h46v38H48ZM112 130V92h36v38M130 92v38',
    warehouse: 'M18 130V72l82-22 82 22v58ZM38 130V96h40v34M38 106h40M38 116h40M122 130V96h40v34M122 106h40M122 116h40M92 130v-22h16v22',
    commercial: 'M34 130V40h132v90ZM34 54h132M50 66h24v16H50Zm38 0h24v16H88Zm38 0h24v16h-24ZM50 94h24v16H50Zm76 0h24v16h-24ZM88 130v-30h24v30M80 100h40'
  };

  // Form values (estimator, contact page, homepage form) to a drawing.
  window.TS9_sentKind = function (value) {
    var v = String(value || '').toLowerCase();
    if (/apartment/.test(v)) return 'apartments';
    if (/warehouse/.test(v)) return 'warehouse';
    if (/restaurant|liquor|smoke/.test(v)) return 'restaurant';
    if (/retail|salon|office|medical|dental|build-out|buildout|commercial-renovation/.test(v)) return 'storefront';
    if (/single-family|custom-floor|duplex|residential|pre-designed/.test(v)) return 'house';
    return 'commercial';
  };

  var CSS = [
    '.ts9-sent{position:fixed;inset:0;z-index:1200;display:grid;place-items:center;padding:1.5rem;text-align:center;',
    'background:rgba(255,255,255,.74);-webkit-backdrop-filter:blur(12px) saturate(1.2);backdrop-filter:blur(12px) saturate(1.2);',
    'opacity:0;transition:opacity .5s ease;font-family:"Montserrat","Montserrat Fallback",-apple-system,BlinkMacSystemFont,sans-serif}',
    '@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){.ts9-sent{background:rgba(255,255,255,.95)}}',
    '.ts9-sent.is-in{opacity:1}',
    '.ts9-sent__card{position:relative;width:min(440px,100%)}',
    '.ts9-sent__card:focus{outline:none}',
    '.ts9-sent__art{display:block;width:180px;height:135px;margin:0 auto .75rem}',
    '.ts9-sent__ln{fill:none;stroke:#0f172a;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:1}',
    '.ts9-sent.is-in .ts9-sent__ln{animation:ts9SentDraw 1.3s .2s cubic-bezier(.65,0,.35,1) forwards}',
    '.ts9-sent__dim{fill:none;stroke:#cbd5e1;stroke-width:1;stroke-dasharray:3 4;opacity:0}',
    '.ts9-sent.is-in .ts9-sent__dim{animation:ts9SentShow .5s 1.1s ease forwards}',
    '.ts9-sent__ck circle{fill:#16a34a;transform-origin:170px 32px;transform:scale(0)}',
    '.ts9-sent.is-in .ts9-sent__ck circle{animation:ts9SentPop .45s 1.35s cubic-bezier(.34,1.56,.64,1) forwards}',
    '.ts9-sent__ck path{fill:none;stroke:#fff;stroke-width:2.8;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:24;stroke-dashoffset:24}',
    '.ts9-sent.is-in .ts9-sent__ck path{animation:ts9SentDraw .4s 1.6s ease forwards}',
    '.ts9-sent__msg{opacity:0;transform:translateY(10px)}',
    '.ts9-sent.is-in .ts9-sent__msg{animation:ts9SentRise .6s 1.7s cubic-bezier(.2,.8,.2,1) forwards}',
    '.ts9-sent--error .ts9-sent__msg{animation-delay:.1s!important}',
    '.ts9-sent__title{margin:0;color:#0f172a;font-size:1.35rem;line-height:1.3;font-weight:600;letter-spacing:-.015em}',
    '.ts9-sent__text{margin:.5rem auto 0;max-width:40ch;color:#475569;font-size:.95rem;line-height:1.65}',
    '.ts9-sent__back{display:inline-flex;align-items:center;gap:8px;margin-top:1.4rem;padding:0 0 3px;border:0;border-bottom:1px solid #cbd5e1;',
    'background:none;color:#0f172a;font:inherit;font-size:.9rem;font-weight:600;cursor:pointer;transition:border-color .2s ease}',
    '.ts9-sent__back svg{width:12px;height:12px;transition:transform .2s ease}',
    '.ts9-sent__back:hover{border-color:#0f172a}.ts9-sent__back:hover svg{transform:translateX(2px)}',
    '.ts9-sent__back:focus-visible{outline:2px solid #0f172a;outline-offset:4px;border-radius:2px}',
    '.ts9-sent__timer{display:block;position:relative;height:1px;width:160px;margin:1.4rem auto 0;background:#e6ebf1;overflow:hidden}',
    '.ts9-sent__timer::after{content:"";position:absolute;inset:0;background:#16a34a;transform-origin:left}',
    '.ts9-sent.is-in .ts9-sent__timer::after{animation:ts9SentTimer var(--ts9-sent-ms) linear forwards}',
    '.ts9-sent.is-paused .ts9-sent__timer::after{animation-play-state:paused}',
    '.ts9-sent--error .ts9-sent__timer::after{background:#94a3b8}',
    '@keyframes ts9SentDraw{to{stroke-dashoffset:0}}',
    '@keyframes ts9SentShow{to{opacity:1}}',
    '@keyframes ts9SentPop{to{transform:scale(1)}}',
    '@keyframes ts9SentRise{to{opacity:1;transform:none}}',
    '@keyframes ts9SentTimer{from{transform:scaleX(1)}to{transform:scaleX(0)}}',
    '@media (prefers-reduced-motion:reduce){.ts9-sent{transition:none}',
    '.ts9-sent.is-in .ts9-sent__ln,.ts9-sent.is-in .ts9-sent__dim,.ts9-sent.is-in .ts9-sent__ck circle,.ts9-sent.is-in .ts9-sent__ck path,.ts9-sent.is-in .ts9-sent__msg{animation-duration:.01s;animation-delay:0s}}',
    '@media (forced-colors:active){.ts9-sent__ln{stroke:CanvasText}.ts9-sent__back{border-bottom-color:ButtonText}}'
  ].join('');

  var styled = false;
  var open = null;

  function close() {
    if (!open) return;
    var o = open;
    open = null;
    clearTimeout(o.timer);
    document.removeEventListener('keydown', o.onKey);
    o.el.classList.remove('is-in');
    setTimeout(function () { if (o.el.parentNode) o.el.parentNode.removeChild(o.el); }, 520);
    var target = o.returnFocus && document.contains(o.returnFocus) ? o.returnFocus : o.before;
    if (target && target.focus) target.focus({ preventScroll: true });
  }

  window.TS9_showSent = function (opts) {
    opts = opts || {};
    if (open) close();
    if (!styled) {
      var style = document.createElement('style');
      style.textContent = CSS;
      document.head.appendChild(style);
      styled = true;
    }
    var path = DRAWINGS[opts.kind] || DRAWINGS.commercial;
    var el = document.createElement('div');
    el.className = 'ts9-sent' + (opts.error ? ' ts9-sent--error' : '');
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', 'ts9SentTitle');
    el.setAttribute('aria-describedby', 'ts9SentText');
    el.style.setProperty('--ts9-sent-ms', CLOSE_AFTER_MS + 'ms');
    el.innerHTML =
      '<div class="ts9-sent__card" tabindex="-1">' +
        (opts.error ? '' :
          '<svg class="ts9-sent__art" viewBox="0 0 200 150" aria-hidden="true">' +
            '<path class="ts9-sent__ln" pathLength="1" d="' + path + '"/>' +
            '<path class="ts9-sent__dim" d="M24 142h152M12 40v90"/>' +
            '<g class="ts9-sent__ck"><circle cx="170" cy="32" r="17"/><path d="M162 32.5l5.2 5.2 9.6-10"/></g>' +
          '</svg>') +
        '<div class="ts9-sent__msg">' +
          '<h2 class="ts9-sent__title" id="ts9SentTitle"></h2>' +
          '<p class="ts9-sent__text" id="ts9SentText"></p>' +
          '<button type="button" class="ts9-sent__back">Back to the page' +
            '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>' +
          '</button>' +
          '<span class="ts9-sent__timer" aria-hidden="true"></span>' +
        '</div>' +
      '</div>';
    el.querySelector('.ts9-sent__title').textContent = opts.title || '';
    var text = el.querySelector('.ts9-sent__text');
    if (opts.text) text.textContent = opts.text; else text.parentNode.removeChild(text);
    document.body.appendChild(el);

    var o = { el: el, before: document.activeElement, returnFocus: opts.returnFocus || null };
    o.onKey = function (e) { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', o.onKey);
    el.querySelector('.ts9-sent__back').addEventListener('click', close);
    el.addEventListener('click', function (e) { if (e.target === el) close(); });
    // The timer hairline pauses while the pointer is over the message.
    var card = el.querySelector('.ts9-sent__card');
    var started = 0, remaining = CLOSE_AFTER_MS;
    function run() { started = Date.now(); o.timer = setTimeout(close, remaining); }
    card.addEventListener('mouseenter', function () { clearTimeout(o.timer); remaining -= Date.now() - started; el.classList.add('is-paused'); });
    card.addEventListener('mouseleave', function () { el.classList.remove('is-paused'); run(); });
    open = o;

    void el.offsetWidth;
    el.classList.add('is-in');
    // Focus the card (announced by screen readers, no ring); Tab reaches the button.
    card.focus({ preventScroll: true });
    run();
  };
})();
