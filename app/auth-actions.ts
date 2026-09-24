"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Authentication actions.
 *
 * A Server Action runs as a POST against the page that invokes it, and that
 * route is reachable by anyone who can send the same request. Every input
 * below is therefore treated as untrusted and re-validated here, regardless
 * of what the form component already checked.
 *
 * Credentials go straight to Supabase Auth, which sets the session cookie.
 * Nothing about identity is decided in the browser.
 */

export interface AuthState {
  error: string | null;
  notice?: string | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Turns a provider error into something worth showing a person. */
function readable(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "That email and password do not match an account.";
  if (m.includes("email not confirmed")) return "Confirm your email address, then sign in.";
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "An account with that email already exists. Sign in instead.";
  }
  if (m.includes("password") && /least|short|weak/.test(m)) {
    return "Choose a password of at least 8 characters.";
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Too many attempts. Wait a moment and try again.";
  }
  if (m.includes("fetch") || m.includes("network")) {
    return "We could not reach the server. Check your connection and try again.";
  }
  return "Something went wrong. Please try again.";
}

/** Only ever redirect to a path inside this app. */
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address." };
  if (!password) return { error: "Enter your password." };

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: readable(error.message) };
  } catch {
    return { error: "We could not reach the server. Check your connection and try again." };
  }

  /* redirect throws a control-flow exception, so it must sit outside the
     try block or the catch above would swallow the navigation. */
  redirect(next);
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const fullName = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  /* Normalised here so a pasted code with stray spaces or in lower case still
     matches. An unknown code is not an error: the database links nothing and
     the account is still created, because failing a sign-up over a mistyped
     referral is worse than losing the referral. */
  const referralCode = String(formData.get("referral_code") ?? "")
    .trim()
    .toUpperCase();

  if (!fullName) return { error: "Enter your name." };
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address." };
  if (password.length < 8) return { error: "Choose a password of at least 8 characters." };

  let needsConfirmation = false;

  try {
    const supabase = await createClient();
    /* The profile row and welcome notification are provisioned by a database
       trigger on the server. This never writes a row itself. */
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          ...(referralCode ? { referral_code: referralCode } : {}),
        },
      },
    });
    if (error) return { error: readable(error.message) };
    needsConfirmation = !data.session;
  } catch {
    return { error: "We could not reach the server. Check your connection and try again." };
  }

  if (needsConfirmation) {
    return {
      error: null,
      notice: "Check your email to confirm your address, then sign in.",
    };
  }

  redirect("/dashboard");
}

export async function signOut() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    /* Already signed out, or the service is unreachable. Either way the
       visitor is going back to the login page. */
  }
  redirect("/login");
}

/**
 * Sends the activation email again.
 *
 * Supabase decides whether there is anything to send: an address that is
 * already activated gets nothing. The reply is deliberately the same either
 * way, so this cannot be used to find out which addresses have accounts.
 */
export async function resendActivation(): Promise<AuthState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return { error: "You must be signed in." };

  await supabase.auth.resend({ type: "signup", email: user.email });

  return {
    error: null,
    notice: "Activation email sent. Check your inbox, and your spam folder.",
  };
}
