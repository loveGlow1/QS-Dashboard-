import Link from "next/link";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { Badge } from "@/components/ui/Badge";
import { Icon, type IconName } from "@/components/ui/Icon";
import { StartInvesting } from "@/components/dashboard/StartInvesting";
import { Sparkline } from "@/components/ui/Sparkline";
import {
  clamp,
  daysBetween,
  formatDate,
  maturityLabel,
  money,
  ngnToUsd,
  percent,
  usd,
} from "@/lib/format";
import type { Investment, PortfolioSummary, Transaction } from "@/lib/types";

/**
 * The dashboard, as a phone shows it.
 *
 * A separate layout rather than a pile of breakpoint overrides on the desktop
 * one: the two arrange the same figures differently enough — a 2×2 action
 * grid against a row, a stacked portfolio card against a two-column band —
 * that expressing one as exceptions to the other hides what each is doing.
 *
 * Every figure still comes from the same server-read props the desktop layout
 * receives. Nothing is recomputed here, and the chart draws the customer's own
 * series, so an account at ₦0 gets a flat line rather than the rising one a
 * mockup would put there.
 */

const ACTIONS: { href: string; icon: IconName; label: string; tone: string }[] = [
  { href: "/investments", icon: "plus", label: "Invest", tone: "em" },
  { href: "/deposit", icon: "arrowDownLeft", label: "Deposit", tone: "accent" },
  { href: "/withdraw", icon: "arrowUpRight", label: "Withdraw", tone: "violet" },
  { href: "/transactions", icon: "list", label: "Activity", tone: "mist" },
];

const TONES: Record<string, string> = {
  em: "border-[var(--em-line)] bg-[var(--em-soft)] text-em-300",
  accent: "border-[var(--accent-line)] bg-[var(--accent-soft)] text-accent-300",
  violet: "border-[rgba(167,139,250,0.28)] bg-[rgba(167,139,250,0.1)] text-[#c4b5fd]",
  mist: "border-[var(--line-strong)] bg-[rgba(148,168,214,0.08)] text-mist-300",
};

