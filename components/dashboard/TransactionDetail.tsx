"use client";

import { DetailRow, DetailRows, DetailSheet } from "@/components/ui/DetailSheet";
import { Figure } from "@/components/ui/Figure";
import { ReceiptButton } from "@/components/ui/ReceiptButton";
import { formatDate, money } from "@/lib/format";
import { txnStatus } from "@/lib/status";
import type { Transaction } from "@/lib/types";

const TYPE_LABEL: Record<string, string> = {
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  investment: "Investment",
  return: "Return",
  release: "Referral release",
};

/**
 * One transaction, opened from the history.
 *
 * Everything here is read back from the row the database holds.
 */
export function TransactionDetail({
  txn,
  rate = 0,
  onClose,
}: {
  txn: Transaction;
  rate?: number;
  onClose: () => void;
}) {
  const status = txnStatus(txn.status);

  return (
    <DetailSheet
      label="Transaction detail"
      title={txn.label}
      meta={formatDate(txn.occurred_at)}
      onClose={onClose}
    >
      <p
        className={`text-[1.75rem] font-semibold leading-[1.1] tracking-[-0.03em] tabular-nums ${
          txn.status === "cancelled" ? "text-mist-500 line-through decoration-[1.5px]" : ""
        }`}
      >
        <Figure naira={Number(txn.amount)} rate={rate} signed />
      </p>

      <DetailRows>
        <DetailRow label="Status">
          <span className={`inline-flex items-center gap-1.5 font-medium ${status.text}`}>
            <span className={`size-[5px] rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </DetailRow>
        <DetailRow label="Type">{TYPE_LABEL[txn.type] ?? txn.type}</DetailRow>
        {txn.method && <DetailRow label="Method">{txn.method}</DetailRow>}
        {txn.reference && <DetailRow label="Reference">{txn.reference}</DetailRow>}
        <DetailRow label="Amount">
          {money(Number(txn.amount), { decimals: 2, signed: true })}
        </DetailRow>
      </DetailRows>

      {txn.status === "cancelled" && (
        <p className="text-xs leading-[1.6] text-mist-500">
          This request was cancelled. The amount was never sent, and it went
          back into your available balance.
        </p>
      )}

      {txn.receipt_path ? (
        <ReceiptButton path={txn.receipt_path} />
      ) : txn.type === "deposit" ? (
        <p className="text-xs leading-[1.6] text-mist-500">
          No receipt was attached to this deposit.
        </p>
      ) : null}

      <p className="text-xs leading-[1.6] text-mist-500">
        Every figure here is the one the database holds for this entry.
      </p>
    </DetailSheet>
  );
}
