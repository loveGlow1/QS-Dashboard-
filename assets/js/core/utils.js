/**
 * QuickStark — formatting and DOM helpers.
 */
(function (window) {
  "use strict";

  var QS = (window.QS = window.QS || {});
  var cfg = QS.config;

  var MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  var utils = {
    /* ---------------------------------------------------------------- *
     * Numbers & money
     * ---------------------------------------------------------------- */

    /** `1284500` → `₦1,284,500` (or `₦1,284,500.00` with decimals). */
    money: function (value, opts) {
      opts = opts || {};
      var decimals = opts.decimals === undefined ? 0 : opts.decimals;
      var sign = value < 0 ? "-" : opts.signed && value > 0 ? "+" : "";
      var body = Math.abs(Number(value) || 0).toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
      return sign + cfg.currency.symbol + body;
    },

    /** Splits money into major/minor parts for typographic emphasis. */
    moneyParts: function (value) {
      var whole = Math.floor(Math.abs(Number(value) || 0));
      var frac = Math.round((Math.abs(Number(value) || 0) - whole) * 100);
      return {
        symbol: cfg.currency.symbol,
        whole: whole.toLocaleString("en-US"),
        frac: String(frac).padStart(2, "0")
      };
    },

    /** `7.043` → `+7.04%` */
    percent: function (value, decimals) {
      var d = decimals === undefined ? 2 : decimals;
      var sign = value > 0 ? "+" : value < 0 ? "-" : "";
      return sign + Math.abs(Number(value) || 0).toFixed(d) + "%";
    },

    /** Compact axis labels: `1284500` → `₦1.28M`. */
    compactMoney: function (value) {
      var n = Number(value) || 0;
      var abs = Math.abs(n);
      if (abs >= 1e9) return cfg.currency.symbol + (n / 1e9).toFixed(2) + "B";
      if (abs >= 1e6) return cfg.currency.symbol + (n / 1e6).toFixed(2) + "M";
      if (abs >= 1e3) return cfg.currency.symbol + Math.round(n / 1e3) + "K";
      return cfg.currency.symbol + Math.round(n);
    },

    clamp: function (n, min, max) { return Math.min(max, Math.max(min, n)); },

    /* ---------------------------------------------------------------- *
     * Dates
     * ---------------------------------------------------------------- */

    /** ISO date string → `19 Dec 2026`. */
    date: function (iso) {
      var d = iso instanceof Date ? iso : new Date(iso);
      if (isNaN(d)) return "—";
      return d.getUTCDate() + " " + MONTHS[d.getUTCMonth()] + " " + d.getUTCFullYear();
    },

    /** ISO date string → `19 Dec`. */
    dateShort: function (iso) {
      var d = iso instanceof Date ? iso : new Date(iso);
      if (isNaN(d)) return "—";
      return d.getUTCDate() + " " + MONTHS[d.getUTCMonth()];
    },

    monthLabel: function (iso) {
      var d = iso instanceof Date ? iso : new Date(iso);
      return MONTHS[d.getUTCMonth()];
    },

    /** Whole days between two dates (b - a). */
    daysBetween: function (a, b) {
      var ms = new Date(b).getTime() - new Date(a).getTime();
      return Math.round(ms / 86400000);
    },

    /** "Good morning" / "Good afternoon" / "Good evening". */
    greeting: function (date) {
      var h = (date || new Date()).getHours();
      if (h < 12) return "Good morning";
      if (h < 18) return "Good afternoon";
      return "Good evening";
    },

    initials: function (name) {
      return String(name || "")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(function (part) { return part.charAt(0).toUpperCase(); })
        .join("");
    },

    /* ---------------------------------------------------------------- *
     * DOM
     * ---------------------------------------------------------------- */

    qs: function (sel, scope) { return (scope || document).querySelector(sel); },
    qsa: function (sel, scope) {
      return Array.prototype.slice.call((scope || document).querySelectorAll(sel));
    },

    el: function (tag, attrs, children) {
      var node = document.createElement(tag);
      Object.keys(attrs || {}).forEach(function (key) {
        var value = attrs[key];
        if (value === null || value === undefined || value === false) return;
        if (key === "class") node.className = value;
        else if (key === "html") node.innerHTML = value;
        else if (key === "text") node.textContent = value;
        else if (key.slice(0, 2) === "on" && typeof value === "function") {
          node.addEventListener(key.slice(2).toLowerCase(), value);
        } else node.setAttribute(key, value === true ? "" : value);
      });
      (children || []).forEach(function (child) {
        if (child === null || child === undefined) return;
        node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
      });
      return node;
    },

    /** Escapes text destined for an innerHTML template. */
    esc: function (str) {
      return String(str === null || str === undefined ? "" : str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    },

    /* ---------------------------------------------------------------- *
     * Timing
     * ---------------------------------------------------------------- */

    debounce: function (fn, wait) {
      var timer;
      return function () {
        var ctx = this, args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function () { fn.apply(ctx, args); }, wait || 120);
      };
    },

    delay: function (ms) {
      return new Promise(function (resolve) { setTimeout(resolve, ms); });
    },

    prefersReducedMotion: function () {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    },

    /** Counts a number up into an element. Purely presentational. */
    animateNumber: function (node, to, render, duration) {
      if (utils.prefersReducedMotion()) { node.textContent = render(to); return; }
      var start = performance.now();
      var span = duration || 900;
      function step(now) {
        var t = utils.clamp((now - start) / span, 0, 1);
        var eased = 1 - Math.pow(1 - t, 3);
        node.textContent = render(to * eased);
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
  };

  QS.utils = utils;
})(window);
