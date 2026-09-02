"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type FormState } from "@/app/actions/auth";
import { Alert } from "@/components/Alert";

export function LoginForm({
  next,
  forbidden,
}: {
  next?: string;
  forbidden?: boolean;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    loginAction,
    null,
  );

  return (
    <>
      <Link href="/" className="brand" aria-label="Proforma Co home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-mark.png" alt="" width={36} height={36} />
        <span className="brand-text">
          <span className="name">PROFORMA CO</span>
          <span className="sub">Sports Consultancy</span>
        </span>
      </Link>

      <h1>Log in</h1>
      <p className="lede">
        Use the login ID and password sent to you on WhatsApp.
      </p>

      {forbidden && (
        <Alert kind="warn">
          That area belongs to a different role. Log in with the right account.
        </Alert>
      )}
      {state?.error && <Alert kind="error">{state.error}</Alert>}

      <form action={formAction}>
        <input type="hidden" name="next" value={next ?? ""} />

        <div className="field">
          <label htmlFor="loginId">Login ID</label>
          <input
            id="loginId"
            name="loginId"
            type="text"
            autoComplete="username"
            placeholder="PFC-4821"
            required
            autoFocus
            spellCheck={false}
            autoCapitalize="characters"
          />
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={pending}
        >
          {pending ? "Checking…" : "Log In"}
        </button>
      </form>

      <div className="auth-foot">
        Lost your login? Message your coach on WhatsApp and they&apos;ll re-send
        it. <Link href="/">Back to the site</Link>
      </div>
    </>
  );
}
