import { EmptyState } from "./PanelShell";
import { MetricBars, ScoreRing, StatusPill } from "./bits";
import { ActionForm, InlineAction } from "./ActionForm";
import {
  Field,
  Row,
  Select,
  TextArea,
  ASSIGNMENT_STATUS_OPTIONS,
  ATTENDANCE_OPTIONS,
} from "@/components/Fields";
import {
  saveAssignmentAction,
  deleteAssignmentAction,
  saveSessionAction,
  deleteSessionAction,
  saveProgressAction,
  deleteProgressAction,
} from "@/app/actions/coaching";
import { fmtDate, overallScore } from "@/lib/format";
import { METRIC_KEYS } from "@/lib/types";
import type {
  ClientOverview,
  ProgressRecord,
  TrainingAssignment,
  TrainingSession,
  Trial,
  TrialRegistration,
} from "@/lib/types";

const today = () => new Date().toISOString().slice(0, 10);

/* ════════════════════════════════════════════════════════════════
   SNAPSHOT — profile + current metrics
════════════════════════════════════════════════════════════════ */

export function AthleteSnapshot({
  client,
  latest,
}: {
  client: ClientOverview;
  latest?: ProgressRecord;
}) {
  const metrics = {
    speed: latest?.speed ?? client.speed,
    stamina: latest?.stamina ?? client.stamina,
    technique: latest?.technique ?? client.technique,
    strength: latest?.strength ?? client.strength,
    agility: latest?.agility ?? client.agility,
  };

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2>Current form</h2>
          <span className="cap">
            {latest
              ? `Scored ${fmtDate(latest.recorded_on)}`
              : "No assessment recorded yet"}
          </span>
        </div>
        <StatusPill value={client.status} />
      </div>
      <div className="card-body">
        <div
          style={{ display: "flex", gap: 26, alignItems: "center", flexWrap: "wrap" }}
        >
          <ScoreRing metrics={metrics} />
          <div style={{ flex: 1, minWidth: 220 }}>
            <MetricBars metrics={metrics} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   TRAINING PLANS
════════════════════════════════════════════════════════════════ */

export function TrainingPlansCard({
  clientId,
  assignments,
}: {
  clientId: string;
  assignments: TrainingAssignment[];
}) {
  return (
    <div className="card">
      <div className="card-head">
        <h2>Training plans</h2>
        <span className="cap">{assignments.length} on file</span>
      </div>

      {assignments.length === 0 ? (
        <EmptyState
          icon="clipboard"
          title="No plan assigned"
          text="Assign a training block below to start the 12-week pathway."
        />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Period</th>
                <th className="num">Per week</th>
                <th className="num">Progress</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a.id}>
                  <td>
                    <span className="strong">{a.title}</span>
                    {a.description && (
                      <div className="small muted">{a.description}</div>
                    )}
                  </td>
                  <td className="small muted nowrap">
                    {fmtDate(a.start_date)}
                    {a.end_date ? ` → ${fmtDate(a.end_date)}` : ""}
                  </td>
                  <td className="num">{a.sessions_per_week ?? "—"}</td>
                  <td className="num">{a.progress_pct}%</td>
                  <td>
                    <StatusPill value={a.status} />
                  </td>
                  <td className="actions">
                    <InlineAction
                      action={deleteAssignmentAction}
                      label="Remove"
                      hidden={{ id: a.id, client_id: clientId }}
                      confirm={`Remove "${a.title}"?`}
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
            Assign a training plan
          </summary>
          <div style={{ marginTop: 20 }}>
            <ActionForm
              action={saveAssignmentAction}
              submitLabel="Assign Plan"
              hidden={{ client_id: clientId }}
              resetOnSuccess
            >
              <Field name="title" label="Plan title" required placeholder="12-Week Striker Block" />
              <TextArea
                name="description"
                label="What it covers"
                rows={2}
                placeholder="Finishing under pressure, first-touch in tight space…"
              />
              <Row cols={3}>
                <Field
                  name="start_date"
                  label="Start date"
                  type="date"
                  defaultValue={today()}
                />
                <Field name="end_date" label="End date" type="date" />
                <Field
                  name="sessions_per_week"
                  label="Sessions / week"
                  type="number"
                  min={1}
                  max={14}
                  defaultValue={3}
                />
              </Row>
              <Row>
                <Select
                  name="status"
                  label="Status"
                  options={ASSIGNMENT_STATUS_OPTIONS}
                  defaultValue="assigned"
                />
                <Field
                  name="progress_pct"
                  label="Progress %"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={0}
                />
              </Row>
            </ActionForm>
          </div>
        </details>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SESSION LOG
════════════════════════════════════════════════════════════════ */

export function SessionsCard({
  clientId,
  sessions,
  assignments,
}: {
  clientId: string;
  sessions: TrainingSession[];
  assignments: TrainingAssignment[];
}) {
  return (
    <div className="card">
      <div className="card-head">
        <h2>Session log</h2>
        <span className="cap">{sessions.length} logged</span>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          icon="video"
          title="No sessions logged"
          text="Log a session after reviewing the athlete's drill video."
        />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Date</th>
                <th>Focus</th>
                <th>Attendance</th>
                <th className="num">Rating</th>
                <th>Notes</th>
                <th />
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
                    {s.drills?.length ? (
                      <div className="small muted">{s.drills.join(", ")}</div>
                    ) : null}
                  </td>
                  <td>
                    <StatusPill value={s.attendance} />
                  </td>
                  <td className="num">
                    {s.coach_rating != null ? `${s.coach_rating}/10` : "—"}
                  </td>
                  <td className="small muted">{s.notes ?? "—"}</td>
                  <td className="actions">
                    <InlineAction
                      action={deleteSessionAction}
                      label="Remove"
                      hidden={{ id: s.id, client_id: clientId }}
                      confirm="Remove this session?"
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
            Log a session
          </summary>
          <div style={{ marginTop: 20 }}>
            <ActionForm
              action={saveSessionAction}
              submitLabel="Log Session"
              hidden={{ client_id: clientId }}
              resetOnSuccess
            >
              <Row cols={3}>
                <Field
                  name="session_date"
                  label="Date"
                  type="date"
                  defaultValue={today()}
                  required
                />
                <Field
                  name="duration_min"
                  label="Duration (min)"
                  type="number"
                  min={5}
                  max={300}
                  defaultValue={60}
                />
                <Field
                  name="coach_rating"
                  label="Coach rating / 10"
                  type="number"
                  min={0}
                  max={10}
                />
              </Row>
              <Row>
                <Field name="focus" label="Focus" placeholder="First-touch under pressure" />
                <Select
                  name="attendance"
                  label="Attendance"
                  options={ATTENDANCE_OPTIONS}
                  defaultValue="present"
                />
              </Row>
              {assignments.length > 0 && (
                <Select
                  name="assignment_id"
                  label="Part of plan"
                  placeholder="— not linked —"
                  options={assignments.map((a) => ({
                    value: a.id,
                    label: a.title,
                  }))}
                />
              )}
              <TextArea
                name="drills"
                label="Drills"
                rows={3}
                hint="One drill per line."
                placeholder={"Cone weave x20\nWall pass 2-touch\nFinishing near post x30"}
              />
              <Field
                name="video_url"
                label="Drill video URL"
                type="url"
                placeholder="https://…"
              />
              <TextArea name="notes" label="Coach notes" rows={2} />
            </ActionForm>
          </div>
        </details>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   PROGRESS SCORES
════════════════════════════════════════════════════════════════ */

export function ProgressCard({
  clientId,
  progress,
}: {
  clientId: string;
  progress: ProgressRecord[];
}) {
  const latest = progress[0];

  return (
    <div className="card">
      <div className="card-head">
        <h2>Performance scores</h2>
        <span className="cap">{progress.length} assessments</span>
      </div>

      {progress.length === 0 ? (
        <EmptyState
          icon="trending-up"
          title="No scores recorded"
          text="Record a baseline so the athlete's radar has somewhere to move from."
        />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Date</th>
                {METRIC_KEYS.map((k) => (
                  <th key={k} style={{ textTransform: "capitalize" }}>
                    {k.slice(0, 4)}
                  </th>
                ))}
                <th className="num">Avg</th>
                <th className="num">Weight</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {progress.map((p) => (
                <tr key={p.id}>
                  <td className="nowrap strong">{fmtDate(p.recorded_on)}</td>
                  {METRIC_KEYS.map((k) => (
                    <td key={k} className="num">
                      {p[k] ?? "—"}
                    </td>
                  ))}
                  <td className="num strong">{overallScore(p) ?? "—"}</td>
                  <td className="num">{p.weight_kg ? `${p.weight_kg}kg` : "—"}</td>
                  <td className="actions">
                    <InlineAction
                      action={deleteProgressAction}
                      label="Remove"
                      hidden={{ id: p.id, client_id: clientId }}
                      confirm="Remove this assessment?"
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
            Record scores
          </summary>
          <div style={{ marginTop: 20 }}>
            <ActionForm
              action={saveProgressAction}
              submitLabel="Save Scores"
              hidden={{ client_id: clientId }}
              resetOnSuccess
            >
              <Field
                name="recorded_on"
                label="Assessment date"
                type="date"
                defaultValue={today()}
                required
              />
              <Row cols={3}>
                <Field
                  name="speed"
                  label="Speed"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={latest?.speed ?? ""}
                />
                <Field
                  name="stamina"
                  label="Stamina"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={latest?.stamina ?? ""}
                />
                <Field
                  name="technique"
                  label="Technique"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={latest?.technique ?? ""}
                />
              </Row>
              <Row cols={3}>
                <Field
                  name="strength"
                  label="Strength"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={latest?.strength ?? ""}
                />
                <Field
                  name="agility"
                  label="Agility"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={latest?.agility ?? ""}
                />
                <Field
                  name="weight_kg"
                  label="Weight (kg)"
                  type="number"
                  step="0.1"
                  defaultValue={latest?.weight_kg ?? ""}
                />
              </Row>
              <TextArea
                name="notes"
                label="Assessment notes"
                rows={2}
                placeholder="Sharper off the last defender; still loses the aerial duel."
              />
            </ActionForm>
          </div>
        </details>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   TRIAL HISTORY
════════════════════════════════════════════════════════════════ */

export function AthleteTrialsCard({
  registrations,
}: {
  registrations: (TrialRegistration & { trial: Trial | null })[];
}) {
  return (
    <div className="card">
      <div className="card-head">
        <h2>Trial history</h2>
        <span className="cap">{registrations.length} registrations</span>
      </div>

      {registrations.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="No trials yet"
          text="Registrations appear here once the athlete reserves a slot or you add them to a trial."
        />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Trial</th>
                <th>Date</th>
                <th>Status</th>
                <th className="num">Panel score</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((r) => (
                <tr key={r.id}>
                  <td className="strong">
                    {r.trial?.city ?? "—"}
                    {r.trial?.state ? `, ${r.trial.state}` : ""}
                  </td>
                  <td className="nowrap">{fmtDate(r.trial?.trial_date)}</td>
                  <td>
                    <StatusPill value={r.status} />
                  </td>
                  <td className="num">
                    {r.score && Object.keys(r.score).length
                      ? (overallScore(r.score) ?? "—")
                      : "—"}
                  </td>
                  <td className="small muted">{r.coach_notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
