/**
 * QuickStark — help page.
 *
 * Answers about how the account actually behaves in this build. Where
 * something is not connected yet, it says so plainly rather than implying it
 * works.
 */
(function (window) {
  "use strict";

  var QS = window.QS;
  var utils = QS.utils;

  var FAQ = [
    {
      q: "How do I put money into my account?",
      a: "Deposits are not connected yet. QuickStark has no payment provider " +
         "registered in this build, so the Deposit action reports that rather " +
         "than pretending a transfer happened. Until one is connected, an " +
         "account is funded by QuickStark directly."
    },
    {
      q: "Why can't I invest or withdraw?",
      a: "Both need a verified account, and investing also needs enough " +
         "available balance to meet the plan's minimum. The Investments page " +
         "states which of those is missing on each plan."
    },
    {
      q: "What does a pending withdrawal mean?",
      a: "Your request is recorded and the amount is held against your balance " +
         "straight away, so the same money cannot be requested twice. It stays " +
         "pending until the payout is actually processed. You can cancel a " +
         "pending request from the Withdraw page and the amount returns to your " +
         "balance."
    },
    {
      q: "Where do the numbers on my dashboard come from?",
      a: "Every figure is calculated by the server from your transaction " +
         "history and your investments. Nothing is calculated in your browser, " +
         "and no balance is stored separately from the entries behind it, so a " +
         "total can never disagree with your statement."
    },
    {
      q: "Does QuickStark guarantee a return?",
      a: "No. Plans describe their minimum, their term, and who is eligible. " +
         "Investment values can go down as well as up, and past performance " +
         "does not indicate future results. Any growth shown on your account is " +
         "growth that has actually been recorded, never a projection."
    },
    {
      q: "Can anyone else see my account?",
      a: "No. Every record is scoped to your account in the database itself, " +
         "so a request for someone else's investments or transactions returns " +
         "nothing regardless of what the browser asks for."
    },
    {
      q: "I think someone has my password.",
      a: "Change it on the Security page, then use 'Sign out on all devices'. " +
         "That ends every session everywhere, including this one, and you will " +
         "sign back in with the new password."
    }
  ];

  function mountFaq() {
    var host = utils.qs("[data-accordion]");
    if (!host) return;

    host.innerHTML = FAQ.map(function (item, i) {
      return (
        '<div class="qs-faq__item">' +
          '<button class="qs-faq__q" aria-expanded="' + (i === 0 ? "true" : "false") + '">' +
            utils.esc(item.q) +
            '<span data-icon="chevronDown" data-icon-size="16"></span>' +
          "</button>" +
          '<div class="qs-faq__a"><p>' + utils.esc(item.a) + "</p></div>" +
        "</div>"
      );
    }).join("");

    QS.bootstrap.refresh(host);
    QS.accordion.mount(document);
  }

  QS.page({
    view: "help",
    title: "Help",
    start: function (profile) {
      mountFaq();

      var status = utils.qs("[data-help-status]");
      if (status) {
        status.textContent = profile
          ? (profile.verified ? "Verified" : "Unverified") + " · " + profile.tier
          : "—";
      }

      /* Pre-fill the support email so someone does not have to describe who
         they are from memory. */
      var link = utils.qs("[data-support-link]");
      var user = QS.auth.currentUser();
      if (link && user && user.email) {
        link.setAttribute("href",
          "mailto:support@quickstark.tech" +
          "?subject=" + encodeURIComponent("QuickStark account help") +
          "&body=" + encodeURIComponent("Account email: " + user.email + "\n\n"));
      }
    }
  });
})(window);
