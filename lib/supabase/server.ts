import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "./env";

/** A hung database must not hold a page render open indefinitely. */
const REQUEST_TIMEOUT_MS = 8000;

function timeoutFetch(input: RequestInfo | URL, init?: RequestInit) {
  return fetch(input, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
}

/**
 * Server client, bound to the request's cookies.
 *
 * Every read still passes through row level security — this is the signed-in
 * customer's own view of the database, not an escalated one.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl(), supabaseAnonKey(), {
    global: { fetch: timeoutFetch },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          /* Called from a Server Component, where cookies are read-only.
             The proxy refreshes the session instead, so this is safe to
             swallow. */
        }
      },
    },
  });
}

/**
 * The verified signed-in user, or null.
 *
 * Always `getUser()` and never `getSession()` on the server: getUser
 * revalidates the token against the auth server, whereas a session read
 * trusts the cookie as presented. For pages that decide what money to show,
 * that difference matters.
 *
 * An unreachable auth service resolves to null — signed out — rather than
 * throwing, so a public page still renders.
 */
export async function getUser() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data.user;
  } catch (error) {
    console.error("[supabase] getUser failed", error);
    return null;
  }
}
