/**
 * QuickStark — security page.
 *
 * Password changes and session revocation go to Supabase Auth. Nothing about
 * a credential is decided or stored here.
 */
(function (window) {
  "use strict";

  var QS = window.QS;
  var utils = QS.utils;
  var MIN_PASSWORD = 8;

  function mountPasswordForm() {
    var form = utils.qs("[data-password-form]");
    var submit = utils.qs("[data-password-submit]");
    var pwField = utils.qs('[data-field="password"]');
    var confirmField = utils.qs('[data-field="confirm"]');
    var pwInput = utils.qs("#qs-newpassword");
    var confirmInput = utils.qs("#qs-confirmpassword");
    var errBox = utils.qs("[data-pw-error]");
    var errText = utils.qs("[data-pw-error-text]");
    var doneBox = utils.qs("[data-pw-done]");
    if (!form) return;

    var toggle = utils.qs("[data-toggle-password]");
    function paintToggle() {
      var shown = pwInput.type === "text";
      toggle.innerHTML = QS.icon(shown ? "eyeOff" : "eye", { size: 18 });
      toggle.setAttribute("aria-label", shown ? "Hide password" : "Show password");
      toggle.setAttribute("aria-pressed", shown ? "true" : "false");
    }
    paintToggle();
    toggle.addEventListener("click", function () {
      pwInput.type = pwInput.type === "password" ? "text" : "password";
      paintToggle();
      pwInput.focus();
    });

    [pwInput, confirmInput].forEach(function (input) {
      input.addEventListener("input", function () {
        (input === pwInput ? pwField : confirmField).setAttribute("data-invalid", "false");
        errBox.hidden = true;
        doneBox.hidden = true;
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      errBox.hidden = true;
      doneBox.hidden = true;

      if (pwInput.value.length < MIN_PASSWORD) {
        pwField.setAttribute("data-invalid", "true");
        utils.qs(".qs-field-error", pwField).textContent =
          "Use at least " + MIN_PASSWORD + " characters.";
        pwInput.focus();
        return;
      }
      if (confirmInput.value !== pwInput.value) {
        confirmField.setAttribute("data-invalid", "true");
        utils.qs(".qs-field-error", confirmField).textContent = "Both entries must match.";
        confirmInput.focus();
        return;
      }

      submit.setAttribute("data-busy", "true");
      QS.auth.changePassword(pwInput.value)
        .then(function () {
          pwInput.value = "";
          confirmInput.value = "";
          doneBox.hidden = false;
        })
        .catch(function (err) {
          errText.textContent = (err && err.message) || "Your password could not be changed.";
          errBox.hidden = false;
        })
        .then(function () { submit.removeAttribute("data-busy"); });
    });
  }

  function mountSessions() {
    var user = QS.auth.currentUser();
    var email = utils.qs("[data-session-email]");
    if (email) email.textContent = (user && user.email) || "—";

    var since = utils.qs("[data-session-since]");
    if (since) {
      since.textContent = user && user.created_at
        ? utils.date(String(user.created_at).slice(0, 10))
        : "—";
    }

    var all = utils.qs("[data-signout-all]");
    if (all) {
      all.addEventListener("click", function () {
        all.setAttribute("data-busy", "true");
        QS.auth.signOutEverywhere();
      });
    }
  }

  QS.page({
    view: "security",
    title: "Security",
    start: function () {
      mountPasswordForm();
      mountSessions();
    }
  });
})(window);
