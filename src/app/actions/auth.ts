"use server";

import { redirect } from "next/navigation";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  verifyPassword,
  hashPassword,
  passwordProblem,
} from "@/lib/auth";
import {
  createSession,
  destroySession,
  getSession,
  homeFor,
} from "@/lib/session";
import type { AppUser } from "@/lib/types";

export type FormState = { error?: string; success?: string } | null;

/* ── login ──────────────────────────────────────────────────────────────── */

export async function loginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const loginId = String(formData.get("loginId") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  if (!loginId || !password) {
    return { error: "Enter your login ID and password." };
  }

  if (!isSupabaseConfigured()) {
    return {
      error:
        "The database isn't connected yet. Add your Supabase keys to .env.local and restart.",
    };
  }

  const db = getSupabase();
  const { data: user, error } = await db
    .from("app_users")
    .select("*")
    .ilike("login_id", loginId)
    .maybeSingle<AppUser>();

  if (error) {
    console.error("[login] lookup failed", error);
    return { error: "Something went wrong. Please try again." };
  }

  // Same message either way, so this can't be used to enumerate login IDs.
  const INVALID = "That login ID or password isn't right.";
  if (!user) return { error: INVALID };
  if (!(await verifyPassword(password, user.password_hash))) {
    return { error: INVALID };
  }
  if (!user.is_active) {
    return {
      error: "This login has been deactivated. Please contact your coach.",
    };
  }

  let clientId: string | undefined;
  let tutorId: string | undefined;

  if (user.role === "client") {
    const { data } = await db
      .from("clients")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    clientId = data?.id;
  } else if (user.role === "tutor") {
    const { data } = await db
      .from("tutors")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    tutorId = data?.id;
  }

  await createSession({
    uid: user.id,
    role: user.role,
    name: user.full_name,
    loginId: user.login_id,
    clientId,
    tutorId,
    mustChangePassword: user.must_change_password,
  });

  await db
    .from("app_users")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", user.id);

  await db.from("activity_log").insert({
    actor_id: user.id,
    actor_name: user.full_name,
    action: "login",
    entity: "app_users",
    entity_id: user.id,
  });

  if (user.must_change_password) redirect("/change-password");

  const dest =
    next && next.startsWith("/") && !next.startsWith("//")
      ? next
      : homeFor(user.role);
  redirect(dest);
}

/* ── logout ─────────────────────────────────────────────────────────────── */

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}

/* ── change password ────────────────────────────────────────────────────── */

export async function changePasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (next !== confirm) return { error: "The two new passwords don't match." };

  const problem = passwordProblem(next);
  if (problem) return { error: problem };

  const db = getSupabase();
  const { data: user } = await db
    .from("app_users")
    .select("*")
    .eq("id", session.uid)
    .maybeSingle<AppUser>();

  if (!user) return { error: "Account not found." };
  if (!(await verifyPassword(current, user.password_hash))) {
    return { error: "Your current password isn't right." };
  }
  if (current === next) {
    return { error: "Pick a password different from the one you were sent." };
  }

  await db
    .from("app_users")
    .update({
      password_hash: await hashPassword(next),
      must_change_password: false,
      // The generated password is no longer valid, so stop showing it in admin.
      initial_password: null,
    })
    .eq("id", user.id);

  await createSession({ ...session, mustChangePassword: false });

  await db.from("activity_log").insert({
    actor_id: user.id,
    actor_name: user.full_name,
    action: "password_changed",
    entity: "app_users",
    entity_id: user.id,
  });

  redirect(homeFor(session.role));
}
