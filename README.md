# Proforma Co — Next.js platform

The original single-file marketing site, rebuilt in Next.js 15 with a Supabase
backend, a full CMS, and three separate logins: **admin**, **coach** and
**athlete**.

The public homepage is a pixel-level port of the original design. The one
deliberate change: the trial calendar is no longer public — visitors see a
locked panel that routes them to `/login`, and only signed-in athletes get the
live calendar, slot booking and their results.

---

## Quick start

**1. Set up the database — no password, no CLI.**

Open the Supabase **SQL Editor**, paste the whole of
[`supabase/SETUP.sql`](supabase/SETUP.sql), and press Run. That creates the
schema, loads every word of the homepage into the CMS, seeds demo plans /
videos / trials, and makes three logins. It's idempotent — run it again any
time to reset the demo content.

If the schema already exists, paste just
[`supabase/seed.sql`](supabase/seed.sql) instead.

**2. Run it.**

```bash
npm install
cp .env.example .env.local     # fill in the URL + secret key
npm run dev
```

Log in at http://localhost:3000/login:

| Login ID | Password | Goes to |
| --- | --- | --- |
| `admin` | `Proforma@2026` | `/admin` |
| `COACH-DEMO` | `Coach@2026` | `/tutor` |
| `PFC-DEMO` | `Athlete@2026` | `/portal` |

Change those passwords at the top of `supabase/seed.sql` before running it, or
from inside the app afterwards.

> The demo coach and athlete come with a full 12-week training block, four
> scored assessments, three sessions, two payments and a booked trial — so
> every screen has something real to show. Delete section 6–7 of `seed.sql` if
> you don't want them.

### Why not a migration CLI?

`npm run db:push` exists and does the same thing over a direct Postgres
connection, but it needs your database password and IPv6 connectivity. The SQL
Editor route needs neither, so it's the default. Both produce an identical
database.

The passwords in `seed.sql` are hashed **inside Postgres** by `pgcrypto`
(`crypt(…, gen_salt('bf', 10))`), which produces the same bcrypt format the app
verifies with `bcryptjs` — so no plaintext password ever leaves the SQL file.

---

## Environment

Everything lives in `.env.local`. `.env.example` documents each value.

| Variable | Where it comes from |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | same page → **Secret keys** (`sb_secret_…`) — server only, never expose |
| `SUPABASE_DB_URL` | *Optional* — only for `npm run db:push`. Not needed with the SQL Editor route |
| `AUTH_SECRET` | `openssl rand -base64 48` |
| `CRON_SECRET` | `openssl rand -base64 32` |
| `SEED_ADMIN_LOGIN` / `SEED_ADMIN_PASSWORD` | *Optional* — only for `npm run db:push` |
| `NEXT_PUBLIC_SITE_URL` | your deployed URL — used in WhatsApp invites |
| `NEXT_PUBLIC_WHATSAPP_SUPPORT` | support number, digits only with country code |

---

## The three panels

### Admin — `/admin`

| Screen | What it does |
| --- | --- |
| Dashboard | Revenue, active subscriptions, roster, upcoming trials, audit trail |
| Athletes | Full roster. Add an athlete → a portal login is generated → send it on WhatsApp in one tap |
| Athlete detail | Profile, training plans, session log, performance scores, trial history, payments, subscriptions, login management |
| Coaches | Add a coach → their own login is generated. Assign athletes, see their workload |
| Trials | Add/edit trials, publish them to the portal, manage registrations and record panel scores |
| Programmes | Reusable training blocks |
| Video Library | Session recordings; public ones also show on the homepage |
| Plans & Pricing | The membership tiers rendered on the homepage |
| Subscriptions | Who's subscribed, on what plan, for how much — add and update amounts |
| Payments | Record and update payments; marking one paid activates the membership |
| Site Content | **Every word on the public site**, section by section |
| Announcements | Notices shown on athlete/coach dashboards |
| Settings & Health | Keep-alive status, newsletter signups, audit log |

### Coach — `/tutor`

Coaches see **only their own roster**. They can log sessions, record the five
performance metrics, assign training plans, register athletes for trials and
record trial outcomes. Payments are read-only — only admin records money.

### Athlete — `/portal`

Dashboard, the live **trial calendar with self-service slot booking**, their
training plan and session log, their performance scores over time, payment
history and profile.

---

## How logins work

There's no public signup. Admin creates people, and the system mints a login:

1. Admin adds an athlete or coach.
2. A login ID (`PFC-4821`, `COACH-K7M2`) and a readable one-time password
   (`Kavu-Ternu-4827`) are generated. The alphabet excludes `0/O/1/I/l` so
   credentials survive being read off a phone.
3. The credentials appear on screen with a **Send on WhatsApp** button that
   opens a pre-filled invite.
4. The generated password stays visible on that person's admin page until they
   log in and set their own — so it can be re-sent. The moment they change it,
   it's wiped from the database.
5. Admin can generate a fresh password or disable a login at any time.

Sessions are signed JWTs in an httpOnly cookie (12 hours). `src/proxy.ts`
gates the three areas at the edge; `src/lib/guards.ts` re-checks server-side so
a route can never render data for the wrong role.

The check is deliberately done twice. Next.js has shipped middleware
auth-bypass advisories before, so the edge gate is treated as an optimisation,
not as the security boundary — the server-side guard is.

---

## Database

