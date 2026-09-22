import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { getProfile } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const [profile, user] = await Promise.all([getProfile(), getUser()]);

  /* Tier and verification are facts the server owns; they are shown, never
     offered as fields. */
  const rows = [
    { label: "Name", value: profile?.full_name || "—" },
    { label: "Email", value: user?.email || "—" },
    { label: "Account type", value: profile?.tier || "—" },
    { label: "Member since", value: profile ? formatDate(profile.created_at) : "—" },
  ];

  return (
    <>
      <PageHeader title="Profile" subtitle="Your account details." />
      <Card className="max-w-[640px]">
        <dl className="grid gap-px overflow-hidden rounded-md bg-[var(--line-soft)]">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex flex-wrap items-baseline justify-between gap-3 bg-ink-800 px-4 py-3.5"
            >
              <dt className="text-[0.8125rem] text-mist-400">{row.label}</dt>
              <dd className="text-[0.8125rem] font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs leading-[1.6] text-mist-500">
          To change your name or account details, contact support from the Help
          page.
        </p>
      </Card>
    </>
  );
}
