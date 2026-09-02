import "server-only";
import { getSupabase } from "./supabase";
import { getSession, type Session } from "./session";
import type { Role } from "./types";

export type ActionState = {
  error?: string;
  success?: string;
  /** Set when an action mints credentials the admin needs to see once. */
  credentials?: { name: string; loginId: string; password: string; whatsapp: string | null };
} | null;

export class ActionError extends Error {}

/** Throws unless the caller holds one of `roles`. */
export async function assertRole(...roles: Role[]): Promise<Session> {
  const session = await getSession();
  if (!session) throw new ActionError("You're signed out. Log in again.");
  if (!roles.includes(session.role)) {
    throw new ActionError("You don't have permission to do that.");
  }
  return session;
}

/** A coach may only touch students on their own roster. */
export async function assertOwnsClient(
  session: Session,
  clientId: string,
): Promise<void> {
  if (session.role === "admin") return;
  if (session.role !== "tutor" || !session.tutorId) {
    throw new ActionError("You don't have permission to do that.");
  }
  const { data } = await getSupabase()
    .from("clients")
    .select("tutor_id")
    .eq("id", clientId)
    .maybeSingle();
  if (!data || data.tutor_id !== session.tutorId) {
    throw new ActionError("That athlete isn't on your roster.");
  }
}

/** Wraps an action body so a thrown ActionError becomes a form message. */
export async function run(
  fn: () => Promise<ActionState>,
): Promise<ActionState> {
  try {
    return await fn();
  } catch (err) {
    // `redirect()` throws a control-flow signal that must bubble up.
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      String((err as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw err;
    }
    if (err instanceof ActionError) return { error: err.message };
    console.error("[action]", err);
    const message = err instanceof Error ? err.message : String(err);
    return { error: `Couldn't save that: ${message}` };
  }
}

export async function logActivity(
  session: Session,
  action: string,
  entity: string,
  entityId?: string,
  meta?: Record<string, unknown>,
): Promise<void> {
  try {
    await getSupabase().from("activity_log").insert({
      actor_id: session.uid,
      actor_name: session.name,
      action,
      entity,
      entity_id: entityId ?? null,
      meta: meta ?? {},
    });
  } catch {
    // Never let audit logging break the actual write.
  }
}

/* ── FormData coercion ─────────────────────────────────────────────────── */

export function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

export function optStr(fd: FormData, key: string): string | null {
  const v = str(fd, key);
  return v === "" ? null : v;
}

export function num(fd: FormData, key: string, fallback = 0): number {
  const v = Number(fd.get(key));
  return Number.isFinite(v) ? v : fallback;
}

export function optNum(fd: FormData, key: string): number | null {
  const raw = str(fd, key);
  if (raw === "") return null;
  const v = Number(raw);
  return Number.isFinite(v) ? v : null;
}

/** Clamps a 0–100 metric, or null when the field was left blank. */
export function metric(fd: FormData, key: string): number | null {
  const v = optNum(fd, key);
  if (v === null) return null;
  return Math.max(0, Math.min(100, Math.round(v)));
}

export function bool(fd: FormData, key: string): boolean {
  const v = fd.get(key);
  return v === "on" || v === "true" || v === "1";
}

/** Textarea of one-per-line values → string[] */
export function lines(fd: FormData, key: string): string[] {
  return str(fd, key)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}
