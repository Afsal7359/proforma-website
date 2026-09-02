"use server";

import { revalidatePath } from "next/cache";
import { getSupabase } from "@/lib/supabase";
import {
  assertRole,
  ActionError,
  run,
  logActivity,
  str,
  optStr,
  num,
  optNum,
  bool,
  type ActionState,
} from "@/lib/action-utils";
import { DEFAULT_CONTENT, SECTION_LABELS } from "@/lib/default-content";

/* ════════════════════════════════════════════════════════════════
   SITE CONTENT — every word on the public page
════════════════════════════════════════════════════════════════ */

/**
 * The section editor posts one field per JSON path (`hero.stats.0.value`),
 * which this rebuilds into the nested shape the site expects. Arrays keep
 * their order because indices are numeric.
 */
function unflatten(entries: [string, string][]): Record<string, unknown> {
  const root: Record<string, unknown> = {};

  for (const [path, value] of entries) {
    const parts = path.split(".");
    let node: Record<string, unknown> | unknown[] = root;

    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i];
      const nextIsIndex = /^\d+$/.test(parts[i + 1]);
      const container = node as Record<string, unknown>;
      if (container[key] == null) container[key] = nextIsIndex ? [] : {};
      node = container[key] as Record<string, unknown> | unknown[];
    }

    const last = parts[parts.length - 1];
    (node as Record<string, unknown>)[last] = value;
  }

  // Arrays arrive as sparse objects when a row was deleted — compact them.
  const compact = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.filter((x) => x != null).map(compact);
    if (v && typeof v === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
        out[k] = compact(val);
      }
      return out;
    }
    return v;
  };

  return compact(root) as Record<string, unknown>;
}

/** Restores numbers/booleans that HTML forms flattened into strings. */
function coerceLikeDefault(value: unknown, reference: unknown): unknown {
  if (Array.isArray(reference)) {
    const sample = reference[0];
    const arr = Array.isArray(value) ? value : [];
    return arr.map((item) => coerceLikeDefault(item, sample));
  }
  if (reference && typeof reference === "object") {
    const out: Record<string, unknown> = {};
    const src = (value ?? {}) as Record<string, unknown>;
    for (const [k, refVal] of Object.entries(
      reference as Record<string, unknown>,
    )) {
      out[k] = k in src ? coerceLikeDefault(src[k], refVal) : refVal;
    }
    return out;
  }
  if (typeof reference === "number") {
    const n = Number(value);
    return Number.isFinite(n) ? n : reference;
  }
  if (typeof reference === "boolean") {
    return value === "true" || value === "on" || value === true;
  }
  return typeof value === "string" ? value : (value ?? reference);
}

export async function saveContentSectionAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  return run(async () => {
    const session = await assertRole("admin");
    const key = str(fd, "__section");

    if (!(key in DEFAULT_CONTENT)) {
      throw new ActionError(`Unknown section "${key}".`);
    }

    const entries: [string, string][] = [];
    for (const [name, value] of fd.entries()) {
      if (name.startsWith("__")) continue;
      if (typeof value !== "string") continue;
      entries.push([name, value]);
    }

    const raw = unflatten(entries);
    const reference = DEFAULT_CONTENT[key as keyof typeof DEFAULT_CONTENT];
    const data = coerceLikeDefault(raw[key] ?? raw, reference);

    const { error } = await getSupabase().from("site_content").upsert(
      {
        key,
        label: SECTION_LABELS[key as keyof typeof SECTION_LABELS] ?? key,
        data,
        updated_by: session.uid,
      },
      { onConflict: "key" },
    );
    if (error) throw error;

    await logActivity(session, "content_updated", "site_content", key);
    revalidatePath("/");
    revalidatePath("/admin/content");
    revalidatePath(`/admin/content/${key}`);
    return { success: "Saved. The live site is updated." };
  });
}

export async function resetContentSectionAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  return run(async () => {
    const session = await assertRole("admin");
    const key = str(fd, "__section");
    if (!(key in DEFAULT_CONTENT)) throw new ActionError("Unknown section.");

    const { error } = await getSupabase()
      .from("site_content")
      .delete()
      .eq("key", key);
    if (error) throw error;

    await logActivity(session, "content_reset", "site_content", key);
    revalidatePath("/");
    revalidatePath(`/admin/content/${key}`);
    return { success: "Section reset to the original wording." };
  });
}

/* ════════════════════════════════════════════════════════════════
   TRIALS
════════════════════════════════════════════════════════════════ */

