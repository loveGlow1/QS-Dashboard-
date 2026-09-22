import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { LineChart } from "@/components/ui/LineChart";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/landing/Sections";
import { money } from "@/lib/format";
import type { PlatformMetrics, SeriesPoint } from "@/lib/types";

const BULLETS = [
  "Portfolio value over 1M, 3M, 6M and 1Y",
  "Active investment terms and maturity dates",
  "A full, dated record of every transaction",
];

/**
 * Platform-wide totals, not a customer's account. Public aggregates only —
 * no individual holding is visible here.
 */
export function PlatformPreview({
  metrics,
  series,
}: {
  metrics: PlatformMetrics | null;
  series: SeriesPoint[];
}) {
  return (
    <Section id="portfolio">
      <div className="grid items-center gap-[clamp(28px,4vw,56px)] min-[941px]:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <Reveal className="grid justify-items-start gap-4">
          <span className="text-xs font-medium uppercase tracking-[0.08em] text-mist-400">
            Your dashboard
          </span>
          <h2 className="text-[clamp(1.6rem,1.1rem+1.9vw,2.4rem)] font-semibold leading-[1.16] tracking-[-0.03em]">
            The whole picture, at a glance.
          </h2>
          <p className="text-[clamp(1rem,0.94rem+0.3vw,1.125rem)] leading-[1.65] text-mist-400">
            Your portfolio total, how it has moved, what you are currently
            invested in and every transaction behind it — on one screen, on any
            device.
          </p>
          <ul className="mt-0.5 grid gap-2.5">
            {BULLETS.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-sm text-mist-200">
                <Icon name="check" size={15} className="mt-1 flex-none text-accent-500" />
                {b}
              </li>
            ))}
          </ul>
          <ButtonLink href="/login" variant="ghost">
            See the dashboard
            <Icon name="arrowRight" size={16} />
          </ButtonLink>
        </Reveal>

        <Reveal delay={100}>
          <div className="rounded-xl border border-[var(--line-strong)] bg-gradient-to-b from-[rgba(20,28,51,0.8)] to-[rgba(11,17,34,0.9)] p-[clamp(20px,2.4vw,28px)] shadow-[0_40px_90px_-40px_rgba(2,5,12,0.9)]">
            <div className="mb-5">
              <p className="text-[0.6875rem] uppercase tracking-[0.08em] text-mist-500">
                Invested on QuickStark
              </p>
              <p className="mt-2 text-[clamp(1.75rem,1.3rem+1.8vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.035em] tabular-nums">
                {metrics ? money(metrics.total_invested) : "—"}
              </p>
            </div>

            <LineChart
              points={series}
              height={240}
              interactive
              ariaLabel="Total invested on QuickStark over time"
              emptyMessage="Platform totals appear here once the first investments are funded."
            />

            <p className="mt-[22px] border-t border-[var(--line-soft)] pt-4 text-[0.6875rem] text-mist-500">
              Platform totals across all QuickStark accounts, updated live. Your
              own portfolio appears here once you sign in.
            </p>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
