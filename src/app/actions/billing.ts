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
  lines,
  type ActionState,
} from "@/lib/action-utils";

function revalidateBilling(clientId?: string | null) {
  revalidatePath("/admin/payments");
  revalidatePath("/admin/subscriptions");
  revalidatePath("/admin");
  if (clientId) {
    revalidatePath(`/admin/clients/${clientId}`);
    revalidatePath(`/tutor/students/${clientId}`);
  }
  revalidatePath("/portal/payments");
}

/* ════════════════════════════════════════════════════════════════
   PLANS — public pricing tiers
════════════════════════════════════════════════════════════════ */

export async function savePlanAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  return run(async () => {
    const session = await assertRole("admin");
    const name = str(fd, "name");
    if (!name) throw new ActionError("A plan needs a name.");

    const slug =
      str(fd, "slug") ||
      name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const row = {
      name,
      slug,
      description: optStr(fd, "description"),
      price_monthly: num(fd, "price_monthly"),
      price_annual: num(fd, "price_annual"),
      annual_note: optStr(fd, "annual_note"),
      features: lines(fd, "features"),
      badge: optStr(fd, "badge"),
      is_featured: bool(fd, "is_featured"),
      cta_label: optStr(fd, "cta_label"),
      sort_order: num(fd, "sort_order"),
      is_active: bool(fd, "is_active"),
    };

    const db = getSupabase();
    const id = optStr(fd, "id");

    // Only one tier can carry the highlighted treatment.
    if (row.is_featured) {
      await db
        .from("plans")
        .update({ is_featured: false })
        .neq("id", id ?? "00000000-0000-0000-0000-000000000000");
    }

    if (id) {
      const { error } = await db.from("plans").update(row).eq("id", id);
      if (error) throw error;
      await logActivity(session, "plan_updated", "plans", id);
    } else {
      const { error } = await db.from("plans").insert(row);
      if (error) throw error;
      await logActivity(session, "plan_created", "plans");
    }

    revalidatePath("/admin/plans");
    revalidatePath("/");
    return { success: id ? "Plan updated." : "Plan created." };
  });
}

export async function deletePlanAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  return run(async () => {
    await assertRole("admin");
    const { error } = await getSupabase()
      .from("plans")
      .delete()
      .eq("id", str(fd, "id"));
    if (error) throw error;

    revalidatePath("/admin/plans");
    revalidatePath("/");
    return { success: "Plan removed." };
  });
}

/* ════════════════════════════════════════════════════════════════
   SUBSCRIPTIONS — who is paid / subscribed, and for how much
════════════════════════════════════════════════════════════════ */

export async function saveSubscriptionAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  return run(async () => {
    const session = await assertRole("admin");
    const db = getSupabase();

    const clientId = str(fd, "client_id");
    if (!clientId) throw new ActionError("Pick an athlete.");

    const planId = optStr(fd, "plan_id");
    let planName = optStr(fd, "plan_name");
    if (planId && !planName) {
      const { data: plan } = await db
        .from("plans")
        .select("name")
        .eq("id", planId)
        .maybeSingle();
      planName = plan?.name ?? null;
    }

    const row = {
      client_id: clientId,
      plan_id: planId,
      plan_name: planName,
      cycle: str(fd, "cycle") || "monthly",
      amount: num(fd, "amount"),
      status: str(fd, "status") || "active",
      start_date: str(fd, "start_date") || new Date().toISOString().slice(0, 10),
      end_date: optStr(fd, "end_date"),
      notes: optStr(fd, "notes"),
      created_by: session.uid,
    };

    const id = optStr(fd, "id");
    if (id) {
      const { error } = await db.from("subscriptions").update(row).eq("id", id);
      if (error) throw error;
      await logActivity(session, "subscription_updated", "subscriptions", id);
    } else {
      const { error } = await db.from("subscriptions").insert(row);
      if (error) throw error;
      await logActivity(session, "subscription_created", "subscriptions", clientId);
    }

    // The athlete profile carries the current state, so keep it in step.
    await db
      .from("clients")
      .update({
        plan_id: planId,
        subscription_status: row.status,
        subscription_start: row.start_date,
        subscription_end: row.end_date,
      })
      .eq("id", clientId);

    revalidateBilling(clientId);
    return { success: id ? "Subscription updated." : "Subscription added." };
  });
}

