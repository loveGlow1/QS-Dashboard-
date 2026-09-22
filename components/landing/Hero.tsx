import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { money } from "@/lib/format";
import type { PlatformMetrics } from "@/lib/types";

const RAIL: { icon: IconName; label: string; active?: boolean }[] = [
  { icon: "grid", label: "Dashboard", active: true },
  { icon: "chart", label: "Investments" },
  { icon: "list", label: "Transactions" },
  { icon: "download", label: "Withdraw" },
];

/**
 * The product window shows live platform aggregates, never a customer's
 * account. A figure the database has not produced renders as an em dash
 * rather than a stand-in number.
 */
function stat(value: number | undefined | null): string {
  return value === undefined || value === null ? "—" : value.toLocaleString("en-US");
}

export function Hero({ metrics }: { metrics: PlatformMetrics | null }) {
  return (
    <section className="relative isolate overflow-hidden pb-[clamp(56px,7vw,96px)] pt-[calc(var(--spacing-header)+clamp(48px,7vw,92px))]">
      {/* One soft cool light source, not competing gradients. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-[34%] left-1/2 -z-20 aspect-[1.35/1] w-[min(1180px,130vw)] -translate-x-1/2 blur-[6px]"
        style={{
          background:
            "radial-gradient(48% 46% at 50% 42%, rgba(77,124,243,0.3) 0%, rgba(77,124,243,0) 68%), radial-gradient(38% 40% at 22% 30%, rgba(46,86,196,0.24) 0%, rgba(46,86,196,0) 72%), radial-gradient(40% 44% at 80% 26%, rgba(110,146,255,0.16) 0%, rgba(110,146,255,0) 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(148,168,214,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,168,214,0.05) 1px, transparent 1px)",
          backgroundSize: "74px 74px",
          maskImage: "radial-gradient(64% 58% at 50% 32%, #000 0%, transparent 78%)",
          WebkitMaskImage: "radial-gradient(64% 58% at 50% 32%, #000 0%, transparent 78%)",
        }}
      />

      <div className="mx-auto grid w-full max-w-[1180px] justify-items-center px-6 text-center">
        <Reveal>
          <span className="inline-flex h-[30px] items-center gap-2 rounded-full border border-[var(--line)] bg-[rgba(15,22,41,0.7)] px-3.5 text-xs font-medium tracking-normal text-mist-200 backdrop-blur-[8px]">
            <span className="size-1.5 rounded-full bg-accent-500 shadow-[0_0_0_3px_var(--accent-soft)]" />
            Investment platform
          </span>
        </Reveal>

        <Reveal delay={60}>
          <h1 className="mt-[22px] max-w-[16ch] text-[clamp(2.25rem,1.2rem+4.4vw,4rem)] font-semibold leading-[1.06] tracking-[-0.035em]">
            Build your portfolio.
            <br />
            <span className="bg-gradient-to-r from-[#c3d3fb] via-[#7ea1f7] to-accent-500 bg-clip-text text-transparent">
              Track your progress.
            </span>
          </h1>
        </Reveal>

        <Reveal delay={120}>
          <p className="mt-5 max-w-[54ch] text-[clamp(1rem,0.94rem+0.3vw,1.125rem)] leading-[1.65] text-mist-400">
            Invest, follow how your portfolio is performing over time, and manage
            eligible withdrawals — all from one account, with every transaction
            recorded.
          </p>
        </Reveal>

        <Reveal delay={180}>
          <div className="mt-[30px] flex flex-wrap justify-center gap-2.5">
            <ButtonLink href="/signup" variant="primary" size="lg">
              Get Started
            </ButtonLink>
            <ButtonLink href="#investments" variant="ghost" size="lg">
              Explore Investments
            </ButtonLink>
          </div>
        </Reveal>

        <Reveal delay={240} className="w-full">
          <div className="relative mx-auto mt-[clamp(46px,6vw,76px)] w-full max-w-[1020px] overflow-hidden rounded-xl border border-[var(--line-strong)] bg-gradient-to-b from-[#0c1020] to-[#080c18] text-left shadow-[0_40px_90px_-40px_rgba(2,5,12,0.9)]">
            <div className="flex h-[42px] items-center gap-3.5 border-b border-[var(--line-soft)] bg-[rgba(148,168,214,0.03)] px-3.5">
              <span className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <i key={i} className="size-[9px] rounded-full bg-[rgba(148,168,214,0.22)]" />
                ))}
              </span>
              <span className="mx-auto max-w-[300px] flex-1 rounded-full bg-[rgba(148,168,214,0.06)] px-3 py-1 text-center text-[0.6875rem] tracking-normal text-mist-500">
                app.quickstark.tech/dashboard
              </span>
              <span className="w-[39px]" />
            </div>

            <div className="grid min-h-[300px] grid-cols-1 min-[721px]:grid-cols-[190px_1fr]">
              <aside
                aria-hidden="true"
                className="hidden border-r border-[var(--line-soft)] bg-[rgba(148,168,214,0.02)] px-3.5 py-[18px] min-[721px]:block"
              >
                <div className="mb-5 ml-2 mt-0.5">
                  <Logo size="sm" href={null} id="hero" />
                </div>
                <ul className="grid gap-0.5">
                  {RAIL.map((item) => (
                    <li
                      key={item.label}
                      className={`flex items-center gap-2.5 rounded-sm px-2.5 py-[9px] text-[0.8125rem] ${
                        item.active ? "bg-[var(--accent-soft)] text-accent-300" : "text-mist-500"
                      }`}
                    >
                      <Icon name={item.icon} size={15} />
                      {item.label}
                    </li>
                  ))}
                </ul>
              </aside>

              <div className="grid content-start gap-4 p-[22px]">
                <div>
                  <p className="text-[0.6875rem] uppercase tracking-[0.08em] text-mist-500">
                    Invested on QuickStark
                  </p>
                  <p className="mt-[5px] text-[clamp(1.5rem,1.1rem+1.4vw,2rem)] font-semibold tracking-[-0.03em] tabular-nums">
                    {metrics ? money(metrics.total_invested) : "—"}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2.5 border-t border-[var(--line-soft)] pt-4">
                  <div>
                    <p className="text-[0.6875rem] text-mist-500">Members</p>
                    <strong className="mt-[3px] block text-sm font-semibold tabular-nums">
                      {stat(metrics?.members)}
                    </strong>
                  </div>
                  <div>
                    <p className="text-[0.6875rem] text-mist-500">Active investments</p>
                    <strong className="mt-[3px] block text-sm font-semibold tabular-nums">
                      {stat(metrics?.active_investments)}
                    </strong>
                  </div>
                  <div>
                    <p className="text-[0.6875rem] text-mist-500">Open plans</p>
                    <strong className="mt-[3px] block text-sm font-semibold tabular-nums">
                      {stat(metrics?.open_plans)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
