/**
 * QuickStark — toast notifications.
 *
 * Used for transient confirmations and for the "not available in this
 * preview" responses the demo quick actions return.
 */
(function (window) {
  "use strict";

  var QS = (window.QS = window.QS || {});
  var utils = QS.utils;
  var host = null;

  function ensureHost() {
    if (host && document.body.contains(host)) return host;
    host = utils.el("div", { class: "qs-toaster", role: "region", "aria-label": "Notifications" });
    document.body.appendChild(host);
    return host;
  }

  /**
   * @param {{title?:string, message:string, icon?:string, duration?:number}} opts
   */
  function toast(opts) {
    opts = typeof opts === "string" ? { message: opts } : opts || {};
    var node = utils.el("div", { class: "qs-toast", role: "status" });
    node.innerHTML =
      '<span class="qs-toast-icon">' + QS.icon(opts.icon || "info", { size: 13 }) + "</span>" +
      "<span>" +
        (opts.title ? "<strong>" + utils.esc(opts.title) + "</strong>" : "") +
        utils.esc(opts.message || "") +
      "</span>";

    ensureHost().appendChild(node);

    var life = opts.duration || 4200;
    var timer = setTimeout(dismiss, life);

    function dismiss() {
      clearTimeout(timer);
      node.setAttribute("data-leaving", "true");
      setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 200);
    }

    node.addEventListener("click", dismiss);
    return { dismiss: dismiss };
  }

  QS.toast = toast;
})(window);
