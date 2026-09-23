import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a QuickStark account to start building your portfolio.",
};

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Start building your portfolio"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="ml-1 inline-block py-3.5 -my-3.5 text-accent-400 underline decoration-transparent underline-offset-[3px] transition-colors hover:decoration-current">
            Sign in
          </Link>
        </>
      }
    >
      {/* The form reads ?ref= to prefill an invite code, which opts it out of
          static prerendering. The boundary keeps the rest of the page static
          and the shell painted while the form resolves. */}
      <Suspense fallback={<div className="min-h-[420px]" />}>
        <SignupForm />
      </Suspense>
    </AuthShell>
  );
}
