"use client";

import { useActionState } from "react";
import { resendActivation } from "@/app/auth-actions";
import type { AuthState } from "@/app/auth-actions";

const INITIAL: AuthState = { error: null };

/**
 * Whether this account can move money, and what to do about it if not.
 *
 * Verification is email activation for now. The pill says which state the
 * account is in and the line under it says what the state means — the starter
 * tier when activated, the way out when not. The badge only reports what the
 * server decided; it grants nothing.
 */
export function VerificationBadge({ verified }: { verified: boolean }) {
  const [state, action, pending] = useActionState(resendActivation, INITIAL);

  if (verified) {
    return (
      <div className="grid justify-items-start gap-1.5 px-2.5">
        <span className="inline-flex h-6 items-center gap-1.5 rounded-full border border-[rgba(96,250,131,0.28)] bg-[var(--up-soft)] px-[9px] text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-up">
          <span className="size-1.5 rounded-full bg-current" />
          Verified
        </span>
        <p className="text-[0.6875rem] text-mist-500">Starter tier</p>
      </div>
    );
  }

  return (
    <div className="grid justify-items-start gap-1.5 px-2.5">
      <span className="inline-flex h-6 items-center gap-1.5 rounded-full border border-[rgba(233,184,114,0.28)] bg-[var(--warn-soft)] px-[9px] text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-warn">
        <span className="size-1.5 rounded-full bg-current" />
        Unverified
      </span>

      {state.notice ? (
        <p className="text-[0.6875rem] leading-[1.5] text-mist-400">{state.notice}</p>
      ) : (
        <form action={action}>
          <button
            type="submit"
            disabled={pending}
            className="text-left text-[0.6875rem] font-medium text-accent-300 underline-offset-2 transition-colors hover:underline disabled:opacity-60"
          >
            {pending ? "Sending…" : "Resend activation email"}
          </button>
        </form>
      )}

      {state.error && <p className="text-[0.6875rem] text-down">{state.error}</p>}
    </div>
  );
}
