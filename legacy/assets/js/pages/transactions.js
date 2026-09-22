/**
 * QuickStark — transactions page.
 *
 * The full statement, read straight from the ledger. Filtering is done by the
 * database, not by hiding rows that were already sent to the browser.
 */
(function (window) {
  "use strict";

  var QS = window.QS;
  var utils = QS.utils;

  var STATUS_LABEL = { completed: "Completed", pending: "Pending", failed: "Failed" };
  var TXN_ICON = {
    deposit: "arrowDownLeft",
    withdrawal: "arrowUpRight",
    investment: "layers",
    return: "trendUp"
  };

  var FILTERS = [
    { id: "all", label: "All" },
    { id: "deposit", label: "Deposits" },
    { id: "investment", label: "Investments" },
    { id: "return", label: "Returns" },
    { id: "withdrawal", label: "Withdrawals" }
  ];

  var active = "all";

  function row(txn) {
    var positive = txn.amount >= 0;
    return (
      '<li class="qs-txn">' +
        '<span class="qs-txn__icon" data-dir="' + (positive ? "in" : "out") + '">' +
          QS.icon(TXN_ICON[txn.type] || "list", { size: 16 }) +
        "</span>" +
        '<span class="qs-txn__body">' +
          '<span class="qs-txn__label">' + utils.esc(txn.label) + "</span>" +
          '<span class="qs-txn__meta">' +
            utils.date(txn.date) +
            (txn.method ? '<span class="qs-txn__sep">·</span>' + utils.esc(txn.method) : "") +
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

  function emptyCopy(filter) {
    if (filter === "all") {
      return "No transactions yet. Everything that happens on your account will be listed here.";
    }
    var label = FILTERS.filter(function (f) { return f.id === filter; })[0];
    return "No " + (label ? label.label.toLowerCase() : filter) + " on your account yet.";
  }

  function loadList() {
    var host = utils.qs("[data-txn-list]");
    if (!host) return;

    host.innerHTML =
      '<ul class="qs-txn-list">' +
      new Array(7).join(
        '<li class="qs-txn qs-txn--loading">' +
          '<span class="qs-skeleton" style="width:34px;height:34px;border-radius:10px"></span>' +
          '<span class="qs-skeleton" style="height:13px;width:38%"></span>' +
          '<span class="qs-skeleton" style="height:13px;width:80px;margin-left:auto"></span>' +
        "</li>"
      ) +
      "</ul>";

    return QS.api.getTransactions({ type: active })
      .then(function (rows) {
        rows = rows || [];
        if (!rows.length) {
          host.innerHTML =
            '<div class="qs-empty">' + QS.icon("inbox") +
            "<p>" + utils.esc(emptyCopy(active)) + "</p></div>";
          return;
        }
        host.innerHTML = '<ul class="qs-txn-list">' + rows.map(row).join("") + "</ul>";
      })
      .catch(function () {
        host.innerHTML =
          '<div class="qs-empty">' + QS.icon("alert") +
          "<p>Your statement could not be loaded. Please refresh the page.</p></div>";
      });
  }

  function mountFilters() {
    var host = utils.qs("[data-txn-filters]");
    if (!host) return;

    host.innerHTML = FILTERS.map(function (f) {
      return '<button role="tab" class="qs-range" data-filter="' + f.id + '" aria-selected="' +
        (f.id === active ? "true" : "false") + '">' + f.label + "</button>";
    }).join("");

    utils.qsa("[data-filter]", host).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-filter");
        if (id === active) return;
        active = id;
        utils.qsa("[data-filter]", host).forEach(function (b) {
          b.setAttribute("aria-selected", b === btn ? "true" : "false");
        });
        loadList();
      });
    });
  }

  QS.page({
    view: "transactions",
    title: "Transactions",
    start: function () {
      mountFilters();
      loadList();

      QS.api.getPortfolio().then(function (p) {
        var available = utils.qs("[data-available]");
        if (available) available.textContent = utils.money(p.available);
        var pending = utils.qs("[data-pending]");
        if (pending) {
          pending.textContent = p.pendingOut ? utils.money(-p.pendingOut, { signed: true }) : "—";
        }
      }).catch(function () {});
    }
  });
})(window);
