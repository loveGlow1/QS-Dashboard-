import type { SeriesPoint } from "@/lib/types";

/**
 * Figures used to illustrate the product on the public landing page.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * AN ILLUSTRATION, NOT DATA.
 *
 * These exist so a visitor can see what the dashboard looks like in use, the
 * way a product screenshot would. They are not anyone's account, not platform
 * aggregates, and not a projection of what anyone will earn. Every surface
 * that renders them labels them as an example.
 *
 * Nothing here may be imported by the authenticated app, where every figure
 * must come from the customer's own records.
 * ──────────────────────────────────────────────────────────────────────────
 */

export const EXAMPLE = {
  total: 1284500,
  invested: 1200000,
  growth: 84500,
  growthPercent: 7.04,
  plan: "Growth",
} as const;

/**
 * A fixed, hand-shaped curve rising to the example total.
 *
 * Deterministic on purpose: anything random would render differently on the
 * server and the client and throw a hydration mismatch.
 */
export const EXAMPLE_SERIES: SeriesPoint[] = (() => {
  const shape = [
    0.0, 0.04, 0.03, 0.09, 0.14, 0.12, 0.19, 0.26, 0.24, 0.31, 0.38, 0.36,
    0.43, 0.5, 0.48, 0.55, 0.61, 0.59, 0.66, 0.72, 0.7, 0.77, 0.83, 0.82,
    0.87, 0.92, 0.9, 0.95, 0.98, 1.0,
  ];
  const start = 640000;
  const end = EXAMPLE.total;
  /* Anchored to a fixed date so labels never drift with the clock and the
     server and client renders agree. */
  const anchor = Date.UTC(2026, 8, 1);
  return shape.map((t, i) => {
    const d = new Date(anchor);
    d.setUTCDate(d.getUTCDate() - (shape.length - 1 - i) * 7);
    return { date: d.toISOString().slice(0, 10), value: Math.round(start + (end - start) * t) };
  });
})();
