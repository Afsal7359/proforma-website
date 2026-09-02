import Link from "next/link";
import { requireAdmin } from "@/lib/guards";
import { listClients, listPayments, listPlans } from "@/lib/queries";
import { PageHead, EmptyState, StatCard } from "@/components/panel/PanelShell";
import { StatusPill } from "@/components/panel/bits";
import { ActionForm, InlineAction } from "@/components/panel/ActionForm";
import {
  Field,
  Row,
  Select,
  TextArea,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
} from "@/components/Fields";
import {
  savePaymentAction,
  deletePaymentAction,
  setPaymentStatusAction,
} from "@/app/actions/billing";
import { fmtDate, inr, titleCase } from "@/lib/format";

export const metadata = { title: "Payments · Proforma Co" };

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;

  const [payments, clients, plans] = await Promise.all([
    listPayments({ limit: 400 }),
    listClients(),
    listPlans(),
  ]);

  const filtered = params.status
    ? payments.filter((p) => p.status === params.status)
    : payments;

  const paid = payments.filter((p) => p.status === "paid");
  const total = paid.reduce((a, p) => a + Number(p.amount), 0);
  const monthKey = new Date().toISOString().slice(0, 7);
  const thisMonth = paid
    .filter((p) => p.paid_on.startsWith(monthKey))
    .reduce((a, p) => a + Number(p.amount), 0);
  const pending = payments.filter((p) => p.status === "pending");

  return (
    <>
      <PageHead
        title="Payments"
        subtitle="Every payment recorded against an athlete. Recording a paid payment marks their membership active."
      />

      <div className="stat-grid">
        <StatCard
          label="This Month"
          value={inr(thisMonth)}
          detail={`${paid.filter((p) => p.paid_on.startsWith(monthKey)).length} payments`}
          icon="trending-up"
          accent="green"
        />
        <StatCard
          label="All Time"
          value={inr(total)}
          detail={`${paid.length} paid records`}
          icon="rupee"
          accent="blue"
        />
        <StatCard
          label="Pending"
          value={pending.length}
          detail={inr(pending.reduce((a, p) => a + Number(p.amount), 0))}
          icon="clock"
          accent={pending.length ? "gold" : undefined}
        />
        <StatCard
          label="Average Payment"
          value={paid.length ? inr(Math.round(total / paid.length)) : "—"}
          icon="scale"
        />
      </div>

      <div className="grid-2 wide-left">
        <div className="card">
          <div className="card-head">
            <h2>Payment records</h2>
            <form method="get" className="row-gap">
              <select name="status" defaultValue={params.status ?? ""}>
                <option value="">All statuses</option>
                {PAYMENT_STATUS_OPTIONS.map((o) => (
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
              title="No payments recorded"
              text="Record one on the right, or from an athlete's page."
            />
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Athlete</th>
                    <th className="num">Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Invoice</th>
                    <th className="actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id}>
                      <td className="nowrap strong">{fmtDate(p.paid_on)}</td>
                      <td>
                        {p.client ? (
                          <Link
                            href={`/admin/clients/${p.client.id}`}
                            className="rowlink"
                          >
                            {p.client.full_name}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="num strong">{inr(p.amount)}</td>
                      <td>{titleCase(p.method)}</td>
                      <td>
                        <StatusPill value={p.status} />
                      </td>
                      <td className="mono small">{p.invoice_no ?? "—"}</td>
                      <td className="actions">
                        <div className="row-gap" style={{ justifyContent: "flex-end" }}>
                          {p.status !== "paid" && (
                            <InlineAction
                              action={setPaymentStatusAction}
                              label="Mark Paid"
                              hidden={{
                                id: p.id,
                                status: "paid",
                                client_id: p.client_id,
                              }}
                            />
                          )}
                          {p.status === "paid" && (
                            <InlineAction
                              action={setPaymentStatusAction}
                              label="Refund"
                              hidden={{
                                id: p.id,
                                status: "refunded",
                                client_id: p.client_id,
                              }}
                              confirm="Mark this payment as refunded?"
                            />
                          )}
                          <InlineAction
                            action={deletePaymentAction}
                            label="Remove"
                            hidden={{ id: p.id, client_id: p.client_id }}
                            confirm="Remove this payment record?"
                          />
                        </div>
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
            <h2>Record a payment</h2>
          </div>
          <div className="card-body">
            {clients.length === 0 ? (
              <EmptyState
                icon="users"
                title="Add an athlete first"
                text="Payments are always recorded against an athlete."
                action={
                  <Link href="/admin/clients/new" className="btn btn-primary btn-sm">
                    Add Athlete
                  </Link>
                }
              />
            ) : (
              <ActionForm
                action={savePaymentAction}
                submitLabel="Record Payment"
                resetOnSuccess
              >
                <Select
                  name="client_id"
                  label="Athlete"
                  required
                  placeholder="— pick an athlete —"
                  options={clients.map((c) => ({
                    value: c.id,
                    label: `${c.full_name}${c.plan_name ? ` · ${c.plan_name}` : ""}`,
                  }))}
                />
                <Row>
                  <Field
                    name="amount"
                    label="Amount (₹)"
                    type="number"
                    step="0.01"
                    min={1}
                    required
                    placeholder={String(plans[0]?.price_monthly ?? 1499)}
                  />
                  <Field
                    name="paid_on"
                    label="Paid on"
                    type="date"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                  />
                </Row>
                <Row>
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
                <Row>
                  <Field
                    name="period_start"
                    label="Covers from"
                    type="date"
                    hint="Sets the membership window."
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
            )}
          </div>
        </div>
      </div>
    </>
  );
}
