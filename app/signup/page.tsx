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
          <Link href="/login" className="ml-1 text-accent-400 underline decoration-transparent underline-offset-[3px] transition-colors hover:decoration-current">
            Sign in
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}
