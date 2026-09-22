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
 *
 * The chart is always on. portfolio_series returns a row per day for the
 * window, reading zero until a deposit is actually recorded, so a new account
 * sees a real chart sitting at ₦0 rather than a placeholder where the chart
 * should be — and it starts moving the moment a deposit settles, without the
 * layout changing underneath. The zero is read from the database like any
 * other value; nothing here draws a number the records do not contain.
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

  /* One point is not a line. */
  const hasHistory = series.length > 1;

  /* Nothing has been recorded for this window yet: the line is real, it just
     reads zero the whole way across. */
  const atZero = hasHistory && series.every((p) => p.value === 0);

  return (
    <Card as="article" className="flex flex-col">
      <header className="mb-[18px] flex flex-wrap items-start justify-between gap-3.5">
        <div className="max-[720px]:basis-full">
          <h2 className="text-lg font-semibold tracking-[-0.02em]">Portfolio Growth</h2>
          <p className="mt-[7px] flex flex-wrap items-center gap-2 text-xs text-mist-500">
            {atZero ? (
              <span>
                Your portfolio is at {money(0, { decimals: 2 })}. This chart
                starts reading once your first deposit is confirmed.
              </span>
            ) : hasHistory ? (
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
          hidden={!hasHistory}
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
          <LineChart
            points={series}
            height={height}
            ariaLabel={
              atZero
                ? "Portfolio value over time, currently zero"
                : "Portfolio value over time"
            }
          />
        ) : (
          /* The series should never be this short: portfolio_series returns a
             row per day for the window. If it is — a failed read, or a
             database that has not had the continuous-series migration applied
             — fall back to the explained state rather than an empty box. */
          <NoHistory height={height} />
        )}
      </div>

      {/* The prompt sits under the chart rather than in place of it, and stays
          there once the account is funded — adding money is not a thing you
          only do once. When there is no chart at all, NoHistory carries its
          own copy of it. */}
      {hasHistory && (
        <div className="mt-[18px] flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line-soft)] pt-4">
          <p className="max-w-[42ch] text-[0.8125rem] leading-[1.6] text-mist-400">
            {atZero
              ? "Fund your account to start building your portfolio."
              : "Add funds to keep building your portfolio."}
          </p>
          <ButtonLink href="/deposit" variant="ghost" size="sm">
            Make a deposit
          </ButtonLink>
        </div>
      )}
    </Card>
  );
}

/** Shown only when there is nothing at all to draw. */
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
          Fund your account to begin tracking your portfolio here.
        </p>
      </div>
      <ButtonLink href="/deposit" variant="ghost" size="sm">
        Make a deposit
      </ButtonLink>
    </div>
  );
}
