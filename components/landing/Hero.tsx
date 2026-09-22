import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { ProductWindow } from "@/components/landing/ProductWindow";

export function Hero() {
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
          <ProductWindow />
          <p className="mt-4 text-xs text-mist-500">
            An illustration of the dashboard. Figures shown are an example, not
            a real account or a projection.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
