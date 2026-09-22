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
  var html = document.documentElement;

  QS.config = {
    brand: "QuickStark",
    product: "QuickStark Investment",
    currency: { code: "NGN", symbol: "₦", locale: "en-NG" },

    /**
     * Supabase project. The publishable key is designed to ship in the
     * browser: it grants nothing on its own. Every table is behind row level
     * security, so a caller reads only their own records, and no client role
     * can write a financial row at all. Override per deployment with
     * `data-qs-supabase-url` / `data-qs-supabase-key` on <html>.
     */
    supabaseUrl:
      html.getAttribute("data-qs-supabase-url") ||
      "https://ihbwmebrflqkpchiqbpu.supabase.co",
    supabaseKey:
      html.getAttribute("data-qs-supabase-key") ||
      "sb_publishable_Vkvk3jTSPh1zGlmmNVs50Q_E-3qLzJW",

    /** Named routes — the single source of truth for navigation. */
    routes: {
      home: ROOT + "/index.html",
      login: ROOT + "/pages/login.html",
      signup: ROOT + "/pages/signup.html",
      dashboard: ROOT + "/pages/dashboard.html",
      investments: ROOT + "/pages/investments.html",
      transactions: ROOT + "/pages/transactions.html",
      withdraw: ROOT + "/pages/withdraw.html",
      profile: ROOT + "/pages/profile.html",
      security: ROOT + "/pages/security.html",
      help: ROOT + "/pages/help.html"
    },

    asset: function (path) {
      return ROOT + "/assets/" + String(path).replace(/^\/+/, "");
    }
  };

  /* A missing client library would otherwise fail deep inside a page
     controller with an opaque error. Fail loudly and early instead. */
  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    throw new Error(
      "QuickStark: assets/vendor/supabase.js must load before core/config.js."
    );
  }

  /** The one Supabase client the whole app shares. */
  QS.db = window.supabase.createClient(
    QS.config.supabaseUrl,
    QS.config.supabaseKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );
})(window);
