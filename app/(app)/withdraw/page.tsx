import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { RequestList } from "@/components/withdraw/RequestList";
import { WithdrawFlow } from "@/components/withdraw/WithdrawFlow";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import {
  getBankAccounts,
  getPayoutMethods,
  getPayoutNetworks,
  getPortfolio,
  getWithdrawals,
} from "@/lib/data";
import { money } from "@/lib/format";
import { toBankAccountView } from "@/lib/types";

export const metadata: Metadata = {
  title: "Withdraw",
  description: "Choose where you would like to receive your withdrawal.",
};

export default async function WithdrawPage() {
  const [portfolio, accounts, methods, networks, withdrawals] = await Promise.all([
    getPortfolio("1M"),
    getBankAccounts(),
    getPayoutMethods(),
    getPayoutNetworks(),
    getWithdrawals(),
  ]);

  const nothingEligible = portfolio.withdrawable <= 0;

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
                {money(Math.abs(portfolio.pending_out), { decimals: 2 })}
              </dd>
            </div>
          </dl>
        </Card>

        <div className="grid gap-4">
          <Card as="article">
            {nothingEligible ? (
              <div className="grid justify-items-start gap-3 rounded-md border border-dashed border-[var(--line)] p-6">
                <span className="grid size-10 place-items-center rounded-md border border-[var(--accent-line)] bg-[var(--accent-soft)] text-accent-300">
                  <Icon name="clock" size={19} />
                </span>
                <p className="text-sm font-medium text-mist-50">Nothing is withdrawable yet.</p>
                <p className="max-w-[48ch] text-[0.8125rem] leading-[1.65] text-mist-400">
                  Funds become eligible according to the terms of the investment
                  holding them. Your dashboard shows the maturity date for each
                  active investment.
                </p>
              </div>
            ) : (
              <WithdrawFlow
                methods={methods}
                networks={networks}
                /* Narrowed here: full account numbers stay on the server. */
                accounts={accounts.map(toBankAccountView)}
                withdrawable={portfolio.withdrawable}
              />
            )}
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
