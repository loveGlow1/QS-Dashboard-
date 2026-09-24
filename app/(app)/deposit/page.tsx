import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DepositFlow } from "@/components/deposit/DepositFlow";
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
import { formatDate, money } from "@/lib/format";
import type { DepositStatus } from "@/lib/types";

export const metadata: Metadata = {
  title: "Deposit",
  description: "Add funds to your account.",
};

const STATUS: Record<DepositStatus, { label: string; dot: string; text: string }> = {
  pending: { label: "Pending", dot: "bg-warn", text: "text-warn" },
  waiting_for_confirmations: { label: "Confirming", dot: "bg-accent-500", text: "text-accent-300" },
  processing: { label: "Processing", dot: "bg-accent-500", text: "text-accent-300" },
  completed: { label: "Completed", dot: "bg-up", text: "text-up" },
  failed: { label: "Failed", dot: "bg-down", text: "text-down" },
  cancelled: { label: "Cancelled", dot: "bg-mist-500", text: "text-mist-400" },
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
            {deposits.length === 0 ? (
              <p className="rounded-md border border-dashed border-[var(--line)] px-4 py-6 text-center text-[0.8125rem] text-mist-400">
                No deposits yet.
              </p>
            ) : (
              <ul className="grid gap-px overflow-hidden rounded-md bg-[var(--line-soft)]">
                {deposits.map((d) => {
                  const status = STATUS[d.status];
                  return (
                    <li key={d.id} className="grid gap-2 bg-ink-800 px-4 py-3.5">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="grid gap-[3px]">
                          <span className="text-[0.9375rem] font-semibold tabular-nums">
                            {d.asset_code === "NGN"
                              ? money(d.amount, { decimals: 2 })
                              : `${d.amount} ${d.asset_code}`}
                          </span>
                          <span className="text-xs text-mist-500">
                            {formatDate(d.created_at)} · {d.reference}
                          </span>
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 text-[0.6875rem] font-medium ${status.text}`}
                        >
                          <span className={`size-[5px] rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </div>
                      {d.status === "waiting_for_confirmations" && (
                        <p className="text-xs text-mist-500">
                          {d.confirmations} confirmations so far.
                        </p>
                      )}
                      {d.failure_reason && (
                        <p className="text-xs text-down">{d.failure_reason}</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

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
