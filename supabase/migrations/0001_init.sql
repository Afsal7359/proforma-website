-- ═══════════════════════════════════════════════════════════════════════════
--  PROFORMA CO — schema
--  Football coaching consultancy: CMS + admin + tutor panel + client portal
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── enums ──────────────────────────────────────────────────────────────────
do $$ begin
  create type user_role as enum ('admin','tutor','client');
exception when duplicate_object then null; end $$;

do $$ begin
  create type client_status as enum ('lead','active','paused','alumni');
exception when duplicate_object then null; end $$;

do $$ begin
  create type sub_status as enum ('none','trial','active','expired','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type billing_cycle as enum ('monthly','annual');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('paid','pending','failed','refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type trial_status as enum ('upcoming','open','closed','completed','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type registration_status as enum ('registered','confirmed','attended','selected','not_selected','cancelled','no_show');
exception when duplicate_object then null; end $$;

do $$ begin
  create type assignment_status as enum ('assigned','in_progress','completed','paused');
exception when duplicate_object then null; end $$;

do $$ begin
  create type attendance_status as enum ('present','absent','late','excused');
exception when duplicate_object then null; end $$;

-- ── helper: updated_at ─────────────────────────────────────────────────────
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end $$ language plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
--  1. CONTENT MANAGEMENT  (everything on the public site is editable)
-- ═══════════════════════════════════════════════════════════════════════════

-- Every marketing section of the landing page, keyed by section slug.
-- `data` holds the structured copy for that section (headings, arrays, etc).
create table if not exists site_content (
  key         text primary key,
  label       text not null,
  data        jsonb not null default '{}'::jsonb,
  sort_order  int  not null default 0,
  updated_at  timestamptz not null default now(),
  updated_by  uuid
);
drop trigger if exists trg_site_content_updated on site_content;
create trigger trg_site_content_updated before update on site_content
  for each row execute function set_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
--  2. AUTH  (own credential system — admin generates logins, shared on WhatsApp)
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists app_users (
  id                   uuid primary key default gen_random_uuid(),
  role                 user_role not null,
  login_id             text not null unique,
  password_hash        text not null,
  -- The generated password is kept until the user sets their own, so an admin
  -- can re-send the WhatsApp invite. Cleared the moment they change it.
  initial_password     text,
  must_change_password boolean not null default true,
  full_name            text not null,
  email                text,
  phone                text,
  is_active            boolean not null default true,
  last_login_at        timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  created_by           uuid references app_users(id) on delete set null
);
create index if not exists idx_app_users_role on app_users(role);
create index if not exists idx_app_users_login on app_users(lower(login_id));
drop trigger if exists trg_app_users_updated on app_users;
create trigger trg_app_users_updated before update on app_users
  for each row execute function set_updated_at();

-- ── tutors ─────────────────────────────────────────────────────────────────
create table if not exists tutors (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null unique references app_users(id) on delete cascade,
  specialization    text,
  positions         text[] default '{}',
  experience_years  numeric(4,1),
  bio               text,
  photo_url         text,
  city              text,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
drop trigger if exists trg_tutors_updated on tutors;
create trigger trg_tutors_updated before update on tutors
  for each row execute function set_updated_at();

-- ── plans (membership tiers — public pricing + subscription source) ────────
create table if not exists plans (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  slug           text not null unique,
  description    text,
  price_monthly  numeric(10,2) not null default 0,
  price_annual   numeric(10,2) not null default 0,
  annual_note    text,
  features       jsonb not null default '[]'::jsonb,
  badge          text,
  is_featured    boolean not null default false,
  cta_label      text,
  sort_order     int not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
drop trigger if exists trg_plans_updated on plans;
create trigger trg_plans_updated before update on plans
  for each row execute function set_updated_at();

-- ── clients / students ─────────────────────────────────────────────────────
create table if not exists clients (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid unique references app_users(id) on delete cascade,
  full_name           text not null,
  date_of_birth       date,
  age                 int,
  position            text,
  city                text,
  state               text,
  phone               text,
  email               text,
  guardian_name       text,
  guardian_phone      text,
  photo_url           text,
  tutor_id            uuid references tutors(id) on delete set null,
  plan_id             uuid references plans(id) on delete set null,
  subscription_status sub_status not null default 'none',
  subscription_start  date,
  subscription_end    date,
  status              client_status not null default 'lead',
  height_cm           numeric(5,1),
  weight_kg           numeric(5,1),
  goal                text,
  notes               text,
  joined_on           date not null default current_date,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists idx_clients_tutor on clients(tutor_id);
create index if not exists idx_clients_status on clients(status);
create index if not exists idx_clients_sub on clients(subscription_status);
drop trigger if exists trg_clients_updated on clients;
create trigger trg_clients_updated before update on clients
  for each row execute function set_updated_at();

-- ── subscriptions ──────────────────────────────────────────────────────────
create table if not exists subscriptions (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references clients(id) on delete cascade,
  plan_id     uuid references plans(id) on delete set null,
  plan_name   text,
  cycle       billing_cycle not null default 'monthly',
  amount      numeric(10,2) not null default 0,
  status      sub_status not null default 'active',
  start_date  date not null default current_date,
  end_date    date,
  notes       text,
  created_by  uuid references app_users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_subs_client on subscriptions(client_id);
drop trigger if exists trg_subs_updated on subscriptions;
create trigger trg_subs_updated before update on subscriptions
  for each row execute function set_updated_at();

-- ── payments ───────────────────────────────────────────────────────────────
create table if not exists payments (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references clients(id) on delete cascade,
  subscription_id uuid references subscriptions(id) on delete set null,
  amount          numeric(10,2) not null,
  currency        text not null default 'INR',
  method          text not null default 'upi',
  status          payment_status not null default 'paid',
  paid_on         date not null default current_date,
  period_start    date,
  period_end      date,
  reference       text,
  invoice_no      text,
  notes           text,
  recorded_by     uuid references app_users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_payments_client on payments(client_id);
create index if not exists idx_payments_paid_on on payments(paid_on desc);
drop trigger if exists trg_payments_updated on payments;
create trigger trg_payments_updated before update on payments
  for each row execute function set_updated_at();

-- ── trials (gated: only visible inside the portal) ─────────────────────────
create table if not exists trials (
  id            uuid primary key default gen_random_uuid(),
  city          text not null,
  state         text,
  venue         text,
  address       text,
  trial_date    date not null,
  trial_time    text,
  age_group     text,
  tag           text default 'Open Trial',
  total_slots   int not null default 0,
  slots_left    int not null default 0,
  status        trial_status not null default 'upcoming',
  description   text,
  requirements  text,
  is_published  boolean not null default true,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_trials_date on trials(trial_date);
drop trigger if exists trg_trials_updated on trials;
create trigger trg_trials_updated before update on trials
  for each row execute function set_updated_at();

-- ── trial registrations ────────────────────────────────────────────────────
create table if not exists trial_registrations (
  id           uuid primary key default gen_random_uuid(),
  trial_id     uuid not null references trials(id) on delete cascade,
  client_id    uuid not null references clients(id) on delete cascade,
  status       registration_status not null default 'registered',
  score        jsonb default '{}'::jsonb,
  coach_notes  text,
  reviewed_by  uuid references tutors(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (trial_id, client_id)
);
create index if not exists idx_reg_client on trial_registrations(client_id);
drop trigger if exists trg_reg_updated on trial_registrations;
create trigger trg_reg_updated before update on trial_registrations
  for each row execute function set_updated_at();

-- ── training programmes (reusable templates) ───────────────────────────────
create table if not exists training_programs (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  position     text,
  level        text,
  weeks        int default 12,
  description  text,
  focus_areas  text[] default '{}',
  is_template  boolean not null default true,
  created_by   uuid references app_users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
drop trigger if exists trg_programs_updated on training_programs;
create trigger trg_programs_updated before update on training_programs
  for each row execute function set_updated_at();

-- ── training assignments (a programme given to one student) ────────────────
create table if not exists training_assignments (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid not null references clients(id) on delete cascade,
  tutor_id          uuid references tutors(id) on delete set null,
  program_id        uuid references training_programs(id) on delete set null,
  title             text not null,
  description       text,
  sessions_per_week int default 3,
  start_date        date not null default current_date,
  end_date          date,
  status            assignment_status not null default 'assigned',
  progress_pct      int not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_assign_client on training_assignments(client_id);
create index if not exists idx_assign_tutor on training_assignments(tutor_id);
drop trigger if exists trg_assign_updated on training_assignments;
create trigger trg_assign_updated before update on training_assignments
  for each row execute function set_updated_at();

-- ── training sessions (one logged session) ─────────────────────────────────
create table if not exists training_sessions (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references clients(id) on delete cascade,
  tutor_id      uuid references tutors(id) on delete set null,
  assignment_id uuid references training_assignments(id) on delete set null,
  session_date  date not null default current_date,
  duration_min  int,
  focus         text,
  drills        jsonb not null default '[]'::jsonb,
  attendance    attendance_status not null default 'present',
  coach_rating  int check (coach_rating between 0 and 10),
  notes         text,
  video_url     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_sessions_client on training_sessions(client_id, session_date desc);
drop trigger if exists trg_sessions_updated on training_sessions;
create trigger trg_sessions_updated before update on training_sessions
  for each row execute function set_updated_at();

-- ── progress records (the five tracked metrics) ────────────────────────────
create table if not exists progress_records (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references clients(id) on delete cascade,
  tutor_id     uuid references tutors(id) on delete set null,
  recorded_on  date not null default current_date,
  speed        int check (speed between 0 and 100),
  stamina      int check (stamina between 0 and 100),
  technique    int check (technique between 0 and 100),
  strength     int check (strength between 0 and 100),
  agility      int check (agility between 0 and 100),
  weight_kg    numeric(5,1),
  height_cm    numeric(5,1),
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_progress_client on progress_records(client_id, recorded_on desc);
drop trigger if exists trg_progress_updated on progress_records;
create trigger trg_progress_updated before update on progress_records
  for each row execute function set_updated_at();

-- ── video / session library ────────────────────────────────────────────────
create table if not exists videos (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  category      text,
  duration_min  int,
  thumbnail_url text,
  video_url     text,
  description   text,
  position_tag  text,
  is_new        boolean not null default false,
  is_public     boolean not null default true,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
drop trigger if exists trg_videos_updated on videos;
create trigger trg_videos_updated before update on videos
  for each row execute function set_updated_at();

-- ── announcements shown in the portal ──────────────────────────────────────
create table if not exists announcements (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  body         text,
  audience     text not null default 'all',   -- all | clients | tutors
  is_published boolean not null default true,
  created_by   uuid references app_users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
drop trigger if exists trg_ann_updated on announcements;
create trigger trg_ann_updated before update on announcements
  for each row execute function set_updated_at();

-- ── newsletter signups from the public footer ──────────────────────────────
create table if not exists newsletter_signups (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  source     text default 'footer',
  created_at timestamptz not null default now()
);

-- ── audit trail ────────────────────────────────────────────────────────────
create table if not exists activity_log (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid references app_users(id) on delete set null,
  actor_name text,
  action     text not null,
  entity     text,
  entity_id  text,
  meta       jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_activity_created on activity_log(created_at desc);

-- ── keep-alive heartbeat (touched daily so the project never idles out) ────
create table if not exists keepalive_ping (
  id         int primary key default 1,
  pinged_at  timestamptz not null default now(),
  ping_count bigint not null default 0,
  source     text,
  constraint keepalive_single_row check (id = 1)
);
insert into keepalive_ping (id, pinged_at, ping_count, source)
values (1, now(), 0, 'migration')
on conflict (id) do nothing;

-- ═══════════════════════════════════════════════════════════════════════════
--  3. ROW LEVEL SECURITY
--  Every table is locked down. The app never talks to Postgres with the anon
--  key for private data — it uses the service role behind its own session
--  layer, so RLS here is a hard backstop against a leaked anon key.
-- ═══════════════════════════════════════════════════════════════════════════
do $$
declare t text;
begin
  foreach t in array array[
    'site_content','app_users','tutors','plans','clients','subscriptions',
    'payments','trials','trial_registrations','training_programs',
    'training_assignments','training_sessions','progress_records','videos',
    'announcements','newsletter_signups','activity_log','keepalive_ping'
  ] loop
    execute format('alter table %I enable row level security', t);
    -- Deliberately NOT `force row level security`: FORCE would also apply RLS
    -- to the table owner, which is exactly the role the app needs through.

    -- Belt-and-braces on top of RLS. Guarded because these roles only exist
    -- on Supabase — the migration still runs on a plain Postgres.
    if exists (select 1 from pg_roles where rolname = 'anon') then
      execute format('revoke all on table %I from anon', t);
    end if;
    if exists (select 1 from pg_roles where rolname = 'authenticated') then
      execute format('revoke all on table %I from authenticated', t);
    end if;
    if exists (select 1 from pg_roles where rolname = 'service_role') then
      execute format('grant all on table %I to service_role', t);
    end if;
  end loop;
end $$;

-- No policies are created: with RLS enabled and zero policies, the anon and
-- authenticated roles can read nothing. The service_role key bypasses RLS.

-- ═══════════════════════════════════════════════════════════════════════════
--  4. HELPER VIEW — client roster with the numbers a panel needs
-- ═══════════════════════════════════════════════════════════════════════════
create or replace view client_overview as
select
  c.*,
  u.login_id,
  u.is_active           as login_active,
  u.last_login_at,
  t.id                  as tutor_uid,
  tu.full_name          as tutor_name,
  p.name                as plan_name,
  coalesce(pay.total_paid, 0)  as total_paid,
  pay.last_payment_on,
  prog.speed, prog.stamina, prog.technique, prog.strength, prog.agility,
  prog.recorded_on      as last_progress_on
from clients c
left join app_users u on u.id = c.user_id
left join tutors t    on t.id = c.tutor_id
left join app_users tu on tu.id = t.user_id
left join plans p     on p.id = c.plan_id
left join lateral (
  select sum(amount) as total_paid, max(paid_on) as last_payment_on
  from payments where client_id = c.id and status = 'paid'
) pay on true
left join lateral (
  select speed, stamina, technique, strength, agility, recorded_on
  from progress_records where client_id = c.id
  order by recorded_on desc limit 1
) prog on true;

-- A view normally runs with its owner's rights, which would let it read
-- straight past the RLS on the tables underneath. `security_invoker` (PG15+,
-- which Supabase runs) makes it use the caller's rights instead. Applied
-- conditionally so the migration still works on Postgres 14 and older.
do $$
begin
  if current_setting('server_version_num')::int >= 150000 then
    execute 'alter view client_overview set (security_invoker = true)';
  end if;

  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on table client_overview from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on table client_overview from authenticated';
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant select on table client_overview to service_role';
  end if;
end $$;
