"use server";

import { revalidatePath } from "next/cache";
import { getSupabase } from "@/lib/supabase";
import {
  assertRole,
  assertOwnsClient,
  ActionError,
  run,
  logActivity,
  str,
  optStr,
  optNum,
  num,
  metric,
  lines,
  bool,
  type ActionState,
} from "@/lib/action-utils";
import { getSession } from "@/lib/session";

/** Every write here touches one athlete's file — revalidate all three views. */
function revalidateClient(clientId: string) {
  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath(`/tutor/students/${clientId}`);
  revalidatePath("/portal");
  revalidatePath("/portal/training");
  revalidatePath("/portal/progress");
}

/* ════════════════════════════════════════════════════════════════
   TRAINING ASSIGNMENTS
════════════════════════════════════════════════════════════════ */

export async function saveAssignmentAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  return run(async () => {
    const session = await assertRole("admin", "tutor");
    const clientId = str(fd, "client_id");
    await assertOwnsClient(session, clientId);

    const title = str(fd, "title");
    if (!title) throw new ActionError("Give the training plan a title.");

    const row = {
      client_id: clientId,
      tutor_id: session.role === "tutor" ? session.tutorId : optStr(fd, "tutor_id"),
      program_id: optStr(fd, "program_id"),
      title,
      description: optStr(fd, "description"),
      sessions_per_week: optNum(fd, "sessions_per_week"),
      start_date: str(fd, "start_date") || new Date().toISOString().slice(0, 10),
      end_date: optStr(fd, "end_date"),
      status: str(fd, "status") || "assigned",
      progress_pct: Math.max(0, Math.min(100, num(fd, "progress_pct"))),
    };

    const db = getSupabase();
    const id = optStr(fd, "id");

    if (id) {
      const { error } = await db
        .from("training_assignments")
        .update(row)
        .eq("id", id);
      if (error) throw error;
      await logActivity(session, "assignment_updated", "training_assignments", id);
    } else {
      const { error } = await db.from("training_assignments").insert(row);
      if (error) throw error;
      await logActivity(session, "assignment_created", "training_assignments");
    }

    revalidateClient(clientId);
    return { success: id ? "Training plan updated." : "Training plan assigned." };
  });
}

export async function deleteAssignmentAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  return run(async () => {
    const session = await assertRole("admin", "tutor");
    const clientId = str(fd, "client_id");
    await assertOwnsClient(session, clientId);

    const { error } = await getSupabase()
      .from("training_assignments")
      .delete()
      .eq("id", str(fd, "id"));
    if (error) throw error;

    revalidateClient(clientId);
    return { success: "Training plan removed." };
  });
}

/* ════════════════════════════════════════════════════════════════
   TRAINING SESSIONS
════════════════════════════════════════════════════════════════ */

export async function saveSessionAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  return run(async () => {
    const session = await assertRole("admin", "tutor");
    const clientId = str(fd, "client_id");
    await assertOwnsClient(session, clientId);

    const row = {
      client_id: clientId,
      tutor_id: session.role === "tutor" ? session.tutorId : optStr(fd, "tutor_id"),
      assignment_id: optStr(fd, "assignment_id"),
      session_date:
        str(fd, "session_date") || new Date().toISOString().slice(0, 10),
      duration_min: optNum(fd, "duration_min"),
      focus: optStr(fd, "focus"),
      drills: lines(fd, "drills"),
      attendance: str(fd, "attendance") || "present",
      coach_rating: optNum(fd, "coach_rating"),
      notes: optStr(fd, "notes"),
      video_url: optStr(fd, "video_url"),
    };

    const db = getSupabase();
    const id = optStr(fd, "id");

    if (id) {
      const { error } = await db.from("training_sessions").update(row).eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await db.from("training_sessions").insert(row);
      if (error) throw error;
      await logActivity(session, "session_logged", "training_sessions", clientId);
    }

    revalidateClient(clientId);
    revalidatePath("/tutor/sessions");
    return { success: id ? "Session updated." : "Session logged." };
  });
}

export async function deleteSessionAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  return run(async () => {
    const session = await assertRole("admin", "tutor");
    const clientId = str(fd, "client_id");
    await assertOwnsClient(session, clientId);

    const { error } = await getSupabase()
      .from("training_sessions")
      .delete()
      .eq("id", str(fd, "id"));
    if (error) throw error;

    revalidateClient(clientId);
    revalidatePath("/tutor/sessions");
    return { success: "Session removed." };
  });
}

