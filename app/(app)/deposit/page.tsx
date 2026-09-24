import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DepositFlow } from "@/components/deposit/DepositFlow";
import { DepositList } from "@/components/deposit/DepositList";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import {
  getDepositDestinations,
  getDepositMethods,
  getDepositNetworks,
  getDeposits,
  getPortfolio,
  getUsdRate,
} from "@/lib/data";
import { getUser } from "@/lib/supabase/server";
import { money } from "@/lib/format";

export const metadata: Metadata = {
  title: "Deposit",
  description: "Add funds to your account.",
};

export default async function DepositPage() {
  const [methods, networks, destinations, deposits, portfolio, rate] = await Promise.all([
    getDepositMethods(),
    getDepositNetworks(),
    getDepositDestinations(),
    getDeposits(),
    getPortfolio("1M"),
    getUsdRate(),
  ]);

  /* Read here, not in the browser: it decides which storage folder a receipt
     is written to. */
  const user = await getUser();

  return (
    <>
      <PageHeader title="Deposit" subtitle="Add funds to your account." />

      <div className="grid gap-4 min-[981px]:grid-cols-[minmax(0,360px)_minmax(0,1fr)] min-[981px]:items-start">
        <Card as="article">
          <h2 className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-mist-500">
            Available balance
          </h2>
          <p className="mt-3 text-[2rem] font-semibold leading-[1.1] tracking-[-0.035em] tabular-nums">
            {money(portfolio.available, { decimals: 2 })}
          </p>
          <p className="mt-1.5 text-[0.8125rem] text-mist-400">
            Updates once a deposit is confirmed
          </p>
        </Card>

        <div className="grid gap-4">
          <Card as="article">
            <DepositFlow
              methods={methods}
              networks={networks}
              destinations={destinations}
              rate={rate}
              userId={user?.id ?? ""}
            />
          </Card>

          <Card as="article">
            <h2 className="mb-4 text-lg font-semibold tracking-[-0.02em]">Your deposits</h2>
            <DepositList deposits={deposits} rate={rate} />

            <p className="mt-4 flex items-start gap-2.5 text-xs leading-[1.6] text-mist-500">
              <Icon name="info" size={14} className="mt-0.5 flex-none" />
              A deposit is credited by the provider confirming the money
              arrived. Nothing in this app marks one complete.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
