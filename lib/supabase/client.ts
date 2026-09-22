"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "./env";

/**
 * Browser client. Used only for interactive auth calls (sign in, sign up,
 * sign out) and realtime. Financial reads happen on the server so the page
 * renders with data already in hand.
 */
export function createClient() {
  return createBrowserClient(supabaseUrl(), supabaseAnonKey());
}
