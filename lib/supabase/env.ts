/**
 * Supabase environment resolution.
 *
 * The publishable (anon) key is designed to ship in the browser: it grants
 * nothing on its own, because every table is behind row level security keyed
 * on the verified user id in the access token. The service role key is the
 * opposite — it bypasses RLS entirely and is read only from server modules.
 *
 * Project defaults are committed deliberately. `NEXT_PUBLIC_*` values are
 * inlined at build time, so a deployment that builds without them produces a
 * bundle that can never reach the database no matter what is set afterwards.
 * Carrying the project's own public identifiers here keeps a fresh clone and
 * a fresh deploy working, exactly as the static build did, while an
 * environment variable still wins wherever one is set.
 */

const DEFAULT_URL = "https://ihbwmebrflqkpchiqbpu.supabase.co";
const DEFAULT_ANON_KEY = "sb_publishable_Vkvk3jTSPh1zGlmmNVs50Q_E-3qLzJW";

export function supabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL;
}

export function supabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;
}

/**
 * Whether this build was given its own Supabase configuration.
 *
 * False means the defaults above are in play. That is fine for this project,
 * but a fork pointing at someone else's database is not, so the server says
 * so once at startup rather than failing a request.
 */
export function isConfiguredFromEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