Schema: `supabase/migrations/0001_init.sql`. Seed: `supabase/seed.sql`.
`supabase/SETUP.sql` is the two concatenated, for a single paste into the
Supabase SQL Editor.

`seed.sql` and `SETUP.sql` are **generated** from `src/lib/default-content.ts`
by `node scripts/generate-sql.mjs`, so the SQL can never drift from what the
app renders. Re-run it after editing the content defaults.

18 tables covering content, auth, athletes, coaches, plans, subscriptions,
payments, trials, registrations, training programmes/assignments/sessions,
progress records, videos, announcements, newsletter signups, an audit log and
the keep-alive heartbeat.

**Row Level Security is enabled on every table with zero policies.** With no
policies, the anon and authenticated roles can read nothing at all. All data
access goes through the service-role key on the server, behind the app's own
session layer. RLS is the backstop if a key ever leaks.

The anon / publishable key isn't needed and isn't used — the browser never
talks to Supabase directly.

---

## Keep-alive — stopping Supabase from pausing

A free-tier Supabase project pauses after ~7 days without database activity,
which would take the whole site down. Three independent triggers prevent that:

| Trigger | Schedule | Setup |
| --- | --- | --- |
| Vercel Cron | 03:17 UTC daily | `vercel.json` — set `CRON_SECRET` in Vercel |
| GitHub Actions | 06:11 UTC daily | `.github/workflows/supabase-keepalive.yml` — add `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as repo secrets |
| Manual | any time | `npm run keepalive` |

Each run does a real write **and** a real read — a read alone doesn't always
count as activity. Two schedulers run it so one platform going quiet can't take
the database down with it.

Current status is on **Admin → Settings & Health**, which warns if the last
ping is more than 48 hours old.

---

## Troubleshooting `npm run db:push`

**`SUPABASE_DB_URL is not a Postgres connection string`**
You pasted the project URL (`https://<ref>.supabase.co`). That's the REST
endpoint. You want Project Settings → Database → Connection string → URI,
which starts with `postgresql://`.

**`getaddrinfo ENOTFOUND`**
Check the host — the direct connection host is `db.<ref>.supabase.co`, with
the `db.` prefix.

**Password with special characters**
`@ : / # ? %` must be URL-encoded in a connection string:

```bash
node -e "console.log(encodeURIComponent(process.argv[1]))" 'my@pass/word'
```

**`ENETUNREACH` — no IPv6**
Supabase's direct connection is IPv6-only. If your network is IPv4-only, use
the **Session pooler** string instead (same page, "Session pooler" tab), which
is IPv4-reachable.

**Nothing works / no `psql` access**
Skip the script entirely: open the Supabase **SQL Editor**, paste the whole of
`supabase/migrations/0001_init.sql`, and run it. Then create your admin login
by running this in the same editor, replacing the hash with the output of
`node -e "console.log(require('bcryptjs').hashSync('YourPassword',10))"`:

```sql
insert into app_users (role, login_id, password_hash, full_name, must_change_password)
values ('admin', 'admin', '<paste-hash-here>', 'Proforma Admin', false)
on conflict (login_id) do update set password_hash = excluded.password_hash;
```

---

## Editing the site content

Admin → Site Content lists all 17 sections. Each opens a form generated from
the section's shape: text fields, number fields, and add/remove repeaters for
lists (nav links, hero stats, pillars, position cards, career steps, nutrition
tracks, testimonials, footer columns…).

Two conventions in headings:

- `**text**` renders in the blue accent — the original design's `<em>`.
- A newline renders as a line break (used by the hero headline).

Every section has **Reset to original wording**, which deletes the override and
falls back to the shipped copy. Prices live under Plans & Pricing and videos
under Video Library; those sections only control their headings.

---

## Project layout

```
src/
  app/
    page.tsx                 public homepage
    login/  change-password/ auth screens
    portal/                  athlete portal
    tutor/                   coach panel
    admin/                   admin panel
    actions/                 server actions (auth, people, coaching, billing, cms)
    api/
      cron/keepalive/        the daily heartbeat endpoint
      newsletter/            footer signup
    globals.css              original design CSS verbatim + panel styles
  proxy.ts                   edge auth gate (was middleware.ts before Next 16)
  components/
    site/                    homepage sections
    panel/                   dashboards, forms, CMS editor
  lib/
    default-content.ts       every word of the site, typed — seed + fallback
    supabase.ts session.ts auth.ts guards.ts queries.ts
supabase/migrations/         schema
scripts/                     keepalive.mjs, db-push.mjs
design-reference/            the original single-file design, for comparison
```

---

## Design fidelity

`src/app/globals.css` opens with the original stylesheet copied verbatim
(lines 1–610), so tokens, breakpoints and animations are unchanged. Panel
styles are appended below and reuse the same tokens.

Verified against `design-reference/original-design.html`: identical CSS class
usage and identical rendered text across every section. The only differences
are inside the trials block, which is the intended gating change.

---

## Deploying

1. Push to GitHub, import into Vercel.
2. Add every variable from `.env.example` to Vercel's environment settings.
3. Set `NEXT_PUBLIC_SITE_URL` to the production URL so WhatsApp invites carry
   the right link.
4. Vercel picks up the cron from `vercel.json` automatically.
5. Add the two Supabase secrets to GitHub repo settings for the backup cron.
6. Run `supabase/SETUP.sql` in the SQL Editor of your production project.
