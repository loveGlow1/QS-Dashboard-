"use client";

import { useEffect, useState } from "react";
import { receiptLink } from "@/app/deposit-actions";
import { Icon } from "@/components/ui/Icon";
import { Figure } from "@/components/ui/Figure";
import { formatDate, money } from "@/lib/format";
import type { Transaction } from "@/lib/types";

const STATUS: Record<string, { label: string; dot: string; text: string }> = {
  completed: { label: "Completed", dot: "bg-up", text: "text-up" },
  pending: { label: "Pending", dot: "bg-warn", text: "text-warn" },
  failed: { label: "Failed", dot: "bg-down", text: "text-down" },
};

/**
 * One transaction, opened from the history.
 *
 * Everything here is read back from the row the database holds. The receipt
 * is the one thing that is not: the bucket is private, so a link is signed on
 * demand and expires in two minutes rather than being handed out with the
 * page and living in a browser history forever.
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
  const [receipt, setReceipt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /* Escape closes it, the way a dialog is expected to. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function openReceipt() {
    if (!txn.receipt_path) return;
    setLoading(true);
    const { url } = await receiptLink(txn.receipt_path);
    setLoading(false);
    if (url) {
      setReceipt(url);
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  const status = STATUS[txn.status] ?? { label: txn.status, dot: "bg-mist-500", text: "text-mist-400" };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Transaction detail"
      className="fixed inset-0 z-[60] grid place-items-end bg-[rgba(4,7,15,0.72)] backdrop-blur-[3px] min-[601px]:place-items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="grid max-h-[88vh] w-full max-w-[460px] gap-4 overflow-y-auto rounded-t-xl border border-[var(--line)] bg-ink-850 p-5 min-[601px]:rounded-xl"
      >
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[1.0625rem] font-semibold tracking-[-0.02em]">{txn.label}</p>
            <p className="mt-0.5 text-xs text-mist-500">{formatDate(txn.occurred_at)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 flex-none place-items-center rounded-sm text-mist-500 transition-colors hover:bg-ink-700 hover:text-mist-50"
          >
            <Icon name="close" size={16} />
          </button>
        </header>

        <p className="text-[1.75rem] font-semibold leading-[1.1] tracking-[-0.03em] tabular-nums">
          <Figure naira={Number(txn.amount)} rate={rate} signed />
        </p>

        <dl className="grid gap-px overflow-hidden rounded-md bg-[var(--line-soft)]">
          <Row label="Status">
            <span className={`inline-flex items-center gap-1.5 font-medium ${status.text}`}>
              <span className={`size-[5px] rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </Row>
          <Row label="Type">{txn.type}</Row>
          {txn.method && <Row label="Method">{txn.method}</Row>}
          {txn.reference && <Row label="Reference">{txn.reference}</Row>}
          <Row label="Amount">{money(Number(txn.amount), { decimals: 2, signed: true })}</Row>
        </dl>

        {txn.receipt_path ? (
          <button
            type="button"
            onClick={openReceipt}
            disabled={loading}
            className="flex items-center gap-3 rounded-md border border-[var(--em-line)] bg-[var(--em-soft)] px-3.5 py-3 text-left transition-colors hover:border-[var(--em-line-strong)] disabled:opacity-60"
          >
            <span className="grid size-9 flex-none place-items-center rounded-sm bg-[rgba(96,250,131,0.12)] text-em-300">
              <Icon name="file" size={17} />
            </span>
            <span className="grid min-w-0 flex-1 gap-[2px]">
              <span className="text-[0.8125rem] font-medium text-mist-50">
                {loading ? "Opening receipt…" : receipt ? "Open receipt again" : "View payment receipt"}
              </span>
              <span className="text-xs text-mist-500">
                Opens in a new tab. The link expires after two minutes.
              </span>
            </span>
            <Icon name="arrowUpRight" size={16} className="flex-none text-mist-400" />
          </button>
        ) : txn.type === "deposit" ? (
          <p className="text-xs leading-[1.6] text-mist-500">
            No receipt was attached to this deposit.
          </p>
        ) : null}

        <p className="text-xs leading-[1.6] text-mist-500">
          Every figure here is the one the database holds for this entry.
        </p>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 bg-ink-800 px-[13px] py-3">
      <dt className="text-xs text-mist-500">{label}</dt>
      <dd className="text-right text-[0.8125rem] font-medium capitalize tabular-nums text-mist-200">
        {children}
      </dd>
    </div>
  );
}
