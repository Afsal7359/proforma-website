import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the service role key.
 *
 * Every table has RLS enabled with zero policies, so the anon key can read
 * nothing. All data access flows through this client, behind our own session
 * layer (see `src/lib/session.ts`). Never import this into a client component.
 */

let cached: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function getSupabase(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local",
    );
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "x-application-name": "proforma-co" } },
  });

  return cached;
}

/**
 * Runs a query and returns a fallback instead of throwing when Supabase is
 * unreachable or unconfigured — used by the public site so a database outage
 * degrades to the built-in defaults rather than a 500.
 */
export async function safeQuery<T>(
  fn: (db: SupabaseClient) => Promise<T>,
  fallback: T,
): Promise<T> {
  if (!isSupabaseConfigured()) return fallback;
  try {
    return await fn(getSupabase());
  } catch (err) {
    console.error("[supabase] query failed, using fallback:", err);
    return fallback;
  }
}
