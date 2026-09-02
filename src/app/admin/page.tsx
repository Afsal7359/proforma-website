import Link from "next/link";
import { requireAdmin } from "@/lib/guards";
import {
  adminStats,
  listClients,
  listPayments,
  listTrials,
  listActivity,
} from "@/lib/queries";
import { PageHead, StatCard, EmptyState } from "@/components/panel/PanelShell";
import { Person, StatusPill, TimelineItem } from "@/components/panel/bits";
import { fmtDate, fmtDateTime, inr, relativeDays, titleCase } from "@/lib/format";

export default async function AdminDashboard() {
  await requireAdmin();

  const [stats, clients, payments, trials, activity] = await Promise.all([
    adminStats(),
    listClients(),
    listPayments({ limit: 8 }),
    listTrials({ upcomingOnly: true }),
    listActivity(10),
  ]);

  const needsLogin = clients.filter((c) => !c.login_id);
  const expiring = clients.filter(
    (c) =>
      c.subscription_end &&
      new Date(c.subscription_end) <
        new Date(Date.now() + 14 * 86_400_000) &&
      c.subscription_status === "active",
  );

  return (
    <>
      <PageHead
        title="Dashboard"
        subtitle="Revenue, roster and the trial calendar at a glance."
        actions={
          <>
            <Link href="/admin/clients/new" className="btn btn-primary btn-sm">
              Add Athlete
            </Link>
            <Link href="/admin/trials" className="btn btn-ghost btn-sm">
              Add Trial
            </Link>
          </>
        }
      />

      <div className="stat-grid">
        <StatCard
          label="Revenue This Month"
          value={inr(stats.revenueThisMonth)}
          detail={`${inr(stats.revenueTotal)} all time`}
          icon="trending-up"
          accent="green"
        />
        <StatCard
          label="Active Subscriptions"
          value={stats.activeSubs}
          detail={`of ${stats.clients} athletes`}
          icon="check-circle"
          accent="blue"
        />
        <StatCard
          label="Athletes"
          value={stats.clients}
          detail={`${needsLogin.length} without a portal login`}
          icon="users"
        />
        <StatCard
          label="Coaches"
          value={stats.tutors}
          detail="Active on the panel"
          icon="whistle"
        />
        <StatCard
          label="Upcoming Trials"
          value={stats.upcomingTrials}
          detail={
            trials[0]
              ? `Next: ${trials[0].city} ${relativeDays(trials[0].trial_date)}`
              : "None scheduled"
          }
          icon="calendar"
          accent="gold"
        />
      </div>

      <div className="grid-2 wide-left">
        <div>
          <div className="card">
            <div className="card-head">
              <h2>Recent payments</h2>
              <Link href="/admin/payments" className="btn btn-ghost btn-sm">
                All Payments
              </Link>
            </div>
            {payments.length === 0 ? (
              <EmptyState
                icon="rupee"
                title="No payments recorded"
                text="Record your first payment from an athlete's page or the Payments screen."
                action={
                  <Link href="/admin/payments" className="btn btn-primary btn-sm">
                    Record a Payment
                  </Link>
                }
              />
            ) : (
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Athlete</th>
                      <th className="num">Amount</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th className="num">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id}>
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
                        <td className="num small muted nowrap">
                          {fmtDate(p.paid_on)}
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
              <h2>Newest athletes</h2>
              <Link href="/admin/clients" className="btn btn-ghost btn-sm">
                All Athletes
              </Link>
            </div>
            {clients.length === 0 ? (
              <EmptyState
                icon="users"
                title="No athletes yet"
                text="Add your first athlete — a portal login is generated for them automatically."
                action={
                  <Link href="/admin/clients/new" className="btn btn-primary btn-sm">
                    Add Athlete
                  </Link>
                }
              />
            ) : (
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Athlete</th>
                      <th>Coach</th>
                      <th>Membership</th>
                      <th>Login</th>
                      <th className="num">Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.slice(0, 8).map((c) => (
                      <tr key={c.id}>
                        <td>
                          <Link
                            href={`/admin/clients/${c.id}`}
                            className="rowlink"
                          >
                            <Person
                              name={c.full_name}
                              meta={[c.position, c.city]
                                .filter(Boolean)
                                .join(" · ")}
                            />
                          </Link>
                        </td>
                        <td>{c.tutor_name ?? "—"}</td>
                        <td>
                          <StatusPill value={c.subscription_status} />
                        </td>
                        <td className="mono small">
                          {c.login_id ?? (
                            <span className="pill pill-gold plain">Not issued</span>
                          )}
                        </td>
                        <td className="num">{inr(c.total_paid)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div>
          {expiring.length > 0 && (
            <div className="card">
              <div className="card-head">
                <h2>Renewals due</h2>
                <span className="cap">Within 14 days</span>
              </div>
              <div className="card-body">
                <div className="stack">
                  {expiring.slice(0, 6).map((c) => (
                    <Link
                      href={`/admin/clients/${c.id}`}
                      key={c.id}
                      className="note-item"
                      style={{ display: "block" }}
                    >
                      <div className="top">
                        <h4>{c.full_name}</h4>
                        <span className="pill pill-gold">
                          {relativeDays(c.subscription_end)}
                        </span>
                      </div>
                      <p className="small">
                        {c.plan_name ?? "No plan"} · ends{" "}
                        {fmtDate(c.subscription_end)}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-head">
              <h2>Trial calendar</h2>
              <Link href="/admin/trials" className="btn btn-ghost btn-sm">
                Manage
              </Link>
            </div>
            {trials.length === 0 ? (
              <EmptyState
                icon="calendar"
                title="No trials scheduled"
                text="Athletes only see trials after logging in — publish one to open registration."
                action={
                  <Link href="/admin/trials" className="btn btn-primary btn-sm">
                    Add a Trial
                  </Link>
                }
              />
            ) : (
              <div className="card-body">
                <div className="stack">
                  {trials.slice(0, 6).map((t) => (
                    <Link
                      href={`/admin/trials/${t.id}`}
                      key={t.id}
                      className="note-item"
                      style={{ display: "block" }}
                    >
                      <div className="top">
                        <h4>
                          {t.city}
                          {t.state ? `, ${t.state}` : ""}
                        </h4>
                        <time>{relativeDays(t.trial_date)}</time>
                      </div>
                      <p className="small">
                        {fmtDate(t.trial_date)} · {t.slots_left}/{t.total_slots}{" "}
                        slots left
                        {t.is_published ? "" : " · unpublished"}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-head">
              <h2>Activity</h2>
            </div>
            {activity.length === 0 ? (
              <EmptyState icon="activity" title="Nothing logged yet" />
            ) : (
              <div className="card-body">
                <div className="timeline">
                  {activity.map((a) => (
                    <TimelineItem
                      key={a.id}
                      icon="activity"
                      title={titleCase(a.action)}
                      text={a.actor_name ? `by ${a.actor_name}` : null}
                      time={fmtDateTime(a.created_at)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
