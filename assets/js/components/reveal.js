/**
 * QuickStark — scroll reveal.
 *
 * Adds a single, restrained entrance to `[data-reveal]` elements. Staggering
 * is opt-in via `data-reveal-delay`. Honours reduced-motion by revealing
 * everything immediately.
 */
(function (window) {
  "use strict";

  var QS = (window.QS = window.QS || {});
  var utils = QS.utils;

  function mount(scope) {
    var nodes = utils.qsa("[data-reveal]", scope);
    if (!nodes.length) return;

    if (utils.prefersReducedMotion() || !window.IntersectionObserver) {
      nodes.forEach(function (n) { n.setAttribute("data-revealed", "true"); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var delay = entry.target.getAttribute("data-reveal-delay");
        if (delay) entry.target.style.setProperty("--reveal-delay", delay + "ms");
        entry.target.setAttribute("data-revealed", "true");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    nodes.forEach(function (n) { observer.observe(n); });
  }

  QS.reveal = { mount: mount };
})(window);
