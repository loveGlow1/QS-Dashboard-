"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

const NAV = [
  { href: "#how", label: "How It Works" },
  { href: "#investments", label: "Investments" },
  { href: "#about", label: "About" },
  { href: "#faq", label: "FAQ" },
];

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Lock the page behind the drawer, and make Escape close it. */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 900) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[60] flex h-[var(--spacing-header)] items-center border-b transition-[background-color,border-color,backdrop-filter] duration-200 ${
          scrolled
            ? "border-[var(--line-soft)] bg-[rgba(6,10,22,0.82)] backdrop-blur-[16px] backdrop-saturate-[140%]"
            : "border-transparent"
        }`}
      >
        {/* Three columns with equal outer tracks, so the centre one lands on
            the container's midline no matter how wide the logo or the buttons
            are. A flex row with mx-auto centres the nav in whatever space is
            left over instead, which put it 99.5px left of the hero beneath it.
            Every child names its column, so the ones that are hidden at a
            given width cannot shift the others along. */}
        <div className="mx-auto grid w-full max-w-[1180px] grid-cols-[1fr_auto_1fr] items-center gap-5 px-6">
          <div className="col-start-1 justify-self-start">
            <Logo />
          </div>

          <nav
            aria-label="Primary"
            className="col-start-2 hidden items-center gap-1 rounded-full border border-[var(--line-soft)] bg-[rgba(15,22,41,0.6)] p-1 backdrop-blur-[10px] min-[901px]:flex"
          >
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-[15px] py-[7px] text-[0.8125rem] font-medium text-mist-400 transition-colors hover:text-mist-50"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="col-start-3 hidden items-center gap-1.5 justify-self-end min-[421px]:flex">
            {signedIn ? (
              <ButtonLink href="/dashboard" variant="primary" size="sm">
                Go to dashboard
              </ButtonLink>
            ) : (
              <>
                <ButtonLink href="/login" variant="quiet" className="max-[900px]:hidden">
                  Login
                </ButtonLink>
                <ButtonLink href="/signup" variant="primary" size="sm">
                  Get Started
                </ButtonLink>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="col-start-3 grid size-10 place-content-center items-center gap-[5px] justify-self-end rounded-md border border-[var(--line)] bg-ink-800 min-[901px]:hidden"
          >
            <span
              className={`block h-[1.6px] w-4 rounded-sm bg-mist-200 transition-transform duration-200 ${open ? "translate-y-[3.3px] rotate-45" : ""}`}
            />
            <span
              className={`block h-[1.6px] w-4 rounded-sm bg-mist-200 transition-transform duration-200 ${open ? "-translate-y-[3.3px] -rotate-45" : ""}`}
            />
          </button>
        </div>
      </header>

      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-[70] bg-[rgba(3,6,14,0.66)] backdrop-blur-[3px] transition-opacity duration-200 min-[901px]:hidden ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      />

      <div
        id="mobile-nav"
        className={`fixed inset-x-3 top-3 z-[80] origin-top rounded-xl border border-[var(--line-strong)] bg-ink-850 p-[18px] shadow-[0_40px_90px_-40px_rgba(2,5,12,0.9)] transition-all duration-200 min-[901px]:hidden ${
          open ? "visible translate-y-0 scale-100 opacity-100" : "invisible -translate-y-3.5 scale-[0.98] opacity-0"
        }`}
      >
        <nav aria-label="Mobile" className="mb-4 grid gap-0.5 pt-[42px]">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3.5 py-3 text-[0.9375rem] font-medium text-mist-200 transition-colors hover:bg-ink-800 hover:text-mist-50"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="grid gap-2">
          {signedIn ? (
            <ButtonLink href="/dashboard" variant="primary" block onClick={() => setOpen(false)}>
              Go to dashboard
            </ButtonLink>
          ) : (
            <>
              <ButtonLink href="/login" variant="ghost" block onClick={() => setOpen(false)}>
                Login
              </ButtonLink>
              <ButtonLink href="/signup" variant="primary" block onClick={() => setOpen(false)}>
                Get Started
              </ButtonLink>
            </>
          )}
        </div>
      </div>
    </>
  );
}
