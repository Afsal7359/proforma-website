import { notFound } from "next/navigation";
import { requireTutor } from "@/lib/guards";
import { getClientDossier } from "@/lib/queries";
import { PageHead } from "@/components/panel/PanelShell";
import { StatusPill } from "@/components/panel/bits";
import {
  AthleteSnapshot,
  TrainingPlansCard,
  SessionsCard,
  ProgressCard,
  AthleteTrialsCard,
} from "@/components/panel/AthleteCards";
import { ActionForm } from "@/components/panel/ActionForm";
import {
  Field,
  Row,
  Select,
  TextArea,
  CLIENT_STATUS_OPTIONS,
  POSITION_OPTIONS,
} from "@/components/Fields";
import { saveClientAction } from "@/app/actions/people";
import { fmtDate, inr } from "@/lib/format";

export default async function TutorStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireTutor();
  const { id } = await params;

  const dossier = await getClientDossier(id);
  const { client } = dossier;

  // A coach only ever sees their own roster.
  if (!client || client.tutor_id !== session.tutorId) notFound();

  return (
    <>
      <PageHead
        breadcrumb={[
          { label: "My Athletes", href: "/tutor/students" },
          { label: client.full_name },
        ]}
        title={client.full_name}
        subtitle={
          [
            client.position,
            [client.city, client.state].filter(Boolean).join(", "),
            client.age ? `${client.age} years` : null,
          ]
            .filter(Boolean)
            .join(" · ") || undefined
        }
        actions={
          <>
            <StatusPill value={client.status} />
            <StatusPill value={client.subscription_status} />
          </>
        }
      />

      <div className="grid-2 wide-left">
        <div>
          <AthleteSnapshot client={client} latest={dossier.progress[0]} />
          <ProgressCard clientId={client.id} progress={dossier.progress} />
          <SessionsCard
            clientId={client.id}
            sessions={dossier.sessions}
            assignments={dossier.assignments}
          />
          <TrainingPlansCard
            clientId={client.id}
            assignments={dossier.assignments}
          />
          <AthleteTrialsCard registrations={dossier.registrations} />
        </div>

        <div>
          <div className="card">
            <div className="card-head">
              <h2>Athlete file</h2>
            </div>
            <div className="card-body">
              <dl className="kv">
                <div>
                  <dt>Phone</dt>
                  <dd>{client.phone ?? "—"}</dd>
                </div>
                <div>
                  <dt>Guardian</dt>
                  <dd>
                    {client.guardian_name ?? "—"}
                    {client.guardian_phone ? ` · ${client.guardian_phone}` : ""}
                  </dd>
                </div>
                <div>
                  <dt>Height / weight</dt>
                  <dd>
                    {client.height_cm ? `${client.height_cm} cm` : "—"} /{" "}
                    {client.weight_kg ? `${client.weight_kg} kg` : "—"}
                  </dd>
                </div>
                <div>
                  <dt>Goal</dt>
                  <dd>{client.goal ?? "—"}</dd>
                </div>
                <div>
                  <dt>Plan</dt>
                  <dd>{client.plan_name ?? "—"}</dd>
                </div>
                <div>
                  <dt>Paid to date</dt>
                  <dd>{inr(client.total_paid)}</dd>
                </div>
                <div>
                  <dt>Joined</dt>
                  <dd>{fmtDate(client.joined_on)}</dd>
                </div>
                <div>
                  <dt>Portal login</dt>
                  <dd className="mono">{client.login_id ?? "Not issued"}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Payments are read-only for coaches — admin records them. */}
          <div className="card">
            <div className="card-head">
              <h2>Payments</h2>
              <span className="cap">Recorded by admin</span>
            </div>
            {dossier.payments.length === 0 ? (
              <div className="card-body">
                <p className="small muted">No payments recorded yet.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="data" style={{ minWidth: 380 }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th className="num">Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dossier.payments.slice(0, 8).map((p) => (
                      <tr key={p.id}>
                        <td className="nowrap">{fmtDate(p.paid_on)}</td>
                        <td className="num strong">{inr(p.amount)}</td>
                        <td>
                          <StatusPill value={p.status} />
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
              <h2>Update details</h2>
              <span className="cap">
                Coaches can edit the athlete file, not billing
              </span>
            </div>
            <div className="card-body">
              <ActionForm
                action={saveClientAction}
                submitLabel="Save Details"
                hidden={{ id: client.id }}
              >
                <Field
                  name="full_name"
                  label="Full name"
                  required
                  defaultValue={client.full_name}
                />
                <Row>
                  <Select
                    name="position"
                    label="Position"
                    options={POSITION_OPTIONS}
                    placeholder="— none —"
                    defaultValue={client.position}
                  />
                  <Select
                    name="status"
                    label="Athlete status"
                    options={CLIENT_STATUS_OPTIONS}
                    defaultValue={client.status}
                  />
                </Row>
                <Row>
                  <Field
                    name="date_of_birth"
                    label="Date of birth"
                    type="date"
                    defaultValue={client.date_of_birth}
                  />
                  <Field
                    name="phone"
                    label="Phone"
                    defaultValue={client.phone}
                  />
                </Row>
                <Row>
                  <Field name="city" label="City" defaultValue={client.city} />
                  <Field name="state" label="State" defaultValue={client.state} />
                </Row>
                <Row>
                  <Field
                    name="height_cm"
                    label="Height (cm)"
                    type="number"
                    step="0.1"
                    defaultValue={client.height_cm}
                  />
                  <Field
                    name="weight_kg"
                    label="Weight (kg)"
                    type="number"
                    step="0.1"
                    defaultValue={client.weight_kg}
                  />
                </Row>
                <Row>
                  <Field
                    name="guardian_name"
                    label="Guardian name"
                    defaultValue={client.guardian_name}
                  />
                  <Field
                    name="guardian_phone"
                    label="Guardian phone"
                    defaultValue={client.guardian_phone}
                  />
                </Row>
                <Field
                  name="goal"
                  label="Goal"
                  defaultValue={client.goal}
                  placeholder="Trial-ready for U-17 academy intake"
                />
                <TextArea
                  name="notes"
                  label="Coach notes"
                  rows={3}
                  defaultValue={client.notes}
                />
                <input type="hidden" name="email" value={client.email ?? ""} />
              </ActionForm>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
