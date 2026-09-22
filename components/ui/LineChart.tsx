"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { compactMoney, formatDate, formatDateShort, money } from "@/lib/format";
import type { SeriesPoint } from "@/lib/types";

/**
 * Portfolio line chart.
 *
 * Monotone cubic interpolation (Fritsch–Carlson): the curve stays smooth
 * without inventing peaks or dips the data does not contain. That matters
 * when the line represents someone's money — an overshooting spline would
 * draw a high the account never reached.
 */

interface Props {
  points: SeriesPoint[];
  height?: number;
  showAxes?: boolean;
  interactive?: boolean;
  ariaLabel?: string;
  className?: string;
  /** Shown when there is nothing to plot. Phrase it for the caller's
      context: a platform total and a personal portfolio are not the same
      thing, and saying the wrong one is worse than saying nothing. */
  emptyMessage?: string;
}

const PAD = { top: 18, right: 8, bottom: 26 };
const Y_GUTTER = 62;

/* Grid accents. Decoration only — a rung's colour never encodes a value, so
   nothing here can be misread as a gain, a loss or a threshold. Cycled top to
   bottom and kept faint so the line stays the thing you look at. */
const GRID_COLORS = [
  "var(--color-grid-violet)",
  "var(--color-grid-green)",
  "var(--color-grid-amber)",
] as const;

function monotonePath(pts: { x: number; y: number }[]): string {
  const n = pts.length;
  if (n === 0) return "";
  if (n === 1) return `M${pts[0]!.x},${pts[0]!.y}`;
  if (n === 2) return `M${pts[0]!.x},${pts[0]!.y}L${pts[1]!.x},${pts[1]!.y}`;

  const dx: number[] = [];
  const dy: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1]!.x - pts[i]!.x;
    dy[i] = pts[i + 1]!.y - pts[i]!.y;
    slope[i] = dx[i] === 0 ? 0 : dy[i]! / dx[i]!;
  }

  const m: number[] = [slope[0]!];
  for (let i = 1; i < n - 1; i++) {
    if (slope[i - 1]! * slope[i]! <= 0) {
      m[i] = 0;
    } else {
      const w1 = 2 * dx[i]! + dx[i - 1]!;
      const w2 = dx[i]! + 2 * dx[i - 1]!;
      m[i] = (w1 + w2) / (w1 / slope[i - 1]! + w2 / slope[i]!);
    }
  }
  m[n - 1] = slope[n - 2]!;

  let d = `M${pts[0]!.x},${pts[0]!.y}`;
  for (let i = 0; i < n - 1; i++) {
    const c1x = pts[i]!.x + dx[i]! / 3;
    const c1y = pts[i]!.y + (m[i]! * dx[i]!) / 3;
    const c2x = pts[i + 1]!.x - dx[i]! / 3;
    const c2y = pts[i + 1]!.y - (m[i + 1]! * dx[i]!) / 3;
    d += `C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${pts[i + 1]!.x.toFixed(2)},${pts[i + 1]!.y.toFixed(2)}`;
  }
  return d;
}

