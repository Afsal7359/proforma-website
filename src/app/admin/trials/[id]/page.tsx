import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/guards";
import { getTrial, listTrialRegistrations, listClients } from "@/lib/queries";
import { PageHead, EmptyState, StatCard } from "@/components/panel/PanelShell";
import { Person, StatusPill } from "@/components/panel/bits";
import { ActionForm, InlineAction } from "@/components/panel/ActionForm";
import {
  Field,
  Row,
  Select,
  TextArea,
  Checkbox,
  TRIAL_STATUS_OPTIONS,
  REGISTRATION_STATUS_OPTIONS,
} from "@/components/Fields";
import { saveTrialAction, deleteTrialAction } from "@/app/actions/cms";
import {
  updateRegistrationAction,
  addRegistrationAction,
} from "@/app/actions/coaching";
import { fmtDate, overallScore, relativeDays } from "@/lib/format";

const TAG_OPTIONS = [
  { value: "Open Trial", label: "Open Trial" },
  { value: "Academy Partner", label: "Academy Partner" },
  { value: "Invite Only", label: "Invite Only" },
  { value: "Showcase", label: "Showcase" },
];

export default async function AdminTrialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const trial = await getTrial(id);
  if (!trial) notFound();

  const [registrations, clients] = await Promise.all([
    listTrialRegistrations(id),
    listClients(),
  ]);

  const registeredIds = new Set(registrations.map((r) => r.client_id));
  const available = clients.filter((c) => !registeredIds.has(c.id));
  const selected = registrations.filter((r) => r.status === "selected").length;

  return (
    <>
      <PageHead
        breadcrumb={[
          { label: "Trials", href: "/admin/trials" },
          { label: trial.city },
        ]}
        title={`${trial.city}${trial.state ? `, ${trial.state}` : ""}`}
        subtitle={[
          fmtDate(trial.trial_date),
          trial.trial_time,
          trial.venue,
          trial.age_group,
        ]
          .filter(Boolean)
          .join(" · ")}
        actions={
          <>
            <StatusPill value={trial.status} />
            <InlineAction
              action={deleteTrialAction}
              label="Delete"
              icon="trash"
              className="btn btn-danger btn-sm"
              hidden={{ id: trial.id }}
              confirm={`Delete the ${trial.city} trial and all its registrations?`}
            />
          </>
        }
      />

      <div className="stat-grid">
        <StatCard
          label="Registered"
          value={registrations.filter((r) => r.status !== "cancelled").length}
          detail={`${trial.slots_left} of ${trial.total_slots} slots left`}
          icon="users"
          accent="blue"
        />
        <StatCard
          label="Attended"
          value={
            registrations.filter((r) =>
              ["attended", "selected", "not_selected"].includes(r.status),
            ).length
          }
          icon="check-circle"
        />
        <StatCard label="Selected" value={selected} icon="target" accent="green" />
        <StatCard
          label="When"
          value={relativeDays(trial.trial_date)}
          detail={fmtDate(trial.trial_date)}
          icon="calendar"
          accent="gold"
        />
      </div>

      <div className="grid-2 wide-left">
        <div>
          <div className="card">
            <div className="card-head">
              <h2>Registrations</h2>
              <span className="cap">
                Set an outcome and panel score for each athlete
              </span>
            </div>

            {registrations.length === 0 ? (
              <EmptyState
                icon="users"
                title="No registrations yet"
                text="Athletes book their own slot from the portal, or you can add them below."
              />
            ) : (
              <div className="card-body">
                <div className="stack">
                  {registrations.map((r) => (
                    <details key={r.id} className="note-item">
                      <summary
                        style={{ cursor: "pointer", listStyle: "none" }}
                        className="flex-between"
                      >
                        <Person
                          name={r.client?.full_name ?? "Athlete"}
                          meta={[r.client?.position, r.client?.city]
                            .filter(Boolean)
                            .join(" · ")}
                        />
                        <div className="row-gap">
                          {r.score && Object.keys(r.score).length > 0 && (
                            <span className="pill pill-blue plain">
                              {overallScore(r.score)}
                            </span>
                          )}
                          <StatusPill value={r.status} />
                        </div>
                      </summary>

                      <div style={{ marginTop: 18 }}>
                        <ActionForm
                          action={updateRegistrationAction}
                          submitLabel="Save Result"
                          hidden={{ id: r.id }}
                          footer={
                            r.client ? (
                              <Link
                                href={`/admin/clients/${r.client.id}`}
                                className="btn btn-ghost btn-sm"
                              >
                                Open Athlete
                              </Link>
                            ) : undefined
                          }
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

            {available.length > 0 && (
              <div className="card-foot">
                <details>
                  <summary
                    className="btn btn-primary btn-sm"
                    style={{ display: "inline-flex", listStyle: "none" }}
                  >
                    Add an athlete
                  </summary>
                  <div style={{ marginTop: 20 }}>
                    <ActionForm
                      action={addRegistrationAction}
                      submitLabel="Register Athlete"
                      hidden={{ trial_id: trial.id }}
                      resetOnSuccess
                    >
                      <Select
                        name="client_id"
                        label="Athlete"
                        required
                        placeholder="— pick an athlete —"
                        options={available.map((c) => ({
                          value: c.id,
                          label: `${c.full_name}${c.city ? ` · ${c.city}` : ""}`,
                        }))}
                      />
                    </ActionForm>
                  </div>
                </details>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Edit trial</h2>
          </div>
          <div className="card-body">
            <ActionForm
              action={saveTrialAction}
              submitLabel="Save Trial"
              hidden={{ id: trial.id }}
            >
              <Row>
                <Field name="city" label="City" required defaultValue={trial.city} />
                <Field name="state" label="State" defaultValue={trial.state} />
              </Row>
              <Row>
                <Field
                  name="trial_date"
                  label="Date"
                  type="date"
                  required
                  defaultValue={trial.trial_date}
                />
                <Field
                  name="trial_time"
                  label="Time"
                  defaultValue={trial.trial_time}
                />
              </Row>
              <Row>
                <Field
                  name="age_group"
                  label="Age group"
                  defaultValue={trial.age_group}
                />
                <Select
                  name="tag"
                  label="Type"
                  options={TAG_OPTIONS}
                  defaultValue={trial.tag}
                />
              </Row>
              <Row cols={3}>
                <Field
                  name="total_slots"
                  label="Total slots"
                  type="number"
                  min={0}
                  required
                  defaultValue={trial.total_slots}
                />
                <Field
                  name="slots_left"
                  label="Slots left"
                  type="number"
                  min={0}
                  defaultValue={trial.slots_left}
                />
                <Select
                  name="status"
                  label="Status"
                  options={TRIAL_STATUS_OPTIONS}
                  defaultValue={trial.status}
                />
              </Row>
              <Field name="venue" label="Venue" defaultValue={trial.venue} />
              <TextArea
                name="address"
                label="Address"
                rows={2}
                defaultValue={trial.address}
              />
              <TextArea
                name="description"
                label="Description"
                rows={2}
                defaultValue={trial.description}
              />
              <TextArea
                name="requirements"
                label="What to bring"
                rows={2}
                defaultValue={trial.requirements}
              />
              <Field
                name="sort_order"
                label="Sort order"
                type="number"
                defaultValue={trial.sort_order}
              />
              <Checkbox
                name="is_published"
                label="Publish to the athlete portal"
                defaultChecked={trial.is_published}
              />
            </ActionForm>
          </div>
        </div>
      </div>
    </>
  );
}
