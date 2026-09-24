"use client";

import { useEffect, useState } from "react";
import { receiptLink } from "@/app/deposit-actions";
import { Icon } from "@/components/ui/Icon";
import { formatDate, money, ngnToUsd, usd } from "@/lib/format";
import type { Deposit, DepositStatus } from "@/lib/types";

const STATUS: Record<DepositStatus, { label: string; dot: string; text: string }> = {
  pending: { label: "Pending", dot: "bg-warn", text: "text-warn" },
  waiting_for_confirmations: { label: "Confirming", dot: "bg-accent-500", text: "text-accent-300" },
  processing: { label: "Processing", dot: "bg-accent-500", text: "text-accent-300" },
  completed: { label: "Completed", dot: "bg-up", text: "text-up" },
  failed: { label: "Failed", dot: "bg-down", text: "text-down" },
  cancelled: { label: "Cancelled", dot: "bg-mist-500", text: "text-mist-400" },
};

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
          const status = STATUS[d.status];
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
  const [loading, setLoading] = useState(false);
  const [opened, setOpened] = useState(false);
  const status = STATUS[deposit.status];
  const naira = deposit.asset_code === "NGN";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function openReceipt() {
    if (!deposit.proof_of_payment_url) return;
    setLoading(true);
    const { url } = await receiptLink(deposit.proof_of_payment_url);
    setLoading(false);
    if (url) {
      setOpened(true);
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Deposit detail"
      onClick={onClose}
      className="fixed inset-0 z-[60] grid place-items-end bg-[rgba(4,7,15,0.72)] backdrop-blur-[3px] min-[601px]:place-items-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="grid max-h-[88vh] w-full max-w-[460px] gap-4 overflow-y-auto rounded-t-xl border border-[var(--line)] bg-ink-850 p-5 min-[601px]:rounded-xl"
      >
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[1.0625rem] font-semibold tracking-[-0.02em]">Deposit</p>
            <p className="mt-0.5 text-xs text-mist-500">{formatDate(deposit.created_at)}</p>
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

        <dl className="grid gap-px overflow-hidden rounded-md bg-[var(--line-soft)]">
          <Row label="Status">
            <span className={`inline-flex items-center gap-1.5 font-medium ${status.text}`}>
              <span className={`size-[5px] rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </Row>
          <Row label="Reference">{deposit.reference}</Row>
          {deposit.status === "completed" && deposit.credited_amount > 0 && (
            <Row label="Credited">{money(deposit.credited_amount, { decimals: 2 })}</Row>
          )}
          {deposit.fee_amount > 0 && (
            <Row label="Fee">{money(deposit.fee_amount, { decimals: 2 })}</Row>
          )}
          {deposit.tx_hash && <Row label="Transaction">{deposit.tx_hash}</Row>}
          {deposit.completed_at && (
            <Row label="Confirmed">{formatDate(deposit.completed_at)}</Row>
          )}
        </dl>

        {deposit.failure_reason && (
          <p className="rounded-md border border-[rgba(240,104,123,0.24)] bg-[var(--down-soft)] px-3.5 py-2.5 text-[0.8125rem] leading-[1.55] text-down">
            {deposit.failure_reason}
          </p>
        )}

        {deposit.proof_of_payment_url ? (
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
                {loading ? "Opening receipt…" : opened ? "Open receipt again" : "View payment receipt"}
              </span>
              <span className="text-xs text-mist-500">
                Opens in a new tab. The link expires after two minutes.
              </span>
            </span>
            <Icon name="arrowUpRight" size={16} className="flex-none text-mist-400" />
          </button>
        ) : (
          <p className="text-xs leading-[1.6] text-mist-500">
            No receipt was attached to this deposit.
          </p>
        )}

        <p className="text-xs leading-[1.6] text-mist-500">
          Your balance changes only when a deposit is confirmed as received.
        </p>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 bg-ink-800 px-[13px] py-3">
      <dt className="flex-none text-xs text-mist-500">{label}</dt>
      <dd className="min-w-0 break-all text-right text-[0.8125rem] font-medium tabular-nums text-mist-200">
        {children}
      </dd>
    </div>
  );
}
