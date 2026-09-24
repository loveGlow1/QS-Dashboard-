"use client";

import { useActionState, useState } from "react";
import { cancelWithdrawal, type ActionState } from "@/app/withdraw-actions";
import { DetailRow, DetailRows, DetailSheet } from "@/components/ui/DetailSheet";
import { Icon } from "@/components/ui/Icon";
import { formatDate, money, ngnToUsd, usd } from "@/lib/format";
import { withdrawalStatus } from "@/lib/status";
import type { Withdrawal } from "@/lib/types";

const INITIAL: ActionState = { error: null };

/**
 * The withdrawal requests on this account, each one openable.
 *
 * The row is a summary; what a customer needs when something is queried —
 * the fee, what they actually receive, the destination, the reference and
 * when it was processed — is behind it rather than crowded onto it.
 */
export function RequestList({
  withdrawals,
  rate = 0,
}: {
  withdrawals: Withdrawal[];
  rate?: number;
}) {
  const [state, cancelAction] = useActionState(cancelWithdrawal, INITIAL);
  const [open, setOpen] = useState<Withdrawal | null>(null);

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
          const status = withdrawalStatus(w.status);
          return (
            <li key={w.id}>
              <button
                type="button"
                onClick={() => setOpen(w)}
                aria-label={`Withdrawal ${w.reference}, ${status.label}. Open details`}
                className="flex w-full items-center gap-3 bg-ink-800 px-4 py-3.5 text-left transition-colors hover:bg-ink-700"
              >
                <span className="grid min-w-0 flex-1 gap-[3px]">
                  <span className="text-[0.9375rem] font-semibold tabular-nums">
                    {money(w.net_amount, { decimals: 2 })}
                  </span>
                  <span className="truncate text-xs text-mist-500">
                    {formatDate(w.created_at)} · {w.reference}
                  </span>
                </span>
                <span
                  className={`inline-flex flex-none items-center gap-1.5 text-[0.6875rem] font-medium ${status.text}`}
                >
                  <span className={`size-[5px] rounded-full ${status.dot}`} />
                  {status.label}
                </span>
                <Icon name="chevronRight" size={15} className="flex-none text-mist-500" />
              </button>
            </li>
          );
        })}
      </ul>

      {open && (
        <Detail
          withdrawal={open}
          rate={rate}
          cancelAction={cancelAction}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}

function Detail({
  withdrawal: w,
  rate,
  cancelAction,
  onClose,
}: {
  withdrawal: Withdrawal;
  rate: number;
  cancelAction: (formData: FormData) => void;
  onClose: () => void;
}) {
  const status = withdrawalStatus(w.status);

  return (
    <DetailSheet
      label="Withdrawal detail"
      title="Withdrawal"
      meta={formatDate(w.created_at)}
      onClose={onClose}
    >
      <div>
        <p className="text-[1.75rem] font-semibold leading-[1.1] tracking-[-0.03em] tabular-nums">
          {rate > 0 ? usd(ngnToUsd(w.net_amount, rate)) : money(w.net_amount, { decimals: 2 })}
        </p>
        {rate > 0 && (
          <p className="mt-1 text-[0.8125rem] tabular-nums text-mist-400">
            {money(w.net_amount, { decimals: 2 })}
          </p>
        )}
        <p className="mt-1 text-[0.8125rem] text-mist-400">What reaches your bank</p>
      </div>

      <DetailRows>
        <DetailRow label="Status">
          <span className={`inline-flex items-center gap-1.5 font-medium ${status.text}`}>
            <span className={`size-[5px] rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </DetailRow>
        <DetailRow label="Requested">{money(w.gross_amount, { decimals: 2 })}</DetailRow>
        <DetailRow label="Fee">
          {w.fee_amount > 0 ? money(w.fee_amount, { decimals: 2 }) : "None"}
        </DetailRow>
        <DetailRow label="Reference">{w.reference}</DetailRow>
        {w.processed_at && <DetailRow label="Processed">{formatDate(w.processed_at)}</DetailRow>}
      </DetailRows>

      {w.failure_reason && (
        <p className="rounded-md border border-[rgba(240,104,123,0.24)] bg-[var(--down-soft)] px-3.5 py-2.5 text-[0.8125rem] leading-[1.55] text-down">
          {w.failure_reason}
        </p>
      )}

      {w.status === "pending" && (
        <form
          action={(formData) => {
            cancelAction(formData);
            onClose();
          }}
        >
          <input type="hidden" name="id" value={w.id} />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-sm px-1 py-1 text-[0.8125rem] font-medium text-mist-400 transition-colors hover:text-down max-[720px]:min-h-[44px] max-[720px]:w-full max-[720px]:justify-center max-[720px]:border max-[720px]:border-[var(--line)] max-[720px]:px-4"
          >
            <Icon name="close" size={14} />
            Cancel this request
          </button>
        </form>
      )}

      <p className="text-xs leading-[1.6] text-mist-500">
        A pending request holds the amount out of your balance. It is only
        paid once the transfer is confirmed as made.
      </p>
    </DetailSheet>
  );
}
