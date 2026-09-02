"use client";

import { useActionState } from "react";
import { seedContentAction } from "@/app/actions/cms";
import { Icon } from "@/components/Icon";
import type { ActionState } from "@/lib/action-utils";

/**
 * Copies the shipped default copy into `site_content` so every section shows
 * as an editable row. Safe to run repeatedly — it upserts by key.
 */
export function SeedButton() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    seedContentAction,
    null,
  );

  return (
    <form action={formAction} style={{ display: "inline-block" }}>
      <button
        type="submit"
        className="btn btn-quiet btn-sm"
        disabled={pending}
        title="Writes the original wording into the database so it's editable"
      >
        <Icon name="save" width={14} height={14} />
        {pending
          ? "Loading…"
          : state?.success
            ? "Loaded ✓"
            : "Load Defaults Into CMS"}
      </button>
    </form>
  );
}
