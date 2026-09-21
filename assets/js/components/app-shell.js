/**
 * QuickStark — signed-in app shell.
 *
 * Owns the chrome around the dashboard content: the sidebar drawer on small
 * screens, the notification and account popovers, sign out, and the
 * "not in this preview" responses for sections that arrive in a later phase.
 */
(function (window) {
  "use strict";

  var QS = (window.QS = window.QS || {});
  var utils = QS.utils;

  /* ------------------------------------------------------------------ *
   * Sidebar (drawer below the desktop breakpoint)
   * ------------------------------------------------------------------ */

  function mountSidebar() {
    var sidebar = utils.qs("[data-sidebar]");
    var backdrop = utils.qs("[data-sidebar-backdrop]");
    if (!sidebar) return;

    var lastFocus = null;

    function setOpen(open) {
      sidebar.setAttribute("data-open", open ? "true" : "false");
      if (backdrop) backdrop.setAttribute("data-open", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";

      if (open) {
        lastFocus = document.activeElement;
        var first = sidebar.querySelector("a, button");
        if (first) setTimeout(function () { first.focus(); }, 60);
      } else if (lastFocus && lastFocus.focus) {
        lastFocus.focus();
      }
    }

    utils.qsa("[data-sidebar-open]").forEach(function (btn) {
      btn.addEventListener("click", function () { setOpen(true); });
    });
    utils.qsa("[data-sidebar-close]").forEach(function (btn) {
      btn.addEventListener("click", function () { setOpen(false); });
    });
    if (backdrop) backdrop.addEventListener("click", function () { setOpen(false); });

    utils.qsa("a, button", sidebar).forEach(function (node) {
      if (node.hasAttribute("data-sidebar-close")) return;
      node.addEventListener("click", function () {
        if (window.innerWidth <= 1024) setOpen(false);
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && sidebar.getAttribute("data-open") === "true") setOpen(false);
    });

    window.addEventListener("resize", utils.debounce(function () {
      if (window.innerWidth > 1024) setOpen(false);
    }, 150));
  }

  /* ------------------------------------------------------------------ *
   * Popovers (notifications, account)
   * ------------------------------------------------------------------ */

  function mountPopovers() {
    var pops = utils.qsa("[data-pop]");
    if (!pops.length) return;

    function closeAll(except) {
      pops.forEach(function (pop) {
        if (pop === except) return;
        var trigger = utils.qs("[data-pop-trigger]", pop);
        var panel = utils.qs("[data-pop-panel]", pop);
        if (trigger) trigger.setAttribute("aria-expanded", "false");
        if (panel) panel.hidden = true;
      });
    }

    pops.forEach(function (pop) {
      var trigger = utils.qs("[data-pop-trigger]", pop);
      var panel = utils.qs("[data-pop-panel]", pop);
      if (!trigger || !panel) return;

      trigger.addEventListener("click", function (e) {
        e.stopPropagation();
        var open = trigger.getAttribute("aria-expanded") === "true";
        closeAll(pop);
        trigger.setAttribute("aria-expanded", open ? "false" : "true");
        panel.hidden = open;
      });

      panel.addEventListener("click", function (e) { e.stopPropagation(); });
    });

    document.addEventListener("click", function () { closeAll(null); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeAll(null);
    });
  }

  /* ------------------------------------------------------------------ *
   * Sign out
   * ------------------------------------------------------------------ */

  function mountSignOut() {
    utils.qsa("[data-signout]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        QS.auth.signOut();
        window.location.replace(QS.config.routes.login);
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * Sections not built in this phase
   * ------------------------------------------------------------------ */

  function mountComingSoon(scope) {
    utils.qsa("[data-soon]", scope).forEach(function (node) {
      if (node.getAttribute("data-soon-bound") === "true") return;
      node.setAttribute("data-soon-bound", "true");
      node.addEventListener("click", function (e) {
        e.preventDefault();
        QS.toast({
          title: node.getAttribute("data-soon"),
          message: "This section is not part of the current preview build.",
          icon: "info"
        });
      });
    });
  }

  QS.appShell = {
    mount: function () {
      mountSidebar();
      mountPopovers();
      mountSignOut();
      mountComingSoon(document);
    },
    refresh: mountComingSoon
  };
})(window);
