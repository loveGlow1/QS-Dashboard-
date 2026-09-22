import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { LineChart } from "@/components/ui/LineChart";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/landing/Sections";
import { EXAMPLE, EXAMPLE_SERIES } from "@/components/landing/illustration";
import { money, percent } from "@/lib/format";

const BULLETS = [
  "Portfolio value over 1M, 3M, 6M and 1Y",
  "Active investment terms and maturity dates",
  "A full, dated record of every transaction",
];

const RANGES = ["1M", "3M", "6M", "1Y"] as const;

/**
 * The portfolio chart, illustrated.
 *
 * Shows the range switcher the bullets describe — a different surface from
 * the hero's summary card, so the two do not repeat each other. The figures
 * are an example and say so; see components/landing/illustration.ts.
 */
export function PlatformPreview() {
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
          <ButtonLink href="/signup" variant="ghost">
            See the dashboard
            <Icon name="arrowRight" size={16} />
          </ButtonLink>
        </Reveal>

        <Reveal delay={100}>
          <div className="rounded-xl border border-[var(--line-strong)] bg-gradient-to-b from-[rgba(20,28,51,0.8)] to-[rgba(11,17,34,0.9)] p-[clamp(20px,2.4vw,28px)] shadow-[0_40px_90px_-40px_rgba(2,5,12,0.9)]">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 text-[0.6875rem] uppercase tracking-[0.08em] text-mist-500">
                  Portfolio Growth
                  <span className="rounded-[5px] border border-[rgba(233,184,114,0.22)] bg-[var(--warn-soft)] px-[7px] py-[2px] text-[0.625rem] font-semibold normal-case tracking-[0.07em] text-warn">
                    Example
                  </span>
                </p>
                <p className="mt-2 text-[clamp(1.75rem,1.3rem+1.8vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.035em] tabular-nums">
                  {money(EXAMPLE.total)}
                </p>
                <p className="mt-2 flex items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium tabular-nums text-up">
                    <Icon name="trendUp" size={13} />
                    {money(EXAMPLE.growth, { signed: true })}
                  </span>
                  <span className="inline-flex h-6 items-center rounded-full border border-[rgba(62,207,154,0.2)] bg-[var(--up-soft)] px-[9px] text-[0.6875rem] font-medium text-up">
                    {percent(EXAMPLE.growthPercent)}
                  </span>
                </p>
              </div>

              {/* Static: this is a picture of the control, not the control. */}
              <div
                aria-hidden="true"
                className="inline-flex flex-none gap-0.5 rounded-full border border-[var(--line)] bg-ink-800 p-[3px]"
              >
                {RANGES.map((r) => (
                  <span
                    key={r}
                    className={`flex h-7 items-center rounded-full px-[13px] text-xs font-medium ${
                      r === "6M" ? "bg-ink-600 text-mist-50 shadow-sm" : "text-mist-400"
                    }`}
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>

            <LineChart
              points={EXAMPLE_SERIES}
              height={240}
              interactive={false}
              ariaLabel="Example of the portfolio chart in the QuickStark dashboard"
            />

            <p className="mt-[22px] border-t border-[var(--line-soft)] pt-4 text-[0.6875rem] text-mist-500">
              An illustration of the dashboard. Figures shown are an example,
              not a real account or a projection.
            </p>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
