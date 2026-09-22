import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { clamp, daysBetween, formatDate, money, percent } from "@/lib/format";
import type { Investment } from "@/lib/types";

const STATUS_TONE = { active: "up", matured: "accent", cancelled: "neutral" } as const;

export function HoldingsList({ investments }: { investments: Investment[] }) {
  return (
    <div className="grid gap-4">
      {investments.map((inv) => {
        const principal = Number(inv.principal);
        const current = Number(inv.current_value);
        const growth = current - principal;
        const growthPercent = principal > 0 ? (growth / principal) * 100 : 0;
        const up = growth >= 0;

        const total = daysBetween(inv.start_date, inv.maturity_date);
        const elapsed = daysBetween(inv.start_date, new Date());
        const progress = total > 0 ? clamp((elapsed / total) * 100, 0, 100) : 0;
        const remaining = Math.max(0, total - elapsed);

        return (
          <Card key={inv.id}>
            <header className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-[1.0625rem] font-semibold tracking-[-0.02em] capitalize">
                  {inv.plan_id}
                </p>
                <p className="mt-[3px] text-xs text-mist-500">
                  Started {formatDate(inv.start_date)}
                </p>
              </div>
              <Badge tone={STATUS_TONE[inv.status] ?? "neutral"} dot>
                {inv.status}
              </Badge>
            </header>

            <dl className="grid gap-4 min-[601px]:grid-cols-3">
              <div>
                <dt className="text-[0.6875rem] text-mist-500">Initial investment</dt>
                <dd className="mt-1 text-[0.9375rem] font-semibold tabular-nums">
                  {money(principal, { decimals: 2 })}
                </dd>
              </div>
              <div>
                <dt className="text-[0.6875rem] text-mist-500">Current value</dt>
                <dd className="mt-1 text-[0.9375rem] font-semibold tabular-nums">
                  {money(current, { decimals: 2 })}
                </dd>
              </div>
              <div>
                <dt className="text-[0.6875rem] text-mist-500">Growth</dt>
                <dd
                  className={`mt-1 text-[0.9375rem] font-semibold tabular-nums ${up ? "text-up" : "text-down"}`}
                >
                  {money(growth, { decimals: 2, signed: true })}{" "}
                  <span className="text-xs opacity-85">{percent(growthPercent)}</span>
                </dd>
              </div>
            </dl>

            {inv.status === "active" && (
              <div className="mt-5 grid gap-2">
                <div className="flex justify-between gap-3 text-[0.6875rem] font-medium text-mist-200">
                  <span>{formatDate(inv.start_date)}</span>
                  <span>{formatDate(inv.maturity_date)}</span>
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
            )}
          </Card>
        );
      })}
    </div>
  );
}
