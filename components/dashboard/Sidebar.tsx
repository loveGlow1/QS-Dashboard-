"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { Icon } from "@/components/ui/Icon";
import { ACCOUNT, MONEY, OVERVIEW, type NavItem } from "./nav";
import { signOut } from "@/app/auth-actions";

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = pathname === item.href;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`relative flex w-full items-center gap-2.5 rounded-md p-2.5 text-sm font-medium transition-colors ${
        active
          ? "bg-[var(--accent-soft)] text-accent-300 before:absolute before:-left-3.5 before:top-1/2 before:h-[18px] before:w-[3px] before:-translate-y-1/2 before:rounded-r-[3px] before:bg-accent-500 before:content-['']"
          : "text-mist-400 hover:bg-ink-800 hover:text-mist-50"
      }`}
    >
      <Icon name={item.icon} size={18} className="flex-none" />
      {item.label}
    </Link>
  );
}

export function Sidebar({
  open,
  onClose,
  tier,
}: {
  open: boolean;
  onClose: () => void;
  tier: string;
}) {
  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-[45] bg-[rgba(3,6,14,0.7)] backdrop-blur-[3px] transition-opacity duration-200 min-[1025px]:hidden ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[var(--spacing-rail)] flex-col border-r border-[var(--line)] bg-ink-950 px-3.5 pb-4 pt-5 transition-[transform,visibility] duration-200 max-[1024px]:w-[min(290px,84vw)] max-[1024px]:shadow-[0_40px_90px_-40px_rgba(2,5,12,0.9)] ${
          open ? "translate-x-0 visible" : "max-[1024px]:invisible max-[1024px]:-translate-x-[102%]"
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-2 pb-[22px]">
          <Logo href={null} id="rail" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="grid size-[34px] place-items-center rounded-sm text-mist-400 transition-colors hover:bg-ink-800 hover:text-mist-50 min-[1025px]:hidden"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <nav aria-label="Account sections" className="-mx-1 grid flex-1 content-start gap-0.5 overflow-y-auto px-1">
          <p className="mb-[7px] px-2.5 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-mist-500">
            Overview
          </p>
          {OVERVIEW.map((item) => (
            <NavLink key={item.href} item={item} onNavigate={onClose} />
          ))}

          <p className="mb-[7px] mt-[18px] px-2.5 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-mist-500">
            Money
          </p>
          {MONEY.map((item) => (
            <NavLink key={item.href} item={item} onNavigate={onClose} />
          ))}

          <p className="mb-[7px] mt-[18px] px-2.5 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-mist-500">
            Account
          </p>
          {ACCOUNT.map((item) => (
            <NavLink key={item.href} item={item} onNavigate={onClose} />
          ))}
        </nav>

        <div className="grid gap-3 border-t border-[var(--line-soft)] pt-3.5">
          <div className="grid justify-items-start gap-1.5 px-2.5">
            <p className="text-[0.6875rem] text-mist-500">{tier}</p>
          </div>

          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-md p-2.5 text-left text-sm font-medium text-mist-500 transition-colors hover:bg-[var(--down-soft)] hover:text-down"
            >
              <Icon name="logout" size={18} className="flex-none" />
              Sign out
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Sections"
      className="fixed inset-x-0 bottom-0 z-[44] grid grid-cols-4 border-t border-[var(--line)] bg-[rgba(4,7,15,0.94)] px-1.5 pb-[calc(7px+env(safe-area-inset-bottom))] pt-[7px] backdrop-blur-[18px] min-[721px]:hidden"
    >
      {[...OVERVIEW, MONEY[0]!].map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`grid justify-items-center gap-1 rounded-sm px-1 py-[7px] text-[0.625rem] font-medium transition-colors ${
              active ? "text-em-300" : "text-mist-500 hover:text-mist-200"
            }`}
          >
            <Icon name={item.icon} size={20} />
            {item.short ?? item.label}
            <span
              aria-hidden="true"
              className={`h-[2px] w-6 rounded-full ${active ? "bg-em-400" : "bg-transparent"}`}
            />
          </Link>
        );
      })}
    </nav>
  );
}
