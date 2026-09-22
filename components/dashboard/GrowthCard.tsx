"use client";

import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
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
  hasAnyHistory,
}: {
  initialRange: ChartRange;
  initialSeries: SeriesPoint[];
  /** Whether the account has any recorded portfolio history at all. An
      account with history but none in this window is a different state from
      an account that has never invested, and reads differently. */
  hasAnyHistory: boolean;
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

  /* One point is not a line, and no points is not a chart. Rather than draw
     something the records do not support, the card says why it is empty. */
  const hasHistory = series.length > 1;

  return (
    <Card as="article" className="flex flex-col">
      <header className="mb-[18px] flex flex-wrap items-start justify-between gap-3.5">
        <div className="max-[720px]:basis-full">
          <h2 className="text-lg font-semibold tracking-[-0.02em]">Portfolio Growth</h2>
          <p className="mt-[7px] flex flex-wrap items-center gap-2 text-xs text-mist-500">
            {hasHistory ? (
              <>
                <span className={`font-medium tabular-nums ${change >= 0 ? "text-up" : "text-down"}`}>
                  {money(change, { decimals: 2, signed: true })}
                </span>
                <span>value change over {range}, deposits included</span>
              </>
            ) : (
              <span>No recorded history for this period.</span>
            )}
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Chart range"
          hidden={!hasHistory && !hasAnyHistory}
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
        {hasHistory ? (
          <LineChart points={series} height={height} ariaLabel="Portfolio value over time" />
        ) : hasAnyHistory ? (
          <div
            className="grid place-items-center rounded-md border border-dashed border-[var(--line)] px-5 text-center"
            style={{ height }}
          >
            <p className="max-w-[300px] text-[0.8125rem] leading-[1.6] text-mist-400">
              Not enough recorded history in this period yet. Try a longer range.
            </p>
          </div>
        ) : (
          <NoHistory height={height} />
        )}
      </div>
    </Card>
  );
}

/** The never-invested state. No axes, no line, no invented values. */
function NoHistory({ height }: { height: number }) {
  return (
    <div
      className="grid content-center justify-items-center gap-3 rounded-md border border-dashed border-[var(--line)] px-5 text-center"
      style={{ minHeight: height }}
    >
      <span className="grid size-10 place-items-center rounded-md border border-[var(--accent-line)] bg-[var(--accent-soft)] text-accent-300">
        <Icon name="chart" size={19} />
      </span>
      <div>
        <p className="text-sm font-medium text-mist-50">
          Your portfolio hasn&apos;t started growing yet.
        </p>
        <p className="mx-auto mt-1 max-w-[34ch] text-[0.8125rem] leading-[1.6] text-mist-400">
          Start your first investment to begin tracking your portfolio here.
        </p>
      </div>
      <ButtonLink href="/investments" variant="ghost" size="sm">
        Start Investing
      </ButtonLink>
    </div>
  );
}
