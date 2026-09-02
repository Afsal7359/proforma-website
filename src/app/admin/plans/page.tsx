import Link from "next/link";
import { requireAdmin } from "@/lib/guards";
import { listPlans } from "@/lib/queries";
import { PageHead, EmptyState } from "@/components/panel/PanelShell";
import { ActionForm, InlineAction } from "@/components/panel/ActionForm";
import { Field, Row, TextArea, Checkbox } from "@/components/Fields";
import { savePlanAction, deletePlanAction } from "@/app/actions/billing";
import { Alert } from "@/components/Alert";
import { inr } from "@/lib/format";

export const metadata = { title: "Plans & Pricing · Proforma Co" };

export default async function AdminPlansPage() {
  await requireAdmin();
  const plans = await listPlans();

  return (
    <>
      <PageHead
        title="Plans & pricing"
        subtitle="The membership tiers shown on the public homepage and used when recording subscriptions."
        actions={
          <Link href="/#plans" target="_blank" className="btn btn-ghost btn-sm">
            View On Site
          </Link>
        }
      />

      <Alert kind="info">
        Whatever you set here renders in the pricing section of the live site,
        including the monthly/annual toggle and the highlighted tier.
      </Alert>

      {plans.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="target"
            title="No plans yet"
            text="Add your first tier below — until then the site falls back to the original Starter / Pro / Elite pricing."
          />
        </div>
      ) : (
        <div className="stack">
          {plans.map((plan) => (
            <div className="card" key={plan.id}>
              <div className="card-head">
                <div>
                  <h2>
                    {plan.name}{" "}
                    {plan.is_featured && (
                      <span className="pill pill-gold">Featured</span>
                    )}
                    {!plan.is_active && (
                      <span className="pill pill-grey">Hidden</span>
                    )}
                  </h2>
                  <span className="cap">
                    {inr(plan.price_monthly)} / month ·{" "}
                    {inr(plan.price_annual)} / year
                  </span>
                </div>
                <InlineAction
                  action={deletePlanAction}
                  label="Delete"
                  icon="trash"
                  className="btn btn-danger btn-sm"
                  hidden={{ id: plan.id }}
                  confirm={`Delete the ${plan.name} plan?`}
                />
              </div>
              <div className="card-body">
                <ActionForm
                  action={savePlanAction}
                  submitLabel="Save Plan"
                  hidden={{ id: plan.id }}
                >
                  <Row cols={3}>
                    <Field
                      name="name"
                      label="Name"
                      required
                      defaultValue={plan.name}
                    />
                    <Field name="slug" label="Slug" defaultValue={plan.slug} />
                    <Field
                      name="badge"
                      label="Badge"
                      defaultValue={plan.badge}
                      placeholder="Most Booked"
                    />
                  </Row>
                  <Field
                    name="description"
                    label="One-line description"
                    defaultValue={plan.description}
                  />
                  <Row cols={3}>
                    <Field
                      name="price_monthly"
                      label="Monthly price (₹)"
                      type="number"
                      step="0.01"
                      defaultValue={plan.price_monthly}
                    />
                    <Field
                      name="price_annual"
                      label="Annual price (₹)"
                      type="number"
                      step="0.01"
                      defaultValue={plan.price_annual}
                    />
                    <Field
                      name="sort_order"
                      label="Sort order"
                      type="number"
                      defaultValue={plan.sort_order}
                    />
                  </Row>
                  <Row>
                    <Field
                      name="annual_note"
                      label="Annual note"
                      defaultValue={plan.annual_note}
                      placeholder="≈ ₹1,249 / month billed yearly"
                    />
                    <Field
                      name="cta_label"
                      label="Button label"
                      defaultValue={plan.cta_label}
                      placeholder="Choose Starter"
                    />
                  </Row>
                  <TextArea
                    name="features"
                    label="Features"
                    rows={5}
                    hint="One feature per line."
                    defaultValue={(plan.features ?? []).join("\n")}
                  />
                  <Row>
                    <Checkbox
                      name="is_featured"
                      label="Highlight this tier"
                      defaultChecked={plan.is_featured}
                      hint="Only one tier can be highlighted."
                    />
                    <Checkbox
                      name="is_active"
                      label="Show on the public site"
                      defaultChecked={plan.is_active}
                    />
                  </Row>
                </ActionForm>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-head">
          <h2>Add a plan</h2>
        </div>
        <div className="card-body">
          <ActionForm action={savePlanAction} submitLabel="Create Plan" resetOnSuccess>
            <Row cols={3}>
              <Field name="name" label="Name" required placeholder="Elite" />
              <Field name="slug" label="Slug" placeholder="elite" />
              <Field name="badge" label="Badge" placeholder="Most Booked" />
            </Row>
            <Field
              name="description"
              label="One-line description"
              placeholder="For trial-ready athletes."
            />
            <Row cols={3}>
              <Field
                name="price_monthly"
                label="Monthly price (₹)"
                type="number"
                step="0.01"
                defaultValue={0}
              />
              <Field
                name="price_annual"
                label="Annual price (₹)"
                type="number"
                step="0.01"
                defaultValue={0}
              />
              <Field
                name="sort_order"
                label="Sort order"
                type="number"
                defaultValue={plans.length + 1}
              />
            </Row>
            <Row>
              <Field name="annual_note" label="Annual note" />
              <Field name="cta_label" label="Button label" />
            </Row>
            <TextArea
              name="features"
              label="Features"
              rows={5}
              hint="One feature per line."
            />
            <Row>
              <Checkbox name="is_featured" label="Highlight this tier" />
              <Checkbox
                name="is_active"
                label="Show on the public site"
                defaultChecked
              />
            </Row>
          </ActionForm>
        </div>
      </div>
    </>
  );
}
