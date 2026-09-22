/**
 * Supabase environment resolution.
 *
 * The publishable (anon) key is designed to ship in the browser — it grants
 * nothing on its own, because every table is behind row level security keyed
 * on the verified user id in the access token. The service role key is the
 * opposite: it bypasses RLS entirely and must never reach the client bundle,
 * so it is read only from server-side modules.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
}

export function supabaseUrl(): string {
  return required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function supabaseAnonKey(): string {
  return required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
