"use client";

import { useActionState, useState } from "react";
import { changeEmail, type SecurityActionState } from "@/app/security-actions";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

const INITIAL: SecurityActionState = { error: null };

/**
 * Change the sign-in email.
 *
 * The current password is required because the email is where a password
 * reset is sent: whoever controls it controls the account. The attempt
 * counter shown here is a courtesy — the limit itself is enforced in the
 * database, so closing the form or reloading the page does not restore a try.
 */
export function ChangeEmail({ current }: { current: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(changeEmail, INITIAL);
  const locked = Boolean(state.lockedUntil);

  if (!open) {
    return (
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.8125rem] leading-[1.6] text-mist-400">
          Changing your email changes where password resets are sent.
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
          Change email
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="mt-4 grid gap-3.5 border-t border-[var(--line-soft)] pt-4">
      <div className="grid gap-[7px]">
        <label htmlFor="next-email" className="text-[0.8125rem] font-medium text-mist-200">
          New email address
        </label>
        <input
          id="next-email"
          name="email"
          type="email"
          autoComplete="email"
          disabled={locked}
          placeholder={current}
          className="h-[46px] rounded-md border border-[var(--line)] bg-ink-800 px-3.5 text-[0.9375rem] outline-none focus:border-[var(--accent-line)] disabled:opacity-50 placeholder:text-mist-500"
        />
      </div>

      <div className="grid gap-[7px]">
        <label htmlFor="current-password" className="text-[0.8125rem] font-medium text-mist-200">
          Your current password
        </label>
        <input
          id="current-password"
          name="password"
          type="password"
          autoComplete="current-password"
          disabled={locked}
          className="h-[46px] rounded-md border border-[var(--line)] bg-ink-800 px-3.5 text-[0.9375rem] outline-none focus:border-[var(--accent-line)] disabled:opacity-50"
        />
        <p className="text-xs leading-[1.6] text-mist-500">
          Three incorrect attempts locks this for 20 minutes.
        </p>
      </div>

      {state.error && (
        <p className="flex items-start gap-2 rounded-md border border-[rgba(240,104,123,0.24)] bg-[var(--down-soft)] px-3.5 py-2.5 text-[0.8125rem] leading-[1.55] text-down">
          <Icon name="alert" size={15} className="mt-0.5 flex-none" />
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="flex items-start gap-2 rounded-md border border-[rgba(62,207,154,0.24)] bg-[var(--up-soft)] px-3.5 py-2.5 text-[0.8125rem] leading-[1.55] text-up">
          <Icon name="check" size={15} className="mt-0.5 flex-none" />
          {state.success}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="primary" size="sm" disabled={pending || locked}>
          {pending ? "Checking…" : "Change email"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
