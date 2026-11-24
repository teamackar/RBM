/* Rathi's Build Mart — brands page
   A horizontal tablist filtering one grid of brand cards, plus the
   expansion: hover (or tap) a card and it widens while the other
   cards on its row narrow by the same amount, so the row keeps its
   width and the rows below it never move.

   Row membership cannot be done with :nth-child — filtering hides
   cards, so the fourth card in the markup may be the first one on
   screen. It is worked out here from the visible order instead.

   The breakpoints live in the stylesheet: --cols says how many
   cards share a row, --rowmode whether there is width to borrow.
   Reading them back means the two never drift apart. */
(function () {
  'use strict';

  var grid = document.querySelector('[data-brand-grid]');
  if (!grid) return;

  var tabs = document.querySelectorAll('.btabs--row .btab');
  if (!tabs.length) return;

  var cards = Array.prototype.slice.call(grid.querySelectorAll('.bcard'));
  var empty = document.querySelector('[data-brand-empty]');

  var visible = [];        // the cards the current tab is showing
  var open = null;         // the one card that is expanded, if any
  var first = true;        // the opening set keeps its scroll-in reveal

  /* The open card takes the width of two closed ones, and the rest of
     its row shares what is left — for a full row of four that is two
     card widths between three cards. The row's total is unchanged
     either way, which is what keeps the rows below it still.

     OPEN is in natural card widths; what each squeezed card keeps is
     whatever remains, divided between them. A row of two has nothing
     to give at that ratio, so it opens to one and a half instead. */
  var OPEN = 2;

  function share(m) {
    if (m <= 2) return {wide: 1.5, kept: 0.5};
    return {wide: OPEN, kept: (m - OPEN) / (m - 1)};
  }

  function readVar(name, fallback) {
    var v = parseFloat(getComputedStyle(grid).getPropertyValue(name));
    return isNaN(v) ? fallback : v;
  }
  function cols()    { return Math.max(1, readVar('--cols', 4)); }
  function rowMode() { return readVar('--rowmode', 1) === 1; }

  /* Widths are written as a multiple of --bw, the natural card width,
     so they stay correct through a resize without being recomputed. */
  function basis(k) { return 'calc(var(--bw) * ' + k + ')'; }

  function layout() {
    cards.forEach(function (c) {
      c.style.flexBasis = '';
      c.classList.remove('is-narrow');
    });
    if (!open || !rowMode()) return;

    var n = cols();
    var i = visible.indexOf(open);
    if (i < 0) return;

    var row = Math.floor(i / n);
    var mates = visible.filter(function (c, j) { return Math.floor(j / n) === row; });
    if (mates.length < 2) return;

    var m = mates.length;
    var w = share(m);
    mates.forEach(function (c) {
      if (c === open) { c.style.flexBasis = basis(w.wide); return; }
      c.style.flexBasis = basis(w.kept);
      c.classList.add('is-narrow');
    });
  }

  function setOpen(card) {
    if (open === card) return;
    if (open) {
      open.classList.remove('is-open');
      open.querySelector('.bcard__toggle').setAttribute('aria-expanded', 'false');
    }
    open = card;
    if (open) {
      open.classList.add('is-open');
      open.querySelector('.bcard__toggle').setAttribute('aria-expanded', 'true');
    }
    layout();
  }

  /* ── Departments ─────────────────────────────────────── */

  function select(tab, focus) {
    var cat = tab.dataset.cat;
    var showing = [];

    setOpen(null);

    cards.forEach(function (card) {
      var match = (' ' + card.dataset.cats + ' ').indexOf(' ' + cat + ' ') > -1;
      card.hidden = !match;
      // Dropped before the reflow below, so the same card can animate
      // again on the way back to a department it has already shown in.
      card.classList.remove('bcard--enter');
      if (!match) return;
      // The reveal observer never fires for a card that was hidden
      // when it scrolled past, so one revealed by a tab is shown outright.
      if (!first) card.classList.add('is-in');
      showing.push(card);
    });

    visible = showing;

    if (!first) {
      // One forced reflow for the whole grid, so the removal above and
      // the re-add below land in different frames and the animation
      // restarts rather than being coalesced away.
      void grid.offsetWidth;
      showing.forEach(function (card) { card.classList.add('bcard--enter'); });
    }

    Array.prototype.forEach.call(tabs, function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });

    grid.setAttribute('aria-labelledby', tab.id);
    grid.hidden = showing.length === 0;
    if (empty) empty.hidden = showing.length !== 0;

    if (focus) tab.focus();
  }

  // A deep link such as brands.html#surfaces opens on that department.
  var hash = (window.location.hash || '').slice(1).toLowerCase();
  var fromHash = hash && document.querySelector('.btabs--row .btab[data-cat="' + hash + '"]');
  var initial = fromHash ||
    document.querySelector('.btabs--row .btab[aria-selected="true"]') || tabs[0];
  select(initial, false);
  first = false;

  Array.prototype.forEach.call(tabs, function (tab, i) {
    tab.addEventListener('click', function () { select(tab, false); });

    tab.addEventListener('keydown', function (e) {
      var go = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') go = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') go = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') go = 0;
      else if (e.key === 'End') go = tabs.length - 1;
      if (go === null) return;
      e.preventDefault();
      select(tabs[go], true);
    });
  });

  /* ── Expanding a card ────────────────────────────────── */

  var hoverable = window.matchMedia('(hover:hover) and (pointer:fine)');

  /* Where the pointer last was. The browser fires no enter or leave
     event when the page scrolls under a still mouse, so the only way
     to know what the pointer is over after a scroll is to ask. */
  var ptr = {x: 0, y: 0, seen: false};
  document.addEventListener('mousemove', function (e) {
    ptr.x = e.clientX; ptr.y = e.clientY; ptr.seen = true;
  }, {passive: true});

  function cardUnderPointer() {
    if (!ptr.seen) return null;
    var el = document.elementFromPoint(ptr.x, ptr.y);
    var card = el && el.closest && el.closest('.bcard');
    return (card && grid.contains(card) && !card.hidden) ? card : null;
  }

  /* A card the keyboard is sitting in stays open: the pointer must not
     yank it shut under someone who is tabbing through. Clicking a card
     focuses it too, but that is not :focus-visible, so the mouse stays
     in charge of the cards the mouse opened. */
  function keyboardHeld() {
    var el = document.activeElement;
    return !!(el && grid.contains(el) && el.matches && el.matches(':focus-visible'));
  }

  function hoverDrives() { return hoverable.matches && rowMode(); }

  cards.forEach(function (card) {
    var toggle = card.querySelector('.bcard__toggle');

    // Pointer. Only where hovering is real — on a touch screen the
    // same gesture would fire alongside the tap below.
    card.addEventListener('mouseenter', function () {
      if (hoverDrives()) setOpen(card);
    });

    /* Leaving the card closes it, wherever the pointer goes: off the
       grid, or into the gutter between two rows, which is inside the
       grid and so never reached the handler below. */
    card.addEventListener('mouseleave', function (e) {
      if (!hoverDrives() || keyboardHeld()) return;
      // Straight onto another card: leave it to that card's own
      // mouseenter, so the row re-proportions in one move instead of
      // collapsing and growing again.
      var to = e.relatedTarget;
      if (to && to.closest && to.closest('.bcard')) return;
      setOpen(null);
    });

    // Tap. Where hover is already driving the expansion a click
    // would only undo what the pointer just did, so it is left out.
    toggle.addEventListener('click', function () {
      if (hoverable.matches && rowMode()) return;
      setOpen(open === card ? null : card);
    });

    // Keyboard. Tabbing onto the card opens it, which puts the
    // write-up and the department link in reach of the next Tab.
    toggle.addEventListener('focus', function () { setOpen(card); });

    card.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open === card) {
        setOpen(null);
        toggle.focus();
      }
    });
  });

  // Backstop for the pointer leaving the window outright, where a
  // card's own mouseleave may not arrive.
  grid.addEventListener('mouseleave', function () {
    if (hoverDrives() && !keyboardHeld()) setOpen(null);
  });

  /* Scrolling moves the cards, not the mouse, so no enter or leave
     event is sent: without this the card the pointer has been carried
     off stays open. Re-ask what is under the pointer and hand the open
     state to that card, or to nothing. */
  var scrollQueued = false;
  window.addEventListener('scroll', function () {
    if (!open || scrollQueued || !hoverDrives() || !ptr.seen) return;
    scrollQueued = true;
    window.requestAnimationFrame(function () {
      scrollQueued = false;
      if (!open || keyboardHeld()) return;
      setOpen(cardUnderPointer());
    });
  }, {passive: true});

  grid.addEventListener('focusout', function (e) {
    if (!grid.contains(e.relatedTarget)) setOpen(null);
  });

  // A resize can change how many cards share a row, and so who has to
  // give up width. Recompute on the frame after it settles.
  var pending;
  window.addEventListener('resize', function () {
    window.clearTimeout(pending);
    pending = window.setTimeout(function () {
      if (open && !rowMode()) { layout(); return; }
      layout();
    }, 120);
  });
}());
