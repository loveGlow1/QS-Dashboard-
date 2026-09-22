"use client";

import { Icon, type IconName } from "@/components/ui/Icon";
import type { DepositMethod } from "@/lib/types";

const ICON: Record<string, IconName> = {
  bank: "bank",
  card: "wallet",
  btc: "bitcoin",
  eth: "layers",
  usdt: "globe",
};

/**
 * Where the money is coming from. Every method the platform defines is
 * listed, and every one is selectable — a method that cannot receive money yet
 * opens on the reason it cannot, which is more use than a card that does
 * nothing when tapped. What it must never open on is an account number or
 * address, and that is the flow's job, not this one's.
 */
export function DepositMethodCards({
  methods,
  onSelect,
}: {
  methods: DepositMethod[];
  onSelect: (method: DepositMethod) => void;
}) {
  return (
    <div className="grid gap-3 min-[641px]:grid-cols-2">
      {methods.map((method) => {
        const disabled = !method.enabled;
        return (
          <button
            key={method.id}
            type="button"
            onClick={() => onSelect(method)}
            className={`group flex items-start gap-3.5 rounded-lg border p-4 text-left transition-[border-color,background-color,transform] hover:-translate-y-px ${
              disabled
                ? "border-[var(--line-soft)] bg-ink-850 hover:border-[rgba(233,184,114,0.3)] hover:bg-ink-800"
                : "border-[var(--line)] bg-ink-800 hover:border-[var(--accent-line)] hover:bg-ink-700"
            }`}
          >
            <span
              className={`grid size-10 flex-none place-items-center rounded-md border ${
                disabled
                  ? "border-[var(--line-soft)] bg-[rgba(148,168,214,0.06)] text-mist-500"
                  : "border-[var(--accent-line)] bg-[var(--accent-soft)] text-accent-300"
              }`}
            >
              <Icon name={ICON[method.id] ?? "wallet"} size={19} />
            </span>

            <span className="grid min-w-0 flex-1 gap-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-[0.9375rem] font-semibold text-mist-50">{method.label}</span>
                {disabled && (
                  <span className="inline-flex h-[22px] items-center rounded-full border border-[rgba(233,184,114,0.22)] bg-[var(--warn-soft)] px-2 text-[0.625rem] font-semibold uppercase tracking-[0.06em] text-warn">
                    Coming soon
                  </span>
                )}
              </span>
              <span className="text-[0.8125rem] leading-[1.5] text-mist-400">
                {method.subtitle}
              </span>
              {disabled && method.unavailable_reason && (
                <span className="text-xs text-mist-500">{method.unavailable_reason}</span>
              )}
            </span>

            <Icon
              name="chevronRight"
              size={18}
              className={`mt-2.5 flex-none text-mist-500 transition-colors ${
                disabled ? "group-hover:text-warn" : "group-hover:text-accent-400"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
