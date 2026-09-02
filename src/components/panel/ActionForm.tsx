"use client";

import { useActionState, useId } from "react";
import { Alert } from "@/components/Alert";
import { Icon } from "@/components/Icon";
import type { ActionState } from "@/lib/action-utils";

type Action = (prev: ActionState, fd: FormData) => Promise<ActionState>;

/**
 * Standard panel form: runs a server action, surfaces its error/success
 * message, and reveals generated credentials when the action mints them.
 */
export function ActionForm({
  action,
  submitLabel = "Save",
  submitClass = "btn btn-primary",
  children,
  hidden,
  footer,
  resetOnSuccess,
}: {
  action: Action;
  submitLabel?: string;
  submitClass?: string;
  children: React.ReactNode;
  hidden?: Record<string, string | number | null | undefined>;
  footer?: React.ReactNode;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    null,
  );

  // `footer` often holds an <InlineAction>, which is itself a <form>, and a
  // form can't nest inside another form. So the action row lives *outside*
  // the form element, and the submit button reaches back into it via the
  // HTML `form` attribute. useId can emit characters that aren't valid in an
  // id, so it's stripped down to a safe token.
  const formId = `af-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <>
      <form
        id={formId}
        action={formAction}
        key={resetOnSuccess && state?.success ? state.success : undefined}
      >
        {hidden &&
          Object.entries(hidden).map(([k, v]) =>
            v == null ? null : (
              <input key={k} type="hidden" name={k} value={String(v)} />
            ),
          )}

        {state?.error && <Alert kind="error">{state.error}</Alert>}
        {state?.success && !state.credentials && (
          <Alert kind="success">{state.success}</Alert>
        )}
        {state?.credentials && (
          <CredentialBox
            {...state.credentials}
            message={state.success ?? "Login created."}
          />
        )}

        {children}
      </form>

      <div className="form-actions">
        <button
          type="submit"
          form={formId}
          className={submitClass}
          disabled={pending}
        >
          {pending ? "Saving…" : submitLabel}
        </button>
        {footer}
      </div>
    </>
  );
}

/**
 * One-click action rendered as a button — delete, toggle, mark paid.
 * Destructive variants ask for confirmation first.
 */
export function InlineAction({
  action,
  label,
  hidden,
  className = "btn btn-quiet btn-sm",
  confirm,
  icon,
  title,
}: {
  action: Action;
  label: React.ReactNode;
  hidden?: Record<string, string | number | null | undefined>;
  className?: string;
  confirm?: string;
  icon?: string;
  title?: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    null,
  );

  return (
    <form
      action={formAction}
      style={{ display: "inline-block" }}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {hidden &&
        Object.entries(hidden).map(([k, v]) =>
          v == null ? null : (
            <input key={k} type="hidden" name={k} value={String(v)} />
          ),
        )}
      <button
        type="submit"
        className={className}
        disabled={pending}
        title={title ?? (state?.error || undefined)}
      >
        {icon && <Icon name={icon} width={15} height={15} />}
        {pending ? "…" : label}
      </button>
    </form>
  );
}

/** Shows a freshly generated login once, with a pre-filled WhatsApp invite. */
export function CredentialBox({
  name,
  loginId,
  password,
  whatsapp,
  message,
}: {
  name: string;
  loginId: string;
  password: string;
  whatsapp: string | null;
  message?: string;
}) {
  return (
    <div className="cred-box" style={{ marginBottom: 22 }}>
      <h4>{message ?? `Login for ${name}`}</h4>

      <div className="cred-row">
        <div>
          <span className="k">Login ID</span>
          <span className="v">{loginId}</span>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{ color: "#fff", borderColor: "rgba(255,255,255,.25)" }}
          onClick={() => navigator.clipboard?.writeText(loginId)}
        >
          Copy
        </button>
      </div>

      <div className="cred-row">
        <div>
          <span className="k">One-time password</span>
          <span className="v">{password}</span>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{ color: "#fff", borderColor: "rgba(255,255,255,.25)" }}
          onClick={() =>
            navigator.clipboard?.writeText(
              `Login ID: ${loginId}\nPassword: ${password}`,
            )
          }
        >
          Copy both
        </button>
      </div>

      <p className="cred-note">
        This password is shown once here and stays visible on the athlete&apos;s
        page until they change it. They&apos;ll be asked to set their own
        password the first time they log in.
      </p>

      {whatsapp ? (
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-wa btn-block"
        >
          <Icon name="whatsapp" width={17} height={17} />
          Send on WhatsApp
        </a>
      ) : (
        <p className="cred-note">
          Add a phone number to this profile to get a one-tap WhatsApp invite.
        </p>
      )}
    </div>
  );
}
