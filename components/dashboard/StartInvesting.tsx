import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Sweep } from "@/components/ui/Sweep";

/**
 * The one action an empty account is for.
 *
 * Shared by the phone dashboard and the portfolio card, so the same decision
 * does not look like two different weights of decision depending on the
 * device.
 *
 * It carries the same travelling light as the tier cards — this is the button
 * those cards lead to, and a flat panel sitting under three moving ones read
 * as the dead end of the flow rather than the point of it. The motion is
 * decoration: it says nothing, and reduced motion removes it.
 */
export function StartInvesting({
  invested = false,
  className = "",
}: {
  /** Someone already holding a position is not starting; they are adding. */
  invested?: boolean;
  className?: string;
}) {
  return (
    <Link
      href="/investments"
      className={`group relative isolate flex items-center gap-4 overflow-hidden rounded-xl border border-[var(--em-line-strong)] bg-[linear-gradient(135deg,rgba(16,185,54,0.24),rgba(6,95,26,0.16)_52%,rgba(16,185,54,0.12))] px-4 py-[18px] shadow-[0_20px_48px_-26px_var(--em-glow),inset_0_1px_0_rgba(255,255,255,0.09)] transition-[transform,border-color,box-shadow] duration-200 hover:border-[var(--color-em-400)] hover:shadow-[0_24px_56px_-24px_rgba(16,185,54,0.4),inset_0_1px_0_rgba(255,255,255,0.12)] active:scale-[0.995] ${className}`}
    >
      <Sweep color="rgba(167,243,184,0.2)" seconds={6.5} className="-z-10" />

      <span className="grid size-11 flex-none place-items-center rounded-lg border border-[var(--em-line-strong)] bg-[rgba(16,185,54,0.18)] text-em-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
        <Icon name="layers" size={20} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[1.0625rem] font-semibold tracking-[-0.02em] text-mist-50">
          {invested ? "Invest again" : "Start Investing"}
        </span>
        <span className="mt-0.5 block text-[0.8125rem] leading-[1.5] text-[#bfe8c8]">
          Choose a plan and put your money to work.
        </span>
      </span>

      {/* The arrow leans toward the page it opens when the card is hovered. */}
      <span className="grid size-9 flex-none place-items-center rounded-full border border-[var(--em-line-strong)] bg-[rgba(16,185,54,0.2)] text-em-200 transition-transform duration-200 group-hover:translate-x-0.5">
        <Icon name="arrowRight" size={17} />
      </span>
    </Link>
  );
}