export async function saveTrialAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  return run(async () => {
    const session = await assertRole("admin");
    const city = str(fd, "city");
    const date = str(fd, "trial_date");
    if (!city) throw new ActionError("A trial needs a city.");
    if (!date) throw new ActionError("A trial needs a date.");

    const total = num(fd, "total_slots");
    const left = optNum(fd, "slots_left");

    const row = {
      city,
      state: optStr(fd, "state"),
      venue: optStr(fd, "venue"),
      address: optStr(fd, "address"),
      trial_date: date,
      trial_time: optStr(fd, "trial_time"),
      age_group: optStr(fd, "age_group"),
      tag: str(fd, "tag") || "Open Trial",
      total_slots: total,
      slots_left: Math.max(0, Math.min(total, left ?? total)),
      status: str(fd, "status") || "upcoming",
      description: optStr(fd, "description"),
      requirements: optStr(fd, "requirements"),
      is_published: bool(fd, "is_published"),
      sort_order: num(fd, "sort_order"),
    };

    const db = getSupabase();
    const id = optStr(fd, "id");

    if (id) {
      const { error } = await db.from("trials").update(row).eq("id", id);
      if (error) throw error;
      await logActivity(session, "trial_updated", "trials", id);
    } else {
      const { error } = await db.from("trials").insert(row);
      if (error) throw error;
      await logActivity(session, "trial_created", "trials", undefined, { city });
    }

    revalidatePath("/admin/trials");
    revalidatePath("/portal/trials");
    revalidatePath("/tutor/trials");
    return { success: id ? "Trial updated." : "Trial added." };
  });
}

export async function deleteTrialAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  return run(async () => {
    const session = await assertRole("admin");
    const id = str(fd, "id");
    const { error } = await getSupabase().from("trials").delete().eq("id", id);
    if (error) throw error;

    await logActivity(session, "trial_deleted", "trials", id);
    revalidatePath("/admin/trials");
    revalidatePath("/portal/trials");
    return { success: "Trial removed." };
  });
}

/* ════════════════════════════════════════════════════════════════
   VIDEO LIBRARY
════════════════════════════════════════════════════════════════ */

export async function saveVideoAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  return run(async () => {
    const session = await assertRole("admin");
    const title = str(fd, "title");
    if (!title) throw new ActionError("A video needs a title.");

    const row = {
      title,
      category: optStr(fd, "category"),
      duration_min: optNum(fd, "duration_min"),
      thumbnail_url: optStr(fd, "thumbnail_url"),
      video_url: optStr(fd, "video_url"),
      description: optStr(fd, "description"),
      position_tag: optStr(fd, "position_tag"),
      is_new: bool(fd, "is_new"),
      is_public: bool(fd, "is_public"),
      sort_order: num(fd, "sort_order"),
    };

    const db = getSupabase();
    const id = optStr(fd, "id");

    if (id) {
      const { error } = await db.from("videos").update(row).eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await db.from("videos").insert(row);
      if (error) throw error;
    }

    await logActivity(
      session,
      id ? "video_updated" : "video_created",
      "videos",
      id ?? undefined,
    );
    revalidatePath("/admin/videos");
    revalidatePath("/portal/library");
    revalidatePath("/");
    return { success: id ? "Video updated." : "Video added." };
  });
}

export async function deleteVideoAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  return run(async () => {
    await assertRole("admin");
    const { error } = await getSupabase()
      .from("videos")
      .delete()
      .eq("id", str(fd, "id"));
    if (error) throw error;

    revalidatePath("/admin/videos");
    revalidatePath("/");
    return { success: "Video removed." };
  });
}

/* ════════════════════════════════════════════════════════════════
   ANNOUNCEMENTS
════════════════════════════════════════════════════════════════ */

export async function saveAnnouncementAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  return run(async () => {
    const session = await assertRole("admin");
    const title = str(fd, "title");
    if (!title) throw new ActionError("An announcement needs a title.");

    const row = {
      title,
      body: optStr(fd, "body"),
      audience: str(fd, "audience") || "all",
      is_published: bool(fd, "is_published"),
      created_by: session.uid,
    };

    const db = getSupabase();
    const id = optStr(fd, "id");

    if (id) {
      const { error } = await db.from("announcements").update(row).eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await db.from("announcements").insert(row);
      if (error) throw error;
    }

    revalidatePath("/admin/announcements");
    revalidatePath("/portal");
    revalidatePath("/tutor");
    return { success: id ? "Announcement updated." : "Announcement posted." };
  });
}

export async function deleteAnnouncementAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  return run(async () => {
    await assertRole("admin");
    const { error } = await getSupabase()
      .from("announcements")
      .delete()
      .eq("id", str(fd, "id"));
    if (error) throw error;

    revalidatePath("/admin/announcements");
    revalidatePath("/portal");
    return { success: "Announcement removed." };
  });
}

/* ════════════════════════════════════════════════════════════════
   SEED — one-tap population of the CMS from the shipped defaults
════════════════════════════════════════════════════════════════ */

export async function seedContentAction(
  _prev: ActionState,
  _fd: FormData,
): Promise<ActionState> {
  return run(async () => {
    const session = await assertRole("admin");
    const rows = Object.entries(DEFAULT_CONTENT).map(([key, data], i) => ({
      key,
      label: SECTION_LABELS[key as keyof typeof SECTION_LABELS] ?? key,
      data,
      sort_order: i,
      updated_by: session.uid,
    }));

    const { error } = await getSupabase()
      .from("site_content")
      .upsert(rows, { onConflict: "key" });
    if (error) throw error;

    revalidatePath("/");
    revalidatePath("/admin/content");
    return { success: `Loaded ${rows.length} sections into the CMS.` };
  });
}
