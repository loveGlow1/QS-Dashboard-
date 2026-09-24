import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { RequestList } from "@/components/withdraw/RequestList";
import { WithdrawFlow } from "@/components/withdraw/WithdrawFlow";
import { Card } from "@/components/ui/Card";
import {
  getBankAccounts,
  getPayoutMethods,
  getPayoutNetworks,
  getPortfolio,
  getWithdrawals,
  getUsdRate,
} from "@/lib/data";
import { money, ngnToUsd, usd } from "@/lib/format";
import { toBankAccountView } from "@/lib/types";

export const metadata: Metadata = {
  title: "Withdraw",
  description: "Choose where you would like to receive your withdrawal.",
};

export default async function WithdrawPage() {
  const [portfolio, accounts, methods, networks, withdrawals, rate] = await Promise.all([
    getPortfolio("1M"),
    getBankAccounts(),
    getPayoutMethods(),
    getPayoutNetworks(),
    getWithdrawals(),
    getUsdRate(),
  ]);

  return (
    <>
      <PageHeader
        title="Withdraw funds"
        subtitle="Choose where you'd like to receive your withdrawal."
      />

      <div className="grid gap-4 min-[981px]:grid-cols-[minmax(0,360px)_minmax(0,1fr)] min-[981px]:items-start">
        <Card as="article">
          <h2 className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-mist-500">
            Withdrawable balance
          </h2>
          {rate > 0 ? (
            <>
              <p className="mt-3 text-[2rem] font-semibold leading-[1.1] tracking-[-0.035em] tabular-nums">
                {usd(ngnToUsd(portfolio.withdrawable, rate))}
              </p>
              {/* Paid out in naira, so the naira is shown as well as quoted. */}
              <p className="mt-1 text-[0.8125rem] tabular-nums text-mist-400">
                {money(portfolio.withdrawable, { decimals: 2 })}
              </p>
            </>
          ) : (
            <p className="mt-3 text-[2rem] font-semibold leading-[1.1] tracking-[-0.035em] tabular-nums">
              {money(portfolio.withdrawable, { decimals: 2 })}
            </p>
          )}
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
                {money(Math.abs(portfolio.pending_out), { decimals: 2 })}
              </dd>
            </div>
          </dl>
        </Card>

        <div className="grid gap-4">
          <Card as="article">
            <WithdrawFlow
              methods={methods}
              networks={networks}
              /* Narrowed here: full account numbers stay on the server. */
              accounts={accounts.map(toBankAccountView)}
              withdrawable={portfolio.withdrawable}
              rate={rate}
            />
          </Card>

          <Card as="article">
            <h2 className="mb-4 text-lg font-semibold tracking-[-0.02em]">Your requests</h2>
            <RequestList withdrawals={withdrawals} />
          </Card>
        </div>
      </div>
    </>
  );
}
