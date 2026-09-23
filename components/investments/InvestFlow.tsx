"use client";

import { useActionState, useState } from "react";
import { placeInvestment, type InvestState } from "@/app/investment-actions";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { money, ngnToUsd, usd } from "@/lib/format";
import type { Plan } from "@/lib/types";

const INITIAL: InvestState = { error: null };

/**
 * Choosing how much to put into a plan.
 *
 * The amount is typed in dollars, because that is what the tier is quoted in,
 * and the naira it becomes is shown underneath as it is typed — the customer
 * should see the figure that will actually leave their balance before they
 * commit to it, not discover it afterwards.
 *
 * Every limit shown here is also enforced by the database. What this does is
 * tell the customer why a number will be refused before they send it.
 */
export function InvestFlow({
  plan,
  availableNaira,
  rate,
}: {
  plan: Plan;
  availableNaira: number;
  rate: number;
}) {
  const [state, action, pending] = useActionState(placeInvestment, INITIAL);
  const [amount, setAmount] = useState("");

  const min = plan.usd_minimum ?? 0;
  const max = plan.usd_maximum;
  const availableUsd = ngnToUsd(availableNaira, rate);

  const typed = Number(amount.replace(/[$,\s]/g, ""));
  const valid = Number.isFinite(typed) && typed > 0;
  const naira = valid ? typed * rate : 0;

  const problem = !valid
    ? null
    : typed < min
      ? `The ${plan.name} plan starts at ${usd(min, { decimals: 0 })}.`
      : max !== null && typed > max
        ? `The ${plan.name} plan takes up to ${usd(max, { decimals: 0 })}.`
        : naira > availableNaira
          ? `That is more than your available balance of ${usd(availableUsd)}.`
          : null;

  const ready = valid && !problem && !pending;

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="plan_id" value={plan.id} />

      <div className="grid gap-[7px]">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <label htmlFor="invest-amount" className="text-[0.8125rem] font-medium text-mist-200">
            How much would you like to invest?
          </label>
          <span className="text-xs tabular-nums text-mist-500">
            {usd(availableUsd)} available
          </span>
        </div>

        <div className="flex items-center gap-2 rounded-md border border-[var(--line)] bg-ink-800 px-3.5 focus-within:border-[var(--accent-line)]">
          <span className="flex-none text-[1.0625rem] text-mist-500">$</span>
          <input
            id="invest-amount"
            name="amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-[52px] min-w-0 flex-1 bg-transparent text-[1.0625rem] tabular-nums outline-none placeholder:text-mist-500"
          />
          <button
            type="button"
            onClick={() =>
              setAmount(Math.min(availableUsd, max ?? availableUsd).toFixed(2))
            }
            className="flex-none rounded-full border border-[var(--line)] px-2.5 py-1 text-xs font-medium text-mist-400 transition-colors hover:text-mist-50"
          >
            Max
          </button>
        </div>

        {/* The naira is what actually leaves the balance. */}
        <p className="text-xs tabular-nums text-mist-500">
          {money(valid ? naira : 0, { decimals: 2 })} will be taken from your balance
        </p>
      </div>

      <dl className="grid gap-px overflow-hidden rounded-md bg-[var(--line-soft)]">
        <Row label="Plan" value={plan.name} />
        <Row
          label="Range"
          value={`${usd(min, { decimals: 0 })} – ${max !== null ? usd(max, { decimals: 0 }) : "No ceiling"}`}
        />
        <Row label="Term" value={plan.term_label} />
      </dl>

      {problem && (
        <p className="flex items-start gap-2 rounded-md border border-[rgba(233,184,114,0.22)] bg-[var(--warn-soft)] px-3.5 py-2.5 text-[0.8125rem] leading-[1.55] text-[#e3c79c]">
          <Icon name="alert" size={15} className="mt-0.5 flex-none text-warn" />
          {problem}
        </p>
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

      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="primary" disabled={!ready}>
          {pending ? "Placing…" : "Place investment"}
        </Button>
        <ButtonLink href="/investments" variant="ghost">
          Choose another plan
        </ButtonLink>
      </div>

      <p className="text-xs leading-[1.6] text-mist-500">
        Your investment starts at what you put in. Growth is recorded as it is
        actually earned — nothing is credited at the moment you invest.
      </p>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 bg-ink-800 px-[13px] py-3">
      <dt className="text-xs text-mist-500">{label}</dt>
      <dd className="text-right text-[0.8125rem] font-medium text-mist-200">{value}</dd>
    </div>
  );
}
