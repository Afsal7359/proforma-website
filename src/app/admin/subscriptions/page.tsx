import Link from "next/link";
import { requireAdmin } from "@/lib/guards";
import { listClients, listPlans, listSubscriptions } from "@/lib/queries";
import { PageHead, EmptyState, StatCard } from "@/components/panel/PanelShell";
import { Person, StatusPill } from "@/components/panel/bits";
import { ActionForm, InlineAction } from "@/components/panel/ActionForm";
import {
  Field,
  Row,
  Select,
  TextArea,
  CYCLE_OPTIONS,
  SUB_STATUS_OPTIONS,
} from "@/components/Fields";
import {
  saveSubscriptionAction,
  deleteSubscriptionAction,
  setSubscriptionStatusAction,
} from "@/app/actions/billing";
import { fmtDate, inr, relativeDays, titleCase } from "@/lib/format";

export const metadata = { title: "Subscriptions · Proforma Co" };

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;

  const [subscriptions, clients, plans] = await Promise.all([
    listSubscriptions(),
    listClients(),
    listPlans(),
  ]);

  const filtered = params.status
    ? subscriptions.filter((s) => s.status === params.status)
    : subscriptions;

  const subscribed = clients.filter((c) => c.subscription_status === "active");
  const mrr = subscriptions
    .filter((s) => s.status === "active")
    .reduce(
      (a, s) => a + (s.cycle === "annual" ? Number(s.amount) / 12 : Number(s.amount)),
      0,
    );
  const expiringSoon = clients.filter(
    (c) =>
      c.subscription_status === "active" &&
      c.subscription_end &&
      new Date(c.subscription_end) < new Date(Date.now() + 14 * 86_400_000),
  );

  return (
    <>
      <PageHead
        title="Subscriptions"
        subtitle="Who is paid up, on what plan and for how much. Add a subscription or change an amount here."
      />

      <div className="stat-grid">
        <StatCard
          label="Subscribed Athletes"
          value={subscribed.length}
          detail={`of ${clients.length} on the roster`}
          icon="check-circle"
          accent="green"
        />
        <StatCard
          label="Monthly Recurring"
          value={inr(Math.round(mrr))}
          detail="Annual plans counted per month"
          icon="trending-up"
          accent="blue"
        />
        <StatCard
          label="Renewals Due"
          value={expiringSoon.length}
          detail="Within 14 days"
          icon="calendar"
          accent={expiringSoon.length ? "gold" : undefined}
        />
        <StatCard
          label="Subscription Records"
          value={subscriptions.length}
          detail="All time"
          icon="clipboard"
        />
      </div>

      {/* ── quick status board ── */}
      <div className="card">
        <div className="card-head">
          <h2>Membership status by athlete</h2>
          <span className="cap">Change a status without opening the athlete</span>
        </div>
        {clients.length === 0 ? (
          <EmptyState icon="users" title="No athletes yet" />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Athlete</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Covered to</th>
                  <th className="num">Paid</th>
                  <th className="actions">Set status</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/admin/clients/${c.id}`} className="rowlink">
                        <Person
                          name={c.full_name}
                          meta={[c.position, c.city].filter(Boolean).join(" · ")}
                        />
                      </Link>
                    </td>
                    <td>{c.plan_name ?? "—"}</td>
                    <td>
                      <StatusPill value={c.subscription_status} />
                    </td>
                    <td className="small muted nowrap">
                      {c.subscription_end ? (
                        <>
                          {fmtDate(c.subscription_end)}
                          <div>{relativeDays(c.subscription_end)}</div>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="num">{inr(c.total_paid)}</td>
                    <td className="actions">
                      <div className="row-gap" style={{ justifyContent: "flex-end" }}>
                        {c.subscription_status !== "active" && (
                          <InlineAction
                            action={setSubscriptionStatusAction}
                            label="Active"
                            hidden={{ client_id: c.id, status: "active" }}
                          />
                        )}
                        {c.subscription_status !== "expired" && (
                          <InlineAction
                            action={setSubscriptionStatusAction}
                            label="Expired"
                            hidden={{ client_id: c.id, status: "expired" }}
                          />
                        )}
                        {c.subscription_status !== "cancelled" && (
                          <InlineAction
                            action={setSubscriptionStatusAction}
                            label="Cancel"
                            hidden={{ client_id: c.id, status: "cancelled" }}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid-2 wide-left">
        <div className="card">
          <div className="card-head">
            <h2>Subscription records</h2>
            <form method="get" className="row-gap">
              <select name="status" defaultValue={params.status ?? ""}>
                <option value="">All</option>
                {SUB_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn btn-ghost btn-sm">
                Filter
              </button>
            </form>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon="rupee"
              title="No subscription records"
              text="Add one on the right to track the plan, amount and billing period."
            />
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Athlete</th>
                    <th>Plan</th>
                    <th>Cycle</th>
                    <th className="num">Amount</th>
                    <th>Period</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id}>
                      <td>
                        {s.client ? (
                          <Link
                            href={`/admin/clients/${s.client.id}`}
                            className="rowlink"
                          >
                            {s.client.full_name}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>{s.plan_name ?? "—"}</td>
                      <td>{titleCase(s.cycle)}</td>
                      <td className="num strong">{inr(s.amount)}</td>
                      <td className="small muted nowrap">
                        {fmtDate(s.start_date)}
                        {s.end_date ? ` → ${fmtDate(s.end_date)}` : ""}
                      </td>
                      <td>
                        <StatusPill value={s.status} />
                      </td>
                      <td className="actions">
                        <InlineAction
                          action={deleteSubscriptionAction}
                          label="Remove"
                          hidden={{ id: s.id, client_id: s.client_id }}
                          confirm="Remove this subscription record?"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Add a subscription</h2>
            <span className="cap">Also updates the athlete&apos;s membership</span>
          </div>
          <div className="card-body">
            <ActionForm
              action={saveSubscriptionAction}
              submitLabel="Add Subscription"
              resetOnSuccess
            >
              <Select
                name="client_id"
                label="Athlete"
                required
                placeholder="— pick an athlete —"
                options={clients.map((c) => ({
                  value: c.id,
                  label: `${c.full_name}${c.city ? ` · ${c.city}` : ""}`,
                }))}
              />
              <Row>
                <Select
                  name="plan_id"
                  label="Plan"
                  placeholder="— custom —"
                  options={plans.map((p) => ({
                    value: p.id,
                    label: `${p.name} · ${inr(p.price_monthly)}/mo`,
                  }))}
                />
                <Select
                  name="cycle"
                  label="Billing cycle"
                  options={CYCLE_OPTIONS}
                  defaultValue="monthly"
                />
              </Row>
              <Row>
                <Field
                  name="amount"
                  label="Amount (₹)"
                  type="number"
                  step="0.01"
                  required
                  hint="What they actually pay — override the plan price for discounts."
                />
                <Select
                  name="status"
                  label="Status"
                  options={SUB_STATUS_OPTIONS}
                  defaultValue="active"
                />
              </Row>
              <Row>
                <Field
                  name="start_date"
                  label="Starts"
                  type="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                />
                <Field name="end_date" label="Ends" type="date" />
              </Row>
              <TextArea name="notes" label="Notes" rows={2} />
            </ActionForm>
          </div>
        </div>
      </div>
    </>
  );
}
