import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { getPortfolio, getTransactions } from "@/lib/data";
import { formatDate, money } from "@/lib/format";

export const metadata: Metadata = {
  title: "Withdraw",
  description: "Request a withdrawal of your eligible balance.",
};

export default async function WithdrawPage() {
  const [portfolio, pending] = await Promise.all([
    getPortfolio("1M"),
    getTransactions({ type: "withdrawal" }),
  ]);

  const pendingRequests = pending.filter((t) => t.status === "pending");

  return (
    <>
      <PageHeader
        title="Withdraw"
        subtitle="Request a withdrawal of the balance your investments have made eligible."
      />

      <div className="grid gap-4 min-[981px]:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <Card as="article">
          <h2 className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-mist-500">
            Withdrawable balance
          </h2>
          <p className="mt-3 text-[2rem] font-semibold leading-[1.1] tracking-[-0.035em] tabular-nums">
            {money(portfolio.withdrawable, { decimals: 2 })}
          </p>
          <p className="mt-1.5 text-[0.8125rem] text-mist-400">
            Determined by your investments&apos; terms
          </p>

          <dl className="mt-6 grid gap-3 border-t border-[var(--line-soft)] pt-5">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-[0.8125rem] text-mist-400">Available balance</dt>
              <dd className="text-[0.8125rem] font-semibold tabular-nums">
                {money(portfolio.available, { decimals: 2 })}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-[0.8125rem] text-mist-400">Held for pending requests</dt>
              <dd className="text-[0.8125rem] font-semibold tabular-nums">
                {money(portfolio.pending_out, { decimals: 2 })}
              </dd>
            </div>
          </dl>
        </Card>

        <Card as="article">
          <h2 className="mb-4 text-lg font-semibold tracking-[-0.02em]">Request a withdrawal</h2>

          {portfolio.withdrawable <= 0 ? (
            <div className="grid justify-items-start gap-3 rounded-md border border-dashed border-[var(--line)] p-6">
              <span className="grid size-10 place-items-center rounded-md border border-[var(--accent-line)] bg-[var(--accent-soft)] text-accent-300">
                <Icon name="clock" size={19} />
              </span>
              <p className="text-sm font-medium text-mist-50">Nothing is withdrawable yet.</p>
              <p className="max-w-[46ch] text-[0.8125rem] leading-[1.65] text-mist-400">
                Funds become eligible according to the terms of the investment
                they are held in. Your dashboard shows the maturity date for
                each active investment.
              </p>
            </div>
          ) : (
            <div className="grid justify-items-start gap-3 rounded-md border border-dashed border-[var(--line)] p-6">
              <span className="grid size-10 place-items-center rounded-md border border-[var(--accent-line)] bg-[var(--accent-soft)] text-accent-300">
                <Icon name="bank" size={19} />
              </span>
              <p className="text-sm font-medium text-mist-50">
                {money(portfolio.withdrawable, { decimals: 2 })} is eligible.
              </p>
              <p className="max-w-[46ch] text-[0.8125rem] leading-[1.65] text-mist-400">
                Withdrawal requests are being connected to payout processing.
                Until that is live, requests cannot be submitted here.
              </p>
            </div>
          )}

          {pendingRequests.length > 0 && (
            <section className="mt-6">
              <h3 className="mb-3 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-mist-500">
                Pending requests
              </h3>
              <ul className="grid gap-px overflow-hidden rounded-md bg-[var(--line-soft)]">
                {pendingRequests.map((req) => (
                  <li
                    key={req.id}
                    className="flex items-center justify-between gap-3 bg-ink-800 px-[13px] py-3"
                  >
                    <span className="grid gap-[3px]">
                      <span className="text-[0.8125rem] font-medium">{req.label}</span>
                      <span className="text-xs text-mist-500">{formatDate(req.occurred_at)}</span>
                    </span>
                    <span className="text-[0.8125rem] font-semibold tabular-nums">
                      {money(Math.abs(Number(req.amount)), { decimals: 2 })}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </Card>
      </div>
    </>
  );
}
