"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { signUp, type AuthState } from "@/app/auth-actions";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { FIELD_CLASS, LABEL_CLASS } from "./AuthShell";
import { PasswordField } from "./PasswordField";

const INITIAL: AuthState = { error: null, notice: null };

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signUp, INITIAL);
  /* A referral link carries the code, so someone arriving from one does not
     have to copy it out of the URL. Typed codes are accepted just the same. */
  const invited = (useSearchParams().get("ref") ?? "").trim().toUpperCase();

  return (
    <form action={formAction} className="grid gap-4">
      {state.error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-md border border-[rgba(240,104,123,0.26)] bg-[var(--down-soft)] px-3.5 py-3 text-[0.8125rem] leading-[1.5] text-[#f8b3bd]"
        >
          <Icon name="alert" size={16} className="mt-0.5 flex-none" />
          <span>{state.error}</span>
        </div>
      )}

      {state.notice && (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-md border border-[var(--accent-line)] bg-[var(--accent-soft)] px-3.5 py-3 text-[0.8125rem] leading-[1.5] text-[#b9cbfb]"
        >
          <Icon name="mail" size={16} className="mt-0.5 flex-none" />
          <span>{state.notice}</span>
        </div>
      )}

      <div className="grid gap-[7px]">
        <label className={LABEL_CLASS} htmlFor="name">
          Full name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Your name"
          required
          className={FIELD_CLASS}
        />
      </div>

      <div className="grid gap-[7px]">
        <label className={LABEL_CLASS} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          spellCheck={false}
          required
          className={FIELD_CLASS}
        />
      </div>

      <div className="grid gap-[7px]">
        <label className={LABEL_CLASS} htmlFor="password">
          Password
        </label>
        <PasswordField id="password" autoComplete="new-password" placeholder="At least 8 characters" />
        <span className="text-xs text-mist-500">Use at least 8 characters.</span>
      </div>

      <div className="grid gap-[7px]">
        <label className={LABEL_CLASS} htmlFor="referral_code">
          Referral code <span className="font-normal text-mist-500">(optional)</span>
        </label>
        <input
          id="referral_code"
          name="referral_code"
          type="text"
          autoComplete="off"
          spellCheck={false}
          defaultValue={invited}
          placeholder="If someone invited you"
          className={`${FIELD_CLASS} uppercase placeholder:normal-case`}
        />
        <span className="text-xs text-mist-500">
          {invited
            ? "Applied from your invite link."
            : "Leave this blank if you came on your own."}
        </span>
      </div>

      <Button type="submit" variant="primary" size="lg" block busy={pending} className="mt-1">
        Create account
      </Button>
    </form>
  );
}