export async function deleteSubscriptionAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  return run(async () => {
    await assertRole("admin");
    const clientId = optStr(fd, "client_id");
    const { error } = await getSupabase()
      .from("subscriptions")
      .delete()
      .eq("id", str(fd, "id"));
    if (error) throw error;

    revalidateBilling(clientId);
    return { success: "Subscription removed." };
  });
}

/** Fast toggle from the subscribers table. */
export async function setSubscriptionStatusAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  return run(async () => {
    const session = await assertRole("admin");
    const clientId = str(fd, "client_id");
    const status = str(fd, "status");

    const db = getSupabase();
    const { error } = await db
      .from("clients")
      .update({ subscription_status: status })
      .eq("id", clientId);
    if (error) throw error;

    await logActivity(session, "subscription_status_set", "clients", clientId, {
      status,
    });
    revalidateBilling(clientId);
    return { success: `Subscription marked ${status}.` };
  });
}

/* ════════════════════════════════════════════════════════════════
   PAYMENTS
════════════════════════════════════════════════════════════════ */

export async function savePaymentAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  return run(async () => {
    const session = await assertRole("admin");
    const db = getSupabase();

    const clientId = str(fd, "client_id");
    if (!clientId) throw new ActionError("Pick an athlete.");

    const amount = num(fd, "amount");
    if (amount <= 0) throw new ActionError("Enter an amount greater than zero.");

    const row = {
      client_id: clientId,
      subscription_id: optStr(fd, "subscription_id"),
      amount,
      currency: str(fd, "currency") || "INR",
      method: str(fd, "method") || "upi",
      status: str(fd, "status") || "paid",
      paid_on: str(fd, "paid_on") || new Date().toISOString().slice(0, 10),
      period_start: optStr(fd, "period_start"),
      period_end: optStr(fd, "period_end"),
      reference: optStr(fd, "reference"),
      invoice_no: optStr(fd, "invoice_no"),
      notes: optStr(fd, "notes"),
      recorded_by: session.uid,
    };

    const id = optStr(fd, "id");
    if (id) {
      const { error } = await db.from("payments").update(row).eq("id", id);
      if (error) throw error;
      await logActivity(session, "payment_updated", "payments", id, { amount });
    } else {
      const { error } = await db.from("payments").insert(row);
      if (error) throw error;
      await logActivity(session, "payment_recorded", "payments", clientId, {
        amount,
      });
    }

    // A successful payment activates the athlete, and extends cover when a
    // billing period was supplied.
    if (row.status === "paid") {
      const patch: Record<string, string> = { subscription_status: "active" };
      if (row.period_end) patch.subscription_end = row.period_end;
      if (row.period_start) patch.subscription_start = row.period_start;
      await db.from("clients").update(patch).eq("id", clientId);
    }

    revalidateBilling(clientId);
    return { success: id ? "Payment updated." : "Payment recorded." };
  });
}

export async function deletePaymentAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  return run(async () => {
    const session = await assertRole("admin");
    const clientId = optStr(fd, "client_id");
    const id = str(fd, "id");

    const { error } = await getSupabase().from("payments").delete().eq("id", id);
    if (error) throw error;

    await logActivity(session, "payment_deleted", "payments", id);
    revalidateBilling(clientId);
    return { success: "Payment removed." };
  });
}

export async function setPaymentStatusAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  return run(async () => {
    await assertRole("admin");
    const status = str(fd, "status");
    const { error } = await getSupabase()
      .from("payments")
      .update({ status })
      .eq("id", str(fd, "id"));
    if (error) throw error;

    revalidateBilling(optStr(fd, "client_id"));
    return { success: `Payment marked ${status}.` };
  });
}

/* ── used by the "record next payment" shortcut on an athlete page ──────── */

export async function quickPaymentAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  return run(async () => {
    const session = await assertRole("admin");
    const clientId = str(fd, "client_id");
    const amount = optNum(fd, "amount");
    if (!amount || amount <= 0) throw new ActionError("Enter an amount.");

    const db = getSupabase();
    const { error } = await db.from("payments").insert({
      client_id: clientId,
      amount,
      method: str(fd, "method") || "upi",
      status: "paid",
      paid_on: new Date().toISOString().slice(0, 10),
      recorded_by: session.uid,
    });
    if (error) throw error;

    await db
      .from("clients")
      .update({ subscription_status: "active" })
      .eq("id", clientId);

    revalidateBilling(clientId);
    return { success: "Payment recorded." };
  });
}
