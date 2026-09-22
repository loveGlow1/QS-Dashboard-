/**
 * QuickStark — data access layer.
 *
 * Every screen reads through this module, and every read goes to Postgres
 * behind row level security: a customer's queries return their own rows and
 * nothing else, enforced by the database rather than by this file.
 *
 * NOTE: nothing here performs a financial calculation. Balances, growth and
 * ledger entries arrive pre-computed from the server, and no client role can
 * write a financial row at all. The browser is never the source of truth for
 * money, and must never become it.
 */
(function (window) {
  "use strict";

  var QS = (window.QS = window.QS || {});
  var db = QS.db;

  /** Unwraps a PostgREST result, turning an error into a thrown Error. */
  function unwrap(res) {
    if (res.error) {
      var err = new Error(friendly(res.error));
      err.code = res.error.code;
      err.details = res.error.details;
      throw err;
    }
    return res.data;
  }

  function friendly(error) {
    var message = String((error && error.message) || "");
    if (/fetch|network|failed to fetch/i.test(message)) {
      return "We could not reach the server. Check your connection.";
    }
    if (/jwt|token|expired/i.test(message)) {
      return "Your session has expired. Please sign in again.";
    }
    return message || "The server could not complete that request.";
  }

  /** Chart points come back as {as_of, value}; the chart wants {date, value}. */
  function toPoints(rows) {
    return (rows || []).map(function (row) {
      return { date: row.as_of, value: Number(row.value) };
    });
  }

  var RANGES = ["1M", "3M", "6M", "1Y"];

  QS.api = {
    ranges: function () { return RANGES.slice(); },

    /** The signed-in customer's display identity. */
    getProfile: function () {
      return db
        .from("profiles")
        .select("id, first_name, full_name, tier, verified")
        .maybeSingle()
        .then(unwrap)
        .then(function (row) {
          if (!row) return null;
          return {
            id: row.id,
            firstName: row.first_name,
            fullName: row.full_name,
            email: (QS.auth.currentUser() || {}).email || "",
            tier: row.tier,
            verified: row.verified === true
          };
        });
    },

    /**
     * Portfolio totals, derived server-side from the ledger and the customer's
     * investments. These numbers are read-only by construction.
     */
    getPortfolio: function () {
      return db
        .from("portfolio_totals")
        .select("invested, investment_value, growth, growth_percent, available, pending_out, withdrawable, total_value, active_count")
        .maybeSingle()
        .then(unwrap)
        .then(function (row) {
          row = row || {};
          return {
            totalValue: Number(row.total_value || 0),
            invested: Number(row.invested || 0),
            investmentValue: Number(row.investment_value || 0),
            growth: Number(row.growth || 0),
            growthPercent: Number(row.growth_percent || 0),
            available: Number(row.available || 0),
            /* Stored negative in the ledger; shown as a positive commitment. */
            pendingOut: Math.abs(Number(row.pending_out || 0)),
            withdrawable: Number(row.withdrawable || 0),
            activeCount: Number(row.active_count || 0),
            ranges: RANGES.slice()
          };
        });
    },

    /** One chart range of the customer's own portfolio history. */
    getPortfolioSeries: function (range) {
      return db
        .rpc("portfolio_series", { p_range: range || "6M" })
        .then(unwrap)
        .then(function (rows) {
          var points = toPoints(rows);
          var change = points.length > 1
            ? points[points.length - 1].value - points[0].value
            : 0;
          return { range: range, series: { points: points, change: change } };
        });
    },

    getInvestments: function () {
      return db
        .from("investments")
        .select("id, plan_id, principal, current_value, start_date, maturity_date, status, plans(name, term_label)")
        .order("start_date", { ascending: false })
        .then(unwrap)
        .then(function (rows) {
          return (rows || []).map(function (row) {
            var principal = Number(row.principal);
            var value = Number(row.current_value);
            return {
              id: row.id,
              plan: (row.plans && row.plans.name) || row.plan_id,
              termLabel: (row.plans && row.plans.term_label) || "",
              principal: principal,
              currentValue: value,
              growth: value - principal,
              growthPercent: principal > 0
                ? Math.round(((value - principal) / principal) * 10000) / 100
                : 0,
              startDate: row.start_date,
              maturityDate: row.maturity_date,
              status: row.status
            };
          });
        });
    },

    getActiveInvestment: function () {
      return QS.api.getInvestments().then(function (rows) {
        var active = rows.filter(function (i) { return i.status === "active"; });
        return active.length ? active[0] : null;
      });
    },

    /** @param {{limit?: number, type?: string}} [opts] */
    getTransactions: function (opts) {
      opts = opts || {};
      var query = db
        .from("transactions")
        .select("id, type, label, method, amount, status, occurred_at")
        .order("occurred_at", { ascending: false })
        .order("created_at", { ascending: false });

      if (opts.type && opts.type !== "all") query = query.eq("type", opts.type);
      if (opts.limit) query = query.limit(opts.limit);

      return query.then(unwrap).then(function (rows) {
        return (rows || []).map(function (row) {
          return {
            id: row.id,
            type: row.type,
            label: row.label,
            method: row.method,
            amount: Number(row.amount),
            status: row.status,
            date: row.occurred_at
          };
        });
      });
    },

    getNotifications: function () {
      return db
        .from("notifications")
        .select("id, title, body, icon, unread, created_at")
        .order("created_at", { ascending: false })
        .limit(20)
        .then(unwrap)
        .then(function (rows) {
          return (rows || []).map(function (row) {
            return {
              id: row.id,
              title: row.title,
              body: row.body,
              icon: row.icon,
              unread: row.unread,
              date: String(row.created_at).slice(0, 10)
            };
          });
        });
    },


    /* ---------------------------------------------------------------- *
     * Actions
     *
     * These are the only writes the app makes, and none of them writes a
     * financial row directly: each calls a database function that revalidates
     * every precondition server-side before anything is recorded.
     * ---------------------------------------------------------------- */

    /** @returns {Promise<string>} the new investment's id */
    placeInvestment: function (planId, amount) {
      return db
        .rpc("place_investment", { p_plan_id: planId, p_amount: amount })
        .then(unwrap);
    },

    /** @returns {Promise<string>} the pending withdrawal's id */
    requestWithdrawal: function (amount, destination) {
      return db
        .rpc("request_withdrawal", { p_amount: amount, p_destination: destination })
        .then(unwrap);
    },

    cancelWithdrawal: function (id) {
      return db.rpc("cancel_withdrawal", { p_id: id }).then(unwrap);
    },

    /** Renames the signed-in customer. Tier and verification are not theirs. */
    updateProfile: function (fullName) {
      var full = String(fullName || "").trim();
      var user = QS.auth.currentUser();
      if (!user) return Promise.reject(new Error("You are not signed in."));

      return db
        .from("profiles")
        .update({ full_name: full, first_name: full.split(" ")[0] || full })
        .eq("id", user.id)
        .select("id, first_name, full_name, tier, verified")
        .maybeSingle()
        .then(unwrap);
    },

    markNotificationsRead: function () {
      var user = QS.auth.currentUser();
      if (!user) return Promise.resolve(null);
      return db
        .from("notifications")
        .update({ unread: false })
        .eq("user_id", user.id)
        .eq("unread", true)
        .then(function (res) { return res.error ? null : true; });
    },

    /** Public — the catalogue is readable without a session. */
    getPlans: function () {
      return db
        .from("plans")
        .select("id, name, summary, minimum, term_label, status, eligibility, featured, features")
        .order("sort_order", { ascending: true })
        .then(unwrap)
        .then(function (rows) {
          return (rows || []).map(function (row) {
            return {
              id: row.id,
              name: row.name,
              summary: row.summary,
              minimum: Number(row.minimum),
              term: row.term_label,
              status: row.status,
              eligibility: row.eligibility,
              featured: row.featured,
              features: row.features || []
            };
          });
        });
    },

    /**
     * Public aggregate figures for the landing page. These come from a table
     * of pre-computed totals, so an anonymous read never touches the customer
     * tables — not even through a view.
     */
    getPlatformStats: function () {
      return db
        .from("platform_metrics")
        .select("members, total_invested, active_investments, open_plans")
        .maybeSingle()
        .then(unwrap)
        .then(function (row) {
          row = row || {};
          return {
            members: Number(row.members || 0),
            totalInvested: Number(row.total_invested || 0),
            activeInvestments: Number(row.active_investments || 0),
            openPlans: Number(row.open_plans || 0)
          };
        });
    },

    /** Public cumulative amount invested by month. */
    getPlatformSeries: function () {
      return db
        .from("platform_monthly")
        .select("month, total_invested")
        .order("month", { ascending: true })
        .then(unwrap)
        .then(function (rows) {
          return (rows || []).map(function (row) {
            return { date: row.month, value: Number(row.total_invested) };
          });
        });
    }
  };
})(window);
