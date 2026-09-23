import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { CopyField } from "@/components/deposit/CopyField";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { getReferralBonuses, getReferralSummary } from "@/lib/data";
import { formatDate, money } from "@/lib/format";

export const metadata: Metadata = {
  title: "Referrals",
  description: "Your referral code and what it has earned.",
};

export default async function ReferralsPage() {
  const [summary, bonuses] = await Promise.all([
    getReferralSummary(),
    getReferralBonuses(),
  ]);

  if (!summary) {
    return (
      <>
        <PageHeader title="Referrals" subtitle="Invite others to QuickStark." />
        <Card as="article">
          <p className="text-[0.8125rem] text-mist-400">
            Your referral details could not be loaded. Please try again shortly.
          </p>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Referrals" subtitle="Invite others to QuickStark." />

      <div className="grid gap-4 min-[981px]:grid-cols-[minmax(0,380px)_minmax(0,1fr)] min-[981px]:items-start">
        <Card as="article">
          <h2 className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-mist-500">
            Your code
          </h2>
          <p className="mt-3 font-mono text-[1.75rem] font-semibold tracking-[0.08em] text-mist-50">
            {summary.code}
          </p>

          <div className="mt-5 grid gap-3 border-t border-[var(--line-soft)] pt-5">
            <CopyField
              label="Invite link"
              value={`https://qs-dashboard.vercel.app/signup?ref=${summary.code}`}
            />
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 border-t border-[var(--line-soft)] pt-5">
            <Metric label="Signed up" value={String(summary.signups)} />
            <Metric label="Funded" value={String(summary.funded)} />
            <Metric
              label="Maturing"
              value={money(summary.pending_amount, { decimals: 2 })}
            />
            <Metric
              label="Paid to you"
              value={money(summary.matured_amount, { decimals: 2 })}
              tone="up"
            />
          </dl>
        </Card>

        <div className="grid gap-4">
          <Card as="article">
            <h2 className="text-lg font-semibold tracking-[-0.02em]">How it works</h2>
            <ol className="mt-4 grid gap-3">
              <Step n={1}>Share your code or invite link.</Step>
              <Step n={2}>
                They open an account with it and fund that account within{" "}
                {summary.window_hours} hours.
              </Step>
              <Step n={3}>
                You earn {summary.rate_percent}% of their first deposit. It
                matures {summary.maturity_days} days later and joins your
                balance.
              </Step>
            </ol>

            {!summary.enabled && (
              <p className="mt-4 flex items-start gap-2.5 rounded-md border border-[rgba(233,184,114,0.22)] bg-[var(--warn-soft)] px-3.5 py-3 text-[0.8125rem] leading-[1.6] text-[#e3c79c]">
                <Icon name="alert" size={16} className="mt-0.5 flex-none text-warn" />
                Referrals are paused, so new sign-ups will not earn a bonus for
                now. Anything already earned is unaffected.
              </p>
            )}

            <p className="mt-4 text-xs leading-[1.6] text-mist-500">
              A bonus is earned when the deposit is confirmed as received, not
              when it is declared. Nothing on this page credits your account.
            </p>
          </Card>

          <Card as="article">
            <h2 className="mb-4 text-lg font-semibold tracking-[-0.02em]">Your bonuses</h2>
            {bonuses.length === 0 ? (
              <p className="rounded-md border border-dashed border-[var(--line)] px-4 py-6 text-center text-[0.8125rem] text-mist-400">
                Nothing earned yet.
              </p>
            ) : (
              <ul className="grid gap-px overflow-hidden rounded-md bg-[var(--line-soft)]">
                {bonuses.map((b) => {
                  const matured = b.status === "matured";
                  return (
                    <li key={b.id} className="grid gap-1.5 bg-ink-800 px-4 py-3.5">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-[0.9375rem] font-semibold tabular-nums">
                          {money(b.amount, { decimals: 2 })}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 text-[0.6875rem] font-medium ${
                            matured ? "text-up" : "text-warn"
                          }`}
                        >
                          <span
                            className={`size-[5px] rounded-full ${matured ? "bg-up" : "bg-warn"}`}
                          />
                          {matured ? "In your balance" : "Maturing"}
                        </span>
                      </div>
                      <p className="text-xs text-mist-500">
                        {b.rate_percent}% of {money(b.base_amount, { decimals: 2 })}
                        {" · "}
                        {matured
                          ? `matured ${formatDate(b.matures_at)}`
                          : `matures ${formatDate(b.matures_at)}`}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "up";
}) {
  return (
    <div>
      <dt className="text-[0.6875rem] text-mist-500">{label}</dt>
      <dd
        className={`mt-[3px] text-[0.9375rem] font-semibold tabular-nums ${
          tone === "up" ? "text-up" : "text-mist-50"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="grid size-6 flex-none place-items-center rounded-full border border-[var(--accent-line)] bg-[var(--accent-soft)] text-[0.6875rem] font-semibold text-accent-300">
        {n}
      </span>
      <span className="text-[0.8125rem] leading-[1.6] text-mist-300">{children}</span>
    </li>
  );
}
