import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { signOut } from "@/app/auth-actions";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Security" };

export default async function SecurityPage() {
  const user = await getUser();

  return (
    <>
      <PageHeader title="Security" subtitle="How your account is protected." />

      <div className="grid max-w-[640px] gap-4">
        <Card>
          <h2 className="mb-4 text-lg font-semibold tracking-[-0.02em]">Sign-in</h2>
          <dl className="grid gap-px overflow-hidden rounded-md bg-[var(--line-soft)]">
            <div className="flex flex-wrap items-baseline justify-between gap-3 bg-ink-800 px-4 py-3.5">
              <dt className="text-[0.8125rem] text-mist-400">Email</dt>
              <dd className="text-[0.8125rem] font-medium">{user?.email || "—"}</dd>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-3 bg-ink-800 px-4 py-3.5">
              <dt className="text-[0.8125rem] text-mist-400">Password</dt>
              <dd className="text-[0.8125rem] font-medium">Set</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h2 className="mb-2 text-lg font-semibold tracking-[-0.02em]">Sessions</h2>
          <p className="mb-4 text-[0.8125rem] leading-[1.65] text-mist-400">
            Signing out ends this session. If you think someone else has access
            to your account, sign out and change your password.
          </p>
          <form action={signOut}>
            <Button type="submit" variant="ghost">
              <Icon name="logout" size={16} />
              Sign out
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}
