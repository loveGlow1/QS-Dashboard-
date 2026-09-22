"use client";

import { useId } from "react";
import type { SeriesPoint } from "@/lib/types";

/**
 * The small curve that sits beside a portfolio figure.
 *
 * Used wherever a balance is shown without room for the full chart — the
 * portfolio card on every screen size, and the growth row on a phone.
 *
 * It plots the customer's own series. A mockup draws a rising line here
 * because a rising line looks better, but an account holding ₦0 has not
 * risen — so at zero this draws the flat line that is true, and it only
 * climbs once the series does.
 */
export function Sparkline({
  points,
  width = 104,
  height = 46,
  className = "",
}: {
  points: SeriesPoint[];
  width?: number;
  height?: number;
  className?: string;
}) {
  /* Two sparklines on one page must not share a gradient id. */
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const W = width;
  const H = height;

  if (points.length < 2) {
    return <span aria-hidden="true" className={`block flex-none ${className}`} style={{ width: W, height: H }} />;
  }

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  /* A flat series sits just above the floor rather than on it, so the line
     and its end point are not clipped by the edge of the box. */
  const flat = max === min;

  const xy = points.map((p, i) => {
    const x = (i / (points.length - 1)) * W;
    const y = flat ? H - 6 : H - 4 - ((p.value - min) / span) * (H - 10);
    return [x, y] as const;
  });

  const line = xy.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join("");
  const area = `${line}L${W},${H}L0,${H}Z`;
  const last = xy[xy.length - 1]!;

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={flat ? "Portfolio flat over the period" : "Portfolio over the period"}
      className={`block flex-none overflow-visible ${className}`}
    >
      <defs>
        <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${uid}-fill)`} />
      <path
        d={line}
        fill="none"
        stroke="#34d399"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={last[0]}
        cy={last[1]}
        r="2.6"
        fill="#6ee7b7"
        className="[filter:drop-shadow(0_0_6px_rgba(52,211,153,0.9))]"
      />
    </svg>
  );
}
