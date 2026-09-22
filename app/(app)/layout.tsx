import { redirect } from "next/navigation";
import { AppShell } from "@/components/dashboard/AppShell";
import { getNotifications, getProfile } from "@/lib/data";
import { getUser } from "@/lib/supabase/server";

/**
 * The shell every signed-in page shares.
 *
 * The proxy already redirects an unauthenticated request before it reaches
 * here. This is the second gate: a layout that renders financial data does
 * not take the proxy's word for it.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login");

  const [profile, notifications] = await Promise.all([getProfile(), getNotifications()]);

  return (
    <AppShell profile={profile} notifications={notifications}>
      {children}
    </AppShell>
  );
}
