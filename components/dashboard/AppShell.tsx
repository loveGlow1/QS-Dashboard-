"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { BottomNav, Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import type { Notification, Profile } from "@/lib/types";

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/investments": "Investments",
  "/transactions": "Transactions",
  "/deposit": "Deposit",
  "/withdraw": "Withdraw",
  "/profile": "Profile",
  "/security": "Security",
  "/help": "Help",
};

export function AppShell({
  profile,
  notifications,
  children,
}: {
  profile: Profile | null;
  notifications: Notification[];
  children: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const title = TITLES[pathname] ?? "QuickStark";

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 1024) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="min-h-screen bg-ink-900 [--dash-pad:clamp(18px,2.4vw,32px)] [background:radial-gradient(60%_40%_at_78%_-6%,rgba(16,185,54,0.1)_0%,rgba(16,185,54,0)_60%),var(--color-ink-900)]">
      <Sidebar
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        verified={Boolean(profile?.verified)}
      />

      <div className="flex min-h-screen flex-col min-[1025px]:ml-[var(--spacing-rail)]">
        <Topbar
          title={title}
          profile={profile}
          notifications={notifications}
          onOpenMenu={() => setMenuOpen(true)}
        />
        <main className="w-full max-w-[1320px] flex-1 px-[var(--dash-pad)] pb-12 pt-[var(--dash-pad)] max-[720px]:pb-24">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
