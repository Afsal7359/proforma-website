#!/usr/bin/env node
/**
 * Applies the SQL migrations to Supabase and creates the first admin login.
 *
 *   npm run db:push          # migrations + admin user
 *   npm run db:seed          # the above, plus demo trials/plans/videos
 *
 * Needs SUPABASE_DB_URL (Supabase → Project Settings → Database → Connection
 * string → URI). Everything else is read from .env.local.
 *
 * Safe to re-run: the migration is idempotent and the admin user is upserted.
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import bcrypt from "bcryptjs";

/* ── env ────────────────────────────────────────────────────────────────── */
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

const DB_URL = process.env.SUPABASE_DB_URL;

const WHERE =
  "  Supabase → Project Settings → Database → Connection string → URI\n" +
  "  It looks like:  postgresql://postgres:PASSWORD@db.<ref>.supabase.co:5432/postgres";

if (!DB_URL || DB_URL.startsWith("PASTE_")) {
  console.error(`✗ SUPABASE_DB_URL is not set.\n${WHERE}`);
  process.exit(1);
}

// The commonest mistake is pasting the project URL (https://<ref>.supabase.co)
// here. That is the REST endpoint, not the Postgres connection string.
if (!/^postgres(ql)?:\/\//.test(DB_URL)) {
  console.error(
    "✗ SUPABASE_DB_URL is not a Postgres connection string.\n" +
      `  Got: ${DB_URL.split("@").pop()}\n` +
      "  That looks like the project URL / REST endpoint — a different thing.\n" +
      `  You want the one starting with "postgresql://".\n${WHERE}`,
  );
  process.exit(1);
}

if (DB_URL.includes("[YOUR-PASSWORD]") || DB_URL.includes(":PASSWORD@")) {
  console.error(
    "✗ SUPABASE_DB_URL still has the password placeholder in it.\n" +
      "  Replace [YOUR-PASSWORD] with your real database password.\n" +
      "  Project Settings → Database → Database password (reset it if unknown).\n" +
      "  If it contains @ : / # ? or %, URL-encode it:\n" +
      "    node -e \"console.log(encodeURIComponent(process.argv[1]))\" 'yourpassword'",
  );
  process.exit(1);
}

const withDemo = process.argv.includes("--seed");
const ADMIN_LOGIN = process.env.SEED_ADMIN_LOGIN || "admin";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "ChangeMe@123";

const client = new pg.Client({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  console.log("→ Connected to Postgres");

  /* ── 1. migrations ── */
  const dir = join(process.cwd(), "supabase", "migrations");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    process.stdout.write(`→ Applying ${file} … `);
    await client.query(readFileSync(join(dir, file), "utf8"));
    console.log("done");
  }

  /* ── 2. first admin ── */
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const { rows } = await client.query(
    `insert into app_users (role, login_id, password_hash, full_name, must_change_password)
     values ('admin', $1, $2, 'Proforma Admin', false)
     on conflict (login_id) do update set password_hash = excluded.password_hash
     returning id, login_id`,
    [ADMIN_LOGIN, hash],
  );
  console.log(`→ Admin login ready: ${rows[0].login_id}`);

  /* ── 3. optional demo data ── */
  if (withDemo) {
    await seedDemo();
  }

  console.log("\n✓ Database ready.\n");
  console.log(`  Log in at /login`);
  console.log(`    Login ID : ${ADMIN_LOGIN}`);
  console.log(`    Password : ${ADMIN_PASSWORD}`);
  console.log(
    `\n  Then open Admin → Site Content → "Load Defaults Into CMS" to make`,
  );
  console.log(`  every word on the homepage editable.\n`);
}

