import { ButtonLink } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { TierWave } from "@/components/plans/TierWave";
import { Sweep } from "@/components/ui/Sweep";
import { money, usd } from "@/lib/format";
import type { Plan, PlanTier } from "@/lib/types";

/**
 * An investment tier card.
 *
 * The three cards are one family: identical structure, spacing, type scale
 * and button position. Only the accent, border, atmosphere, badge and icon
 * differ, so they read as tiers of one product rather than three unrelated
 * designs.
 *
 * Each card states its naira range — the figures the database enforces when
 * an investment is placed — a term, and what the account gives you. None
 * states or implies a return, because the platform does not promise one.
 */

interface TierStyle {
  /** Multi-stop diagonal gradient. Several stops, not two, is what gives the
      card depth: a straight two-stop ramp reads flat at this size. */
  surface: string;
  /** Wave crest and trough. The trough is the same hue at zero alpha, so the
      wave fades into the card instead of ending on a hard edge. */
  wave: [from: string, to: string];
  /** Shifts this tier's bands against the other cards'. */
  sweep: { offset: number };
  border: string;
  glow: string;
  badge: string;
  icon: IconName;
  iconWrap: string;
  title: string;
  body: string;
  amount: string;
  tick: string;
  cta: string;
}

const STYLES: Record<PlanTier, TierStyle> = {
  silver: {
    surface:
      "bg-[linear-gradient(152deg,#39414f_0%,#2b3340_28%,#1f2530_58%,#171c25_82%,#12161d_100%)]",
    wave: ["rgba(214,225,244,0.16)", "rgba(214,225,244,0)"],
    sweep: { offset: 0 },
    border: "border-[rgba(198,210,230,0.22)]",
    glow: "radial-gradient(70% 46% at 22% 0%, rgba(223,232,247,0.16) 0%, rgba(223,232,247,0) 72%)",
    badge: "border-[rgba(214,225,244,0.38)] bg-[rgba(214,225,244,0.07)] text-[#dbe3f1]",
    icon: "shield",
    iconWrap: "border-[rgba(214,225,244,0.26)] bg-[rgba(214,225,244,0.1)] text-[#dbe3f1]",
    title: "text-white",
    body: "text-[#b3bccb]",
    amount: "text-white",
    tick: "text-[#cdd6e5]",
    cta: "border-transparent bg-[#dbe3f1] font-semibold text-[#171c25] hover:bg-[#eaeff8]",
  },
  gold: {
    surface:
      "bg-[linear-gradient(152deg,#5e4520_0%,#4c3718_28%,#372711_58%,#281c0c_82%,#1d1408_100%)]",
    wave: ["rgba(240,200,130,0.18)", "rgba(240,200,130,0)"],
    sweep: { offset: 2.3 },
    border: "border-[rgba(233,192,120,0.26)]",
    glow: "radial-gradient(70% 46% at 22% 0%, rgba(240,203,136,0.2) 0%, rgba(240,203,136,0) 72%)",
    badge: "border-[rgba(240,200,130,0.42)] bg-[rgba(240,200,130,0.08)] text-[#f0cf92]",
    icon: "sparkle",
    iconWrap: "border-[rgba(240,200,130,0.3)] bg-[rgba(240,200,130,0.11)] text-[#f0cf92]",
    title: "text-white",
    body: "text-[#c9b492]",
    amount: "text-white",
    tick: "text-[#e8c07a]",
    cta: "border-transparent bg-[#e8c07a] font-semibold text-[#2a1d09] hover:bg-[#f2cf90]",
  },
  vip: {
    /* The brand green with depth: a lit upper-left falling away to a deep
       base, rather than a dark card wearing a green tint. The base is the
       ramp's 900, the same deep green the reference card is built on. */
    surface:
      "bg-[linear-gradient(152deg,#2c683a_0%,#245730_26%,#194020_54%,#112e17_80%,#0c2311_100%)]",
    wave: ["rgba(96,250,131,0.22)", "rgba(96,250,131,0)"],
    sweep: { offset: 4.6 },
    border: "border-[rgba(96,250,131,0.3)]",
    glow: "radial-gradient(72% 48% at 20% 0%, rgba(157,251,178,0.22) 0%, rgba(157,251,178,0) 72%)",
    badge: "border-[rgba(96,250,131,0.5)] bg-[rgba(96,250,131,0.08)] text-[#60fa83]",
    icon: "trendUp",
    iconWrap: "border-[rgba(96,250,131,0.32)] bg-[rgba(96,250,131,0.12)] text-[#60fa83]",
    title: "text-white",
    body: "text-[#a9c9b2]",
    amount: "text-white",
    tick: "text-[#60fa83]",
    cta: "border-transparent bg-[#60fa83] font-semibold text-[#06300f] shadow-[0_12px_34px_-14px_rgba(96,250,131,0.8)] hover:bg-[#7cfb99]",
  },
};

