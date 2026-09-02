"use client";

import { useState } from "react";
import { Heading } from "@/components/Heading";
import { CheckMark } from "@/components/Icon";
import { inr } from "@/lib/format";
import type { SiteContent } from "@/lib/default-content";
import type { Plan } from "@/lib/types";

export function PlansSection({
  plans,
  copy,
  enquiryHref,
}: {
  plans: Plan[];
  copy: SiteContent["plans"];
  enquiryHref: string;
}) {
  const [annual, setAnnual] = useState(false);

  return (
    <section className="section section-alt" id="plans">
      <div className="container">
        <div
          className="section-head center reveal"
          style={{ marginLeft: "auto", marginRight: "auto" }}
        >
          <div className="eyebrow" style={{ justifyContent: "center" }}>
            {copy.eyebrow}
          </div>
          <h2 className="section-title">
            <Heading text={copy.title} />
          </h2>
          <p
            className="section-sub"
            style={{ marginLeft: "auto", marginRight: "auto" }}
          >
            {copy.sub}
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <div className="billing-toggle" id="billingToggle">
            <button
              type="button"
              className={annual ? "" : "is-active"}
              onClick={() => setAnnual(false)}
            >
              {copy.monthlyLabel}
            </button>
            <button
              type="button"
              className={annual ? "is-active" : ""}
              onClick={() => setAnnual(true)}
            >
              {copy.annualLabel} <span className="save">{copy.annualSave}</span>
            </button>
          </div>
        </div>

        <div className={`plans-grid${annual ? " is-annual" : ""}`} id="plansGrid">
          {plans.map((plan) => (
            <div
              className={`plan-card ${
                plan.is_featured ? "is-featured" : "card-surface"
              } reveal`}
              key={plan.id}
            >
              {plan.badge && <span className="plan-badge">{plan.badge}</span>}
              <span className="plan-name">{plan.name}</span>
              {plan.description && (
                <p className="plan-desc">{plan.description}</p>
              )}
              <div className="plan-price">
                <div data-billing="monthly">
                  <span className="amt">{inr(plan.price_monthly)}</span>
                  <span className="per">/ month</span>
                </div>
                <div data-billing="annual">
                  <span className="amt">{inr(plan.price_annual)}</span>
                  <span className="per">/ year</span>
                  {plan.annual_note && (
                    <span className="annual-note">{plan.annual_note}</span>
                  )}
                </div>
              </div>
              <ul className="plan-features">
                {(plan.features ?? []).map((f) => (
                  <li key={f}>
                    <CheckMark />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href={enquiryHref}
                className={`btn ${
                  plan.is_featured ? "btn-primary" : "btn-ghost"
                } btn-block`}
              >
                {plan.cta_label || `Choose ${plan.name}`}
              </a>
            </div>
          ))}
        </div>

        <p className="plans-footnote">{copy.footnote}</p>
      </div>
    </section>
  );
}
