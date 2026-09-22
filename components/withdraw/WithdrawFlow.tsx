"use client";

import { useState } from "react";
import { BankFlow } from "@/components/withdraw/BankFlow";
import { CryptoFlow } from "@/components/withdraw/CryptoFlow";
import { MethodCards } from "@/components/withdraw/MethodCards";
import type { BankAccountView, PayoutMethod, PayoutNetwork } from "@/lib/types";

/**
 * Owns which method is selected. The page starts on the chooser rather than
 * on a bank form, so a customer is asked where the money should go before
 * being asked for any account detail.
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
        <header>
          <h2 className="text-lg font-semibold tracking-[-0.02em]">Withdraw funds</h2>
          <p className="mt-1 text-[0.8125rem] leading-[1.6] text-mist-400">
            Choose where you&apos;d like to receive your withdrawal.
          </p>
        </header>
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