/**
 * `7.56` → `$7.56`, `7558.57` → `$7.6K`.
 *
 * The dollars are derived from the naira, which is the price, so they rarely
 * land on round numbers and the cents are part of the figure.
 */
function shortUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return usd(value);
}

export function TierCard({
  plan,
  href,
}: {
  plan: Plan;
  /** Overridden on the public site, where the card sends a visitor to sign up
      rather than to an amount they cannot yet commit. */
  href?: string;
}) {
  /* Signed in, the card opens the amount step for its own tier. */
  const target = href ?? `/investments?plan=${plan.id}`;
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
      <TierWave from={style.wave[0]} to={style.wave[1]} id={`wave-${plan.id}`} />

      {/* The pass, never idle. Each tier is offset so the three cards are not
          crossing in step, which would read as one banner rather than three. */}
      <Sweep color={style.wave[0]} seconds={7} offset={style.sweep.offset} className="-z-10" />

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

      <h3 className={`mt-6 text-[1.75rem] font-semibold leading-[1.1] tracking-[-0.03em] ${style.title}`}>
        {plan.name}
      </h3>

      {/* Three lines reserved (14px at 1.65 is ~23px a line, so 5em clears it):
          the longest description runs to three, and a shorter one must not
          pull its card's divider up above the others. */}
      <p className={`mt-3 min-h-[5em] text-sm leading-[1.65] ${style.body}`}>{plan.summary}</p>

      <div className="mt-6 border-t border-white/10 pt-6">
        <p
          className={`text-2xl font-semibold leading-[1.15] tracking-[-0.03em] tabular-nums ${style.amount}`}
        >
          {plan.usd_minimum === null ? money(plan.minimum) : usd(plan.usd_minimum)}{" "}
          –{" "}
          {plan.usd_maximum === null
            ? plan.maximum
              ? money(plan.maximum)
              : "No ceiling"
            : usd(plan.usd_maximum)}
        </p>
        {/* The naira underneath is not a conversion of the dollars above it —
            it is plan.minimum and plan.maximum, the figures the database
            checks when an investment is placed. The dollars are derived from
            these, not the other way round. */}
        {plan.usd_minimum !== null && (
          <p className={`mt-1 text-[0.8125rem] tabular-nums opacity-80 ${style.body}`}>
            {money(plan.minimum)} – {plan.maximum ? money(plan.maximum) : "No ceiling"}
          </p>
        )}
        <p className={`mt-1.5 text-[0.8125rem] ${style.body}`}>Investment range</p>
      </div>

      <ul className="mt-6 grid flex-1 content-start gap-3">
        {plan.features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-2.5 text-[0.8125rem] leading-[1.55] text-white/85"
          >
            <Icon name="checkCircle" size={16} className={`mt-[1px] flex-none ${style.tick}`} />
            {feature}
          </li>
        ))}
      </ul>

      <div className="mt-8">
        {open ? (
          <ButtonLink href={target} variant="plain" size="lg" block className={style.cta}>
            Start Investing
          </ButtonLink>
        ) : (
          <span className="flex h-[50px] w-full items-center justify-center rounded-full border border-[var(--line)] text-[0.9375rem] font-medium text-mist-400">
            Joining the waitlist
          </span>
        )}
        <p className={`mt-3 text-center text-[0.6875rem] opacity-70 ${style.body}`}>
          {plan.term_label} term ·{" "}
          {plan.usd_minimum === null ? money(plan.minimum) : shortUsd(plan.usd_minimum)}{" "}
          minimum
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
