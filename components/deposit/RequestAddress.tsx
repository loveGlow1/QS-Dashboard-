"use client";

import { useActionState } from "react";
import { requestDepositAddress, type DepositActionState } from "@/app/deposit-actions";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

const INITIAL: DepositActionState = { error: null };

/**
 * Asks the pool for an address.
 *
 * Deliberately a button rather than something that happens on page load:
 * addresses are a finite pool, and a customer who opens the page to look
 * around should not be holding one that nobody sends to.
 */
export function RequestAddress({
  methodId,
  networkId,
  kind,
}: {
  methodId: string;
  networkId: string | null;
  kind: string;
}) {
  const [state, action, pending] = useActionState(requestDepositAddress, INITIAL);
  const noun = kind === "crypto" ? "address" : "account";

  return (
    <form action={action} className="grid justify-items-start gap-3">
      <input type="hidden" name="method_id" value={methodId} />
      <input type="hidden" name="network_id" value={networkId ?? ""} />

      <p className="max-w-[46ch] text-[0.8125rem] leading-[1.65] text-mist-400">
        You have not been issued a deposit {noun} for this method yet.
      </p>

      {state.error && (
        <p className="flex items-start gap-2 rounded-md border border-[rgba(240,104,123,0.24)] bg-[var(--down-soft)] px-3.5 py-2.5 text-[0.8125rem] leading-[1.55] text-down">
          <Icon name="alert" size={15} className="mt-0.5 flex-none" />
          {state.error}
        </p>
      )}

      <Button type="submit" variant="primary" size="sm" disabled={pending}>
        {pending ? "Getting your address…" : `Get my deposit ${noun}`}
      </Button>
    </form>
  );
}
