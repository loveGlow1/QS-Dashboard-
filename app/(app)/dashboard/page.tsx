import type { Metadata } from "next";
import { ActiveInvestment } from "@/components/dashboard/ActiveInvestment";
import { GrowthCard } from "@/components/dashboard/GrowthCard";
import { PortfolioCard } from "@/components/dashboard/PortfolioCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { MobileHome } from "@/components/dashboard/mobile/MobileHome";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import {
  getActiveInvestment,
  getPortfolio,
  getProfile,
  getTransactions,
} from "@/lib/data";
import { greeting, titleCase } from "@/lib/format";
import type { ChartRange } from "@/lib/types";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your portfolio value, performance, active investments and recent activity.",
};

const DEFAULT_RANGE: ChartRange = "6M";

export default async function DashboardPage() {
  /* Every figure below is fetched for the session's own user: row level
     security scopes each query to them, so no identifier from the request
     participates in deciding whose money is returned. */
  const [profile, portfolio, investment, transactions] = await Promise.all([
    getProfile(),
    getPortfolio(DEFAULT_RANGE),
    getActiveInvestment(),
    getTransactions({ limit: 5 }),
  ]);

  const firstName =
    titleCase(profile?.first_name || profile?.full_name?.split(" ")[0] || "") || "there";

  return (
    <>
      <section className="mb-[22px] flex flex-wrap items-end justify-between gap-5 max-[720px]:items-start max-[720px]:gap-4">
        <div className="max-[720px]:w-full">
          <h2 className="text-[clamp(1.375rem,1.1rem+1vw,1.75rem)] font-semibold leading-[1.2] tracking-[-0.03em]">
            {greeting()},{" "}
            <span className="text-em-400">{firstName}</span>
          </h2>
          <p className="mt-1.5 text-sm text-mist-400">Here&apos;s an overview of your portfolio.</p>
        </div>
        <div className="max-[720px]:hidden">
          <QuickActions />
        </div>
      </section>

      {/* A phone gets its own arrangement of the same figures — see
          MobileHome. Both are rendered and one is hidden, rather than picking
          a layout from a measured width, because measuring means the first
          paint is a guess and the correction is a visible jump. */}
      <div className="min-[721px]:hidden">
        <MobileHome
          firstName={firstName}
          portfolio={portfolio}
          investment={investment}
          transactions={transactions}
        />
      </div>

      <div className="max-[720px]:hidden">

      <section className="mb-4 grid gap-4 min-[1025px]:grid-cols-[minmax(0,340px)_minmax(0,1fr)] min-[1181px]:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <PortfolioCard portfolio={portfolio} investment={investment} />
        <GrowthCard initialRange={DEFAULT_RANGE} initialSeries={portfolio.series} />
      </section>

      {/* The active investment panel only appears when there is one. On a new
          account the portfolio card already carries that state and its call to
          action, and saying it twice makes an empty dashboard read as broken. */}
      <section
        className={`mb-4 grid gap-4 ${investment ? "min-[1025px]:grid-cols-[minmax(0,1fr)_minmax(0,380px)]" : ""}`}
      >
        <RecentActivity transactions={transactions} />
        {investment && <ActiveInvestment investment={investment} />}
      </section>
      </div>

      <footer className="mt-[26px] border-t border-[var(--line-soft)] pt-[18px]">
        <p className="max-w-[68ch] text-[0.6875rem] leading-[1.6] text-mist-500">
          Investing carries risk, including the risk of losing money. Nothing
          here is financial advice.
        </p>
      </footer>
    </>
  );
}
