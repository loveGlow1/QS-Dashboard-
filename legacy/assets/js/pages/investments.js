/**
 * QuickStark — investments page.
 *
 * Shows what the customer holds and the plans open to them. Placing an
 * investment calls a database function that revalidates the plan, the
 * verification status, the minimum and the available balance before writing
 * anything; this file never writes a financial row.
 */
(function (window) {
  "use strict";

  var QS = window.QS;
  var utils = QS.utils;

  var STATUS_LABEL = { active: "Active", matured: "Matured", cancelled: "Cancelled" };

  var state = { profile: null, portfolio: null, plans: [], plan: null };

  /* ------------------------------------------------------------------ *
   * Holdings
   * ------------------------------------------------------------------ */

  function holdingMarkup(inv, today) {
    var span = utils.daysBetween(inv.startDate, inv.maturityDate);
    var done = utils.daysBetween(inv.startDate, today);
    var progress = span > 0 ? utils.clamp((done / span) * 100, 0, 100) : 0;
    var remaining = Math.max(0, span - done);
    var up = inv.growth >= 0;

    return (
      '<article class="qs-holding">' +
        '<header class="qs-holding__head">' +
          "<div>" +
            '<p class="qs-holding__plan">' + utils.esc(inv.plan) + "</p>" +
            '<p class="qs-holding__term">' + utils.esc(inv.termLabel) + " term</p>" +
          "</div>" +
          '<span class="qs-badge ' + (inv.status === "active" ? "qs-badge--up" : "") + '">' +
            '<span class="qs-dot"></span>' + utils.esc(STATUS_LABEL[inv.status] || inv.status) +
          "</span>" +
        "</header>" +

        '<dl class="qs-holding__figures">' +
          "<div><dt>Principal</dt><dd class=\"qs-num\">" + utils.money(inv.principal) + "</dd></div>" +
          "<div><dt>Current value</dt><dd class=\"qs-num qs-holding__strong\">" + utils.money(inv.currentValue) + "</dd></div>" +
          "<div><dt>Growth</dt><dd class=\"qs-num " + (up ? "qs-inv__up" : "qs-inv__down") + '">' +
            utils.money(inv.growth, { signed: true }) +
            ' <span class="qs-inv__pct">' + utils.percent(inv.growthPercent) + "</span>" +
          "</dd></div>" +
        "</dl>" +

        '<div class="qs-inv__progress">' +
          '<div class="qs-inv__progress-head">' +
            "<span>" + utils.date(inv.startDate) + "</span>" +
            "<span>" + utils.date(inv.maturityDate) + "</span>" +
          "</div>" +
          '<div class="qs-inv__track"><span style="width:' + progress.toFixed(1) + '%"></span></div>' +
          '<div class="qs-inv__progress-foot">' +
            "<span>Started</span>" +
            "<span>" + (remaining > 0 ? remaining + " days to maturity" : "Matured") + "</span>" +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  function renderHoldings(rows) {
    var host = utils.qs("[data-holdings]");
    if (!host) return;

    if (!rows.length) {
      host.innerHTML =
        '<div class="qs-empty">' + QS.icon("layers") +
        "<p>You have no investments yet. Choose a plan below to start one.</p></div>";
      return;
    }

    var today = new Date().toISOString().slice(0, 10);
    host.innerHTML =
      '<div class="qs-holdings">' +
      rows.map(function (inv) { return holdingMarkup(inv, today); }).join("") +
      "</div>";
  }

  /* ------------------------------------------------------------------ *
   * Plans
   * ------------------------------------------------------------------ */

  function planMarkup(plan) {
    var open = plan.status === "open";
    var affordable = state.portfolio && state.portfolio.available >= plan.minimum;
    var verified = state.profile && state.profile.verified;

    /* Say exactly why a plan cannot be taken, rather than a dead button. */
    var reason = !open ? "Joining the waitlist is handled by support."
      : !verified ? "Your account must be verified before you can invest."
      : !affordable ? "You need " + utils.money(plan.minimum) + " available to start this plan."
      : null;

    return (
      '<article class="qs-plancard' + (plan.featured ? " qs-plancard--featured" : "") + '">' +
        '<header class="qs-plancard__head">' +
          "<h3>" + utils.esc(plan.name) + "</h3>" +
          '<span class="qs-badge ' + (open ? "qs-badge--up" : "qs-badge--warn") + '">' +
            (open ? "Open" : "Waitlist") +
          "</span>" +
        "</header>" +
        '<p class="qs-plancard__summary">' + utils.esc(plan.summary) + "</p>" +
        '<dl class="qs-plancard__terms">' +
          "<div><dt>Minimum</dt><dd class=\"qs-num\">" + utils.money(plan.minimum) + "</dd></div>" +
          "<div><dt>Term</dt><dd>" + utils.esc(plan.term) + "</dd></div>" +
          "<div><dt>Eligibility</dt><dd>" + utils.esc(plan.eligibility) + "</dd></div>" +
        "</dl>" +
        '<ul class="qs-plancard__features">' +
          (plan.features || []).map(function (f) {
            return '<li><span data-icon="check" data-icon-size="14"></span>' + utils.esc(f) + "</li>";
          }).join("") +
        "</ul>" +
        (reason
          ? '<p class="qs-plancard__reason">' + utils.esc(reason) + "</p>" +
            '<button class="qs-btn qs-btn--ghost qs-btn--block" disabled>Invest</button>'
          : '<button class="qs-btn qs-btn--primary qs-btn--block" data-invest="' +
              utils.esc(plan.id) + '">Invest in ' + utils.esc(plan.name) + "</button>") +
      "</article>"
    );
  }

  function renderPlans() {
    var host = utils.qs("[data-plan-list]");
    if (!host) return;

    if (!state.plans.length) {
      host.innerHTML =
        '<div class="qs-empty">' + QS.icon("layers") +
        "<p>No plans are open right now. Check back soon.</p></div>";
      return;
    }

    host.innerHTML = state.plans.map(planMarkup).join("");
    QS.bootstrap.refresh(host);

    utils.qsa("[data-invest]", host).forEach(function (btn) {
      btn.addEventListener("click", function () { openModal(btn.getAttribute("data-invest")); });
    });
  }

  /* ------------------------------------------------------------------ *
   * Invest dialog
   * ------------------------------------------------------------------ */

  function openModal(planId) {
    state.plan = state.plans.filter(function (p) { return p.id === planId; })[0];
    if (!state.plan) return;

    var modal = utils.qs("[data-invest-modal]");
    utils.qs("[data-invest-plan]").textContent = state.plan.name;
    utils.qs("[data-invest-minimum]").textContent = utils.money(state.plan.minimum);
    utils.qs("[data-invest-term]").textContent = state.plan.term;
    utils.qs("[data-invest-available]").textContent = utils.money(state.portfolio.available);

    var amount = utils.qs("#qs-invest-amount");
    amount.value = utils.number(state.plan.minimum);
    utils.qs('[data-field="amount"]').setAttribute("data-invalid", "false");
    utils.qs("[data-invest-error]").hidden = true;

    modal.hidden = false;
    document.body.style.overflow = "hidden";
    setTimeout(function () { amount.focus(); amount.select(); }, 60);
  }

  function closeModal() {
    utils.qs("[data-invest-modal]").hidden = true;
    document.body.style.overflow = "";
  }

  /** Accepts "250,000" or "250000"; returns NaN for anything else. */
  function parseAmount(raw) {
    var cleaned = String(raw || "").replace(/[,\s₦]/g, "");
    return /^\d+(\.\d{1,2})?$/.test(cleaned) ? Number(cleaned) : NaN;
  }

  function mountModal() {
    var modal = utils.qs("[data-invest-modal]");
    if (!modal) return;

    utils.qsa("[data-invest-close]", modal).forEach(function (n) {
      n.addEventListener("click", closeModal);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modal.hidden) closeModal();
    });

    var form = utils.qs("[data-invest-form]", modal);
    var submit = utils.qs("[data-invest-submit]", modal);
    var field = utils.qs('[data-field="amount"]', modal);
    var input = utils.qs("#qs-invest-amount", modal);
    var errBox = utils.qs("[data-invest-error]", modal);
    var errText = utils.qs("[data-invest-error-text]", modal);

    input.addEventListener("input", function () {
      field.setAttribute("data-invalid", "false");
      errBox.hidden = true;
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      errBox.hidden = true;

      var amount = parseAmount(input.value);
      var invalid = function (message) {
        field.setAttribute("data-invalid", "true");
        utils.qs(".qs-field-error", field).textContent = message;
        input.focus();
      };

      /* Checked here for a fast answer, and again by the database, which is
         the check that actually counts. */
      if (isNaN(amount) || amount <= 0) return invalid("Enter an amount to invest.");
      if (amount < state.plan.minimum) {
        return invalid("The " + state.plan.name + " plan starts at " + utils.money(state.plan.minimum) + ".");
      }
      if (amount > state.portfolio.available) {
        return invalid("You have " + utils.money(state.portfolio.available) + " available.");
      }

      submit.setAttribute("data-busy", "true");
      QS.api.placeInvestment(state.plan.id, amount)
        .then(function () {
          closeModal();
          QS.toast({
            title: "Investment placed",
            message: utils.money(amount) + " is now in the " + state.plan.name + " plan.",
            icon: "check"
          });
          return load();
        })
        .catch(function (err) {
          errText.textContent = (err && err.message) || "That investment could not be placed.";
          errBox.hidden = false;
        })
        .then(function () { submit.removeAttribute("data-busy"); });
    });
  }

  /* ------------------------------------------------------------------ *
   * Load
   * ------------------------------------------------------------------ */

  function load() {
    return Promise.all([
      QS.api.getPortfolio(),
      QS.api.getInvestments(),
      QS.api.getPlans()
    ]).then(function (res) {
      state.portfolio = res[0];
      state.plans = res[2];

      var available = utils.qs("[data-available]");
      if (available) available.textContent = utils.money(state.portfolio.available);
      var count = utils.qs("[data-active-count]");
      if (count) count.textContent = String(state.portfolio.activeCount);

      renderHoldings(res[1]);
      renderPlans();
    }).catch(function () {
      var host = utils.qs("[data-holdings]");
      if (host) {
        host.innerHTML =
          '<div class="qs-empty">' + QS.icon("alert") +
          "<p>Your investments could not be loaded. Please refresh the page.</p></div>";
      }
    });
  }

  QS.page({
    view: "investments",
    title: "Investments",
    start: function (profile) {
      state.profile = profile;
      mountModal();
      load();
    }
  });
})(window);
