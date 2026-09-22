"use client";

import { Icon, type IconName } from "@/components/ui/Icon";
import type { PayoutMethod } from "@/lib/types";

const ICON: Record<string, IconName> = {
  bank: "bank",
  btc: "bitcoin",
  eth: "layers",
  usdt: "wallet",
};

/**
 * The first thing the withdraw page asks: where should the money go.
 *
 * Every method the platform defines is listed. One that cannot pay out yet
 * stays visible with its reason and is not selectable, which is honest about
 * what is coming without letting anyone start a flow that would fail at the
 * end.
 */
export function MethodCards({
  methods,
  onSelect,
}: {
  methods: PayoutMethod[];
  onSelect: (method: PayoutMethod) => void;
}) {
  return (
    <div className="grid gap-3 min-[641px]:grid-cols-2">
      {methods.map((method) => {
        const disabled = !method.enabled;
        return (
          <button
            key={method.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(method)}
            aria-describedby={disabled ? `${method.id}-why` : undefined}
            className={`group flex items-start gap-3.5 rounded-lg border p-4 text-left transition-[border-color,background-color,transform] ${
              disabled
                ? "cursor-not-allowed border-[var(--line-soft)] bg-ink-850 opacity-65"
                : "border-[var(--line)] bg-ink-800 hover:-translate-y-px hover:border-[var(--accent-line)] hover:bg-ink-700"
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
              {disabled && method.unavailable_reason && (
                <span id={`${method.id}-why`} className="text-xs text-mist-500">
                  {method.unavailable_reason}
                </span>
              )}
            </span>

            {!disabled && (
              <Icon
                name="chevronRight"
                size={18}
                className="mt-2.5 flex-none text-mist-500 transition-colors group-hover:text-accent-400"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
