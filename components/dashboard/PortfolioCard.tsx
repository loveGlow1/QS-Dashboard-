import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Sparkline } from "@/components/ui/Sparkline";
import { formatDate, money, percent } from "@/lib/format";
import type { Investment, PortfolioSummary } from "@/lib/types";

/**
 * Your Portfolio.
 *
 * Every figure here is read from the portfolio_totals view, which the
 * database derives from investment records and the completed ledger. Nothing
 * on this card is added up, adjusted or projected in the browser — including
 * the withdrawable balance, which the server decides according to the
 * investment's own terms. A number the server did not return is not shown.
 */
export function PortfolioCard({
  portfolio,
  investment,
}: {
  portfolio: PortfolioSummary;
  investment: Investment | null;
}) {
  /* An account holds a position when the server says it does. */
  const hasPosition = portfolio.active_count > 0 || portfolio.invested > 0;
  const up = portfolio.growth >= 0;

  return (
    <Card as="article" className="flex flex-col bg-[linear-gradient(170deg,rgba(16,185,129,0.1)_0%,rgba(16,185,129,0)_44%),var(--color-ink-850)]">
      <h2 className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-mist-500">
        Your Portfolio
      </h2>

      <div className="mt-3 flex items-center justify-between gap-5">
        <div className="min-w-0">
          <p className="text-[clamp(1.875rem,1.4rem+1.6vw,2.375rem)] font-semibold leading-[1.1] tracking-[-0.035em] tabular-nums max-[720px]:text-[2.125rem]">
            {money(portfolio.total_value, { decimals: 2 })}
          </p>
          <p className="mt-1.5 text-[0.8125rem] text-mist-400">Current portfolio value</p>
        </div>

        {/* The same live curve the phone shows, from the same series. It is
            the customer's own history, so it is flat while the account is —
            never the rising line a mockup would draw here. */}
        <Sparkline points={portfolio.series} width={92} height={40} className="self-center" />
      </div>

      {hasPosition ? (
        <>
          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 text-[0.8125rem] font-medium tabular-nums ${up ? "text-up" : "text-down"}`}
            >
              <Icon name={up ? "trendUp" : "trendDown"} size={13} />
              {money(portfolio.growth, { decimals: 2, signed: true })}
            </span>
            <Badge tone={up ? "up" : "down"}>{percent(portfolio.growth_percent)}</Badge>
          </div>

          <dl className="mt-auto grid grid-cols-2 gap-x-4 gap-y-5 border-t border-[var(--line-soft)] pt-6">
            <Metric label="Invested" value={money(portfolio.invested, { decimals: 2 })} />
            <Metric
              label="Growth"
              value={money(portfolio.growth, { decimals: 2, signed: true })}
              tone={up ? "up" : "down"}
            />
            <Metric label="Withdrawable" value={money(portfolio.withdrawable, { decimals: 2 })} />
            <Metric
              label="Maturity"
              value={investment ? formatDate(investment.maturity_date) : "—"}
            />
          </dl>

          {portfolio.pending_out > 0 && (
            <p className="mt-4 text-[0.6875rem] leading-[1.5] text-mist-500">
              {money(portfolio.pending_out, { decimals: 2 })} is held against a
              pending withdrawal request.
            </p>
          )}
        </>
      ) : (
        <EmptyPosition />
      )}
    </Card>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "up" | "down";
}) {
  return (
    <div>
      <dt className="text-[0.6875rem] text-mist-500">{label}</dt>
      <dd
        className={`mt-1 text-[0.9375rem] font-semibold tracking-[-0.015em] tabular-nums ${
          tone === "up" ? "text-up" : tone === "down" ? "text-down" : "text-mist-50"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

/**
 * What a new account sees. Deliberate and finished-looking: an account with
 * nothing in it is a normal state, not an error or a component that failed
 * to load.
 */
function EmptyPosition() {
  return (
    <div className="mt-auto grid justify-items-start gap-3 border-t border-[var(--line-soft)] pt-6">
      <span className="grid size-10 place-items-center rounded-md border border-[var(--accent-line)] bg-[var(--accent-soft)] text-accent-300">
        <Icon name="layers" size={19} />
      </span>
      <div>
        <p className="text-sm font-medium text-mist-50">No active investments yet.</p>
        <p className="mt-1 max-w-[34ch] text-[0.8125rem] leading-[1.6] text-mist-400">
          Start your first investment to begin tracking your portfolio here.
        </p>
      </div>
      <ButtonLink href="/investments" variant="primary" size="sm" className="mt-1">
        <Icon name="plus" size={16} />
        Start Investing
      </ButtonLink>
    </div>
  );
}
