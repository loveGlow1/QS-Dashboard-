/**
 * QuickStark — customer dashboard controller.
 *
 * Each region loads independently through QS.api so one slow or failed
 * request never blanks the whole screen. Nothing on this page computes a
 * balance: every figure is rendered exactly as the service layer supplies it.
 */
(function (window) {
  "use strict";

  var QS = window.QS;
  var utils = QS.utils;

  var STATUS_LABEL = {
    completed: "Completed",
    pending: "Pending",
    failed: "Failed",
    active: "Active",
    matured: "Matured"
  };

  var TXN_ICON = {
    deposit: "arrowDownLeft",
    withdrawal: "arrowUpRight",
    investment: "layers",
    return: "trendUp"
  };

  /* ================================================================== *
   * Identity
   * ================================================================== */

  function mountProfile() {
    return QS.api.getProfile().then(function (user) {
      if (!user) return null;

      var greeting = utils.qs("[data-greeting]");
      if (greeting) {
        greeting.textContent = user.firstName
          ? utils.greeting() + ", " + user.firstName
          : utils.greeting();
      }

      utils.qsa("[data-user-initials]").forEach(function (n) {
        n.textContent = utils.initials(user.fullName);
      });
      utils.qsa("[data-user-name]").forEach(function (n) { n.textContent = user.fullName; });
      utils.qsa("[data-user-email]").forEach(function (n) { n.textContent = user.email; });
      utils.qsa("[data-account-tier]").forEach(function (n) { n.textContent = user.tier; });

      document.title = "Dashboard — QuickStark";
      return user;
    }).catch(function () {
      var greeting = utils.qs("[data-greeting]");
      if (greeting) greeting.textContent = utils.greeting();
      return null;
    });
  }

  /* ================================================================== *
   * Portfolio total
   * ================================================================== */

  function renderTotal(portfolio) {
    var valueNode = utils.qs("[data-total-value]");
    var deltaNode = utils.qs("[data-total-delta]");

    if (valueNode) {
      valueNode.textContent = utils.money(portfolio.totalValue);
      utils.animateNumber(valueNode, portfolio.totalValue, function (v) {
        return utils.money(v);
      });
    }

    var up = portfolio.growth >= 0;
    if (deltaNode) {
      deltaNode.innerHTML =
        '<span class="qs-delta" data-dir="' + (up ? "up" : "down") + '">' +
          QS.icon(up ? "trendUp" : "trendDown", { size: 13 }) +
          utils.money(portfolio.growth, { signed: true }) +
        "</span>" +
        '<span class="qs-badge ' + (up ? "qs-badge--up" : "qs-badge--down") + '">' +
          utils.percent(portfolio.growthPercent) +
        "</span>" +
        '<span class="qs-total__since">since you invested</span>';
    }

    /* Principal vs growth as a share of the total. Presentation only — the
       amounts themselves come straight from the service layer. */
    var total = portfolio.totalValue || 0;
    var principalShare = total ? utils.clamp((portfolio.invested / total) * 100, 0, 100) : 0;

    var fill = utils.qs("[data-total-bar-fill]");
    if (fill) {
      requestAnimationFrame(function () { fill.style.width = principalShare.toFixed(2) + "%"; });
    }

    var legend = utils.qs("[data-total-legend]");
    if (legend) {
      legend.innerHTML =
        '<div class="qs-total__legend-row" data-kind="principal">' +
          '<dt><span class="qs-dot"></span>Principal</dt>' +
          '<dd><span class="qs-num">' + utils.money(portfolio.invested) + "</span>" +
          '<span class="qs-total__share qs-num">' + principalShare.toFixed(1) + "%</span></dd>" +
        "</div>" +
        '<div class="qs-total__legend-row" data-kind="growth">' +
          '<dt><span class="qs-dot"></span>Growth</dt>' +
          '<dd><span class="qs-num qs-total__up">' + utils.money(portfolio.growth, { signed: true }) + "</span>" +
          '<span class="qs-total__share qs-num">' + (100 - principalShare).toFixed(1) + "%</span></dd>" +
        "</div>";
    }

    var availableNode = utils.qs("[data-total-available]");
    if (availableNode) availableNode.textContent = utils.money(portfolio.available || 0);
  }

  function mountTotal(portfolio) {
    try {
      renderTotal(portfolio);
    } catch (e) {
      var card = utils.qs("[data-total-value]");
      if (card) card.textContent = "—";
    }

    /* The count comes from the investments resource, not from the portfolio
       summary, so it stays correct once both are served by the API. */
    QS.api.getInvestments()
      .then(function (list) {
        var node = utils.qs("[data-total-count]");
        if (!node) return;
        node.textContent = String(
          (list || []).filter(function (i) { return i.status === "active"; }).length
        );
      })
      .catch(function () {
        var node = utils.qs("[data-total-count]");
        if (node) node.textContent = "—";
      });
  }

  /* ================================================================== *
   * Portfolio growth chart
   * ================================================================== */

  /** The chart gives up some height on phones, where vertical space is
      scarcer than the detail an extra 50px buys. */
  function chartHeight() {
    return window.innerWidth <= 720 ? 230 : 280;
  }

  function mountGrowth(portfolio) {
    var chartNode = utils.qs("[data-growth-chart]");
    var rangeNode = utils.qs("[data-growth-ranges]");
    var subNode = utils.qs("[data-growth-sub]");
    if (!chartNode) return;

    var series = (portfolio && portfolio.series) || {};
    var ranges = (portfolio && portfolio.ranges) || Object.keys(series);

    if (!ranges.length || !ranges.some(function (r) { return series[r]; })) {
      chartNode.innerHTML =
        '<div class="qs-empty">' + QS.icon("chart") +
        "<p>No portfolio history yet. Your first investment starts this chart.</p></div>";
      if (rangeNode) rangeNode.innerHTML = "";
      if (subNode) subNode.innerHTML = "";
      return;
    }

    /* Default to 6M when it exists, otherwise the first range offered. */
    var active = ranges.indexOf("6M") !== -1 ? "6M" : ranges[0];
    var chart = null;

    function describe(range) {
      var entry = series[range];
      if (!subNode || !entry) return;
      var up = entry.change >= 0;
      subNode.innerHTML =
        '<span class="qs-delta" data-dir="' + (up ? "up" : "down") + '">' +
          utils.money(entry.change, { signed: true }) +
        "</span>" +
        '<span class="qs-growth__sub-note">value change over ' + utils.esc(range) +
        ", deposits included</span>";
    }

    rangeNode.innerHTML = ranges.map(function (r) {
      return '<button role="tab" class="qs-range" data-range="' + r + '" aria-selected="' +
        (r === active ? "true" : "false") + '">' + r + "</button>";
    }).join("");

    utils.qsa("[data-range]", rangeNode).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var range = btn.getAttribute("data-range");
        if (range === active) return;
        active = range;
        utils.qsa("[data-range]", rangeNode).forEach(function (b) {
          b.setAttribute("aria-selected", b === btn ? "true" : "false");
        });
        QS.api.getPortfolioSeries(range)
          .then(function (res) {
            if (chart) chart.setPoints(res.series.points, true);
            describe(range);
          })
          .catch(function () {
            QS.toast({ message: "That range could not be loaded.", icon: "alert" });
          });
      });
    });

    chartNode.innerHTML = "";
    chart = QS.Chart(chartNode, {
      points: series[active].points,
      height: chartHeight(),
      ariaLabel: "Portfolio value over time"
    });
    describe(active);

    /* Keep the chart legible across breakpoints and drawer transitions. */
    window.addEventListener("resize", utils.debounce(function () {
      if (!chart) return;
      chart.setHeight(chartHeight());
      chart.redraw();
    }, 160));
  }

  /* ================================================================== *
   * Active investment
   * ================================================================== */

  function investmentMarkup(inv, today) {
    var elapsed = utils.daysBetween(inv.startDate, today);
    var total = utils.daysBetween(inv.startDate, inv.maturityDate);
    var progress = utils.clamp((elapsed / total) * 100, 0, 100);
    var remaining = Math.max(0, total - elapsed);
    var up = inv.growth >= 0;

    return (
      '<div class="qs-inv">' +
        '<header class="qs-inv__head">' +
          "<div>" +
            '<p class="qs-inv__plan">' + utils.esc(inv.plan) + "</p>" +
            '<p class="qs-inv__term">' + utils.esc(inv.termLabel) + " term</p>" +
          "</div>" +
          '<span class="qs-badge qs-badge--up"><span class="qs-dot"></span>' +
            utils.esc(STATUS_LABEL[inv.status] || inv.status) +
          "</span>" +
        "</header>" +

        '<dl class="qs-inv__figures">' +
          "<div><dt>Initial investment</dt><dd class=\"qs-num\">" + utils.money(inv.principal) + "</dd></div>" +
          "<div><dt>Current value</dt><dd class=\"qs-num qs-inv__strong\">" + utils.money(inv.currentValue) + "</dd></div>" +
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
            "<span>Start date</span>" +
            "<span>" + (remaining > 0 ? remaining + " days to maturity" : "Matured") + "</span>" +
          "</div>" +
        "</div>" +

        '<button class="qs-btn qs-btn--ghost qs-btn--block" data-soon="Investment detail">' +
          "View Investment" +
        "</button>" +
      "</div>"
    );
  }

  function mountInvestment() {
    var host = utils.qs("[data-active-investment]");
    if (!host) return;

    host.innerHTML =
      '<div class="qs-skeleton" style="height:56px;border-radius:12px"></div>' +
      '<div class="qs-skeleton" style="height:120px;border-radius:12px;margin-top:14px"></div>' +
      '<div class="qs-skeleton" style="height:64px;border-radius:12px;margin-top:14px"></div>';

    QS.api.getActiveInvestment()
      .then(function (inv) {
        if (!inv) {
          host.innerHTML =
            '<div class="qs-empty">' + QS.icon("layers") +
            "<p>You have no active investment yet. Choose a plan to get started.</p>" +
            "</div>";
          return;
        }
        host.innerHTML = investmentMarkup(inv, new Date().toISOString().slice(0, 10));
        QS.appShell.refresh(host);
      })
      .catch(function () {
        host.innerHTML =
          '<div class="qs-empty">' + QS.icon("alert") +
          "<p>Your investment could not be loaded. Please try again.</p></div>";
      });
  }

  /* ================================================================== *
   * Recent activity
   * ================================================================== */

  function activityRow(txn) {
    var positive = txn.amount >= 0;
    return (
      '<li class="qs-txn">' +
        '<span class="qs-txn__icon" data-dir="' + (positive ? "in" : "out") + '">' +
          QS.icon(TXN_ICON[txn.type] || "list", { size: 16 }) +
        "</span>" +
        '<span class="qs-txn__body">' +
          '<span class="qs-txn__label">' + utils.esc(txn.label) + "</span>" +
          '<span class="qs-txn__meta">' +
            utils.date(txn.date) + '<span class="qs-txn__sep">·</span>' + utils.esc(txn.method) +
          "</span>" +
        "</span>" +
        '<span class="qs-txn__right">' +
          '<span class="qs-txn__amount qs-num" data-dir="' + (positive ? "in" : "out") + '">' +
            utils.money(txn.amount, { signed: true }) +
          "</span>" +
          '<span class="qs-txn__status" data-status="' + utils.esc(txn.status) + '">' +
            '<span class="qs-dot"></span>' + utils.esc(STATUS_LABEL[txn.status] || txn.status) +
          "</span>" +
        "</span>" +
      "</li>"
    );
  }

  function mountActivity() {
    var host = utils.qs("[data-activity-list]");
    if (!host) return;

    host.innerHTML =
      '<ul class="qs-txn-list">' +
      new Array(6).join(
        '<li class="qs-txn qs-txn--loading">' +
          '<span class="qs-skeleton" style="width:34px;height:34px;border-radius:10px"></span>' +
          '<span class="qs-skeleton" style="height:13px;width:38%"></span>' +
          '<span class="qs-skeleton" style="height:13px;width:80px;margin-left:auto"></span>' +
        "</li>"
      ) +
      "</ul>";

    QS.api.getTransactions({ limit: 5 })
      .then(function (rows) {
        rows = rows || [];
        if (!rows.length) {
          host.innerHTML =
            '<div class="qs-empty">' + QS.icon("inbox") +
            "<p>No activity yet. Your deposits and investments will appear here.</p></div>";
          return;
        }
        host.innerHTML = '<ul class="qs-txn-list">' + rows.map(activityRow).join("") + "</ul>";
      })
      .catch(function () {
        host.innerHTML =
          '<div class="qs-empty">' + QS.icon("alert") +
          "<p>Activity could not be loaded. Please try again.</p></div>";
      });
  }

  /* ================================================================== *
   * Notifications
   * ================================================================== */

  function mountNotifications() {
    var host = utils.qs("[data-notifications]");
    var dot = utils.qs("[data-notif-dot]");
    if (!host) return;

    host.innerHTML = '<div class="qs-skeleton" style="height:64px;border-radius:10px"></div>';

    QS.api.getNotifications()
      .then(function (items) {
        items = items || [];
        if (dot) dot.hidden = !items.some(function (n) { return n.unread; });

        if (!items.length) {
          host.innerHTML =
            '<div class="qs-empty">' + QS.icon("bell") + "<p>Nothing new right now.</p></div>";
          return;
        }

        host.innerHTML =
          '<ul class="qs-notif-list">' +
          items.map(function (n) {
            return (
              '<li class="qs-notif"' + (n.unread ? ' data-unread="true"' : "") + ">" +
                '<span class="qs-notif__icon">' + QS.icon(n.icon || "info", { size: 15 }) + "</span>" +
                "<span>" +
                  "<strong>" + utils.esc(n.title) + "</strong>" +
                  "<small>" + utils.esc(n.body) + "</small>" +
                  '<span class="qs-notif__date">' + utils.date(n.date) + "</span>" +
                "</span>" +
              "</li>"
            );
          }).join("") +
          "</ul>";
      })
      .catch(function () {
        host.innerHTML =
          '<div class="qs-empty">' + QS.icon("alert") + "<p>Could not load notifications.</p></div>";
      });
  }

  /* ================================================================== *
   * Quick actions
   *
   * These deliberately do not move money. They route through the payment
   * service boundary, which has no provider registered in this build, and
   * report exactly what came back.
   * ================================================================== */

  var ACTION_COPY = {
    invest: { title: "Invest", message: "Funding a plan arrives with the investments page." },
    deposit: { title: "Deposit", message: null },
    withdraw: { title: "Withdraw", message: null },
    transactions: { title: "Transactions", message: "The full transaction history page is not available yet." }
  };

  function mountQuickActions() {
    utils.qsa("[data-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-action");
        var copy = ACTION_COPY[action] || { title: "Action", message: null };

        if (action === "deposit" || action === "withdraw") {
          btn.setAttribute("data-busy", "true");
          var call = action === "deposit"
            ? QS.payments.initDeposit({ amount: 0, currency: "NGN" })
            : QS.payments.initWithdrawal({ amount: 0, currency: "NGN", destination: "" });

          call.then(function (result) {
            btn.removeAttribute("data-busy");
            QS.toast({
              title: copy.title,
              message: result.message || "Request received.",
              icon: "wallet"
            });
          });
          return;
        }

        QS.toast({ title: copy.title, message: copy.message, icon: "info" });
      });
    });
  }

  /* ================================================================== *
   * Init
   * ================================================================== */

  function init() {
    /* Gate first: never paint account data before the session is checked. */
    if (!QS.auth.requireSession()) return;

    QS.bootstrap.mount(document);
    QS.appShell.mount();

    mountProfile();
    mountInvestment();
    mountActivity();
    mountNotifications();
    mountQuickActions();

    QS.api.getPortfolio()
      .then(function (portfolio) {
        mountTotal(portfolio);
        mountGrowth(portfolio);
      })
      .catch(function () {
        var chart = utils.qs("[data-growth-chart]");
        if (chart) {
          chart.innerHTML =
            '<div class="qs-empty">' + QS.icon("alert") +
            "<p>Your portfolio could not be loaded. Please refresh the page.</p></div>";
        }
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window);
