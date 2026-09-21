/**
 * QuickStark — accordion (used by the FAQ).
 *
 * Markup contract:
 *   <div data-accordion>
 *     <div class="qs-faq__item">
 *       <button class="qs-faq__q" aria-expanded="false">…</button>
 *       <div class="qs-faq__a"><p>…</p></div>
 *     </div>
 *   </div>
 */
(function (window) {
  "use strict";

  var QS = (window.QS = window.QS || {});
  var utils = QS.utils;

  function mount(scope) {
    utils.qsa("[data-accordion]", scope).forEach(function (group) {
      var items = utils.qsa(".qs-faq__item", group);

      items.forEach(function (item, i) {
        var btn = utils.qs(".qs-faq__q", item);
        var panel = utils.qs(".qs-faq__a", item);
        if (!btn || !panel) return;

        var panelId = panel.id || "qs-faq-panel-" + i + "-" + Math.random().toString(36).slice(2, 7);
        panel.id = panelId;
        btn.setAttribute("aria-controls", panelId);
        panel.setAttribute("role", "region");
        panel.setAttribute("aria-labelledby", btn.id || (btn.id = panelId + "-btn"));

        btn.addEventListener("click", function () {
          var isOpen = btn.getAttribute("aria-expanded") === "true";
          /* One panel open at a time keeps the section compact. */
          items.forEach(function (other) {
            var otherBtn = utils.qs(".qs-faq__q", other);
            var otherPanel = utils.qs(".qs-faq__a", other);
            if (!otherBtn || !otherPanel) return;
            otherBtn.setAttribute("aria-expanded", "false");
            otherPanel.style.maxHeight = "0px";
            other.removeAttribute("data-open");
          });

          if (!isOpen) {
            btn.setAttribute("aria-expanded", "true");
            item.setAttribute("data-open", "true");
            panel.style.maxHeight = panel.scrollHeight + "px";
          }
        });

        panel.style.maxHeight = "0px";
      });

      /* Keep an open panel correctly sized when the viewport reflows. */
      window.addEventListener("resize", utils.debounce(function () {
        items.forEach(function (item) {
          if (item.getAttribute("data-open") !== "true") return;
          var panel = utils.qs(".qs-faq__a", item);
          if (panel) panel.style.maxHeight = panel.scrollHeight + "px";
        });
      }, 140));
    });
  }

  QS.accordion = { mount: mount };
})(window);
