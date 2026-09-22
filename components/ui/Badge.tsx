import type { ReactNode } from "react";

type Tone = "neutral" | "up" | "down" | "warn" | "accent";

const TONES: Record<Tone, string> = {
  neutral: "bg-[rgba(148,168,214,0.09)] border-[var(--line-soft)] text-mist-400",
  up: "bg-[var(--up-soft)] border-[rgba(62,207,154,0.2)] text-up",
  down: "bg-[var(--down-soft)] border-[rgba(240,104,123,0.2)] text-down",
  warn: "bg-[var(--warn-soft)] border-[rgba(233,184,114,0.2)] text-warn",
  accent: "bg-[var(--accent-soft)] border-[var(--accent-line)] text-accent-300",
};

export function Badge({
  tone = "neutral",
  dot,
  children,
}: {
  tone?: Tone;
  dot?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full border px-[9px] text-[0.6875rem] font-medium uppercase tracking-[0.04em] ${TONES[tone]}`}
    >
      {dot && <span className="size-1.5 flex-none rounded-full bg-current" />}
      {children}
    </span>
  );
}

/** Directional indicator for a financial value. Colour carries meaning here. */
export function Delta({ value, children }: { value: number; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[0.8125rem] font-medium tabular-nums ${
        value >= 0 ? "text-up" : "text-down"
      }`}
    >
      {children}
    </span>
  );
}
