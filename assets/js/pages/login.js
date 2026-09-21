/**
 * QuickStark — login page controller.
 *
 * Validation and submission run against QS.auth, which is mocked for this
 * preview. Swapping in a real endpoint means changing QS.auth.signIn only.
 */
(function (window) {
  "use strict";

  var QS = window.QS;
  var utils = QS.utils;

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function init() {
    QS.bootstrap.mount(document);

    /* Someone already signed in has no business on this page. */
    if (QS.auth.redirectIfSignedIn()) return;

    var form = utils.qs("[data-login-form]");
    var submit = utils.qs("[data-login-submit]");
    var alertBox = utils.qs("[data-login-error]");
    var alertText = utils.qs("[data-login-error-text]");
    var emailField = utils.qs('[data-field="email"]');
    var passwordField = utils.qs('[data-field="password"]');
    var emailInput = utils.qs("#qs-email");
    var passwordInput = utils.qs("#qs-password");

    /* ---------------- password visibility ---------------- */
    var toggle = utils.qs("[data-toggle-password]");
    function paintToggle() {
      var shown = passwordInput.type === "text";
      toggle.innerHTML = QS.icon(shown ? "eyeOff" : "eye", { size: 18 });
      toggle.setAttribute("aria-label", shown ? "Hide password" : "Show password");
      toggle.setAttribute("aria-pressed", shown ? "true" : "false");
    }
    paintToggle();
    toggle.addEventListener("click", function () {
      passwordInput.type = passwordInput.type === "password" ? "text" : "password";
      paintToggle();
      passwordInput.focus();
    });

    /* ---------------- validation ---------------- */
    function setInvalid(field, invalid, message) {
      field.setAttribute("data-invalid", invalid ? "true" : "false");
      if (message) {
        var node = utils.qs(".qs-field-error", field);
        if (node) node.textContent = message;
      }
    }

    function clearAlert() {
      alertBox.hidden = true;
      alertText.textContent = "";
    }

    function showAlert(message) {
      alertText.textContent = message;
      alertBox.hidden = false;
    }

    [emailInput, passwordInput].forEach(function (input) {
      input.addEventListener("input", function () {
        setInvalid(input === emailInput ? emailField : passwordField, false);
        clearAlert();
      });
    });

    function validate() {
      var ok = true;
      var email = emailInput.value.trim();

      if (!email) {
        setInvalid(emailField, true, "Enter your email address.");
        ok = false;
      } else if (!EMAIL_RE.test(email)) {
        setInvalid(emailField, true, "Enter a valid email address.");
        ok = false;
      } else {
        setInvalid(emailField, false);
      }

      if (!passwordInput.value) {
        setInvalid(passwordField, true, "Enter your password.");
        ok = false;
      } else {
        setInvalid(passwordField, false);
      }

      return ok;
    }

    /* ---------------- submit ---------------- */
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      clearAlert();
      if (!validate()) {
        var firstInvalid = utils.qs('[data-invalid="true"] .qs-input');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      submit.setAttribute("data-busy", "true");

      QS.auth.signIn(emailInput.value, passwordInput.value)
        .then(function () {
          /* Replace, so the back button does not return to the form. */
          window.location.replace(QS.config.routes.dashboard);
        })
        .catch(function (err) {
          submit.removeAttribute("data-busy");
          showAlert(err && err.message ? err.message : "Sign in failed. Please try again.");
          setInvalid(passwordField, true, "Check your password and try again.");
          passwordInput.focus();
          passwordInput.select();
        });
    });

    /* ---------------- demo credential shortcut ---------------- */
    var fill = utils.qs("[data-fill-demo]");
    if (fill) {
      fill.addEventListener("click", function () {
        var creds = QS.demoData.demoCredentials;
        emailInput.value = creds.email;
        passwordInput.value = creds.password;
        setInvalid(emailField, false);
        setInvalid(passwordField, false);
        clearAlert();
        submit.focus();
      });
    }

    emailInput.focus();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window);
