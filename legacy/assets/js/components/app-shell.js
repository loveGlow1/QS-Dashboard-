/**
 * QuickStark — signed-in app shell.
 *
 * Owns the chrome around every signed-in page: the sidebar, topbar, mobile
 * bottom navigation, popovers and sign out.
 *
 * The navigation is defined once here and rendered into each page, so a route
 * cannot drift between the sidebar, the bottom bar and the account menu.
 */
(function (window) {
  "use strict";

  var QS = (window.QS = window.QS || {});
  var utils = QS.utils;


  /* ------------------------------------------------------------------ *
   * Navigation — the single definition every page renders from
   * ------------------------------------------------------------------ */

  var NAV = [
    { group: "Overview", items: [
      { view: "dashboard",    route: "dashboard",    icon: "grid",     label: "Dashboard", short: "Home" },
      { view: "investments",  route: "investments",  icon: "chart",    label: "Investments", short: "Invest" },
      { view: "transactions", route: "transactions", icon: "list",     label: "Transactions", short: "Activity" },
      { view: "withdraw",     route: "withdraw",     icon: "download", label: "Withdraw", short: "Withdraw" }
    ] },
    { group: "Account", items: [
      { view: "profile",  route: "profile",  icon: "user",   label: "Profile" },
      { view: "security", route: "security", icon: "shield", label: "Security" },
      { view: "help",     route: "help",     icon: "help",   label: "Help" }
    ] }
  ];

  /** Items shown in the mobile bottom bar, in order. */
  var BOTTOM = ["dashboard", "investments", "transactions", "withdraw"];

  function href(item) {
    return QS.config.routes[item.route] || "#";
  }

  function allItems() {
    return NAV.reduce(function (acc, g) { return acc.concat(g.items); }, []);
  }

  function sidebarMarkup(current) {
    var nav = NAV.map(function (group) {
      return '<p class="qs-sidebar__group">' + utils.esc(group.group) + "</p>" +
        group.items.map(function (item) {
          var active = item.view === current;
          return '<a class="qs-nav-item" href="' + href(item) + '"' +
            (active ? ' aria-current="page"' : "") + ">" +
            '<span data-icon="' + item.icon + '" data-icon-size="18"></span> ' +
            utils.esc(item.label) + "</a>";
        }).join("");
    }).join("");

    return (
      '<aside class="qs-sidebar" data-sidebar>' +
        '<div class="qs-sidebar__top">' +
          '<div data-qs-logo data-href="none"></div>' +
          '<button class="qs-sidebar__close" data-sidebar-close aria-label="Close menu">' +
            '<span data-icon="close" data-icon-size="18"></span>' +
          "</button>" +
        "</div>" +
        '<nav class="qs-sidebar__nav" aria-label="Account sections">' + nav + "</nav>" +
        '<div class="qs-sidebar__foot">' +
          '<div class="qs-sidebar__status">' +
            '<span class="qs-badge" data-account-status hidden></span>' +
            "<p data-account-tier>&nbsp;</p>" +
          "</div>" +
          '<button class="qs-nav-item qs-nav-item--quiet" data-signout>' +
            '<span data-icon="logout" data-icon-size="18"></span> Sign out' +
          "</button>" +
        "</div>" +
      "</aside>" +
      '<div class="qs-sidebar__backdrop" data-sidebar-backdrop aria-hidden="true"></div>'
    );
  }

  function topbarMarkup(title) {
    var accountLinks = NAV[1].items.map(function (item) {
      return '<a href="' + href(item) + '">' +
        '<span data-icon="' + item.icon + '" data-icon-size="16"></span> ' +
        utils.esc(item.label) + "</a>";
    }).join("");

    return (
      '<header class="qs-topbar">' +
        '<button class="qs-topbar__menu" data-sidebar-open aria-label="Open menu">' +
          '<span data-icon="menu" data-icon-size="20"></span>' +
        "</button>" +
        '<div class="qs-topbar__title">' +
          '<span class="qs-topbar__brand" data-qs-logo="sm" data-href="none"></span>' +
          "<h2>" + utils.esc(title) + "</h2>" +
        "</div>" +
        '<div class="qs-topbar__actions">' +
          '<div class="qs-pop" data-pop="notifications">' +
            '<button class="qs-icon-btn" data-pop-trigger aria-expanded="false" aria-label="Notifications">' +
              '<span data-icon="bell" data-icon-size="19"></span>' +
              '<span class="qs-icon-btn__dot" data-notif-dot hidden></span>' +
            "</button>" +
            '<div class="qs-pop__panel qs-pop__panel--wide" data-pop-panel hidden>' +
              '<header class="qs-pop__head"><h3>Notifications</h3></header>' +
              "<div data-notifications></div>" +
            "</div>" +
          "</div>" +
          '<div class="qs-pop" data-pop="account">' +
            '<button class="qs-avatar" data-pop-trigger aria-expanded="false" aria-label="Account menu">' +
              "<span data-user-initials>&nbsp;</span>" +
            "</button>" +
            '<div class="qs-pop__panel" data-pop-panel hidden>' +
              '<header class="qs-pop__head qs-pop__head--user">' +
                '<span class="qs-avatar qs-avatar--sm" data-user-initials aria-hidden="true">&nbsp;</span>' +
                "<span><strong data-user-name>&nbsp;</strong><small data-user-email>&nbsp;</small></span>" +
              "</header>" +
              '<div class="qs-pop__list">' + accountLinks + "</div>" +
              '<div class="qs-pop__list qs-pop__list--divided">' +
                '<button data-signout><span data-icon="logout" data-icon-size="16"></span> Sign out</button>' +
              "</div>" +
            "</div>" +
          "</div>" +
        "</div>" +
      "</header>"
    );
  }

  function bottomNavMarkup(current) {
    var items = allItems();
    var links = BOTTOM.map(function (view) {
      var item = items.filter(function (i) { return i.view === view; })[0];
      if (!item) return "";
      return '<a class="qs-bottomnav__item" href="' + href(item) + '"' +
        (item.view === current ? ' aria-current="page"' : "") + ">" +
        '<span data-icon="' + item.icon + '" data-icon-size="20"></span> ' +
        utils.esc(item.short || item.label) + "</a>";
    }).join("");

    return (
      '<nav class="qs-bottomnav" aria-label="Sections">' + links +
        '<button class="qs-bottomnav__item" data-sidebar-open>' +
          '<span data-icon="menu" data-icon-size="20"></span> More' +
        "</button>" +
      "</nav>"
    );
  }

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
        btn.setAttribute("data-busy", "true");
        /* signOut revokes the session server-side, then redirects. */
        QS.auth.signOut();
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
          message: "This section is not available yet.",
          icon: "info"
        });
      });
    });
  }

  QS.appShell = {
    /**
     * Renders the chrome into the page, then binds it.
     *
     * @param {{view: string, title: string}} opts  which nav entry is current
     */
    mount: function (opts) {
      opts = opts || {};

      var host = utils.qs("[data-app-shell]");
      if (host) {
        /* Chrome first, then the page's own markup stays where it was. */
        host.insertAdjacentHTML("beforebegin", sidebarMarkup(opts.view));
        host.insertAdjacentHTML("afterbegin", topbarMarkup(opts.title || "Dashboard"));
        host.insertAdjacentHTML("beforeend", bottomNavMarkup(opts.view));
      }

      if (opts.title) document.title = opts.title + " — QuickStark";

      mountSidebar();
      mountPopovers();
      mountSignOut();
      mountComingSoon(document);
    },
    refresh: mountComingSoon
  };
})(window);
