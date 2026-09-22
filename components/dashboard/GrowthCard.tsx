"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { LineChart } from "@/components/ui/LineChart";
import { money } from "@/lib/format";
import type { ChartRange, SeriesPoint } from "@/lib/types";

const RANGES: ChartRange[] = ["1M", "3M", "6M", "1Y"];

/**
 * Portfolio growth over a selectable range.
 *
 * The initial range arrives rendered from the server; switching fetches the
 * new range rather than slicing client-side, so what is drawn is always what
 * the database returned for that window.
 */
export function GrowthCard({
  initialRange,
  initialSeries,
}: {
  initialRange: ChartRange;
  initialSeries: SeriesPoint[];
}) {
  const [range, setRange] = useState<ChartRange>(initialRange);
  const [series, setSeries] = useState<SeriesPoint[]>(initialSeries);
  const [loading, setLoading] = useState(false);
  const [height, setHeight] = useState(280);

  /* Phones give up 50px of chart; vertical space is scarcer there than the
     detail it buys. */
  useEffect(() => {
    const measure = () => setHeight(window.innerWidth <= 720 ? 230 : 280);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  async function select(next: ChartRange) {
    if (next === range || loading) return;
    setRange(next);
    setLoading(true);
    try {
      const res = await fetch(`/api/portfolio/series?range=${next}`, { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { series: SeriesPoint[] };
      setSeries(data.series);
    } catch {
      /* Keep the previous range on screen rather than blanking the chart. */
    } finally {
      setLoading(false);
    }
  }

  const open = series[0]?.value ?? 0;
  const close = series[series.length - 1]?.value ?? 0;
  const change = close - open;

  return (
    <Card as="article" className="flex flex-col">
      <header className="mb-[18px] flex flex-wrap items-start justify-between gap-3.5">
        <div className="max-[720px]:basis-full">
          <h2 className="text-lg font-semibold tracking-[-0.02em]">Portfolio Growth</h2>
          <p className="mt-[7px] flex flex-wrap items-center gap-2 text-xs text-mist-500">
            {series.length > 1 ? (
              <>
                <span className={`font-medium tabular-nums ${change >= 0 ? "text-up" : "text-down"}`}>
                  {money(change, { signed: true })}
                </span>
                <span>value change over {range}, deposits included</span>
              </>
            ) : (
              <span>Not enough history to show a change yet.</span>
            )}
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Chart range"
          className="inline-flex gap-0.5 rounded-full border border-[var(--line)] bg-ink-800 p-[3px] max-[720px]:w-full"
        >
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              role="tab"
              aria-selected={r === range}
              onClick={() => select(r)}
              className={`h-7 rounded-full px-[13px] text-xs font-medium transition-colors max-[720px]:flex-1 ${
                r === range ? "bg-ink-600 text-mist-50 shadow-sm" : "text-mist-400 hover:text-mist-200"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </header>

      <div className={`flex-1 transition-opacity ${loading ? "opacity-50" : "opacity-100"}`}>
        <LineChart
          points={series}
          height={height}
          ariaLabel="Portfolio value over time"
          emptyMessage="Your chart appears once your first investment is funded."
        />
      </div>
    </Card>
  );
}
