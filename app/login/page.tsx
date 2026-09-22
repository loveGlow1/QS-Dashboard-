import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your QuickStark account to access your portfolio.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  /* Only ever carry an in-app path forward; the action re-checks this too. */
  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Access your portfolio"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="ml-1 inline-block py-3.5 -my-3.5 text-accent-400 underline decoration-transparent underline-offset-[3px] transition-colors hover:decoration-current">
            Create account
          </Link>
        </>
      }
    >
      <LoginForm next={target} />
    </AuthShell>
  );
}
