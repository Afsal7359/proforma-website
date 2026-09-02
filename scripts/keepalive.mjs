#!/usr/bin/env node
/**
 * Supabase keep-alive.
 *
 * A free-tier Supabase project pauses after roughly seven days with no
 * database activity, which would take the whole site down. This performs a
 * real write and a real read so the project always registers as active.
 *
 * Runs standalone — no Next.js server needed — so it works from GitHub
 * Actions, a server cron, or by hand:
 *
 *   node scripts/keepalive.mjs
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the
 * environment (or in .env.local, which this reads automatically).
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

/* ── load .env.local / .env when present (no dotenv dependency) ─────────── */
for (const file of [".env.local", ".env"]) {
  const path = join(process.cwd(), file);
  if (!existsSync(path)) continue;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL_BASE || !KEY) {
  console.error(
    "✗ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

const rest = (path) => `${URL_BASE.replace(/\/$/, "")}/rest/v1/${path}`;

async function main() {
  const startedAt = Date.now();

  // 1. Read the current counter.
  const readRes = await fetch(
    rest("keepalive_ping?id=eq.1&select=ping_count"),
    { headers },
  );
  if (!readRes.ok) {
    throw new Error(
      `Read failed: ${readRes.status} ${await readRes.text()}`,
    );
  }
  const rows = await readRes.json();
  const nextCount = Number(rows?.[0]?.ping_count ?? 0) + 1;

  // 2. Write — this is what actually counts as database activity.
  const writeRes = await fetch(rest("keepalive_ping"), {
    method: "POST",
    headers: { ...headers, Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({
      id: 1,
      pinged_at: new Date().toISOString(),
      ping_count: nextCount,
      source: process.env.KEEPALIVE_SOURCE ?? "script",
    }),
  });
  if (!writeRes.ok) {
    throw new Error(
      `Write failed: ${writeRes.status} ${await writeRes.text()}`,
    );
  }

  // 3. Touch a second table so its index stays warm too.
  const contentRes = await fetch(rest("site_content?select=key&limit=1"), {
    headers,
  });
  const contentOk = contentRes.ok;

  console.log(
    `✓ Supabase keep-alive ok · ping #${nextCount} · ${
      Date.now() - startedAt
    }ms · site_content ${contentOk ? "reachable" : "unreachable"}`,
  );
}

main().catch((err) => {
  console.error(`✗ Keep-alive failed: ${err.message}`);
  process.exit(1);
});
