import type { ReactNode } from "react";
import { Sweep } from "@/components/ui/Sweep";
import type { PlanTier } from "@/lib/types";

type Tone = "neutral" | "up" | "down" | "warn" | "accent" | "live" | "tier";

const TONES: Record<Tone, string> = {
  neutral: "bg-[rgba(148,168,214,0.09)] border-[var(--line-soft)] text-mist-400",
  up: "bg-[var(--up-soft)] border-[rgba(62,207,154,0.2)] text-up",
  down: "bg-[var(--down-soft)] border-[rgba(240,104,123,0.2)] text-down",
  warn: "bg-[var(--warn-soft)] border-[rgba(233,184,114,0.2)] text-warn",
  accent: "bg-[var(--accent-soft)] border-[var(--accent-line)] text-accent-300",
  /* Both tier tones are drawn in globals.css — see .qs-status there. */
  live: "qs-status qs-status-solid",
  tier: "qs-status qs-status-outline",
};

const TIER: Record<PlanTier, string> = {
  silver: "qs-tier-silver",
  gold: "qs-tier-gold",
  vip: "qs-tier-vip",
};

/**
 * A small status pill.
 *
 * `live` and `tier` take the colour of the plan they belong to, so a Gold
 * holding and a VIP holding are never both wearing emerald. `live` is the
 * filled one, for a position that is currently running; `tier` is the quiet
 * outline, for one that has finished.
 *
 * Every tone keeps the same height, radius, padding and type, so changing
 * one does not move anything around it.
 */
export function Badge({
  tone = "neutral",
  tier = "vip",
  dot,
  children,
}: {
  tone?: Tone;
  /** Which tier's colour to wear. Read by the `live` and `tier` tones only. */
  tier?: PlanTier;
  dot?: boolean;
  children: ReactNode;
}) {
  const wearsTier = tone === "live" || tone === "tier";

  return (
    <span
      className={`relative isolate inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full border px-[9px] text-[0.6875rem] font-medium uppercase tracking-[0.04em] ${TONES[tone]} ${
        wearsTier ? TIER[tier] : ""
      }`}
    >
      {/* Only the running state moves. The band crosses the fill and passes
          under the text — a negative z-index child paints above the badge's
          own background but below its content, which is why the word stays
          crisp while the light goes by. Rounded so it is clipped to the pill
          rather than to a rectangle inside it. */}
      {tone === "live" && (
        <Sweep color="rgba(255,255,255,0.5)" seconds={4.5} className="-z-10 rounded-full" />
      )}
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