export function LineChart({
  points,
  height = 280,
  showAxes = true,
  interactive = true,
  ariaLabel = "Portfolio value over time",
  className = "",
  emptyMessage = "No history to show yet.",
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [hover, setHover] = useState<number | null>(null);
  /* useId emits delimiters that are not safe inside a url(#…) reference. */
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");

  useEffect(() => {
    const node = hostRef.current;
    if (!node) return;
    const measure = () => setWidth(node.clientWidth || 600);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  const geometry = useMemo(() => {
    if (points.length === 0) return null;

    const left = (showAxes ? Y_GUTTER : 0) + 8;
    const innerW = Math.max(1, width - left - PAD.right);
    const innerH = Math.max(1, height - PAD.top - PAD.bottom);

    const values = points.map((p) => p.value);
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);

    /* A portfolio that has not moved still needs an axis, and that axis has to
       be anchored at zero. Padding a flat series symmetrically would put
       negative naira on the ladder of an account that has simply never gone
       below nothing. */
    const atZero = rawMin === 0 && rawMax === 0;
    const flat = rawMin === rawMax;

    let min: number;
    let max: number;
    if (atZero) {
      /* Lift the line a little off the floor so the trailing dot is not
         clipped by the baseline it sits on. */
      min = -0.12;
      max = 1;
    } else if (flat) {
      min = Math.min(0, rawMin);
      max = rawMax * 1.3;
    } else {
      const pad = (rawMax - rawMin) * 0.14;
      /* Headroom below the low point, but never below zero when the account
         never went below zero — padding a series that opens at ₦0 would put a
         negative rung on the ladder of a portfolio that has only ever grown.
         Since the series now carries a zero baseline forward, every newly
         funded account opens at exactly ₦0. */
      min = rawMin < 0 ? rawMin - pad : Math.max(0, rawMin - pad);
      max = rawMax + pad;
    }
    const span = max - min;

    const plotted = points.map((p, i) => ({
      x: left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW),
      y: PAD.top + innerH - ((p.value - min) / span) * innerH,
      data: p,
    }));

    const line = monotonePath(plotted);
    const last = plotted[plotted.length - 1]!;
    const area = `${line}L${last.x.toFixed(2)},${height - PAD.bottom}L${plotted[0]!.x.toFixed(2)},${height - PAD.bottom}Z`;

    /* The ladder is always drawn, so the chart keeps its shape at any value.
       At zero the rungs carry no numbers — five would all read the same — and
       only the baseline the line sits on is labelled. */
    const zeroY = PAD.top + innerH - (-min / span) * innerH;
    const gridLines = Array.from({ length: 5 }, (_, g) => {
      const ratio = g / 4;
      const y = PAD.top + innerH * ratio;
      return {
        y,
        label: atZero ? null : compactMoney(max - span * ratio),
        color: GRID_COLORS[g % GRID_COLORS.length]!,
      };
    });
    if (atZero) {
      gridLines.push({ y: zeroY, label: compactMoney(0), color: GRID_COLORS[1]! });
    }

    /* Thin the x labels so they never collide, but always keep the most
       recent point — that is the one a reader looks for first. */
    const maxLabels = Math.max(2, Math.min(7, Math.floor(innerW / 82)));
    const stride = Math.max(1, Math.round((points.length - 1) / (maxLabels - 1)));
    const indices: number[] = [];
    for (let i = 0; i < points.length; i += stride) indices.push(i);
    const lastIndex = points.length - 1;
    if (indices[indices.length - 1] !== lastIndex) {
      if (last.x - plotted[indices[indices.length - 1]!]!.x < 62) indices.pop();
      indices.push(lastIndex);
    }

    return { plotted, line, area, last, gridLines, left, xLabels: indices };
  }, [points, width, height, showAxes]);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!interactive || !geometry) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      let best = 0;
      let bestDist = Infinity;
      geometry.plotted.forEach((p, i) => {
        const dist = Math.abs(p.x - x);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      setHover(best);
    },
    [interactive, geometry],
  );

  if (!geometry) {
    return (
      <div
        ref={hostRef}
        className={`grid place-items-center rounded-md border border-dashed border-[var(--line)] text-center ${className}`}
        style={{ height }}
      >
        <p className="max-w-[280px] px-5 text-[0.8125rem] text-mist-400">{emptyMessage}</p>
      </div>
    );
  }

  const active = hover !== null ? geometry.plotted[hover] : null;

  return (
    <div
      ref={hostRef}
      className={`relative w-full touch-pan-y ${className}`}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setHover(null)}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        preserveAspectRatio="none"
        role="img"
        aria-label={ariaLabel}
        className="block w-full overflow-visible"
      >
        <defs>
          <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
            <stop offset="58%" stopColor="#10b981" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${uid}-line`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.55" />
            <stop offset="38%" stopColor="#10b981" stopOpacity="1" />
            <stop offset="100%" stopColor="#6ee7b7" stopOpacity="1" />
          </linearGradient>
        </defs>

        {showAxes &&
          geometry.gridLines.map((g, i) => (
            <line
              key={i}
              x1={geometry.left}
              x2={width - PAD.right}
              y1={g.y.toFixed(1)}
              y2={g.y.toFixed(1)}
              stroke={g.color}
              strokeOpacity="0.62"
              strokeWidth="1.75"
              strokeDasharray="2 8"
              strokeLinecap="round"
            />
          ))}

        <path d={geometry.area} fill={`url(#${uid}-fill)`} />
        <path
          d={geometry.line}
          fill="none"
          stroke={`url(#${uid}-line)`}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <circle
          cx={geometry.last.x}
          cy={geometry.last.y}
          r="3.5"
          fill="#10b981"
          className="[filter:drop-shadow(0_0_7px_rgba(16,185,129,0.85))]"
        />

        {active && (
          <g>
            <line
              x1={active.x}
              x2={active.x}
              y1={PAD.top - 4}
              y2={height - PAD.bottom}
              stroke="var(--line-strong)"
              strokeWidth="1"
              strokeDasharray="3 4"
            />
            <circle cx={active.x} cy={active.y} r="9" fill="rgba(16,185,129,0.2)" />
            <circle cx={active.x} cy={active.y} r="4" fill="#10b981" stroke="#060a16" strokeWidth="2.5" />
          </g>
        )}
      </svg>

      {showAxes && (
        <>
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            {geometry.gridLines.map((g, i) =>
              g.label === null ? null : (
                <span
                  key={i}
                  className="absolute left-0 -translate-y-1/2 whitespace-nowrap text-[0.65rem] tabular-nums tracking-normal text-mist-500"
                  style={{ top: g.y }}
                >
                  {g.label}
                </span>
              ),
            )}
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[18px]" aria-hidden="true">
            {geometry.xLabels.map((idx) => (
              <span
                key={idx}
                className="absolute -translate-x-1/2 whitespace-nowrap text-[0.65rem] tracking-normal text-mist-500"
                style={{ left: `${((geometry.plotted[idx]!.x / width) * 100).toFixed(3)}%` }}
              >
                {formatDateShort(points[idx]!.date)}
              </span>
            ))}
          </div>
        </>
      )}

      {interactive && active && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none absolute z-[3] grid gap-px whitespace-nowrap rounded-sm border border-[var(--line-strong)] bg-[rgba(20,28,51,0.96)] px-[11px] py-2 shadow-[0_12px_32px_-12px_rgba(2,5,12,0.7)] backdrop-blur-[8px]"
          style={{
            transform: `translate(${Math.max(4, Math.min(active.x - 70, width - 144)).toFixed(1)}px, ${Math.max(2, active.y - 62).toFixed(1)}px)`,
          }}
        >
          <span className="text-[0.6875rem] text-mist-400">{formatDate(active.data.date)}</span>
          <span className="text-sm font-semibold tabular-nums text-mist-50">
            {money(active.data.value)}
          </span>
        </div>
      )}
    </div>
  );
}
