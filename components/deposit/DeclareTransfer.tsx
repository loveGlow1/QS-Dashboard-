"use client";

import { useActionState } from "react";
import { declareTransfer, type DepositActionState } from "@/app/deposit-actions";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

const INITIAL: DepositActionState = { error: null };

/**
 * "I've made the transfer."
 *
 * A bank transfer cannot be detected the way a card payment or a chain
 * confirmation can, so the customer tells us and somebody checks. Pressing
 * this files a claim, nothing more — the row is written pending, no balance
 * moves, and the copy says so rather than implying the money is on its way in.
 */
export function DeclareTransfer({ destinationId }: { destinationId: string }) {
  const [state, action, pending] = useActionState(declareTransfer, INITIAL);

  return (
    <form action={action} className="grid gap-3 border-t border-[var(--line-soft)] pt-4">
      <input type="hidden" name="destination_id" value={destinationId} />

      <div className="grid gap-[7px]">
        <label htmlFor="declare-amount" className="text-[0.8125rem] font-medium text-mist-200">
          Already transferred? Tell us the amount
        </label>
        <div className="flex items-center gap-2 rounded-md border border-[var(--line)] bg-ink-800 px-3.5 focus-within:border-[var(--accent-line)]">
          <span className="flex-none text-[0.9375rem] text-mist-500">₦</span>
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
          Use the reference above on the transfer so it can be matched to you.
        </p>
      </div>

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
        {pending ? "Recording…" : "I've made the transfer"}
      </Button>

      <p className="text-xs leading-[1.6] text-mist-500">
        This records that you say you sent it. Your balance changes only once
        the transfer is confirmed as received.
      </p>
    </form>
  );
}
