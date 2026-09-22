"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

/**
 * A value a customer has to copy exactly — an account number, a reference, a
 * wallet address. Shown in full and monospaced, because a transposed
 * character here sends money to the wrong place.
 */
export function CopyField({
  label,
  value,
  mono = true,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* Clipboard refused — the value stays selectable on screen. */
    }
  }

  return (
    <div className="grid gap-[7px]">
      <span className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-mist-500">
        {label}
      </span>
      <div className="flex items-center gap-2 rounded-md border border-[var(--line)] bg-ink-800 px-3.5 py-3">
        <span
          className={`min-w-0 flex-1 break-all text-[0.875rem] text-mist-50 ${mono ? "font-mono" : "font-medium"}`}
        >
          {value}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${label}`}
          className="grid size-8 flex-none place-items-center rounded-sm text-mist-400 transition-colors hover:bg-[var(--accent-soft)] hover:text-accent-300"
        >
          <Icon name={copied ? "check" : "file"} size={16} />
        </button>
      </div>
      {copied && <span className="text-xs text-up">Copied.</span>}
    </div>
  );
}
