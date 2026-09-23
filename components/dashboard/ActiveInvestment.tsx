import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardHead } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Figure } from "@/components/ui/Figure";
import { clamp, daysBetween, formatDate, percent } from "@/lib/format";
import type { Investment } from "@/lib/types";

export function ActiveInvestment({
  investment,
  rate = 0,
}: {
  investment: Investment | null;
  /** Naira per dollar; zero shows naira alone. */
  rate?: number;
}) {
  return (
    <Card as="article" id="investments">
      <CardHead>
        <h2 className="text-lg font-semibold tracking-[-0.02em]">Active Investment</h2>
      </CardHead>

      {!investment ? (
        <div className="grid justify-items-center gap-2.5 px-5 py-[38px] text-center text-mist-400">
          <Icon name="layers" size={28} className="text-mist-500" />
          <p className="max-w-[280px] text-[0.8125rem]">
            You have no active investment yet. Choose a plan to get started.
          </p>
          <ButtonLink href="/investments" variant="ghost" size="sm" className="mt-1">
            Browse plans
          </ButtonLink>
        </div>
      ) : (
        <InvestmentDetail investment={investment} rate={rate} />
      )}
    </Card>
  );
}

function InvestmentDetail({
  investment,
  rate,
}: {
  investment: Investment;
  rate: number;
}) {
  const growth = Number(investment.current_value) - Number(investment.principal);
  const growthPercent = Number(investment.principal) > 0 ? (growth / Number(investment.principal)) * 100 : 0;
  const up = growth >= 0;

  const total = daysBetween(investment.start_date, investment.maturity_date);
  const elapsed = daysBetween(investment.start_date, new Date());
  const progress = total > 0 ? clamp((elapsed / total) * 100, 0, 100) : 0;
  const remaining = Math.max(0, total - elapsed);

  return (
    <div className="grid gap-[18px]">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[1.0625rem] font-semibold tracking-[-0.02em]">{investment.plan_id}</p>
          <p className="mt-[3px] text-xs text-mist-500">{formatDate(investment.start_date)} start</p>
        </div>
        <Badge tone="live" dot>
          Active
        </Badge>
      </header>

      <dl className="grid gap-px overflow-hidden rounded-md bg-[var(--line-soft)]">
        <div className="flex items-baseline justify-between gap-3 bg-ink-800 px-[13px] py-3">
          <dt className="text-xs text-mist-500">Initial investment</dt>
          <dd className="text-sm font-medium tabular-nums"><Figure naira={investment.principal} rate={rate} /></dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 bg-ink-800 px-[13px] py-3">
          <dt className="text-xs text-mist-500">Current value</dt>
          <dd className="text-sm font-semibold tabular-nums"><Figure naira={investment.current_value} rate={rate} /></dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 bg-ink-800 px-[13px] py-3">
          <dt className="text-xs text-mist-500">Growth</dt>
          <dd className={`text-sm font-medium tabular-nums ${up ? "text-up" : "text-down"}`}>
            <Figure naira={growth} rate={rate} signed />{" "}
            <span className="text-xs opacity-85">{percent(growthPercent)}</span>
          </dd>
        </div>
      </dl>

      <div className="grid gap-2">
        <div className="flex justify-between gap-3 text-[0.6875rem] font-medium text-mist-200">
          <span>{formatDate(investment.start_date)}</span>
          <span>{formatDate(investment.maturity_date)}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full border border-[var(--line-soft)] bg-ink-700">
          <span
            className="block h-full rounded-full bg-gradient-to-r from-accent-600 to-accent-400"
            style={{ width: `${progress.toFixed(1)}%` }}
          />
        </div>
        <div className="flex justify-between gap-3 text-[0.6875rem] text-mist-500">
          <span>Start date</span>
          <span>{remaining > 0 ? `${remaining} days to maturity` : "Matured"}</span>
        </div>
      </div>

      <ButtonLink href="/investments" variant="ghost" block>
        View Investment
      </ButtonLink>
    </div>
  );
}
