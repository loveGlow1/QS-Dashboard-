"use client";

import { useActionState } from "react";
import { signIn, type AuthState } from "@/app/auth-actions";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { FIELD_CLASS, LABEL_CLASS } from "./AuthShell";
import { PasswordField } from "./PasswordField";

const INITIAL: AuthState = { error: null };

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signIn, INITIAL);

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="next" value={next} />

      {state.error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-md border border-[rgba(240,104,123,0.26)] bg-[var(--down-soft)] px-3.5 py-3 text-[0.8125rem] leading-[1.5] text-[#f8b3bd]"
        >
          <Icon name="alert" size={16} className="mt-0.5 flex-none" />
          <span>{state.error}</span>
        </div>
      )}

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
        <PasswordField id="password" autoComplete="current-password" placeholder="Enter your password" />
      </div>

      <div className="-mt-0.5 flex items-center justify-between gap-3">
        <label className="inline-flex cursor-pointer select-none items-center gap-2.5 py-3 -my-3 text-[0.8125rem] text-mist-400">
          <input
            type="checkbox"
            name="remember"
            defaultChecked
            className="qs-check size-4 cursor-pointer rounded-[5px] border border-[var(--line-strong)] bg-ink-800 transition-colors checked:border-accent-500 checked:bg-accent-500"
          />
          Keep me signed in
        </label>
        <span className="text-[0.8125rem] text-mist-500">
          Forgot your password? Contact support.
        </span>
      </div>

      <Button type="submit" variant="primary" size="lg" block busy={pending} className="mt-1">
        Sign in
      </Button>
    </form>
  );
}
