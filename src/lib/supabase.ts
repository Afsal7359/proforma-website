import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { unstable_rethrow } from "next/navigation";

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
 * Turns a thrown value into something readable.
 *
 * Supabase's PostgrestError carries its fields non-enumerably, so
 * `console.error("...", err)` prints a bare `{}` — worse than useless when
 * you're trying to work out why the homepage fell back to its defaults.
 */
function describeError(err: unknown): string {
  if (err instanceof Error) {
    return `${err.name}: ${err.message}${
      err.cause ? ` (cause: ${String(err.cause)})` : ""
    }`;
  }
  if (err && typeof err === "object") {
    const e = err as Record<string, unknown>;
    const parts = ["message", "code", "details", "hint"]
      .filter((k) => e[k])
      .map((k) => `${k}=${String(e[k])}`);
    if (parts.length) return parts.join(" ");
    try {
      return JSON.stringify(err, Object.getOwnPropertyNames(err));
    } catch {
      return Object.prototype.toString.call(err);
    }
  }
  return String(err);
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
    // Next.js signals redirect(), notFound() and prerender interrupts by
    // throwing. Catching those would silently serve fallback content instead
    // of the real page, so hand them straight back to the framework.
    unstable_rethrow(err);

    console.error(
      `[supabase] query failed, serving built-in defaults instead — ${describeError(err)}`,
    );
    return fallback;
  }
}
