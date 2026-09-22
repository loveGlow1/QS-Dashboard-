import "server-only";

import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "@/lib/supabase/env";

/**
 * The service role client.
 *
 * This key bypasses row level security completely, so it is the one piece of
 * configuration that must never be committed and never reach the browser. The
 * `server-only` import above turns an accidental client import into a build
 * error rather than a leak, and there is deliberately no fallback default: a
 * deployment without the key fails loudly instead of quietly running with the
 * anon key and writing nothing.
 *
 * Only the deposit webhook uses this. Everything a customer does goes through
 * the request-scoped client in server.ts, under their own row level security.
 */
export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set; refusing to run a privileged operation.",
    );
  }
  return createClient(supabaseUrl(), key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function hasServiceRoleKey(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}
