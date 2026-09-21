/**
 * QuickStark — data access layer.
 *
 * Every screen reads through this module and never touches the demo dataset
 * directly. Each method returns a Promise and mimics network latency and
 * failure, so loading and error states are real code paths rather than
 * decoration.
 *
 * Replacing the MVP back-end means rewriting the bodies of these methods to
 * `fetch(config.apiBaseUrl + ...)`. No view code changes.
 *
 * NOTE: nothing here performs a financial calculation. Balances, growth and
 * ledger entries arrive pre-computed and read-only; the browser is never the
 * source of truth for money. That contract must hold once the API is real.
 */
(function (window) {
  "use strict";

  var QS = (window.QS = window.QS || {});
  var cfg = QS.config;

  /** Resolves with a deep copy after a simulated round trip. */
  function respond(payload, extraDelay) {
    var wait = cfg.simulatedLatency + (extraDelay || 0);
    return new Promise(function (resolve) {
      setTimeout(function () {
        resolve(JSON.parse(JSON.stringify(payload)));
      }, wait);
    });
  }

  function reject(code, message, extraDelay) {
    var wait = cfg.simulatedLatency + (extraDelay || 0);
    return new Promise(function (_, rejectPromise) {
      setTimeout(function () {
        var err = new Error(message);
        err.code = code;
        rejectPromise(err);
      }, wait);
    });
  }

  function data() { return QS.demoData; }

  QS.api = {
    /** True while the app is running on sample data. */
    isDemo: function () { return cfg.demoMode === true; },

    /** The date the demo snapshot represents. Null against a real API. */
    snapshotDate: function () { return cfg.demoMode ? data().asOf : null; },

    getProfile: function () {
      return respond(data().user);
    },

    /** Portfolio totals plus the full set of chart ranges. */
    getPortfolio: function () {
      return respond(data().portfolio, 120);
    },

    /** One chart range. Split out so ranges can be fetched lazily later. */
    getPortfolioSeries: function (range) {
      var series = data().portfolio.series[range];
      if (!series) return reject("range_not_found", "Unknown range: " + range);
      return respond({ range: range, series: series }, -260);
    },

    getInvestments: function () {
      return respond(data().investments, 80);
    },

    getActiveInvestment: function () {
      var active = data().investments.filter(function (i) { return i.status === "active"; });
      return respond(active[0] || null, 80);
    },

    /** @param {{limit?: number, type?: string}} [opts] */
    getTransactions: function (opts) {
      opts = opts || {};
      var rows = data().transactions.slice();
      if (opts.type && opts.type !== "all") {
        rows = rows.filter(function (t) { return t.type === opts.type; });
      }
      rows.sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
      if (opts.limit) rows = rows.slice(0, opts.limit);
      return respond(rows, 160);
    },

    getNotifications: function () {
      return respond(data().notifications);
    },

    getPlans: function () {
      return respond(data().plans);
    }
  };
})(window);
