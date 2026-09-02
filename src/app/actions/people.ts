"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import {
  generateLoginId,
  generatePassword,
  hashPassword,
  buildWhatsAppInvite,
} from "@/lib/auth";
import {
  assertRole,
  assertOwnsClient,
  ActionError,
  run,
  logActivity,
  str,
  optStr,
  optNum,
  bool,
  siteUrl,
  type ActionState,
} from "@/lib/action-utils";
import { ageFromDob } from "@/lib/format";
import type { Role } from "@/lib/types";

/* ════════════════════════════════════════════════════════════════
   CREDENTIALS
════════════════════════════════════════════════════════════════ */

/** Mints a unique login ID + one-time password and stores the hash. */
async function mintCredentials(
  role: Role,
  fullName: string,
  createdBy: string,
  extras: { email?: string | null; phone?: string | null },
) {
  const db = getSupabase();

  let loginId = generateLoginId(role, fullName);
  for (let i = 0; i < 6; i++) {
    const { data } = await db
      .from("app_users")
      .select("id")
      .ilike("login_id", loginId)
      .maybeSingle();
    if (!data) break;
    loginId = generateLoginId(role, fullName);
    if (i === 5) throw new ActionError("Couldn't generate a unique login ID.");
  }

  const password = generatePassword();

  const { data: user, error } = await db
    .from("app_users")
    .insert({
      role,
      login_id: loginId,
      password_hash: await hashPassword(password),
      initial_password: password,
      must_change_password: true,
      full_name: fullName,
      email: extras.email ?? null,
      phone: extras.phone ?? null,
      created_by: createdBy,
    })
    .select("id, login_id")
    .single();

  if (error) throw error;
  return { userId: user.id as string, loginId, password };
}

/** Issues a fresh password for an existing login, so admin can re-share it. */
export async function regenerateCredentialsAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  return run(async () => {
    const session = await assertRole("admin");
    const userId = str(fd, "userId");
    if (!userId) throw new ActionError("Missing user.");

    const db = getSupabase();
    const { data: user } = await db
      .from("app_users")
      .select("id, full_name, login_id, phone, role")
      .eq("id", userId)
      .maybeSingle();
    if (!user) throw new ActionError("That login no longer exists.");

    const password = generatePassword();
    const { error } = await db
      .from("app_users")
      .update({
        password_hash: await hashPassword(password),
        initial_password: password,
        must_change_password: true,
      })
      .eq("id", userId);
    if (error) throw error;

    await logActivity(session, "credentials_regenerated", "app_users", userId);
    revalidatePath("/admin");

    return {
      success: `New password generated for ${user.full_name}.`,
      credentials: {
        name: user.full_name,
        loginId: user.login_id,
        password,
        whatsapp: buildWhatsAppInvite({
          phone: user.phone,
          name: user.full_name,
          loginId: user.login_id,
          password,
          role: user.role as Role,
          siteUrl: siteUrl(),
        }),
      },
    };
  });
}

export async function toggleUserActiveAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  return run(async () => {
    const session = await assertRole("admin");
    const userId = str(fd, "userId");
    const active = bool(fd, "active");

    const { error } = await getSupabase()
      .from("app_users")
      .update({ is_active: active })
      .eq("id", userId);
    if (error) throw error;

    await logActivity(
      session,
      active ? "login_enabled" : "login_disabled",
      "app_users",
      userId,
    );
    revalidatePath("/admin");
    return { success: active ? "Login re-enabled." : "Login disabled." };
  });
}

/* ════════════════════════════════════════════════════════════════
   CLIENTS / STUDENTS
════════════════════════════════════════════════════════════════ */

