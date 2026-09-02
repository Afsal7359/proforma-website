import Link from "next/link";
import { requireTutor } from "@/lib/guards";
import { listClients, listSessionsForTutor } from "@/lib/queries";
import { PageHead, EmptyState } from "@/components/panel/PanelShell";
import { StatusPill } from "@/components/panel/bits";
import { ActionForm, InlineAction } from "@/components/panel/ActionForm";
import {
  Field,
  Row,
  Select,
  TextArea,
  ATTENDANCE_OPTIONS,
} from "@/components/Fields";
import { saveSessionAction, deleteSessionAction } from "@/app/actions/coaching";
import { fmtDate } from "@/lib/format";

export const metadata = { title: "Session Log · Proforma Co" };

export default async function TutorSessionsPage() {
  const session = await requireTutor();

  const [students, sessions] = await Promise.all([
    listClients({ tutorId: session.tutorId }),
    listSessionsForTutor(session.tutorId!, 80),
  ]);

  return (
    <>
      <PageHead
        title="Session log"
        subtitle="Every session you've reviewed across your roster. Log one here or from an athlete's page."
      />

      {students.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="users"
            title="No athletes on your roster"
            text="An admin needs to assign athletes to you before you can log sessions."
          />
        </div>
      ) : (
        <div className="grid-2 wide-left">
          <div className="card">
            <div className="card-head">
              <h2>Logged sessions</h2>
              <span className="cap">{sessions.length} on file</span>
            </div>

            {sessions.length === 0 ? (
              <EmptyState
                icon="clipboard"
                title="Nothing logged yet"
                text="Use the form to record your first reviewed session."
              />
            ) : (
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Athlete</th>
                      <th>Focus</th>
                      <th>Attendance</th>
                      <th className="num">Rating</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s) => (
                      <tr key={s.id}>
                        <td className="nowrap strong">
                          {fmtDate(s.session_date)}
                        </td>
                        <td>
                          {s.client ? (
                            <Link
                              href={`/tutor/students/${s.client.id}`}
                              className="rowlink"
                            >
                              {s.client.full_name}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>
                          {s.focus ?? "—"}
                          {s.duration_min ? (
                            <span className="small muted">
                              {" "}
                              · {s.duration_min} min
                            </span>
                          ) : null}
                        </td>
                        <td>
                          <StatusPill value={s.attendance} />
                        </td>
                        <td className="num">
                          {s.coach_rating != null ? `${s.coach_rating}/10` : "—"}
                        </td>
                        <td className="actions">
                          <InlineAction
                            action={deleteSessionAction}
                            label="Remove"
                            hidden={{ id: s.id, client_id: s.client_id }}
                            confirm="Remove this session?"
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
              <h2>Log a session</h2>
            </div>
            <div className="card-body">
              <ActionForm
                action={saveSessionAction}
                submitLabel="Log Session"
                resetOnSuccess
              >
                <Select
                  name="client_id"
                  label="Athlete"
                  required
                  placeholder="— pick an athlete —"
                  options={students.map((s) => ({
                    value: s.id,
                    label: `${s.full_name}${s.position ? ` · ${s.position}` : ""}`,
                  }))}
                />
                <Row>
                  <Field
                    name="session_date"
                    label="Date"
                    type="date"
                    required
                    defaultValue={new Date().toISOString().slice(0, 10)}
                  />
                  <Field
                    name="duration_min"
                    label="Duration (min)"
                    type="number"
                    min={5}
                    max={300}
                    defaultValue={60}
                  />
                </Row>
                <Field
                  name="focus"
                  label="Focus"
                  placeholder="Finishing under pressure"
                />
                <Row>
                  <Select
                    name="attendance"
                    label="Attendance"
                    options={ATTENDANCE_OPTIONS}
                    defaultValue="present"
                  />
                  <Field
                    name="coach_rating"
                    label="Coach rating / 10"
                    type="number"
                    min={0}
                    max={10}
                  />
                </Row>
                <TextArea
                  name="drills"
                  label="Drills"
                  rows={3}
                  hint="One drill per line."
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
          </div>
        </div>
      )}
    </>
  );
}
