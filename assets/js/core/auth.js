/**
 * QuickStark — session handling.
 *
 * Backed by Supabase Auth. Credentials go to the server, the server issues
 * the session, and the client library refreshes it. Nothing about identity is
 * decided in the browser: a tampered-with session simply fails the next
 * request, because every table is behind row level security keyed on the
 * verified user id in the token.
 */
(function (window) {
  "use strict";

  var QS = (window.QS = window.QS || {});
  var cfg = QS.config;
  var db = QS.db;

  /* Cached synchronously so route guards can answer without awaiting. Kept
     current by onAuthStateChange below. */
  var session = null;
  var ready = false;

  var readyPromise = db.auth.getSession().then(function (res) {
    session = (res && res.data && res.data.session) || null;
    ready = true;
    return session;
  });

  db.auth.onAuthStateChange(function (_event, next) {
    session = next || null;
    ready = true;
  });

  /** Turns a Supabase auth error into something worth showing a person. */
  function readable(err) {
    if (!err) return new Error("Something went wrong. Please try again.");
    var message = String(err.message || "");
    var out;

    if (/invalid login credentials/i.test(message)) {
      out = new Error("That email and password do not match an account.");
      out.code = "invalid_credentials";
    } else if (/email not confirmed/i.test(message)) {
      out = new Error("Confirm your email address, then sign in.");
      out.code = "email_unconfirmed";
    } else if (/already registered|already been registered/i.test(message)) {
      out = new Error("An account with that email already exists. Sign in instead.");
      out.code = "email_taken";
    } else if (/password/i.test(message) && /least|short|weak/i.test(message)) {
      out = new Error("Choose a password of at least 8 characters.");
      out.code = "weak_password";
    } else if (/rate limit|too many/i.test(message)) {
      out = new Error("Too many attempts. Wait a moment and try again.");
      out.code = "rate_limited";
    } else if (/fetch|network/i.test(message)) {
      out = new Error("We could not reach the server. Check your connection.");
      out.code = "network";
    } else {
      out = new Error(message || "Something went wrong. Please try again.");
      out.code = err.code || "auth_error";
    }
    out.status = err.status;
    return out;
  }

  QS.auth = {
    /** Resolves once the stored session has been read from disk. */
    ready: function () { return readyPromise; },

    /** @returns {boolean} synchronous, for route guards after `ready()`. */
    isSignedIn: function () { return session !== null; },

    /** @returns {object|null} the auth user (id, email), not the profile. */
    currentUser: function () { return session ? session.user : null; },

    /**
     * Creates an account. The database provisions the profile and welcome
     * notification on the server side; this never writes a row itself.
     *
     * @returns {Promise<{needsConfirmation: boolean}>}
     */
    signUp: function (fullName, email, password) {
      return db.auth
        .signUp({
          email: String(email || "").trim().toLowerCase(),
          password: String(password || ""),
          options: {
            data: { full_name: String(fullName || "").trim() },
            emailRedirectTo: window.location.origin + cfg.routes.login.replace(/^\./, "")
          }
        })
        .then(function (res) {
          if (res.error) throw readable(res.error);
          /* No session back means the project requires email confirmation. */
          return { needsConfirmation: !(res.data && res.data.session) };
        });
    },

    /** @returns {Promise<object>} resolves with the auth user. */
    signIn: function (email, password) {
      return db.auth
        .signInWithPassword({
          email: String(email || "").trim().toLowerCase(),
          password: String(password || "")
        })
        .then(function (res) {
          if (res.error) throw readable(res.error);
          session = res.data.session;
          return res.data.user;
        });
    },

    /** Revokes the session server-side, then clears it locally. */
    signOut: function () {
      return db.auth.signOut().catch(function () {}).then(function () {
        session = null;
        window.location.replace(cfg.routes.login);
      });
    },

    sendPasswordReset: function (email) {
      return db.auth
        .resetPasswordForEmail(String(email || "").trim().toLowerCase())
        .then(function (res) {
          if (res.error) throw readable(res.error);
          return true;
        });
    },

    /**
     * Sends the visitor to the login page unless a session exists.
     * @returns {Promise<boolean>} true when the page may render.
     */
    requireSession: function () {
      return readyPromise.then(function () {
        if (session) return true;
        window.location.replace(cfg.routes.login + "?next=dashboard");
        return false;
      });
    },

    /** Sends an already-signed-in visitor straight to the dashboard. */
    redirectIfSignedIn: function () {
      return readyPromise.then(function () {
        if (!session) return false;
        window.location.replace(cfg.routes.dashboard);
        return true;
      });
    }
  };

  /* Exposed for the rare caller that needs to know the check has run. */
  QS.auth.isReady = function () { return ready; };
})(window);