export async function saveClientAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  return run(async () => {
    const session = await assertRole("admin", "tutor");
    const db = getSupabase();
    const id = optStr(fd, "id");

    const fullName = str(fd, "full_name");
    if (!fullName) throw new ActionError("An athlete needs a name.");

    const dob = optStr(fd, "date_of_birth");
    const fields = {
      full_name: fullName,
      date_of_birth: dob,
      age: optNum(fd, "age") ?? ageFromDob(dob),
      position: optStr(fd, "position"),
      city: optStr(fd, "city"),
      state: optStr(fd, "state"),
      phone: optStr(fd, "phone"),
      email: optStr(fd, "email"),
      guardian_name: optStr(fd, "guardian_name"),
      guardian_phone: optStr(fd, "guardian_phone"),
      height_cm: optNum(fd, "height_cm"),
      weight_kg: optNum(fd, "weight_kg"),
      goal: optStr(fd, "goal"),
      notes: optStr(fd, "notes"),
      status: str(fd, "status") || "lead",
    };

    // A coach may reassign nothing and only edit their own roster.
    const adminOnly =
      session.role === "admin"
        ? {
            tutor_id: optStr(fd, "tutor_id"),
            plan_id: optStr(fd, "plan_id"),
            subscription_status: str(fd, "subscription_status") || "none",
            subscription_start: optStr(fd, "subscription_start"),
            subscription_end: optStr(fd, "subscription_end"),
          }
        : {};

    /* ── update ── */
    if (id) {
      await assertOwnsClient(session, id);
      const { error } = await db
        .from("clients")
        .update({ ...fields, ...adminOnly })
        .eq("id", id);
      if (error) throw error;

      // Keep the login record's contact details in step.
      const { data: c } = await db
        .from("clients")
        .select("user_id")
        .eq("id", id)
        .maybeSingle();
      if (c?.user_id) {
        await db
          .from("app_users")
          .update({
            full_name: fields.full_name,
            email: fields.email,
            phone: fields.phone,
          })
          .eq("id", c.user_id);
      }

      await logActivity(session, "client_updated", "clients", id);
      revalidatePath("/admin/clients");
      revalidatePath(`/admin/clients/${id}`);
      revalidatePath("/tutor/students");
      return { success: `${fullName}'s profile is saved.` };
    }

    /* ── create ── */
    if (session.role !== "admin") {
      throw new ActionError("Only an admin can add a new athlete.");
    }

    const wantsLogin = bool(fd, "create_login");
    let credentials: NonNullable<ActionState>["credentials"];
    let userId: string | null = null;

    if (wantsLogin) {
      const minted = await mintCredentials("client", fullName, session.uid, {
        email: fields.email,
        phone: fields.phone,
      });
      userId = minted.userId;
      credentials = {
        name: fullName,
        loginId: minted.loginId,
        password: minted.password,
        whatsapp: buildWhatsAppInvite({
          phone: fields.phone,
          name: fullName,
          loginId: minted.loginId,
          password: minted.password,
          role: "client",
          siteUrl: siteUrl(),
        }),
      };
    }

    const { data: created, error } = await db
      .from("clients")
      .insert({ ...fields, ...adminOnly, user_id: userId })
      .select("id")
      .single();

    if (error) {
      // Don't leave an orphaned login behind if the profile insert failed.
      if (userId) await db.from("app_users").delete().eq("id", userId);
      throw error;
    }

    await logActivity(session, "client_created", "clients", created.id, {
      loginCreated: wantsLogin,
    });
    revalidatePath("/admin/clients");

    return {
      success: wantsLogin
        ? `${fullName} added. Share the login below on WhatsApp.`
        : `${fullName} added.`,
      credentials,
    };
  });
}

export async function deleteClientAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const id = str(fd, "id");
  const state = await run(async () => {
    const session = await assertRole("admin");
    if (!id) throw new ActionError("Missing athlete.");

    const db = getSupabase();
    const { data: c } = await db
      .from("clients")
      .select("user_id, full_name")
      .eq("id", id)
      .maybeSingle();

    const { error } = await db.from("clients").delete().eq("id", id);
    if (error) throw error;
    if (c?.user_id) await db.from("app_users").delete().eq("id", c.user_id);

    await logActivity(session, "client_deleted", "clients", id, {
      name: c?.full_name,
    });
    revalidatePath("/admin/clients");
    return { success: "Athlete removed." };
  });

  if (state?.error) return state;
  redirect("/admin/clients?deleted=1");
}

/** Adds a portal login to an athlete who was created without one. */
export async function issueClientLoginAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  return run(async () => {
    const session = await assertRole("admin");
    const clientId = str(fd, "clientId");
    const db = getSupabase();

    const { data: client } = await db
      .from("clients")
      .select("id, full_name, email, phone, user_id")
      .eq("id", clientId)
      .maybeSingle();
    if (!client) throw new ActionError("Athlete not found.");
    if (client.user_id) throw new ActionError("This athlete already has a login.");

    const minted = await mintCredentials(
      "client",
      client.full_name,
      session.uid,
      { email: client.email, phone: client.phone },
    );

    const { error } = await db
      .from("clients")
      .update({ user_id: minted.userId })
      .eq("id", clientId);
    if (error) {
      await db.from("app_users").delete().eq("id", minted.userId);
      throw error;
    }

    await logActivity(session, "client_login_issued", "clients", clientId);
    revalidatePath(`/admin/clients/${clientId}`);

    return {
      success: "Login created — share it on WhatsApp.",
      credentials: {
        name: client.full_name,
        loginId: minted.loginId,
        password: minted.password,
        whatsapp: buildWhatsAppInvite({
          phone: client.phone,
          name: client.full_name,
          loginId: minted.loginId,
          password: minted.password,
          role: "client",
          siteUrl: siteUrl(),
        }),
      },
    };
  });
}

