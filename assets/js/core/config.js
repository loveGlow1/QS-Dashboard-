/**
 * QuickStark — application configuration.
 *
 * Everything environment-specific lives here, so pointing the app at a
 * different back-end is a single-file change.
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
     * Base URL for the REST API. Every request `QS.api` makes is resolved
     * against this. Override it here (or set `data-qs-api` on <html>) when
     * the API is served from another origin.
     */
    apiBaseUrl:
      document.documentElement.getAttribute("data-qs-api") || "/api/v1",

    /** Abort an API request that has not responded within this many ms. */
    requestTimeout: 15000,

    /** Storage key for the session returned by the sign-in endpoint. */
    sessionKey: "qs.session",

    /** Named routes — the single source of truth for navigation. */
    routes: {
      home: ROOT + "/index.html",
      login: ROOT + "/pages/login.html",
      dashboard: ROOT + "/pages/dashboard.html",
      /* These resolve to in-app sections today and become their own
         documents once those pages are built. */
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
