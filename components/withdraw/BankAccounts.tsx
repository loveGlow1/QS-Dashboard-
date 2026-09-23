"use client";

import { useActionState, useState } from "react";
import { addBankAccount, removeBankAccount, type ActionState } from "@/app/withdraw-actions";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { maskAccount, type BankAccountView } from "@/lib/types";

const INITIAL: ActionState = { error: null };

/* The banks a Nigerian customer is most likely to hold an account with. The
   list is deliberately short and static: a full, live bank list belongs with
   the verification provider, which is not connected yet. */
const BANKS = [
  "Access Bank", "Citibank", "Ecobank", "Fidelity Bank", "First Bank of Nigeria",
  "First City Monument Bank", "Globus Bank", "Guaranty Trust Bank", "Heritage Bank",
  "Keystone Bank", "Kuda Bank", "Moniepoint MFB", "Opay", "Optimus Bank",
  "Palmpay", "Parallex Bank", "Polaris Bank", "PremiumTrust Bank", "Providus Bank",
  "Stanbic IBTC Bank", "Standard Chartered", "Sterling Bank", "SunTrust Bank",
  "Titan Trust Bank", "Union Bank", "United Bank for Africa", "Unity Bank",
  "Wema Bank", "Zenith Bank",
];

export function BankAccounts({ accounts }: { accounts: BankAccountView[] }) {
  const [adding, setAdding] = useState(accounts.length === 0);
  const [addState, addAction, addPending] = useActionState(addBankAccount, INITIAL);
  const [removeState, removeAction] = useActionState(removeBankAccount, INITIAL);

  return (
    <div className="grid gap-4">
      {accounts.length > 0 && (
        <ul className="grid gap-2">
          {accounts.map((account) => (
            <li
              key={account.id}
              className="flex items-center gap-3 rounded-md border border-[var(--line)] bg-ink-800 px-3.5 py-3"
            >
              <span className="grid size-9 flex-none place-items-center rounded-sm bg-[rgba(148,168,214,0.09)] text-mist-400">
                <Icon name="bank" size={17} />
              </span>
              <span className="grid min-w-0 flex-1 gap-[2px]">
                <span className="truncate text-[0.8125rem] font-medium">
                  {account.bank_name} {maskAccount(account.last4)}
                </span>
                <span className="truncate text-xs text-mist-500">{account.account_name}</span>
              </span>
              <span
                className={`inline-flex h-6 flex-none items-center gap-1.5 rounded-full border px-[9px] text-[0.6875rem] font-medium ${
                  account.verified
                    ? "border-[rgba(62,207,95,0.2)] bg-[var(--up-soft)] text-up"
                    : "border-[rgba(233,184,114,0.2)] bg-[var(--warn-soft)] text-warn"
                }`}
              >
                <span className="size-1.5 rounded-full bg-current" />
                {account.verified ? "Verified" : "Unverified"}
              </span>
              <form action={removeAction} className="flex-none">
                <input type="hidden" name="id" value={account.id} />
                <button
                  type="submit"
                  aria-label={`Remove ${account.bank_name} ${maskAccount(account.last4)}`}
                  className="grid size-8 place-items-center rounded-sm text-mist-500 transition-colors hover:bg-[var(--down-soft)] hover:text-down"
                >
                  <Icon name="close" size={15} />
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {removeState.error && <Note tone="error">{removeState.error}</Note>}

      {accounts.some((a) => !a.verified) && (
        <Note tone="warn">
          An account has to be verified against the bank before you can withdraw
          to it. Verification is not connected yet, so saved accounts stay
          unverified for now.
        </Note>
      )}

      {adding ? (
        <form action={addAction} className="grid gap-3 rounded-md border border-[var(--line)] bg-ink-800 p-4">
          {addState.error && <Note tone="error">{addState.error}</Note>}
          {addState.success && <Note tone="ok">{addState.success}</Note>}

          <div className="grid gap-[7px]">
            <label className="text-[0.8125rem] font-medium text-mist-200" htmlFor="bank_name">
              Bank
            </label>
            <select
              id="bank_name"
              name="bank_name"
              required
              defaultValue=""
              className="h-[46px] w-full rounded-md border border-[var(--line)] bg-ink-700 px-3.5 text-[0.9375rem] text-mist-50 focus:border-[var(--accent-line)] focus:outline-none focus:ring-[3px] focus:ring-[var(--accent-soft)]"
            >
              <option value="" disabled>
                Choose your bank
              </option>
              {BANKS.map((bank) => (
                <option key={bank} value={bank}>
                  {bank}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-[7px]">
            <label className="text-[0.8125rem] font-medium text-mist-200" htmlFor="account_number">
              Account number
            </label>
            <input
              id="account_number"
              name="account_number"
              inputMode="numeric"
              maxLength={10}
              placeholder="10 digits"
              required
              className="h-[46px] w-full rounded-md border border-[var(--line)] bg-ink-700 px-3.5 text-[0.9375rem] tabular-nums text-mist-50 placeholder:text-mist-500 focus:border-[var(--accent-line)] focus:outline-none focus:ring-[3px] focus:ring-[var(--accent-soft)]"
            />
          </div>

          <div className="grid gap-[7px]">
            <label className="text-[0.8125rem] font-medium text-mist-200" htmlFor="account_name">
              Account name
            </label>
            <input
              id="account_name"
              name="account_name"
              placeholder="As it appears at your bank"
              required
              className="h-[46px] w-full rounded-md border border-[var(--line)] bg-ink-700 px-3.5 text-[0.9375rem] text-mist-50 placeholder:text-mist-500 focus:border-[var(--accent-line)] focus:outline-none focus:ring-[3px] focus:ring-[var(--accent-soft)]"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="primary" busy={addPending}>
              Save account
            </Button>
            {accounts.length > 0 && (
              <Button type="button" variant="ghost" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      ) : (
        <Button type="button" variant="ghost" onClick={() => setAdding(true)}>
          <Icon name="plus" size={16} />
          Add bank account
        </Button>
      )}
    </div>
  );
}

function Note({ tone, children }: { tone: "error" | "warn" | "ok"; children: React.ReactNode }) {
  const styles = {
    error: "border-[rgba(240,104,123,0.26)] bg-[var(--down-soft)] text-[#f8b3bd]",
    warn: "border-[rgba(233,184,114,0.22)] bg-[var(--warn-soft)] text-[#edd0a4]",
    ok: "border-[rgba(62,207,95,0.26)] bg-[var(--up-soft)] text-[#9fe8b0]",
  }[tone];
  return (
    <p className={`rounded-md border px-3.5 py-3 text-[0.8125rem] leading-[1.6] ${styles}`}>
      {children}
    </p>
  );
}
