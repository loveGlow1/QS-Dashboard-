import type { IconName } from "@/components/ui/Icon";

/**
 * One navigation definition, rendered by the sidebar, the account menu and
 * the mobile bar alike. Kept in a single place so a route cannot drift
 * between them — in the static build the chrome was copied into each page
 * and they did drift.
 */
export interface NavItem {
  href: string;
  icon: IconName;
  label: string;
  /** Shorter label for the mobile bar, where space is tight. */
  short?: string;
}

export const OVERVIEW: NavItem[] = [
  { href: "/dashboard", icon: "grid", label: "Dashboard", short: "Home" },
  { href: "/investments", icon: "chart", label: "Investments", short: "Invest" },
  { href: "/transactions", icon: "list", label: "Transactions", short: "Activity" },
  { href: "/withdraw", icon: "download", label: "Withdraw", short: "Withdraw" },
];

export const ACCOUNT: NavItem[] = [
  { href: "/profile", icon: "user", label: "Profile" },
  { href: "/security", icon: "shield", label: "Security" },
  { href: "/help", icon: "help", label: "Help" },
];
