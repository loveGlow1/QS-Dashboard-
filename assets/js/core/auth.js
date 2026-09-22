/**
 * QuickStark — session handling.
 *
 * `signIn` posts the credentials to the API and stores whatever session the
 * server issues. Nothing about a visitor's identity is decided in the browser:
 * the server alone validates credentials, and an expired or rejected token is
 * discarded on the next request.
 *
 * The password never touches storage, and the token is held only for the
 * lifetime the server stated. If the API moves to an httpOnly session cookie,
 * `signIn` keeps its signature and simply stops storing a token.
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

  function writeSession(session) {
    var s = store();
    if (!s) return;
    try { s.setItem(cfg.sessionKey, JSON.stringify(session)); } catch (e) {}
  }

  function clearSession() {
    var s = store();
    if (!s) return;
    try { s.removeItem(cfg.sessionKey); } catch (e) {}
  }

  /** A session is usable only while the server-stated expiry is in the future. */
  function activeSession() {
    var session = readSession();
    if (!session || !session.token) return null;
    if (session.expiresAt && session.expiresAt <= Date.now()) {
      clearSession();
      return null;
    }
    return session;
  }

  /** Milliseconds for an expiry the API may send as ISO, seconds or ms. */
  function expiryMs(value) {
    if (!value) return null;
    if (typeof value === "number") {
      return value < 1e12 ? value * 1000 : value;
    }
    var parsed = Date.parse(value);
    return isNaN(parsed) ? null : parsed;
  }

  QS.auth = {
    /** @returns {boolean} */
    isSignedIn: function () {
      return activeSession() !== null;
    },

    /** The bearer token for API calls, or null. */
    token: function () {
      var session = activeSession();
      return session ? session.token : null;
    },

    /** @returns {object|null} the signed-in user, or null. */
    currentUser: function () {
      var session = activeSession();
      return session && session.user ? session.user : null;
    },

    /**
     * Signs in against the API.
     *
     * Expects `{ token, expiresAt, user }` back. Anything else is treated as
     * a failed sign-in rather than quietly letting the visitor through.
     *
     * @returns {Promise<object>} resolves with the signed-in user
     */
    signIn: function (email, password) {
      return QS.api
        .request("auth/login", {
          method: "POST",
          auth: false,
          body: {
            email: String(email || "").trim().toLowerCase(),
            password: String(password || "")
          }
        })
        .then(function (payload) {
          if (!payload || !payload.token) {
            var err = new Error("Sign in failed. Please try again.");
            err.code = "invalid_response";
            throw err;
          }

          writeSession({
            token: payload.token,
            user: payload.user || null,
            expiresAt: expiryMs(payload.expiresAt || payload.expires_at)
          });

          return payload.user || null;
        })
        .catch(function (err) {
          if (err && err.status === 401) {
            err.code = "invalid_credentials";
            err.message = "That email and password do not match an account.";
          }
          throw err;
        });
    },

    /**
     * Drops the local session. Tells the server too, unless the session was
     * already rejected — in that case there is nothing left to revoke.
     *
     * @param {{notify?: boolean}} [opts]
     */
    signOut: function (opts) {
      var notify = !opts || opts.notify !== false;

      /* Revoke server-side first, while the token is still readable; the
         local session is dropped either way. */
      if (notify && QS.auth.token()) {
        QS.api
          .request("auth/logout", { method: "POST", body: {} })
          .catch(function () {});
      }

      clearSession();
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
