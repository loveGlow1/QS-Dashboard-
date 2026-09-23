import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Sparkline } from "@/components/ui/Sparkline";
import { StartInvesting } from "@/components/dashboard/StartInvesting";
import { formatDate, money, ngnToUsd, percent, usd } from "@/lib/format";
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
  rate = 0,
}: {
  portfolio: PortfolioSummary;
  investment: Investment | null;
  /** Naira per dollar. Zero means none on file, and only naira is shown. */
  rate?: number;
}) {
  /* An account holds a position when the server says it does. */
  const hasPosition = portfolio.active_count > 0 || portfolio.invested > 0;
  const up = portfolio.growth >= 0;

  return (
    <Card as="article" className="flex flex-col bg-[linear-gradient(170deg,rgba(16,185,54,0.1)_0%,rgba(16,185,54,0)_44%),var(--color-ink-850)]">
      <h2 className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-mist-500">
        Your Portfolio
      </h2>

      <div className="mt-3 flex items-center justify-between gap-5">
        <div className="min-w-0">
          {rate > 0 ? (
            <>
              <p className="text-[clamp(1.875rem,1.4rem+1.6vw,2.375rem)] font-semibold leading-[1.1] tracking-[-0.035em] tabular-nums max-[720px]:text-[2.125rem]">
                {usd(ngnToUsd(portfolio.total_value, rate))}
              </p>
              {/* The naira is the amount that actually moves. */}
              <p className="mt-1 text-[0.8125rem] tabular-nums text-mist-400">
                {money(portfolio.total_value, { decimals: 2 })}
              </p>
            </>
          ) : (
            <p className="text-[clamp(1.875rem,1.4rem+1.6vw,2.375rem)] font-semibold leading-[1.1] tracking-[-0.035em] tabular-nums max-[720px]:text-[2.125rem]">
              {money(portfolio.total_value, { decimals: 2 })}
            </p>
          )}
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

          {/* Growth is stated once, in the row above with its percentage
              beside it. It used to be repeated here as a fourth figure,
              which said the same thing twice on one card. */}
          <dl className="mt-auto grid grid-cols-2 gap-x-4 gap-y-5 border-t border-[var(--line-soft)] pt-6">
            {/* One line each. The dollar-over-naira pair belongs to the
                headline above; repeating it in all four cells made the
                breakdown harder to read, not clearer. */}
            <Metric label="Invested" value={money(portfolio.invested, { decimals: 2 })} />
            <Metric label="Withdrawable" value={money(portfolio.withdrawable, { decimals: 2 })} />
            <Metric
              label="Maturity"
              value={investment ? formatDate(investment.maturity_date) : "—"}
            />
          </dl>

        </>
      ) : (
        <EmptyPosition />
      )}

      {/* What the headline contains that the four figures above do not. An
          account can hold referral bonuses without holding an investment, so
          these sit outside the position branch — otherwise the total would
          include money the card never accounts for. */}
      {(portfolio.pending_out > 0 || portfolio.referral_pending > 0) && (
        <div className="mt-4 grid gap-2 text-[0.6875rem] leading-[1.5] text-mist-500">
          {portfolio.pending_out > 0 && (
            <p>
              {money(portfolio.pending_out, { decimals: 2 })} is held against a
              pending withdrawal request.
            </p>
          )}
          {portfolio.referral_pending > 0 && (
            <p>
              Includes {money(portfolio.referral_pending, { decimals: 2 })} in
              referral bonuses still maturing. They join your withdrawable
              balance on their maturity date, not before.
            </p>
          )}
        </div>
      )}

      {/* The one action this card leads to, on the card whether or not there
          is already a position — the phone has always shown it in both
          states, and it was only ever on the desktop card while the account
          was empty, so it vanished the moment someone invested. It reads
          "Invest again" once they hold something. */}
      <StartInvesting invested={hasPosition} className="mt-4 w-full" />
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
/* The heading states the position; the card below states the action. The
   sentence that used to sit between them ("Start your first investment to
   begin tracking your portfolio here") said what the card now says, a line
   above it, and the layered icon appeared twice in the same 200 pixels. */
function EmptyPosition() {
  return (
    <div className="mt-auto border-t border-[var(--line-soft)] pt-6">
      <p className="text-sm font-medium text-mist-50">No active investments yet.</p>
    </div>
  );
}
