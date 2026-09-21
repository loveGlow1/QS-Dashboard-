/**
 * QuickStark — shared page bootstrap.
 *
 * Resolves the declarative attributes used across every page so markup can
 * stay free of inline SVG and hard-coded URLs:
 *
 *   [data-qs-logo]           → brand mark
 *   [data-icon="name"]       → icon from QS.icon
 *   [data-route="dashboard"] → href from QS.config.routes
 *   [data-year]              → current year
 *   [data-placeholder="X"]   → link that is not built yet; explains itself
 */
(function (window) {
  "use strict";

  var QS = (window.QS = window.QS || {});
  var utils = QS.utils;

  function mountIcons(scope) {
    utils.qsa("[data-icon]", scope).forEach(function (node) {
      var name = node.getAttribute("data-icon");
      if (!name || node.getAttribute("data-icon-mounted") === "true") return;
      var size = parseInt(node.getAttribute("data-icon-size"), 10);
      node.innerHTML = QS.icon(name, { size: size || undefined });
      node.setAttribute("data-icon-mounted", "true");
    });
  }

  function mountRoutes(scope) {
    utils.qsa("[data-route]", scope).forEach(function (node) {
      var route = QS.config.routes[node.getAttribute("data-route")];
      if (route && node.tagName === "A") node.setAttribute("href", route);
    });
  }

  function mountYear(scope) {
    utils.qsa("[data-year]", scope).forEach(function (node) {
      node.textContent = new Date().getFullYear();
    });
  }

  /** Links to pages that come in a later phase. */
  function mountPlaceholders(scope) {
    utils.qsa("[data-placeholder]", scope).forEach(function (node) {
      node.addEventListener("click", function (e) {
        e.preventDefault();
        QS.toast({
          title: node.getAttribute("data-placeholder"),
          message: "This page is not part of the current preview build.",
          icon: "info"
        });
      });
    });
  }

  QS.bootstrap = {
    mount: function (scope) {
      QS.brand.mount(scope);
      mountIcons(scope);
      mountRoutes(scope);
      mountYear(scope);
      mountPlaceholders(scope);
      QS.reveal.mount(scope);
    },
    /** Re-resolve attributes inside freshly rendered markup. */
    refresh: function (scope) {
      QS.brand.mount(scope);
      mountIcons(scope);
      mountRoutes(scope);
      mountPlaceholders(scope);
      QS.reveal.mount(scope);
    }
  };
})(window);
