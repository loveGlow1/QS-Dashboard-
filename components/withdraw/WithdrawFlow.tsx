"use client";

import { useState } from "react";
import { BankFlow } from "@/components/withdraw/BankFlow";
import { CryptoFlow } from "@/components/withdraw/CryptoFlow";
import { MethodCards } from "@/components/withdraw/MethodCards";
import { Icon } from "@/components/ui/Icon";
import type { BankAccountView, PayoutMethod, PayoutNetwork } from "@/lib/types";

/**
 * Owns which method is selected. The page starts on the chooser rather than
 * on a bank form, so a customer is asked where the money should go before
 * being asked for any account detail.
 *
 * A zero withdrawable balance says so on the chooser instead of replacing it.
 * Hiding the methods bought no safety — the amount step already refuses
 * anything above the balance, and the server re-derives it regardless — while
 * costing the customer any way to see where their money could go, under a
 * heading that had just invited them to choose.
 */
export function WithdrawFlow({
  methods,
  networks,
  accounts,
  withdrawable,
  rate = 0,
  verified = false,
}: {
  methods: PayoutMethod[];
  networks: PayoutNetwork[];
  accounts: BankAccountView[];
  withdrawable: number;
  /** Naira per dollar; zero states the minimum in naira alone. */
  rate?: number;
  /** Set by the server from the account's own record, never from the client. */
  verified?: boolean;
}) {
  const [method, setMethod] = useState<PayoutMethod | null>(null);

  /* The gate, stated before anything is filled in. The server refuses an
     unverified request regardless — this is here so the refusal is not a
     surprise at the end of a form. */
  if (!verified) {
    return (
      <div className="grid justify-items-start gap-3 rounded-md border border-[rgba(233,184,114,0.26)] bg-[var(--warn-soft)] p-5">
        <span className="grid size-10 place-items-center rounded-md border border-[rgba(233,184,114,0.28)] bg-[rgba(233,184,114,0.1)] text-warn">
          <Icon name="alert" size={19} />
        </span>
        <p className="text-sm font-medium text-mist-50">
          Please verify your email address to submit withdrawal requests.
        </p>
        <p className="max-w-[52ch] text-[0.8125rem] leading-[1.65] text-mist-400">
          Activating the address on your account unlocks deposits, investments
          and withdrawals. The activation link is in your inbox — you can send
          it again from the panel on the left.
        </p>
      </div>
    );
  }

  if (!method) {
    return (
      <div className="grid gap-5">
        {withdrawable <= 0 && (
          <div className="grid justify-items-start gap-3 rounded-md border border-dashed border-[var(--line)] p-5">
            <span className="grid size-10 place-items-center rounded-md border border-[var(--accent-line)] bg-[var(--accent-soft)] text-accent-300">
              <Icon name="clock" size={19} />
            </span>
            <p className="text-sm font-medium text-mist-50">Nothing is withdrawable yet.</p>
            <p className="max-w-[48ch] text-[0.8125rem] leading-[1.65] text-mist-400">
              Funds become eligible according to the terms of the investment
              holding them. Your dashboard shows the maturity date for each
              active investment. You can still set up where a withdrawal would
              go.
            </p>
          </div>
        )}
        <MethodCards methods={methods} onSelect={setMethod} />
      </div>
    );
  }

  if (method.kind === "crypto") {
    return (
      <CryptoFlow
        method={method}
        networks={networks.filter((n) => n.method_id === method.id)}
        onBack={() => setMethod(null)}
      />
    );
  }

  return (
    <BankFlow
      method={method}
      withdrawable={withdrawable}
      accounts={accounts}
      rate={rate}
      onBack={() => setMethod(null)}
    />
  );
}
