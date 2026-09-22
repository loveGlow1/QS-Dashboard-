import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHead } from "@/components/landing/Sections";
import { money } from "@/lib/format";
import type { Plan } from "@/lib/types";

/**
 * The plan catalogue, read from the database.
 *
 * Cards state minimum, duration, eligibility and availability. No card
 * carries a promised or projected return, because the platform does not
 * offer one.
 */
export function Plans({ plans }: { plans: Plan[] }) {
  return (
    <Section id="investments">
      <SectionHead
        eyebrow="Investments"
        title="Plans with terms stated up front."
        lede="Each plan sets out its minimum, its duration and who can access it. Availability is shown on every card."
      />

      {plans.length === 0 ? (
        <div className="grid justify-items-center gap-2.5 rounded-lg border border-[var(--line)] px-5 py-[38px] text-center text-mist-400">
          <Icon name="inbox" size={28} className="text-mist-500" />
          <p className="max-w-[280px] text-[0.8125rem]">
            No plans are open right now. Create an account and we will let you
            know when one opens.
          </p>
        </div>
      ) : (
        <div className="grid items-stretch gap-4 max-[980px]:max-w-[520px] min-[981px]:grid-cols-3">
          {plans.map((plan, i) => {
            const open = plan.status === "open";
            return (
              <Reveal key={plan.id} delay={i * 80} as="article" className="h-full">
                <article
                  className={`relative flex h-full flex-col gap-4 rounded-lg border p-6 transition-colors ${
                    plan.featured
                      ? "border-[var(--accent-line)] bg-ink-800 bg-[linear-gradient(180deg,rgba(77,124,243,0.09)_0%,rgba(77,124,243,0)_46%)]"
                      : "border-[var(--line)] bg-ink-850 hover:border-[var(--line-strong)]"
                  }`}
                >
                  {plan.featured && (
                    <span className="absolute -top-px right-[22px] rounded-b-sm bg-accent-500 px-[11px] py-1 text-[0.625rem] font-semibold uppercase tracking-[0.06em] text-white">
                      Most chosen
                    </span>
                  )}

                  <header className="flex items-center justify-between gap-3">
                    <h3 className="text-xl font-semibold tracking-[-0.02em]">{plan.name}</h3>
                    <Badge tone={open ? "up" : "warn"}>{open ? "Open" : "Waitlist"}</Badge>
                  </header>

                  {/* Two lines reserved so the term tables align across cards. */}
                  <p className="min-h-[3.2em] text-sm leading-[1.6] text-mist-400">{plan.summary}</p>

                  <dl className="grid gap-px overflow-hidden rounded-md bg-[var(--line-soft)] p-0.5">
                    <div className="flex items-baseline justify-between gap-3 bg-ink-800 px-[13px] py-[11px]">
                      <dt className="text-xs text-mist-500">Minimum investment</dt>
                      <dd className="text-[0.8125rem] font-medium tabular-nums">{money(plan.minimum)}</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3 bg-ink-800 px-[13px] py-[11px]">
                      <dt className="text-xs text-mist-500">Duration</dt>
                      <dd className="text-[0.8125rem] font-medium">{plan.term_label}</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3 bg-ink-800 px-[13px] py-[11px]">
                      <dt className="text-xs text-mist-500">Eligibility</dt>
                      <dd className="text-right text-[0.8125rem] font-medium">{plan.eligibility}</dd>
                    </div>
                  </dl>

                  <ul className="grid flex-1 content-start gap-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-[0.8125rem] leading-[1.5] text-mist-200">
                        <Icon name="check" size={14} className="mt-[3px] flex-none text-accent-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <ButtonLink
                    href="/signup"
                    variant={plan.featured ? "primary" : "ghost"}
                    block
                    className="mt-auto"
                  >
                    View Details
                  </ButtonLink>
                </article>
              </Reveal>
            );
          })}
        </div>
      )}

      <Reveal>
        <p className="mt-[26px] flex max-w-[760px] items-start gap-2.5 text-xs leading-[1.65] text-mist-500">
          <Icon name="info" size={15} className="mt-0.5 flex-none" />
          QuickStark does not promise or guarantee a return. Investment values
          can go down as well as up, and past performance does not indicate
          future results.
        </p>
      </Reveal>
    </Section>
  );
}
