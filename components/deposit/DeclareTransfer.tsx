"use client";

import { useActionState } from "react";
import { declareTransfer, type DepositActionState } from "@/app/deposit-actions";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

const INITIAL: DepositActionState = { error: null };

/**
 * "I've sent it."
 *
 * Nothing announces a payment here — there is no provider webhook and no chain
 * watcher — so the customer says what they sent and somebody checks the
 * account or the explorer. Pressing this files a claim, nothing more: the row
 * is written pending, no balance moves, and the copy says so rather than
 * implying the money is on its way in.
 *
 * Crypto asks for the transaction hash, because without it there is nothing to
 * look up on a shared address that many customers send to.
 */
export function DeclareTransfer({
  destinationId,
  asset,
}: {
  destinationId: string;
  /** null for naira; a ticker means the chain needs a transaction hash. */
  asset: string | null;
}) {
  const [state, action, pending] = useActionState(declareTransfer, INITIAL);

  return (
    <form action={action} className="grid gap-3 border-t border-[var(--line-soft)] pt-4">
      <input type="hidden" name="destination_id" value={destinationId} />

      <div className="grid gap-[7px]">
        <label htmlFor="declare-amount" className="text-[0.8125rem] font-medium text-mist-200">
          Already sent it? Tell us the amount
        </label>
        <div className="flex items-center gap-2 rounded-md border border-[var(--line)] bg-ink-800 px-3.5 focus-within:border-[var(--accent-line)]">
          <span className="flex-none text-[0.9375rem] text-mist-500">{asset ?? "₦"}</span>
          <input
            id="declare-amount"
            name="amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            className="h-[46px] min-w-0 flex-1 bg-transparent text-[0.9375rem] tabular-nums outline-none placeholder:text-mist-500"
          />
        </div>
        <p className="text-xs leading-[1.6] text-mist-500">
          {asset
            ? "Send only to the address above, and only on the network shown."
            : "Use the reference above on the transfer so it can be matched to you."}
        </p>
      </div>

      {asset && (
        <div className="grid gap-[7px]">
          <label htmlFor="declare-hash" className="text-[0.8125rem] font-medium text-mist-200">
            Transaction hash
          </label>
          <input
            id="declare-hash"
            name="tx_hash"
            autoComplete="off"
            spellCheck={false}
            placeholder="0x…"
            className="h-[46px] rounded-md border border-[var(--line)] bg-ink-800 px-3.5 font-mono text-[0.8125rem] outline-none focus:border-[var(--accent-line)] placeholder:text-mist-500"
          />
          <p className="text-xs leading-[1.6] text-mist-500">
            From your wallet or the explorer. It is how your payment is found
            among everything else sent to that address.
          </p>
        </div>
      )}

      {state.error && (
        <p className="flex items-start gap-2 rounded-md border border-[rgba(240,104,123,0.24)] bg-[var(--down-soft)] px-3.5 py-2.5 text-[0.8125rem] leading-[1.55] text-down">
          <Icon name="alert" size={15} className="mt-0.5 flex-none" />
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="flex items-start gap-2 rounded-md border border-[rgba(62,207,154,0.24)] bg-[var(--up-soft)] px-3.5 py-2.5 text-[0.8125rem] leading-[1.55] text-up">
          <Icon name="check" size={15} className="mt-0.5 flex-none" />
          {state.success}
        </p>
      )}

      <Button type="submit" variant="ghost" size="sm" disabled={pending} className="justify-self-start">
        {pending ? "Recording…" : "I've sent it"}
      </Button>

      <p className="text-xs leading-[1.6] text-mist-500">
        This records that you say you sent it. Your balance changes only once
        the payment is confirmed as received.
      </p>
    </form>
  );
}
