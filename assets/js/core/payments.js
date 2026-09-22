/**
 * QuickStark — payment service boundary.
 *
 * No provider is registered by default, and no money moves until one is. This
 * module exists so that the UI never speaks to a payment provider directly:
 * screens call `QS.payments.*`, and a provider adapter is registered behind it.
 *
 *   QS.payments.use(PaystackAdapter)   // or Stripe, or anything else
 *
 * An adapter implements:
 *   name            {string}
 *   initDeposit(req)    → Promise<{ reference, redirectUrl?, status }>
 *   initWithdrawal(req) → Promise<{ reference, status }>
 *   verify(reference)   → Promise<{ reference, status }>
 *
 * Until one is registered every call resolves to a `provider_unavailable`
 * result, which the UI reports as unavailable — never as a completed
 * transaction.
 */
(function (window) {
  "use strict";

  var QS = (window.QS = window.QS || {});

  var adapter = null;

  function unavailable(intent) {
    return Promise.resolve({
      status: "provider_unavailable",
      intent: intent,
      reference: null,
      message:
        "Payments are not connected yet. No money has moved."
    });
  }

  QS.payments = {
    /** Registers the active provider adapter. */
    use: function (providerAdapter) {
      adapter = providerAdapter || null;
      return QS.payments;
    },

    provider: function () { return adapter ? adapter.name : null; },
    isConnected: function () { return adapter !== null; },

    /** @param {{amount:number, currency:string}} request */
    initDeposit: function (request) {
      return adapter ? adapter.initDeposit(request) : unavailable("deposit");
    },

    /** @param {{amount:number, currency:string, destination:string}} request */
    initWithdrawal: function (request) {
      return adapter ? adapter.initWithdrawal(request) : unavailable("withdrawal");
    },

    verify: function (reference) {
      return adapter ? adapter.verify(reference) : unavailable("verify");
    }
  };
})(window);
