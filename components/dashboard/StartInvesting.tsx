import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

/**
 * The one action an empty account is for.
 *
 * Shared by the phone dashboard and the portfolio card so the call to action
 * is the same object on every screen rather than a wide emerald card on one
 * and a small pill on the other — the same decision should not look like two
 * different weights of decision depending on the device.
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
      className={`relative flex items-center gap-3.5 overflow-hidden rounded-xl border border-[var(--em-line-strong)] bg-[linear-gradient(135deg,rgba(16,185,129,0.2),rgba(6,95,70,0.14)_52%,rgba(16,185,129,0.1))] px-4 py-4 shadow-[0_18px_44px_-26px_var(--em-glow),inset_0_1px_0_rgba(255,255,255,0.07)] transition-[transform,border-color] hover:border-[var(--color-em-400)] active:scale-[0.995] ${className}`}
    >
      <span className="grid size-11 flex-none place-items-center rounded-lg border border-[var(--em-line-strong)] bg-[rgba(16,185,129,0.16)] text-em-200">
        <Icon name="layers" size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[1.0625rem] font-semibold tracking-[-0.02em] text-mist-50">
          {invested ? "Invest again" : "Start Investing"}
        </span>
        <span className="mt-0.5 block text-[0.8125rem] leading-[1.5] text-[#bfe8d6]">
          Choose a plan and put your money to work.
        </span>
      </span>
      <span className="grid size-9 flex-none place-items-center rounded-full border border-[var(--em-line-strong)] bg-[rgba(16,185,129,0.18)] text-em-200">
        <Icon name="arrowRight" size={17} />
      </span>
    </Link>
  );
}
