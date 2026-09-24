"use client";

import { useState } from "react";
import { CopyField } from "@/components/deposit/CopyField";
import { DeclareTransfer } from "@/components/deposit/DeclareTransfer";
import { DepositMethodCards } from "@/components/deposit/MethodCards";
import { RequestAddress } from "@/components/deposit/RequestAddress";
import { Icon } from "@/components/ui/Icon";
import { money } from "@/lib/format";
import type {
  DepositDestination,
  DepositMethod,
  DepositNetwork,
} from "@/lib/types";

/**
 * Deposit, the mirror of withdraw: choose where the money is coming from,
 * then see what that method needs.
 *
 * An instruction screen is rendered only when a destination has actually been
 * provisioned for this customer. If none exists, the method says so. It never
 * shows a placeholder account number or address — a customer following one
 * would send real money somewhere nobody controls, and no amount of
 * surrounding UI polish makes that recoverable.
 */
export function DepositFlow({
  methods,
  networks,
  destinations,
}: {
  methods: DepositMethod[];
  networks: DepositNetwork[];
  destinations: DepositDestination[];
}) {
  const [method, setMethod] = useState<DepositMethod | null>(null);
  const methodNetworks = method ? networks.filter((n) => n.method_id === method.id) : [];
  const [networkId, setNetworkId] = useState<string | null>(null);

  if (!method) {
    return (
      <div className="grid gap-5">
        <DepositMethodCards methods={methods} onSelect={(m) => {
          setMethod(m);
          setNetworkId(null);
        }} />
      </div>
    );
  }

  const network = methodNetworks.find((n) => n.id === networkId) ?? null;
  const needsNetwork = method.kind === "crypto" && methodNetworks.length > 1;

  /* A destination is matched on method and, for crypto, the chosen network:
     an address issued for one chain must never be shown for another. */
  const destination =
    destinations.find(
      (d) =>
        d.method_id === method.id &&
        (method.kind === "crypto" ? d.network_id === networkId : true),
    ) ?? null;

  const confirmations = network?.required_confirmations ?? method.required_confirmations;
  const minimum = network?.minimum_amount || method.minimum_amount;

  return (
    <div className="grid gap-5">
      <button
        type="button"
        onClick={() => setMethod(null)}
        className="inline-flex items-center gap-1.5 justify-self-start text-[0.8125rem] text-mist-400 transition-colors hover:text-mist-50"
      >
        <Icon name="chevronLeft" size={16} />
        All methods
      </button>

      <header>
        <h2 className="text-lg font-semibold tracking-[-0.02em]">
          {method.kind === "crypto" ? `${method.label} deposit` : method.label}
        </h2>
        <p className="mt-1 text-[0.8125rem] leading-[1.6] text-mist-400">{method.subtitle}</p>
      </header>

      {!method.enabled && (
        <div className="grid justify-items-start gap-3 rounded-md border border-[rgba(233,184,114,0.22)] bg-[var(--warn-soft)] p-5">
          <span className="grid size-10 place-items-center rounded-md border border-[rgba(233,184,114,0.22)] text-warn">
            <Icon name="clock" size={19} />
          </span>
          <p className="text-sm font-semibold text-mist-50">
            {method.label} deposits are not available yet.
          </p>
          <p className="max-w-[54ch] text-[0.8125rem] leading-[1.65] text-[#e3c79c]">
            {method.unavailable_reason} No deposit{" "}
            {method.kind === "crypto" ? "address" : "account"} has been issued for
            your account, and we will not show one until it exists — sending
            money to an unissued {method.kind === "crypto" ? "address" : "account"}{" "}
            cannot be recovered.
          </p>
        </div>
      )}

      {/* --- Network, where the asset settles on more than one chain ----- */}
      {needsNetwork && (
        <div className="grid gap-[7px]">
          <span className="text-[0.8125rem] font-medium text-mist-200">Select network</span>
          <div className="grid gap-2">
            {methodNetworks.map((n) => (
              <label
                key={n.id}
                className={`flex items-center gap-3 rounded-md border px-3.5 py-3 transition-colors ${
                  !n.enabled
                    ? "cursor-not-allowed border-[var(--line-soft)] bg-ink-850 opacity-70"
                    : networkId === n.id
                      ? "cursor-pointer border-[var(--accent-line)] bg-[var(--accent-soft)]"
                      : "cursor-pointer border-[var(--line)] bg-ink-800 hover:border-[var(--line-strong)]"
                }`}
              >
                <input
                  type="radio"
                  name="deposit_network"
                  disabled={!n.enabled}
                  checked={networkId === n.id}
                  onChange={() => setNetworkId(n.id)}
                  className="size-4 flex-none appearance-none rounded-full border border-[var(--line-strong)] bg-ink-700 checked:border-[5px] checked:border-accent-500"
                />
                <span className="grid min-w-0 flex-1 gap-[2px]">
                  <span className="truncate text-[0.8125rem] font-medium">{n.label}</span>
                  <span className="truncate text-xs text-mist-500">{n.address_hint}</span>
                </span>
                {!n.enabled && (
                  <span className="flex-none text-[0.625rem] font-semibold uppercase tracking-[0.06em] text-warn">
                    Unavailable
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* --- Instructions, only with a real destination ------------------ */}
      {destination ? (
        <div className="grid gap-4">
          {method.kind === "bank" ? (
            <>
              <CopyField label="Bank" value={destination.bank_name} mono={false} />
              <CopyField label="Account name" value={destination.account_name} mono={false} />
              <CopyField label="Account number" value={destination.destination} />
              {/* Ours, not the bank's — the transfer screen will show the
                  account name, so this is labelled as the person responsible
                  rather than presented as something to check against. */}
              {destination.overseen_by && (
                <CopyField
                  label="Account manager"
                  value={destination.overseen_by}
                  mono={false}
                />
              )}
            </>
          ) : (
            <CopyField
              label={`${method.asset_code} deposit address`}
              value={destination.destination}
            />
          )}

          <dl className="grid gap-px overflow-hidden rounded-md bg-[var(--line-soft)]">
            {network && (
              <Row label="Network" value={network.label} />
            )}
            {minimum > 0 && (
              <Row
                label="Minimum deposit"
                value={
                  method.kind === "crypto"
                    ? `${minimum} ${method.asset_code}`
                    : money(minimum, { decimals: 2 })
                }
              />
            )}
            {confirmations > 0 && (
              <Row label="Credited after" value={`${confirmations} confirmations`} />
            )}
          </dl>

          <p className="flex items-start gap-2.5 rounded-md border border-[rgba(233,184,114,0.22)] bg-[var(--warn-soft)] px-3.5 py-3 text-[0.8125rem] leading-[1.6] text-[#e3c79c]">
            <Icon name="alert" size={16} className="mt-0.5 flex-none text-warn" />
            {method.kind === "crypto" ? (
              <span>
                Only send {method.asset_code}
                {network ? ` over ${network.label}` : ""}. Sending another asset,
                or using another network, may result in loss of funds.
              </span>
            ) : (
              <span>
                Transfer from an account in your own name, then tell us the
                amount below and attach the receipt so your deposit can be
                matched to your account.
              </span>
            )}
          </p>

          <p className="text-xs leading-[1.6] text-mist-500">
            Your balance updates once the deposit has been received and
            confirmed. Nothing you do on this screen credits your account.
          </p>

          {/* Every method is declared, because nothing here announces itself. */}
          <DeclareTransfer
            destinationId={destination.id}
            asset={method.asset_code}
            minimum={minimum}
          />
        </div>
      ) : (
        method.enabled && (
          <div className="rounded-md border border-dashed border-[var(--line)] px-4 py-5">
            {needsNetwork && !networkId ? (
              <p className="text-center text-[0.8125rem] text-mist-400">
                Choose a network to see your deposit address.
              </p>
            ) : (
              <RequestAddress
                methodId={method.id}
                networkId={networkId}
                kind={method.kind}
              />
            )}
          </div>
        )
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 bg-ink-800 px-[13px] py-3">
      <dt className="text-xs text-mist-500">{label}</dt>
      <dd className="text-right text-[0.8125rem] font-medium tabular-nums text-mist-200">
        {value}
      </dd>
    </div>
  );
}
