/**
 * QuickStark — withdraw page.
 *
 * A request is recorded by a database function that revalidates the balance
 * and holds the amount against it, so the same money cannot be requested
 * twice. The payout itself needs a payment provider; until one is connected a
 * request stays pending, and the page says so rather than implying it is done.
 */
(function (window) {
  "use strict";

  var QS = window.QS;
  var utils = QS.utils;

  var state = { profile: null, portfolio: null };

  /** Accepts "40,000" or "40000"; returns NaN for anything else. */
  function parseAmount(raw) {
    var cleaned = String(raw || "").replace(/[,\s₦]/g, "");
    return /^\d+(\.\d{1,2})?$/.test(cleaned) ? Number(cleaned) : NaN;
  }

  function renderTotals() {
    var w = utils.qs("[data-withdrawable]");
    if (w) w.textContent = utils.money(state.portfolio.withdrawable);
    var p = utils.qs("[data-pending]");
    if (p) p.textContent = state.portfolio.pendingOut ? utils.money(state.portfolio.pendingOut) : "—";
  }

  /** Explains, once, why the form cannot be used — instead of a dead button. */
  function applyGate() {
    var gate = utils.qs("[data-withdraw-gate]");
    var gateText = utils.qs("[data-withdraw-gate-text]");
    var submit = utils.qs("[data-withdraw-submit]");
    var reason = null;

    if (!state.profile || !state.profile.verified) {
      reason = "Your account must be verified before you can withdraw. " +
               "Contact support to start verification.";
    } else if (state.portfolio.withdrawable <= 0) {
      reason = state.portfolio.pendingOut > 0
        ? "Your whole balance is already committed to a pending request."
        : "You have nothing available to withdraw yet.";
    }

    if (reason) {
      gateText.textContent = reason;
      gate.hidden = false;
      if (submit) submit.disabled = true;
    } else {
      gate.hidden = true;
      if (submit) submit.disabled = false;
    }
  }

  function renderPending(rows) {
    var host = utils.qs("[data-pending-list]");
    if (!host) return;

    var pending = rows.filter(function (t) {
      return t.type === "withdrawal" && t.status === "pending";
    });

    if (!pending.length) {
      host.innerHTML =
        '<div class="qs-empty">' + QS.icon("clock") +
        "<p>No pending requests. Anything you request will be listed here until it is paid out.</p></div>";
      return;
    }

    host.innerHTML =
      '<ul class="qs-txn-list">' +
      pending.map(function (t) {
        return (
          '<li class="qs-txn">' +
            '<span class="qs-txn__icon" data-dir="out">' + QS.icon("arrowUpRight", { size: 16 }) + "</span>" +
            '<span class="qs-txn__body">' +
              '<span class="qs-txn__label">' + utils.esc(t.label) + "</span>" +
              '<span class="qs-txn__meta">Requested ' + utils.date(t.date) + "</span>" +
            "</span>" +
            '<span class="qs-txn__right">' +
              '<span class="qs-txn__amount qs-num" data-dir="out">' +
                utils.money(t.amount, { signed: true }) +
              "</span>" +
              '<button class="qs-linkbtn" data-cancel="' + utils.esc(t.id) + '">Cancel</button>' +
            "</span>" +
          "</li>"
        );
      }).join("") +
      "</ul>";

    utils.qsa("[data-cancel]", host).forEach(function (btn) {
      btn.addEventListener("click", function () {
        btn.setAttribute("data-busy", "true");
        QS.api.cancelWithdrawal(btn.getAttribute("data-cancel"))
          .then(function () {
            QS.toast({ title: "Request cancelled", message: "The amount is back in your balance.", icon: "check" });
            return load();
          })
          .catch(function (err) {
            btn.removeAttribute("data-busy");
            QS.toast({
              title: "Could not cancel",
              message: (err && err.message) || "Please try again.",
              icon: "alert"
            });
          });
      });
    });
  }

  function mountForm() {
    var form = utils.qs("[data-withdraw-form]");
    var submit = utils.qs("[data-withdraw-submit]");
    var errBox = utils.qs("[data-withdraw-error]");
    var errText = utils.qs("[data-withdraw-error-text]");
    var amountField = utils.qs('[data-field="amount"]');
    var destField = utils.qs('[data-field="destination"]');
    var amountInput = utils.qs("#qs-amount");
    var destInput = utils.qs("#qs-destination");
    if (!form) return;

    [amountInput, destInput].forEach(function (input) {
      input.addEventListener("input", function () {
        (input === amountInput ? amountField : destField).setAttribute("data-invalid", "false");
        errBox.hidden = true;
      });
    });

    function invalid(field, message, input) {
      field.setAttribute("data-invalid", "true");
      utils.qs(".qs-field-error", field).textContent = message;
      input.focus();
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      errBox.hidden = true;

      var amount = parseAmount(amountInput.value);
      var destination = destInput.value.trim();

      /* Checked here for a fast answer, and again by the database, which is
         the check that actually counts. */
      if (isNaN(amount) || amount <= 0) {
        return invalid(amountField, "Enter an amount to withdraw.", amountInput);
      }
      if (amount > state.portfolio.withdrawable) {
        return invalid(amountField,
          "You can withdraw at most " + utils.money(state.portfolio.withdrawable) + ".", amountInput);
      }
      if (!destination) {
        return invalid(destField, "Enter the account to pay out to.", destInput);
      }

      submit.setAttribute("data-busy", "true");
      QS.api.requestWithdrawal(amount, destination)
        .then(function () {
          amountInput.value = "";
          destInput.value = "";
          QS.toast({
            title: "Withdrawal requested",
            message: utils.money(amount) + " is pending payout.",
            icon: "check"
          });
          return load();
        })
        .catch(function (err) {
          errText.textContent = (err && err.message) || "That request could not be recorded.";
          errBox.hidden = false;
        })
        .then(function () { submit.removeAttribute("data-busy"); });
    });
  }

  function load() {
    return Promise.all([
      QS.api.getPortfolio(),
      QS.api.getTransactions({ type: "withdrawal" })
    ]).then(function (res) {
      state.portfolio = res[0];
      renderTotals();
      applyGate();
      renderPending(res[1] || []);
    }).catch(function () {
      var host = utils.qs("[data-pending-list]");
      if (host) {
        host.innerHTML =
          '<div class="qs-empty">' + QS.icon("alert") +
          "<p>Your balance could not be loaded. Please refresh the page.</p></div>";
      }
    });
  }

  QS.page({
    view: "withdraw",
    title: "Withdraw",
    start: function (profile) {
      state.profile = profile;
      mountForm();
      load();
    }
  });
})(window);
