import { ButtonLink } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { money } from "@/lib/format";
import type { Plan, PlanTier } from "@/lib/types";

/**
 * An investment tier card.
 *
 * The three cards are one family: identical structure, spacing, type scale
 * and button position. Only the accent, border, atmosphere, badge and icon
 * differ, so they read as tiers of one product rather than three unrelated
 * designs.
 *
 * Each card states a range, a term and what the account gives you. None
 * states or implies a return, because the platform does not promise one.
 */

interface TierStyle {
  surface: string;
  border: string;
  glow: string;
  badge: string;
  icon: IconName;
  iconWrap: string;
  amount: string;
  tick: string;
  cta: string;
}

const STYLES: Record<PlanTier, TierStyle> = {
  silver: {
    surface:
      "bg-[linear-gradient(180deg,rgba(191,203,224,0.08)_0%,rgba(191,203,224,0.015)_38%,rgba(0,0,0,0)_70%),linear-gradient(180deg,#11151f_0%,#0b0e16_100%)]",
    border: "border-[rgba(191,203,224,0.18)]",
    glow: "radial-gradient(60% 40% at 50% 0%, rgba(203,213,232,0.12) 0%, rgba(203,213,232,0) 70%)",
    badge: "border-[rgba(191,203,224,0.24)] bg-[rgba(191,203,224,0.09)] text-[#d7dfee]",
    icon: "shield",
    iconWrap: "border-[rgba(191,203,224,0.22)] bg-[rgba(191,203,224,0.08)] text-[#d7dfee]",
    amount: "text-[#eef2fa]",
    tick: "text-[#b9c4d8]",
    cta: "border-[rgba(191,203,224,0.28)] bg-[rgba(191,203,224,0.08)] text-[#e6ebf5] hover:bg-[rgba(191,203,224,0.14)] hover:border-[rgba(191,203,224,0.42)]",
  },
  gold: {
    surface:
      "bg-[linear-gradient(180deg,rgba(214,170,94,0.1)_0%,rgba(214,170,94,0.02)_38%,rgba(0,0,0,0)_70%),linear-gradient(180deg,#141109_0%,#0c0a07_100%)]",
    border: "border-[rgba(214,170,94,0.22)]",
    glow: "radial-gradient(60% 40% at 50% 0%, rgba(214,170,94,0.14) 0%, rgba(214,170,94,0) 70%)",
    badge: "border-[rgba(214,170,94,0.3)] bg-[rgba(214,170,94,0.1)] text-[#e3c188]",
    icon: "sparkle",
    iconWrap: "border-[rgba(214,170,94,0.28)] bg-[rgba(214,170,94,0.09)] text-[#e3c188]",
    amount: "text-[#fbf5ea]",
    tick: "text-[#cfae76]",
    cta: "border-[rgba(214,170,94,0.34)] bg-[rgba(214,170,94,0.1)] text-[#f0dcb8] hover:bg-[rgba(214,170,94,0.16)] hover:border-[rgba(214,170,94,0.5)]",
  },
  vip: {
    surface:
      "bg-[linear-gradient(180deg,rgba(45,178,126,0.14)_0%,rgba(45,178,126,0.03)_40%,rgba(0,0,0,0)_72%),linear-gradient(180deg,#07130f_0%,#050b09_100%)]",
    border: "border-[rgba(45,178,126,0.32)]",
    glow: "radial-gradient(64% 44% at 50% 0%, rgba(45,178,126,0.2) 0%, rgba(45,178,126,0) 72%)",
    badge: "border-[rgba(45,178,126,0.36)] bg-[rgba(45,178,126,0.12)] text-[#6fdfae]",
    icon: "trendUp",
    iconWrap: "border-[rgba(45,178,126,0.34)] bg-[rgba(45,178,126,0.12)] text-[#6fdfae]",
    amount: "text-white",
    tick: "text-[#5ccf9d]",
    cta: "border-transparent bg-[#2db27e] font-semibold text-[#03130d] shadow-[0_10px_30px_-14px_rgba(45,178,126,0.9)] hover:bg-[#35c78e]",
  },
};

/** `50000` → `₦50K`, `20000000` → `₦20M`. Ranges read better abbreviated. */
function short(value: number): string {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `₦${Number.isInteger(m) ? m : m.toFixed(1)}M`;
  }
  if (value >= 1000) return `₦${Math.round(value / 1000)}K`;
  return money(value);
}

export function TierCard({ plan, href = "/investments" }: { plan: Plan; href?: string }) {
  const style = STYLES[plan.tier] ?? STYLES.silver;
  const open = plan.status === "open";

  return (
    <article
      className={`relative isolate flex h-full flex-col overflow-hidden rounded-xl border p-7 max-[600px]:p-6 ${style.border} ${style.surface}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-1/2"
        style={{ background: style.glow }}
      />

      <div className="flex items-center justify-between gap-3">
        <span
          className={`inline-flex h-[26px] items-center rounded-full border px-[11px] text-[0.6875rem] font-semibold uppercase tracking-[0.1em] ${style.badge}`}
        >
          {plan.name}
        </span>
        <span className={`grid size-9 place-items-center rounded-lg border ${style.iconWrap}`}>
          <Icon name={style.icon} size={17} />
        </span>
      </div>

      <h3 className="mt-6 text-[1.75rem] font-semibold leading-[1.1] tracking-[-0.03em] text-mist-50">
        {plan.name}
      </h3>

      {/* Three lines reserved (14px at 1.65 is ~23px a line, so 5em clears it):
          the longest description runs to three, and a shorter one must not
          pull its card's divider up above the others. */}
      <p className="mt-3 min-h-[5em] text-sm leading-[1.65] text-mist-400">{plan.summary}</p>

      <div className="mt-6 border-t border-[rgba(255,255,255,0.07)] pt-6">
        <p
          className={`text-2xl font-semibold leading-[1.15] tracking-[-0.03em] tabular-nums ${style.amount}`}
        >
          {money(plan.minimum)} – {plan.maximum ? money(plan.maximum) : "No ceiling"}
        </p>
        <p className="mt-1.5 text-[0.8125rem] text-mist-400">Investment range</p>
      </div>

      <ul className="mt-6 grid flex-1 content-start gap-3">
        {plan.features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-2.5 text-[0.8125rem] leading-[1.55] text-mist-200"
          >
            <Icon name="check" size={15} className={`mt-[2px] flex-none ${style.tick}`} />
            {feature}
          </li>
        ))}
      </ul>

      <div className="mt-8">
        {open ? (
          <ButtonLink href={href} size="lg" block className={style.cta}>
            Start Investing
          </ButtonLink>
        ) : (
          <span className="flex h-[50px] w-full items-center justify-center rounded-full border border-[var(--line)] text-[0.9375rem] font-medium text-mist-400">
            Joining the waitlist
          </span>
        )}
        <p className="mt-3 text-center text-[0.6875rem] text-mist-500">
          {plan.term_label} term · {short(plan.minimum)} minimum
        </p>
      </div>
    </article>
  );
}

export function TierGrid({ plans, href }: { plans: Plan[]; href?: string }) {
  return (
    <div className="grid items-stretch gap-5 min-[981px]:grid-cols-3">
      {plans.map((plan) => (
        <TierCard key={plan.id} plan={plan} href={href} />
      ))}
    </div>
  );
}
