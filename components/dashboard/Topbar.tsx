"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { Icon } from "@/components/ui/Icon";
import { formatDate, initials, titleCase } from "@/lib/format";
import { ACCOUNT } from "./nav";
import { signOut } from "@/app/auth-actions";
import type { IconName } from "@/components/ui/Icon";
import type { Notification, Profile } from "@/lib/types";

function isIcon(name: string): name is IconName {
  return ["trendUp", "bank", "shield", "info", "bell", "wallet", "layers", "check"].includes(name);
}

export function Topbar({
  title,
  profile,
  notifications,
  onOpenMenu,
}: {
  title: string;
  profile: Profile | null;
  notifications: Notification[];
  onOpenMenu: () => void;
}) {
  const [open, setOpen] = useState<"notifications" | "account" | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  /* One popover at a time; click-away and Escape both close. */
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (hostRef.current && !hostRef.current.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const unread = notifications.some((n) => n.unread);
  const name = titleCase(profile?.full_name || "") || "Your account";

  return (
    <header className="sticky top-0 z-40 flex h-[66px] items-center gap-3.5 border-b border-[var(--line)] bg-[rgba(6,10,22,0.82)] px-[var(--dash-pad)] backdrop-blur-[16px] backdrop-saturate-[140%] max-[720px]:h-[60px]">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open menu"
        className="hidden size-[38px] place-items-center rounded-md border border-[var(--line)] bg-ink-800 text-mist-200 max-[1024px]:grid max-[720px]:hidden"
      >
        <Icon name="menu" size={20} />
      </button>

      <div className="flex min-w-0 items-center gap-3">
        <span className="hidden max-[720px]:block">
          <Logo size="sm" href="/dashboard" id="topbar" />
        </span>
        <h1 className="text-[0.9375rem] font-semibold tracking-[-0.015em] max-[720px]:hidden">{title}</h1>
      </div>

      <div ref={hostRef} className="ml-auto flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen(open === "notifications" ? null : "notifications")}
            aria-expanded={open === "notifications"}
            aria-label="Notifications"
            className="relative grid size-[38px] place-items-center rounded-md border border-[var(--line)] bg-ink-800 text-mist-400 transition-colors hover:border-[var(--line-strong)] hover:bg-ink-700 hover:text-mist-50"
          >
            <Icon name="bell" size={19} />
            {unread && (
              <span className="absolute right-[9px] top-2 size-[7px] rounded-full border-2 border-ink-900 bg-accent-500 max-[720px]:bg-em-400" />
            )}
          </button>

          {open === "notifications" && (
            <div className="absolute right-0 top-[calc(100%+9px)] z-[60] w-[min(330px,calc(100vw-32px))] rounded-lg border border-[var(--line-strong)] bg-ink-700 p-[7px] shadow-[0_40px_90px_-40px_rgba(2,5,12,0.9)] max-[720px]:fixed max-[720px]:inset-x-3 max-[720px]:top-[68px] max-[720px]:w-auto">
              <header className="flex items-center justify-between gap-2.5 px-[11px] py-2.5">
                <h2 className="text-[0.8125rem] font-semibold">Notifications</h2>
              </header>

              {notifications.length === 0 ? (
                <div className="grid justify-items-center gap-2.5 px-5 py-8 text-center text-mist-400">
                  <Icon name="bell" size={28} className="text-mist-500" />
                  <p className="text-[0.8125rem]">Nothing new right now.</p>
                </div>
              ) : (
                <ul className="grid max-h-[340px] gap-px overflow-y-auto">
                  {notifications.map((n) => (
                    <li
                      key={n.id}
                      className="relative flex gap-2.5 rounded-sm p-[11px] transition-colors hover:bg-ink-600"
                    >
                      <span className="grid size-[30px] flex-none place-items-center rounded-sm bg-[var(--accent-soft)] text-accent-300">
                        <Icon name={isIcon(n.icon) ? n.icon : "info"} size={15} />
                      </span>
                      <span className="grid min-w-0 gap-0.5">
                        <strong className="text-[0.8125rem] font-medium text-mist-50">{n.title}</strong>
                        <small className="text-xs leading-[1.45] text-mist-400">{n.body}</small>
                        <span className="mt-0.5 text-[0.6875rem] text-mist-500">{formatDate(n.created_at)}</span>
                      </span>
                      {n.unread && (
                        <span className="absolute right-[11px] top-[15px] size-1.5 rounded-full bg-accent-500" />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen(open === "account" ? null : "account")}
            aria-expanded={open === "account"}
            aria-label="Account menu"
            className="grid size-[38px] cursor-pointer place-items-center rounded-full border border-[var(--accent-line)] bg-gradient-to-br from-accent-700 to-accent-500 text-xs font-semibold text-white transition-shadow hover:shadow-[0_0_0_3px_var(--accent-soft)] max-[720px]:border-[var(--em-line-strong)] max-[720px]:from-em-600 max-[720px]:to-em-400"
          >
            {initials(name)}
          </button>

          {open === "account" && (
            <div className="absolute right-0 top-[calc(100%+9px)] z-[60] w-[232px] rounded-lg border border-[var(--line-strong)] bg-ink-700 p-[7px] shadow-[0_40px_90px_-40px_rgba(2,5,12,0.9)]">
              <header className="flex items-center gap-2.5 px-[11px] py-2.5">
                <span className="grid size-8 flex-none place-items-center rounded-full bg-gradient-to-br from-accent-700 to-accent-500 text-[0.6875rem] font-semibold text-white">
                  {initials(name)}
                </span>
                <span className="grid min-w-0">
                  <strong className="truncate text-[0.8125rem] font-semibold">{name}</strong>
                  <small className="truncate text-[0.6875rem] text-mist-500">{profile?.tier ?? ""}</small>
                </span>
              </header>

              <div className="grid gap-px">
                {ACCOUNT.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(null)}
                    className="flex items-center gap-2.5 rounded-sm px-[11px] py-[9px] text-[0.8125rem] text-mist-200 transition-colors hover:bg-ink-600 hover:text-mist-50"
                  >
                    <Icon name={item.icon} size={16} className="flex-none text-mist-500" />
                    {item.label}
                  </Link>
                ))}
              </div>

              <form action={signOut} className="mt-[5px] grid gap-px border-t border-[var(--line-soft)] pt-1.5">
                <button
                  type="submit"
                  className="flex items-center gap-2.5 rounded-sm px-[11px] py-[9px] text-left text-[0.8125rem] text-mist-200 transition-colors hover:bg-[var(--down-soft)] hover:text-down"
                >
                  <Icon name="logout" size={16} className="flex-none text-mist-500" />
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
