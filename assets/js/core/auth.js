/**
 * QuickStark — session handling.
 *
 * MVP BEHAVIOUR: this is a mock. It checks a hard-coded demo credential in
 * the browser and stores a fake token. It is NOT authentication and provides
 * no security whatsoever — it exists purely so the login → dashboard → sign
 * out journey can be reviewed.
 *
 * Replacing it: keep the method signatures, move `signIn` to a server call
 * that sets an httpOnly session cookie, and have `currentUser` read from a
 * `/me` endpoint. The views only use the public methods below.
 */
(function (window) {
  "use strict";

  var QS = (window.QS = window.QS || {});
  var cfg = QS.config;

  function store() {
    try { return window.localStorage; } catch (e) { return null; }
  }

  function readSession() {
    var s = store();
    if (!s) return null;
    try {
      var raw = s.getItem(cfg.sessionKey);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  QS.auth = {
    /** @returns {boolean} */
    isSignedIn: function () {
      var session = readSession();
      return !!(session && session.token && session.expiresAt > Date.now());
    },

    /** @returns {object|null} the signed-in user, or null. */
    currentUser: function () {
      var session = readSession();
      return session && session.user ? session.user : null;
    },

    /**
     * Mocked sign-in.
     * @returns {Promise<object>} resolves with the demo user.
     */
    signIn: function (email, password) {
      var creds = QS.demoData.demoCredentials;
      var wait = cfg.simulatedLatency + 300;

      return new Promise(function (resolve, rejectPromise) {
        setTimeout(function () {
          var okEmail = String(email || "").trim().toLowerCase() === creds.email;
          var okPassword = String(password || "") === creds.password;

          if (!okEmail || !okPassword) {
            var err = new Error(
              "Those details don't match the demo account. Use the demo credentials shown below."
            );
            err.code = "invalid_credentials";
            return rejectPromise(err);
          }

          var user = QS.demoData.user;
          var session = {
            /* Not a credential — a placeholder for a real server token. */
            token: "demo." + Date.now().toString(36),
            demo: true,
            user: user,
            expiresAt: Date.now() + 1000 * 60 * 60 * 8
          };
          var s = store();
          if (s) {
            try { s.setItem(cfg.sessionKey, JSON.stringify(session)); } catch (e) {}
          }
          resolve(user);
        }, wait);
      });
    },

    signOut: function () {
      var s = store();
      if (s) {
        try { s.removeItem(cfg.sessionKey); } catch (e) {}
      }
    },

    /**
     * Sends the visitor to the login page unless a session exists.
     * @returns {boolean} true when the page may render.
     */
    requireSession: function () {
      if (QS.auth.isSignedIn()) return true;
      window.location.replace(cfg.routes.login + "?next=dashboard");
      return false;
    },

    /** Sends an already-signed-in visitor straight to the dashboard. */
    redirectIfSignedIn: function () {
      if (!QS.auth.isSignedIn()) return false;
      window.location.replace(cfg.routes.dashboard);
      return true;
    }
  };
})(window);
