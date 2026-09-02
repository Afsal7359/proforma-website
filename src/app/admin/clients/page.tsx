import Link from "next/link";
import { requireAdmin } from "@/lib/guards";
import { listClients } from "@/lib/queries";
import { PageHead, EmptyState, StatCard } from "@/components/panel/PanelShell";
import { Person, StatusPill } from "@/components/panel/bits";
import { Alert } from "@/components/Alert";
import { fmtDate, inr, overallScore } from "@/lib/format";

export const metadata = { title: "Athletes · Proforma Co" };

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    subscription?: string;
    deleted?: string;
  }>;
}) {
  await requireAdmin();
  const params = await searchParams;

  const clients = await listClients({
    search: params.q,
    status: params.status,
    subscription: params.subscription,
  });

  const active = clients.filter((c) => c.subscription_status === "active");
  const noLogin = clients.filter((c) => !c.login_id);
  const revenue = clients.reduce((a, c) => a + Number(c.total_paid ?? 0), 0);

  return (
    <>
      <PageHead
        title="Athletes"
        subtitle="Your full roster — profiles, coaches, memberships and portal logins."
        actions={
          <Link href="/admin/clients/new" className="btn btn-primary btn-sm">
            Add Athlete
          </Link>
        }
      />

      {params.deleted && <Alert kind="success">Athlete removed.</Alert>}

      <div className="stat-grid">
        <StatCard label="Total Athletes" value={clients.length} icon="users" />
        <StatCard
          label="Subscribed"
          value={active.length}
          detail="Active memberships"
          icon="check-circle"
          accent="green"
        />
        <StatCard
          label="Without A Login"
          value={noLogin.length}
          detail="Can't reach the portal yet"
          icon="key"
          accent={noLogin.length ? "gold" : undefined}
        />
        <StatCard
          label="Collected"
          value={inr(revenue)}
          detail="From this filtered list"
          icon="rupee"
          accent="blue"
        />
      </div>

      <div className="card">
        <form className="toolbar" method="get">
          <input
            type="search"
            name="q"
            placeholder="Search name, city, phone or position…"
            defaultValue={params.q ?? ""}
          />
          <select name="status" defaultValue={params.status ?? ""}>
            <option value="">All statuses</option>
            <option value="lead">Lead</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="alumni">Alumni</option>
          </select>
          <select name="subscription" defaultValue={params.subscription ?? ""}>
            <option value="">All memberships</option>
            <option value="active">Subscribed</option>
            <option value="trial">Trial</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
            <option value="none">No subscription</option>
          </select>
          <button type="submit" className="btn btn-primary btn-sm">
            Filter
          </button>
          {(params.q || params.status || params.subscription) && (
            <Link href="/admin/clients" className="btn btn-ghost btn-sm">
              Clear
            </Link>
          )}
        </form>

        {clients.length === 0 ? (
          <EmptyState
            icon="users"
            title="No athletes found"
            text="Add an athlete and a portal login is generated for them automatically."
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
                  <th>Plan</th>
                  <th>Membership</th>
                  <th>Login ID</th>
                  <th className="num">Form</th>
                  <th className="num">Paid</th>
                  <th className="num">Joined</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/admin/clients/${c.id}`} className="rowlink">
                        <Person
                          name={c.full_name}
                          meta={[c.position, c.city, c.phone]
                            .filter(Boolean)
                            .join(" · ")}
                        />
                      </Link>
                    </td>
                    <td>{c.tutor_name ?? "—"}</td>
                    <td>{c.plan_name ?? "—"}</td>
                    <td>
                      <StatusPill value={c.subscription_status} />
                    </td>
                    <td className="mono small">
                      {c.login_id ?? (
                        <span className="pill pill-gold plain">Not issued</span>
                      )}
                    </td>
                    <td className="num strong">{overallScore(c) ?? "—"}</td>
                    <td className="num">{inr(c.total_paid)}</td>
                    <td className="num small muted nowrap">
                      {fmtDate(c.joined_on)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
