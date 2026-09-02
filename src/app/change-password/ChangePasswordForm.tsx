"use client";

import { useActionState } from "react";
import { changePasswordAction, type FormState } from "@/app/actions/auth";
import { Alert } from "@/components/Alert";
import { LogoutButton } from "@/components/LogoutButton";

export function ChangePasswordForm({ forced }: { forced: boolean }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    changePasswordAction,
    null,
  );

  return (
    <>
      {forced && (
        <Alert kind="info">
          This is your first login, so you need to replace the generated
          password before continuing.
        </Alert>
      )}
      {state?.error && <Alert kind="error">{state.error}</Alert>}

      <form action={formAction}>
        <div className="field">
          <label htmlFor="currentPassword">Current password</label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            autoFocus
          />
          <span className="hint">The one sent to you on WhatsApp.</span>
        </div>

        <div className="field">
          <label htmlFor="newPassword">New password</label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <span className="hint">
            At least 8 characters, including a letter and a number.
          </span>
        </div>

        <div className="field">
          <label htmlFor="confirmPassword">Confirm new password</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={pending}
        >
          {pending ? "Saving…" : "Save Password"}
        </button>
      </form>

      <div className="auth-foot">
        <LogoutButton className="btn btn-ghost btn-sm">
          Log out instead
        </LogoutButton>
      </div>
    </>
  );
}
