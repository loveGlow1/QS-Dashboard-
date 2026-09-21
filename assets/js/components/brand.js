/**
 * QuickStark — brand mark.
 *
 * The mark is an original geometric monogram: an open ring resolving into an
 * ascending stroke. It is rendered inline as SVG so it stays sharp at any
 * size, carries no background plate or container, and inherits colour from
 * the surface it sits on.
 *
 * If an official logo file is supplied later, swap the body of `markup()` for
 * an <img> pointing at it — every call site picks the change up.
 */
(function (window) {
  "use strict";

  var QS = (window.QS = window.QS || {});
  var seq = 0;

  /** The mark on its own, no wordmark. */
  function mark(size) {
    var id = "qsm" + ++seq;
    return (
      '<svg viewBox="0 0 32 32" width="' + (size || 26) + '" height="' + (size || 26) + '" fill="none" aria-hidden="true">' +
        "<defs>" +
          '<linearGradient id="' + id + '" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">' +
            '<stop stop-color="#8fb0ff"/>' +
            '<stop offset="0.55" stop-color="#4d7cf3"/>' +
            '<stop offset="1" stop-color="#2f56c4"/>' +
          "</linearGradient>" +
        "</defs>" +
        /* Open ring — the "Q" bowl, broken at the lower right. */
        '<path d="M23.66 17.55A9.8 9.8 0 1 0 17.55 23.66" ' +
          'stroke="url(#' + id + ')" stroke-width="2.7" stroke-linecap="round"/>' +
        /* Ascending stroke through the break. */
        '<path d="M19.4 19.4 27.2 27.2" stroke="url(#' + id + ')" ' +
          'stroke-width="3.2" stroke-linecap="round"/>' +
        /* Inner accent — a rising step. */
        '<path d="M11.2 17.6 14.6 14.2l2.6 2.6 4-4" stroke="#cddcff" ' +
          'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" opacity="0.92"/>' +
      "</svg>"
    );
  }

  /**
   * Mark + wordmark.
   * @param {{size?:string, href?:string, label?:string}} [opts]
   */
  function logo(opts) {
    opts = opts || {};
    var sizeClass = opts.size === "sm" ? " qs-logo--sm" : opts.size === "lg" ? " qs-logo--lg" : "";
    var px = opts.size === "sm" ? 22 : opts.size === "lg" ? 32 : 26;
    var inner = mark(px) + "<span>QuickStark</span>";
    if (opts.href === null) {
      return '<span class="qs-logo' + sizeClass + '">' + inner + "</span>";
    }
    return (
      '<a class="qs-logo' + sizeClass + '" href="' + (opts.href || QS.config.routes.home) +
      '" aria-label="' + (opts.label || "QuickStark home") + '">' + inner + "</a>"
    );
  }

  /** Fills every `[data-qs-logo]` placeholder on the page. */
  function mount(scope) {
    QS.utils.qsa("[data-qs-logo]", scope).forEach(function (node) {
      node.innerHTML = logo({
        size: node.getAttribute("data-qs-logo") || undefined,
        href: node.getAttribute("data-href") === "none" ? null : node.getAttribute("data-href") || undefined
      });
    });
  }

  QS.brand = { mark: mark, logo: logo, mount: mount };
})(window);
