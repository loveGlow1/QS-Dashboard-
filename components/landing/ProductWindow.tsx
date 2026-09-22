import { Logo } from "@/components/brand/Logo";
import { Icon, type IconName } from "@/components/ui/Icon";
import { LineChart } from "@/components/ui/LineChart";
import { money } from "@/lib/format";
import { EXAMPLE, EXAMPLE_SERIES } from "@/components/landing/illustration";

/**
 * A preview of the signed-in dashboard, for the public landing page.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * THE FIGURES HERE ARE AN ILLUSTRATION, NOT DATA.
 *
 * They exist to show a visitor what the product looks like in use, the way a
 * product screenshot would. They are not a customer's account, not platform
 * aggregates, and not a projection of what anyone will earn. The window is
 * labelled as an example on its face, and nothing in this file is ever
 * rendered inside the authenticated dashboard, where every figure must come
 * from the customer's own records.
 * ──────────────────────────────────────────────────────────────────────────
 *
 * Showing live platform totals here instead was honest but useless: a new
 * platform's real aggregate is ₦0 across the board, which tells a visitor
 * nothing about the product and makes it look broken.
 */

/* Mirrors the real sidebar in components/dashboard/nav.ts, icons included.
   A visitor comparing the screenshot against the product should not find a
   rail that is missing a page or ordered differently. */
const RAIL: { icon: IconName; label: string; active?: boolean }[] = [
  { icon: "grid", label: "Dashboard", active: true },
  { icon: "chart", label: "Investments" },
  { icon: "list", label: "Transactions" },
  { icon: "arrowDownLeft", label: "Deposit" },
  { icon: "arrowUpRight", label: "Withdraw" },
];

export function ProductWindow() {
  return (
    <div className="relative mx-auto mt-[clamp(46px,6vw,76px)] w-full max-w-[1020px] overflow-hidden rounded-xl border border-[var(--line-strong)] bg-gradient-to-b from-[#0c1020] to-[#080c18] text-left shadow-[0_40px_90px_-40px_rgba(2,5,12,0.9)]">
      <div className="flex h-[42px] items-center gap-3.5 border-b border-[var(--line-soft)] bg-[rgba(148,168,214,0.03)] px-3.5">
        <span className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <i key={i} className="size-[9px] rounded-full bg-[rgba(148,168,214,0.22)]" />
          ))}
        </span>
        <span className="mx-auto max-w-[300px] flex-1 rounded-full bg-[rgba(148,168,214,0.06)] px-3 py-1 text-center text-[0.6875rem] tracking-normal text-mist-500">
          app.quickstark.tech/dashboard
        </span>
        <span className="w-[39px]" />
      </div>

      <div className="grid min-h-[300px] grid-cols-1 min-[721px]:grid-cols-[190px_1fr]">
        <aside
          aria-hidden="true"
          className="hidden border-r border-[var(--line-soft)] bg-[rgba(148,168,214,0.02)] px-3.5 py-[18px] min-[721px]:block"
        >
          <div className="mb-5 ml-2 mt-0.5">
            <Logo size="sm" href={null} id="hero" />
          </div>
          <ul className="grid gap-0.5">
            {RAIL.map((item) => (
              <li
                key={item.label}
                className={`flex items-center gap-2.5 rounded-sm px-2.5 py-[9px] text-[0.8125rem] ${
                  item.active ? "bg-[var(--accent-soft)] text-accent-300" : "text-mist-500"
                }`}
              >
                <Icon name={item.icon} size={15} />
                {item.label}
              </li>
            ))}
          </ul>
        </aside>

        <div className="grid content-start gap-4 p-[22px]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-[0.6875rem] uppercase tracking-[0.08em] text-mist-500">
                Total portfolio
                <span className="rounded-[5px] border border-[rgba(233,184,114,0.22)] bg-[var(--warn-soft)] px-[7px] py-[2px] text-[0.625rem] font-semibold normal-case tracking-[0.07em] text-warn">
                  Example
                </span>
              </p>
              <p className="mt-[5px] text-[clamp(1.5rem,1.1rem+1.4vw,2rem)] font-semibold tracking-[-0.03em] tabular-nums">
                {money(EXAMPLE.total)}
              </p>
            </div>
            <span className="inline-flex h-6 flex-none items-center gap-1.5 rounded-full border border-[rgba(62,207,154,0.2)] bg-[var(--up-soft)] px-[9px] text-[0.6875rem] font-medium text-up">
              <span className="size-1.5 rounded-full bg-current" />+{EXAMPLE.growthPercent}%
            </span>
          </div>

          <div className="h-[150px]">
            <LineChart
              points={EXAMPLE_SERIES}
              height={150}
              showAxes={false}
              interactive={false}
              ariaLabel="Example of a portfolio chart in the QuickStark dashboard"
            />
          </div>

          <div className="grid grid-cols-3 gap-2.5 border-t border-[var(--line-soft)] pt-4">
            <div>
              <p className="text-[0.6875rem] text-mist-500">Invested</p>
              <strong className="mt-[3px] block text-sm font-semibold tabular-nums">
                {money(EXAMPLE.invested)}
              </strong>
            </div>
            <div>
              <p className="text-[0.6875rem] text-mist-500">Growth</p>
              <strong className="mt-[3px] block text-sm font-semibold tabular-nums text-up">
                {money(EXAMPLE.growth, { signed: true })}
              </strong>
            </div>
            <div>
              <p className="text-[0.6875rem] text-mist-500">Active plan</p>
              <strong className="mt-[3px] block text-sm font-semibold">{EXAMPLE.plan}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
