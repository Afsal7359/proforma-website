import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/guards";
import {
  getClientDossier,
  listTutors,
  listPlans,
  listTrials,
} from "@/lib/queries";
import { getSupabase } from "@/lib/supabase";
import { PageHead } from "@/components/panel/PanelShell";
import { StatusPill } from "@/components/panel/bits";
import {
  AthleteSnapshot,
  TrainingPlansCard,
  SessionsCard,
  ProgressCard,
  AthleteTrialsCard,
} from "@/components/panel/AthleteCards";
import { ClientForm } from "@/components/panel/ClientForm";
import { ActionForm, InlineAction, CredentialBox } from "@/components/panel/ActionForm";
import {
  Field,
  Row,
  Select,
  TextArea,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  CYCLE_OPTIONS,
  SUB_STATUS_OPTIONS,
} from "@/components/Fields";
import {
  savePaymentAction,
  deletePaymentAction,
  saveSubscriptionAction,
} from "@/app/actions/billing";
import {
  deleteClientAction,
  issueClientLoginAction,
  regenerateCredentialsAction,
} from "@/app/actions/people";
import { addRegistrationAction } from "@/app/actions/coaching";
import { buildWhatsAppInvite } from "@/lib/auth";
import { fmtDate, fmtDateTime, inr, titleCase } from "@/lib/format";

