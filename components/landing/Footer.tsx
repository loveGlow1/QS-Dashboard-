import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

const COLUMNS: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: "Platform",
    links: [
      { href: "/#how", label: "How It Works" },
      { href: "/#investments", label: "Investments" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/#about", label: "About" },
      { href: "/help", label: "Contact" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/legal/terms", label: "Terms" },
      { href: "/legal/privacy", label: "Privacy" },
      { href: "/legal/risk", label: "Risk Disclosure" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-[var(--line)] bg-ink-950 pb-7 pt-[clamp(44px,5vw,64px)]">
      <div className="mx-auto w-full max-w-[1180px] px-6">
        <div className="grid gap-[clamp(32px,5vw,72px)] pb-9 min-[761px]:grid-cols-[minmax(0,1.2fr)_minmax(0,1.6fr)]">
          <div>
            <Logo id="footer" />
            <p className="mt-4 max-w-[34ch] text-[0.8125rem] leading-[1.68] text-mist-500">
              An investment platform for building a portfolio, tracking how it
              performs and managing eligible withdrawals from one account.
            </p>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-6 min-[461px]:grid-cols-3">
            {COLUMNS.map((col) => (
              <div key={col.heading} className="grid content-start gap-[11px]">
                <h2 className="mb-[3px] text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-mist-400">
                  {col.heading}
                </h2>
                {col.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="inline-flex items-center justify-self-start text-[0.8125rem] text-mist-500 transition-colors hover:text-mist-200 max-[720px]:min-h-[44px]"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line-soft)] pt-6 text-xs text-mist-500">
          <p>&copy; {new Date().getFullYear()} QuickStark. All rights reserved.</p>
          <p>Investing carries risk, including the risk of losing money.</p>
        </div>
      </div>
    </footer>
  );
}
