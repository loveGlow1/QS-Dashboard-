/**
 * QuickStark — profile page.
 *
 * A customer may rename themselves. Tier and verification are excluded from
 * the update grant at the column level, so they are shown here as facts the
 * server owns rather than fields to edit.
 */
(function (window) {
  "use strict";

  var QS = window.QS;
  var utils = QS.utils;

  function renderStanding(profile, portfolio) {
    var status = utils.qs("[data-standing-status]");
    if (status) {
      status.innerHTML =
        '<span class="qs-badge ' + (profile && profile.verified ? "qs-badge--up" : "qs-badge--warn") + '">' +
        '<span class="qs-dot"></span>' + (profile && profile.verified ? "Verified" : "Unverified") +
        "</span>";
    }

    var tier = utils.qs("[data-standing-tier]");
    if (tier) tier.textContent = (profile && profile.tier) || "—";

    var since = utils.qs("[data-standing-since]");
    if (since) {
      var user = QS.auth.currentUser();
      since.textContent = user && user.created_at
        ? utils.date(String(user.created_at).slice(0, 10))
        : "—";
    }

    var active = utils.qs("[data-standing-active]");
    if (active) active.textContent = portfolio ? String(portfolio.activeCount) : "—";

    var total = utils.qs("[data-standing-total]");
    if (total) total.textContent = portfolio ? utils.money(portfolio.totalValue) : "—";

    var note = utils.qs("[data-standing-note]");
    if (note) {
      note.textContent = profile && profile.verified
        ? "Your tier and verification are set by QuickStark and cannot be changed from this page."
        : "Verification is required before you can invest or withdraw. Contact support to start it.";
    }
  }

  function mountForm(profile) {
    var form = utils.qs("[data-profile-form]");
    var submit = utils.qs("[data-profile-submit]");
    var nameField = utils.qs('[data-field="name"]');
    var nameInput = utils.qs("#qs-fullname");
    var emailInput = utils.qs("#qs-emailfield");
    var errBox = utils.qs("[data-profile-error]");
    var errText = utils.qs("[data-profile-error-text]");
    var doneBox = utils.qs("[data-profile-done]");
    if (!form) return;

    nameInput.value = (profile && profile.fullName) || "";
    emailInput.value = (profile && profile.email) || "";

    nameInput.addEventListener("input", function () {
      nameField.setAttribute("data-invalid", "false");
      errBox.hidden = true;
      doneBox.hidden = true;
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      errBox.hidden = true;
      doneBox.hidden = true;

      var full = nameInput.value.trim();
      if (!full) {
        nameField.setAttribute("data-invalid", "true");
        utils.qs(".qs-field-error", nameField).textContent = "Enter your name.";
        nameInput.focus();
        return;
      }

      submit.setAttribute("data-busy", "true");
      QS.api.updateProfile(full)
        .then(function (row) {
          doneBox.hidden = false;
          /* Repaint the chrome so the sidebar and account menu agree. */
          QS.page.paintIdentity({
            fullName: row.full_name,
            email: emailInput.value,
            tier: row.tier,
            verified: row.verified
          });
        })
        .catch(function (err) {
          errText.textContent = (err && err.message) || "Your details could not be saved.";
          errBox.hidden = false;
        })
        .then(function () { submit.removeAttribute("data-busy"); });
    });
  }

  QS.page({
    view: "profile",
    title: "Profile",
    start: function (profile) {
      mountForm(profile);
      renderStanding(profile, null);
      QS.api.getPortfolio()
        .then(function (p) { renderStanding(profile, p); })
        .catch(function () {});
    }
  });
})(window);
