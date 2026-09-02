import { NextResponse } from "next/server";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const clean = String(email ?? "").trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Not configured" }, { status: 503 });
    }

    const { error } = await getSupabase()
      .from("newsletter_signups")
      .upsert({ email: clean, source: "footer" }, { onConflict: "email" });

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[newsletter]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