/* ════════════════════════════════════════════════════════════════
   PROGRESS RECORDS — the five tracked metrics
════════════════════════════════════════════════════════════════ */

export async function saveProgressAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  return run(async () => {
    const session = await assertRole("admin", "tutor");
    const clientId = str(fd, "client_id");
    await assertOwnsClient(session, clientId);

    const row = {
      client_id: clientId,
      tutor_id: session.role === "tutor" ? session.tutorId : optStr(fd, "tutor_id"),
      recorded_on:
        str(fd, "recorded_on") || new Date().toISOString().slice(0, 10),
      speed: metric(fd, "speed"),
      stamina: metric(fd, "stamina"),
      technique: metric(fd, "technique"),
      strength: metric(fd, "strength"),
      agility: metric(fd, "agility"),
      weight_kg: optNum(fd, "weight_kg"),
      height_cm: optNum(fd, "height_cm"),
      notes: optStr(fd, "notes"),
    };

    const db = getSupabase();
    const id = optStr(fd, "id");

    if (id) {
      const { error } = await db.from("progress_records").update(row).eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await db.from("progress_records").insert(row);
      if (error) throw error;
      await logActivity(session, "progress_recorded", "progress_records", clientId);
    }

    // Mirror the latest body measurements onto the athlete profile.
    if (row.weight_kg !== null || row.height_cm !== null) {
      const patch: Record<string, number> = {};
      if (row.weight_kg !== null) patch.weight_kg = row.weight_kg;
      if (row.height_cm !== null) patch.height_cm = row.height_cm;
      await db.from("clients").update(patch).eq("id", clientId);
    }

    revalidateClient(clientId);
    return { success: id ? "Progress updated." : "Progress recorded." };
  });
}

export async function deleteProgressAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  return run(async () => {
    const session = await assertRole("admin", "tutor");
    const clientId = str(fd, "client_id");
    await assertOwnsClient(session, clientId);

    const { error } = await getSupabase()
      .from("progress_records")
      .delete()
      .eq("id", str(fd, "id"));
    if (error) throw error;

    revalidateClient(clientId);
    return { success: "Progress entry removed." };
  });
}

/* ════════════════════════════════════════════════════════════════
   TRIAL REGISTRATIONS
════════════════════════════════════════════════════════════════ */

/** An athlete reserving their own slot from the portal. */
export async function reserveTrialSlotAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  return run(async () => {
    const session = await getSession();
    if (!session || session.role !== "client" || !session.clientId) {
      throw new ActionError("Log in as an athlete to reserve a slot.");
    }

    const trialId = str(fd, "trial_id");
    const db = getSupabase();

    const { data: trial } = await db
      .from("trials")
      .select("id, city, slots_left, status, is_published")
      .eq("id", trialId)
      .maybeSingle();

    if (!trial || !trial.is_published) throw new ActionError("That trial isn't available.");
    if (trial.status === "closed" || trial.status === "cancelled") {
      throw new ActionError("Registration for that trial has closed.");
    }
    if (trial.slots_left <= 0) throw new ActionError("That trial is full.");

    const { data: existing } = await db
      .from("trial_registrations")
      .select("id")
      .eq("trial_id", trialId)
      .eq("client_id", session.clientId)
      .maybeSingle();
    if (existing) throw new ActionError("You've already reserved this trial.");

    const { error } = await db.from("trial_registrations").insert({
      trial_id: trialId,
      client_id: session.clientId,
      status: "registered",
    });
    if (error) throw error;

    await db
      .from("trials")
      .update({ slots_left: Math.max(0, trial.slots_left - 1) })
      .eq("id", trialId);

    await logActivity(session, "trial_reserved", "trials", trialId);
    revalidatePath("/portal/trials");
    revalidatePath("/portal");
    revalidatePath(`/admin/trials/${trialId}`);

    return { success: `Slot reserved for ${trial.city}. Your coach will confirm it.` };
  });
}

