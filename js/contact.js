/* Contact page: deep-linked department, validation, success state. */
(function () {
  'use strict';

  var form = document.getElementById('enquiry-form');
  if (!form) return;

  var done = document.getElementById('form-done');

  /* ── Preselect the department from ?dept= ───────────────
     Department cards link here as contact.html?dept=bath, so the
     person never has to restate what they just clicked.      */
  (function preselect() {
    var dept = new URLSearchParams(window.location.search).get('dept');
    if (!dept) return;

    var select = document.getElementById('f-dept');
    if (!select) return;

    var match = Array.prototype.some.call(select.options, function (o) {
      return o.value === dept;
    });
    if (!match) return;

    select.value = dept;
    select.classList.add('is-prefilled');

    // Say why it is already filled in, rather than silently setting it.
    var note = document.createElement('p');
    note.className = 'field__hint field__hint--pre';
    note.textContent = 'Prefilled from the product category you came from — change it if you like.';
    select.parentNode.appendChild(note);
  }());

  /* ── Validation ─────────────────────────────────────────
     Only name and phone are required. Every extra required
     field costs completions, and we can ask the rest on the
     call back.                                               */
  var RULES = {
    'f-name': {
      test: function (v) { return v.trim().length >= 2; },
      message: 'Please enter your name.'
    },
    'f-phone': {
      // Indian mobile, with or without +91 / 0 / spaces
      test: function (v) {
        var digits = v.replace(/[\s\-()]/g, '').replace(/^(\+91|0091|91|0)/, '');
        return /^[6-9]\d{9}$/.test(digits);
      },
      message: 'Please enter a 10-digit mobile number.'
    }
  };

  function setError(input, message) {
    var box = document.getElementById('e-' + input.id.replace('f-', ''));
    input.setAttribute('aria-invalid', 'true');
    input.classList.add('is-invalid');
    if (box) {
      box.textContent = message;
      box.hidden = false;
    }
  }

  function clearError(input) {
    var box = document.getElementById('e-' + input.id.replace('f-', ''));
    input.removeAttribute('aria-invalid');
    input.classList.remove('is-invalid');
    if (box) {
      box.textContent = '';
      box.hidden = true;
    }
  }

  function validate(input) {
    var rule = RULES[input.id];
    if (!rule) return true;
    if (rule.test(input.value)) {
      clearError(input);
      return true;
    }
    setError(input, rule.message);
    return false;
  }

  Object.keys(RULES).forEach(function (id) {
    var input = document.getElementById(id);
    if (!input) return;
    // Validate on blur, not on keystroke — nobody wants to be told
    // their number is wrong while they are still typing it.
    input.addEventListener('blur', function () { validate(input); });
    input.addEventListener('input', function () {
      if (input.classList.contains('is-invalid')) validate(input);
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var firstBad = null;
    Object.keys(RULES).forEach(function (id) {
      var input = document.getElementById(id);
      if (input && !validate(input) && !firstBad) firstBad = input;
    });

    if (firstBad) {
      firstBad.focus();
      return;
    }

    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = v; });

    /* No backend yet. The payload is assembled and logged so the
       shape is ready for whatever it gets wired to — a form service,
       a CRM endpoint, or an email relay. Nothing is sent anywhere. */
    console.log('[RBM] enquiry payload (not submitted — endpoint not wired):', data);

    form.hidden = true;
    if (done) {
      done.hidden = false;
      done.focus && done.focus();
    }
  });
}());


