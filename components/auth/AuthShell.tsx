import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { Icon } from "@/components/ui/Icon";

/** The visual frame shared by login and signup. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-ink-900">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -top-[30%] left-1/2 z-0 aspect-[1.2/1] w-[min(1000px,140vw)] -translate-x-1/2 blur-[4px]"
        style={{
          background:
            "radial-gradient(46% 46% at 50% 44%, rgba(16,185,129,0.26) 0%, rgba(16,185,129,0) 70%), radial-gradient(40% 42% at 24% 34%, rgba(4,120,87,0.2) 0%, rgba(4,120,87,0) 74%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(148,168,214,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,168,214,0.045) 1px, transparent 1px)",
          backgroundSize: "74px 74px",
          maskImage: "radial-gradient(58% 52% at 50% 36%, #000 0%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(58% 52% at 50% 36%, #000 0%, transparent 80%)",
        }}
      />

      <Link
        href="/"
        className="relative z-[2] mx-0 mt-[22px] inline-flex items-center gap-1.5 self-start rounded-full border border-[var(--line-soft)] bg-[rgba(15,22,41,0.6)] py-2 max-[720px]:min-h-[44px] pl-2.5 pr-3.5 text-[0.8125rem] text-mist-400 backdrop-blur-[8px] transition-colors hover:border-[var(--line-strong)] hover:bg-ink-800 hover:text-mist-50 max-[560px]:ml-4 max-[560px]:mt-4 min-[561px]:ml-[22px]"
      >
        <Icon name="chevronLeft" size={16} />
        Back to site
      </Link>

      <main className="relative z-[1] grid flex-1 place-items-center px-5 pb-[clamp(40px,6vw,72px)] pt-[clamp(28px,5vw,56px)]">
        <section className="w-full max-w-[424px] rounded-xl border border-[var(--line-strong)] bg-gradient-to-b from-[rgba(20,28,51,0.72)] to-[rgba(11,17,34,0.94)] p-[clamp(28px,4vw,38px)] shadow-[0_40px_90px_-40px_rgba(2,5,12,0.9)] backdrop-blur-[20px] max-[560px]:rounded-lg max-[560px]:px-5 max-[560px]:pb-6 max-[560px]:pt-[26px]">
          <div className="flex justify-center">
            <Logo size="lg" href={null} id="auth" />
          </div>

          <header className="my-6 text-center">
            <h1 className="text-[1.625rem] font-semibold leading-[1.2] tracking-[-0.03em] max-[560px]:text-[1.4375rem]">
              {title}
            </h1>
            <p className="mt-[7px] text-sm text-mist-400">{subtitle}</p>
          </header>

          {children}

          <p className="mt-[22px] text-center text-[0.8125rem] text-mist-400">{footer}</p>
        </section>
      </main>
    </div>
  );
}

/** Shared field styling so both forms stay identical. */
export const FIELD_CLASS =
  "h-[46px] w-full rounded-md border border-[var(--line)] bg-ink-800 px-3.5 text-[0.9375rem] text-mist-50 transition-[border-color,background-color,box-shadow] placeholder:text-mist-500 hover:border-[var(--line-strong)] focus:border-[var(--accent-line)] focus:bg-ink-700 focus:outline-none focus:ring-[3px] focus:ring-[var(--accent-soft)]";

export const LABEL_CLASS = "text-[0.8125rem] font-medium text-mist-200";
