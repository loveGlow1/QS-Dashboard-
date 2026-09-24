"use client";

import { useState } from "react";
import { DetailRow, DetailRows, DetailSheet } from "@/components/ui/DetailSheet";
import { Icon } from "@/components/ui/Icon";
import { ReceiptButton } from "@/components/ui/ReceiptButton";
import { formatDate, money, ngnToUsd, usd } from "@/lib/format";
import { depositStatus } from "@/lib/status";
import type { Deposit } from "@/lib/types";

/**
 * The deposits filed on this account, each one openable.
 *
 * A claim is the one thing a customer may need to show somebody — what they
 * said they sent, when, and the receipt they attached — so the row opens
 * rather than sitting there as a printed line.
 */
export function DepositList({ deposits, rate = 0 }: { deposits: Deposit[]; rate?: number }) {
  const [open, setOpen] = useState<Deposit | null>(null);

  if (deposits.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-[var(--line)] px-4 py-6 text-center text-[0.8125rem] text-mist-400">
        No deposits yet.
      </p>
    );
  }

  return (
    <>
      <ul className="grid gap-px overflow-hidden rounded-md bg-[var(--line-soft)]">
        {deposits.map((d) => {
          const status = depositStatus(d.status);
          return (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => setOpen(d)}
                aria-label={`Deposit ${d.reference}, ${status.label}. Open details`}
                className="flex w-full items-center gap-3 bg-ink-800 px-4 py-3.5 text-left transition-colors hover:bg-ink-700"
              >
                <span className="grid min-w-0 flex-1 gap-[3px]">
                  <span className="text-[0.9375rem] font-semibold tabular-nums">
                    {d.asset_code === "NGN"
                      ? money(d.amount, { decimals: 2 })
                      : `${d.amount} ${d.asset_code}`}
                  </span>
                  <span className="truncate text-xs text-mist-500">
                    {formatDate(d.created_at)} · {d.reference}
                  </span>
                  {d.failure_reason && (
                    <span className="text-xs text-down">{d.failure_reason}</span>
                  )}
                </span>

                <span className="grid flex-none justify-items-end gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1.5 text-[0.6875rem] font-medium ${status.text}`}
                  >
                    <span className={`size-[5px] rounded-full ${status.dot}`} />
                    {status.label}
                  </span>
                  {d.proof_of_payment_url && (
                    <span className="inline-flex items-center gap-1 text-[0.6875rem] text-mist-500">
                      <Icon name="file" size={11} />
                      Receipt
                    </span>
                  )}
                </span>

                <Icon name="chevronRight" size={15} className="flex-none text-mist-500" />
              </button>
            </li>
          );
        })}
      </ul>

      {open && <Detail deposit={open} rate={rate} onClose={() => setOpen(null)} />}
    </>
  );
}

function Detail({
  deposit,
  rate,
  onClose,
}: {
  deposit: Deposit;
  rate: number;
  onClose: () => void;
}) {
  const status = depositStatus(deposit.status);
  const naira = deposit.asset_code === "NGN";

  return (
    <DetailSheet
      label="Deposit detail"
      title="Deposit"
      meta={formatDate(deposit.created_at)}
      onClose={onClose}
    >
      <div>
        <p className="text-[1.75rem] font-semibold leading-[1.1] tracking-[-0.03em] tabular-nums">
          {naira && rate > 0
            ? usd(ngnToUsd(deposit.amount, rate))
            : naira
              ? money(deposit.amount, { decimals: 2 })
              : `${deposit.amount} ${deposit.asset_code}`}
        </p>
        {naira && rate > 0 && (
          <p className="mt-1 text-[0.8125rem] tabular-nums text-mist-400">
            {money(deposit.amount, { decimals: 2 })}
          </p>
        )}
      </div>

      <DetailRows>
        <DetailRow label="Status">
          <span className={`inline-flex items-center gap-1.5 font-medium ${status.text}`}>
            <span className={`size-[5px] rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </DetailRow>
        <DetailRow label="Reference">{deposit.reference}</DetailRow>
        {deposit.status === "completed" && deposit.credited_amount > 0 && (
          <DetailRow label="Credited">
            {money(deposit.credited_amount, { decimals: 2 })}
          </DetailRow>
        )}
        {deposit.fee_amount > 0 && (
          <DetailRow label="Fee">{money(deposit.fee_amount, { decimals: 2 })}</DetailRow>
        )}
        {deposit.tx_hash && <DetailRow label="Transaction">{deposit.tx_hash}</DetailRow>}
        {deposit.completed_at && (
          <DetailRow label="Confirmed">{formatDate(deposit.completed_at)}</DetailRow>
        )}
      </DetailRows>

      {deposit.failure_reason && (
        <p className="rounded-md border border-[rgba(240,104,123,0.24)] bg-[var(--down-soft)] px-3.5 py-2.5 text-[0.8125rem] leading-[1.55] text-down">
          {deposit.failure_reason}
        </p>
      )}

      {deposit.proof_of_payment_url ? (
        <ReceiptButton path={deposit.proof_of_payment_url} />
      ) : (
        <p className="text-xs leading-[1.6] text-mist-500">
          No receipt was attached to this deposit.
        </p>
      )}

      <p className="text-xs leading-[1.6] text-mist-500">
        Your balance changes only when a deposit is confirmed as received.
      </p>
    </DetailSheet>
  );
}
