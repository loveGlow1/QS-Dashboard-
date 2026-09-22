import { Icon } from "@/components/ui/Icon";
import { TierGrid } from "@/components/plans/TierCard";
import { Section, SectionHead } from "@/components/landing/Sections";
import { Reveal } from "@/components/ui/Reveal";
import type { Plan } from "@/lib/types";

/**
 * The investment tiers, read from the database.
 *
 * Cards state a range, a term and what the account gives you. None carries a
 * promised or projected return, because the platform does not offer one.
 */
export function Plans({ plans }: { plans: Plan[] }) {
  return (
    <Section id="investments">
      <SectionHead
        eyebrow="Investments"
        title="Choose the tier that fits."
        lede="Each tier states its investment range, its term and who can access it. No tier promises a return."
      />

      {plans.length === 0 ? (
        <div className="grid justify-items-center gap-2.5 rounded-lg border border-[var(--line)] px-5 py-[38px] text-center text-mist-400">
          <Icon name="inbox" size={28} className="text-mist-500" />
          <p className="max-w-[280px] text-[0.8125rem]">
            No tiers are open right now. Create an account and we will let you
            know when one opens.
          </p>
        </div>
      ) : (
        <TierGrid plans={plans} href="/signup" />
      )}

      <Reveal>
        <p className="mt-7 flex max-w-[760px] items-start gap-2.5 text-xs leading-[1.65] text-mist-500">
          <Icon name="info" size={15} className="mt-0.5 flex-none" />
          QuickStark does not promise or guarantee a return. Investment values
          can go down as well as up, and past performance does not indicate
          future results.
        </p>
      </Reveal>
    </Section>
  );
}
