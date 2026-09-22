/**
 * QuickStark — public site header.
 *
 * Handles the condensed-on-scroll state, the mobile drawer (with focus
 * trapping and scroll lock) and active-section highlighting.
 */
(function (window) {
  "use strict";

  var QS = (window.QS = window.QS || {});
  var utils = QS.utils;

  function mount() {
    var header = utils.qs("[data-site-header]");
    if (!header) return;

    var toggle = utils.qs("[data-nav-toggle]", header);
    var drawer = utils.qs("[data-nav-drawer]");
    var backdrop = utils.qs("[data-nav-backdrop]");
    var lastFocus = null;

    /* --- condensed header on scroll ------------------------------- */
    var onScroll = function () {
      header.setAttribute("data-scrolled", window.scrollY > 12 ? "true" : "false");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    /* --- mobile drawer -------------------------------------------- */
    function setOpen(open) {
      if (!drawer) return;
      drawer.setAttribute("data-open", open ? "true" : "false");
      if (backdrop) backdrop.setAttribute("data-open", open ? "true" : "false");
      if (toggle) toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";

      if (open) {
        lastFocus = document.activeElement;
        var first = drawer.querySelector("a, button");
        if (first) setTimeout(function () { first.focus(); }, 60);
      } else if (lastFocus && lastFocus.focus) {
        lastFocus.focus();
      }
    }

    if (toggle) {
      toggle.addEventListener("click", function () {
        setOpen(drawer.getAttribute("data-open") !== "true");
      });
    }
    if (backdrop) backdrop.addEventListener("click", function () { setOpen(false); });

    if (drawer) {
      utils.qsa("a, button", drawer).forEach(function (node) {
        node.addEventListener("click", function () { setOpen(false); });
      });
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && drawer && drawer.getAttribute("data-open") === "true") {
        setOpen(false);
      }
    });

    /* Close the drawer if the viewport grows past the breakpoint. */
    window.addEventListener("resize", utils.debounce(function () {
      if (window.innerWidth > 900) setOpen(false);
    }, 150));

    /* --- active section ------------------------------------------- */
    var links = utils.qsa("[data-nav-link]");
    var sections = links
      .map(function (link) {
        var id = (link.getAttribute("href") || "").split("#")[1];
        return id ? document.getElementById(id) : null;
      })
      .filter(Boolean);

    if (sections.length && window.IntersectionObserver) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (link) {
            var match = (link.getAttribute("href") || "").endsWith("#" + entry.target.id);
            link.setAttribute("data-active", match ? "true" : "false");
          });
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      sections.forEach(function (s) { observer.observe(s); });
    }
  }

  QS.siteNav = { mount: mount };
})(window);
