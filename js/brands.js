/* Rathi's Build Mart — brands page
   A horizontal tablist filtering one list of brand entries. Rows are
   hidden rather than re-rendered, so the markup stays in the HTML and
   the page still reads with scripting off. */
(function () {
  'use strict';

  var list = document.querySelector('[data-brand-list]');
  if (!list) return;

  var tabs = document.querySelectorAll('.btabs--row .btab');
  if (!tabs.length) return;

  var entries = list.querySelectorAll('.bentry');
  var empty = document.querySelector('[data-brand-empty]');
  var first = true;   // the opening set keeps its scroll-in reveal

  function select(tab, focus) {
    var cat = tab.dataset.cat;
    var shown = 0;
    var showing = [];

    Array.prototype.forEach.call(entries, function (entry) {
      var match = (' ' + entry.dataset.cats + ' ').indexOf(' ' + cat + ' ') > -1;
      entry.hidden = !match;
      // Dropping the class here, before the reflow below, is what lets
      // the same row animate again on the way back to a department.
      entry.classList.remove('bentry--enter');
      if (!match) return;

      // Sides alternate down the visible rows, so a filtered list never
      // leaves two pictures stacked against the same edge.
      entry.classList.toggle('bentry--flip', shown % 2 === 1);
      // The reveal observer never fires for a row that was hidden when
      // it scrolled past, so a row revealed by a tab is shown outright.
      if (!first) entry.classList.add('is-in');
      showing.push(entry);
      shown++;
    });

    if (!first) {
      // One forced reflow for the whole list, so the removal above and
      // the re-add below land in different frames and the animation
      // restarts rather than being coalesced away.
      void list.offsetWidth;
      showing.forEach(function (entry) { entry.classList.add('bentry--enter'); });
    }

    Array.prototype.forEach.call(tabs, function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });

    list.setAttribute('aria-labelledby', tab.id);
    list.hidden = shown === 0;
    if (empty) empty.hidden = shown !== 0;

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
}());
