import "server-only";
import { getSupabase } from "./supabase";
import type {
  Announcement,
  Client,
  ClientOverview,
  Payment,
  Plan,
  ProgressRecord,
  Subscription,
  TrainingAssignment,
  TrainingProgram,
  TrainingSession,
  Trial,
  TrialRegistration,
  TutorWithUser,
  Video,
} from "./types";

/* ════════════════════════════════════════════════════════════════
   CLIENTS
════════════════════════════════════════════════════════════════ */

export async function listClients(opts?: {
  tutorId?: string;
  search?: string;
  status?: string;
  subscription?: string;
}): Promise<ClientOverview[]> {
  let q = getSupabase().from("client_overview").select("*");

  if (opts?.tutorId) q = q.eq("tutor_id", opts.tutorId);
  if (opts?.status) q = q.eq("status", opts.status);
  if (opts?.subscription) q = q.eq("subscription_status", opts.subscription);
  if (opts?.search) {
    const s = `%${opts.search}%`;
    q = q.or(
      `full_name.ilike.${s},city.ilike.${s},phone.ilike.${s},position.ilike.${s}`,
    );
  }

  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ClientOverview[];
}

export async function getClient(id: string): Promise<ClientOverview | null> {
  const { data, error } = await getSupabase()
    .from("client_overview")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as ClientOverview) ?? null;
}

/** The whole athlete file in one round trip — used by all three panels. */
export async function getClientDossier(clientId: string) {
  const db = getSupabase();
  const [
    client,
    assignments,
    sessions,
    progress,
    payments,
    subscriptions,
    registrations,
  ] = await Promise.all([
    getClient(clientId),
    db
      .from("training_assignments")
      .select("*")
      .eq("client_id", clientId)
      .order("start_date", { ascending: false })
      .then((r) => (r.data ?? []) as TrainingAssignment[]),
    db
      .from("training_sessions")
      .select("*")
      .eq("client_id", clientId)
      .order("session_date", { ascending: false })
      .limit(50)
      .then((r) => (r.data ?? []) as TrainingSession[]),
    db
      .from("progress_records")
      .select("*")
      .eq("client_id", clientId)
      .order("recorded_on", { ascending: false })
      .limit(24)
      .then((r) => (r.data ?? []) as ProgressRecord[]),
    db
      .from("payments")
      .select("*")
      .eq("client_id", clientId)
      .order("paid_on", { ascending: false })
      .then((r) => (r.data ?? []) as Payment[]),
    db
      .from("subscriptions")
      .select("*")
      .eq("client_id", clientId)
      .order("start_date", { ascending: false })
      .then((r) => (r.data ?? []) as Subscription[]),
    db
      .from("trial_registrations")
      .select("*, trial:trials(*)")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .then(
        (r) =>
          (r.data ?? []) as (TrialRegistration & { trial: Trial | null })[],
      ),
  ]);

  return {
    client,
    assignments,
    sessions,
    progress,
    payments,
    subscriptions,
    registrations,
  };
}

/* ════════════════════════════════════════════════════════════════
   TUTORS
════════════════════════════════════════════════════════════════ */

export async function listTutors(): Promise<
  (TutorWithUser & { student_count: number })[]
> {
  const db = getSupabase();
  const [{ data: tutors, error }, { data: clients }] = await Promise.all([
    db
      .from("tutors")
      .select("*, user:app_users(full_name, login_id, email, phone, is_active, last_login_at)")
      .order("created_at", { ascending: false }),
    db.from("clients").select("tutor_id"),
  ]);
  if (error) throw error;

  const counts = new Map<string, number>();
  for (const c of clients ?? []) {
    if (c.tutor_id) counts.set(c.tutor_id, (counts.get(c.tutor_id) ?? 0) + 1);
  }

  return (tutors ?? []).map((t) => ({
    ...(t as TutorWithUser),
    student_count: counts.get((t as TutorWithUser).id) ?? 0,
  }));
}

export async function getTutor(id: string): Promise<TutorWithUser | null> {
  const { data, error } = await getSupabase()
    .from("tutors")
    .select("*, user:app_users(full_name, login_id, email, phone, is_active, last_login_at)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as TutorWithUser) ?? null;
}

/* ════════════════════════════════════════════════════════════════
   TRIALS
════════════════════════════════════════════════════════════════ */

export async function listTrials(opts?: {
  publishedOnly?: boolean;
  upcomingOnly?: boolean;
}): Promise<Trial[]> {
  let q = getSupabase().from("trials").select("*");
  if (opts?.publishedOnly) q = q.eq("is_published", true);
  if (opts?.upcomingOnly) {
    q = q.gte("trial_date", new Date().toISOString().slice(0, 10));
  }
  const { data, error } = await q
    .order("trial_date", { ascending: true })
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Trial[];
}

export async function getTrial(id: string): Promise<Trial | null> {
  const { data, error } = await getSupabase()
    .from("trials")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as Trial) ?? null;
}

