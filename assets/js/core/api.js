/**
 * QuickStark — data access layer.
 *
 * Every screen reads through this module. Each method returns a Promise that
 * resolves with exactly what the API sent, so loading, empty and error states
 * are real code paths rather than decoration.
 *
 * NOTE: nothing here performs a financial calculation. Balances, growth and
 * ledger entries arrive pre-computed and read-only; the browser is never the
 * source of truth for money. That contract must hold.
 */
(function (window) {
  "use strict";

  var QS = (window.QS = window.QS || {});
  var cfg = QS.config;

  function url(path, query) {
    var base = String(cfg.apiBaseUrl).replace(/\/+$/, "");
    var full = base + "/" + String(path).replace(/^\/+/, "");
    var parts = [];

    Object.keys(query || {}).forEach(function (key) {
      var value = query[key];
      if (value === undefined || value === null || value === "") return;
      parts.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
    });

    return parts.length ? full + "?" + parts.join("&") : full;
  }

  function failure(code, message, status) {
    var err = new Error(message);
    err.code = code;
    if (status) err.status = status;
    return err;
  }

  /** Reads the bearer token lazily — QS.auth is defined after this module. */
  function bearer() {
    return QS.auth && QS.auth.token ? QS.auth.token() : null;
  }

  /**
   * A single JSON request against the API.
   *
   * @param {string} path   resource path, relative to `apiBaseUrl`
   * @param {{method?:string, query?:object, body?:object, auth?:boolean}} [opts]
   * @returns {Promise<*>} the parsed response body
   */
  function request(path, opts) {
    opts = opts || {};

    var headers = { Accept: "application/json" };
    var init = {
      method: opts.method || "GET",
      headers: headers,
      /* Lets the API move to an httpOnly session cookie without a rewrite. */
      credentials: "same-origin"
    };

    if (opts.body !== undefined) {
      headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(opts.body);
    }

    if (opts.auth !== false) {
      var token = bearer();
      if (token) headers.Authorization = "Bearer " + token;
    }

    /* Abort rather than leave a screen spinning on a stalled connection. */
    var controller = null;
    var timer = null;
    if (typeof window.AbortController === "function") {
      controller = new window.AbortController();
      init.signal = controller.signal;
      timer = setTimeout(function () { controller.abort(); }, cfg.requestTimeout);
    }

    return window
      .fetch(url(path, opts.query), init)
      .then(
        function (response) {
          if (timer) clearTimeout(timer);
          return response.text().then(function (text) {
            var payload = null;
            if (text) {
              try { payload = JSON.parse(text); } catch (e) { payload = null; }
            }

            if (response.ok) return payload;

            if (response.status === 401 && opts.auth !== false) {
              /* The session is gone or was never valid — stop using it. */
              if (QS.auth) QS.auth.signOut({ notify: false });
            }

            throw failure(
              (payload && payload.code) || "http_" + response.status,
              (payload && (payload.message || payload.error)) ||
                "The server could not complete that request.",
              response.status
            );
          });
        },
        function (err) {
          if (timer) clearTimeout(timer);
          if (err && err.name === "AbortError") {
            throw failure("timeout", "That request took too long. Please try again.");
          }
          throw failure("network", "We could not reach the server. Check your connection.");
        }
      );
  }

  QS.api = {
    request: request,

    getProfile: function () {
      return request("me");
    },

    /** Portfolio totals plus the full set of chart ranges. */
    getPortfolio: function () {
      return request("portfolio");
    },

    /** One chart range, fetched on demand as the visitor switches tabs. */
    getPortfolioSeries: function (range) {
      return request("portfolio/series", { query: { range: range } });
    },

    getInvestments: function () {
      return request("investments");
    },

    getActiveInvestment: function () {
      return request("investments", { query: { status: "active", limit: 1 } })
        .then(function (rows) {
          return (rows && rows.length) ? rows[0] : null;
        });
    },

    /** @param {{limit?: number, type?: string}} [opts] */
    getTransactions: function (opts) {
      opts = opts || {};
      return request("transactions", {
        query: {
          limit: opts.limit,
          type: opts.type && opts.type !== "all" ? opts.type : null
        }
      });
    },

    getNotifications: function () {
      return request("notifications");
    },

    /** Public — the plans list is readable without a session. */
    getPlans: function () {
      return request("plans", { auth: false });
    }
  };
})(window);
