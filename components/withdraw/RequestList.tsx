"use client";

import { useActionState } from "react";
import { cancelWithdrawal, type ActionState } from "@/app/withdraw-actions";
import { Icon } from "@/components/ui/Icon";
import { formatDate, money } from "@/lib/format";
import type { Withdrawal, WithdrawalStatus } from "@/lib/types";

const INITIAL: ActionState = { error: null };

const STATUS: Record<WithdrawalStatus, { label: string; dot: string; text: string }> = {
  pending: { label: "Pending", dot: "bg-warn", text: "text-warn" },
  processing: { label: "Processing", dot: "bg-accent-500", text: "text-accent-300" },
  completed: { label: "Completed", dot: "bg-up", text: "text-up" },
  rejected: { label: "Rejected", dot: "bg-down", text: "text-down" },
  failed: { label: "Failed", dot: "bg-down", text: "text-down" },
  cancelled: { label: "Cancelled", dot: "bg-mist-500", text: "text-mist-400" },
};

export function RequestList({ withdrawals }: { withdrawals: Withdrawal[] }) {
  const [state, cancelAction] = useActionState(cancelWithdrawal, INITIAL);

  if (withdrawals.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-[var(--line)] px-4 py-6 text-center text-[0.8125rem] text-mist-400">
        No withdrawal requests yet.
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      {state.error && (
        <p className="rounded-md border border-[rgba(240,104,123,0.26)] bg-[var(--down-soft)] px-3.5 py-3 text-[0.8125rem] text-[#f8b3bd]">
          {state.error}
        </p>
      )}

      <ul className="grid gap-px overflow-hidden rounded-md bg-[var(--line-soft)]">
        {withdrawals.map((w) => {
          const status = STATUS[w.status];
          return (
            <li key={w.id} className="grid gap-2.5 bg-ink-800 px-4 py-3.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="grid gap-[3px]">
                  <span className="text-[0.9375rem] font-semibold tabular-nums">
                    {money(w.net_amount, { decimals: 2 })}
                  </span>
                  <span className="text-xs text-mist-500">
                    {formatDate(w.created_at)} · {w.reference}
                  </span>
                </span>
                <span className={`inline-flex items-center gap-1.5 text-[0.6875rem] font-medium ${status.text}`}>
                  <span className={`size-[5px] rounded-full ${status.dot}`} />
                  {status.label}
                </span>
              </div>

              {w.fee_amount > 0 && (
                <p className="text-xs text-mist-500">
                  {money(w.gross_amount, { decimals: 2 })} requested ·{" "}
                  {money(w.fee_amount, { decimals: 2 })} fee
                </p>
              )}

              {w.failure_reason && (
                <p className="text-xs text-down">{w.failure_reason}</p>
              )}

              {w.status === "pending" && (
                <form action={cancelAction}>
                  <input type="hidden" name="id" value={w.id} />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-mist-400 transition-colors hover:text-down"
                  >
                    <Icon name="close" size={13} />
                    Cancel request
                  </button>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
