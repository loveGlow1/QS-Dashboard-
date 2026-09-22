"use client";

import { useMemo, useState } from "react";
import { Breakdown, Field } from "@/components/withdraw/BankFlow";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { PayoutMethod, PayoutNetwork } from "@/lib/types";

/**
 * Crypto withdrawal.
 *
 * The networks offered are the ones the server says it settles on — the
 * address format alone never decides, because an address can be valid on a
 * chain the platform cannot pay out to.
 *
 * Amount, balance and fee figures come from the server. While a method is
 * disabled there is no balance in that asset to report, so the form states
 * that plainly instead of showing a number nothing backs.
 */
export function CryptoFlow({
  method,
  networks,
  onBack,
}: {
  method: PayoutMethod;
  networks: PayoutNetwork[];
  onBack: () => void;
}) {
  const available = networks.filter((n) => n.enabled);
  const [networkId, setNetworkId] = useState(available[0]?.id ?? "");
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");

  const network = available.find((n) => n.id === networkId) ?? null;
  const asset = method.asset_code ?? "";

  /* Anchored server-side; compiled here only to tell the customer early. */
  const addressValid = useMemo(() => {
    if (!network || !address) return null;
    try {
      return new RegExp(network.address_regex).test(address.trim());
    } catch {
      return null;
    }
  }, [network, address]);

  const live = method.enabled && available.length > 0;

  return (
    <div className="grid gap-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 justify-self-start text-[0.8125rem] text-mist-400 transition-colors hover:text-mist-50"
      >
        <Icon name="chevronLeft" size={16} />
        All methods
      </button>

      <header>
        <h2 className="text-lg font-semibold tracking-[-0.02em]">
          {method.label} withdrawal
        </h2>
        <p className="mt-1 text-[0.8125rem] leading-[1.6] text-mist-400">
          {method.subtitle}
        </p>
      </header>

      {!live && (
        <div className="grid justify-items-start gap-3 rounded-md border border-[rgba(233,184,114,0.22)] bg-[var(--warn-soft)] p-5">
          <span className="grid size-10 place-items-center rounded-md border border-[rgba(233,184,114,0.22)] text-warn">
            <Icon name="clock" size={19} />
          </span>
          <p className="text-sm font-semibold text-mist-50">
            {asset} withdrawals are not available yet.
          </p>
          <p className="max-w-[52ch] text-[0.8125rem] leading-[1.65] text-[#e3c79c]">
            {method.unavailable_reason ||
              "This method is not connected yet."}{" "}
            Your balance is held in naira, so there is no {asset} balance to
            show until crypto payouts and pricing are live.
          </p>
        </div>
      )}

      <fieldset disabled={!live} className="grid gap-4 disabled:opacity-60">
        {/* --- Network -------------------------------------------------- */}
        {(networks.length > 1 || method.id === "usdt") && (
          <Field
            label="Network"
            hint="The network must match the wallet you are sending to."
          >
            <div className="grid gap-2">
              {networks.map((n) => {
                const selectable = n.enabled;
                return (
                  <label
                    key={n.id}
                    className={`flex items-center gap-3 rounded-md border px-3.5 py-3 transition-colors ${
                      !selectable
                        ? "cursor-not-allowed border-[var(--line-soft)] bg-ink-850 opacity-70"
                        : networkId === n.id
                          ? "cursor-pointer border-[var(--accent-line)] bg-[var(--accent-soft)]"
                          : "cursor-pointer border-[var(--line)] bg-ink-800 hover:border-[var(--line-strong)]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="network"
                      disabled={!selectable}
                      checked={networkId === n.id}
                      onChange={() => setNetworkId(n.id)}
                      className="size-4 flex-none appearance-none rounded-full border border-[var(--line-strong)] bg-ink-700 checked:border-[5px] checked:border-accent-500"
                    />
                    <span className="grid min-w-0 flex-1 gap-[2px]">
                      <span className="truncate text-[0.8125rem] font-medium">{n.label}</span>
                      <span className="truncate text-xs text-mist-500">{n.address_hint}</span>
                    </span>
                    {!selectable && (
                      <span className="flex-none text-[0.625rem] font-semibold uppercase tracking-[0.06em] text-warn">
                        Unavailable
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </Field>
        )}

        {/* --- Destination ---------------------------------------------- */}
        <Field
          label="Destination wallet"
          problem={addressValid === false ? `That is not a valid ${network?.label ?? asset} address.` : null}
          hint={network?.address_hint}
        >
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            placeholder={`Enter ${asset} wallet address`}
            className="h-[46px] w-full rounded-md border border-[var(--line)] bg-ink-800 px-3.5 font-mono text-[0.8125rem] text-mist-50 placeholder:font-sans placeholder:text-mist-500 focus:border-[var(--accent-line)] focus:outline-none focus:ring-[3px] focus:ring-[var(--accent-soft)]"
          />
        </Field>

        {/* --- Amount --------------------------------------------------- */}
        <Field label="Amount" aside={live ? undefined : `No ${asset} balance`}>
          <div className="relative flex">
            <input
              inputMode="decimal"
              autoComplete="off"
              placeholder={`0.00 ${asset}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
              className="h-[46px] w-full rounded-md border border-[var(--line)] bg-ink-800 px-3.5 text-[0.9375rem] tabular-nums text-mist-50 placeholder:text-mist-500 focus:border-[var(--accent-line)] focus:outline-none focus:ring-[3px] focus:ring-[var(--accent-soft)]"
            />
          </div>
        </Field>

        <Breakdown
          rows={[
            ["Network", network?.label ?? "—"],
            ["Network fee", live && network ? `${network.network_fee} ${asset}` : "—"],
            ["You receive", "—", true],
          ]}
        />

        <Button type="button" variant="primary" size="lg" block disabled>
          Continue
        </Button>
      </fieldset>
    </div>
  );
}
