"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient, getUser } from "@/lib/supabase/server";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";

/**
 * Security settings.
 *
 * Changing the address a password reset is sent to is an account takeover in
 * one step, so it is gated on the current password. The limit on guessing
 * that password is enforced in the database, not here: password_gate reads
 * failures recorded against the signed-in user, and the browser cannot clear
 * them — there is no update or delete path to that table for a customer.
 */

export interface SecurityActionState {
  error: string | null;
  success?: string | null;
  retriesLeft?: number | null;
  lockedUntil?: string | null;
}

interface Gate {
  locked: boolean;
  retries_left: number;
  locked_until: string | null;
}

function minutesUntil(iso: string): number {
  return Math.max(1, Math.ceil((new Date(iso).getTime() - Date.now()) / 60000));
}

/**
 * Confirms a password without disturbing the session in use.
 *
 * A throwaway client that persists nothing, so a correct password does not
 * replace the caller's session and a wrong one does not end it.
 */
async function passwordConfirmed(email: string, password: string): Promise<boolean> {
  if (!password) return false;
  try {
    const probe = createSupabaseClient(supabaseUrl(), supabaseAnonKey(), {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { error } = await probe.auth.signInWithPassword({ email, password });
    if (!error) await probe.auth.signOut();
    return !error;
  } catch {
    return false;
  }
}

export async function changeEmail(
  _prev: SecurityActionState,
  formData: FormData,
): Promise<SecurityActionState> {
  try {
    const user = await getUser();
    if (!user?.email) return { error: "You must be signed in." };

    const supabase = await createClient();

    /* Check the lock before the password, so a locked account does not get a
       free guess each time the form is posted. */
    const { data: gateRows } = await supabase.rpc("password_gate");
    const gate = (gateRows as Gate[] | null)?.[0];
    if (gate?.locked && gate.locked_until) {
      return {
        error: `Too many incorrect passwords. Try again in ${minutesUntil(gate.locked_until)} minutes.`,
        retriesLeft: 0,
        lockedUntil: gate.locked_until,
      };
    }

    const nextEmail = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    if (!nextEmail) return { error: "Enter the new email address." };
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(nextEmail)) {
      return { error: "That does not look like an email address." };
    }
    if (nextEmail === user.email.toLowerCase()) {
      return { error: "That is already your email address." };
    }
    if (!password) return { error: "Enter your current password." };

    if (!(await passwordConfirmed(user.email, password))) {
      await supabase.rpc("record_password_failure");
      const { data: afterRows } = await supabase.rpc("password_gate");
      const after = (afterRows as Gate[] | null)?.[0];

      if (after?.locked && after.locked_until) {
        return {
          error: `Incorrect password. Too many attempts — try again in ${minutesUntil(after.locked_until)} minutes.`,
          retriesLeft: 0,
          lockedUntil: after.locked_until,
        };
      }
      const left = after?.retries_left ?? 0;
      return {
        error: `Incorrect password. ${left} ${left === 1 ? "attempt" : "attempts"} left before this is locked for 20 minutes.`,
        retriesLeft: left,
      };
    }

    /* Supabase sends a confirmation link to the new address; the email does
       not change until that link is followed. Saying otherwise would have the
       customer believe a change that has not happened. */
    const { error } = await supabase.auth.updateUser({ email: nextEmail });
    if (error) return { error: error.message };

    revalidatePath("/security");
    return {
      error: null,
      success: `Check ${nextEmail} for a confirmation link. Your address changes once you follow it.`,
    };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "That could not be completed. Please try again." };
  }
}