export default async function AdminClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [dossier, tutors, plans, trials] = await Promise.all([
    getClientDossier(id),
    listTutors(),
    listPlans(),
    listTrials({ upcomingOnly: true }),
  ]);

  const { client } = dossier;
  if (!client) notFound();

  // The generated password stays visible until the athlete sets their own.
  const { data: loginRow } = client.user_id
    ? await getSupabase()
        .from("app_users")
        .select("id, initial_password, must_change_password, is_active")
        .eq("id", client.user_id)
        .maybeSingle()
    : { data: null };

  const pendingCredential =
    loginRow?.initial_password && client.login_id
      ? {
          name: client.full_name,
          loginId: client.login_id,
          password: loginRow.initial_password as string,
          whatsapp: buildWhatsAppInvite({
            phone: client.phone,
            name: client.full_name,
            loginId: client.login_id,
            password: loginRow.initial_password as string,
            role: "client",
            siteUrl:
              process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
              "http://localhost:3000",
          }),
        }
      : null;

  const today = new Date().toISOString().slice(0, 10);
  const totalPaid = dossier.payments
    .filter((p) => p.status === "paid")
    .reduce((a, p) => a + Number(p.amount), 0);

  return (
    <>
      <PageHead
        breadcrumb={[
          { label: "Athletes", href: "/admin/clients" },
          { label: client.full_name },
        ]}
        title={client.full_name}
        subtitle={
          [
            client.position,
            [client.city, client.state].filter(Boolean).join(", "),
            client.age ? `${client.age} years` : null,
            client.tutor_name ? `Coach: ${client.tutor_name}` : "No coach assigned",
          ]
            .filter(Boolean)
            .join(" · ") || undefined
        }
        actions={
          <>
            <StatusPill value={client.status} />
            <StatusPill value={client.subscription_status} />
            <InlineAction
              action={deleteClientAction}
              label="Delete"
              icon="trash"
              className="btn btn-danger btn-sm"
              hidden={{ id: client.id }}
              confirm={`Delete ${client.full_name}? Their sessions, scores, payments and login are all removed. This can't be undone.`}
            />
          </>
        }
      />

      <div className="grid-2 wide-left">
        <div>
          <AthleteSnapshot client={client} latest={dossier.progress[0]} />
          <ProgressCard clientId={client.id} progress={dossier.progress} />
          <SessionsCard
            clientId={client.id}
            sessions={dossier.sessions}
            assignments={dossier.assignments}
          />
          <TrainingPlansCard
            clientId={client.id}
            assignments={dossier.assignments}
          />
          <AthleteTrialsCard registrations={dossier.registrations} />

          {/* ── payments ── */}
          <div className="card">
            <div className="card-head">
              <div>
                <h2>Payments</h2>
                <span className="cap">{inr(totalPaid)} collected</span>
              </div>
            </div>

            {dossier.payments.length === 0 ? (
              <div className="card-body">
                <p className="small muted">No payments recorded yet.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th className="num">Amount</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th>Covers</th>
                      <th>Invoice</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {dossier.payments.map((p) => (
                      <tr key={p.id}>
                        <td className="nowrap strong">{fmtDate(p.paid_on)}</td>
                        <td className="num strong">{inr(p.amount)}</td>
                        <td>{titleCase(p.method)}</td>
                        <td>
                          <StatusPill value={p.status} />
                        </td>
                        <td className="small muted nowrap">
                          {p.period_start
                            ? `${fmtDate(p.period_start)} → ${fmtDate(p.period_end)}`
                            : "—"}
                        </td>
                        <td className="mono small">{p.invoice_no ?? "—"}</td>
                        <td className="actions">
                          <InlineAction
                            action={deletePaymentAction}
                            label="Remove"
                            hidden={{ id: p.id, client_id: client.id }}
                            confirm="Remove this payment record?"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="card-foot">
              <details>
                <summary
                  className="btn btn-primary btn-sm"
                  style={{ display: "inline-flex", listStyle: "none" }}
                >
                  Record a payment
                </summary>
                <div style={{ marginTop: 20 }}>
                  <ActionForm
                    action={savePaymentAction}
                    submitLabel="Record Payment"
                    hidden={{ client_id: client.id }}
                    resetOnSuccess
                  >
                    <Row cols={3}>
                      <Field
                        name="amount"
                        label="Amount (₹)"
                        type="number"
                        step="0.01"
                        min={1}
                        required
                        defaultValue={
                          plans.find((p) => p.id === client.plan_id)
                            ?.price_monthly
                        }
                      />
                      <Select
                        name="method"
                        label="Method"
                        options={PAYMENT_METHOD_OPTIONS}
                        defaultValue="upi"
                      />
                      <Select
                        name="status"
                        label="Status"
                        options={PAYMENT_STATUS_OPTIONS}
                        defaultValue="paid"
                      />
                    </Row>
                    <Row cols={3}>
                      <Field
                        name="paid_on"
                        label="Paid on"
                        type="date"
                        defaultValue={today}
                      />
                      <Field
                        name="period_start"
                        label="Covers from"
                        type="date"
                      />
                      <Field name="period_end" label="Covers to" type="date" />
                    </Row>
                    <Row>
                      <Field
                        name="invoice_no"
                        label="Invoice no."
                        placeholder="PFC-2026-014"
                      />
                      <Field
                        name="reference"
                        label="Reference / UTR"
                        placeholder="UPI ref"
                      />
                    </Row>
                    <TextArea name="notes" label="Notes" rows={2} />
                  </ActionForm>
                </div>
              </details>
            </div>
          </div>

          {/* ── subscription ── */}
          <div className="card">
            <div className="card-head">
              <h2>Subscription history</h2>
              <span className="cap">{dossier.subscriptions.length} on file</span>
            </div>

            {dossier.subscriptions.length > 0 && (
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Plan</th>
                      <th>Cycle</th>
                      <th className="num">Amount</th>
                      <th>Period</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dossier.subscriptions.map((s) => (
                      <tr key={s.id}>
                        <td className="strong">{s.plan_name ?? "—"}</td>
                        <td>{titleCase(s.cycle)}</td>
                        <td className="num">{inr(s.amount)}</td>
                        <td className="small muted nowrap">
                          {fmtDate(s.start_date)}
                          {s.end_date ? ` → ${fmtDate(s.end_date)}` : ""}
                        </td>
                        <td>
                          <StatusPill value={s.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="card-foot">
              <details>
                <summary
                  className="btn btn-primary btn-sm"
                  style={{ display: "inline-flex", listStyle: "none" }}
                >
                  Add / update subscription
                </summary>
                <div style={{ marginTop: 20 }}>
                  <ActionForm
                    action={saveSubscriptionAction}
                    submitLabel="Save Subscription"
                    hidden={{ client_id: client.id }}
                    resetOnSuccess
                  >
                    <Row cols={3}>
                      <Select
                        name="plan_id"
                        label="Plan"
                        options={plans.map((p) => ({
                          value: p.id,
                          label: p.name,
                        }))}
                        placeholder="— custom —"
                        defaultValue={client.plan_id}
                      />
                      <Select
                        name="cycle"
                        label="Billing cycle"
                        options={CYCLE_OPTIONS}
                        defaultValue="monthly"
                      />
                      <Field
                        name="amount"
                        label="Amount (₹)"
                        type="number"
                        step="0.01"
                        required
                        defaultValue={
                          plans.find((p) => p.id === client.plan_id)
                            ?.price_monthly
                        }
                      />
                    </Row>
                    <Row cols={3}>
                      <Select
                        name="status"
                        label="Status"
                        options={SUB_STATUS_OPTIONS}
                        defaultValue="active"
                      />
                      <Field
                        name="start_date"
                        label="Starts"
                        type="date"
                        defaultValue={today}
                      />
                      <Field name="end_date" label="Ends" type="date" />
                    </Row>
                    <TextArea name="notes" label="Notes" rows={2} />
                  </ActionForm>
                </div>
              </details>
            </div>
          </div>
        </div>

        {/* ── right column ── */}
        <div>
          {pendingCredential && (
            <div className="card">
              <div className="card-body">
                <CredentialBox
                  {...pendingCredential}
                  message="Login not yet used — share it again any time"
                />
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-head">
              <h2>Portal login</h2>
            </div>
            <div className="card-body">
              <dl className="kv">
                <div>
                  <dt>Login ID</dt>
                  <dd className="mono">{client.login_id ?? "Not issued"}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>
                    {client.login_id ? (
                      loginRow?.is_active ? (
                        <span className="pill pill-green">Active</span>
                      ) : (
                        <span className="pill pill-red">Disabled</span>
                      )
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Password set</dt>
                  <dd>
                    {!client.login_id
                      ? "—"
                      : loginRow?.must_change_password
                        ? "Still the generated one"
                        : "Chosen by athlete"}
                  </dd>
                </div>
                <div>
                  <dt>Last login</dt>
                  <dd>{fmtDateTime(client.last_login_at)}</dd>
                </div>
              </dl>
            </div>
            <div className="card-foot">
              <div className="row-gap">
                {client.user_id ? (
                  <InlineAction
                    action={regenerateCredentialsAction}
                    label="Generate New Password"
                    icon="key"
                    className="btn btn-primary btn-sm"
                    hidden={{ userId: client.user_id }}
                    confirm="Generate a new password? The current one stops working immediately."
                  />
                ) : (
                  <InlineAction
                    action={issueClientLoginAction}
                    label="Create Portal Login"
                    icon="key"
                    className="btn btn-primary btn-sm"
                    hidden={{ clientId: client.id }}
                  />
                )}
              </div>
            </div>
          </div>

          {trials.length > 0 && (
            <div className="card">
              <div className="card-head">
                <h2>Book onto a trial</h2>
              </div>
              <div className="card-body">
                <ActionForm
                  action={addRegistrationAction}
                  submitLabel="Register"
                  hidden={{ client_id: client.id }}
                  resetOnSuccess
                >
                  <Select
                    name="trial_id"
                    label="Trial"
                    required
                    placeholder="— pick a trial —"
                    options={trials.map((t) => ({
                      value: t.id,
                      label: `${t.city} · ${fmtDate(t.trial_date)} · ${t.slots_left} left`,
                    }))}
                  />
                </ActionForm>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-head">
              <h2>Edit athlete</h2>
            </div>
            <div className="card-body">
              <ClientForm
                client={client}
                tutors={tutors.map((t) => ({
                  id: t.id,
                  name: t.user?.full_name ?? "Coach",
                }))}
                plans={plans}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
