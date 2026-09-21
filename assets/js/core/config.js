/**
 * QuickStark — application configuration.
 *
 * Everything environment-specific lives here so that swapping the demo
 * back-end for a real API is a single-file change.
 */
(function (window) {
  "use strict";

  var QS = (window.QS = window.QS || {});

  /* Resolve the site root regardless of whether a page sits at `/` or
     `/pages/`. Keeps links correct on a plain static host and on file://. */
  function resolveRoot() {
    var marker = document.documentElement.getAttribute("data-qs-root");
    if (marker) return marker;
    return /\/pages\//.test(window.location.pathname) ? ".." : ".";
  }

  var ROOT = resolveRoot();

  QS.config = {
    brand: "QuickStark",
    product: "QuickStark Investment",
    currency: { code: "NGN", symbol: "₦", locale: "en-NG" },

    /**
     * MVP flag. While true the app runs entirely on local demo data and a
     * mocked auth session — no real funds, balances or payments exist.
     * Set to false once `QS.api` is pointed at the live back-end.
     */
    demoMode: true,

    /** Base URL for the future REST API. Unused while demoMode is true. */
    apiBaseUrl: "/api/v1",

    /** Latency (ms) the demo service layer simulates, so loading states
        are exercised exactly as they will be against a real network. */
    simulatedLatency: 420,

    /** Session storage key for the mocked auth token. */
    sessionKey: "qs.session",

    /** Named routes — the single source of truth for navigation. */
    routes: {
      home: ROOT + "/index.html",
      login: ROOT + "/pages/login.html",
      dashboard: ROOT + "/pages/dashboard.html",
      /* Placeholders: these resolve to in-app sections for the MVP and
         become their own documents when the pages are built. */
      investments: ROOT + "/pages/dashboard.html#investments",
      transactions: ROOT + "/pages/dashboard.html#activity",
      withdraw: ROOT + "/pages/dashboard.html#withdraw",
      profile: ROOT + "/pages/dashboard.html#profile"
    },

    asset: function (path) {
      return ROOT + "/assets/" + String(path).replace(/^\/+/, "");
    }
  };
})(window);
