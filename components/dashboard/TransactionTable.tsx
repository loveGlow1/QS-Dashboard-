"use client";

import Link from "next/link";
import { useState } from "react";
import { TransactionDetail } from "@/components/dashboard/TransactionDetail";
import { Card } from "@/components/ui/Card";
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

const LABELS: Record<string, string> = {
  all: "All",
  deposit: "Deposits",
  withdrawal: "Withdrawals",
  investment: "Investments",
  return: "Returns",
};

export function TransactionTable({
  transactions,
  active,
  filters,
  rate = 0,
}: {
  transactions: Transaction[];
  active: string;
  filters: string[];
  /** Naira per dollar; zero shows naira alone. */
  rate?: number;
}) {
  const [open, setOpen] = useState<Transaction | null>(null);

  return (
    <>
      <nav aria-label="Filter transactions" className="mb-5 flex flex-wrap gap-2">
        {filters.map((f) => (
          <Link
            key={f}
            href={f === "all" ? "/transactions" : `/transactions?type=${f}`}
            aria-current={f === active ? "page" : undefined}
            className={`inline-flex h-[34px] items-center rounded-full border px-3.5 text-[0.8125rem] font-medium transition-colors ${
              f === active
                ? "border-[var(--accent-line)] bg-[var(--accent-soft)] text-accent-300"
                : "border-[var(--line)] bg-ink-800 text-mist-400 hover:border-[var(--line-strong)] hover:text-mist-50"
            }`}
          >
            {LABELS[f] ?? f}
          </Link>
        ))}
      </nav>

      <Card>
        {transactions.length === 0 ? (
          <div className="grid justify-items-center gap-2.5 px-5 py-12 text-center text-mist-400">
            <Icon name="inbox" size={28} className="text-mist-500" />
            <p className="text-sm font-medium text-mist-50">
              {active === "all" ? "No transactions yet." : `No ${LABELS[active]?.toLowerCase()} yet.`}
            </p>
            <p className="max-w-[320px] text-[0.8125rem] leading-[1.6]">
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
                <li key={txn.id} className="border-b border-[var(--line-soft)] last:border-b-0">
                  <button
                    type="button"
                    onClick={() => setOpen(txn)}
                    aria-label={`${txn.label}, ${txn.status}. Open details`}
                    className="-mx-2.5 flex w-[calc(100%+20px)] items-center gap-3 rounded-md px-2.5 py-3.5 text-left transition-colors hover:bg-ink-800"
                  >
                  <span
                    className={`grid size-[34px] flex-none place-items-center rounded-sm ${
                      positive ? "bg-[var(--up-soft)] text-up" : "bg-[rgba(148,168,214,0.09)] text-mist-400"
                    }`}
                  >
                    <Icon name={TXN_ICON[txn.type] ?? "list"} size={16} />
                  </span>

                  <span className="grid min-w-0 flex-1 gap-[3px]">
                    <span className="truncate text-sm font-medium">{txn.label}</span>
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
                    <Icon
                      name="chevronRight"
                      size={15}
                      className="flex-none text-mist-500"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {open && (
        <TransactionDetail txn={open} rate={rate} onClose={() => setOpen(null)} />
      )}
    </>
  );
}
