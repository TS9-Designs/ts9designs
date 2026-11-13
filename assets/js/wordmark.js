/**
 * Header wordmark: "ts9" stays fixed while the rest types out a discipline,
 * then settles back on "designs" (ts9designs).
 *
 * - Default run (mep, structural, fire, hvac) plays once per visit, on the
 *   first page the visitor opens. After that it only plays on logo hover.
 * - A page can name its own disciplines with <body data-wordmark="mep fire">.
 *   That list plays on every load of that page (case studies use this).
 * - Any element with data-wordmark (e.g. a project card) types its
 *   disciplines into the logo while hovered or focused.
 * - The slot reserves the width of the widest word, so the header never shifts.
 * - Each word change fires a "ts9:wordmark" event on document (detail.word).
 * - Visitors who prefer reduced motion get the static "ts9designs".
 */
(function () {
  var REST = 'designs';
  var DEFAULT_WORDS = ['mep', 'structural', 'fire', 'hvac'];
  var TYPE_MS = 75;
  var ERASE_MS = 40;
  var HOLD_MS = 900;
  var START_DELAY_MS = 1000;
  var SESSION_KEY = 'ts9-wordmark-played';

  function reducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function words(attr) {
    return (attr || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
  }

  function sessionGet() {
    try { return window.sessionStorage.getItem(SESSION_KEY); } catch (e) { return null; }
  }
  function sessionSet() {
    try { window.sessionStorage.setItem(SESSION_KEY, '1'); } catch (e) { /* storage blocked */ }
  }

  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function Wordmark(mark) {
    this.mark = mark;
    this.slot = mark.querySelector('.wm-slot');
    this.run = 0; // bumped on every new sequence; older sequences stop themselves
  }

  Wordmark.prototype.emit = function (word) {
    document.dispatchEvent(new CustomEvent('ts9:wordmark', { detail: { word: word } }));
  };

  Wordmark.prototype.reserveWidth = function (candidates) {
    var slot = this.slot;
    var original = slot.textContent;
    var widest = 0;
    candidates.forEach(function (w) {
      slot.textContent = w;
      widest = Math.max(widest, slot.getBoundingClientRect().width);
    });
    slot.textContent = original;
    // Reserve on the word+caret wrapper so the caret stays right after the text.
    var box = this.mark.querySelector('.wm-tail') || slot;
    if (widest) box.style.minWidth = Math.ceil(widest + 6) + 'px';
  };

  // Erase the current word, then type the next one. Resolves false if a newer
  // sequence took over part-way through.
  Wordmark.prototype.swap = async function (word, id) {
    var slot = this.slot;
    while (slot.textContent.length) {
      if (id !== this.run) return false;
      slot.textContent = slot.textContent.slice(0, -1);
      await wait(ERASE_MS);
    }
    this.emit(word);
    for (var i = 1; i <= word.length; i++) {
      if (id !== this.run) return false;
      slot.textContent = word.slice(0, i);
      await wait(TYPE_MS);
    }
    return true;
  };

  // Type each word in turn. With settle=true it ends back on "designs".
  Wordmark.prototype.play = async function (list, settle) {
    if (reducedMotion() || !list.length) return;
    var id = ++this.run;
    this.mark.classList.add('is-typing');
    var seq = settle ? list.concat(REST) : list;
    for (var i = 0; i < seq.length; i++) {
      if (seq[i] === this.slot.textContent && i === 0) continue;
      if (!(await this.swap(seq[i], id))) return;
      if (i < seq.length - 1) {
        await wait(HOLD_MS);
        if (id !== this.run) return;
      }
    }
    if (id === this.run) this.mark.classList.remove('is-typing');
  };

  // Hover on a card: cycle its words for as long as the pointer stays.
  Wordmark.prototype.hold = async function (list) {
    if (reducedMotion() || !list.length) return;
    var id = ++this.run;
    this.mark.classList.add('is-typing');
    for (var i = 0; ; i = (i + 1) % list.length) {
      if (list[i] !== this.slot.textContent) {
        if (!(await this.swap(list[i], id))) return;
      }
      if (list.length === 1) { this.mark.classList.remove('is-typing'); return; }
      await wait(HOLD_MS * 1.4);
      if (id !== this.run) return;
    }
  };

  Wordmark.prototype.release = function () {
    var self = this;
    var id = ++this.run;
    setTimeout(function () {
      if (id !== self.run) return; // another card was hovered meanwhile
      self.play([REST], false);
    }, 250);
  };

  /* ---- cards and other elements that name their disciplines ---- */
  function wireTriggers(wm) {
    var triggers = document.querySelectorAll('[data-wordmark]:not(body)');
    triggers.forEach(function (t) {
      var list = words(t.getAttribute('data-wordmark'));
      var enter = function () { wm.hold(list); };
      var leave = function () { wm.release(); };
      t.addEventListener('mouseenter', enter);
      t.addEventListener('mouseleave', leave);
      t.addEventListener('focusin', enter);
      t.addEventListener('focusout', leave);
    });
  }

  function triggerWords() {
    var all = [];
    document.querySelectorAll('[data-wordmark]').forEach(function (t) {
      all = all.concat(words(t.getAttribute('data-wordmark')));
    });
    return all;
  }

  function init(scope) {
    var mark = (scope || document).querySelector('.logo-word[data-wordmark-cycle]');
    if (!mark || mark.dataset.wordmarkReady) return;
    mark.dataset.wordmarkReady = '1';
    if (!mark.querySelector('.wm-slot')) return;

    var wm = new Wordmark(mark);
    var pageWords = words(document.body.getAttribute('data-wordmark'));
    var sequence = pageWords.length ? pageWords : DEFAULT_WORDS;

    var reserve = function () {
      wm.reserveWidth(DEFAULT_WORDS.concat(triggerWords(), REST));
    };
    reserve();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(reserve);

    wireTriggers(wm);

    var link = mark.closest('a') || mark;
    var replay = function () { if (wm.slot.textContent === REST) wm.play(sequence, true); };
    link.addEventListener('mouseenter', replay);
    link.addEventListener('focus', replay);

    var firstVisit = !sessionGet();
    if (pageWords.length || firstVisit) {
      sessionSet();
      setTimeout(function () { wm.play(sequence, true); }, START_DELAY_MS);
    }

    window.ts9Wordmark = wm;
  }

  window.ts9InitWordmark = init;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(document); });
  } else {
    init(document);
  }
})();