export async function cancelRegistrationAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  return run(async () => {
    const session = await getSession();
    if (!session || session.role !== "client" || !session.clientId) {
      throw new ActionError("Log in as an athlete first.");
    }

    const db = getSupabase();
    const regId = str(fd, "id");

    const { data: reg } = await db
      .from("trial_registrations")
      .select("id, trial_id, status")
      .eq("id", regId)
      .eq("client_id", session.clientId)
      .maybeSingle();
    if (!reg) throw new ActionError("Registration not found.");
    if (["attended", "selected", "not_selected"].includes(reg.status)) {
      throw new ActionError("That trial has already been played.");
    }

    const { error } = await db
      .from("trial_registrations")
      .update({ status: "cancelled" })
      .eq("id", regId);
    if (error) throw error;

    const { data: trial } = await db
      .from("trials")
      .select("slots_left, total_slots")
      .eq("id", reg.trial_id)
      .maybeSingle();
    if (trial) {
      await db
        .from("trials")
        .update({
          slots_left: Math.min(trial.total_slots, trial.slots_left + 1),
        })
        .eq("id", reg.trial_id);
    }

    revalidatePath("/portal/trials");
    return { success: "Reservation cancelled." };
  });
}

/** Staff updating a registration outcome and panel score. */
export async function updateRegistrationAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  return run(async () => {
    const session = await assertRole("admin", "tutor");
    const regId = str(fd, "id");
    const db = getSupabase();

    const { data: reg } = await db
      .from("trial_registrations")
      .select("client_id, trial_id")
      .eq("id", regId)
      .maybeSingle();
    if (!reg) throw new ActionError("Registration not found.");
    await assertOwnsClient(session, reg.client_id);

    const score: Record<string, number> = {};
    for (const key of ["speed", "stamina", "technique", "strength", "agility"]) {
      const v = metric(fd, key);
      if (v !== null) score[key] = v;
    }

    const { error } = await db
      .from("trial_registrations")
      .update({
        status: str(fd, "status") || "registered",
        coach_notes: optStr(fd, "coach_notes"),
        score,
        reviewed_by: session.role === "tutor" ? session.tutorId : null,
      })
      .eq("id", regId);
    if (error) throw error;

    await logActivity(session, "registration_updated", "trial_registrations", regId);
    revalidatePath(`/admin/trials/${reg.trial_id}`);
    revalidatePath("/tutor/trials");
    revalidateClient(reg.client_id);
    return { success: "Trial result saved." };
  });
}

/** Staff adding one of their athletes to a trial directly. */
export async function addRegistrationAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  return run(async () => {
    const session = await assertRole("admin", "tutor");
    const clientId = str(fd, "client_id");
    const trialId = str(fd, "trial_id");
    await assertOwnsClient(session, clientId);

    const db = getSupabase();
    const { data: existing } = await db
      .from("trial_registrations")
      .select("id")
      .eq("trial_id", trialId)
      .eq("client_id", clientId)
      .maybeSingle();
    if (existing) throw new ActionError("That athlete is already registered.");

    const { error } = await db.from("trial_registrations").insert({
      trial_id: trialId,
      client_id: clientId,
      status: "confirmed",
    });
    if (error) throw error;

    const { data: trial } = await db
      .from("trials")
      .select("slots_left")
      .eq("id", trialId)
      .maybeSingle();
    if (trial) {
      await db
        .from("trials")
        .update({ slots_left: Math.max(0, trial.slots_left - 1) })
        .eq("id", trialId);
    }

    revalidatePath(`/admin/trials/${trialId}`);
    revalidateClient(clientId);
    return { success: "Athlete added to the trial." };
  });
}

/* ════════════════════════════════════════════════════════════════
   TRAINING PROGRAMME TEMPLATES
════════════════════════════════════════════════════════════════ */

export async function saveProgramAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  return run(async () => {
    const session = await assertRole("admin", "tutor");
    const title = str(fd, "title");
    if (!title) throw new ActionError("Give the programme a title.");

    const row = {
      title,
      position: optStr(fd, "position"),
      level: optStr(fd, "level"),
      weeks: optNum(fd, "weeks"),
      description: optStr(fd, "description"),
      focus_areas: lines(fd, "focus_areas"),
      is_template: bool(fd, "is_template"),
      created_by: session.uid,
    };

    const db = getSupabase();
    const id = optStr(fd, "id");

    if (id) {
      const { error } = await db.from("training_programs").update(row).eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await db.from("training_programs").insert(row);
      if (error) throw error;
    }

    revalidatePath("/admin/programs");
    revalidatePath("/tutor/programs");
    return { success: id ? "Programme updated." : "Programme created." };
  });
}

export async function deleteProgramAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  return run(async () => {
    await assertRole("admin", "tutor");
    const { error } = await getSupabase()
      .from("training_programs")
      .delete()
      .eq("id", str(fd, "id"));
    if (error) throw error;

    revalidatePath("/admin/programs");
    revalidatePath("/tutor/programs");
    return { success: "Programme removed." };
  });
}
