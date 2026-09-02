import Link from "next/link";
import { requireClient } from "@/lib/guards";
import { getClientDossier, listTrials, listAnnouncements } from "@/lib/queries";
import { StatCard, EmptyState } from "@/components/panel/PanelShell";
import { MetricBars, ScoreRing, StatusPill, TimelineItem } from "@/components/panel/bits";
import { Icon } from "@/components/Icon";
import { Alert } from "@/components/Alert";
import { fmtDate, inr, relativeDays, titleCase } from "@/lib/format";

export default async function PortalDashboard() {
  const session = await requireClient();

  if (!session.clientId) {
    return (
      <Alert kind="warn">
        Your login isn&apos;t linked to an athlete profile yet. Ask your coach to
        finish setting it up.
      </Alert>
    );
  }

  const [dossier, upcoming, announcements] = await Promise.all([
    getClientDossier(session.clientId),
    listTrials({ publishedOnly: true, upcomingOnly: true }),
    listAnnouncements("clients"),
  ]);

  const { client, assignments, sessions, progress, registrations } = dossier;
  const latest = progress[0];
  const previous = progress[1];
  const activePlan = assignments.find((a) =>
    ["assigned", "in_progress"].includes(a.status),
  );
  const nextTrial = registrations.find(
    (r) =>
      r.trial &&
      new Date(r.trial.trial_date) >= new Date(new Date().toDateString()) &&
      r.status !== "cancelled",
  );

  const metrics = {
    speed: latest?.speed ?? null,
    stamina: latest?.stamina ?? null,
    technique: latest?.technique ?? null,
    strength: latest?.strength ?? null,
    agility: latest?.agility ?? null,
  };

  const delta =
    latest && previous
      ? avg(latest) - avg(previous)
      : null;

  return (
    <>
      <section className="portal-hero">
        <div className="portal-hero-grid">
          <div>
            <div className="eyebrow">
              {client?.position ?? "Athlete"} ·{" "}
              {[client?.city, client?.state].filter(Boolean).join(", ") ||
                "Proforma Co"}
            </div>
            <h1>Welcome back, {session.name.split(" ")[0]}</h1>
            <p>
              {activePlan
                ? `You're on "${activePlan.title}" — ${activePlan.progress_pct}% through the block.`
                : "No training block assigned yet. Your coach will add one shortly."}
            </p>
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ScoreRing metrics={metrics} />
          </div>
        </div>
      </section>

      <div className="stat-grid">
        <StatCard
          label="Subscription"
          value={titleCase(client?.subscription_status)}
          detail={
            client?.subscription_end
              ? `Renews ${fmtDate(client.subscription_end)}`
              : client?.plan_name ?? "No plan assigned"
          }
          icon="rupee"
          accent={client?.subscription_status === "active" ? "green" : undefined}
        />
        <StatCard
          label="Sessions Logged"
          value={sessions.length}
          detail={
            sessions[0]
              ? `Last on ${fmtDate(sessions[0].session_date)}`
              : "None yet"
          }
          icon="clipboard"
        />
        <StatCard
          label="Trials Booked"
          value={registrations.filter((r) => r.status !== "cancelled").length}
          detail={
            nextTrial?.trial
              ? `${nextTrial.trial.city} · ${relativeDays(nextTrial.trial.trial_date)}`
              : "Nothing booked"
          }
          icon="calendar"
          accent="blue"
        />
        <StatCard
          label="Form Trend"
          value={delta === null ? "—" : `${delta > 0 ? "+" : ""}${delta}`}
          detail={
            latest
              ? `Scored ${fmtDate(latest.recorded_on)}`
              : "Awaiting first review"
          }
          icon="trending-up"
          accent={delta !== null && delta >= 0 ? "green" : "gold"}
        />
      </div>

      <div className="grid-2 wide-left">
        <div>
          {/* ── next trial ── */}
          <div className="card">
            <div className="card-head">
              <h2>Your next trial</h2>
              <Link href="/portal/trials" className="btn btn-ghost btn-sm">
                All Trials
              </Link>
            </div>
            {nextTrial?.trial ? (
              <div className="card-body">
                <div className="flex-between" style={{ marginBottom: 14 }}>
                  <div>
                    <h3 style={{ fontSize: 20, marginBottom: 4 }}>
                      {nextTrial.trial.city}
                      {nextTrial.trial.state ? `, ${nextTrial.trial.state}` : ""}
                    </h3>
                    <div className="trial-meta">
                      <span>
                        Date <strong>{fmtDate(nextTrial.trial.trial_date)}</strong>
                      </span>
                      {nextTrial.trial.trial_time && (
                        <span>
                          Time <strong>{nextTrial.trial.trial_time}</strong>
                        </span>
                      )}
                      {nextTrial.trial.age_group && (
                        <span>
                          Age <strong>{nextTrial.trial.age_group}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                  <StatusPill value={nextTrial.status} />
                </div>
                {nextTrial.trial.venue && (
                  <p className="small muted">
                    <Icon
                      name="target"
                      width={13}
                      height={13}
                      style={{ display: "inline", verticalAlign: -2, marginRight: 5 }}
                    />
                    {nextTrial.trial.venue}
                    {nextTrial.trial.address ? ` — ${nextTrial.trial.address}` : ""}
                  </p>
                )}
              </div>
            ) : (
              <EmptyState
                icon="calendar"
                title="No trial booked"
                text={
                  upcoming.length
                    ? `${upcoming.length} trial${upcoming.length > 1 ? "s are" : " is"} open for registration right now.`
                    : "New trial cities are added every month."
                }
                action={
                  upcoming.length ? (
                    <Link href="/portal/trials" className="btn btn-primary btn-sm">
                      Browse Trials
                    </Link>
                  ) : undefined
                }
              />
            )}
          </div>

          {/* ── recent sessions ── */}
          <div className="card">
            <div className="card-head">
              <h2>Recent sessions</h2>
              <Link href="/portal/training" className="btn btn-ghost btn-sm">
                View Training
              </Link>
            </div>
            {sessions.length ? (
              <div className="card-body">
                <div className="timeline">
                  {sessions.slice(0, 5).map((s) => (
                    <TimelineItem
                      key={s.id}
                      icon={s.attendance === "present" ? "check" : "alert"}
                      title={s.focus || "Training session"}
                      text={
                        [
                          s.duration_min ? `${s.duration_min} min` : null,
                          s.coach_rating != null
                            ? `Coach rating ${s.coach_rating}/10`
                            : null,
                          s.notes,
                        ]
                          .filter(Boolean)
                          .join(" · ") || null
                      }
                      time={fmtDate(s.session_date)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState
                icon="clipboard"
                title="No sessions logged yet"
                text="Your coach logs each session after reviewing your drill videos."
              />
            )}
          </div>
        </div>

        <div>
          {/* ── metrics ── */}
          <div className="card">
            <div className="card-head">
              <div>
                <h2>Your five metrics</h2>
                <span className="cap">
                  {latest
                    ? `Scored ${fmtDate(latest.recorded_on)}`
                    : "Awaiting first review"}
                </span>
              </div>
            </div>
            <div className="card-body">
              <MetricBars metrics={metrics} />
              {latest?.notes && (
                <p className="small muted mt-24">{latest.notes}</p>
              )}
            </div>
            <div className="card-foot">
              <Link href="/portal/progress" className="btn btn-ghost btn-sm">
                Full Progress History
              </Link>
            </div>
          </div>

          {/* ── announcements ── */}
          {announcements.length > 0 && (
            <div className="card">
              <div className="card-head">
                <h2>Notices</h2>
              </div>
              <div className="card-body">
                <div className="note-list">
                  {announcements.map((a) => (
                    <div className="note-item" key={a.id}>
                      <div className="top">
                        <h4>{a.title}</h4>
                        <time>{fmtDate(a.created_at)}</time>
                      </div>
                      {a.body && <p>{a.body}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── subscription ── */}
          <div className="card">
            <div className="card-head">
              <h2>Membership</h2>
            </div>
            <div className="card-body">
              <dl className="kv">
                <div>
                  <dt>Plan</dt>
                  <dd>{client?.plan_name ?? "—"}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>
                    <StatusPill value={client?.subscription_status} />
                  </dd>
                </div>
                <div>
                  <dt>Paid to date</dt>
                  <dd>{inr(client?.total_paid ?? 0)}</dd>
                </div>
                <div>
                  <dt>Coach</dt>
                  <dd>{client?.tutor_name ?? "Unassigned"}</dd>
                </div>
              </dl>
            </div>
            <div className="card-foot">
              <Link href="/portal/payments" className="btn btn-ghost btn-sm">
                Payment History
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function avg(p: {
  speed: number | null;
  stamina: number | null;
  technique: number | null;
  strength: number | null;
  agility: number | null;
}): number {
  const v = [p.speed, p.stamina, p.technique, p.strength, p.agility].filter(
    (x): x is number => typeof x === "number",
  );
  return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0;
}
