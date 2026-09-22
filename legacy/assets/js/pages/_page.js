/**
 * QuickStark — shared boot for every signed-in page.
 *
 * Gates on the session before anything paints, renders the shell, and fills
 * the chrome that is identical on every page: the account identity, the
 * verification badge and the notification popover.
 */
(function (window) {
  "use strict";

  var QS = (window.QS = window.QS || {});
  var utils = QS.utils;

  /** Paints identity into the sidebar, topbar and account menu. */
  function paintIdentity(user) {
    if (!user) return;

    utils.qsa("[data-user-initials]").forEach(function (n) {
      n.textContent = utils.initials(user.fullName);
    });
    utils.qsa("[data-user-name]").forEach(function (n) { n.textContent = user.fullName; });
    utils.qsa("[data-user-email]").forEach(function (n) { n.textContent = user.email; });
    utils.qsa("[data-account-tier]").forEach(function (n) { n.textContent = user.tier; });

    /* Verification gates the plans, so it is shown only when the server says
       the account actually holds it. */
    utils.qsa("[data-account-status]").forEach(function (n) {
      n.className = "qs-badge " + (user.verified ? "qs-badge--up" : "qs-badge--warn");
      n.innerHTML = '<span class="qs-dot"></span>' + (user.verified ? "Verified" : "Unverified");
      n.hidden = false;
    });
  }

  function mountNotifications() {
    var host = utils.qs("[data-notifications]");
    var dot = utils.qs("[data-notif-dot]");
    if (!host) return;

    host.innerHTML = '<div class="qs-skeleton" style="height:64px;border-radius:10px"></div>';

    QS.api.getNotifications()
      .then(function (items) {
        items = items || [];
        if (dot) dot.hidden = !items.some(function (n) { return n.unread; });

        if (!items.length) {
          host.innerHTML =
            '<div class="qs-empty">' + QS.icon("bell") + "<p>Nothing new right now.</p></div>";
          return;
        }

        host.innerHTML =
          '<ul class="qs-notif-list">' +
          items.map(function (n) {
            return (
              '<li class="qs-notif"' + (n.unread ? ' data-unread="true"' : "") + ">" +
                '<span class="qs-notif__icon">' + QS.icon(n.icon || "info", { size: 15 }) + "</span>" +
                "<span>" +
                  "<strong>" + utils.esc(n.title) + "</strong>" +
                  "<small>" + utils.esc(n.body) + "</small>" +
                  '<span class="qs-notif__date">' + utils.date(n.date) + "</span>" +
                "</span>" +
              "</li>"
            );
          }).join("") +
          "</ul>";
      })
      .catch(function () {
        host.innerHTML =
          '<div class="qs-empty">' + QS.icon("alert") + "<p>Could not load notifications.</p></div>";
      });
  }

  /**
   * @param {{view: string, title: string, start: function(profile)}} opts
   *        `start` runs once the shell is up, with the profile (or null).
   */
  QS.page = function (opts) {
    function boot() {
      /* Gate first: never paint account data before the session is checked. */
      QS.auth.requireSession().then(function (allowed) {
        if (!allowed) return;

        QS.appShell.mount({ view: opts.view, title: opts.title });
        QS.bootstrap.mount(document);
        mountNotifications();

        QS.api.getProfile()
          .then(function (user) {
            paintIdentity(user);
            return user;
          })
          .catch(function () { return null; })
          .then(function (user) {
            try { opts.start(user); } catch (e) {
              QS.toast({ message: "Something on this page failed to load.", icon: "alert" });
            }
          });
      });
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", boot);
    } else {
      boot();
    }
  };

  QS.page.paintIdentity = paintIdentity;
})(window);
