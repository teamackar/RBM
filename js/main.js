/* Rathi's Build Mart — home page behaviour */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conn = navigator.connection || {};
  var saveData = conn.saveData === true;

  /* ── Hero video ─────────────────────────────────────────
     Held back until load so the poster paints first. Skipped
     entirely on data-saver or reduced-motion, where the
     poster frame is the whole hero.                        */
  (function heroVideo() {
    var video = document.getElementById('hero-video');
    if (!video) return;

    if (saveData || reduceMotion) return;

    var src = video.dataset.src;
    if (!src) return;

    function start() {
      video.src = src;
      video.load();
      var played = video.play();
      if (played && played.catch) {
        played.catch(function () { /* autoplay blocked — poster stands in */ });
      }
    }

    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });

    // Don't burn cycles decoding video the user can't see.
    document.addEventListener('visibilitychange', function () {
      if (!video.src) return;
      if (document.hidden) video.pause();
      else video.play().catch(function () {});
    });
  }());

  /* ── Nav ───────────────────────────────────────────────── */
  (function nav() {
    var header = document.getElementById('nav');
    var menu = document.getElementById('nav-menu');
    var toggle = document.querySelector('.nav__toggle');
    if (!header) return;

    var lastY = Math.max(0, window.scrollY);
    var maxY = 0;
    var travel = 0;          // distance covered in the current direction
    var REVEAL_ZONE = 140;   // always visible this near the top
    var TRIGGER = 10;        // px of travel one way before the header reacts

    function measure() {
      maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    }

    function menuIsOpen() {
      return !!toggle && toggle.getAttribute('aria-expanded') === 'true';
    }

    function showNav() { header.classList.remove('is-hidden'); }

    /* Deliberately synchronous. Batching this behind rAF buys nothing —
       it is two class toggles — and a callback that never fires (a
       backgrounded tab on load, a throttled first frame) would latch the
       guard and kill the header for the rest of the session.

       Travel is accumulated rather than tested per event. A trackpad
       reports scrolling in 1-5px increments, so any per-event threshold
       large enough to reject jitter is also large enough to reject real
       scrolling, and the header would never move. */
    function onScroll() {
      var y = Math.max(0, window.scrollY);

      // Clamp to the document: iOS rubber-band reports positions past
      // the end, which reads as a direction change and flaps the header.
      if (y > maxY) {
        measure();
        y = Math.min(y, maxY);
      }

      var diff = y - lastY;
      lastY = y;

      header.classList.toggle('is-scrolled', y > 8);

      if (y <= REVEAL_ZONE || menuIsOpen()) {
        travel = 0;
        showNav();
        return;
      }

      if (diff === 0) return;

      // Turning around restarts the count, so a reversal takes effect
      // after TRIGGER px rather than having to undo the whole run.
      if ((diff > 0) !== (travel > 0)) travel = 0;
      travel += diff;

      if (travel > TRIGGER) header.classList.add('is-hidden');
      else if (travel < -TRIGGER) showNav();
    }

    measure();
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);

    // Tabbing into a retreated header must bring it back.
    header.addEventListener('focusin', showNav);

    if (!toggle || !menu) return;

    function setMenu(open) {
      menu.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      if (open) showNav();
    }

    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });

    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        toggle.focus();
      }
    });

    document.addEventListener('click', function (e) {
      if (toggle.getAttribute('aria-expanded') !== 'true') return;
      if (!e.target.closest('.nav__inner')) setMenu(false);
    });

    window.matchMedia('(min-width: 901px)').addEventListener('change', function (e) {
      if (e.matches) setMenu(false);
    });
  }());

  /* ── Rails ─────────────────────────────────────────────
     One implementation for every horizontal rail on the page.
     A rail declares itself with a [data-rail-group] wrapper
     holding the scroller, its arrows and its progress bar.  */
  function initRail(group) {
    var el = group.querySelector('.rail');
    if (!el) return;

    var prev = group.querySelector('[data-rail-prev]');
    var next = group.querySelector('[data-rail-next]');
    var bar = group.querySelector('[data-rail-bar]');
    var track = el.querySelector('.rail__track');

    function step() {
      var card = el.querySelector('.rail__track > *:not([hidden])');
      if (!card) return el.clientWidth * 0.8;
      var gap = track ? parseFloat(getComputedStyle(track).columnGap || 0) || 0 : 0;
      var unit = card.getBoundingClientRect().width + gap;
      if (!unit) return el.clientWidth * 0.8;
      // Move a whole number of items, never less than one.
      return Math.max(unit, Math.floor(el.clientWidth / unit) * unit);
    }

    function maxScroll() { return Math.max(0, el.scrollWidth - el.clientWidth); }

    function sync() {
      var max = maxScroll();
      var x = el.scrollLeft;
      if (prev) prev.disabled = x <= 1;
      if (next) next.disabled = x >= max - 1;
      if (bar) {
        var hasOverflow = max > 1;
        bar.style.width = (hasOverflow ? (el.clientWidth / el.scrollWidth) * 100 : 100).toFixed(2) + '%';
        bar.style.marginLeft = (hasOverflow ? (x / el.scrollWidth) * 100 : 0).toFixed(2) + '%';
      }
    }

    // Tab switching needs to re-measure after the contents change.
    el._railSync = sync;

    function scrollBy(dir) {
      el.scrollBy({ left: dir * step(), behavior: reduceMotion ? 'auto' : 'smooth' });
    }

    if (prev) prev.addEventListener('click', function () { scrollBy(-1); });
    if (next) next.addEventListener('click', function () { scrollBy(1); });

    var ticking = false;
    el.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { sync(); ticking = false; });
    }, { passive: true });

    window.addEventListener('resize', sync);
    window.addEventListener('load', sync);
    sync();

    /* Drag to scroll — mouse only. Touch keeps native momentum,
       and a pointer that barely moves still counts as a click. */
    var dragging = false, moved = false, startX = 0, startLeft = 0;

    el.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      dragging = true;
      moved = false;
      startX = e.clientX;
      startLeft = el.scrollLeft;
    });

    el.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - startX;
      if (!moved && Math.abs(dx) < 5) return;
      if (!moved) {
        moved = true;
        el.classList.add('is-dragging');
        el.setPointerCapture(e.pointerId);
      }
      e.preventDefault();
      el.scrollLeft = startLeft - dx;
    });

    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      if (moved) {
        el.classList.remove('is-dragging');
        if (el.hasPointerCapture && el.hasPointerCapture(e.pointerId)) {
          el.releasePointerCapture(e.pointerId);
        }
      }
    }
    el.addEventListener('pointerup', endDrag);
    el.addEventListener('pointercancel', endDrag);
    el.addEventListener('dragstart', function (e) { if (moved) e.preventDefault(); });

    // A drag that ends on a link must not also follow it.
    el.addEventListener('click', function (e) {
      if (!moved) return;
      e.preventDefault();
      e.stopPropagation();
      moved = false;
    }, true);
  }

  Array.prototype.forEach.call(
    document.querySelectorAll('[data-rail-group]'), initRail);

  /* ── Brands by department ──────────────────────────────
     A vertical tablist filtering one shared rail. Tiles are
     hidden rather than re-rendered, so the markup stays in
     the HTML and works with scripting off.                 */
  (function brandTabs() {
    var tabs = document.querySelectorAll('.btab');
    if (!tabs.length) return;

    var rail = document.getElementById('brand-rail');
    var tiles = document.querySelectorAll('.brand');
    var title = document.querySelector('[data-brand-title]');
    var empty = document.querySelector('[data-brand-empty]');
    if (!rail) return;

    function select(tab, focus) {
      var cat = tab.dataset.cat;
      var shown = 0;

      Array.prototype.forEach.call(tiles, function (tile) {
        var match = (' ' + tile.dataset.cats + ' ').indexOf(' ' + cat + ' ') > -1;
        tile.hidden = !match;
        if (match) shown++;
      });

      Array.prototype.forEach.call(tabs, function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });

      /* Up to three rows, but a small department should fill across
         rather than sit in one tall column with the row half empty. */
      rail.style.setProperty('--brand-rows',
        String(Math.min(3, Math.max(1, Math.ceil(shown / 4)))));

      if (title) title.textContent = tab.textContent.trim();
      rail.setAttribute('aria-labelledby', tab.id);
      rail.hidden = shown === 0;
      if (empty) empty.hidden = shown !== 0;

      rail.scrollLeft = 0;
      if (rail._railSync) rail._railSync();
      if (focus) tab.focus();
    }

    // Normalise the initial state so the row count is set from the start.
    var initial = document.querySelector('.btab[aria-selected="true"]') || tabs[0];
    select(initial, false);

    Array.prototype.forEach.call(tabs, function (tab, i) {
      tab.addEventListener('click', function () { select(tab, false); });

      tab.addEventListener('keydown', function (e) {
        var go = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') go = (i + 1) % tabs.length;
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') go = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') go = 0;
        else if (e.key === 'End') go = tabs.length - 1;
        if (go === null) return;
        e.preventDefault();
        select(tabs[go], true);
      });
    });
  }());


  /* ── Testimonial videos ────────────────────────────────
     Nothing downloads until a card is clicked: each <video>
     carries only a poster and a data-src. Roughly 40MB of
     interviews otherwise lands on every visitor.           */
  (function voices() {
    var cards = document.querySelectorAll('.voice');
    if (!cards.length) return;

    var videos = [];

    Array.prototype.forEach.call(cards, function (card) {
      var video = card.querySelector('.voice__video');
      var play = card.querySelector('.voice__play');
      if (!video || !play) return;
      videos.push(video);

      play.addEventListener('click', function () {
        if (!video.src && video.dataset.src) {
          video.src = video.dataset.src;
          video.setAttribute('controls', '');
        }
        var started = video.play();
        if (started && started.catch) {
          started.catch(function () {
            // Autoplay policy or a missing file: hand the controls back.
            card.classList.remove('is-playing');
          });
        }
      });

      // One voice at a time.
      video.addEventListener('play', function () {
        card.classList.add('is-playing');
        videos.forEach(function (other) {
          if (other !== video && !other.paused) other.pause();
        });
      });

      video.addEventListener('ended', function () {
        card.classList.remove('is-playing');
        video.removeAttribute('controls');
        video.currentTime = 0;
      });
    });
  }());

  /* ── Parallax ───────────────────────────────────────────
     Two kinds, both driven by one rAF loop and both writing
     only a --py custom property, so the transform itself stays
     composed in CSS alongside each element's own scale.

       data-px-scroll="0.3"  offset tracks raw scroll depth
                             (hero layers, pinned to the top)
       data-px-frame="38"    offset swings +n..-n as the element's
                             own box crosses the viewport
                                                                */
  (function parallax() {
    if (reduceMotion) return;

    // No early return on an empty list any more: brands, contact and
    // events carry no parallax nodes, but they all carry the backdrop.
    var nodes = document.querySelectorAll('[data-px-scroll],[data-px-frame]');

    var items = [];
    Array.prototype.forEach.call(nodes, function (el) {
      var scroll = parseFloat(el.dataset.pxScroll);
      items.push({
        el: el,
        // Always measure an untranslated ancestor, never the moving
        // element itself — its own offset would feed back into the
        // visibility test and stall it once it drifts off screen.
        box: el.parentElement || el,
        scroll: isNaN(scroll) ? 0 : scroll,
        frame: parseFloat(el.dataset.pxFrame) || 0,
        last: null
      });
    });

    var queued = false;

    /* The page backdrop drifts against the scroll. It is a fixed layer,
       so without this it is the one thing on the page that never moves,
       which is what flattens it. Travel is a share of the viewport, not
       of the document, so a long page and a short one feel the same.

       Written to :root as --bg-py rather than --py, because --py
       inherits: setting it high up would push every element that reads
       `var(--py, 0px)` without owning a value of its own. */
    var root = document.documentElement;
    var bgLast = null;

    function backdrop(vh, y) {
      var travel = Math.max(1, root.scrollHeight - vh);
      var progress = Math.min(1, Math.max(0, y / travel));
      // 12vh of drift inside the layer's 14vh of headroom, so no
      // scroll position can ever pull an edge into frame.
      var offset = Math.round(-progress * vh * 0.12 * 100) / 100;
      if (offset === bgLast) return;
      bgLast = offset;
      root.style.setProperty('--bg-py', offset + 'px');
    }

    function frame() {
      queued = false;
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var y = window.scrollY || window.pageYOffset;

      backdrop(vh, y);

      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var rect = item.box.getBoundingClientRect();

        // Cheaper than an observer and never goes stale.
        if (rect.bottom < -240 || rect.top > vh + 240) continue;

        var offset;
        if (item.scroll) {
          offset = y * item.scroll;
        } else {
          // -1 when the box sits below the fold, +1 when above it
          var progress = ((rect.top + rect.height / 2) / vh - 0.5) * -2;
          offset = Math.max(-1, Math.min(1, progress)) * item.frame;
        }

        offset = Math.round(offset * 100) / 100;
        if (offset === item.last) continue;
        item.last = offset;
        item.el.style.setProperty('--py', offset + 'px');
      }
    }

    function request() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(frame);
    }

    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    window.addEventListener('load', request);
    request();
  }());

  /* ── Reveal on scroll ──────────────────────────────────── */
  (function reveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (n) { n.classList.add('is-in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        var delay = Math.min(i, 6) * 45;
        setTimeout(function () { entry.target.classList.add('is-in'); }, delay);
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    items.forEach(function (n) { io.observe(n); });

    // Nothing stays invisible: if the observer never fires
    // (hidden iframe, odd viewport, blocked frame), show everything.
    setTimeout(function () {
      items.forEach(function (n) { n.classList.add('is-in'); });
    }, 2500);
  }());
}());
