import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { BankAccounts } from "@/components/withdraw/BankAccounts";
import { RequestList } from "@/components/withdraw/RequestList";
import { WithdrawForm } from "@/components/withdraw/WithdrawForm";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import {
  getBankAccounts,
  getPortfolio,
  getWithdrawalSettings,
  getWithdrawals,
} from "@/lib/data";
import { money } from "@/lib/format";

export const metadata: Metadata = {
  title: "Withdraw",
  description: "Request a withdrawal of your eligible balance.",
};

export default async function WithdrawPage() {
  const [portfolio, accounts, settings, withdrawals] = await Promise.all([
    getPortfolio("1M"),
    getBankAccounts(),
    getWithdrawalSettings(),
    getWithdrawals(),
  ]);

  const verified = accounts.filter((a) => a.verified);
  /* Eligibility is the server's call. The page only asks what it decided. */
  const canWithdraw = portfolio.withdrawable > 0 && verified.length > 0 && settings !== null;

  return (
    <>
      <PageHeader
        title="Withdraw"
        subtitle="Request a withdrawal of the balance your investments have made eligible."
      />

      <div className="grid gap-4 min-[981px]:grid-cols-[minmax(0,380px)_minmax(0,1fr)] min-[981px]:items-start">
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
            <h2 className="mb-4 text-lg font-semibold tracking-[-0.02em]">
              Request a withdrawal
            </h2>

            {canWithdraw ? (
              <WithdrawForm
                withdrawable={portfolio.withdrawable}
                accounts={accounts}
                settings={settings}
              />
            ) : (
              <Blocked
                withdrawable={portfolio.withdrawable}
                hasVerifiedAccount={verified.length > 0}
              />
            )}
          </Card>

          <Card as="article">
            <h2 className="mb-1 text-lg font-semibold tracking-[-0.02em]">Bank accounts</h2>
            <p className="mb-4 text-[0.8125rem] leading-[1.6] text-mist-400">
              Where your withdrawals are paid out.
            </p>
            <BankAccounts accounts={accounts} />
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

/** Says which precondition is missing rather than a generic refusal. */
function Blocked({
  withdrawable,
  hasVerifiedAccount,
}: {
  withdrawable: number;
  hasVerifiedAccount: boolean;
}) {
  const nothingEligible = withdrawable <= 0;

  return (
    <div className="grid justify-items-start gap-3 rounded-md border border-dashed border-[var(--line)] p-6">
      <span className="grid size-10 place-items-center rounded-md border border-[var(--accent-line)] bg-[var(--accent-soft)] text-accent-300">
        <Icon name={nothingEligible ? "clock" : "bank"} size={19} />
      </span>
      {nothingEligible ? (
        <>
          <p className="text-sm font-medium text-mist-50">Nothing is withdrawable yet.</p>
          <p className="max-w-[48ch] text-[0.8125rem] leading-[1.65] text-mist-400">
            Funds become eligible according to the terms of the investment
            holding them. Your dashboard shows the maturity date for each active
            investment.
          </p>
        </>
      ) : (
        <>
          <p className="text-sm font-medium text-mist-50">
            {money(withdrawable, { decimals: 2 })} is eligible.
          </p>
          <p className="max-w-[48ch] text-[0.8125rem] leading-[1.65] text-mist-400">
            {hasVerifiedAccount
              ? "Withdrawal terms could not be loaded. Please try again shortly."
              : "Add a bank account below and have it verified before you can withdraw."}
          </p>
        </>
      )}
    </div>
  );
}
