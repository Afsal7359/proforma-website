import Link from "next/link";
import { requireTutor } from "@/lib/guards";
import {
  listClients,
  listSessionsForTutor,
  listTrials,
  tutorStats,
  listAnnouncements,
  listRegistrationsForTutor,
} from "@/lib/queries";
import { PageHead, StatCard, EmptyState } from "@/components/panel/PanelShell";
import { Person, StatusPill, TimelineItem } from "@/components/panel/bits";
import { Alert } from "@/components/Alert";
import { fmtDate, overallScore, relativeDays } from "@/lib/format";

export default async function TutorDashboard() {
  const session = await requireTutor();

  if (!session.tutorId) {
    return (
      <Alert kind="warn">
        Your login isn&apos;t linked to a coach profile yet. Ask an admin to
        finish setting it up.
      </Alert>
    );
  }

  const [stats, students, sessions, trials, registrations, announcements] =
    await Promise.all([
      tutorStats(session.tutorId),
      listClients({ tutorId: session.tutorId }),
      listSessionsForTutor(session.tutorId, 8),
      listTrials({ publishedOnly: true, upcomingOnly: true }),
      listRegistrationsForTutor(session.tutorId),
      listAnnouncements("tutors"),
    ]);

  const needsReview = students
    .filter((s) => !s.last_progress_on)
    .slice(0, 5);

  const pendingResults = registrations.filter((r) =>
    ["registered", "confirmed", "attended"].includes(r.status),
  );

  return (
    <>
      <PageHead
        title={`Good to see you, ${session.name.split(" ")[0]}`}
        subtitle="Your roster, this week's sessions and the trials your athletes are booked into."
      />

      <div className="stat-grid">
        <StatCard
          label="My Athletes"
          value={stats.students}
          detail={`${stats.activeStudents} active`}
          icon="users"
          accent="blue"
        />
        <StatCard
          label="Sessions This Week"
          value={stats.sessionsThisWeek}
          detail="Logged in the last 7 days"
          icon="clipboard"
          accent="green"
        />
        <StatCard
          label="Active Plans"
          value={stats.activePlans}
          detail="Training blocks in progress"
          icon="layout"
        />
        <StatCard
          label="Trial Results Due"
          value={pendingResults.length}
          detail="Registrations awaiting an outcome"
          icon="calendar"
          accent={pendingResults.length ? "gold" : undefined}
        />
      </div>

      <div className="grid-2 wide-left">
        <div>
          <div className="card">
            <div className="card-head">
              <h2>My athletes</h2>
              <Link href="/tutor/students" className="btn btn-ghost btn-sm">
                View All
              </Link>
            </div>

            {students.length === 0 ? (
              <EmptyState
                icon="users"
                title="No athletes assigned yet"
                text="An admin assigns athletes to your roster from the admin panel."
              />
            ) : (
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Athlete</th>
                      <th>Position</th>
                      <th>Status</th>
                      <th className="num">Form</th>
                      <th className="num">Last scored</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.slice(0, 8).map((s) => (
                      <tr key={s.id}>
                        <td>
                          <Link href={`/tutor/students/${s.id}`} className="rowlink">
                            <Person
                              name={s.full_name}
                              meta={[s.city, s.age ? `${s.age}y` : null]
                                .filter(Boolean)
                                .join(" · ")}
                            />
                          </Link>
                        </td>
                        <td>{s.position ?? "—"}</td>
                        <td>
                          <StatusPill value={s.status} />
                        </td>
                        <td className="num strong">
                          {overallScore(s) ?? "—"}
                        </td>
                        <td className="num small muted">
                          {s.last_progress_on ? fmtDate(s.last_progress_on) : "Never"}
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
              <h2>Recent session log</h2>
              <Link href="/tutor/sessions" className="btn btn-ghost btn-sm">
                Log a Session
              </Link>
            </div>
            {sessions.length === 0 ? (
              <EmptyState
                icon="clipboard"
                title="Nothing logged yet"
                text="Open an athlete and log their first reviewed session."
              />
            ) : (
              <div className="card-body">
                <div className="timeline">
                  {sessions.map((s) => (
                    <TimelineItem
                      key={s.id}
                      icon={s.attendance === "present" ? "check" : "alert"}
                      title={`${s.client?.full_name ?? "Athlete"} — ${s.focus ?? "Session"}`}
                      text={
                        [
                          s.duration_min ? `${s.duration_min} min` : null,
                          s.coach_rating != null ? `Rated ${s.coach_rating}/10` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ") || null
                      }
                      time={fmtDate(s.session_date)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          {needsReview.length > 0 && (
            <div className="card">
              <div className="card-head">
                <h2>Needs a baseline</h2>
                <span className="cap">No scores on file yet</span>
              </div>
              <div className="card-body">
                <div className="stack">
                  {needsReview.map((s) => (
                    <Link
                      href={`/tutor/students/${s.id}`}
                      key={s.id}
                      className="note-item"
                      style={{ display: "block" }}
                    >
                      <div className="top">
                        <h4>{s.full_name}</h4>
                        <span className="pill pill-gold">Score them</span>
                      </div>
                      <p className="small">
                        {[s.position, s.city].filter(Boolean).join(" · ") ||
                          "No position recorded"}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-head">
              <h2>Upcoming trials</h2>
              <Link href="/tutor/trials" className="btn btn-ghost btn-sm">
                All
              </Link>
            </div>
            {trials.length === 0 ? (
              <EmptyState
                icon="calendar"
                title="No trials scheduled"
                text="Admin publishes the pan-India calendar."
              />
            ) : (
              <div className="card-body">
                <div className="stack">
                  {trials.slice(0, 5).map((t) => (
                    <div className="note-item" key={t.id}>
                      <div className="top">
                        <h4>
                          {t.city}
                          {t.state ? `, ${t.state}` : ""}
                        </h4>
                        <time>{relativeDays(t.trial_date)}</time>
                      </div>
                      <p className="small">
                        {fmtDate(t.trial_date)}
                        {t.age_group ? ` · ${t.age_group}` : ""} ·{" "}
                        {t.slots_left} slots left
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

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
        </div>
      </div>
    </>
  );
}
