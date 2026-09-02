import { requireTutor } from "@/lib/guards";
import {
  listClients,
  listRegistrationsForTutor,
  listTrials,
} from "@/lib/queries";
import { PageHead, EmptyState } from "@/components/panel/PanelShell";
import { StatusPill } from "@/components/panel/bits";
import { ActionForm } from "@/components/panel/ActionForm";
import {
  Field,
  Row,
  Select,
  TextArea,
  REGISTRATION_STATUS_OPTIONS,
} from "@/components/Fields";
import {
  updateRegistrationAction,
  addRegistrationAction,
} from "@/app/actions/coaching";
import { fmtDate, overallScore, relativeDays } from "@/lib/format";

export const metadata = { title: "Trials · Proforma Co" };

export default async function TutorTrialsPage() {
  const session = await requireTutor();

  const [trials, registrations, students] = await Promise.all([
    listTrials({ publishedOnly: true }),
    listRegistrationsForTutor(session.tutorId!),
    listClients({ tutorId: session.tutorId }),
  ]);

  const upcoming = trials.filter(
    (t) => new Date(t.trial_date) >= new Date(new Date().toDateString()),
  );
  const pending = registrations.filter((r) =>
    ["registered", "confirmed", "attended"].includes(r.status),
  );
  const settled = registrations.filter((r) =>
    ["selected", "not_selected", "no_show", "cancelled"].includes(r.status),
  );

  return (
    <>
      <PageHead
        title="Trials"
        subtitle="The pan-India calendar plus every registration across your roster. Record outcomes and panel scores here."
      />

      {/* ── awaiting results ── */}
      <div className="card">
        <div className="card-head">
          <h2>Awaiting an outcome</h2>
          <span className="cap">{pending.length} registrations</span>
        </div>

        {pending.length === 0 ? (
          <EmptyState
            icon="check-circle"
            title="Nothing outstanding"
            text="Every registration on your roster has a recorded result."
          />
        ) : (
          <div className="card-body">
            <div className="stack">
              {pending.map((r) => (
                <details key={r.id} className="note-item">
                  <summary
                    style={{ cursor: "pointer", listStyle: "none" }}
                    className="flex-between"
                  >
                    <div>
                      <h4>{r.client?.full_name ?? "Athlete"}</h4>
                      <p className="small muted">
                        {r.trial?.city}
                        {r.trial?.state ? `, ${r.trial.state}` : ""} ·{" "}
                        {fmtDate(r.trial?.trial_date)}
                      </p>
                    </div>
                    <StatusPill value={r.status} />
                  </summary>

                  <div style={{ marginTop: 18 }}>
                    <ActionForm
                      action={updateRegistrationAction}
                      submitLabel="Save Result"
                      hidden={{ id: r.id }}
                    >
                      <Select
                        name="status"
                        label="Outcome"
                        options={REGISTRATION_STATUS_OPTIONS}
                        defaultValue={r.status}
                      />
                      <Row cols={3}>
                        <Field
                          name="speed"
                          label="Speed"
                          type="number"
                          min={0}
                          max={100}
                          defaultValue={r.score?.speed}
                        />
                        <Field
                          name="stamina"
                          label="Stamina"
                          type="number"
                          min={0}
                          max={100}
                          defaultValue={r.score?.stamina}
                        />
                        <Field
                          name="technique"
                          label="Technique"
                          type="number"
                          min={0}
                          max={100}
                          defaultValue={r.score?.technique}
                        />
                      </Row>
                      <Row>
                        <Field
                          name="strength"
                          label="Strength"
                          type="number"
                          min={0}
                          max={100}
                          defaultValue={r.score?.strength}
                        />
                        <Field
                          name="agility"
                          label="Agility"
                          type="number"
                          min={0}
                          max={100}
                          defaultValue={r.score?.agility}
                        />
                      </Row>
                      <TextArea
                        name="coach_notes"
                        label="Panel notes"
                        rows={2}
                        defaultValue={r.coach_notes}
                        hint="The athlete sees this in their portal."
                      />
                    </ActionForm>
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── add an athlete to a trial ── */}
      {upcoming.length > 0 && students.length > 0 && (
        <div className="card">
          <div className="card-head">
            <h2>Register an athlete</h2>
            <span className="cap">Books the slot and confirms it immediately</span>
          </div>
          <div className="card-body">
            <ActionForm
              action={addRegistrationAction}
              submitLabel="Register Athlete"
              resetOnSuccess
            >
              <Row>
                <Select
                  name="client_id"
                  label="Athlete"
                  required
                  placeholder="— pick an athlete —"
                  options={students.map((s) => ({
                    value: s.id,
                    label: s.full_name,
                  }))}
                />
                <Select
                  name="trial_id"
                  label="Trial"
                  required
                  placeholder="— pick a trial —"
                  options={upcoming.map((t) => ({
                    value: t.id,
                    label: `${t.city} · ${fmtDate(t.trial_date)} · ${t.slots_left} left`,
                  }))}
                />
              </Row>
            </ActionForm>
          </div>
        </div>
      )}

      {/* ── calendar ── */}
      <div className="card">
        <div className="card-head">
          <h2>Upcoming calendar</h2>
          <span className="cap">Published by admin</span>
        </div>
        {upcoming.length === 0 ? (
          <EmptyState icon="calendar" title="No trials scheduled" />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>City</th>
                  <th>Date</th>
                  <th>Age group</th>
                  <th>Type</th>
                  <th className="num">Slots left</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((t) => (
                  <tr key={t.id}>
                    <td className="strong">
                      {t.city}
                      {t.state ? `, ${t.state}` : ""}
                      {t.venue && <div className="small muted">{t.venue}</div>}
                    </td>
                    <td className="nowrap">
                      {fmtDate(t.trial_date)}
                      <div className="small muted">
                        {relativeDays(t.trial_date)}
                      </div>
                    </td>
                    <td>{t.age_group ?? "—"}</td>
                    <td>
                      <span
                        className={`tag ${
                          t.tag === "Academy Partner" ? "tag-gold" : "tag-blue"
                        }`}
                      >
                        {t.tag}
                      </span>
                    </td>
                    <td className="num strong">{t.slots_left}</td>
                    <td>
                      <StatusPill value={t.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── settled results ── */}
      {settled.length > 0 && (
        <div className="card">
          <div className="card-head">
            <h2>Recorded results</h2>
          </div>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Athlete</th>
                  <th>Trial</th>
                  <th>Date</th>
                  <th>Outcome</th>
                  <th className="num">Panel score</th>
                </tr>
              </thead>
              <tbody>
                {settled.map((r) => (
                  <tr key={r.id}>
                    <td className="strong">{r.client?.full_name ?? "—"}</td>
                    <td>{r.trial?.city ?? "—"}</td>
                    <td className="nowrap">{fmtDate(r.trial?.trial_date)}</td>
                    <td>
                      <StatusPill value={r.status} />
                    </td>
                    <td className="num">
                      {r.score && Object.keys(r.score).length
                        ? (overallScore(r.score) ?? "—")
                        : "—"}
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
