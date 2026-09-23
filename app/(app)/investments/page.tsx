import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { TierGrid } from "@/components/plans/TierCard";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { HoldingsList } from "@/components/dashboard/HoldingsList";
import { InvestFlow } from "@/components/investments/InvestFlow";
import { getInvestments, getPlans, getPortfolio, getUsdRate } from "@/lib/data";
import { ngnToUsd, usd } from "@/lib/format";

export const metadata: Metadata = {
  title: "Investments",
  description: "Choose an investment tier and track your holdings.",
};

export default async function InvestmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const [plans, investments, portfolio, rate, params] = await Promise.all([
    getPlans(),
    getInvestments(),
    getPortfolio("6M"),
    getUsdRate(),
    searchParams,
  ]);

  /* ?plan= names the tier a card sent them here for. An id that matches
     nothing falls through to the list rather than erroring — a stale link
     should show the tiers, not a dead page. */
  const chosen = params.plan ? plans.find((p) => p.id === params.plan) ?? null : null;

  if (chosen) {
    return (
      <>
        <PageHeader
          title={`Invest in ${chosen.name}`}
          subtitle="Choose how much to put in."
        />
        <div className="max-w-[560px]">
          <Card as="article">
            <InvestFlow
              plan={chosen}
              availableNaira={portfolio.available}
              rate={rate}
            />
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Investments"
        subtitle="Choose a tier that matches what you want to invest."
      />

      {investments.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-mist-500">
            Your holdings
          </h2>
          <HoldingsList investments={investments} />
        </section>
      )}

      <section>
        <h2 className="mb-1 text-xl font-semibold tracking-[-0.025em]">Investment tiers</h2>
        <p className="mb-6 max-w-[62ch] text-sm leading-[1.65] text-mist-400">
          Each tier states its range, its term and what your account gives you.
          Your available balance is{" "}
          <span className="font-medium tabular-nums text-mist-200">
            {rate > 0
              ? usd(ngnToUsd(portfolio.available, rate))
              : `₦${portfolio.available.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          </span>
          .
        </p>

        {plans.length === 0 ? (
          <Card>
            <div className="grid justify-items-center gap-2.5 px-5 py-10 text-center text-mist-400">
              <Icon name="inbox" size={28} className="text-mist-500" />
              <p className="text-sm font-medium text-mist-50">No tiers are open right now.</p>
              <p className="max-w-[320px] text-[0.8125rem] leading-[1.6]">
                We&apos;ll let you know as soon as one opens.
              </p>
            </div>
          </Card>
        ) : (
          <TierGrid plans={plans} />
        )}

        <p className="mt-7 flex max-w-[760px] items-start gap-2.5 text-xs leading-[1.65] text-mist-500">
          <Icon name="info" size={15} className="mt-0.5 flex-none" />
          QuickStark does not promise or guarantee a return. Investment values
          can go down as well as up, and past performance does not indicate
          future results.
        </p>
      </section>
    </>
  );
}
