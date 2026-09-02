import Link from "next/link";
import { requireAdmin } from "@/lib/guards";
import { getSupabase } from "@/lib/supabase";
import { listActivity } from "@/lib/queries";
import { PageHead, StatCard, EmptyState } from "@/components/panel/PanelShell";
import { TimelineItem } from "@/components/panel/bits";
import { Alert } from "@/components/Alert";
import { Icon } from "@/components/Icon";
import { fmtDateTime, relativeDays, titleCase } from "@/lib/format";

export const metadata = { title: "Settings & Health · Proforma Co" };

export default async function AdminSettingsPage() {
  await requireAdmin();
  const db = getSupabase();

  const [{ data: ping }, { data: signups }, activity, { count: users }] =
    await Promise.all([
      db.from("keepalive_ping").select("*").eq("id", 1).maybeSingle(),
      db
        .from("newsletter_signups")
        .select("email, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      listActivity(40),
      db.from("app_users").select("id", { count: "exact", head: true }),
    ]);

  const lastPing = ping?.pinged_at ? new Date(ping.pinged_at) : null;
  const hoursSince = lastPing
    ? Math.round((Date.now() - lastPing.getTime()) / 3_600_000)
    : null;
  const healthy = hoursSince !== null && hoursSince < 48;

  return (
    <>
      <PageHead
        title="Settings & health"
        subtitle="Database keep-alive, newsletter signups and the audit trail."
      />

      {/* ── keep-alive ── */}
      <Alert kind={healthy ? "success" : "warn"}>
        {healthy ? (
          <>
            <strong>Keep-alive is running.</strong> The database was last pinged{" "}
            {relativeDays(ping?.pinged_at)?.toLowerCase()} (
            {hoursSince}h ago), so the Supabase project won&apos;t idle out.
          </>
        ) : (
          <>
            <strong>Keep-alive hasn&apos;t run recently.</strong>{" "}
            {lastPing
              ? `Last ping was ${hoursSince}h ago.`
              : "No ping recorded yet."}{" "}
            A free-tier Supabase project pauses after about 7 days without
            activity — check that the daily cron is wired up.
          </>
        )}
      </Alert>

      <div className="stat-grid">
        <StatCard
          label="Last Keep-Alive"
          value={hoursSince === null ? "Never" : `${hoursSince}h ago`}
          detail={fmtDateTime(ping?.pinged_at)}
          icon="activity"
          accent={healthy ? "green" : "gold"}
        />
        <StatCard
          label="Total Pings"
          value={Number(ping?.ping_count ?? 0).toLocaleString("en-IN")}
          detail={`Source: ${ping?.source ?? "—"}`}
          icon="refresh"
        />
        <StatCard label="Logins" value={users ?? 0} detail="Admins, coaches and athletes" icon="key" />
        <StatCard
          label="Newsletter Signups"
          value={signups?.length ?? 0}
          detail="Most recent 20 shown"
          icon="inbox"
          accent="blue"
        />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <h2>Database keep-alive</h2>
            <span className="cap">Stops the Supabase project pausing</span>
          </div>
          <div className="card-body">
            <p className="small muted" style={{ marginBottom: 16 }}>
              A free-tier Supabase project pauses after roughly seven days with
              no database activity, which would take the whole site down. A
              daily job writes a heartbeat row and reads it back so the project
              always looks active.
            </p>

            <dl className="kv">
              <div>
                <dt>Endpoint</dt>
                <dd className="mono">/api/cron/keepalive</dd>
              </div>
              <div>
                <dt>Vercel Cron</dt>
                <dd className="mono">03:17 UTC daily</dd>
              </div>
              <div>
                <dt>GitHub Action</dt>
                <dd className="mono">06:11 UTC daily</dd>
              </div>
              <div>
                <dt>Manual</dt>
                <dd className="mono">npm run keepalive</dd>
              </div>
              <div>
                <dt>Setup SQL</dt>
                <dd className="mono">supabase/SETUP.sql</dd>
              </div>
            </dl>

            <p className="small muted mt-24">
              Two independent schedulers run it so one platform going quiet
              can&apos;t take the database down with it.
            </p>
          </div>
          <div className="card-foot">
            <Link
              href="/api/cron/keepalive"
              target="_blank"
              className="btn btn-primary btn-sm"
            >
              <Icon name="activity" width={14} height={14} />
              Run A Ping Now
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Newsletter signups</h2>
            <span className="cap">From the site footer</span>
          </div>
          {!signups?.length ? (
            <EmptyState icon="inbox" title="No signups yet" />
          ) : (
            <div className="table-wrap">
              <table className="data" style={{ minWidth: 380 }}>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th className="num">Signed up</th>
                  </tr>
                </thead>
                <tbody>
                  {signups.map((s) => (
                    <tr key={s.email}>
                      <td className="strong">{s.email}</td>
                      <td className="num small muted nowrap">
                        {fmtDateTime(s.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Audit trail</h2>
          <span className="cap">Last 40 actions</span>
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
                  text={[
                    a.actor_name ? `by ${a.actor_name}` : null,
                    a.entity ? `on ${a.entity}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  time={fmtDateTime(a.created_at)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
