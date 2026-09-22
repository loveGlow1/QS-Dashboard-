import { Badge } from "@/components/ui/Badge";
import { Card, CardHead, CardLabel } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { clamp, money, percent } from "@/lib/format";
import type { PortfolioSummary } from "@/lib/types";

/**
 * Portfolio totals. Every figure here comes from the portfolio_totals view —
 * nothing on this card is recomputed in the app.
 */
export function PortfolioCard({ portfolio }: { portfolio: PortfolioSummary }) {
  const up = portfolio.growth >= 0;
  const hasHoldings = portfolio.invested > 0 || portfolio.total_value > 0;
  const principalShare = portfolio.total_value
    ? clamp((portfolio.invested / portfolio.total_value) * 100, 0, 100)
    : 0;

  return (
    <Card as="article" className="flex flex-col bg-[linear-gradient(170deg,rgba(77,124,243,0.1)_0%,rgba(77,124,243,0)_44%),var(--color-ink-850)]">
      <CardHead className="mb-3">
        <CardLabel>Total portfolio</CardLabel>
      </CardHead>

      <p className="text-[clamp(1.875rem,1.4rem+1.6vw,2.375rem)] font-semibold leading-[1.1] tracking-[-0.035em] tabular-nums max-[720px]:text-[2.125rem]">
        {money(portfolio.total_value)}
      </p>

      <div className="mt-3 flex min-h-6 flex-wrap items-center gap-2">
        {hasHoldings ? (
          <>
            <span
              className={`inline-flex items-center gap-1.5 text-[0.8125rem] font-medium tabular-nums ${up ? "text-up" : "text-down"}`}
            >
              <Icon name={up ? "trendUp" : "trendDown"} size={13} />
              {money(portfolio.growth, { signed: true })}
            </span>
            <Badge tone={up ? "up" : "down"}>{percent(portfolio.growth_percent)}</Badge>
            <span className="text-xs text-mist-500">since you invested</span>
          </>
        ) : (
          <span className="text-xs text-mist-500">No investments yet.</span>
        )}
      </div>

      {hasHoldings && (
        <div className="mt-[26px] border-t border-[var(--line-soft)] pt-5">
          <p className="mb-[11px] text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-mist-500">
            Composition
          </p>
          <div className="flex h-[7px] overflow-hidden rounded-full bg-up">
            <span
              className="block h-full border-r-2 border-ink-850 bg-accent-500 transition-[width] duration-700"
              style={{ width: `${principalShare.toFixed(2)}%` }}
            />
          </div>
          <dl className="mt-3.5 grid gap-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="flex items-center gap-2 text-[0.8125rem] text-mist-400">
                <span className="size-1.5 rounded-full bg-accent-500" />
                Principal
              </dt>
              <dd className="flex items-baseline gap-2.5">
                <span className="text-[0.8125rem] font-semibold tabular-nums">{money(portfolio.invested)}</span>
                <span className="min-w-[42px] text-right text-xs tabular-nums text-mist-500">
                  {principalShare.toFixed(1)}%
                </span>
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="flex items-center gap-2 text-[0.8125rem] text-mist-400">
                <span className="size-1.5 rounded-full bg-up" />
                Growth
              </dt>
              <dd className="flex items-baseline gap-2.5">
                <span className="text-[0.8125rem] font-semibold tabular-nums text-up">
                  {money(portfolio.growth, { signed: true })}
                </span>
                <span className="min-w-[42px] text-right text-xs tabular-nums text-mist-500">
                  {(100 - principalShare).toFixed(1)}%
                </span>
              </dd>
            </div>
          </dl>
        </div>
      )}

      <dl className="mt-auto grid grid-cols-2 gap-3.5 pt-6">
        <div className="border-r border-[var(--line-soft)]">
          <dt className="text-[0.6875rem] text-mist-500">Available balance</dt>
          <dd className="mt-[5px] text-[0.9375rem] font-semibold tracking-[-0.015em] tabular-nums">
            {money(portfolio.available)}
          </dd>
        </div>
        <div>
          <dt className="text-[0.6875rem] text-mist-500">Active investments</dt>
          <dd className="mt-[5px] text-[0.9375rem] font-semibold tracking-[-0.015em] tabular-nums">
            {portfolio.active_count}
          </dd>
        </div>
      </dl>

      {portfolio.pending_out > 0 && (
        <p className="mt-3 text-[0.6875rem] text-mist-500">
          {money(portfolio.pending_out)} is held against a pending withdrawal.
        </p>
      )}
    </Card>
  );
}
