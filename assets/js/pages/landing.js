/**
 * QuickStark — landing page controller.
 */
(function (window) {
  "use strict";

  var QS = window.QS;
  var utils = QS.utils;

  /* ------------------------------------------------------------------ *
   * Investment plans
   * ------------------------------------------------------------------ */

  function planCard(plan, index) {
    var open = plan.status === "open";
    return (
      '<article class="qs-plan' + (plan.featured ? " qs-plan--featured" : "") +
        '" data-reveal data-reveal-delay="' + index * 80 + '">' +
        (plan.featured ? '<span class="qs-plan__flag">Most chosen</span>' : "") +
        '<header class="qs-plan__head">' +
          "<h3>" + utils.esc(plan.name) + "</h3>" +
          '<span class="qs-badge ' + (open ? "qs-badge--up" : "qs-badge--warn") + '">' +
            (open ? "Open" : "Waitlist") +
          "</span>" +
        "</header>" +
        '<p class="qs-plan__summary">' + utils.esc(plan.summary) + "</p>" +
        '<dl class="qs-plan__terms">' +
          "<div><dt>Minimum investment</dt><dd class=\"qs-num\">" + utils.money(plan.minimum) + "</dd></div>" +
          "<div><dt>Duration</dt><dd>" + utils.esc(plan.term) + "</dd></div>" +
          "<div><dt>Eligibility</dt><dd>" + utils.esc(plan.eligibility) + "</dd></div>" +
        "</dl>" +
        '<ul class="qs-plan__features">' +
          (plan.features || []).map(function (f) {
            return "<li><span data-icon=\"check\" data-icon-size=\"14\"></span>" + utils.esc(f) + "</li>";
          }).join("") +
        "</ul>" +
        '<button class="qs-btn ' + (plan.featured ? "qs-btn--primary" : "qs-btn--ghost") +
          ' qs-btn--block" data-plan-details="' + utils.esc(plan.name) + '">View Details</button>' +
      "</article>"
    );
  }

  function skeletonCards(count) {
    var one =
      '<article class="qs-plan qs-plan--loading">' +
        '<div class="qs-skeleton" style="height:22px;width:38%"></div>' +
        '<div class="qs-skeleton" style="height:14px;width:90%;margin-top:16px"></div>' +
        '<div class="qs-skeleton" style="height:14px;width:70%;margin-top:8px"></div>' +
        '<div class="qs-skeleton" style="height:96px;margin-top:22px"></div>' +
        '<div class="qs-skeleton" style="height:42px;margin-top:22px;border-radius:999px"></div>' +
      "</article>";
    return new Array(count + 1).join(one);
  }

  function mountPlans() {
    var grid = utils.qs("[data-plans-grid]");
    if (!grid) return;

    grid.innerHTML = skeletonCards(3);

    QS.api.getPlans()
      .then(function (plans) {
        plans = plans || [];
        if (!plans.length) {
          grid.innerHTML =
            '<div class="qs-empty" style="grid-column:1/-1">' +
              QS.icon("layers") +
              "<p>No plans are open right now. Check back soon.</p>" +
            "</div>";
          return;
        }

        grid.innerHTML = plans.map(planCard).join("");
        QS.bootstrap.refresh(grid);

        utils.qsa("[data-plan-details]", grid).forEach(function (btn) {
          btn.addEventListener("click", function () {
            QS.toast({
              title: btn.getAttribute("data-plan-details") + " plan",
              message: "Full plan details arrive with the investments page. Sign in to see your dashboard.",
              icon: "layers"
            });
          });
        });
      })
      .catch(function () {
        grid.innerHTML =
          '<div class="qs-empty" style="grid-column:1/-1">' +
            QS.icon("alert") +
            "<p>Plans could not be loaded right now. Please try again.</p>" +
          "</div>";
      });
  }

  /* ------------------------------------------------------------------ *
   * Init
   * ------------------------------------------------------------------ */

  function init() {
    QS.bootstrap.mount(document);
    QS.siteNav.mount();
    QS.accordion.mount(document);
    mountPlans();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window);
