"use server";
import type { ActionState } from "@/lib/action-utils";
export async function noopSave(_p: ActionState, fd: FormData): Promise<ActionState> {
  return { success: `saved:${fd.get("demo") ?? ""}` };
}
export async function noopDelete(_p: ActionState, _fd: FormData): Promise<ActionState> {
  return { success: "deleted" };
}
