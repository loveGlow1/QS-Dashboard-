"use client";

import { Icon, type IconName } from "@/components/ui/Icon";
import type { DepositMethod } from "@/lib/types";

const ICON: Record<string, IconName> = {
  bank: "bank",
  eth: "layers",
  usdt: "globe",
};

/**
 * Where the money is coming from.
 *
 * The cards no longer wear a "coming soon" badge. Whether a method can take
 * money is a live question — it depends on whether an address or an account
 * has been provisioned for it — and a badge baked into the chooser answers it
 * a screen too early and then goes stale. Selecting a method opens on the
 * truth for that method right now.
 *
 * What a card must never lead to is a fabricated account number or address.
 * That is the flow's job, not this one's.
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

              </span>
              <span className="text-[0.8125rem] leading-[1.5] text-mist-400">
                {method.subtitle}
              </span>

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
