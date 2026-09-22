/**
 * QuickStark — portfolio line chart.
 *
 * A dependency-free SVG line chart tuned for financial series: monotone
 * cubic smoothing (no overshoot below a data point), a soft area fill, a
 * restrained grid, and a hover/tap readout of date + value.
 *
 * Usage:
 *   var chart = QS.Chart(node, { points: [{date, value}], height: 260 });
 *   chart.setPoints(nextPoints);
 *   chart.destroy();
 */
(function (window) {
  "use strict";

  var QS = (window.QS = window.QS || {});
  var utils = QS.utils;
  var SVG_NS = "http://www.w3.org/2000/svg";
  var uid = 0;

  function svgEl(tag, attrs) {
    var node = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (attrs[k] === null || attrs[k] === undefined) return;
      node.setAttribute(k, attrs[k]);
    });
    return node;
  }

  /**
   * Fritsch–Carlson monotone cubic interpolation.
   * Keeps the curve smooth without inventing peaks or dips the data
   * does not contain — important when the line represents money.
   * @param {Array<{x:number,y:number}>} pts
   * @returns {string} SVG path `d`
   */
  function monotonePath(pts) {
    var n = pts.length;
    if (n === 0) return "";
    if (n === 1) return "M" + pts[0].x + "," + pts[0].y;
    if (n === 2) return "M" + pts[0].x + "," + pts[0].y + "L" + pts[1].x + "," + pts[1].y;

    var dx = [], dy = [], slope = [], i;
    for (i = 0; i < n - 1; i++) {
      dx[i] = pts[i + 1].x - pts[i].x;
      dy[i] = pts[i + 1].y - pts[i].y;
      slope[i] = dx[i] === 0 ? 0 : dy[i] / dx[i];
    }

    var m = [slope[0]];
    for (i = 1; i < n - 1; i++) {
      if (slope[i - 1] * slope[i] <= 0) {
        m[i] = 0;
      } else {
        var w1 = 2 * dx[i] + dx[i - 1];
        var w2 = dx[i] + 2 * dx[i - 1];
        m[i] = (w1 + w2) / (w1 / slope[i - 1] + w2 / slope[i]);
      }
    }
    m[n - 1] = slope[n - 2];

    var d = "M" + pts[0].x + "," + pts[0].y;
    for (i = 0; i < n - 1; i++) {
      var c1x = pts[i].x + dx[i] / 3;
      var c1y = pts[i].y + (m[i] * dx[i]) / 3;
      var c2x = pts[i + 1].x - dx[i] / 3;
      var c2y = pts[i + 1].y - (m[i + 1] * dx[i]) / 3;
      d += "C" + c1x.toFixed(2) + "," + c1y.toFixed(2) +
           " " + c2x.toFixed(2) + "," + c2y.toFixed(2) +
           " " + pts[i + 1].x.toFixed(2) + "," + pts[i + 1].y.toFixed(2);
    }
    return d;
  }

  function Chart(container, options) {
    if (!container) return null;

    var opts = Object.assign({
      points: [],
      height: 260,
      padding: { top: 18, right: 8, bottom: 26, left: 8 },
      showGrid: true,
      showYAxis: true,
      yAxisWidth: 62,
      showXAxis: true,
      interactive: true,
      animate: true,
      gridLines: 4,
      accent: "#4d7cf3",
      formatValue: function (v) { return utils.money(v); },
      formatAxis: function (v) { return utils.compactMoney(v); },
      formatDate: function (iso) { return utils.date(iso); }
    }, options || {});

    var id = "qsc" + (++uid);
    var points = opts.points.slice();
    var width = 0;
    var height = opts.height;
    var plotted = [];
    var resizeObserver = null;
    var destroyed = false;

    container.classList.add("qs-chart");
    container.innerHTML = "";

    var svg = svgEl("svg", {
      class: "qs-chart__svg",
      preserveAspectRatio: "none",
      role: "img",
      "aria-label": opts.ariaLabel || "Portfolio value over time"
    });

    var defs = svgEl("defs");
    var grad = svgEl("linearGradient", { id: id + "-fill", x1: "0", y1: "0", x2: "0", y2: "1" });
    grad.appendChild(svgEl("stop", { offset: "0%", "stop-color": opts.accent, "stop-opacity": "0.2" }));
    grad.appendChild(svgEl("stop", { offset: "58%", "stop-color": opts.accent, "stop-opacity": "0.05" }));
    grad.appendChild(svgEl("stop", { offset: "100%", "stop-color": opts.accent, "stop-opacity": "0" }));
    defs.appendChild(grad);

    var lineGrad = svgEl("linearGradient", { id: id + "-line", x1: "0", y1: "0", x2: "1", y2: "0" });
    lineGrad.appendChild(svgEl("stop", { offset: "0%", "stop-color": opts.accent, "stop-opacity": "0.55" }));
    lineGrad.appendChild(svgEl("stop", { offset: "38%", "stop-color": opts.accent, "stop-opacity": "1" }));
    lineGrad.appendChild(svgEl("stop", { offset: "100%", "stop-color": "#7ea6ff", "stop-opacity": "1" }));
    defs.appendChild(lineGrad);
    svg.appendChild(defs);

    var gGrid = svgEl("g", { class: "qs-chart__grid" });
    var area = svgEl("path", { class: "qs-chart__area", fill: "url(#" + id + "-fill)" });
    var line = svgEl("path", {
      class: "qs-chart__line",
      fill: "none",
      stroke: "url(#" + id + "-line)",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round"
    });
    var gCursor = svgEl("g", { class: "qs-chart__cursor", opacity: "0" });
    var cursorLine = svgEl("line", { class: "qs-chart__cursor-line" });
    var cursorHalo = svgEl("circle", { class: "qs-chart__cursor-halo", r: "9" });
    var cursorDot = svgEl("circle", { class: "qs-chart__cursor-dot", r: "4", fill: opts.accent });
    gCursor.appendChild(cursorLine);
    gCursor.appendChild(cursorHalo);
    gCursor.appendChild(cursorDot);

    var endDot = svgEl("circle", { class: "qs-chart__end-dot", r: "3.5", fill: opts.accent });

    svg.appendChild(gGrid);
    svg.appendChild(area);
    svg.appendChild(line);
    svg.appendChild(endDot);
    svg.appendChild(gCursor);
    container.appendChild(svg);

    /* Axis labels live in the DOM (not the SVG) so they stay crisp and
       inherit typography from the stylesheet. */
    var yAxis = utils.el("div", { class: "qs-chart__y-axis", "aria-hidden": "true" });
    var xAxis = utils.el("div", { class: "qs-chart__x-axis", "aria-hidden": "true" });
    if (opts.showYAxis) container.appendChild(yAxis);
    if (opts.showXAxis) container.appendChild(xAxis);

    var tip = utils.el("div", { class: "qs-chart__tip", role: "status", "aria-live": "polite" });
    if (opts.interactive) container.appendChild(tip);

    /* -------------------------------------------------------------- *
     * Rendering
     * -------------------------------------------------------------- */

    function bounds() {
      var values = points.map(function (p) { return p.value; });
      var min = Math.min.apply(null, values);
      var max = Math.max.apply(null, values);
      if (min === max) { min -= 1; max += 1; }
      var pad = (max - min) * 0.14;
      return { min: min - pad, max: max + pad };
    }

    function render() {
      if (destroyed || !points.length) return;
      width = container.clientWidth || 600;
      height = opts.height;

      svg.setAttribute("viewBox", "0 0 " + width + " " + height);
      svg.setAttribute("width", width);
      svg.setAttribute("height", height);

      var p = opts.padding;
      var left = p.left + (opts.showYAxis ? opts.yAxisWidth : 0);
      var innerW = Math.max(1, width - left - p.right);
      var innerH = Math.max(1, height - p.top - p.bottom);
      var b = bounds();
      var span = b.max - b.min;

      plotted = points.map(function (pt, i) {
        return {
          x: left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW),
          y: p.top + innerH - ((pt.value - b.min) / span) * innerH,
          data: pt
        };
      });

      var d = monotonePath(plotted);
      line.setAttribute("d", d);
      area.setAttribute(
        "d",
        d + "L" + plotted[plotted.length - 1].x.toFixed(2) + "," + (height - p.bottom) +
        "L" + plotted[0].x.toFixed(2) + "," + (height - p.bottom) + "Z"
      );

      var last = plotted[plotted.length - 1];
      endDot.setAttribute("cx", last.x);
      endDot.setAttribute("cy", last.y);

      cursorLine.setAttribute("y1", p.top - 4);
      cursorLine.setAttribute("y2", height - p.bottom);

      /* Grid + Y labels */
      gGrid.innerHTML = "";
      yAxis.innerHTML = "";
      if (opts.showGrid || opts.showYAxis) {
        for (var g = 0; g <= opts.gridLines; g++) {
          var ratio = g / opts.gridLines;
          var y = p.top + innerH * ratio;
          if (opts.showGrid) {
            gGrid.appendChild(svgEl("line", {
              x1: left, x2: width - p.right, y1: y.toFixed(1), y2: y.toFixed(1)
            }));
          }
          if (opts.showYAxis) {
            yAxis.appendChild(utils.el("span", {
              class: "qs-chart__y-label",
              style: "top:" + y.toFixed(1) + "px",
              text: opts.formatAxis(b.max - span * ratio)
            }));
          }
        }
      }

      /* X labels — thinned so they never collide */
      if (opts.showXAxis) {
        xAxis.innerHTML = "";
        var maxLabels = Math.max(2, Math.min(7, Math.floor(innerW / 82)));
        var stride = Math.max(1, Math.round((points.length - 1) / (maxLabels - 1)));
        var indices = [];
        for (var i = 0; i < points.length; i += stride) indices.push(i);

        /* The most recent point always carries a label; drop its neighbour
           if the two would sit on top of each other. */
        var lastIndex = points.length - 1;
        if (indices[indices.length - 1] !== lastIndex) {
          if (plotted[lastIndex].x - plotted[indices[indices.length - 1]].x < 62) indices.pop();
          indices.push(lastIndex);
        }

        indices.forEach(function (idx) {
          var pl = plotted[idx];
          xAxis.appendChild(utils.el("span", {
            class: "qs-chart__x-label",
            style: "left:" + ((pl.x / width) * 100).toFixed(3) + "%",
            text: opts.formatXLabel ? opts.formatXLabel(points[idx].date) : utils.dateShort(points[idx].date)
          }));
        });
      }

      if (opts.animate && !utils.prefersReducedMotion()) {
        var len = line.getTotalLength ? line.getTotalLength() : 0;
        if (len) {
          line.style.transition = "none";
          line.style.strokeDasharray = len;
          line.style.strokeDashoffset = len;
          /* force reflow before starting the draw */
          void line.getBoundingClientRect();
          line.style.transition = "stroke-dashoffset 900ms cubic-bezier(0.22,0.61,0.36,1)";
          line.style.strokeDashoffset = "0";
        }
        area.style.opacity = "0";
        area.style.transition = "opacity 700ms ease 180ms";
        void area.getBoundingClientRect();
        area.style.opacity = "1";
        opts.animate = false; /* only the first paint draws in */
      }
    }

    /* -------------------------------------------------------------- *
     * Interaction
     * -------------------------------------------------------------- */

    function nearest(clientX) {
      var rect = svg.getBoundingClientRect();
      var x = clientX - rect.left;
      var best = 0, bestDist = Infinity;
      for (var i = 0; i < plotted.length; i++) {
        var dist = Math.abs(plotted[i].x - x);
        if (dist < bestDist) { bestDist = dist; best = i; }
      }
      return plotted[best];
    }

    function showCursor(clientX) {
      if (!plotted.length) return;
      var pt = nearest(clientX);
      gCursor.setAttribute("opacity", "1");
      cursorLine.setAttribute("x1", pt.x);
      cursorLine.setAttribute("x2", pt.x);
      cursorHalo.setAttribute("cx", pt.x);
      cursorHalo.setAttribute("cy", pt.y);
      cursorDot.setAttribute("cx", pt.x);
      cursorDot.setAttribute("cy", pt.y);

      tip.innerHTML =
        '<span class="qs-chart__tip-date">' + utils.esc(opts.formatDate(pt.data.date)) + "</span>" +
        '<span class="qs-chart__tip-value qs-num">' + utils.esc(opts.formatValue(pt.data.value)) + "</span>";
      tip.setAttribute("data-visible", "true");

      /* Keep the tooltip inside the plot area. */
      var tipW = tip.offsetWidth || 140;
      var x = utils.clamp(pt.x - tipW / 2, 4, Math.max(4, width - tipW - 4));
      tip.style.transform = "translate(" + x.toFixed(1) + "px," + Math.max(2, pt.y - 62).toFixed(1) + "px)";

      if (typeof opts.onHover === "function") opts.onHover(pt.data);
    }

    function hideCursor() {
      gCursor.setAttribute("opacity", "0");
      tip.removeAttribute("data-visible");
      if (typeof opts.onLeave === "function") opts.onLeave();
    }

    var handlers = [];
    function on(target, type, fn, options) {
      target.addEventListener(type, fn, options);
      handlers.push([target, type, fn, options]);
    }

    if (opts.interactive) {
      on(container, "pointermove", function (e) { showCursor(e.clientX); });
      on(container, "pointerleave", hideCursor);
      on(container, "pointerdown", function (e) {
        if (e.pointerType === "touch") showCursor(e.clientX);
      });
      on(container, "touchmove", function (e) {
        if (e.touches && e.touches[0]) {
          showCursor(e.touches[0].clientX);
          e.preventDefault();
        }
      }, { passive: false });
      on(container, "touchend", hideCursor);
    }

    var onResize = utils.debounce(render, 90);
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(onResize);
      resizeObserver.observe(container);
    } else {
      on(window, "resize", onResize);
    }

    render();

    return {
      node: container,
      /** Swaps the series, re-drawing in place. */
      setPoints: function (next, animate) {
        points = (next || []).slice();
        if (animate) opts.animate = true;
        hideCursor();
        render();
      },
      redraw: render,
      /** Re-renders at a new height (used when the breakpoint changes). */
      setHeight: function (next) {
        if (!next || next === opts.height) return;
        opts.height = next;
        render();
      },
      destroy: function () {
        destroyed = true;
        if (resizeObserver) resizeObserver.disconnect();
        handlers.forEach(function (h) { h[0].removeEventListener(h[1], h[2], h[3]); });
        handlers = [];
        container.innerHTML = "";
      }
    };
  }

  QS.Chart = Chart;
})(window);
