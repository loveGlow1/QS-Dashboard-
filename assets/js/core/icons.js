/**
 * QuickStark — icon set.
 *
 * One consistent family: 24x24 grid, 1.6 stroke, round caps. Icons are
 * returned as markup strings so they can be dropped into templates.
 */
(function (window) {
  "use strict";

  var QS = (window.QS = window.QS || {});

  var PATHS = {
    /* Navigation */
    grid: '<rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/>',
    chart: '<path d="M4 19V9"/><path d="M10 19V5"/><path d="M16 19v-7"/><path d="M21 19H3"/>',
    list: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3.5 6h.01"/><path d="M3.5 12h.01"/><path d="M3.5 18h.01"/>',
    download: '<path d="M12 3v12"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M4 20h16"/>',
    user: '<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
    shield: '<path d="M12 3 5 6v5.5c0 4.2 2.9 7.6 7 9.5 4.1-1.9 7-5.3 7-9.5V6l-7-3Z"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.1-2.4 3.6"/><path d="M12 17.2h.01"/>',
    logout: '<path d="M14 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8"/><path d="m16 15 3.5-3-3.5-3"/><path d="M19 12H10"/>',

    /* Actions */
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    arrowRight: '<path d="M4.5 12h15"/><path d="m13.5 6 6 6-6 6"/>',
    arrowUpRight: '<path d="M7 17 17 7"/><path d="M8.5 7H17v8.5"/>',
    arrowDownLeft: '<path d="M17 7 7 17"/><path d="M15.5 17H7V8.5"/>',
    trendUp: '<path d="m4 16 5-5 3.5 3.5L20 7"/><path d="M15 7h5v5"/>',
    trendDown: '<path d="m4 8 5 5 3.5-3.5L20 17"/><path d="M15 17h5v-5"/>',
    wallet: '<path d="M3.5 8.5A2.5 2.5 0 0 1 6 6h11a2 2 0 0 1 2 2v1"/><rect x="3.5" y="8.5" width="17" height="11" rx="2.5"/><path d="M16.5 14h.01"/>',
    bank: '<path d="M4 10h16"/><path d="m12 3 8 4H4l8-4Z"/><path d="M6.5 10v7"/><path d="M12 10v7"/><path d="M17.5 10v7"/><path d="M4 20h16"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-13.6-4.6L4 8.5"/><path d="M4 4v4.5h4.5"/><path d="M4 13a8 8 0 0 0 13.6 4.6L20 15.5"/><path d="M20 20v-4.5h-4.5"/>',

    /* UI */
    bell: '<path d="M18 9a6 6 0 0 0-12 0c0 5-2 6.5-2 6.5h16S18 14 18 9Z"/><path d="M13.7 19a2 2 0 0 1-3.4 0"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-3.6-3.6"/>',
    chevronDown: '<path d="m6 9.5 6 6 6-6"/>',
    chevronRight: '<path d="m9.5 6 6 6-6 6"/>',
    chevronLeft: '<path d="m14.5 6-6 6 6 6"/>',
    close: '<path d="M6 6l12 12"/><path d="M18 6 6 18"/>',
    menu: '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12.2 2.4 2.4 4.6-4.9"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><path d="M12 7.8h.01"/>',
    alert: '<path d="M12 4.5 3 19.5h18L12 4.5Z"/><path d="M12 10v4"/><path d="M12 17h.01"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 1.8"/>',
    lock: '<rect x="4.5" y="10" width="15" height="10.5" rx="2.5"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/>',
    eye: '<path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M9.9 5.1A9.6 9.6 0 0 1 12 4.9c6 0 9.5 6.2 9.5 6.2a17 17 0 0 1-3 3.8"/><path d="M6.4 6.9A17 17 0 0 0 2.5 11.1S6 17.3 12 17.3a9.3 9.3 0 0 0 3.8-.8"/><path d="M9.9 9.2a3 3 0 0 0 4.2 4.3"/><path d="m4 3.5 16 16"/>',
    mail: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="m4 8 7.2 4.8a1.5 1.5 0 0 0 1.6 0L20 8"/>',
    sparkle: '<path d="M12 4.5 13.6 9l4.5 1.6L13.6 12l-1.6 4.5L10.4 12 5.9 10.6 10.4 9 12 4.5Z"/><path d="M18.5 4v3"/><path d="M20 5.5h-3"/>',
    layers: '<path d="m12 3.5 8.5 4.2-8.5 4.3-8.5-4.3L12 3.5Z"/><path d="m3.5 12.5 8.5 4.2 8.5-4.2"/><path d="m3.5 16.8 8.5 4.2 8.5-4.2"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5a13 13 0 0 1 0 17"/><path d="M12 3.5a13 13 0 0 0 0 17"/>',
    file: '<path d="M13.5 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9l-5.5-5.5Z"/><path d="M13.5 3.5V9H19"/>',
    inbox: '<path d="M4 13.5h4l1.2 2.2h5.6L16 13.5h4"/><path d="M5.6 5.5h12.8l2.1 8v4a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2v-4l2.1-8Z"/>'
  };

  /**
   * @param {string} name  key from the set above
   * @param {object} [opts] { size, class, stroke }
   * @returns {string} SVG markup
   */
  function icon(name, opts) {
    opts = opts || {};
    var body = PATHS[name];
    if (!body) return "";
    var size = opts.size || 24;
    return (
      '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size +
      '" fill="none" stroke="currentColor" stroke-width="' + (opts.stroke || 1.6) +
      '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' +
      (opts.class ? ' class="' + opts.class + '"' : "") + ">" + body + "</svg>"
    );
  }

  icon.has = function (name) { return Object.prototype.hasOwnProperty.call(PATHS, name); };
  icon.names = function () { return Object.keys(PATHS); };

  QS.icon = icon;
})(window);
