"use client";

import { useActionState, useMemo, useState } from "react";
import { requestWithdrawal, type ActionState } from "@/app/withdraw-actions";
import { BankAccounts } from "@/components/withdraw/BankAccounts";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { money, ngnToUsd, usd } from "@/lib/format";
import { maskAccount, type BankAccountView, type PayoutMethod } from "@/lib/types";

const INITIAL: ActionState = { error: null };

type Step = "destination" | "amount" | "review" | "done";

/**
 * Bank withdrawal, one decision per step.
 *
 * Nothing is submitted until the review has been seen and the password
 * confirmed. The figures shown are the terms the server returned; the request
 * is recorded with the server's own arithmetic, which it recomputes when the
 * row is written.
 */
export function BankFlow({
  method,
  withdrawable,
  accounts,
  rate = 0,
  onBack,
}: {
  method: PayoutMethod;
  withdrawable: number;
  accounts: BankAccountView[];
  /** Naira per dollar; zero states the minimum in naira alone. */
  rate?: number;
  onBack: () => void;
}) {
  /* Every saved account is a destination. Payouts are settled by hand, so
     the control is the person making the transfer with the account details
     in front of them — there is no bank verification step to wait on, and
     gating on one only ever dead-ended the flow. */
  const [step, setStep] = useState<Step>(accounts.length > 0 ? "amount" : "destination");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [state, formAction, pending] = useActionState(requestWithdrawal, INITIAL);

  const account = accounts.find((a) => a.id === accountId) ?? null;
  const parsed = Number(amount.replace(/,/g, ""));
  const valid = Number.isFinite(parsed) && parsed > 0;

  const quote = useMemo(() => {
    if (!valid) return null;
    const raw = (parsed * method.fee_percent) / 100 + method.fee_flat;
    const fee = Math.min(Math.round(raw * 100) / 100, method.fee_cap ?? Infinity);
    return { gross: parsed, fee, net: parsed - fee };
  }, [parsed, valid, method]);

  const problem = !valid
    ? null
    : parsed < method.minimum_amount
      ? `The smallest withdrawal is ${money(method.minimum_amount, { decimals: 2 })}.`
      : parsed > withdrawable
        ? `That is more than your withdrawable balance of ${money(withdrawable, { decimals: 2 })}.`
        : quote && quote.net <= 0
          ? "That amount is too small once the fee is applied."
          : null;

  const ready = valid && !problem && account !== null;

  if (state.success) {
    return <Success reference={state.reference ?? null} quote={quote} account={account} />;
  }

  return (
    <div className="grid gap-5">
      <StepBack
        label={step === "destination" || accounts.length === 0 ? "All methods" : "Back"}
        onClick={() => {
          if (step === "review") setStep("amount");
          else if (step === "amount" && accounts.length > 0) setStep("destination");
          else onBack();
        }}
      />

      {state.error && <Alert>{state.error}</Alert>}

      {/* ---------------- Destination ---------------- */}
      {step === "destination" && (
        <section className="grid gap-4">
          <header>
            <h2 className="text-lg font-semibold tracking-[-0.02em]">
              {accounts.length > 0 ? "Choose an account" : "Add a bank account"}
            </h2>
            <p className="mt-1 text-[0.8125rem] leading-[1.6] text-mist-400">
              This is where your withdrawal will be sent.
            </p>
          </header>

          {accounts.length > 0 && (
            <div className="grid gap-2">
              {accounts.map((a) => (
                <label
                  key={a.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-md border px-3.5 py-3 transition-colors ${
                    accountId === a.id
                      ? "border-[var(--accent-line)] bg-[var(--accent-soft)]"
                      : "border-[var(--line)] bg-ink-800 hover:border-[var(--line-strong)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="destination_choice"
                    checked={accountId === a.id}
                    onChange={() => setAccountId(a.id)}
                    className="size-4 flex-none appearance-none rounded-full border border-[var(--line-strong)] bg-ink-700 checked:border-[5px] checked:border-accent-500"
                  />
                  <span className="grid min-w-0 gap-[2px]">
                    <span className="truncate text-[0.8125rem] font-medium">
                      {a.bank_name} {maskAccount(a.last4)}
                    </span>
                    <span className="truncate text-xs text-mist-500">{a.account_name}</span>
                  </span>
                </label>
              ))}
              <Button
                type="button"
                variant="primary"
                className="mt-1 justify-self-start"
                disabled={!accountId}
                onClick={() => setStep("amount")}
              >
                Continue
              </Button>
            </div>
          )}

          <BankAccounts accounts={accounts} />
        </section>
      )}

      {/* ---------------- Amount ---------------- */}
      {step === "amount" && (
        <section className="grid gap-4">
          <header>
            <h2 className="text-lg font-semibold tracking-[-0.02em]">Withdrawal amount</h2>
          </header>

          {account && (
            <div className="flex items-center gap-3 rounded-md border border-[var(--line)] bg-ink-800 px-3.5 py-3">
              <span className="grid size-9 flex-none place-items-center rounded-sm bg-[rgba(148,168,214,0.09)] text-mist-400">
                <Icon name="bank" size={17} />
              </span>
              <span className="grid min-w-0 flex-1 gap-[2px]">
                <span className="truncate text-[0.8125rem] font-medium">
                  {account.bank_name} {maskAccount(account.last4)}
                </span>
                <span className="truncate text-xs text-mist-500">{account.account_name}</span>
              </span>
              <button
                type="button"
                onClick={() => setStep("destination")}
                className="flex-none text-xs font-medium text-accent-400 hover:underline"
              >
                Change
              </button>
            </div>
          )}

          <Field
            label="Withdrawal amount"
            aside={`${money(withdrawable, { decimals: 2 })} available`}
            problem={problem}
            hint={
              rate > 0
                ? `Minimum ${money(method.minimum_amount, { decimals: 2 })} (${usd(
                    ngnToUsd(method.minimum_amount, rate),
                  )}) — the same as the entry tier.`
                : `Minimum ${money(method.minimum_amount, { decimals: 2 })}.`
            }
          >
            <div className="relative flex">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[0.9375rem] text-mist-400">
                &#8358;
              </span>
              <input
                inputMode="decimal"
                autoComplete="off"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))}
                className="h-[46px] w-full rounded-md border border-[var(--line)] bg-ink-800 pl-8 pr-[72px] text-[0.9375rem] tabular-nums text-mist-50 transition-[border-color,background-color,box-shadow] placeholder:text-mist-500 hover:border-[var(--line-strong)] focus:border-[var(--accent-line)] focus:bg-ink-700 focus:outline-none focus:ring-[3px] focus:ring-[var(--accent-soft)]"
              />
              <button
                type="button"
                onClick={() => setAmount(String(withdrawable))}
                className="absolute right-[5px] top-1/2 h-9 -translate-y-1/2 rounded-sm px-3 text-xs font-semibold text-accent-400 transition-colors hover:bg-[var(--accent-soft)]"
              >
                Max
              </button>
            </div>
          </Field>

          <Breakdown
            rows={[
              ["Withdrawal amount", quote ? money(quote.gross, { decimals: 2 }) : "—"],
              [
                "Withdrawal fee",
                quote ? (quote.fee > 0 ? money(quote.fee, { decimals: 2 }) : "None") : "—",
              ],
              ["You receive", quote ? money(quote.net, { decimals: 2 }) : "—", true],
            ]}
          />

          <Button
            type="button"
            variant="primary"
            size="lg"
            block
            disabled={!ready}
            onClick={() => setStep("review")}
          >
            Continue
          </Button>
        </section>
      )}

      {/* ---------------- Review + security ---------------- */}
      {step === "review" && account && quote && (
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="amount" value={String(parsed)} />
          <input type="hidden" name="bank_account_id" value={account.id} />

          <header>
            <h2 className="text-lg font-semibold tracking-[-0.02em]">Review withdrawal</h2>
            <p className="mt-1 text-[0.8125rem] text-mist-400">
              Check the destination before confirming.
            </p>
          </header>

          <Breakdown
            rows={[
              ["Withdrawal method", method.label],
              ["Amount", money(quote.gross, { decimals: 2 })],
              ["Fee", quote.fee > 0 ? money(quote.fee, { decimals: 2 }) : "None"],
              ["You receive", money(quote.net, { decimals: 2 }), true],
              ["Estimated arrival", method.processing_time_label],
            ]}
          />

          {/* The destination gets its own block: it is the one detail that
              cannot be undone if it is wrong. */}
          <div className="rounded-md border border-[var(--accent-line)] bg-[var(--accent-soft)] p-4">
            <p className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-mist-400">
              Destination
            </p>
            <p className="mt-1.5 break-all text-[0.9375rem] font-semibold text-mist-50">
              {account.bank_name} {maskAccount(account.last4)}
            </p>
            <p className="mt-0.5 text-[0.8125rem] text-mist-300">{account.account_name}</p>
          </div>

          <Field label="Confirm with your password">
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="Your password"
              required
              className="h-[46px] w-full rounded-md border border-[var(--line)] bg-ink-800 px-3.5 text-[0.9375rem] text-mist-50 placeholder:text-mist-500 focus:border-[var(--accent-line)] focus:outline-none focus:ring-[3px] focus:ring-[var(--accent-soft)]"
            />
          </Field>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="primary" size="lg" busy={pending}>
              Confirm &amp; request
            </Button>
            <Button type="button" variant="ghost" size="lg" onClick={() => setStep("amount")}>
              Back
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Shared pieces
 * ------------------------------------------------------------------ */

function StepBack({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 justify-self-start text-[0.8125rem] text-mist-400 transition-colors hover:text-mist-50"
    >
      <Icon name="chevronLeft" size={16} />
      {label}
    </button>
  );
}

function Alert({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-2.5 rounded-md border border-[rgba(240,104,123,0.26)] bg-[var(--down-soft)] px-3.5 py-3 text-[0.8125rem] leading-[1.5] text-[#f8b3bd]"
    >
      <Icon name="alert" size={16} className="mt-0.5 flex-none" />
      {children}
    </p>
  );
}

export function Field({
  label,
  aside,
  problem,
  hint,
  children,
}: {
  label: string;
  aside?: string;
  problem?: string | null;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-[7px]">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[0.8125rem] font-medium text-mist-200">{label}</span>
        {aside && <span className="text-xs text-mist-500">{aside}</span>}
      </div>
      {children}
      {problem ? (
        <span className="text-xs text-down">{problem}</span>
      ) : (
        hint && <span className="text-xs text-mist-500">{hint}</span>
      )}
    </div>
  );
}

export function Breakdown({ rows }: { rows: [string, string, boolean?][] }) {
  return (
    <dl className="grid gap-px overflow-hidden rounded-md bg-[var(--line-soft)]">
      {rows.map(([label, value, strong]) => (
        <div
          key={label}
          className="flex items-baseline justify-between gap-3 bg-ink-800 px-[13px] py-3"
        >
          <dt className="text-xs text-mist-500">{label}</dt>
          <dd
            className={`text-right tabular-nums ${
              strong
                ? "text-[0.9375rem] font-semibold text-mist-50"
                : "text-[0.8125rem] font-medium text-mist-200"
            }`}
          >
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Success({
  reference,
  quote,
  account,
}: {
  reference: string | null;
  quote: { net: number } | null;
  account: BankAccountView | null;
}) {
  return (
    <div className="grid justify-items-start gap-3 rounded-md border border-[rgba(62,207,95,0.26)] bg-[var(--up-soft)] p-6">
      <span className="grid size-10 place-items-center rounded-md border border-[rgba(62,207,95,0.26)] text-up">
        <Icon name="checkCircle" size={20} />
      </span>
      <p className="text-[1.0625rem] font-semibold tracking-[-0.02em] text-mist-50">
        Withdrawal request successful
      </p>
      <p className="max-w-[48ch] text-[0.8125rem] leading-[1.65] text-mist-300">
        Your request has been logged and stays pending until it is confirmed
        and the transfer is made. Your balance already reflects the amount
        being held for it.
      </p>

      <dl className="mt-1 grid w-full max-w-[420px] gap-2">
        {quote && (
          <div className="flex justify-between gap-3 text-[0.8125rem]">
            <dt className="text-mist-400">Amount</dt>
            <dd className="font-semibold tabular-nums text-mist-50">
              {money(quote.net, { decimals: 2 })}
            </dd>
          </div>
        )}
        {account && (
          <div className="flex justify-between gap-3 text-[0.8125rem]">
            <dt className="text-mist-400">Destination</dt>
            <dd className="font-medium text-mist-50">
              {account.bank_name} {maskAccount(account.last4)}
            </dd>
          </div>
        )}
        <div className="flex justify-between gap-3 text-[0.8125rem]">
          <dt className="text-mist-400">Status</dt>
          <dd className="font-medium text-warn">Pending</dd>
        </div>
        {reference && (
          <div className="flex justify-between gap-3 text-[0.8125rem]">
            <dt className="text-mist-400">Reference</dt>
            <dd className="font-semibold tabular-nums text-mist-50">{reference}</dd>
          </div>
        )}
      </dl>

      {/* Acknowledging it goes back to the dashboard rather than leaving the
          customer on a confirmation with nowhere to go. */}
      <ButtonLink href="/dashboard" variant="primary" size="sm" className="mt-2">
        OK
      </ButtonLink>
    </div>
  );
}
