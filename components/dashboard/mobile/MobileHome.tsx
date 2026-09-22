import Link from "next/link";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Sparkline } from "@/components/ui/Sparkline";
import { formatDate, money } from "@/lib/format";
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
}: {
  firstName: string;
  portfolio: PortfolioSummary;
  investment: Investment | null;
  transactions: Transaction[];
}) {
  const invested = portfolio.invested > 0;

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
        <p className="mt-2.5 text-[2.25rem] font-semibold leading-[1.05] tracking-[-0.04em] tabular-nums text-mist-50">
          {money(portfolio.investment_value, { decimals: 2 })}
        </p>
        <p className="mt-1 text-[0.8125rem] text-mist-400">Current portfolio value</p>

        <div className="mt-5 border-t border-[var(--line-soft)] pt-5">
          {investment ? (
            <div className="flex items-start gap-3.5">
              <span className="grid size-11 flex-none place-items-center rounded-lg border border-[var(--em-line)] bg-[var(--em-soft)] text-em-300">
                <Icon name="layers" size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[0.9375rem] font-medium text-mist-50">
                  {money(investment.current_value, { decimals: 2 })} held
                </p>
                <p className="mt-1 text-[0.8125rem] leading-[1.55] text-mist-400">
                  {money(investment.principal, { decimals: 2 })} invested
                  {investment.maturity_date
                    ? ` · matures ${formatDate(investment.maturity_date)}`
                    : ""}
                </p>
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
      <Link
        href="/investments"
        className="relative flex items-center gap-3.5 overflow-hidden rounded-xl border border-[var(--em-line-strong)] bg-[linear-gradient(135deg,rgba(16,185,129,0.2),rgba(6,95,70,0.14)_52%,rgba(16,185,129,0.1))] px-4 py-4 shadow-[0_18px_44px_-26px_var(--em-glow),inset_0_1px_0_rgba(255,255,255,0.07)] transition-transform active:scale-[0.995]"
      >
        <span className="grid size-11 flex-none place-items-center rounded-lg border border-[var(--em-line-strong)] bg-[rgba(16,185,129,0.16)] text-em-200">
          <Icon name="layers" size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[1.0625rem] font-semibold tracking-[-0.02em] text-mist-50">
            {invested ? "Invest again" : "Start Investing"}
          </span>
          <span className="mt-0.5 block text-[0.8125rem] leading-[1.5] text-[#bfe8d6]">
            Choose a plan and put your money to work.
          </span>
        </span>
        <span className="grid size-9 flex-none place-items-center rounded-full border border-[var(--em-line-strong)] bg-[rgba(16,185,129,0.18)] text-em-200">
          <Icon name="arrowRight" size={17} />
        </span>
      </Link>

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
            Your portfolio is at {money(portfolio.investment_value, { decimals: 2 })}
          </span>
        </span>
        <Sparkline points={portfolio.series} />
      </Link>

      <RecentActivity transactions={transactions} />
    </div>
  );
}
