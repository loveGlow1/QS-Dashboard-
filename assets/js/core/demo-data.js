/**
 * QuickStark — demo dataset.
 *
 * ---------------------------------------------------------------------------
 * EVERY VALUE IN THIS FILE IS FABRICATED SAMPLE DATA.
 * It exists so the interface can be designed and reviewed. It does not
 * represent any real customer, account, balance or transaction, and nothing
 * here should ever be presented to a user as a real financial record.
 *
 * When the back-end lands, this file is deleted and `QS.api` talks to the
 * server instead. The shapes below deliberately mirror the planned API
 * resources (users, investments, ledger_entries, portfolio_snapshots,
 * notifications) so the UI does not have to change.
 * ---------------------------------------------------------------------------
 */
(function (window) {
  "use strict";

  var QS = (window.QS = window.QS || {});

  /* The demo snapshot is pinned to a fixed date so the sample portfolio,
     its investment term and its activity history stay internally consistent
     no matter when the page is opened. */
  var AS_OF = "2026-11-19";

  /* ------------------------------------------------------------------ *
   * Portfolio value series
   * ------------------------------------------------------------------ */

  /* Month-end anchors for the sample account. Deposits show up as steeper
     segments; the rest is gradual movement. */
  var ANCHORS = [
    ["2025-11-19", 180000],
    ["2025-12-19", 265000],
    ["2026-01-19", 310000],
    ["2026-02-19", 448000],
    ["2026-03-19", 505000],
    ["2026-04-19", 612000],
    ["2026-05-19", 700000],
    ["2026-06-19", 845000],
    ["2026-07-19", 930000],
    ["2026-08-19", 1062000],
    ["2026-09-19", 1200000],
    ["2026-10-19", 1241800],
    ["2026-11-19", 1284500]
  ];

  /** Deterministic PRNG — the same curve renders on every load. */
  function seeded(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function dayOf(iso) { return Math.round(new Date(iso + "T00:00:00Z").getTime() / 86400000); }
  function isoOf(day) { return new Date(day * 86400000).toISOString().slice(0, 10); }

  /**
   * Expands the anchors into one value per day, with a small amount of
   * seeded jitter so the line reads like market movement rather than a
   * drawn shape. The final point always lands exactly on the anchor.
   */
  function buildDailySeries() {
    var rand = seeded(20261119);
    var first = dayOf(ANCHORS[0][0]);
    var last = dayOf(ANCHORS[ANCHORS.length - 1][0]);
    var out = [];
    var drift = 0;

    for (var day = first; day <= last; day++) {
      /* Locate the surrounding anchors. */
      var i = 0;
      while (i < ANCHORS.length - 2 && dayOf(ANCHORS[i + 1][0]) <= day) i++;
      var aDay = dayOf(ANCHORS[i][0]);
      var bDay = dayOf(ANCHORS[i + 1][0]);
      var t = (day - aDay) / (bDay - aDay);
      /* Smoothstep between anchors keeps the curve continuous. */
      var eased = t * t * (3 - 2 * t);
      var base = ANCHORS[i][1] + (ANCHORS[i + 1][1] - ANCHORS[i][1]) * eased;

      /* Mean-reverting jitter, scaled to the portfolio size. */
      drift = drift * 0.72 + (rand() - 0.5) * 0.009;
      var value = day === last ? ANCHORS[ANCHORS.length - 1][1] : base * (1 + drift);

      out.push({ date: isoOf(day), value: Math.round(value) });
    }
    return out;
  }

  var DAILY = buildDailySeries();

  /** Slices the daily series into a chart-ready range. */
  function rangeSeries(days, step) {
    var slice = DAILY.slice(Math.max(0, DAILY.length - days - 1));
    var picked = slice.filter(function (_, i) { return i % step === 0; });
    if (picked[picked.length - 1] !== slice[slice.length - 1]) picked.push(slice[slice.length - 1]);
    var open = picked[0].value;
    var close = picked[picked.length - 1].value;
    return {
      points: picked,
      change: close - open,
      changePercent: open ? ((close - open) / open) * 100 : 0
    };
  }

  var SERIES = {
    "1M": rangeSeries(30, 1),
    "3M": rangeSeries(91, 2),
    "6M": rangeSeries(182, 4),
    "1Y": rangeSeries(364, 7)
  };

  /* ------------------------------------------------------------------ *
   * The dataset
   * ------------------------------------------------------------------ */

  QS.demoData = {
    /** Flags this payload as sample data end-to-end. */
    isDemo: true,
    asOf: AS_OF,

    /** The single credential the mocked login accepts. */
    demoCredentials: {
      email: "demo@quickstark.tech",
      password: "quickstark"
    },

    user: {
      id: "usr_demo_0001",
      firstName: "Jephthah",
      fullName: "Jephthah Okoro",
      email: "demo@quickstark.tech",
      memberSince: "2025-11-19",
      kycStatus: "verified",
      tier: "Individual account"
    },

    portfolio: {
      currency: "NGN",
      totalValue: 1284500,
      invested: 1200000,
      growth: 84500,
      growthPercent: 7.04,
      available: 0,
      series: SERIES,
      ranges: ["1M", "3M", "6M", "1Y"]
    },

    /* Mirrors the planned `investments` resource. */
    investments: [
      {
        id: "inv_demo_0001",
        plan: "QuickStark Growth",
        planId: "plan_growth",
        principal: 1200000,
        currentValue: 1284500,
        growth: 84500,
        growthPercent: 7.04,
        startDate: "2026-09-19",
        maturityDate: "2026-12-19",
        termLabel: "3 months",
        status: "active",
        payoutSchedule: "At maturity"
      }
    ],

    /* Mirrors the planned `ledger_entries` resource. */
    transactions: [
      { id: "txn_0009", type: "return",     label: "Portfolio return",  amount:   35000, date: "2026-11-15", status: "completed", method: "Portfolio credit" },
      { id: "txn_0008", type: "return",     label: "Portfolio return",  amount:   28500, date: "2026-10-15", status: "completed", method: "Portfolio credit" },
      { id: "txn_0007", type: "withdrawal", label: "Withdrawal",        amount:  -60000, date: "2026-10-04", status: "completed", method: "Bank transfer" },
      { id: "txn_0006", type: "return",     label: "Portfolio return",  amount:   21000, date: "2026-09-30", status: "completed", method: "Portfolio credit" },
      { id: "txn_0005", type: "investment", label: "Investment",        amount: -500000, date: "2026-09-19", status: "completed", method: "QuickStark Growth" },
      { id: "txn_0004", type: "deposit",    label: "Deposit",           amount:  500000, date: "2026-09-18", status: "completed", method: "Bank transfer" },
      { id: "txn_0003", type: "investment", label: "Investment",        amount: -700000, date: "2026-09-19", status: "completed", method: "QuickStark Growth" },
      { id: "txn_0002", type: "deposit",    label: "Deposit",           amount:  700000, date: "2026-09-16", status: "completed", method: "Card payment" },
      { id: "txn_0001", type: "deposit",    label: "Deposit",           amount:   60000, date: "2026-08-28", status: "completed", method: "Bank transfer" }
    ],

    notifications: [
      { id: "ntf_03", title: "Portfolio return recorded", body: "A return was added to your portfolio.", date: "2026-11-15", unread: true,  icon: "trendUp" },
      { id: "ntf_02", title: "Withdrawal completed",      body: "Your withdrawal was sent to your bank.", date: "2026-10-04", unread: true,  icon: "bank" },
      { id: "ntf_01", title: "Identity verified",         body: "Your account verification is complete.", date: "2026-09-15", unread: false, icon: "shield" }
    ],

    /* Mirrors the planned `investment_plans` resource. No plan carries a
       promised or guaranteed return — terms are descriptive only. */
    plans: [
      {
        id: "plan_starter",
        name: "Starter",
        summary: "A first step into the platform, with a short commitment.",
        minimum: 50000,
        term: "3 months",
        status: "open",
        eligibility: "Verified account",
        featured: false,
        features: [
          "Track performance in your dashboard",
          "Withdraw at maturity",
          "Statements on every transaction"
        ]
      },
      {
        id: "plan_growth",
        name: "Growth",
        summary: "A medium-term allocation for building a portfolio over time.",
        minimum: 250000,
        term: "6 months",
        status: "open",
        eligibility: "Verified account",
        featured: true,
        features: [
          "Everything in Starter",
          "Portfolio milestone updates",
          "Priority withdrawal processing",
          "Dedicated support channel"
        ]
      },
      {
        id: "plan_premium",
        name: "Premium",
        summary: "A longer-horizon allocation for larger portfolios.",
        minimum: 1000000,
        term: "12 months",
        status: "waitlist",
        eligibility: "Verified account · Additional review",
        featured: false,
        features: [
          "Everything in Growth",
          "Quarterly portfolio review",
          "Named relationship manager",
          "Custom reporting"
        ]
      }
    ]
  };
})(window);
