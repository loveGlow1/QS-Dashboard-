import { ButtonLink } from "@/components/ui/Button";
import { Card, CardHead } from "@/components/ui/Card";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Figure } from "@/components/ui/Figure";
import { formatDate } from "@/lib/format";
import type { Transaction, TransactionType } from "@/lib/types";

const TXN_ICON: Record<TransactionType, IconName> = {
  deposit: "arrowDownLeft",
  withdrawal: "arrowUpRight",
  investment: "layers",
  return: "trendUp",
};

const STATUS_LABEL: Record<string, string> = {
  completed: "Completed",
  pending: "Pending",
  failed: "Failed",
};

export function RecentActivity({
  transactions,
  rate = 0,
}: {
  transactions: Transaction[];
  rate?: number;
}) {
  return (
    <Card as="article" id="activity">
      <CardHead className="mb-2">
        <h2 className="text-lg font-semibold tracking-[-0.02em]">Recent Activity</h2>
        <ButtonLink href="/transactions" variant="ghost" size="sm">
          View all transactions
        </ButtonLink>
      </CardHead>

      {transactions.length === 0 ? (
        <div className="grid justify-items-center gap-2.5 px-5 py-[38px] text-center text-mist-400">
          <Icon name="inbox" size={28} className="text-mist-500" />
          <p className="text-sm font-medium text-mist-50">No transactions yet.</p>
          <p className="max-w-[300px] text-[0.8125rem] leading-[1.6]">
            Your deposits, investments, returns and withdrawals appear here as
            they are recorded.
          </p>
        </div>
      ) : (
        <ul className="grid">
          {transactions.map((txn) => {
            const amount = Number(txn.amount);
            const positive = amount >= 0;
            return (
              <li
                key={txn.id}
                className="-mx-2.5 flex items-center gap-3 rounded-md border-b border-[var(--line-soft)] px-2.5 py-3 transition-colors last:border-b-0 hover:bg-ink-800 max-[720px]:-mx-2 max-[720px]:gap-[11px] max-[720px]:px-2"
              >
                <span
                  className={`grid size-[34px] flex-none place-items-center rounded-sm max-[720px]:size-8 ${
                    positive ? "bg-[var(--up-soft)] text-up" : "bg-[rgba(148,168,214,0.09)] text-mist-400"
                  }`}
                >
                  <Icon name={TXN_ICON[txn.type] ?? "list"} size={16} />
                </span>

                <span className="grid min-w-0 flex-1 gap-[3px]">
                  <span className="truncate text-sm font-medium max-[720px]:text-[0.8125rem]">{txn.label}</span>
                  <span className="flex items-center gap-[7px] text-xs text-mist-500 max-[400px]:flex-wrap max-[400px]:gap-x-1.5 max-[400px]:gap-y-0">
                    {formatDate(txn.occurred_at)}
                    {txn.method && (
                      <>
                        <span className="opacity-60">·</span>
                        {txn.method}
                      </>
                    )}
                  </span>
                </span>

                <span className="grid flex-none justify-items-end gap-1">
                  <span
                    className={`text-sm font-semibold tracking-[-0.015em] tabular-nums ${
                      positive ? "text-up" : "text-mist-200"
                    }`}
                  >
                    <Figure naira={amount} rate={rate} signed />
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[0.6875rem] text-mist-500">
                    <span
                      className={`size-[5px] rounded-full ${
                        txn.status === "completed"
                          ? "bg-up"
                          : txn.status === "pending"
                            ? "bg-warn"
                            : "bg-down"
                      }`}
                    />
                    {STATUS_LABEL[txn.status] ?? txn.status}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
