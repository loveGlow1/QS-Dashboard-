"use client";

import { useActionState, useMemo, useState } from "react";
import { requestWithdrawal, type ActionState } from "@/app/withdraw-actions";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { money } from "@/lib/format";
import { maskAccount, type BankAccount, type WithdrawalSettings } from "@/lib/types";

const INITIAL: ActionState = { error: null };

/**
 * The withdrawal form.
 *
 * Validation here exists so the customer sees a problem before submitting.
 * It is not what protects the balance: the database function re-checks the
 * amount, the destination's ownership and verification, the minimum and the
 * fee, and it is the only thing that writes a row.
 *
 * The fee breakdown mirrors the terms the server returned for display. The
 * amounts the request is actually recorded with are the server's own.
 */
export function WithdrawForm({
  withdrawable,
  accounts,
  settings,
}: {
  withdrawable: number;
  accounts: BankAccount[];
  settings: WithdrawalSettings;
}) {
  const verified = accounts.filter((a) => a.verified);
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState(verified[0]?.id ?? "");
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(requestWithdrawal, INITIAL);

  const parsed = Number(amount.replace(/,/g, ""));
  const valid = Number.isFinite(parsed) && parsed > 0;

  const quote = useMemo(() => {
    if (!valid) return null;
    const raw = (parsed * settings.fee_percent) / 100 + settings.fee_flat;
    const fee = Math.min(Math.round(raw * 100) / 100, settings.fee_cap ?? Infinity);
    return { gross: parsed, fee, net: parsed - fee };
  }, [parsed, valid, settings]);

  const problem = !valid
    ? null
    : parsed < settings.minimum_amount
      ? `The smallest withdrawal is ${money(settings.minimum_amount, { decimals: 2 })}.`
      : parsed > withdrawable
        ? `That is more than your withdrawable balance of ${money(withdrawable, { decimals: 2 })}.`
        : quote && quote.net <= 0
          ? "That amount is too small once the fee is applied."
          : null;

  const ready = valid && !problem && accountId !== "";

  if (state.success) {
    return <Receipt reference={state.reference ?? null} message={state.success} />;
  }

  return (
    <form action={formAction} className="grid gap-5">
      <input type="hidden" name="bank_account_id" value={accountId} />

      {state.error && (
        <p
          role="alert"
          className="flex items-start gap-2.5 rounded-md border border-[rgba(240,104,123,0.26)] bg-[var(--down-soft)] px-3.5 py-3 text-[0.8125rem] leading-[1.5] text-[#f8b3bd]"
        >
          <Icon name="alert" size={16} className="mt-0.5 flex-none" />
          {state.error}
        </p>
      )}

      {/* --- Amount ---------------------------------------------------- */}
      <div className="grid gap-[7px]">
        <div className="flex items-baseline justify-between gap-3">
          <label className="text-[0.8125rem] font-medium text-mist-200" htmlFor="amount">
            Amount
          </label>
          <span className="text-xs text-mist-500">
            {money(withdrawable, { decimals: 2 })} withdrawable
          </span>
        </div>

        <div className="relative flex">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[0.9375rem] text-mist-400">
            &#8358;
          </span>
          <input
            id="amount"
            name="amount"
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

        {problem && <span className="text-xs text-down">{problem}</span>}
        {!problem && (
          <span className="text-xs text-mist-500">
            Minimum {money(settings.minimum_amount, { decimals: 2 })}.
          </span>
        )}
      </div>

      {/* --- Destination ------------------------------------------------ */}
      <fieldset className="grid gap-[7px]">
        <legend className="mb-[7px] text-[0.8125rem] font-medium text-mist-200">
          Pay out to
        </legend>
        <div className="grid gap-2">
          {verified.map((account) => (
            <label
              key={account.id}
              className={`flex cursor-pointer items-center gap-3 rounded-md border px-3.5 py-3 transition-colors ${
                accountId === account.id
                  ? "border-[var(--accent-line)] bg-[var(--accent-soft)]"
                  : "border-[var(--line)] bg-ink-800 hover:border-[var(--line-strong)]"
              }`}
            >
              <input
                type="radio"
                name="destination_choice"
                checked={accountId === account.id}
                onChange={() => setAccountId(account.id)}
                className="size-4 flex-none appearance-none rounded-full border border-[var(--line-strong)] bg-ink-700 checked:border-[5px] checked:border-accent-500"
              />
              <span className="grid min-w-0 gap-[2px]">
                <span className="truncate text-[0.8125rem] font-medium">
                  {account.bank_name} {maskAccount(account.account_number)}
                </span>
                <span className="truncate text-xs text-mist-500">{account.account_name}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* --- Breakdown --------------------------------------------------- */}
      <dl className="grid gap-px overflow-hidden rounded-md bg-[var(--line-soft)]">
        <Row label="Requested amount" value={quote ? money(quote.gross, { decimals: 2 }) : "—"} />
        <Row
          label="Processing fee"
          value={quote ? (quote.fee > 0 ? money(quote.fee, { decimals: 2 }) : "None") : "—"}
        />
        <Row
          label="You receive"
          value={quote ? money(quote.net, { decimals: 2 }) : "—"}
          strong
        />
        <Row label="Arrives in" value={settings.processing_time_label} />
      </dl>

      {/* --- Confirm ----------------------------------------------------- */}
      {confirming ? (
        <div className="grid gap-3 rounded-md border border-[var(--accent-line)] bg-[var(--accent-soft)] p-4">
          <p className="text-[0.8125rem] leading-[1.6] text-mist-200">
            Confirm {quote ? money(quote.net, { decimals: 2 }) : ""} to{" "}
            <span className="font-medium text-mist-50">
              {verified.find((a) => a.id === accountId)?.bank_name}{" "}
              {maskAccount(verified.find((a) => a.id === accountId)?.account_number ?? "")}
            </span>
            . Enter your password to authorise it.
          </p>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="Your password"
            required
            className="h-[46px] w-full rounded-md border border-[var(--line)] bg-ink-800 px-3.5 text-[0.9375rem] text-mist-50 placeholder:text-mist-500 focus:border-[var(--accent-line)] focus:outline-none focus:ring-[3px] focus:ring-[var(--accent-soft)]"
          />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="primary" busy={pending} disabled={!ready}>
              Confirm withdrawal
            </Button>
            <Button type="button" variant="ghost" onClick={() => setConfirming(false)}>
              Back
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="primary"
          size="lg"
          block
          disabled={!ready}
          onClick={() => setConfirming(true)}
        >
          Request Withdrawal
        </Button>
      )}
    </form>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 bg-ink-800 px-[13px] py-3">
      <dt className="text-xs text-mist-500">{label}</dt>
      <dd
        className={`tabular-nums ${strong ? "text-[0.9375rem] font-semibold text-mist-50" : "text-[0.8125rem] font-medium text-mist-200"}`}
      >
        {value}
      </dd>
    </div>
  );
}

function Receipt({ reference, message }: { reference: string | null; message: string }) {
  return (
    <div className="grid justify-items-start gap-3 rounded-md border border-[rgba(62,207,154,0.26)] bg-[var(--up-soft)] p-6">
      <span className="grid size-10 place-items-center rounded-md border border-[rgba(62,207,154,0.26)] bg-[var(--up-soft)] text-up">
        <Icon name="checkCircle" size={20} />
      </span>
      <p className="text-sm font-medium text-mist-50">{message}</p>
      {reference && (
        <p className="text-[0.8125rem] text-mist-200">
          Reference <span className="font-semibold tabular-nums">{reference}</span>
        </p>
      )}
      <p className="max-w-[48ch] text-[0.8125rem] leading-[1.65] text-mist-400">
        The amount is held against your balance while the payout is processed.
        You can follow it below and in your transactions.
      </p>
    </div>
  );
}
