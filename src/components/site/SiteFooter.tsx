"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import type { SiteContent } from "@/lib/default-content";

export function SiteFooter({
  brand,
  footer,
}: {
  brand: SiteContent["brand"];
  footer: SiteContent["footer"];
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">(
    "idle",
  );

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setState("sending");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setState(res.ok ? "done" : "error");
      if (res.ok) setEmail("");
    } catch {
      setState("error");
    }
  }

  return (
    <footer className="band-dark">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <a href="#top" className="brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-mark-alt.png" alt="" width={38} height={38} />
              <span className="brand-text">
                <span className="name">{brand.name}</span>
                <span className="sub">{brand.sub}</span>
              </span>
            </a>
            <p>{footer.about}</p>
            <form className="footer-newsletter" onSubmit={subscribe}>
              <label className="visually-hidden" htmlFor="newsletterEmail">
                Email address
              </label>
              <input
                type="email"
                id="newsletterEmail"
                placeholder={
                  state === "done"
                    ? "Thanks — you're on the list."
                    : footer.newsletterPlaceholder
                }
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (state !== "idle") setState("idle");
                }}
                required
              />
              <button type="submit" disabled={state === "sending"}>
                {state === "sending" ? "…" : footer.newsletterButton}
              </button>
            </form>
            {state === "error" && (
              <p
                className="small"
                style={{ color: "#FCA5A5", marginTop: 10 }}
              >
                Couldn&apos;t save that — please try again.
              </p>
            )}
          </div>

          <div className="footer-cols">
            {footer.columns.map((col) => (
              <div className="footer-col" key={col.heading}>
                <h5>{col.heading}</h5>
                {col.links.map((l) => (
                  <a href={l.href} key={l.label + l.href}>
                    {l.label}
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-legal-row">
            <span id="copyrightYear">
              © {new Date().getFullYear()} {footer.copyright}
            </span>
            <div className="footer-social">
              {footer.social.map((s) => (
                <a href={s.href} aria-label={s.label} key={s.label}>
                  <Icon name={s.icon} />
                </a>
              ))}
            </div>
          </div>
          <span>{footer.legal}</span>
        </div>
      </div>
    </footer>
  );
}