export function MobileHome({
  firstName,
  portfolio,
  investment,
  transactions,
  rate = 0,
}: {
  firstName: string;
  portfolio: PortfolioSummary;
  investment: Investment | null;
  transactions: Transaction[];
  /** Naira per dollar. Zero means none on file, and only naira is shown. */
  rate?: number;
}) {
  const invested = portfolio.invested > 0;
  const up = portfolio.growth >= 0;

  /* The same arithmetic the desktop panel does, so the phone cannot show a
     different day count for the same position. */
  const total = investment ? daysBetween(investment.start_date, investment.maturity_date) : 0;
  const elapsed = investment ? daysBetween(investment.start_date, new Date()) : 0;
  const progress = total > 0 ? clamp((elapsed / total) * 100, 0, 100) : 0;
  const remaining = Math.max(0, total - elapsed);

  return (
    <div className="grid gap-4">
      {/* --- Quick actions, 2×2 ---------------------------------------- */}
      <div className="grid grid-cols-2 gap-2.5">
        {ACTIONS.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="flex min-h-[64px] items-center gap-3 rounded-lg border border-[var(--line)] bg-[rgba(15,22,41,0.72)] px-3 py-3 backdrop-blur-[10px] transition-[border-color,background-color] active:bg-ink-700"
          >
            <span className={`grid size-9 flex-none place-items-center rounded-full border ${TONES[a.tone]}`}>
              <Icon name={a.icon} size={17} />
            </span>
            <span className="min-w-0 flex-1 truncate text-[0.9375rem] font-medium text-mist-50">
              {a.label}
            </span>
            <Icon name="chevronRight" size={16} className="flex-none text-mist-500" />
          </Link>
        ))}
      </div>

      {/* --- Portfolio -------------------------------------------------- */}
      <section className="rounded-xl border border-[var(--line)] bg-[rgba(12,18,34,0.9)] p-5">
        <h2 className="text-[0.6875rem] font-medium uppercase tracking-[0.1em] text-mist-500">
          Your portfolio
        </h2>
        {rate > 0 ? (
          <>
            <p className="mt-2.5 text-[2.25rem] font-semibold leading-[1.05] tracking-[-0.04em] tabular-nums text-mist-50">
              {usd(ngnToUsd(portfolio.total_value, rate))}
            </p>
            {/* The naira is the amount that actually moves. */}
            <p className="mt-1 text-[0.8125rem] tabular-nums text-mist-400">
              {money(portfolio.total_value, { decimals: 2 })}
            </p>
          </>
        ) : (
          <p className="mt-2.5 text-[2.25rem] font-semibold leading-[1.05] tracking-[-0.04em] tabular-nums text-mist-50">
            {money(portfolio.total_value, { decimals: 2 })}
          </p>
        )}
        <p className="mt-1 text-[0.8125rem] text-mist-400">Current portfolio value</p>

        {invested && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={up ? "text-up" : "text-down"}>
              <Icon name={up ? "trendUp" : "trendDown"} size={13} />
            </span>
            <Badge tone={up ? "up" : "down"}>{percent(portfolio.growth_percent)}</Badge>
          </div>
        )}

        {/* Same notes as the desktop card, in the same words: the total is the
            whole account, so anything inside it that is not yet spendable says
            so here rather than leaving the figure unexplained. */}
        {(portfolio.pending_out > 0 || portfolio.referral_pending > 0) && (
          <div className="mt-3 grid gap-2 text-[0.6875rem] leading-[1.5] text-mist-500">
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

        {/* The same figures the desktop card carries. Withdrawable was not
            on this screen at all, so a phone could not tell you what you
            could actually take out. */}
        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-[var(--line-soft)] pt-5">
          <Metric label="Invested" value={money(portfolio.invested, { decimals: 2 })} />
          <Metric label="Withdrawable" value={money(portfolio.withdrawable, { decimals: 2 })} />
        </dl>

        <div className="mt-5 border-t border-[var(--line-soft)] pt-5">
          {investment ? (
            <div className="grid gap-4">
              <header className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[0.9375rem] font-semibold tracking-[-0.02em] text-mist-50">
                    {investment.plan_name}
                  </p>
                  <p className="mt-0.5 text-xs text-mist-500">
                    {formatDate(investment.start_date)} start
                  </p>
                </div>
                <Badge tone="live" tier={investment.plan_tier} dot>
                  Active
                </Badge>
              </header>

              <div className="flex items-baseline justify-between gap-3">
                <span className="text-xs text-mist-500">Current value</span>
                <span className="text-sm font-semibold tabular-nums">
                  {money(investment.current_value, { decimals: 2 })}
                </span>
              </div>

              <div className="grid gap-2">
                <div className="flex justify-between gap-3 text-[0.6875rem] font-medium text-mist-200">
                  <span>{formatDate(investment.start_date)}</span>
                  <span>{formatDate(investment.maturity_date)}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full border border-[var(--line-soft)] bg-ink-700">
                  <span
                    className="block h-full rounded-full bg-gradient-to-r from-accent-600 to-accent-400"
                    style={{ width: `${progress.toFixed(1)}%` }}
                  />
                </div>
                <div className="flex justify-between gap-3 text-[0.6875rem] text-mist-500">
                  <span>Start date</span>
                  <span>{maturityLabel(remaining, investment.status)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3.5">
              <span className="grid size-11 flex-none place-items-center rounded-lg border border-[var(--em-line)] bg-[var(--em-soft)] text-em-300">
                <Icon name="layers" size={20} />
              </span>
              <div className="min-w-0">
                <p className="text-[0.9375rem] font-medium text-mist-50">
                  No active investments yet.
                </p>
                <p className="mt-1 text-[0.8125rem] leading-[1.55] text-mist-400">
                  Start your first investment to begin tracking your portfolio.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* --- The one action this screen is for -------------------------- */}
      <StartInvesting invested={invested} />

      {/* --- Growth ----------------------------------------------------- */}
      <Link
        href="/investments"
        className="flex items-center gap-4 rounded-xl border border-[var(--line)] bg-[rgba(12,18,34,0.9)] p-5"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[0.9375rem] font-semibold tracking-[-0.02em] text-mist-50">
            Portfolio Growth
          </span>
          <span className="mt-1.5 block text-[1.5rem] font-semibold leading-[1.1] tracking-[-0.03em] tabular-nums text-mist-50">
            {money(portfolio.growth, { decimals: 2, signed: portfolio.growth !== 0 })}
          </span>
          <span className="mt-1 block text-[0.8125rem] text-mist-400">
            {percent(portfolio.growth_percent)} since you started
          </span>
        </span>
        <Sparkline points={portfolio.series} />
      </Link>

      <RecentActivity transactions={transactions} rate={rate} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.6875rem] text-mist-500">{label}</dt>
      <dd className="mt-1 text-[0.9375rem] font-semibold tracking-[-0.015em] tabular-nums text-mist-50">
        {value}
      </dd>
    </div>
  );
}
