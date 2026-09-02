import { NextResponse } from "next/server";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { getSession } from "@/lib/session";

/**
 * Daily keep-alive.
 *
 * A free-tier Supabase project pauses after ~7 days with no database activity,
 * which would take the whole site down. This endpoint performs a real write and
 * a real read every day so the project always looks active.
 *
 * Called by:
 *   • Vercel Cron        — see vercel.json  (sends `Authorization: Bearer $CRON_SECRET`)
 *   • GitHub Actions     — see .github/workflows/supabase-keepalive.yml
 *   • `npm run keepalive`— for a manual poke
 */

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function authorised(req: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET;

  // With no secret configured the endpoint stays open — it only writes a
  // heartbeat row, but set CRON_SECRET in production anyway.
  if (!secret) return true;

  // Vercel Cron and GitHub Actions send the secret as a bearer token.
  const header = req.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;

  const url = new URL(req.url);
  if (url.searchParams.get("secret") === secret) return true;

  // A signed-in admin pressing "Run A Ping Now" in Settings & Health. Without
  // this, setting CRON_SECRET would break that button.
  const session = await getSession();
  return session?.role === "admin";
}

async function ping(req: Request) {
  if (!(await authorised(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Supabase not configured" },
      { status: 503 },
    );
  }

  const startedAt = Date.now();
  const db = getSupabase();

  try {
    // 1. Write — the part that actually counts as database activity.
    const { data: current } = await db
      .from("keepalive_ping")
      .select("ping_count")
      .eq("id", 1)
      .maybeSingle();

    const nextCount = Number(current?.ping_count ?? 0) + 1;

    const { error: writeError } = await db.from("keepalive_ping").upsert({
      id: 1,
      pinged_at: new Date().toISOString(),
      ping_count: nextCount,
      source: req.headers.get("x-ping-source") ?? "cron",
    });
    if (writeError) throw writeError;

    // 2. Read — touches a second table so an index stays warm too.
    const { count, error: readError } = await db
      .from("site_content")
      .select("key", { count: "exact", head: true });
    if (readError) throw readError;

    return NextResponse.json({
      ok: true,
      pingCount: nextCount,
      sections: count ?? 0,
      ms: Date.now() - startedAt,
      at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[keepalive] failed", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

export const GET = ping;
export const POST = ping;