async function seedDemo() {
  console.log("→ Seeding demo catalogue …");

  const plans = [
    ["Starter", "starter", "For players starting structured training.", 1499, 14990,
      "≈ ₹1,249 / month billed yearly",
      ["Position-specific home training library", "Trial calendar access + slot alerts",
        "Monthly progress score", "Community drill challenges"],
      null, false, "Choose Starter", 1],
    ["Pro", "pro", "Most players on the pathway choose this.", 3499, 34990,
      "≈ ₹2,916 / month billed yearly",
      ["Everything in Starter", "Full performance tracking — radar + trend",
        "Nutrition & weight management plan", "Live monthly coach review call"],
      "Most Booked", true, "Choose Pro", 2],
    ["Elite", "elite", "For trial-ready athletes.", 7999, 79990,
      "≈ ₹6,666 / month billed yearly",
      ["Everything in Pro", "1:1 career pathway guidance", "Priority scouting introductions",
        "Unlimited trial slot bookings", "Direct coach WhatsApp line"],
      null, false, "Choose Elite", 3],
  ];

  for (const p of plans) {
    await client.query(
      `insert into plans (name, slug, description, price_monthly, price_annual,
                          annual_note, features, badge, is_featured, cta_label, sort_order)
       values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11)
       on conflict (slug) do nothing`,
      [p[0], p[1], p[2], p[3], p[4], p[5], JSON.stringify(p[6]), p[7], p[8], p[9], p[10]],
    );
  }

  const videos = [
    ["First-Touch Under Pressure", "Drills", 14,
      "https://images.unsplash.com/photo-1641280173256-0ac1b2f4cd78?auto=format&fit=crop&w=740&h=460&q=80", true, 1],
    ["Reading The Back Four", "Match Analysis", 22,
      "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=740&h=460&q=80", false, 2],
    ["Post-Match Recovery Flow", "Recovery", 9,
      "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=740&h=460&q=80", false, 3],
    ["Finishing Clinic: Near Post", "Drills", 17,
      "https://images.unsplash.com/photo-1551280857-2b9bbe52acf4?auto=format&fit=crop&w=740&h=460&q=80", false, 4],
    ["Fuelling For A 6pm Kickoff", "Nutrition", 11,
      "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=740&h=460&q=80", true, 5],
    ["1v1 Defending Fundamentals", "Drills", 19,
      "https://images.unsplash.com/photo-1504305754058-2f08ccd89a0a?auto=format&fit=crop&w=740&h=460&q=80", false, 6],
  ];

  const { rows: videoCount } = await client.query("select count(*)::int as n from videos");
  if (videoCount[0].n === 0) {
    for (const v of videos) {
      await client.query(
        `insert into videos (title, category, duration_min, thumbnail_url, is_new, sort_order)
         values ($1,$2,$3,$4,$5,$6)`,
        v,
      );
    }
  }

  // Trials dated relative to today so the calendar always looks live.
  const { rows: trialCount } = await client.query("select count(*)::int as n from trials");
  if (trialCount[0].n === 0) {
    const cities = [
      ["Mumbai", "Maharashtra", "U-14 to U-19", "Open Trial", 24, 12, 14],
      ["Delhi NCR", "Delhi", "U-12 to U-17", "Academy Partner", 20, 8, 21],
      ["Bengaluru", "Karnataka", "U-14 to U-21", "Open Trial", 30, 20, 28],
      ["Kolkata", "West Bengal", "U-13 to U-19", "Academy Partner", 18, 6, 35],
    ];
    for (const [city, state, age, tag, total, left, days] of cities) {
      await client.query(
        `insert into trials (city, state, trial_date, age_group, tag,
                             total_slots, slots_left, status, trial_time, is_published)
         values ($1,$2, current_date + $3::int, $4,$5,$6,$7,'open','7:00 AM — 11:00 AM', true)`,
        [city, state, days, age, tag, total, left],
      );
    }
  }

  console.log("→ Demo catalogue seeded");
}

main()
  .catch((err) => {
    console.error(`\n✗ ${err.message}`);
    if (err.code === "ENOTFOUND") {
      console.error(
        "  That host doesn't resolve. Check the host part of SUPABASE_DB_URL —\n" +
          "  the direct connection host is db.<ref>.supabase.co (note the 'db.').",
      );
    } else if (err.code === "ENETUNREACH" || err.code === "EHOSTUNREACH") {
      console.error(
        "  Supabase's direct connection is IPv6-only and your network can't reach it.\n" +
          "  Use the Session pooler string instead (Connection string → Session pooler),\n" +
          "  or paste supabase/migrations/0001_init.sql into the Supabase SQL Editor.",
      );
    } else if (/password|authentication/i.test(err.message)) {
      console.error(
        "  Wrong database password. Project Settings → Database → reset it,\n" +
          "  and URL-encode any @ : / # ? or % characters.",
      );
    }
    console.error("");
    process.exitCode = 1;
  })
  .finally(() => client.end());