/* ════════════════════════════════════════════════════════════════
   TUTORS / COACHES
════════════════════════════════════════════════════════════════ */

export async function saveTutorAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  return run(async () => {
    const session = await assertRole("admin");
    const db = getSupabase();
    const id = optStr(fd, "id");

    const fullName = str(fd, "full_name");
    if (!fullName) throw new ActionError("A coach needs a name.");

    const profile = {
      specialization: optStr(fd, "specialization"),
      positions: str(fd, "positions")
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean),
      experience_years: optNum(fd, "experience_years"),
      bio: optStr(fd, "bio"),
      photo_url: optStr(fd, "photo_url"),
      city: optStr(fd, "city"),
      is_active: bool(fd, "is_active"),
    };
    const email = optStr(fd, "email");
    const phone = optStr(fd, "phone");

    /* ── update ── */
    if (id) {
      const { error } = await db.from("tutors").update(profile).eq("id", id);
      if (error) throw error;

      const { data: t } = await db
        .from("tutors")
        .select("user_id")
        .eq("id", id)
        .maybeSingle();
      if (t?.user_id) {
        await db
          .from("app_users")
          .update({ full_name: fullName, email, phone })
          .eq("id", t.user_id);
      }

      await logActivity(session, "tutor_updated", "tutors", id);
      revalidatePath("/admin/tutors");
      revalidatePath(`/admin/tutors/${id}`);
      return { success: `${fullName}'s coach profile is saved.` };
    }

    /* ── create ── */
    const minted = await mintCredentials("tutor", fullName, session.uid, {
      email,
      phone,
    });

    const { data: created, error } = await db
      .from("tutors")
      .insert({ ...profile, user_id: minted.userId })
      .select("id")
      .single();

    if (error) {
      await db.from("app_users").delete().eq("id", minted.userId);
      throw error;
    }

    await logActivity(session, "tutor_created", "tutors", created.id);
    revalidatePath("/admin/tutors");

    return {
      success: `${fullName} added as a coach. Share the login below.`,
      credentials: {
        name: fullName,
        loginId: minted.loginId,
        password: minted.password,
        whatsapp: buildWhatsAppInvite({
          phone,
          name: fullName,
          loginId: minted.loginId,
          password: minted.password,
          role: "tutor",
          siteUrl: siteUrl(),
        }),
      },
    };
  });
}

export async function deleteTutorAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const id = str(fd, "id");
  const state = await run(async () => {
    const session = await assertRole("admin");
    const db = getSupabase();

    const { data: t } = await db
      .from("tutors")
      .select("user_id")
      .eq("id", id)
      .maybeSingle();

    // Students outlive their coach — unassign rather than cascade-delete them.
    await db.from("clients").update({ tutor_id: null }).eq("tutor_id", id);

    const { error } = await db.from("tutors").delete().eq("id", id);
    if (error) throw error;
    if (t?.user_id) await db.from("app_users").delete().eq("id", t.user_id);

    await logActivity(session, "tutor_deleted", "tutors", id);
    revalidatePath("/admin/tutors");
    return { success: "Coach removed." };
  });

  if (state?.error) return state;
  redirect("/admin/tutors?deleted=1");
}

/** A coach editing their own bio from /tutor/profile. */
export async function updateOwnTutorProfileAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  return run(async () => {
    const session = await assertRole("tutor");
    if (!session.tutorId) throw new ActionError("No coach profile linked.");
    const db = getSupabase();

    const { error } = await db
      .from("tutors")
      .update({
        specialization: optStr(fd, "specialization"),
        bio: optStr(fd, "bio"),
        city: optStr(fd, "city"),
        photo_url: optStr(fd, "photo_url"),
        positions: str(fd, "positions")
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean),
      })
      .eq("id", session.tutorId);
    if (error) throw error;

    await db
      .from("app_users")
      .update({ email: optStr(fd, "email"), phone: optStr(fd, "phone") })
      .eq("id", session.uid);

    revalidatePath("/tutor/profile");
    return { success: "Profile updated." };
  });
}
