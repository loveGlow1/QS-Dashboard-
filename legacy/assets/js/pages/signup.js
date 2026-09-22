/**
 * QuickStark — account creation controller.
 *
 * Validation here is for feedback only. The account is created by the server,
 * which also provisions the profile; this page writes no rows and decides
 * nothing about the resulting account.
 */
(function (window) {
  "use strict";

  var QS = window.QS;
  var utils = QS.utils;

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var MIN_PASSWORD = 8;

  function init() {
    QS.bootstrap.mount(document);

    /* Someone already signed in has no business on this page. */
    QS.auth.redirectIfSignedIn().then(function (redirected) {
      if (!redirected) start();
    });
  }

  function start() {
    var form = utils.qs("[data-signup-form]");
    var submit = utils.qs("[data-signup-submit]");
    var alertBox = utils.qs("[data-signup-error]");
    var alertText = utils.qs("[data-signup-error-text]");
    var doneBox = utils.qs("[data-signup-done]");
    var doneText = utils.qs("[data-signup-done-text]");

    var nameField = utils.qs('[data-field="name"]');
    var emailField = utils.qs('[data-field="email"]');
    var passwordField = utils.qs('[data-field="password"]');
    var nameInput = utils.qs("#qs-name");
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
      doneBox.hidden = true;
      alertText.textContent = message;
      alertBox.hidden = false;
    }

    [nameInput, emailInput, passwordInput].forEach(function (input) {
      input.addEventListener("input", function () {
        setInvalid(
          input === nameInput ? nameField : input === emailInput ? emailField : passwordField,
          false
        );
        clearAlert();
      });
    });

    function validate() {
      var ok = true;

      if (!nameInput.value.trim()) {
        setInvalid(nameField, true, "Enter your name.");
        ok = false;
      } else {
        setInvalid(nameField, false);
      }

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

      if (passwordInput.value.length < MIN_PASSWORD) {
        setInvalid(passwordField, true, "Use at least " + MIN_PASSWORD + " characters.");
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

      QS.auth.signUp(nameInput.value, emailInput.value, passwordInput.value)
        .then(function (result) {
          if (result.needsConfirmation) {
            /* The project requires a confirmed address before first sign-in. */
            form.hidden = true;
            doneText.textContent =
              "Check " + emailInput.value.trim() +
              " for a confirmation link, then sign in.";
            doneBox.hidden = false;
            return;
          }
          window.location.replace(QS.config.routes.dashboard);
        })
        .catch(function (err) {
          submit.removeAttribute("data-busy");
          showAlert(err && err.message ? err.message : "We could not create that account.");
          if (err && err.code === "email_taken") {
            setInvalid(emailField, true, "This email already has an account.");
            emailInput.focus();
          } else if (err && err.code === "weak_password") {
            setInvalid(passwordField, true, "Use at least " + MIN_PASSWORD + " characters.");
            passwordInput.focus();
          }
        });
    });

    nameInput.focus();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window);
