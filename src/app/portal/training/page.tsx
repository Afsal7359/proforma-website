import { requireClient } from "@/lib/guards";
import { getClientDossier } from "@/lib/queries";
import { PageHead, EmptyState } from "@/components/panel/PanelShell";
import { StatusPill } from "@/components/panel/bits";
import { fmtDate, titleCase } from "@/lib/format";
import { Icon } from "@/components/Icon";

export const metadata = { title: "My Training · Proforma Co" };

export default async function PortalTrainingPage() {
  const session = await requireClient();
  if (!session.clientId) return null;

  const { assignments, sessions } = await getClientDossier(session.clientId);

  return (
    <>
      <PageHead
        title="My training"
        subtitle="Your assigned blocks and every session your coach has reviewed."
      />

      {/* ── assigned plans ── */}
      <div className="card">
        <div className="card-head">
          <h2>Training plans</h2>
          <span className="cap">{assignments.length} assigned</span>
        </div>

        {assignments.length === 0 ? (
          <EmptyState
            icon="clipboard"
            title="No training plan yet"
            text="Your coach builds a 12-week block after your assessment call."
          />
        ) : (
          <div className="card-body">
            <div className="stack">
              {assignments.map((a) => (
                <div className="note-item" key={a.id}>
                  <div className="top">
                    <h4>{a.title}</h4>
                    <StatusPill value={a.status} />
                  </div>
                  {a.description && <p>{a.description}</p>}

                  <div className="metric-bar-row" style={{ marginTop: 12 }}>
                    <div className="top">
                      <span className="small muted">
                        {fmtDate(a.start_date)}
                        {a.end_date ? ` → ${fmtDate(a.end_date)}` : ""}
                        {a.sessions_per_week
                          ? ` · ${a.sessions_per_week} sessions / week`
                          : ""}
                      </span>
                      <b>{a.progress_pct}%</b>
                    </div>
                    <div className="metric-track">
                      <div
                        className="metric-fill"
                        style={{ width: `${a.progress_pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── session log ── */}
      <div className="card">
        <div className="card-head">
          <h2>Session log</h2>
          <span className="cap">Scored by your coach within 48 hours</span>
        </div>

        {sessions.length === 0 ? (
          <EmptyState
            icon="video"
            title="No sessions logged"
            text="Film your weekly drill set on a phone and send it to your coach — each review lands here."
          />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Focus</th>
                  <th>Drills</th>
                  <th>Attendance</th>
                  <th className="num">Rating</th>
                  <th>Coach notes</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td className="nowrap strong">{fmtDate(s.session_date)}</td>
                    <td>
                      {s.focus ?? "—"}
                      {s.duration_min ? (
                        <span className="small muted"> · {s.duration_min} min</span>
                      ) : null}
                    </td>
                    <td className="small muted">
                      {s.drills?.length ? s.drills.join(", ") : "—"}
                    </td>
                    <td>
                      <StatusPill value={s.attendance} />
                    </td>
                    <td className="num">
                      {s.coach_rating != null ? `${s.coach_rating}/10` : "—"}
                    </td>
                    <td className="small muted">
                      {s.notes ?? "—"}
                      {s.video_url && (
                        <a
                          href={s.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "var(--blue)", marginLeft: 8 }}
                        >
                          <Icon
                            name="external"
                            width={13}
                            height={13}
                            style={{ display: "inline", verticalAlign: -2 }}
                          />{" "}
                          Video
                        </a>
                      )}
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
