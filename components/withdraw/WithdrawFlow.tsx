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
}: {
  methods: PayoutMethod[];
  networks: PayoutNetwork[];
  accounts: BankAccountView[];
  withdrawable: number;
}) {
  const [method, setMethod] = useState<PayoutMethod | null>(null);

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
      onBack={() => setMethod(null)}
    />
  );
}
