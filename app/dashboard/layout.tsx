import { redirect } from "next/navigation";
import { AppShell } from "@/components/dashboard/AppShell";
import { getNotifications, getProfile } from "@/lib/data";
import { getUser } from "@/lib/supabase/server";

/**
 * The proxy already redirects an unauthenticated request before it reaches
 * here. This is the second gate: a layout that renders financial data does
 * not take the proxy's word for it.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login?next=/dashboard");

  const [profile, notifications] = await Promise.all([getProfile(), getNotifications()]);

  return (
    <AppShell title="Dashboard" profile={profile} notifications={notifications}>
      {children}
    </AppShell>
  );
}