export async function listTrialRegistrations(
  trialId: string,
): Promise<(TrialRegistration & { client: Client | null })[]> {
  const { data, error } = await getSupabase()
    .from("trial_registrations")
    .select("*, client:clients(*)")
    .eq("trial_id", trialId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as (TrialRegistration & { client: Client | null })[];
}

/** Registrations across a coach's own roster. */
export async function listRegistrationsForTutor(tutorId: string) {
  const db = getSupabase();
  const { data: mine } = await db
    .from("clients")
    .select("id")
    .eq("tutor_id", tutorId);
  const ids = (mine ?? []).map((c) => c.id);
  if (!ids.length) return [];

  const { data, error } = await db
    .from("trial_registrations")
    .select("*, client:clients(*), trial:trials(*)")
    .in("client_id", ids)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as (TrialRegistration & {
    client: Client | null;
    trial: Trial | null;
  })[];
}

/* ════════════════════════════════════════════════════════════════
   PLANS / SUBSCRIPTIONS / PAYMENTS
════════════════════════════════════════════════════════════════ */

export async function listPlans(activeOnly = false): Promise<Plan[]> {
  let q = getSupabase().from("plans").select("*");
  if (activeOnly) q = q.eq("is_active", true);
  const { data, error } = await q.order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Plan[];
}

export async function listSubscriptions(): Promise<
  (Subscription & { client: Client | null })[]
> {
  const { data, error } = await getSupabase()
    .from("subscriptions")
    .select("*, client:clients(*)")
    .order("start_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as (Subscription & { client: Client | null })[];
}

export async function listPayments(opts?: {
  clientIds?: string[];
  limit?: number;
}): Promise<(Payment & { client: Client | null })[]> {
  let q = getSupabase().from("payments").select("*, client:clients(*)");
  if (opts?.clientIds) {
    if (!opts.clientIds.length) return [];
    q = q.in("client_id", opts.clientIds);
  }
  const { data, error } = await q
    .order("paid_on", { ascending: false })
    .limit(opts?.limit ?? 200);
  if (error) throw error;
  return (data ?? []) as (Payment & { client: Client | null })[];
}

/* ════════════════════════════════════════════════════════════════
   TRAINING
════════════════════════════════════════════════════════════════ */

export async function listPrograms(): Promise<TrainingProgram[]> {
  const { data, error } = await getSupabase()
    .from("training_programs")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as TrainingProgram[];
}

export async function listSessionsForTutor(
  tutorId: string,
  limit = 60,
): Promise<(TrainingSession & { client: Client | null })[]> {
  const { data, error } = await getSupabase()
    .from("training_sessions")
    .select("*, client:clients(*)")
    .eq("tutor_id", tutorId)
    .order("session_date", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as (TrainingSession & { client: Client | null })[];
}

/* ════════════════════════════════════════════════════════════════
   MISC
════════════════════════════════════════════════════════════════ */

export async function listVideos(): Promise<Video[]> {
  const { data, error } = await getSupabase()
    .from("videos")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Video[];
}

export async function listAnnouncements(
  audience: "all" | "clients" | "tutors",
): Promise<Announcement[]> {
  const { data, error } = await getSupabase()
    .from("announcements")
    .select("*")
    .eq("is_published", true)
    .in("audience", ["all", audience])
    .order("created_at", { ascending: false })
    .limit(6);
  if (error) throw error;
  return (data ?? []) as Announcement[];
}

export async function listAllAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await getSupabase()
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Announcement[];
}

export async function listActivity(limit = 40) {
  const { data, error } = await getSupabase()
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

/* ════════════════════════════════════════════════════════════════
   DASHBOARD ROLL-UPS
════════════════════════════════════════════════════════════════ */

export async function adminStats() {
  const db = getSupabase();
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = `${new Date().toISOString().slice(0, 7)}-01`;

  const [
    clients,
    activeSubs,
    tutors,
    upcomingTrials,
    monthPayments,
    allPaid,
  ] = await Promise.all([
    db.from("clients").select("id", { count: "exact", head: true }),
    db
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("subscription_status", "active"),
    db
      .from("tutors")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    db
      .from("trials")
      .select("id", { count: "exact", head: true })
      .gte("trial_date", today),
    db
      .from("payments")
      .select("amount")
      .eq("status", "paid")
      .gte("paid_on", monthStart),
    db.from("payments").select("amount").eq("status", "paid"),
  ]);

  const sum = (rows: { amount: number }[] | null) =>
    (rows ?? []).reduce((a, r) => a + Number(r.amount), 0);

  return {
    clients: clients.count ?? 0,
    activeSubs: activeSubs.count ?? 0,
    tutors: tutors.count ?? 0,
    upcomingTrials: upcomingTrials.count ?? 0,
    revenueThisMonth: sum(monthPayments.data as { amount: number }[]),
    revenueTotal: sum(allPaid.data as { amount: number }[]),
  };
}

export async function tutorStats(tutorId: string) {
  const db = getSupabase();
  const weekAgo = new Date(Date.now() - 7 * 86_400_000)
    .toISOString()
    .slice(0, 10);

  const [students, activeStudents, sessions, assignments] = await Promise.all([
    db
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("tutor_id", tutorId),
    db
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("tutor_id", tutorId)
      .eq("status", "active"),
    db
      .from("training_sessions")
      .select("id", { count: "exact", head: true })
      .eq("tutor_id", tutorId)
      .gte("session_date", weekAgo),
    db
      .from("training_assignments")
      .select("id", { count: "exact", head: true })
      .eq("tutor_id", tutorId)
      .in("status", ["assigned", "in_progress"]),
  ]);

  return {
    students: students.count ?? 0,
    activeStudents: activeStudents.count ?? 0,
    sessionsThisWeek: sessions.count ?? 0,
    activePlans: assignments.count ?? 0,
  };
}
