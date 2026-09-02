import { requireClient } from "@/lib/guards";
import { getClientDossier } from "@/lib/queries";
import { PageHead, EmptyState, StatCard } from "@/components/panel/PanelShell";
import { StatusPill } from "@/components/panel/bits";
import { fmtDate, inr, titleCase } from "@/lib/format";

export const metadata = { title: "Payments · Proforma Co" };

export default async function PortalPaymentsPage() {
  const session = await requireClient();
  if (!session.clientId) return null;

  const { client, payments, subscriptions } = await getClientDossier(
    session.clientId,
  );

  const paid = payments.filter((p) => p.status === "paid");
  const total = paid.reduce((a, p) => a + Number(p.amount), 0);
  const current = subscriptions.find((s) => s.status === "active");

  return (
    <>
      <PageHead
        title="Payments & membership"
        subtitle="Everything you've paid, and what your subscription covers."
      />

      <div className="stat-grid">
        <StatCard
          label="Current Plan"
          value={client?.plan_name ?? "—"}
          detail={current ? `${titleCase(current.cycle)} · ${inr(current.amount)}` : "No active subscription"}
          icon="rupee"
          accent="blue"
        />
        <StatCard
          label="Status"
          value={titleCase(client?.subscription_status)}
          detail={
            client?.subscription_end
              ? `Covered to ${fmtDate(client.subscription_end)}`
              : "—"
          }
          icon="check-circle"
          accent={client?.subscription_status === "active" ? "green" : "gold"}
        />
        <StatCard
          label="Paid To Date"
          value={inr(total)}
          detail={`${paid.length} payment${paid.length === 1 ? "" : "s"}`}
          icon="trending-up"
        />
        <StatCard
          label="Last Payment"
          value={paid[0] ? inr(paid[0].amount) : "—"}
          detail={paid[0] ? fmtDate(paid[0].paid_on) : "None recorded"}
          icon="calendar"
        />
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Payment history</h2>
          <span className="cap">Recorded by the Proforma Co team</span>
        </div>

        {payments.length === 0 ? (
          <EmptyState
            icon="rupee"
            title="No payments recorded"
            text="Once your first payment is recorded it appears here with its GST invoice number."
          />
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
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {subscriptions.length > 0 && (
        <div className="card">
          <div className="card-head">
            <h2>Subscription history</h2>
          </div>
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
                {subscriptions.map((s) => (
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
        </div>
      )}
    </>
  );
}
